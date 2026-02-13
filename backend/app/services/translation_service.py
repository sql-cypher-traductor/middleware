"""
Servicio de traducción de consultas SQL a Cypher.
Utiliza sqlglot para parsear el SQL y generar el AST.
"""

import time
from typing import Tuple

from fastapi import HTTPException, status

import sqlglot
from sqlglot import exp
from sqlglot.errors import ParseError

from ..dto.translator_dto import (
    TranslationRequestDTO,
    TranslationResponseDTO,
    StatementType,
)


class TranslationService:
    """
    Servicio para traducir consultas SQL a Cypher.
    Soporta sentencias SELECT, INSERT, UPDATE y DELETE.
    """

    # Mapeo de funciones SQL comunes a Cypher
    FUNCTION_MAP = {
        "COUNT": "count",
        "SUM": "sum",
        "AVG": "avg",
        "MIN": "min",
        "MAX": "max",
        "UPPER": "toUpper",
        "LOWER": "toLower",
        "LENGTH": "size",
        "SUBSTRING": "substring",
        "TRIM": "trim",
        "COALESCE": "coalesce",
        "NOW": "datetime",
        "GETDATE": "datetime",
        "CURRENT_TIMESTAMP": "datetime",
        "CURRENT_DATE": "date",
        "ISNULL": "coalesce",
        "LEN": "size",
        "CHARINDEX": "apoc.text.indexOf",
    }

    # Mapeo de operadores SQL a Cypher
    OPERATOR_MAP = {
        "AND": "AND",
        "OR": "OR",
        "NOT": "NOT",
        "IS NULL": "IS NULL",
        "IS NOT NULL": "IS NOT NULL",
        "LIKE": "=~",
        "IN": "IN",
        "BETWEEN": ">=",  # Se maneja especialmente
    }

    def __init__(self):
        pass

    def translate(self, request: TranslationRequestDTO) -> TranslationResponseDTO:
        """
        Traduce una consulta SQL a Cypher.

        Args:
            request: Solicitud con la consulta SQL.

        Returns:
            Respuesta con la consulta Cypher generada.

        Raises:
            HTTPException: Si hay error de sintaxis o sentencia no soportada.
        """
        from .sql_validator import validate_sql, get_sql_warnings

        start_time = time.perf_counter()

        # Validar SQL con el validador mejorado
        sql_query = request.sql.strip()
        is_valid, validation_error = validate_sql(sql_query)

        if not is_valid and validation_error:
            # Construir mensaje de error descriptivo
            error_message = validation_error.message
            if validation_error.suggestion:
                error_message += f". Sugerencia: {validation_error.suggestion}"

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_type": validation_error.error_type,
                    "message": validation_error.message,
                    "suggestion": validation_error.suggestion,
                    "position": validation_error.position,
                },
            )

        try:
            # Parsear SQL a AST usando sqlglot (con fallback a T-SQL)
            try:
                parsed = sqlglot.parse_one(sql_query)
            except ParseError:
                parsed = sqlglot.parse_one(sql_query, read="tsql")
        except ParseError as e:
            # Si llegamos aquí, el validador no detectó el error
            # Intentar dar un mensaje más descriptivo
            error_str = str(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_type": "PARSE_ERROR",
                    "message": f"Error de sintaxis SQL: {error_str}",
                    "suggestion": "Revise la sintaxis de la consulta SQL",
                },
            )

        # Detectar tipo de sentencia y traducir
        try:
            statement_type, cypher_query = self._translate_statement(parsed)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_type": "TRANSLATION_ERROR",
                    "message": f"Error durante la traducción: {str(e)}",
                    "suggestion": "Verifique que la estructura de la consulta sea válida",
                },
            )

        end_time = time.perf_counter()
        translation_time = round(end_time - start_time, 6)

        # Obtener advertencias para operaciones potencialmente peligrosas
        warnings = get_sql_warnings(sql_query)

        return TranslationResponseDTO(
            sql=sql_query,
            cypher=cypher_query,
            statement_type=statement_type,
            translation_time=translation_time,
            warnings=warnings,
        )

    def _validate_sql_basic(self, sql: str) -> None:
        """
        Validación básica de la sintaxis SQL.

        Args:
            sql: Consulta SQL a validar.

        Raises:
            HTTPException: Si la consulta está vacía o tiene problemas básicos.
        """
        if not sql:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La consulta SQL no puede estar vacía",
            )

        # Verificar que tenga al menos una palabra clave SQL válida
        sql_upper = sql.upper().strip()
        valid_starts = ("SELECT", "INSERT", "UPDATE", "DELETE")

        if not any(sql_upper.startswith(keyword) for keyword in valid_starts):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La consulta debe comenzar con SELECT, INSERT, UPDATE o DELETE",
            )

    def _translate_statement(self, parsed: exp.Expression) -> Tuple[StatementType, str]:
        """
        Traduce una sentencia SQL parseada a Cypher.

        Args:
            parsed: AST de la sentencia SQL.

        Returns:
            Tupla con el tipo de sentencia y la consulta Cypher.

        Raises:
            HTTPException: Si el tipo de sentencia no es soportado.
        """
        if isinstance(parsed, exp.Select):
            return StatementType.SELECT, self._translate_select(parsed)
        elif isinstance(parsed, exp.Insert):
            return StatementType.INSERT, self._translate_insert(parsed)
        elif isinstance(parsed, exp.Update):
            return StatementType.UPDATE, self._translate_update(parsed)
        elif isinstance(parsed, exp.Delete):
            return StatementType.DELETE, self._translate_delete(parsed)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de sentencia no soportado: {type(parsed).__name__}",
            )

    def _translate_select(self, select: exp.Select) -> str:
        """
        Traduce una sentencia SELECT a Cypher.

        Args:
            select: AST del SELECT.

        Returns:
            Consulta Cypher equivalente.
        """
        cypher_parts = []

        # Obtener tabla principal y alias
        tables = self._extract_tables(select)

        if not tables:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se encontró tabla en la cláusula FROM",
            )

        # Procesar JOINS si existen
        joins = list(select.find_all(exp.Join))

        if joins:
            # Construir MATCH con relaciones para JOINS
            match_clause = self._build_match_with_joins(tables, joins, select)
        else:
            # MATCH simple sin JOINS
            main_table = tables[0]
            alias = main_table.get("alias", main_table["name"].lower()[0])
            match_clause = f"MATCH ({alias}:{main_table['name']})"

        cypher_parts.append(match_clause)

        # Procesar WHERE
        where_clause = select.find(exp.Where)
        if where_clause:
            cypher_where = self._translate_where(where_clause, tables)
            cypher_parts.append(cypher_where)

        # Procesar GROUP BY (usa WITH en Cypher)
        group_by = select.find(exp.Group)
        if group_by:
            with_clause = self._translate_group_by(group_by, select, tables)
            cypher_parts.append(with_clause)

        # Procesar SELECT (columnas) -> RETURN
        return_clause = self._translate_select_columns(
            select, tables, group_by is not None
        )
        cypher_parts.append(return_clause)

        # Recopilar aliases del SELECT para usar en ORDER BY
        select_aliases = set()
        for expr in select.expressions:
            if isinstance(expr, exp.Alias):
                select_aliases.add(expr.alias)

        # Procesar ORDER BY
        order_by = select.find(exp.Order)
        if order_by:
            order_clause = self._translate_order_by(order_by, tables, select_aliases)
            cypher_parts.append(order_clause)

        # Procesar LIMIT y OFFSET
        limit = select.find(exp.Limit)
        if limit:
            cypher_parts.append(f"LIMIT {limit.expression.this}")

        offset = select.find(exp.Offset)
        if offset:
            cypher_parts.append(f"SKIP {offset.expression.this}")

        return "\n".join(cypher_parts)

    def _extract_tables(self, select: exp.Select) -> list:
        """
        Extrae información de las tablas del SELECT.

        Args:
            select: AST del SELECT.

        Returns:
            Lista de diccionarios con información de tablas.
        """
        tables = []

        # Tabla principal del FROM
        from_clause = select.find(exp.From)
        if from_clause:
            for table in from_clause.find_all(exp.Table):
                table_info = {
                    "name": table.name,
                    "alias": table.alias if table.alias else table.name.lower()[0],
                }
                tables.append(table_info)

        # Tablas de JOINS
        for join in select.find_all(exp.Join):
            table = join.find(exp.Table)
            if table:
                table_info = {
                    "name": table.name,
                    "alias": table.alias if table.alias else table.name.lower()[0],
                }
                tables.append(table_info)

        return tables

    def _build_match_with_joins(
        self, tables: list, joins: list, select: exp.Select
    ) -> str:
        """
        Construye la cláusula MATCH con relaciones para JOINS.

        Args:
            tables: Lista de tablas.
            joins: Lista de JOINS.
            select: AST del SELECT.

        Returns:
            Cláusula MATCH con relaciones.
        """
        if not tables:
            return ""

        main_table = tables[0]
        main_alias = main_table.get("alias", main_table["name"].lower()[0])
        match_parts = [f"({main_alias}:{main_table['name']})"]

        for join in joins:
            join_table = join.find(exp.Table)
            if not join_table:
                continue

            join_table_name = join_table.name
            join_alias = (
                join_table.alias if join_table.alias else join_table_name.lower()[0]
            )

            # Intentar inferir el nombre de la relación desde la condición ON
            relation_name = self._infer_relation_name(
                join, main_table["name"], join_table_name
            )

            # Determinar dirección de la relación
            # Por defecto asumimos que la tabla principal apunta a la tabla del JOIN
            match_parts.append(f"-[:{relation_name}]->({join_alias}:{join_table_name})")

            # Actualizar main_alias para encadenar JOINS
            main_alias = join_alias

        return "MATCH " + "".join(match_parts)

    def _infer_relation_name(
        self, join: exp.Join, from_table: str, to_table: str
    ) -> str:
        """
        Intenta inferir el nombre de la relación desde la condición ON.

        Args:
            join: AST del JOIN.
            from_table: Nombre de la tabla origen.
            to_table: Nombre de la tabla destino.

        Returns:
            Nombre de la relación inferido o genérico.
        """
        # Buscar la condición ON
        on_clause = join.find(exp.EQ)
        if on_clause:
            # Intentar extraer pistas del nombre de la columna
            left = on_clause.left
            right = on_clause.right

            # Buscar patrones comunes como "user_id", "customer_id", etc.
            for col in [left, right]:
                if isinstance(col, exp.Column):
                    col_name = col.name.upper()
                    if col_name.endswith("_ID"):
                        # Extraer el nombre base (ej: "user_id" -> "HAS_USER")
                        base_name = col_name[:-3]  # Quitar "_ID"
                        return f"HAS_{base_name}"

        # Relación genérica si no podemos inferir
        return "RELATED_TO"

    def _translate_where(self, where: exp.Where, tables: list) -> str:
        """
        Traduce la cláusula WHERE a Cypher.

        Args:
            where: AST del WHERE.
            tables: Lista de tablas para resolver alias.

        Returns:
            Cláusula WHERE en Cypher.
        """
        condition = self._translate_expression(where.this, tables)
        return f"WHERE {condition}"

    def _translate_expression(self, expr: exp.Expression, tables: list) -> str:
        """
        Traduce una expresión SQL a Cypher.

        Args:
            expr: Expresión a traducir.
            tables: Lista de tablas para resolver alias.

        Returns:
            Expresión en Cypher.
        """
        if isinstance(expr, exp.And):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"({left} AND {right})"

        elif isinstance(expr, exp.Or):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"({left} OR {right})"

        elif isinstance(expr, exp.Not):
            inner = self._translate_expression(expr.this, tables)
            return f"NOT ({inner})"

        elif isinstance(expr, exp.EQ):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} = {right}"

        elif isinstance(expr, exp.NEQ):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} <> {right}"

        elif isinstance(expr, exp.GT):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} > {right}"

        elif isinstance(expr, exp.GTE):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} >= {right}"

        elif isinstance(expr, exp.LT):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} < {right}"

        elif isinstance(expr, exp.LTE):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} <= {right}"

        elif isinstance(expr, exp.Mul):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} * {right}"

        elif isinstance(expr, exp.Add):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} + {right}"

        elif isinstance(expr, exp.Sub):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} - {right}"

        elif isinstance(expr, exp.Div):
            left = self._translate_expression(expr.left, tables)
            right = self._translate_expression(expr.right, tables)
            return f"{left} / {right}"

        elif isinstance(expr, exp.Neg):
            inner = self._translate_expression(expr.this, tables)
            return f"-{inner}"

        elif isinstance(expr, exp.Like):
            left = self._translate_expression(expr.this, tables)
            pattern = self._translate_expression(expr.expression, tables)
            # Convertir patrón SQL LIKE a regex de Cypher
            cypher_pattern = self._convert_like_to_regex(pattern)
            return f"{left} =~ {cypher_pattern}"

        elif isinstance(expr, exp.In):
            left = self._translate_expression(expr.this, tables)
            values = [self._translate_expression(v, tables) for v in expr.expressions]
            return f"{left} IN [{', '.join(values)}]"

        elif isinstance(expr, exp.Between):
            expr_val = self._translate_expression(expr.this, tables)
            low = self._translate_expression(expr.args.get("low"), tables)
            high = self._translate_expression(expr.args.get("high"), tables)
            return f"({expr_val} >= {low} AND {expr_val} <= {high})"

        elif isinstance(expr, exp.Is):
            left = self._translate_expression(expr.this, tables)
            if isinstance(expr.expression, exp.Null):
                return f"{left} IS NULL"
            return f"{left} IS NOT NULL"

        elif isinstance(expr, exp.Column):
            return self._translate_column(expr, tables)

        elif isinstance(expr, exp.Literal):
            return self._translate_literal(expr)

        elif isinstance(expr, exp.Func):
            return self._translate_function(expr, tables)

        elif isinstance(expr, exp.Paren):
            inner = self._translate_expression(expr.this, tables)
            return f"({inner})"

        elif isinstance(expr, exp.Null):
            return "null"

        else:
            # Fallback: usar representación string
            return str(expr)

    def _translate_column(self, col: exp.Column, tables: list) -> str:
        """
        Traduce una referencia de columna a Cypher.

        Args:
            col: Columna a traducir.
            tables: Lista de tablas para resolver alias.

        Returns:
            Referencia de columna en Cypher.
        """
        table_alias = col.table if col.table else ""

        if table_alias:
            # Usar el alias de la tabla directamente
            return f"{table_alias}.{col.name}"
        elif tables:
            # Si no hay alias, usar el primero que se encuentre disponible
            default_alias = tables[0].get("alias", tables[0]["name"].lower()[0])
            return f"{default_alias}.{col.name}"
        else:
            return col.name

    def _translate_literal(self, lit: exp.Literal) -> str:
        """
        Traduce un literal SQL a Cipher.

        Args:
            lit: Literal a traducir.

        Returns:
            Literal en formato Cipher.
        """
        if lit.is_string:
            # Strings van entre comillas simples en Cypher
            value = lit.this.replace("'", "\\'")
            return f"'{value}'"
        else:
            return str(lit.this)

    def _translate_function(self, func: exp.Func, tables: list) -> str:
        """
        Traduce una función SQL a Cypher.

        Args:
            func: Función a traducir.
            tables: Lista de tablas.

        Returns:
            Función en Cypher.
        """
        # Determinar el nombre de la función
        func_type_name = type(func).__name__.upper()
        func_name = (
            func.name.upper() if hasattr(func, "name") and func.name else func_type_name
        )

        # Mapear nombre de función
        cypher_func = self.FUNCTION_MAP.get(func_name, func_name.lower())

        # Manejar COUNT especialmente (puede ser exp.Count)
        if func_name == "COUNT" or func_type_name == "COUNT":
            if hasattr(func, "this"):
                if isinstance(func.this, exp.Star):
                    return "count(*)"
                arg = self._translate_expression(func.this, tables)
                return f"count({arg})"
            return "count(*)"

        # Manejar SUM, AVG, MIN, MAX
        if func_type_name in ("SUM", "AVG", "MIN", "MAX"):
            if hasattr(func, "this") and func.this:
                arg = self._translate_expression(func.this, tables)
                return f"{func_type_name.lower()}({arg})"

        # Traducir argumentos
        args = []
        if hasattr(func, "expressions") and func.expressions:
            args = [self._translate_expression(arg, tables) for arg in func.expressions]
        elif hasattr(func, "this") and func.this:
            args = [self._translate_expression(func.this, tables)]

        return f"{cypher_func}({', '.join(args)})"

    def _translate_select_columns(
        self, select: exp.Select, tables: list, has_group_by: bool
    ) -> str:
        """
        Traduce las columnas del SELECT a RETURN.

        Args:
            select: AST del SELECT.
            tables: Lista de tablas.
            has_group_by: Si tiene GROUP BY.

        Returns:
            Cláusula RETURN.
        """
        columns = []

        for expr in select.expressions:
            if isinstance(expr, exp.Star):
                # SELECT * -> retornar todos los nodos
                if tables:
                    columns.append(tables[0].get("alias", tables[0]["name"].lower()[0]))
                else:
                    columns.append("*")
            elif isinstance(expr, exp.Alias):
                if has_group_by:
                    # Con GROUP BY, usar solo el alias (ya definido en WITH)
                    columns.append(expr.alias)
                else:
                    inner = self._translate_expression(expr.this, tables)
                    alias = expr.alias
                    columns.append(f"{inner} AS {alias}")
            else:
                if has_group_by and isinstance(expr, exp.Column):
                    # Con GROUP BY, usar nombre de columna directamente (definido en WITH)
                    columns.append(expr.name)
                else:
                    columns.append(self._translate_expression(expr, tables))

        return f"RETURN {', '.join(columns)}"

    def _translate_group_by(
        self, group_by: exp.Group, select: exp.Select, tables: list
    ) -> str:
        """
        Traduce GROUP BY a WITH en Cypher.
        Incluye columnas de agrupación y funciones agregadas del SELECT.
        Maneja HAVING como WHERE después de WITH.

        Args:
            group_by: AST del GROUP BY.
            select: AST del SELECT completo.
            tables: Lista de tablas.

        Returns:
            Cláusula WITH para agrupación (y WHERE de HAVING si existe).
        """
        with_parts = []
        agg_alias_map = {}  # Mapea expresión agregada traducida -> alias

        # Columnas de GROUP BY
        for expr in group_by.expressions:
            translated = self._translate_expression(expr, tables)
            if isinstance(expr, exp.Column):
                alias = expr.name
            else:
                alias = translated.replace(".", "_")
            with_parts.append(f"{translated} AS {alias}")

        # Funciones agregadas del SELECT
        for select_expr in select.expressions:
            actual_expr = select_expr
            alias_name = None

            if isinstance(select_expr, exp.Alias):
                actual_expr = select_expr.this
                alias_name = select_expr.alias

            if isinstance(actual_expr, (exp.Count, exp.Sum, exp.Avg, exp.Min, exp.Max)):
                func_str = self._translate_expression(actual_expr, tables)
                if alias_name:
                    with_parts.append(f"{func_str} AS {alias_name}")
                    agg_alias_map[func_str] = alias_name
                else:
                    auto_alias = f"agg_{len(agg_alias_map)}"
                    with_parts.append(f"{func_str} AS {auto_alias}")
                    agg_alias_map[func_str] = auto_alias

        result = f"WITH {', '.join(with_parts)}"

        # HAVING → WHERE después de WITH
        having = select.find(exp.Having)
        if having:
            having_str = self._translate_expression(having.this, tables)
            # Reemplazar expresiones de agregación por sus aliases
            for agg_expr, alias in agg_alias_map.items():
                having_str = having_str.replace(agg_expr, alias)
            result += f"\nWHERE {having_str}"

        return result

    def _translate_order_by(
        self, order_by: exp.Order, tables: list, select_aliases: set = None
    ) -> str:
        """
        Traduce ORDER BY a Cypher.

        Args:
            order_by: AST del ORDER BY.
            tables: Lista de tablas.
            select_aliases: Aliases definidos en el SELECT (para no prefixar con tabla).

        Returns:
            Cláusula ORDER BY en Cypher.
        """
        order_parts = []
        if select_aliases is None:
            select_aliases = set()

        for ordered in order_by.expressions:
            # Si la columna es un alias del SELECT, usarlo directamente
            if (
                isinstance(ordered.this, exp.Column)
                and ordered.this.name in select_aliases
            ):
                col = ordered.this.name
            else:
                col = self._translate_expression(ordered.this, tables)
            direction = "DESC" if ordered.args.get("desc") else "ASC"
            order_parts.append(f"{col} {direction}")

        return f"ORDER BY {', '.join(order_parts)}"

    def _convert_like_to_regex(self, pattern: str) -> str:
        """
        Convierte un patrón LIKE de SQL a regex de Cypher.

        Args:
            pattern: Patrón LIKE (ej: '%valor%').

        Returns:
            Patrón regex para Cypher.
        """
        # Remover comillas si las tiene
        pattern = pattern.strip("'")

        # Convertir % a .* y _ a .
        regex = pattern.replace("%", ".*").replace("_", ".")

        # Agregar anclas si no hay wildcards al inicio/final
        if not regex.startswith(".*"):
            regex = "^" + regex
        if not regex.endswith(".*"):
            regex = regex + "$"

        return f"'(?i){regex}'"

    def _translate_insert(self, insert: exp.Insert) -> str:
        """
        Traduce una sentencia INSERT a Cypher.

        Args:
            insert: AST del INSERT.

        Returns:
            Consulta Cypher CREATE equivalente.
        """
        # Obtener tabla - puede ser un Schema que contiene la tabla
        table_expr = insert.this

        if isinstance(table_expr, exp.Schema):
            # El schema contiene la tabla y las columnas
            table = table_expr.this
            table_name = table.name if isinstance(table, exp.Table) else str(table)
            # Las columnas están en schema.expressions
            columns = [
                str(col.name) if hasattr(col, "name") else str(col)
                for col in table_expr.expressions
            ]
        elif isinstance(table_expr, exp.Table):
            table_name = table_expr.name
            columns = []
        else:
            table_name = str(table_expr).split()[0]  # Tomar solo el nombre
            columns = []

        alias = table_name.lower()[0]

        # Extraer valores
        values = []
        values_expr = insert.find(exp.Values)
        if values_expr:
            for tuple_expr in values_expr.find_all(exp.Tuple):
                values = [
                    self._translate_literal(v) if isinstance(v, exp.Literal) else str(v)
                    for v in tuple_expr.expressions
                ]
                break  # Solo primer set de valores

        # Construir propiedades
        if columns and values:
            props = ", ".join([f"{col}: {val}" for col, val in zip(columns, values)])
        elif values:
            # Sin columnas especificadas, usar índices
            props = ", ".join([f"prop{i}: {val}" for i, val in enumerate(values)])
        else:
            props = ""

        return f"CREATE ({alias}:{table_name} {{{props}}})\nRETURN {alias}"

    def _translate_update(self, update: exp.Update) -> str:
        """
        Traduce una sentencia UPDATE a Cypher.

        Args:
            update: AST del UPDATE.

        Returns:
            Consulta Cypher MATCH...SET equivalente.
        """
        # Obtener tabla
        table = update.this
        if isinstance(table, exp.Table):
            table_name = table.name
            alias = table.alias if table.alias else table_name.lower()[0]
        else:
            table_name = str(table)
            alias = table_name.lower()[0]

        tables = [{"name": table_name, "alias": alias}]

        # MATCH
        cypher_parts = [f"MATCH ({alias}:{table_name})"]

        # WHERE
        where = update.find(exp.Where)
        if where:
            cypher_parts.append(self._translate_where(where, tables))

        # SET - las expresiones están directamente en update.expressions
        if hasattr(update, "expressions") and update.expressions:
            set_parts = []
            for eq in update.expressions:
                if isinstance(eq, exp.EQ):
                    col = self._translate_expression(eq.left, tables)
                    val = self._translate_expression(eq.right, tables)
                    set_parts.append(f"{col} = {val}")

            if set_parts:
                cypher_parts.append(f"SET {', '.join(set_parts)}")

        cypher_parts.append(f"RETURN {alias}")

        return "\n".join(cypher_parts)

    def _translate_delete(self, delete: exp.Delete) -> str:
        """
        Traduce una sentencia DELETE a Cypher.

        Args:
            delete: AST del DELETE.

        Returns:
            Consulta Cypher MATCH...DELETE equivalente.
        """
        # Obtener tabla
        table = delete.this
        if isinstance(table, exp.Table):
            table_name = table.name
            alias = table.alias if table.alias else table_name.lower()[0]
        else:
            table_name = str(table)
            alias = table_name.lower()[0]

        tables = [{"name": table_name, "alias": alias}]

        # MATCH
        cypher_parts = [f"MATCH ({alias}:{table_name})"]

        # WHERE
        where = delete.find(exp.Where)
        if where:
            cypher_parts.append(self._translate_where(where, tables))

        # DETACH DELETE para eliminar nodo y sus relaciones
        cypher_parts.append(f"DETACH DELETE {alias}")

        return "\n".join(cypher_parts)

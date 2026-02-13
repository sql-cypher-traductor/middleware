"""
Validador de sentencias SQL.
Proporciona mensajes de error descriptivos para diferentes tipos de errores.
"""

import re
from typing import Optional, Tuple
from dataclasses import dataclass

import sqlglot
from sqlglot import exp
from sqlglot.errors import ParseError


@dataclass
class SQLValidationError:
    """Representa un error de validación SQL."""

    error_type: str
    message: str
    suggestion: Optional[str] = None
    position: Optional[int] = None
    line: Optional[int] = None


class SQLValidator:
    """
    Validador de sentencias SQL con mensajes de error descriptivos.
    """

    # Patrones comunes de errores sintácticos
    SYNTAX_PATTERNS = [
        # Paréntesis desbalanceados
        (r".*\((?:[^()]*\([^()]*\))*[^()]*$", "Falta un paréntesis de cierre ')'"),
        (r"^[^(]*\).*", "Paréntesis de cierre ')' sin su correspondiente apertura '('"),
        # Comillas desbalanceadas
        (r"^[^']*'[^']*$", "Falta cerrar la comilla simple (')"),
        (r'^[^"]*"[^"]*$', 'Falta cerrar las comillas dobles (")'),
        # Corchetes desbalanceados
        (r".*\[[^\]]*$", "Falta un corchete de cierre ']'"),
    ]

    # Palabras clave requeridas por tipo de sentencia
    REQUIRED_KEYWORDS = {
        "SELECT": ["FROM"],
        "INSERT": ["INTO", "VALUES"],
        "UPDATE": ["SET"],
        "DELETE": ["FROM"],
    }

    def validate(self, sql: str) -> Tuple[bool, Optional[SQLValidationError]]:
        """
        Valida una sentencia SQL y retorna errores descriptivos.

        Args:
            sql: Consulta SQL a validar.

        Returns:
            Tupla (es_valido, error)
        """
        if not sql or not sql.strip():
            return False, SQLValidationError(
                error_type="EMPTY_QUERY",
                message="La consulta SQL está vacía",
                suggestion="Ingrese una consulta SQL válida (SELECT, INSERT, UPDATE o DELETE)",
            )

        sql = sql.strip()
        sql_upper = sql.upper()

        # 1. Validar que comience con una sentencia válida
        valid_starts = ("SELECT", "INSERT", "UPDATE", "DELETE")
        statement_type = None
        for stmt in valid_starts:
            if sql_upper.startswith(stmt):
                statement_type = stmt
                break

        if not statement_type:
            return False, SQLValidationError(
                error_type="INVALID_STATEMENT",
                message="Tipo de sentencia no reconocido",
                suggestion=f"La consulta debe comenzar con: {', '.join(valid_starts)}",
            )

        # 2. Validar caracteres balanceados
        balance_error = self._check_balanced_characters(sql)
        if balance_error:
            return False, balance_error

        # 3. Validar palabras clave requeridas
        keyword_error = self._check_required_keywords(sql_upper, statement_type)
        if keyword_error:
            return False, keyword_error

        # 4. Intentar parsear con sqlglot para detectar errores de sintaxis
        parse_error = self._try_parse(sql)
        if parse_error:
            return False, parse_error

        # 5. Validaciones semánticas post-parseo
        try:
            # Intentar parseo estándar, con fallback a T-SQL
            try:
                parsed = sqlglot.parse_one(sql)
            except ParseError:
                parsed = sqlglot.parse_one(sql, read="tsql")
            semantic_error = self._validate_semantics(parsed, statement_type)
            if semantic_error:
                return False, semantic_error
        except Exception:
            pass  # Ya se manejó en _try_parse

        return True, None

    def _check_balanced_characters(self, sql: str) -> Optional[SQLValidationError]:
        """Verifica que los caracteres de agrupación estén balanceados."""

        # Contar paréntesis
        open_parens = sql.count("(")
        close_parens = sql.count(")")
        if open_parens > close_parens:
            return SQLValidationError(
                error_type="UNBALANCED_PARENTHESES",
                message=f"Faltan {open_parens - close_parens} paréntesis de cierre ')'",
                suggestion="Verifique que cada '(' tenga su correspondiente ')'",
            )
        elif close_parens > open_parens:
            return SQLValidationError(
                error_type="UNBALANCED_PARENTHESES",
                message=f"Hay {close_parens - open_parens} paréntesis de cierre ')' de más",
                suggestion="Elimine los paréntesis extra o agregue los de apertura faltantes",
            )

        # Contar corchetes
        open_brackets = sql.count("[")
        close_brackets = sql.count("]")
        if open_brackets != close_brackets:
            return SQLValidationError(
                error_type="UNBALANCED_BRACKETS",
                message="Los corchetes no están balanceados",
                suggestion="Verifique que cada '[' tenga su correspondiente ']'",
            )

        # Contar comillas simples (excluyendo escapadas)
        single_quotes = len(re.findall(r"(?<!')'(?!')", sql))
        if single_quotes % 2 != 0:
            return SQLValidationError(
                error_type="UNBALANCED_QUOTES",
                message="Las comillas simples no están balanceadas",
                suggestion="Verifique que cada comilla simple tenga su par de cierre",
            )

        return None

    def _check_required_keywords(
        self, sql_upper: str, statement_type: str
    ) -> Optional[SQLValidationError]:
        """Verifica que las palabras clave requeridas estén presentes."""

        required = self.REQUIRED_KEYWORDS.get(statement_type, [])

        for keyword in required:
            # Buscar la palabra clave como palabra completa
            pattern = rf"\b{keyword}\b"
            if not re.search(pattern, sql_upper):
                suggestions = {
                    "FROM": "Agregue 'FROM nombre_tabla' después de las columnas",
                    "INTO": "Use 'INSERT INTO nombre_tabla'",
                    "VALUES": "Agregue 'VALUES (valor1, valor2, ...)' con los valores a insertar",
                    "SET": "Agregue 'SET columna = valor' para especificar qué actualizar",
                }
                return SQLValidationError(
                    error_type="MISSING_KEYWORD",
                    message=f"Falta la palabra clave obligatoria '{keyword}' en la sentencia {statement_type}",
                    suggestion=suggestions.get(
                        keyword, f"Agregue '{keyword}' a la consulta"
                    ),
                )

        return None

    def _try_parse(self, sql: str) -> Optional[SQLValidationError]:
        """Intenta parsear el SQL y captura errores descriptivos."""

        try:
            sqlglot.parse_one(sql)
            return None
        except ParseError:
            # Intentar con dialecto T-SQL para sintaxis como [Order Details]
            try:
                sqlglot.parse_one(sql, read="tsql")
                return None
            except ParseError as e:
                error_msg = str(e)
                # Analizar el mensaje de error para hacerlo más descriptivo
                return self._interpret_parse_error(error_msg, sql)

    def _interpret_parse_error(self, error_msg: str, sql: str) -> SQLValidationError:
        """Interpreta errores de parseo y genera mensajes amigables."""

        error_lower = error_msg.lower()

        # Limpiar el mensaje de tokens internos
        clean_msg = re.sub(
            r"<Token token_type: TokenType\.\w+, text: ([^>]+)>", r"'\1'", error_msg
        )
        clean_msg = re.sub(r"<Token token_type: TokenType[^>]*>", "", clean_msg).strip()

        # Errores de tokens esperados
        if "expected" in error_lower:
            # Extraer qué se esperaba
            match = re.search(r"expected\s+(.+?)(?:\.|$)", clean_msg, re.IGNORECASE)
            if match:
                expected = match.group(1).strip()
                return SQLValidationError(
                    error_type="SYNTAX_ERROR",
                    message=f"Error de sintaxis: Se esperaba {expected}",
                    suggestion=self._get_suggestion_for_expected(expected, sql),
                )

        # Error de token inesperado
        if "unexpected" in error_lower:
            match = re.search(r"unexpected\s+(.+?)(?:\.|$)", error_msg, re.IGNORECASE)
            if match:
                unexpected = match.group(1).strip()
                return SQLValidationError(
                    error_type="UNEXPECTED_TOKEN",
                    message=f"Token inesperado: {unexpected}",
                    suggestion="Verifique la sintaxis de la consulta cerca de este elemento",
                )

        # Error de columna/tabla no encontrada
        if "column" in error_lower and "not found" in error_lower:
            return SQLValidationError(
                error_type="COLUMN_NOT_FOUND",
                message="Columna no encontrada en la consulta",
                suggestion="Verifique el nombre de la columna y que esté bien escrito",
            )

        # Error genérico de parseo
        # Limpiar el mensaje de error para hacerlo más legible
        clean_msg = re.sub(r"\s+", " ", error_msg).strip()

        # Buscar información de posición
        position_match = re.search(r"at position (\d+)", error_msg)
        position = int(position_match.group(1)) if position_match else None

        # Intentar identificar el contexto del error
        context = ""
        if position and position < len(sql):
            start = max(0, position - 20)
            end = min(len(sql), position + 20)
            context = f"...{sql[start:end]}..."

        return SQLValidationError(
            error_type="PARSE_ERROR",
            message=f"Error de sintaxis SQL: {clean_msg}",
            suggestion=(
                f"Revise la sintaxis cerca de: {context}"
                if context
                else "Revise la sintaxis de la consulta"
            ),
            position=position,
        )

    def _get_suggestion_for_expected(self, expected: str, sql: str) -> str:
        """Genera sugerencias específicas basadas en lo que se esperaba."""

        expected_lower = expected.lower()

        suggestions = {
            "from": "Agregue 'FROM nombre_tabla' después de la lista de columnas",
            "where": "Si desea filtrar resultados, agregue 'WHERE condición'",
            "set": "En UPDATE, use 'SET columna = valor' para especificar los cambios",
            "values": "En INSERT, agregue 'VALUES (valor1, valor2, ...)' con los datos",
            ",": "Puede faltar una coma entre elementos de la lista",
            ")": "Falta un paréntesis de cierre",
            "(": "Falta un paréntesis de apertura",
            "into": "Use 'INSERT INTO nombre_tabla' para especificar la tabla destino",
            "expression": "Se esperaba un valor o expresión válida",
            "identifier": "Se esperaba un nombre de tabla, columna o alias",
            "and": "Use AND para combinar condiciones",
            "or": "Use OR para condiciones alternativas",
        }

        for key, suggestion in suggestions.items():
            if key in expected_lower:
                return suggestion

        return f"Verifique que la sintaxis sea correcta. Se esperaba: {expected}"

    def _validate_semantics(
        self, parsed: exp.Expression, statement_type: str
    ) -> Optional[SQLValidationError]:
        """Realiza validaciones semánticas en el AST parseado."""

        if statement_type == "SELECT":
            return self._validate_select_semantics(parsed)
        elif statement_type == "INSERT":
            return self._validate_insert_semantics(parsed)
        elif statement_type == "UPDATE":
            return self._validate_update_semantics(parsed)
        elif statement_type == "DELETE":
            return self._validate_delete_semantics(parsed)

        return None

    def _validate_select_semantics(
        self, select: exp.Expression
    ) -> Optional[SQLValidationError]:
        """Valida semántica de SELECT."""

        if not isinstance(select, exp.Select):
            return None

        # Verificar FROM
        from_clause = select.find(exp.From)
        if not from_clause:
            return SQLValidationError(
                error_type="MISSING_FROM",
                message="La sentencia SELECT requiere una cláusula FROM",
                suggestion="Agregue 'FROM nombre_tabla' para especificar de dónde obtener los datos",
            )

        # Verificar HAVING sin GROUP BY
        having = select.find(exp.Having)
        group_by = select.find(exp.Group)
        if having and not group_by:
            return SQLValidationError(
                error_type="HAVING_WITHOUT_GROUP_BY",
                message="HAVING requiere una cláusula GROUP BY",
                suggestion="Agregue 'GROUP BY columna' antes de HAVING, o use WHERE para filtrar filas individuales",
            )

        # Verificar columnas con funciones agregadas sin GROUP BY
        columns = list(select.find_all(exp.Column))
        agg_functions = list(
            select.find_all((exp.Count, exp.Sum, exp.Avg, exp.Min, exp.Max))
        )

        if agg_functions and columns and not group_by:
            # Hay funciones agregadas y columnas regulares sin GROUP BY
            regular_columns = []
            for col in columns:
                # Verificar si la columna está dentro de una función agregada
                parent = col.parent
                is_in_aggregate = False
                while parent:
                    if isinstance(
                        parent, (exp.Count, exp.Sum, exp.Avg, exp.Min, exp.Max)
                    ):
                        is_in_aggregate = True
                        break
                    parent = parent.parent
                if not is_in_aggregate:
                    regular_columns.append(col.name)

            if regular_columns:
                return SQLValidationError(
                    error_type="AGGREGATE_WITHOUT_GROUP_BY",
                    message=f"Columnas '{', '.join(regular_columns[:3])}' usadas con funciones agregadas sin GROUP BY",
                    suggestion=f"Agregue 'GROUP BY {', '.join(regular_columns[:3])}' o quite las columnas del SELECT",
                )

        return None

    def _validate_insert_semantics(
        self, insert: exp.Expression
    ) -> Optional[SQLValidationError]:
        """Valida semántica de INSERT."""

        if not isinstance(insert, exp.Insert):
            return None

        # Verificar que tenga tabla destino
        table = insert.find(exp.Table)
        if not table:
            return SQLValidationError(
                error_type="MISSING_TABLE",
                message="INSERT requiere una tabla destino",
                suggestion="Use 'INSERT INTO nombre_tabla' para especificar dónde insertar",
            )

        # Verificar columnas vs valores usando Schema node
        schema = insert.this
        col_count = 0
        if isinstance(schema, exp.Schema):
            col_count = len(schema.expressions)

        if col_count > 0:
            values_node = insert.find(exp.Values)
            if values_node:
                first_tuple = values_node.find(exp.Tuple)
                if first_tuple:
                    value_count = len(list(first_tuple.expressions))
                    if col_count != value_count:
                        return SQLValidationError(
                            error_type="COLUMN_VALUE_MISMATCH",
                            message=f"El número de columnas ({col_count}) no coincide con el número de valores ({value_count})",
                            suggestion=f"Asegúrese de tener exactamente {col_count} valores para las {col_count} columnas especificadas",
                        )

        return None

    def _validate_update_semantics(
        self, update: exp.Expression
    ) -> Optional[SQLValidationError]:
        """Valida semántica de UPDATE."""

        if not isinstance(update, exp.Update):
            return None

        # Verificar SET
        set_clause = update.find(exp.Set)
        if not set_clause:
            # También buscar EQ directamente (asignaciones)
            eqs = list(update.find_all(exp.EQ))
            if not eqs:
                return SQLValidationError(
                    error_type="MISSING_SET",
                    message="UPDATE requiere una cláusula SET",
                    suggestion="Agregue 'SET columna = valor' para especificar qué actualizar",
                )

        # UPDATE sin WHERE es válido sintácticamente (advertencia manejada como warning)
        return None

    def _validate_delete_semantics(
        self, delete: exp.Expression
    ) -> Optional[SQLValidationError]:
        """Valida semántica de DELETE."""

        if not isinstance(delete, exp.Delete):
            return None

        # Verificar tabla
        table = delete.find(exp.Table)
        if not table:
            return SQLValidationError(
                error_type="MISSING_TABLE",
                message="DELETE requiere especificar una tabla",
                suggestion="Use 'DELETE FROM nombre_tabla' para especificar de dónde eliminar",
            )

        # DELETE sin WHERE es válido sintácticamente (advertencia manejada como warning)
        return None


# Instancia singleton del validador
sql_validator = SQLValidator()


def validate_sql(sql: str) -> Tuple[bool, Optional[SQLValidationError]]:
    """
    Función de conveniencia para validar SQL.

    Args:
        sql: Consulta SQL a validar.

    Returns:
        Tupla (es_valido, error)
    """
    return sql_validator.validate(sql)


def get_sql_warnings(sql: str) -> list:
    """
    Obtiene advertencias para SQL válido pero potencialmente peligroso.

    Args:
        sql: Consulta SQL a analizar.

    Returns:
        Lista de advertencias (strings).
    """
    warnings = []
    sql_upper = sql.upper().strip()

    # UPDATE sin WHERE
    if sql_upper.startswith("UPDATE") and re.search(r"\bSET\b", sql_upper):
        if not re.search(r"\bWHERE\b", sql_upper):
            warnings.append("UPDATE sin WHERE actualizará TODAS las filas de la tabla")

    # DELETE sin WHERE
    if sql_upper.startswith("DELETE") and re.search(r"\bFROM\b", sql_upper):
        if not re.search(r"\bWHERE\b", sql_upper):
            warnings.append("DELETE sin WHERE eliminará TODAS las filas de la tabla")

    return warnings

import sqlglot
from sqlglot import exp


class SQLToCypherTranslator:
    """
    Clase encargada de la traducción SQL a Cypher utilizando AST.
    """

    def __init__(self):
        pass

    def translate(self, sql: str, dialect: str = "tsql") -> str:
        """
        Convierte SQL a Cypher usando análisis AST. Las consultas Cypher tienen la siguientes estructura:
        Leer Grafos = MATCH (n:Tabla) [WHERE n.prop = valor] RETURN n.prop1, n.prop2
        """

        try:
            # 1. Parsear el SQL a un AST
            expression = sqlglot.parse_one(sql, read=dialect)

            # 2. Construir las partes de Cypher de acuerdo a la estructura
            # Operación READ: MATCH ... [WHERE ...] RETURN ...
            match_clause = self._build_match(expression)
            where_clause = self._build_where(expression)
            return_clause = self._build_return(expression)

            # 3. Integrar cláusulas en una consulta Cypher completa
            full_query = f"{match_clause} {where_clause} {return_clause}"

            # Normalización de espacios
            return " ".join(full_query.split())

        except Exception as e:
            raise ValueError(f"Error en el motor de traducción: {str(e)}")

    def _build_match(self, expression) -> str:
        """
        Construye la cláusula MATCH (n:Tabla)
        """
        tables = list(expression.find_all(exp.Table))
        if not tables:
            raise ValueError(
                "Error de Sintaxis: No se encontró ninguna tabla en la consulta ingresada."
            )

        # TODO: Implementar mejoras para manejar JOINs múltiples
        main_table = tables[0].name
        alias = tables[0].alias or "n"

        if alias == main_table:
            alias = "n"

        return f"MATCH ({alias}:{main_table})"

    def _build_return(self, expression) -> str:
        """
        Construye la cláusula RETURN n.prop1, n.prop2
        """
        selects = []

        for select in expression.find_all(exp.Select):
            for projection in select.expressions:
                if isinstance(projection, exp.Star):
                    selects.append("n")
                else:
                    col_name = projection.alias_or_name
                    # TODO: Mejorar lógica de alias para JOINS
                    if "." in str(projection):
                        selects.append(str(projection))
                    else:
                        selects.append(f"n.{col_name}")

        if not selects:
            return "RETURN n"

        return "RETURN " + ", ".join(selects)

    def _build_where(self, expression) -> str:
        """
        Construye la cláusula WHERE n.prop = valor
        """
        where = expression.find(exp.Where)
        if not where:
            return ""

        condition = where.sql()
        condition = condition.replace("WHERE", "").strip()

        return f"WHERE {condition}"

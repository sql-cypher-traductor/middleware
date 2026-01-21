from sqlglot import exp
from .base import BaseHandler
from ..exceptions import TranslationError


class SelectHandler(BaseHandler):
    """
    Se encarga de la construcción de consultas Cypher a partir de la sentencia SQL SELECT.
    """

    def handle(self, expression: exp.Select) -> str:
        # Estructura base de una consulta Cypher para lectura de datos
        match_clause = self._build_match_and_joins(expression)
        where_clause = self.build_where(expression)
        return_clause = self._build_return(expression)

        # Implementación de estructura para ORDER BY y LIMIT
        order_clause = self._build_order_by(expression)
        limit_clause = self._build_limit(expression)

        # Integración de todas las cláusulas
        parts = [match_clause, where_clause, return_clause, order_clause, limit_clause]
        return " ".join([p for p in parts if p]).strip()

    def _build_match_and_joins(self, expression: exp.Select) -> str:
        # Construcción de la cláusula MATCH a partir de la sentencia SELECT y JOINS identificados.
        from_node = expression.find(exp.From)
        if not from_node:
            raise TranslationError("SELECT requiere una cláusula FROM.")

        # Obtención de la tabla principal
        main_table_exp = from_node.expressions[0]
        main_table = self.get_table_name(main_table_exp)
        main_alias = main_table_exp.alias or "n"
        if main_alias == main_table:
            main_alias = "n"

        match_parts = [f"MATCH ({main_alias}:{main_table})"]

        # Manejo de JOINS
        for join in expression.find_all(exp.Join):
            kind = join.kind or "INNER"
            target_exp = join.this
            target_name = self.get_table_name(target_exp)
            target_alias = target_exp.alias or target_name[0]

            rel_name = f"RELATED_TO_{target_name.upper()}"

            prefix = "OPTIONAL MATCH" if "LEFT" in kind or "RIGHT" in kind else "MATCH"
            pattern = (
                f"{prefix} ({main_alias})-[:{rel_name}]->({target_alias}:{target_name})"
            )
            match_parts.append(pattern)

        return " ".join(match_parts)

    @staticmethod
    def _build_return(expression: exp.Select) -> str:
        # Construcción de la estructura de RETURN en Cypher.
        projections = []
        distinct_kw = "DISTINCT " if expression.distinct else ""

        for projection in expression.expressions:
            if isinstance(projection, exp.Star):
                projections.append("n")
            else:
                alias_part = f" AS {projection.alias}" if projection.alias else ""
                col_str = (
                    projection.this.sql() if projection.alias else projection.sql()
                )

                # Heurística simple para prefijo
                if "." not in col_str and "(" not in col_str:
                    col_str = f"n.{col_str}"

                projections.append(f"{col_str}{alias_part}")

        return f"RETURN {distinct_kw}" + ", ".join(projections)

    @staticmethod
    def _build_order_by(expression: exp.Select) -> str:
        # Soporte para la cláusula ORDER BY
        order = expression.find(exp.Order)
        return order.sql() if order else ""

    @staticmethod
    def _build_limit(expression: exp.Select) -> str:
        # Soporte para las palabras reservadas LIMIT y TOP
        if expression.args.get("limit"):
            return f"LIMIT {expression.args['limit'].expression.sql()}"
        return ""

from abc import ABC, abstractmethod
from sqlglot import exp


class BaseHandler(ABC):
    """
    Clase abstracta que define el comportamiento de cualquier traductor
    y contiene utilidades compartidas (helpers).
    """

    @abstractmethod
    def handle(self, expression: exp.Expression) -> str:
        """Permite el manejo de traducciones."""
        pass

    def build_where(self, expression) -> str:
        """Construye la estructura de la cláusula WHERE."""
        where = expression.find(exp.Where)
        if not where:
            return ""

        condition = self._sanitize_condition(where.this)
        return f"WHERE {condition}"

    @staticmethod
    def _sanitize_condition(condition_node) -> str:
        """Normaliza las condiciones SQL para construir la consulta Cypher sin errores."""
        if not condition_node:
            return ""
        sql = condition_node.sql()
        return sql.replace("WHERE", "").strip()

    @staticmethod
    def get_table_name(node) -> str:
        """Extrae el nombre de la tabla de forma segura."""
        if isinstance(node, exp.Table):
            return node.name
        elif hasattr(node, "this") and isinstance(node.this, exp.Table):
            return node.this.name
        elif hasattr(node, "this") and hasattr(node.this, "name"):
            return node.this.name
        else:
            return "Node"

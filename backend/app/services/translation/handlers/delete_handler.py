from sqlglot import exp
from .base import BaseHandler
from ..exceptions import TranslationError


class DeleteHandler(BaseHandler):
    def handle(self, expression: exp.Delete) -> str:
        table = self.get_table_name(expression.this)
        where = self.build_where(expression)

        if not where:
            raise TranslationError("DELETE requiere WHERE por seguridad.")

        return f"MATCH (n:{table}) {where} DELETE n"

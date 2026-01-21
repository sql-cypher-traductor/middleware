from sqlglot import exp
from .base import BaseHandler
from ..exceptions import TranslationError


class UpdateHandler(BaseHandler):
    def handle(self, expression: exp.Update) -> str:
        table = self.get_table_name(expression.this)
        where = self.build_where(expression)

        if not where:
            raise TranslationError("UPDATE requiere WHERE por seguridad.")

        sets = []
        for e in expression.expressions:
            if isinstance(e, exp.EQ):
                col = e.left.name
                val = e.right.sql()
                sets.append(f"n.{col} = {val}")

        return f"MATCH (n:{table}) {where} SET {', '.join(sets)} RETURN n"

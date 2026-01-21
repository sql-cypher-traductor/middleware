from sqlglot import exp
from .base import BaseHandler
from ..exceptions import TranslationError


class InsertHandler(BaseHandler):
    def handle(self, expression: exp.Insert) -> str:
        table = self.get_table_name(expression.this)

        try:
            schema = expression.this
            cols = [c.name for c in schema.expressions]

            values_node = expression.expression
            vals = [v.name or v.sql() for v in values_node.expressions[0].expressions]

            props = []
            for c, v in zip(cols, vals):
                val_formatted = f"'{v}'" if not v.isdigit() else v
                props.append(f"{c}: {val_formatted}")

            return f"CREATE (n:{table} {{{', '.join(props)}}})"
        except Exception:
            raise TranslationError(
                "INSERT complejo no soportado. Use: INSERT INTO t (c) VALUES (v)"
            )

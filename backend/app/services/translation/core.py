import sqlglot
from sqlglot import exp
from .exceptions import TranslationError, UnsupportedStatementError
from .handlers import SelectHandler, InsertHandler, UpdateHandler, DeleteHandler


class SQLToCypherTranslator:
    def __init__(self):
        # Inicializamos los handlers una sola vez
        self.handlers = {
            exp.Select: SelectHandler(),
            exp.Insert: InsertHandler(),
            exp.Update: UpdateHandler(),
            exp.Delete: DeleteHandler(),
        }

    def translate(self, sql: str, dialect: str = "tsql") -> str:
        if not sql or not sql.strip():
            raise TranslationError("Consulta vacía.")

        try:
            # 1. Parseo
            expression = sqlglot.parse_one(sql, read=dialect)

            # 2. Selección de Estrategia (Routing)
            handler = self.handlers.get(type(expression))

            if not handler:
                raise UnsupportedStatementError(
                    f"Sentencia {type(expression).__name__} no soportada."
                )

            # 3. Ejecución
            return handler.handle(expression)

        except TranslationError:
            raise
        except Exception as e:
            raise TranslationError(f"Error interno: {str(e)}")

from sqlalchemy import create_engine, inspect


class SchemaInspector:
    def __init__(self, connection_url: str):
        self.engine = create_engine(connection_url)

    def get_schema_structure(self):
        """
        Retorna un árbol: { "tabla1": ["col1", "col2"], "tabla2": ... }
        """
        try:
            inspector = inspect(self.engine)
            schema_data = {}

            # Obtener todas las tablas
            table_names = inspector.get_table_names()

            for table in table_names:
                columns = inspector.get_columns(table)
                # Guardamos solo el nombre y tipo de dato
                schema_data[table] = [
                    {"name": col["name"], "type": str(col["type"])} for col in columns
                ]

            return schema_data
        except Exception as e:
            raise Exception(f"Error inspeccionando esquema: {str(e)}")
        finally:
            self.engine.dispose()

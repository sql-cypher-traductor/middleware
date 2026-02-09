from enum import Enum


class EngineType(str, Enum):
    SQL_SERVER = "SQL_SERVER"
    NEO4J = "NEO4J"

    @property
    def display_name(self) -> str:
        """Retorna el nombre legible para mostrar en UI."""
        if self == EngineType.SQL_SERVER:
            return "SQL Server"
        return "Neo4j"

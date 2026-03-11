from enum import Enum


class EngineType(str, Enum):
    SQL_SERVER = "SQL_SERVER"
    NEO4J = "NEO4J"

    @property
    def display_name(self) -> str:
        """Retorna el tipo de motor de las bases de datos externas."""
        if self == EngineType.SQL_SERVER:
            return "SQL Server"
        return "Neo4j"

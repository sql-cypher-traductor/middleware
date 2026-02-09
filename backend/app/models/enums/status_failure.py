import enum


class FailureStage(str, enum.Enum):
    TRANSLATION = "Traducción"  # Falló al convertir SQL -> Cypher
    EXECUTION = "Ejecución"  # Falló al correr en Neo4j (ej. error de conexión o sintaxis Cypher)

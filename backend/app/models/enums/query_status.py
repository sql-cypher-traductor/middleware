import enum


class QueryStatus(str, enum.Enum):
    PENDING = "Pendiente"  # Creada pero no procesada
    TRANSLATED = "Traducida"  # Solo traducida exitosamente
    EXECUTED = "Ejecutada"  # Traducida y ejecutada en Neo4j
    FAILED = "Fallida"  # Falló en algún punto

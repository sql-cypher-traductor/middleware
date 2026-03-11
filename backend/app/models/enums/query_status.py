import enum


class QueryStatus(str, enum.Enum):
    PENDING = "Pendiente"
    TRANSLATED = "Traducida"
    EXECUTED = "Ejecutada"
    FAILED = "Fallida"

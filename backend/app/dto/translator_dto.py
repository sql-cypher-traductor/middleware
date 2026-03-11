"""
DTOs para el módulo de traducción SQL a Cypher.
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class StatementType(str, Enum):
    """Tipos de sentencias SQL soportadas."""

    SELECT = "SELECT"
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    BATCH = "BATCH"
    UNKNOWN = "UNKNOWN"


class TranslationRequestDTO(BaseModel):
    """
    Esquema de solicitud para traducción SQL a Cypher.

    Attributes:
        sql: Consulta SQL a traducir.
    """

    sql: str = Field(..., min_length=1, description="Consulta SQL a traducir")


class TranslationResponseDTO(BaseModel):
    """
    Esquema de respuesta para traducción SQL a Cypher.

    Attributes:
        sql: Consulta SQL original.
        cypher: Consulta Cypher generada.
        statement_type: Tipo de sentencia SQL detectada.
        translation_time: Tiempo de traducción en segundos.
    """

    sql: str = Field(..., description="Consulta SQL original")
    cypher: str = Field(..., description="Consulta Cypher generada")
    statement_type: StatementType = Field(
        ..., description="Tipo de sentencia SQL detectada"
    )
    translation_time: float = Field(..., description="Tiempo de traducción en segundos")
    warnings: List[str] = Field(
        default_factory=list,
        description="Advertencias sobre la consulta (ej: UPDATE/DELETE sin WHERE)",
    )


class TranslationErrorDTO(BaseModel):
    """
    Esquema de error para traducción fallida.

    Attributes:
        sql: Consulta SQL original.
        error: Mensaje de error.
        error_type: Tipo de error.
    """

    sql: str = Field(..., description="Consulta SQL original")
    error: str = Field(..., description="Mensaje de error")
    error_type: str = Field(..., description="Tipo de error")

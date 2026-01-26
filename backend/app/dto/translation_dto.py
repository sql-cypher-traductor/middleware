from datetime import datetime

from pydantic import BaseModel, Field
from typing import Optional

"""DTOs para traducción de consultas SQL a Cypher."""


class TranslationRequestDTO(BaseModel):
    """
    DTO de petición de traducción.

    Atributos:
        - sql_query: Consulta SQL a traducir.
        - source_db_type: Dialecto SQL (varía de acuerdo al motor de base de datos).
    """

    sql_query: str = Field(
        ..., description="Consulta SQL a traducir", examples=["SELECT * FROM users;"]
    )
    source_db_type: str = Field(
        default="tsql", description="Dialectos SQL (tsql, postgres, oracle)"
    )


class TranslationResponseDTO(BaseModel):
    """
    DTO de respuesta de traducción.

    Atributos:
        - sql_query: Consulta SQL original.
        - cypher_query: Consulta Cypher resultante de la traducción.
        - error: Mensaje de error en caso de fallo en la traducción.
        - metadata: Metadatos adicionales como tiempo de traducción o tablas detectadas.
    """

    sql_query: str
    cypher_query: Optional[str] = None
    error: Optional[str] = None
    metadata: dict = Field(
        default_factory=dict,
        description="Metadatos sobre tiempos de traducción o tablas detectadas",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "sql_query": "SELECT * FROM users",
                "cypher_query": "MATCH (n:users) RETURN n",
                "error": None,
            }
        }


class TranslationHistoryResponseDTO(BaseModel):
    """
    DTO que devuelve el historial de traducciones.

    Atributos:
        - id: Identificador único de la traducción.
        - sql_query: Consulta SQL original.
        - cypher_query: Consulta Cypher traducida.
        - error_message: Mensaje de error por fallos en la traducción.
        - created_at: Fecha y hora de creación de la traducción.
    """

    id: int
    sql_query: str
    cypher_query: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

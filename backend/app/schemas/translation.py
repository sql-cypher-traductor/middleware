from pydantic import BaseModel, Field
from typing import Optional

"""Schemas para consultas y traducciones."""


class TranslationRequest(BaseModel):
    """
    Solicitud de traducción de SQL a Cypher.

    Attributos:
        sql_query (str): Consulta SQL a traducir.
        source_db_type (str): Dialecto SQL utilizado (varía de acuerdo al motor de base de datos).
    """

    sql_query: str = Field(
        ..., description="Consulta SQL a traducir", examples=["SELECT * FROM users;"]
    )
    source_db_type: str = Field(
        default="tsql", description="Dialectos SQL (tsql, postgres, oracle)"
    )


class TranslationResponse(BaseModel):
    """
    Respuesta de la traducción de SQL a Cypher.

    Attributos:
        cypher_query (Optional[str]): Consulta Cypher resultante de la traducción.
        sql_query (str): Consulta SQL original.
        error (Optional[str]): Mensaje de error en caso de fallo en la traducción.
        metadata (dict): Metadatos adicionales como tiempo de traducción o tablas detectadas.
    """

    cypher_query: Optional[str] = None
    sql_query: str
    error: Optional[str] = None
    metadata: dict = Field(
        default_factory=dict,
        description="Metadatos como tiempo de traducción o tablas detectadas",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "cypher_query": "MATCH (n:users) RETURN n",
                "sql_query": "SELECT * FROM users",
                "error": None,
            }
        }

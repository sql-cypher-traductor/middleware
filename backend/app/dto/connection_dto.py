from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

"""DTOs para la gestión de conexiones a bases de datos."""


class ConnectionDTO(BaseModel):
    """
    DTO para una conexión a base de datos.

    Atributos:
        - alias: Nombre para guardar la conexión.
        - engine: Motor de base de datos (sqlserver, neo4j).
        - host: Dirección del host de la base de datos.
        - port: Puerto de conexión.
        - username: Nombre de usuario para la conexión.
        - db_name: Nombre de la base de datos.
    """

    alias: str = Field(..., description="Nombre para guardar la conexión")
    engine: str = Field(..., description="sqlserver, neo4j")
    host: str
    port: str
    username: str
    db_name: Optional[str] = None


class ConnectionCreateDTO(ConnectionDTO):
    """
    DTO para agregar una nueva conexión.

    Atributos:
        - Hereda los atributos del DTO base.
        - password: Contraseña del usuario.
    """

    password: str


class ConnectionResponseDTO(ConnectionDTO):
    """
    DTO que devuelve una conexión.

    Atributos:
        - Hereda los atributos del DTO base.
        - id: Identificador único de la conexión.
    """

    id: UUID

    class Config:
        from_attributes = True

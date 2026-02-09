"""
DTOs para el módulo de conexiones a bases de datos externas.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional

from ..models.enums.engine_type import EngineType


class ConnectionBaseDTO(BaseModel):
    """
    Esquema base para una conexión.

    Attributes:
        connection_name: Nombre descriptivo de la conexión.
        engine_type: Tipo de motor de base de datos (SQL Server o Neo4j).
        host: Host del servidor de base de datos.
        port: Puerto de conexión.
        database_name: Nombre de la base de datos.
        username_db: Usuario para autenticación.
    """

    connection_name: str = Field(..., min_length=1, max_length=100)
    engine_type: EngineType
    host: str = Field(..., min_length=1)
    port: int = Field(..., ge=1, le=65535)
    database_name: str = Field(..., min_length=1)
    username_db: str = Field(..., min_length=1)

    @field_validator("port")
    @classmethod
    def validate_port(cls, v):
        if v < 1 or v > 65535:
            raise ValueError("El puerto debe estar entre 1 y 65535")
        return v


class ConnectionCreateDTO(ConnectionBaseDTO):
    """
    Esquema para crear una nueva conexión.
    Incluye la contraseña que será cifrada antes de guardar.

    Attributes:
        password_db: Contraseña para autenticación (será cifrada).
    """

    password_db: str = Field(..., min_length=1)


class ConnectionUpdateDTO(BaseModel):
    """
    Esquema para actualizar una conexión existente.
    Todos los campos son opcionales.

    Attributes:
        connection_name: Nombre descriptivo de la conexión.
        host: Host del servidor de base de datos.
        port: Puerto de conexión.
        database_name: Nombre de la base de datos.
        username_db: Usuario para autenticación.
        password_db: Nueva contraseña (opcional, si se proporciona será cifrada).
    """

    connection_name: Optional[str] = Field(None, min_length=1, max_length=100)
    host: Optional[str] = Field(None, min_length=1)
    port: Optional[int] = Field(None, ge=1, le=65535)
    database_name: Optional[str] = Field(None, min_length=1)
    username_db: Optional[str] = Field(None, min_length=1)
    password_db: Optional[str] = Field(None, min_length=1)


class ConnectionResponseDTO(BaseModel):
    """
    Esquema de respuesta para una conexión.
    No incluye la contraseña por seguridad.

    Attributes:
        connection_id: ID único de la conexión.
        user_id: ID del usuario propietario.
        connection_name: Nombre descriptivo de la conexión.
        engine_type: Tipo de motor de base de datos.
        host: Host del servidor de base de datos.
        port: Puerto de conexión.
        database_name: Nombre de la base de datos.
        username_db: Usuario para autenticación.
        is_active: Estado de activación de la conexión.
        created_at: Fecha de creación.
        updated_at: Fecha de última actualización.
    """

    model_config = ConfigDict(from_attributes=True)

    connection_id: UUID
    user_id: UUID
    connection_name: str
    engine_type: EngineType
    host: str
    port: int
    database_name: str
    username_db: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class ConnectionTestDTO(BaseModel):
    """
    Esquema para probar una conexión sin guardarla (conexión volátil).

    Attributes:
        engine_type: Tipo de motor de base de datos.
        host: Host del servidor de base de datos.
        port: Puerto de conexión.
        database_name: Nombre de la base de datos.
        username_db: Usuario para autenticación.
        password_db: Contraseña para autenticación.
    """

    engine_type: EngineType
    host: str = Field(..., min_length=1)
    port: int = Field(..., ge=1, le=65535)
    database_name: str = Field(..., min_length=1)
    username_db: str = Field(..., min_length=1)
    password_db: str = Field(..., min_length=1)


class ConnectionTestResponseDTO(BaseModel):
    """
    Esquema de respuesta para el test de conexión.

    Attributes:
        success: Indica si la conexión fue exitosa.
        message: Mensaje descriptivo del resultado.
        engine_type: Tipo de motor probado.
    """

    success: bool
    message: str
    engine_type: EngineType


class TableColumnDTO(BaseModel):
    """
    Esquema para representar una columna de una tabla.

    Attributes:
        column_name: Nombre de la columna.
        data_type: Tipo de dato de la columna.
        is_nullable: Indica si la columna acepta valores nulos.
        character_maximum_length: Longitud máxima para tipos de carácter.
    """

    column_name: str
    data_type: str
    is_nullable: bool
    character_maximum_length: Optional[int] = None


class TableSchemaDTO(BaseModel):
    """
    Esquema para representar una tabla con sus columnas.

    Attributes:
        table_name: Nombre de la tabla.
        table_schema: Esquema de la tabla (ej: dbo).
        columns: Lista de columnas de la tabla.
    """

    table_name: str
    table_schema: str
    columns: list[TableColumnDTO]


class DatabaseSchemaDTO(BaseModel):
    """
    Esquema para representar el esquema completo de una base de datos.

    Attributes:
        database_name: Nombre de la base de datos.
        tables: Lista de tablas con sus columnas.
    """

    database_name: str
    tables: list[TableSchemaDTO]


class ConnectionListResponseDTO(BaseModel):
    """
    Esquema de respuesta para listar conexiones con paginación.

    Attributes:
        connections: Lista de conexiones.
        total: Total de registros.
        page: Página actual.
        page_size: Tamaño de página.
        total_pages: Total de páginas.
    """

    connections: list[ConnectionResponseDTO]
    total: int
    page: int
    page_size: int
    total_pages: int


class ActiveConnectionsDTO(BaseModel):
    """
    Esquema para representar las conexiones activas del usuario.

    Attributes:
        sql_server: Conexión activa a SQL Server (si existe).
        neo4j: Conexión activa a Neo4j (si existe).
    """

    sql_server: Optional[ConnectionResponseDTO] = None
    neo4j: Optional[ConnectionResponseDTO] = None

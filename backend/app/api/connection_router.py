"""
Router para endpoints de conexiones a bases de datos externas.
"""

from uuid import UUID
from typing import Optional, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.dependencies import (
    get_current_user_from_cookie,
    get_current_user_with_csrf,
)
from ..db.database import get_db
from ..dto.connection_dto import (
    ConnectionCreateDTO,
    ConnectionUpdateDTO,
    ConnectionResponseDTO,
    ConnectionTestDTO,
    ConnectionTestResponseDTO,
    DatabaseSchemaDTO,
    ConnectionListResponseDTO,
    ActiveConnectionsDTO,
)
from ..models.user import User
from ..services.connection_service import ConnectionService

router = APIRouter(
    prefix="/connections",
    tags=["Conexiones"],
)


@router.get(
    "",
    response_model=ConnectionListResponseDTO,
    summary="Listar conexiones",
    description="Obtiene todas las conexiones del usuario autenticado con paginación.",
)
async def list_connections(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=50, description="Tamaño de página"),
    engine_type: Optional[Literal["SQL_SERVER", "NEO4J"]] = Query(
        None, description="Filtrar por tipo de motor"
    ),
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> ConnectionListResponseDTO:
    """
    Lista todas las conexiones del usuario con paginación opcional.
    """
    service = ConnectionService(db)
    return service.get_connections(
        user_id=current_user.user_id,
        page=page,
        page_size=page_size,
        engine_type=engine_type,
    )


@router.get(
    "/active",
    response_model=ActiveConnectionsDTO,
    summary="Obtener conexiones activas",
    description="Obtiene las conexiones activas del usuario (una por cada tipo de motor).",
)
async def get_active_connections(
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> ActiveConnectionsDTO:
    """
    Obtiene las conexiones activas del usuario.
    Puede haber máximo una conexión activa por tipo (SQL Server y/o Neo4j).
    """
    service = ConnectionService(db)
    return service.get_active_connections(user_id=current_user.user_id)


@router.post(
    "",
    response_model=ConnectionResponseDTO,
    status_code=201,
    summary="Crear conexión",
    description="Crea una nueva conexión. La contraseña se cifra automáticamente.",
)
async def create_connection(
    connection_data: ConnectionCreateDTO,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ConnectionResponseDTO:
    """
    Crea una nueva conexión para el usuario autenticado.
    La conexión se crea desactivada por defecto.
    """
    service = ConnectionService(db)
    return service.create_connection(
        user_id=current_user.user_id,
        connection_data=connection_data,
    )


@router.post(
    "/test",
    response_model=ConnectionTestResponseDTO,
    summary="Probar conexión volátil",
    description="Prueba una conexión sin guardarla. Útil para validar credenciales.",
)
async def test_connection(
    connection_data: ConnectionTestDTO,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ConnectionTestResponseDTO:
    """
    Prueba una conexión volátil (sin guardar).
    Retorna éxito o error con mensaje descriptivo.
    """
    service = ConnectionService(db)
    return service.test_connection(connection_data)


@router.get(
    "/{connection_id}",
    response_model=ConnectionResponseDTO,
    summary="Obtener conexión",
    description="Obtiene los detalles de una conexión específica.",
)
async def get_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> ConnectionResponseDTO:
    """
    Obtiene una conexión por su ID.
    Solo retorna conexiones del usuario autenticado.
    """
    service = ConnectionService(db)
    return service.get_connection(
        connection_id=connection_id,
        user_id=current_user.user_id,
    )


@router.put(
    "/{connection_id}",
    response_model=ConnectionResponseDTO,
    summary="Actualizar conexión",
    description="Actualiza una conexión existente. Solo se actualizan los campos proporcionados.",
)
async def update_connection(
    connection_id: UUID,
    update_data: ConnectionUpdateDTO,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ConnectionResponseDTO:
    """
    Actualiza una conexión del usuario autenticado.
    Si se proporciona una nueva contraseña, se cifrará automáticamente.
    """
    service = ConnectionService(db)
    return service.update_connection(
        connection_id=connection_id,
        user_id=current_user.user_id,
        update_data=update_data,
    )


@router.delete(
    "/{connection_id}",
    summary="Eliminar conexión",
    description="Elimina una conexión permanentemente.",
)
async def delete_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> dict:
    """
    Elimina una conexión del usuario autenticado.
    """
    service = ConnectionService(db)
    return service.delete_connection(
        connection_id=connection_id,
        user_id=current_user.user_id,
    )


@router.post(
    "/{connection_id}/activate",
    response_model=ConnectionResponseDTO,
    summary="Activar conexión",
    description="Activa una conexión. Desactiva automáticamente cualquier otra conexión del mismo tipo.",
)
async def activate_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ConnectionResponseDTO:
    """
    Activa una conexión. Solo puede haber una conexión activa por tipo de motor.
    Si ya hay otra conexión SQL Server activa y activas una nueva SQL Server,
    la anterior se desactiva automáticamente. Lo mismo aplica para Neo4j.
    Esto permite tener simultáneamente una conexión SQL Server y una Neo4j activas.
    """
    service = ConnectionService(db)
    return service.activate_connection(
        connection_id=connection_id,
        user_id=current_user.user_id,
    )


@router.post(
    "/{connection_id}/deactivate",
    response_model=ConnectionResponseDTO,
    summary="Desactivar conexión",
    description="Desactiva una conexión activa.",
)
async def deactivate_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ConnectionResponseDTO:
    """
    Desactiva una conexión del usuario autenticado.
    """
    service = ConnectionService(db)
    return service.deactivate_connection(
        connection_id=connection_id,
        user_id=current_user.user_id,
    )


@router.post(
    "/{connection_id}/test",
    response_model=ConnectionTestResponseDTO,
    summary="Probar conexión guardada",
    description="Prueba una conexión guardada para verificar que sigue funcionando.",
)
async def test_saved_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ConnectionTestResponseDTO:
    """
    Prueba una conexión guardada.
    Útil para verificar que las credenciales siguen siendo válidas.
    """
    service = ConnectionService(db)
    return service.test_saved_connection(
        connection_id=connection_id,
        user_id=current_user.user_id,
    )


@router.get(
    "/{connection_id}/schema",
    response_model=DatabaseSchemaDTO,
    summary="Obtener esquema de base de datos",
    description="Obtiene las tablas y columnas de una base de datos SQL Server.",
)
async def get_database_schema(
    connection_id: UUID,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> DatabaseSchemaDTO:
    """
    Obtiene el esquema de la base de datos (tablas y columnas).
    Solo disponible para conexiones SQL Server.
    Consulta INFORMATION_SCHEMA.COLUMNS para extraer la estructura.
    """
    service = ConnectionService(db)
    return service.get_database_schema(
        connection_id=connection_id,
        user_id=current_user.user_id,
    )

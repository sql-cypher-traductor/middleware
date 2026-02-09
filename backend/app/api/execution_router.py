"""
Router para endpoints de ejecución de consultas Cypher en Neo4j.
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
from ..dto.execution_dto import (
    ExecutionRequestDTO,
    ExecutionResponseDTO,
    TranslateAndExecuteRequestDTO,
    QueryHistoryResponseDTO,
    QueryHistoryListResponseDTO,
)
from ..models.user import User
from ..services.execution_service import ExecutionService

router = APIRouter(
    prefix="/execution",
    tags=["Ejecución"],
)


@router.post(
    "/cypher",
    response_model=ExecutionResponseDTO,
    summary="Ejecutar consulta Cypher",
    description="Ejecuta una consulta Cypher directamente en Neo4j y retorna "
    "los resultados en formato de grafo, tabla y estadísticas.",
)
async def execute_cypher(
    request: ExecutionRequestDTO,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ExecutionResponseDTO:
    """
    Ejecuta una consulta Cypher en la conexión Neo4j activa o especificada.

    - **cypher_query**: Consulta Cypher a ejecutar.
    - **connection_id**: ID de conexión (opcional, usa la activa si no se especifica).
    - **sql_query**: Consulta SQL original para registro (opcional).

    Retorna:
    - Nodos y relaciones para visualización en grafo.
    - Datos tabulares para visualización en tabla.
    - Estadísticas de ejecución (tiempo, filas afectadas, etc.).
    """
    service = ExecutionService(db)
    return service.execute_cypher(
        user_id=current_user.user_id,
        request=request,
    )


@router.post(
    "/translate-and-execute",
    response_model=ExecutionResponseDTO,
    summary="Traducir SQL y ejecutar",
    description="Traduce una consulta SQL a Cypher y la ejecuta en Neo4j en un solo paso.",
)
async def translate_and_execute(
    request: TranslateAndExecuteRequestDTO,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> ExecutionResponseDTO:
    """
    Traduce SQL a Cypher y ejecuta la consulta resultante en Neo4j.

    Este endpoint combina la traducción y ejecución en un solo paso,
    registrando tanto el tiempo de traducción como el de ejecución.

    - **sql_query**: Consulta SQL a traducir y ejecutar.
    - **connection_id**: ID de conexión (opcional, usa la activa si no se especifica).
    """
    service = ExecutionService(db)
    return service.translate_and_execute(
        user_id=current_user.user_id,
        request=request,
    )


@router.get(
    "/history",
    response_model=QueryHistoryListResponseDTO,
    summary="Obtener historial de consultas",
    description="Obtiene el historial de consultas del usuario con paginación y filtros.",
)
async def get_query_history(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=50, description="Tamaño de página"),
    status: Optional[Literal["Pendiente", "Traducida", "Ejecutada", "Fallida"]] = Query(
        None, description="Filtrar por estado"
    ),
    connection_id: Optional[UUID] = Query(None, description="Filtrar por conexión"),
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> QueryHistoryListResponseDTO:
    """
    Lista el historial de consultas del usuario.

    Permite filtrar por estado de la consulta y/o conexión específica.
    Los resultados se ordenan por fecha de creación descendente.
    """
    service = ExecutionService(db)
    return service.get_query_history(
        user_id=current_user.user_id,
        page=page,
        page_size=page_size,
        status=status,
        connection_id=connection_id,
    )


@router.get(
    "/history/{query_id}",
    response_model=QueryHistoryResponseDTO,
    summary="Obtener consulta del historial",
    description="Obtiene los detalles de una consulta específica del historial.",
)
async def get_query_by_id(
    query_id: UUID,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> QueryHistoryResponseDTO:
    """
    Obtiene los detalles de una consulta específica del historial.
    """
    service = ExecutionService(db)
    return service.get_query_by_id(
        user_id=current_user.user_id,
        query_id=query_id,
    )


@router.delete(
    "/history/{query_id}",
    summary="Eliminar consulta del historial",
    description="Elimina una consulta específica del historial.",
)
async def delete_query_from_history(
    query_id: UUID,
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> dict:
    """
    Elimina una consulta del historial del usuario.
    """
    service = ExecutionService(db)
    return service.delete_query_history(
        user_id=current_user.user_id,
        query_id=query_id,
    )


@router.delete(
    "/history",
    summary="Limpiar historial de consultas",
    description="Elimina todo el historial de consultas del usuario.",
)
async def clear_query_history(
    current_user: User = Depends(get_current_user_with_csrf),
    db: Session = Depends(get_db),
) -> dict:
    """
    Elimina todo el historial de consultas del usuario.
    Esta acción no se puede deshacer.
    """
    service = ExecutionService(db)
    return service.clear_query_history(user_id=current_user.user_id)

"""
Router de administración de usuarios, logs y estadísticas.
"""

from uuid import UUID
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
import json

from ..core.dependencies import CurrentAdmin, CurrentAdminWithCSRF
from ..db.database import get_db
from ..dto.user_dto import (
    AdminUserUpdateDTO,
    AdminUserResponseDTO,
    PaginatedUsersResponseDTO,
)
from ..dto.log_dto import (
    LogListResponseDTO,
    LogStatsResponseDTO,
    UsageStatsResponseDTO,
)
from ..models.enums.user_role import UserRole
from ..services.admin_service import AdminService
from ..services.log_service import LogService

router = APIRouter(prefix="/api/admin", tags=["Administración"])


@router.get(
    "/users",
    response_model=PaginatedUsersResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Listar usuarios",
    description="Obtiene una lista paginada de usuarios con filtros opcionales. Solo para administradores.",
)
def get_users(
    current_admin: CurrentAdmin,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=10, ge=1, le=100, description="Usuarios por página"),
    search: str | None = Query(
        default=None, description="Buscar por nombre, apellido o email"
    ),
    role: UserRole | None = Query(default=None, description="Filtrar por rol"),
):
    """
    Endpoint para listar usuarios con paginación y filtros.
    Requiere rol de administrador.
    """
    admin_service = AdminService(db)
    return admin_service.get_users(
        page=page,
        page_size=page_size,
        search=search,
        role=role,
    )


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Actualizar usuario",
    description="Actualiza los datos de un usuario. Solo para administradores.",
)
def update_user(
    user_id: UUID,
    update_data: AdminUserUpdateDTO,
    current_admin: CurrentAdminWithCSRF,
    db: Session = Depends(get_db),
):
    """
    Endpoint para actualizar un usuario.
    Requiere rol de administrador y token CSRF válido.
    """
    admin_service = AdminService(db)
    return admin_service.update_user(
        user_id=user_id,
        update_data=update_data,
        admin_user=current_admin,
    )


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar usuario",
    description="Elimina un usuario (soft-delete). Solo para administradores.",
)
def delete_user(
    user_id: UUID,
    current_admin: CurrentAdminWithCSRF,
    db: Session = Depends(get_db),
):
    """
    Endpoint para eliminar un usuario (eliminación lógica).
    Requiere rol de administrador y token CSRF válido.
    """
    admin_service = AdminService(db)
    return admin_service.delete_user(
        user_id=user_id,
        admin_user=current_admin,
    )



@router.get(
    "/logs",
    response_model=LogListResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener logs del sistema",
    description="Obtiene logs paginados con filtros. Solo para administradores.",
)
def get_logs(
    current_admin: CurrentAdmin,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=50, ge=1, le=100, description="Logs por página"),
    level: Optional[str] = Query(
        default=None, description="Filtrar por nivel (INFO, WARNING, ERROR, CRITICAL)"
    ),
    action: Optional[str] = Query(
        default=None, description="Filtrar por tipo de acción"
    ),
    user_id: Optional[UUID] = Query(default=None, description="Filtrar por usuario"),
    start_date: Optional[datetime] = Query(
        default=None, description="Fecha de inicio (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        default=None, description="Fecha de fin (ISO format)"
    ),
    search: Optional[str] = Query(
        default=None, description="Buscar en mensaje y recurso"
    ),
):
    """
    Endpoint para obtener logs del sistema con filtros.
    Los logs son inmutables y solo pueden ser visualizados.
    Requiere rol de administrador.
    """
    log_service = LogService(db)
    return log_service.get_logs(
        page=page,
        page_size=page_size,
        level=level,
        action=action,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        search=search,
    )


@router.get(
    "/stats",
    response_model=LogStatsResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener estadísticas de logs",
    description="Obtiene estadísticas basadas en logs. Solo para administradores.",
)
def get_stats(
    current_admin: CurrentAdmin,
    db: Session = Depends(get_db),
    days: int = Query(
        default=30, ge=1, le=365, description="Días de historial para estadísticas"
    ),
):
    """
    Endpoint para obtener estadísticas de logs del sistema.
    Incluye métricas de errores y actividad de logs.
    Requiere rol de administrador.
    """
    log_service = LogService(db)
    return log_service.get_stats(days=days)


@router.get(
    "/usage-stats",
    response_model=UsageStatsResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener estadísticas de uso",
    description="Obtiene estadísticas de uso del sistema (usuarios, consultas, conexiones). Solo para administradores.",
)
def get_usage_stats(
    current_admin: CurrentAdmin,
    db: Session = Depends(get_db),
    days: int = Query(
        default=30, ge=1, le=365, description="Días de historial para estadísticas"
    ),
):
    """
    Endpoint para obtener estadísticas de uso del sistema.
    Incluye métricas de usuarios activos, consultas realizadas, tiempos promedio y conexiones.
    No basado en logs, sino en datos reales de uso.
    Requiere rol de administrador.
    """
    log_service = LogService(db)
    return log_service.get_usage_stats(days=days)




@router.get(
    "/logs/export/csv",
    status_code=status.HTTP_200_OK,
    summary="Exportar logs a CSV",
    description="Exporta los logs filtrados a un archivo CSV.",
)
def export_logs_csv(
    current_admin: CurrentAdmin,
    db: Session = Depends(get_db),
    level: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
):
    """
    Exporta logs a formato CSV.
    """
    log_service = LogService(db)
    result = log_service.get_logs(
        page=1,
        page_size=10000,  # Máximo para exportación
        level=level,
        action=action,
        start_date=start_date,
        end_date=end_date,
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Encabezados
    writer.writerow(
        [
            "Fecha",
            "Nivel",
            "Acción",
            "Usuario",
            "Email",
            "Mensaje",
            "Recurso",
            "IP",
            "User Agent",
        ]
    )

    # Datos
    for log in result.logs:
        writer.writerow(
            [
                log.created_at.isoformat(),
                log.level,
                log.action,
                log.user_name or "Sistema",
                log.user_email or "-",
                log.message,
                log.resource or "-",
                log.ip_address or "-",
                log.user_agent or "-",
            ]
        )

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        },
    )


@router.get(
    "/logs/export/json",
    status_code=status.HTTP_200_OK,
    summary="Exportar logs a JSON",
    description="Exporta los logs filtrados a un archivo JSON.",
)
def export_logs_json(
    current_admin: CurrentAdmin,
    db: Session = Depends(get_db),
    level: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
):
    """
    Exporta logs a formato JSON.
    """
    log_service = LogService(db)
    result = log_service.get_logs(
        page=1,
        page_size=10000,
        level=level,
        action=action,
        start_date=start_date,
        end_date=end_date,
    )

    logs_data = [
        {
            "id": str(log.id),
            "created_at": log.created_at.isoformat(),
            "level": log.level,
            "action": log.action,
            "user_name": log.user_name,
            "user_email": log.user_email,
            "message": log.message,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
        }
        for log in result.logs
    ]

    output = json.dumps(logs_data, indent=2, ensure_ascii=False)

    return StreamingResponse(
        iter([output]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        },
    )

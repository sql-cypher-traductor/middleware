"""
Router de administración de usuarios.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..core.dependencies import CurrentAdmin, CurrentAdminWithCSRF
from ..db.database import get_db
from ..dto.user_dto import (
    AdminUserUpdateDTO,
    AdminUserResponseDTO,
    PaginatedUsersResponseDTO,
)
from ..models.enums.user_role import UserRole
from ..services.admin_service import AdminService

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

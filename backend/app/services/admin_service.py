"""
Servicio de administración de usuarios.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..dto.user_dto import (
    AdminUserUpdateDTO,
    AdminUserResponseDTO,
    PaginatedUsersResponseDTO,
)
from ..models.user import User
from ..models.enums.user_role import UserRole
from ..repositories.user_repository import UserRepository


class AdminService:
    """
    Servicio para operaciones de administración de usuarios.
    """

    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)

    def get_users(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        role: UserRole | None = None,
    ) -> PaginatedUsersResponseDTO:
        """
        Obtiene lista paginada de usuarios con filtros opcionales.

        Args:
            page: Número de página (1-indexed).
            page_size: Cantidad de usuarios por página.
            search: Término de búsqueda.
            role: Filtrar por rol.

        Returns:
            Respuesta paginada con usuarios.
        """
        # Validar parámetros de paginación
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 100:
            page_size = 100

        users, total = self.user_repository.get_users_paginated(
            page=page,
            page_size=page_size,
            search=search,
            role=role,
            include_deleted=False,
        )

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return PaginatedUsersResponseDTO(
            users=[AdminUserResponseDTO.model_validate(u) for u in users],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def update_user(
        self,
        user_id: UUID,
        update_data: AdminUserUpdateDTO,
        admin_user: User,
    ) -> AdminUserResponseDTO:
        """
        Actualiza un usuario (rol, estado activo, datos básicos).

        Args:
            user_id: ID del usuario a actualizar.
            update_data: Datos a actualizar.
            admin_user: Usuario admin que realiza la acción.

        Returns:
            Usuario actualizado.

        Raises:
            HTTPException: Si el usuario no existe o hay errores de validación.
        """
        # Buscar el usuario
        user = self.user_repository.get_by_id_for_admin(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        # Verificar que el usuario no esté eliminado
        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede modificar un usuario eliminado",
            )

        # Evitar que un admin se desactive o cambie su propio rol
        if user.user_id == admin_user.user_id:
            if update_data.role is not None and update_data.role != user.role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes cambiar tu propio rol",
                )
            if update_data.is_active is not None and not update_data.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes desactivarte a ti mismo",
                )

        # Aplicar actualizaciones
        if update_data.first_name is not None:
            user.first_name = update_data.first_name

        if update_data.last_name is not None:
            user.last_name = update_data.last_name

        if update_data.role is not None:
            user.role = update_data.role

        if update_data.is_active is not None:
            user.is_active = update_data.is_active

        updated_user = self.user_repository.update(user)

        return AdminUserResponseDTO.model_validate(updated_user)

    def delete_user(self, user_id: UUID, admin_user: User) -> dict:
        """
        Elimina un usuario.

        Args:
            user_id: ID del usuario a eliminar.
            admin_user: Usuario admin que realiza la acción.

        Returns:
            Mensaje de confirmación.

        Raises:
            HTTPException: Si el usuario no existe o es el mismo admin.
        """
        # Buscar el usuario
        user = self.user_repository.get_by_id_for_admin(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        # Verificar que ya no esté eliminado
        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya fue eliminado",
            )

        # Evitar que un admin se elimine a sí mismo
        if user.user_id == admin_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminarte a ti mismo",
            )

        # Realizar eliminación segura
        self.user_repository.soft_delete(user)

        return {"message": f"Usuario {user.email} eliminado correctamente"}

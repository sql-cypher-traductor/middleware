"""
Servicio para operaciones relacionadas con usuarios.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..core.security import hash_password, verify_password
from ..dto.user_dto import (
    UserUpdateDTO,
    UserUpdateMeDTO,
    ChangePasswordDTO,
    UserResponseDTO,
)
from ..models.user import User
from ..repositories.user_repository import UserRepository


class UserService:
    """
    Servicio para gestión de usuarios.
    """

    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)

    def get_user_by_id(self, user_id: str) -> User:
        """
        Obtiene un usuario por su ID.

        Args:
            user_id: ID del usuario.

        Returns:
            Usuario encontrado.

        Raises:
            HTTPException: Si el usuario no existe.
        """
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return user

    def update_profile(self, user_id: str, user_data: UserUpdateDTO) -> User:
        """
        Actualiza el perfil del usuario por ID.
        Solo permite cambiar first_name y last_name.
        No permite cambiar email ni role.

        Args:
            user_id: ID del usuario a actualizar.
            user_data: Datos a actualizar.

        Returns:
            Usuario actualizado.
        """
        user = self.get_user_by_id(user_id)

        if user_data.first_name is not None:
            user.first_name = user_data.first_name
        if user_data.last_name is not None:
            user.last_name = user_data.last_name

        return self.user_repository.update(user)

    def update_me(self, user: User, update_data: UserUpdateMeDTO) -> UserResponseDTO:
        """
        Actualiza los datos básicos del usuario autenticado (nombre y apellido).

        Args:
            user: Usuario autenticado actual.
            update_data: Datos a actualizar (first_name, last_name).

        Returns:
            Usuario actualizado.
        """
        # Actualizar campos permitidos (solo si se proporcionan)
        if update_data.first_name is not None:
            user.first_name = update_data.first_name

        if update_data.last_name is not None:
            user.last_name = update_data.last_name

        # Guardar cambios
        updated_user = self.user_repository.update(user)

        return UserResponseDTO.model_validate(updated_user)

    def change_password(self, user: User, password_data: ChangePasswordDTO) -> dict:
        """
        Cambia la contraseña del usuario autenticado.

        Args:
            user: Usuario autenticado actual.
            password_data: Contraseña actual y nueva contraseña.

        Returns:
            Mensaje de confirmación.

        Raises:
            HTTPException: Si la contraseña actual es incorrecta.
        """
        # Verificar que la contraseña actual sea correcta
        if not verify_password(password_data.current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta",
            )

        # Hashear y asignar la nueva contraseña
        user.password = hash_password(password_data.new_password)

        # Guardar cambios
        self.user_repository.update(user)

        return {"message": "Contraseña actualizada exitosamente"}

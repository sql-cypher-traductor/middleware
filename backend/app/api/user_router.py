"""
Router para operaciones relacionadas con usuarios.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.dependencies import CurrentUser
from ..db.database import get_db
from ..dto.user_dto import (
    UserResponseDTO,
    UserUpdateDTO,
    ChangePasswordDTO,
)
from ..services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["Usuarios"])


@router.get(
    "/me",
    response_model=UserResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener perfil del usuario",
)
def get_my_profile(current_user: CurrentUser):
    return current_user


@router.patch(
    "/me",
    response_model=UserResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Actualizar perfil del usuario",
)
def update_my_profile(
    user_data: UserUpdateDTO,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    user_service = UserService(db)
    updated_user = user_service.update_profile(
        user_id=str(current_user.user_id),
        user_data=user_data,
    )
    return updated_user


@router.post(
    "/me/change-password",
    status_code=status.HTTP_200_OK,
    summary="Cambiar contraseña",
)
def change_password(
    password_data: ChangePasswordDTO,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    user_service = UserService(db)
    return user_service.change_password(
        user=current_user,
        password_data=password_data,
    )

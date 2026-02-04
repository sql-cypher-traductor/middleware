from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

"""Esquemas para la gestión de usuarios."""


class UserDTO(BaseModel):
    """
    Esquema de datos base de un usuario.

    Atributos:
        - email: Correo electrónico del usuario.
    """

    email: EmailStr


class UserCreateDTO(UserDTO):
    """
    DTO para registrar un nuevo usuario.

    Atributos:
        - Hereda los atributos del DTO base.
        - password: Contraseña del usuario.
        - full_name: Nombre completo del usuario.
    """

    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserUpdateDTO(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class UserResponseDTO(UserDTO):
    """
    DTO que devuelve la información del usuario.

    Atributos:
        - Hereda los atributos del DTO base.
        - id: Identificador único del usuario.
        - full_name: Nombre completo del usuario.
        - is_active: Estado activo del usuario.
        - created_at: Fecha de creación del usuario.
    """

    id: UUID
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateAdminDTO(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None

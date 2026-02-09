from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from uuid import UUID

from ..models.enums.user_role import UserRole


class LoginDTO(BaseModel):
    """
    Esquema de datos para el login de usuario.

    Attributes:
        email (EmailStr): Correo electrónico del usuario.
        password (str): Contraseña del usuario.
    """

    email: EmailStr
    password: str


class TokenResponseDTO(BaseModel):
    """
    Esquema de datos para la respuesta del token JWT.

    Attributes:
        access_token (str): Token de acceso JWT.
        token_type (str): Tipo de token (Bearer).
    """

    access_token: str
    token_type: str = "bearer"


class UserBaseDTO(BaseModel):
    """
    Esquema de datos base de un usuario.

    Attributes:
        first_name (str): Nombre del usuario.
        last_name (str): Apellido del usuario.
        email (EmailStr): Correo electrónico del usuario.
    """

    first_name: str
    last_name: str
    email: EmailStr


class UserCreateDTO(UserBaseDTO):
    """
    Esquema de datos para la creación de un usuario.

    Attributes:
        password (str): Contraseña del usuario.
    """

    password: str = Field(..., min_length=8)


class UserUpdateDTO(BaseModel):
    """
    Esquema de datos para la actualización de un usuario.

    Attributes:
        first_name (str): Nombre del usuario.
        last_name (str): Apellido del usuario.
    """

    first_name: str | None = None
    last_name: str | None = None


class UserUpdateMeDTO(BaseModel):
    """
    Esquema de datos para que un usuario actualice su información básica.
    Solo permite cambiar nombre y apellido.

    Attributes:
        first_name (str | None): Nuevo nombre del usuario.
        last_name (str | None): Nuevo apellido del usuario.
    """

    first_name: str | None = None
    last_name: str | None = None


class ChangePasswordDTO(BaseModel):
    """
    Esquema de datos para cambiar la contraseña del usuario.

    Attributes:
        current_password (str): Contraseña actual del usuario.
        new_password (str): Nueva contraseña (mínimo 8 caracteres).
    """

    current_password: str
    new_password: str = Field(..., min_length=8)


class UserResponseDTO(UserBaseDTO):
    """
    Esquema de datos para la respuesta de un usuario.
    """

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None


class AuthResultDTO(BaseModel):
    """
    Esquema interno para el resultado de autenticación (usado por el servicio).

    Attributes:
        access_token (str): Token JWT de acceso.
        user (UserResponseDTO): Información del usuario autenticado.
    """

    access_token: str
    user: UserResponseDTO

    model_config = ConfigDict(from_attributes=True)


class LoginResponseDTO(BaseModel):
    """
    Esquema de respuesta para el endpoint de login.

    Attributes:
        user (UserResponseDTO): Información del usuario autenticado.
        message (str): Mensaje de éxito.
    """

    user: UserResponseDTO
    message: str = "Inicio de sesión exitoso"


class PasswordResetRequestDTO(BaseModel):
    email: EmailStr


class PasswordResetConfirmDTO(BaseModel):
    token: str
    new_password: str = Field(
        ..., min_length=8, description="La nueva contraseña del usuario"
    )


# DTOs para administración de usuarios (Admin)


class AdminUserUpdateDTO(BaseModel):
    """
    Esquema de datos para que un admin actualice un usuario.
    Permite cambiar rol, estado activo/inactivo y datos básicos.
    """

    first_name: str | None = None
    last_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class AdminUserResponseDTO(BaseModel):
    """
    Esquema de respuesta de usuario para administración.
    Incluye información adicional como deleted_at.
    """

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None
    deleted_at: datetime | None = None


class PaginatedUsersResponseDTO(BaseModel):
    """
    Esquema de respuesta paginada de usuarios.
    """

    users: list[AdminUserResponseDTO]
    total: int
    page: int
    page_size: int
    total_pages: int

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..core.cookies import set_auth_cookies, clear_auth_cookies
from ..core.dependencies import CurrentUser
from ..core.security import create_csrf_token
from ..db.database import get_db
from ..dto.user_dto import (
    UserCreateDTO,
    UserResponseDTO,
    LoginDTO,
    LoginResponseDTO,
)
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post(
    "/register",
    response_model=UserResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario",
    description="Crea un nuevo usuario en el sistema. Valida que el email sea único.",
)
def register(user_data: UserCreateDTO, db: Session = Depends(get_db)):
    """
    Endpoint para registrar un nuevo usuario.

    - **first_name**: Nombre del usuario
    - **last_name**: Apellido del usuario
    - **email**: Correo electrónico (debe ser único)
    - **password**: Contraseña (mínimo 8 caracteres)
    """
    auth_service = AuthService(db)
    user = auth_service.register(user_data)
    return user


@router.post(
    "/login",
    response_model=LoginResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión",
    description="Autentica un usuario y establece cookies seguras con el JWT.",
)
def login(
    login_data: LoginDTO,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Endpoint para iniciar sesión.

    - **email**: Correo electrónico del usuario registrado
    - **password**: Contraseña del usuario

    Establece cookies HttpOnly con el JWT y retorna información del usuario.
    El token CSRF debe ser enviado en el header X-CSRF-Token para operaciones mutables.
    """
    auth_service = AuthService(db)
    auth_result = auth_service.login(login_data)

    # Crear token CSRF vinculado a la sesión del usuario
    csrf_token = create_csrf_token(str(auth_result.user.user_id))

    # Establecer cookies seguras
    set_auth_cookies(
        response=response,
        access_token=auth_result.access_token,
        csrf_token=csrf_token,
    )

    return LoginResponseDTO(
        user=auth_result.user,
        message="Inicio de sesión exitoso",
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesión",
    description="Elimina las cookies de autenticación.",
)
def logout(
    response: Response,
):
    """
    Endpoint para cerrar sesión.
    Elimina las cookies de autenticación del navegador.
    """
    clear_auth_cookies(response)
    return {"message": "Sesión cerrada exitosamente"}


@router.get(
    "/me",
    response_model=UserResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener usuario actual",
    description="Retorna la información del usuario autenticado.",
)
def get_current_user(current_user: CurrentUser):
    """
    Endpoint para obtener la información del usuario autenticado.
    Requiere estar autenticado (cookie de sesión válida).
    """
    return current_user


@router.post(
    "/refresh-csrf",
    status_code=status.HTTP_200_OK,
    summary="Refrescar token CSRF",
    description="Genera un nuevo token CSRF para el usuario autenticado.",
)
def refresh_csrf_token(
    response: Response,
    current_user: CurrentUser,
):
    """
    Endpoint para obtener un nuevo token CSRF.
    Útil cuando el token CSRF expira, pero el JWT sigue siendo válido.
    """
    csrf_token = create_csrf_token(str(current_user.user_id))

    # Actualizar solo la cookie CSRF
    from ..core.cookies import CSRF_TOKEN_COOKIE
    from ..core.config import settings

    response.set_cookie(
        key=CSRF_TOKEN_COOKIE,
        value=csrf_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=False,
        samesite=settings.COOKIE_SAMESITE,
    )

    return {"message": "Token CSRF actualizado"}


from fastapi import APIRouter, Depends, Response, status, HTTPException, Request
from sqlalchemy.orm import Session

from ..core.cookies import set_auth_cookies, clear_auth_cookies
from ..core.dependencies import CurrentUser
from ..core.security import (
    create_csrf_token,
    create_password_reset_token,
    verify_password_reset_token,
    hash_password,
)
from ..core.audit import AuditLogger
from ..db.database import get_db
from ..dto.user_dto import (
    UserCreateDTO,
    UserResponseDTO,
    LoginDTO,
    LoginResponseDTO,
    PasswordResetRequestDTO,
    PasswordResetConfirmDTO,
)
from ..repositories.user_repository import UserRepository
from ..services.auth_service import AuthService
from ..services.email_service import send_reset_password_email

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post(
    "/register",
    response_model=UserResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario",
    description="Crea un nuevo usuario en el sistema. Valida que el email sea único.",
)
def register(
    user_data: UserCreateDTO,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Endpoint para registrar un nuevo usuario.

    - **first_name**: Nombre del usuario
    - **last_name**: Apellido del usuario
    - **email**: Correo electrónico (debe ser único)
    - **password**: Contraseña (mínimo 8 caracteres)
    """
    auth_service = AuthService(db)
    user = auth_service.register(user_data)

    # Registrar log
    AuditLogger.info(
        db=db,
        action=AuditLogger.Actions.REGISTER,
        message=f"Nuevo usuario registrado: {user.email}",
        user_id=user.user_id,
        resource=f"User:{user.user_id}",
        request=request,
    )

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
    request: Request,
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

    try:
        auth_result = auth_service.login(login_data)
    except HTTPException:
        # Registrar intento fallido
        AuditLogger.warning(
            db=db,
            action=AuditLogger.Actions.LOGIN_FAILED,
            message=f"Intento de login fallido para: {login_data.email}",
            details={"email": str(login_data.email)},
            request=request,
        )
        raise

    # Crear token CSRF vinculado a la sesión del usuario
    csrf_token = create_csrf_token(str(auth_result.user.user_id))

    # Establecer cookies seguras
    set_auth_cookies(
        response=response,
        access_token=auth_result.access_token,
        csrf_token=csrf_token,
    )

    # Registrar login exitoso
    AuditLogger.info(
        db=db,
        action=AuditLogger.Actions.LOGIN,
        message=f"Usuario inició sesión: {auth_result.user.email}",
        user_id=auth_result.user.user_id,
        request=request,
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """
    Endpoint para cerrar sesión.
    Elimina las cookies de autenticación del navegador.
    """
    # Registrar logout si hay usuario
    if current_user:
        AuditLogger.info(
            db=db,
            action=AuditLogger.Actions.LOGOUT,
            message=f"Usuario cerró sesión: {current_user.email}",
            user_id=current_user.user_id,
            request=request,
        )

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


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(request: PasswordResetRequestDTO, db: Session = Depends(get_db)):
    """
    Inicia el flujo de recuperación de contraseña.
    """
    user_repo = UserRepository(db)

    user = user_repo.get_by_email(email=request.email)

    if user:
        token = create_password_reset_token(email=user.email)
        send_reset_password_email(email_to=user.email, token=token)

    # 3. Retornar mensaje genérico
    return {
        "message": "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(conf: PasswordResetConfirmDTO, db: Session = Depends(get_db)):
    """
    Verifica el token y actualiza la contraseña del usuario.
    """
    # 1. Verificar Token
    email = verify_password_reset_token(conf.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token es inválido o ha expirado.",
        )

    # 2. Buscar Usuario
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(email)

    if not user:
        # Esto es raro si el token era válido, pero por seguridad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado."
        )

    # 3. Actualizar Contraseña
    # Hashear la nueva clave
    hashed_password = hash_password(conf.new_password)

    # Asignamos y guardamos
    user.password = hashed_password
    user_repo.update(user)

    return {
        "message": "Contraseña actualizada correctamente. Ahora puedes iniciar sesión."
    }

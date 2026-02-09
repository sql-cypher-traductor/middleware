"""
Dependencias de autenticación y protección CSRF para FastAPI.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .security import verify_access_token, verify_csrf_token
from .cookies import ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE
from ..db.database import get_db
from ..repositories.user_repository import UserRepository
from ..models.user import User

# Header donde el frontend envía el token CSRF
CSRF_HEADER_NAME = "X-CSRF-Token"


async def get_current_user_from_cookie(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Obtiene el usuario actual desde la cookie de acceso.

    Args:
        request: Objeto Request de FastAPI.
        db: Sesión de base de datos.

    Returns:
        Usuario autenticado.

    Raises:
        HTTPException: Si no hay token, es inválido o el usuario no existe.
    """
    # Obtener el token de la cookie
    access_token = request.cookies.get(ACCESS_TOKEN_COOKIE)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar el token
    payload = verify_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Obtener el usuario de la base de datos
    user_repository = UserRepository(db)
    user = user_repository.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def verify_csrf(request: Request) -> None:
    """
    Verifica el token CSRF para operaciones mutables (POST, PUT, PATCH, DELETE).
    Implementa el patrón double-submit cookie.

    Args:
        request: Objeto Request de FastAPI.

    Raises:
        HTTPException: Si el token CSRF es inválido o no coincide.
    """
    # Obtener el token CSRF de la cookie
    csrf_cookie = request.cookies.get(CSRF_TOKEN_COOKIE)

    if not csrf_cookie:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF no encontrado en cookie",
        )

    # Obtener el token CSRF del header
    csrf_header = request.headers.get(CSRF_HEADER_NAME)

    if not csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF no encontrado en header",
        )

    # Obtener el user_id del token de acceso para validar el CSRF
    access_token = request.cookies.get(ACCESS_TOKEN_COOKIE)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )

    payload = verify_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso inválido",
        )

    session_id = payload.get("sub")

    # Verificar que el token del header coincide con el de la cookie
    # y que es válido para esta sesión
    if csrf_cookie != csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF inválido",
        )

    # Verificar que el token CSRF pertenece a esta sesión
    if not verify_csrf_token(csrf_header, session_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF no válido para esta sesión",
        )


# Tipos anotados para usar como dependencias
CurrentUser = Annotated[User, Depends(get_current_user_from_cookie)]
CSRFProtection = Annotated[None, Depends(verify_csrf)]


async def get_current_user_with_csrf(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Obtiene el usuario actual y verifica el token CSRF.
    Usar para operaciones mutables (POST, PUT, PATCH, DELETE).

    Args:
        request: Objeto Request de FastAPI.
        db: Sesión de base de datos.

    Returns:
        Usuario autenticado.

    Raises:
        HTTPException: Si no está autenticado o el CSRF es inválido.
    """
    # Primero verificar CSRF
    await verify_csrf(request)

    # Luego obtener el usuario
    return await get_current_user_from_cookie(request, db)


# Dependencia combinada: autenticación + protección CSRF
CurrentUserWithCSRF = Annotated[User, Depends(get_current_user_with_csrf)]

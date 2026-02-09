"""
Módulo para manejo de cookies HTTP seguras.
Implementa HttpOnly, Secure, y SameSite para protección contra XSS y CSRF.
"""

from fastapi import Response

from .config import settings

# Nombres de las cookies
ACCESS_TOKEN_COOKIE = "access_token"
CSRF_TOKEN_COOKIE = "csrf_token"


def set_auth_cookies(
    response: Response,
    access_token: str,
    csrf_token: str,
) -> None:
    """
    Establece las cookies de autenticación en la respuesta.

    - access_token: HttpOnly, Secure, SameSite (NO accesible desde JavaScript)
    - csrf_token: NO HttpOnly (accesible desde JavaScript para enviar en headers)

    Args:
        response: Objeto Response de FastAPI.
        access_token: Token JWT de acceso.
        csrf_token: Token CSRF para protección contra ataques.
    """
    # Cookie del Access Token (HttpOnly - no accesible desde JS)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,  # True en producción (HTTPS)
        httponly=True,  # No accesible desde JavaScript
        samesite=settings.COOKIE_SAMESITE,  # "lax" o "strict"
    )

    # Cookie del CSRF Token (NO HttpOnly - debe ser leída por JavaScript)
    response.set_cookie(
        key=CSRF_TOKEN_COOKIE,
        value=csrf_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=False,  # Accesible desde JavaScript
        samesite=settings.COOKIE_SAMESITE,
    )


def clear_auth_cookies(response: Response) -> None:
    """
    Elimina las cookies de autenticación (logout).

    Args:
        response: Objeto Response de FastAPI.
    """
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )
    response.delete_cookie(
        key=CSRF_TOKEN_COOKIE,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )

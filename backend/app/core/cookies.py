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

    - access_token: HttpOnly, Secure, SameSite
    - csrf_token: NO HttpOnly

    Args:
        response: Response donde se establecerán las cookies.
        access_token: Token JWT de acceso.
        csrf_token: Token CSRF para protección contra ataques.
    """
    # Cookie del Access Token (HttpOnly)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )

    # Cookie del CSRF Token
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


def clear_auth_cookies(response: Response) -> None:
    """
    Limpia las cookies de autenticación al salir del middleware.

    Args:
        response: Response donde se eliminarán las cookies.
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

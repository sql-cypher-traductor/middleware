import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from .config import settings


def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt.

    Args:
        password: Contraseña en texto plano.

    Returns:
        Contraseña hasheada.
    """

    encoded = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(encoded, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña coincide con su hash.

    Args:
        plain_password: Contraseña en texto plano.
        hashed_password: Hash de la contraseña almacenada.

    Returns:
        True si coinciden, False en caso contrario.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Crea un token JWT de acceso.

    Args:
        data: Datos a incluir en el payload del token.
        expires_delta: Tiempo de expiración del token.

    Returns:
        Token JWT codificado.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def verify_access_token(token: str) -> dict | None:
    """
    Verifica y decodifica un token JWT.

    Args:
        token: Token JWT a verificar.

    Returns:
        Payload del token si es válido, None en caso contrario.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_csrf_token() -> str:
    """
    Genera un token CSRF seguro.

    Returns:
        Token CSRF de 32 bytes en formato hexadecimal.
    """
    return secrets.token_hex(32)


def create_csrf_token(session_id: str) -> str:
    """
    Crea un token CSRF vinculado a una sesión (double-submit pattern).

    Args:
        session_id: ID de la sesión del usuario (user_id del JWT).

    Returns:
        Token CSRF firmado.
    """
    token_data = {
        "session_id": session_id,
        "csrf": secrets.token_hex(16),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(
        token_data, settings.CSRF_SECRET_KEY, algorithm=settings.ALGORITHM
    )


def verify_csrf_token(csrf_token: str, session_id: str) -> bool:
    """
    Verifica que el token CSRF sea válido y pertenezca a la sesión.

    Args:
        csrf_token: Token CSRF a verificar.
        session_id: ID de la sesión del usuario.

    Returns:
        True si el token es válido, False en caso contrario.
    """
    try:
        payload = jwt.decode(
            csrf_token, settings.CSRF_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload.get("session_id") == session_id
    except JWTError:
        return False


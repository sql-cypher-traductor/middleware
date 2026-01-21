from typing import Optional

from pydantic import BaseModel

"""DTOs para la generación y validación de tokens JWT."""


class TokenDTO(BaseModel):
    """
    DTO para la generación de un token JWT para iniciar sesión.

    Atributos:
        - access_token: Token de acceso generado.
        - token_type: Tipo de token (por ejemplo, "bearer").
    """

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """
    DTO para la generación de un token JWT para restablecer contraseña.

    Atributos:
        - email: Correo electrónico asociado al token.
    """

    email: Optional[str] = None

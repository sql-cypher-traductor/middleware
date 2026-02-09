import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Configuración de la aplicación.
    """

    # Configuración de JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # Configuración de CSRF
    CSRF_SECRET_KEY: str = os.getenv("CSRF_SECRET_KEY", os.getenv("JWT_SECRET_KEY", ""))

    # Configuración de Cookies
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "False").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")  # "lax" o "strict"
    COOKIE_DOMAIN: str | None = os.getenv("COOKIE_DOMAIN", None)

    # Frontend URL (para CORS)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Entorno
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Configuración de Resend
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    PASSWORD_RESET_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "15"))


settings = Settings()

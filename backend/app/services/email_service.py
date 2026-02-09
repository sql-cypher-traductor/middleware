import resend
from ..core.config import settings

resend.api_key = settings.RESEND_API_KEY


def send_reset_password_email(email_to: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"

    try:
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": email_to,
                "subject": "Recuperación de contraseña",
                "html": f"""
                <p>Haz clic aquí para restablecer tu contraseña:</p>
                <a href="{reset_link}">Restablecer Contraseña</a>
                <p>Expira en 15 minutos.</p>
            """,
            }
        )
    except Exception as e:
        print(f"Error enviando email: {e}")

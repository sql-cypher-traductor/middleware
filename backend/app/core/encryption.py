"""
Servicio de cifrado para credenciales de conexiones.
Utiliza Fernet (AES-128-CBC) para cifrado simétrico.
"""

import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from .config import settings


class EncryptionService:
    """
    Servicio para cifrar y descifrar credenciales sensibles.
    """

    def __init__(self):
        self._fernet = self._create_fernet()

    @staticmethod
    def _create_fernet() -> Fernet:
        """
        Crea una instancia de Fernet para el cifrado de la contraseña del usuario.

        Returns:
            Instancia de Fernet configurada.
        """
        # Obtener la clave secreta de la configuración
        secret_key = settings.SECRET_KEY
        if not secret_key:
            raise ValueError(
                "SECRET_KEY no está configurada. Es necesaria para el cifrado."
            )

        # Usar PBKDF2 para derivar una clave de 32 bytes
        salt = b"middleware_connections_salt_v1"

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        # Derivar la clave y codificarla en base64 para Fernet
        key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode()))

        return Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """
        Cifra un texto plano.

        Args:
            plaintext: Texto a cifrar.

        Returns:
            Texto cifrado en formato base64.
        """
        if not plaintext:
            return ""

        encrypted_bytes = self._fernet.encrypt(plaintext.encode("utf-8"))
        return encrypted_bytes.decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        """
        Descifra un texto cifrado.

        Args:
            ciphertext: Texto cifrado en formato base64.

        Returns:
            Texto descifrado original.

        Raises:
            Exception: Si el texto no puede ser descifrado.
        """
        if not ciphertext:
            return ""

        decrypted_bytes = self._fernet.decrypt(ciphertext.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")


# Instancia del servicio de cifrado
encryption_service = EncryptionService()


def encrypt_credential(plaintext: str) -> str:
    """
    Función de conveniencia para cifrar una credencial.

    Args:
        plaintext: Texto a cifrar.

    Returns:
        Texto cifrado.
    """
    return encryption_service.encrypt(plaintext)


def decrypt_credential(ciphertext: str) -> str:
    """
    Función de conveniencia para descifrar una credencial.

    Args:
        ciphertext: Texto cifrado.

    Returns:
        Texto descifrado.
    """
    return encryption_service.decrypt(ciphertext)

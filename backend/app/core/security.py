from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
from jose import jwt
import bcrypt
from cryptography.fernet import Fernet
import os

load_dotenv()

# ==================== 1. AUTENTICACIÓN (JWT) ====================
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not set; refusing to start without a secure signing key."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 día


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Genera un token JWT para autenticación."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ==================== 2. LOGIN (Bcrypt) ====================
def verify_password(plain_password, hashed_password):
    """
    Verifica la contraseña del usuario contra el hash.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def get_password_hash(password):
    """
    Hashea la contraseña del usuario para almacenarla en la base de datos.
    """
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)

    return hashed.decode("utf-8")


# ==================== 3. CONEXIÓN A BASES DE DATOS (AES-128) ====================
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise RuntimeError(
        "La variable de entorno ENCRYPTION_KEY no ha sido asignada. "
        "Por favor, configure una clave Fernet segura para encriptar credenciales e bases de datos."
    )

cipher_suite = Fernet(ENCRYPTION_KEY)


def encrypt_credential(raw_password: str) -> str:
    """
    Se encarga de encriptar la contraseña a la base de datos usando Fernet (AES-128).
    """
    return cipher_suite.encrypt(raw_password.encode()).decode()


def decrypt_credential(encrypted_password: str) -> str:
    """
    Desencripta la contraseña para conectarse a la base de datos
    """
    return cipher_suite.decrypt(encrypted_password.encode()).decode()

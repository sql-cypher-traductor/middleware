from passlib.context import CryptContext
from cryptography.fernet import Fernet
import os

# Configurar Hashing para Login de Usuarios
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Configurar Cifrado para Credenciales de DB
# Generar una key (Hard-codeada, se debe cambiar)
SECRET_KEY = os.getenv("ENCRYPTION_KEY", "bZ1Xz7Q5w8o_gK9y2e4r3t1y6u8i0oP_lKjhHgFdSsA=")
cipher_suite = Fernet(SECRET_KEY)

def encrypt_credential(raw_password: str) -> str:
    """Cifra la contraseña de la base de datos a la cual se debe conectar."""
    return cipher_suite.encrypt(raw_password.encode()).decode()

def decrypt_credential(encrypted_password: str) -> str:
    """Descifra para utilizarla en la conexión."""
    return cipher_suite.decrypt(encrypted_password.encode()).decode()
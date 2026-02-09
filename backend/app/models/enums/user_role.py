from enum import Enum


class UserRole(str, Enum):
    ADMIN = "Administrador"
    DEV = "Desarrollador"

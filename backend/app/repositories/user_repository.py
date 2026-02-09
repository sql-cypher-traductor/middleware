from pydantic import EmailStr
from sqlalchemy.orm import Session

from ..models.user import User


class UserRepository:
    """
    Repositorio para operaciones de base de datos relacionadas con usuarios.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: EmailStr) -> User | None:
        """
        Busca un usuario por su email.

        Args:
            email: Email del usuario a buscar.

        Returns:
            Usuario encontrado o None si no existe.
        """
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user: User) -> User:
        """
        Crea un nuevo usuario en la base de datos.

        Args:
            user: Instancia del modelo User a crear.

        Returns:
            Usuario creado con su ID asignado.
        """
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: str) -> User | None:
        """
        Busca un usuario por su ID.

        Args:
            user_id: ID del usuario a buscar.

        Returns:
            Usuario encontrado o None si no existe.
        """
        return self.db.query(User).filter(User.user_id == user_id).first()

    def update(self, user: User) -> User:
        """
        Actualiza un usuario en la base de datos.

        Args:
            user: Instancia del modelo User a actualizar.

        Returns:
            Usuario actualizado.
        """
        self.db.commit()
        self.db.refresh(user)
        return user

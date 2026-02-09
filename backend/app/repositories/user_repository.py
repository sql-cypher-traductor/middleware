from datetime import datetime, timezone
from uuid import UUID

from pydantic import EmailStr
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.enums.user_role import UserRole


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
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_users_paginated(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        role: UserRole | None = None,
        include_deleted: bool = False,
    ) -> tuple[list[User], int]:
        """
        Obtiene usuarios con paginación, búsqueda y filtro por rol.

        Args:
            page: Número de página (1-indexed).
            page_size: Cantidad de usuarios por página.
            search: Término de búsqueda (busca en nombre, apellido y email).
            role: Filtrar por rol específico.
            include_deleted: Si se incluyen usuarios eliminados (soft-deleted).

        Returns:
            Tupla con la lista de usuarios y el total de registros.
        """
        query = self.db.query(User)

        # Excluir usuarios eliminados por defecto
        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))

        # Aplicar búsqueda
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                )
            )

        # Aplicar filtro por rol
        if role:
            query = query.filter(User.role == role)

        # Obtener total antes de paginar
        total = query.count()

        # Aplicar paginación
        offset = (page - 1) * page_size
        users = (
            query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        )

        return users, total

    def soft_delete(self, user: User) -> User:
        """
        Realiza una eliminación lógica (soft-delete) del usuario.

        Args:
            user: Usuario a eliminar.

        Returns:
            Usuario con deleted_at actualizado.
        """
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id_for_admin(self, user_id: UUID) -> User | None:
        """
        Busca un usuario por su ID (para administración).
        Incluye usuarios eliminados.

        Args:
            user_id: ID del usuario a buscar.

        Returns:
            Usuario encontrado o None si no existe.
        """
        return self.db.query(User).filter(User.user_id == user_id).first()

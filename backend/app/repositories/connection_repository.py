"""
Repositorio para operaciones de base de datos relacionadas con conexiones.
"""

from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.connection import Connection
from ..models.enums.engine_type import EngineType


class ConnectionRepository:
    """
    Repositorio para operaciones CRUD de conexiones.
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, connection: Connection) -> Connection:
        """
        Crea una nueva conexión en la base de datos.

        Args:
            connection: Instancia del modelo Connection a crear.

        Returns:
            Conexión creada con su ID asignado.
        """
        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)
        return connection

    def get_by_id(self, connection_id: UUID) -> Optional[Connection]:
        """
        Busca una conexión por su ID.

        Args:
            connection_id: ID de la conexión a buscar.

        Returns:
            Conexión encontrada o None si no existe.
        """
        return (
            self.db.query(Connection)
            .filter(Connection.connection_id == connection_id)
            .first()
        )

    def get_by_id_and_user(
        self, connection_id: UUID, user_id: UUID
    ) -> Optional[Connection]:
        """
        Busca una conexión por su ID y usuario propietario.

        Args:
            connection_id: ID de la conexión a buscar.
            user_id: ID del usuario propietario.

        Returns:
            Conexión encontrada o None si no existe o no pertenece al usuario.
        """
        return (
            self.db.query(Connection)
            .filter(
                and_(
                    Connection.connection_id == connection_id,
                    Connection.user_id == user_id,
                )
            )
            .first()
        )

    def get_all_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
        engine_type: Optional[EngineType] = None,
    ) -> tuple[list[Connection], int]:
        """
        Obtiene todas las conexiones de un usuario con paginación.

        Args:
            user_id: ID del usuario.
            page: Número de página.
            page_size: Cantidad de registros por página.
            engine_type: Filtrar por tipo de motor.

        Returns:
            Tupla con la lista de conexiones y el total de registros.
        """
        query = self.db.query(Connection).filter(Connection.user_id == user_id)

        if engine_type:
            query = query.filter(Connection.engine_type == engine_type)

        total = query.count()

        connections = (
            query.order_by(Connection.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return connections, total

    def get_active_by_user_and_type(
        self, user_id: UUID, engine_type: EngineType
    ) -> Optional[Connection]:
        """
        Obtiene la conexión activa de un usuario para un tipo de motor específico.

        Args:
            user_id: ID del usuario.
            engine_type: Tipo de motor de base de datos.

        Returns:
            Conexión activa o None si no hay ninguna.
        """
        return (
            self.db.query(Connection)
            .filter(
                and_(
                    Connection.user_id == user_id,
                    Connection.engine_type == engine_type,
                    Connection.is_active.is_(True),
                )
            )
            .first()
        )

    def update(self, connection: Connection) -> Connection:
        """
        Actualiza una conexión en la base de datos.

        Args:
            connection: Instancia del modelo Connection a actualizar.

        Returns:
            Conexión actualizada.
        """
        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)
        return connection

    def delete(self, connection: Connection) -> bool:
        """
        Elimina una conexión de la base de datos.

        Args:
            connection: Conexión a eliminar.

        Returns:
            True si la eliminación fue exitosa.
        """
        self.db.delete(connection)
        self.db.commit()
        return True

    def deactivate_all_by_user_and_type(
        self, user_id: UUID, engine_type: EngineType
    ) -> int:
        """
        Desactiva todas las conexiones de un usuario para un tipo de motor.

        Args:
            user_id: ID del usuario.
            engine_type: Tipo de motor de base de datos.

        Returns:
            Cantidad de conexiones desactivadas.
        """
        updated = (
            self.db.query(Connection)
            .filter(
                and_(
                    Connection.user_id == user_id,
                    Connection.engine_type == engine_type,
                    Connection.is_active.is_(True),
                )
            )
            .update({"is_active": False})
        )
        self.db.commit()
        return updated

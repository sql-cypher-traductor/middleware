"""
Repositorio para operaciones de base de datos relacionadas con historial de consultas.
"""

from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from ..models.query_history import QueryHistory
from ..models.enums.query_status import QueryStatus


class QueryHistoryRepository:
    """
    Repositorio para operaciones CRUD de historial de consultas.
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, query_history: QueryHistory) -> QueryHistory:
        """
        Crea un nuevo registro de consulta en el historial.

        Args:
            query_history: Instancia del modelo QueryHistory a crear.

        Returns:
            Registro creado con su ID asignado.
        """
        self.db.add(query_history)
        self.db.commit()
        self.db.refresh(query_history)
        return query_history

    def get_by_id(self, query_id: UUID) -> Optional[QueryHistory]:
        """
        Busca un registro de consulta por su ID.

        Args:
            query_id: ID de la consulta a buscar.

        Returns:
            Registro encontrado o None si no existe.
        """
        return (
            self.db.query(QueryHistory)
            .filter(QueryHistory.query_id == query_id)
            .first()
        )

    def get_by_id_and_user(
        self, query_id: UUID, user_id: UUID
    ) -> Optional[QueryHistory]:
        """
        Busca un registro de consulta por su ID y usuario propietario.

        Args:
            query_id: ID de la consulta a buscar.
            user_id: ID del usuario propietario.

        Returns:
            Registro encontrado o None si no existe o no pertenece al usuario.
        """
        return (
            self.db.query(QueryHistory)
            .filter(
                and_(
                    QueryHistory.query_id == query_id,
                    QueryHistory.user_id == user_id,
                )
            )
            .first()
        )

    def get_all_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
        status: Optional[QueryStatus] = None,
        connection_id: Optional[UUID] = None,
    ) -> tuple[list[QueryHistory], int]:
        """
        Obtiene el historial de consultas de un usuario con paginación.

        Args:
            user_id: ID del usuario.
            page: Número de página (1-indexed).
            page_size: Cantidad de registros por página.
            status: Filtrar por estado de la consulta (opcional).
            connection_id: Filtrar por conexión (opcional).

        Returns:
            Tupla con la lista de consultas y el total de registros.
        """
        query = self.db.query(QueryHistory).filter(QueryHistory.user_id == user_id)

        if status:
            query = query.filter(QueryHistory.query_status == status)

        if connection_id:
            query = query.filter(QueryHistory.connection_id == connection_id)

        total = query.count()

        # Ordenar por fecha de creación descendente (más recientes primero)
        query = query.order_by(desc(QueryHistory.created_at))

        # Aplicar paginación
        offset = (page - 1) * page_size
        queries = query.offset(offset).limit(page_size).all()

        return queries, total

    def update(self, query_history: QueryHistory) -> QueryHistory:
        """
        Actualiza un registro de consulta existente.

        Args:
            query_history: Instancia del modelo QueryHistory con los cambios.

        Returns:
            Registro actualizado.
        """
        self.db.commit()
        self.db.refresh(query_history)
        return query_history

    def delete(self, query_history: QueryHistory) -> None:
        """
        Elimina un registro de consulta.

        Args:
            query_history: Instancia del modelo QueryHistory a eliminar.
        """
        self.db.delete(query_history)
        self.db.commit()

    def delete_all_by_user(self, user_id: UUID) -> int:
        """
        Elimina todo el historial de consultas de un usuario.

        Args:
            user_id: ID del usuario.

        Returns:
            Número de registros eliminados.
        """
        deleted_count = (
            self.db.query(QueryHistory).filter(QueryHistory.user_id == user_id).delete()
        )
        self.db.commit()
        return deleted_count

    def get_recent_by_user(self, user_id: UUID, limit: int = 10) -> list[QueryHistory]:
        """
        Obtiene las consultas más recientes de un usuario.

        Args:
            user_id: ID del usuario.
            limit: Número máximo de consultas a retornar.

        Returns:
            Lista de consultas ordenadas por fecha descendente.
        """
        return (
            self.db.query(QueryHistory)
            .filter(QueryHistory.user_id == user_id)
            .order_by(desc(QueryHistory.created_at))
            .limit(limit)
            .all()
        )

    def get_statistics_by_user(self, user_id: UUID) -> dict:
        """
        Obtiene estadísticas del historial de consultas de un usuario.

        Args:
            user_id: ID del usuario.

        Returns:
            Diccionario con estadísticas (total, por estado, etc.).
        """
        total = (
            self.db.query(QueryHistory).filter(QueryHistory.user_id == user_id).count()
        )

        # Contar por estado
        status_counts = {}
        for status in QueryStatus:
            count = (
                self.db.query(QueryHistory)
                .filter(
                    and_(
                        QueryHistory.user_id == user_id,
                        QueryHistory.query_status == status,
                    )
                )
                .count()
            )
            status_counts[status.value] = count

        return {
            "total": total,
            "by_status": status_counts,
        }

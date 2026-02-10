"""
Repositorio para operaciones de base de datos relacionadas con logs del sistema.
"""

from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, case

from ..models.log import Log
from ..models.user import User


class LogRepository:
    """
    Repositorio para operaciones CRUD de logs del sistema.
    Los logs son inmutables: solo se pueden crear y leer, nunca editar o eliminar.
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, log: Log) -> Log:
        """
        Crea un nuevo log en la base de datos.

        Args:
            log: Instancia del modelo Log a crear.

        Returns:
            Log creado con su ID asignado.
        """
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_by_id(self, log_id: UUID) -> Optional[Log]:
        """
        Busca un log por su ID.

        Args:
            log_id: ID del log a buscar.

        Returns:
            Log encontrado o None si no existe.
        """
        return self.db.query(Log).filter(Log.id == log_id).first()

    def get_all(
        self,
        page: int = 1,
        page_size: int = 50,
        level: Optional[str] = None,
        action: Optional[str] = None,
        user_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Log], int]:
        """
        Obtiene logs con paginación y filtros.

        Args:
            page: Número de página (1-indexed).
            page_size: Cantidad de registros por página.
            level: Filtrar por nivel (INFO, WARNING, ERROR, CRITICAL).
            action: Filtrar por tipo de acción.
            user_id: Filtrar por usuario.
            start_date: Fecha de inicio del rango.
            end_date: Fecha de fin del rango.
            search: Buscar en mensaje y recurso.

        Returns:
            Tupla con la lista de logs y el total de registros.
        """
        query = self.db.query(Log)

        # Aplicar filtros
        if level:
            query = query.filter(Log.level == level.upper())

        if action:
            query = query.filter(Log.action == action)

        if user_id:
            query = query.filter(Log.user_id == user_id)

        if start_date:
            query = query.filter(Log.created_at >= start_date)

        if end_date:
            query = query.filter(Log.created_at <= end_date)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Log.message.ilike(search_pattern))
                | (Log.resource.ilike(search_pattern))
                | (Log.action.ilike(search_pattern))
            )

        total = query.count()

        # Ordenar por fecha descendente (más recientes primero)
        query = query.order_by(desc(Log.created_at))

        # Aplicar paginación
        offset = (page - 1) * page_size
        logs = query.offset(offset).limit(page_size).all()

        return logs, total

    def get_distinct_actions(self) -> list[str]:
        """
        Obtiene la lista de acciones únicas registradas.

        Returns:
            Lista de nombres de acciones.
        """
        result = self.db.query(Log.action).distinct().all()
        return [r[0] for r in result if r[0]]

    def get_logs_count_by_level(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict[str, int]:
        """
        Obtiene el conteo de logs agrupados por nivel.

        Args:
            start_date: Fecha de inicio del rango.
            end_date: Fecha de fin del rango.

        Returns:
            Diccionario con nivel -> conteo.
        """
        query = self.db.query(Log.level, func.count(Log.id))

        if start_date:
            query = query.filter(Log.created_at >= start_date)
        if end_date:
            query = query.filter(Log.created_at <= end_date)

        result = query.group_by(Log.level).all()
        return {level: count for level, count in result}

    def get_logs_count_by_action(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 10,
    ) -> list[tuple[str, int]]:
        """
        Obtiene el conteo de logs agrupados por acción.

        Args:
            start_date: Fecha de inicio del rango.
            end_date: Fecha de fin del rango.
            limit: Número máximo de acciones a retornar.

        Returns:
            Lista de tuplas (acción, conteo) ordenadas por conteo descendente.
        """
        query = self.db.query(Log.action, func.count(Log.id))

        if start_date:
            query = query.filter(Log.created_at >= start_date)
        if end_date:
            query = query.filter(Log.created_at <= end_date)

        result = (
            query.group_by(Log.action)
            .order_by(desc(func.count(Log.id)))
            .limit(limit)
            .all()
        )
        return result

    def get_logs_count_by_day(
        self,
        days: int = 30,
    ) -> list[tuple[datetime, int]]:
        """
        Obtiene el conteo de logs por día para los últimos N días.

        Args:
            days: Número de días hacia atrás.

        Returns:
            Lista de tuplas (fecha, conteo).
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        result = (
            self.db.query(
                func.date(Log.created_at).label("date"),
                func.count(Log.id).label("count"),
            )
            .filter(Log.created_at >= start_date)
            .group_by(func.date(Log.created_at))
            .order_by(func.date(Log.created_at))
            .all()
        )
        return result

    def get_error_logs_today(self) -> int:
        """
        Obtiene el conteo de errores del día actual.

        Returns:
            Número de errores hoy.
        """
        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        return (
            self.db.query(func.count(Log.id))
            .filter(
                and_(
                    Log.level.in_(["ERROR", "CRITICAL"]),
                    Log.created_at >= today_start,
                )
            )
            .scalar()
        )

    def get_recent_errors(self, limit: int = 10) -> list[Log]:
        """
        Obtiene los errores más recientes.

        Args:
            limit: Número máximo de errores a retornar.

        Returns:
            Lista de logs de error.
        """
        return (
            self.db.query(Log)
            .filter(Log.level.in_(["ERROR", "CRITICAL"]))
            .order_by(desc(Log.created_at))
            .limit(limit)
            .all()
        )

"""
Servicio de logs y estadísticas del sistema.
"""

import math
import re
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional, Any

from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case

from ..dto.log_dto import (
    LogCreateDTO,
    LogReadDTO,
    LogListResponseDTO,
    LogCountByLevelDTO,
    LogCountByActionDTO,
    LogCountByDayDTO,
    SystemStatsDTO,
    LogStatsResponseDTO,
    UsageStatsDTO,
    UsageStatsResponseDTO,
    QueryCountByDayDTO,
    QueryStatusDistributionDTO,
)
from ..models.log import Log
from ..models.user import User
from ..models.connection import Connection
from ..models.query_history import QueryHistory
from ..models.enums.query_status import QueryStatus
from ..repositories.log_repository import LogRepository

# Colores para niveles de log (para UI)
LEVEL_COLORS = {
    "INFO": "#3b82f6",  # Azul
    "WARNING": "#f59e0b",  # Amarillo
    "ERROR": "#ef4444",  # Rojo
    "CRITICAL": "#dc2626",  # Rojo oscuro
}

# Patrones sensibles a enmascarar en los logs
SENSITIVE_PATTERNS = [
    (r"password['\"]?\s*[:=]\s*['\"]?([^'\"}\s,]+)", "password: ***"),
    (r"token['\"]?\s*[:=]\s*['\"]?([^'\"}\s,]+)", "token: ***"),
    (r"secret['\"]?\s*[:=]\s*['\"]?([^'\"}\s,]+)", "secret: ***"),
    (r"api_key['\"]?\s*[:=]\s*['\"]?([^'\"}\s,]+)", "api_key: ***"),
    (r"authorization['\"]?\s*[:=]\s*['\"]?([^'\"}\s,]+)", "authorization: ***"),
]


class LogService:
    """
    Servicio para gestionar logs y estadísticas del sistema.
    """

    def __init__(self, db: Session):
        self.db = db
        self.log_repository = LogRepository(db)

    def create_log(
        self,
        level: str,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> Log:
        """
        Crea un nuevo log en el sistema.

        Args:
            level: Nivel del log (INFO, WARNING, ERROR, CRITICAL).
            action: Tipo de acción realizada.
            message: Mensaje descriptivo.
            user_id: ID del usuario que realizó la acción (opcional).
            resource: Recurso afectado (opcional).
            details: Detalles adicionales en formato JSON (opcional).
            request: Request de FastAPI para extraer IP y User-Agent (opcional).

        Returns:
            Log creado.
        """
        # Enmascarar datos sensibles en details
        if details:
            details = self._mask_sensitive_data(details)

        # Extraer información del request
        ip_address = None
        user_agent = None
        if request:
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("User-Agent", "")[:500]  # Limitar tamaño

        log = Log(
            user_id=user_id,
            level=level.upper(),
            action=action,
            message=message,
            resource=resource,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return self.log_repository.create(log)

    def get_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        level: Optional[str] = None,
        action: Optional[str] = None,
        user_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> LogListResponseDTO:
        """
        Obtiene logs con paginación y filtros.

        Args:
            page: Número de página.
            page_size: Registros por página.
            level: Filtrar por nivel.
            action: Filtrar por acción.
            user_id: Filtrar por usuario.
            start_date: Fecha de inicio.
            end_date: Fecha de fin.
            search: Búsqueda por texto.

        Returns:
            Lista paginada de logs.
        """
        logs, total = self.log_repository.get_all(
            page=page,
            page_size=page_size,
            level=level,
            action=action,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            search=search,
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        # Enriquecer logs con información del usuario
        log_dtos = []
        for log in logs:
            user = (
                self.db.query(User).filter(User.user_id == log.user_id).first()
                if log.user_id
                else None
            )
            log_dto = LogReadDTO(
                id=log.id,
                user_id=log.user_id,
                user_email=user.email if user else None,
                user_name=f"{user.first_name} {user.last_name}" if user else None,
                level=log.level,
                action=log.action,
                resource=log.resource,
                message=log.message,
                details=log.details,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                created_at=log.created_at,
            )
            log_dtos.append(log_dto)

        return LogListResponseDTO(
            logs=log_dtos,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_stats(self, days: int = 30) -> LogStatsResponseDTO:
        """
        Obtiene estadísticas completas del sistema.

        Args:
            days: Número de días para estadísticas históricas.

        Returns:
            Estadísticas del sistema.
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Estadísticas de usuarios
        total_users = (
            self.db.query(func.count(User.user_id))
            .filter(User.deleted_at.is_(None))
            .scalar()
            or 0
        )
        active_users = (
            self.db.query(func.count(User.user_id))
            .filter(and_(User.deleted_at.is_(None), User.is_active.is_(True)))
            .scalar()
            or 0
        )

        # Estadísticas de consultas
        total_queries = self.db.query(func.count(QueryHistory.query_id)).scalar() or 0
        successful_queries = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(
                QueryHistory.query_status.in_(
                    [QueryStatus.TRANSLATED, QueryStatus.EXECUTED]
                )
            )
            .scalar()
            or 0
        )
        failed_queries = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(QueryHistory.query_status == QueryStatus.FAILED)
            .scalar()
            or 0
        )

        success_rate = (
            (successful_queries / total_queries * 100) if total_queries > 0 else 0
        )

        # Tiempos promedio
        avg_translation = (
            self.db.query(func.avg(QueryHistory.translation_time))
            .filter(QueryHistory.translation_time.isnot(None))
            .scalar()
        )
        avg_execution = (
            self.db.query(func.avg(QueryHistory.execution_time))
            .filter(QueryHistory.execution_time.isnot(None))
            .scalar()
        )

        # Errores y logs de hoy
        errors_today = self.log_repository.get_error_logs_today()
        logs_today = (
            self.db.query(func.count(Log.id))
            .filter(Log.created_at >= today_start)
            .scalar()
            or 0
        )

        system_stats = SystemStatsDTO(
            total_users=total_users,
            active_users=active_users,
            total_queries=total_queries,
            successful_queries=successful_queries,
            failed_queries=failed_queries,
            success_rate=round(success_rate, 2),
            avg_translation_time=(
                round(avg_translation * 1000, 2) if avg_translation else None
            ),  # En ms
            avg_execution_time=(
                round(avg_execution * 1000, 2) if avg_execution else None
            ),  # En ms
            errors_today=errors_today,
            logs_today=logs_today,
        )

        # Logs por nivel
        logs_by_level_raw = self.log_repository.get_logs_count_by_level(
            start_date=start_date
        )
        logs_by_level = [
            LogCountByLevelDTO(
                level=level,
                count=count,
                color=LEVEL_COLORS.get(level, "#64748b"),
            )
            for level, count in logs_by_level_raw.items()
        ]

        # Logs por acción
        logs_by_action_raw = self.log_repository.get_logs_count_by_action(
            start_date=start_date
        )
        logs_by_action = [
            LogCountByActionDTO(action=action, count=count)
            for action, count in logs_by_action_raw
        ]

        # Logs por día
        logs_by_day_raw = self.log_repository.get_logs_count_by_day(days=days)
        logs_by_day = [
            LogCountByDayDTO(date=date_val, count=count)
            for date_val, count in logs_by_day_raw
        ]

        # Errores recientes
        recent_errors = self.log_repository.get_recent_errors(limit=10)
        recent_errors_dto = []
        for log in recent_errors:
            user = (
                self.db.query(User).filter(User.user_id == log.user_id).first()
                if log.user_id
                else None
            )
            recent_errors_dto.append(
                LogReadDTO(
                    id=log.id,
                    user_id=log.user_id,
                    user_email=user.email if user else None,
                    user_name=f"{user.first_name} {user.last_name}" if user else None,
                    level=log.level,
                    action=log.action,
                    resource=log.resource,
                    message=log.message,
                    details=log.details,
                    ip_address=log.ip_address,
                    user_agent=log.user_agent,
                    created_at=log.created_at,
                )
            )

        # Acciones disponibles
        available_actions = self.log_repository.get_distinct_actions()

        return LogStatsResponseDTO(
            system_stats=system_stats,
            logs_by_level=logs_by_level,
            logs_by_action=logs_by_action,
            logs_by_day=logs_by_day,
            recent_errors=recent_errors_dto,
            available_actions=available_actions,
        )

    def get_usage_stats(self, days: int = 30) -> UsageStatsResponseDTO:
        """
        Obtiene estadísticas de uso del sistema (consultas, usuarios, conexiones).
        No basado en logs, sino en datos reales de uso.

        Args:
            days: Número de días para estadísticas históricas.

        Returns:
            Estadísticas de uso del sistema.
        """
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        start_date = datetime.utcnow() - timedelta(days=days)

        # ==================== Estadísticas de Usuarios ====================
        total_users = (
            self.db.query(func.count(User.user_id))
            .filter(User.deleted_at.is_(None))
            .scalar() or 0
        )

        active_users = (
            self.db.query(func.count(User.user_id))
            .filter(and_(User.deleted_at.is_(None), User.is_active.is_(True)))
            .scalar() or 0
        )

        # Usuarios que iniciaron sesión hoy (basado en last_login)
        users_logged_in_today = (
            self.db.query(func.count(User.user_id))
            .filter(
                and_(
                    User.deleted_at.is_(None),
                    User.last_login >= today_start
                )
            )
            .scalar() or 0
        )

        # Usuarios nuevos esta semana
        new_users_this_week = (
            self.db.query(func.count(User.user_id))
            .filter(
                and_(
                    User.deleted_at.is_(None),
                    User.created_at >= week_start
                )
            )
            .scalar() or 0
        )

        # ==================== Estadísticas de Consultas ====================
        total_queries = self.db.query(func.count(QueryHistory.query_id)).scalar() or 0

        queries_today = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(QueryHistory.created_at >= today_start)
            .scalar() or 0
        )

        queries_this_week = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(QueryHistory.created_at >= week_start)
            .scalar() or 0
        )

        translated_queries = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(QueryHistory.query_status == QueryStatus.TRANSLATED)
            .scalar() or 0
        )

        executed_queries = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(QueryHistory.query_status == QueryStatus.EXECUTED)
            .scalar() or 0
        )

        failed_queries = (
            self.db.query(func.count(QueryHistory.query_id))
            .filter(QueryHistory.query_status == QueryStatus.FAILED)
            .scalar() or 0
        )

        successful = translated_queries + executed_queries
        success_rate = (successful / total_queries * 100) if total_queries > 0 else 0

        # Tiempos promedio
        avg_translation = (
            self.db.query(func.avg(QueryHistory.translation_time))
            .filter(QueryHistory.translation_time.isnot(None))
            .scalar()
        )

        avg_execution = (
            self.db.query(func.avg(QueryHistory.execution_time))
            .filter(QueryHistory.execution_time.isnot(None))
            .scalar()
        )

        # ==================== Estadísticas de Conexiones ====================
        total_connections = (
            self.db.query(func.count(Connection.connection_id))
            .scalar() or 0
        )

        active_connections = (
            self.db.query(func.count(Connection.connection_id))
            .filter(Connection.is_active.is_(True))
            .scalar() or 0
        )

        # ==================== Consultas por día ====================
        queries_by_day_raw = (
            self.db.query(
                func.date(QueryHistory.created_at).label("date"),
                func.count(QueryHistory.query_id).label("total"),
                func.sum(
                    case((QueryHistory.query_status == QueryStatus.TRANSLATED, 1), else_=0)
                ).label("translated"),
                func.sum(
                    case((QueryHistory.query_status == QueryStatus.EXECUTED, 1), else_=0)
                ).label("executed"),
                func.sum(
                    case((QueryHistory.query_status == QueryStatus.FAILED, 1), else_=0)
                ).label("failed"),
            )
            .filter(QueryHistory.created_at >= start_date)
            .group_by(func.date(QueryHistory.created_at))
            .order_by(func.date(QueryHistory.created_at))
            .all()
        )

        queries_by_day = [
            QueryCountByDayDTO(
                date=row.date,
                total=row.total or 0,
                translated=row.translated or 0,
                executed=row.executed or 0,
                failed=row.failed or 0,
            )
            for row in queries_by_day_raw
        ]

        # ==================== Distribución por estado ====================
        status_colors = {
            "Traducida": "#3b82f6",   # Azul
            "Ejecutada": "#22c55e",   # Verde
            "Fallida": "#ef4444",     # Rojo
            "Pendiente": "#f59e0b",   # Amarillo
        }

        query_status_distribution = [
            QueryStatusDistributionDTO(
                status="Traducida",
                count=translated_queries,
                color=status_colors["Traducida"],
            ),
            QueryStatusDistributionDTO(
                status="Ejecutada",
                count=executed_queries,
                color=status_colors["Ejecutada"],
            ),
            QueryStatusDistributionDTO(
                status="Fallida",
                count=failed_queries,
                color=status_colors["Fallida"],
            ),
        ]

        # Construir respuesta
        usage_stats = UsageStatsDTO(
            total_users=total_users,
            active_users=active_users,
            users_logged_in_today=users_logged_in_today,
            new_users_this_week=new_users_this_week,
            total_queries=total_queries,
            queries_today=queries_today,
            queries_this_week=queries_this_week,
            translated_queries=translated_queries,
            executed_queries=executed_queries,
            failed_queries=failed_queries,
            success_rate=round(success_rate, 2),
            avg_translation_time_ms=round(avg_translation * 1000, 2) if avg_translation else None,
            avg_execution_time_ms=round(avg_execution * 1000, 2) if avg_execution else None,
            total_connections=total_connections,
            active_connections=active_connections,
        )

        return UsageStatsResponseDTO(
            stats=usage_stats,
            queries_by_day=queries_by_day,
            query_status_distribution=query_status_distribution,
        )

    def _mask_sensitive_data(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Enmascara datos sensibles en un diccionario.

        Args:
            data: Diccionario con datos.

        Returns:
            Diccionario con datos sensibles enmascarados.
        """
        data_str = str(data)
        for pattern, replacement in SENSITIVE_PATTERNS:
            data_str = re.sub(pattern, replacement, data_str, flags=re.IGNORECASE)

        # Intentar reconstruir como dict, si falla retornar string
        try:
            import ast

            return ast.literal_eval(data_str)
        except:
            return {"masked_data": data_str}

    def _get_client_ip(self, request: Request) -> str:
        """
        Obtiene la IP real del cliente, considerando proxies.

        Args:
            request: Request de FastAPI.

        Returns:
            IP del cliente.
        """
        # Verificar headers de proxy
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # IP directa
        return request.client.host if request.client else "unknown"


# Función helper para logging rápido
def log_action(
    db: Session,
    level: str,
    action: str,
    message: str,
    user_id: Optional[UUID] = None,
    resource: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> Log:
    """
    Helper para crear logs rápidamente.

    Args:
        db: Sesión de base de datos.
        level: Nivel del log.
        action: Tipo de acción.
        message: Mensaje descriptivo.
        user_id: ID del usuario (opcional).
        resource: Recurso afectado (opcional).
        details: Detalles adicionales (opcional).
        request: Request de FastAPI (opcional).

    Returns:
        Log creado.
    """
    service = LogService(db)
    return service.create_log(
        level=level,
        action=action,
        message=message,
        user_id=user_id,
        resource=resource,
        details=details,
        request=request,
    )

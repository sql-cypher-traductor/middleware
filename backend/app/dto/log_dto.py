from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, Any
from uuid import UUID


class LogBase(BaseModel):
    level: str
    action: str
    resource: Optional[str] = None
    message: str
    details: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class LogCreateDTO(LogBase):
    user_id: Optional[UUID] = None


class LogReadDTO(LogBase):
    id: UUID
    user_id: Optional[UUID]
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LogListResponseDTO(BaseModel):
    logs: list[LogReadDTO]
    total: int
    page: int
    page_size: int
    total_pages: int


class LogCountByLevelDTO(BaseModel):
    level: str
    count: int
    color: str  # Para UI


class LogCountByActionDTO(BaseModel):
    action: str
    count: int


class LogCountByDayDTO(BaseModel):
    date: date
    count: int


class SystemStatsDTO(BaseModel):
    """Estadísticas generales del sistema."""

    total_users: int
    active_users: int
    total_queries: int
    successful_queries: int
    failed_queries: int
    success_rate: float
    avg_translation_time: Optional[float]
    avg_execution_time: Optional[float]
    errors_today: int
    logs_today: int


# ==================== DTOs para Estadísticas de Uso ====================

class QueryCountByDayDTO(BaseModel):
    """Conteo de consultas por día."""
    date: date
    total: int
    translated: int
    executed: int
    failed: int


class QueryStatusDistributionDTO(BaseModel):
    """Distribución de consultas por estado."""
    status: str
    count: int
    color: str


class UsageStatsDTO(BaseModel):
    """Estadísticas de uso del sistema (sin basarse en logs)."""
    # Usuarios
    total_users: int
    active_users: int
    users_logged_in_today: int
    new_users_this_week: int

    # Consultas
    total_queries: int
    queries_today: int
    queries_this_week: int
    translated_queries: int
    executed_queries: int
    failed_queries: int
    success_rate: float

    # Tiempos promedio (en milisegundos)
    avg_translation_time_ms: Optional[float]
    avg_execution_time_ms: Optional[float]

    # Conexiones
    total_connections: int
    active_connections: int


class UsageStatsResponseDTO(BaseModel):
    """Respuesta completa de estadísticas de uso."""
    stats: UsageStatsDTO
    queries_by_day: list[QueryCountByDayDTO]
    query_status_distribution: list[QueryStatusDistributionDTO]


class LogStatsResponseDTO(BaseModel):
    """Respuesta con todas las estadísticas de logs."""

    system_stats: SystemStatsDTO
    logs_by_level: list[LogCountByLevelDTO]
    logs_by_action: list[LogCountByActionDTO]
    logs_by_day: list[LogCountByDayDTO]
    recent_errors: list[LogReadDTO]
    available_actions: list[str]

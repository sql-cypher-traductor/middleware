"""
Decorador y utilidades para logging automático de acciones.
"""

from typing import Optional
from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from ..models.log import Log


class AuditLogger:
    """
    Logger de auditoría para registrar acciones del sistema.
    """

    # Acciones predefinidas
    class Actions:
        # Autenticación
        LOGIN = "LOGIN"
        LOGIN_FAILED = "LOGIN_FAILED"
        LOGOUT = "LOGOUT"
        REGISTER = "REGISTER"
        PASSWORD_CHANGE = "PASSWORD_CHANGE"
        PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST"
        PASSWORD_RESET = "PASSWORD_RESET"

        # Perfiles de usuarios
        USER_UPDATE = "USER_UPDATE"
        USER_DELETE = "USER_DELETE"
        PROFILE_UPDATE = "PROFILE_UPDATE"

        # Configuración de conexiones
        CONNECTION_CREATE = "CONNECTION_CREATE"
        CONNECTION_UPDATE = "CONNECTION_UPDATE"
        CONNECTION_DELETE = "CONNECTION_DELETE"
        CONNECTION_TEST = "CONNECTION_TEST"

        # Traducción y ejecución de consultas
        SQL_TRANSLATION = "SQL_TRANSLATION"
        SQL_TRANSLATION_FAILED = "SQL_TRANSLATION_FAILED"
        CYPHER_EXECUTION = "CYPHER_EXECUTION"
        CYPHER_EXECUTION_FAILED = "CYPHER_EXECUTION_FAILED"

        # Administradores
        ADMIN_USER_UPDATE = "ADMIN_USER_UPDATE"
        ADMIN_USER_DELETE = "ADMIN_USER_DELETE"
        ADMIN_VIEW_LOGS = "ADMIN_VIEW_LOGS"
        ADMIN_EXPORT_LOGS = "ADMIN_EXPORT_LOGS"

        # Errores del sistema
        SYSTEM_ERROR = "SYSTEM_ERROR"
        SCHEMA_FETCH = "SCHEMA_FETCH"

    # Criticidad de la acción del log
    class Levels:
        INFO = "INFO"
        WARNING = "WARNING"
        ERROR = "ERROR"
        CRITICAL = "CRITICAL"

    @staticmethod
    def log(
        db: Session,
        level: str,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Log:
        """
        Registra un log de auditoría.

        Args:
            db: Sesión de base de datos.
            level: Nivel del log (INFO, WARNING, ERROR, CRITICAL).
            action: Tipo de acción realizada.
            message: Mensaje descriptivo.
            user_id: ID del usuario (opcional).
            resource: Recurso afectado (opcional).
            details: Detalles adicionales JSON (opcional).
            ip_address: Dirección IP del cliente (opcional).
            user_agent: User-Agent del cliente (opcional).

        Returns:
            Log creado.
        """
        # Enmascarar datos sensibles
        if details:
            details = AuditLogger._mask_sensitive(details)

        log_entry = Log(
            user_id=user_id,
            level=level.upper(),
            action=action,
            message=message,
            resource=resource,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
        )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        return log_entry

    @staticmethod
    def log_from_request(
        db: Session,
        request: Request,
        level: str,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> Log:
        """
        Registra un log extrayendo información del request.

        Args:
            db: Sesión de base de datos.
            request: Request de FastAPI.
            level: Nivel del log.
            action: Tipo de acción.
            message: Mensaje descriptivo.
            user_id: ID del usuario (opcional).
            resource: Recurso afectado (opcional).
            details: Detalles adicionales (opcional).

        Returns:
            Log creado.
        """
        ip_address = AuditLogger._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")

        return AuditLogger.log(
            db=db,
            level=level,
            action=action,
            message=message,
            user_id=user_id,
            resource=resource,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def info(
        db: Session,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> Log:
        """Logs Informativos."""
        if request:
            return AuditLogger.log_from_request(
                db,
                request,
                AuditLogger.Levels.INFO,
                action,
                message,
                user_id,
                resource,
                details,
            )
        return AuditLogger.log(
            db, AuditLogger.Levels.INFO, action, message, user_id, resource, details
        )

    @staticmethod
    def warning(
        db: Session,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> Log:
        """Logs de Advertencia."""
        if request:
            return AuditLogger.log_from_request(
                db,
                request,
                AuditLogger.Levels.WARNING,
                action,
                message,
                user_id,
                resource,
                details,
            )
        return AuditLogger.log(
            db, AuditLogger.Levels.WARNING, action, message, user_id, resource, details
        )

    @staticmethod
    def error(
        db: Session,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> Log:
        """Logs de Error."""
        if request:
            return AuditLogger.log_from_request(
                db,
                request,
                AuditLogger.Levels.ERROR,
                action,
                message,
                user_id,
                resource,
                details,
            )
        return AuditLogger.log(
            db, AuditLogger.Levels.ERROR, action, message, user_id, resource, details
        )

    @staticmethod
    def critical(
        db: Session,
        action: str,
        message: str,
        user_id: Optional[UUID] = None,
        resource: Optional[str] = None,
        details: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> Log:
        """Logs Críticos."""
        if request:
            return AuditLogger.log_from_request(
                db,
                request,
                AuditLogger.Levels.CRITICAL,
                action,
                message,
                user_id,
                resource,
                details,
            )
        return AuditLogger.log(
            db, AuditLogger.Levels.CRITICAL, action, message, user_id, resource, details
        )

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Obtiene la IP real del cliente."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    @staticmethod
    def _mask_sensitive(data: dict) -> dict:
        """Enmascara datos sensibles en el diccionario."""
        sensitive_keys = {
            "password",
            "token",
            "secret",
            "api_key",
            "authorization",
            "credential",
        }

        masked = {}
        for key, value in data.items():
            key_lower = key.lower()
            if any(s in key_lower for s in sensitive_keys):
                masked[key] = "***MASKED***"
            elif isinstance(value, dict):
                masked[key] = AuditLogger._mask_sensitive(value)
            else:
                masked[key] = value

        return masked


# Instancia global del logger
audit = AuditLogger()

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..db.database import Base
import uuid


class Log(Base):
    __tablename__ = "logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    level = Column(String, nullable=False, index=True)  # INFO, ERROR, WARNING
    action = Column(String, nullable=False, index=True)  # LOGIN, TRANSLATION_REQ
    resource = Column(String, nullable=True)  # Perfil, Conexión, etc.
    message = Column(Text, nullable=False)
    details = Column(JSONB, nullable=True)  # Datos extra de la acción
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

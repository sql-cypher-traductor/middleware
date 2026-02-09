import uuid

from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
    Enum,
    Text,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from .enums.engine_type import EngineType
from ..db.database import Base


class Connection(Base):
    __tablename__ = "connections"

    connection_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    connection_name = Column(String, nullable=False)
    engine_type = Column(Enum(EngineType), nullable=False, default=EngineType.NEO4J)
    host = Column(String, nullable=False, default="localhost")
    port = Column(Integer, nullable=False)
    database_name = Column(String, nullable=False)
    username_db = Column(String, nullable=False)
    password_db = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Connection {self.connection_name} ({self.engine_type})>"

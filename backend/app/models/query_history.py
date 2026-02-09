import uuid

from sqlalchemy import Column, Text, ForeignKey, DateTime, Float, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .enums.query_status import QueryStatus
from .enums.status_failure import FailureStage
from ..db.database import Base


class QueryHistory(Base):
    __tablename__ = "query_history"

    query_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    connection_id = Column(
        UUID(as_uuid=True),
        ForeignKey("connections.connection_id", ondelete="SET NULL"),
        nullable=True,
    )  # Puede ser nulo si solo se traduce sin ejecutar contra una DB específica
    sql_query = Column(Text, nullable=False)
    cypher_query = Column(Text, nullable=True)  # Nulo si falla la traducción
    query_status = Column(
        Enum(QueryStatus), nullable=False, default=QueryStatus.PENDING
    )
    failure_stage = Column(Enum(FailureStage), nullable=True)
    error_message = Column(Text, nullable=True)
    translation_time = Column(Float, nullable=True)
    execution_time = Column(Float, nullable=True)
    result_details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones ORM con usuarios y conexiones
    user = relationship("User", back_populates="queries")
    connection = relationship("Connection", back_populates="queries")

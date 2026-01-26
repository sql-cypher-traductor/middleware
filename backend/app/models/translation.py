from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Translation(Base):
    __tablename__ = "translation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sql_query = Column(Text, nullable=False)
    cypher_query = Column(Text, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación con Usuario
    user = relationship("User", back_populates="translations")

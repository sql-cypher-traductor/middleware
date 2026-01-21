import uuid
from sqlalchemy import Column, UUID, String, ForeignKey
from sqlalchemy.orm import relationship

from ..core.database import Base


class DbConnection(Base):
    __tablename__ = "db_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    alias = Column(String, nullable=False)
    engine = Column(String, nullable=False)
    host = Column(String, nullable=False)
    port = Column(String, nullable=False)
    username = Column(String, nullable=False)
    encrypted_password = Column(String, nullable=False)
    db_name = Column(String, nullable=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    owner = relationship("User", back_populates="connections")

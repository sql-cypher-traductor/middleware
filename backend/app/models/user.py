import uuid
from sqlalchemy import Column, UUID, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.sql.functions import now

from .enums.user_role import UserRole
from ..db.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4(), index=True
    )
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DEV)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=now
    )
    last_login = Column(DateTime(timezone=True), nullable=True)

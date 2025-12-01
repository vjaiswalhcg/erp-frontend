import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, declared_attr
import enum

from app.models.base_class import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    staff = "staff"
    viewer = "viewer"


class User(Base):
    """
    User entity with self-referential audit fields.
    
    Note: User model has its own audit fields (not using mixin)
    because the FK relationships would be self-referential and
    User is the source of truth for who created/modified records.
    
    Enterprise columns included:
    - created_at, updated_at: Timestamp tracking
    - created_by_id, last_modified_by_id: User tracking (self-referential)
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.viewer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    
    # Audit columns
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    # Self-referential - who created this user (e.g., admin creating new users)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("user.id", ondelete="SET NULL"), 
        nullable=True
    )
    last_modified_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("user.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    # Soft delete support
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    deleted_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("user.id", ondelete="SET NULL"), 
        nullable=True
    )

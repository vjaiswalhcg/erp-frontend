import uuid
from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base_class import Base
from app.models.mixins import AuditMixin, SoftDeleteMixin


class Customer(Base, AuditMixin, SoftDeleteMixin):
    """
    Customer entity with full audit trail and soft delete support.
    
    Enterprise columns included:
    - created_at, updated_at: Timestamp tracking
    - created_by_id, last_modified_by_id: User tracking
    - owner_id: Record ownership for permissions
    - is_deleted, deleted_at, deleted_by_id: Soft delete support
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    external_ref: Mapped[str | None] = mapped_column(String(128), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    billing_address: Mapped[str | None] = mapped_column(Text)
    shipping_address: Mapped[str | None] = mapped_column(Text)
    currency: Mapped[str | None] = mapped_column(String(3), default="USD")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    orders = relationship("Order", back_populates="customer", cascade="all,delete")
    invoices = relationship("Invoice", back_populates="customer", cascade="all,delete")
    payments = relationship("Payment", back_populates="customer", cascade="all,delete")
    
    # User relationships for audit fields
    created_by_user = relationship("User", foreign_keys="Customer.created_by_id", remote_side="User.id")
    last_modified_by_user = relationship("User", foreign_keys="Customer.last_modified_by_id", remote_side="User.id")
    owner_user = relationship("User", foreign_keys="Customer.owner_id", remote_side="User.id")
    deleted_by_user = relationship("User", foreign_keys="Customer.deleted_by_id", remote_side="User.id")

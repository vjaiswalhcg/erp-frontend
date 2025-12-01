import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base_class import Base
from app.models.mixins import AuditMixin, SoftDeleteMixin, LineItemAuditMixin


class PaymentStatus(str, enum.Enum):
    received = "received"
    applied = "applied"
    failed = "failed"


class Payment(Base, AuditMixin, SoftDeleteMixin):
    """
    Payment entity with full audit trail and soft delete support.
    
    Enterprise columns included:
    - created_at, updated_at: Timestamp tracking
    - created_by_id, last_modified_by_id: User tracking
    - owner_id: Record ownership for permissions
    - is_deleted, deleted_at, deleted_by_id: Soft delete support
    
    Note: received_date is a business field (when payment was received),
    while created_at is when the record was created in the system.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    external_ref: Mapped[str | None] = mapped_column(String(128), index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer.id"), nullable=False, index=True
    )
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("invoice.id"), nullable=True
    )
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    method: Mapped[str | None] = mapped_column(String(64))
    received_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.received, nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)

    # Relationships
    customer = relationship("Customer", back_populates="payments")
    applications = relationship(
        "PaymentApplication", back_populates="payment", cascade="all, delete-orphan"
    )
    
    # User relationships for audit fields
    created_by_user = relationship("User", foreign_keys="Payment.created_by_id", remote_side="User.id")
    last_modified_by_user = relationship("User", foreign_keys="Payment.last_modified_by_id", remote_side="User.id")
    owner_user = relationship("User", foreign_keys="Payment.owner_id", remote_side="User.id")
    deleted_by_user = relationship("User", foreign_keys="Payment.deleted_by_id", remote_side="User.id")


class PaymentApplication(Base, LineItemAuditMixin):
    """
    Payment Application (links payments to invoices) with lightweight audit.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment.id"), nullable=False
    )
    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("invoice.id"), nullable=False
    )
    amount_applied: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    payment = relationship("Payment", back_populates="applications")
    invoice = relationship("Invoice", back_populates="payment_applications")

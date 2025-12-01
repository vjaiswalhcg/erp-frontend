import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base_class import Base
from app.models.mixins import AuditMixin, SoftDeleteMixin, LineItemAuditMixin


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    posted = "posted"
    paid = "paid"
    written_off = "written_off"


class Invoice(Base, AuditMixin, SoftDeleteMixin):
    """
    Invoice entity with full audit trail and soft delete support.
    
    Enterprise columns included:
    - created_at, updated_at: Timestamp tracking
    - created_by_id, last_modified_by_id: User tracking
    - owner_id: Record ownership for permissions
    - is_deleted, deleted_at, deleted_by_id: Soft delete support
    
    Note: invoice_date is a business field (invoice date shown to customer),
    while created_at is when the record was created in the system.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    external_ref: Mapped[str | None] = mapped_column(String(128), index=True)
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("order.id"), nullable=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer.id"), nullable=False, index=True
    )
    invoice_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_date: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus), default=InvoiceStatus.draft, nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    subtotal: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    tax_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="invoice")
    customer = relationship("Customer", back_populates="invoices")
    lines = relationship(
        "InvoiceLine", back_populates="invoice", cascade="all, delete-orphan"
    )
    payment_applications = relationship(
        "PaymentApplication", back_populates="invoice", cascade="all, delete-orphan"
    )
    
    # User relationships for audit fields
    created_by_user = relationship("User", foreign_keys="Invoice.created_by_id", remote_side="User.id")
    last_modified_by_user = relationship("User", foreign_keys="Invoice.last_modified_by_id", remote_side="User.id")
    owner_user = relationship("User", foreign_keys="Invoice.owner_id", remote_side="User.id")
    deleted_by_user = relationship("User", foreign_keys="Invoice.deleted_by_id", remote_side="User.id")


class InvoiceLine(Base, LineItemAuditMixin):
    """
    Invoice Line Item with lightweight audit (created_at only).
    Line items are typically replaced rather than updated.
    """
    __tablename__ = "invoice_line"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("invoice.id"), nullable=False
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product.id"), nullable=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0)
    line_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)

    # Relationships
    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product", back_populates="invoice_lines")

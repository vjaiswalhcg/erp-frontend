import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base_class import Base


class PaymentStatus(str, enum.Enum):
    received = "received"
    applied = "applied"
    failed = "failed"


class Payment(Base):
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

    customer = relationship("Customer", back_populates="payments")
    applications = relationship(
        "PaymentApplication", back_populates="payment", cascade="all, delete-orphan"
    )


class PaymentApplication(Base):
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

    payment = relationship("Payment", back_populates="applications")
    invoice = relationship("Invoice", back_populates="payment_applications")

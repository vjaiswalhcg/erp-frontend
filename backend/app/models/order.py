import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base_class import Base


class OrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    fulfilled = "fulfilled"
    closed = "closed"


class Order(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    external_ref: Mapped[str | None] = mapped_column(String(128), index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer.id"), nullable=False, index=True
    )
    order_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.draft, nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    subtotal: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    tax_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer = relationship("Customer", back_populates="orders")
    lines = relationship(
        "OrderLine", back_populates="order", cascade="all, delete-orphan"
    )
    invoice = relationship("Invoice", back_populates="order", uselist=False)


class OrderLine(Base):
    __tablename__ = "order_line"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("order.id"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product.id"), nullable=False
    )
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0)  # e.g., 0.18
    line_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)

    order = relationship("Order", back_populates="lines")
    product = relationship("Product", back_populates="order_lines")


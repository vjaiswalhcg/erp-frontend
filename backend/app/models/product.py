import uuid
from sqlalchemy import String, Text, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base_class import Base


class Product(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    uom: Mapped[str | None] = mapped_column(String(32))
    price: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    tax_code: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    order_lines = relationship("OrderLine", back_populates="product")
    invoice_lines = relationship("InvoiceLine", back_populates="product")


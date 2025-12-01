import uuid
from sqlalchemy import String, Text, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base_class import Base
from app.models.mixins import AuditMixin, SoftDeleteMixin


class Product(Base, AuditMixin, SoftDeleteMixin):
    """
    Product entity with full audit trail and soft delete support.
    
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
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    uom: Mapped[str | None] = mapped_column(String(32))
    price: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    tax_code: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    order_lines = relationship("OrderLine", back_populates="product")
    invoice_lines = relationship("InvoiceLine", back_populates="product")

import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field, validator

from app.models.order import OrderStatus
from app.schemas.customer import CustomerOut
from app.schemas.product import ProductOut


class OrderLineCreate(BaseModel):
    product_id: uuid.UUID
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_rate: float = Field(default=0, ge=0)


class OrderLineOut(OrderLineCreate):
    id: uuid.UUID
    line_total: float
    product: ProductOut | None = None
    # Line item audit
    created_at: datetime | None = None

    class Config:
        orm_mode = True


class OrderBase(BaseModel):
    external_ref: str | None = None
    customer_id: uuid.UUID
    currency: str = "USD"
    order_date: datetime | date | str | None = None
    status: OrderStatus = OrderStatus.draft
    notes: str | None = None

    @validator("order_date", pre=True)
    def _coerce_order_date(cls, v):
        if v in (None, ""):
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                try:
                    d = date.fromisoformat(v)
                    return datetime.combine(d, datetime.min.time())
                except ValueError:
                    raise ValueError("Invalid date format")
        return v


class OrderCreate(OrderBase):
    lines: list[OrderLineCreate]
    # Optional: allow specifying owner on create (defaults to creator)
    owner_id: uuid.UUID | None = None


class OrderUpdate(BaseModel):
    """All fields optional for partial updates"""
    external_ref: str | None = None
    customer_id: uuid.UUID | None = None
    currency: str | None = None
    order_date: datetime | date | str | None = None
    status: OrderStatus | None = None
    notes: str | None = None
    lines: list[OrderLineCreate] | None = None
    owner_id: uuid.UUID | None = None  # Allow transferring ownership

    @validator("order_date", pre=True)
    def _coerce_order_date(cls, v):
        if v in (None, ""):
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                try:
                    d = date.fromisoformat(v)
                    return datetime.combine(d, datetime.min.time())
                except ValueError:
                    raise ValueError("Invalid date format")
        return v


class OrderOut(OrderBase):
    id: uuid.UUID
    order_date: datetime
    status: OrderStatus
    subtotal: float
    tax_total: float
    total: float
    lines: list[OrderLineOut] = []
    customer: CustomerOut | None = None
    # Audit fields
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID | None = None
    last_modified_by_id: uuid.UUID | None = None
    owner_id: uuid.UUID | None = None
    # Soft delete fields
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by_id: uuid.UUID | None = None

    class Config:
        orm_mode = True


class OrderUpdateStatus(BaseModel):
    status: OrderStatus

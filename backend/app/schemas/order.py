import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class OrderLineCreate(BaseModel):
    product_id: uuid.UUID
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_rate: float = Field(default=0, ge=0)


class OrderLineOut(OrderLineCreate):
    id: uuid.UUID
    line_total: float

    class Config:
        orm_mode = True


class OrderBase(BaseModel):
    external_ref: str | None = None
    customer_id: uuid.UUID
    currency: str = "USD"


class OrderCreate(OrderBase):
    lines: list[OrderLineCreate]


class OrderOut(OrderBase):
    id: uuid.UUID
    order_date: datetime
    status: OrderStatus
    subtotal: float
    tax_total: float
    total: float
    lines: list[OrderLineOut] = []

    class Config:
        orm_mode = True


class OrderUpdateStatus(BaseModel):
    status: OrderStatus


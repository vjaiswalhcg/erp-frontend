import uuid
from datetime import datetime
from pydantic import BaseModel, Field

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

    class Config:
        orm_mode = True


class OrderBase(BaseModel):
    external_ref: str | None = None
    customer_id: uuid.UUID
    currency: str = "USD"
    order_date: datetime | None = None
    status: OrderStatus = OrderStatus.draft


class OrderCreate(OrderBase):
    lines: list[OrderLineCreate]


class OrderUpdate(OrderBase):
    lines: list[OrderLineCreate] | None = None
    notes: str | None = None


class OrderOut(OrderBase):
    id: uuid.UUID
    order_date: datetime
    status: OrderStatus
    subtotal: float
    tax_total: float
    total: float
    lines: list[OrderLineOut] = []
    customer: CustomerOut | None = None

    class Config:
        orm_mode = True


class OrderUpdateStatus(BaseModel):
    status: OrderStatus

import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.invoice import InvoiceStatus


class InvoiceLineCreate(BaseModel):
    product_id: uuid.UUID
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_rate: float = Field(default=0, ge=0)


class InvoiceLineOut(InvoiceLineCreate):
    id: uuid.UUID
    line_total: float

    class Config:
        orm_mode = True


class InvoiceBase(BaseModel):
    external_ref: str | None = None
    order_id: uuid.UUID | None = None
    customer_id: uuid.UUID
    currency: str = "USD"
    due_date: datetime | None = None


class InvoiceCreate(InvoiceBase):
    lines: list[InvoiceLineCreate] | None = None


class InvoiceOut(InvoiceBase):
    id: uuid.UUID
    invoice_date: datetime
    status: InvoiceStatus
    subtotal: float
    tax_total: float
    total: float
    lines: list[InvoiceLineOut] = []

    class Config:
        orm_mode = True


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus


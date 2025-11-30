import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field, validator

from app.models.invoice import InvoiceStatus
from app.schemas.customer import CustomerOut
from app.schemas.product import ProductOut
from app.schemas.customer import CustomerOut
from app.schemas.product import ProductOut


class InvoiceLineCreate(BaseModel):
    product_id: uuid.UUID | None = None
    description: str | None = None
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_rate: float = Field(default=0, ge=0)


class InvoiceLineOut(InvoiceLineCreate):
    id: uuid.UUID
    line_total: float
    product: ProductOut | None = None

    class Config:
        orm_mode = True


class InvoiceBase(BaseModel):
    external_ref: str | None = None
    order_id: uuid.UUID | None = None
    customer_id: uuid.UUID
    currency: str = "USD"
    due_date: datetime | None = None
    invoice_date: datetime | date | str | None = None
    notes: str | None = None

    @validator("invoice_date", "due_date", pre=True)
    def _coerce_dates(cls, v):
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


class InvoiceCreate(InvoiceBase):
    lines: list[InvoiceLineCreate] | None = None


class InvoiceUpdate(InvoiceBase):
    lines: list[InvoiceLineCreate] | None = None


class InvoiceOut(InvoiceBase):
    id: uuid.UUID
    invoice_date: datetime
    status: InvoiceStatus
    subtotal: float
    tax_total: float
    total: float
    lines: list[InvoiceLineOut] = []
    customer: CustomerOut | None = None

    class Config:
        orm_mode = True


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus


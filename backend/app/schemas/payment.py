import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.payment import PaymentStatus


class PaymentBase(BaseModel):
    external_ref: str | None = None
    customer_id: uuid.UUID
    invoice_id: uuid.UUID | None = None
    amount: float = Field(gt=0)
    currency: str = "USD"
    method: str | None = None
    note: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentOut(PaymentBase):
    id: uuid.UUID
    status: PaymentStatus
    received_date: datetime

    class Config:
        orm_mode = True


class PaymentApplicationCreate(BaseModel):
    invoice_id: uuid.UUID
    amount_applied: float = Field(gt=0)


class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus


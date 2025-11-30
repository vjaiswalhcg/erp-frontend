import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field, validator

from app.models.payment import PaymentStatus
from app.schemas.customer import CustomerOut


class PaymentBase(BaseModel):
    external_ref: str | None = None
    customer_id: uuid.UUID
    invoice_id: uuid.UUID | None = None
    amount: float = Field(gt=0)
    currency: str = "USD"
    method: str | None = None
    note: str | None = None
    received_date: datetime | date | str | None = None

    @validator("received_date", pre=True)
    def _coerce_date(cls, v):
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


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(PaymentBase):
    status: PaymentStatus | None = None


class PaymentOut(PaymentBase):
    id: uuid.UUID
    status: PaymentStatus
    received_date: datetime
    customer: CustomerOut | None = None

    class Config:
        orm_mode = True


class PaymentApplicationCreate(BaseModel):
    invoice_id: uuid.UUID
    amount_applied: float = Field(gt=0)


class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus


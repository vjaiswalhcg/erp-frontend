import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field, validator

from app.models.payment import PaymentStatus
from app.schemas.customer import CustomerOut
from app.schemas.user import UserInfo


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
    # Optional: allow specifying owner on create (defaults to creator)
    owner_id: uuid.UUID | None = None


class PaymentUpdate(BaseModel):
    """All fields optional for partial updates"""
    external_ref: str | None = None
    customer_id: uuid.UUID | None = None
    invoice_id: uuid.UUID | None = None
    amount: float | None = None
    currency: str | None = None
    method: str | None = None
    note: str | None = None
    received_date: datetime | date | str | None = None
    status: PaymentStatus | None = None
    owner_id: uuid.UUID | None = None  # Allow transferring ownership

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


class PaymentOut(PaymentBase):
    id: uuid.UUID
    status: PaymentStatus
    received_date: datetime
    customer: CustomerOut | None = None
    # Audit fields
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID | None = None
    last_modified_by_id: uuid.UUID | None = None
    owner_id: uuid.UUID | None = None
    # User objects for display
    created_by: UserInfo | None = None
    last_modified_by: UserInfo | None = None
    owner: UserInfo | None = None
    # Soft delete fields
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by_id: uuid.UUID | None = None
    deleted_by: UserInfo | None = None

    class Config:
        orm_mode = True


class PaymentApplicationCreate(BaseModel):
    invoice_id: uuid.UUID
    amount_applied: float = Field(gt=0)


class PaymentApplicationOut(PaymentApplicationCreate):
    id: uuid.UUID
    payment_id: uuid.UUID
    created_at: datetime | None = None

    class Config:
        orm_mode = True


class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus

import uuid
from pydantic import BaseModel, EmailStr, Field


class CustomerBase(BaseModel):
    external_ref: str | None = Field(default=None, max_length=128)
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    billing_address: str | None = None
    shipping_address: str | None = None
    currency: str | None = Field(default="USD", max_length=3)
    is_active: bool = True


class CustomerCreate(CustomerBase):
    name: str


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: uuid.UUID

    class Config:
        orm_mode = True


import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
from app.schemas.user import UserInfo


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
    # Optional: allow specifying owner on create (defaults to creator)
    owner_id: uuid.UUID | None = None


class CustomerUpdate(BaseModel):
    """All fields optional for partial updates"""
    external_ref: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    billing_address: str | None = None
    shipping_address: str | None = None
    currency: str | None = None
    is_active: bool | None = None
    owner_id: uuid.UUID | None = None  # Allow transferring ownership


class CustomerOut(CustomerBase):
    id: uuid.UUID
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

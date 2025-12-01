import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    external_ref: str | None = None
    sku: str
    name: str
    description: str | None = None
    uom: str | None = None
    price: float
    tax_code: str | None = None
    is_active: bool = True


class ProductCreate(ProductBase):
    # Optional: allow specifying owner on create (defaults to creator)
    owner_id: uuid.UUID | None = None


class ProductUpdate(BaseModel):
    """All fields optional for partial updates"""
    external_ref: str | None = None
    sku: str | None = None
    name: str | None = None
    description: str | None = None
    uom: str | None = None
    price: float | None = None
    tax_code: str | None = None
    is_active: bool | None = None
    owner_id: uuid.UUID | None = None  # Allow transferring ownership


class ProductOut(ProductBase):
    id: uuid.UUID
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
        from_attributes = True

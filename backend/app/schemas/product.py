import uuid
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
    pass


class ProductUpdate(BaseModel):
    external_ref: str | None = None
    name: str | None = None
    description: str | None = None
    uom: str | None = None
    price: float | None = None
    tax_code: str | None = None
    is_active: bool | None = None


class ProductOut(ProductBase):
    id: uuid.UUID

    class Config:
        orm_mode = True


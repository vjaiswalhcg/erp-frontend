from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.deps import set_audit_fields_on_create, set_audit_fields_on_update, set_soft_delete_fields
from app.core.config import settings
from app.core.security import get_current_user
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(dependencies=[Depends(deps.get_auth)])


@router.get("/", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
    include_deleted: bool = Query(default=False, description="Include soft-deleted records"),
):
    """List all products. By default excludes soft-deleted records."""
    query = select(Product)
    if not include_deleted:
        query = query.where(Product.is_deleted == False)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ProductOut)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new product with audit trail."""
    data = payload.dict(exclude_unset=True)
    product = Product(**data)
    
    # Set audit fields
    set_audit_fields_on_create(product, current_user)
    
    # Allow setting owner_id from payload if provided
    if payload.owner_id:
        product.owner_id = payload.owner_id
    
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: AsyncSession = Depends(deps.get_session)):
    """Get a product by ID."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Update a product with audit trail."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update a deleted product")
    
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(product, field, value)
    
    # Set audit fields
    set_audit_fields_on_update(product, current_user)
    
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
    hard_delete: bool = Query(default=False, description="Permanently delete instead of soft delete"),
):
    """
    Delete a product.
    
    By default, performs a soft delete (sets is_deleted=True).
    Use hard_delete=True to permanently remove the record.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if hard_delete:
        await db.delete(product)
    else:
        set_soft_delete_fields(product, current_user)
    
    await db.commit()
    return None


@router.post("/{product_id}/restore", response_model=ProductOut)
async def restore_product(
    product_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Restore a soft-deleted product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.is_deleted:
        raise HTTPException(status_code=400, detail="Product is not deleted")
    
    product.is_deleted = False
    product.deleted_at = None
    product.deleted_by_id = None
    set_audit_fields_on_update(product, current_user)
    
    await db.commit()
    await db.refresh(product)
    return product

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Any

from app.api import deps
from app.api.deps import set_audit_fields_on_create, set_audit_fields_on_update, set_soft_delete_fields
from app.core.config import settings
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate


def map_customer_to_out(customer: Customer) -> dict[str, Any]:
    """Map customer model to output dict with user relationships"""
    data = {
        "id": customer.id,
        "external_ref": customer.external_ref,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "billing_address": customer.billing_address,
        "shipping_address": customer.shipping_address,
        "currency": customer.currency,
        "is_active": customer.is_active,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "created_by_id": customer.created_by_id,
        "last_modified_by_id": customer.last_modified_by_id,
        "owner_id": customer.owner_id,
        "is_deleted": customer.is_deleted,
        "deleted_at": customer.deleted_at,
        "deleted_by_id": customer.deleted_by_id,
    }
    # Map user relationships (serialize to dict)
    from app.schemas.user import UserInfo
    if customer.created_by_user:
        data["created_by"] = UserInfo.from_orm(customer.created_by_user).dict()
    if customer.last_modified_by_user:
        data["last_modified_by"] = UserInfo.from_orm(customer.last_modified_by_user).dict()
    if customer.owner_user:
        data["owner"] = UserInfo.from_orm(customer.owner_user).dict()
    if customer.deleted_by_user:
        data["deleted_by"] = UserInfo.from_orm(customer.deleted_by_user).dict()
    return data

router = APIRouter(dependencies=[Depends(deps.get_auth)])


@router.get("/", response_model=list[CustomerOut])
async def list_customers(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
    include_deleted: bool = Query(default=False, description="Include soft-deleted records"),
):
    """List all customers. By default excludes soft-deleted records."""
    query = (
        select(Customer)
        .options(
            selectinload(Customer.created_by_user),
            selectinload(Customer.last_modified_by_user),
            selectinload(Customer.owner_user),
            selectinload(Customer.deleted_by_user),
        )
    )
    if not include_deleted:
        query = query.where(Customer.is_deleted == False)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    customers = result.scalars().all()
    return [CustomerOut(**map_customer_to_out(customer)) for customer in customers]


@router.post("/", response_model=CustomerOut)
async def create_customer(
    payload: CustomerCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new customer with audit trail."""
    data = payload.dict(exclude_unset=True)
    customer = Customer(**data)
    
    # Set audit fields
    set_audit_fields_on_create(customer, current_user)
    
    # Allow setting owner_id from payload if provided
    if payload.owner_id:
        customer.owner_id = payload.owner_id
    
    db.add(customer)
    await db.commit()
    await db.refresh(customer, ["created_by_user", "last_modified_by_user", "owner_user", "deleted_by_user"])
    return CustomerOut(**map_customer_to_out(customer))


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: str, db: AsyncSession = Depends(deps.get_session)):
    """Get a customer by ID."""
    query = (
        select(Customer)
        .options(
            selectinload(Customer.created_by_user),
            selectinload(Customer.last_modified_by_user),
            selectinload(Customer.owner_user),
            selectinload(Customer.deleted_by_user),
        )
        .where(Customer.id == customer_id)
    )
    result = await db.execute(query)
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerOut(**map_customer_to_out(customer))


@router.put("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Update a customer with audit trail."""
    query = (
        select(Customer)
        .options(
            selectinload(Customer.created_by_user),
            selectinload(Customer.last_modified_by_user),
            selectinload(Customer.owner_user),
            selectinload(Customer.deleted_by_user),
        )
        .where(Customer.id == customer_id)
    )
    result = await db.execute(query)
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if customer.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update a deleted customer")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(customer, field, value)
    
    # Set audit fields
    set_audit_fields_on_update(customer, current_user)
    
    await db.commit()
    await db.refresh(customer, ["created_by_user", "last_modified_by_user", "owner_user", "deleted_by_user"])
    return CustomerOut(**map_customer_to_out(customer))


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
    hard_delete: bool = Query(default=False, description="Permanently delete instead of soft delete"),
):
    """
    Delete a customer.
    
    By default, performs a soft delete (sets is_deleted=True).
    Use hard_delete=True to permanently remove the record.
    """
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if hard_delete:
        await db.delete(customer)
    else:
        set_soft_delete_fields(customer, current_user)
    
    await db.commit()
    return None


@router.post("/{customer_id}/restore", response_model=CustomerOut)
async def restore_customer(
    customer_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Restore a soft-deleted customer."""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if not customer.is_deleted:
        raise HTTPException(status_code=400, detail="Customer is not deleted")
    
    customer.is_deleted = False
    customer.deleted_at = None
    customer.deleted_by_id = None
    set_audit_fields_on_update(customer, current_user)
    
    await db.commit()
    await db.refresh(customer, ["created_by_user", "last_modified_by_user", "owner_user", "deleted_by_user"])
    return CustomerOut(**map_customer_to_out(customer))

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate

router = APIRouter(dependencies=[Depends(deps.get_auth)])


@router.get("/", response_model=list[CustomerOut])
async def list_customers(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
):
    result = await db.execute(select(Customer).offset(offset).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=CustomerOut)
async def create_customer(
    payload: CustomerCreate, db: AsyncSession = Depends(deps.get_session)
):
    customer = Customer(**payload.dict())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: str, db: AsyncSession = Depends(deps.get_session)):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(deps.get_session),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(customer, field, value)
    await db.commit()
    await db.refresh(customer)
    return customer


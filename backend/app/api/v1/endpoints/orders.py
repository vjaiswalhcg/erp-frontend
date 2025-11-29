from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import settings
from app.models.customer import Customer
from app.models.order import Order, OrderLine, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderOut, OrderUpdateStatus

router = APIRouter(dependencies=[deps.get_auth()])


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
):
    result = await db.execute(select(Order).offset(offset).limit(limit))
    return result.scalars().unique().all()


@router.post("/", response_model=OrderOut)
async def create_order(
    payload: OrderCreate, db: AsyncSession = Depends(deps.get_session)
):
    customer = await db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Invalid customer")

    # Validate products and compute totals
    subtotal = 0
    tax_total = 0
    lines: list[OrderLine] = []
    for line in payload.lines:
        product = await db.get(Product, line.product_id)
        if not product:
            raise HTTPException(
                status_code=400, detail=f"Invalid product {line.product_id}"
            )
        line_total = float(line.quantity) * float(line.unit_price)
        tax_amount = line_total * float(line.tax_rate)
        subtotal += line_total
        tax_total += tax_amount
        lines.append(
            OrderLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=line.tax_rate,
                line_total=line_total + tax_amount,
            )
        )

    order = Order(
        external_ref=payload.external_ref,
        customer_id=payload.customer_id,
        currency=payload.currency,
        subtotal=subtotal,
        tax_total=tax_total,
        total=subtotal + tax_total,
        lines=lines,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order, ["lines"])
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: AsyncSession = Depends(deps.get_session)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/confirm", response_model=OrderOut)
async def confirm_order(order_id: str, db: AsyncSession = Depends(deps.get_session)):
    return await _transition_order(order_id, OrderStatus.confirmed, db)


@router.post("/{order_id}/fulfill", response_model=OrderOut)
async def fulfill_order(order_id: str, db: AsyncSession = Depends(deps.get_session)):
    return await _transition_order(order_id, OrderStatus.fulfilled, db)


async def _transition_order(
    order_id: str, next_status: OrderStatus, db: AsyncSession
) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == OrderStatus.closed:
        raise HTTPException(status_code=400, detail="Order already closed")
    order.status = next_status
    await db.commit()
    await db.refresh(order)
    return order


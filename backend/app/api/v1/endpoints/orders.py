from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.responses import Response

from app.api import deps
from app.api.deps import set_audit_fields_on_create, set_audit_fields_on_update, set_soft_delete_fields
from app.core.config import settings
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.order import Order, OrderLine, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderUpdate, OrderUpdateStatus

router = APIRouter(dependencies=[Depends(deps.get_auth)])


def _normalize_order_date(value: datetime | str | None) -> datetime:
    if value is None:
        return datetime.utcnow()
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, datetime.min.time())
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            # try bare date
            try:
                parsed_date = date.fromisoformat(value)
                return datetime.combine(parsed_date, datetime.min.time())
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid order_date format")
        # store naive UTC to match existing column
        return parsed.replace(tzinfo=None)
    return value.replace(tzinfo=None)


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
    include_deleted: bool = Query(default=False, description="Include soft-deleted records"),
):
    """List all orders. By default excludes soft-deleted records."""
    query = select(Order).options(
        selectinload(Order.lines),
        selectinload(Order.customer),
        selectinload(Order.lines).selectinload(OrderLine.product),
    )
    if not include_deleted:
        query = query.where(Order.is_deleted == False)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.post("/", response_model=OrderOut)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new order with audit trail."""
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
        order_date=_normalize_order_date(payload.order_date),
        status=payload.status,
        currency=payload.currency,
        subtotal=subtotal,
        tax_total=tax_total,
        total=subtotal + tax_total,
        notes=payload.notes,
        lines=lines,
    )
    
    # Set audit fields
    set_audit_fields_on_create(order, current_user)
    
    # Allow setting owner_id from payload if provided
    if payload.owner_id:
        order.owner_id = payload.owner_id
    
    db.add(order)
    await db.commit()
    query = (
        select(Order)
        .options(
            selectinload(Order.lines).selectinload(OrderLine.product),
            selectinload(Order.customer),
        )
        .where(Order.id == order.id)
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.delete("/{order_id}", status_code=204)
async def delete_order(
    order_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
    hard_delete: bool = Query(default=False, description="Permanently delete instead of soft delete"),
):
    """
    Delete an order.
    
    By default, performs a soft delete (sets is_deleted=True).
    Use hard_delete=True to permanently remove the record.
    """
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if hard_delete:
        await db.delete(order)
    else:
        set_soft_delete_fields(order, current_user)
    
    await db.commit()
    return Response(status_code=204)


@router.put("/{order_id}", response_model=OrderOut)
async def update_order(
    order_id: str,
    payload: OrderUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Update an order with audit trail."""
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.lines),
            selectinload(Order.customer),
            selectinload(Order.lines).selectinload(OrderLine.product),
        )
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update a deleted order")

    # Only validate customer if it's being changed
    if payload.customer_id:
        customer = await db.get(Customer, payload.customer_id)
        if not customer:
            raise HTTPException(status_code=400, detail="Invalid customer")
        order.customer_id = payload.customer_id

    if payload.lines is not None:
        new_lines: list[OrderLine] = []
        subtotal = 0
        tax_total = 0
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
            new_lines.append(
                OrderLine(
                    product_id=line.product_id,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    tax_rate=line.tax_rate,
                    line_total=line_total + tax_amount,
                )
            )
        order.lines = new_lines
        order.subtotal = subtotal
        order.tax_total = tax_total
        order.total = subtotal + tax_total

    if payload.external_ref is not None:
        order.external_ref = payload.external_ref
    if payload.order_date is not None:
        order.order_date = _normalize_order_date(payload.order_date)
    if payload.status is not None:
        order.status = payload.status
    if payload.currency is not None:
        order.currency = payload.currency
    if payload.notes is not None:
        order.notes = payload.notes
    if payload.owner_id is not None:
        order.owner_id = payload.owner_id

    # Set audit fields
    set_audit_fields_on_update(order, current_user)

    await db.commit()
    await db.refresh(order, ["lines", "customer"])
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: AsyncSession = Depends(deps.get_session)):
    """Get an order by ID."""
    query = (
        select(Order)
        .options(
            selectinload(Order.lines),
            selectinload(Order.customer),
            selectinload(Order.lines).selectinload(OrderLine.product),
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/confirm", response_model=OrderOut)
async def confirm_order(
    order_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Confirm an order."""
    return await _transition_order(order_id, OrderStatus.confirmed, db, current_user)


@router.post("/{order_id}/fulfill", response_model=OrderOut)
async def fulfill_order(
    order_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Fulfill an order."""
    return await _transition_order(order_id, OrderStatus.fulfilled, db, current_user)


@router.post("/{order_id}/restore", response_model=OrderOut)
async def restore_order(
    order_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Restore a soft-deleted order."""
    query = (
        select(Order)
        .options(
            selectinload(Order.lines),
            selectinload(Order.customer),
            selectinload(Order.lines).selectinload(OrderLine.product),
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order.is_deleted:
        raise HTTPException(status_code=400, detail="Order is not deleted")
    
    order.is_deleted = False
    order.deleted_at = None
    order.deleted_by_id = None
    set_audit_fields_on_update(order, current_user)
    
    await db.commit()
    await db.refresh(order, ["lines", "customer"])
    return order


async def _transition_order(
    order_id: str, next_status: OrderStatus, db: AsyncSession, current_user: User
) -> Order:
    """Transition an order to a new status."""
    query = (
        select(Order)
        .options(
            selectinload(Order.lines),
            selectinload(Order.customer),
            selectinload(Order.lines).selectinload(OrderLine.product),
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot modify a deleted order")
    if order.status == OrderStatus.closed:
        raise HTTPException(status_code=400, detail="Order already closed")
    
    order.status = next_status
    set_audit_fields_on_update(order, current_user)
    
    await db.commit()
    await db.refresh(order, ["lines", "customer"])
    return order

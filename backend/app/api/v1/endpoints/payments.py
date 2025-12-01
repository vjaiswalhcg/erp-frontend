from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.deps import set_audit_fields_on_create, set_audit_fields_on_update, set_soft_delete_fields
from app.core.config import settings
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment, PaymentApplication, PaymentStatus
from app.models.user import User
from app.schemas.payment import (
    PaymentApplicationCreate,
    PaymentCreate,
    PaymentOut,
    PaymentUpdate,
)

router = APIRouter(dependencies=[Depends(deps.get_auth)])


@router.get("/", response_model=list[PaymentOut])
async def list_payments(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
    include_deleted: bool = Query(default=False, description="Include soft-deleted records"),
):
    """List all payments. By default excludes soft-deleted records."""
    query = select(Payment).options(selectinload(Payment.customer))
    if not include_deleted:
        query = query.where(Payment.is_deleted == False)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.post("/", response_model=PaymentOut)
async def create_payment(
    payload: PaymentCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new payment with audit trail."""
    customer = await db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Invalid customer")

    if payload.invoice_id:
        invoice = await db.get(Invoice, payload.invoice_id)
        if not invoice:
            raise HTTPException(status_code=400, detail="Invalid invoice")

    data = payload.model_dump(exclude_unset=True)
    payment = Payment(**data)
    
    # Set audit fields
    set_audit_fields_on_create(payment, current_user)
    
    # Allow setting owner_id from payload if provided
    if payload.owner_id:
        payment.owner_id = payload.owner_id
    
    db.add(payment)
    await db.commit()
    await db.refresh(payment, ["customer"])
    return payment


@router.post("/{payment_id}/apply", response_model=PaymentOut)
async def apply_payment(
    payment_id: str,
    application: PaymentApplicationCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Apply a payment to an invoice."""
    query = (
        select(Payment)
        .options(selectinload(Payment.customer))
        .where(Payment.id == payment_id)
    )
    result = await db.execute(query)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot apply a deleted payment")

    invoice = await db.get(Invoice, application.invoice_id)
    if not invoice:
        raise HTTPException(status_code=400, detail="Invalid invoice")

    # Check remaining unapplied
    applied_result = await db.execute(
        select(func.coalesce(func.sum(PaymentApplication.amount_applied), 0)).where(
            PaymentApplication.payment_id == payment.id
        )
    )
    applied_total = float(applied_result.scalar_one())
    remaining = float(payment.amount) - applied_total
    if application.amount_applied > remaining:
        raise HTTPException(status_code=400, detail="Amount exceeds remaining balance")

    pa = PaymentApplication(
        payment_id=payment.id,
        invoice_id=invoice.id,
        amount_applied=application.amount_applied,
    )
    db.add(pa)
    if remaining - application.amount_applied <= 0:
        payment.status = PaymentStatus.applied
    
    # Update audit fields on payment
    set_audit_fields_on_update(payment, current_user)
    
    await db.commit()
    await db.refresh(payment, ["customer"])
    return payment


@router.put("/{payment_id}", response_model=PaymentOut)
async def update_payment(
    payment_id: str,
    payload: PaymentUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Update a payment with audit trail."""
    query = (
        select(Payment)
        .options(selectinload(Payment.customer))
        .where(Payment.id == payment_id)
    )
    result = await db.execute(query)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update a deleted payment")

    # Only validate if customer_id is being changed
    if payload.customer_id:
        customer = await db.get(Customer, payload.customer_id)
        if not customer:
            raise HTTPException(status_code=400, detail="Invalid customer")
        payment.customer_id = payload.customer_id

    if payload.invoice_id:
        invoice = await db.get(Invoice, payload.invoice_id)
        if not invoice:
            raise HTTPException(status_code=400, detail="Invalid invoice")
        payment.invoice_id = payload.invoice_id

    if payload.external_ref is not None:
        payment.external_ref = payload.external_ref
    if payload.amount is not None:
        payment.amount = payload.amount
    if payload.currency is not None:
        payment.currency = payload.currency
    if payload.method is not None:
        payment.method = payload.method
    if payload.note is not None:
        payment.note = payload.note
    if payload.received_date is not None:
        payment.received_date = payload.received_date
    if payload.status is not None:
        payment.status = payload.status
    if payload.owner_id is not None:
        payment.owner_id = payload.owner_id

    # Set audit fields
    set_audit_fields_on_update(payment, current_user)

    await db.commit()
    await db.refresh(payment, ["customer"])
    return payment


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(
    payment_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
    hard_delete: bool = Query(default=False, description="Permanently delete instead of soft delete"),
):
    """
    Delete a payment.
    
    By default, performs a soft delete (sets is_deleted=True).
    Use hard_delete=True to permanently remove the record.
    """
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if hard_delete:
        await db.delete(payment)
    else:
        set_soft_delete_fields(payment, current_user)
    
    await db.commit()
    return Response(status_code=204)


@router.post("/{payment_id}/restore", response_model=PaymentOut)
async def restore_payment(
    payment_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Restore a soft-deleted payment."""
    query = (
        select(Payment)
        .options(selectinload(Payment.customer))
        .where(Payment.id == payment_id)
    )
    result = await db.execute(query)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if not payment.is_deleted:
        raise HTTPException(status_code=400, detail="Payment is not deleted")
    
    payment.is_deleted = False
    payment.deleted_at = None
    payment.deleted_by_id = None
    set_audit_fields_on_update(payment, current_user)
    
    await db.commit()
    await db.refresh(payment, ["customer"])
    return payment

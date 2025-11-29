from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment, PaymentApplication, PaymentStatus
from app.schemas.payment import (
    PaymentApplicationCreate,
    PaymentCreate,
    PaymentOut,
)

router = APIRouter(dependencies=[deps.get_auth()])


@router.get("/", response_model=list[PaymentOut])
async def list_payments(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
):
    result = await db.execute(select(Payment).offset(offset).limit(limit))
    return result.scalars().unique().all()


@router.post("/", response_model=PaymentOut)
async def create_payment(
    payload: PaymentCreate, db: AsyncSession = Depends(deps.get_session)
):
    customer = await db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Invalid customer")

    if payload.invoice_id:
        invoice = await db.get(Invoice, payload.invoice_id)
        if not invoice:
            raise HTTPException(status_code=400, detail="Invalid invoice")

    payment = Payment(**payload.dict())
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/{payment_id}/apply", response_model=PaymentOut)
async def apply_payment(
    payment_id: str,
    application: PaymentApplicationCreate,
    db: AsyncSession = Depends(deps.get_session),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

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
    await db.commit()
    await db.refresh(payment)
    return payment


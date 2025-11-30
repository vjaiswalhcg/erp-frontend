from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import settings
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment, PaymentApplication, PaymentStatus
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
):
    query = (
        select(Payment)
        .options(selectinload(Payment.customer))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
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
    await db.refresh(payment, ["customer"])
    return payment


@router.post("/{payment_id}/apply", response_model=PaymentOut)
async def apply_payment(
    payment_id: str,
    application: PaymentApplicationCreate,
    db: AsyncSession = Depends(deps.get_session),
):
    query = (
        select(Payment)
        .options(selectinload(Payment.customer))
        .where(Payment.id == payment_id)
    )
    result = await db.execute(query)
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
    await db.refresh(payment, ["customer"])
    return payment


@router.put("/{payment_id}", response_model=PaymentOut)
async def update_payment(
    payment_id: str, payload: PaymentUpdate, db: AsyncSession = Depends(deps.get_session)
):
    query = (
        select(Payment)
        .options(selectinload(Payment.customer))
        .where(Payment.id == payment_id)
    )
    result = await db.execute(query)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    customer = await db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Invalid customer")

    if payload.invoice_id:
        invoice = await db.get(Invoice, payload.invoice_id)
        if not invoice:
            raise HTTPException(status_code=400, detail="Invalid invoice")

    payment.external_ref = payload.external_ref
    payment.customer_id = payload.customer_id
    payment.invoice_id = payload.invoice_id
    payment.amount = payload.amount
    payment.currency = payload.currency
    payment.method = payload.method
    payment.note = payload.note
    payment.received_date = payload.received_date or payment.received_date
    if payload.status:
        payment.status = payload.status

    await db.commit()
    await db.refresh(payment, ["customer"])
    return payment


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(payment_id: str, db: AsyncSession = Depends(deps.get_session)):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    await db.delete(payment)
    await db.commit()
    return Response(status_code=204)


from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import settings
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceLine, InvoiceStatus
from app.models.order import Order
from app.models.product import Product
from app.models.payment import PaymentApplication
from app.schemas.invoice import InvoiceCreate, InvoiceOut, InvoiceUpdate

router = APIRouter(dependencies=[deps.get_auth()])


@router.get("/", response_model=list[InvoiceOut])
async def list_invoices(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
):
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.lines),
            selectinload(Invoice.customer),
            selectinload(Invoice.lines).selectinload(InvoiceLine.product),
        )
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.post("/", response_model=InvoiceOut)
async def create_invoice(
    payload: InvoiceCreate, db: AsyncSession = Depends(deps.get_session)
):
    customer = await db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Invalid customer")

    order = None
    if payload.order_id:
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.lines))
            .where(Order.id == payload.order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=400, detail="Invalid order")

    if payload.lines is None and order is None:
        raise HTTPException(
            status_code=400, detail="Provide lines or reference an order"
        )

    lines: list[InvoiceLine] = []
    subtotal = 0
    tax_total = 0

    source_lines = payload.lines
    if source_lines is None and order:
        # Build lines from order lines
        for line in order.lines:
            source_lines = source_lines or []
            source_lines.append(
                {
                    "product_id": line.product_id,
                    "quantity": float(line.quantity),
                    "unit_price": float(line.unit_price),
                    "tax_rate": float(line.tax_rate),
                }
            )

    assert source_lines is not None  # for type checker
    normalized = []
    for line in source_lines:
        if isinstance(line, dict):
            normalized.append(line)
        else:
            normalized.append(line.dict())

    for line in normalized:
        product_id = line.get("product_id")
        if product_id:
            product = await db.get(Product, product_id)
            if not product:
                raise HTTPException(
                    status_code=400, detail=f"Invalid product {product_id}"
                )
        line_total = float(line["quantity"]) * float(line["unit_price"])
        tax_amount = line_total * float(line.get("tax_rate", 0))
        subtotal += line_total
        tax_total += tax_amount
        lines.append(
            InvoiceLine(
                product_id=product_id,
                description=line.get("description"),
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                tax_rate=line.get("tax_rate", 0),
                line_total=line_total + tax_amount,
            )
        )
    if payload.tax_total is not None:
        tax_total = float(payload.tax_total)

    invoice = Invoice(
        external_ref=payload.external_ref,
        customer_id=payload.customer_id,
        order_id=payload.order_id,
        currency=payload.currency,
        invoice_date=payload.invoice_date or datetime.utcnow(),
        due_date=payload.due_date,
        notes=payload.notes,
        subtotal=subtotal,
        tax_total=tax_total,
        total=subtotal + tax_total,
        lines=lines,
    )
    db.add(invoice)
    await db.commit()
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.lines).selectinload(InvoiceLine.product),
            selectinload(Invoice.customer),
        )
        .where(Invoice.id == invoice.id)
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.put("/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: str, payload: InvoiceUpdate, db: AsyncSession = Depends(deps.get_session)
):
    result = await db.execute(
        select(Invoice)
        .options(
            selectinload(Invoice.lines).selectinload(InvoiceLine.product),
            selectinload(Invoice.customer),
        )
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    customer = await db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Invalid customer")

    # If lines provided, rebuild
    if payload.lines is not None:
        new_lines: list[InvoiceLine] = []
        subtotal = 0
        tax_total = 0
        for line in payload.lines:
            product = None
            if line.product_id:
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
                InvoiceLine(
                    product_id=line.product_id,
                    description=line.description,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    tax_rate=line.tax_rate,
                    line_total=line_total + tax_amount,
                )
            )
        invoice.lines = new_lines
        invoice.subtotal = subtotal
        invoice.tax_total = (
            float(payload.tax_total) if payload.tax_total is not None else tax_total
        )
        invoice.total = invoice.subtotal + invoice.tax_total
    elif payload.tax_total is not None:
        invoice.tax_total = float(payload.tax_total)
        invoice.total = invoice.subtotal + invoice.tax_total

    invoice.customer_id = payload.customer_id
    invoice.order_id = payload.order_id
    invoice.currency = payload.currency
    invoice.invoice_date = payload.invoice_date or invoice.invoice_date
    invoice.due_date = payload.due_date
    invoice.status = payload.status or invoice.status
    invoice.notes = payload.notes

    await db.commit()
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.lines).selectinload(InvoiceLine.product),
            selectinload(Invoice.customer),
        )
        .where(Invoice.id == invoice.id)
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: str, db: AsyncSession = Depends(deps.get_session)):
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.lines),
            selectinload(Invoice.customer),
            selectinload(Invoice.lines).selectinload(InvoiceLine.product),
        )
        .where(Invoice.id == invoice_id)
    )
    result = await db.execute(query)
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/{invoice_id}/post", response_model=InvoiceOut)
async def post_invoice(invoice_id: str, db: AsyncSession = Depends(deps.get_session)):
    return await _transition_invoice(invoice_id, InvoiceStatus.posted, db)


@router.post("/{invoice_id}/write-off", response_model=InvoiceOut)
async def write_off_invoice(
    invoice_id: str, db: AsyncSession = Depends(deps.get_session)
):
    return await _transition_invoice(invoice_id, InvoiceStatus.written_off, db)


async def _transition_invoice(
    invoice_id: str, next_status: InvoiceStatus, db: AsyncSession
) -> Invoice:
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.lines),
            selectinload(Invoice.customer),
            selectinload(Invoice.lines).selectinload(InvoiceLine.product),
        )
        .where(Invoice.id == invoice_id)
    )
    result = await db.execute(query)
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = next_status
    await db.commit()
    await db.refresh(invoice, ["lines", "customer"])
    return invoice


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: str, db: AsyncSession = Depends(deps.get_session)
):
    result = await db.execute(
        select(Invoice)
        .options(
            selectinload(Invoice.payment_applications),
            selectinload(Invoice.lines),
        )
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # Delete payment applications that reference this invoice to avoid FK errors
    await db.execute(
        delete(PaymentApplication).where(PaymentApplication.invoice_id == invoice_id)
    )
    await db.delete(invoice)
    await db.commit()
    return Response(status_code=204)


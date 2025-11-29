from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import settings
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceLine, InvoiceStatus
from app.models.order import Order
from app.models.product import Product
from app.schemas.invoice import InvoiceCreate, InvoiceOut

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
        order = await db.get(Order, payload.order_id)
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
        product = await db.get(Product, line["product_id"])
        if not product:
            raise HTTPException(
                status_code=400, detail=f"Invalid product {line['product_id']}"
            )
        line_total = float(line["quantity"]) * float(line["unit_price"])
        tax_amount = line_total * float(line.get("tax_rate", 0))
        subtotal += line_total
        tax_total += tax_amount
        lines.append(
            InvoiceLine(
                product_id=line["product_id"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                tax_rate=line.get("tax_rate", 0),
                line_total=line_total + tax_amount,
            )
        )

    invoice = Invoice(
        external_ref=payload.external_ref,
        customer_id=payload.customer_id,
        order_id=payload.order_id,
        currency=payload.currency,
        due_date=payload.due_date,
        subtotal=subtotal,
        tax_total=tax_total,
        total=subtotal + tax_total,
        lines=lines,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice, ["lines", "customer"])
    return invoice


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


from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.deps import set_audit_fields_on_create, set_audit_fields_on_update, set_soft_delete_fields
from app.core.config import settings
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceLine, InvoiceStatus
from app.models.order import Order
from app.models.product import Product
from app.models.payment import PaymentApplication
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceOut, InvoiceUpdate

router = APIRouter(dependencies=[Depends(deps.get_auth)])


def map_invoice_to_out(invoice: Invoice) -> dict[str, Any]:
    """Map invoice model to output dict with user relationships"""
    from app.schemas.invoice import InvoiceLineOut
    from app.schemas.customer import CustomerOut
    
    # Build lines
    lines_data = []
    if invoice.lines:
        for line in invoice.lines:
            line_dict = {
                "id": line.id,
                "product_id": line.product_id,
                "description": line.description,
                "quantity": float(line.quantity),
                "unit_price": float(line.unit_price),
                "tax_rate": float(line.tax_rate),
                "line_total": float(line.line_total),
                "created_at": line.created_at,
            }
            if line.product:
                from app.schemas.product import ProductOut
                line_dict["product"] = ProductOut.from_orm(line.product).dict()
            lines_data.append(line_dict)
    
    data = {
        "id": invoice.id,
        "external_ref": invoice.external_ref,
        "order_id": invoice.order_id,
        "customer_id": invoice.customer_id,
        "invoice_date": invoice.invoice_date,
        "due_date": invoice.due_date,
        "status": invoice.status,
        "currency": invoice.currency,
        "subtotal": float(invoice.subtotal),
        "tax_total": float(invoice.tax_total),
        "total": float(invoice.total),
        "notes": invoice.notes,
        "lines": lines_data,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "created_by_id": invoice.created_by_id,
        "last_modified_by_id": invoice.last_modified_by_id,
        "owner_id": invoice.owner_id,
        "is_deleted": invoice.is_deleted,
        "deleted_at": invoice.deleted_at,
        "deleted_by_id": invoice.deleted_by_id,
    }
    # Map user relationships
    if invoice.created_by_user:
        data["created_by"] = invoice.created_by_user
    if invoice.last_modified_by_user:
        data["last_modified_by"] = invoice.last_modified_by_user
    if invoice.owner_user:
        data["owner"] = invoice.owner_user
    if invoice.deleted_by_user:
        data["deleted_by"] = invoice.deleted_by_user
    # Map customer if loaded
    if invoice.customer:
        data["customer"] = CustomerOut.from_orm(invoice.customer).dict()
    return data


@router.get("/", response_model=list[InvoiceOut])
async def list_invoices(
    db: AsyncSession = Depends(deps.get_session),
    limit: int = Query(default=settings.default_page_size, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
    include_deleted: bool = Query(default=False, description="Include soft-deleted records"),
):
    """List all invoices. By default excludes soft-deleted records."""
    query = select(Invoice).options(
        selectinload(Invoice.lines),
        selectinload(Invoice.customer),
        selectinload(Invoice.lines).selectinload(InvoiceLine.product),
        selectinload(Invoice.created_by_user),
        selectinload(Invoice.last_modified_by_user),
        selectinload(Invoice.owner_user),
        selectinload(Invoice.deleted_by_user),
    )
    if not include_deleted:
        query = query.where(Invoice.is_deleted == False)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    invoices = result.scalars().unique().all()
    return [InvoiceOut(**map_invoice_to_out(invoice)) for invoice in invoices]


@router.post("/", response_model=InvoiceOut)
async def create_invoice(
    payload: InvoiceCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new invoice with audit trail."""
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
    
    # Set audit fields
    set_audit_fields_on_create(invoice, current_user)
    
    # Allow setting owner_id from payload if provided
    if payload.owner_id:
        invoice.owner_id = payload.owner_id
    
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
    invoice_id: str,
    payload: InvoiceUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Update an invoice with audit trail."""
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
    
    if invoice.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update a deleted invoice")

    # Only validate customer if provided
    if payload.customer_id:
        customer = await db.get(Customer, payload.customer_id)
        if not customer:
            raise HTTPException(status_code=400, detail="Invalid customer")
        invoice.customer_id = payload.customer_id

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

    if payload.order_id is not None:
        invoice.order_id = payload.order_id
    if payload.currency is not None:
        invoice.currency = payload.currency
    if payload.invoice_date is not None:
        invoice.invoice_date = payload.invoice_date
    if payload.due_date is not None:
        invoice.due_date = payload.due_date
    if payload.status is not None:
        invoice.status = payload.status
    if payload.notes is not None:
        invoice.notes = payload.notes
    if payload.external_ref is not None:
        invoice.external_ref = payload.external_ref
    if payload.owner_id is not None:
        invoice.owner_id = payload.owner_id

    # Set audit fields
    set_audit_fields_on_update(invoice, current_user)

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
    """Get an invoice by ID."""
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
async def post_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Post an invoice."""
    return await _transition_invoice(invoice_id, InvoiceStatus.posted, db, current_user)


@router.post("/{invoice_id}/write-off", response_model=InvoiceOut)
async def write_off_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Write off an invoice."""
    return await _transition_invoice(invoice_id, InvoiceStatus.written_off, db, current_user)


async def _transition_invoice(
    invoice_id: str, next_status: InvoiceStatus, db: AsyncSession, current_user: User
) -> Invoice:
    """Transition an invoice to a new status."""
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
    
    if invoice.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot modify a deleted invoice")
    
    invoice.status = next_status
    set_audit_fields_on_update(invoice, current_user)
    
    await db.commit()
    await db.refresh(invoice, ["lines", "customer"])
    return invoice


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
    hard_delete: bool = Query(default=False, description="Permanently delete instead of soft delete"),
):
    """
    Delete an invoice.
    
    By default, performs a soft delete (sets is_deleted=True).
    Use hard_delete=True to permanently remove the record.
    """
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
    
    if hard_delete:
        # Delete payment applications that reference this invoice to avoid FK errors
        await db.execute(
            delete(PaymentApplication).where(PaymentApplication.invoice_id == invoice_id)
        )
        await db.delete(invoice)
    else:
        set_soft_delete_fields(invoice, current_user)
    
    await db.commit()
    return Response(status_code=204)


@router.post("/{invoice_id}/restore", response_model=InvoiceOut)
async def restore_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: User = Depends(get_current_user),
):
    """Restore a soft-deleted invoice."""
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
    
    if not invoice.is_deleted:
        raise HTTPException(status_code=400, detail="Invoice is not deleted")
    
    invoice.is_deleted = False
    invoice.deleted_at = None
    invoice.deleted_by_id = None
    set_audit_fields_on_update(invoice, current_user)
    
    await db.commit()
    await db.refresh(invoice, ["lines", "customer"])
    return invoice

"""Initial tables for ERP demo"""
from alembic import op
import sqlalchemy as sa
import uuid


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customer",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("external_ref", sa.String(length=128), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("billing_address", sa.Text(), nullable=True),
        sa.Column("shipping_address", sa.Text(), nullable=True),
        sa.Column("currency", sa.String(length=3), default="USD"),
        sa.Column("is_active", sa.Boolean(), default=True),
    )

    op.create_table(
        "product",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("uom", sa.String(length=32), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_code", sa.String(length=32), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
    )

    op.create_table(
        "order",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("external_ref", sa.String(length=128), nullable=True),
        sa.Column("customer_id", sa.UUID(as_uuid=True), sa.ForeignKey("customer.id")),
        sa.Column("order_date", sa.DateTime(), nullable=False),
        sa.Column("status", sa.Enum("draft", "confirmed", "fulfilled", "closed", name="orderstatus")),
        sa.Column("currency", sa.String(length=3), default="USD"),
        sa.Column("subtotal", sa.Numeric(12, 2), default=0),
        sa.Column("tax_total", sa.Numeric(12, 2), default=0),
        sa.Column("total", sa.Numeric(12, 2), default=0),
    )

    op.create_table(
        "invoice",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("external_ref", sa.String(length=128), nullable=True),
        sa.Column("order_id", sa.UUID(as_uuid=True), sa.ForeignKey("order.id")),
        sa.Column("customer_id", sa.UUID(as_uuid=True), sa.ForeignKey("customer.id")),
        sa.Column("invoice_date", sa.DateTime(), nullable=False),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("status", sa.Enum("draft", "posted", "paid", "written_off", name="invoicestatus")),
        sa.Column("currency", sa.String(length=3), default="USD"),
        sa.Column("subtotal", sa.Numeric(12, 2), default=0),
        sa.Column("tax_total", sa.Numeric(12, 2), default=0),
        sa.Column("total", sa.Numeric(12, 2), default=0),
    )

    op.create_table(
        "payment",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("external_ref", sa.String(length=128), nullable=True),
        sa.Column("customer_id", sa.UUID(as_uuid=True), sa.ForeignKey("customer.id")),
        sa.Column("invoice_id", sa.UUID(as_uuid=True), sa.ForeignKey("invoice.id"), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), default="USD"),
        sa.Column("method", sa.String(length=64), nullable=True),
        sa.Column("received_date", sa.DateTime(), nullable=False),
        sa.Column("status", sa.Enum("received", "applied", "failed", name="paymentstatus")),
        sa.Column("note", sa.Text(), nullable=True),
    )

    op.create_table(
        "orderline",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("order_id", sa.UUID(as_uuid=True), sa.ForeignKey("order.id")),
        sa.Column("product_id", sa.UUID(as_uuid=True), sa.ForeignKey("product.id")),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 4), default=0),
        sa.Column("line_total", sa.Numeric(12, 2), default=0),
    )

    op.create_table(
        "invoice_line",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("invoice_id", sa.UUID(as_uuid=True), sa.ForeignKey("invoice.id")),
        sa.Column("product_id", sa.UUID(as_uuid=True), sa.ForeignKey("product.id")),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 4), default=0),
        sa.Column("line_total", sa.Numeric(12, 2), default=0),
    )

    op.create_table(
        "paymentapplication",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("payment_id", sa.UUID(as_uuid=True), sa.ForeignKey("payment.id")),
        sa.Column("invoice_id", sa.UUID(as_uuid=True), sa.ForeignKey("invoice.id")),
        sa.Column("amount_applied", sa.Numeric(12, 2), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("paymentapplication")
    op.drop_table("invoice_line")
    op.drop_table("orderline")
    op.drop_table("payment")
    op.drop_table("invoice")
    op.drop_table("order")
    op.drop_table("product")
    op.drop_table("customer")

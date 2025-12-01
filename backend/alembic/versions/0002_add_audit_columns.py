"""Add enterprise audit columns to all tables

This migration adds standard enterprise audit columns:
- created_at, updated_at: Timestamp tracking
- created_by_id, last_modified_by_id, owner_id: User tracking
- is_deleted, deleted_at, deleted_by_id: Soft delete support

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

revision = "0002_add_audit"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # First, create the user table (if not exists) since audit columns reference it
    # Check if user table exists first
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if "user" not in tables:
        op.create_table(
            "user",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("email", sa.String(255), unique=True, nullable=False),
            sa.Column("hashed_password", sa.String(255), nullable=False),
            sa.Column("role", sa.Enum("admin", "manager", "staff", "viewer", name="userrole"), nullable=False, server_default="viewer"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("first_name", sa.String(100), nullable=True),
            sa.Column("last_name", sa.String(100), nullable=True),
            sa.Column("phone", sa.String(30), nullable=True),
            # Audit columns for user
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id", ondelete="SET NULL"), nullable=True),
            sa.Column("last_modified_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id", ondelete="SET NULL"), nullable=True),
            # Soft delete for user
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id", ondelete="SET NULL"), nullable=True),
        )
        op.create_index("ix_user_email", "user", ["email"])
    else:
        # Add audit columns to existing user table
        _add_audit_columns_to_user_table()
    
    # Add audit columns to Customer table
    _add_audit_columns("customer")
    _add_soft_delete_columns("customer")
    
    # Add audit columns to Product table
    # First add external_ref if it doesn't exist
    try:
        op.add_column("product", sa.Column("external_ref", sa.String(128), nullable=True))
        op.create_index("ix_product_external_ref", "product", ["external_ref"])
    except Exception:
        pass  # Column may already exist
    _add_audit_columns("product")
    _add_soft_delete_columns("product")
    
    # Add audit columns to Order table
    _add_audit_columns("order")
    _add_soft_delete_columns("order")
    # Add notes column if missing
    try:
        op.add_column("order", sa.Column("notes", sa.Text(), nullable=True))
    except Exception:
        pass
    
    # Add audit columns to Invoice table
    _add_audit_columns("invoice")
    _add_soft_delete_columns("invoice")
    # Add notes column if missing
    try:
        op.add_column("invoice", sa.Column("notes", sa.Text(), nullable=True))
    except Exception:
        pass
    
    # Add audit columns to Payment table
    _add_audit_columns("payment")
    _add_soft_delete_columns("payment")
    
    # Add created_at to line item tables (lightweight audit)
    _add_line_item_audit("orderline")
    _add_line_item_audit("invoice_line")
    _add_line_item_audit("paymentapplication")
    
    # Add description column to invoice_line if missing
    try:
        op.add_column("invoice_line", sa.Column("description", sa.Text(), nullable=True))
    except Exception:
        pass


def _add_audit_columns(table_name: str) -> None:
    """Add standard audit columns to a table"""
    # Timestamp columns
    op.add_column(
        table_name,
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now())
    )
    op.add_column(
        table_name,
        sa.Column("updated_at", sa.DateTime(), nullable=True, server_default=sa.func.now())
    )
    
    # User reference columns
    op.add_column(
        table_name,
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column(
        table_name,
        sa.Column("last_modified_by_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column(
        table_name,
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    
    # Add foreign key constraints
    op.create_foreign_key(
        f"fk_{table_name}_created_by_id_user",
        table_name, "user",
        ["created_by_id"], ["id"],
        ondelete="SET NULL"
    )
    op.create_foreign_key(
        f"fk_{table_name}_last_modified_by_id_user",
        table_name, "user",
        ["last_modified_by_id"], ["id"],
        ondelete="SET NULL"
    )
    op.create_foreign_key(
        f"fk_{table_name}_owner_id_user",
        table_name, "user",
        ["owner_id"], ["id"],
        ondelete="SET NULL"
    )
    
    # Add indexes for performance
    op.create_index(f"ix_{table_name}_created_by_id", table_name, ["created_by_id"])
    op.create_index(f"ix_{table_name}_owner_id", table_name, ["owner_id"])


def _add_soft_delete_columns(table_name: str) -> None:
    """Add soft delete columns to a table"""
    op.add_column(
        table_name,
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false")
    )
    op.add_column(
        table_name,
        sa.Column("deleted_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        table_name,
        sa.Column("deleted_by_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    
    # Add foreign key constraint
    op.create_foreign_key(
        f"fk_{table_name}_deleted_by_id_user",
        table_name, "user",
        ["deleted_by_id"], ["id"],
        ondelete="SET NULL"
    )
    
    # Add index for soft delete queries
    op.create_index(f"ix_{table_name}_is_deleted", table_name, ["is_deleted"])


def _add_line_item_audit(table_name: str) -> None:
    """Add lightweight audit (created_at only) to line item tables"""
    try:
        op.add_column(
            table_name,
            sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now())
        )
    except Exception:
        pass  # Column may already exist


def _add_audit_columns_to_user_table() -> None:
    """Add audit columns to existing user table"""
    columns_to_add = [
        ("updated_at", sa.DateTime(), sa.func.now()),
        ("created_by_id", postgresql.UUID(as_uuid=True), None),
        ("last_modified_by_id", postgresql.UUID(as_uuid=True), None),
        ("is_deleted", sa.Boolean(), "false"),
        ("deleted_at", sa.DateTime(), None),
        ("deleted_by_id", postgresql.UUID(as_uuid=True), None),
    ]
    
    for col_name, col_type, default in columns_to_add:
        try:
            if default is not None:
                op.add_column("user", sa.Column(col_name, col_type, nullable=True, server_default=default if isinstance(default, str) else None))
            else:
                op.add_column("user", sa.Column(col_name, col_type, nullable=True))
        except Exception:
            pass  # Column may already exist
    
    # Add self-referential foreign keys
    for col_name in ["created_by_id", "last_modified_by_id", "deleted_by_id"]:
        try:
            op.create_foreign_key(
                f"fk_user_{col_name}_user",
                "user", "user",
                [col_name], ["id"],
                ondelete="SET NULL"
            )
        except Exception:
            pass


def downgrade() -> None:
    # Remove audit columns from all tables
    tables = ["customer", "product", "order", "invoice", "payment"]
    
    for table_name in tables:
        # Drop foreign keys first
        for fk_suffix in ["created_by_id_user", "last_modified_by_id_user", "owner_id_user", "deleted_by_id_user"]:
            try:
                op.drop_constraint(f"fk_{table_name}_{fk_suffix}", table_name, type_="foreignkey")
            except Exception:
                pass
        
        # Drop indexes
        for idx_suffix in ["created_by_id", "owner_id", "is_deleted"]:
            try:
                op.drop_index(f"ix_{table_name}_{idx_suffix}", table_name)
            except Exception:
                pass
        
        # Drop columns
        for col in ["created_at", "updated_at", "created_by_id", "last_modified_by_id", "owner_id", "is_deleted", "deleted_at", "deleted_by_id"]:
            try:
                op.drop_column(table_name, col)
            except Exception:
                pass
    
    # Remove created_at from line item tables
    for table_name in ["orderline", "invoice_line", "paymentapplication"]:
        try:
            op.drop_column(table_name, "created_at")
        except Exception:
            pass
    
    # Don't drop user table in downgrade as it may have data


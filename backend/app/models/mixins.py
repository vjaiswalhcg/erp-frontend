"""
Enterprise-grade audit mixins for all database models.

Standard columns included:
- AuditMixin: created_at, updated_at, created_by_id, last_modified_by_id, owner_id
- SoftDeleteMixin: is_deleted, deleted_at, deleted_by_id
- VersionMixin: version (for optimistic locking)

Usage:
    class Customer(Base, AuditMixin, SoftDeleteMixin):
        # ... your fields
"""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, declared_attr
from sqlalchemy.dialects.postgresql import UUID


class AuditMixin:
    """
    Standard audit columns for tracking record lifecycle.
    
    Columns:
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last modified (auto-updates)
        created_by_id: User who created the record
        last_modified_by_id: User who last modified the record
        owner_id: User who owns the record (for permissions)
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    
    @declared_attr
    def created_by_id(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(
            UUID(as_uuid=True), 
            ForeignKey("user.id", ondelete="SET NULL"), 
            nullable=True,
            index=True
        )
    
    @declared_attr
    def last_modified_by_id(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(
            UUID(as_uuid=True), 
            ForeignKey("user.id", ondelete="SET NULL"), 
            nullable=True
        )
    
    @declared_attr
    def owner_id(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(
            UUID(as_uuid=True), 
            ForeignKey("user.id", ondelete="SET NULL"), 
            nullable=True,
            index=True
        )


class SoftDeleteMixin:
    """
    Soft delete support for data retention and compliance.
    
    Columns:
        is_deleted: Flag indicating if record is soft-deleted
        deleted_at: Timestamp when record was soft-deleted
        deleted_by_id: User who soft-deleted the record
    """
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    @declared_attr
    def deleted_by_id(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(
            UUID(as_uuid=True), 
            ForeignKey("user.id", ondelete="SET NULL"), 
            nullable=True
        )


class VersionMixin:
    """
    Optimistic locking support for concurrent update protection.
    
    Columns:
        version: Integer version that increments on each update
    
    Usage in update logic:
        1. Read record with version N
        2. On update, check version == N
        3. If match, update and set version = N + 1
        4. If mismatch, reject update (concurrent modification)
    """
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class LineItemAuditMixin:
    """
    Lightweight audit for line item tables (OrderLine, InvoiceLine, etc.)
    Only tracks creation, not modifications (line items are typically replaced, not updated)
    
    Columns:
        created_at: Timestamp when line item was created
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


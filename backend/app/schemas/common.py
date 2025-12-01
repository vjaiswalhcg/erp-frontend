"""
Common schema mixins for enterprise audit fields.

These mixins add audit fields to Pydantic output schemas.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel


class AuditFieldsOut(BaseModel):
    """
    Standard audit fields for output schemas.
    Include this in your *Out schemas to expose audit information.
    """
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID | None = None
    last_modified_by_id: uuid.UUID | None = None
    owner_id: uuid.UUID | None = None


class SoftDeleteFieldsOut(BaseModel):
    """
    Soft delete fields for output schemas.
    """
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by_id: uuid.UUID | None = None


class AuditFieldsCreate(BaseModel):
    """
    Audit fields that can be optionally provided on create.
    Typically set by the API layer based on the authenticated user.
    """
    owner_id: uuid.UUID | None = None  # Allow specifying owner, defaults to creator


class LineItemAuditFieldsOut(BaseModel):
    """
    Lightweight audit for line items (just created_at).
    """
    created_at: datetime


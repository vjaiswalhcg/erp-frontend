from datetime import datetime
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User


async def get_session() -> AsyncSession:
    async for session in get_db():
        yield session


def get_auth():
    return get_current_user


async def get_current_user_dep(
    user: User = Depends(get_current_user)
) -> User:
    """Dependency to get the current authenticated user."""
    return user


def set_audit_fields_on_create(entity, user: User) -> None:
    """
    Set audit fields when creating a new entity.
    
    Sets:
    - created_by_id: Current user
    - last_modified_by_id: Current user
    - owner_id: Current user (unless already set)
    """
    entity.created_by_id = user.id
    entity.last_modified_by_id = user.id
    if not entity.owner_id:
        entity.owner_id = user.id


def set_audit_fields_on_update(entity, user: User) -> None:
    """
    Set audit fields when updating an entity.
    
    Sets:
    - last_modified_by_id: Current user
    - updated_at: Current timestamp (handled by SQLAlchemy onupdate)
    """
    entity.last_modified_by_id = user.id


def set_soft_delete_fields(entity, user: User) -> None:
    """
    Set fields for soft delete.
    
    Sets:
    - is_deleted: True
    - deleted_at: Current timestamp
    - deleted_by_id: Current user
    """
    entity.is_deleted = True
    entity.deleted_at = datetime.utcnow()
    entity.deleted_by_id = user.id

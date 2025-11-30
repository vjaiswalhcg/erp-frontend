from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user


async def get_session() -> AsyncSession:
    async for session in get_db():
        yield session


def get_auth():
    return get_current_user


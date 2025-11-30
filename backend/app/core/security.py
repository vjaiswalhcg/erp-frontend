from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.core.auth import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole


async def get_current_user(
    authorization: str | None = Header(default=None, convert_underscores=False),
    db: AsyncSession = Depends(get_db),
) -> User:
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    try:
        user_id = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or not found")
    return user


def require_roles(allowed: list[UserRole]):
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user

    return dependency


def get_auth_dependency():
    """Default auth dependency used by routers: any authenticated user."""
    return Depends(get_current_user)


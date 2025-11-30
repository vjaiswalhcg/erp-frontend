from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api import deps
from app.core import auth
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserLogin, Token, TokenRefresh

router = APIRouter()

# Rate limiter - 5 attempts per minute for auth endpoints
limiter = Limiter(key_func=get_remote_address)


async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


# NOTE: Public registration has been DISABLED for security.
# Users must be created by an admin via POST /api/v1/users/
# To re-enable, uncomment the register_user endpoint below.
#
# @router.post("/register", response_model=UserOut)
# async def register_user(payload: UserCreate, db: AsyncSession = Depends(deps.get_session)):
#     """Public registration - DISABLED for production security."""
#     ...


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, payload: UserLogin, db: AsyncSession = Depends(deps.get_session)):
    user = await _get_user_by_email(db, payload.email)
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth.create_access_token(str(user.id), expires_delta=access_token_expires)
    refresh_token = auth.create_refresh_token(str(user.id))
    return Token(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=Token)
@limiter.limit("10/minute")
async def refresh(request: Request, payload: TokenRefresh, db: AsyncSession = Depends(deps.get_session)):
    user_id = auth.decode_token(payload.refresh_token, refresh=True)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access_token = auth.create_access_token(str(user.id))
    refresh_token = auth.create_refresh_token(str(user.id))
    return Token(access_token=access_token, refresh_token=refresh_token, user=user)


@router.get("/me", response_model=UserOut)
async def read_me(current_user: User = Depends(deps.get_auth)):
    return current_user

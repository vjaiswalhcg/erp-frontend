from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import auth
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, UserLogin, Token, TokenRefresh

router = APIRouter()


async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/register", response_model=UserOut)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(deps.get_session)):
    if len(payload.password) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 chars)")
    existing = await _get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # For simplicity, allow open registration but default to viewer unless explicitly provided
    hashed = auth.get_password_hash(payload.password)
    user = User(
        email=payload.email,
        hashed_password=hashed,
        role=payload.role or UserRole.viewer,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(deps.get_session)):
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
async def refresh(payload: TokenRefresh, db: AsyncSession = Depends(deps.get_session)):
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

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import auth
from app.core.security import require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(require_roles([UserRole.admin]))],
)


async def _get_user(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


@router.get("/", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(deps.get_session)):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/", response_model=UserOut)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(deps.get_session)):
    result = await db.execute(select(User).where(User.email == payload.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    if len(payload.password) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 chars)")
    hashed = auth.get_password_hash(payload.password)
    user = User(
        email=payload.email,
        hashed_password=hashed,
        role=payload.role or UserRole.viewer,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str, payload: UserUpdate, db: AsyncSession = Depends(deps.get_session)
):
    user = await _get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email and payload.email != user.email:
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = payload.email

    if payload.password:
        if len(payload.password) > 72:
            raise HTTPException(status_code=400, detail="Password too long (max 72 chars)")
        user.hashed_password = auth.get_password_hash(payload.password)

    if payload.role:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    user.first_name = payload.first_name
    user.last_name = payload.last_name
    user.phone = payload.phone

    await db.commit()
    await db.refresh(user)
    return user

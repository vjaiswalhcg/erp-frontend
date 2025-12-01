import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.viewer
    is_active: bool = True
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole = UserRole.viewer
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    role: UserRole | None = None
    is_active: bool | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


class UserInfo(BaseModel):
    """Lightweight user info for display in audit fields"""
    id: uuid.UUID
    email: str
    first_name: str | None = None
    last_name: str | None = None
    
    @property
    def display_name(self) -> str:
        """Get display name: 'First Last' or 'email' if no name"""
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.email
    
    class Config:
        orm_mode = True


class UserOut(UserBase):
    id: uuid.UUID
    # Audit fields
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID | None = None
    last_modified_by_id: uuid.UUID | None = None
    # Soft delete fields
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by_id: uuid.UUID | None = None

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenRefresh(BaseModel):
    refresh_token: str

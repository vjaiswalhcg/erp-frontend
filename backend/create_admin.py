"""
Create an initial admin user for local development.

Usage:
    python create_admin.py

This will create an admin user with:
- Email: admin@example.com
- Password: admin123
- Role: admin
"""
import asyncio
import uuid
from app.db.session import AsyncSessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin():
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "admin@example.com")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("✅ Admin user already exists")
            print(f"   Email: admin@example.com")
            print(f"   Role: {existing.role}")
            return

        # Create admin user
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            hashed_password=pwd_context.hash("admin123"),
            role="admin",
            is_active=True,
            first_name="Admin",
            last_name="User",
        )
        session.add(admin)
        await session.commit()
        print("✅ Admin user created successfully!")
        print(f"   Email: admin@example.com")
        print(f"   Password: admin123")
        print(f"   Role: admin")
        print("\n⚠️  Remember to change this password in production!")


if __name__ == "__main__":
    asyncio.run(create_admin())

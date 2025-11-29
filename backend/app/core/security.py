from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings


async def verify_bearer_token(
    authorization: str | None = Header(default=None, convert_underscores=False)
) -> None:
    """
    Minimal bearer token check.
    Expects header: Authorization: Bearer <secret_key>
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or token != settings.secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def get_auth_dependency():
    """Provide dependency for routers; easy to swap to real auth later."""
    return Depends(verify_bearer_token)


import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

# Configure CORS - restrict origins for production security
# Set CORS_ORIGINS env var as comma-separated list of allowed origins
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["health"])
async def healthcheck():
    return {"status": "ok"}


@app.get("/", tags=["health"])
async def root():
    return {
        "status": "ok",
        "service": "ERP Backend API",
        "version": "0.1.0",
        "docs": "/docs"
    }


app.include_router(api_router, prefix=settings.api_v1_prefix)

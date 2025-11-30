from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "ERP Demo API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field("changeme", description="JWT secret key")
    access_token_header: str = "Authorization"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    database_url: str = Field(
        ...,
        env="DATABASE_URL",
        description="Async SQLAlchemy URL, e.g. postgresql+psycopg_async://user:pass@host:5432/db",
    )
    default_page_size: int = 50
    max_page_size: int = 200

    class Config:
        env_file = ".env"


settings = Settings()

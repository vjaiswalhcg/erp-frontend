from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "ERP Demo API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field("changeme", description="Shared secret for simple auth")
    access_token_header: str = "Authorization"
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

"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""  # service_role key

    # CORS
    frontend_url: str = "http://localhost:5173"

    # App settings
    app_name: str = "Smart Attendance System"
    debug: bool = False

    # Email SMTP Settings
    smtp_email: str = ""
    smtp_password: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()

"""Configuration settings for the CRM Agent Service."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Anthropic
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # Command Center Backend
    command_center_url: str = "https://command-center-backend-production.up.railway.app"

    # Optional: Apollo API
    apollo_api_key: str | None = None

    # Environment
    environment: str = "development"
    port: int = 8000

    # Agent settings
    agent_model: str = "claude-sonnet-4-20250514"
    agent_max_tokens: int = 4096

    # Confidence thresholds
    duplicate_high_confidence: float = 0.9
    duplicate_medium_confidence: float = 0.7
    enrichment_min_confidence: float = 0.6

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

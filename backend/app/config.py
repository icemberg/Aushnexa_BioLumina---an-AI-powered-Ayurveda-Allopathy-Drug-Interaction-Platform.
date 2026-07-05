"""
Aushnexa Backend Configuration

Loads all environment variables using Pydantic Settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    ANTHROPIC_API_KEY: str | None = Field(default=None, description="Anthropic API Key")
    NCBI_API_KEY: str | None = Field(default=None, description="NCBI API Key for PubMed")
    SEMANTIC_SCHOLAR_API_KEY: str | None = Field(default=None, description="Semantic Scholar API Key")

    # ─── Application ───
    app_name: str = "Aushnexa"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = Field(
        default="change-this-in-production-min-32-characters-long",
        min_length=32,
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # ─── Backend Server ───
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "https://aushnexa.onrender.com,http://localhost:5173"

    # ─── PostgreSQL ───
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "aushnexa"
    postgres_user: str = "aushnexa_user"
    postgres_password: str = "aushnexa_secure_password_2024"
    database_url: str = "postgresql+asyncpg://aushnexa_user:aushnexa_secure_password_2024@localhost:5432/aushnexa"

    # ─── Neo4j ───
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "aushnexa_neo4j_2024"

    # ─── Redis ───
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_url: str = "redis://localhost:6379/0"

    # ─── Groq API (Explanation Generation) ───
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    anthropic_api_key: str = ""

    # ─── Sarvam AI (Translation & TTS) ───
    sarvam_api_key: str = ""
    sarvam_base_url: str = "https://api.sarvam.ai"

    # ─── Application Settings ───
    synonyms_file_path: str = str(BASE_DIR / "data_pipeline" / "seed_data" / "synonyms.json")

    # ─── Logging ───
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — reads .env once."""
    return Settings()

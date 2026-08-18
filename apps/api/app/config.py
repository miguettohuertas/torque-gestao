"""
Configurações da aplicação, lidas de variáveis de ambiente (.env).

Uso:
    from app.config import settings
    settings.DATABASE_URL
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Banco de dados
    DATABASE_URL: str = "postgresql+psycopg2://torque:torque@db:5432/torque_gestao"

    # Autenticação (RF06)
    JWT_SECRET_KEY: str = "troque-este-valor-antes-de-ir-para-producao"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # Ambiente
    ENVIRONMENT: str = "development"


settings = Settings()

"""
Model do convite de vínculo com o Telegram (RF07).

O token em texto puro só existe no link entregue ao cliente; no banco fica
apenas o hash. O convite expira e só pode ser usado uma vez.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import generate_uuid


class TelegramVinculo(Base):
    __tablename__ = "telegram_vinculos"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    cliente_id: Mapped[str] = mapped_column(
        String, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expira_em: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    usado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

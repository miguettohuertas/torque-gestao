"""Regras do vínculo cliente <-> Telegram (RF07): convite, confirmação e desvínculo."""
import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models.cliente import Cliente
from app.models.telegram_vinculo import TelegramVinculo


def _agora() -> datetime:
    return datetime.utcnow()


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def gerar_convite(db: Session, cliente: Cliente) -> str:
    """Cria um convite novo (invalidando os pendentes) e devolve o token em texto puro."""
    db.execute(
        delete(TelegramVinculo).where(
            TelegramVinculo.cliente_id == cliente.id, TelegramVinculo.usado_em.is_(None)
        )
    )
    token = secrets.token_urlsafe(24)
    db.add(
        TelegramVinculo(
            cliente_id=cliente.id,
            token_hash=_hash(token),
            expira_em=_agora() + timedelta(minutes=settings.TELEGRAM_VINCULO_EXPIRA_MINUTOS),
        )
    )
    db.commit()
    return token


def confirmar_convite(db: Session, token: str, chat_id: str) -> Cliente | None:
    """Consome o convite e grava o chat_id. Devolve o cliente ou None se o token for inválido."""
    convite = db.scalar(select(TelegramVinculo).where(TelegramVinculo.token_hash == _hash(token)))
    if convite is None or convite.usado_em is not None or convite.expira_em < _agora():
        return None

    cliente = db.get(Cliente, convite.cliente_id)
    if cliente is None:
        return None

    convite.usado_em = _agora()
    cliente.telegram_chat_id = chat_id
    cliente.notificar_telegram = True
    try:
        db.commit()
    except IntegrityError:
        # O mesmo chat já está vinculado a outro cliente.
        db.rollback()
        return None
    return cliente


def desvincular_chat(db: Session, chat_id: str) -> bool:
    cliente = db.scalar(select(Cliente).where(Cliente.telegram_chat_id == chat_id))
    if cliente is None:
        return False
    cliente.telegram_chat_id = None
    db.commit()
    return True

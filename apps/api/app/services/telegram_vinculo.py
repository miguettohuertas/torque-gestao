"""Regras do vínculo cliente <-> Telegram (RF07): convite, confirmação e desvínculo."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.models.telegram_vinculo import TelegramVinculo

EXPIRA_EM_MINUTOS = 30


def _agora() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


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
            expira_em=_agora() + timedelta(minutes=EXPIRA_EM_MINUTOS),
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
    db.commit()
    return cliente


def desvincular_chat(db: Session, chat_id: str) -> bool:
    resultado = db.execute(
        update(Cliente).where(Cliente.telegram_chat_id == chat_id).values(telegram_chat_id=None)
    )
    db.commit()
    return resultado.rowcount > 0

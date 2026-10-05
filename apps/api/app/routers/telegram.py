"""RF07 — vínculo do cliente com o Telegram (gerar convite e desvincular)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import leitura_operacional, verificar_proprietario
from app.database import get_db
from app.models.cliente import Cliente
from app.schemas.telegram import ConviteTelegramOut
from app.services import telegram, telegram_vinculo

router = APIRouter(prefix="/clientes", tags=["telegram"])


def _cliente_autorizado(cliente_id: str, db: Session, usuario) -> Cliente:
    verificar_proprietario(cliente_id, usuario)
    cliente = db.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    return cliente


@router.post("/{cliente_id}/telegram/vinculo", response_model=ConviteTelegramOut)
def gerar_convite_telegram(
    cliente_id: str, db: Session = Depends(get_db), usuario=Depends(leitura_operacional)
):
    cliente = _cliente_autorizado(cliente_id, db, usuario)
    if not telegram.telegram_habilitado() or not telegram.link_de_vinculo("x"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Integração com o Telegram não está configurada.",
        )
    token = telegram_vinculo.gerar_convite(db, cliente)
    return ConviteTelegramOut(
        link=telegram.link_de_vinculo(token),
        expira_em_minutos=telegram.settings.TELEGRAM_VINCULO_EXPIRA_MINUTOS,
    )


@router.delete("/{cliente_id}/telegram", status_code=status.HTTP_204_NO_CONTENT)
def desvincular_telegram(
    cliente_id: str, db: Session = Depends(get_db), usuario=Depends(leitura_operacional)
):
    cliente = _cliente_autorizado(cliente_id, db, usuario)
    cliente.telegram_chat_id = None
    db.commit()

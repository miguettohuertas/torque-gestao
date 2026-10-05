"""
Worker de polling do bot do Telegram (RF07).

Recebe as mensagens enviadas ao bot e trata dois comandos:
  /start <token>  vincula o chat ao cliente dono do convite;
  /parar          remove o vínculo e interrompe os avisos.

Executar:  python -m app.telegram_poller
"""
import logging
import time

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services import telegram, telegram_vinculo

logger = logging.getLogger(__name__)

MSG_BOAS_VINDAS = (
    "Torque Gestão\nOlá! Para receber avisos da sua OS, abra o link de vínculo "
    "gerado no portal ou pela oficina."
)
MSG_TOKEN_INVALIDO = (
    "Este link de vínculo é inválido, expirou ou já foi usado. Peça um novo link à oficina."
)
MSG_PARAR = "Avisos desativados. Para voltar a receber, gere um novo link de vínculo."


def tratar_mensagem(db: Session, chat_id: str, texto: str) -> str | None:
    """Decide a resposta a uma mensagem recebida; None quando não há o que responder."""
    partes = texto.strip().split()
    if not partes:
        return None

    comando = partes[0].split("@")[0].lower()
    if comando == "/start":
        if len(partes) < 2:
            return MSG_BOAS_VINDAS
        cliente = telegram_vinculo.confirmar_convite(db, partes[1], chat_id)
        if cliente is None:
            return MSG_TOKEN_INVALIDO
        return (
            f"Pronto, {cliente.name}! A partir de agora você recebe aqui os avisos "
            "de status das suas ordens de serviço. Envie /parar para desativar."
        )
    if comando == "/parar":
        return MSG_PARAR if telegram_vinculo.desvincular_chat(db, chat_id) else None
    return None


def processar_atualizacoes(atualizacoes: list[dict]) -> int | None:
    """Trata um lote de updates e devolve o próximo offset (None se o lote era vazio)."""
    proximo = None
    for atualizacao in atualizacoes:
        proximo = atualizacao["update_id"] + 1
        mensagem = atualizacao.get("message") or {}
        texto = mensagem.get("text")
        chat = mensagem.get("chat") or {}
        if not texto or chat.get("type") != "private" or "id" not in chat:
            continue
        chat_id = str(chat["id"])
        with SessionLocal() as db:
            resposta = tratar_mensagem(db, chat_id, texto)
        if resposta:
            telegram.enviar_mensagem(chat_id, resposta)
    return proximo


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    if not telegram.telegram_habilitado():
        raise SystemExit("TELEGRAM_BOT_TOKEN não configurado; nada a fazer.")

    logger.info("Poller do Telegram iniciado.")
    offset = None
    while True:
        atualizacoes = telegram.buscar_atualizacoes(offset)
        if not atualizacoes:
            time.sleep(1)
            continue
        offset = processar_atualizacoes(atualizacoes) or offset


if __name__ == "__main__":
    main()

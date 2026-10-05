"""
Integração com a Bot API do Telegram (RF07 — notificações de status da OS).

O envio nunca deve derrubar a requisição que o originou: falhas são apenas
registradas em log. Sem `TELEGRAM_BOT_TOKEN`, todas as funções de envio viram
no-op, o que mantém testes e ambiente local funcionando sem rede.
"""
import logging

import httpx

from app.config import settings
from app.models.ordem_servico import (
    STATUS_AGUARDANDO_DIAGNOSTICO,
    STATUS_AGUARDANDO_PECAS,
    STATUS_EM_EXECUCAO,
    STATUS_ENTREGUE,
    STATUS_FINALIZADA,
    OrdemServico,
)

logger = logging.getLogger(__name__)

_TIMEOUT_SEGUNDOS = 10

_MENSAGENS_STATUS = {
    STATUS_AGUARDANDO_DIAGNOSTICO: "foi aberta e está aguardando diagnóstico.",
    STATUS_EM_EXECUCAO: "está em execução.",
    STATUS_AGUARDANDO_PECAS: "está aguardando a chegada de peças.",
    STATUS_FINALIZADA: "foi finalizada. Seu veículo já pode ser retirado!",
    STATUS_ENTREGUE: "foi entregue. Obrigado pela confiança!",
}


# O httpx registra a URL completa em INFO, e ela contém o token do bot.
logging.getLogger("httpx").setLevel(logging.WARNING)


def telegram_habilitado() -> bool:
    return bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_BOT_USERNAME)


def _url(metodo: str) -> str:
    return f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{metodo}"


def link_de_vinculo(token: str) -> str:
    return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={token}"


def montar_mensagem_status(ordem: OrdemServico) -> str:
    veiculo = ordem.veiculo
    descricao = f"{veiculo.make} {veiculo.model} ({veiculo.plate})"
    acao = _MENSAGENS_STATUS[ordem.status]
    return f"Torque Gestão\nOlá, {ordem.cliente.name}! A OS do seu {descricao} {acao}"


def preparar_notificacao_status(ordem: OrdemServico) -> tuple[str, str] | None:
    """Devolve (chat_id, texto) se o cliente puder receber o aviso; senão, None."""
    cliente = ordem.cliente
    if not telegram_habilitado() or not cliente.telegram_chat_id:
        return None
    return cliente.telegram_chat_id, montar_mensagem_status(ordem)


def enviar_mensagem(chat_id: str, texto: str) -> bool:
    """Envia o texto ao chat. Nunca levanta exceção; devolve se o envio deu certo."""
    if not telegram_habilitado():
        return False
    try:
        resposta = httpx.post(
            _url("sendMessage"),
            json={"chat_id": chat_id, "text": texto},
            timeout=_TIMEOUT_SEGUNDOS,
        )
        resposta.raise_for_status()
        return True
    except httpx.HTTPError as erro:
        logger.warning("Falha ao enviar mensagem ao Telegram: %s", type(erro).__name__)
        return False


def buscar_atualizacoes(offset: int | None, timeout: int = 30) -> list[dict]:
    """Long polling de getUpdates; devolve lista vazia em caso de falha de rede."""
    parametros: dict = {"timeout": timeout, "allowed_updates": ["message"]}
    if offset is not None:
        parametros["offset"] = offset
    try:
        resposta = httpx.get(
            _url("getUpdates"), params=parametros, timeout=timeout + _TIMEOUT_SEGUNDOS
        )
        resposta.raise_for_status()
        return resposta.json().get("result", [])
    except (httpx.HTTPError, ValueError) as erro:
        logger.warning("Falha ao consultar atualizações do Telegram: %s", type(erro).__name__)
        return []

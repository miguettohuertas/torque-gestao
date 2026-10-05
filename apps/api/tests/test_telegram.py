"""RF07: notificações de status por Telegram e vínculo do cliente."""
from contextlib import nullcontext
from datetime import timedelta

import httpx
import pytest
from sqlalchemy import select

from app import telegram_poller
from app.config import settings
from app.models.cliente import Cliente
from app.models.telegram_vinculo import TelegramVinculo
from app.services import telegram, telegram_vinculo
from tests.test_ordens_servico import _preparar_os

CHAT = "123456789"


@pytest.fixture()
def telegram_ativo(monkeypatch):
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "token-de-teste")
    monkeypatch.setattr(settings, "TELEGRAM_BOT_USERNAME", "torque_bot")


@pytest.fixture()
def enviadas(monkeypatch):
    mensagens = []
    monkeypatch.setattr(
        telegram, "enviar_mensagem", lambda chat_id, texto: mensagens.append((chat_id, texto))
    )
    return mensagens


@pytest.fixture()
def cenario(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)
    return headers, cliente_id, veiculo_id, servico_id


def _vincular(db_session, cliente_id, chat_id=CHAT):
    cliente = db_session.get(Cliente, cliente_id)
    cliente.telegram_chat_id = chat_id
    db_session.commit()


def _abrir_os(client, headers, cliente_id, veiculo_id, servico_id):
    response = client.post(
        "/ordens-servico",
        headers=headers,
        json={"cliente_id": cliente_id, "veiculo_id": veiculo_id, "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_abertura_e_mudanca_de_status_avisam_o_cliente(
    client, cenario, db_session, telegram_ativo, enviadas
):
    headers, cliente_id, veiculo_id, servico_id = cenario
    _vincular(db_session, cliente_id)

    os_id = _abrir_os(client, headers, cliente_id, veiculo_id, servico_id)
    assert len(enviadas) == 1 and "aguardando diagnóstico" in enviadas[0][1]

    response = client.patch(
        f"/ordens-servico/{os_id}/status", headers=headers, json={"status": "em_execucao"}
    )
    assert response.status_code == 200
    assert len(enviadas) == 2
    chat_id, texto = enviadas[1]
    assert chat_id == CHAT
    assert "em execução" in texto and "Fiat Uno (ABC1D23)" in texto and "Dono da OS" in texto


def test_finalizada_avisa_que_pode_retirar(client, cenario, db_session, telegram_ativo, enviadas):
    headers, cliente_id, veiculo_id, servico_id = cenario
    _vincular(db_session, cliente_id)
    os_id = _abrir_os(client, headers, cliente_id, veiculo_id, servico_id)
    for novo in ("em_execucao", "aguardando_pecas", "finalizada"):
        client.patch(f"/ordens-servico/{os_id}/status", headers=headers, json={"status": novo})
    assert "já pode ser retirado" in enviadas[-1][1]


@pytest.mark.parametrize("vinculado,ativo", [(False, True), (True, False)])
def test_sem_vinculo_ou_sem_configuracao_nao_envia(
    client, cenario, db_session, monkeypatch, enviadas, vinculado, ativo
):
    headers, cliente_id, veiculo_id, servico_id = cenario
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "token-de-teste" if ativo else "")
    monkeypatch.setattr(settings, "TELEGRAM_BOT_USERNAME", "torque_bot")
    if vinculado:
        _vincular(db_session, cliente_id)

    os_id = _abrir_os(client, headers, cliente_id, veiculo_id, servico_id)
    response = client.patch(
        f"/ordens-servico/{os_id}/status", headers=headers, json={"status": "em_execucao"}
    )
    assert response.status_code == 200
    assert enviadas == []


def test_falha_do_telegram_nao_afeta_a_atualizacao_da_os(
    client, cenario, db_session, telegram_ativo, monkeypatch
):
    headers, cliente_id, veiculo_id, servico_id = cenario
    _vincular(db_session, cliente_id)

    def _falhar(*args, **kwargs):
        raise httpx.ConnectError("sem rede")

    monkeypatch.setattr(httpx, "post", _falhar)
    os_id = _abrir_os(client, headers, cliente_id, veiculo_id, servico_id)
    response = client.patch(
        f"/ordens-servico/{os_id}/status", headers=headers, json={"status": "em_execucao"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "em_execucao"
    assert telegram.enviar_mensagem(CHAT, "oi") is False


def test_transicao_invalida_nao_envia_aviso(client, cenario, db_session, telegram_ativo, enviadas):
    headers, cliente_id, veiculo_id, servico_id = cenario
    _vincular(db_session, cliente_id)
    os_id = _abrir_os(client, headers, cliente_id, veiculo_id, servico_id)
    enviadas.clear()
    response = client.patch(
        f"/ordens-servico/{os_id}/status", headers=headers, json={"status": "entregue"}
    )
    assert response.status_code == 409
    assert enviadas == []


def test_gerar_convite_devolve_link_e_guarda_apenas_o_hash(
    client, cenario, db_session, telegram_ativo
):
    headers, cliente_id, *_ = cenario
    response = client.post(f"/clientes/{cliente_id}/telegram/vinculo", headers=headers)
    assert response.status_code == 200
    link = response.json()["link"]
    assert link.startswith("https://t.me/torque_bot?start=")
    token = link.split("start=")[1]
    convite = db_session.scalar(select(TelegramVinculo))
    assert convite.token_hash != token and token not in convite.token_hash


def test_gerar_convite_sem_configuracao_retorna_503(client, cenario):
    headers, cliente_id, *_ = cenario
    response = client.post(f"/clientes/{cliente_id}/telegram/vinculo", headers=headers)
    assert response.status_code == 503


def test_cliente_gera_convite_so_para_si(
    client, cenario, db_session, telegram_ativo, cliente_user, auth_header
):
    _, cliente_id, *_ = cenario
    cliente_user.cliente_id = cliente_id
    db_session.commit()
    portal = auth_header(cliente_user)

    assert client.post(f"/clientes/{cliente_id}/telegram/vinculo", headers=portal).status_code == 200
    outro = client.post(
        "/clientes",
        headers=cenario[0],
        json={"name": "Outro", "email": "outro@example.com", "cpf": "11.222.333/0001-81"},
    ).json()["id"]
    assert client.post(f"/clientes/{outro}/telegram/vinculo", headers=portal).status_code == 404
    assert client.delete(f"/clientes/{outro}/telegram", headers=portal).status_code == 404


def test_novo_convite_invalida_o_anterior(client, db_session, cenario, telegram_ativo):
    _, cliente_id, *_ = cenario
    cliente = db_session.get(Cliente, cliente_id)
    primeiro = telegram_vinculo.gerar_convite(db_session, cliente)
    segundo = telegram_vinculo.gerar_convite(db_session, cliente)
    assert telegram_vinculo.confirmar_convite(db_session, primeiro, CHAT) is None
    assert telegram_vinculo.confirmar_convite(db_session, segundo, CHAT) is not None


def test_start_com_token_vincula_o_chat_e_o_convite_so_vale_uma_vez(
    client, db_session, cenario, telegram_ativo
):
    headers, cliente_id, *_ = cenario
    token = telegram_vinculo.gerar_convite(db_session, db_session.get(Cliente, cliente_id))

    resposta = telegram_poller.tratar_mensagem(db_session, CHAT, f"/start {token}")
    assert "Pronto, Dono da OS" in resposta
    cliente = client.get(f"/clientes/{cliente_id}", headers=headers).json()
    assert cliente["telegram_vinculado"] is True
    assert "telegram_chat_id" not in cliente

    assert telegram_poller.tratar_mensagem(db_session, "999", f"/start {token}") == (
        telegram_poller.MSG_TOKEN_INVALIDO
    )


def test_convite_expirado_e_token_inexistente_sao_recusados(db_session, cenario, telegram_ativo):
    _, cliente_id, *_ = cenario
    token = telegram_vinculo.gerar_convite(db_session, db_session.get(Cliente, cliente_id))
    convite = db_session.scalar(select(TelegramVinculo))
    convite.expira_em = convite.expira_em - timedelta(hours=1)
    db_session.commit()

    assert telegram_vinculo.confirmar_convite(db_session, token, CHAT) is None
    assert telegram_vinculo.confirmar_convite(db_session, "inexistente", CHAT) is None
    assert db_session.get(Cliente, cliente_id).telegram_chat_id is None


def test_parar_desvincula_todos_os_cadastros_do_mesmo_chat(db_session, cenario, telegram_ativo):
    _, cliente_id, *_ = cenario
    outro = Cliente(name="Outro", email="o@example.com", cpf="11222333000181")
    db_session.add(outro)
    db_session.commit()
    for cliente in (db_session.get(Cliente, cliente_id), outro):
        token = telegram_vinculo.gerar_convite(db_session, cliente)
        assert telegram_vinculo.confirmar_convite(db_session, token, CHAT) is cliente

    assert telegram_poller.tratar_mensagem(db_session, CHAT, "/parar") == telegram_poller.MSG_PARAR
    assert db_session.get(Cliente, cliente_id).telegram_chat_id is None
    assert db_session.get(Cliente, outro.id).telegram_chat_id is None


def test_enviar_mensagem_chama_a_bot_api(telegram_ativo, monkeypatch):
    chamadas = []

    class Resposta:
        def raise_for_status(self):
            pass

    monkeypatch.setattr(
        httpx, "post", lambda url, **kw: chamadas.append((url, kw["json"])) or Resposta()
    )
    assert telegram.enviar_mensagem(CHAT, "olá") is True
    assert chamadas == [
        ("https://api.telegram.org/bottoken-de-teste/sendMessage", {"chat_id": CHAT, "text": "olá"})
    ]


def test_poller_processa_lote_vincula_e_devolve_proximo_offset(
    db_session, cenario, telegram_ativo, enviadas, monkeypatch
):
    _, cliente_id, *_ = cenario
    token = telegram_vinculo.gerar_convite(db_session, db_session.get(Cliente, cliente_id))
    monkeypatch.setattr(telegram_poller, "SessionLocal", lambda: nullcontext(db_session))
    privado = {"id": int(CHAT), "type": "private"}
    lote = [
        {"update_id": 10, "message": {"chat": {"id": -5, "type": "group"}, "text": "/parar"}},
        {"update_id": 11, "message": {"chat": privado, "text": f"/start {token}"}},
        {"update_id": 12, "edited_message": {}},
    ]

    assert telegram_poller.processar_atualizacoes(lote) == 13
    assert db_session.get(Cliente, cliente_id).telegram_chat_id == CHAT
    assert len(enviadas) == 1 and enviadas[0][0] == CHAT
    assert telegram_poller.processar_atualizacoes([]) is None


def test_parar_e_desvincular_removem_o_chat(client, db_session, cenario):
    headers, cliente_id, *_ = cenario
    _vincular(db_session, cliente_id)
    assert telegram_poller.tratar_mensagem(db_session, CHAT, "/parar") == telegram_poller.MSG_PARAR
    assert db_session.get(Cliente, cliente_id).telegram_chat_id is None

    _vincular(db_session, cliente_id)
    assert client.delete(f"/clientes/{cliente_id}/telegram", headers=headers).status_code == 204
    db_session.expire_all()
    assert db_session.get(Cliente, cliente_id).telegram_chat_id is None


def test_mensagens_irrelevantes_nao_geram_resposta(db_session):
    assert telegram_poller.tratar_mensagem(db_session, CHAT, "   ") is None
    assert telegram_poller.tratar_mensagem(db_session, CHAT, "bom dia") is None
    assert telegram_poller.tratar_mensagem(db_session, CHAT, "/start") == (
        telegram_poller.MSG_BOAS_VINDAS
    )

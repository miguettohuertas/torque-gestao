"""
Passos compartilhados dos testes de aceitação (Dado/Quando/Então).

Cada cenário é lido de um arquivo .feature em português, escrito na linguagem
do negócio (oficina), e executado contra a API real com banco de teste. Os
passos só falam com a API pelo HTTP, como o front-end faria.
"""
import re

import pytest
from pytest_bdd import given, parsers, then, when

from app.config import settings
from app.models.cliente import Cliente
from app.services import telegram

STATUS = {
    "Aguardando Diagnóstico": "aguardando_diagnostico",
    "Em Execução": "em_execucao",
    "Aguardando Peças": "aguardando_pecas",
    "Finalizada": "finalizada",
    "Entregue": "entregue",
}
PERFIS = {"administrador": "admin_user", "mecânico": "mecanico_user", "cliente do portal": "cliente_user"}


def _valor(texto: str) -> str:
    """'1.234,50' ou '120.00' -> '1234.50' / '120.00'."""
    return texto.replace(".", "").replace(",", ".") if "," in texto else texto


@pytest.fixture()
def ctx():
    """Memória do cenário: quem está logado, ids criados e a última resposta."""
    return {"headers": {}, "clientes": {}, "veiculos": {}, "servicos": {}, "pecas": {}, "enviadas": []}


@pytest.fixture()
def _admin(client, admin_user, auth_header):
    """Cabeçalho do administrador, usado só para preparar dados (o 'Dado')."""
    return auth_header(admin_user)


@pytest.fixture()
def telegram_ativo(monkeypatch, ctx):
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "token-de-teste")
    monkeypatch.setattr(settings, "TELEGRAM_BOT_USERNAME", "torque_bot")
    monkeypatch.setattr(
        telegram, "enviar_mensagem", lambda chat_id, texto: ctx["enviadas"].append((chat_id, texto))
    )


# --- Dado --------------------------------------------------------------------


@given(parsers.parse("que estou autenticado como {perfil}"))
def autenticado_como(request, ctx, auth_header, perfil):
    ctx["usuario"] = request.getfixturevalue(PERFIS[perfil])
    ctx["headers"] = auth_header(ctx["usuario"])


@given("que não estou autenticado")
def nao_autenticado(ctx):
    ctx["headers"] = {}


@given(parsers.parse('que existe o cliente "{nome}" com CPF "{cpf}"'))
def existe_cliente(client, _admin, ctx, nome, cpf):
    email = re.sub(r"\W+", ".", nome.lower()) + "@example.com"
    response = client.post("/clientes", headers=_admin, json={"name": nome, "email": email, "cpf": cpf})
    assert response.status_code == 201, response.text
    ctx["clientes"][nome] = response.json()["id"]


@given(parsers.parse('que o cliente "{nome}" possui o veículo {marca} {modelo} de placa "{placa}"'))
def existe_veiculo(client, _admin, ctx, nome, marca, modelo, placa):
    response = client.post(
        "/veiculos",
        headers=_admin,
        json={"cliente_id": ctx["clientes"][nome], "plate": placa, "make": marca, "model": modelo},
    )
    assert response.status_code == 201, response.text
    ctx["veiculos"][placa] = response.json()["id"]
    ctx.setdefault("veiculo_do_cliente", {})[nome] = placa


@given(parsers.parse('que o catálogo tem o serviço "{nome}" a R$ {preco}'))
def existe_servico(client, _admin, ctx, nome, preco):
    response = client.post("/catalogo/servicos", headers=_admin, json={"nome": nome, "preco": _valor(preco)})
    assert response.status_code == 201, response.text
    ctx["servicos"][nome] = response.json()["id"]


@given(parsers.parse('que o catálogo tem a peça "{nome}" a R$ {preco}'))
def existe_peca(client, _admin, ctx, nome, preco):
    response = client.post(
        "/catalogo/pecas", headers=_admin, json={"nome": nome, "preco": _valor(preco), "estoque": 10}
    )
    assert response.status_code == 201, response.text
    ctx["pecas"][nome] = response.json()["id"]


def _emitir(client, headers, ctx, nome, itens):
    placa = ctx["veiculo_do_cliente"][nome]
    return client.post(
        "/ordens-servico",
        headers=headers,
        json={"cliente_id": ctx["clientes"][nome], "veiculo_id": ctx["veiculos"][placa], "itens": itens},
    )


@given(parsers.parse('que existe uma OS aberta para o cliente "{nome}" com o serviço "{servico}"'))
def existe_os(client, _admin, ctx, nome, servico):
    itens = [{"tipo": "mao_obra", "catalogo_id": ctx["servicos"][servico], "quantidade": 1}]
    response = _emitir(client, _admin, ctx, nome, itens)
    assert response.status_code == 201, response.text
    ctx.setdefault("os", {})[nome] = response.json()["id"]
    ctx["os_id"] = response.json()["id"]


@given(parsers.parse('que a OS já está com o status "{status}"'))
def os_ja_esta_em(client, ctx, status):
    for etapa in list(STATUS.values())[1 : list(STATUS.values()).index(STATUS[status]) + 1]:
        response = client.patch(
            f"/ordens-servico/{ctx['os_id']}/status", headers=ctx["headers"], json={"status": etapa}
        )
        assert response.status_code == 200, response.text


@given(parsers.parse('que o cliente "{nome}" tem acesso ao portal'))
def acesso_ao_portal(client, db_session, ctx, cliente_user, auth_header, nome):
    cliente_user.cliente_id = ctx["clientes"][nome]
    db_session.commit()
    ctx["usuario"] = cliente_user
    ctx["headers"] = auth_header(cliente_user)


@given(parsers.parse('que o cliente "{nome}" vinculou o Telegram'))
def vinculou_telegram(db_session, ctx, telegram_ativo, nome):
    db_session.get(Cliente, ctx["clientes"][nome]).telegram_chat_id = "555000111"
    db_session.commit()


# --- Quando ------------------------------------------------------------------


@when(parsers.parse('cadastro o cliente "{nome}" com e-mail "{email}" e CPF "{cpf}"'))
def cadastrar_cliente(client, ctx, nome, email, cpf):
    ctx["resposta"] = client.post(
        "/clientes", headers=ctx["headers"], json={"name": nome, "email": email, "cpf": cpf}
    )


@when(parsers.parse('cadastro o veículo {marca} {modelo} de placa "{placa}" para o cliente "{nome}"'))
def cadastrar_veiculo(client, ctx, marca, modelo, placa, nome):
    ctx["resposta"] = client.post(
        "/veiculos",
        headers=ctx["headers"],
        json={"cliente_id": ctx["clientes"][nome], "plate": placa, "make": marca, "model": modelo},
    )


@when(parsers.parse('cadastro o serviço "{nome}" a R$ {preco} no catálogo'))
def cadastrar_servico(client, ctx, nome, preco):
    ctx["resposta"] = client.post(
        "/catalogo/servicos", headers=ctx["headers"], json={"nome": nome, "preco": _valor(preco)}
    )


@when(
    parsers.parse(
        'emito uma OS para o cliente "{nome}" com {qs:d} x o serviço "{servico}" e {qp:d} x a peça "{peca}"'
    )
)
def emitir_os_com_servico_e_peca(client, ctx, nome, qs, servico, qp, peca):
    itens = [
        {"tipo": "mao_obra", "catalogo_id": ctx["servicos"][servico], "quantidade": qs},
        {"tipo": "peca", "catalogo_id": ctx["pecas"][peca], "quantidade": qp},
    ]
    ctx["resposta"] = _emitir(client, ctx["headers"], ctx, nome, itens)
    if ctx["resposta"].status_code == 201:
        ctx["os_id"] = ctx["resposta"].json()["id"]


@when(parsers.parse('emito uma OS para o cliente "{nome}" com o serviço "{servico}"'))
def emitir_os_com_servico(client, ctx, nome, servico):
    itens = [{"tipo": "mao_obra", "catalogo_id": ctx["servicos"][servico], "quantidade": 1}]
    ctx["resposta"] = _emitir(client, ctx["headers"], ctx, nome, itens)
    if ctx["resposta"].status_code == 201:
        ctx["os_id"] = ctx["resposta"].json()["id"]


@when(parsers.parse('avanço a OS para "{status}"'))
def avancar_os(client, ctx, status):
    ctx["resposta"] = client.patch(
        f"/ordens-servico/{ctx['os_id']}/status", headers=ctx["headers"], json={"status": STATUS[status]}
    )


@when("consulto a lista de veículos")
def listar_veiculos(client, ctx):
    ctx["resposta"] = client.get("/veiculos", headers=ctx["headers"])


@when("consulto a lista de ordens de serviço")
def listar_os(client, ctx):
    ctx["resposta"] = client.get("/ordens-servico", headers=ctx["headers"])


@when(parsers.parse('consulto a OS do cliente "{nome}"'))
def consultar_os_de(client, ctx, nome):
    ctx["resposta"] = client.get(f"/ordens-servico/{ctx['os'][nome]}", headers=ctx["headers"])


@when(parsers.parse('consulto o histórico da OS'))
def consultar_historico(client, ctx):
    ctx["resposta"] = client.get(f"/ordens-servico/{ctx['os_id']}/historico", headers=ctx["headers"])


@when(parsers.parse('faço login com o e-mail do administrador e a senha "{senha}"'))
def fazer_login(client, ctx, admin_user, senha):
    ctx["resposta"] = client.post("/auth/login", data={"username": admin_user.email, "password": senha})


# --- Então -------------------------------------------------------------------


@then(parsers.parse("o sistema responde {codigo:d}"))
def resposta_com_status(ctx, codigo):
    assert ctx["resposta"].status_code == codigo, ctx["resposta"].text


@then(parsers.parse('a resposta traz {campo} igual a "{valor}"'))
def resposta_com_campo(ctx, campo, valor):
    assert str(ctx["resposta"].json()[campo]) == valor


@then(parsers.parse("o orçamento total é R$ {valor}"))
def orcamento_total(ctx, valor):
    from decimal import Decimal

    assert Decimal(ctx["resposta"].json()["orcamento_total"]) == Decimal(_valor(valor))


@then(parsers.parse('a OS fica com o status "{status}"'))
def os_com_status(ctx, status):
    assert ctx["resposta"].json()["status"] == STATUS[status]


@then(parsers.parse("o histórico da OS tem {n:d} registros"))
def historico_tem(client, ctx, n):
    historico = client.get(f"/ordens-servico/{ctx['os_id']}/historico", headers=ctx["headers"]).json()
    assert len(historico) == n


@then(parsers.parse("a lista tem {n:d} item(ns)"))
def lista_tem(ctx, n):
    assert len(ctx["resposta"].json()) == n


@then(parsers.parse('a lista inclui a placa "{placa}"'))
def lista_inclui_placa(ctx, placa):
    assert placa in [v["plate"] for v in ctx["resposta"].json()]


@then(parsers.parse('a lista não inclui a placa "{placa}"'))
def lista_nao_inclui_placa(ctx, placa):
    assert placa not in [v["plate"] for v in ctx["resposta"].json()]


@then("a resposta traz um token de acesso")
def traz_token(ctx):
    assert ctx["resposta"].json()["access_token"]


@then(parsers.parse("o cliente recebe {n:d} aviso(s) no Telegram"))
def avisos_telegram(ctx, n):
    assert len(ctx["enviadas"]) == n


@then(parsers.parse('o último aviso menciona "{texto}"'))
def ultimo_aviso(ctx, texto):
    assert texto in ctx["enviadas"][-1][1]

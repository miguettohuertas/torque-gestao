"""
Testes de desempenho "baratos", que rodam junto com a suíte:

- consultas SQL por requisição: uma listagem não pode disparar uma consulta
  extra por registro (problema N+1), senão fica lenta com a base crescendo;
- orçamento de tempo: listagens com centenas de registros respondem rápido.

A carga com usuários simultâneos fica em tests/carga (Locust).
"""
import time

import pytest
from sqlalchemy import event

from tests.test_ordens_servico import _criar_cliente, _criar_servico_catalogo, _criar_veiculo

pytestmark = pytest.mark.desempenho


@pytest.fixture()
def contar_consultas(engine, db_session):
    """Devolve uma função que conta as consultas SQL executadas dentro do bloco."""
    consultas = []

    def _registrar(conn, cursor, statement, *args):
        consultas.append(statement)

    event.listen(engine, "before_cursor_execute", _registrar)

    def _medir(chamada):
        # Em produção cada requisição abre uma sessão nova; aqui a sessão é
        # compartilhada, então limpa o cache para não esconder consultas.
        db_session.expire_all()
        consultas.clear()
        resposta = chamada()
        return resposta, len(consultas)

    yield _medir
    event.remove(engine, "before_cursor_execute", _registrar)


def _criar_ordens(client, headers, quantidade):
    cliente = _criar_cliente(client, headers)
    veiculo = _criar_veiculo(client, headers, cliente)
    servico = _criar_servico_catalogo(client, headers)
    for _ in range(quantidade):
        response = client.post(
            "/ordens-servico",
            headers=headers,
            json={
                "cliente_id": cliente,
                "veiculo_id": veiculo,
                "itens": [{"tipo": "mao_obra", "catalogo_id": servico, "quantidade": 1}] * 2,
            },
        )
        assert response.status_code == 201, response.text
    return cliente


def test_listar_ordens_nao_faz_uma_consulta_por_registro(
    client, admin_user, auth_header, contar_consultas
):
    headers = auth_header(admin_user)
    _criar_ordens(client, headers, 3)
    _, com_3 = contar_consultas(lambda: client.get("/ordens-servico", headers=headers))

    _criar_ordens_extras(client, headers, 27)
    resposta, com_30 = contar_consultas(lambda: client.get("/ordens-servico", headers=headers))

    assert len(resposta.json()) == 30
    assert com_30 == com_3, f"{com_3} consultas com 3 OS, mas {com_30} com 30 OS (N+1)"


def _criar_ordens_extras(client, headers, quantidade):
    cliente = client.get("/clientes", headers=headers).json()[0]["id"]
    veiculo = client.get("/veiculos", headers=headers).json()[0]["id"]
    servico = client.get("/catalogo/servicos", headers=headers).json()[0]["id"]
    for _ in range(quantidade):
        client.post(
            "/ordens-servico",
            headers=headers,
            json={
                "cliente_id": cliente,
                "veiculo_id": veiculo,
                "itens": [{"tipo": "mao_obra", "catalogo_id": servico, "quantidade": 1}] * 2,
            },
        )


def test_listar_ordens_do_portal_tambem_nao_tem_n_mais_1(
    client, db_session, admin_user, cliente_user, auth_header, contar_consultas
):
    headers = auth_header(admin_user)
    cliente = _criar_ordens(client, headers, 3)
    cliente_user.cliente_id = cliente
    db_session.commit()
    portal = auth_header(cliente_user)
    _, com_3 = contar_consultas(lambda: client.get("/ordens-servico", headers=portal))

    _criar_ordens_extras(client, headers, 17)
    _, com_20 = contar_consultas(lambda: client.get("/ordens-servico", headers=portal))

    assert com_20 == com_3


@pytest.mark.parametrize("rota", ["/clientes", "/veiculos", "/catalogo/servicos", "/catalogo/pecas"])
def test_listagens_simples_usam_uma_consulta_de_dados(
    client, admin_user, auth_header, contar_consultas, rota
):
    headers = auth_header(admin_user)
    _criar_ordens(client, headers, 1)
    for i in range(10):
        client.post("/catalogo/pecas", headers=headers, json={"nome": f"Peça {i}", "preco": "10.00"})

    resposta, total = contar_consultas(lambda: client.get(rota, headers=headers))

    assert resposta.status_code == 200
    assert total <= 2, f"{rota} executou {total} consultas"  # 1 do usuário autenticado + 1 da lista


def test_listar_300_ordens_responde_dentro_do_orcamento_de_tempo(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    _criar_ordens(client, headers, 1)
    _criar_ordens_extras(client, headers, 299)

    inicio = time.perf_counter()
    resposta = client.get("/ordens-servico", headers=headers)
    duracao = time.perf_counter() - inicio

    assert resposta.status_code == 200 and len(resposta.json()) == 300
    assert duracao < 2.0, f"listar 300 OS levou {duracao:.2f}s"


def test_orcamento_de_tempo_das_rotas_principais(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    _criar_ordens(client, headers, 20)

    for rota in ("/health", "/auth/me", "/clientes", "/veiculos", "/ordens-servico", "/catalogo/servicos"):
        inicio = time.perf_counter()
        resposta = client.get(rota, headers=headers)
        duracao = time.perf_counter() - inicio
        assert resposta.status_code == 200, rota
        assert duracao < 1.0, f"{rota} levou {duracao:.2f}s"

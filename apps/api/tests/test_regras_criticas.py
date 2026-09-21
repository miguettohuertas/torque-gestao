"""RF03/RF04: contrato HTTP, persistência, integridade e autorização do portal."""
from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.models.catalogo_peca import CatalogoPeca
from app.models.historico_status import HistoricoStatus
from app.models.ordem_servico import FLUXO_STATUS_OS, OrdemServico
from tests.test_ordens_servico import _criar_cliente, _preparar_os


@pytest.fixture()
def scenario(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    customer, vehicle, service, part = _preparar_os(client, headers)
    payload = {
        "cliente_id": customer, "veiculo_id": vehicle,
        "itens": [
            {"tipo": "mao_obra", "catalogo_id": service, "quantidade": 2},
            {"tipo": "peca", "catalogo_id": part, "quantidade": 3},
        ],
    }
    return headers, payload


def create_order(client, scenario):
    headers, payload = scenario
    response = client.post("/ordens-servico", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_precos_do_cliente_nao_alteram_orcamento_e_snapshot_persiste(
    client, scenario, db_session
):
    headers, payload = scenario
    payload["orcamento_total"] = "0.01"
    payload["itens"][1]["valor_unitario"] = "0.01"
    order = create_order(client, scenario)
    assert Decimal(order["orcamento_total"]) == Decimal("346.50")
    assert sorted(Decimal(i["subtotal"]) for i in order["itens"]) == [
        Decimal("106.50"), Decimal("240.00")
    ]
    part = db_session.get(CatalogoPeca, payload["itens"][1]["catalogo_id"])
    part.preco = Decimal("99.99")
    part.nome = "Preço atualizado"
    db_session.commit()
    db_session.expire_all()
    saved = client.get(f'/ordens-servico/{order["id"]}', headers=headers).json()
    assert saved == order


@pytest.mark.parametrize("quantity", [0, -1, 1.5])
def test_quantidade_invalida_nao_persiste_os(client, scenario, db_session, quantity):
    headers, payload = scenario
    payload["itens"][0]["quantidade"] = quantity
    assert client.post("/ordens-servico", headers=headers, json=payload).status_code == 422
    assert db_session.scalar(select(func.count()).select_from(OrdemServico)) == 0
    assert db_session.scalar(select(func.count()).select_from(HistoricoStatus)) == 0


@pytest.mark.parametrize("case,expected", [("vazio", 422), ("tipo", 422), ("catalogo", 404), ("cliente", 404), ("veiculo", 404)])
def test_criacao_invalida_e_atomica(client, scenario, db_session, case, expected):
    headers, payload = scenario
    if case == "vazio":
        payload["itens"] = []
    elif case == "tipo":
        payload["itens"][0]["tipo"] = "outro"
    elif case == "catalogo":
        payload["itens"][1]["catalogo_id"] = "inexistente"
    else:
        payload[f"{case}_id"] = "inexistente"
    assert client.post("/ordens-servico", headers=headers, json=payload).status_code == expected
    assert db_session.scalar(select(func.count()).select_from(OrdemServico)) == 0
    assert db_session.scalar(select(func.count()).select_from(HistoricoStatus)) == 0


@pytest.mark.parametrize("initial,target", [(a, b) for a in range(5) for b in range(5)])
def test_matriz_completa_transicoes_e_historico(
    client, scenario, admin_user, db_session, initial, target
):
    headers, _ = scenario
    order = create_order(client, scenario)
    path = f'/ordens-servico/{order["id"]}'
    for step in FLUXO_STATUS_OS[1:initial + 1]:
        assert client.patch(f"{path}/status", headers=headers, json={"status": step}).status_code == 200
    before = client.get(f"{path}/historico", headers=headers).json()
    response = client.patch(f"{path}/status", headers=headers, json={"status": FLUXO_STATUS_OS[target]})
    valid = target == initial + 1
    assert response.status_code == (200 if valid else 409)
    db_session.expire_all()
    saved = client.get(path, headers=headers).json()
    assert saved["status"] == FLUXO_STATUS_OS[target if valid else initial]
    history = client.get(f"{path}/historico", headers=headers).json()
    assert len(history) == len(before) + int(valid)
    assert [h["status"] for h in history] == list(FLUXO_STATUS_OS[:(target if valid else initial) + 1])
    assert all(h["usuario_id"] == admin_user.id and h["data"] for h in history)
    if not valid:
        assert history == before


def test_status_desconhecido_nao_muda_historico(client, scenario):
    headers, _ = scenario
    order = create_order(client, scenario)
    path = f'/ordens-servico/{order["id"]}'
    assert client.patch(f"{path}/status", headers=headers, json={"status": "cancelada"}).status_code == 422
    assert len(client.get(f"{path}/historico", headers=headers).json()) == 1


def test_mecanico_pode_emitir_e_avancar(client, scenario, mecanico_user, auth_header):
    _, payload = scenario
    headers = auth_header(mecanico_user)
    payload["mecanico_id"] = mecanico_user.id
    order = create_order(client, (headers, payload))
    assert order["mecanico_id"] == mecanico_user.id
    path = f'/ordens-servico/{order["id"]}'
    assert client.patch(f"{path}/status", headers=headers, json={"status": "em_execucao"}).status_code == 200
    assert all(h["usuario_id"] == mecanico_user.id for h in client.get(f"{path}/historico", headers=headers).json())


def test_portal_isolamento_listas_detalhes_filtros_e_escrita(
    client, scenario, cliente_user, auth_header, db_session
):
    admin_headers, payload = scenario
    order = create_order(client, scenario)
    other = _criar_cliente(client, admin_headers, email="outro@example.com", cpf="11.222.333/0001-81")
    vehicle = client.post("/veiculos", headers=admin_headers, json={
        "cliente_id": other, "plate": "DEF5678", "make": "VW", "model": "Gol"
    }).json()
    other_order = client.post("/ordens-servico", headers=admin_headers, json={
        **payload, "cliente_id": other, "veiculo_id": vehicle["id"]
    }).json()
    cliente_user.cliente_id = payload["cliente_id"]
    db_session.commit()
    headers = auth_header(cliente_user)
    for path, own, foreign in [
        ("clientes", payload["cliente_id"], other),
        ("veiculos", payload["veiculo_id"], vehicle["id"]),
        ("ordens-servico", order["id"], other_order["id"]),
    ]:
        assert [x["id"] for x in client.get(f"/{path}", headers=headers).json()] == [own]
        assert client.get(f"/{path}/{own}", headers=headers).status_code == 200
        assert client.get(f"/{path}/{foreign}", headers=headers).status_code == 404
    for path in ("veiculos", "ordens-servico"):
        assert client.get(f"/{path}?cliente_id={other}", headers=headers).json() == []
    assert client.get(f'/ordens-servico?veiculo_id={vehicle["id"]}', headers=headers).json() == []
    assert client.get(f'/ordens-servico/{other_order["id"]}/historico', headers=headers).status_code == 404
    assert len(client.get(f'/ordens-servico/{order["id"]}/historico', headers=headers).json()) == 1
    assert client.patch(f'/ordens-servico/{order["id"]}/status', headers=headers, json={"status": "em_execucao"}).status_code == 403
    assert client.post("/ordens-servico", headers=headers, json=payload).status_code == 403
    for path, entity_id, values in [
        ("clientes", payload["cliente_id"], {"name": "Alterado", "email": "alterado@example.com", "cpf": "11144477735"}),
        ("veiculos", payload["veiculo_id"], {"cliente_id": other, "plate": "XYZ1234", "make": "VW", "model": "Gol"}),
    ]:
        assert client.put(f"/{path}/{entity_id}", headers=headers, json=values).status_code == 403
        assert client.delete(f"/{path}/{entity_id}", headers=headers).status_code == 403


def test_portal_sem_vinculo_nao_usa_email_para_autorizar(client, scenario, cliente_user, auth_header, db_session):
    create_order(client, scenario)
    from app.models.cliente import Cliente
    cliente_user.email = db_session.get(Cliente, scenario[1]["cliente_id"]).email
    db_session.commit()
    headers = auth_header(cliente_user)
    for path in ("clientes", "veiculos", "ordens-servico"):
        response = client.get(f"/{path}", headers=headers)
        assert response.status_code == 200
        assert response.json() == []


def test_rotas_operacionais_exigem_login(client, scenario):
    order = create_order(client, scenario)
    for path in ("/clientes", "/veiculos", "/ordens-servico", f'/ordens-servico/{order["id"]}', f'/ordens-servico/{order["id"]}/historico'):
        assert client.get(path).status_code == 401
    assert client.post('/ordens-servico', json=scenario[1]).status_code == 401
    assert client.patch(f'/ordens-servico/{order["id"]}/status', json={"status": "em_execucao"}).status_code == 401


def test_transicao_concorrente_nao_duplica_historico(client, scenario, db_session, admin_user):
    from fastapi import HTTPException
    from sqlalchemy.orm import Session

    from app.routers.ordens_servico import atualizar_status
    from app.schemas.ordem_servico import StatusUpdate

    order = create_order(client, scenario)
    stale = db_session.get(OrdemServico, order["id"])
    assert stale.status == "aguardando_diagnostico"
    # Duas sessões leram a mesma etapa; a primeira conclui antes do UPDATE da segunda.
    with Session(bind=db_session.get_bind()) as concurrent:
        atualizar_status(order["id"], StatusUpdate(status="em_execucao"), concurrent, admin_user)
    assert stale.status == "aguardando_diagnostico"
    with pytest.raises(HTTPException) as error:
        atualizar_status(order["id"], StatusUpdate(status="em_execucao"), db_session, admin_user)
    assert error.value.status_code == 409
    assert db_session.scalar(select(func.count()).select_from(HistoricoStatus)) == 2
    db_session.refresh(stale)
    assert stale.status == "em_execucao"


def test_exclusao_de_cliente_com_login_retorna_conflito(client, scenario, cliente_user, db_session):
    headers, payload = scenario
    cliente_user.cliente_id = payload["cliente_id"]
    db_session.commit()
    path = f'/clientes/{payload["cliente_id"]}'
    assert client.delete(path, headers=headers).status_code == 409
    assert client.get(path, headers=headers).status_code == 200

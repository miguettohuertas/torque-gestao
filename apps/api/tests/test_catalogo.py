import pytest


def test_criar_servico_como_admin_retorna_201(client, admin_user, auth_header):
    response = client.post(
        "/catalogo/servicos",
        json={"nome": "Troca de óleo", "categoria": "Manutenção", "preco": "120.00"},
        headers=auth_header(admin_user),
    )

    assert response.status_code == 201
    assert response.json()["nome"] == "Troca de óleo"


def test_criar_servico_com_preco_invalido_retorna_422(client, admin_user, auth_header):
    response = client.post(
        "/catalogo/servicos",
        json={"nome": "Troca de óleo", "preco": "0"},
        headers=auth_header(admin_user),
    )

    assert response.status_code == 422


def test_criar_servico_como_mecanico_retorna_403(client, mecanico_user, auth_header):
    response = client.post(
        "/catalogo/servicos",
        json={"nome": "Troca de óleo", "preco": "120.00"},
        headers=auth_header(mecanico_user),
    )

    assert response.status_code == 403


def test_listar_servicos_como_mecanico_retorna_200(client, admin_user, mecanico_user, auth_header):
    client.post(
        "/catalogo/servicos",
        json={"nome": "Troca de óleo", "preco": "120.00"},
        headers=auth_header(admin_user),
    )

    response = client.get("/catalogo/servicos", headers=auth_header(mecanico_user))

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_atualizar_e_remover_servico(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    criado = client.post(
        "/catalogo/servicos",
        json={"nome": "Troca de óleo", "preco": "120.00"},
        headers=headers,
    ).json()

    atualizado = client.put(
        f"/catalogo/servicos/{criado['id']}",
        json={"nome": "Troca de óleo sintético", "preco": "150.00"},
        headers=headers,
    )
    removido = client.delete(f"/catalogo/servicos/{criado['id']}", headers=headers)

    assert atualizado.status_code == 200
    assert atualizado.json()["nome"] == "Troca de óleo sintético"
    assert removido.status_code == 204


def test_criar_peca_como_admin_retorna_201(client, admin_user, auth_header):
    response = client.post(
        "/catalogo/pecas",
        json={"nome": "Filtro de óleo", "marca": "Bosch", "preco": "35.50", "estoque": 10},
        headers=auth_header(admin_user),
    )

    assert response.status_code == 201
    assert response.json()["estoque"] == 10


def test_criar_peca_com_estoque_negativo_retorna_422(client, admin_user, auth_header):
    response = client.post(
        "/catalogo/pecas",
        json={"nome": "Filtro de óleo", "preco": "35.50", "estoque": -1},
        headers=auth_header(admin_user),
    )

    assert response.status_code == 422


def test_listar_atualizar_e_remover_peca(client, admin_user, mecanico_user, auth_header):
    admin = auth_header(admin_user)
    criada = client.post(
        "/catalogo/pecas",
        json={"nome": "Filtro de ar", "marca": "Mann", "preco": "48.00", "estoque": 5},
        headers=admin,
    ).json()

    listadas = client.get("/catalogo/pecas", headers=auth_header(mecanico_user))
    atualizada = client.put(
        f"/catalogo/pecas/{criada['id']}",
        json={"nome": "Filtro de ar esportivo", "marca": "K&N", "preco": "199.90", "estoque": 2},
        headers=admin,
    )
    removida = client.delete(f"/catalogo/pecas/{criada['id']}", headers=admin)

    assert [p["nome"] for p in listadas.json()] == ["Filtro de ar"]
    assert atualizada.status_code == 200
    assert atualizada.json()["estoque"] == 2
    assert removida.status_code == 204
    assert client.get("/catalogo/pecas", headers=admin).json() == []


def test_mecanico_nao_altera_nem_remove_peca(client, admin_user, mecanico_user, auth_header):
    criada = client.post(
        "/catalogo/pecas",
        json={"nome": "Vela", "preco": "25.00", "estoque": 8},
        headers=auth_header(admin_user),
    ).json()
    mecanico = auth_header(mecanico_user)

    alterar = client.put(
        f"/catalogo/pecas/{criada['id']}",
        json={"nome": "Vela", "preco": "1.00", "estoque": 8},
        headers=mecanico,
    )
    remover = client.delete(f"/catalogo/pecas/{criada['id']}", headers=mecanico)

    assert alterar.status_code == 403
    assert remover.status_code == 403


@pytest.mark.parametrize(
    "metodo, rota, corpo",
    [
        ("put", "/catalogo/servicos/inexistente", {"nome": "X", "preco": "1.00"}),
        ("delete", "/catalogo/servicos/inexistente", None),
        ("put", "/catalogo/pecas/inexistente", {"nome": "X", "preco": "1.00", "estoque": 0}),
        ("delete", "/catalogo/pecas/inexistente", None),
    ],
)
def test_item_de_catalogo_inexistente_retorna_404(
    client, admin_user, auth_header, metodo, rota, corpo
):
    kwargs = {"headers": auth_header(admin_user)}
    if corpo is not None:
        kwargs["json"] = corpo

    response = getattr(client, metodo)(rota, **kwargs)

    assert response.status_code == 404


# Regressão: achado pelo teste de contrato. Um preço como 0.001 passava na
# validação (> 0), virava 0.00 no banco e a resposta estourava com erro 500.
@pytest.mark.parametrize("rota", ["/catalogo/servicos", "/catalogo/pecas"])
@pytest.mark.parametrize("preco", ["0.001", "0.004", "10.999", "123456789.00"])
def test_preco_fora_do_formato_do_banco_retorna_422_e_nao_500(
    client, admin_user, auth_header, rota, preco
):
    response = client.post(
        rota, json={"nome": "Item", "preco": preco}, headers=auth_header(admin_user)
    )

    assert response.status_code == 422


@pytest.mark.parametrize("rota", ["/catalogo/servicos", "/catalogo/pecas"])
def test_preco_com_duas_casas_e_no_limite_do_banco_e_aceito(client, admin_user, auth_header, rota):
    response = client.post(
        rota, json={"nome": "Item", "preco": "99999999.99"}, headers=auth_header(admin_user)
    )

    assert response.status_code == 201

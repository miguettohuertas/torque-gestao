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

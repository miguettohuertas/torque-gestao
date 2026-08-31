CPF_VALIDO = "111.444.777-35"
CNPJ_VALIDO = "11.222.333/0001-81"


def _payload_cliente(**overrides):
    payload = {
        "name": "Fulano da Silva",
        "email": "fulano@example.com",
        "phone": "47999990000",
        "cpf": CPF_VALIDO,
    }
    payload.update(overrides)
    return payload


def test_criar_cliente_como_admin_retorna_201_com_documento_normalizado(
    client, admin_user, auth_header
):
    response = client.post(
        "/clientes", json=_payload_cliente(), headers=auth_header(admin_user)
    )

    assert response.status_code == 201
    body = response.json()
    assert body["cpf"] == "11144477735"
    assert body["id"]


def test_criar_cliente_pessoa_juridica_com_cnpj_valido_retorna_201(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        json=_payload_cliente(email="oficina@example.com", cpf=CNPJ_VALIDO),
        headers=auth_header(admin_user),
    )

    assert response.status_code == 201
    assert response.json()["cpf"] == "11222333000181"


def test_criar_cliente_com_documento_invalido_retorna_422(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        json=_payload_cliente(cpf="111.111.111-11"),
        headers=auth_header(admin_user),
    )

    assert response.status_code == 422


def test_criar_cliente_com_email_duplicado_retorna_409(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    client.post("/clientes", json=_payload_cliente(), headers=headers)

    response = client.post(
        "/clientes",
        json=_payload_cliente(cpf=CNPJ_VALIDO),
        headers=headers,
    )

    assert response.status_code == 409


def test_criar_cliente_como_mecanico_retorna_201(client, mecanico_user, auth_header):
    response = client.post(
        "/clientes", json=_payload_cliente(), headers=auth_header(mecanico_user)
    )

    assert response.status_code == 201


def test_criar_cliente_como_cliente_retorna_403(client, cliente_user, auth_header):
    response = client.post(
        "/clientes", json=_payload_cliente(), headers=auth_header(cliente_user)
    )

    assert response.status_code == 403


def test_listar_clientes_sem_token_retorna_401(client):
    response = client.get("/clientes")

    assert response.status_code == 401


def test_buscar_cliente_por_nome_retorna_apenas_correspondentes(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    client.post(
        "/clientes",
        json=_payload_cliente(name="Ana Torres", email="ana@example.com"),
        headers=headers,
    )
    client.post(
        "/clientes",
        json=_payload_cliente(name="Bruno Melo", email="bruno@example.com", cpf=CNPJ_VALIDO),
        headers=headers,
    )

    response = client.get("/clientes", params={"busca": "Ana"}, headers=headers)

    assert response.status_code == 200
    nomes = [cliente["name"] for cliente in response.json()]
    assert nomes == ["Ana Torres"]


def test_obter_cliente_inexistente_retorna_404(client, admin_user, auth_header):
    response = client.get("/clientes/id-que-nao-existe", headers=auth_header(admin_user))

    assert response.status_code == 404


def test_atualizar_cliente_persiste_alteracoes(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    criado = client.post("/clientes", json=_payload_cliente(), headers=headers).json()

    response = client.put(
        f"/clientes/{criado['id']}",
        json=_payload_cliente(name="Fulano Atualizado"),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Fulano Atualizado"


def test_remover_cliente_retorna_204_e_some_da_listagem(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    criado = client.post("/clientes", json=_payload_cliente(), headers=headers).json()

    delete_response = client.delete(f"/clientes/{criado['id']}", headers=headers)
    get_response = client.get(f"/clientes/{criado['id']}", headers=headers)

    assert delete_response.status_code == 204
    assert get_response.status_code == 404

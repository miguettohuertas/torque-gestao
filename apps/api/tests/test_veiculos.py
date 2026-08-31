CPF_VALIDO = "111.444.777-35"


def _criar_cliente(client, headers) -> str:
    response = client.post(
        "/clientes",
        json={
            "name": "Dono do Veículo",
            "email": "dono@example.com",
            "phone": "47999990000",
            "cpf": CPF_VALIDO,
        },
        headers=headers,
    )
    return response.json()["id"]


def _payload_veiculo(cliente_id: str, **overrides):
    payload = {
        "cliente_id": cliente_id,
        "plate": "ABC1D23",
        "make": "Fiat",
        "model": "Uno",
        "year": "2020",
    }
    payload.update(overrides)
    return payload


def test_criar_veiculo_com_placa_mercosul_retorna_201_normalizada(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)

    response = client.post(
        "/veiculos", json=_payload_veiculo(cliente_id, plate="abc1d23"), headers=headers
    )

    assert response.status_code == 201
    assert response.json()["plate"] == "ABC1D23"


def test_criar_veiculo_com_placa_padrao_antigo_e_hifen_retorna_201_normalizada(
    client, admin_user, auth_header
):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)

    response = client.post(
        "/veiculos", json=_payload_veiculo(cliente_id, plate="abc-1234"), headers=headers
    )

    assert response.status_code == 201
    assert response.json()["plate"] == "ABC1234"


def test_criar_veiculo_com_placa_invalida_retorna_422(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)

    response = client.post(
        "/veiculos", json=_payload_veiculo(cliente_id, plate="ABCD123"), headers=headers
    )

    assert response.status_code == 422


def test_criar_veiculo_com_cliente_inexistente_retorna_404(client, admin_user, auth_header):
    response = client.post(
        "/veiculos",
        json=_payload_veiculo("cliente-que-nao-existe"),
        headers=auth_header(admin_user),
    )

    assert response.status_code == 404


def test_criar_veiculo_com_placa_duplicada_retorna_409(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)
    client.post("/veiculos", json=_payload_veiculo(cliente_id), headers=headers)

    response = client.post("/veiculos", json=_payload_veiculo(cliente_id), headers=headers)

    assert response.status_code == 409


def test_criar_veiculo_como_cliente_retorna_403(client, admin_user, cliente_user, auth_header):
    cliente_id = _criar_cliente(client, auth_header(admin_user))

    response = client.post(
        "/veiculos", json=_payload_veiculo(cliente_id), headers=auth_header(cliente_user)
    )

    assert response.status_code == 403


def test_listar_veiculos_filtrado_por_cliente(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)
    outro_cliente_id = client.post(
        "/clientes",
        json={
            "name": "Outro Cliente",
            "email": "outro@example.com",
            "cpf": "11.222.333/0001-81",
        },
        headers=headers,
    ).json()["id"]
    client.post("/veiculos", json=_payload_veiculo(cliente_id), headers=headers)
    client.post(
        "/veiculos", json=_payload_veiculo(outro_cliente_id, plate="XYZ9A88"), headers=headers
    )

    response = client.get("/veiculos", params={"cliente_id": cliente_id}, headers=headers)

    assert response.status_code == 200
    placas = [veiculo["plate"] for veiculo in response.json()]
    assert placas == ["ABC1D23"]


def test_atualizar_veiculo_persiste_alteracoes(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)
    criado = client.post("/veiculos", json=_payload_veiculo(cliente_id), headers=headers).json()

    response = client.put(
        f"/veiculos/{criado['id']}",
        json=_payload_veiculo(cliente_id, model="Palio"),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["model"] == "Palio"


def test_remover_veiculo_retorna_204_e_some_da_listagem(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id = _criar_cliente(client, headers)
    criado = client.post("/veiculos", json=_payload_veiculo(cliente_id), headers=headers).json()

    delete_response = client.delete(f"/veiculos/{criado['id']}", headers=headers)
    get_response = client.get(f"/veiculos/{criado['id']}", headers=headers)

    assert delete_response.status_code == 204
    assert get_response.status_code == 404

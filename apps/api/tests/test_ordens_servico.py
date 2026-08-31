CPF_VALIDO = "111.444.777-35"
CNPJ_VALIDO = "11.222.333/0001-81"


def _criar_cliente(client, headers, email="dono.os@example.com", cpf=CPF_VALIDO) -> str:
    response = client.post(
        "/clientes",
        json={"name": "Dono da OS", "email": email, "cpf": cpf},
        headers=headers,
    )
    return response.json()["id"]


def _criar_veiculo(client, headers, cliente_id: str) -> str:
    response = client.post(
        "/veiculos",
        json={"cliente_id": cliente_id, "plate": "ABC1D23", "make": "Fiat", "model": "Uno"},
        headers=headers,
    )
    return response.json()["id"]


def _criar_servico_catalogo(client, headers) -> str:
    response = client.post(
        "/catalogo/servicos",
        json={"nome": "Troca de óleo", "preco": "120.00"},
        headers=headers,
    )
    return response.json()["id"]


def _criar_peca_catalogo(client, headers) -> str:
    response = client.post(
        "/catalogo/pecas",
        json={"nome": "Filtro de óleo", "preco": "35.50", "estoque": 10},
        headers=headers,
    )
    return response.json()["id"]


def _preparar_os(client, headers):
    cliente_id = _criar_cliente(client, headers)
    veiculo_id = _criar_veiculo(client, headers, cliente_id)
    servico_id = _criar_servico_catalogo(client, headers)
    peca_id = _criar_peca_catalogo(client, headers)
    return cliente_id, veiculo_id, servico_id, peca_id


def test_criar_os_calcula_orcamento_a_partir_do_catalogo(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, peca_id = _preparar_os(client, headers)

    response = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [
                {"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1},
                {"tipo": "peca", "catalogo_id": peca_id, "quantidade": 2},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "aguardando_diagnostico"
    assert body["orcamento_total"] == "191.00"
    assert {item["nome"] for item in body["itens"]} == {"Troca de óleo", "Filtro de óleo"}


def test_criar_os_com_veiculo_de_outro_cliente_retorna_400(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)
    outro_cliente_id = _criar_cliente(client, headers, email="outro.dono@example.com", cpf=CNPJ_VALIDO)

    response = client.post(
        "/ordens-servico",
        json={
            "cliente_id": outro_cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=headers,
    )

    assert response.status_code == 400


def test_criar_os_com_item_de_catalogo_inexistente_retorna_404(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, _, _ = _preparar_os(client, headers)

    response = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": "id-que-nao-existe", "quantidade": 1}],
        },
        headers=headers,
    )

    assert response.status_code == 404


def test_criar_os_com_mecanico_invalido_retorna_400(client, admin_user, cliente_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)

    response = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "mecanico_id": cliente_user.id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=headers,
    )

    assert response.status_code == 400


def test_criar_os_como_cliente_retorna_403(client, admin_user, cliente_user, auth_header):
    headers_admin = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers_admin)

    response = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=auth_header(cliente_user),
    )

    assert response.status_code == 403


def test_avancar_status_para_proxima_etapa_retorna_200_e_registra_historico(
    client, admin_user, auth_header
):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)
    os_id = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=headers,
    ).json()["id"]

    response = client.patch(
        f"/ordens-servico/{os_id}/status", json={"status": "em_execucao"}, headers=headers
    )
    historico = client.get(f"/ordens-servico/{os_id}/historico", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "em_execucao"
    status_registrados = [entrada["status"] for entrada in historico.json()]
    assert status_registrados == ["aguardando_diagnostico", "em_execucao"]


def test_pular_etapa_do_fluxo_de_status_retorna_409(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)
    os_id = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=headers,
    ).json()["id"]

    response = client.patch(
        f"/ordens-servico/{os_id}/status", json={"status": "finalizada"}, headers=headers
    )

    assert response.status_code == 409


def test_voltar_etapa_do_fluxo_de_status_retorna_409(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)
    os_id = client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=headers,
    ).json()["id"]
    client.patch(f"/ordens-servico/{os_id}/status", json={"status": "em_execucao"}, headers=headers)

    response = client.patch(
        f"/ordens-servico/{os_id}/status",
        json={"status": "aguardando_diagnostico"},
        headers=headers,
    )

    assert response.status_code == 409


def test_listar_os_filtrado_por_status(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    cliente_id, veiculo_id, servico_id, _ = _preparar_os(client, headers)
    client.post(
        "/ordens-servico",
        json={
            "cliente_id": cliente_id,
            "veiculo_id": veiculo_id,
            "itens": [{"tipo": "mao_obra", "catalogo_id": servico_id, "quantidade": 1}],
        },
        headers=headers,
    )

    response = client.get(
        "/ordens-servico", params={"status_atual": "aguardando_diagnostico"}, headers=headers
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_obter_os_inexistente_retorna_404(client, admin_user, auth_header):
    response = client.get("/ordens-servico/id-que-nao-existe", headers=auth_header(admin_user))

    assert response.status_code == 404

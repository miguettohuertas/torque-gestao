"""
Testes de RF06 — Autenticação e Controle de Acesso.

Cobrem os critérios de aceite 2 e 7 da Seção 2.5 de
docs/academic/documentacao-mvp1.tex: login autenticando de fato contra o
banco e emitindo um JWT válido, respeitando o RBAC por perfil.
"""


def test_login_com_senha_correta_retorna_token(client, admin_user):
    response = client.post(
        "/auth/login",
        data={"username": admin_user.email, "password": "senha123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_com_senha_errada_retorna_401(client, admin_user):
    response = client.post(
        "/auth/login",
        data={"username": admin_user.email, "password": "senha-errada"},
    )

    assert response.status_code == 401


def test_login_com_email_inexistente_retorna_401(client):
    response = client.post(
        "/auth/login",
        data={"username": "ninguem@torquegestao.com.br", "password": "qualquer"},
    )

    assert response.status_code == 401


def test_me_sem_token_retorna_401(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_me_com_token_valido_retorna_dados_do_usuario(client, admin_user):
    login_response = client.post(
        "/auth/login",
        data={"username": admin_user.email, "password": "senha123"},
    )
    token = login_response.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == admin_user.email
    assert body["role"] == "admin"
    # nunca deve vazar o hash da senha
    assert "password_hash" not in body


def test_rota_protegida_sem_token_e_barrada_pelo_rbac(client):
    # /clientes ainda é um esqueleto (RF01, responsável: Leonardo), mas o
    # RBAC precisa barrar ANTES de qualquer lógica de negócio quando não há
    # token — por isso o teste espera 401, não o NotImplementedError do stub.
    response = client.get("/clientes")

    assert response.status_code == 401


def test_rota_so_admin_sem_token_retorna_401(client):
    # GET /auth/usuarios usa require_role(ROLE_ADMIN); sem token, o RBAC
    # barra na dependency get_current_user antes mesmo de checar o perfil.
    response = client.get("/auth/usuarios")

    assert response.status_code == 401


def test_rota_so_admin_com_perfil_errado_retorna_403(client, mecanico_user):
    # Prova a parte que ainda faltava do RBAC (Sprint 1, 21-23/08): um
    # usuário autenticado, mas com perfil sem permissão, recebe 403 — não
    # 401 (que é "sem credenciais") nem 200 (que ignoraria o RBAC).
    login_response = client.post(
        "/auth/login",
        data={"username": mecanico_user.email, "password": "senha123"},
    )
    token = login_response.json()["access_token"]

    response = client.get("/auth/usuarios", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_rota_so_admin_com_perfil_correto_retorna_200(client, admin_user, mecanico_user):
    login_response = client.post(
        "/auth/login",
        data={"username": admin_user.email, "password": "senha123"},
    )
    token = login_response.json()["access_token"]

    response = client.get("/auth/usuarios", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    emails = {usuario["email"] for usuario in response.json()}
    assert {admin_user.email, mecanico_user.email} <= emails

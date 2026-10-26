"""
Testes de segurança ligados ao Mapeamento de Riscos do relatório acadêmico:
falhas de autenticação (JWT), SQL Injection em formulários e vazamento de
dados de clientes. Rode só eles com:  pytest -m seguranca
"""
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.config import settings
from app.core.security import create_access_token, verify_password
from app.models.cliente import Cliente
from app.models.usuario import Usuario

pytestmark = pytest.mark.seguranca

CPF_VALIDO = "111.444.777-35"


def _bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _token(payload: dict, secret: str | None = None, algorithm: str | None = None) -> str:
    return jwt.encode(
        payload,
        secret or settings.JWT_SECRET_KEY,
        algorithm=algorithm or settings.JWT_ALGORITHM,
    )


def _criar_cliente(client, headers, **dados):
    payload = {"name": "Fulano", "email": "fulano@example.com", "cpf": CPF_VALIDO}
    payload.update(dados)
    response = client.post("/clientes", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# --- Autenticação (JWT) -----------------------------------------------------


def test_token_com_assinatura_adulterada_retorna_401(client, admin_user):
    token = create_access_token(subject=admin_user.id, role=admin_user.role)
    cabecalho, corpo, assinatura = token.split(".")
    adulterado = f"{cabecalho}.{corpo}.{assinatura[:-2]}xx"

    assert client.get("/auth/me", headers=_bearer(adulterado)).status_code == 401


def test_token_assinado_com_outro_segredo_retorna_401(client, admin_user):
    exp = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = _token({"sub": admin_user.id, "role": "admin", "exp": exp}, secret="segredo-do-atacante")

    assert client.get("/auth/me", headers=_bearer(token)).status_code == 401


def test_token_expirado_retorna_401(client, admin_user):
    exp = datetime.now(timezone.utc) - timedelta(minutes=1)
    token = _token({"sub": admin_user.id, "role": "admin", "exp": exp})

    response = client.get("/auth/me", headers=_bearer(token))

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_token_sem_identificacao_do_usuario_retorna_401(client, admin_user):
    exp = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = _token({"role": "admin", "exp": exp})

    assert client.get("/auth/me", headers=_bearer(token)).status_code == 401


def test_token_sem_assinatura_alg_none_retorna_401(client, admin_user):
    token = create_access_token(subject=admin_user.id, role=admin_user.role)
    cabecalho_none = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0"  # {"alg":"none","typ":"JWT"}
    sem_assinatura = f"{cabecalho_none}.{token.split('.')[1]}."

    assert client.get("/auth/me", headers=_bearer(sem_assinatura)).status_code == 401


def test_token_de_usuario_removido_deixa_de_valer(client, db_session, admin_user, auth_header):
    headers = auth_header(admin_user)
    assert client.get("/auth/me", headers=headers).status_code == 200

    db_session.delete(admin_user)
    db_session.commit()

    assert client.get("/auth/me", headers=headers).status_code == 401


def test_perfil_no_token_nao_eleva_privilegio(client, mecanico_user):
    """O RBAC usa o perfil gravado no banco, não o que vem escrito no JWT."""
    exp = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = _token({"sub": mecanico_user.id, "role": "admin", "exp": exp})

    response = client.post(
        "/catalogo/servicos",
        json={"nome": "Serviço indevido", "preco": "10.00"},
        headers=_bearer(token),
    )

    assert response.status_code == 403


def test_senha_e_guardada_como_hash_bcrypt(admin_user):
    assert admin_user.password_hash != "senha123"
    assert admin_user.password_hash.startswith("$2")
    assert verify_password("senha123", admin_user.password_hash)
    assert not verify_password("senha124", admin_user.password_hash)


def test_respostas_da_api_nunca_expoem_o_hash_da_senha(client, admin_user, auth_header):
    response = client.get("/auth/me", headers=auth_header(admin_user))

    assert "password" not in response.text
    assert admin_user.password_hash not in response.text


# --- SQL Injection ------------------------------------------------------------

PAYLOADS_SQL_INJECTION = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "'; DROP TABLE clientes; --",
    "\" OR \"\"=\"",
    "%' UNION SELECT id, email, password_hash, role, name, id FROM usuarios --",
]


@pytest.mark.parametrize("payload", PAYLOADS_SQL_INJECTION)
def test_busca_de_clientes_trata_sql_injection_como_texto(
    client, db_session, admin_user, auth_header, payload
):
    headers = auth_header(admin_user)
    _criar_cliente(client, headers)

    response = client.get("/clientes", params={"busca": payload}, headers=headers)

    assert response.status_code == 200
    assert response.json() == []  # nenhum cliente "vaza" por condição sempre verdadeira
    assert db_session.query(Cliente).count() == 1  # a tabela continua lá, intacta
    assert "password_hash" not in response.text


@pytest.mark.parametrize("payload", PAYLOADS_SQL_INJECTION)
def test_login_com_sql_injection_no_email_retorna_401(client, admin_user, payload):
    response = client.post("/auth/login", data={"username": payload, "password": payload})

    assert response.status_code == 401
    assert "access_token" not in response.json()


def test_texto_com_aspas_e_gravado_e_devolvido_literalmente(client, admin_user, auth_header):
    headers = auth_header(admin_user)
    nome = "O'Brien \"; DROP TABLE veiculos; --"

    criado = _criar_cliente(client, headers, name=nome)
    busca = client.get("/clientes", params={"busca": "O'Brien"}, headers=headers)

    assert criado["name"] == nome
    assert [c["id"] for c in busca.json()] == [criado["id"]]


# --- Atribuição em massa (mass assignment) ---------------------------------


def test_campos_internos_enviados_no_cadastro_sao_ignorados(
    client, db_session, admin_user, auth_header
):
    headers = auth_header(admin_user)

    criado = _criar_cliente(
        client, headers, id="id-escolhido-pelo-atacante", telegram_chat_id="999"
    )

    assert criado["id"] != "id-escolhido-pelo-atacante"
    assert criado["telegram_vinculado"] is False
    assert db_session.get(Cliente, criado["id"]).telegram_chat_id is None


def test_cadastro_de_cliente_nao_cria_usuario_nem_muda_perfil(
    client, db_session, admin_user, auth_header
):
    headers = auth_header(admin_user)
    _criar_cliente(client, headers, role="admin", password="hack12345")

    assert db_session.query(Usuario).count() == 1  # só o admin da fixture

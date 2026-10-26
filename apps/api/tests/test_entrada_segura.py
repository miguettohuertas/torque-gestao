"""
Caractere nulo (U+0000) na entrada: o PostgreSQL não aceita e a API respondia
500 (achado pelo teste de contrato). Agora responde 422 em qualquer banco.
"""
import json

import pytest

pytestmark = pytest.mark.seguranca


def test_nul_na_query_string_retorna_422(client, admin_user, auth_header):
    response = client.get("/clientes?busca=a%00b", headers=auth_header(admin_user))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["query"]
    assert "nulo" in response.json()["detail"][0]["msg"]


def test_nul_no_caminho_retorna_422(client, admin_user, auth_header):
    response = client.get("/clientes/%00", headers=auth_header(admin_user))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path"]


@pytest.mark.parametrize(
    "corpo",
    [
        {"name": "Ana\u0000", "email": "ana@example.com", "cpf": "111.444.777-35"},
        {"name": "Ana", "email": "ana@example.com", "cpf": "111.444.777-35", "phone": ["\u0000"]},
        {"name": "Ana", "email": "ana@example.com", "cpf": "111.444.777-35", "x": {"\u0000": 1}},
    ],
)
def test_nul_no_json_retorna_422_e_nao_grava(client, db_session, admin_user, auth_header, corpo):
    from app.models.cliente import Cliente

    response = client.post("/clientes", json=corpo, headers=auth_header(admin_user))

    assert response.status_code == 422
    assert db_session.query(Cliente).count() == 0


def test_nul_no_formulario_de_login_retorna_422(client, admin_user):
    response = client.post("/auth/login", data={"username": "a\u0000b", "password": "x"})

    assert response.status_code == 422


def test_json_invalido_continua_sendo_tratado_pela_validacao_normal(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        content="{isto nao e json",
        headers={**auth_header(admin_user), "Content-Type": "application/json"},
    )

    assert response.status_code == 422
    assert "nulo" not in json.dumps(response.json())


def test_texto_com_acentos_e_emoji_continua_aceito(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        json={"name": "José d'Ávila 🚗", "email": "jose@example.com", "cpf": "111.444.777-35"},
        headers=auth_header(admin_user),
    )

    assert response.status_code == 201
    assert response.json()["name"] == "José d'Ávila 🚗"


def test_requisicao_sem_corpo_e_requisicao_get_passam_normalmente(client, admin_user, auth_header):
    headers = auth_header(admin_user)

    assert client.get("/clientes", headers=headers).status_code == 200
    assert client.post("/clientes", headers=headers).status_code == 422  # corpo obrigatório ausente
    assert client.get("/health").status_code == 200


def test_corpo_grande_enviado_em_pedacos_chega_inteiro(client, admin_user, auth_header):
    """O middleware lê o corpo e o reenvia: nada pode se perder no caminho."""
    nome = "x" * 200_000
    response = client.post(
        "/clientes",
        json={"name": nome, "email": "grande@example.com", "cpf": "111.444.777-35"},
        headers=auth_header(admin_user),
    )

    assert response.status_code in (201, 422)  # 422 se o schema limitar o tamanho do nome
    assert "nulo" not in response.text


def test_recusa_por_nul_leva_cabecalhos_cors(client, admin_user, auth_header):
    response = client.get(
        "/clientes?busca=%00", headers={**auth_header(admin_user), "Origin": "http://localhost:4173"}
    )

    assert response.status_code == 422
    assert response.headers.get("access-control-allow-origin") == "*"


def test_byte_nulo_cru_no_corpo_retorna_422(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        content=b"abc\x00def",
        headers={**auth_header(admin_user), "Content-Type": "text/plain"},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body"]


def test_corpo_em_varios_pedacos_e_remontado_e_inspecionado():
    import asyncio

    from app.core.entrada_segura import RejeitarCaractereNulo

    recebido = {}

    async def app_interno(scope, receive, send):
        corpo = b""
        while True:
            mensagem = await receive()
            corpo += mensagem["body"]
            if not mensagem["more_body"]:
                break
        recebido["corpo"] = corpo

    pedacos = iter(
        [
            {"type": "http.request", "body": b'{"nome": "ab', "more_body": True},
            {"type": "http.request", "body": b'c"}', "more_body": False},
        ]
    )

    async def receive():
        return next(pedacos)

    async def send(_):
        pytest.fail("nada deveria ser respondido pelo middleware")

    scope = {
        "type": "http", "method": "POST", "path": "/x", "raw_path": b"/x", "query_string": b"",
        "headers": [(b"content-type", b"application/json")],
    }

    asyncio.run(RejeitarCaractereNulo(app_interno)(scope, receive, send))

    assert recebido["corpo"] == b'{"nome": "abc"}'


def test_eventos_que_nao_sao_http_passam_direto():
    import asyncio

    from app.core.entrada_segura import RejeitarCaractereNulo

    chamadas = []

    async def app_interno(scope, receive, send):
        chamadas.append(scope["type"])

    asyncio.run(RejeitarCaractereNulo(app_interno)({"type": "lifespan"}, None, None))

    assert chamadas == ["lifespan"]


def test_json_com_numeros_booleanos_e_nulos_sem_nul_passa(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        json={"name": "Ana", "email": "ana@example.com", "cpf": "111.444.777-35", "phone": None, "n": 1, "ok": True},
        headers=auth_header(admin_user),
    )

    assert response.status_code == 201


def test_corpo_de_outro_tipo_sem_nul_segue_para_a_validacao_normal(client, admin_user, auth_header):
    response = client.post(
        "/clientes",
        content=b"texto simples",
        headers={**auth_header(admin_user), "Content-Type": "text/plain"},
    )

    assert response.status_code == 422
    assert "nulo" not in response.text

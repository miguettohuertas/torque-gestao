"""
Teste de contrato: o Schemathesis lê o OpenAPI que o próprio FastAPI publica
(/openapi.json) e gera centenas de requisições válidas e inválidas para cada
rota. Verifica que a API:

- nunca responde 5xx, qualquer que seja a entrada;
- só devolve status e corpos que estão documentados no OpenAPI.

Rode só estes testes com:  pytest -m contrato
"""
import pytest
import schemathesis
from hypothesis import HealthCheck, settings

from app.main import app

pytestmark = pytest.mark.contrato

schema = schemathesis.from_asgi("/openapi.json", app, force_schema_version="30")
# O login recebe formulário OAuth2 e é coberto à parte; as demais rotas usam JSON.
ROTAS_AUTENTICADAS = schema.exclude(path="/auth/login")


@pytest.fixture()
def cabecalho_admin(client, admin_user, auth_header):
    return auth_header(admin_user)


@ROTAS_AUTENTICADAS.parametrize()
@settings(max_examples=15, deadline=None, suppress_health_check=list(HealthCheck))
def test_rotas_autenticadas_cumprem_o_contrato_openapi(case, client, cabecalho_admin):
    response = case.call_asgi(headers=cabecalho_admin)

    assert response.status_code < 500, response.text
    case.validate_response(response)


@schema.parametrize(endpoint="/auth/login")
@settings(max_examples=25, deadline=None, suppress_health_check=list(HealthCheck))
def test_login_nunca_quebra_com_entradas_arbitrarias(case, client):
    response = case.call_asgi()

    assert response.status_code < 500, response.text
    case.validate_response(response)

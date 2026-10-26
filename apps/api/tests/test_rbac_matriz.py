"""
Matriz de permissões (RF06): para cada rota da API, o que cada perfil pode
fazer. Os perfis sem permissão precisam receber 401 (sem token) ou 403 (perfil
errado); os com permissão não podem ser barrados pelo RBAC (o status final pode
ser 404/422, pois os dados enviados são fictícios).

Uma rota nova sem entrada na matriz faz o teste de cobertura falhar, o que
obriga a decidir quem pode acessá-la.
"""
import pytest

from app.main import app

TODOS = {"admin", "mecanico", "cliente"}
EQUIPE = {"admin", "mecanico"}
ADMIN = {"admin"}

# (método, caminho, perfis permitidos)
MATRIZ = [
    ("GET", "/auth/me", TODOS),
    ("GET", "/auth/usuarios", ADMIN),
    ("GET", "/clientes", TODOS),
    ("POST", "/clientes", EQUIPE),
    ("GET", "/clientes/{id}", TODOS),
    ("PUT", "/clientes/{id}", EQUIPE),
    ("DELETE", "/clientes/{id}", EQUIPE),
    ("POST", "/clientes/{id}/telegram/vinculo", TODOS),
    ("DELETE", "/clientes/{id}/telegram", TODOS),
    ("GET", "/veiculos", TODOS),
    ("POST", "/veiculos", EQUIPE),
    ("GET", "/veiculos/{id}", TODOS),
    ("PUT", "/veiculos/{id}", EQUIPE),
    ("DELETE", "/veiculos/{id}", EQUIPE),
    ("GET", "/ordens-servico", TODOS),
    ("POST", "/ordens-servico", EQUIPE),
    ("GET", "/ordens-servico/{id}", TODOS),
    ("PATCH", "/ordens-servico/{id}/status", EQUIPE),
    ("GET", "/ordens-servico/{id}/historico", TODOS),
    ("GET", "/catalogo/servicos", EQUIPE),
    ("POST", "/catalogo/servicos", ADMIN),
    ("PUT", "/catalogo/servicos/{id}", ADMIN),
    ("DELETE", "/catalogo/servicos/{id}", ADMIN),
    ("GET", "/catalogo/pecas", EQUIPE),
    ("POST", "/catalogo/pecas", ADMIN),
    ("PUT", "/catalogo/pecas/{id}", ADMIN),
    ("DELETE", "/catalogo/pecas/{id}", ADMIN),
]

# Rotas públicas por definição (login, saúde e a documentação gerada pelo FastAPI).
PUBLICAS = {
    ("POST", "/auth/login"),
    ("GET", "/health"),
    ("GET", "/docs"),
    ("GET", "/docs/oauth2-redirect"),
    ("GET", "/openapi.json"),
    ("GET", "/redoc"),
}

PERFIS = ["admin", "mecanico", "cliente"]
pytestmark = pytest.mark.seguranca


def _caminho(modelo: str) -> str:
    return modelo.replace("{id}", "id-qualquer")


def _rotas_da_api() -> set[tuple[str, str]]:
    rotas = set()
    for rota in app.routes:
        for metodo in getattr(rota, "methods", None) or ():
            if metodo in ("HEAD", "OPTIONS"):
                continue
            modelo = rota.path.replace("{cliente_id}", "{id}").replace("{veiculo_id}", "{id}")
            for nome in ("os_id", "servico_id", "peca_id"):
                modelo = modelo.replace("{" + nome + "}", "{id}")
            rotas.add((metodo, modelo))
    return rotas


def test_toda_rota_da_api_esta_na_matriz_de_permissoes():
    documentadas = {(metodo, caminho) for metodo, caminho, _ in MATRIZ} | PUBLICAS

    assert _rotas_da_api() == documentadas


@pytest.mark.parametrize(("metodo", "caminho", "permitidos"), MATRIZ)
def test_sem_token_nenhuma_rota_protegida_responde(client, metodo, caminho, permitidos):
    response = client.request(metodo, _caminho(caminho), json={})

    assert response.status_code == 401


@pytest.mark.parametrize("perfil", PERFIS)
@pytest.mark.parametrize(("metodo", "caminho", "permitidos"), MATRIZ)
def test_cada_perfil_acessa_apenas_o_que_lhe_cabe(
    client, admin_user, mecanico_user, cliente_user, auth_header, perfil, metodo, caminho, permitidos
):
    usuario = {"admin": admin_user, "mecanico": mecanico_user, "cliente": cliente_user}[perfil]

    response = client.request(
        metodo, _caminho(caminho), json={}, headers=auth_header(usuario)
    )

    if perfil in permitidos:
        assert response.status_code not in (401, 403), response.text
    else:
        assert response.status_code == 403, response.text

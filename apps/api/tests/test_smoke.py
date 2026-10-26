"""
Smoke test (tests/smoke.py) rodando contra a API local e contra APIs "quebradas"
simuladas: o importante é que ele passe quando está tudo bem e FALHE quando não.
"""
import json

import pytest

from tests import smoke

pytestmark = pytest.mark.smoke


def _transporte_local(client):
    """Adapta o TestClient ao formato de transporte do smoke test."""

    def _abrir(metodo, caminho, cabecalhos, corpo):
        response = client.request(metodo, caminho, headers=cabecalhos, content=corpo)
        return response.status_code, response.text, 0.01

    return _abrir


def _falhas(resultados):
    return [r.nome for r in resultados if not r.ok]


def test_smoke_sem_login_passa_na_api_saudavel(client):
    resultados = smoke.verificar_api(_transporte_local(client))

    assert _falhas(resultados) == []
    assert any("pulados" in r.detalhe for r in resultados)


def test_smoke_com_login_de_admin_confere_todas_as_listagens(client, admin_user):
    resultados = smoke.verificar_api(_transporte_local(client), admin_user.email, "senha123")

    assert _falhas(resultados) == []
    nomes = [r.nome for r in resultados]
    for rota in ("/clientes", "/veiculos", "/ordens-servico", "/catalogo/servicos", "/catalogo/pecas"):
        assert f"Listagem {rota}" in nomes


def test_smoke_com_senha_errada_falha_no_login(client, admin_user):
    resultados = smoke.verificar_api(_transporte_local(client), admin_user.email, "senha-errada")

    assert _falhas(resultados) == ["Login com a conta de verificação"]


def test_smoke_com_cliente_do_portal_pula_as_listagens_operacionais(client, cliente_user):
    resultados = smoke.verificar_api(_transporte_local(client), cliente_user.email, "senha123")

    assert _falhas(resultados) == []
    assert any("puladas" in r.detalhe for r in resultados)


def test_smoke_detecta_api_fora_do_ar():
    def _fora_do_ar(*_):
        raise ConnectionRefusedError("conexão recusada")

    resultados = smoke.verificar_api(_fora_do_ar)

    assert _falhas(resultados) == [
        "API responde em /health com banco conectado",
        "/health responde em menos de 5s",
    ]
    assert "ConnectionRefusedError" in resultados[0].detalhe


def test_smoke_detecta_banco_desconectado():
    def _sem_banco(metodo, caminho, *_):
        return 200, json.dumps({"status": "ok", "database": "disconnected"}), 0.01

    resultados = smoke.verificar_api(_sem_banco)

    assert _falhas(resultados)[0] == "API responde em /health com banco conectado"
    assert "disconnected" in resultados[0].detalhe


def test_smoke_detecta_rota_protegida_sem_autenticacao(client):
    local = _transporte_local(client)

    def _vazando(metodo, caminho, cabecalhos, corpo):
        if caminho == "/clientes":
            return 200, "[]", 0.01  # rota "esqueceu" de exigir login
        return local(metodo, caminho, cabecalhos, corpo)

    assert "Rota protegida recusa acesso sem token (401)" in _falhas(smoke.verificar_api(_vazando))


def test_smoke_detecta_resposta_lenta(client):
    local = _transporte_local(client)

    def _lenta(metodo, caminho, cabecalhos, corpo):
        status, texto, _ = local(metodo, caminho, cabecalhos, corpo)
        return status, texto, 9.0

    assert "/health responde em menos de 5s" in _falhas(smoke.verificar_api(_lenta))
    assert _falhas(smoke.verificar_api(_lenta, limite=10.0)) == []


def test_smoke_detecta_listagem_com_erro_500(client, admin_user):
    local = _transporte_local(client)

    def _quebrada(metodo, caminho, cabecalhos, corpo):
        if caminho == "/veiculos":
            return 500, "Internal Server Error", 0.01
        return local(metodo, caminho, cabecalhos, corpo)

    resultados = smoke.verificar_api(_quebrada, admin_user.email, "senha123")

    assert _falhas(resultados) == ["Listagem /veiculos"]


def test_smoke_do_front_confere_pagina_e_config():
    def _front(metodo, caminho, *_):
        if caminho == "/":
            return 200, "<title>Torque Gestão</title>", 0.01
        return 200, "window.TORQUE_API_URL = '/api';", 0.01

    def _front_quebrado(metodo, caminho, *_):
        return 404, "", 0.01

    assert _falhas(smoke.verificar_front(_front)) == []
    assert len(_falhas(smoke.verificar_front(_front_quebrado))) == 2


def test_main_devolve_codigo_de_saida_e_relatorio(client, admin_user, monkeypatch, capsys):
    monkeypatch.setattr(smoke, "transporte_http", lambda url, timeout=15.0: _transporte_local(client))
    monkeypatch.setenv("SMOKE_EMAIL", admin_user.email)
    monkeypatch.setenv("SMOKE_PASSWORD", "senha123")

    codigo = smoke.main(["http://api.local", "--front", "http://front.local"])

    saida = capsys.readouterr().out
    assert "SMOKE TEST" in saida and "[OK]" in saida
    # o "front" aqui é a própria API, então só o item de front-end falha: exit 1
    assert codigo == 1
    assert "[FALHA] Front-end carrega a página inicial" in saida


def test_main_sai_com_zero_quando_tudo_passa(client, monkeypatch, capsys):
    monkeypatch.setattr(smoke, "transporte_http", lambda url, timeout=15.0: _transporte_local(client))
    monkeypatch.delenv("SMOKE_EMAIL", raising=False)
    monkeypatch.delenv("SMOKE_PASSWORD", raising=False)

    assert smoke.main(["http://api.local"]) == 0
    assert "SMOKE TEST PASSOU" in capsys.readouterr().out


def test_transporte_http_converte_erro_http_em_resposta(monkeypatch):
    import urllib.error
    import urllib.request

    def _http_error_com_corpo(pedido, timeout):
        erro = urllib.error.HTTPError(pedido.full_url, 404, "Not Found", {}, None)
        erro.read = lambda: b"nao achei"
        raise erro

    monkeypatch.setattr(urllib.request, "urlopen", _http_error_com_corpo)

    status, corpo, tempo = smoke.transporte_http("http://x.test/")("GET", "/rota", {}, None)

    assert (status, corpo) == (404, "nao achei")
    assert tempo >= 0


def test_transporte_http_le_resposta_de_sucesso(monkeypatch):
    import urllib.request

    class _Resposta:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return "olá".encode()

    capturado = {}

    def _urlopen(pedido, timeout):
        capturado["url"] = pedido.full_url
        return _Resposta()

    monkeypatch.setattr(urllib.request, "urlopen", _urlopen)

    status, corpo, _ = smoke.transporte_http("http://x.test/api/")("GET", "/health", {}, None)

    assert (status, corpo) == (200, "olá")
    assert capturado["url"] == "http://x.test/api/health"

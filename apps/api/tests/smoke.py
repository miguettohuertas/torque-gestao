"""
Smoke test: verificação rápida e SOMENTE LEITURA de que o sistema subiu e
responde ("a oficina abre as portas?"). Pensado para rodar logo depois de um
deploy, contra o ambiente de produção, sem criar nem alterar nenhum dado.

Uso (só biblioteca padrão, não precisa instalar nada):

    python tests/smoke.py https://torquegestao.duckdns.org/api
    python tests/smoke.py https://torquegestao.duckdns.org/api \
        --front https://torquegestao.duckdns.org

    # com login, também confere token, perfil e as listagens principais:
    SMOKE_EMAIL=admin@... SMOKE_PASSWORD=... python tests/smoke.py <url-da-api>

Sai com código 0 se tudo passou e 1 se algum item falhou. Os mesmos passos
rodam contra a API local em tests/test_smoke.py.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass

# (status, corpo em texto, segundos gastos)
Resposta = tuple[int, str, float]
# transporte(metodo, caminho, cabecalhos, corpo) -> Resposta
Transporte = Callable[[str, str, dict[str, str], bytes | None], Resposta]

LIMITE_SEGUNDOS = 5.0


@dataclass
class Resultado:
    nome: str
    ok: bool
    detalhe: str = ""


def transporte_http(base_url: str, timeout: float = 15.0) -> Transporte:
    """Transporte real: chama a URL pela rede."""

    def _abrir(metodo, caminho, cabecalhos, corpo):
        pedido = urllib.request.Request(
            base_url.rstrip("/") + caminho, data=corpo, headers=cabecalhos, method=metodo
        )
        inicio = time.perf_counter()
        try:
            with urllib.request.urlopen(pedido, timeout=timeout) as resposta:
                return resposta.status, resposta.read().decode("utf-8", "replace"), time.perf_counter() - inicio
        except urllib.error.HTTPError as erro:  # 4xx/5xx também são respostas
            return erro.code, erro.read().decode("utf-8", "replace"), time.perf_counter() - inicio

    return _abrir


def _json(texto: str):
    try:
        return json.loads(texto)
    except ValueError:
        return None


def verificar_api(
    abrir: Transporte, email: str = "", senha: str = "", limite: float = LIMITE_SEGUNDOS
) -> list[Resultado]:
    """Roda os passos do smoke test na API e devolve um resultado por passo."""
    resultados: list[Resultado] = []

    def registrar(nome: str, ok: bool, detalhe: str = ""):
        resultados.append(Resultado(nome, ok, detalhe))

    def chamar(metodo, caminho, token="", corpo=None, cabecalhos=None):
        cab = dict(cabecalhos or {})
        if token:
            cab["Authorization"] = f"Bearer {token}"
        try:
            return abrir(metodo, caminho, cab, corpo)
        except Exception as erro:  # rede fora do ar, DNS, TLS...
            return 0, f"{type(erro).__name__}: {erro}", 0.0

    status, corpo, tempo = chamar("GET", "/health")
    dados = _json(corpo) or {}
    registrar(
        "API responde em /health com banco conectado",
        status == 200 and dados.get("status") == "ok" and dados.get("database") == "connected",
        f"status {status}, {corpo[:80]!r}",
    )
    registrar(f"/health responde em menos de {limite:g}s", 0 < tempo < limite, f"{tempo:.2f}s")
    if status != 200:  # sem API não adianta seguir
        return resultados

    status, corpo, _ = chamar("GET", "/openapi.json")
    caminhos = (_json(corpo) or {}).get("paths", {})
    registrar(
        "Contrato OpenAPI publicado com as rotas principais",
        status == 200 and {"/clientes", "/ordens-servico", "/auth/login"} <= set(caminhos),
        f"status {status}, {len(caminhos)} rotas",
    )

    status, _, _ = chamar("GET", "/clientes")
    registrar("Rota protegida recusa acesso sem token (401)", status == 401, f"status {status}")

    status, _, _ = chamar(
        "POST",
        "/auth/login",
        corpo=urllib.parse.urlencode({"username": "smoke@invalido.test", "password": "x"}).encode(),
        cabecalhos={"Content-Type": "application/x-www-form-urlencoded"},
    )
    registrar("Login com credenciais inválidas é recusado (401)", status == 401, f"status {status}")

    if not (email and senha):
        registrar("Passos autenticados (informe SMOKE_EMAIL e SMOKE_PASSWORD)", True, "pulados")
        return resultados

    status, corpo, tempo = chamar(
        "POST",
        "/auth/login",
        corpo=urllib.parse.urlencode({"username": email, "password": senha}).encode(),
        cabecalhos={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = (_json(corpo) or {}).get("access_token", "")
    registrar("Login com a conta de verificação", status == 200 and bool(token), f"status {status}, {tempo:.2f}s")
    if not token:
        return resultados

    status, corpo, _ = chamar("GET", "/auth/me", token)
    perfil = (_json(corpo) or {}).get("role", "")
    registrar(
        "/auth/me devolve o usuário logado",
        status == 200 and (_json(corpo) or {}).get("email") == email,
        f"status {status}, perfil {perfil}",
    )
    if perfil not in ("admin", "mecanico"):
        registrar("Listagens operacionais (exigem perfil admin ou mecânico)", True, "puladas")
        return resultados

    for rota in ("/clientes", "/veiculos", "/ordens-servico", "/catalogo/servicos", "/catalogo/pecas"):
        status, corpo, tempo = chamar("GET", rota, token)
        lista = _json(corpo)
        registrar(
            f"Listagem {rota}",
            status == 200 and isinstance(lista, list) and tempo < limite,
            f"status {status}, {tempo:.2f}s",
        )
    return resultados


def verificar_front(abrir: Transporte) -> list[Resultado]:
    """Confere que o front-end é servido e sabe onde está a API."""
    resultados = []
    status, corpo, _ = abrir("GET", "/", {}, None)
    resultados.append(Resultado("Front-end carrega a página inicial", status == 200 and "Torque" in corpo, f"status {status}"))
    status, corpo, _ = abrir("GET", "/config.js", {}, None)
    resultados.append(Resultado("Front-end aponta para a API (config.js)", status == 200 and "TORQUE_API_URL" in corpo, f"status {status}"))
    return resultados


def imprimir(resultados: list[Resultado]) -> bool:
    for r in resultados:
        print(f"  [{'OK' if r.ok else 'FALHA'}] {r.nome}" + (f" — {r.detalhe}" if r.detalhe else ""))
    return all(r.ok for r in resultados)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Smoke test somente leitura do Torque Gestão.")
    parser.add_argument("api", help="URL base da API, ex.: https://torquegestao.duckdns.org/api")
    parser.add_argument("--front", help="URL do front-end, ex.: https://torquegestao.duckdns.org")
    parser.add_argument("--limite", type=float, default=LIMITE_SEGUNDOS, help="tempo máximo por chamada (s)")
    args = parser.parse_args(argv)

    print(f"API: {args.api}")
    resultados = verificar_api(
        transporte_http(args.api),
        os.environ.get("SMOKE_EMAIL", ""),
        os.environ.get("SMOKE_PASSWORD", ""),
        args.limite,
    )
    if args.front:
        print(f"Front-end: {args.front}")
        resultados += verificar_front(transporte_http(args.front))
    ok = imprimir(resultados)
    print("\nSMOKE TEST " + ("PASSOU" if ok else "FALHOU"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

"""
Teste de carga do Torque Gestão (Locust): usuários simultâneos usando a API
como na oficina — o admin consulta e emite OS, o mecânico acompanha e avança
status, o cliente do portal só consulta.

Não rode este arquivo direto; use o executor, que sobe uma API de teste:

    python tests/carga/executar.py --usuarios 50 --duracao 30

Ou aponte para uma API já no ar (cuidado: o modo padrão CRIA dados):

    locust -f tests/carga/locustfile.py --host http://127.0.0.1:8000 --headless -u 20 -r 5 -t 30s
    CARGA_SOMENTE_LEITURA=1 locust ...   # sem criar nada (seguro para produção)

Critérios de aprovação (variáveis de ambiente):
    CARGA_P95_MS      p95 máximo por rota, em ms            (padrão 1000)
    CARGA_MAX_FALHAS  proporção máxima de falhas, 0 a 1     (padrão 0.01)
    CARGA_SENHA_*     senhas dos usuários de teste (padrões do e2e_server.py)
"""
import os
import random

from locust import HttpUser, between, events, task

LIMITE_P95_MS = float(os.environ.get("CARGA_P95_MS", "1000"))
MAX_FALHAS = float(os.environ.get("CARGA_MAX_FALHAS", "0.01"))
SOMENTE_LEITURA = os.environ.get("CARGA_SOMENTE_LEITURA") == "1"

CONTAS = {
    "admin": ("admin@torquegestao.com.br", os.environ.get("CARGA_SENHA_ADMIN", "torque123")),
    "mecanico": ("mecanico@example.com", os.environ.get("CARGA_SENHA_MECANICO", "mecanico123")),
    "cliente": ("portal@example.com", os.environ.get("CARGA_SENHA_CLIENTE", "portal123")),
}
_PROXIMO = {
    "aguardando_diagnostico": "em_execucao",
    "em_execucao": "aguardando_pecas",
    "aguardando_pecas": "finalizada",
    "finalizada": "entregue",
}


def _cpf_valido() -> str:
    """Gera um CPF com dígitos verificadores corretos (a API valida)."""
    n = [random.randint(0, 9) for _ in range(9)]
    for tamanho in (9, 10):
        soma = sum(n[i] * (tamanho + 1 - i) for i in range(tamanho))
        n.append((soma * 10 % 11) % 10)
    return "".join(map(str, n))


def _placa() -> str:
    letras = "ABCDEFGHJKLMNPRSTUVWXYZ"
    return "".join(random.choice(letras) for _ in range(3)) + str(random.randint(0, 9)) + random.choice(letras) + f"{random.randint(0, 99):02d}"


class UsuarioAutenticado(HttpUser):
    abstract = True
    perfil = "admin"
    wait_time = between(0.5, 2)

    def on_start(self):
        email, senha = CONTAS[self.perfil]
        with self.client.post(
            "/auth/login", data={"username": email, "password": senha}, name="/auth/login", catch_response=True
        ) as resposta:
            if resposta.status_code != 200:
                resposta.failure(f"login recusado ({resposta.status_code})")
                self.environment.runner.quit()
                return
            self.client.headers["Authorization"] = f"Bearer {resposta.json()['access_token']}"
        self.ordens: list[dict] = []

    def _listar_ordens(self):
        with self.client.get("/ordens-servico", name="/ordens-servico", catch_response=True) as r:
            if r.status_code == 200:
                self.ordens = r.json()
            else:
                r.failure(f"status {r.status_code}")

    @task(4)
    def listar_ordens(self):
        self._listar_ordens()

    @task(3)
    def detalhe_da_os(self):
        if not self.ordens:
            return self._listar_ordens()
        os_id = random.choice(self.ordens)["id"]
        self.client.get(f"/ordens-servico/{os_id}", name="/ordens-servico/[id]")
        self.client.get(f"/ordens-servico/{os_id}/historico", name="/ordens-servico/[id]/historico")

    @task(2)
    def listar_veiculos(self):
        self.client.get("/veiculos", name="/veiculos")

    @task(1)
    def saude(self):
        self.client.get("/health", name="/health")


class Administrador(UsuarioAutenticado):
    perfil = "admin"
    weight = 3

    @task(2)
    def listar_clientes(self):
        self.client.get("/clientes", name="/clientes")

    @task(2)
    def consultar_catalogo(self):
        self.client.get("/catalogo/servicos", name="/catalogo/servicos")
        self.client.get("/catalogo/pecas", name="/catalogo/pecas")

    @task(1)
    def buscar_cliente(self):
        self.client.get("/clientes", params={"busca": "a"}, name="/clientes?busca")

    @task(1)
    def atendimento_completo(self):
        """Cadastra cliente e veículo, emite a OS e a leva até 'entregue'."""
        if SOMENTE_LEITURA:
            return
        n = random.randint(0, 10**9)
        cliente = self.client.post(
            "/clientes",
            json={"name": f"Carga {n}", "email": f"carga.{n}@example.com", "cpf": _cpf_valido()},
            name="/clientes (criar)",
        )
        if cliente.status_code != 201:
            return
        veiculo = self.client.post(
            "/veiculos",
            json={"cliente_id": cliente.json()["id"], "plate": _placa(), "make": "Fiat", "model": "Uno"},
            name="/veiculos (criar)",
        )
        servicos = self.client.get("/catalogo/servicos", name="/catalogo/servicos").json()
        if veiculo.status_code != 201 or not servicos:
            return
        ordem = self.client.post(
            "/ordens-servico",
            json={
                "cliente_id": cliente.json()["id"],
                "veiculo_id": veiculo.json()["id"],
                "itens": [{"tipo": "mao_obra", "catalogo_id": servicos[0]["id"], "quantidade": 1}],
            },
            name="/ordens-servico (criar)",
        )
        if ordem.status_code != 201:
            return
        status = ordem.json()["status"]
        while status in _PROXIMO:
            status = _PROXIMO[status]
            r = self.client.patch(
                f"/ordens-servico/{ordem.json()['id']}/status",
                json={"status": status},
                name="/ordens-servico/[id]/status",
            )
            if r.status_code != 200:
                break


class Mecanico(UsuarioAutenticado):
    perfil = "mecanico"
    weight = 2

    @task(2)
    def consultar_catalogo(self):
        self.client.get("/catalogo/servicos", name="/catalogo/servicos")

    @task(1)
    def avancar_uma_os(self):
        if SOMENTE_LEITURA or not self.ordens:
            return
        pendentes = [o for o in self.ordens if o["status"] in _PROXIMO]
        if not pendentes:
            return
        ordem = random.choice(pendentes)
        with self.client.patch(
            f"/ordens-servico/{ordem['id']}/status",
            json={"status": _PROXIMO[ordem["status"]]},
            name="/ordens-servico/[id]/status",
            catch_response=True,
        ) as r:
            # 409 = outro usuário já avançou essa OS: comportamento correto, não é falha
            if r.status_code in (200, 409):
                r.success()
            else:
                r.failure(f"status {r.status_code}")


class ClienteDoPortal(UsuarioAutenticado):
    perfil = "cliente"
    weight = 5


@events.quitting.add_listener
def avaliar_criterios(environment, **_):
    """Marca a execução como reprovada (exit code 1) se passar dos limites."""
    total = environment.stats.total
    problemas = []
    if total.num_requests == 0:
        problemas.append("nenhuma requisição foi feita")
    if total.fail_ratio > MAX_FALHAS:
        problemas.append(f"falhas {total.fail_ratio:.1%} > {MAX_FALHAS:.1%}")
    for nome, estatistica in environment.stats.entries.items():
        p95 = estatistica.get_response_time_percentile(0.95)
        if estatistica.num_requests >= 5 and p95 and p95 > LIMITE_P95_MS:
            problemas.append(f"{nome[0]}: p95 {p95:.0f} ms > {LIMITE_P95_MS:.0f} ms")
    if problemas:
        print("\nCARGA REPROVADA:\n  - " + "\n  - ".join(problemas))
        environment.process_exit_code = 1
    else:
        print(
            f"\nCARGA APROVADA: {total.num_requests} requisições, {total.fail_ratio:.2%} de falhas, "
            f"p95 geral {total.get_response_time_percentile(0.95):.0f} ms (limite {LIMITE_P95_MS:.0f} ms)"
        )

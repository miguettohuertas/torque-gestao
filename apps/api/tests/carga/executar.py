"""
Executor do teste de carga: sobe uma API de teste isolada (a mesma do E2E,
com banco temporário), roda o Locust sem interface e encerra tudo.

    python tests/carga/executar.py                       # 20 usuários por 20 s
    python tests/carga/executar.py --usuarios 100 --duracao 60
    TORQUE_E2E_POSTGRES_URL=postgresql+psycopg2://... python tests/carga/executar.py

Gera o relatório em tests/carga/relatorio/ (HTML e CSV). Sai com código 1 se
os critérios do locustfile.py (p95 e proporção de falhas) forem violados.
"""
import argparse
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RAIZ_API = Path(__file__).resolve().parents[2]


def _esperar_api(url: str, tentativas: int = 60) -> bool:
    for _ in range(tentativas):
        try:
            with urllib.request.urlopen(url + "/health", timeout=2) as resposta:
                if resposta.status == 200:
                    return True
        except OSError:
            time.sleep(1)
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Teste de carga do Torque Gestão (Locust).")
    parser.add_argument("--usuarios", type=int, default=20)
    parser.add_argument("--rampa", type=int, default=5, help="novos usuários por segundo")
    parser.add_argument("--duracao", type=int, default=20, help="segundos")
    args = parser.parse_args()

    porta = os.environ.get("TORQUE_E2E_API_PORT", "18000")
    host = f"http://127.0.0.1:{porta}"
    relatorio = Path(__file__).parent / "relatorio"
    relatorio.mkdir(exist_ok=True)

    servidor = subprocess.Popen([sys.executable, "tests/e2e_server.py"], cwd=RAIZ_API, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not _esperar_api(host):
            print("A API de teste não subiu.")
            return 1
        print(f"API de teste em {host}; {args.usuarios} usuários por {args.duracao}s")
        return subprocess.call(
            [
                sys.executable, "-m", "locust",
                "-f", str(Path(__file__).parent / "locustfile.py"),
                "--host", host, "--headless",
                "-u", str(args.usuarios), "-r", str(args.rampa), "-t", f"{args.duracao}s",
                "--csv", str(relatorio / "carga"), "--html", str(relatorio / "carga.html"),
                "--only-summary",
            ],
            cwd=RAIZ_API,
        )
    finally:
        servidor.terminate()
        try:
            servidor.wait(timeout=10)
        except subprocess.TimeoutExpired:
            servidor.kill()


if __name__ == "__main__":
    sys.exit(main())

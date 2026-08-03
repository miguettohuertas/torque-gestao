"""
Exporta todos os diagramas de docs/diagramas/ para PNG em assets/images/diagrams/.

Requer:
  - mmdc  (Mermaid CLI):  npm install -g @mermaid-js/mermaid-cli
  - Conexão com internet para exportar diagramas PlantUML via API pública

Uso:
  python scripts/generate_diagrams.py
"""

import base64
import shutil
import subprocess
import sys
import urllib.request
import zlib
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC  = ROOT / "docs" / "diagramas"
OUT  = ROOT / "assets" / "images" / "diagrams"

MERMAID_FILES = [
    "c4-1-contexto.md",
    "c4-2-containers.md",
    "c4-3-componentes.md",
    "fluxo-processo-os.md",
    "sequencia-abertura-os.md",
    "estados-os.md",
    "modelo-er.md",
]

PLANTUML_FILES = [
    "casos-de-uso.puml",
]

KROKI_API = "https://kroki.io"


def kroki_encode(text: str) -> str:
    """Codifica fonte de diagrama para a API do Kroki.io (zlib + base64 URL-safe)."""
    compressed = zlib.compress(text.encode('utf-8'), 9)
    return base64.urlsafe_b64encode(compressed).decode('ascii')


def download_via_kroki(src: Path, dst: Path, diagram_type: str = "plantuml") -> bool:
    """Baixa PNG do Kroki.io — suporta PlantUML, Mermaid e outros formatos."""
    encoded = kroki_encode(src.read_text(encoding='utf-8'))
    url = f"{KROKI_API}/{diagram_type}/png/{encoded}"
    req = urllib.request.Request(url, headers={"User-Agent": "torque-gestao/1.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            dst.write_bytes(resp.read())
        return True
    except Exception as exc:
        print(f"    ERRO HTTP: {exc}", file=sys.stderr)
        return False


def find_mmdc() -> str:
    """Retorna o caminho absoluto do mmdc, resolvendo via npm prefix -g no Windows."""
    found = shutil.which("mmdc")
    if found:
        return found

    # No Windows, npm instala scripts como .cmd em <prefix>\
    if sys.platform == "win32":
        r = subprocess.run(
            ["npm", "prefix", "-g"],
            capture_output=True, text=True, shell=True,
        )
        if r.returncode == 0:
            candidate = Path(r.stdout.strip()) / "mmdc.cmd"
            if candidate.exists():
                return str(candidate)

    raise FileNotFoundError(
        "mmdc não encontrado. Execute: npm install -g @mermaid-js/mermaid-cli"
    )


def run(cmd: list[str], label: str) -> bool:
    print(f"  → {label}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"    ERRO: {result.stderr.strip()}", file=sys.stderr)
        return False
    return True


def export_mermaid(mmdc: str, out_dir: Path) -> int:
    ok = 0
    for fname in MERMAID_FILES:
        src = SRC / fname
        dst = out_dir / (src.stem + ".png")
        success = run(
            [mmdc, "-i", str(src), "-o", str(dst), "-b", "white", "-t", "neutral"],
            f"{fname} → {dst.name}",
        )
        if success:
            ok += 1
    return ok


def export_plantuml(out_dir: Path) -> int:
    ok = 0
    for fname in PLANTUML_FILES:
        src = SRC / fname
        dst = out_dir / (src.stem + ".png")
        print(f"  → {fname} → {dst.name}  (via kroki.io)")
        if download_via_kroki(src, dst, "plantuml"):
            ok += 1
    return ok


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    try:
        mmdc = find_mmdc()
        print(f"mmdc encontrado: {mmdc}\n")
    except FileNotFoundError as e:
        print(f"ERRO: {e}", file=sys.stderr)
        sys.exit(1)

    print("Exportando diagramas Mermaid...")
    n_mermaid = export_mermaid(mmdc, OUT)

    print("\nExportando diagramas PlantUML...")
    n_plantuml = export_plantuml(OUT)

    total = n_mermaid + n_plantuml
    expected = len(MERMAID_FILES) + len(PLANTUML_FILES)
    print(f"\n{total}/{expected} diagramas exportados → {OUT}")

    if total < expected:
        sys.exit(1)


if __name__ == "__main__":
    main()

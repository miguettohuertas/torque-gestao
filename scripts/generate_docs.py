import os
import re
import sys
import time
from playwright.sync_api import sync_playwright

BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROTOTYPE_URL   = "https://torque-gestao.surge.sh"
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "assets", "images", "screenshots")
LATEX_FILE      = os.path.join(BASE_DIR, "docs", "academic", "report.tex")

SCREENS = {
    "TELA DE LOGIN":         {"tq_screen": "login"},
    "DASHBOARD ADMIN":       {"tq_screen": "app", "tq_role": "admin", "tq_page": "dashboard"},
    "DASHBOARD MECANICO":    {"tq_screen": "app", "tq_role": "mech",  "tq_page": "dashboard"},
    "LISTA DE OS":           {"tq_screen": "app", "tq_role": "admin", "tq_page": "os"},
    "HISTORICO OS":          {"tq_screen": "app", "tq_role": "admin", "tq_page": "historico"},
    "NOVA OS":               {"tq_screen": "app", "tq_role": "admin", "tq_page": "nova-os"},
    "DETALHES DA OS":        {"tq_screen": "app", "tq_role": "admin", "tq_page": "os",
                              "clicks": ["button:has-text('Abrir')"]},
    "HISTORICO DO VEICULO":  {"tq_screen": "app", "tq_role": "admin", "tq_page": "os",
                              "clicks": ["button:has-text('Abrir')", "button:has-text('Histórico veículo')"]},
    "CLIENTES E VEÍCULOS":   {"tq_screen": "app", "tq_role": "admin", "tq_page": "clientes"},
    "PERFIL DO CLIENTE":     {"tq_screen": "app", "tq_role": "admin", "tq_page": "clientes",
                              "clicks": ["button:has-text('Ver perfil')"]},
    "NOVO CLIENTE":          {"tq_screen": "app", "tq_role": "admin", "tq_page": "cliente-form"},
    "CADASTRO DE VEICULO":   {"tq_screen": "app", "tq_role": "admin", "tq_page": "clientes",
                              "clicks": ["button:has-text('Ver perfil')", "button:has-text('Novo veículo')"]},
    "LISTA DE VEICULOS":     {"tq_screen": "app", "tq_role": "admin", "tq_page": "veiculos"},
    "CATALOGO":              {"tq_screen": "app", "tq_role": "admin", "tq_page": "catalogo"},
    "GESTAO DE USUARIOS":    {"tq_screen": "app", "tq_role": "admin", "tq_page": "usuarios"},
    "CONFIGURACOES":         {"tq_screen": "app", "tq_role": "admin", "tq_page": "config"},
    "PORTAL DO CLIENTE":     {"tq_screen": "portal", "tq_role": "client", "tq_page": "painel"},
    "PORTAL ACOMPANHAMENTO": {"tq_screen": "portal", "tq_role": "client", "tq_page": "portal-os"},
    "PORTAL HISTORICO":      {"tq_screen": "portal", "tq_role": "client", "tq_page": "portal-historico"},
}


def slug(name: str) -> str:
    return name.lower().replace(" ", "_")


def log(msg: str) -> None:
    print(msg, flush=True)


def set_ls_and_reload(page, cfg: dict) -> None:
    ls = {k: v for k, v in cfg.items() if k != "clicks"}
    page.evaluate(
        """(items) => {
            localStorage.clear();
            for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
        }""",
        ls,
    )
    page.reload(wait_until="load")
    page.wait_for_selector("#root > div", timeout=30000)
    time.sleep(0.6)


def capture_screenshots() -> None:
    log(f"Capturing {len(SCREENS)} screenshots from {PROTOTYPE_URL}")
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()

        # Warm-up: load page once so Babel compiles and browser caches all JSX files
        log("  Loading page (Babel warm-up)...")
        for attempt in range(3):
            try:
                page.goto(PROTOTYPE_URL, wait_until="networkidle", timeout=60000)
                page.wait_for_selector("#root > div", timeout=60000)
                break
            except Exception:
                log(f"  Warm-up attempt {attempt+1} failed, retrying...")
                if attempt == 2:
                    raise

        total = len(SCREENS)
        for i, (name, cfg) in enumerate(SCREENS.items(), 1):
            log(f"  [{i:02d}/{total}] {name}")
            try:
                set_ls_and_reload(page, cfg)
            except Exception as e:
                log(f"         WARN reload failed: {e}")
                continue

            for selector in cfg.get("clicks", []):
                try:
                    page.wait_for_selector(selector, timeout=10000)
                    page.locator(selector).first.click()
                    time.sleep(0.8)
                except Exception as e:
                    log(f"         WARN click failed '{selector}': {e}")
                    break

            out = os.path.join(SCREENSHOTS_DIR, slug(name) + ".png")
            page.screenshot(path=out)

        browser.close()
    log("Done capturing.")


def update_latex() -> None:
    with open(LATEX_FILE, encoding="utf-8") as f:
        content = f.read()

    for name in SCREENS:
        img = slug(name) + ".png"
        content = re.sub(
            r"\\includegraphics\[width=0\.8\\textwidth\]\{[^}]+?" + re.escape(slug(name)) + r"\.png\}",
            r"\\includegraphics[width=0.8\\textwidth]{" + img + r"}",
            content,
        )

    with open(LATEX_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    log("LaTeX updated.")


if __name__ == "__main__":
    capture_screenshots()
    update_latex()
    log("All done!")

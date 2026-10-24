# Estratégia de testes — Torque Gestão

Este documento descreve **como o Torque Gestão é testado**: quais níveis de
teste existem, que ferramenta cobre cada um, o que cada requisito tem de
teste automatizado e como rodar tudo localmente e no CI.

> Responsável pela estrutura de testes: Miguel Angel Balladares Huertas.

## 1. Objetivos

1. Garantir que as **regras de negócio** dos requisitos funcionais (RF01–RF07)
   continuem corretas a cada mudança, principalmente orçamento (RF03) e fluxo
   de status da OS (RF04).
2. Verificar com testes automatizados os riscos do **Mapeamento de Riscos**
   do relatório: falhas de autenticação, SQL Injection e vazamento de dados de
   clientes (LGPD).
3. Testar no **mesmo banco usado em produção** (PostgreSQL), não só no SQLite.
4. Impedir que código sem teste entre no `main`: o CI bloqueia o PR se algum
   teste falhar ou se a cobertura do back-end cair abaixo de **95%**.

## 2. Níveis de teste (pirâmide)

```text
                ┌──────────────┐
                │  E2E (6)     │  Playwright: navegador real + API real
                ├──────────────┤
                │ Integração   │  pytest + TestClient: HTTP → FastAPI →
                │  da API (153)│  SQLAlchemy → banco (SQLite e PostgreSQL)
                ├──────────────┤
                │ Unitário (7+)│  node:test (cliente HTTP do front) e
                │              │  funções puras do back (validação, Telegram)
                └──────────────┘
```

| Nível | Ferramenta | Onde fica | O que valida |
|---|---|---|---|
| Unitário (front) | `node:test` | `apps/prototype/tests/api.test.cjs` | Cliente HTTP `src/api.js`: login OAuth2, envio do Bearer, sessão expirada (401), erros de validação/conflito, falha de rede sem cair em dados falsos |
| Unitário (back) | pytest | dentro de `apps/api/tests/` (ex.: `test_seguranca.py`, `test_telegram.py`) | Hash Bcrypt, validação de token, montagem/envio de mensagens do Telegram com a rede simulada |
| Integração (API) | pytest + `fastapi.testclient` | `apps/api/tests/test_*.py` | Cada teste faz requisições HTTP reais à API, com login JWT e um banco criado do zero, e confere status HTTP, corpo da resposta e o que ficou gravado no banco |
| Ponta a ponta (E2E) | Playwright (Chromium) | `apps/prototype/tests/*.spec.cjs` | Usuário real clicando nas telas, com a API e o banco de verdade por trás |

**Por que a maior parte é integração?** A API é onde estão as regras e a
segurança (RBAC, isolamento do portal). Testar pela interface HTTP, com banco
real, pega erros que um teste unitário isolado esconderia (permissões,
constraints do banco, serialização), e ainda roda em ~1–2 minutos.

## 3. Isolamento e dados de teste

- **API:** a fixture `engine` (`apps/api/tests/conftest.py`) cria todas as
  tabelas antes de **cada** teste e apaga depois. A ordem dos testes nunca
  importa. Usuários prontos: fixtures `admin_user`, `mecanico_user`,
  `cliente_user`; `auth_header(usuario)` faz o login e devolve o cabeçalho
  `Authorization`.
- **Banco:** por padrão SQLite em memória (rápido, sem instalar nada). Com a
  variável `TEST_DATABASE_URL` apontando para um PostgreSQL de teste, **a
  mesma suíte** roda no Postgres. Isso já pegou uma diferença real: o SQLite
  não aplica chaves estrangeiras por padrão e aceitava um dado que o
  PostgreSQL (e a produção) recusam.
- **Serviços externos:** o Telegram nunca é chamado de verdade nos testes —
  `httpx` e o envio são substituídos com `monkeypatch`.
- **E2E:** `apps/api/tests/e2e_server.py` sobe a API num banco temporário
  (SQLite, ou um *schema* exclusivo no PostgreSQL com
  `TORQUE_E2E_POSTGRES_URL`), aplica as migrations do Alembic e cria os
  usuários de teste:

  | Perfil | E-mail | Senha |
  |---|---|---|
  | Admin | `admin@torquegestao.com.br` | `torque123` |
  | Mecânico | `mecanico@example.com` | `mecanico123` |
  | Cliente (portal) | `portal@example.com` | `portal123` |

  Os specs rodam em sequência (1 worker, ordem alfabética): `flows.spec.cjs`
  roda primeiro e confere os contadores do banco vazio; os demais só
  acrescentam dados com valores únicos.

## 4. Matriz de rastreabilidade (requisito/risco × testes)

| Requisito / risco | Testes de API (pytest) | Testes E2E (Playwright) |
|---|---|---|
| **RF01** — Clientes (CRUD, CPF/CNPJ, busca) | `test_clientes.py` (16): criação, documento inválido e dígito verificador errado, e-mail duplicado (409) na criação e na edição, busca, RBAC por perfil | `flows` (cadastro pela tela), `validacoes` (CPF inválido não salva) |
| **RF02** — Veículos (placa Mercosul/antiga) | `test_veiculos.py` (10): normalização de placa, placa inválida, duplicada (409) na criação e na edição, cliente inexistente, filtro por cliente | `flows`, `validacoes` (placa duplicada não duplica) |
| **RF03** — Emissão de OS e orçamento | `test_ordens_servico.py` (10), `test_regras_criticas.py`: orçamento calculado pelo servidor, preço enviado pelo cliente ignorado, *snapshot* de preços, quantidades inválidas, criação atômica | `flows` (total R$ 191,00), `mecanico` (R$ 180,00) |
| **RF04** — Fluxo de status e histórico | `test_regras_criticas.py`: matriz completa das 25 transições, status desconhecido, transição concorrente sem histórico duplicado; `test_ordens_servico.py`: pular/voltar etapa (409) | `flows` (5 etapas até Entregue), `mecanico` |
| **RF05** — Catálogo de serviços e peças | `test_catalogo.py` (13): CRUD de serviços e peças, validação de preço/estoque, 404, Mecânico só consulta | usado em `flows` e `mecanico` |
| **RF06** — Autenticação e RBAC | `test_auth.py` (9), `test_seguranca.py` (22) | login com senha errada (`flows`), sessão expirada (`flows`), menus por perfil (`mecanico`, `portal-isolamento`) |
| **RF07** — Notificações por Telegram | `test_telegram.py` (23): aviso na abertura e a cada status, opt-in por convite de uso único, convite expirado, desvínculo, falha de rede não afeta a OS, token do bot fora dos logs | — (serviço externo) |
| **Portal do cliente** | `test_regras_criticas.py`: isolamento em listas, detalhes, filtros e escrita; vínculo não usa e-mail para autorizar | `flows`, `portal-isolamento` |
| **Risco: falhas de autenticação** | `test_seguranca.py`: token adulterado, de outro segredo, expirado, sem `sub`, com `alg: none`, de usuário removido; perfil forjado no token não eleva privilégio; senha só como hash Bcrypt | `flows` (token inválido volta ao login) |
| **Risco: SQL Injection** | `test_seguranca.py`: 5 payloads na busca de clientes e no login; texto com aspas gravado literalmente | — |
| **Risco: vazamento de dados (LGPD)** | `test_seguranca.py`: hash nunca aparece nas respostas; campos internos (id, `telegram_chat_id`, `role`) ignorados no cadastro; isolamento do portal | `portal-isolamento`: nem a tela nem a API mostram dados de outro cliente |
| **Scripts administrativos** | `test_scripts.py` (8): seed idempotente, provisionamento do login do portal (senha curta, longa, divergente, cliente inexistente, duplicado) | — |
| **Migrations (Alembic)** | CI: `alembic upgrade head` + `downgrade base` num PostgreSQL limpo | `e2e_server.py` aplica as migrations antes do E2E |

## 5. Como rodar localmente

### Back-end (`apps/api`)

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate          # Windows (PowerShell): .venv\Scripts\Activate.ps1
pip install -r requirements.txt ruff==0.6.9

ruff check .                       # lint
pytest                             # suíte completa (SQLite em memória)
pytest --cov=app                   # + relatório de cobertura (falha se < 95%)
pytest -m seguranca                # só os testes de segurança
pytest tests/test_regras_criticas.py -k transicoes   # um arquivo / filtro por nome
```

Contra PostgreSQL (ex.: o do `docker compose up`, que fica na porta **5433**
do seu computador), num banco **só de teste** — as tabelas são apagadas a
cada teste:

```bash
docker compose up -d db
docker compose exec db createdb -U torque torque_test     # só na primeira vez
TEST_DATABASE_URL=postgresql+psycopg2://torque:torque@localhost:5433/torque_test pytest
# PowerShell: $env:TEST_DATABASE_URL="postgresql+psycopg2://torque:torque@localhost:5433/torque_test"; pytest
```

### Front-end (`apps/prototype`)

```bash
cd apps/prototype
npm ci
npm test                           # unitários (node:test)
npx playwright install chromium    # só na primeira vez
npm run test:e2e                   # E2E: sobe a API de teste e o front sozinho
npx playwright test --ui           # modo visual, bom para depurar
```

O E2E usa `python3` para subir a API de teste. Para usar o Python do
ambiente virtual do back-end, informe o caminho **absoluto** em
`TORQUE_PYTHON`:

```bash
TORQUE_PYTHON="$(realpath ../api/.venv/bin/python)" npm run test:e2e
# PowerShell: $env:TORQUE_PYTHON = (Resolve-Path ..\api\.venv\Scripts\python.exe).Path; npm run test:e2e
```

## 6. Integração contínua

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) roda a
cada push/PR que toque `apps/api` ou `apps/prototype`:

| Job | O que faz |
|---|---|
| `lint-and-test` | ruff + pytest em SQLite com cobertura mínima de 95%; publica `coverage.xml` como artefato |
| `api-postgres` | PostgreSQL 16 como serviço; migrations sobem e descem do zero; a mesma suíte do pytest roda no Postgres |
| `frontend` | `npm test` + Playwright contra a API real com PostgreSQL; salva traces se falhar |

## 7. Como escrever um teste novo

1. Escolha o arquivo do requisito (`test_<recurso>.py`) ou crie um novo.
2. Nomeie descrevendo o comportamento esperado:
   `test_<ação>_<condição>_retorna_<resultado>`.
3. Estruture em **preparar → agir → verificar**, uma linha em branco entre
   cada bloco (ver `test_clientes.py`).
4. Confira também o banco, não só a resposta HTTP, quando o teste for sobre
   algo que **não** pode ser gravado.
5. Teste de segurança? Marque com `pytestmark = pytest.mark.seguranca` (ou
   `@pytest.mark.seguranca`).
6. Rode `ruff check . && pytest --cov=app` antes do PR.

## 8. Limitações conhecidas e próximos passos

- **Telas React sem teste de componente:** o protótipo usa Babel no navegador,
  sem bundler; testes de componente (Vitest + Testing Library) exigiriam
  migrar o build para Vite. Hoje as telas são cobertas pelo E2E.
- **Smoke test pós-deploy:** checar `/health` em produção após cada deploy,
  quando o deploy for automatizado.
- **Desempenho/carga:** não há testes de carga; candidatos para o MVP 3.

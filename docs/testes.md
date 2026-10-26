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
   teste falhar ou se a cobertura de linhas e ramos do back-end cair abaixo de **100%**.

## 2. Tipos de teste

O projeto cobre os onze tipos de teste mais cobrados no mercado. A coluna
"Como rodar" é o comando exato (detalhes na seção 5).

| # | Tipo | O que responde | Ferramenta | Onde fica | Qtde | Como rodar |
|---|---|---|---|---|---|---|
| 1 | **Unitário** | Uma peça isolada funciona? | pytest, `node:test` | `test_entrada_segura.py` (middleware), `test_smoke.py` (script), `apps/prototype/tests/api.test.cjs` | 16 + 14 + 7 | `pytest`, `npm test` |
| 2 | **Integração** | As camadas funcionam juntas (HTTP → FastAPI → SQLAlchemy → banco)? | pytest + `TestClient`, SQLite e PostgreSQL | `apps/api/tests/test_*.py` | a maior parte dos 377 | `pytest` |
| 3 | **Ponta a ponta (E2E)** | O usuário consegue fazer o fluxo pelo navegador? | Playwright (Chromium) | `apps/prototype/tests/*.spec.cjs` | 6 | `npm run test:e2e` |
| 4 | **Aceitação (UAT)** | O sistema cumpre os critérios de aceite do RF01–RF07, ditos pelo negócio? | pytest-bdd (Gherkin em português) | `apps/api/tests/aceitacao/*.feature` | 34 | `pytest -m aceitacao` |
| 5 | **Regressão** | Algo que funcionava quebrou? | A suíte inteira, a cada push/PR no CI | `.github/workflows/ci.yml` | tudo | automático no CI |
| 6 | **Segurança** | JWT, SQL injection, RBAC, LGPD e entradas hostis estão protegidos? | pytest | `test_seguranca.py`, `test_rbac_matriz.py`, `test_entrada_segura.py` | 147 | `pytest -m seguranca` |
| 7 | **Contrato de API** | A API cumpre o que o OpenAPI (Swagger) promete, para qualquer entrada? | Schemathesis (gera casos a partir do OpenAPI) | `test_contrato_api.py` | 29 | `pytest -m contrato` |
| 8 | **Smoke** | O sistema subiu e responde (logo após um deploy)? | Script somente leitura + pytest | `tests/smoke.py`, `test_smoke.py` | 14 | `python apps/api/tests/smoke.py <url>` |
| 9 | **Desempenho** | Consultas e tempos estão dentro do orçamento (sem N+1)? | pytest (conta SQL e mede tempo) | `test_desempenho.py` | 8 | `pytest -m desempenho` |
| 10 | **Carga** | Aguenta muitos usuários ao mesmo tempo? | Locust | `apps/api/tests/carga/` | 3 perfis de usuário | `python tests/carga/executar.py` |
| 11 | **Acessibilidade** | Pessoas com deficiência conseguem usar as telas (WCAG 2.1 AA)? | axe-core + Playwright | `zz-acessibilidade.spec.cjs` | 6 | `npm run test:e2e` |

Total: **377 testes de API (pytest)**, **7 unitários do front** e **12 E2E**
(6 de fluxo e 6 de acessibilidade), mais a carga com Locust. Usabilidade
com pessoas reais e testes de mutação ficam fora (ver seção 8).

**Por que a maior parte é integração?** A API é onde estão as regras e a
segurança (RBAC, isolamento do portal). Testar pela interface HTTP, com banco
real, pega erros que um teste unitário isolado esconderia (permissões,
constraints do banco, serialização).

### O que os testes novos acharam (bugs reais corrigidos)

| Tipo de teste | Problema encontrado | Correção |
|---|---|---|
| Contrato (Schemathesis) | `POST /catalogo/servicos` e `/pecas` com preço `0.001` viravam `0.00` no banco e a resposta falhava com **500** | Preço limitado a 2 casas e 10 dígitos (`max_digits`/`decimal_places`) |
| Contrato (no PostgreSQL) | Qualquer texto com o caractere nulo (`%00`) em busca, ID, JSON ou login derrubava a API com **500**; o SQLite escondia | Middleware `RejeitarCaractereNulo` devolve 422 |
| Contrato | O OpenAPI não documentava 400/401/403/404/409/503 | `responses=` em cada router (`app/core/respostas.py`) |
| Desempenho | `GET /ordens-servico` fazia **1 consulta por OS** (N+1): 30 OS = 32 consultas | `selectinload` dos itens: número fixo de consultas |
| Acessibilidade | Contraste do `.eyebrow` de 4,16:1 (mínimo 4,5:1) | Cor escurecida para 5,1:1 |
| Acessibilidade | Botão "Mostrar" da senha sem nome acessível | `aria-label="Mostrar senha"` |
| Estrutura dos testes | Os testes liam o `.env` local (token real do bot) e variavam por máquina | `conftest.py` zera as variáveis do Telegram |

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
| **RF05** — Catálogo de serviços e peças | `test_catalogo.py` (23): CRUD de serviços e peças, validação de preço/estoque, 404, Mecânico só consulta | usado em `flows` e `mecanico` |
| **RF06** — Autenticação e RBAC | `test_auth.py` (9), `test_seguranca.py` (22), `test_rbac_matriz.py` (109): todas as rotas × os 3 perfis + sem token; falha se uma rota nova não entrar na matriz | login com senha errada (`flows`), sessão expirada (`flows`), menus por perfil (`mecanico`, `portal-isolamento`) |
| **RF07** — Notificações por Telegram | `test_telegram.py` (26): aviso na abertura e a cada status, opt-in por convite de uso único, convite expirado, desvínculo, falha de rede não afeta a OS, token do bot fora dos logs | — (serviço externo) |
| **Portal do cliente** | `test_regras_criticas.py`: isolamento em listas, detalhes, filtros e escrita; vínculo não usa e-mail para autorizar | `flows`, `portal-isolamento` |
| **Risco: falhas de autenticação** | `test_seguranca.py`: token adulterado, de outro segredo, expirado, sem `sub`, com `alg: none`, de usuário removido; perfil forjado no token não eleva privilégio; senha só como hash Bcrypt | `flows` (token inválido volta ao login) |
| **Risco: SQL Injection** | `test_seguranca.py`: 5 payloads na busca de clientes e no login; texto com aspas gravado literalmente | — |
| **Risco: vazamento de dados (LGPD)** | `test_seguranca.py`: hash nunca aparece nas respostas; campos internos (id, `telegram_chat_id`, `role`) ignorados no cadastro; isolamento do portal | `portal-isolamento`: nem a tela nem a API mostram dados de outro cliente |
| **Scripts administrativos** | `test_scripts.py` (8): seed idempotente, provisionamento do login do portal (senha curta, longa, divergente, cliente inexistente, duplicado) | — |
| **Migrations (Alembic)** | CI: `alembic upgrade head` + `downgrade base` num PostgreSQL limpo | `e2e_server.py` aplica as migrations antes do E2E |
| **Aceitação RF01–RF07** | `tests/aceitacao/` (34 cenários Dado/Quando/Então): cadastros, orçamento, fluxo de status, portal, catálogo e acesso, avisos por Telegram | — |
| **Contrato OpenAPI** | `test_contrato_api.py` (29): nenhuma rota responde 5xx nem fora do que o Swagger documenta | — |
| **Permissões por perfil (RBAC)** | `test_rbac_matriz.py` (109): cada rota × admin, mecânico, cliente e sem token; falha se uma rota nova não entrar na matriz | `mecanico`, `portal-isolamento` |
| **Entradas hostis** | `test_entrada_segura.py` (16): caractere nulo no caminho, query, JSON e formulário | — |
| **Desempenho** | `test_desempenho.py` (8): sem N+1 nas listagens, orçamento de tempo | — |
| **Carga** | `tests/carga/locustfile.py`: admin, mecânico e portal; p95 ≤ 1 s e falhas ≤ 1% | — |
| **Smoke da produção** | `test_smoke.py` (14) valida o script; `smoke-producao.yml` roda no ambiente publicado | — |
| **Acessibilidade WCAG 2.1 AA** | — | `zz-acessibilidade`: login, painel, listas, formulários, detalhe da OS e portal; navegação só por teclado |

## 5. Como rodar localmente

### Back-end (`apps/api`)

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate          # Windows (PowerShell): .venv\Scripts\Activate.ps1
pip install -r requirements.txt ruff==0.6.9

ruff check .                       # lint
pytest                             # suíte completa (SQLite em memória)
pytest --cov=app                   # + relatório de cobertura (falha se < 100%)
pytest -m seguranca                # só os testes de segurança
pytest -m contrato                 # contrato OpenAPI (Schemathesis)
pytest -m aceitacao                # cenários Dado/Quando/Então
pytest -m desempenho               # N+1 e orçamento de tempo
pytest -m smoke                    # o smoke test contra a API local
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

### Smoke test do ambiente publicado (somente leitura)

```bash
python apps/api/tests/smoke.py https://torquegestao.duckdns.org/api --front https://torquegestao.duckdns.org
# com login (confere token, perfil e as listagens principais):
SMOKE_EMAIL=... SMOKE_PASSWORD=... python apps/api/tests/smoke.py <url-da-api>
```

### Carga (Locust)

```bash
cd apps/api
pip install -r requirements-carga.txt
python tests/carga/executar.py                          # 20 usuários por 20 s
python tests/carga/executar.py --usuarios 100 --rampa 20 --duracao 60
```

O executor sobe uma API de teste isolada (banco temporário), roda o Locust e
grava o relatório HTML/CSV em `tests/carga/relatorio/`. Sai com código 1 se
o p95 passar de `CARGA_P95_MS` (padrão 1000 ms) ou as falhas de
`CARGA_MAX_FALHAS` (padrão 1%). Medido na máquina de desenvolvimento, com
100 usuários simultâneos: ~96 req/s, 0% de falhas, p95 de 250 ms.

### Front-end (`apps/prototype`)

```bash
cd apps/prototype
npm ci
npm test                           # unitários (node:test)
npx playwright install chromium    # só na primeira vez
npm run test:e2e                   # E2E + acessibilidade: sobe a API de teste e o front sozinho
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
| `lint-and-test` | ruff + pytest em SQLite com cobertura **100%** (linhas e ramos); publica `coverage.xml` como artefato |
| `api-postgres` | PostgreSQL 16 como serviço; migrations sobem e descem do zero; a mesma suíte do pytest roda no Postgres |
| `frontend` | `npm test` + Playwright (fluxos e acessibilidade) contra a API real com PostgreSQL; salva traces se falhar |
| `carga` | Locust (30 usuários, 20 s) contra a API com PostgreSQL; reprova se passar do p95 ou das falhas; publica o relatório |

O pytest dos dois primeiros jobs já inclui contrato, aceitação, segurança,
desempenho e smoke. O workflow
[`smoke-producao.yml`](../.github/workflows/smoke-producao.yml) roda o smoke
test (somente leitura) no ambiente publicado todo dia às 08:00 e pode ser
disparado à mão depois de um deploy.

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
  migrar o build para Vite. Hoje as telas são cobertas pelo E2E e pela
  acessibilidade.
- **Usabilidade:** exige pessoas reais usando o sistema e não é automatizável;
  fica como roteiro de teste manual com o dono da oficina.
- **Testes de mutação** (ex.: `mutmut`): medem se os testes realmente pegam
  erros no código, além da cobertura. Candidato para o MVP 3.
- **Carga em produção:** o teste de carga roda contra uma API de teste; contra
  a produção, só em modo leitura (`CARGA_SOMENTE_LEITURA=1`) e combinado com o
  responsável pelo servidor.

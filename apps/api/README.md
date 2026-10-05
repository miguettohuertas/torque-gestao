# Torque Gestão — API (`apps/api`)

Back-end do MVP 2, em FastAPI + SQLAlchemy + PostgreSQL. Ver o escopo completo,
critérios de aceite e cronograma em
[`docs/academic/documentacao-mvp1.tex`](../../docs/academic/documentacao-mvp1.tex).

## Como rodar (via Docker — recomendado)

```bash
cp apps/api/.env.example apps/api/.env    # ajuste os valores se precisar
docker compose up --build
```

Em outro terminal, com os containers no ar:

```bash
docker compose exec api alembic upgrade head   # cria as tabelas no Postgres
docker compose exec api python -m app.seed     # cria o usuário admin inicial
```

A documentação interativa (Swagger) fica em <http://localhost:8000/docs>.
Usuário para testar o login (RF06): `admin@torquegestao.com.br` / `torque123`
(troque a senha depois do primeiro login).

## Como rodar sem Docker (ambiente virtual local)

Requer um PostgreSQL rodando localmente (ou aponte `DATABASE_URL` para um
banco já existente).

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # ajuste DATABASE_URL para localhost
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

## Lint e testes

Rodados automaticamente a cada push/PR em `apps/api/**` pelo workflow
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). Para rodar
localmente antes de abrir um PR:

```bash
cd apps/api
source .venv/bin/activate    # criado no passo anterior
pip install ruff==0.6.9
ruff check .                 # lint
pytest -v                    # testes (SQLite em memória, não precisa de Postgres rodando)
```

## Estrutura

```text
apps/api/
├── app/
│   ├── main.py         # instância do FastAPI e registro dos routers
│   ├── config.py        # configurações via variáveis de ambiente
│   ├── database.py      # engine/sessão do SQLAlchemy
│   ├── seed.py           # cria o usuário admin inicial
│   ├── core/
│   │   ├── security.py   # hash de senha (Bcrypt) e JWT
│   │   └── deps.py        # dependencies de autenticação e RBAC
│   ├── models/            # entidades SQLAlchemy (modelo ER completo)
│   ├── schemas/            # schemas Pydantic (request/response)
│   └── routers/
│       ├── health.py       # GET /health
│       ├── auth.py          # RF06 — login (JWT) e /auth/me
│       ├── clientes.py       # RF01 — CRUD de clientes
│       ├── veiculos.py        # RF02 — CRUD de veículos
│       ├── catalogo.py         # RF05 — catálogo de serviços e peças
│       └── ordens_servico.py    # RF03/RF04 — emissão de OS e status
├── alembic/                    # migrations do banco
├── tests/                       # pytest (roda contra SQLite em memória)
├── Dockerfile
├── pyproject.toml                # config do ruff (lint) e do pytest
└── requirements.txt
```

## Status (Sprint 1 — ver Seção 2.6 do documento de MVP 1)

- [x] Estrutura do projeto, Docker e PostgreSQL local.
- [x] Modelo ER completo mapeado em SQLAlchemy (`app/models/`) e primeira
      migration aplicada (`alembic/versions/`).
- [x] RF06 — autenticação real (login, JWT, RBAC) implementada e coberta
      por testes automatizados (`tests/test_auth.py`), incluindo o 403 de
      perfil sem permissão em `GET /auth/usuarios` (rota protegida com
      `require_role`).
- [x] RF06 — validado manualmente contra um PostgreSQL real (migration
      do Alembic aplicada e fluxo de login/RBAC testado via Swagger fora
      do SQLite em memória usado pelos testes automatizados).
- [x] CI (GitHub Actions) rodando lint + testes a cada push/PR — adiantado
      da Fase 5 para já existir desde o começo do desenvolvimento real.
- [x] `docker compose up` validado de ponta a ponta (API + PostgreSQL
      subindo juntos com um único comando, migration aplicada e login
      testado via Swagger) — confirmado por Miguel Angel Balladares
      Huertas e já usado numa apresentação.
- [x] RF01 — CRUD de clientes, com validação de CPF/CNPJ e busca por
      nome/e-mail/documento (`app/routers/clientes.py`,
      `tests/test_clientes.py`).
- [x] RF02 — CRUD de veículos, vinculado a um cliente existente e com
      validação de placa (Mercosul e padrão antigo)
      (`app/routers/veiculos.py`, `tests/test_veiculos.py`).
- [x] RF05 — catálogo de serviços e peças, leitura para Admin/Mecânico
      e cadastro só por Admin (`app/routers/catalogo.py`,
      `tests/test_catalogo.py`).
- [x] RF03/RF04 — emissão de OS com orçamento calculado a partir do
      catálogo e fluxo de status validado (sem pular nem voltar etapa),
      com histórico em `HISTORICO_STATUS`
      (`app/routers/ordens_servico.py`, `tests/test_ordens_servico.py`).
- [x] Ambiente Docker/PostgreSQL validado com RF01–RF05 no fluxo integrado
      de navegador (schema de teste isolado); evidências em `docs/entregas/fase4-24-09.md`.
- [x] Integração do front-end e portal com a API real (Fase 4), com testes RF03/RF04.
      Veja [execução e validação](../prototype/README.md).
- [ ] CI/CD estendido para deploy e deploy em si (Render/Vercel, Fase 5).


## Portal do cliente (Fase 4)

As rotas de leitura de clientes, veículos, OS e histórico também aceitam o perfil
Cliente, com filtro obrigatório pelo vínculo `usuarios.cliente_id`. Escritas
continuam restritas à equipe. Aplique `alembic upgrade head` para criar o vínculo.
Para criar credenciais de um cadastro existente, execute
`python -m app.provisionar_cliente ID_DO_CLIENTE`; a senha é solicitada interativamente.

## Notificações por Telegram (RF07)

O Telegram substitui o e-mail/SMS: o cliente recebe uma mensagem quando a OS é aberta
e a cada mudança de status. O envio roda depois da resposta (`BackgroundTasks`) e uma
falha do Telegram nunca impede a atualização da OS.

1. Crie um bot com o `@BotFather` e preencha em `apps/api/.env`:
   `TELEGRAM_BOT_TOKEN` e `TELEGRAM_BOT_USERNAME` (sem o `@`). Com o token vazio,
   nada é enviado.
2. Aplique a migration: `docker compose exec api alembic upgrade head`.
3. Suba o worker que recebe as mensagens do bot (polling, sem URL pública):
   `docker compose --profile telegram up -d telegram-poller`
   (ou, sem Docker, `python -m app.telegram_poller`).
4. Vínculo do cliente: `POST /clientes/{id}/telegram/vinculo` devolve um link
   `https://t.me/<bot>?start=<token>` válido por 30 minutos e de uso único. O cliente
   abre o link e toca em Iniciar. O front-end tem o botão na lista de clientes (equipe)
   e no painel do portal (cliente).
5. Desativar: `DELETE /clientes/{id}/telegram` ou o comando `/parar` no bot.

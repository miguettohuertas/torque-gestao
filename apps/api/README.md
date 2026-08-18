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
│       ├── clientes.py       # RF01 — esqueleto, ver TODOs no arquivo
│       └── veiculos.py        # RF02 — esqueleto, ver TODOs no arquivo
├── alembic/                    # migrations do banco
├── Dockerfile
└── requirements.txt
```

## Status (Sprint 1 — ver Seção 2.6 do documento de MVP 1)

- [x] Estrutura do projeto, Docker e PostgreSQL local.
- [x] Modelo ER completo mapeado em SQLAlchemy (`app/models/`) e primeira
      migration aplicada (`alembic/versions/`).
- [x] RF06 — autenticação real (login, JWT, RBAC) implementada e testada
      manualmente ponta a ponta.
- [ ] RF01 — CRUD de clientes (responsável: Leonardo — ver TODOs em
      `app/routers/clientes.py`).
- [ ] RF02 — CRUD de veículos (responsável: Lucas — ver TODOs em
      `app/routers/veiculos.py`).
- [ ] RF03/RF04/RF05 — ordens de serviço e catálogo (Fase 3, a partir de 28/08).

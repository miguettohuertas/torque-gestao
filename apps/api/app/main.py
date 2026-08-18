"""
Ponto de entrada da API do Torque Gestão (apps/api).

Rodar localmente (depois de `docker compose up -d db` ou com o stack
completo via `docker compose up`):

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Documentação interativa (RNF06 — OpenAPI/Swagger): http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, clientes, health, veiculos

app = FastAPI(
    title="Torque Gestão API",
    description="API do sistema de gestão de oficinas mecânicas Torque Gestão (MVP 2).",
    version="0.1.0",
)

# Libera o front-end (protótipo em apps/prototype, hoje em torque-gestao.surge.sh,
# e futuramente em Vercel) a consumir a API durante o desenvolvimento. Restringir
# a origem exata antes do deploy de produção (Fase 5).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(veiculos.router)
# Próximos routers (Fase 3, responsável: Leonardo):
#   from app.routers import ordens_servico, catalogo
#   app.include_router(ordens_servico.router)
#   app.include_router(catalogo.router)

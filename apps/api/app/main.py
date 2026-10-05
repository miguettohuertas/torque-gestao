"""
Ponto de entrada da API do Torque Gestão (apps/api).

Rodar localmente (depois de `docker compose up -d db` ou com o stack
completo via `docker compose up`):

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Documentação interativa (RNF06 — OpenAPI/Swagger): http://localhost:8000/docs
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    catalogo,
    clientes,
    health,
    ordens_servico,
    veiculos,
)

app = FastAPI(
    title="Torque Gestão API",
    description="API do sistema de gestão de oficinas mecânicas Torque Gestão (MVP 2).",
    version="0.1.0",
)

# CORS_ORIGINS (lista separada por vírgula) restringe as origens em produção;
# sem ela, mantém "*" para o desenvolvimento local.
_origens = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origens,
    allow_credentials="*" not in _origens,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(veiculos.router)
app.include_router(catalogo.router)
app.include_router(ordens_servico.router)

"""
Router de Clientes (RF01 — Gerenciamento de Clientes).

Responsável pela Sprint 1: Leonardo Lotério de Lima
(ver Tabela "Sprint 1" em docs/academic/documentacao-mvp1.tex, Seção 2.6).

Este arquivo é só o esqueleto: o model `Cliente` (app/models/cliente.py) e a
tabela `clientes` já existem via Alembic (Fase 1). Falta implementar:

  TODO (18-20/08): schemas Pydantic de request/response em
      app/schemas/cliente.py (ex.: ClienteCreate, ClienteUpdate, ClienteOut)
      e o CRUD básico (POST, GET lista, GET por id).
  TODO (21-23/08): validação de CPF/CNPJ (formato + dígito verificador) e
      busca por nome ou documento (`GET /clientes?busca=...`).
  TODO (24-26/08): trocar qualquer dado de teste local pelo PostgreSQL real
      subido pela Fase 1; conferir manualmente pelo Swagger em /docs.

Lembre de registrar este router em app/main.py assim que os endpoints
estiverem prontos (já está registrado — é só preencher as funções abaixo).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("")
def listar_clientes(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    """TODO (RF01): retornar a lista de clientes, com busca opcional por nome/documento."""
    raise NotImplementedError("Implementar em Sprint 1 — responsável: Leonardo")

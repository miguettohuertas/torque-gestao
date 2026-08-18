"""
Router de Veículos (RF02 — Cadastro de Veículos).

Responsável pela Sprint 1: Lucas Honorato dos Santos
(ver Tabela "Sprint 1" em docs/academic/documentacao-mvp1.tex, Seção 2.6).

Este arquivo é só o esqueleto: o model `Veiculo` (app/models/veiculo.py) e a
tabela `veiculos` já existem via Alembic (Fase 1). Falta implementar:

  TODO (18-20/08): schemas Pydantic de request/response em
      app/schemas/veiculo.py (ex.: VeiculoCreate, VeiculoOut), acompanhando
      a estrutura de Cliente que o Leonardo está definindo em paralelo.
  TODO (21-23/08): CRUD de veículos vinculado a um cliente existente
      (`cliente_id`) e validação de placa (Mercosul: ABC1D23, e antiga:
      AAA-9999 — ver requisito de domínio no relatório do PAC V).
  TODO (24-26/08): trocar qualquer dado de teste local pelo PostgreSQL real
      subido pela Fase 1; conferir manualmente pelo Swagger em /docs.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db

router = APIRouter(prefix="/veiculos", tags=["veículos"])


@router.get("")
def listar_veiculos(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    """TODO (RF02): retornar a lista de veículos, com filtro opcional por cliente_id."""
    raise NotImplementedError("Implementar em Sprint 1 — responsável: Lucas")

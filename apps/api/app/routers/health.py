"""Endpoint de saúde — usado para confirmar que a API e o banco estão de pé."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(tags=["infra"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """
    Verifica se a API está rodando e se a conexão com o PostgreSQL está OK.
    Primeiro endpoint a testar depois de `docker compose up` (Fase 1).
    """
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}

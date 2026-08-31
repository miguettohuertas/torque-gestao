from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models.catalogo_peca import CatalogoPeca
from app.models.catalogo_servico import CatalogoServico
from app.models.usuario import ROLE_ADMIN, ROLE_MECANICO
from app.schemas.catalogo import (
    CatalogoPecaCreate,
    CatalogoPecaOut,
    CatalogoServicoCreate,
    CatalogoServicoOut,
)

router = APIRouter(prefix="/catalogo", tags=["catálogo"])

_equipe_oficina = require_role(ROLE_ADMIN, ROLE_MECANICO)
_apenas_admin = require_role(ROLE_ADMIN)


def _buscar_servico_ou_404(servico_id: str, db: Session) -> CatalogoServico:
    servico = db.get(CatalogoServico, servico_id)
    if servico is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Serviço de catálogo não encontrado."
        )
    return servico


def _buscar_peca_ou_404(peca_id: str, db: Session) -> CatalogoPeca:
    peca = db.get(CatalogoPeca, peca_id)
    if peca is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Peça de catálogo não encontrada."
        )
    return peca


@router.get("/servicos", response_model=list[CatalogoServicoOut])
def listar_servicos(db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)):
    return db.scalars(select(CatalogoServico).order_by(CatalogoServico.nome)).all()


@router.post("/servicos", response_model=CatalogoServicoOut, status_code=status.HTTP_201_CREATED)
def criar_servico(
    dados: CatalogoServicoCreate, db: Session = Depends(get_db), _usuario=Depends(_apenas_admin)
):
    servico = CatalogoServico(**dados.model_dump())
    db.add(servico)
    db.commit()
    db.refresh(servico)
    return servico


@router.put("/servicos/{servico_id}", response_model=CatalogoServicoOut)
def atualizar_servico(
    servico_id: str,
    dados: CatalogoServicoCreate,
    db: Session = Depends(get_db),
    _usuario=Depends(_apenas_admin),
):
    servico = _buscar_servico_ou_404(servico_id, db)
    for campo, valor in dados.model_dump().items():
        setattr(servico, campo, valor)
    db.commit()
    db.refresh(servico)
    return servico


@router.delete("/servicos/{servico_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_servico(
    servico_id: str, db: Session = Depends(get_db), _usuario=Depends(_apenas_admin)
):
    servico = _buscar_servico_ou_404(servico_id, db)
    db.delete(servico)
    db.commit()


@router.get("/pecas", response_model=list[CatalogoPecaOut])
def listar_pecas(db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)):
    return db.scalars(select(CatalogoPeca).order_by(CatalogoPeca.nome)).all()


@router.post("/pecas", response_model=CatalogoPecaOut, status_code=status.HTTP_201_CREATED)
def criar_peca(
    dados: CatalogoPecaCreate, db: Session = Depends(get_db), _usuario=Depends(_apenas_admin)
):
    peca = CatalogoPeca(**dados.model_dump())
    db.add(peca)
    db.commit()
    db.refresh(peca)
    return peca


@router.put("/pecas/{peca_id}", response_model=CatalogoPecaOut)
def atualizar_peca(
    peca_id: str,
    dados: CatalogoPecaCreate,
    db: Session = Depends(get_db),
    _usuario=Depends(_apenas_admin),
):
    peca = _buscar_peca_ou_404(peca_id, db)
    for campo, valor in dados.model_dump().items():
        setattr(peca, campo, valor)
    db.commit()
    db.refresh(peca)
    return peca


@router.delete("/pecas/{peca_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_peca(peca_id: str, db: Session = Depends(get_db), _usuario=Depends(_apenas_admin)):
    peca = _buscar_peca_ou_404(peca_id, db)
    db.delete(peca)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models.cliente import Cliente
from app.models.usuario import ROLE_ADMIN, ROLE_MECANICO
from app.models.veiculo import Veiculo
from app.schemas.veiculo import VeiculoCreate, VeiculoOut, VeiculoUpdate

router = APIRouter(prefix="/veiculos", tags=["veículos"])

_equipe_oficina = require_role(ROLE_ADMIN, ROLE_MECANICO)

_PLACA_EM_USO = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Já existe um veículo cadastrado com esta placa.",
)
_CLIENTE_NAO_ENCONTRADO = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Cliente não encontrado para vincular o veículo.",
)


def _buscar_ou_404(veiculo_id: str, db: Session) -> Veiculo:
    veiculo = db.get(Veiculo, veiculo_id)
    if veiculo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado.")
    return veiculo


def _validar_cliente_existe(cliente_id: str, db: Session) -> None:
    if db.get(Cliente, cliente_id) is None:
        raise _CLIENTE_NAO_ENCONTRADO


@router.get("", response_model=list[VeiculoOut])
def listar_veiculos(
    cliente_id: str | None = None,
    db: Session = Depends(get_db),
    _usuario=Depends(_equipe_oficina),
):
    query = select(Veiculo).order_by(Veiculo.plate)
    if cliente_id:
        query = query.where(Veiculo.cliente_id == cliente_id)
    return db.scalars(query).all()


@router.get("/{veiculo_id}", response_model=VeiculoOut)
def obter_veiculo(
    veiculo_id: str, db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)
):
    return _buscar_ou_404(veiculo_id, db)


@router.post("", response_model=VeiculoOut, status_code=status.HTTP_201_CREATED)
def criar_veiculo(
    dados: VeiculoCreate, db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)
):
    _validar_cliente_existe(dados.cliente_id, db)

    veiculo = Veiculo(**dados.model_dump())
    db.add(veiculo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _PLACA_EM_USO
    db.refresh(veiculo)
    return veiculo


@router.put("/{veiculo_id}", response_model=VeiculoOut)
def atualizar_veiculo(
    veiculo_id: str,
    dados: VeiculoUpdate,
    db: Session = Depends(get_db),
    _usuario=Depends(_equipe_oficina),
):
    veiculo = _buscar_ou_404(veiculo_id, db)
    _validar_cliente_existe(dados.cliente_id, db)

    for campo, valor in dados.model_dump().items():
        setattr(veiculo, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _PLACA_EM_USO
    db.refresh(veiculo)
    return veiculo


@router.delete("/{veiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_veiculo(
    veiculo_id: str, db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)
):
    veiculo = _buscar_ou_404(veiculo_id, db)
    db.delete(veiculo)
    db.commit()

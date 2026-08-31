from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models.cliente import Cliente
from app.models.usuario import ROLE_ADMIN, ROLE_MECANICO
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["clientes"])

_equipe_oficina = require_role(ROLE_ADMIN, ROLE_MECANICO)

_CONFLITO_CADASTRO = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Já existe um cliente com este e-mail ou CPF/CNPJ.",
)


def _buscar_ou_404(cliente_id: str, db: Session) -> Cliente:
    cliente = db.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    return cliente


@router.get("", response_model=list[ClienteOut])
def listar_clientes(
    busca: str | None = None,
    db: Session = Depends(get_db),
    _usuario=Depends(_equipe_oficina),
):
    query = select(Cliente).order_by(Cliente.name)
    if busca:
        termo = f"%{busca}%"
        query = query.where(
            or_(
                Cliente.name.ilike(termo),
                Cliente.email.ilike(termo),
                Cliente.cpf.ilike(termo),
            )
        )
    return db.scalars(query).all()


@router.get("/{cliente_id}", response_model=ClienteOut)
def obter_cliente(
    cliente_id: str, db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)
):
    return _buscar_ou_404(cliente_id, db)


@router.post("", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def criar_cliente(
    dados: ClienteCreate, db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)
):
    cliente = Cliente(**dados.model_dump())
    db.add(cliente)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _CONFLITO_CADASTRO
    db.refresh(cliente)
    return cliente


@router.put("/{cliente_id}", response_model=ClienteOut)
def atualizar_cliente(
    cliente_id: str,
    dados: ClienteUpdate,
    db: Session = Depends(get_db),
    _usuario=Depends(_equipe_oficina),
):
    cliente = _buscar_ou_404(cliente_id, db)
    for campo, valor in dados.model_dump().items():
        setattr(cliente, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _CONFLITO_CADASTRO
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_cliente(
    cliente_id: str, db: Session = Depends(get_db), _usuario=Depends(_equipe_oficina)
):
    cliente = _buscar_ou_404(cliente_id, db)
    db.delete(cliente)
    db.commit()

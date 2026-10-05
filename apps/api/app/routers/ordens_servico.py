from datetime import date
from decimal import Decimal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.deps import (
    leitura_operacional,
    require_role,
    restringir_cliente,
    verificar_proprietario,
)
from app.database import get_db
from app.models.catalogo_peca import CatalogoPeca
from app.models.catalogo_servico import CatalogoServico
from app.models.cliente import Cliente
from app.models.historico_status import HistoricoStatus
from app.models.item_os import TIPO_MAO_DE_OBRA, ItemOS
from app.models.ordem_servico import FLUXO_STATUS_OS, STATUS_AGUARDANDO_DIAGNOSTICO, OrdemServico
from app.models.usuario import ROLE_ADMIN, ROLE_MECANICO, Usuario
from app.models.veiculo import Veiculo
from app.schemas.ordem_servico import (
    HistoricoStatusOut,
    ItemOSCreate,
    OrdemServicoCreate,
    OrdemServicoOut,
    StatusUpdate,
)
from app.services import telegram

router = APIRouter(prefix="/ordens-servico", tags=["ordens de serviço"])

_equipe_oficina = require_role(ROLE_ADMIN, ROLE_MECANICO)


def _resolver_item(dados: ItemOSCreate, db: Session) -> ItemOS:
    if dados.tipo == TIPO_MAO_DE_OBRA:
        catalogo = db.get(CatalogoServico, dados.catalogo_id)
    else:
        catalogo = db.get(CatalogoPeca, dados.catalogo_id)

    if catalogo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item de catálogo não encontrado: {dados.catalogo_id}.",
        )

    return ItemOS(
        catalogo_id=catalogo.id,
        tipo=dados.tipo,
        nome=catalogo.nome,
        quantidade=dados.quantidade,
        valor_unitario=catalogo.preco,
    )


def _serializar_os(ordem: OrdemServico) -> OrdemServicoOut:
    itens = [
        {
            "id": item.id,
            "tipo": item.tipo,
            "catalogo_id": item.catalogo_id,
            "nome": item.nome,
            "quantidade": item.quantidade,
            "valor_unitario": item.valor_unitario,
            "subtotal": item.valor_unitario * item.quantidade,
        }
        for item in ordem.itens
    ]
    total = sum((item["subtotal"] for item in itens), Decimal("0"))
    return OrdemServicoOut(
        id=ordem.id,
        cliente_id=ordem.cliente_id,
        veiculo_id=ordem.veiculo_id,
        mecanico_id=ordem.mecanico_id,
        status=ordem.status,
        data_abertura=ordem.data_abertura,
        data_previsao=ordem.data_previsao,
        itens=itens,
        orcamento_total=total,
    )


def _buscar_ou_404(os_id: str, db: Session) -> OrdemServico:
    ordem = db.get(OrdemServico, os_id)
    if ordem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de serviço não encontrada."
        )
    return ordem


def _agendar_notificacao(background: BackgroundTasks, ordem: OrdemServico) -> None:
    """RF07: avisa o cliente no Telegram depois da resposta, sem afetar a requisição."""
    aviso = telegram.preparar_notificacao_status(ordem)
    if aviso:
        background.add_task(telegram.enviar_mensagem, *aviso)


@router.post("", response_model=OrdemServicoOut, status_code=status.HTTP_201_CREATED)
def criar_ordem_servico(
    dados: OrdemServicoCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(_equipe_oficina),
):
    if db.get(Cliente, dados.cliente_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

    veiculo = db.get(Veiculo, dados.veiculo_id)
    if veiculo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado.")
    if veiculo.cliente_id != dados.cliente_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O veículo informado não pertence ao cliente informado.",
        )

    if dados.mecanico_id is not None:
        mecanico = db.get(Usuario, dados.mecanico_id)
        if mecanico is None or mecanico.role != ROLE_MECANICO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="mecanico_id deve ser um usuário existente com perfil Mecânico.",
            )

    ordem = OrdemServico(
        cliente_id=dados.cliente_id,
        veiculo_id=dados.veiculo_id,
        mecanico_id=dados.mecanico_id,
        status=STATUS_AGUARDANDO_DIAGNOSTICO,
        data_abertura=date.today(),
        data_previsao=dados.data_previsao,
    )
    ordem.itens = [_resolver_item(item, db) for item in dados.itens]
    db.add(ordem)
    db.flush()

    db.add(
        HistoricoStatus(
            os_id=ordem.id, usuario_id=usuario.id, status=ordem.status, data=date.today()
        )
    )
    db.commit()
    db.refresh(ordem)
    _agendar_notificacao(background, ordem)
    return _serializar_os(ordem)


@router.get("", response_model=list[OrdemServicoOut])
def listar_ordens_servico(
    cliente_id: str | None = None,
    veiculo_id: str | None = None,
    status_atual: str | None = None,
    db: Session = Depends(get_db),
    _usuario=Depends(leitura_operacional),
):
    query = select(OrdemServico).order_by(OrdemServico.data_abertura.desc())
    if cliente_id:
        query = query.where(OrdemServico.cliente_id == cliente_id)
    if veiculo_id:
        query = query.where(OrdemServico.veiculo_id == veiculo_id)
    if status_atual:
        query = query.where(OrdemServico.status == status_atual)
    query = restringir_cliente(query, OrdemServico.cliente_id, _usuario)
    return [_serializar_os(ordem) for ordem in db.scalars(query).all()]


@router.get("/{os_id}", response_model=OrdemServicoOut)
def obter_ordem_servico(
    os_id: str, db: Session = Depends(get_db), _usuario=Depends(leitura_operacional)
):
    ordem = _buscar_ou_404(os_id, db)
    verificar_proprietario(ordem.cliente_id, _usuario)
    return _serializar_os(ordem)


@router.patch("/{os_id}/status", response_model=OrdemServicoOut)
def atualizar_status(
    os_id: str,
    dados: StatusUpdate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(_equipe_oficina),
):
    ordem = _buscar_ou_404(os_id, db)

    indice_atual = FLUXO_STATUS_OS.index(ordem.status)
    indice_novo = FLUXO_STATUS_OS.index(dados.status)
    if indice_novo != indice_atual + 1:
        if indice_atual + 1 >= len(FLUXO_STATUS_OS):
            detail = f"A OS já está no status final ('{ordem.status}')."
        else:
            detail = (
                f"Transição de status inválida: de '{ordem.status}' só é possível avançar "
                f"para '{FLUXO_STATUS_OS[indice_atual + 1]}'."
            )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)

    resultado = db.execute(
        update(OrdemServico)
        .where(OrdemServico.id == os_id, OrdemServico.status == ordem.status)
        .values(status=dados.status)
        .execution_options(synchronize_session=False)
    )
    if resultado.rowcount != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="A OS foi atualizada. Recarregue e tente novamente.")
    db.add(
        HistoricoStatus(
            os_id=ordem.id, usuario_id=usuario.id, status=dados.status, data=date.today()
        )
    )
    db.commit()
    db.refresh(ordem)
    _agendar_notificacao(background, ordem)
    return _serializar_os(ordem)


@router.get("/{os_id}/historico", response_model=list[HistoricoStatusOut])
def listar_historico(
    os_id: str, db: Session = Depends(get_db), _usuario=Depends(leitura_operacional)
):
    ordem = _buscar_ou_404(os_id, db)
    verificar_proprietario(ordem.cliente_id, _usuario)
    query = (
        select(HistoricoStatus).where(HistoricoStatus.os_id == os_id).order_by(HistoricoStatus.data)
    )
    return sorted(db.scalars(query).all(), key=lambda h: FLUXO_STATUS_OS.index(h.status))

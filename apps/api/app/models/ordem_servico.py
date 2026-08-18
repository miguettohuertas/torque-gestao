"""
Model da entidade ORDEM_SERVICO (RF03 — Emissão de OS, RF04 — Acompanhamento
de Status).

O fluxo de estados válido (RF04) é: Aguardando Diagnóstico -> Em Execução ->
Aguardando Peças -> Finalizada -> Entregue. A validação da transição de
estado é responsabilidade da camada de serviço/router (Fase 3), não do
model — aqui o campo `status` só guarda o valor atual.
"""
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import generate_uuid

if TYPE_CHECKING:
    from app.models.cliente import Cliente
    from app.models.historico_status import HistoricoStatus
    from app.models.item_os import ItemOS
    from app.models.veiculo import Veiculo

STATUS_AGUARDANDO_DIAGNOSTICO = "aguardando_diagnostico"
STATUS_EM_EXECUCAO = "em_execucao"
STATUS_AGUARDANDO_PECAS = "aguardando_pecas"
STATUS_FINALIZADA = "finalizada"
STATUS_ENTREGUE = "entregue"

# Ordem oficial do fluxo de estados (RF04) — usada pela Fase 3 para validar
# transições (não permitir voltar um estado, pular etapas, etc.).
FLUXO_STATUS_OS = (
    STATUS_AGUARDANDO_DIAGNOSTICO,
    STATUS_EM_EXECUCAO,
    STATUS_AGUARDANDO_PECAS,
    STATUS_FINALIZADA,
    STATUS_ENTREGUE,
)


class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    cliente_id: Mapped[str] = mapped_column(String, ForeignKey("clientes.id"), nullable=False)
    veiculo_id: Mapped[str] = mapped_column(String, ForeignKey("veiculos.id"), nullable=False)
    mecanico_id: Mapped[str] = mapped_column(
        String, ForeignKey("usuarios.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=STATUS_AGUARDANDO_DIAGNOSTICO
    )
    data_abertura: Mapped[date] = mapped_column(Date, nullable=False)
    data_previsao: Mapped[date] = mapped_column(Date, nullable=True)

    cliente: Mapped["Cliente"] = relationship(back_populates="ordens_servico")
    veiculo: Mapped["Veiculo"] = relationship(back_populates="ordens_servico")
    itens: Mapped[list["ItemOS"]] = relationship(
        back_populates="ordem_servico", cascade="all, delete-orphan"
    )
    historico: Mapped[list["HistoricoStatus"]] = relationship(
        back_populates="ordem_servico", cascade="all, delete-orphan"
    )

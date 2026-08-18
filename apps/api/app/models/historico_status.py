"""
Model da entidade HISTORICO_STATUS (RF04 — registro de cada transição de
status de uma OS, usado no portal do cliente e no histórico do veículo).
"""
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import generate_uuid


class HistoricoStatus(Base):
    __tablename__ = "historico_status"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    os_id: Mapped[str] = mapped_column(
        String, ForeignKey("ordens_servico.id"), nullable=False
    )
    usuario_id: Mapped[str] = mapped_column(
        String, ForeignKey("usuarios.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    data: Mapped[date] = mapped_column(Date, nullable=False)

    ordem_servico: Mapped["OrdemServico"] = relationship(back_populates="historico")

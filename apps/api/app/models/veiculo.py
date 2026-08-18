"""
Model da entidade VEICULO (RF02 — Cadastro de Veículos).

A validação do formato da placa (Mercosul ou padrão antigo — requisito de
domínio, ver Seção 4.5.2.3 de docs/academic/archives/reference.tex) fica na
camada de schema/Pydantic, não no banco.
"""
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import generate_uuid

if TYPE_CHECKING:
    from app.models.cliente import Cliente
    from app.models.ordem_servico import OrdemServico


class Veiculo(Base):
    __tablename__ = "veiculos"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    cliente_id: Mapped[str] = mapped_column(
        String, ForeignKey("clientes.id"), nullable=False
    )
    plate: Mapped[str] = mapped_column(String(8), nullable=False, unique=True)
    make: Mapped[str] = mapped_column(String(60), nullable=False)
    model: Mapped[str] = mapped_column(String(60), nullable=False)
    year: Mapped[str] = mapped_column(String(4), nullable=True)

    cliente: Mapped["Cliente"] = relationship(back_populates="veiculos")
    ordens_servico: Mapped[list["OrdemServico"]] = relationship(back_populates="veiculo")

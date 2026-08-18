"""
Model da entidade ITEM_OS (RF03 — separação obrigatória de mão de obra e
peças na composição do orçamento).

`catalogo_id` referencia livremente um registro de CATALOGO_SERVICO ou
CATALOGO_PECA dependendo de `tipo` ("mao_obra" ou "peca") — por isso não é
uma ForeignKey de banco (o catálogo de origem varia por tipo); a
consistência é validada na camada de serviço da Fase 3.
"""
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import generate_uuid

if TYPE_CHECKING:
    from app.models.ordem_servico import OrdemServico

TIPO_MAO_DE_OBRA = "mao_obra"
TIPO_PECA = "peca"


class ItemOS(Base):
    __tablename__ = "itens_os"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    os_id: Mapped[str] = mapped_column(
        String, ForeignKey("ordens_servico.id"), nullable=False
    )
    catalogo_id: Mapped[str] = mapped_column(String, nullable=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # mao_obra | peca
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    valor_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    ordem_servico: Mapped["OrdemServico"] = relationship(back_populates="itens")

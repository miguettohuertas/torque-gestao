"""Model da entidade CATALOGO_SERVICO (RF05 — Catálogo de Serviços e Peças)."""
from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import generate_uuid


class CatalogoServico(Base):
    __tablename__ = "catalogo_servicos"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    categoria: Mapped[str] = mapped_column(String(60), nullable=True)
    preco: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

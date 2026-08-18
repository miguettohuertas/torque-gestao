"""
Model da entidade CLIENTE (RF01 — Gerenciamento de Clientes).

Espelha a entidade CLIENTE definida em docs/diagramas/modelo-er.md, com o
campo cpf usado tanto para CPF quanto CNPJ (validação de formato fica na
camada de schema/Pydantic, não no banco).
"""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import generate_uuid


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    cpf: Mapped[str] = mapped_column(String(18), nullable=False, unique=True)

    veiculos: Mapped[list["Veiculo"]] = relationship(
        back_populates="cliente", cascade="all, delete-orphan"
    )
    ordens_servico: Mapped[list["OrdemServico"]] = relationship(back_populates="cliente")

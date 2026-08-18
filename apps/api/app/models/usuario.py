"""
Model da entidade USUARIO (RF06 — Autenticação e Controle de Acesso).

Nota: o modelo ER original (docs/diagramas/modelo-er.md), herdado do
protótipo mockado, não tem campo de senha porque o login do protótipo nunca
validou credenciais de verdade. Para a Sprint 1 este model adiciona
`password_hash` (Bcrypt) e `role`, que já existia. Se este schema for
aceito, `modelo-er.md` deve ser atualizado para refletir esse campo,
conforme previsto nos entregáveis técnicos do MVP 2.
"""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import generate_uuid

# Perfis de acesso do sistema (Admin, Mecânico, Cliente) — ver README.md
# e report.tex, Seção "Perfis de acesso do sistema".
ROLE_ADMIN = "admin"
ROLE_MECANICO = "mecanico"
ROLE_CLIENTE = "cliente"
VALID_ROLES = (ROLE_ADMIN, ROLE_MECANICO, ROLE_CLIENTE)


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

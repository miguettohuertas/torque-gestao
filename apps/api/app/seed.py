"""
Popula o banco com um usuário Admin inicial, para que a equipe consiga
testar o login (RF06) assim que a Fase 1 estiver de pé — ainda não existe
endpoint de cadastro de usuário nesta Sprint 1.

Uso (com o container da API rodando):

    docker compose exec api python -m app.seed

Ou localmente, com o ambiente virtual ativado e a variável DATABASE_URL
apontando para o banco certo:

    python -m app.seed
"""
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.catalogo_peca import CatalogoPeca
from app.models.catalogo_servico import CatalogoServico
from app.models.usuario import ROLE_ADMIN, Usuario

ADMIN_EMAIL = "admin@torquegestao.com.br"
ADMIN_SENHA_INICIAL = "torque123"  # trocar no primeiro login em produção

SERVICOS_INICIAIS = [
    {"nome": "Troca de óleo", "categoria": "Manutenção", "preco": "120.00"},
    {"nome": "Alinhamento e balanceamento", "categoria": "Manutenção", "preco": "150.00"},
    {"nome": "Revisão de freios", "categoria": "Freios", "preco": "180.00"},
]

PECAS_INICIAIS = [
    {"nome": "Filtro de óleo", "marca": "Bosch", "preco": "35.50", "estoque": 20},
    {"nome": "Pastilha de freio (jogo)", "marca": "Fras-le", "preco": "89.90", "estoque": 15},
    {"nome": "Óleo de motor 5W30 (litro)", "marca": "Mobil", "preco": "42.00", "estoque": 50},
]


def seed_admin() -> None:
    db = SessionLocal()
    try:
        existente = db.scalar(select(Usuario).where(Usuario.email == ADMIN_EMAIL))
        if existente:
            print(f"Usuário admin já existe ({ADMIN_EMAIL}); nada a fazer.")
            return

        admin = Usuario(
            name="Administrador Torque Gestão",
            email=ADMIN_EMAIL,
            role=ROLE_ADMIN,
            password_hash=hash_password(ADMIN_SENHA_INICIAL),
        )
        db.add(admin)
        db.commit()
        print(f"Usuário admin criado: {ADMIN_EMAIL} / senha inicial: {ADMIN_SENHA_INICIAL}")
    finally:
        db.close()


def seed_catalogo() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(CatalogoServico)) or db.scalar(select(CatalogoPeca)):
            print("Catálogo já tem itens; nada a fazer.")
            return

        db.add_all(CatalogoServico(**dados) for dados in SERVICOS_INICIAIS)
        db.add_all(CatalogoPeca(**dados) for dados in PECAS_INICIAIS)
        db.commit()
        print(f"Catálogo inicial criado: {len(SERVICOS_INICIAIS)} serviços, {len(PECAS_INICIAIS)} peças.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
    seed_catalogo()

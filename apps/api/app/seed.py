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
from app.models.usuario import ROLE_ADMIN, Usuario

ADMIN_EMAIL = "admin@torquegestao.com.br"
ADMIN_SENHA_INICIAL = "torque123"  # trocar no primeiro login em produção


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


if __name__ == "__main__":
    seed_admin()

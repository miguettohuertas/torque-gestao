"""
Cria dados de demonstração para testar os três perfis em ambiente local:
um mecânico, um cliente com acesso ao portal e um veículo desse cliente.
Pode ser executado várias vezes. Recusa rodar em produção.

Uso (depois de `python -m app.seed`):

    docker compose exec api python -m app.seed_demo
"""
from sqlalchemy import select

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.cliente import Cliente
from app.models.usuario import ROLE_CLIENTE, ROLE_MECANICO, Usuario
from app.models.veiculo import Veiculo

SENHA_DEMO = "torque123"
MECANICO_EMAIL = "mecanico@torquegestao.com.br"
CLIENTE_EMAIL = "cliente@torquegestao.com.br"


def seed_demo() -> None:
    if settings.ENVIRONMENT == "production":
        raise SystemExit("Dados de demonstração não devem ser criados em produção.")

    with SessionLocal() as db:
        if not db.scalar(select(Usuario).where(Usuario.email == MECANICO_EMAIL)):
            db.add(
                Usuario(
                    name="Mecânico Teste",
                    email=MECANICO_EMAIL,
                    role=ROLE_MECANICO,
                    password_hash=hash_password(SENHA_DEMO),
                )
            )

        cliente = db.scalar(select(Cliente).where(Cliente.email == CLIENTE_EMAIL))
        if cliente is None:
            cliente = Cliente(
                name="Cliente Teste", email=CLIENTE_EMAIL, phone="(47) 99999-0000", cpf="11144477735"
            )
            db.add(cliente)
            db.flush()

        if not db.scalar(select(Usuario).where(Usuario.email == CLIENTE_EMAIL)):
            db.add(
                Usuario(
                    name=cliente.name,
                    email=cliente.email,
                    role=ROLE_CLIENTE,
                    cliente_id=cliente.id,
                    password_hash=hash_password(SENHA_DEMO),
                )
            )

        if not db.scalar(select(Veiculo).where(Veiculo.plate == "ABC1D23")):
            db.add(
                Veiculo(cliente_id=cliente.id, plate="ABC1D23", make="Fiat", model="Uno", year="2018")
            )

        db.commit()
        print(f"Dados de demonstração prontos (senha de todos: {SENHA_DEMO}).")


if __name__ == "__main__":
    seed_demo()

"""API real de teste: SQLite temporário ou schema PostgreSQL exclusivo da execução."""
import os
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@contextmanager
def isolated_database():
    postgres_url = os.environ.get("TORQUE_E2E_POSTGRES_URL")
    if not postgres_url:
        with tempfile.TemporaryDirectory(prefix="torque-e2e-") as directory:
            yield f"sqlite:///{directory}/test.db"
        return

    from sqlalchemy import create_engine, text
    from sqlalchemy.engine import make_url

    url = make_url(postgres_url)
    if url.get_backend_name() != "postgresql":
        raise ValueError("TORQUE_E2E_POSTGRES_URL deve apontar para PostgreSQL.")
    schema = f"torque_e2e_{uuid4().hex}"
    engine = create_engine(url, isolation_level="AUTOCOMMIT")
    with engine.connect() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    try:
        # Apenas o schema gerado é visível; migrations e seed não acessam public.
        yield url.update_query_dict({"options": f"-csearch_path={schema}"}).render_as_string(hide_password=False)
    finally:
        with engine.connect() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        engine.dispose()


def main():
    with isolated_database() as database_url:
        os.environ["DATABASE_URL"] = database_url
        os.environ["JWT_SECRET_KEY"] = "e2e-only-not-a-production-secret"
        from alembic import command
        from alembic.config import Config

        command.upgrade(Config("alembic.ini"), "head")
        from app.core.security import hash_password
        from app.database import SessionLocal, engine
        from app.models.cliente import Cliente
        from app.models.usuario import Usuario
        from app.seed import seed_admin, seed_catalogo

        seed_admin()
        seed_catalogo()
        with SessionLocal() as db:
            customer = Cliente(id="e2e-cliente", name="Cliente Portal", email="portal@example.com",
                               cpf="11144477735")
            db.add(customer)
            db.flush()
            db.add(Usuario(name="Cliente Portal", email=customer.email, role="cliente",
                           cliente_id=customer.id, password_hash=hash_password("portal123")))
            db.commit()
        import uvicorn
        try:
            uvicorn.run("app.main:app", host="127.0.0.1",
                        port=int(os.environ.get("TORQUE_E2E_API_PORT", "18000")))
        finally:
            engine.dispose()


if __name__ == "__main__":
    main()

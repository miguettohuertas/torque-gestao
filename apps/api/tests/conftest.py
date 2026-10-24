"""
Fixtures compartilhadas dos testes.

As variáveis de ambiente precisam ser definidas ANTES de qualquer `import app...`,
porque app/config.py lê `Settings()` (via env) no momento da importação.

Cada teste recebe um banco isolado, criado do zero a cada função de teste,
então a ordem dos testes nunca importa:

- Padrão: SQLite em memória — rápido, sem nenhum serviço externo.
- Com TEST_DATABASE_URL apontando para um PostgreSQL de teste (ex.:
  postgresql+psycopg2://torque:torque@localhost:5432/torque_test), a mesma
  suíte roda contra o banco usado em produção. As tabelas são criadas e
  apagadas a cada teste; NUNCA aponte para um banco com dados reais.
"""
import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.usuario import ROLE_ADMIN, ROLE_CLIENTE, ROLE_MECANICO, Usuario  # noqa: E402

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")


def _criar_engine():
    if TEST_DATABASE_URL:
        return create_engine(TEST_DATABASE_URL)
    return create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


@pytest.fixture()
def engine():
    """Engine do banco de teste com o schema criado do zero (isolamento total)."""
    test_engine = _criar_engine()
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    try:
        yield test_engine
    finally:
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


@pytest.fixture()
def session_factory(engine):
    """Fábrica de sessões ligada ao banco de teste (para código que usa SessionLocal)."""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    """TestClient da API com o banco de teste injetado via dependency override."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db_session):
    """Usuário Admin já persistido, pronto para testar login (RF06)."""
    usuario = Usuario(
        name="Admin de Teste",
        email="admin.teste@torquegestao.com.br",
        role=ROLE_ADMIN,
        password_hash=hash_password("senha123"),
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


@pytest.fixture()
def mecanico_user(db_session):
    """Usuário Mecânico já persistido, usado para testar o RBAC (perfil não-Admin)."""
    usuario = Usuario(
        name="Mecânico de Teste",
        email="mecanico.teste@torquegestao.com.br",
        role=ROLE_MECANICO,
        password_hash=hash_password("senha123"),
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


@pytest.fixture()
def cliente_user(db_session):
    usuario = Usuario(
        name="Cliente de Teste",
        email="cliente.teste@torquegestao.com.br",
        role=ROLE_CLIENTE,
        password_hash=hash_password("senha123"),
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


@pytest.fixture()
def auth_header(client):
    def _autenticar(usuario, senha: str = "senha123") -> dict[str, str]:
        response = client.post(
            "/auth/login", data={"username": usuario.email, "password": senha}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _autenticar

"""
Fixtures compartilhadas dos testes.

As variáveis de ambiente precisam ser definidas ANTES de qualquer `import app...`,
porque app/config.py lê `Settings()` (via env) no momento da importação.

Cada teste recebe um banco SQLite em memória isolado (criado do zero a cada
função de teste), então a ordem dos testes nunca importa e não há
necessidade de um PostgreSQL real rodando para a suíte passar — útil tanto
para rodar localmente quanto no CI, sem precisar de um serviço de banco.
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
from app.models.usuario import ROLE_ADMIN, Usuario  # noqa: E402


@pytest.fixture()
def db_session():
    """Banco SQLite em memória, criado do zero para cada teste (isolamento total)."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


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

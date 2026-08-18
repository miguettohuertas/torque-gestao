"""
Configuração do SQLAlchemy: engine, sessão e Base declarativa.

Todos os models (app/models/*.py) devem herdar de `Base` definida aqui,
para que o Alembic consiga enxergá-los em autogenerate (ver alembic/env.py).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe base de todos os models ORM do Torque Gestão."""


def get_db():
    """
    Dependency do FastAPI que abre uma sessão por requisição e garante
    o fechamento mesmo em caso de exceção.

    Uso em um router:
        @router.get("/clientes")
        def listar_clientes(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

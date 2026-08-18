"""
Importa todos os models para que:

1. `app.database.Base.metadata` conheça todas as tabelas (necessário para
   `alembic revision --autogenerate` detectar o schema completo).
2. As `relationship()` que referenciam outras classes por nome de string
   (ex.: Mapped["Cliente"]) consigam resolver a referência.

Sempre que um novo model for criado, ele precisa ser importado aqui.
"""
from app.models.catalogo_peca import CatalogoPeca
from app.models.catalogo_servico import CatalogoServico
from app.models.cliente import Cliente
from app.models.historico_status import HistoricoStatus
from app.models.item_os import ItemOS
from app.models.ordem_servico import OrdemServico
from app.models.usuario import Usuario
from app.models.veiculo import Veiculo

__all__ = [
    "Cliente",
    "Veiculo",
    "Usuario",
    "OrdemServico",
    "ItemOS",
    "HistoricoStatus",
    "CatalogoServico",
    "CatalogoPeca",
]

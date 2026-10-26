"""
Testes de aceitação: cada cenário dos arquivos .feature verifica um critério
de aceite dos requisitos RF01–RF07, escrito em português na linguagem do
negócio. Rode só estes com:  pytest -m aceitacao
"""
import pytest
from pytest_bdd import given, scenarios

from app.config import settings

pytestmark = pytest.mark.aceitacao

scenarios(
    "clientes_e_veiculos.feature",
    "ordem_de_servico.feature",
    "portal_do_cliente.feature",
    "catalogo_e_acesso.feature",
    "notificacoes_telegram.feature",
)


@given("que o Telegram do sistema está configurado")
def telegram_configurado(telegram_ativo):
    assert settings.TELEGRAM_BOT_TOKEN

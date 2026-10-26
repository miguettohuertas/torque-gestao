"""
Scripts administrativos: seed inicial (admin + catálogo) e provisionamento
de login do portal do cliente. Eles abrem a própria sessão via SessionLocal,
então os testes trocam essa fábrica pela do banco de teste.
"""
import sys

import pytest
from sqlalchemy import select

from app import provisionar_cliente, seed
from app.core.security import verify_password
from app.models.catalogo_peca import CatalogoPeca
from app.models.catalogo_servico import CatalogoServico
from app.models.cliente import Cliente
from app.models.usuario import ROLE_ADMIN, ROLE_CLIENTE, Usuario


@pytest.fixture()
def banco_de_teste(monkeypatch, session_factory):
    monkeypatch.setattr(seed, "SessionLocal", session_factory)
    monkeypatch.setattr(provisionar_cliente, "SessionLocal", session_factory)
    return session_factory


def test_seed_cria_admin_e_catalogo_uma_unica_vez(banco_de_teste, db_session):
    for _ in range(2):  # rodar de novo não pode duplicar nada (idempotente)
        seed.seed_admin()
        seed.seed_catalogo()

    admins = db_session.scalars(select(Usuario).where(Usuario.email == seed.ADMIN_EMAIL)).all()
    assert len(admins) == 1
    assert admins[0].role == ROLE_ADMIN
    assert verify_password(seed.ADMIN_SENHA_INICIAL, admins[0].password_hash)
    assert db_session.query(CatalogoServico).count() == len(seed.SERVICOS_INICIAIS)
    assert db_session.query(CatalogoPeca).count() == len(seed.PECAS_INICIAIS)


def test_seed_nao_mexe_em_catalogo_que_ja_tem_itens(banco_de_teste, db_session):
    db_session.add(CatalogoServico(nome="Serviço da oficina", preco="99.00"))
    db_session.commit()

    seed.seed_catalogo()

    assert [s.nome for s in db_session.scalars(select(CatalogoServico))] == ["Serviço da oficina"]
    assert db_session.query(CatalogoPeca).count() == 0


@pytest.fixture()
def cliente_cadastrado(db_session):
    cliente = Cliente(name="Maria Souza", email="maria@example.com", cpf="11144477735")
    db_session.add(cliente)
    db_session.commit()
    return cliente


def _rodar_provisionamento(monkeypatch, cliente_id, *senhas):
    respostas = iter(senhas)
    monkeypatch.setattr(sys, "argv", ["provisionar_cliente", cliente_id])
    monkeypatch.setattr(provisionar_cliente, "getpass", lambda _prompt: next(respostas))
    provisionar_cliente.main()


def test_provisionar_cria_login_do_portal_vinculado_ao_cadastro(
    banco_de_teste, db_session, cliente_cadastrado, monkeypatch, capsys
):
    _rodar_provisionamento(monkeypatch, cliente_cadastrado.id, "senha-forte", "senha-forte")

    usuario = db_session.scalar(select(Usuario).where(Usuario.email == "maria@example.com"))
    assert usuario.role == ROLE_CLIENTE
    assert usuario.cliente_id == cliente_cadastrado.id
    assert verify_password("senha-forte", usuario.password_hash)
    assert "Acesso ao portal criado" in capsys.readouterr().out


@pytest.mark.parametrize(
    "senhas, mensagem",
    [
        (("curta", "curta"), "ao menos 8 caracteres"),
        (("a" * 73, "a" * 73), "72 bytes"),
        (("senha-forte", "outra-senha"), "não coincidem"),
    ],
)
def test_provisionar_recusa_senha_invalida(
    banco_de_teste, db_session, cliente_cadastrado, monkeypatch, capsys, senhas, mensagem
):
    with pytest.raises(SystemExit):
        _rodar_provisionamento(monkeypatch, cliente_cadastrado.id, *senhas)

    assert mensagem in capsys.readouterr().err
    assert db_session.query(Usuario).count() == 0


def test_provisionar_cliente_inexistente_falha(banco_de_teste, monkeypatch, capsys):
    with pytest.raises(SystemExit):
        _rodar_provisionamento(monkeypatch, "nao-existe")

    assert "Cliente não encontrado" in capsys.readouterr().err


def test_provisionar_duas_vezes_nao_duplica_login(
    banco_de_teste, db_session, cliente_cadastrado, monkeypatch, capsys
):
    _rodar_provisionamento(monkeypatch, cliente_cadastrado.id, "senha-forte", "senha-forte")

    with pytest.raises(SystemExit):
        _rodar_provisionamento(monkeypatch, cliente_cadastrado.id, "senha-forte", "senha-forte")

    assert "Já existe um usuário" in capsys.readouterr().err
    assert db_session.query(Usuario).count() == 1

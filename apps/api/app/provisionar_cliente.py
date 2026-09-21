"""Cria um login do portal para um cadastro existente, sem senha em argumentos."""
import argparse
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.cliente import Cliente
from app.models.usuario import ROLE_CLIENTE, Usuario


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cliente_id")
    args = parser.parse_args()
    with SessionLocal() as db:
        cliente = db.get(Cliente, args.cliente_id)
        if not cliente:
            parser.error("Cliente não encontrado.")
        existente = db.scalar(select(Usuario).where(
            (Usuario.email == cliente.email) | (Usuario.cliente_id == cliente.id)
        ))
        if existente:
            parser.error("Já existe um usuário com este e-mail ou vínculo; nenhuma alteração feita.")
        senha = getpass("Senha do portal (mínimo 8 caracteres): ")
        if len(senha) < 8 or len(senha.encode()) > 72:
            parser.error("Use ao menos 8 caracteres e no máximo 72 bytes.")
        if senha != getpass("Confirme a senha: "):
            parser.error("As senhas não coincidem.")
        db.add(Usuario(name=cliente.name, email=cliente.email, role=ROLE_CLIENTE,
                       cliente_id=cliente.id, password_hash=hash_password(senha)))
        db.commit()
        print(f"Acesso ao portal criado para {cliente.email}.")


if __name__ == "__main__":
    main()

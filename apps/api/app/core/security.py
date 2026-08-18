"""
Utilidades de segurança para RF06 (Autenticação e Controle de Acesso).

- Hash de senha com Bcrypt (RNF01 — Segurança de Dados).
- Emissão e validação de tokens JWT (RF06 / RNF01).

Este módulo só contém funções puras de baixo nível; a lógica de negócio do
login (buscar usuário, verificar senha, montar o token) fica no router
(app/routers/auth.py).
"""
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Gera o hash Bcrypt de uma senha em texto puro."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Confere se a senha em texto puro bate com o hash armazenado."""
    return _pwd_context.verify(plain_password, password_hash)


def create_access_token(*, subject: str, role: str) -> str:
    """
    Cria um JWT contendo o id do usuário (`sub`) e o perfil (`role`), usado
    pelo RBAC em app/core/deps.py para proteger rotas por perfil
    (Admin, Mecânico, Cliente).
    """
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": subject, "role": role, "exp": expires_at}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decodifica e valida um JWT. Retorna None se o token for inválido ou tiver expirado."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

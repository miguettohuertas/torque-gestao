"""
Router de autenticação (RF06 — Autenticação e Controle de Acesso).

Implementa o login real (substituindo o `localStorage` simulado do
protótipo — ver Seção 1.2 de docs/academic/documentacao-mvp1.tex) e o
endpoint `/auth/me` para o front-end confirmar quem está logado.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import Token, UsuarioPublico

router = APIRouter(prefix="/auth", tags=["autenticação"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Autentica um usuário (Admin, Mecânico ou Cliente) e emite um JWT.

    `form_data.username` recebe o e-mail cadastrado; `form_data.password`,
    a senha em texto puro, conferida contra o hash Bcrypt salvo no banco.
    """
    usuario = db.scalar(select(Usuario).where(Usuario.email == form_data.username))

    if usuario is None or not verify_password(form_data.password, usuario.password_hash):
        # Mensagem genérica de propósito: não revela se o e-mail existe ou não.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=usuario.id, role=usuario.role)
    return Token(access_token=access_token)


@router.get("/me", response_model=UsuarioPublico)
def me(usuario_atual: Usuario = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado — usado pelo front-end após o login."""
    return usuario_atual

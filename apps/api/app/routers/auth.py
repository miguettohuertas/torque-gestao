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

from app.core.deps import get_current_user, require_role
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.models.usuario import ROLE_ADMIN, Usuario
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


@router.get("/usuarios", response_model=list[UsuarioPublico])
def listar_usuarios(
    db: Session = Depends(get_db),
    _usuario_atual: Usuario = Depends(require_role(ROLE_ADMIN)),
):
    """
    Lista todos os usuários cadastrados (Admin, Mecânico, Cliente).

    Endpoint de exemplo do RBAC (RF06, Sprint 1, 21-23/08): só o perfil Admin
    pode gerenciar usuários, então esta rota usa `require_role(ROLE_ADMIN)`
    em vez de `get_current_user` — qualquer outro perfil autenticado recebe
    403, e quem não tem token recebe 401 (barrado antes mesmo do RBAC checar
    o perfil, já que `require_role` depende de `get_current_user`).
    """
    return db.scalars(select(Usuario).order_by(Usuario.name)).all()

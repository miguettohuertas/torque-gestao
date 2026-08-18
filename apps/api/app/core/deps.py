"""
Dependencies de autenticação e RBAC (RF06), para usar em qualquer router:

    from app.core.deps import get_current_user, require_role
    from app.models.usuario import ROLE_ADMIN

    @router.get("/admin/relatorio")
    def relatorio(usuario: Usuario = Depends(require_role(ROLE_ADMIN))):
        ...

    @router.get("/os")
    def listar_os(usuario: Usuario = Depends(get_current_user)):
        # qualquer perfil autenticado pode acessar
        ...
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.usuario import Usuario

# tokenUrl aponta para o endpoint de login (RF06) — usado só para o Swagger
# montar o botão "Authorize"; a validação de fato acontece em decode_access_token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    """Resolve o usuário autenticado a partir do JWT enviado no header Authorization."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise credentials_error

    usuario = db.get(Usuario, payload["sub"])
    if usuario is None:
        raise credentials_error

    return usuario


def require_role(*allowed_roles: str):
    """
    Factory de dependency para proteger uma rota a um conjunto de perfis
    (RBAC — RF06). Exemplo: `Depends(require_role(ROLE_ADMIN, ROLE_MECANICO))`.
    """

    def _verificar(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seu perfil não tem permissão para acessar este recurso.",
            )
        return usuario

    return _verificar

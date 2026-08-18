"""
Schemas Pydantic de autenticação (RF06).

O login usa o formulário padrão OAuth2 (`OAuth2PasswordRequestForm`, campos
`username`/`password`) em vez de um schema JSON próprio, porque é o que o
botão "Authorize" do Swagger espera — deixa o RF06 testável direto pela
documentação OpenAPI (RNF06), sem precisar de Postman. O campo `username`
recebe o e-mail do usuário.
"""
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioPublico(BaseModel):
    """Representação segura do usuário (nunca inclui password_hash)."""

    id: str
    name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}

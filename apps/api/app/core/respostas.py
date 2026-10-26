"""
Respostas de erro documentadas no OpenAPI (Swagger).

O FastAPI só documenta 200/201/204 e 422 sozinho. Estes dicionários entram no
parâmetro `responses=` dos routers para que o contrato publicado em /docs
inclua também os erros que a API realmente devolve; o teste de contrato
(tests/test_contrato_api.py) falha se uma resposta não estiver documentada.
"""
from pydantic import BaseModel


class ErroOut(BaseModel):
    detail: str


def _resposta(descricao: str) -> dict:
    return {"description": descricao, "model": ErroOut}


NAO_AUTENTICADO = {401: _resposta("Token ausente, inválido ou expirado.")}
SEM_PERMISSAO = {403: _resposta("O perfil do usuário não pode acessar este recurso.")}
NAO_ENCONTRADO = {404: _resposta("Registro não encontrado.")}
CONFLITO = {409: _resposta("Conflito com o estado atual dos dados.")}
REQUISICAO_INVALIDA = {400: _resposta("Requisição inconsistente com as regras de negócio.")}
INDISPONIVEL = {503: _resposta("Integração externa não configurada.")}

# Toda rota protegida por login e perfil.
PROTEGIDA = {**NAO_AUTENTICADO, **SEM_PERMISSAO}

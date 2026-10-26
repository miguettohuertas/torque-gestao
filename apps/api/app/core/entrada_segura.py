"""
Recusa (422) qualquer entrada com o caractere nulo (U+0000).

O PostgreSQL não aceita NUL em texto: o driver lança ValueError e a API
responderia 500 a uma busca como `?busca=%00`, a um ID `/clientes/%00` ou a um
nome com "\\u0000" no JSON. O SQLite aceita, então o problema só aparece em
produção. Barrar na borda dá o mesmo resultado nos dois bancos.
"""
import json
from urllib.parse import parse_qsl, unquote_to_bytes

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

MENSAGEM = "O texto enviado contém o caractere nulo (U+0000), que não é permitido."


def _tem_nul(valor) -> bool:
    if isinstance(valor, str):
        return "\x00" in valor
    if isinstance(valor, dict):
        return any(_tem_nul(chave) or _tem_nul(item) for chave, item in valor.items())
    if isinstance(valor, (list, tuple)):
        return any(_tem_nul(item) for item in valor)
    return False


def _corpo_tem_nul(corpo: bytes, tipo: str) -> bool:
    if b"\x00" in corpo:
        return True
    if "application/json" in tipo:
        try:
            return _tem_nul(json.loads(corpo))
        except ValueError:
            return False  # JSON inválido: quem responde é a validação do FastAPI
    if "application/x-www-form-urlencoded" in tipo:
        return any(_tem_nul(par) for par in parse_qsl(corpo.decode("utf-8", "replace")))
    return False


class RejeitarCaractereNulo:
    """Middleware ASGI que olha caminho, query string e corpo (JSON ou formulário)."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        # Alguns clientes (como o TestClient) incluem a query string no raw_path.
        caminho_cru = (scope.get("raw_path") or scope["path"].encode()).split(b"?", 1)[0]
        if b"\x00" in unquote_to_bytes(caminho_cru):
            return await self._recusar("path", scope, receive, send)
        if b"\x00" in unquote_to_bytes(scope["query_string"]):
            return await self._recusar("query", scope, receive, send)

        cabecalhos = {k.lower(): v for k, v in scope["headers"]}
        tipo = cabecalhos.get(b"content-type", b"").decode("latin-1").lower()
        if scope["method"] not in ("POST", "PUT", "PATCH") or not tipo:
            return await self.app(scope, receive, send)

        mensagens: list[Message] = []
        corpo = b""
        while True:
            mensagem = await receive()
            mensagens.append(mensagem)
            corpo += mensagem.get("body", b"")
            if mensagem["type"] != "http.request" or not mensagem.get("more_body"):
                break
        if _corpo_tem_nul(corpo, tipo):
            return await self._recusar("body", scope, receive, send)

        pendentes = iter(mensagens)

        async def reenviar() -> Message:
            return next(pendentes, None) or await receive()

        await self.app(scope, reenviar, send)

    @staticmethod
    async def _recusar(onde: str, scope: Scope, receive: Receive, send: Send) -> None:
        # Mesmo formato do 422 do FastAPI, para o front e o contrato OpenAPI não se surpreenderem.
        erro = {"type": "value_error", "loc": [onde], "msg": MENSAGEM}
        resposta = JSONResponse({"detail": [erro]}, status_code=422)
        await resposta(scope, receive, send)

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.item_os import TIPO_MAO_DE_OBRA, TIPO_PECA
from app.models.ordem_servico import FLUXO_STATUS_OS

_TIPOS_VALIDOS = (TIPO_MAO_DE_OBRA, TIPO_PECA)


class ItemOSCreate(BaseModel):
    tipo: str
    catalogo_id: str
    quantidade: int = Field(default=1, ge=1)

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, value: str) -> str:
        if value not in _TIPOS_VALIDOS:
            raise ValueError(f"Tipo de item inválido — use um de: {', '.join(_TIPOS_VALIDOS)}.")
        return value


class ItemOSOut(BaseModel):
    id: str
    tipo: str
    catalogo_id: str
    nome: str
    quantidade: int
    valor_unitario: Decimal
    subtotal: Decimal


class OrdemServicoCreate(BaseModel):
    cliente_id: str
    veiculo_id: str
    mecanico_id: str | None = None
    data_previsao: date | None = None
    itens: list[ItemOSCreate] = Field(min_length=1)


class OrdemServicoOut(BaseModel):
    id: str
    cliente_id: str
    veiculo_id: str
    mecanico_id: str | None
    status: str
    data_abertura: date
    data_previsao: date | None
    itens: list[ItemOSOut]
    orcamento_total: Decimal


class StatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validar_status(cls, value: str) -> str:
        if value not in FLUXO_STATUS_OS:
            raise ValueError(f"Status inválido — use um de: {', '.join(FLUXO_STATUS_OS)}.")
        return value


class HistoricoStatusOut(BaseModel):
    id: str
    status: str
    data: date
    usuario_id: str | None

    model_config = {"from_attributes": True}

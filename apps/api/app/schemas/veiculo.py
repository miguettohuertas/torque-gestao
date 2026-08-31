import re

from pydantic import BaseModel, Field, field_validator

_PLACA_MERCOSUL_RE = re.compile(r"^[A-Z]{3}[0-9][A-Z][0-9]{2}$")
_PLACA_ANTIGA_RE = re.compile(r"^[A-Z]{3}[0-9]{4}$")


def _normalizar_placa(valor: str) -> str:
    placa = re.sub(r"[^A-Za-z0-9]", "", valor).upper()
    if _PLACA_MERCOSUL_RE.match(placa) or _PLACA_ANTIGA_RE.match(placa):
        return placa
    raise ValueError(
        "Placa inválida — use o padrão Mercosul (ABC1D23) ou o padrão antigo (ABC1234)."
    )


class VeiculoCreate(BaseModel):
    cliente_id: str
    plate: str
    make: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=60)
    year: str | None = Field(default=None, max_length=4)

    @field_validator("plate")
    @classmethod
    def validar_placa(cls, value: str) -> str:
        return _normalizar_placa(value)


class VeiculoUpdate(VeiculoCreate):
    pass


class VeiculoOut(BaseModel):
    id: str
    cliente_id: str
    plate: str
    make: str
    model: str
    year: str | None = None

    model_config = {"from_attributes": True}

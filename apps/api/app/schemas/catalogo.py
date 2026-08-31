from decimal import Decimal

from pydantic import BaseModel, Field


class CatalogoServicoCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    categoria: str | None = Field(default=None, max_length=60)
    preco: Decimal = Field(gt=0)


class CatalogoServicoOut(CatalogoServicoCreate):
    id: str

    model_config = {"from_attributes": True}


class CatalogoPecaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    marca: str | None = Field(default=None, max_length=60)
    preco: Decimal = Field(gt=0)
    estoque: int = Field(default=0, ge=0)


class CatalogoPecaOut(CatalogoPecaCreate):
    id: str

    model_config = {"from_attributes": True}

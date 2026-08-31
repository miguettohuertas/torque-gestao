import re

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validar_cpf(digitos: str) -> bool:
    if len(digitos) != 11 or digitos == digitos[0] * 11:
        return False

    for i in (9, 10):
        soma = sum(int(digitos[num]) * ((i + 1) - num) for num in range(i))
        digito_esperado = ((soma * 10) % 11) % 10
        if digito_esperado != int(digitos[i]):
            return False
    return True


def _validar_cnpj(digitos: str) -> bool:
    if len(digitos) != 14 or digitos == digitos[0] * 14:
        return False

    pesos_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    def _digito_verificador(base: str, pesos: list[int]) -> str:
        soma = sum(int(numero) * peso for numero, peso in zip(base, pesos))
        resto = soma % 11
        return "0" if resto < 2 else str(11 - resto)

    digito_1 = _digito_verificador(digitos[:12], pesos_1)
    digito_2 = _digito_verificador(digitos[:12] + digito_1, pesos_2)
    return digitos[-2:] == digito_1 + digito_2


def _normalizar_documento(valor: str) -> str:
    digitos = re.sub(r"\D", "", valor)
    if len(digitos) == 11 and _validar_cpf(digitos):
        return digitos
    if len(digitos) == 14 and _validar_cnpj(digitos):
        return digitos
    raise ValueError("CPF ou CNPJ inválido.")


class ClienteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    cpf: str

    @field_validator("cpf")
    @classmethod
    def validar_cpf_cnpj(cls, value: str) -> str:
        return _normalizar_documento(value)


class ClienteUpdate(ClienteCreate):
    pass


class ClienteOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: str | None = None
    cpf: str

    model_config = {"from_attributes": True}

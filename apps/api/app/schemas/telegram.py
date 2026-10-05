from pydantic import BaseModel


class ConviteTelegramOut(BaseModel):
    link: str
    expira_em_minutos: int

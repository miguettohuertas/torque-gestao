"""Utilidades compartilhadas pelos models."""
import uuid


def generate_uuid() -> str:
    """
    Gera um ID único em string (UUID4), consistente com o tipo `string id PK`
    usado em todas as entidades do modelo ER (docs/diagramas/modelo-er.md) e
    com os IDs mockados em apps/prototype/src/mock-data.jsx.
    """
    return str(uuid.uuid4())

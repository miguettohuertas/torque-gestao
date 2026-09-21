# Modelo Entidade-Relacionamento

> Modelo persistido em `apps/api/app/models/`, atualizado para a integração do portal (Fase 4).

```mermaid
erDiagram
    CLIENTE {
        string id     PK
        string name
        string email
        string phone
        string cpf
    }

    VEICULO {
        string id         PK
        string cliente_id FK
        string plate
        string make
        string model
        string year
    }

    USUARIO {
        string id    PK
        string name
        string email
        string role
        string password_hash
        string cliente_id FK "opcional, único"
    }

    ORDEM_SERVICO {
        string id          PK
        string cliente_id  FK
        string veiculo_id  FK
        string mecanico_id FK
        string status
        date   data_abertura
        date   data_previsao
    }

    ITEM_OS {
        string id          PK
        string os_id       FK
        string catalogo_id FK
        string tipo
        string nome
        int    quantidade
        float  valor_unitario
    }

    HISTORICO_STATUS {
        string id         PK
        string os_id      FK
        string usuario_id FK
        string status
        date   data
    }

    CATALOGO_SERVICO {
        string id       PK
        string nome
        string categoria
        float  preco
    }

    CATALOGO_PECA {
        string id    PK
        string nome
        string marca
        float  preco
        int    estoque
    }

    CLIENTE          o|--o| USUARIO          : "acesso ao portal"
    CLIENTE          ||--o{ VEICULO          : "possui"
    CLIENTE          ||--o{ ORDEM_SERVICO    : "solicita"
    VEICULO          ||--o{ ORDEM_SERVICO    : "objeto de"
    USUARIO          ||--o{ ORDEM_SERVICO    : "responsável"
    ORDEM_SERVICO    ||--o{ ITEM_OS          : "contém"
    ORDEM_SERVICO    ||--o{ HISTORICO_STATUS : "registra"
    USUARIO          ||--o{ HISTORICO_STATUS : "registra"
    CATALOGO_SERVICO ||--o{ ITEM_OS          : "referencia"
    CATALOGO_PECA    ||--o{ ITEM_OS          : "referencia"
```

O vínculo de portal é explícito: `usuarios.cliente_id` referencia `clientes.id`,
é opcional e único. Usuários sem vínculo não veem cadastros do portal. E-mail
não é usado como critério de autorização. A migration `6c4e91a2b730` adiciona
esse vínculo sem conceder acesso automaticamente a usuários existentes.

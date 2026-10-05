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
        string telegram_chat_id "opcional, único (RF07)"
        bool   notificar_telegram
    }

    TELEGRAM_VINCULO {
        string   id         PK
        string   cliente_id FK
        string   token_hash
        datetime expira_em
        datetime usado_em
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
    CLIENTE          ||--o{ TELEGRAM_VINCULO : "convida"
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

O RF07 (notificações por Telegram) adiciona `clientes.telegram_chat_id` (opcional e
único) e `clientes.notificar_telegram`, além da tabela `telegram_vinculos`, que guarda
apenas o hash do convite, com expiração e uso único. O `chat_id` só é gravado depois
que o próprio cliente abre o link do bot (opt-in). A migration é `8d2f5b7c1a94`.

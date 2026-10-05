# Deploy em produção

Publicado em **https://torquegestao.duckdns.org** (workstation própria, Docker + nginx + DuckDNS).

## Arquitetura

```
Internet → nginx do host (80/443, Let's Encrypt)
             ├─ /      → 127.0.0.1:3210  (web: nginx servindo apps/prototype)
             ├─ /api/  → 127.0.0.1:8210  (api: FastAPI, prefixo /api removido)
             └─ /config.js → define TORQUE_API_URL='/api' (mesma origem, sem CORS)
Rede Docker interna: api → db (PostgreSQL 16, sem porta publicada)
```

Tudo é publicado só em `127.0.0.1`; a única entrada pública é o nginx.

## Subir

```sh
cp deploy/.env.prod.example deploy/.env.prod && chmod 600 deploy/.env.prod
# preencha DB_PASSWORD e JWT_SECRET_KEY (openssl rand -hex 32)
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod exec api python -m app.seed
```

As migrations rodam sozinhas na subida da API. O `seed` cria o admin com a senha
`torque123`: **troque-a imediatamente**. O `seed_demo` se recusa a rodar em produção.

## DNS, certificado e nginx (exige root)

Crie o subdomínio em duckdns.org e execute `sudo bash deploy/instalar.sh`: adiciona o
domínio ao updater do DuckDNS, emite o certificado (renovação automática pelo certbot) e
ativa `deploy/nginx-torquegestao.conf`.

## Atualizar

```sh
git pull && docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
```

## Verificar

```sh
curl -s https://torquegestao.duckdns.org/api/health   # {"status":"ok","database":"connected"}
```

## Segurança

- Segredos só em `deploy/.env.prod` (fora do git). Sem credenciais no repositório.
- CORS restrito ao próprio domínio (`CORS_ORIGINS`); HSTS e demais cabeçalhos no nginx.
- Pendente: limite de tentativas de login (rate limit) e backup do volume `torque_gestao_db_data`.

## Pendências

- Rate limit de login (`limit_req`) e fechamento de `/api/docs` em produção.
- Backup agendado do Postgres, com teste de restauração.
- Deploy automático via CI/CD e monitoramento do `/api/health`.
- Telegram (RF07): preencher `TELEGRAM_BOT_TOKEN` e subir com `--profile telegram`.

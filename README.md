# Torque Gestão — Sistema de Gestão Automotiva

Sistema web de gestão para oficinas mecânicas de pequeno e médio porte, com foco em ordens de serviço, relacionamento com clientes e acompanhamento de veículos. Projeto acadêmico desenvolvido no **Centro Universitário Católica de Santa Catarina**, no curso de Engenharia de Software (PAC V/PAC VI).

> Protótipo navegável: **[torque-gestao.surge.sh](https://torque-gestao.surge.sh)**

---

## Sobre o projeto

Oficinas mecânicas costumam ter alta competência técnica, mas processos administrativos ainda muito analógicos — anotações em papel, planilhas isoladas, controle manual de ordens de serviço. Isso gera problemas recorrentes:

- **Falhas de comunicação** entre consultor técnico, mecânico e cliente;
- **Perda de informação**, com extravio de ordens de serviço físicas e histórico de manutenções;
- **Incerteza do cliente** sobre o status do seu veículo, gerando excesso de ligações para a oficina.

O Torque Gestão nasceu para resolver esse problema: uma aplicação web responsiva, otimizada para uso em tablets e dispositivos móveis dentro do ambiente da oficina, que centraliza o fluxo completo — da entrada do veículo até a entrega — com acompanhamento em tempo real tanto pela equipe interna quanto pelo cliente final.

O projeto foi desenvolvido a partir da elicitação de requisitos junto a oficinas locais da região de **Joinville/SC**.

## Objetivos

**Objetivo geral:** desenvolver uma aplicação web para gerenciar serviços, ordens de serviço e o relacionamento com clientes de oficinas automotivas de pequeno e médio porte, proporcionando maior eficiência operacional e melhoria no atendimento prestado.

**Objetivos específicos:**
- Implementar um módulo de gerenciamento de ordens de serviço (registro, acompanhamento e encerramento de atendimentos).
- Desenvolver a gestão de serviços, com cadastro e controle dos tipos de serviços oferecidos.
- Criar um sistema de relacionamento com clientes, centralizando histórico de atendimentos, dados de veículos e contatos.

## Público-alvo

| Perfil | Descrição |
|---|---|
| **Gestores/Administradores** | Proprietários de oficinas que centralizam o controle das OS, gerenciam o catálogo de serviços e acompanham métricas de produtividade. |
| **Mecânicos/Técnicos** | Profissionais que atuam diretamente no veículo, com interface de leitura rápida para atualização de diagnósticos e status. |
| **Clientes finais** | Proprietários de veículos que acompanham o progresso do serviço e consultam o histórico de manutenções pelo portal de autoatendimento. |

## Funcionalidades previstas

- Login unificado com acesso diferenciado por perfil (Admin, Mecânico, Cliente);
- Dashboard administrativo com indicadores operacionais (OS abertas, receita, entregas);
- Painel do mecânico com as OS atribuídas ao técnico autenticado;
- Gerenciamento completo de ordens de serviço, com filtros por status (Aguardando Diagnóstico → Em Execução → Aguardando Peças → Finalizada → Entregue);
- Separação de itens de mão de obra e peças aplicadas para composição de orçamento;
- Histórico completo por veículo, consultável durante o diagnóstico técnico;
- Cadastro de clientes com vinculação de múltiplos veículos por proprietário;
- Catálogo centralizado de serviços e peças com preços de referência;
- Gestão de usuários e permissões (RBAC);
- Portal do cliente com acompanhamento de OS em tempo real e histórico de manutenções.
- Notificações de status da OS ao cliente via **Telegram** (bot), em substituição a e-mail/SMS.

O detalhamento de todas as 19 telas especificadas está no relatório em [`docs/academic`](./docs/academic).

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Back-end | Python com FastAPI (APIs RESTful) |
| Front-end | JavaScript/TypeScript com React |
| Banco de dados | PostgreSQL |
| Notificações | Telegram Bot API (substitui e-mail/SMS) |
| Conteinerização / CI-CD | Docker + GitHub Actions |
| Hospedagem | Render (back-end e banco) e Vercel (front-end) |
| Versionamento | Git / GitHub |
| Protótipo | React com Babel Standalone, hospedado no Surge.sh |

## Segurança e conformidade

- Senhas com hash **Bcrypt**; tráfego sob **HTTPS/TLS**.
- Uso de ORM para sanitização automática de entradas (mitigação de SQL Injection).
- Controle de acesso via tokens **JWT** com modelo **RBAC** (Role-Based Access Control).
- Diretrizes do **OWASP Top 10** e da **LGPD** (Lei nº 13.709/2018), com consentimento registrado no cadastro e garantia de acesso, portabilidade, correção e exclusão de dados.

Principais riscos mapeados: vazamento de dados de clientes, SQL Injection em formulários de cadastro e falhas de autenticação — todos com medidas de mitigação já definidas no relatório técnico.

## Estrutura do repositório

```text
torque-gestao/
├── apps/
│   └── prototype/      # Protótipo de alta fidelidade em React (Babel standalone)
├── packages/
│   └── ui/              # Componentes de UI e definições do design system
├── docs/
│   ├── academic/        # Relatórios acadêmicos oficiais (PAC V, PAC VI)
│   ├── design-system/   # Preview dos componentes do UI Kit
│   └── specs/           # Especificações técnicas e relatórios de módulos
├── assets/
│   └── styles/          # Estilos globais e tokens de tema
└── README.md
```

> Estrutura preparada para receber `apps/web` (frontend em produção), `apps/api` (backend) e `packages/config` (configurações compartilhadas de lint/format/tsconfig) conforme o projeto avança no PAC VI.

## Fundamentos visuais

- **Cor primária:** `#1B2B4B` (azul-marinho)
- **Cor de destaque:** `#F0A500` (âmbar)
- **Tipografia:** Inter (Google Fonts)
- **Área de toque:** mínimo de 48px, pensado para o ambiente de oficina
- **Acessibilidade:** conformidade com contraste WCAG AA

## Status atual do projeto

- **Concluído:** protótipo de alta fidelidade (19 telas mapeadas).
- **Concluído:** documentação de especificação — requisitos funcionais, não funcionais, matriz de riscos e stack tecnológica.
- **Concluído:** repositório do PAC VI criado.
- **Concluído:** convite dos demais integrantes como colaboradores.
- **Concluído — RF06 (autenticação e RBAC):** back-end em FastAPI (`apps/api`), modelo de dados completo via Alembic, e autenticação real (login, hash Bcrypt, JWT) com RBAC (`require_role`) protegendo rotas por perfil (Admin/Mecânico/Cliente). Coberto por 10 testes automatizados (CI verde) e validado manualmente com um PostgreSQL real, não só o SQLite em memória dos testes.
- **Concluído — infraestrutura local:** `docker compose up` sobe API e PostgreSQL juntos com um único comando; migration do Alembic e login/RBAC testados via Swagger de ponta a ponta.
- **Concluído — RF01 a RF05:** CRUD de clientes (validação de CPF/CNPJ e busca), CRUD de veículos (validação de placa Mercosul/antiga), catálogo de serviços e peças, e emissão/acompanhamento de ordens de serviço com orçamento calculado a partir do catálogo e histórico de status — todos implementados e testados (`apps/api/tests/`). Detalhes, cronograma e responsáveis em [`docs/academic/documentacao-mvp1.tex`](docs/academic/documentacao-mvp1.tex).
- **Pendente:** revalidar `docker compose up` com RF01–RF05, integração do front-end com a API real e deploy — fases seguintes do MVP 2.

## Próximos passos

1. Revalidar `docker compose up` de ponta a ponta agora com RF01–RF05 — ver `apps/api/README.md`.
2. Integrar o front-end à API real e configurar o pipeline de deploy (Render/Vercel).

## Equipe

- Miguel Angelo Dufloth Filho
- Miguel Angel Balladares Huertas
- Leonardo Lotério de Lima
- Lucas Honorato dos Santos

## Perfis de acesso do sistema

| Papel | Nível de acesso |
|---|---|
| **Admin** | Acesso completo ao sistema, gestão e configurações. |
| **Mecânico** | Visão especializada das ordens de serviço atribuídas. |
| **Cliente** | Portal dedicado para acompanhar veículos e serviços. |

## Como visualizar o protótipo

A demonstração anterior está publicada em [torque-gestao.surge.sh](https://torque-gestao.surge.sh). Para executar a versão integrada localmente, suba a API e sirva `apps/prototype` por HTTP conforme o [guia do front-end](apps/prototype/README.md); abrir o HTML diretamente não executa a aplicação corretamente.

## Como rodar o back-end localmente

```bash
cp apps/api/.env.example apps/api/.env
docker compose up --build
docker compose exec api alembic upgrade head
docker compose exec api python -m app.seed
```

Documentação interativa da API: <http://localhost:8000/docs>. Instruções completas (incluindo execução sem Docker) em [`apps/api/README.md`](apps/api/README.md).

## Licença

**Todos os direitos reservados.** Este projeto é destinado a visualização e avaliação acadêmica. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

*Projeto desenvolvido como parte da disciplina PAC (Projeto de Aprendizagem Colaborativa) — Engenharia de Software, Católica SC, Joinville/SC.*


## Integração com a API — Fase 4

O front-end em `apps/prototype` agora autentica pela API e persiste clientes,
veículos e ordens de serviço. O portal consulta somente os dados vinculados ao
cliente autenticado. Veja [execução, acesso ao portal e testes](apps/prototype/README.md).
Aplique `alembic upgrade head` antes de usar a nova versão, inclusive em bancos
existentes. O documento do MVP continua em `docs/academic/documentacao-mvp1.tex`.

Checklist e evidências da entrega até 24/09: [Fase 4](docs/entregas/fase4-24-09.md).

# Front-end integrado — Fase 4

A página `index.html` usa a API real. Os arquivos antigos de telas e `mock-data.jsx`
ficam como referência do protótipo, mas não são carregados pela aplicação.
A interface integrada mantém as cores do projeto e funciona em desktop e celular.

## Executar

1. Na raiz do repositório, configure e suba a API:

   ```sh
   cp apps/api/.env.example apps/api/.env
   docker compose up --build -d
   docker compose exec api alembic upgrade head
   docker compose exec api python -m app.seed
   ```

   Se o `.env` já existir, preserve suas configurações. A migration nova adiciona
   o vínculo entre usuário e cliente; execute-a também em bancos já existentes.

2. Confira `apps/prototype/config.js`: `TORQUE_API_URL` deve apontar para a API
   acessível pelo navegador (padrão `http://localhost:8000`). Em um front-end HTTPS,
   configure também uma API HTTPS.

3. Na raiz, sirva o front-end:

   ```sh
   python3 -m http.server 5173 --directory apps/prototype
   ```

4. Abra `http://localhost:5173`. Login inicial:
   `admin@torquegestao.com.br` / `torque123`.
   React e Babel continuam sendo carregados pelos CDNs do protótipo; é necessária
   conexão à internet. Não abra `index.html` diretamente via `file://`.

## Validar a entrega

- Confira no painel administrativo os totais de OS, clientes e veículos, a distribuição por status e as previsões para hoje. Os cartões de status abrem a lista filtrada.
- Cadastre um cliente com CPF/CNPJ válido e um veículo vinculado.
- Emita uma OS com itens do catálogo. Mão de obra e peças aparecem separadamente;
  a API calcula o orçamento final usando os preços persistidos.
- Avance o status e consulte o histórico. Somente a próxima etapa é oferecida.
- Recarregue a página: a sessão é validada em `/auth/me` e os dados são relidos da API.
- Saia e entre como cliente para consultar veículos, OS e histórico.
- Use **Atualizar** para reler os dados. A atualização automática da tela não faz
  parte desta fase, conforme o documento do MVP.
- Avisos no Telegram (RF07): na lista de clientes (equipe) ou no painel do portal,
  use **Gerar link de vínculo**. Requer o bot configurado, conforme o
  [README da API](../api/README.md#notificações-por-telegram-rf07).

Não há criação automática de credenciais ao cadastrar um cliente. Para conceder
acesso ao portal, copie o ID exibido na listagem de clientes e execute:

```sh
docker compose exec api python -m app.provisionar_cliente ID_DO_CLIENTE
```

O comando pede e confirma a senha sem mostrá-la; cria um usuário de perfil
`cliente`, com o e-mail do cadastro e vínculo explícito `usuarios.cliente_id`.
Ele recusa sobrescrever usuários existentes. Logins antigos sem vínculo não
recebem acesso por coincidência de e-mail: precisam de associação administrativa
no banco após conferir a identidade. Não há cadastro público de usuários.

## Comportamento e contrato

- Login OAuth2 (`POST /auth/login`) e perfil confirmado por `GET /auth/me`.
- JWT em `sessionStorage`, removido no logout e em respostas 401; papéis não são
  lidos do antigo `localStorage` do protótipo.
- `GET /clientes`, `/veiculos`, `/ordens-servico` e detalhes/histórico restringem
  o cliente autenticado ao próprio cadastro no servidor, inclusive com filtros.
  Tentativas de obter registros de terceiros retornam 404.
- Escritas operacionais continuam exclusivas de Admin/Mecânico. O portal é de leitura.
- Formulários exibem erros de validação/conflito/rede e impedem envio duplicado
  enquanto a requisição está em andamento. Sucesso só aparece após a persistência.
- RF04 usa atualização condicional do status para evitar histórico duplicado se
  duas requisições tentarem avançar a mesma etapa ao mesmo tempo.
- O histórico legado armazena apenas a data; a ordenação dentro do mesmo dia usa
  a sequência oficial de estados, que não permite retorno nem repetição.
- Dashboard financeiro, configurações, gestão de usuários e outras telas simuladas
  não aparecem na navegação integrada desta entrega.

## Testes

Python 3.11, dependências de `apps/api/requirements.txt` e Node 20 ou superior.

```sh
cd apps/api
pytest -v
ruff check .
cd ../prototype
npm ci
npm test
npx playwright install chromium
npm run test:e2e
```

O Playwright inicia a API real e aplica migrations em um SQLite **temporário**, com
seed exclusivo de teste. Também inicia o servidor do front-end. As portas 18000 (API de teste) e
4173 (front-end de teste) precisam estar livres; nenhum banco da oficina é usado. Para escolher o
Python do ambiente virtual:

```sh
TORQUE_PYTHON=/caminho/absoluto/venv/bin/python npm run test:e2e
```

Cobertura adicionada: cálculo e snapshot do orçamento, preços adulterados,
quantidades inválidas, criação atômica, matriz completa de 25 transições,
histórico/autor/autorização e isolamento do portal. Testes HTTP do front-end cobrem
login, Bearer, expiração, erros 422/409, falha de rede e cancelamento. O teste de
navegador percorre login inválido/válido, cadastros, orçamento, status, persistência
após recarga, portal e sessão expirada. A suíte de regras usa SQLite. O mesmo fluxo de navegador também pode ser
executado contra PostgreSQL com isolamento dos cadastros locais, conforme abaixo.


## Portas ocupadas no ambiente local

O PostgreSQL do Torque usa a porta **5433** no computador (dentro do Docker,
continua em `db:5432`). Isso evita conflito com outros projetos que usam 5432.
Para escolher outra porta, execute `TORQUE_DB_PORT=5434 docker compose up -d`.
Se o servidor das telas informar que 5173 está ocupada, use:

```sh
python3 -m http.server 5174 --bind 127.0.0.1 --directory apps/prototype
```

Nesse caso, abra `http://127.0.0.1:5174`. A API continua em `http://localhost:8000`.


## Validar a Fase 4 com PostgreSQL

Com o banco do Docker no ar e as dependências de testes instaladas:

```sh
cd apps/prototype
TORQUE_E2E_POSTGRES_URL='postgresql+psycopg2://torque:torque@127.0.0.1:5433/torque_gestao' \
TORQUE_PYTHON=/caminho/absoluto/venv/bin/python npm run test:e2e
```

Ajuste o caminho do Python para o seu ambiente com as dependências da API.
O teste cria um schema PostgreSQL com nome aleatório, aplica as migrations,
insere os dados de teste e remove somente esse schema ao encerrar normalmente.
Os cadastros usados pela aplicação (`public`) ficam preservados. A API de teste
usa 18000, permitindo manter a aplicação local na porta 8000.
O cenário verifica dashboard, cadastro, orçamento de R$ 191,00, todas as cinco
etapas, recarga, consulta pelo portal e expiração da sessão.

O escopo desta entrega termina na Fase 4 (24/09): integração e testes.
Deploy em Render/Vercel pertence à Fase 5 (25/09 a 01/10).

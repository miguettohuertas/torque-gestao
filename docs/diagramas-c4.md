# Diagramas C4 — Torque Gestão

Diagramas de arquitetura do sistema segundo o modelo C4 (Context, Containers, Components).

---

## Nível 1 — Diagrama de Contexto

Visão macro do sistema, seus usuários e os sistemas externos com os quais interage.

```mermaid
C4Context
    title Diagrama de Contexto — Torque Gestão

    Person(admin, "Administrador", "Gerente da oficina. Cria e acompanha ordens de serviço, gerencia clientes, mecânicos e visualiza relatórios financeiros.")
    Person(mecanico, "Mecânico", "Técnico da oficina. Consulta as ordens de serviço atribuídas a si e registra o progresso dos serviços.")
    Person(cliente, "Cliente", "Proprietário do veículo. Acompanha o status do serviço e o histórico do veículo pelo portal.")

    System(torque, "Torque Gestão", "Aplicação web de gestão de oficina mecânica. Controla ordens de serviço, clientes, veículos e equipe.")

    System_Ext(cdn, "CDN (jsDelivr / unpkg)", "Fornece React 18 e Babel Standalone carregados em tempo de execução pelo navegador, sem etapa de build.")
    System_Ext(fonts, "Google Fonts", "Fornece a fonte tipográfica Inter utilizada em toda a interface.")
    System_Ext(surge, "Surge.sh", "Plataforma de hospedagem estática onde o protótipo é publicado e acessado publicamente.")

    Rel(admin, torque, "Gerencia OS, clientes e equipe", "HTTPS / Browser")
    Rel(mecanico, torque, "Consulta e atualiza tarefas", "HTTPS / Browser")
    Rel(cliente, torque, "Acompanha veículo e histórico", "HTTPS / Browser")
    Rel(torque, cdn, "Carrega React 18 e Babel em runtime", "HTTPS")
    Rel(torque, fonts, "Carrega fonte Inter", "HTTPS")
    Rel(surge, torque, "Hospeda e serve os arquivos estáticos", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow = "3", $c4BoundaryInRow = "1")
```

---

## Nível 2 — Diagrama de Containers

Decomposição interna do sistema Torque Gestão em seus principais containers (aplicações e processos executáveis).

```mermaid
C4Container
    title Diagrama de Containers — Torque Gestão

    Person(admin, "Administrador")
    Person(mecanico, "Mecânico")
    Person(cliente, "Cliente")

    System_Ext(cdn, "CDN", "React 18 + Babel Standalone")
    System_Ext(fonts, "Google Fonts", "Fonte Inter")
    System_Ext(surge, "Surge.sh", "Hospedagem estática")

    System_Boundary(torque, "Torque Gestão") {

        Container(spa, "SPA Prototype", "React 18 + Babel Standalone (Browser)", "Aplicação de página única executada inteiramente no navegador. Gerencia OS, clientes, veículos, equipe e portal do cliente. Não possui servidor — toda lógica é client-side com dados mock em memória.")

        Container(uikit, "UI Kit", "HTML estático + CSS", "Catálogo interativo dos componentes do design system. Serve como referência visual durante o desenvolvimento e validação das interfaces.")

        Container(scripts, "Scripts de Automação", "Python 3 + Playwright 1.49", "Abre o protótipo em um navegador headless, navega entre as telas e captura screenshots. Injeta as referências de imagem no relatório LaTeX.")

        Container(report, "Relatório Acadêmico", "LaTeX (pdflatex)", "Documentação formal do projeto compilada em PDF para entrega acadêmica. Inclui screenshots gerados pelos scripts de automação.")
    }

    Rel(admin, spa, "Usa", "Browser")
    Rel(mecanico, spa, "Usa", "Browser")
    Rel(cliente, spa, "Usa", "Browser")

    Rel(spa, cdn, "Carrega bibliotecas em runtime", "HTTPS")
    Rel(spa, fonts, "Carrega tipografia", "HTTPS")
    Rel(surge, spa, "Serve os arquivos estáticos", "HTTPS")

    Rel(scripts, spa, "Navega e captura screenshots", "Playwright / Chromium")
    Rel(scripts, report, "Injeta referências de imagens", "Sistema de arquivos")

    UpdateLayoutConfig($c4ShapeInRow = "3", $c4BoundaryInRow = "1")
```

---

## Nível 3 — Diagrama de Componentes

Decomposição interna do container **SPA Prototype** (`apps/prototype/`) em seus componentes JSX. Os arquivos são carregados em ordem pelo `index.html` via `<script type="text/babel">`.

```mermaid
C4Component
    title Diagrama de Componentes — SPA Prototype (apps/prototype/)

    Person(admin, "Administrador")
    Person(mecanico, "Mecânico")
    Person(cliente, "Cliente")

    System_Ext(localstorage, "localStorage", "Persiste o estado de navegação entre recarregamentos: tq_screen, tq_role, tq_page.")

    Container_Boundary(spa, "SPA Prototype") {

        Component(approuter, "App Router", "JSX — App.jsx", "Shell principal da aplicação. Lê tq_screen e tq_role do localStorage e decide qual tela renderizar. Gerencia o estado global de OS e clientes via useState e propaga handlers como props.")

        Component(login, "Tela de Login", "JSX — screens-login.jsx", "Interface de seleção de papel (Administrador, Mecânico, Cliente). Ao confirmar, chama handleLogin que atualiza tq_role e redireciona para 'app' ou 'portal'.")

        Component(admin_screen, "Painel Administrativo", "JSX — screens-admin.jsx", "Conjunto de telas do administrador: Dashboard com KPIs, lista e detalhe de OS, criação de nova OS, lista e perfil de clientes, cadastro de veículo, histórico por veículo, catálogo de serviços/peças, gestão de usuários e configurações.")

        Component(mech_screen, "Painel do Mecânico", "JSX — screens-mechanic.jsx", "Visão do mecânico: dashboard com OS atribuídas a Carlos Andrade, detalhe de OS com atualização de status e histórico de OS finalizadas. Reutiliza componentes de DetalheOS e ListaOS do painel admin.")

        Component(portal, "Portal do Cliente", "JSX — screens-customer-portal.jsx", "Portal self-service do cliente com três sub-telas: Painel (resumo de veículos), Acompanhamento de OS ativa e Histórico de serviços concluídos. Possui cabeçalho próprio (PortalHeader).")

        Component(designsystem, "Design System", "JSX — shared.jsx", "Fonte central de tokens de design (objetos COLORS, SPACING, STATUS_CONFIG, ROLE_CONFIG) e componentes base reutilizáveis: Btn, Card, Badge, Modal, Toast, Sidebar, TopBar, PortalHeader e utilitários de formatação.")

        Component(icons, "Biblioteca de Ícones", "JSX — icons.jsx", "Conjunto de ícones SVG encapsulados como componentes React (IcPlus, IcCog, IcCalendar, etc.). Carregado antes de shared.jsx pois é utilizado pelos componentes base.")

        Component(mockdata, "Dados Mock", "JSX — mock-data.jsx", "Dataset completo de demonstração: 5 clientes com veículos, 5 ordens de serviço com histórico de status, catálogo de serviços e peças, lista de usuários e configurações padrão do sistema.")
    }

    Rel(admin, approuter, "Acessa como Administrador", "Browser")
    Rel(mecanico, approuter, "Acessa como Mecânico", "Browser")
    Rel(cliente, approuter, "Acessa como Cliente", "Browser")

    Rel(approuter, localstorage, "Lê e persiste tq_screen, tq_role, tq_page", "Web Storage API")
    Rel(approuter, login, "Renderiza quando tq_screen = 'login'")
    Rel(approuter, admin_screen, "Renderiza quando tq_role = 'admin'")
    Rel(approuter, mech_screen, "Renderiza quando tq_role = 'mech'")
    Rel(approuter, portal, "Renderiza quando tq_screen = 'portal'")

    Rel(login, approuter, "Dispara handleLogin → grava tq_role e tq_screen")

    Rel(admin_screen, designsystem, "Usa componentes e tokens de design")
    Rel(mech_screen, designsystem, "Usa componentes e tokens de design")
    Rel(portal, designsystem, "Usa componentes e tokens de design")

    Rel(admin_screen, mockdata, "Lê OS, clientes, veículos, catálogo e usuários")
    Rel(mech_screen, mockdata, "Lê OS atribuídas ao mecânico")
    Rel(portal, mockdata, "Lê veículos e histórico de serviços do cliente")

    Rel(designsystem, icons, "Importa ícones SVG para uso nos componentes")

    UpdateLayoutConfig($c4ShapeInRow = "3", $c4BoundaryInRow = "1")
```

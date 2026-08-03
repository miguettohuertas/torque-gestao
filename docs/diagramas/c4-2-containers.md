# C4 Nível 2 — Diagrama de Containers

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
        Container(spa, "SPA Prototype", "React 18 / Babel / Browser", "Aplicação client-side com dados mock.")
        Container(uikit, "UI Kit", "HTML + CSS", "Catálogo de componentes do design system.")
        Container(scripts, "Scripts Python", "Python 3 + Playwright", "Captura screenshots e atualiza relatório.")
        Container(report, "Relatório LaTeX", "LaTeX / pdflatex", "Documentação acadêmica compilada em PDF.")
    }

    Rel(admin, spa, "Usa", "Browser")
    Rel(mecanico, spa, "Usa", "Browser")
    Rel(cliente, spa, "Usa", "Browser")
    Rel(spa, cdn, "Carrega bibliotecas", "HTTPS")
    Rel(spa, fonts, "Carrega tipografia", "HTTPS")
    Rel(surge, spa, "Serve arquivos", "HTTPS")
    Rel(scripts, spa, "Captura screenshots", "Playwright")
    Rel(scripts, report, "Injeta imagens", "FS")
```

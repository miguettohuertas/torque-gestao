# Diagramas — Torque Gestão

| Arquivo | Tipo | Formato | Descrição |
|---|---|---|---|
| [c4-1-contexto.md](c4-1-contexto.md) | C4 Level 1 | Mermaid | Usuários, sistema e dependências externas |
| [c4-2-containers.md](c4-2-containers.md) | C4 Level 2 | Mermaid | Containers da aplicação (SPA, scripts, relatório) |
| [c4-3-componentes.md](c4-3-componentes.md) | C4 Level 3 | Mermaid | Componentes JSX internos da SPA |
| [fluxo-processo-os.md](fluxo-processo-os.md) | Fluxograma | Mermaid | Processo completo de uma OS: abertura → entrega |
| [sequencia-abertura-os.md](sequencia-abertura-os.md) | Sequência | Mermaid | Interação entre componentes ao criar uma OS |
| [estados-os.md](estados-os.md) | Diagrama de Estados | Mermaid | Ciclo de vida de uma Ordem de Serviço |
| [modelo-er.md](modelo-er.md) | Entidade-Relacionamento | Mermaid | Modelo de dados baseado em mock-data.jsx |
| [casos-de-uso.puml](casos-de-uso.puml) | Casos de Uso | PlantUML | Capacidades de cada ator (Admin, Mecânico, Cliente) |

> `../diagramas-c4.md` é uma versão anterior consolidada — este diretório o substitui.

---

## Como visualizar

### Mermaid — todos os arquivos `.md`

**VS Code (recomendado)**
1. Instale a extensão [`bierner.markdown-mermaid`](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
2. Abra o `.md` e pressione `Ctrl+Shift+V` (preview)

**Online**
- Cole o bloco ` ```mermaid ` em [mermaid.live](https://mermaid.live) → visualiza e exporta PNG/SVG instantaneamente
- O GitHub renderiza diagramas Mermaid nativamente em arquivos `.md`

---

### PlantUML — `casos-de-uso.puml`

**VS Code**
1. Instale a extensão [`jebbs.plantuml`](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
2. Para usar sem Java local, adicione ao `settings.json` do VS Code:
   ```json
   "plantuml.server": "https://www.plantuml.com/plantuml",
   "plantuml.render": "PlantUMLServer"
   ```
3. Abra o `.puml` e pressione `Alt+D` para o preview
4. Para exportar: `Ctrl+Shift+P` → `PlantUML: Export Current File Diagrams` → PNG ou SVG

**Online**
- Cole o código em [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/)

---

### Incluir imagens exportadas no relatório LaTeX

```latex
\begin{figure}[H]
  \centering
  \includegraphics[width=0.9\textwidth]{../../assets/images/diagrams/nome.png}
  \caption{Descrição do diagrama}
  \label{fig:nome}
\end{figure}
```

# Índice de Specs — Chef Digital

Lista das specs de design em `docs/superpowers/specs/`, com a ordem recomendada de
implementação e dependências entre elas. Cada spec descreve comportamento/arquitetura
de uma feature; o plano de implementação (`docs/superpowers/plans/`) é gerado um de
cada vez, imediatamente antes de implementar aquela feature específica.

| Ordem | Spec | Depende de | Status |
|---|---|---|---|
| 1 | [Busca por Título e Ingrediente](2026-07-27-busca-ingrediente-design.md) | — | ✅ Implementado |
| 2 | [Porções Reais da Receita (`recipe.servings`)](2026-07-27-recipe-servings-design.md) | — | ✅ Implementado |
| 3 | [Despensa (Filtro "Posso Fazer com o que Tenho")](2026-07-27-despensa-design.md) | Busca por Ingrediente (usa `normalizeSearchText()`) | ✅ Implementado |
| 4 | [Tela Ativa Durante o Preparo (Wake Lock)](2026-07-27-wake-lock-design.md) | — | ✅ Implementado |
| 5 | [PWA e Suporte Offline](2026-07-27-pwa-offline-design.md) | Nenhuma técnica, mas recomendado por último (evita bump de cache repetido durante o desenvolvimento das outras) | ✅ Implementado |
| — | [Impressão](2026-07-27-impressao-design.md) | Independente — pode ser feita a qualquer momento na sequência | ✅ Implementado |

Spec pré-existente, fora desta leva (escopo maior, ainda não decidido quando entrar):
- [Modo Cozinha com Temporizadores](2026-07-15-modo-cozinha-design.md) — cobre um Wake Lock mais amplo dentro de um modo passo-a-passo em tela cheia; a versão enxuta de Wake Lock acima (#4) é independente dela.

## Backlog de melhorias sugeridas (ainda sem spec)
Ideias recebidas para evolução do app. Nenhuma tem spec ainda — criar um arquivo
`YYYY-MM-DD-<slug>-design.md` nesta pasta antes de implementar.

| Melhoria | Descrição | Spec |
|---|---|---|
| Internacionalização (i18n) | Suporte a múltiplos idiomas (PT/EN/ES) | — |
| Testes Automatizados | Suite de testes unitários e de integração | — |
| Gerenciamento de Estado Mais Robusto | Evoluir o estado atual (variáveis globais `let`) para algo mais estruturado | — |
| Exportação/Importação de Receitas | Backup e compartilhamento de receitas (arquivo JSON) | — |
| Modo Escuro Automático | Detecção automática do tema do sistema (`prefers-color-scheme`) sem exigir toggle manual | — |
| Compartilhamento de Receitas via URL | Gerar links compartilháveis para uma receita específica | — |
| Histórico de Uso | Registrar receitas visualizadas recentemente | — |
| Sugestões Inteligentes | Recomendar receitas baseado no histórico e na despensa | — |

## Como atualizar
Ao concluir a implementação de uma feature (plano executado e validado), marque o
status como `✅ Implementado` nesta tabela.

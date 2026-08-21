# Spec: Migração de CSS global → CSS Modules (chef-digital)

## Contexto do projeto

`chef-digital` (`wagnergsantos/chef-digital`) é um PWA de receitas, recém-migrado
de vanilla JS para React (migração de UI concluída e validada). O projeto segue
a arquitetura definida em `wagnergsantos/arquitetura_inicial`
(`docs/ARQUITETURA-UNIFICADA.md` é a fonte de verdade das convenções) e usa
`wagnergsantos/animatch` como **referência real** de como aplicar CSS Modules
num app React que já existe — não um template vazio. Leia esses dois
repositórios antes de começar; o padrão já foi validado lá e deve ser seguido
por consistência entre os projetos do autor.

**Stack**: React, Vite, Vitest, oxlint. Sem TypeScript.

## O que já foi feito (não mexer)

- Migração completa de vanilla JS → React (`App.jsx` + 9 componentes)
- Filtros de categoria/tag, contagem de resultados, drawers, modal de receita,
  modo de preparo (cooking mode) — tudo funcional e testado (66 testes
  passando)
- `admin.js`/`admin.html` continuam vanilla (fora de escopo desta tarefa)

## Objetivo desta tarefa

Migrar as classes CSS hoje centralizadas em `estilos.css` (3.092 linhas,
global) para **CSS Modules por componente**, eliminando o acoplamento por
nome de classe global entre `estilos.css` e os componentes React em
`src/components/`.

## Estado atual do CSS

`estilos.css` já é organizado em seções comentadas (não 1:1 com componentes,
mas ajuda a navegar):
- Variáveis/design tokens (`:root`, topo do arquivo) — **devem continuar
  globais**, não migram
- Slide-over Drawers (Planner e Shopping List)
- Shopping Checklist Section
- Immersive Recipe Details Modal
- Toast Notification
- Clear Filters Button
- Print Support
- Agenda semanal / Day Picker Popover
- Cooking Mode Immersive Overlay

Componentes React existentes e tamanho (para dimensionar o trabalho):

| Componente | Linhas |
|---|---|
| `ThemeToggle.jsx` | 27 |
| `RecipesGrid.jsx` | 106 |
| `PantryDrawer.jsx` | 140 |
| `RecipeCard.jsx` | 140 |
| `FilterSidebar.jsx` | 154 |
| `ShoppingDrawer.jsx` | 160 |
| `PlannerDrawer.jsx` | 182 |
| `RecipeModal.jsx` | 237 |
| `CookingMode.jsx` | 334 |

## O risco real (leia isto com atenção)

O tamanho não é o problema — é **mecânico**. O risco real é que uma boa parte
das classes hoje em `estilos.css` são **compartilhadas entre componentes**.
Trocar `className="foo"` por `className={styles.foo}` errado (ex.: mover uma
classe compartilhada pro module de um componente só, quebrando os outros que
dependiam dela) gera estilo quebrado que **não aparece no lint nem nos 66
testes automatizados** — só aparece rodando o app visualmente. Isso já
aconteceu na migração do AniMatch e está documentado como aprendizado da
sessão anterior.

### Classes confirmadas como compartilhadas entre 2+ componentes (levantamento real, não exaustivo — reconfirme antes de migrar)

**"Casca" de drawer** — usada por `PantryDrawer.jsx`, `PlannerDrawer.jsx` e
`ShoppingDrawer.jsx`:
`drawer`, `drawer-backdrop`, `drawer-header`, `drawer-header-title`,
`drawer-header-actions`, `drawer-content`, `drawer-footer`,
`drawer-close-btn`, `drawer-clear-btn`, `drawer-card-remove`,
`drawer-empty-state`

**Botões grandes** — `PantryDrawer.jsx`, `PlannerDrawer.jsx`,
`ShoppingDrawer.jsx`:
`btn-large`, `btn-large-primary`

**Controles de porção** — `PlannerDrawer.jsx` e `RecipeModal.jsx`:
`portion-btn`, `portion-controls`, `portion-value`

**Outras**:
`shopping-title` (`PantryDrawer.jsx` + `ShoppingDrawer.jsx`),
`has-image` (`RecipeCard.jsx` + `RecipeModal.jsx`)

## Padrão a seguir (validado no AniMatch, use como referência literal)

1. **CSS global fica só com o que é de fato global**: reset (`*, *::before,
   *::after`), variáveis/design tokens (`:root`), fontes. No AniMatch isso
   ficou em `src/index.css` com 184 linhas — use como parâmetro de tamanho
   esperado do que deve sobrar global aqui.
2. **Um `.module.css` por componente** para classes exclusivas dele.
3. **Classes compartilhadas entre componentes**: NÃO duplicar a classe em
   cada module nem deixar como classe global solta. Siga o padrão real do
   AniMatch — crie um `.module.css` compartilhado dedicado (ex.:
   `DrawerShell.module.css` para a casca de drawer listada acima) e importe
   com um alias claro nos componentes que precisam:
   ```js
   import drawerStyles from './DrawerShell.module.css';
   // ...
   <aside className={drawerStyles.drawer}>
   ```
   Veja `animatch/src/components/ModalOverlay.module.css`, importado como
   `overlayStyles` em `GenreOriginModal.jsx` e `GenreRecommendationModal.jsx`,
   como exemplo literal desse padrão.
4. Nomes de classe dentro do module.css podem manter os nomes atuais em
   kebab-case (`drawer-header`) ou virar camelCase — escolha um padrão e
   aplique consistentemente em todos os componentes; não misturar convenções
   entre arquivos.

## Ordem de migração sugerida (do mais simples/isolado ao mais arriscado)

1. `ThemeToggle.jsx` (27 linhas, sem classes compartilhadas conhecidas) —
   valida o processo em algo pequeno antes de escalar
2. `RecipesGrid.jsx` + `RecipeCard.jsx` (relacionados, `has-image`
   compartilhada entre os dois)
3. `FilterSidebar.jsx` (isolado)
4. Os 3 drawers juntos (`PantryDrawer`, `PlannerDrawer`, `ShoppingDrawer`) —
   é onde está a maior superfície de classes compartilhadas (a "casca" de
   drawer); fazer os três na mesma leva evita estado intermediário quebrado
5. `RecipeModal.jsx` (compartilha `portion-*` com `PlannerDrawer`, que já
   terá sido migrado no passo 4)
6. `CookingMode.jsx` (maior e mais complexo, migrar por último)

## Processo de entrega e validação (não-negociável)

- Trabalho entregue como `.patch` (`git diff`), nunca como cópia manual de
  arquivo — o dono do projeto aplica localmente com `git apply` (Windows/
  PowerShell) e dá push ele mesmo. Sem acesso de push direto ao GitHub.
- Consolidar trabalho relacionado em patches maiores em vez de muitos
  patches pequenos (reduz custo de revisão), mas sem misturar migrações de
  componentes não relacionados no mesmo patch.
- **Antes de entregar qualquer patch**: clonar repo limpo → aplicar patch →
  `npm install` → `npm run lint` (oxlint, deve manter 0 erros; hoje há 8
  warnings pré-existentes, não introduzir novos) → `npx vitest run` (hoje
  66/66 testes passando, não pode regredir) → `npm run build`. Isso é
  obrigatório, não opcional.
- **Testes automatizados NÃO cobrem regressão visual de CSS.** Depois de
  cada patch de migração, description explicitamente o que deveria mudar
  visualmente (nada — é refactor puro) e o que testar manualmente: abrir
  cada drawer, o modal de receita, o modo de preparo, e comparar com o
  estado antes do patch. Sinalizar isso claramente pro Wagner confirmar
  visualmente antes de prosseguir pro próximo lote.
- Mensagens de commit em Conventional Commits, em português, infinitivo:
  `refactor(componente): migrar estilos para css modules`.

## Fora de escopo (não fazer nesta tarefa)

- `admin.js`/`admin.html` (ainda vanilla, migração separada)
- Qualquer mudança visual/de design — isto é refactor puro de organização de
  CSS, não redesign
- Otimização de imagens (`public/*.png`, 12MB não otimizados) — está atrelada
  a um pipeline de upload futuro, tratar separadamente

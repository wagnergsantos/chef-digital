# Spec: Migração de `admin.css` → CSS Modules — chef-digital

## Contexto

O painel admin (`admin.html` + `src/AdminApp.jsx` + `src/components/admin/*.jsx`)
já foi migrado de vanilla JS para React e está estável (75/75 testes
passando). Este é o **último pedaço de CSS global** do projeto — a UI
pública já foi 100% migrada pra CSS Modules numa leva anterior. Esta
migração fecha esse item de dívida arquitetural.

Siga a mesma arquitetura de `wagnergsantos/arquitetura_inicial`
(`docs/ARQUITETURA-UNIFICADA.md`) e o mesmo padrão já aplicado duas vezes
neste projeto: um `.module.css` por componente, e **classes compartilhadas
entre componentes viram um módulo dedicado**, não uma classe global solta
nem duplicação. Exemplo real já existente no próprio projeto:
`src/components/DrawerShell.module.css`, compartilhado por `PantryDrawer`,
`PlannerDrawer` e `ShoppingDrawer`. Use como referência literal do padrão.

**Esta migração é bem menor que a da UI pública** (que tinha 3.092 linhas
de CSS e 9 componentes). Aqui são **484 linhas** em `src/admin.css` e
**9 componentes** (`AdminApp.jsx` + 8 em `src/components/admin/`). Risco
proporcionalmente menor, mas a mesma categoria de cuidado se aplica.

## Escopo

Arquivos a migrar (componentes + linha count, do mais isolado ao mais
arriscado):

| Componente | Linhas | Observação |
|---|---|---|
| `LoginForm.jsx` | pequeno | isolado, bom primeiro passo |
| `CategoryPicker.jsx` | pequeno | isolado |
| `StepsEditor.jsx` | médio | compartilha `btn-delete-row`, `form-input`, `section-title` |
| `TagInput.jsx` | médio | compartilha `form-group`, `form-label`, `highlighted`, `visible` |
| `RecipeSearchCombobox.jsx` | médio | compartilha `highlighted`, `visible` com `TagInput` |
| `IngredientsEditor.jsx` | maior (mexeu bastante na última leva, seções de ingredientes) | compartilha `btn-delete-row`, `section-title` |
| `AIImportBox.jsx` | médio | compartilha `form-group`, `form-label` |
| `BulkImportModal.jsx` | maior | compartilha `admin-btn-primary`, `admin-card` |
| `AdminApp.jsx` | maior (componente raiz) | usa quase todas as classes compartilhadas |

## Classes compartilhadas identificadas (levantamento real via análise estática, reconfirme antes de migrar)

Estas 12 classes aparecem em 2+ componentes — candidatas a um módulo
compartilhado, mesmo padrão do `DrawerShell.module.css`:

**Botões e cards** (usadas por quase todo componente):
`admin-btn`, `admin-btn-primary`, `admin-btn-secondary`, `admin-card`,
`admin-error-box`

**Formulário** (usadas por `AdminApp`, `LoginForm`, `AIImportBox`,
`CategoryPicker`, `TagInput`):
`form-group`, `form-input`, `form-label`

**Combobox/autocomplete** (compartilhadas só entre `RecipeSearchCombobox`
e `TagInput` — os dois autocompletes com navegação por teclado):
`highlighted`, `visible`

**Listas de ingredientes/passos** (compartilhadas entre `IngredientsEditor`
e `StepsEditor`):
`btn-delete-row`, `section-title`

**Sugestão de estrutura**: um `AdminUI.module.css` (ou dois: `Buttons.module.css`
+ `FormControls.module.css`, se preferir mais granular) pros grupos acima,
importado com alias nos componentes que precisam — mesmo padrão de
`import drawerStyles from './DrawerShell.module.css'` já usado.

## CSS morto encontrado (remover durante a migração)

Estas 6 classes existem em `src/admin.css` mas não são referenciadas por
nenhum componente atual — confirme antes de apagar (pode ter sido um
resíduo de UI removida numa leva anterior), mas não devem ser recriadas
como módulo:
`admin-btn-link`, `admin-categories-grid`, `admin-category-item`,
`admin-category-label`, `admin-ingredient-row`, `admin-step-row`

## `admin.css` depois da migração

`src/admin.css` **não tem nenhum estilo de `body`/página global** — todo
seletor nele é escopado a algum componente, e as variáveis de design
(`var(--bg-card)`, `var(--border-color)`, etc.) já vêm de `estilos.css`,
que `admin.html` também carrega. Ou seja: diferente da migração da UI
pública (que manteve um `estilos.css` residual só com reset+variáveis),
aqui **é esperado que `src/admin.css` fique vazio ou seja removido por
completo** ao final — não force a criação de um arquivo global
desnecessário só por hábito.

## Restrição: atualizar `src/logic/admin-css-split.test.js`

Esse teste existe e **vai quebrar** com esta migração, de propósito — ele
afirma hoje que `admin.html` carrega `href="src/admin.css"`. Atualize o
teste para refletir o novo estado real, por exemplo:
- Se `admin.css` for removido por completo: teste passa a checar que
  `admin.html` **não** carrega `admin.css` (ou remove essa assertiva) e
  que nenhum `.module.css` sob `src/components/admin/` vaza pra
  `estilos.css` (adaptar a primeira assertiva do teste, que hoje checa
  `.admin-*`/`.form-*` em `estilos.css`, pra continuar fazendo sentido).
- Não deixe esse teste órfão/desatualizado — ele é a garantia de que o
  CSS do admin não vaza pro bundle público.

## Processo de entrega e validação (mesmo de sempre)

- Entregar como `.patch` (`git diff`), sem push direto.
- Antes de entregar: clone limpo → `git apply` → `npm install` →
  `npm run lint` (0 erros) → `npx vitest run` (hoje 75/75 passando,
  incluindo o `admin-css-split.test.js` atualizado) → `npm run build`
  (confirmar que `dist/admin.html` e o chunk `admin-*.js`/`.css` continuam
  saindo).
- **Testes não cobrem regressão visual.** Depois do patch, testar
  manualmente: tela de login, formulário completo de receita (categorias,
  ingredientes com seções, passos, tags com autocomplete, busca de receita
  pra editar), import por IA (texto e imagem), import em lote. Confirmar
  visualmente antes de prosseguir.
- Commits em Conventional Commits, português, infinitivo:
  `refactor(admin): migrar estilos para css modules`.

## Fora de escopo

- Qualquer mudança visual/de design — refactor puro de organização de CSS
- Trocar `alert()`/`confirm()` nativos — não é objetivo desta migração
- Qualquer mudança de comportamento/regra de negócio

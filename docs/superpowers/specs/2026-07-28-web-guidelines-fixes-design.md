# Correções de Web Interface Guidelines — Design

## Contexto

Uma revisão do `index.html` e `estilos.css` contra as [Web Interface
Guidelines](https://github.com/vercel-labs/web-interface-guidelines) apontou
10 itens pontuais de acessibilidade, tipografia, performance e tema. Este
documento define como cada um será corrigido. A virtualização do grid de
receitas (~126 itens) foi identificada mas **fora de escopo** deste trabalho
(maior esforço, tratada separadamente se necessário).

## Itens e abordagem

### 1. Card de receita acessível via teclado (`.recipe-card`)
O card é um `<div>` com `onclick` que abre o modal da receita — hoje
inacessível via teclado. Adicionar:
- `role="button"`, `tabindex="0"`
- `aria-label="Ver receita de <título>"`
- `onkeydown` chamando `openRecipeModal` em Enter/Espaço, replicando o guard
  existente que ignora cliques originados em `.card-action-btn` (para não
  abrir o modal ao ativar favoritar/planejar via teclado nesses botões
  internos, que já são `<button>` focáveis independentes).

### 2. Passo do modo de preparo acessível via teclado (`.modal-step-li`)
O `<li onclick>` alterna a classe `completed` (efeito "riscar passo
concluído"). Adicionar `role="checkbox"`, `aria-checked` (sincronizado no
toggle), `tabindex="0"` e `onkeydown` (Enter/Espaço) chamando o mesmo toggle
usado no `onclick`.

Abordagem escolhida: manter os elementos `<div>`/`<li>` existentes com
role+tabindex+onkeydown (menor mudança de CSS/layout), em vez de trocar por
`<button>` nativo.

### 3. `<img>` do card sem dimensões
`.card-header-image` não define `width`/`height`, causando CLS. Adicionar os
atributos com as dimensões correspondentes ao container `.card-header-graphic`
(mantendo `object-fit: cover` já definido em CSS para preencher o espaço).

### 4. Tipografia: `...` → `…`
Trocar reticências ASCII por `…` em:
- placeholder de `#search-input` ("Buscar por título ou ingrediente…")
- placeholder de `#pantry-textarea` ("Ex: frango, cebola, arroz, alho…")
- texto inicial de `#results-count` ("Carregando Receitas…")
- texto de exemplo em `#modal-tips-text` ("Dica de ouro aqui…")

### 5. `autocomplete`/`name` em inputs
- `#search-input`: adicionar `name="busca"` e `autocomplete="off"`.
- `#pantry-textarea`: adicionar `name="despensa"` e `autocomplete="off"`.

### 6. `theme-color` dinâmico
Hoje o `<meta name="theme-color">` é fixo em `#f59e0b` (âmbar), não refletindo
o fundo real da página. Passar a usar a cor de fundo de cada tema:
- Claro: `#fafaf9` (mesmo valor de `--bg-main` claro)
- Escuro: `#0c0a09` (mesmo valor de `--bg-main` escuro)

Atualização em dois pontos:
- Script inline anti-flash no `<head>` (define o valor correto já na carga
  inicial, antes do CSS/JS principal rodar).
- `updateThemeToggleIcon()` (já chamada no `window.onload` e em
  `toggleTheme()`), que passa a também atualizar o `content` do meta tag.

### 7. `transition: all` → propriedades explícitas
Revisar as 8 ocorrências (estilos.css: 400, 437, 478, 684, 948, 1074, 1953,
1998) e substituir por listas explícitas das propriedades de fato animadas
nesses seletores (majoritariamente `transform`, `background-color`,
`border-color`, `box-shadow`, `color`, conforme o que cada regra `:hover`
associada realmente altera).

### 8. Scrollbar customizada no modo escuro
O bloco `::-webkit-scrollbar*` (linhas 172-183) usa cores fixas pensadas para
tema claro. Adicionar overrides dentro dos seletores de tema escuro
(`[data-theme="dark"]` e o bloco `@media (prefers-color-scheme: dark)`
correspondente) usando tokens de superfície escuros já definidos
(`--bg-light`/`--border-dark` do tema escuro) para track/thumb.

### 9. Touch/overscroll
Adicionar:
- `touch-action: manipulation` em elementos interativos primários (botões,
  `.recipe-card`, itens de checkbox) — evita delay de double-tap-zoom no
  mobile.
- `-webkit-tap-highlight-color: transparent` globalmente (o app já tem
  feedback visual próprio de `:active`/`:hover`).
- `overscroll-behavior: contain` em `.drawer` e `.modal-container` (conteúdo
  rolável de planner/lista de compras/modal de receita), evitando que o
  scroll "vaze" para o body por trás.

### 10. `color-scheme: dark`
Adicionar `color-scheme: light` no `:root` padrão e `color-scheme: dark`
dentro dos blocos de tema escuro (`[data-theme="dark"]` e
`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`),
corrigindo a cor nativa de scrollbars do navegador, inputs e outros
controles nativos no modo escuro.

## Fora de escopo
- Virtualização/otimização do grid de receitas (~126 itens) — maior esforço,
  fica para um design/spec separado se a performance se tornar um problema
  real percebido pelo usuário.

## Verificação
Sem pipeline de testes automatizado no projeto. Verificação manual abrindo
`index.html` (servidor estático local):
- Navegar cards e passos do modo de preparo só com teclado (Tab, Enter,
  Espaço) e confirmar abertura do modal / toggle do passo.
- Inspecionar `<meta name="theme-color">` no DevTools ao alternar tema.
- Alternar tema escuro e verificar cor da scrollbar e dos controles nativos
  (`color-scheme`).
- Testar scroll dentro dos drawers/modal em mobile (emulação) para confirmar
  `overscroll-behavior: contain`.
- Confirmar visualmente que não há mudança de layout inesperada nas
  transições revisadas (`transition: all` → explícitas).

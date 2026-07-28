# Correções de Web Interface Guidelines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 10 apontamentos de acessibilidade, tipografia, tema e performance identificados pela revisão de Web Interface Guidelines em `index.html` e `estilos.css`, sem alterar comportamento visual/funcional existente.

**Architecture:** Projeto é uma SPA estática sem build (ver `.github/copilot-instructions.md`). Não há suite de testes automatizada — cada tarefa termina com um passo de verificação manual no navegador (servidor estático local), seguido de commit. Todas as mudanças são edições pontuais em `index.html` (markup + script inline) e `estilos.css`.

**Tech Stack:** HTML/CSS/JS vanilla, sem dependências.

---

## Antes de começar

Sirva o app localmente para testar (evita peculiaridades do `file://`):

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000/index.html` no navegador. Use isso para os passos de verificação manual em todas as tarefas.

## File Structure

Nenhum arquivo novo é criado. Todas as mudanças são em:
- `index.html` — markup (atributos de acessibilidade, textos, meta tag) e script inline (funções `renderRecipes`, `openRecipeModal`, `updateThemeToggleIcon`, script anti-flash no `<head>`).
- `estilos.css` — regras de transição, scrollbar, touch/overscroll e `color-scheme`.

---

### Task 1: Card de receita acessível via teclado

**Files:**
- Modify: `index.html` (função `renderRecipes`, dentro do `forEach` que monta cada card — atualmente por volta da linha 833-841)

- [ ] **Step 1: Editar a criação do card para adicionar role/tabindex/aria-label/onkeydown**

Localize este bloco (dentro de `renderRecipes()`):

```javascript
                    const card = document.createElement('div');
                    card.className = `recipe-card ${isPlanned ? 'planned' : ''}`;
                    card.style.setProperty('--i', index);
                    card.onclick = (e) => {
                        // Avoid triggering modal if clicking actions directly
                        if (e.target.closest('.card-action-btn')) return;
                        openRecipeModal(recipe.id);
                    };
```

Substitua por:

```javascript
                    const card = document.createElement('div');
                    card.className = `recipe-card ${isPlanned ? 'planned' : ''}`;
                    card.style.setProperty('--i', index);
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', '0');
                    card.setAttribute('aria-label', `Ver receita de ${recipe.title}`);
                    card.onclick = (e) => {
                        // Avoid triggering modal if clicking actions directly
                        if (e.target.closest('.card-action-btn')) return;
                        openRecipeModal(recipe.id);
                    };
                    card.onkeydown = (e) => {
                        // Avoid triggering modal if the key event originated in an action button
                        if (e.target.closest('.card-action-btn')) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRecipeModal(recipe.id);
                        }
                    };
```

- [ ] **Step 2: Verificar manualmente**

Com o servidor local rodando, abra `index.html`, pressione Tab até focar um card de receita (deve aparecer o anel de foco âmbar já definido em `estilos.css:147-153`), pressione Enter — o modal da receita deve abrir. Repita com Espaço. Confirme também que Tab consegue chegar aos botões internos do card (planejar/favoritar) e que ativá-los com Enter não abre o modal por engano.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix(a11y): tornar card de receita acessível via teclado

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Passo do modo de preparo acessível via teclado

**Files:**
- Modify: `index.html` (função `openRecipeModal`, bloco `recipe.steps.forEach` — atualmente por volta da linha 1554-1562)

- [ ] **Step 1: Editar a criação de cada `<li>` de passo**

Localize:

```javascript
            recipe.steps.forEach((step, idx) => {
                const li = document.createElement('li');
                li.className = "modal-step-li";
                li.onclick = () => li.classList.toggle('completed');
                li.innerHTML = `
                    <span class="step-number">${idx+1}</span>
                    <p class="step-text">${step}</p>
                `;
                stepsList.appendChild(li);
            });
```

Substitua por:

```javascript
            recipe.steps.forEach((step, idx) => {
                const li = document.createElement('li');
                li.className = "modal-step-li";
                li.setAttribute('role', 'checkbox');
                li.setAttribute('tabindex', '0');
                li.setAttribute('aria-checked', 'false');
                li.setAttribute('aria-label', `Passo ${idx + 1}`);
                const toggleStepDone = () => {
                    li.classList.toggle('completed');
                    li.setAttribute('aria-checked', li.classList.contains('completed') ? 'true' : 'false');
                };
                li.onclick = toggleStepDone;
                li.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleStepDone();
                    }
                };
                li.innerHTML = `
                    <span class="step-number">${idx+1}</span>
                    <p class="step-text">${step}</p>
                `;
                stepsList.appendChild(li);
            });
```

- [ ] **Step 2: Verificar manualmente**

Abra uma receita, pressione Tab até focar o primeiro passo do modo de preparo (anel de foco âmbar deve aparecer, já que `[role="checkbox"]:focus-visible` está coberto pela regra global em `estilos.css:147-153`), pressione Enter — o passo deve ficar riscado (classe `completed`). Pressione novamente para desmarcar. Confirme com Espaço também.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix(a11y): tornar passo do modo de preparo acessível via teclado

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Dimensões explícitas na imagem do card

**Files:**
- Modify: `index.html` (função `renderRecipes`, template do `card.innerHTML` — atualmente linha ~857)

- [ ] **Step 1: Adicionar `width`/`height` na tag `<img>`**

Localize:

```javascript
                            ${hasImg ? `<img src="${recipe.image}" class="card-header-image" alt="Foto de ${recipe.title}" loading="lazy" />` : ''}
```

Substitua por (400x112 reflete a proporção do container `.card-header-graphic`, que tem `height: 112px` fixo em `estilos.css:600`; a imagem continua sendo esticada via CSS `object-fit: cover`, então os valores servem apenas como hint de proporção, não travam o layout real):

```javascript
                            ${hasImg ? `<img src="${recipe.image}" class="card-header-image" alt="Foto de ${recipe.title}" loading="lazy" width="400" height="112" />` : ''}
```

- [ ] **Step 2: Verificar manualmente**

Abra o app, inspecione um card com foto no DevTools — confirme que o `<img>` tem os atributos `width="400" height="112"` e que a imagem continua preenchendo o card normalmente (sem distorção, já que o CSS de `.card-header-image` sobrepõe via `position: absolute; inset: 0`).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix(perf): adicionar dimensões explícitas na imagem do card

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Tipografia — `...` → `…`

**Files:**
- Modify: `index.html` (4 ocorrências: linhas 103, 139, 323, 348)

- [ ] **Step 1: Placeholder do campo de busca (linha 103)**

De:
```html
                        <input type="text" id="search-input" onkeyup="filterRecipes()" placeholder="Buscar por título ou ingrediente..." class="search-input" aria-label="Buscar receitas por título ou ingrediente">
```
Para:
```html
                        <input type="text" id="search-input" onkeyup="filterRecipes()" placeholder="Buscar por título ou ingrediente…" class="search-input" aria-label="Buscar receitas por título ou ingrediente">
```

- [ ] **Step 2: Texto de carregamento (linha 139)**

De:
```html
                <h2 id="results-count">Carregando Receitas...</h2>
```
Para:
```html
                <h2 id="results-count">Carregando Receitas…</h2>
```

- [ ] **Step 3: Texto de exemplo da dica (linha 323)**

De:
```html
                            <p id="modal-tips-text" class="tip-text">Dica de ouro aqui...</p>
```
Para:
```html
                            <p id="modal-tips-text" class="tip-text">Dica de ouro aqui…</p>
```

- [ ] **Step 4: Placeholder da despensa (linha 348)**

De:
```html
                <textarea id="pantry-textarea" placeholder="Ex: frango, cebola, arroz, alho..." aria-label="Ingredientes da despensa"></textarea>
```
Para:
```html
                <textarea id="pantry-textarea" placeholder="Ex: frango, cebola, arroz, alho…" aria-label="Ingredientes da despensa"></textarea>
```

- [ ] **Step 5: Verificar manualmente**

Recarregue o app: o placeholder do campo de busca e da despensa devem exibir `…` (não `...`); o texto de "Carregando Receitas…" aparece um instante antes do JS popular a grade (pode precisar dar Ctrl+Shift+R para ver o estado antes do `window.onload` rodar, ou olhar o HTML fonte).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "fix(typography): trocar reticências ASCII por … (U+2026)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: `autocomplete`/`name` nos inputs

**Files:**
- Modify: `index.html` (linhas 103 e 348 — já editadas na Task 4, então localize pelo estado atual pós-Task-4)

- [ ] **Step 1: Campo de busca**

De:
```html
                        <input type="text" id="search-input" onkeyup="filterRecipes()" placeholder="Buscar por título ou ingrediente…" class="search-input" aria-label="Buscar receitas por título ou ingrediente">
```
Para:
```html
                        <input type="text" id="search-input" name="busca" autocomplete="off" onkeyup="filterRecipes()" placeholder="Buscar por título ou ingrediente…" class="search-input" aria-label="Buscar receitas por título ou ingrediente">
```

- [ ] **Step 2: Textarea da despensa**

De:
```html
                <textarea id="pantry-textarea" placeholder="Ex: frango, cebola, arroz, alho…" aria-label="Ingredientes da despensa"></textarea>
```
Para:
```html
                <textarea id="pantry-textarea" name="despensa" autocomplete="off" placeholder="Ex: frango, cebola, arroz, alho…" aria-label="Ingredientes da despensa"></textarea>
```

- [ ] **Step 3: Verificar manualmente**

No DevTools, confirme que `#search-input` e `#pantry-textarea` têm os atributos `name` e `autocomplete="off"`. Digite nos dois campos e confirme que nenhum autocomplete indesejado do navegador aparece.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix(forms): adicionar name/autocomplete nos campos de busca e despensa

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: `theme-color` dinâmico (claro/escuro)

**Files:**
- Modify: `index.html` (meta tag no `<head>`, script anti-flash inline, e função `updateThemeToggleIcon`)

- [ ] **Step 1: Dar um `id` à meta tag de theme-color**

De:
```html
    <meta name="theme-color" content="#f59e0b">
```
Para:
```html
    <meta name="theme-color" id="theme-color-meta" content="#fafaf9">
```

- [ ] **Step 2: Atualizar o script anti-flash no `<head>` para também setar a cor correta**

De:
```html
    <script>
        (function() {
            const savedTheme = localStorage.getItem('chef_digital_theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            } else {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
            }
        })();
    </script>
```
Para:
```html
    <script>
        (function() {
            const THEME_COLORS = { light: '#fafaf9', dark: '#0c0a09' };
            const savedTheme = localStorage.getItem('chef_digital_theme');
            let theme;
            if (savedTheme) {
                theme = savedTheme;
            } else {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = systemPrefersDark ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
            const themeColorMeta = document.getElementById('theme-color-meta');
            if (themeColorMeta) {
                themeColorMeta.setAttribute('content', THEME_COLORS[theme]);
            }
        })();
    </script>
```

- [ ] **Step 3: Atualizar `updateThemeToggleIcon()` para manter o meta tag sincronizado ao alternar o tema**

Localize (já existente, no script principal):
```javascript
        function updateThemeToggleIcon() {
            const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            const themeBtn = document.getElementById('theme-toggle');
            if (!themeBtn) return;
```
Substitua por:
```javascript
        function updateThemeToggleIcon() {
            const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

            const themeColorMeta = document.getElementById('theme-color-meta');
            if (themeColorMeta) {
                const THEME_COLORS = { light: '#fafaf9', dark: '#0c0a09' };
                themeColorMeta.setAttribute('content', THEME_COLORS[current]);
            }

            const themeBtn = document.getElementById('theme-toggle');
            if (!themeBtn) return;
```

(O restante da função, que troca o ícone SVG do botão, permanece inalterado.)

- [ ] **Step 4: Verificar manualmente**

Abra o DevTools, inspecione `<meta name="theme-color" id="theme-color-meta">`. Com o tema claro ativo, o `content` deve ser `#fafaf9`. Clique no botão de alternar tema (☀️/🌙) — o `content` deve mudar para `#0c0a09`. Recarregue a página com o tema escuro salvo — o `content` já deve nascer como `#0c0a09` (sem flash), confirmando que o script do `<head>` está funcionando.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "fix(theme): tornar meta theme-color dinâmico conforme tema ativo

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: `transition: all` → propriedades explícitas

**Files:**
- Modify: `estilos.css` (8 ocorrências)

- [ ] **Step 1: `.search-input` (linha ~400)**

De:
```css
.search-input {
    width: 100%;
    background-color: var(--bg-light);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-md);
    padding: 10px 40px 10px 40px;
    font-size: 14px;
    outline: none;
    transition: all var(--transition-fast);
    color: var(--text-main);
}
```
Para:
```css
.search-input {
    width: 100%;
    background-color: var(--bg-light);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-md);
    padding: 10px 40px 10px 40px;
    font-size: 14px;
    outline: none;
    transition: border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
    color: var(--text-main);
}
```

(A regra `.search-input:focus` logo abaixo só altera `border-color`, `background-color` e `box-shadow` — por isso essas são as propriedades listadas.)

- [ ] **Step 2: `.search-clear-btn` (linha ~437)**

De:
```css
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
}

.search-clear-btn:hover {
    background-color: var(--border-dark);
    color: var(--text-main);
}
```
Para:
```css
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    transition: background-color var(--transition-fast), color var(--transition-fast);
}

.search-clear-btn:hover {
    background-color: var(--border-dark);
    color: var(--text-main);
}
```

- [ ] **Step 3: `.category-filter-btn` (linha ~478)**

De:
```css
.category-filter-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    transition: all var(--transition-fast);
    width: auto;
    text-align: left;
```
Para:
```css
.category-filter-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    transition: color var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
    width: auto;
    text-align: left;
```

(`.category-filter-btn:hover` altera `color`, `border-color`, `background-color`; `.category-filter-btn.active` acrescenta `box-shadow` — por isso as 4 propriedades.)

- [ ] **Step 4: `.card-header-graphic::after` (linha ~684)**

De:
```css
.card-header-graphic::after {
    content: '';
    position: absolute;
    right: -24px;
    bottom: -24px;
    width: 80px;
    height: 80px;
    background: rgba(245, 158, 11, 0.03);
    border-radius: var(--radius-full);
    filter: blur(16px);
    transition: all var(--transition-normal);
}
```
Para:
```css
.card-header-graphic::after {
    content: '';
    position: absolute;
    right: -24px;
    bottom: -24px;
    width: 80px;
    height: 80px;
    background: rgba(245, 158, 11, 0.03);
    border-radius: var(--radius-full);
    filter: blur(16px);
    transition: background var(--transition-normal);
}
```

- [ ] **Step 5: `.drawer-clear-btn` (linha ~948)**

De:
```css
.drawer-clear-btn {
    font-size: 12px;
    color: var(--danger-color);
    font-weight: 600;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
}
```
Para:
```css
.drawer-clear-btn {
    font-size: 12px;
    color: var(--danger-color);
    font-weight: 600;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-fast);
}
```

- [ ] **Step 6: `.drawer-card-remove` (linha ~1074)**

De:
```css
.drawer-card-remove {
    color: var(--text-light);
    transition: all var(--transition-fast);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
```
Para:
```css
.drawer-card-remove {
    color: var(--text-light);
    transition: color var(--transition-fast), background-color var(--transition-fast);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
```

- [ ] **Step 7: `.clear-filters-btn` (linha ~1953)**

De:
```css
    padding: 10px 16px;
    background-color: var(--bg-light);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.clear-filters-btn:hover {
    background-color: var(--border-dark);
    color: var(--text-main);
}
```
Para:
```css
    padding: 10px 16px;
    background-color: var(--bg-light);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color var(--transition-fast), color var(--transition-fast);
}

.clear-filters-btn:hover {
    background-color: var(--border-dark);
    color: var(--text-main);
}
```

- [ ] **Step 8: `.pantry-edit-btn` (linha ~1998)**

De:
```css
    background-color: var(--bg-card);
    color: var(--text-muted);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.pantry-edit-btn svg {
```
Para:
```css
    background-color: var(--bg-card);
    color: var(--text-muted);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast);
}

.pantry-edit-btn svg {
```

- [ ] **Step 9: Verificar manualmente**

Recarregue o app e passe o mouse/foco por: campo de busca, botão limpar busca, botões de categoria (incluindo clicar para ativar/desativar), cards de receita (glow do canto), botão "Limpar Menu"/"Limpar Tudo" nos drawers, botão remover item do planner, botão "Limpar Filtros" e o botão de editar despensa. Todas as transições visuais (cor, fundo, sombra) devem continuar suaves e idênticas ao comportamento anterior — nenhuma mudança visual esperada, só a lista de propriedades animadas ficou explícita.

- [ ] **Step 10: Commit**

```bash
git add estilos.css
git commit -m "perf(css): substituir transition: all por propriedades explícitas

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: Scrollbar customizada no modo escuro (verificação, sem mudança de código)

**Files:** nenhum (apenas verificação)

O bloco de scrollbar em `estilos.css:172-183` já usa os tokens de tema `var(--bg-light)` (track) e `var(--text-light)`/`var(--text-muted)` (thumb/hover), que são redefinidos tanto em `[data-theme="dark"]` (estilos.css:103) quanto em `@media (prefers-color-scheme: dark)` (estilos.css:65). Como custom properties são herdadas por toda a árvore do documento — incluindo o contexto de renderização usado pelos pseudo-elementos `::-webkit-scrollbar-*` —, a cor da scrollbar já se adapta automaticamente ao tema escuro sem necessidade de uma regra adicional. Escrever um override explícito aqui duplicaria valores que já existem nas variáveis de tema (viola DRY) sem mudar nada visualmente.

- [ ] **Step 1: Verificar manualmente que a scrollbar já adapta ao tema escuro**

Abra o app em um navegador baseado em Chromium (Edge/Chrome — `::-webkit-scrollbar` não tem efeito no Firefox), alterne para o tema escuro pelo botão de tema, e abra o drawer do planejador semanal (com itens suficientes para rolar) ou a categoria com scroll (`categories-filter-list`). Confirme visualmente que a scrollbar (track escuro `#292524`, thumb `#94a3b8`) tem contraste adequado contra o fundo escuro do drawer/sidebar, sem qualquer mudança de código.

- [ ] **Step 2: Nenhum commit necessário**

Nenhuma mudança de arquivo nesta tarefa — pular para a Task 9.

---

### Task 9: `touch-action`, `-webkit-tap-highlight-color` e `overscroll-behavior`

**Files:**
- Modify: `estilos.css` (bloco de reset de `button`, linha ~188; `.drawer-content`, linha ~1004; `.modal-body`, linha ~1608)

- [ ] **Step 1: Adicionar touch-action/tap-highlight nos elementos interativos**

Localize:
```css
/* Typography & Links */
button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
}

input {
    font-family: inherit;
}
```
Substitua por:
```css
/* Typography & Links */
button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
}

input {
    font-family: inherit;
}

/* Touch feedback tuning: evita delay de double-tap-zoom em botões e
   elementos com role de botão/checkbox, e remove o highlight cinza padrão
   do WebKit mobile (o app já tem estados :hover/:active/:focus-visible
   próprios para dar feedback visual). */
button,
[role="button"],
[role="checkbox"] {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 2: Conter o scroll dentro dos drawers**

Localize:
```css
.drawer-content {
    flex-grow: 1;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
```
Substitua por:
```css
.drawer-content {
    flex-grow: 1;
    padding: 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
```

- [ ] **Step 3: Conter o scroll dentro do modal de receita**

Localize:
```css
.modal-body {
    flex-grow: 1;
    overflow-y: auto;
    padding: 32px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
}
```
Substitua por:
```css
.modal-body {
    flex-grow: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 32px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
}
```

- [ ] **Step 4: Verificar manualmente**

Usando o DevTools em modo de emulação mobile (ou um dispositivo real), abra o drawer da lista de compras/planejador com conteúdo suficiente para rolar, chegue ao topo/fundo da lista e continue arrastando — o scroll não deve "vazar" para o body por trás do drawer. Repita no modal de receita (`.modal-body`). Toque duas vezes rapidamente em um botão (ex: favoritar) e confirme que não há delay perceptível nem highlight cinza residual no toque.

- [ ] **Step 5: Commit**

```bash
git add estilos.css
git commit -m "fix(touch): adicionar touch-action, tap-highlight e overscroll-behavior

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 10: `color-scheme` para tema claro/escuro

**Files:**
- Modify: `estilos.css` (`:root` linha ~8, bloco `@media (prefers-color-scheme: dark)` linha ~65, bloco `[data-theme="dark"]` linha ~103)

- [ ] **Step 1: Declarar `color-scheme: light` no `:root` padrão**

Localize o início do bloco `:root`:
```css
/* CSS Variables & Design Tokens */
:root {
    /* Color Palette */
    --primary-color: #f59e0b; /* amber-500 */
```
Substitua por:
```css
/* CSS Variables & Design Tokens */
:root {
    color-scheme: light;

    /* Color Palette */
    --primary-color: #f59e0b; /* amber-500 */
```

- [ ] **Step 2: Declarar `color-scheme: dark` no bloco de dark mode automático (`prefers-color-scheme`)**

Localize:
```css
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
        --primary-color: #fbbf24; /* amber-400 */
```
Substitua por:
```css
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
        color-scheme: dark;
        --primary-color: #fbbf24; /* amber-400 */
```

- [ ] **Step 3: Declarar `color-scheme: dark` no bloco de dark mode manual (`[data-theme="dark"]`)**

Localize:
```css
[data-theme="dark"] {
    --primary-color: #fbbf24; /* amber-400 */
```
Substitua por:
```css
[data-theme="dark"] {
    color-scheme: dark;
    --primary-color: #fbbf24; /* amber-400 */
```

- [ ] **Step 4: Verificar manualmente**

Com o tema escuro ativo, recarregue o app e observe: a scrollbar nativa do navegador (se o app tiver algum elemento sem scrollbar customizada) e o textarea `#pantry-textarea` devem assumir a aparência escura nativa do navegador (fundo escuro, texto claro) em vez do padrão claro do sistema. Alterne entre os temas pelo botão de tema e confirme que a troca acontece de forma consistente.

- [ ] **Step 5: Commit**

```bash
git add estilos.css
git commit -m "fix(theme): declarar color-scheme conforme tema ativo

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Verificação final (todas as tarefas)

Depois de completar as 10 tarefas, faça uma passada final manual:
1. Abra `index.html` via `python -m http.server 8000`.
2. Navegue toda a interface só com teclado (Tab/Enter/Espaço/Esc): busca, filtros de categoria, cards de receita, favoritar, planejar, modal de receita (incluindo passos do modo de preparo), drawers do planner e lista de compras, modal da despensa.
3. Alterne entre tema claro/escuro várias vezes e confirme meta `theme-color`, cores da scrollbar e `color-scheme` (via DevTools > Rendering > "Emulate CSS media feature prefers-color-scheme" ou inspecionando os elementos nativos).
4. Confirme visualmente que nenhuma transição/hover mudou de comportamento após a Task 7.
5. Teste em emulação mobile o scroll dos drawers/modal (Task 9).

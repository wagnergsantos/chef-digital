# Plano de Implementação - Fase 3: Modo Preparo (Cooking Mode)

> **Goal:** Criar o módulo `src/modules/cooking-mode.js` e a interface imersiva full-screen com Wake Lock, navegação por passos, timers automáticos e painel retrátil de ingredientes.

**Architecture:**
O módulo `cooking-mode.js` gerenciará a camada de overlay visual `#cooking-mode-overlay` que cobre a viewport, intercepta teclas de atalho e controla a ativação da Wake Lock API durante a navegação entre os passos de preparo.

---

### Task 1: Adicionar Estrutura HTML/CSS do Modo Preparo e Módulo `cooking-mode.js`
**Files:**
- Modify: `index.html`
- Modify: `estilos.css`
- Create: `src/modules/cooking-mode.js`

- [ ] **Step 1: Adicionar container `#cooking-mode-overlay` no `index.html`**
- [ ] **Step 2: Estilizar overlay em `estilos.css`** (dark mode nativo imersivo, tipografia responsiva grande, barra de progresso, gaveta de ingredientes e botões touch-friendly).
- [ ] **Step 3: Criar `src/modules/cooking-mode.js`** com funções `startCookingMode(recipe)`, `nextStep()`, `prevStep()`, `toggleIngredientsDrawer()`, `exitCookingMode()`.

---

### Task 2: Integrar Timers Inteligentes e Wake Lock
**Files:**
- Modify: `src/modules/cooking-mode.js`
- Modify: `src/modules/recipe-modal.js`
- Modify: `src/main.js`

- [ ] **Step 1: Implementar parser de timer no texto do passo** (`parseTimerFromStepText`) e renderizador de cronômetro regressivo com alarme sonoro/visual.
- [ ] **Step 2: Conectar o botão "Modo Preparo" no modal da receita (`recipe-modal.js`)**.
- [ ] **Step 3: Conectar navegação global de teclado em `src/main.js` (`ArrowLeft`, `ArrowRight`, `Escape`)**.

---

### Task 3: Validação do Build e Testes
- [ ] **Step 1: Testar o build de produção**: `npx vite build`.
- [ ] **Step 2: Commit final da Fase 3**.

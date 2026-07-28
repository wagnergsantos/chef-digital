# Agenda Semanal (Planejamento por Dia) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o "Menu Semanal" (drawer de planejamento) de uma lista plana de receitas em uma agenda agrupada por dia da semana (Domingo → Sábado), permitindo que a mesma receita seja planejada em múltiplos dias.

**Architecture:** Estado `plannedRecipes` (array plano `{id, people}`) é substituído por `plannedByDay` (objeto `{dom: [...], seg: [...], ...}`, cada entrada `{recipeId, people}`), com migração automática do formato antigo. Um popover de seleção de dia é adicionado ao botão de calendário (no card e no modal de receita); o drawer da agenda passa a renderizar 7 seções fixas por dia.

**Tech Stack:** HTML/CSS/JS puro (sem build, sem framework). Todas as mudanças ficam em `index.html` (lógica inline) e `estilos.css`. Este projeto não tem test runner nem pipeline automatizado — cada tarefa abaixo substitui "rodar teste automatizado" por um passo de **verificação manual no navegador**, conforme a convenção já usada neste repositório (ver seção "Verificando changes" das instruções do projeto).

**Ordem das tasks:** Task 1 troca o modelo de dados e atualiza **todos** os pontos de consumo existentes na mesma tarefa (para não deixar o app quebrado entre commits) — o botão de calendário fica temporariamente limitado a planejar sempre em "Domingo". Task 2 substitui esse atalho temporário pelo popover real de seleção de dia. Task 3 é a verificação final ponta a ponta.

**Spec de referência:** `docs/superpowers/specs/2026-07-28-agenda-semanal-design.md`

---

## Task 1: Modelo de dados `plannedByDay` + adaptação de todos os pontos de uso

**Files:**
- Modify: `index.html:376-394` (estado e migração)
- Modify: `index.html:772` (cálculo de `isPlanned` no card)
- Modify: `index.html:832` (botão de calendário no card — atalho temporário para "dom")
- Modify: `index.html:998-1116` (`togglePlanRecipe`, `addCurrentRecipeToPlanner`, `updateModalPlannerButtonState`, `changePlannerRecipePortions`, `clearPlanner`, `savePlanner`, `updatePlannerBadge`, `renderPlanner`)
- Modify: `index.html:1119-1176` (`generateConsolidatedShoppingList`)
- Modify: `estilos.css` (adiciona estilos das seções por dia)

- [ ] **Step 1: Substituir o estado `plannedRecipes` por `plannedByDay` com migração**

  Em `index.html`, dentro do `<script>` principal, localizar o bloco atual (logo após `let shoppingList = ...`):

  ```js
  let plannedRecipes = JSON.parse(localStorage.getItem('chef_digital_planned')) || [];
  let hasMigrated = false;
  plannedRecipes = plannedRecipes.map(p => {
      if (p.portions !== undefined && p.people === undefined) {
          let servings = 1;
          if (typeof receitasData !== 'undefined' && receitasData.recipes) {
              const recipe = receitasData.recipes.find(r => r.id === p.id);
              if (recipe && recipe.servings) servings = recipe.servings;
          }
          p.people = p.portions * servings;
          delete p.portions;
          hasMigrated = true;
      }
      return p;
  });
  if (hasMigrated) {
      localStorage.setItem('chef_digital_planned', JSON.stringify(plannedRecipes));
  }
  ```

  Substituir por:

  ```js
  const WEEK_DAYS = [
      { key: 'dom', label: 'Domingo' },
      { key: 'seg', label: 'Segunda-feira' },
      { key: 'ter', label: 'Terça-feira' },
      { key: 'qua', label: 'Quarta-feira' },
      { key: 'qui', label: 'Quinta-feira' },
      { key: 'sex', label: 'Sexta-feira' },
      { key: 'sab', label: 'Sábado' }
  ];

  function createEmptyPlannedByDay() {
      const byDay = {};
      WEEK_DAYS.forEach(d => { byDay[d.key] = []; });
      return byDay;
  }

  function migratePlannedData(raw) {
      if (Array.isArray(raw)) {
          // Formato antigo: lista plana [{id, people}] ou [{id, portions}].
          // Sem informação de dia, todas as entradas antigas migram para Domingo.
          const byDay = createEmptyPlannedByDay();
          raw.forEach(p => {
              let people = p.people;
              if (p.portions !== undefined && people === undefined) {
                  let servings = 1;
                  if (typeof receitasData !== 'undefined' && receitasData.recipes) {
                      const recipe = receitasData.recipes.find(r => r.id === p.id);
                      if (recipe && recipe.servings) servings = recipe.servings;
                  }
                  people = p.portions * servings;
              }
              byDay.dom.push({ recipeId: p.id, people: people !== undefined ? people : 1 });
          });
          return { byDay, hasMigrated: true };
      }

      // Formato novo (objeto agrupado por dia): garante que as 7 chaves existem
      const byDay = createEmptyPlannedByDay();
      let hasMigrated = false;
      WEEK_DAYS.forEach(d => {
          if (raw && Array.isArray(raw[d.key])) {
              byDay[d.key] = raw[d.key];
          } else if (raw && raw[d.key] !== undefined) {
              hasMigrated = true; // valor inesperado, normaliza para array vazio
          }
      });
      return { byDay, hasMigrated };
  }

  const storedPlanned = JSON.parse(localStorage.getItem('chef_digital_planned')) || createEmptyPlannedByDay();
  const plannedMigration = migratePlannedData(storedPlanned);
  let plannedByDay = plannedMigration.byDay;
  if (plannedMigration.hasMigrated) {
      localStorage.setItem('chef_digital_planned', JSON.stringify(plannedByDay));
  }

  function getAllPlannedEntries() {
      const all = [];
      WEEK_DAYS.forEach(d => {
          plannedByDay[d.key].forEach(entry => {
              all.push({ day: d.key, recipeId: entry.recipeId, people: entry.people });
          });
      });
      return all;
  }

  function getPlannedDaysForRecipe(recipeId) {
      return WEEK_DAYS
          .filter(d => plannedByDay[d.key].some(e => e.recipeId === recipeId))
          .map(d => d.key);
  }

  function isRecipePlanned(recipeId) {
      return getPlannedDaysForRecipe(recipeId).length > 0;
  }
  ```

- [ ] **Step 2: Atualizar o cálculo de `isPlanned` no card da receita**

  Dentro de `renderRecipes()`, localizar:
  ```js
                  const isPlanned = plannedRecipes.some(p => p.id === recipe.id);
  ```
  Substituir por:
  ```js
                  const isPlanned = isRecipePlanned(recipe.id);
  ```

- [ ] **Step 3: Trocar `togglePlanRecipe`, `addCurrentRecipeToPlanner` e `updateModalPlannerButtonState` pela nova função `toggleRecipeOnDay`**

  Localizar:
  ```js
          function togglePlanRecipe(id) {
              const index = plannedRecipes.findIndex(p => p.id === id);
              if (index !== -1) {
                  plannedRecipes.splice(index, 1);
              } else {
                  const recipe = recipes.find(r => r.id === id);
                  const defaultPeople = (recipe && recipe.servings !== undefined && recipe.servings !== null) ? recipe.servings : 1;
                  plannedRecipes.push({ id: id, people: defaultPeople });
              }
              savePlanner();
              updatePlannerBadge();
              renderRecipes();
          }

          function addCurrentRecipeToPlanner() {
              togglePlanRecipe(activeRecipeId);
              updateModalPlannerButtonState(activeRecipeId);
              const isPlanned = plannedRecipes.some(p => p.id === activeRecipeId);
              showToast(isPlanned ? 'Adicionado ao menu semanal!' : 'Removido do menu semanal!');
          }

          function updateModalPlannerButtonState(id) {
              const planBtn = document.getElementById('modal-planner-btn');
              if (!planBtn) return;
              const isPlanned = plannedRecipes.some(p => p.id === id);
              const planLabel = isPlanned ? "Remover do Planejamento" : "Planejar essa refeição";
              planBtn.classList.toggle('planned-active', isPlanned);
              planBtn.title = planLabel;
              planBtn.setAttribute('aria-label', planLabel);
              planBtn.setAttribute('aria-pressed', isPlanned ? 'true' : 'false');
          }
  ```

  Substituir por (o card ainda não tem popover — este é um atalho temporário que sempre planeja em "Domingo"; a Task 2 substitui isso pelo seletor de dia real):
  ```js
          function toggleRecipeOnDay(recipeId, day) {
              const dayEntries = plannedByDay[day];
              const index = dayEntries.findIndex(e => e.recipeId === recipeId);
              let added;
              if (index !== -1) {
                  dayEntries.splice(index, 1);
                  added = false;
              } else {
                  const recipe = recipes.find(r => r.id === recipeId);
                  const defaultPeople = (recipe && recipe.servings !== undefined && recipe.servings !== null) ? recipe.servings : 1;
                  dayEntries.push({ recipeId: recipeId, people: defaultPeople });
                  added = true;
              }
              savePlanner();
              updatePlannerBadge();
              renderRecipes();
              renderPlanner();
              return added;
          }

          function addCurrentRecipeToPlanner() {
              const added = toggleRecipeOnDay(activeRecipeId, 'dom');
              updateModalPlannerButtonState(activeRecipeId);
              showToast(added ? 'Adicionado ao menu semanal (Domingo)!' : 'Removido do menu semanal!');
          }

          function updateModalPlannerButtonState(id) {
              const planBtn = document.getElementById('modal-planner-btn');
              if (!planBtn) return;
              const isPlanned = isRecipePlanned(id);
              const planLabel = isPlanned ? "Remover do Planejamento" : "Planejar essa refeição";
              planBtn.classList.toggle('planned-active', isPlanned);
              planBtn.title = planLabel;
              planBtn.setAttribute('aria-label', planLabel);
              planBtn.setAttribute('aria-pressed', isPlanned ? 'true' : 'false');
          }
  ```

- [ ] **Step 4: Atualizar o botão de calendário do card para o atalho temporário**

  Localizar:
  ```html
                                  <button onclick="togglePlanRecipe(${recipe.id})" class="card-action-btn plan-btn ${isPlanned ? 'active' : ''}" title="Planejar para a semana" aria-label="Planejar ${recipe.title} para a semana" aria-pressed="${isPlanned}">
  ```
  Substituir por:
  ```html
                                  <button onclick="toggleRecipeOnDay(${recipe.id}, 'dom')" class="card-action-btn plan-btn ${isPlanned ? 'active' : ''}" title="Planejar para a semana" aria-label="Planejar ${recipe.title} para a semana" aria-pressed="${isPlanned}">
  ```

- [ ] **Step 5: Atualizar `changePlannerRecipePortions`, `clearPlanner`, `savePlanner` e `updatePlannerBadge`**

  Localizar:
  ```js
          function changePlannerRecipePortions(id, dir) {
              const plan = plannedRecipes.find(p => p.id === id);
              if (plan) {
                  const recipe = recipes.find(r => r.id === id);
                  const isServingsMode = recipe && recipe.servings !== undefined && recipe.servings !== null;
                  const maxLimit = isServingsMode ? 20 : 10;
                  
                  let next = plan.people + dir;
                  if (next >= 1 && next <= maxLimit) {
                      plan.people = next;
                      savePlanner();
                      renderPlanner();
                  }
              }
          }

          function clearPlanner() {
              plannedRecipes = [];
              savePlanner();
              updatePlannerBadge();
              renderRecipes();
              renderPlanner();
          }

          function savePlanner() {
              localStorage.setItem('chef_digital_planned', JSON.stringify(plannedRecipes));
          }

          function updatePlannerBadge() {
              const badge = document.getElementById('planner-badge');
              if (plannedRecipes.length > 0) {
                  badge.innerText = plannedRecipes.length;
                  badge.classList.remove('hidden');
              } else {
                  badge.classList.add('hidden');
              }
          }
  ```
  Substituir por:
  ```js
          function changePlannerRecipePortions(recipeId, day, dir) {
              const entry = plannedByDay[day].find(e => e.recipeId === recipeId);
              if (entry) {
                  const recipe = recipes.find(r => r.id === recipeId);
                  const isServingsMode = recipe && recipe.servings !== undefined && recipe.servings !== null;
                  const maxLimit = isServingsMode ? 20 : 10;

                  let next = entry.people + dir;
                  if (next >= 1 && next <= maxLimit) {
                      entry.people = next;
                      savePlanner();
                      renderPlanner();
                  }
              }
          }

          function clearPlanner() {
              plannedByDay = createEmptyPlannedByDay();
              savePlanner();
              updatePlannerBadge();
              renderRecipes();
              renderPlanner();
          }

          function savePlanner() {
              localStorage.setItem('chef_digital_planned', JSON.stringify(plannedByDay));
          }

          function updatePlannerBadge() {
              const badge = document.getElementById('planner-badge');
              const count = getAllPlannedEntries().length;
              if (count > 0) {
                  badge.innerText = count;
                  badge.classList.remove('hidden');
              } else {
                  badge.classList.add('hidden');
              }
          }
  ```

- [ ] **Step 6: Reescrever `renderPlanner` como agenda agrupada por dia**

  Localizar o bloco completo de `renderPlanner` (da assinatura até o `}` de fechamento, imediatamente antes de `function generateConsolidatedShoppingList()`):
  ```js
          function renderPlanner() {
              const container = document.getElementById('planner-items');
              container.innerHTML = '';

              if (plannedRecipes.length === 0) {
                  container.innerHTML = `
                      <div class="drawer-empty-state">
                          <p>Seu Menu Semanal está vazio!</p>
                          <p class="sub">Clique no botão de calendário 📅 nos cartões para selecionar as refeições de sua preferência.</p>
                      </div>
                  `;
                  return;
              }

              plannedRecipes.forEach(p => {
                  const recipe = recipes.find(r => r.id === p.id);
                  if (!recipe) return;

                  const card = document.createElement('div');
                  card.className = 'drawer-card';
                  
                  const isServingsMode = recipe.servings !== undefined && recipe.servings !== null;
                  const displayValue = isServingsMode ? `${p.people} pessoas` : `${p.people}x`;
                  const labelText = isServingsMode ? "Pessoas:" : "Porções:";

                  card.innerHTML = `
                      <div class="drawer-card-top">
                          <div class="drawer-card-info">
                              <span class="drawer-card-emoji" role="img" aria-label="Emoji representativo de ${recipe.title}">${recipe.emoji || '🍽'}</span>
                              <div class="drawer-card-meta">
                                  <h4>${recipe.title}</h4>
                                  <span>${recipe.source || ''}</span>
                              </div>
                          </div>
                          <button onclick="togglePlanRecipe(${recipe.id}); renderPlanner();" class="drawer-card-remove" title="Remover do menu" aria-label="Remover ${recipe.title} do planejamento">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                      <div class="drawer-card-bottom">
                          <span>${labelText}</span>
                          <div class="portion-controls">
                              <button onclick="changePlannerRecipePortions(${recipe.id}, -1)" class="portion-btn" aria-label="Diminuir porções">-</button>
                              <span class="portion-value">${displayValue}</span>
                              <button onclick="changePlannerRecipePortions(${recipe.id}, 1)" class="portion-btn" aria-label="Aumentar porções">+</button>
                          </div>
                      </div>
                  `;
                  container.appendChild(card);
              });
          }
  ```
  Substituir por:
  ```js
          function renderPlannerCardHtml(entry, day) {
              const recipe = recipes.find(r => r.id === entry.recipeId);
              if (!recipe) return '';

              const isServingsMode = recipe.servings !== undefined && recipe.servings !== null;
              const displayValue = isServingsMode ? `${entry.people} pessoas` : `${entry.people}x`;
              const labelText = isServingsMode ? "Pessoas:" : "Porções:";

              return `
                  <div class="drawer-card">
                      <div class="drawer-card-top">
                          <div class="drawer-card-info">
                              <span class="drawer-card-emoji" role="img" aria-label="Emoji representativo de ${recipe.title}">${recipe.emoji || '🍽'}</span>
                              <div class="drawer-card-meta">
                                  <h4>${recipe.title}</h4>
                                  <span>${recipe.source || ''}</span>
                              </div>
                          </div>
                          <button onclick="toggleRecipeOnDay(${recipe.id}, '${day}')" class="drawer-card-remove" title="Remover do menu" aria-label="Remover ${recipe.title} do planejamento de ${day}">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                      <div class="drawer-card-bottom">
                          <span>${labelText}</span>
                          <div class="portion-controls">
                              <button onclick="changePlannerRecipePortions(${recipe.id}, '${day}', -1)" class="portion-btn" aria-label="Diminuir porções">-</button>
                              <span class="portion-value">${displayValue}</span>
                              <button onclick="changePlannerRecipePortions(${recipe.id}, '${day}', 1)" class="portion-btn" aria-label="Aumentar porções">+</button>
                          </div>
                      </div>
                  </div>
              `;
          }

          function renderPlanner() {
              const container = document.getElementById('planner-items');
              container.innerHTML = '';

              if (getAllPlannedEntries().length === 0) {
                  container.innerHTML = `
                      <div class="drawer-empty-state">
                          <p>Seu Menu Semanal está vazio!</p>
                          <p class="sub">Clique no botão de calendário 📅 nos cartões para selecionar as refeições de sua preferência.</p>
                      </div>
                  `;
                  return;
              }

              const fragment = document.createDocumentFragment();
              WEEK_DAYS.forEach(d => {
                  const dayEntries = plannedByDay[d.key];
                  const section = document.createElement('div');
                  section.className = 'planner-day-section';

                  const cardsHtml = dayEntries.length === 0
                      ? `<p class="planner-day-empty">Nenhuma receita planejada</p>`
                      : dayEntries.map(entry => renderPlannerCardHtml(entry, d.key)).join('');

                  section.innerHTML = `
                      <div class="planner-day-header">
                          <h4>${d.label}</h4>
                          ${dayEntries.length > 0 ? `<span class="planner-day-count">${dayEntries.length}</span>` : ''}
                      </div>
                      <div class="planner-day-body">
                          ${cardsHtml}
                      </div>
                  `;
                  fragment.appendChild(section);
              });
              container.appendChild(fragment);
          }
  ```

- [ ] **Step 7: Atualizar `generateConsolidatedShoppingList` para ler de todos os dias**

  Localizar:
  ```js
          function generateConsolidatedShoppingList() {
              if (plannedRecipes.length === 0) {
                  showToast('Seu menu semanal está vazio! Planeje receitas primeiro.', 'error');
                  return;
              }

              // 1. Mapear itens que já estavam marcados como comprados para manter o estado (checked)
              const checkedItemsMap = new Set();
              if (shoppingList["Menu Semanal Consolidado"]) {
                  shoppingList["Menu Semanal Consolidado"].forEach(item => {
                      if (item.checked) {
                          checkedItemsMap.add(item.name.trim().toLowerCase());
                      }
                  });
              }

              // 2. Limpar apenas o grupo do menu semanal consolidado para recriação
              shoppingList["Menu Semanal Consolidado"] = [];

              const tempConsolidated = {};

              plannedRecipes.forEach(p => {
                  const recipe = recipes.find(r => r.id === p.id);
                  if (!recipe) return;

                  recipe.ingredients.forEach(ing => {
                      const normName = ing.name.trim();
                      const normUnit = (ing.unit || "").toLowerCase().trim();
                      const key = `${normName.toLowerCase()}|${normUnit}`;

                      let scaledQty = scaleIngredientQty(ing.qty, p.people, recipe.servings);

                      if (tempConsolidated[key]) {
                          if (tempConsolidated[key].qty !== null && scaledQty !== null) {
                              tempConsolidated[key].qty += scaledQty;
                          }
                      } else {
                          // Preserva o estado 'checked' se já estava marcado antes
                          const wasChecked = checkedItemsMap.has(normName.toLowerCase());
                          tempConsolidated[key] = {
                              name: normName,
                              qty: scaledQty,
                              unit: ing.unit,
                              checked: wasChecked
                          };
                      }
                  });
              });
  ```
  Substituir por:
  ```js
          function generateConsolidatedShoppingList() {
              const allEntries = getAllPlannedEntries();
              if (allEntries.length === 0) {
                  showToast('Seu menu semanal está vazio! Planeje receitas primeiro.', 'error');
                  return;
              }

              // 1. Mapear itens que já estavam marcados como comprados para manter o estado (checked)
              const checkedItemsMap = new Set();
              if (shoppingList["Menu Semanal Consolidado"]) {
                  shoppingList["Menu Semanal Consolidado"].forEach(item => {
                      if (item.checked) {
                          checkedItemsMap.add(item.name.trim().toLowerCase());
                      }
                  });
              }

              // 2. Limpar apenas o grupo do menu semanal consolidado para recriação
              shoppingList["Menu Semanal Consolidado"] = [];

              const tempConsolidated = {};

              allEntries.forEach(p => {
                  const recipe = recipes.find(r => r.id === p.recipeId);
                  if (!recipe) return;

                  recipe.ingredients.forEach(ing => {
                      const normName = ing.name.trim();
                      const normUnit = (ing.unit || "").toLowerCase().trim();
                      const key = `${normName.toLowerCase()}|${normUnit}`;

                      let scaledQty = scaleIngredientQty(ing.qty, p.people, recipe.servings);

                      if (tempConsolidated[key]) {
                          if (tempConsolidated[key].qty !== null && scaledQty !== null) {
                              tempConsolidated[key].qty += scaledQty;
                          }
                      } else {
                          // Preserva o estado 'checked' se já estava marcado antes
                          const wasChecked = checkedItemsMap.has(normName.toLowerCase());
                          tempConsolidated[key] = {
                              name: normName,
                              qty: scaledQty,
                              unit: ing.unit,
                              checked: wasChecked
                          };
                      }
                  });
              });
  ```
  (O restante da função — conversão de `tempConsolidated` para array, `saveShoppingList()`, `updateShoppingListBadge()` e a transição de drawers — permanece inalterado.)

- [ ] **Step 8: Adicionar estilos CSS das seções por dia**

  Ao final de `estilos.css`, adicionar:
  ```css
  /* ========================================================================
     Agenda semanal por dia (drawer "Menu da Semana")
  ======================================================================== */

  .planner-day-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
  }

  .planner-day-section + .planner-day-section {
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
  }

  .planner-day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
  }

  .planner-day-header h4 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-muted);
  }

  .planner-day-count {
      font-size: 11px;
      font-weight: 700;
      color: var(--success-hover);
      background-color: var(--success-light);
      border-radius: var(--radius-full);
      padding: 2px 8px;
  }

  .planner-day-empty {
      font-size: 12px;
      color: var(--text-light);
  }

  .planner-day-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
  }
  ```

- [ ] **Step 9: Verificar manualmente que a página carrega sem erros**

  Abrir `index.html` via servidor local (ex.: `python -m http.server` na raiz do repo, acessar `http://localhost:8000`). Abrir o console de DevTools e confirmar que não há erros de JS ao carregar (a grade de receitas deve renderizar normalmente, sem nenhuma referência a `plannedRecipes` restante — buscar no arquivo por `plannedRecipes` deve retornar zero ocorrências).

- [ ] **Step 10: Verificar migração de dados antigos**

  No console do DevTools:
  ```js
  localStorage.setItem('chef_digital_planned', JSON.stringify([{ id: 1, people: 4 }]));
  location.reload();
  ```
  Depois do reload, executar `JSON.parse(localStorage.getItem('chef_digital_planned'))` e confirmar que o resultado é um objeto com as 7 chaves (`dom, seg, ter, qua, qui, sex, sab`) e que `dom` contém `[{recipeId: 1, people: 4}]`.

- [ ] **Step 11: Verificar o atalho temporário e a agenda por dia**

  1. Limpar `localStorage.chef_digital_planned` e recarregar.
  2. Clicar no botão de calendário 📅 de um card — a receita deve ser adicionada (o card fica com o selo "Planejado").
  3. Abrir o drawer "Menu da Semana" e confirmar que a receita aparece na seção "Domingo" (as outras 6 seções mostram "Nenhuma receita planejada").
  4. Ajustar as porções com os botões `+`/`-` da seção "Domingo" e confirmar que o valor muda e persiste após reabrir o drawer.
  5. Clicar em "Limpar Menu" e confirmar que todas as seções voltam a "Nenhuma receita planejada" e o badge do ícone de calendário desaparece.
  6. Planejar uma receita e clicar em "Consolidar Lista de Compras"; confirmar que a lista gerada contém os ingredientes esperados (comportamento igual ao anterior à mudança).

- [ ] **Step 12: Commit**

  ```bash
  git add index.html estilos.css
  git commit -m "feat: migra planejamento semanal para agenda agrupada por dia

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  ```

---

## Task 2: Popover de seleção de dia no botão de calendário

**Files:**
- Modify: `index.html:832` (botão de calendário no card — troca o atalho temporário pelo popover)
- Modify: `index.html:270` (botão de calendário no modal de receita)
- Modify: `index.html` (remove `addCurrentRecipeToPlanner`; adiciona funções de popover)
- Modify: `estilos.css` (adiciona estilos do popover)

- [ ] **Step 1: Atualizar o botão de calendário do card para abrir o popover**

  Localizar (resultado da Task 1, Step 4):
  ```html
                                  <button onclick="toggleRecipeOnDay(${recipe.id}, 'dom')" class="card-action-btn plan-btn ${isPlanned ? 'active' : ''}" title="Planejar para a semana" aria-label="Planejar ${recipe.title} para a semana" aria-pressed="${isPlanned}">
  ```
  Substituir por:
  ```html
                                  <button onclick="openDayPickerPopover(${recipe.id}, this)" class="card-action-btn plan-btn ${isPlanned ? 'active' : ''}" title="Planejar para a semana" aria-label="Planejar ${recipe.title} para a semana" aria-pressed="${isPlanned}">
  ```

- [ ] **Step 2: Atualizar o botão de calendário do modal de receita**

  Localizar:
  ```html
                <button id="modal-planner-btn" onclick="addCurrentRecipeToPlanner()" class="modal-planner-btn" title="Planejar essa refeição" aria-label="Planejar essa refeição" aria-pressed="false">
  ```
  Substituir por:
  ```html
                <button id="modal-planner-btn" onclick="openDayPickerPopover(activeRecipeId, this)" class="modal-planner-btn" title="Planejar essa refeição" aria-label="Planejar essa refeição" aria-pressed="false">
  ```

- [ ] **Step 3: Remover `addCurrentRecipeToPlanner` (não é mais chamada por nenhum botão) e adicionar as funções do popover**

  Localizar:
  ```js
          function addCurrentRecipeToPlanner() {
              const added = toggleRecipeOnDay(activeRecipeId, 'dom');
              updateModalPlannerButtonState(activeRecipeId);
              showToast(added ? 'Adicionado ao menu semanal (Domingo)!' : 'Removido do menu semanal!');
          }

          function updateModalPlannerButtonState(id) {
  ```
  Substituir por:
  ```js
          let dayPickerRecipeId = null;

          function openDayPickerPopover(recipeId, anchorEl) {
              closeDayPickerPopover();
              dayPickerRecipeId = recipeId;

              const plannedDays = getPlannedDaysForRecipe(recipeId);
              const popover = document.createElement('div');
              popover.id = 'day-picker-popover';
              popover.className = 'day-picker-popover';
              popover.innerHTML = WEEK_DAYS.map(d => `
                  <button type="button" class="day-picker-option ${plannedDays.includes(d.key) ? 'active' : ''}" data-day="${d.key}" onclick="handleDayPickerChoice('${d.key}')">
                      <span>${d.label}</span>
                      ${plannedDays.includes(d.key) ? '<span class="day-picker-check">✓</span>' : ''}
                  </button>
              `).join('');

              document.body.appendChild(popover);

              const rect = anchorEl.getBoundingClientRect();
              const popoverWidth = 200;
              popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
              popover.style.left = `${Math.min(
                  Math.max(8, rect.left + window.scrollX - popoverWidth + rect.width),
                  window.innerWidth - popoverWidth - 8
              )}px`;

              document.addEventListener('click', handleDayPickerOutsideClick, { capture: true });
          }

          function handleDayPickerChoice(day) {
              if (dayPickerRecipeId === null) return;
              const dayLabel = WEEK_DAYS.find(d => d.key === day).label;
              const added = toggleRecipeOnDay(dayPickerRecipeId, day);
              showToast(added ? `Adicionado ao menu de ${dayLabel}!` : `Removido do menu de ${dayLabel}!`);
              updateModalPlannerButtonState(dayPickerRecipeId);

              const popover = document.getElementById('day-picker-popover');
              if (!popover) return;
              const plannedDays = getPlannedDaysForRecipe(dayPickerRecipeId);
              popover.querySelectorAll('.day-picker-option').forEach(btn => {
                  const isActive = plannedDays.includes(btn.dataset.day);
                  btn.classList.toggle('active', isActive);
                  const existingCheck = btn.querySelector('.day-picker-check');
                  if (existingCheck) existingCheck.remove();
                  if (isActive) {
                      btn.insertAdjacentHTML('beforeend', '<span class="day-picker-check">✓</span>');
                  }
              });
          }

          function handleDayPickerOutsideClick(e) {
              const popover = document.getElementById('day-picker-popover');
              if (!popover) return;
              if (popover.contains(e.target)) return;
              closeDayPickerPopover();
          }

          function closeDayPickerPopover() {
              const popover = document.getElementById('day-picker-popover');
              if (popover) popover.remove();
              document.removeEventListener('click', handleDayPickerOutsideClick, { capture: true });
              dayPickerRecipeId = null;
          }

          function updateModalPlannerButtonState(id) {
  ```

  (A função `updateModalPlannerButtonState` em si permanece exatamente como já está — apenas garantimos que a chave `function updateModalPlannerButtonState(id) {` continua presente após o bloco novo, sem duplicar sua implementação.)

- [ ] **Step 4: Adicionar estilos CSS do popover**

  Ao final de `estilos.css` (após os estilos adicionados na Task 1), adicionar:
  ```css
  /* ========================================================================
     Day Picker Popover (seleção de dia da semana no botão de calendário)
  ======================================================================== */

  .day-picker-popover {
      position: absolute;
      z-index: 60;
      display: flex;
      flex-direction: column;
      width: 200px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-dark);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 6px;
      gap: 2px;
  }

  .day-picker-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 10px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-main);
      border-radius: var(--radius-sm);
      text-align: left;
      transition: background-color var(--transition-fast), color var(--transition-fast);
  }

  .day-picker-option:hover {
      background-color: var(--bg-light);
  }

  .day-picker-option.active {
      color: var(--success-hover);
      background-color: var(--success-light);
      font-weight: 700;
  }

  .day-picker-check {
      font-size: 13px;
  }
  ```

- [ ] **Step 5: Verificar manualmente no navegador**

  Abrir `index.html` via servidor local. Clicar no botão de calendário 📅 de um card:
  - O popover deve abrir com os 7 dias listados.
  - Clicar em "Segunda-feira" deve marcá-la (fundo verde, ✓) e mostrar um toast "Adicionado ao menu de Segunda-feira!".
  - Clicar novamente em "Segunda-feira" deve desmarcá-la e mostrar "Removido do menu de Segunda-feira!".
  - Clicar em "Terça-feira" enquanto "Segunda-feira" já está marcada deve manter ambas marcadas (múltiplos dias) — confirmar abrindo o drawer "Menu da Semana" e vendo a receita nas duas seções.
  - Clicar fora do popover deve fechá-lo.
  - Abrir o modal de uma receita e repetir o teste usando o botão de calendário do modal (`#modal-planner-btn`); o rótulo do botão deve alternar entre "Planejar essa refeição" e "Remover do Planejamento" conforme o estado.

- [ ] **Step 6: Commit**

  ```bash
  git add index.html estilos.css
  git commit -m "feat: adiciona popover de seleção de dia para planejar receitas

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  ```

---

## Task 3: Verificação final ponta a ponta

**Files:** nenhum arquivo novo — apenas verificação manual cobrindo a seção "Verificação" da spec.

- [ ] **Step 1: Repetir o roteiro completo da spec**

  Com `index.html` aberto via servidor local:
  1. Planejar uma receita em 2 dias diferentes via popover do card (não do modal) e confirmar que aparece nas duas seções do drawer, com porções independentes.
  2. Remover uma ocorrência específica de um dos dias e confirmar que a receita permanece no outro dia.
  3. Ajustar as porções de cada ocorrência para valores diferentes (ex.: 2 no Domingo, 3 na Quarta-feira), gerar a lista de compras consolidada e confirmar que os ingredientes aparecem somados para o total combinado (2 + 3), sem duplicar como entradas separadas.
  4. No console do DevTools, simular dado antigo:
     ```js
     localStorage.setItem('chef_digital_planned', JSON.stringify([{ id: 1, people: 2 }]));
     location.reload();
     ```
     Abrir o drawer "Menu da Semana" e confirmar que a receita de id `1` aparece na seção "Domingo".
  5. Redimensionar a janela do navegador (ou usar o modo de dispositivo móvel do DevTools) para simular tablet/celular e confirmar que a agenda por dia e o popover permanecem legíveis e utilizáveis com toque (alvos de toque de pelo menos 44px, conforme o restante do app).

- [ ] **Step 2: Revisão visual rápida de contraste e uso de amber**

  Conferir visualmente que os novos elementos (popover de dias, cabeçalhos de seção do dia, badge de contagem) não introduzem uso de `--primary-color` (amber) fora do já existente, mantendo a regra do `DESIGN.md` de reservar amber para estados de marca/ativo com pouca área de tela. Os novos estados "ativo" usam as cores de sucesso (verde), como no `plan-btn` já existente.

- [ ] **Step 3: Commit final (se houver ajustes)**

  Caso algum ajuste tenha sido necessário durante a verificação, commitar separadamente:
  ```bash
  git add index.html estilos.css
  git commit -m "fix: ajustes finais da agenda semanal após verificação manual

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  ```

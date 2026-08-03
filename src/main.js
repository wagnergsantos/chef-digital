import { supabase } from './supabase.js';
import { salvarCacheLocal, lerCacheLocal } from './cache.js';
import { registerSW } from 'virtual:pwa-register';
import { state, WEEK_DAYS } from './modules/state.js';
import { toggleTheme, updateThemeToggleIcon, initTheme } from './modules/theme.js';
import {
    escapeHtml,
    normalizeSearchText,
    recipeIsFullyStocked,
    recipeHasAnyPantryIngredient,
    matchRecipeSearch,
    debounce,
    renderCategoryFilters,
    selectCategory,
    toggleFavoritesOnly,
    debouncedRenderRecipes,
    filterRecipes,
    clearSearch,
    updateClearFiltersBtnVisibility,
    clearAllFilters,
    renderRecipes,
    setRenderDependencies,
    initRecipesGridDelegation
} from './modules/recipes-render.js';

registerSW({ immediate: true });


        // App States imported from ./modules/state.js

        function createEmptyPlannedByDay() {
            const byDay = {};
            WEEK_DAYS.forEach(d => { byDay[d.key] = []; });
            return byDay;
        }

        function migratePlannedData(raw, recipesList = []) {
            if (Array.isArray(raw)) {
                // Formato antigo: lista plana [{id, people}] ou [{id, portions}].
                // Sem informação de dia, todas as entradas antigas migram para Domingo.
                const byDay = createEmptyPlannedByDay();
                raw.forEach(p => {
                    const targetId = p.id !== undefined ? p.id : p.recipeId;
                    let people = p.people;
                    if (p.portions !== undefined && people === undefined) {
                        let servings = 1;
                        if (Array.isArray(recipesList) && recipesList.length > 0) {
                            const recipe = recipesList.find(r => String(r.id) === String(targetId));
                            if (recipe && recipe.servings) servings = recipe.servings;
                        }
                        people = p.portions * servings;
                    }
                    byDay.dom.push({ recipeId: targetId, people: people !== undefined ? people : 1 });
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

        state.plannedByDay = createEmptyPlannedByDay();

        function carregarPlannerData(recipesList = state.recipes) {
            let storedPlanned = null;
            try {
                const item = localStorage.getItem('chef_digital_planned');
                if (item) storedPlanned = JSON.parse(item);
            } catch (e) {
                console.warn('Erro ao ler chef_digital_planned do localStorage:', e);
                storedPlanned = null;
            }
            const plannedMigration = migratePlannedData(storedPlanned, recipesList);
            state.plannedByDay = plannedMigration.byDay;
            if (plannedMigration.hasMigrated) {
                if (!Array.isArray(storedPlanned) || (Array.isArray(recipesList) && recipesList.length > 0)) {
                    try {
                        localStorage.setItem('chef_digital_planned', JSON.stringify(state.plannedByDay));
                    } catch (e) {
                        console.warn('Erro ao salvar chef_digital_planned no localStorage:', e);
                    }
                }
            }
        }

        carregarPlannerData(state.recipes);

        function getAllPlannedEntries() {
            const all = [];
            WEEK_DAYS.forEach(d => {
                state.plannedByDay[d.key].forEach(entry => {
                    all.push({ day: d.key, recipeId: entry.recipeId, people: entry.people });
                });
            });
            return all;
        }

        function getPlannedDaysForRecipe(recipeId) {
            return WEEK_DAYS
                .filter(d => state.plannedByDay[d.key].some(e => e.recipeId === recipeId))
                .map(d => d.key);
        }

        function isRecipePlanned(recipeId) {
            return getPlannedDaysForRecipe(recipeId).length > 0;
        }
        let activeRecipePortions = 1;
        let activeRecipeId = null;
                let wakeLockSentinel = null;
        let wakeLockUserDisabled = false; // intenção do usuário nesta sessão de visualização (não persiste)
                


        // escapeHtml → imported from ./modules/recipes-render.js

        function scaleIngredientQty(qty, activePortions, servings) {
            if (qty === null || qty === undefined) return null;
            const numPortions = parseFloat(activePortions);
            if (isNaN(numPortions)) return qty;
            if (servings !== undefined && servings !== null && servings !== '') {
                const numServings = parseFloat(servings);
                if (!isNaN(numServings) && numServings > 0) {
                    return qty * (numPortions / numServings);
                }
            }
            return qty * numPortions;
        }

        // normalizeSearchText, recipeIsFullyStocked, recipeHasAnyPantryIngredient, matchRecipeSearch
        // → imported from ./modules/recipes-render.js

        // Document Ready init
        

        // Toast feedback notification system
        function showToast(message, type = 'success') {
    window.showToast = showToast;
            const existing = document.querySelector('.toast-message');
            if (existing) {
                existing.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = `toast-message toast-${type}`;
            
            let icon = '';
            if (type === 'success') {
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
            } else if (type === 'error') {
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
            }
            
            toast.innerHTML = `${icon}<span>${message}</span>`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.transition = 'opacity 0.24s cubic-bezier(0.25, 1, 0.5, 1), transform 0.24s cubic-bezier(0.25, 1, 0.5, 1)';
                toast.style.opacity = '0';
                toast.style.transform = 'translate(-50%, 12px)';
                setTimeout(() => {
                    toast.remove();
                }, 240);
            }, 2000);
        }

        // renderCategoryFilters, selectCategory, toggleFavoritesOnly, debounce,
        // debouncedRenderRecipes, filterRecipes, clearSearch, updateClearFiltersBtnVisibility,
        // clearAllFilters, renderRecipes → imported from ./modules/recipes-render.js



        // Favorite Toggle functionality
        function toggleFavorite(id) {
            if (state.favorites.includes(id)) {
                state.favorites = state.favorites.filter(favId => favId !== id);
            } else {
                state.favorites.push(id);
            }
            localStorage.setItem('chef_digital_favorites', JSON.stringify(state.favorites));
            renderRecipes();
        }

        // Focus trap and keydown event handling helper for accessibility
        let previouslyFocusedElement = null;

        function trapFocus(e, containerId) {
            const container = document.getElementById(containerId);
            const focusableEls = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableEls.length === 0) return;
            const firstFocusableEl = focusableEls[0];
            const lastFocusableEl = focusableEls[focusableEls.length - 1];

            const isTabPressed = (e.key === 'Tab' || e.keyCode === 9);

            if (!isTabPressed) {
                return;
            }

            if (e.shiftKey) { /* shift + tab */
                if (document.activeElement === firstFocusableEl) {
                    lastFocusableEl.focus();
                    e.preventDefault();
                }
            } else { /* tab */
                if (document.activeElement === lastFocusableEl) {
                    firstFocusableEl.focus();
                    e.preventDefault();
                }
            }
        }

        // Global key listener for Esc and dialog focus trap
        document.addEventListener('keydown', function(e) {
            const modal = document.getElementById('recipe-modal');
            const pantryModal = document.getElementById('pantry-modal');
            const planner = document.getElementById('planner-drawer');
            const shopping = document.getElementById('shopping-list-drawer');

            if (e.key === 'Escape' || e.keyCode === 27) {
                const dayPickerPopover = document.getElementById('day-picker-popover');
                if (dayPickerPopover) {
                    closeDayPickerPopover();
                } else if (modal.classList.contains('open')) {
                    closeRecipeModal();
                } else if (pantryModal && pantryModal.classList.contains('open')) {
                    closePantryModal();
                } else if (planner.classList.contains('open') || shopping.classList.contains('open')) {
                    closeAllDrawers();
                }
            }

            if (modal.classList.contains('open')) {
                trapFocus(e, 'recipe-modal-content');
            } else if (pantryModal && pantryModal.classList.contains('open')) {
                trapFocus(e, 'pantry-modal-content');
            } else if (planner.classList.contains('open')) {
                trapFocus(e, 'planner-drawer');
            } else if (shopping.classList.contains('open')) {
                trapFocus(e, 'shopping-list-drawer');
            }
        });

        // Print support: clears the printing state whether the dialog was
        // confirmed or cancelled (the browser fires 'afterprint' in both cases).
        window.addEventListener('afterprint', () => {
            delete document.documentElement.dataset.printing;
        });

        // Drawer Toggle & Core logic
        function togglePlanner() {
            const drawer = document.getElementById('planner-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            
            if (drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                backdrop.classList.remove('active');
                if (previouslyFocusedElement) {
                    previouslyFocusedElement.focus();
                    previouslyFocusedElement = null;
                }
            } else {
                // If shopping drawer is open, close it first
                const shopDrawer = document.getElementById('shopping-list-drawer');
                if (shopDrawer.classList.contains('open')) {
                    shopDrawer.classList.remove('open');
                }
                previouslyFocusedElement = document.activeElement;
                drawer.classList.add('open');
                backdrop.classList.add('active');
                renderPlanner();
                setTimeout(() => {
                    const firstEl = drawer.querySelector('button, input');
                    if (firstEl) firstEl.focus();
                }, 100);
            }
        }

        function toggleShoppingList() {
            const drawer = document.getElementById('shopping-list-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            
            if (drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                backdrop.classList.remove('active');
                if (previouslyFocusedElement) {
                    previouslyFocusedElement.focus();
                    previouslyFocusedElement = null;
                }
            } else {
                // If planner is open, close it first
                const plannerDrawer = document.getElementById('planner-drawer');
                if (plannerDrawer.classList.contains('open')) {
                    plannerDrawer.classList.remove('open');
                }
                previouslyFocusedElement = document.activeElement;
                drawer.classList.add('open');
                backdrop.classList.add('active');
                renderShoppingList();
                setTimeout(() => {
                    const firstEl = drawer.querySelector('button, input');
                    if (firstEl) firstEl.focus();
                }, 100);
            }
        }

        function closeAllDrawers() {
            document.getElementById('planner-drawer').classList.remove('open');
            document.getElementById('shopping-list-drawer').classList.remove('open');
            document.getElementById('drawer-backdrop').classList.remove('active');
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
                previouslyFocusedElement = null;
            }
        }

        function toggleRecipeOnDay(recipeId, day) {
            const dayEntries = state.plannedByDay[day];
            const index = dayEntries.findIndex(e => e.recipeId === recipeId);
            let added;
            if (index !== -1) {
                dayEntries.splice(index, 1);
                added = false;
            } else {
                const recipe = state.recipes.find(r => r.id === recipeId);
                const parsedServings = (recipe && recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
                const defaultPeople = !isNaN(parsedServings) && parsedServings > 0 ? parsedServings : 1;
                dayEntries.push({ recipeId: recipeId, people: defaultPeople });
                added = true;
            }
            savePlanner();
            updatePlannerBadge();
            renderRecipes();
            renderPlanner();
            return added;
        }

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
            const planBtn = document.getElementById('modal-planner-btn');
            if (!planBtn) return;
            const isPlanned = isRecipePlanned(id);
            const planLabel = isPlanned ? "Remover do Planejamento" : "Planejar essa refeição";
            planBtn.classList.toggle('planned-active', isPlanned);
            planBtn.title = planLabel;
            planBtn.setAttribute('aria-label', planLabel);
            planBtn.setAttribute('aria-pressed', isPlanned ? 'true' : 'false');
        }

        function changePlannerRecipePortions(recipeId, day, dir) {
            const entry = state.plannedByDay[day].find(e => e.recipeId === recipeId);
            if (entry) {
                const recipe = state.recipes.find(r => r.id === recipeId);
                const parsedServings = (recipe && recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
                const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
                const maxLimit = isServingsMode ? 20 : 10;

                let current = parseInt(entry.people, 10);
                if (isNaN(current)) {
                    current = isServingsMode ? parsedServings : 1;
                }

                let next = current + parseInt(dir, 10);
                if (next >= 1 && next <= maxLimit) {
                    entry.people = next;
                    savePlanner();
                    renderPlanner();
                }
            }
        }

        function clearPlanner() {
            state.plannedByDay = createEmptyPlannedByDay();
            savePlanner();
            updatePlannerBadge();
            renderRecipes();
            renderPlanner();
        }

        function savePlanner() {
            localStorage.setItem('chef_digital_planned', JSON.stringify(state.plannedByDay));
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

        function renderPlannerCardHtml(entry, day) {
            const recipe = state.recipes.find(r => r.id === entry.recipeId);
            if (!recipe) return '';

            const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
            const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
            const currentPeople = parseInt(entry.people, 10) || 1;
            const displayValue = isServingsMode ? `${currentPeople} pessoas` : `${currentPeople}x`;
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
                const dayEntries = state.plannedByDay[d.key];
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

        function generateConsolidatedShoppingList() {
            const allEntries = getAllPlannedEntries();
            if (allEntries.length === 0) {
                showToast('Seu menu semanal está vazio! Planeje receitas primeiro.', 'error');
                return;
            }

            // 1. Mapear itens que já estavam marcados como comprados para manter o estado (checked)
            const checkedItemsMap = new Set();
            if (state.shoppingList["Menu Semanal Consolidado"]) {
                state.shoppingList["Menu Semanal Consolidado"].forEach(item => {
                    if (item.checked) {
                        checkedItemsMap.add(item.name.trim().toLowerCase());
                    }
                });
            }

            // 2. Limpar apenas o grupo do menu semanal consolidado para recriação
            state.shoppingList["Menu Semanal Consolidado"] = [];

            const tempConsolidated = {};

            allEntries.forEach(p => {
                const recipe = state.recipes.find(r => r.id === p.recipeId);
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

            // 3. Converter de mapa para array no grupo correspondente da lista de compras
            Object.keys(tempConsolidated).forEach(k => {
                state.shoppingList["Menu Semanal Consolidado"].push(tempConsolidated[k]);
            });

            saveShoppingList();
            updateShoppingListBadge();
            
            // Transição suave de drawers
            document.getElementById('planner-drawer').classList.remove('open');
            setTimeout(() => {
                toggleShoppingList();
            }, 250);
        }

        // Add ingredients to local list
        function addCurrentRecipeToShoppingList() {
            const recipe = state.recipes.find(r => r.id === activeRecipeId);
            if (!recipe) return;

            if (!state.shoppingList[recipe.title]) {
                state.shoppingList[recipe.title] = [];
            }

            recipe.ingredients.forEach(ing => {
                // Check if already in list to avoid duplicates
                const exists = state.shoppingList[recipe.title].some(item => item.name === ing.name);
                if (!exists) {
                    let qtyVal = scaleIngredientQty(ing.qty, activeRecipePortions, recipe.servings);
                    state.shoppingList[recipe.title].push({
                        name: ing.name,
                        qty: qtyVal,
                        unit: ing.unit,
                        checked: false
                    });
                }
            });

            saveShoppingList();
            updateShoppingListBadge();
            showToast('Ingredientes adicionados à Lista!');
        }

        function saveShoppingList() {
            localStorage.setItem('chef_digital_shopping', JSON.stringify(state.shoppingList));
        }

        function updateShoppingListBadge() {
            const badge = document.getElementById('shopping-list-badge');
            let count = 0;
            Object.keys(state.shoppingList).forEach(key => {
                count += state.shoppingList[key].length;
            });

            if (count > 0) {
                badge.innerText = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        // Render shopping items compiled by recipes
        function renderShoppingList() {
            const container = document.getElementById('shopping-list-items');
            container.innerHTML = '';

            const keys = Object.keys(state.shoppingList);
            if (keys.length === 0) {
                container.innerHTML = `
                    <div class="drawer-empty-state">
                        <p>Sua lista está vazia!</p>
                        <p class="sub">Abra uma receita e adicione ingredientes clicando no botão de lista.</p>
                    </div>
                `;
                return;
            }

            keys.forEach(recipeTitle => {
                const items = state.shoppingList[recipeTitle];
                if (items.length === 0) return;

                const section = document.createElement('div');
                section.className = "shopping-section";
                
                section.innerHTML = `
                    <div class="shopping-section-header">
                        <h4>${recipeTitle}</h4>
                        <button onclick="removeRecipeFromShoppingList('${recipeTitle}')" class="drawer-card-remove" title="Remover grupo de compras" aria-label="Remover grupo de compras de ${recipeTitle}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                `;

                const list = document.createElement('ul');
                list.className = "shopping-list-items-wrapper";

                items.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.className = "shopping-item-li";
                    
                    let displayQty = '';
                    if (item.qty !== null) {
                        const formattedQty = Number(item.qty.toFixed(2)).toString();
                        displayQty = ` - <span class="qty-span">${formattedQty} ${item.unit}</span>`;
                    } else if (item.unit) {
                        displayQty = ` - <span class="qty-span">${item.unit}</span>`;
                    }

                    const rawQtyText = displayQty ? `, quantidade ${item.qty !== null ? Number(item.qty.toFixed(2)).toString() : ''} ${item.unit}` : '';
                    li.innerHTML = `
                        <div class="shopping-checkbox-wrapper" onclick="toggleShoppingItemCheck('${recipeTitle}', ${index})" role="checkbox" aria-checked="${item.checked}" tabindex="0" onkeydown="if(event.key === ' ' || event.key === 'Enter') { toggleShoppingItemCheck('${recipeTitle}', ${index}); event.preventDefault(); }" aria-label="${item.name}${rawQtyText}">
                            <div class="shopping-checkbox ${item.checked ? 'checked' : ''}">
                                ${item.checked ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
                            </div>
                            <span class="shopping-item-name ${item.checked ? 'checked' : ''}">${item.name}${displayQty}</span>
                        </div>
                    `;
                    list.appendChild(li);
                });

                section.appendChild(list);
                container.appendChild(section);
            });
        }

        function toggleShoppingItemCheck(recipeTitle, index) {
            state.shoppingList[recipeTitle][index].checked = !state.shoppingList[recipeTitle][index].checked;
            saveShoppingList();
            renderShoppingList();
        }

        function removeRecipeFromShoppingList(recipeTitle) {
            delete state.shoppingList[recipeTitle];
            saveShoppingList();
            updateShoppingListBadge();
            renderShoppingList();
        }

        function clearShoppingList() {
            state.shoppingList = {};
            saveShoppingList();
            updateShoppingListBadge();
            renderShoppingList();
        }

        // Copy shopping checklist content to device clipboard
        function copyShoppingList() {
            let text = "🛒 MINHA LISTA DE COMPRAS - CHEF DIGITAL\n\n";
            let empty = true;

            Object.keys(state.shoppingList).forEach(recipeTitle => {
                const items = state.shoppingList[recipeTitle];
                if (items.length > 0) {
                    empty = false;
                    text += `■ ${recipeTitle.toUpperCase()}\n`;
                    items.forEach(item => {
                        const checkChar = item.checked ? "[x]" : "[ ]";
                        const qtyText = item.qty ? ` (${item.qty} ${item.unit})` : (item.unit ? ` (${item.unit})` : '');
                        text += `  ${checkChar} ${item.name}${qtyText}\n`;
                    });
                    text += "\n";
                }
            });

            if (empty) {
                showToast('Sua lista está vazia para ser copiada!', 'error');
                return;
            }

            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('Lista copiada para a área de transferência!');
            } catch (err) {
                showToast('Erro ao tentar copiar a lista.', 'error');
            }
            document.body.removeChild(textArea);
        }

        // Recipe View Modal details logic
        function openRecipeModal(id) {
            activeRecipeId = id;
            const recipe = state.recipes.find(r => r.id === id);
            if (!recipe) return;

            const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
            const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
            if (isServingsMode) {
                activeRecipePortions = parsedServings;
                document.getElementById('portions-multiplier').innerText = `${activeRecipePortions} pessoas`;
            } else {
                activeRecipePortions = 1;
                document.getElementById('portions-multiplier').innerText = `${activeRecipePortions}x`;
            }

            // Handle background image in modal header banner
            const banner = document.querySelector('.modal-header-banner');
            if (banner) {
                const hasImg = recipe.image && recipe.image.trim() !== "";
                if (hasImg) {
                    banner.classList.add('has-image');
                    banner.style.backgroundImage = `url('${recipe.image}')`;
                } else {
                    banner.classList.remove('has-image');
                    banner.style.backgroundImage = '';
                }
            }

            document.getElementById('modal-title').innerText = recipe.title;
            
            // Represent multi-categories on the modal header
            let catText = '';
            if (Array.isArray(recipe.category)) {
                catText = recipe.category.map(cat => state.categories[cat] || cat).join(' | ');
            } else {
                catText = state.categories[recipe.category] || recipe.category;
            }
            document.getElementById('modal-category-badge').innerText = catText;
            const modalSourceBadge = document.getElementById('modal-source-badge');
            if (recipe.source) {
                modalSourceBadge.innerText = recipe.source;
                modalSourceBadge.style.display = 'inline-block';
            } else {
                modalSourceBadge.innerText = '';
                modalSourceBadge.style.display = 'none';
            }
            const modalServingsBadge = document.getElementById('modal-servings-badge');
            if (recipe.servings) {
                modalServingsBadge.innerText = `🍽️ Rende: ${recipe.servings}`;
                modalServingsBadge.style.display = 'inline-block';
            } else {
                modalServingsBadge.innerText = '';
                modalServingsBadge.style.display = 'none';
            }

            // Adjust modal planner icon button state
            updateModalPlannerButtonState(id);

            // Build Ingredients
            updateIngredientsList();

            // Build Steps
            const stepsList = document.getElementById('modal-steps-list');
            stepsList.innerHTML = '';
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

            // Build Tip Box
            const tipContainer = document.getElementById('modal-tips-container');
            const tipText = document.getElementById('modal-tips-text');
            if (recipe.tips) {
                tipText.innerText = recipe.tips;
                tipContainer.classList.remove('hidden');
            } else {
                tipContainer.classList.add('hidden');
            }

            // Open animations
            const modal = document.getElementById('recipe-modal');
            previouslyFocusedElement = document.activeElement;
            modal.classList.add('open');
            setTimeout(() => {
                const closeBtn = modal.querySelector('.modal-close-btn');
                if (closeBtn) closeBtn.focus();
            }, 100);

            wakeLockUserDisabled = false;
            updateWakeLockToggleButton();
            acquireWakeLock();
        }

        function closeRecipeModal() {
            releaseWakeLock();
            const modal = document.getElementById('recipe-modal');
            modal.classList.remove('open');
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
                previouslyFocusedElement = null;
            }
        }

        function closeRecipeModalOnBackdrop(e) {
            if (e.target.id === 'recipe-modal') {
                closeRecipeModal();
            }
        }

        // Screen Wake Lock: mantém a tela ativa enquanto o modal de receita
        // estiver aberto (ativado por padrão), com desativação manual opcional
        // via botão no modal (não persiste entre aberturas).
        async function acquireWakeLock() {
            if (!('wakeLock' in navigator)) return; // navegador sem suporte, sem indicador
            if (wakeLockUserDisabled) return; // usuário desativou manualmente para esta receita
            try {
                wakeLockSentinel = await navigator.wakeLock.request('screen');
                wakeLockSentinel.addEventListener('release', () => {
                    wakeLockSentinel = null;
                    updateWakeLockIndicator();
                });
                updateWakeLockIndicator();
            } catch (e) {
                // Falha silenciosa (ex: bateria fraca, NotAllowedError) — app segue normalmente sem o wake lock.
                wakeLockSentinel = null;
            }
        }

        function releaseWakeLock() {
            if (wakeLockSentinel) {
                wakeLockSentinel.release();
                wakeLockSentinel = null;
            }
            updateWakeLockIndicator();
        }

        function toggleWakeLock() {
            if (wakeLockUserDisabled) {
                wakeLockUserDisabled = false;
                acquireWakeLock();
            } else {
                wakeLockUserDisabled = true;
                releaseWakeLock();
            }
            updateWakeLockToggleButton();
        }

        function updateWakeLockIndicator() {
            const indicator = document.getElementById('wake-lock-indicator');
            if (!indicator) return;
            indicator.classList.toggle('visible', wakeLockSentinel !== null);
        }

        function updateWakeLockToggleButton() {
            const btn = document.getElementById('wake-lock-toggle-btn');
            if (!btn) return;
            const isEnabled = !wakeLockUserDisabled;
            const label = isEnabled ? 'Manter tela ativa (ativado)' : 'Manter tela ativa (desativado)';
            btn.setAttribute('aria-pressed', String(isEnabled));
            btn.setAttribute('aria-label', label);
            btn.setAttribute('title', label);
            btn.classList.toggle('wakelock-active', isEnabled);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && activeRecipeId !== null && !wakeLockSentinel && !wakeLockUserDisabled) {
                acquireWakeLock();
            }
        });

        // Print helpers: mark which container should be revealed by the
        // @media print rules, then trigger the browser's native print dialog.
        function printRecipe() {
            document.documentElement.dataset.printing = 'recipe';
            window.print();
        }

        function printShoppingList() {
            document.documentElement.dataset.printing = 'shopping';
            window.print();
        }

        function printPlanner() {
            document.documentElement.dataset.printing = 'planner';
            window.print();
        }

        // Adjust serving size multiplier
        function changePortions(dir) {
            const recipe = state.recipes.find(r => r.id === activeRecipeId);
            if (!recipe) return;

            const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
            const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
            const maxLimit = isServingsMode ? 20 : 10;

            let current = parseInt(activeRecipePortions, 10);
            if (isNaN(current)) {
                current = isServingsMode ? parsedServings : 1;
            }

            let next = current + parseInt(dir, 10);

            if (next >= 1 && next <= maxLimit) {
                activeRecipePortions = next;
                if (isServingsMode) {
                    document.getElementById('portions-multiplier').innerText = `${activeRecipePortions} pessoas`;
                } else {
                    document.getElementById('portions-multiplier').innerText = `${activeRecipePortions}x`;
                }
                updateIngredientsList();
            }
        }

        // Render ingredients based on multiplication portion factor
        function updateIngredientsList() {
            const recipe = state.recipes.find(r => r.id === activeRecipeId);
            if (!recipe) return;

            const list = document.getElementById('modal-ingredients-list');
            list.innerHTML = '';

            recipe.ingredients.forEach(ing => {
                const li = document.createElement('li');
                li.className = "modal-ingredients-li";
                
                let qtyDisplay = '';
                if (ing.qty !== null) {
                    const scaledQty = scaleIngredientQty(ing.qty, activeRecipePortions, recipe.servings);
                    const formattedQty = Number(scaledQty.toFixed(2)).toString();
                    qtyDisplay = `<strong class="ing-qty-tag">${formattedQty} ${ing.unit}</strong>`;
                } else if (ing.unit) {
                    qtyDisplay = `<strong class="ing-unit-only-tag">${ing.unit}</strong>`;
                }

                li.innerHTML = `
                    <div class="ing-checkbox" role="checkbox" aria-checked="false" tabindex="0" onkeydown="if(event.key === ' ' || event.key === 'Enter') { this.classList.toggle('checked'); this.setAttribute('aria-checked', this.classList.contains('checked')); this.nextElementSibling.querySelector('.ing-name').style.textDecoration = this.classList.contains('checked') ? 'line-through' : 'none'; this.nextElementSibling.querySelector('.ing-name').style.opacity = this.classList.contains('checked') ? '0.5' : '1'; event.preventDefault(); }" onclick="this.classList.toggle('checked'); this.setAttribute('aria-checked', this.classList.contains('checked')); this.nextElementSibling.querySelector('.ing-name').style.textDecoration = this.classList.contains('checked') ? 'line-through' : 'none'; this.nextElementSibling.querySelector('.ing-name').style.opacity = this.classList.contains('checked') ? '0.5' : '1';" aria-label="${ing.name}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="check-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div class="ing-details-row">
                        <span class="ing-name">${ing.name}</span>
                        ${qtyDisplay}
                    </div>
                `;
                list.appendChild(li);
            });
        }

        function openPantryModal() {
            const modal = document.getElementById('pantry-modal');
            const textarea = document.getElementById('pantry-textarea');
            if (modal) {
                if (textarea) {
                    textarea.value = state.pantryItems.join('\n');
                }
                previouslyFocusedElement = document.activeElement;
                modal.classList.add('open');
                setTimeout(() => {
                    if (textarea) textarea.focus();
                }, 100);
            }
        }

        function closePantryModal() {
            const modal = document.getElementById('pantry-modal');
            if (modal) {
                modal.classList.remove('open');
            }
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
                previouslyFocusedElement = null;
            }
        }

        function closePantryModalOnBackdrop(e) {
            if (e.target.id === 'pantry-modal') {
                closePantryModal();
            }
        }

        function saveAndFilterPantry() {
            const textarea = document.getElementById('pantry-textarea');
            if (textarea) {
                state.pantryItems = textarea.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
                localStorage.setItem('chef_digital_pantry', JSON.stringify(state.pantryItems));
            }
            state.showPantryOnly = state.pantryItems.length > 0;
            
            const btn = document.getElementById('pantry-toggle');
            if (btn) {
                btn.classList.toggle('active', state.showPantryOnly);
            }
            updatePantryEditBtnVisibility();
            
            closePantryModal();
            renderRecipes();
            showToast(state.showPantryOnly ? 'Ingredientes salvos e filtro aplicado!' : 'Ingredientes salvos.');
        }

        function clearPantry() {
            const textarea = document.getElementById('pantry-textarea');
            if (textarea) {
                textarea.value = '';
            }
            state.pantryItems = [];
            localStorage.setItem('chef_digital_pantry', JSON.stringify([]));
            state.showPantryOnly = false;
            const btn = document.getElementById('pantry-toggle');
            if (btn) {
                btn.classList.remove('active');
            }
            updatePantryEditBtnVisibility();
            renderRecipes();
            showToast('Despensa limpa!');
        }

        function updatePantryEditBtnVisibility() {
            const editBtn = document.getElementById('pantry-edit-btn');
            if (!editBtn) return;
            editBtn.classList.toggle('hidden', state.pantryItems.length === 0);
        }

        function togglePantryFilterOrOpenModal(event) {
            if (state.pantryItems.length === 0) {
                openPantryModal();
            } else {
                state.showPantryOnly = !state.showPantryOnly;
                const btn = document.getElementById('pantry-toggle');
                if (btn) {
                    if (state.showPantryOnly) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
                renderRecipes();
            }
        }
    

async function inicializarApp() {
  // 1. Carrega dados do IndexedDB local (offline-first)
  try {
    const cachedCategories = await lerCacheLocal('categorias');
    const cachedRecipes = await lerCacheLocal('receitas');

    if (cachedCategories && cachedCategories.length > 0 && cachedRecipes && cachedRecipes.length > 0) {
      state.categories = cachedCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.label }), {});
      state.recipes = cachedRecipes;
      carregarPlannerData(state.recipes);
      
      // Inicializa a interface com o cache
      updateThemeToggleIcon();
      renderCategoryFilters();
      renderRecipes();
      updateShoppingListBadge();
      updatePlannerBadge();
    }
  } catch (e) {
    console.warn('Erro ao carregar cache local:', e);
  }

  // 2. Busca atualizações do Supabase em background
  try {
    const { data: catData, error: catError } = await supabase.from('categorias').select('*').order('sort_order');
    const { data: recData, error: recError } = await supabase
      .from('receitas')
      .select('*, ingredientes(*), passos(*)')
      .order('id');

    if (!catError && !recError) {
      // Atualiza variáveis em memória
      state.categories = catData.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.label }), {});
      state.recipes = recData.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        source: r.source,
        emoji: r.emoji,
        image: r.image,
        tips: r.tips,
        servings: (r.servings !== null && r.servings !== undefined && r.servings !== '' && !isNaN(parseInt(r.servings, 10))) ? parseInt(r.servings, 10) : null,
        ingredients: (r.ingredientes || []).sort((a, b) => a.ordem - b.ordem).map(ing => ({
          name: ing.name,
          qty: ing.qty !== null ? parseFloat(ing.qty) : null,
          unit: ing.unit
        })),
        steps: (r.passos || []).sort((a, b) => a.ordem - b.ordem).map(p => p.step_text)
      }));

      // Atualiza cache local IndexedDB
      await salvarCacheLocal('categorias', catData);
      await salvarCacheLocal('receitas', state.recipes);
      carregarPlannerData(state.recipes);

      // Re-renderiza com os dados atualizados
      updateThemeToggleIcon();
      renderCategoryFilters();
      renderRecipes();
      updateShoppingListBadge();
      updatePlannerBadge();
    }
  } catch (err) {
    console.error('Erro na consulta em background do Supabase:', err);
  }
}

window.onload = function() {
    // Wire dependencies from main.js into the recipes-render module
    setRenderDependencies({
        isRecipePlanned,
        openRecipeModal,
        openDayPickerPopover,
        toggleFavorite
    });
    initRecipesGridDelegation();
    updatePantryEditBtnVisibility();
    initTheme();
    inicializarApp();
};


// Export to global scope for HTML inline handlers
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.togglePlanner = togglePlanner;
window.toggleShoppingList = toggleShoppingList;
window.toggleFavoritesOnly = toggleFavoritesOnly;
window.togglePantryFilterOrOpenModal = togglePantryFilterOrOpenModal;
window.openPantryModal = openPantryModal;
window.filterRecipes = filterRecipes;
window.clearSearch = clearSearch;
window.clearAllFilters = clearAllFilters;
window.closeAllDrawers = closeAllDrawers;
window.printPlanner = printPlanner;
window.clearPlanner = clearPlanner;
window.generateConsolidatedShoppingList = generateConsolidatedShoppingList;
window.printShoppingList = printShoppingList;
window.clearShoppingList = clearShoppingList;
window.copyShoppingList = copyShoppingList;
window.closeRecipeModalOnBackdrop = closeRecipeModalOnBackdrop;
window.closeRecipeModal = closeRecipeModal;
window.toggleWakeLock = toggleWakeLock;
window.printRecipe = printRecipe;
window.addCurrentRecipeToShoppingList = addCurrentRecipeToShoppingList;
window.openDayPickerPopover = openDayPickerPopover;
window.changePortions = changePortions;
window.closePantryModalOnBackdrop = closePantryModalOnBackdrop;
window.closePantryModal = closePantryModal;
window.clearPantry = clearPantry;
window.saveAndFilterPantry = saveAndFilterPantry;
window.selectCategory = selectCategory;
window.toggleFavorite = toggleFavorite;
window.handleDayPickerChoice = handleDayPickerChoice;
window.openRecipeModal = openRecipeModal;
window.changePlannerRecipePortions = changePlannerRecipePortions;
window.removeRecipeFromShoppingList = removeRecipeFromShoppingList;
window.toggleShoppingItemCheck = toggleShoppingItemCheck;
window.toggleRecipeOnDay = toggleRecipeOnDay;


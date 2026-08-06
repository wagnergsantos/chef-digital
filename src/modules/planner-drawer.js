import { state, WEEK_DAYS } from './state.js';

let _renderRecipes = () => {};
let _showToast = () => {};
let _updateModalPlannerButtonState = () => {};
let _previouslyFocusedElementRef = { current: null };

export function setPlannerDependencies({ renderRecipes, showToast, updateModalPlannerButtonState, previouslyFocusedElementRef }) {
    if (renderRecipes) _renderRecipes = renderRecipes;
    if (showToast) _showToast = showToast;
    if (updateModalPlannerButtonState) _updateModalPlannerButtonState = updateModalPlannerButtonState;
    if (previouslyFocusedElementRef) _previouslyFocusedElementRef = previouslyFocusedElementRef;
}

export function createEmptyPlannedByDay() {
    const byDay = {};
    WEEK_DAYS.forEach(d => { byDay[d.key] = []; });
    return byDay;
}

export function migratePlannedData(raw, recipesList = []) {
    if (Array.isArray(raw)) {
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

    const byDay = createEmptyPlannedByDay();
    let hasMigrated = false;
    WEEK_DAYS.forEach(d => {
        if (raw && Array.isArray(raw[d.key])) {
            byDay[d.key] = raw[d.key];
        } else if (raw && raw[d.key] !== undefined) {
            hasMigrated = true;
        }
    });
    return { byDay, hasMigrated };
}

export function carregarPlannerData(recipesList = state.recipes) {
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

export function getAllPlannedEntries() {
    const all = [];
    WEEK_DAYS.forEach(d => {
        if (state.plannedByDay && state.plannedByDay[d.key]) {
            state.plannedByDay[d.key].forEach(entry => {
                all.push({ day: d.key, recipeId: entry.recipeId, people: entry.people });
            });
        }
    });
    return all;
}

export function getPlannedDaysForRecipe(recipeId) {
    return WEEK_DAYS
        .filter(d => state.plannedByDay && state.plannedByDay[d.key] && state.plannedByDay[d.key].some(e => e.recipeId === recipeId))
        .map(d => d.key);
}

export function isRecipePlanned(recipeId) {
    return getPlannedDaysForRecipe(recipeId).length > 0;
}

export function savePlanner() {
    localStorage.setItem('chef_digital_planned', JSON.stringify(state.plannedByDay));
}

export function updatePlannerBadge() {
    const badge = document.getElementById('planner-badge');
    if (!badge) return;
    const count = getAllPlannedEntries().length;
    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

export function togglePlanner() {
    const drawer = document.getElementById('planner-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer || !backdrop) return;
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        backdrop.classList.remove('active');
        if (_previouslyFocusedElementRef.current) {
            _previouslyFocusedElementRef.current.focus();
            _previouslyFocusedElementRef.current = null;
        }
    } else {
        const shopDrawer = document.getElementById('shopping-list-drawer');
        if (shopDrawer && shopDrawer.classList.contains('open')) {
            shopDrawer.classList.remove('open');
        }
        _previouslyFocusedElementRef.current = document.activeElement;
        drawer.classList.add('open');
        backdrop.classList.add('active');
        renderPlanner();
        setTimeout(() => {
            const firstEl = drawer.querySelector('button, input');
            if (firstEl) firstEl.focus();
        }, 100);
    }
}

export function toggleRecipeOnDay(recipeId, day) {
    const dayEntries = state.plannedByDay[day];
    if (!dayEntries) return false;
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
    _renderRecipes();
    renderPlanner();
    return added;
}

let dayPickerRecipeId = null;

export function openDayPickerPopover(recipeId, anchorEl) {
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

export function handleDayPickerChoice(day) {
    if (dayPickerRecipeId === null) return;
    const dayObj = WEEK_DAYS.find(d => d.key === day);
    const dayLabel = dayObj ? dayObj.label : day;
    const added = toggleRecipeOnDay(dayPickerRecipeId, day);
    _showToast(added ? `Adicionado ao menu de ${dayLabel}!` : `Removido do menu de ${dayLabel}!`);
    _updateModalPlannerButtonState(dayPickerRecipeId);

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

export function handleDayPickerOutsideClick(e) {
    const popover = document.getElementById('day-picker-popover');
    if (!popover) return;
    if (popover.contains(e.target)) return;
    closeDayPickerPopover();
}

export function closeDayPickerPopover() {
    const popover = document.getElementById('day-picker-popover');
    if (popover) popover.remove();
    document.removeEventListener('click', handleDayPickerOutsideClick, { capture: true });
    dayPickerRecipeId = null;
}

export function changePlannerRecipePortions(recipeId, day, dir) {
    if (!state.plannedByDay || !state.plannedByDay[day]) return;
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

export function clearPlanner() {
    state.plannedByDay = createEmptyPlannedByDay();
    savePlanner();
    updatePlannerBadge();
    _renderRecipes();
    renderPlanner();
}

export function renderPlannerCardHtml(entry, day) {
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

export function renderPlanner() {
    const container = document.getElementById('planner-items');
    if (!container) return;
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
        const dayEntries = (state.plannedByDay && state.plannedByDay[d.key]) ? state.plannedByDay[d.key] : [];
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

import { state } from './state.js';
import { scaleIngredientQty } from '../logic/recipes.js';
import { isRecipePlanned } from './planner-drawer.js';
import { startCookingMode } from './cooking-mode.js';

let activeRecipeId = null;
let activeRecipePortions = 1;
let wakeLockSentinel = null;
let wakeLockUserDisabled = false;
let _previouslyFocusedElementRef = { current: null };

export function setRecipeModalDependencies({ previouslyFocusedElementRef }) {
    if (previouslyFocusedElementRef) _previouslyFocusedElementRef = previouslyFocusedElementRef;
}

export function getActiveRecipe() {
    return state.recipes.find(r => r.id === activeRecipeId) || null;
}

export function getActiveRecipeId() {
    return activeRecipeId;
}

export function getActiveRecipePortions() {
    return activeRecipePortions;
}

export function updateModalPlannerButtonState(id) {
    const planBtn = document.getElementById('modal-planner-btn');
    if (!planBtn) return;
    const isPlanned = isRecipePlanned(id);
    const planLabel = isPlanned ? "Remover do Planejamento" : "Planejar essa refeição";
    planBtn.classList.toggle('planned-active', isPlanned);
    planBtn.title = planLabel;
    planBtn.setAttribute('aria-label', planLabel);
    planBtn.setAttribute('aria-pressed', isPlanned ? 'true' : 'false');
}

export function updateIngredientsList() {
    const recipe = state.recipes.find(r => r.id === activeRecipeId);
    if (!recipe) return;

    const list = document.getElementById('modal-ingredients-list');
    if (!list) return;
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
            <span class="ing-bullet" aria-hidden="true">•</span>
            <div class="ing-details-row">
                <span class="ing-name">${ing.name}</span>
                ${qtyDisplay}
            </div>
        `;
        list.appendChild(li);
    });
}

export function changePortions(dir) {
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
        const multiplierEl = document.getElementById('portions-multiplier');
        if (multiplierEl) {
            if (isServingsMode) {
                multiplierEl.innerText = `${activeRecipePortions} pessoas`;
            } else {
                multiplierEl.innerText = `${activeRecipePortions}x`;
            }
        }
        updateIngredientsList();
    }
}

export async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    if (wakeLockUserDisabled) return;
    try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
            updateWakeLockIndicator();
        });
        updateWakeLockIndicator();
    } catch (e) {
        wakeLockSentinel = null;
    }
}

export function releaseWakeLock() {
    if (wakeLockSentinel) {
        wakeLockSentinel.release();
        wakeLockSentinel = null;
    }
    updateWakeLockIndicator();
}

export function toggleWakeLock() {
    if (wakeLockUserDisabled) {
        wakeLockUserDisabled = false;
        acquireWakeLock();
    } else {
        wakeLockUserDisabled = true;
        releaseWakeLock();
    }
    updateWakeLockToggleButton();
}

export function updateWakeLockIndicator() {
    const indicator = document.getElementById('wake-lock-indicator');
    if (!indicator) return;
    indicator.classList.toggle('visible', wakeLockSentinel !== null);
}

export function updateWakeLockToggleButton() {
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

export function openRecipeModal(id) {
    activeRecipeId = id;
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe) return;

    const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
    const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
    const multiplierEl = document.getElementById('portions-multiplier');
    if (multiplierEl) {
        if (isServingsMode) {
            activeRecipePortions = parsedServings;
            multiplierEl.innerText = `${activeRecipePortions} pessoas`;
        } else {
            activeRecipePortions = 1;
            multiplierEl.innerText = `${activeRecipePortions}x`;
        }
    }

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

    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.innerText = recipe.title;
    
    const catKey = recipe.category || state.categoriesById[String(recipe.category_id)] || recipe.category;
    const catText = state.categories[catKey] || catKey;
    const catBadge = document.getElementById('modal-category-badge');
    if (catBadge) catBadge.innerText = catText;

    const modalServingsBadge = document.getElementById('modal-servings-badge');
    if (modalServingsBadge) {
        if (recipe.servings) {
            modalServingsBadge.innerText = `🍽️ Rende: ${recipe.servings}`;
            modalServingsBadge.style.display = 'inline-block';
        } else {
            modalServingsBadge.innerText = '';
            modalServingsBadge.style.display = 'none';
        }
    }

    updateModalPlannerButtonState(id);
    updateIngredientsList();

    const stepsList = document.getElementById('modal-steps-list');
    if (stepsList) {
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
    }

    const tipContainer = document.getElementById('modal-tips-container');
    const tipText = document.getElementById('modal-tips-text');
    if (tipContainer && tipText) {
        if (recipe.tips) {
            tipText.innerText = recipe.tips;
            tipContainer.classList.remove('hidden');
        } else {
            tipContainer.classList.add('hidden');
        }
    }

    const cookingBtn = document.getElementById('modal-start-cooking-btn');
    if (cookingBtn) {
        cookingBtn.onclick = () => {
            closeRecipeModal();
            startCookingMode(recipe);
        };
    }

    const modal = document.getElementById('recipe-modal');
    if (modal) {
        _previouslyFocusedElementRef.current = document.activeElement;
        modal.classList.add('open');
        setTimeout(() => {
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();
        }, 100);
    }

    wakeLockUserDisabled = false;
    updateWakeLockToggleButton();
    acquireWakeLock();
}

export function closeRecipeModal() {
    releaseWakeLock();
    const modal = document.getElementById('recipe-modal');
    if (modal) modal.classList.remove('open');
    if (_previouslyFocusedElementRef.current) {
        _previouslyFocusedElementRef.current.focus();
        _previouslyFocusedElementRef.current = null;
    }
}

export function closeRecipeModalOnBackdrop(e) {
    if (e.target.id === 'recipe-modal') {
        closeRecipeModal();
    }
}

export function printRecipe() {
    document.documentElement.dataset.printing = 'recipe';
    window.print();
}

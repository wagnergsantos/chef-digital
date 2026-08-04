import { scaleIngredientQty } from '../logic/recipes.js';

let currentRecipe = null;
let currentStepIndex = 0;
let isDrawerOpen = false;
let _previouslyFocusedElementRef = { current: null };

export function setCookingModeDependencies({ previouslyFocusedElementRef }) {
    if (previouslyFocusedElementRef) _previouslyFocusedElementRef = previouslyFocusedElementRef;
}

export function getCurrentStepIndex() {
    return currentStepIndex;
}

export function getCurrentRecipe() {
    return currentRecipe;
}

export function startCookingMode(recipe) {
    if (!recipe || !recipe.steps || recipe.steps.length === 0) return;

    currentRecipe = recipe;
    currentStepIndex = 0;
    isDrawerOpen = false;

    const overlay = document.getElementById('cooking-mode-overlay');
    if (!overlay) return;

    _previouslyFocusedElementRef.current = document.activeElement;

    // Set title
    const titleEl = document.getElementById('cooking-title');
    if (titleEl) {
        titleEl.textContent = recipe.title || 'Modo Preparo';
    }

    // Render ingredients drawer list
    renderIngredientsDrawer();

    // Render step
    renderStep();

    // Show overlay
    overlay.classList.add('open');

    // Close ingredients drawer initially if open
    const drawer = document.getElementById('cooking-ingredients-drawer');
    if (drawer) {
        drawer.classList.remove('open');
    }
    const drawerToggle = document.getElementById('cooking-drawer-toggle');
    if (drawerToggle) {
        drawerToggle.setAttribute('aria-expanded', 'false');
    }

    // Focus close button
    setTimeout(() => {
        const closeBtn = document.getElementById('cooking-close-btn');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

export function nextStep() {
    if (!currentRecipe || !currentRecipe.steps) return;
    if (currentStepIndex < currentRecipe.steps.length - 1) {
        currentStepIndex++;
        renderStep();
    }
}

export function prevStep() {
    if (!currentRecipe || !currentRecipe.steps) return;
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
    }
}

export function toggleIngredientsDrawer() {
    isDrawerOpen = !isDrawerOpen;
    const drawer = document.getElementById('cooking-ingredients-drawer');
    const drawerToggle = document.getElementById('cooking-drawer-toggle');
    
    if (drawer) {
        drawer.classList.toggle('open', isDrawerOpen);
    }
    if (drawerToggle) {
        drawerToggle.setAttribute('aria-expanded', isDrawerOpen ? 'true' : 'false');
    }
}

export function exitCookingMode() {
    const overlay = document.getElementById('cooking-mode-overlay');
    if (overlay) {
        overlay.classList.remove('open');
    }

    isDrawerOpen = false;
    const drawer = document.getElementById('cooking-ingredients-drawer');
    if (drawer) {
        drawer.classList.remove('open');
    }

    if (_previouslyFocusedElementRef.current) {
        _previouslyFocusedElementRef.current.focus();
        _previouslyFocusedElementRef.current = null;
    }
}

export function renderStep() {
    if (!currentRecipe || !currentRecipe.steps) return;
    const totalSteps = currentRecipe.steps.length;
    const stepNumber = currentStepIndex + 1;
    const stepText = currentRecipe.steps[currentStepIndex];

    // Progress bar and text
    const progressBar = document.getElementById('cooking-progress-bar');
    const progressText = document.getElementById('cooking-progress-text');
    const percentage = Math.round((stepNumber / totalSteps) * 100);

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `Passo ${stepNumber} de ${totalSteps} (${percentage}%)`;
    }

    // Step counter and step text
    const counterEl = document.getElementById('cooking-step-counter');
    const stepTextEl = document.getElementById('cooking-step-text');

    if (counterEl) {
        counterEl.textContent = `Passo ${stepNumber} de ${totalSteps}`;
    }
    if (stepTextEl) {
        stepTextEl.textContent = stepText;
    }

    // Prev / Next button states
    const prevBtn = document.getElementById('cooking-prev-btn');
    const nextBtn = document.getElementById('cooking-next-btn');

    if (prevBtn) {
        prevBtn.disabled = currentStepIndex === 0;
    }
    if (nextBtn) {
        if (currentStepIndex === totalSteps - 1) {
            nextBtn.classList.add('cooking-btn-finish');
            nextBtn.innerHTML = `
                <span>Concluir</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            `;
        } else {
            nextBtn.classList.remove('cooking-btn-finish');
            nextBtn.innerHTML = `
                <span>Próximo</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            `;
        }
    }
}

function renderIngredientsDrawer() {
    const listEl = document.getElementById('cooking-ingredients-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!currentRecipe.ingredients || currentRecipe.ingredients.length === 0) {
        listEl.innerHTML = '<li class="cooking-ingredient-item">Nenhum ingrediente especificado.</li>';
        return;
    }

    currentRecipe.ingredients.forEach(ing => {
        const li = document.createElement('li');
        li.className = 'cooking-ingredient-item';

        let qtyDisplay = '';
        if (ing.qty !== null && ing.qty !== undefined) {
            const formattedQty = Number(ing.qty.toFixed(2)).toString();
            qtyDisplay = `<strong class="cooking-ing-qty">${formattedQty} ${ing.unit || ''}</strong>`;
        } else if (ing.unit) {
            qtyDisplay = `<strong class="cooking-ing-qty">${ing.unit}</strong>`;
        }

        li.innerHTML = `
            <span class="cooking-ing-name">${ing.name}</span>
            ${qtyDisplay}
        `;
        listEl.appendChild(li);
    });
}

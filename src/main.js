import { supabase } from './api/supabase.js';
import { salvarCacheLocal, lerCacheLocal } from './cache/db.js';
import { registerSW } from 'virtual:pwa-register';

import { state } from './modules/state.js';
import { toggleTheme, updateThemeToggleIcon, initTheme } from './modules/theme.js';

import {
    renderCategoryFilters,
    renderRecipes,
    setRenderDependencies,
    initRecipesGridDelegation
} from './modules/recipes-render.js';

import {
    carregarPlannerData,
    isRecipePlanned,
    togglePlanner,
    toggleRecipeOnDay,
    openDayPickerPopover,
    handleDayPickerChoice,
    closeDayPickerPopover,
    changePlannerRecipePortions,
    clearPlanner,
    updatePlannerBadge,
    setPlannerDependencies
} from './modules/planner-drawer.js';

import {
    updateShoppingListBadge,
    toggleShoppingList,
    generateConsolidatedShoppingList,
    addCurrentRecipeToShoppingList,
    toggleShoppingItemCheck,
    removeRecipeFromShoppingList,
    clearShoppingList,
    copyShoppingList,
    printShoppingList,
    setShoppingDependencies
} from './modules/shopping-drawer.js';

import {
    openRecipeModal,
    closeRecipeModal,
    closeRecipeModalOnBackdrop,
    changePortions,
    toggleWakeLock,
    printRecipe,
    getActiveRecipe,
    getActiveRecipeId,
    getActiveRecipePortions,
    updateModalPlannerButtonState,
    setRecipeModalDependencies
} from './modules/recipe-modal.js';

import {
    openPantryModal,
    closePantryModal,
    closePantryModalOnBackdrop,
    saveAndFilterPantry,
    clearPantry,
    updatePantryEditBtnVisibility,
    togglePantryFilterOrOpenModal
} from './modules/pantry-modal.js';

import {
    startCookingMode,
    nextStep,
    prevStep,
    toggleIngredientsDrawer,
    exitCookingMode,
    startTimer,
    pauseTimer,
    resetTimer,
    setCookingModeDependencies
} from './modules/cooking-mode.js';

registerSW({ immediate: true });

// Ref para gerenciar o elemento anteriormente focado (trap focus / acessibilidade)
const previouslyFocusedElementRef = { current: null };

// Injeção de dependências cruzadas entre os módulos
setRenderDependencies({
    isRecipePlanned,
    openRecipeModal,
    openDayPickerPopover,
    toggleFavorite
});

setPlannerDependencies({
    renderRecipes,
    showToast,
    updateModalPlannerButtonState,
    previouslyFocusedElementRef
});

setShoppingDependencies({
    showToast,
    previouslyFocusedElementRef
});

setRecipeModalDependencies({
    previouslyFocusedElementRef
});

setCookingModeDependencies({
    previouslyFocusedElementRef
});

// Toast feedback notification system
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    
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
        setTimeout(() => toast.remove(), 240);
    }, 2000);
}

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

function closeAllDrawers() {
    const planner = document.getElementById('planner-drawer');
    const shopping = document.getElementById('shopping-list-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (planner) planner.classList.remove('open');
    if (shopping) shopping.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
        previouslyFocusedElementRef.current = null;
    }
}

function printPlanner() {
    document.documentElement.dataset.printing = 'planner';
    window.print();
}

// Esc and Global Keydown handler
document.addEventListener('keydown', function(e) {
    const cookingOverlay = document.getElementById('cooking-mode-overlay');
    if (cookingOverlay && cookingOverlay.classList.contains('open')) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextStep();
            return;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevStep();
            return;
        } else if (e.key === 'Escape' || e.keyCode === 27) {
            e.preventDefault();
            exitCookingMode();
            return;
        }
    }

    const modal = document.getElementById('recipe-modal');
    const pantryModal = document.getElementById('pantry-modal');
    const planner = document.getElementById('planner-drawer');
    const shopping = document.getElementById('shopping-list-drawer');

    if (e.key === 'Escape' || e.keyCode === 27) {
        const dayPickerPopover = document.getElementById('day-picker-popover');
        if (dayPickerPopover) {
            closeDayPickerPopover();
        } else if (modal && modal.classList.contains('open')) {
            closeRecipeModal();
        } else if (pantryModal && pantryModal.classList.contains('open')) {
            closePantryModal(previouslyFocusedElementRef);
        } else if ((planner && planner.classList.contains('open')) || (shopping && shopping.classList.contains('open'))) {
            closeAllDrawers();
        }
    }
});

// App Initialization
async function inicializarApp() {
    try {
        const cachedCategories = await lerCacheLocal('categorias');
        const cachedRecipes = await lerCacheLocal('receitas');

        if (cachedCategories && cachedCategories.length > 0 && cachedRecipes && cachedRecipes.length > 0) {
            state.categories = cachedCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.label }), {});
            state.recipes = cachedRecipes;
            carregarPlannerData(state.recipes);
            
            updateThemeToggleIcon();
            renderCategoryFilters();
            renderRecipes();
            updateShoppingListBadge();
            updatePlannerBadge();
        }
    } catch (err) {
        console.warn('Erro ao carregar dados do IndexedDB local:', err);
    }

    try {
        const { data: catData, error: catErr } = await supabase.from('categorias').select('*');
        const { data: recData, error: recErr } = await supabase.from('receitas').select(`
            id, title, category, source, emoji, image, servings, tips,
            ingredients:ingredientes(name, qty, unit),
            steps:passos(description)
        `);

        if (!catErr && catData && catData.length > 0) {
            state.categories = catData.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.label }), {});
            await salvarCacheLocal('categorias', catData);
        }

        if (!recErr && recData && recData.length > 0) {
            const formattedRecipes = recData.map(r => ({
                id: r.id,
                title: r.title,
                category: r.category,
                source: r.source,
                emoji: r.emoji,
                image: r.image,
                servings: r.servings,
                tips: r.tips,
                ingredients: r.ingredients || [],
                steps: (r.steps || []).map(s => s.description)
            }));
            state.recipes = formattedRecipes;
            carregarPlannerData(state.recipes);
            await salvarCacheLocal('receitas', formattedRecipes);
        }

        renderCategoryFilters();
        renderRecipes();
        updateShoppingListBadge();
        updatePlannerBadge();
    } catch (err) {
        console.warn('Supabase offline ou indisponível:', err);
    }
}

window.onload = function() {
    initRecipesGridDelegation();
    updatePantryEditBtnVisibility();
    initTheme();
    inicializarApp();
};

// Window Global Exports para handlers inline do HTML
window.showToast = showToast;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.togglePlanner = togglePlanner;
window.toggleShoppingList = toggleShoppingList;
window.toggleFavoritesOnly = () => {
    state.showFavoritesOnly = !state.showFavoritesOnly;
    const btn = document.getElementById('favs-toggle');
    if (btn) btn.classList.toggle('active', state.showFavoritesOnly);
    renderRecipes();
};
window.togglePantryFilterOrOpenModal = (e) => togglePantryFilterOrOpenModal(e, { renderRecipes, previouslyFocusedElementRef });
window.openPantryModal = () => openPantryModal(previouslyFocusedElementRef);
window.filterRecipes = () => renderRecipes();
window.clearSearch = () => {
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    renderRecipes();
};
window.clearAllFilters = () => {
    state.searchQuery = '';
    state.activeCategory = 'todos';
    state.showFavoritesOnly = false;
    state.showPantryOnly = false;
    renderRecipes();
};
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
window.getActiveRecipe = getActiveRecipe;
window.addCurrentRecipeToShoppingList = () => addCurrentRecipeToShoppingList(getActiveRecipeId(), getActiveRecipePortions());
window.openDayPickerPopover = openDayPickerPopover;
window.changePortions = changePortions;
window.closePantryModalOnBackdrop = (e) => closePantryModalOnBackdrop(e, previouslyFocusedElementRef);
window.closePantryModal = () => closePantryModal(previouslyFocusedElementRef);
window.clearPantry = () => clearPantry({ renderRecipes, showToast });
window.saveAndFilterPantry = () => saveAndFilterPantry({ renderRecipes, showToast, previouslyFocusedElementRef });
window.selectCategory = (key) => {
    state.activeCategory = key;
    renderRecipes();
};
window.toggleFavorite = toggleFavorite;
window.handleDayPickerChoice = handleDayPickerChoice;
window.openRecipeModal = openRecipeModal;
window.changePlannerRecipePortions = changePlannerRecipePortions;
window.removeRecipeFromShoppingList = removeRecipeFromShoppingList;
window.toggleShoppingItemCheck = toggleShoppingItemCheck;
window.toggleRecipeOnDay = toggleRecipeOnDay;
window.startCookingMode = startCookingMode;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleIngredientsDrawer = toggleIngredientsDrawer;
window.exitCookingMode = exitCookingMode;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;

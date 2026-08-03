import { state } from './state.js';

// --- Utility helpers ---

export function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function normalizeSearchText(str) {
    return (str || '').toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// --- Pantry helpers ---

export function recipeIsFullyStocked(recipe) {
    if (!state.pantryItems || state.pantryItems.length === 0) return false;
    const normPantry = state.pantryItems.map(normalizeSearchText);
    return recipe.ingredients.every(ing => {
        const unit = (ing.unit || '').toLowerCase();
        if (
            unit.includes('a gosto') || 
            unit.includes('opcional') || 
            unit.includes('q.b.') || 
            unit.includes('quanto baste') || 
            unit.includes('fio') ||
            unit.includes('para refogar') ||
            unit.includes('para untar')
        ) return true;
        
        const normIng = normalizeSearchText(ing.name);
        return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
    });
}

export function recipeHasAnyPantryIngredient(recipe) {
    if (!state.pantryItems || state.pantryItems.length === 0) return false;
    const normPantry = state.pantryItems.map(normalizeSearchText);
    return recipe.ingredients.some(ing => {
        const normIng = normalizeSearchText(ing.name);
        return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
    });
}

// --- Search helpers ---

export function matchRecipeSearch(recipe, rawQuery) {
    const terms = normalizeSearchText(rawQuery).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return { matches: true, matchedIngredients: [] };

    const normTitle = normalizeSearchText(recipe.title);
    const matchedIngredients = [];

    const allTermsMatch = terms.every(term => {
        if (normTitle.includes(term)) return true;
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        const hitIngredient = ingredients.find(ing =>
            normalizeSearchText(ing.name).includes(term));
        if (hitIngredient) {
            if (!matchedIngredients.includes(hitIngredient.name)) {
                matchedIngredients.push(hitIngredient.name);
            }
            return true;
        }
        return false;
    });

    return { matches: allTermsMatch, matchedIngredients: allTermsMatch ? matchedIngredients : [] };
}

// --- Debounce utility ---

export function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Category Filters ---

export function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // Get all category keys
    const keys = Object.keys(state.categories);
    
    // Sort keys: keep 'todos' at the beginning, and sort others alphabetically by description
    const sortedKeys = keys.filter(k => k === 'todos').concat(
        keys.filter(k => k !== 'todos').sort((a, b) => {
            const descA = state.categories[a] || '';
            const descB = state.categories[b] || '';
            return descA.localeCompare(descB, 'pt-BR');
        })
    );

    sortedKeys.forEach(key => {
        // Get counts for category supporting multitag and current active filters (except state.activeCategory itself)
        let count = 0;
        const pantryMatch = (r) => !state.showPantryOnly || recipeHasAnyPantryIngredient(r);
        if (key === 'todos') {
            count = state.recipes.filter(r => {
                const searchMatch = matchRecipeSearch(r, state.searchQuery).matches;
                const favoriteMatch = !state.showFavoritesOnly || state.favorites.includes(r.id);
                return searchMatch && favoriteMatch && pantryMatch(r);
            }).length;
        } else {
            count = state.recipes.filter(r => {
                let categoryMatch = false;
                if (Array.isArray(r.category)) {
                    categoryMatch = r.category.includes(key);
                } else {
                    categoryMatch = r.category === key;
                }
                const searchMatch = matchRecipeSearch(r, state.searchQuery).matches;
                const favoriteMatch = !state.showFavoritesOnly || state.favorites.includes(r.id);
                return categoryMatch && searchMatch && favoriteMatch && pantryMatch(r);
            }).length;
        }

        // Skip rendering if the category is empty, unless it's 'todos' or the currently active category
        if (count === 0 && key !== 'todos' && key !== state.activeCategory) {
            return;
        }

        const button = document.createElement('button');
        button.className = `category-filter-btn ${state.activeCategory === key ? 'active' : ''}`;
        button.onclick = () => selectCategory(key);
        button.innerHTML = `
            <span>${state.categories[key]}</span>
            <span class="category-filter-badge">${count}</span>
        `;

        fragment.appendChild(button);
    });
    container.appendChild(fragment);
}

// --- Select Category ---

export function selectCategory(categoryKey) {
    state.activeCategory = categoryKey;
    state.showFavoritesOnly = false; // Reset favorites-only filter when clicking category
    document.getElementById('favs-toggle').classList.remove('active');
    renderRecipes();
}

// --- Toggle Favorites Only ---

export function toggleFavoritesOnly() {
    state.showFavoritesOnly = !state.showFavoritesOnly;
    const btn = document.getElementById('favs-toggle');
    if (state.showFavoritesOnly) {
        btn.classList.add('active');
        state.activeCategory = 'todos';
    } else {
        btn.classList.remove('active');
    }
    renderRecipes();
}

// --- Debounced render ---

export const debouncedRenderRecipes = debounce(() => renderRecipes(), 250);

// --- Search action ---

export function filterRecipes() {
    state.searchQuery = document.getElementById('search-input').value.toLowerCase();
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
        if (state.searchQuery.length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    debouncedRenderRecipes();
}

export function clearSearch() {
    const input = document.getElementById('search-input');
    input.value = '';
    state.searchQuery = '';
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
        clearBtn.classList.add('hidden');
    }
    renderRecipes();
}

// --- Clear Filters Button Visibility ---

export function updateClearFiltersBtnVisibility() {
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (!clearFiltersBtn) return;
    
    const hasActiveFilters = (state.searchQuery.length > 0) || 
                             (state.activeCategory !== 'todos') || 
                             state.showFavoritesOnly ||
                             state.showPantryOnly;
                             
    if (hasActiveFilters) {
        clearFiltersBtn.classList.remove('hidden');
    } else {
        clearFiltersBtn.classList.add('hidden');
    }
}

// --- Clear all filters ---

export function clearAllFilters() {
    // Clear search
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
        clearBtn.classList.add('hidden');
    }

    // Clear active category
    state.activeCategory = 'todos';

    // Clear favorites filter
    state.showFavoritesOnly = false;
    const favsBtn = document.getElementById('favs-toggle');
    if (favsBtn) {
        favsBtn.classList.remove('active');
    }

    // Clear pantry filter
    state.showPantryOnly = false;
    const pantryBtn = document.getElementById('pantry-toggle');
    if (pantryBtn) {
        pantryBtn.classList.remove('active');
    }

    // Re-render
    renderRecipes();
}

// --- Main Render ---

// These will be set by main.js after it defines isRecipePlanned, openRecipeModal, etc.
let _isRecipePlanned = () => false;
let _openRecipeModal = () => {};
let _openDayPickerPopover = () => {};
let _toggleFavorite = () => {};

export function setRenderDependencies({ isRecipePlanned, openRecipeModal, openDayPickerPopover, toggleFavorite }) {
    _isRecipePlanned = isRecipePlanned;
    _openRecipeModal = openRecipeModal;
    _openDayPickerPopover = openDayPickerPopover;
    _toggleFavorite = toggleFavorite;
}

export function renderRecipes() {
    const grid = document.getElementById('recipes-grid');
    const emptyState = document.getElementById('empty-state');
    grid.innerHTML = '';

    let filtered = state.recipes.filter(recipe => {
        // Category Filter supporting both string and array multitags
        let categoryMatch = false;
        if (state.activeCategory === 'todos') {
            categoryMatch = true;
        } else {
            if (Array.isArray(recipe.category)) {
                categoryMatch = recipe.category.includes(state.activeCategory);
            } else {
                categoryMatch = recipe.category === state.activeCategory;
            }
        }
        
        // Search Match (Check Title only)
        const searchMatch = matchRecipeSearch(recipe, state.searchQuery).matches;

        // Favorites Filter
        const favoriteMatch = !state.showFavoritesOnly || state.favorites.includes(recipe.id);

        // Pantry Filter
        const pantryMatch = !state.showPantryOnly || recipeHasAnyPantryIngredient(recipe);

        return categoryMatch && searchMatch && favoriteMatch && pantryMatch;
    });

    // Update title results count
    const resultsTitle = document.getElementById('results-count');
    if (state.showFavoritesOnly) {
        resultsTitle.innerText = `Receitas Favoritas (${filtered.length})`;
    } else if (state.activeCategory !== 'todos') {
        resultsTitle.innerText = `${state.categories[state.activeCategory]} (${filtered.length})`;
    } else if (state.searchQuery) {
        resultsTitle.innerText = `Resultados da busca (${filtered.length})`;
    } else {
        resultsTitle.innerText = `Todas as Receitas (${filtered.length})`;
    }

    // Update category indicator on the right
    const indicator = document.getElementById('active-category-indicator');
    if (indicator) {
        if (state.showFavoritesOnly) {
            indicator.innerText = 'Apenas Favoritas';
        } else if (state.activeCategory !== 'todos') {
            indicator.innerText = state.categories[state.activeCategory];
        } else {
            indicator.innerText = 'Todas as Categorias';
        }
    }

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        const fragment = document.createDocumentFragment();
        filtered.forEach((recipe, index) => {
            const isFav = state.favorites.includes(recipe.id);
            const isPlanned = _isRecipePlanned(recipe.id);
            const isFullyStocked = state.showPantryOnly && recipeIsFullyStocked(recipe);
            const pantryBadge = isFullyStocked ? '<span class="card-badge pantry-badge">✅ Você tem tudo</span>' : '';
            const { matchedIngredients } = matchRecipeSearch(recipe, state.searchQuery);
            const card = document.createElement('div');
            card.className = `recipe-card ${isPlanned ? 'planned' : ''}`;
            card.style.setProperty('--i', index);
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Ver receita de ${recipe.title}`);
            card.dataset.recipeId = recipe.id;
            card.onkeydown = (e) => {
                // Avoid triggering modal if the key event originated in an action button
                if (e.target.closest('.card-action-btn')) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    _openRecipeModal(recipe.id);
                }
            };

            // Render all categories for this recipe as badges
            let categoryBadges = '';
            if (Array.isArray(recipe.category)) {
                categoryBadges = recipe.category.map(cat => 
                    `<span class="card-badge">${state.categories[cat] || cat}</span>`
                ).join(' ');
            } else {
                categoryBadges = `<span class="card-badge">${state.categories[recipe.category] || recipe.category}</span>`;
            }

            const hasImg = recipe.image && recipe.image.trim() !== "";
            const headerClass = `card-header-graphic ${hasImg ? 'has-image' : ''}`;

            card.innerHTML = `
                <div class="${headerClass}">
                    ${hasImg ? `<img src="${recipe.image}" class="card-header-image" alt="Foto de ${recipe.title}" loading="lazy" width="400" height="112" />` : ''}
                    <span class="card-emoji" role="img" aria-label="Emoji representativo de ${recipe.title}">${recipe.emoji || '🍽️'}</span>
                    <div class="card-badges-wrapper">
                        ${isPlanned ? '<span class="card-badge planned-badge">Planejado</span>' : ''}
                        ${pantryBadge}
                        ${categoryBadges}
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="card-info">
                        <span class="card-source">${escapeHtml(recipe.source || '')}</span>
                        <h4 class="card-title">${escapeHtml(recipe.title)}</h4>
                        ${matchedIngredients && matchedIngredients.length > 0 ? `<p class="card-search-match">🔍 Contém: ${escapeHtml(matchedIngredients.join(', '))}</p>` : ''}
                    </div>
                    
                    <div class="card-footer">
                        <div class="card-meta">
                            <span class="card-ingredients-count">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                ${recipe.ingredients.length} ing.
                            </span>
                            ${recipe.servings !== undefined && recipe.servings !== null ? `
                            <span class="card-servings-count" title="Rendimento da receita">
                                👥 ${recipe.servings} pessoas
                            </span>
                            ` : ''}
                        </div>
                        
                        <div class="card-actions">
                            <button data-action="open-day-picker" data-id="${recipe.id}" class="card-action-btn plan-btn ${isPlanned ? 'active' : ''}" title="Planejar para a semana" aria-label="Planejar ${recipe.title} para a semana" aria-pressed="${isPlanned}">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>

                            <button data-action="toggle-favorite" data-id="${recipe.id}" class="card-action-btn fav-btn ${isFav ? 'active' : ''}" title="Adicionar aos favoritos" aria-label="Adicionar ${recipe.title} aos favoritos" aria-pressed="${isFav}">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        grid.appendChild(fragment);
    }

    // Dynamically refresh category filters' count and update clear button visibility
    renderCategoryFilters();
    updateClearFiltersBtnVisibility();
}

// --- Event Delegation ---

export function initRecipesGridDelegation() {
    const grid = document.getElementById('recipes-grid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            e.stopPropagation();
            const action = actionTarget.dataset.action;
            const recipeId = parseInt(actionTarget.dataset.id, 10) || actionTarget.dataset.id;
            
            if (action === 'toggle-favorite') {
                _toggleFavorite(recipeId);
            } else if (action === 'open-day-picker') {
                _openDayPickerPopover(recipeId, actionTarget);
            }
            return;
        }

        // Click on card itself -> open modal
        const card = e.target.closest('.recipe-card');
        if (card && card.dataset.recipeId) {
            const recipeId = parseInt(card.dataset.recipeId, 10) || card.dataset.recipeId;
            _openRecipeModal(recipeId);
        }
    });
}

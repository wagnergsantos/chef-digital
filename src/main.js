import { supabase } from './supabase.js';
import { salvarCacheLocal, lerCacheLocal } from './cache.js';


        // App States
        let categories = {};
        let recipes = [];
        let activeCategory = 'todos';
        let searchQuery = '';
        let favorites = JSON.parse(localStorage.getItem('chef_digital_favorites')) || [];
        let shoppingList = JSON.parse(localStorage.getItem('chef_digital_shopping')) || {};
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

        function migratePlannedData(raw, recipesList = []) {
            if (Array.isArray(raw)) {
                // Formato antigo: lista plana [{id, people}] ou [{id, portions}].
                // Sem informação de dia, todas as entradas antigas migram para Domingo.
                const byDay = createEmptyPlannedByDay();
                raw.forEach(p => {
                    let people = p.people;
                    if (p.portions !== undefined && people === undefined) {
                        let servings = 1;
                        if (Array.isArray(recipesList) && recipesList.length > 0) {
                            const recipe = recipesList.find(r => r.id === p.id);
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

        let plannedByDay = createEmptyPlannedByDay();

        function carregarPlannerData(recipesList = recipes) {
            const storedPlanned = JSON.parse(localStorage.getItem('chef_digital_planned'));
            const plannedMigration = migratePlannedData(storedPlanned, recipesList);
            plannedByDay = plannedMigration.byDay;
            if (plannedMigration.hasMigrated) {
                if (!Array.isArray(storedPlanned) || (Array.isArray(recipesList) && recipesList.length > 0)) {
                    localStorage.setItem('chef_digital_planned', JSON.stringify(plannedByDay));
                }
            }
        }

        carregarPlannerData(recipes);

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
        let activeRecipePortions = 1;
        let activeRecipeId = null;
        let showFavoritesOnly = false;
        let wakeLockSentinel = null;
        let wakeLockUserDisabled = false; // intenção do usuário nesta sessão de visualização (não persiste)
        let pantryItems = [];
        let pantryFilterActive = false;

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('chef_digital_theme', next);
            updateThemeToggleIcon();
            showToast(`Tema alterado para Modo ${next === 'dark' ? 'Escuro' : 'Claro'}`);
        }

        function updateThemeToggleIcon() {
            const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

            const themeColorMeta = document.getElementById('theme-color-meta');
            if (themeColorMeta) {
                const THEME_COLORS = { light: '#fafaf9', dark: '#0c0a09' };
                themeColorMeta.setAttribute('content', THEME_COLORS[current]);
            }

            const themeBtn = document.getElementById('theme-toggle');
            if (!themeBtn) return;
            
            if (current === 'dark') {
                themeBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                    </svg>
                `;
                themeBtn.title = "Alternar para Modo Claro";
                themeBtn.setAttribute('aria-label', "Alternar para Modo Claro");
            } else {
                themeBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                `;
                themeBtn.title = "Alternar para Modo Escuro";
                themeBtn.setAttribute('aria-label', "Alternar para Modo Escuro");
            }
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

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

        function normalizeSearchText(str) {
            return (str || '').toString().toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        function recipeIsFullyStocked(recipe) {
            if (!pantryItems || pantryItems.length === 0) return false;
            const normPantry = pantryItems.map(normalizeSearchText);
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

        function recipeHasAnyPantryIngredient(recipe) {
            if (!pantryItems || pantryItems.length === 0) return false;
            const normPantry = pantryItems.map(normalizeSearchText);
            return recipe.ingredients.some(ing => {
                const normIng = normalizeSearchText(ing.name);
                return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
            });
        }

        function matchRecipeSearch(recipe, rawQuery) {
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

        // Document Ready init
        

        // Toast feedback notification system
        function showToast(message, type = 'success') {
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

        // Render Category Badges / Filters
        function renderCategoryFilters() {
            const container = document.getElementById('category-filters');
            container.innerHTML = '';
            const fragment = document.createDocumentFragment();

            // Get all category keys
            const keys = Object.keys(categories);
            
            // Sort keys: keep 'todos' at the beginning, and sort others alphabetically by description
            const sortedKeys = keys.filter(k => k === 'todos').concat(
                keys.filter(k => k !== 'todos').sort((a, b) => {
                    const descA = categories[a] || '';
                    const descB = categories[b] || '';
                    return descA.localeCompare(descB, 'pt-BR');
                })
            );

            sortedKeys.forEach(key => {
                // Get counts for category supporting multitag and current active filters (except activeCategory itself)
                let count = 0;
                const pantryMatch = (r) => !pantryFilterActive || recipeHasAnyPantryIngredient(r);
                if (key === 'todos') {
                    count = recipes.filter(r => {
                        const searchMatch = matchRecipeSearch(r, searchQuery).matches;
                        const favoriteMatch = !showFavoritesOnly || favorites.includes(r.id);
                        return searchMatch && favoriteMatch && pantryMatch(r);
                    }).length;
                } else {
                    count = recipes.filter(r => {
                        let categoryMatch = false;
                        if (Array.isArray(r.category)) {
                            categoryMatch = r.category.includes(key);
                        } else {
                            categoryMatch = r.category === key;
                        }
                        const searchMatch = matchRecipeSearch(r, searchQuery).matches;
                        const favoriteMatch = !showFavoritesOnly || favorites.includes(r.id);
                        return categoryMatch && searchMatch && favoriteMatch && pantryMatch(r);
                    }).length;
                }

                // Skip rendering if the category is empty, unless it's 'todos' or the currently active category
                if (count === 0 && key !== 'todos' && key !== activeCategory) {
                    return;
                }

                const button = document.createElement('button');
                button.className = `category-filter-btn ${activeCategory === key ? 'active' : ''}`;
                button.onclick = () => selectCategory(key);
                button.innerHTML = `
                    <span>${categories[key]}</span>
                    <span class="category-filter-badge">${count}</span>
                `;

                fragment.appendChild(button);
            });
            container.appendChild(fragment);
        }

        function selectCategory(categoryKey) {
            activeCategory = categoryKey;
            showFavoritesOnly = false; // Reset favorites-only filter when clicking category
            document.getElementById('favs-toggle').classList.remove('active');
            renderRecipes();
        }

        // Toggle Favorite recipes only
        function toggleFavoritesOnly() {
            showFavoritesOnly = !showFavoritesOnly;
            const btn = document.getElementById('favs-toggle');
            if (showFavoritesOnly) {
                btn.classList.add('active');
                activeCategory = 'todos';
            } else {
                btn.classList.remove('active');
            }
            renderRecipes();
        }

        // Search action
        function filterRecipes() {
            searchQuery = document.getElementById('search-input').value.toLowerCase();
            const clearBtn = document.getElementById('search-clear-btn');
            if (clearBtn) {
                if (searchQuery.length > 0) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
            renderRecipes();
        }

        function clearSearch() {
            const input = document.getElementById('search-input');
            input.value = '';
            searchQuery = '';
            const clearBtn = document.getElementById('search-clear-btn');
            if (clearBtn) {
                clearBtn.classList.add('hidden');
            }
            renderRecipes();
        }

        // Helper to update the visibility of Clear Filters button
        function updateClearFiltersBtnVisibility() {
            const clearFiltersBtn = document.getElementById('clear-filters-btn');
            if (!clearFiltersBtn) return;
            
            const hasActiveFilters = (searchQuery.length > 0) || 
                                     (activeCategory !== 'todos') || 
                                     showFavoritesOnly ||
                                     pantryFilterActive;
                                     
            if (hasActiveFilters) {
                clearFiltersBtn.classList.remove('hidden');
            } else {
                clearFiltersBtn.classList.add('hidden');
            }
        }

        // Clear all filters action
        function clearAllFilters() {
            // Clear search
            const input = document.getElementById('search-input');
            if (input) input.value = '';
            searchQuery = '';
            const clearBtn = document.getElementById('search-clear-btn');
            if (clearBtn) {
                clearBtn.classList.add('hidden');
            }

            // Clear active category
            activeCategory = 'todos';

            // Clear favorites filter
            showFavoritesOnly = false;
            const favsBtn = document.getElementById('favs-toggle');
            if (favsBtn) {
                favsBtn.classList.remove('active');
            }

            // Clear pantry filter
            pantryFilterActive = false;
            const pantryBtn = document.getElementById('pantry-toggle');
            if (pantryBtn) {
                pantryBtn.classList.remove('active');
            }

            // Re-render
            renderRecipes();
        }

        // Render card grid based on filters and search
        function renderRecipes() {
            const grid = document.getElementById('recipes-grid');
            const emptyState = document.getElementById('empty-state');
            grid.innerHTML = '';

            let filtered = recipes.filter(recipe => {
                // Category Filter supporting both string and array multitags
                let categoryMatch = false;
                if (activeCategory === 'todos') {
                    categoryMatch = true;
                } else {
                    if (Array.isArray(recipe.category)) {
                        categoryMatch = recipe.category.includes(activeCategory);
                    } else {
                        categoryMatch = recipe.category === activeCategory;
                    }
                }
                
                // Search Match (Check Title only)
                const searchMatch = matchRecipeSearch(recipe, searchQuery).matches;

                // Favorites Filter
                const favoriteMatch = !showFavoritesOnly || favorites.includes(recipe.id);

                // Pantry Filter
                const pantryMatch = !pantryFilterActive || recipeHasAnyPantryIngredient(recipe);

                return categoryMatch && searchMatch && favoriteMatch && pantryMatch;
            });

            // Update title results count
            const resultsTitle = document.getElementById('results-count');
            if (showFavoritesOnly) {
                resultsTitle.innerText = `Receitas Favoritas (${filtered.length})`;
            } else if (activeCategory !== 'todos') {
                resultsTitle.innerText = `${categories[activeCategory]} (${filtered.length})`;
            } else if (searchQuery) {
                resultsTitle.innerText = `Resultados da busca (${filtered.length})`;
            } else {
                resultsTitle.innerText = `Todas as Receitas (${filtered.length})`;
            }

            // Update category indicator on the right
            const indicator = document.getElementById('active-category-indicator');
            if (indicator) {
                if (showFavoritesOnly) {
                    indicator.innerText = 'Apenas Favoritas';
                } else if (activeCategory !== 'todos') {
                    indicator.innerText = categories[activeCategory];
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
                    const isFav = favorites.includes(recipe.id);
                    const isPlanned = isRecipePlanned(recipe.id);
                    const isFullyStocked = pantryFilterActive && recipeIsFullyStocked(recipe);
                    const pantryBadge = isFullyStocked ? '<span class="card-badge pantry-badge">✅ Você tem tudo</span>' : '';
                    const { matchedIngredients } = matchRecipeSearch(recipe, searchQuery);
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

                    // Render all categories for this recipe as badges
                    let categoryBadges = '';
                    if (Array.isArray(recipe.category)) {
                        categoryBadges = recipe.category.map(cat => 
                            `<span class="card-badge">${categories[cat] || cat}</span>`
                        ).join(' ');
                    } else {
                        categoryBadges = `<span class="card-badge">${categories[recipe.category] || recipe.category}</span>`;
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
                                    <button onclick="openDayPickerPopover(${recipe.id}, this)" class="card-action-btn plan-btn ${isPlanned ? 'active' : ''}" title="Planejar para a semana" aria-label="Planejar ${recipe.title} para a semana" aria-pressed="${isPlanned}">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </button>

                                    <button onclick="toggleFavorite(${recipe.id})" class="card-action-btn fav-btn ${isFav ? 'active' : ''}" title="Adicionar aos favoritos" aria-label="Adicionar ${recipe.title} aos favoritos" aria-pressed="${isFav}">
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

        // Favorite Toggle functionality
        function toggleFavorite(id) {
            if (favorites.includes(id)) {
                favorites = favorites.filter(favId => favId !== id);
            } else {
                favorites.push(id);
            }
            localStorage.setItem('chef_digital_favorites', JSON.stringify(favorites));
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
            const dayEntries = plannedByDay[day];
            const index = dayEntries.findIndex(e => e.recipeId === recipeId);
            let added;
            if (index !== -1) {
                dayEntries.splice(index, 1);
                added = false;
            } else {
                const recipe = recipes.find(r => r.id === recipeId);
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
            const entry = plannedByDay[day].find(e => e.recipeId === recipeId);
            if (entry) {
                const recipe = recipes.find(r => r.id === recipeId);
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

        function renderPlannerCardHtml(entry, day) {
            const recipe = recipes.find(r => r.id === entry.recipeId);
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

            // 3. Converter de mapa para array no grupo correspondente da lista de compras
            Object.keys(tempConsolidated).forEach(k => {
                shoppingList["Menu Semanal Consolidado"].push(tempConsolidated[k]);
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
            const recipe = recipes.find(r => r.id === activeRecipeId);
            if (!recipe) return;

            if (!shoppingList[recipe.title]) {
                shoppingList[recipe.title] = [];
            }

            recipe.ingredients.forEach(ing => {
                // Check if already in list to avoid duplicates
                const exists = shoppingList[recipe.title].some(item => item.name === ing.name);
                if (!exists) {
                    let qtyVal = scaleIngredientQty(ing.qty, activeRecipePortions, recipe.servings);
                    shoppingList[recipe.title].push({
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
            localStorage.setItem('chef_digital_shopping', JSON.stringify(shoppingList));
        }

        function updateShoppingListBadge() {
            const badge = document.getElementById('shopping-list-badge');
            let count = 0;
            Object.keys(shoppingList).forEach(key => {
                count += shoppingList[key].length;
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

            const keys = Object.keys(shoppingList);
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
                const items = shoppingList[recipeTitle];
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
            shoppingList[recipeTitle][index].checked = !shoppingList[recipeTitle][index].checked;
            saveShoppingList();
            renderShoppingList();
        }

        function removeRecipeFromShoppingList(recipeTitle) {
            delete shoppingList[recipeTitle];
            saveShoppingList();
            updateShoppingListBadge();
            renderShoppingList();
        }

        function clearShoppingList() {
            shoppingList = {};
            saveShoppingList();
            updateShoppingListBadge();
            renderShoppingList();
        }

        // Copy shopping checklist content to device clipboard
        function copyShoppingList() {
            let text = "🛒 MINHA LISTA DE COMPRAS - CHEF DIGITAL\n\n";
            let empty = true;

            Object.keys(shoppingList).forEach(recipeTitle => {
                const items = shoppingList[recipeTitle];
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
            const recipe = recipes.find(r => r.id === id);
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
                catText = recipe.category.map(cat => categories[cat] || cat).join(' | ');
            } else {
                catText = categories[recipe.category] || recipe.category;
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
            const recipe = recipes.find(r => r.id === activeRecipeId);
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
            const recipe = recipes.find(r => r.id === activeRecipeId);
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
                    textarea.value = pantryItems.join('\n');
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
                pantryItems = textarea.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
                localStorage.setItem('chef_digital_pantry', JSON.stringify(pantryItems));
            }
            pantryFilterActive = pantryItems.length > 0;
            
            const btn = document.getElementById('pantry-toggle');
            if (btn) {
                btn.classList.toggle('active', pantryFilterActive);
            }
            updatePantryEditBtnVisibility();
            
            closePantryModal();
            renderRecipes();
            showToast(pantryFilterActive ? 'Ingredientes salvos e filtro aplicado!' : 'Ingredientes salvos.');
        }

        function clearPantry() {
            const textarea = document.getElementById('pantry-textarea');
            if (textarea) {
                textarea.value = '';
            }
            pantryItems = [];
            localStorage.setItem('chef_digital_pantry', JSON.stringify([]));
            pantryFilterActive = false;
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
            editBtn.classList.toggle('hidden', pantryItems.length === 0);
        }

        function togglePantryFilterOrOpenModal(event) {
            if (pantryItems.length === 0) {
                openPantryModal();
            } else {
                pantryFilterActive = !pantryFilterActive;
                const btn = document.getElementById('pantry-toggle');
                if (btn) {
                    if (pantryFilterActive) {
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
      categories = cachedCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.label }), {});
      recipes = cachedRecipes;
      carregarPlannerData(recipes);
      
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
      categories = catData.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.label }), {});
      recipes = recData.map(r => ({
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
      await salvarCacheLocal('receitas', recipes);
      carregarPlannerData(recipes);

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
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    try {
        pantryItems = JSON.parse(localStorage.getItem('chef_digital_pantry')) || [];
    } catch (e) {
        pantryItems = [];
    }
    updatePantryEditBtnVisibility();
    inicializarApp();
};

// Export to global scope for HTML inline handlers
window.toggleTheme = toggleTheme;
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


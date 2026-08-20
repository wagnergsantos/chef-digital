import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme.js';
import { STORAGE_KEYS, PLANNER_DAYS, safeJsonParse } from './logic/storage.js';
import { createEmptyPlannedByDay, getAllPlannedEntries, getPlannedDaysForRecipe } from './logic/planner.js';
import { calculateConsolidatedShoppingList, formatShoppingListText, countShoppingItems } from './logic/shopping.js';
import { formatRecipeShareText } from './logic/recipe-modal-logic.js';
import { supabase } from './api/supabase.js';
import { mapSummaryRecipes, buildRecipeDetailsIndex } from './api/recipes-loader.js';

import { filterRecipesList } from './logic/recipes-filter.js';

import { ThemeToggle } from './components/ThemeToggle.jsx';
import { FilterSidebar } from './components/FilterSidebar.jsx';
import { RecipesGrid } from './components/RecipesGrid.jsx';
import { PlannerDrawer } from './components/PlannerDrawer.jsx';
import { ShoppingDrawer } from './components/ShoppingDrawer.jsx';
import { PantryDrawer } from './components/PantryDrawer.jsx';
import { RecipeModal } from './components/RecipeModal.jsx';
import { CookingMode } from './components/CookingMode.jsx';

export function App() {
    const { theme, toggleTheme } = useTheme();

    // App state
    const [recipes, setRecipes] = useState([]);
    const [categories, setCategories] = useState({});
    const [categoriesById, setCategoriesById] = useState({});
    const [tagsMap, setTagsMap] = useState({});
    const [recipeTagsMap, setRecipeTagsMap] = useState({});

    // Filter states
    const [activeCategory, setActiveCategory] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showPantryOnly, setShowPantryOnly] = useState(false);
    const [activeTags, setActiveTags] = useState(() => safeJsonParse(STORAGE_KEYS.ACTIVE_TAGS, []));

    // User data persistence states
    const [favorites, setFavorites] = useState(() => safeJsonParse(STORAGE_KEYS.FAVORITES, []));
    const [shoppingList, setShoppingList] = useState(() => safeJsonParse(STORAGE_KEYS.SHOPPING, {}));
    const [pantryItems, setPantryItems] = useState(() => safeJsonParse(STORAGE_KEYS.PANTRY, []));
    const [plannedByDay, setPlannedByDay] = useState(() => safeJsonParse('chef_digital_planned', createEmptyPlannedByDay()));
    const [cookingHistory] = useState(() => safeJsonParse(STORAGE_KEYS.COOKING_HISTORY, {}));

    // UI Drawers / Modals states
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [isShoppingOpen, setIsShoppingOpen] = useState(false);
    const [isPantryOpen, setIsPantryOpen] = useState(false);
    const [activeRecipeModalId, setActiveRecipeModalId] = useState(null);
    const [cookingModeRecipe, setCookingModeRecipe] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Initial fetch / cache loading
    useEffect(() => {
        async function loadInitialData() {
            try {
                const { data: recData } = await supabase
                    .from('receitas_resumo')
                    .select('id, title, category_id, category, emoji, image, servings, prep_time, cook_time, source_url, author, tips, ingredient_count')
                    .order('title');

                const [{ data: catData }, { data: tagData }, { data: recipeTagsData }, { data: ingData }, { data: stepData }] = await Promise.all([
                    supabase.from('categorias').select('*').order('sort_order'),
                    supabase.from('tags').select('*').order('sort_order'),
                    supabase.from('receita_tags').select('receita_id, tags(key)'),
                    supabase.from('ingredientes').select('receita_id, name, qty, unit').order('ordem'),
                    supabase.from('passos').select('receita_id, step_text').order('ordem')
                ]);

                let catById = {};
                if (catData) {
                    const catMap = { todos: 'Todas as Receitas' };
                    catData.forEach(c => {
                        catMap[c.key] = c.label || c.description || c.key;
                        catById[String(c.id)] = c.key;
                    });
                    setCategories(catMap);
                    setCategoriesById(catById);
                }

                if (recData && recData.length > 0) {
                    const detailsIndex = buildRecipeDetailsIndex(ingData || [], stepData || []);
                    const mapped = mapSummaryRecipes(recData).map(r => ({
                        ...r,
                        category: catById[String(r.category_id)] || r.category || 'outros',
                        ingredients: detailsIndex[r.id]?.ingredients || [],
                        steps: detailsIndex[r.id]?.steps || []
                    }));
                    setRecipes(mapped);
                }

                if (tagData) {
                    setTagsMap(tagData.reduce((acc, tag) => ({ ...acc, [tag.key]: tag.label }), {}));
                }

                if (recipeTagsData) {
                    const rtMap = {};
                    recipeTagsData.forEach(rt => {
                        if (!rtMap[rt.receita_id]) rtMap[rt.receita_id] = [];
                        rtMap[rt.receita_id].push(rt.tags.key);
                    });
                    setRecipeTagsMap(rtMap);
                }
            } catch (e) {
                console.warn('Erro ao carregar dados do Supabase:', e);
            }
        }
        loadInitialData();
    }, []);

    // Save persistent states
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(shoppingList));
    }, [shoppingList]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantryItems));
    }, [pantryItems]);

    useEffect(() => {
        localStorage.setItem('chef_digital_planned', JSON.stringify(plannedByDay));
    }, [plannedByDay]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAGS, JSON.stringify(activeTags));
    }, [activeTags]);

    const handleSelectCategory = (categoryKey) => {
        setActiveCategory(categoryKey);
        setShowFavoritesOnly(false);
        setActiveTags([]);
    };

    const handleToggleTag = (tagKey) => {
        setActiveTags(prev => prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]);
    };

    const handleClearAllFilters = () => {
        setSearchQuery('');
        setActiveCategory('todos');
        setActiveTags([]);
        setShowFavoritesOnly(false);
        setShowPantryOnly(false);
    };

    const toggleFavorite = (id) => {
        setFavorites(prev => {
            const exists = prev.includes(id);
            const next = exists ? prev.filter(f => f !== id) : [...prev, id];
            showToast(exists ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
            return next;
        });
    };

    const handleToggleRecipePlanner = (recipeId) => {
        const plannedDays = getPlannedDaysForRecipe(recipeId, plannedByDay);
        if (plannedDays.length > 0) {
            // Se já está planejada em algum dia, remove de todos os dias
            setPlannedByDay(prev => {
                const nextPlanned = { ...prev };
                PLANNER_DAYS.forEach(d => {
                    if (nextPlanned[d.key]) {
                        nextPlanned[d.key] = nextPlanned[d.key].filter(e => e.recipeId !== recipeId);
                    }
                });
                return nextPlanned;
            });
            showToast('Removido do menu semanal');
        } else {
            // Se não está planejada, adiciona em 'pending' (A Definir) por padrão
            const recipe = recipes.find(r => r.id === recipeId);
            const defaultPeople = recipe?.servings ? parseInt(recipe.servings, 10) || 1 : 1;
            setPlannedByDay(prev => ({
                ...prev,
                pending: [...(prev.pending || []), { recipeId, people: defaultPeople }]
            }));
            showToast('Adicionado ao menu de planejamento');
        }
    };

    const handleToggleRecipeOnDay = (recipeId, day) => {
        setPlannedByDay(prev => {
            const nextPlanned = { ...prev };
            const dayEntries = nextPlanned[day] ? [...nextPlanned[day]] : [];
            const index = dayEntries.findIndex(e => e.recipeId === recipeId);

            if (index !== -1) {
                dayEntries.splice(index, 1);
                showToast(`Removido do menu`);
            } else {
                const recipe = recipes.find(r => r.id === recipeId);
                const defaultPeople = recipe?.servings ? parseInt(recipe.servings, 10) || 1 : 1;
                dayEntries.push({ recipeId, people: defaultPeople });
                showToast(`Adicionado ao menu`);
            }

            nextPlanned[day] = dayEntries;
            return nextPlanned;
        });
    };

    const handleMovePlannerRecipeDay = (recipeId, currentDay, targetDay) => {
        if (currentDay === targetDay) return;
        setPlannedByDay(prev => {
            const nextPlanned = { ...prev };
            const sourceEntries = nextPlanned[currentDay] ? [...nextPlanned[currentDay]] : [];
            const entryIndex = sourceEntries.findIndex(e => e.recipeId === recipeId);
            if (entryIndex === -1) return prev;

            const [entry] = sourceEntries.splice(entryIndex, 1);
            nextPlanned[currentDay] = sourceEntries;

            const targetEntries = nextPlanned[targetDay] ? [...nextPlanned[targetDay]] : [];
            targetEntries.push(entry);
            nextPlanned[targetDay] = targetEntries;

            return nextPlanned;
        });
    };

    const handleChangePlannerPortions = (recipeId, day, dir) => {
        setPlannedByDay(prev => {
            const nextPlanned = { ...prev };
            const dayEntries = nextPlanned[day] ? [...nextPlanned[day]] : [];
            const entry = dayEntries.find(e => e.recipeId === recipeId);
            if (entry) {
                entry.people = Math.max(1, (entry.people || 1) + dir);
                nextPlanned[day] = dayEntries;
            }
            return nextPlanned;
        });
    };

    const handleGenerateConsolidated = () => {
        const allEntries = [];
        Object.keys(plannedByDay).forEach(d => {
            (plannedByDay[d] || []).forEach(e => allEntries.push(e));
        });

        if (allEntries.length === 0) {
            showToast('Seu menu semanal está vazio!');
            return;
        }

        const nextShopping = calculateConsolidatedShoppingList(allEntries, recipes, shoppingList);
        if (nextShopping) {
            setShoppingList(nextShopping);
            setIsPlannerOpen(false);
            setIsShoppingOpen(true);
            showToast('Lista consolidada gerada!');
        }
    };

    const handleAddRecipeToShopping = (recipeId, portions) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        setShoppingList(prev => {
            const recipeTitle = recipe.title;
            const currentGroup = prev[recipeTitle] ? [...prev[recipeTitle]] : [];
            const newIngredients = (recipe.ingredients || []).filter(ing => !currentGroup.some(i => i.name === ing.name));

            const addedItems = newIngredients.map(ing => ({
                name: ing.name,
                qty: ing.qty !== null ? (ing.qty / (recipe.servings || 1)) * portions : null,
                unit: ing.unit,
                checked: false
            }));

            return {
                ...prev,
                [recipeTitle]: [...currentGroup, ...addedItems]
            };
        });

        showToast('Ingredientes adicionados à Lista!');
    };

    const activeRecipeModal = recipes.find(r => r.id === activeRecipeModalId);

    return (
        <div className="app-container">
            {toastMessage && (
                <div className="toast-message" role="status" aria-live="polite">
                    {toastMessage}
                </div>
            )}

            <header className="header">
                <div className="header-container">
                    <div className="brand">
                        <div className="brand-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {/* Garfo */}
                                <path d="M6 3v6a3 3 0 0 0 3 3v9" />
                                <path d="M6 3v4" />
                                <path d="M9 3v4" />
                                <path d="M12 3v4" />
                                {/* Faca */}
                                <path d="M18 3v18M18 3c-2 0-3 2-3 5v4h3" />
                            </svg>
                        </div>
                        <div className="brand-text">
                            <h1>Chef Digital</h1>
                            <p>Todas as suas receitas em um só lugar</p>
                        </div>
                    </div>

                    <div className="header-controls">
                        {/* 1. Favorites Only Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowFavoritesOnly(prev => {
                                    const next = !prev;
                                    if (next) setActiveCategory('todos');
                                    return next;
                                });
                            }}
                            className={`control-btn btn-favorites ${showFavoritesOnly ? 'active' : ''}`}
                            title="Visualizar Favoritos"
                            aria-label="Filtrar por receitas favoritas"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                        </button>

                        {/* 2. Pantry Drawer Trigger */}
                        <button
                            type="button"
                            onClick={() => setIsPantryOpen(true)}
                            className={`control-btn btn-pantry ${showPantryOnly ? 'active' : ''}`}
                            title="Despensa"
                            aria-label="Gerenciar ingredientes da despensa"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 8h14M9 8h6M9 16h6"></path>
                            </svg>
                            {pantryItems.length > 0 && (
                                <span className="btn-badge pantry-badge">{pantryItems.length}</span>
                            )}
                        </button>

                        {/* 3. Planner Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setIsPlannerOpen(true)}
                            className="control-btn btn-planner"
                            title="Menu Semanal"
                            aria-label="Planejador de menu semanal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {getAllPlannedEntries(plannedByDay).length > 0 && (
                                <span className="btn-badge planner-badge">{getAllPlannedEntries(plannedByDay).length}</span>
                            )}
                        </button>

                        {/* 4. Shopping List Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setIsShoppingOpen(true)}
                            className="control-btn btn-shopping"
                            title="Lista de Compras"
                            aria-label="Lista de compras"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                            </svg>
                            {countShoppingItems(shoppingList) > 0 && (
                                <span className="btn-badge shopping-badge">{countShoppingItems(shoppingList)}</span>
                            )}
                        </button>

                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                </div>
            </header>

            <main className="main-layout">
                <FilterSidebar
                    recipes={recipes}
                    categories={categories}
                    tagsMap={tagsMap}
                    recipeTagsMap={recipeTagsMap}
                    searchQuery={searchQuery}
                    activeCategory={activeCategory}
                    activeTags={activeTags}
                    showFavoritesOnly={showFavoritesOnly}
                    favorites={favorites}
                    showPantryOnly={showPantryOnly}
                    pantryItems={pantryItems}
                    onSearchChange={setSearchQuery}
                    onSelectCategory={handleSelectCategory}
                    onToggleTag={handleToggleTag}
                    onClearFilters={handleClearAllFilters}
                />

                <section className="recipes-section">
                    <div className="results-header">
                        <h2 id="results-count" role="status" aria-live="polite">
                            {filterRecipesList(recipes, {
                                activeCategory,
                                searchQuery,
                                showFavoritesOnly,
                                favorites,
                                showPantryOnly,
                                pantryItems,
                                activeTags,
                                recipeTags: recipeTagsMap
                            }).length} receita(s) encontrada(s)
                        </h2>
                        {activeCategory !== 'todos' && (
                            <span className="results-indicator" id="active-category-indicator">
                                {categories[activeCategory]}
                            </span>
                        )}
                    </div>
                    <RecipesGrid
                        recipes={recipes}
                        categories={categories}
                        categoriesById={categoriesById}
                        tagsMap={tagsMap}
                        recipeTagsMap={recipeTagsMap}
                        activeCategory={activeCategory}
                        searchQuery={searchQuery}
                        showFavoritesOnly={showFavoritesOnly}
                        favorites={favorites}
                        showPantryOnly={showPantryOnly}
                        pantryItems={pantryItems}
                        activeTags={activeTags}
                        plannedByDay={plannedByDay}
                        onOpenModal={(id) => setActiveRecipeModalId(id)}
                        onToggleFavorite={toggleFavorite}
                        onTogglePlanner={handleToggleRecipePlanner}
                    />
                </section>
            </main>

            <PlannerDrawer
                isOpen={isPlannerOpen}
                onClose={() => setIsPlannerOpen(false)}
                plannedByDay={plannedByDay}
                recipes={recipes}
                onRemoveRecipe={(id, day) => handleToggleRecipeOnDay(id, day)}
                onChangeDay={(id, curDay, targetDay) => handleMovePlannerRecipeDay(id, curDay, targetDay)}
                onChangePortions={handleChangePlannerPortions}
                onClearPlanner={() => setPlannedByDay(createEmptyPlannedByDay())}
                onGenerateConsolidated={handleGenerateConsolidated}
            />

            <ShoppingDrawer
                isOpen={isShoppingOpen}
                onClose={() => setIsShoppingOpen(false)}
                shoppingList={shoppingList}
                onToggleItem={(title, idx) => {
                    setShoppingList(prev => {
                        const items = [...(prev[title] || [])];
                        if (items[idx]) {
                            items[idx] = { ...items[idx], checked: !items[idx].checked };
                        }
                        return { ...prev, [title]: items };
                    });
                }}
                onRemoveRecipeGroup={(title) => {
                    setShoppingList(prev => {
                        const next = { ...prev };
                        delete next[title];
                        return next;
                    });
                }}
                onClearList={() => setShoppingList({})}
                onCopyList={() => {
                    const text = formatShoppingListText(shoppingList);
                    if (text) {
                        navigator.clipboard.writeText(text);
                        showToast('Lista copiada!');
                    }
                }}
                onGenerateConsolidated={handleGenerateConsolidated}
            />

            <PantryDrawer
                isOpen={isPantryOpen}
                onClose={() => setIsPantryOpen(false)}
                pantryItems={pantryItems}
                showPantryOnly={showPantryOnly}
                onTogglePantryFilter={() => {
                    setShowPantryOnly(prev => {
                        const next = !prev;
                        if (next) setActiveCategory('todos');
                        return next;
                    });
                }}
                onSavePantry={(items) => {
                    setPantryItems(items);
                    showToast('Despensa salva!');
                }}
                onClearPantry={() => {
                    setPantryItems([]);
                    setShowPantryOnly(false);
                    showToast('Despensa limpa!');
                }}
            />

            <RecipeModal
                isOpen={Boolean(activeRecipeModalId)}
                onClose={() => setActiveRecipeModalId(null)}
                recipe={activeRecipeModal}
                categories={categories}
                categoriesById={categoriesById}
                plannedByDay={plannedByDay}
                cookingHistory={cookingHistory}
                onTogglePlanner={(id) => handleToggleRecipePlanner(id)}
                onAddIngredientsToShopping={handleAddRecipeToShopping}
                onStartCooking={(recipeToCook) => {
                    setActiveRecipeModalId(null);
                    setCookingModeRecipe(recipeToCook);
                }}
                onShare={(r) => {
                    const text = formatRecipeShareText(r, categories);
                    navigator.clipboard.writeText(text);
                    showToast('Receita copiada!');
                }}
            />

            <CookingMode
                isOpen={Boolean(cookingModeRecipe)}
                onClose={() => setCookingModeRecipe(null)}
                recipe={cookingModeRecipe}
                onComplete={() => showToast('Parabéns! Receita concluída!')}
            />
        </div>
    );
}

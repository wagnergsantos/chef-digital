import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme.js';
import { STORAGE_KEYS, safeJsonParse } from './logic/storage.js';
import { createEmptyPlannedByDay } from './logic/planner.js';
import { calculateConsolidatedShoppingList, formatShoppingListText } from './logic/shopping.js';
import { formatRecipeShareText } from './logic/recipe-modal-logic.js';
import { supabase } from './api/supabase.js';
import { mapSummaryRecipes } from './api/recipes-loader.js';

import { ThemeToggle } from './components/ThemeToggle.jsx';
import { RecipesGrid } from './components/RecipesGrid.jsx';
import { PlannerDrawer } from './components/PlannerDrawer.jsx';
import { ShoppingDrawer } from './components/ShoppingDrawer.jsx';
import { PantryModal } from './components/PantryModal.jsx';
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
    const [activeCategory] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showPantryOnly, setShowPantryOnly] = useState(false);
    const [activeTags] = useState(() => safeJsonParse(STORAGE_KEYS.ACTIVE_TAGS, []));

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

                if (recData && recData.length > 0) {
                    setRecipes(mapSummaryRecipes(recData));
                }

                const [{ data: catData }, { data: tagData }, { data: recipeTagsData }] = await Promise.all([
                    supabase.from('categorias').select('*').order('sort_order'),
                    supabase.from('tags').select('*').order('sort_order'),
                    supabase.from('receita_tags').select('receita_id, tags(key)')
                ]);

                if (catData) {
                    const catMap = { todos: 'Todas as Receitas' };
                    const catById = {};
                    catData.forEach(c => {
                        catMap[c.key] = c.description;
                        catById[String(c.id)] = c.key;
                    });
                    setCategories(catMap);
                    setCategoriesById(catById);
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

    const toggleFavorite = (id) => {
        setFavorites(prev => {
            const exists = prev.includes(id);
            const next = exists ? prev.filter(f => f !== id) : [...prev, id];
            showToast(exists ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
            return next;
        });
    };

    const handleToggleRecipeOnDay = (recipeId, day) => {
        setPlannedByDay(prev => {
            const nextPlanned = { ...prev };
            const dayEntries = nextPlanned[day] ? [...nextPlanned[day]] : [];
            const index = dayEntries.findIndex(e => e.recipeId === recipeId);

            if (index !== -1) {
                dayEntries.splice(index, 1);
                showToast(`Removido do menu de ${day}`);
            } else {
                const recipe = recipes.find(r => r.id === recipeId);
                const defaultPeople = recipe?.servings ? parseInt(recipe.servings, 10) || 1 : 1;
                dayEntries.push({ recipeId, people: defaultPeople });
                showToast(`Adicionado ao menu de ${day}`);
            }

            nextPlanned[day] = dayEntries;
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
                <div className="toast show" role="status" aria-live="polite">
                    {toastMessage}
                </div>
            )}

            <header className="header">
                <div className="header-container">
                    <div className="brand">
                        <div className="brand-icon">🍽️</div>
                        <div className="brand-text">
                            <h1>Chef Digital</h1>
                            <p>Todas as suas receitas em um só lugar</p>
                        </div>
                    </div>

                    <div className="header-controls">
                        <button
                            type="button"
                            onClick={() => setIsPantryOpen(true)}
                            className={`control-btn btn-pantry ${showPantryOnly ? 'active' : ''}`}
                            title="Filtrar por Despensa"
                        >
                            Despensa ({pantryItems.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowFavoritesOnly(prev => !prev)}
                            className={`control-btn btn-favorites ${showFavoritesOnly ? 'active' : ''}`}
                            title="Visualizar Favoritos"
                        >
                            Favoritos ({favorites.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsPlannerOpen(true)}
                            className="control-btn btn-planner"
                            title="Menu Semanal"
                        >
                            📅 Menu
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsShoppingOpen(true)}
                            className="control-btn btn-shopping"
                            title="Lista de Compras"
                        >
                            🛒 Lista
                        </button>

                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                </div>
            </header>

            <main className="main-layout">
                <aside className="sidebar">
                    <div className="search-box">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por título ou ingrediente…"
                            className="search-input"
                        />
                    </div>
                </aside>

                <section className="recipes-section">
                    <RecipesGrid
                        recipes={recipes}
                        categories={categories}
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
                        onOpenDayPicker={(id) => handleToggleRecipeOnDay(id, 'seg')}
                    />
                </section>
            </main>

            <PlannerDrawer
                isOpen={isPlannerOpen}
                onClose={() => setIsPlannerOpen(false)}
                plannedByDay={plannedByDay}
                recipes={recipes}
                onRemoveRecipe={(id, day) => handleToggleRecipeOnDay(id, day)}
                onChangePortions={handleChangePlannerPortions}
                onClearPlanner={() => setPlannedByDay(createEmptyPlannedByDay())}
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

            <PantryModal
                isOpen={isPantryOpen}
                onClose={() => setIsPantryOpen(false)}
                pantryItems={pantryItems}
                onSave={(items) => {
                    setPantryItems(items);
                    setShowPantryOnly(items.length > 0);
                    setIsPantryOpen(false);
                    showToast('Despensa salva!');
                }}
                onClear={() => {
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
                onTogglePlanner={(id) => handleToggleRecipeOnDay(id, 'seg')}
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

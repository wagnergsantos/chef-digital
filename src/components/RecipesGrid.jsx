import React, { useState, useEffect, useRef } from 'react';
import { filterRecipesList } from '../logic/recipes-filter.js';
import { isRecipePlanned } from '../logic/planner.js';
import { RecipeCard } from './RecipeCard.jsx';

export function RecipesGrid({
    recipes = [],
    categories = {},
    categoriesById = {},
    tagsMap = {},
    recipeTagsMap = {},
    activeCategory = 'todos',
    searchQuery = '',
    showFavoritesOnly = false,
    favorites = [],
    showPantryOnly = false,
    pantryItems = [],
    activeTags = [],
    plannedByDay = {},
    onOpenModal,
    onToggleFavorite,
    onTogglePlanner
}) {
    const PAGE_SIZE = 12;
    const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef(null);

    const filteredRecipes = filterRecipesList(recipes, {
        activeCategory,
        searchQuery,
        showFavoritesOnly,
        favorites,
        showPantryOnly,
        pantryItems,
        activeTags,
        recipeTags: recipeTagsMap
    });

    useEffect(() => {
        setDisplayedCount(PAGE_SIZE);
    }, [activeCategory, searchQuery, showFavoritesOnly, showPantryOnly, activeTags, recipes]);

    useEffect(() => {
        if (displayedCount >= filteredRecipes.length) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredRecipes.length));
            }
        }, { rootMargin: '200px' });

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [displayedCount, filteredRecipes.length]);

    if (filteredRecipes.length === 0) {
        return (
            <div id="empty-state" className="empty-state">
                <p>Nenhuma receita encontrada para os filtros selecionados.</p>
            </div>
        );
    }

    const visibleRecipes = filteredRecipes.slice(0, displayedCount);

    return (
        <div id="recipes-grid" className="recipes-grid">
            {visibleRecipes.map((recipe, index) => (
                <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    isPlanned={isRecipePlanned(recipe.id, plannedByDay)}
                    isFavorite={favorites.includes(recipe.id)}
                    categories={categories}
                    categoriesById={categoriesById}
                    tagsMap={tagsMap}
                    recipeTags={recipeTagsMap[recipe.id] || []}
                    showPantryOnly={showPantryOnly}
                    pantryItems={pantryItems}
                    searchQuery={searchQuery}
                    onOpenModal={onOpenModal}
                    onToggleFavorite={onToggleFavorite}
                    onTogglePlanner={onTogglePlanner}
                />
            ))}

            {displayedCount < filteredRecipes.length && (
                <div
                    ref={sentinelRef}
                    id="grid-scroll-sentinel"
                    style={{ gridColumn: '1 / -1', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}

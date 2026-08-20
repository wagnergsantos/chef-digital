import React from 'react';
import { matchRecipeSearch, recipeHasAnyPantryIngredient } from '../logic/recipes-filter.js';

export function FilterSidebar({
    recipes = [],
    categories = {},
    tagsMap = {},
    recipeTagsMap = {},
    searchQuery = '',
    activeCategory = 'todos',
    activeTags = [],
    showFavoritesOnly = false,
    favorites = [],
    showPantryOnly = false,
    pantryItems = [],
    onSearchChange,
    onSelectCategory,
    onToggleTag,
    onClearFilters
}) {
    // Base list: recipes matching everything except category itself
    const baseForCategoryCounts = recipes.filter(recipe => {
        const searchMatch = matchRecipeSearch(recipe, searchQuery).matches;
        const favoriteMatch = !showFavoritesOnly || favorites.includes(recipe.id);
        const pantryMatch = !showPantryOnly || recipeHasAnyPantryIngredient(recipe, pantryItems);
        return searchMatch && favoriteMatch && pantryMatch;
    });

    const categoryCounts = { todos: baseForCategoryCounts.length };
    baseForCategoryCounts.forEach(recipe => {
        if (recipe.category) {
            categoryCounts[recipe.category] = (categoryCounts[recipe.category] || 0) + 1;
        }
    });

    const categoryKeys = Object.keys(categories);
    const sortedCategoryKeys = categoryKeys
        .filter(k => k === 'todos')
        .concat(
            categoryKeys
                .filter(k => k !== 'todos')
                .sort((a, b) => (categories[a] || '').localeCompare(categories[b] || '', 'pt-BR'))
        );

    // Base list for tag counts: recipes matching search + category + favorites + pantry (tags themselves ignored)
    const baseForTagCounts = recipes.filter(recipe => {
        const searchMatch = matchRecipeSearch(recipe, searchQuery).matches;
        const categoryMatch = activeCategory === 'todos' || recipe.category === activeCategory;
        const favoriteMatch = !showFavoritesOnly || favorites.includes(recipe.id);
        const pantryMatch = !showPantryOnly || recipeHasAnyPantryIngredient(recipe, pantryItems);
        return searchMatch && categoryMatch && favoriteMatch && pantryMatch;
    });

    const tagCounts = {};
    baseForTagCounts.forEach(recipe => {
        (recipeTagsMap[recipe.id] || []).forEach(tagKey => {
            tagCounts[tagKey] = (tagCounts[tagKey] || 0) + 1;
        });
    });

    const sortedTagKeys = Object.keys(tagsMap).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const hasActiveFilters = searchQuery.length > 0 ||
        activeCategory !== 'todos' ||
        showFavoritesOnly ||
        showPantryOnly ||
        activeTags.length > 0;

    return (
        <aside className="sidebar">
            <div className="sidebar-sticky">
                <div>
                    <span className="sidebar-title">Buscar</span>
                    <div className="search-box">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Buscar por título ou ingrediente…"
                            className="search-input"
                            aria-label="Buscar receitas por título ou ingrediente"
                        />
                        {searchQuery.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="search-clear-btn"
                                title="Limpar busca"
                                aria-label="Limpar busca"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <span className="sidebar-title">Categorias</span>
                    <div className="categories-filter-list" id="category-filters">
                        {sortedCategoryKeys.map(key => {
                            const count = categoryCounts[key] || 0;
                            if (count === 0 && key !== 'todos' && key !== activeCategory) return null;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`category-filter-btn ${activeCategory === key ? 'active' : ''}`}
                                    onClick={() => onSelectCategory(key)}
                                >
                                    <span>{categories[key]}</span>
                                    <span className="category-filter-badge">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <span className="sidebar-title">Tags</span>
                    <div className="tags-filter-list" id="tag-filters">
                        {sortedTagKeys.map(key => {
                            const count = tagCounts[key] || 0;
                            const isActive = activeTags.includes(key);
                            if (count === 0 && !isActive) return null;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`tag-filter-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => onToggleTag(key)}
                                >
                                    <span>{tagsMap[key]}</span>
                                    <span className="tag-filter-badge">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="clear-filters-btn"
                        title="Limpar todos os filtros ativos"
                        aria-label="Limpar todos os filtros ativos"
                    >
                        <span>Limpar Filtros</span>
                    </button>
                )}
            </div>
        </aside>
    );
}

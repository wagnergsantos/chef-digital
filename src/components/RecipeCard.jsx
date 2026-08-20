import React from 'react';
import { getCardImageLoadingAttrs, buildRecipeCardAccessibleName } from '../logic/performance-guards.js';
import { matchRecipeSearch, recipeIsFullyStocked } from '../logic/recipes-filter.js';

export function RecipeCard({
    recipe,
    index,
    isPlanned,
    isFavorite,
    categories = {},
    tagsMap = {},
    recipeTags = [],
    showPantryOnly = false,
    pantryItems = [],
    searchQuery = '',
    onOpenModal,
    onToggleFavorite,
    onTogglePlanner
}) {
    if (!recipe) return null;

    const safeTitle = recipe.title || 'Receita';
    const safeEmoji = recipe.emoji || '🍽️';
    const safeCategoryLabel = categories[recipe.category] || recipe.category || 'Sem categoria';
    const safeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const safeServings = recipe.servings !== undefined && recipe.servings !== null ? String(recipe.servings) : null;
    const isFullyStocked = showPantryOnly && recipeIsFullyStocked(recipe, pantryItems);
    const { matchedIngredients } = matchRecipeSearch(recipe, searchQuery);

    const hasImg = recipe.image && recipe.image.trim() !== "";
    const imageAttrs = getCardImageLoadingAttrs(index);

    return (
        <div
            className={`recipe-card ${isPlanned ? 'planned' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={buildRecipeCardAccessibleName(recipe.title)}
            onClick={() => onOpenModal(recipe.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenModal(recipe.id);
                }
            }}
        >
            <div className={`card-header-graphic ${hasImg ? 'has-image' : ''}`}>
                {hasImg && (
                    <img
                        src={recipe.image}
                        className="card-header-image"
                        alt={`Foto de ${safeTitle}`}
                        loading={imageAttrs.loading}
                        fetchPriority={imageAttrs.fetchpriority}
                        width="400"
                        height="112"
                    />
                )}
                <span className="card-emoji" role="img" aria-label={`Emoji representativo de ${safeTitle}`}>
                    {safeEmoji}
                </span>
                <div className="card-badges-wrapper">
                    {isPlanned && <span className="card-badge planned-badge">Planejado</span>}
                    {isFullyStocked && <span className="card-badge pantry-badge">✅ Você tem tudo</span>}
                    <span className="card-badge">{safeCategoryLabel}</span>
                </div>
            </div>

            <div className="card-body">
                <div className="card-info">
                    <p className="card-title">{safeTitle}</p>
                    {recipeTags.length > 0 && (
                        <div className="card-tags">
                            {recipeTags.map(tagKey => (
                                <span key={tagKey} className="card-tag-badge">
                                    {tagsMap[tagKey] || tagKey}
                                </span>
                            ))}
                        </div>
                    )}
                    {matchedIngredients && matchedIngredients.length > 0 && (
                        <p className="card-search-match">🔍 Contém: {matchedIngredients.join(', ')}</p>
                    )}
                </div>

                <div className="card-footer">
                    <div className="card-meta">
                        <span className="card-ingredients-count">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {recipe.ingredient_count !== undefined && recipe.ingredient_count !== null ? recipe.ingredient_count : safeIngredients.length} ing.
                        </span>
                        {safeServings !== null && (
                            <span className="card-servings-count" title="Rendimento da receita">
                                👥 {safeServings} pessoas
                            </span>
                        )}
                    </div>

                    <div className="card-actions">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlanner(recipe.id);
                            }}
                            className={`card-action-btn plan-btn ${isPlanned ? 'active' : ''}`}
                            title="Planejar para a semana"
                            aria-label={`Planejar ${safeTitle} para a semana`}
                            aria-pressed={isPlanned}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(recipe.id);
                            }}
                            className={`card-action-btn fav-btn ${isFavorite ? 'active' : ''}`}
                            title="Adicionar aos favoritos"
                            aria-label={`Adicionar ${safeTitle} aos favoritos`}
                            aria-pressed={isFavorite}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

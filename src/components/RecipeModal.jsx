import React, { useState, useEffect } from 'react';
import { scaleIngredientQty } from '../logic/recipes.js';
import { isRecipePlanned } from '../logic/planner.js';

export function RecipeModal({
    isOpen,
    onClose,
    recipe,
    categories = {},
    categoriesById = {},
    plannedByDay = {},
    cookingHistory = {},
    onTogglePlanner,
    onAddIngredientsToShopping,
    onStartCooking,
    onShare
}) {
    const [portions, setPortions] = useState(1);
    const [completedSteps, setCompletedSteps] = useState(new Set());

    useEffect(() => {
        if (recipe) {
            const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
            setPortions(!isNaN(parsedServings) && parsedServings > 0 ? parsedServings : 1);
            setCompletedSteps(new Set());
        }
    }, [recipe]);

    if (!isOpen || !recipe) return null;

    const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
    const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
    const maxLimit = isServingsMode ? 20 : 10;

    const handlePortionsChange = (dir) => {
        const next = portions + dir;
        if (next >= 1 && next <= maxLimit) {
            setPortions(next);
        }
    };

    const toggleStep = (index) => {
        setCompletedSteps(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const catKey = recipe.category || categoriesById[String(recipe.category_id)] || recipe.category;
    const catText = categories[catKey] || catKey;
    const isPlanned = isRecipePlanned(recipe.id, plannedByDay);
    const historyRecord = cookingHistory ? cookingHistory[recipe.id] : null;

    return (
        <div className="modal open" id="recipe-modal" role="dialog" aria-label={`Receita: ${recipe.title}`} onClick={(e) => e.target.id === 'recipe-modal' && onClose()}>
            <div className="modal-content recipe-modal-content">
                <div
                    className={`modal-header-banner ${recipe.image ? 'has-image' : ''}`}
                    style={recipe.image ? { backgroundImage: `url('${recipe.image}')` } : undefined}
                >
                    <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Fechar receita">
                        ✕
                    </button>
                    <div className="modal-header-info">
                        <span id="modal-category-badge" className="category-badge">{catText}</span>
                        <h2 id="modal-title">{recipe.title}</h2>
                        <div className="modal-badges">
                            {recipe.servings && <span className="info-badge">🍽️ Rende: {recipe.servings}</span>}
                            {recipe.prep_time && <span className="info-badge">⏱️ Preparo: {recipe.prep_time} min</span>}
                            {recipe.cook_time && <span className="info-badge">🍳 Fogo: {recipe.cook_time} min</span>}
                            {historyRecord && historyRecord.count > 0 && historyRecord.lastCooked && (
                                <span className="info-badge">
                                    👨‍🍳 Preparado {historyRecord.count}x ({new Date(historyRecord.lastCooked).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-actions-bar">
                    <button
                        type="button"
                        onClick={() => onTogglePlanner(recipe.id)}
                        className={`btn-action ${isPlanned ? 'planned-active' : ''}`}
                        title={isPlanned ? 'Remover do Planejamento' : 'Planejar essa refeição'}
                        aria-pressed={isPlanned}
                    >
                        📅 {isPlanned ? 'Planejado' : 'Planejar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => onAddIngredientsToShopping(recipe.id, portions)}
                        className="btn-action"
                        title="Adicionar ingredientes à lista de compras"
                    >
                        🛒 Add à Lista
                    </button>
                    <button
                        type="button"
                        onClick={() => onShare(recipe)}
                        className="btn-action"
                        title="Compartilhar receita"
                    >
                        📤 Compartilhar
                    </button>
                    <button
                        type="button"
                        onClick={() => onStartCooking(recipe)}
                        className="btn-action primary-action"
                        title="Iniciar Modo Preparo"
                    >
                        👨‍🍳 Cozinhar
                    </button>
                </div>

                <div className="modal-body">
                    <div className="recipe-section">
                        <div className="section-header-row">
                            <h3>Ingredientes</h3>
                            <div className="portion-controls">
                                <button type="button" onClick={() => handlePortionsChange(-1)} className="portion-btn" aria-label="Diminuir porções">-</button>
                                <span className="portion-value">{isServingsMode ? `${portions} pessoas` : `${portions}x`}</span>
                                <button type="button" onClick={() => handlePortionsChange(1)} className="portion-btn" aria-label="Aumentar porções">+</button>
                            </div>
                        </div>

                        <ul className="modal-ingredients-list">
                            {(recipe.ingredients || []).map((ing, idx) => {
                                let qtyDisplay = null;
                                if (ing.qty !== null && ing.qty !== undefined) {
                                    const scaledQty = scaleIngredientQty(ing.qty, portions, recipe.servings);
                                    const formattedQty = Number(scaledQty.toFixed(2)).toString();
                                    qtyDisplay = <strong className="ing-qty-tag">{formattedQty} {ing.unit}</strong>;
                                } else if (ing.unit) {
                                    qtyDisplay = <strong className="ing-unit-only-tag">{ing.unit}</strong>;
                                }

                                return (
                                    <li key={`${ing.name}-${idx}`} className="modal-ingredients-li">
                                        <span className="ing-bullet" aria-hidden="true">•</span>
                                        <div className="ing-details-row">
                                            <span className="ing-name">{ing.name}</span>
                                            {qtyDisplay}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="recipe-section">
                        <h3>Modo de Preparo</h3>
                        <ol className="modal-steps-list">
                            {(recipe.steps || []).map((step, idx) => {
                                const isDone = completedSteps.has(idx);
                                return (
                                    <li
                                        key={idx}
                                        className={`modal-step-li ${isDone ? 'completed' : ''}`}
                                        role="checkbox"
                                        aria-checked={isDone}
                                        tabIndex={0}
                                        onClick={() => toggleStep(idx)}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleStep(idx))}
                                    >
                                        <span className="step-number">{idx + 1}</span>
                                        <p className="step-text">{step}</p>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    {recipe.tips && (
                        <div className="modal-tips-container">
                            <h4>💡 Dica do Chef</h4>
                            <p>{recipe.tips}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { WEEK_DAYS } from '../logic/storage.js';
import { getAllPlannedEntries } from '../logic/planner.js';

export function PlannerDrawer({ isOpen, onClose, plannedByDay, recipes, onRemoveRecipe, onChangePortions, onClearPlanner }) {
    if (!isOpen) return null;

    const totalPlanned = getAllPlannedEntries(plannedByDay).length;

    return (
        <aside className="drawer open" id="planner-drawer" role="dialog" aria-label="Menu Semanal Planejado">
            <div className="drawer-header">
                <div className="drawer-header-title">
                    <h3>Menu Semanal</h3>
                    <span className="badge">{totalPlanned}</span>
                </div>
                <div className="drawer-header-actions">
                    {totalPlanned > 0 && (
                        <button type="button" onClick={onClearPlanner} className="btn-secondary danger-text" title="Limpar todo o menu semanal">
                            Limpar
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="drawer-close" aria-label="Fechar Menu Semanal">
                        ✕
                    </button>
                </div>
            </div>

            <div className="drawer-body" id="planner-items">
                {totalPlanned === 0 ? (
                    <div className="drawer-empty-state">
                        <p>Seu Menu Semanal está vazio!</p>
                        <p className="sub">Clique no botão de calendário 📅 nos cartões para selecionar as refeições de sua preferência.</p>
                    </div>
                ) : (
                    WEEK_DAYS.map(d => {
                        const dayEntries = plannedByDay?.[d.key] || [];
                        return (
                            <div key={d.key} className="planner-day-section">
                                <div className="planner-day-header">
                                    <h4>{d.label}</h4>
                                    {dayEntries.length > 0 && <span className="planner-day-count">{dayEntries.length}</span>}
                                </div>
                                <div className="planner-day-body">
                                    {dayEntries.length === 0 ? (
                                        <p className="planner-day-empty">Nenhuma receita planejada</p>
                                    ) : (
                                        dayEntries.map(entry => {
                                            const recipe = recipes.find(r => r.id === entry.recipeId);
                                            if (!recipe) return null;

                                            const parsedServings = (recipe.servings !== undefined && recipe.servings !== null && recipe.servings !== '') ? parseInt(recipe.servings, 10) : NaN;
                                            const isServingsMode = !isNaN(parsedServings) && parsedServings > 0;
                                            const currentPeople = parseInt(entry.people, 10) || 1;
                                            const displayValue = isServingsMode ? `${currentPeople} pessoas` : `${currentPeople}x`;
                                            const labelText = isServingsMode ? "Pessoas:" : "Porções:";

                                            return (
                                                <div key={`${d.key}-${recipe.id}`} className="drawer-card">
                                                    <div className="drawer-card-top">
                                                        <div className="drawer-card-info">
                                                            <span className="drawer-card-emoji" role="img" aria-label={`Emoji representativo de ${recipe.title}`}>
                                                                {recipe.emoji || '🍽'}
                                                            </span>
                                                            <div className="drawer-card-meta">
                                                                <h4>{recipe.title}</h4>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemoveRecipe(recipe.id, d.key)}
                                                            className="drawer-card-remove"
                                                            title="Remover do menu"
                                                            aria-label={`Remover ${recipe.title} do planejamento de ${d.label}`}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="drawer-card-bottom">
                                                        <span>{labelText}</span>
                                                        <div className="portion-controls">
                                                            <button
                                                                type="button"
                                                                onClick={() => onChangePortions(recipe.id, d.key, -1)}
                                                                className="portion-btn"
                                                                aria-label="Diminuir porções"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="portion-value">{displayValue}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => onChangePortions(recipe.id, d.key, 1)}
                                                                className="portion-btn"
                                                                aria-label="Aumentar porções"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}

import { PLANNER_DAYS } from '../logic/storage.js';
import { getAllPlannedEntries } from '../logic/planner.js';

export function PlannerDrawer({
    isOpen,
    onClose,
    plannedByDay,
    recipes,
    onRemoveRecipe,
    onChangeDay,
    onChangePortions,
    onClearPlanner,
    onGenerateConsolidated
}) {
    const totalPlanned = getAllPlannedEntries(plannedByDay).length;

    return (
        <>
            <div
                className={`drawer-backdrop ${isOpen ? 'active' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className={`drawer ${isOpen ? 'open' : ''}`} id="planner-drawer" role="dialog" aria-label="Menu Semanal Planejado">
                <div className="drawer-header">
                    <div className="drawer-header-title planner-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <h3 id="planner-drawer-title">Menu da Semana</h3>
                    </div>
                    <div className="drawer-header-actions">
                        {totalPlanned > 0 && (
                            <button type="button" onClick={onClearPlanner} className="drawer-clear-btn" aria-label="Limpar menu semanal">
                                Limpar Menu
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="drawer-close-btn" title="Fechar" aria-label="Fechar menu semanal">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="drawer-content" id="planner-items">
                    {totalPlanned === 0 ? (
                        <div className="drawer-empty-state">
                            <p>Seu Menu Semanal está vazio!</p>
                            <p className="sub">Clique no botão de calendário 📅 nos cartões para adicionar receitas ao menu.</p>
                        </div>
                    ) : (
                        PLANNER_DAYS.map(d => {
                            const dayEntries = plannedByDay?.[d.key] || [];
                            if (d.key === 'pending' && dayEntries.length === 0) return null;

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
                                                            <div className="day-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Dia:</span>
                                                                <select
                                                                    value={d.key}
                                                                    onChange={(e) => onChangeDay && onChangeDay(recipe.id, d.key, e.target.value)}
                                                                    className="planner-day-select"
                                                                    aria-label={`Mudar dia da receita ${recipe.title}`}
                                                                >
                                                                    {PLANNER_DAYS.map(w => (
                                                                        <option key={w.key} value={w.key}>
                                                                            {w.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="portion-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{labelText}</span>
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

                {totalPlanned > 0 && onGenerateConsolidated && (
                    <div className="drawer-footer">
                        <button
                            type="button"
                            onClick={onGenerateConsolidated}
                            className="btn-large btn-large-success"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                            <span>Consolidar Lista de Compras</span>
                        </button>
                        <p className="drawer-footer-tip">Essa ação junta e soma as quantidades de ingredientes das receitas planejadas na sua lista de compras, sem apagar seus outros itens!</p>
                    </div>
                )}
            </aside>
        </>
    );
}

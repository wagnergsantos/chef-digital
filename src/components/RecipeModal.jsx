import React, { useState, useEffect, useRef } from 'react';
import { scaleIngredientQty } from '../logic/recipes.js';
import { isRecipePlanned } from '../logic/planner.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import styles from './RecipeModal.module.css';

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
    const modalRef = useRef(null);

    useFocusTrap(isOpen, onClose, modalRef);

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
        <div
            ref={modalRef}
            className={`${styles.modalOverlay} ${styles.open}`}
            id="recipe-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Receita: ${recipe.title}`}
            onClick={(e) => e.target.id === 'recipe-modal' && onClose()}
        >
            <div className={styles.modalContainer}>
                {/* Banner com Botões no Topo e Título abaixo */}
                <div
                    className={`${styles.modalHeaderBanner} ${recipe.image ? styles.hasImage : ''}`}
                    style={recipe.image ? { backgroundImage: `url('${recipe.image}')` } : undefined}
                >
                    {/* Linha Superior: Badges à Esquerda, Ferramentas à Direita */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                        width: '100%',
                        marginBottom: '12px'
                    }}>
                        <div className={styles.modalBadges} style={{ marginBottom: 0 }}>
                            <span id="modal-category-badge" className={styles.modalBadgeCat}>{catText}</span>
                            {recipe.servings && <span id="modal-servings-badge" className={styles.modalBadgeSrc}>🍽️ Rende: {recipe.servings}</span>}
                            {recipe.prep_time && <span className={styles.modalBadgeSrc}>⏱️ Preparo: {recipe.prep_time} min</span>}
                            {recipe.cook_time && <span className={styles.modalBadgeSrc}>🍳 Fogo: {recipe.cook_time} min</span>}
                            {historyRecord && historyRecord.count > 0 && historyRecord.lastCooked && (
                                <span className={styles.modalBadgeHistory}>
                                    👨‍🍳 Preparado {historyRecord.count}x ({new Date(historyRecord.lastCooked).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                                </span>
                            )}
                        </div>

                        <div className={styles.modalHeaderTools} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <button
                                type="button"
                                onClick={() => { onClose(); onStartCooking(recipe); }}
                                className={styles.modalStartCookingBtn}
                                title="Iniciar Modo Preparo passo a passo"
                                aria-label="Iniciar Modo Preparo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true" width="18" height="18">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>Preparo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onTogglePlanner(recipe.id)}
                                className={`${styles.modalPlannerBtn} ${isPlanned ? styles.plannedActive : ''}`}
                                title={isPlanned ? 'Remover do Planejamento' : 'Planejar essa refeição'}
                                aria-label="Planejar essa refeição"
                                aria-pressed={isPlanned}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => onAddIngredientsToShopping(recipe.id, portions)}
                                className={styles.modalShoppingBtn}
                                title="Adicionar tudo à lista de compras"
                                aria-label="Adicionar todos os ingredientes à lista de compras"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => onShare(recipe)}
                                className={styles.modalShareBtn}
                                title="Compartilhar receita"
                                aria-label="Compartilhar receita"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                                </svg>
                            </button>
                            <button type="button" onClick={onClose} className={styles.modalCloseBtn} title="Fechar" aria-label="Fechar receita">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Linha Inferior: Título da Receita com 100% de Largura */}
                    <h3 id="modal-title" className={styles.serifTitle} style={{ margin: 0, width: '100%' }}>{recipe.title}</h3>
                </div>

                {/* Corpo do Modal em 2 Colunas */}
                <div className={styles.modalBody}>
                    {/* Coluna 1: Ingredientes */}
                    <div className={styles.modalColLeft}>
                        <div className={styles.modalSectionTitleWrapper}>
                            <h4>Ingredientes</h4>
                            <div className={styles.portionControls}>
                                <button type="button" onClick={() => handlePortionsChange(-1)} className={styles.portionBtn} aria-label="Diminuir porções">-</button>
                                <span className={styles.portionValue}>{isServingsMode ? `${portions} pessoas` : `${portions}x`}</span>
                                <button type="button" onClick={() => handlePortionsChange(1)} className={styles.portionBtn} aria-label="Aumentar porções">+</button>
                            </div>
                        </div>

                        <ul id="modal-ingredients-list" className={styles.modalIngredientsUl}>
                            {(recipe.ingredients || []).map((ing, idx) => {
                                let qtyDisplay = null;
                                if (ing.qty !== null && ing.qty !== undefined) {
                                    const scaledQty = scaleIngredientQty(ing.qty, portions, recipe.servings);
                                    const formattedQty = Number(scaledQty.toFixed(2)).toString();
                                    qtyDisplay = <strong className={styles.ingQtyTag}>{formattedQty} {ing.unit}</strong>;
                                } else if (ing.unit) {
                                    qtyDisplay = <strong className={styles.ingUnitOnlyTag}>{ing.unit}</strong>;
                                }

                                return (
                                    <li key={`${ing.name}-${idx}`} className={styles.modalIngredientsLi}>
                                        <span className={styles.ingBullet} aria-hidden="true">•</span>
                                        <div className={styles.ingDetailsRow}>
                                            <span className={styles.ingName}>{ing.name}</span>
                                            {qtyDisplay}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Coluna 2: Modo de Preparo */}
                    <div className={styles.modalColRight}>
                        <div className={styles.modalSectionTitleWrapper}>
                            <h4>Modo de Preparo</h4>
                        </div>
                        <ol id="modal-steps-list" className={styles.modalStepsOl}>
                            {(recipe.steps || []).map((step, idx) => {
                                const isDone = completedSteps.has(idx);
                                return (
                                    <li
                                        key={idx}
                                        className={`${styles.modalStepLi} ${isDone ? `completed ${styles.completed}` : ''}`}
                                        role="checkbox"
                                        aria-checked={isDone}
                                        tabIndex={0}
                                        onClick={() => toggleStep(idx)}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleStep(idx))}
                                    >
                                        <span className={styles.stepNumber}>{idx + 1}</span>
                                        <p className={styles.stepText}>{step}</p>
                                    </li>
                                );
                            })}
                        </ol>

                        {recipe.tips && (
                            <div id="modal-tips-container" className={styles.tipBox}>
                                <div className={styles.tipIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                    </svg>
                                </div>
                                <div className={styles.tipContent}>
                                    <span className={styles.tipTitle}>Dica de Preparo</span>
                                    <p id="modal-tips-text" className={styles.tipText}>{recipe.tips}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


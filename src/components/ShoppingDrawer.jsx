import React from 'react';
import { countShoppingItems } from '../logic/shopping.js';

export function ShoppingDrawer({
    isOpen,
    onClose,
    shoppingList = {},
    onToggleItem,
    onRemoveRecipeGroup,
    onClearList,
    onCopyList,
    onGenerateConsolidated
}) {
    const totalItems = countShoppingItems(shoppingList);
    const recipeKeys = Object.keys(shoppingList);

    return (
        <>
            <div
                className={`drawer-backdrop ${isOpen ? 'active' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className={`drawer ${isOpen ? 'open' : ''}`} id="shopping-list-drawer" role="dialog" aria-label="Lista de Compras">
            <div className="drawer-header">
                <div className="drawer-header-title">
                    <h3>Lista de Compras</h3>
                    <span className="badge">{totalItems}</span>
                </div>
                <div className="drawer-header-actions">
                    {recipeKeys.length > 0 && (
                        <>
                            <button type="button" onClick={onCopyList} className="btn-secondary" title="Copiar lista para transferência">
                                Copiar
                            </button>
                            <button type="button" onClick={onClearList} className="btn-secondary danger-text" title="Limpar toda a lista">
                                Limpar
                            </button>
                        </>
                    )}
                    <button type="button" onClick={onClose} className="drawer-close" aria-label="Fechar Lista de Compras">
                        ✕
                    </button>
                </div>
            </div>

            <div className="drawer-body" id="shopping-list-items">
                {recipeKeys.length === 0 ? (
                    <div className="drawer-empty-state">
                        <p>Sua lista está vazia!</p>
                        <p className="sub">Abra uma receita e adicione ingredientes clicando no botão de lista ou gere a lista consolidada pelo menu semanal.</p>
                        {onGenerateConsolidated && (
                            <button type="button" onClick={onGenerateConsolidated} className="btn-primary mt-4">
                                Gerar do Menu Semanal
                            </button>
                        )}
                    </div>
                ) : (
                    recipeKeys.map(recipeTitle => {
                        const items = shoppingList[recipeTitle];
                        if (!Array.isArray(items) || items.length === 0) return null;

                        return (
                            <div key={recipeTitle} className="shopping-section">
                                <div className="shopping-section-header">
                                    <h4>{recipeTitle}</h4>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveRecipeGroup(recipeTitle)}
                                        className="drawer-card-remove"
                                        title="Remover grupo de compras"
                                        aria-label={`Remover grupo de compras de ${recipeTitle}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <ul className="shopping-list-items-wrapper">
                                    {items.map((item, index) => {
                                        let displayQty = '';
                                        if (item.qty !== null && item.qty !== undefined) {
                                            const formattedQty = Number(item.qty.toFixed(2)).toString();
                                            displayQty = ` - ${formattedQty} ${item.unit || ''}`;
                                        } else if (item.unit) {
                                            displayQty = ` - ${item.unit}`;
                                        }

                                        return (
                                            <li key={`${recipeTitle}-${index}`} className="shopping-item-li">
                                                <div
                                                    className="shopping-checkbox-wrapper"
                                                    onClick={() => onToggleItem(recipeTitle, index)}
                                                    role="checkbox"
                                                    aria-checked={Boolean(item.checked)}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ' || e.key === 'Enter') {
                                                            e.preventDefault();
                                                            onToggleItem(recipeTitle, index);
                                                        }
                                                    }}
                                                    aria-label={`${item.name}${displayQty}`}
                                                >
                                                    <div className={`shopping-checkbox ${item.checked ? 'checked' : ''}`}>
                                                        {item.checked && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`shopping-item-name ${item.checked ? 'checked' : ''}`}>
                                                        {item.name}
                                                        {displayQty && <span className="qty-span">{displayQty}</span>}
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    </>
);
}

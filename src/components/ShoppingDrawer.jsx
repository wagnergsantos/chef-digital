import React, { useRef } from 'react';
import { countShoppingItems } from '../logic/shopping.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { printShoppingList } from '../logic/print.js';
import drawerStyles from './DrawerShell.module.css';
import styles from './ShoppingDrawer.module.css';

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
    const drawerRef = useRef(null);

    useFocusTrap(isOpen, onClose, drawerRef);

    return (
        <>
            <div
                className={`${drawerStyles.drawerBackdrop} ${isOpen ? drawerStyles.active : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                ref={drawerRef}
                className={`${drawerStyles.drawer} ${isOpen ? drawerStyles.open : ''}`}
                id="shopping-list-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Lista de Compras"
            >
            <div className={drawerStyles.drawerHeader}>
                <div className={`${drawerStyles.drawerHeaderTitle} ${drawerStyles.shoppingTitle}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    <h3 id="shopping-drawer-title">Lista de Compras</h3>
                </div>
                <div className={drawerStyles.drawerHeaderActions}>
                    {recipeKeys.length > 0 && (
                        <button type="button" onClick={() => printShoppingList()} className={drawerStyles.drawerPrintBtn} title="Imprimir lista de compras" aria-label="Imprimir lista de compras" data-print-hide>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"></path>
                            </svg>
                        </button>
                    )}
                    {recipeKeys.length > 0 && (
                        <button type="button" onClick={onClearList} className={drawerStyles.drawerClearBtn} aria-label="Limpar lista de compras" data-print-hide>
                            Limpar Tudo
                        </button>
                    )}
                    <button type="button" onClick={onClose} className={drawerStyles.drawerCloseBtn} title="Fechar" aria-label="Fechar lista de compras" data-print-hide>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div className={drawerStyles.drawerContent} id="shopping-list-items">
                {recipeKeys.length === 0 ? (
                    <div className={drawerStyles.drawerEmptyState}>
                        <p>Sua lista está vazia!</p>
                        <p className={drawerStyles.sub}>Abra uma receita e adicione ingredientes clicando no botão de lista ou gere a lista consolidada pelo menu semanal.</p>
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
                            <div key={recipeTitle} className={styles.shoppingSection} data-print-card>
                                <div className={styles.shoppingSectionHeader}>
                                    <h4>{recipeTitle}</h4>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveRecipeGroup(recipeTitle)}
                                        className={drawerStyles.drawerCardRemove}
                                        title="Remover grupo de compras"
                                        aria-label={`Remover grupo de compras de ${recipeTitle}`}
                                        data-print-hide
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <ul className={styles.shoppingListItemsWrapper}>
                                    {items.map((item, index) => {
                                        let displayQty = '';
                                        if (item.qty !== null && item.qty !== undefined) {
                                            const formattedQty = Number(item.qty.toFixed(2)).toString();
                                            displayQty = ` - ${formattedQty} ${item.unit || ''}`;
                                        } else if (item.unit) {
                                            displayQty = ` - ${item.unit}`;
                                        }

                                        return (
                                            <li key={`${recipeTitle}-${index}`} className={styles.shoppingItemLi}>
                                                <div
                                                    className={styles.shoppingCheckboxWrapper}
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
                                                    <div className={`${styles.shoppingCheckbox} ${item.checked ? styles.checked : ''}`}>
                                                        {item.checked && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`${styles.shoppingItemName} ${item.checked ? styles.checked : ''}`}>
                                                        {item.name}
                                                        {displayQty && <span className={styles.qtySpan}>{displayQty}</span>}
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

            {recipeKeys.length > 0 && onCopyList && (
                <div className={drawerStyles.drawerFooter} data-print-hide>
                    <button
                        type="button"
                        onClick={onCopyList}
                        className={`${drawerStyles.btnLarge} ${drawerStyles.btnLargePrimary}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                        </svg>
                        <span>Copiar Lista</span>
                    </button>
                </div>
            )}
        </aside>
    </>
);
}


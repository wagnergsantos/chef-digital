import React, { useState, useEffect, useRef } from 'react';
import { parsePantryInput, formatPantryText } from '../logic/pantry.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import drawerStyles from './DrawerShell.module.css';

export function PantryDrawer({
    isOpen,
    onClose,
    pantryItems = [],
    showPantryOnly,
    onTogglePantryFilter,
    onSavePantry,
    onClearPantry
}) {
    const [textValue, setTextValue] = useState('');
    const drawerRef = useRef(null);

    useFocusTrap(isOpen, onClose, drawerRef);

    useEffect(() => {
        if (isOpen) {
            setTextValue(formatPantryText(pantryItems));
        }
    }, [isOpen, pantryItems]);

    const handleSave = () => {
        const parsed = parsePantryInput(textValue);
        onSavePantry(parsed);
    };

    const handleClear = () => {
        setTextValue('');
        onClearPantry();
    };

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
                id="pantry-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Gerenciar Despensa"
            >
                <div className={drawerStyles.drawerHeader}>
                    <div className={`${drawerStyles.drawerHeaderTitle} ${drawerStyles.shoppingTitle}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 8h14M9 8h6M9 16h6"></path>
                        </svg>
                        <h3 id="pantry-drawer-title">Minha Despensa</h3>
                    </div>
                    <div className={drawerStyles.drawerHeaderActions}>
                        {pantryItems.length > 0 && (
                            <button type="button" onClick={handleClear} className={drawerStyles.drawerClearBtn} aria-label="Limpar despensa">
                                Limpar Despensa
                            </button>
                        )}
                        <button type="button" onClick={onClose} className={drawerStyles.drawerCloseBtn} title="Fechar" aria-label="Fechar despensa">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={drawerStyles.drawerContent}>
                    {/* Pantry Filter Toggle */}
                    <div style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)' }}>
                            Filtrar receitas com estes ingredientes
                        </span>
                        <button
                            type="button"
                            onClick={onTogglePantryFilter}
                            className={`btn-secondary ${showPantryOnly ? 'active' : ''}`}
                            style={{
                                padding: '6px 12px',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                                backgroundColor: showPantryOnly ? 'var(--primary-color)' : 'var(--bg-card)',
                                color: showPantryOnly ? 'var(--text-white)' : 'var(--text-main)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            {showPantryOnly ? 'Filtro Ativo ✓' : 'Ativar Filtro'}
                        </button>
                    </div>

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                        Digite os ingredientes que você tem em casa (um por linha ou separados por vírgula):
                    </p>

                    <textarea
                        id="pantry-textarea"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="Ex: ovo&#10;leite&#10;farinha de trigo&#10;açúcar"
                        rows={10}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div className={drawerStyles.drawerFooter}>
                    <button
                        type="button"
                        onClick={handleSave}
                        className={`${drawerStyles.btnLarge} ${drawerStyles.btnLargePrimary}`}
                    >
                        <span>Salvar Despensa</span>
                    </button>
                </div>
            </aside>
        </>
    );
}


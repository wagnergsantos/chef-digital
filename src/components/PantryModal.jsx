import React, { useState, useEffect } from 'react';
import { parsePantryInput, formatPantryText } from '../logic/pantry.js';

export function PantryModal({ isOpen, onClose, pantryItems = [], onSave, onClear }) {
    const [textValue, setTextValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTextValue(formatPantryText(pantryItems));
        }
    }, [isOpen, pantryItems]);

    if (!isOpen) return null;

    const handleSave = () => {
        const parsed = parsePantryInput(textValue);
        onSave(parsed);
    };

    const handleClear = () => {
        setTextValue('');
        onClear();
    };

    return (
        <div className="modal open" id="pantry-modal" role="dialog" aria-label="Gerenciar Despensa" onClick={(e) => e.target.id === 'pantry-modal' && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Minha Despensa</h3>
                    <button type="button" onClick={onClose} className="drawer-close" aria-label="Fechar Despensa">
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    <p className="sub-text">Digite os ingredientes que você tem em casa (um por linha ou separados por vírgula):</p>
                    <textarea
                        id="pantry-textarea"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="Ex: ovo&#10;leite&#10;farinha de trigo&#10;açúcar"
                        rows={6}
                    />
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={handleClear} className="btn-secondary danger-text">
                        Limpar Despensa
                    </button>
                    <button type="button" onClick={handleSave} className="btn-primary">
                        Salvar e Aplicar Filtro
                    </button>
                </div>
            </div>
        </div>
    );
}

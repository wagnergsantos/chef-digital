import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PantryModal } from './PantryModal.jsx';

describe('PantryModal component', () => {
    it('nao renderiza quando isOpen e false', () => {
        const { container } = render(<PantryModal isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('preenche textarea com itens existentes e dispara onSave com os parseados', () => {
        const handleSave = vi.fn();
        render(
            <PantryModal
                isOpen={true}
                pantryItems={['ovo', 'leite']}
                onSave={handleSave}
                onClose={() => {}}
                onClear={() => {}}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea.value).toBe('ovo\nleite');

        fireEvent.change(textarea, { target: { value: 'ovo\nleite\nfarinha' } });

        const saveBtn = screen.getByRole('button', { name: /Salvar e Aplicar Filtro/i });
        fireEvent.click(saveBtn);

        expect(handleSave).toHaveBeenCalledWith(['ovo', 'leite', 'farinha']);
    });
});

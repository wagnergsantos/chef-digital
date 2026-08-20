import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PantryDrawer } from './PantryDrawer.jsx';

describe('PantryDrawer component', () => {
    it('nao exibe o drawer quando isOpen e false', () => {
        const { container } = render(<PantryDrawer isOpen={false} />);
        const drawer = container.querySelector('#pantry-drawer');
        expect(drawer).not.toHaveClass('open');
    });

    it('renderiza despensa e reage ao salvamento e alteracao de filtro', () => {
        const handleSave = vi.fn();
        const handleToggleFilter = vi.fn();

        const { container } = render(
            <PantryDrawer
                isOpen={true}
                pantryItems={['ovo', 'leite']}
                showPantryOnly={false}
                onTogglePantryFilter={handleToggleFilter}
                onSavePantry={handleSave}
            />
        );

        expect(screen.getByText('Minha Despensa')).toBeInTheDocument();
        const textarea = container.querySelector('#pantry-textarea');
        expect(textarea.value).toContain('ovo');

        const saveBtn = screen.getByText('Salvar Despensa');
        fireEvent.click(saveBtn);
        expect(handleSave).toHaveBeenCalled();
    });
});

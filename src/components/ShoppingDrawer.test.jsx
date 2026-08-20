import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingDrawer } from './ShoppingDrawer.jsx';

describe('ShoppingDrawer component', () => {
    it('nao exibe o drawer quando isOpen e false', () => {
        const { container } = render(<ShoppingDrawer isOpen={false} />);
        const drawer = container.querySelector('#shopping-list-drawer');
        expect(drawer).not.toHaveClass('open');
    });

    it('renderiza lista de compras com itens e reage ao clique de marcar/desmarcar', () => {
        const shoppingList = {
            'Menu Consolidado': [
                { name: 'Farinha de Trigo', qty: 500, unit: 'g', checked: false }
            ]
        };
        const handleToggle = vi.fn();

        render(
            <ShoppingDrawer
                isOpen={true}
                shoppingList={shoppingList}
                onToggleItem={handleToggle}
            />
        );

        expect(screen.getByText('Menu Consolidado')).toBeInTheDocument();
        expect(screen.getByText('Farinha de Trigo')).toBeInTheDocument();

        const checkbox = screen.getByRole('checkbox', { name: /Farinha de Trigo/i });
        fireEvent.click(checkbox);
        expect(handleToggle).toHaveBeenCalledWith('Menu Consolidado', 0);
    });
});

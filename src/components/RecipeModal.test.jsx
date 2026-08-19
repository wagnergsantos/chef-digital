import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeModal } from './RecipeModal.jsx';

describe('RecipeModal component', () => {
    it('nao renderiza quando isOpen e false ou recipe e nulo', () => {
        const { container } = render(<RecipeModal isOpen={false} recipe={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renderiza os dados da receita e permite marcar os passos', () => {
        const recipe = {
            id: 1,
            title: 'Strogonoff de Frango',
            category: 'carnes',
            servings: 4,
            ingredients: [{ name: 'Peito de frango', qty: 500, unit: 'g' }],
            steps: ['Cortar o frango em cubos', 'Dourar na frigideira']
        };

        render(
            <RecipeModal
                isOpen={true}
                recipe={recipe}
                onClose={() => {}}
                onTogglePlanner={() => {}}
                onAddIngredientsToShopping={() => {}}
                onStartCooking={() => {}}
                onShare={() => {}}
            />
        );

        expect(screen.getByText('Strogonoff de Frango')).toBeInTheDocument();
        expect(screen.getByText('Peito de frango')).toBeInTheDocument();

        const step = screen.getByText('Cortar o frango em cubos').closest('li');
        expect(step).not.toHaveClass('completed');

        fireEvent.click(step);
        expect(step).toHaveClass('completed');
    });
});

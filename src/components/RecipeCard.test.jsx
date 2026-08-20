import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from './RecipeCard.jsx';

describe('RecipeCard component', () => {
    it('renderiza dados do card e reage a cliques de acao', () => {
        const recipe = {
            id: 1,
            title: 'Lasanha à Parmegiana',
            emoji: '🍝',
            category: 'massas',
            servings: 6,
            ingredients: [{ name: 'Massa de lasanha' }]
        };
        const handleOpen = vi.fn();
        const handleFav = vi.fn();
        const handlePlan = vi.fn();

        render(
            <RecipeCard
                recipe={recipe}
                index={0}
                isPlanned={false}
                isFavorite={false}
                categories={{ massas: 'Massas & Pastas' }}
                onOpenModal={handleOpen}
                onToggleFavorite={handleFav}
                onTogglePlanner={handlePlan}
            />
        );

        expect(screen.getByText('Lasanha à Parmegiana')).toBeInTheDocument();
        expect(screen.getByText('Massas & Pastas')).toBeInTheDocument();

        const cardBtn = screen.getByRole('button', { name: 'Lasanha à Parmegiana' });
        fireEvent.click(cardBtn);
        expect(handleOpen).toHaveBeenCalledWith(1);

        const favBtn = screen.getByRole('button', { name: /Adicionar Lasanha à Parmegiana aos favoritos/i });
        fireEvent.click(favBtn);
        expect(handleFav).toHaveBeenCalledWith(1);
    });
});

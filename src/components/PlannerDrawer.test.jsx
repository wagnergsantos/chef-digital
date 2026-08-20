import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlannerDrawer } from './PlannerDrawer.jsx';
import { createEmptyPlannedByDay } from '../logic/planner.js';

describe('PlannerDrawer component', () => {
    it('nao exibe o drawer quando isOpen e false', () => {
        const { container } = render(<PlannerDrawer isOpen={false} />);
        const drawer = container.querySelector('#planner-drawer');
        expect(drawer).not.toHaveClass('open');
    });

    it('renderiza estado vazio quando nao ha receitas no menu', () => {
        render(
            <PlannerDrawer
                isOpen={true}
                plannedByDay={createEmptyPlannedByDay()}
                recipes={[]}
            />
        );
        expect(screen.getByText('Seu Menu Semanal está vazio!')).toBeInTheDocument();
    });

    it('renderiza receitas do menu por dia da semana e chama eventos', () => {
        const plannedByDay = createEmptyPlannedByDay();
        plannedByDay.seg.push({ recipeId: 1, people: 2 });
        const recipes = [{ id: 1, title: 'Bolo de Cenoura', emoji: '🍰', servings: 4 }];

        const handleRemove = vi.fn();
        const handleChangePortions = vi.fn();

        render(
            <PlannerDrawer
                isOpen={true}
                plannedByDay={plannedByDay}
                recipes={recipes}
                onRemoveRecipe={handleRemove}
                onChangePortions={handleChangePortions}
            />
        );

        expect(screen.getByText('Bolo de Cenoura')).toBeInTheDocument();
        
        const removeBtn = screen.getByRole('button', { name: /Remover Bolo de Cenoura/i });
        fireEvent.click(removeBtn);
        expect(handleRemove).toHaveBeenCalledWith(1, 'seg');
    });
});

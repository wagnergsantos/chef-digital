import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipesGrid } from './RecipesGrid.jsx';

describe('RecipesGrid component', () => {
    it('renderiza empty state quando nenhuma receita combina com o filtro', () => {
        render(
            <RecipesGrid
                recipes={[]}
                onOpenModal={() => {}}
                onToggleFavorite={() => {}}
                onTogglePlanner={() => {}}
            />
        );
        expect(screen.getByText('Nenhuma receita encontrada para os filtros selecionados.')).toBeInTheDocument();
    });

    it('renderiza lista de receitas filtradas', () => {
        const recipes = [
            { id: 1, title: 'Panqueca Americana', emoji: '🥞', category: 'doces' }
        ];

        render(
            <RecipesGrid
                recipes={recipes}
                onOpenModal={() => {}}
                onToggleFavorite={() => {}}
                onTogglePlanner={() => {}}
            />
        );

        expect(screen.getByText('Panqueca Americana')).toBeInTheDocument();
    });
});

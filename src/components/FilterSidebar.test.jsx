import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar } from './FilterSidebar.jsx';

const categories = { todos: 'Todas as Receitas', doces: 'Doces', salgados: 'Salgados' };
const tagsMap = { rapido: 'Rápido', vegano: 'Vegano' };
const recipes = [
    { id: 1, title: 'Panqueca', category: 'doces' },
    { id: 2, title: 'Coxinha', category: 'salgados' }
];
const recipeTagsMap = { 1: ['rapido'], 2: ['vegano'] };

describe('FilterSidebar component', () => {
    it('renderiza categorias e tags com contagem', () => {
        render(
            <FilterSidebar
                recipes={recipes}
                categories={categories}
                tagsMap={tagsMap}
                recipeTagsMap={recipeTagsMap}
                onSearchChange={() => {}}
                onSelectCategory={() => {}}
                onToggleTag={() => {}}
                onClearFilters={() => {}}
            />
        );

        expect(screen.getByText('Doces')).toBeInTheDocument();
        expect(screen.getByText('Salgados')).toBeInTheDocument();
        expect(screen.getByText('Rápido')).toBeInTheDocument();
        expect(screen.getByText('Vegano')).toBeInTheDocument();
    });

    it('chama onSelectCategory ao clicar em uma categoria', () => {
        const onSelectCategory = vi.fn();
        render(
            <FilterSidebar
                recipes={recipes}
                categories={categories}
                tagsMap={tagsMap}
                recipeTagsMap={recipeTagsMap}
                onSearchChange={() => {}}
                onSelectCategory={onSelectCategory}
                onToggleTag={() => {}}
                onClearFilters={() => {}}
            />
        );

        fireEvent.click(screen.getByText('Doces'));
        expect(onSelectCategory).toHaveBeenCalledWith('doces');
    });

    it('não mostra o botão "Limpar Filtros" sem filtros ativos', () => {
        render(
            <FilterSidebar
                recipes={recipes}
                categories={categories}
                tagsMap={tagsMap}
                recipeTagsMap={recipeTagsMap}
                onSearchChange={() => {}}
                onSelectCategory={() => {}}
                onToggleTag={() => {}}
                onClearFilters={() => {}}
            />
        );

        expect(screen.queryByText('Limpar Filtros')).not.toBeInTheDocument();
    });

    it('mostra "Limpar Filtros" quando há categoria ativa e chama onClearFilters', () => {
        const onClearFilters = vi.fn();
        render(
            <FilterSidebar
                recipes={recipes}
                categories={categories}
                tagsMap={tagsMap}
                recipeTagsMap={recipeTagsMap}
                activeCategory="doces"
                onSearchChange={() => {}}
                onSelectCategory={() => {}}
                onToggleTag={() => {}}
                onClearFilters={onClearFilters}
            />
        );

        const clearBtn = screen.getByText('Limpar Filtros');
        fireEvent.click(clearBtn);
        expect(onClearFilters).toHaveBeenCalled();
    });
});

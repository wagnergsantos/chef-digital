import { describe, it, expect } from 'vitest';
import {
    normalizeSearchText,
    recipeIsFullyStocked,
    filterRecipesList
} from './recipes-filter.js';

describe('recipes-filter logic', () => {
    it('normaliza texto para busca removendo acentos', () => {
        expect(normalizeSearchText('Strogonoff de Frango')).toBe('strogonoff de frango');
        expect(normalizeSearchText('Açúcar')).toBe('acucar');
    });

    it('identifica se tem todos os ingredientes da despensa', () => {
        const recipe = {
            ingredients: [
                { name: 'Ovo', unit: 'unidades' },
                { name: 'Sal', unit: 'a gosto' }
            ]
        };
        expect(recipeIsFullyStocked(recipe, ['ovo'])).toBe(true);
        expect(recipeIsFullyStocked(recipe, ['farinha'])).toBe(false);
    });

    it('combina filtros de categoria, busca e favoritos', () => {
        const recipes = [
            { id: 1, title: 'Bolo de Fubá', category: 'doces' },
            { id: 2, title: 'Torta de Frango', category: 'salgados' }
        ];

        const result = filterRecipesList(recipes, {
            activeCategory: 'doces',
            searchQuery: 'fubá',
            showFavoritesOnly: false,
            favorites: [],
            showPantryOnly: false,
            pantryItems: [],
            activeTags: [],
            recipeTags: {}
        });

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });
});

import { describe, it, expect } from 'vitest';
import { mapSummaryRecipes, buildRecipeDetailsIndex } from './recipes-loader.js';

describe('API: Recipes Loader', () => {
    it('mapSummaryRecipes should keep only summary fields required for grid render', () => {
        const rows = [{ id: 1, title: 'A', category_id: 2, emoji: '🍲', image: '1.png', servings: 2, tips: 'x', extra: 'drop' }];
        const result = mapSummaryRecipes(rows);
        expect(result[0]).toEqual({
            id: 1,
            title: 'A',
            category_id: 2,
            category: undefined,
            emoji: '🍲',
            image: '1.png',
            servings: 2,
            tips: 'x'
        });
    });

    it('buildRecipeDetailsIndex should group ingredients and steps by recipe id', () => {
        const details = buildRecipeDetailsIndex(
            [{ receita_id: 1, name: 'Sal', qty: 1, unit: 'colher' }],
            [{ receita_id: 1, step_text: 'Misture' }]
        );
        expect(details[1].ingredients).toHaveLength(1);
        expect(details[1].steps).toEqual(['Misture']);
    });
});

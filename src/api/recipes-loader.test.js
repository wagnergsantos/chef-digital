import { describe, it, expect } from 'vitest';
import { mapSummaryRecipes, buildRecipeDetailsIndex, mapFullRecipe, mapFullRecipes } from './recipes-loader.js';

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
            prep_time: undefined,
            cook_time: undefined,
            source_url: undefined,
            author: undefined,
            tips: 'x'
        });
    });

    it('buildRecipeDetailsIndex should group ingredients and steps by recipe id', () => {
        const details = buildRecipeDetailsIndex(
            [{ receita_id: 1, name: 'Sal', qty: 1, unit: 'colher', group_name: 'Massa' }],
            [{ receita_id: 1, step_text: 'Misture' }]
        );
        expect(details[1].ingredients).toHaveLength(1);
        expect(details[1].ingredients[0]).toEqual({
            name: 'Sal',
            qty: 1,
            unit: 'colher',
            group_name: 'Massa'
        });
        expect(details[1].steps).toEqual(['Misture']);
    });

    it('mapFullRecipe should map nested ingredients and steps preserving order and category', () => {
        const raw = {
            id: 10,
            title: 'Bolo',
            category_id: 3,
            categorias: { id: 3, key: 'doces', label: 'Doces' },
            emoji: '🍰',
            image: 'bolo.png',
            servings: 8,
            prep_time: 20,
            cook_time: 40,
            source_url: 'http://example.com',
            author: 'Chef',
            tips: 'Dica boa',
            ingredientes: [
                { name: 'Farinha', qty: 2, unit: 'xícaras', ordem: 2, group_name: 'Massa' },
                { name: 'Açúcar', qty: 1, unit: 'xícara', ordem: 1, group_name: null }
            ],
            passos: [
                { step_text: 'Asse', ordem: 2 },
                { step_text: 'Misture tudo', ordem: 1 }
            ]
        };

        const result = mapFullRecipe(raw);
        expect(result.id).toBe(10);
        expect(result.title).toBe('Bolo');
        expect(result.category).toBe('doces');
        expect(result.ingredient_count).toBe(2);
        expect(result.ingredients).toEqual([
            { name: 'Açúcar', qty: 1, unit: 'xícara', group_name: null },
            { name: 'Farinha', qty: 2, unit: 'xícaras', group_name: 'Massa' }
        ]);
        expect(result.steps).toEqual([
            'Misture tudo',
            'Asse'
        ]);
    });

    it('mapFullRecipes should map an array of recipes', () => {
        const list = [
            { id: 1, title: 'R1', ingredientes: [{ name: 'Sal', qty: 1, unit: 'g', ordem: 1 }], passos: [] },
            { id: 2, title: 'R2', ingredientes: [], passos: [{ step_text: 'Passo 1', ordem: 1 }] }
        ];
        const results = mapFullRecipes(list);
        expect(results).toHaveLength(2);
        expect(results[0].ingredients).toHaveLength(1);
        expect(results[1].steps).toHaveLength(1);
    });
});


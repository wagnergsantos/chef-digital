import { describe, it, expect } from 'vitest';
import { validateRecipePayloadData, buildRecipePayload } from './admin-parser.js';

describe('Logic: Admin Parser', () => {
    it('validateRecipePayloadData should fail if title is missing', () => {
        const result = validateRecipePayloadData({ title: '', selectedCategories: ['almoco'], ingredients: [{ name: 'Ovo' }], steps: [{ step_text: 'Ferva' }] });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('título');
    });

    it('validateRecipePayloadData should fail if categories are missing', () => {
        const result = validateRecipePayloadData({ title: 'Bolo', selectedCategories: [], ingredients: [{ name: 'Ovo' }], steps: [{ step_text: 'Assar' }] });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('categoria');
    });

    it('validateRecipePayloadData should succeed and format valid ingredients/steps', () => {
        const result = validateRecipePayloadData({
            title: 'Bolo de Cenoura',
            selectedCategories: ['sobremesa'],
            ingredients: [{ name: 'Cenoura', qty: '2,5', unit: 'unid' }],
            steps: [{ step_text: 'Bata no liquidificador' }]
        });
        expect(result.isValid).toBe(true);
        expect(result.validIngredients[0].qty).toBe(2.5);
        expect(result.validSteps[0].step_text).toBe('Bata no liquidificador');
    });

    it('buildRecipePayload should produce correct RPC payload', () => {
        const payload = buildRecipePayload({
            title: 'Sopa de Legumes',
            emoji: '🍲',
            servings: '4',
            selectedCategories: ['janta'],
            validIngredients: [{ name: 'Batata', qty: 2, unit: 'unid', ordem: 0 }],
            validSteps: [{ step_text: 'Cozinhe tudo', ordem: 0 }]
        });

        expect(payload.p_title).toBe('Sopa de Legumes');
        expect(payload.p_servings).toBe(4);
        expect(payload.p_category).toEqual(['janta']);
    });
});

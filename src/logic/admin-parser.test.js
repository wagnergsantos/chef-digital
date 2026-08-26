import { describe, it, expect } from 'vitest';
import { validateRecipePayloadData, buildRecipePayload } from './admin-parser.js';

describe('Logic: Admin Parser', () => {
    it('validateRecipePayloadData should fail if title is missing', () => {
        const result = validateRecipePayloadData({ title: '', selectedCategoryId: '1', ingredients: [{ name: 'Ovo' }], steps: [{ step_text: 'Ferva' }] });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('título');
    });

    it('validateRecipePayloadData should fail if categories are missing', () => {
        const result = validateRecipePayloadData({ title: 'Bolo', selectedCategoryId: '', ingredients: [{ name: 'Ovo' }], steps: [{ step_text: 'Assar' }] });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('categoria');
    });

    it('validateRecipePayloadData should succeed and format valid ingredients/steps', () => {
        const result = validateRecipePayloadData({
            title: 'Bolo de Cenoura',
            selectedCategoryId: '3',
            ingredients: [
                { name: 'Cenoura', qty: '2,5', unit: 'unidades', group_name: ' Massa ' },
                { name: 'Chocolate', qty: '100', unit: 'g', group_name: '' }
            ],
            steps: [{ step_text: 'Bata no liquidificador' }]
        });
        expect(result.isValid).toBe(true);
        expect(result.validIngredients[0].qty).toBe(2.5);
        expect(result.validIngredients[0].group_name).toBe('Massa');
        expect(result.validIngredients[1].group_name).toBeNull();
        expect(result.validSteps[0].step_text).toBe('Bata no liquidificador');
    });

    it('buildRecipePayload should produce correct RPC payload', () => {
        const payload = buildRecipePayload({
            title: 'Sopa de Legumes',
            emoji: '🍲',
            servings: '4',
            selectedCategoryId: '7',
            selectedCategoryKey: 'sopas',
            validIngredients: [{ name: 'Batata', qty: 2, unit: 'unid', ordem: 0 }],
            validSteps: [{ step_text: 'Cozinhe tudo', ordem: 0 }]
        });

        expect(payload.p_title).toBe('Sopa de Legumes');
        expect(payload.p_servings).toBe(4);
        expect(payload.p_category_id).toBe(7);
        expect(payload.p_category_key).toBe('sopas');
    });
    it('buildRecipePayload inclui prep_time, cook_time, source_url e author', () => {
        const payload = buildRecipePayload({
            title: 'Bolo de Cenoura',
            selectedCategoryId: 1,
            selectedCategoryKey: 'doces',
            prep_time: '15',
            cook_time: 45,
            source_url: 'https://panelinha.com.br/receita/bolo',
            author: 'Rita Lobo',
            validIngredients: [{ name: 'cenoura', qty: 2, unit: 'unidades', ordem: 0 }],
            validSteps: [{ step_text: 'Bata tudo no liquidificador', ordem: 0 }]
        });

        expect(payload.p_prep_time).toBe(15);
        expect(payload.p_cook_time).toBe(45);
        expect(payload.p_source_url).toBe('https://panelinha.com.br/receita/bolo');
        expect(payload.p_author).toBe('Rita Lobo');
    });
});

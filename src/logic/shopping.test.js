import { describe, it, expect } from 'vitest';
import {
    calculateConsolidatedShoppingList,
    formatShoppingListText,
    countShoppingItems
} from './shopping.js';

describe('shopping logic', () => {
    it('calcula contagem total de itens na lista', () => {
        const list = {
            'Bolo': [{ name: 'Farinha' }, { name: 'Ovos' }],
            'Sopa': [{ name: 'Legumes' }]
        };
        expect(countShoppingItems(list)).toBe(3);
    });

    it('formata texto de exportacao para area de transferencia', () => {
        const list = {
            'Bolo': [{ name: 'Farinha', qty: 2, unit: 'xícaras', checked: false }]
        };
        const text = formatShoppingListText(list);
        expect(text).toContain('MINHA LISTA DE COMPRAS');
        expect(text).toContain('[ ] Farinha (2 xícaras)');
    });

    it('consolida ingredientes do menu semanal', () => {
        const planned = [{ day: 'seg', recipeId: 1, people: 2 }];
        const recipes = [{
            id: 1,
            title: 'Omelete',
            servings: 1,
            ingredients: [{ name: 'Ovo', qty: 2, unit: 'unidades' }]
        }];
        const current = {};

        const result = calculateConsolidatedShoppingList(planned, recipes, current);
        expect(result["Menu Semanal Consolidado"]).toHaveLength(1);
        expect(result["Menu Semanal Consolidado"][0]).toEqual({
            name: 'Ovo',
            qty: 4,
            unit: 'unidades',
            checked: false
        });
    });
});

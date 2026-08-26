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

    it('retorna objeto com lista vazia em vez de quebrar ou retornar null quando não há itens planejados', () => {
        const current = { 'Outra Lista': [{ name: 'Café' }] };
        const result = calculateConsolidatedShoppingList([], [], current);
        expect(result).toEqual({
            'Outra Lista': [{ name: 'Café' }],
            'Menu Semanal Consolidado': []
        });

        const resultNull = calculateConsolidatedShoppingList(null, null, null);
        expect(resultNull).toEqual({
            'Menu Semanal Consolidado': []
        });
    });

    it('consolida ingredientes do menu semanal normalizando unidades semelhantes', () => {
        const planned = [
            { day: 'seg', recipeId: 1, people: 2 },
            { day: 'ter', recipeId: 2, people: 1 }
        ];
        const recipes = [
            {
                id: 1,
                title: 'Omelete',
                servings: 1,
                ingredients: [
                    { name: 'Ovo', qty: 2, unit: 'unidades' },
                    { name: 'Azeite', qty: 1, unit: 'colher de sopa' }
                ]
            },
            {
                id: 2,
                title: 'Salada',
                servings: 1,
                ingredients: [
                    { name: 'Azeite', qty: 2, unit: 'colheres de sopa' }
                ]
            }
        ];
        const current = {};

        const result = calculateConsolidatedShoppingList(planned, recipes, current);
        const consolidated = result["Menu Semanal Consolidado"];
        expect(consolidated).toHaveLength(2);

        const ovo = consolidated.find(i => i.name === 'Ovo');
        expect(ovo).toEqual({
            name: 'Ovo',
            qty: 4,
            unit: 'un',
            checked: false
        });

        const azeite = consolidated.find(i => i.name === 'Azeite');
        expect(azeite).toEqual({
            name: 'Azeite',
            qty: 4, // 1 * 2 + 2 * 1
            unit: 'c. sopa',
            checked: false
        });
    });
});

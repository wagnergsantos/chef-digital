import { describe, it, expect } from 'vitest';
import {
    escapeHtml,
    normalizeSearchText,
    matchRecipeSearch,
    recipeIsFullyStocked,
    recipeHasAnyPantryIngredient,
    scaleIngredientQty
} from './recipes.js';

describe('Logic: Recipes', () => {
    it('normalizeSearchText should convert to lowercase and remove accents', () => {
        expect(normalizeSearchText('Strogonoff de Frango')).toBe('strogonoff de frango');
        expect(normalizeSearchText('Feijão Tropeiro')).toBe('feijao tropeiro');
    });

    it('escapeHtml should escape HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('matchRecipeSearch should match recipe by title or ingredient', () => {
        const recipe = {
            title: 'Bolo de Cenoura',
            ingredients: [{ name: 'Cenoura' }, { name: 'Farinha de trigo' }]
        };

        expect(matchRecipeSearch(recipe, 'cenoura').matches).toBe(true);
        expect(matchRecipeSearch(recipe, 'trigo').matches).toBe(true);
        expect(matchRecipeSearch(recipe, 'chocolate').matches).toBe(false);
    });

    it('recipeIsFullyStocked should return true only if all non-optional ingredients are in pantry', () => {
        const recipe = {
            ingredients: [
                { name: 'Ovos', unit: 'unidades' },
                { name: 'Sal', unit: 'a gosto' }
            ]
        };

        expect(recipeIsFullyStocked(recipe, ['ovos'])).toBe(true);
        expect(recipeIsFullyStocked(recipe, [])).toBe(false);
    });

    it('scaleIngredientQty should scale quantity based on active portions and base servings', () => {
        expect(scaleIngredientQty(200, 4, 2)).toBe(400);
        expect(scaleIngredientQty(100, 1, 1)).toBe(100);
        expect(scaleIngredientQty(null, 2, 2)).toBeNull();
    });
});

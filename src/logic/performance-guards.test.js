import { describe, it, expect } from 'vitest';
import { getCardImageLoadingAttrs, buildRecipeCardAccessibleName } from './performance-guards.js';

describe('Logic: Performance Guards', () => {
    it('getCardImageLoadingAttrs should prioritize first cards and lazy-load others', () => {
        expect(getCardImageLoadingAttrs(0)).toEqual({ loading: 'eager', fetchpriority: 'high' });
        expect(getCardImageLoadingAttrs(1)).toEqual({ loading: 'eager', fetchpriority: 'high' });
        expect(getCardImageLoadingAttrs(2)).toEqual({ loading: 'lazy', fetchpriority: 'auto' });
    });

    it('buildRecipeCardAccessibleName should include the exact visible recipe title', () => {
        expect(buildRecipeCardAccessibleName('Frango Xadrez')).toBe('Frango Xadrez');
        expect(buildRecipeCardAccessibleName('  Purê de Batata  ')).toBe('Purê de Batata');
    });
});

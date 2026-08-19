import { describe, it, expect } from 'vitest';
import { parsePantryInput, formatPantryText } from './pantry.js';

describe('pantry logic', () => {
    it('faz parse correto de quebras de linha e virgulas', () => {
        const text = "ovo\n leite , farinha \n  ";
        expect(parsePantryInput(text)).toEqual(['ovo', 'leite', 'farinha']);
    });

    it('formata lista de despensa para textarea com quebra de linha', () => {
        expect(formatPantryText(['ovo', 'leite'])).toBe('ovo\nleite');
    });
});

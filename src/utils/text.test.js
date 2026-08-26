import { describe, it, expect } from 'vitest';
import { normalizeSearchText, escapeHtml } from './text.js';

describe('Utils: text', () => {
    describe('normalizeSearchText', () => {
        it('deve converter para minúsculo e remover acentuação', () => {
            expect(normalizeSearchText('Strogonoff de Frango')).toBe('strogonoff de frango');
            expect(normalizeSearchText('Açúcar')).toBe('acucar');
            expect(normalizeSearchText('Feijão Tropeiro')).toBe('feijao tropeiro');
            expect(normalizeSearchText('CAFÉ COM LEITE')).toBe('cafe com leite');
        });

        it('deve tratar valores nulos, indefinidos ou números', () => {
            expect(normalizeSearchText('')).toBe('');
            expect(normalizeSearchText(null)).toBe('');
            expect(normalizeSearchText(undefined)).toBe('');
            expect(normalizeSearchText(123)).toBe('123');
        });
    });

    describe('escapeHtml', () => {
        it('deve escapar caracteres HTML especiais', () => {
            expect(escapeHtml('<script>alert("xss")</script>'))
                .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            expect(escapeHtml("Tom & Jerry's"))
                .toBe('Tom &amp; Jerry&#039;s');
        });

        it('deve retornar string vazia para falsy', () => {
            expect(escapeHtml('')).toBe('');
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(undefined)).toBe('');
        });
    });
});

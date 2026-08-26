import { describe, it, expect } from 'vitest';
import { normalizeUnit } from './units.js';

describe('Utils: units', () => {
    it('deve normalizar colheres e xícaras', () => {
        expect(normalizeUnit('colheres de sopa')).toBe('c. sopa');
        expect(normalizeUnit('colher de sopa')).toBe('c. sopa');
        expect(normalizeUnit('cs')).toBe('c. sopa');
        expect(normalizeUnit('xícaras')).toBe('xícara');
        expect(normalizeUnit('xicara')).toBe('xícara');
    });

    it('deve normalizar pesos e volumes', () => {
        expect(normalizeUnit('gramas')).toBe('g');
        expect(normalizeUnit('g')).toBe('g');
        expect(normalizeUnit('quilos')).toBe('kg');
        expect(normalizeUnit('kg')).toBe('kg');
        expect(normalizeUnit('litros')).toBe('L');
        expect(normalizeUnit('ml')).toBe('ml');
    });

    it('deve normalizar unidades e contáveis', () => {
        expect(normalizeUnit('unidades')).toBe('un');
        expect(normalizeUnit('unidade')).toBe('un');
        expect(normalizeUnit('und')).toBe('un');
        expect(normalizeUnit('dentes')).toBe('dente');
    });

    it('deve retornar string vazia ou unidade original limpa', () => {
        expect(normalizeUnit('')).toBe('');
        expect(normalizeUnit(null)).toBe('');
        expect(normalizeUnit('pedaços')).toBe('pedaços');
    });
});

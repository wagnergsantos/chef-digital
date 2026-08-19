import { describe, it, expect, beforeEach } from 'vitest';
import { safeJsonParse, STORAGE_KEYS, WEEK_DAYS } from './storage.js';

describe('storage logic', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('retorna fallback quando chave nao existe', () => {
        expect(safeJsonParse('chave_inexistente', [])).toEqual([]);
    });

    it('faz parse correto de JSON valido', () => {
        localStorage.setItem('minha_chave', JSON.stringify({ a: 1 }));
        expect(safeJsonParse('minha_chave', {})).toEqual({ a: 1 });
    });

    it('retorna fallback quando JSON e invalido', () => {
        localStorage.setItem('chave_invalida', '{invalido');
        expect(safeJsonParse('chave_invalida', 'fallback')).toBe('fallback');
    });

    it('exporta chaves de storage corretas com namespace', () => {
        expect(STORAGE_KEYS.THEME).toBe('chef_digital_theme');
        expect(STORAGE_KEYS.FAVORITES).toBe('chef_digital_favorites');
    });

    it('exporta dias da semana', () => {
        expect(WEEK_DAYS.length).toBe(7);
        expect(WEEK_DAYS[0]).toEqual({ key: 'dom', label: 'Domingo' });
    });
});

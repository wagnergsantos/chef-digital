import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme.js';
import { STORAGE_KEYS } from '../logic/storage.js';

describe('useTheme hook', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('inicializa e permite alternar tema', () => {
        const { result } = renderHook(() => useTheme());
        const initial = result.current.theme;

        act(() => {
            result.current.toggleTheme();
        });

        const expected = initial === 'dark' ? 'light' : 'dark';
        expect(result.current.theme).toBe(expected);
        expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe(expected);
        expect(document.documentElement.getAttribute('data-theme')).toBe(expected);
    });
});

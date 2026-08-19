import { describe, it, expect, beforeEach } from 'vitest';
import {
    resolveInitialTheme,
    getNextTheme,
    applyThemeToDocument,
    THEME_COLORS
} from './theme.js';
import { STORAGE_KEYS } from './storage.js';

describe('theme logic', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('resolve tema salvo quando existe no storage', () => {
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
        expect(resolveInitialTheme()).toBe('dark');
    });

    it('fallback para preferencia do sistema quando sem tema salvo', () => {
        const fakeWin = {
            matchMedia: (query) => ({
                matches: query.includes('dark')
            })
        };
        expect(resolveInitialTheme(fakeWin, localStorage)).toBe('dark');
    });

    it('calcula o proximo tema corretamente', () => {
        expect(getNextTheme('dark')).toBe('light');
        expect(getNextTheme('light')).toBe('dark');
    });

    it('aplica tema no document e atualiza meta tag', () => {
        const meta = document.createElement('meta');
        meta.id = 'theme-color-meta';
        document.head.appendChild(meta);

        applyThemeToDocument('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark);
    });
});

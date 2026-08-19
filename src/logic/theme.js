import { STORAGE_KEYS } from './storage.js';

export const THEME_COLORS = {
    light: '#fafaf9',
    dark: '#0c0a09'
};

export function getSystemPreferredTheme(win = window) {
    if (win && win.matchMedia && win.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

export function getSavedTheme(storage = localStorage) {
    return storage.getItem(STORAGE_KEYS.THEME);
}

export function resolveInitialTheme(win = window, storage = localStorage) {
    const saved = getSavedTheme(storage);
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    return getSystemPreferredTheme(win);
}

export function getNextTheme(currentTheme) {
    return currentTheme === 'dark' ? 'light' : 'dark';
}

export function applyThemeToDocument(theme, doc = document) {
    if (doc && doc.documentElement) {
        doc.documentElement.setAttribute('data-theme', theme);
    }
    if (doc) {
        const themeColorMeta = doc.getElementById('theme-color-meta');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light);
        }
    }
}

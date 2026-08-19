import { useState, useEffect, useCallback } from 'react';
import { resolveInitialTheme, getNextTheme, applyThemeToDocument } from '../logic/theme.js';
import { STORAGE_KEYS } from '../logic/storage.js';

export function useTheme() {
    const [theme, setTheme] = useState(() => resolveInitialTheme());

    useEffect(() => {
        applyThemeToDocument(theme);
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => getNextTheme(prev));
    }, []);

    return { theme, toggleTheme };
}

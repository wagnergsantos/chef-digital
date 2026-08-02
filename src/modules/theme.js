export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chef_digital_theme', next);
    updateThemeToggleIcon();
    if (typeof window.showToast === 'function') {
        window.showToast(`Tema alterado para Modo ${next === 'dark' ? 'Escuro' : 'Claro'}`);
    }
}

export function updateThemeToggleIcon() {
    const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const themeColorMeta = document.getElementById('theme-color-meta');
    if (themeColorMeta) {
        const THEME_COLORS = { light: '#fafaf9', dark: '#0c0a09' };
        themeColorMeta.setAttribute('content', THEME_COLORS[current]);
    }

    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    
    if (current === 'dark') {
        themeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
        `;
        themeBtn.title = "Alternar para Modo Claro";
        themeBtn.setAttribute('aria-label', "Alternar para Modo Claro");
    } else {
        themeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        `;
        themeBtn.title = "Alternar para Modo Escuro";
        themeBtn.setAttribute('aria-label', "Alternar para Modo Escuro");
    }
}

export function initTheme() {
    const savedTheme = localStorage.getItem('chef_digital_theme');
    let theme;
    if (savedTheme) {
        theme = savedTheme;
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = systemPrefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleIcon();

}

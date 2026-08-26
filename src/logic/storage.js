export const STORAGE_KEYS = {
    THEME: 'chef_digital_theme',
    FAVORITES: 'chef_digital_favorites',
    SHOPPING: 'chef_digital_shopping',
    PANTRY: 'chef_digital_pantry',
    PLANNED: 'chef_digital_planned',
    ACTIVE_TAGS: 'chef_digital_active_tags',
    COOKING_HISTORY: 'chef_digital_cooking_history'
};

export const WEEK_DAYS = [
    { key: 'dom', label: 'Domingo' },
    { key: 'seg', label: 'Segunda-feira' },
    { key: 'ter', label: 'Terça-feira' },
    { key: 'qua', label: 'Quarta-feira' },
    { key: 'qui', label: 'Quinta-feira' },
    { key: 'sex', label: 'Sexta-feira' },
    { key: 'sab', label: 'Sábado' }
];

export const PLANNER_DAYS = [
    { key: 'pending', label: 'A Definir' },
    ...WEEK_DAYS
];

export function safeJsonParse(key, fallback) {
    try {
        const item = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

/**
 * Camada de abstração unificada para persistência de dados no cliente (LocalStorage com fallback).
 */
export const StorageRepository = {
    get(key, fallback = null) {
        return safeJsonParse(key, fallback);
    },
    set(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (err) {
            console.warn(`Erro ao salvar no storage (${key}):`, err);
        }
    },
    remove(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (err) {
            console.warn(`Erro ao remover do storage (${key}):`, err);
        }
    }
};


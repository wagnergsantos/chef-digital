export function safeJsonParse(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

export const state = {
    recipes: [],
    categories: {},
    categoriesById: {},
    categoryIdsByKey: {},
    tags: {},
    recipeTags: {},
    favorites: safeJsonParse('chef_digital_favorites', []),
    shoppingList: safeJsonParse('chef_digital_shopping', {}),
    pantryItems: safeJsonParse('chef_digital_pantry', []),
    activeCategory: 'todos',
    activeTags: safeJsonParse('chef_digital_active_tags', []),
    searchQuery: '',
    showFavoritesOnly: false,
    showPantryOnly: false,
    plannedByDay: {},
    cookingHistory: safeJsonParse('chef_digital_cooking_history', {})
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

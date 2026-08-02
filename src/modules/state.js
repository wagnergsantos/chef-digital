function safeJsonParse(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

export const state = {
    recipes: [],
    categories: {},
    favorites: safeJsonParse('chef_digital_favorites', []),
    shoppingList: safeJsonParse('chef_digital_shopping', {}),
    pantryItems: safeJsonParse('chef_digital_pantry', []),
    activeCategory: 'todos',
    searchQuery: '',
    showFavoritesOnly: false,
    showPantryOnly: false,
    plannedByDay: {}
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

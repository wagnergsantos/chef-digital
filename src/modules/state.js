export const state = {
    recipes: [],
    categories: {},
    favorites: JSON.parse(localStorage.getItem('chef_digital_favorites')) || [],
    shoppingList: JSON.parse(localStorage.getItem('chef_digital_shopping')) || {},
    pantryItems: JSON.parse(localStorage.getItem('chef_digital_pantry')) || [],
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


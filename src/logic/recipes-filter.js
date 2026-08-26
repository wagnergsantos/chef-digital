import { normalizeSearchText } from '../utils/text.js';

export { normalizeSearchText };

export function recipeIsFullyStocked(recipe, pantryItems = []) {
    if (!pantryItems || pantryItems.length === 0 || !recipe || !Array.isArray(recipe.ingredients)) return false;
    const normPantry = pantryItems.map(normalizeSearchText);
    return recipe.ingredients.every(ing => {
        const unit = (ing.unit || '').toLowerCase();
        if (
            unit.includes('a gosto') || 
            unit.includes('opcional') || 
            unit.includes('q.b.') || 
            unit.includes('quanto baste') || 
            unit.includes('fio') ||
            unit.includes('para refogar') ||
            unit.includes('para untar')
        ) return true;
        
        const normIng = normalizeSearchText(ing.name);
        return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
    });
}

export function recipeHasAnyPantryIngredient(recipe, pantryItems = []) {
    if (!pantryItems || pantryItems.length === 0 || !recipe || !Array.isArray(recipe.ingredients)) return false;
    const normPantry = pantryItems.map(normalizeSearchText);
    return recipe.ingredients.some(ing => {
        const normIng = normalizeSearchText(ing.name);
        return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
    });
}

export function matchRecipeSearch(recipe, rawQuery) {
    if (!recipe) return { matches: false, matchedIngredients: [] };
    const terms = normalizeSearchText(rawQuery).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return { matches: true, matchedIngredients: [] };

    const normTitle = normalizeSearchText(recipe.title);
    const matchedIngredients = [];

    const allTermsMatch = terms.every(term => {
        if (normTitle.includes(term)) return true;
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        const hitIngredient = ingredients.find(ing =>
            normalizeSearchText(ing.name).includes(term));
        if (hitIngredient) {
            if (!matchedIngredients.includes(hitIngredient.name)) {
                matchedIngredients.push(hitIngredient.name);
            }
            return true;
        }
        return false;
    });

    return { matches: allTermsMatch, matchedIngredients: allTermsMatch ? matchedIngredients : [] };
}

export function filterRecipesList(recipes, {
    activeCategory = 'todos',
    searchQuery = '',
    showFavoritesOnly = false,
    favorites = [],
    showPantryOnly = false,
    pantryItems = [],
    activeTags = [],
    recipeTags = {}
}) {
    if (!Array.isArray(recipes)) return [];

    return recipes.filter(recipe => {
        const categoryMatch = activeCategory === 'todos' || recipe.category === activeCategory;
        const searchMatch = matchRecipeSearch(recipe, searchQuery).matches;
        const favoriteMatch = !showFavoritesOnly || favorites.includes(recipe.id);
        const pantryMatch = !showPantryOnly || recipeHasAnyPantryIngredient(recipe, pantryItems);
        
        const tags = recipeTags[recipe.id] || [];
        const tagsMatch = activeTags.length === 0 || activeTags.every(t => tags.includes(t));

        return categoryMatch && searchMatch && favoriteMatch && pantryMatch && tagsMatch;
    });
}

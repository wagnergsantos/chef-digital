import { normalizeSearchText, escapeHtml } from '../utils/text.js';

export { normalizeSearchText, escapeHtml };

export function recipeHasTag(recipeId, tagKey, recipeTags) {
    if (!recipeTags || !recipeTags[recipeId]) return false;
    return recipeTags[recipeId].includes(tagKey);
}

export function recipeHasAnyTag(recipeId, tagKeys, recipeTags) {
    if (!recipeTags || !recipeTags[recipeId]) return false;
    return tagKeys.some(tagKey => recipeTags[recipeId].includes(tagKey));
}

export function recipeHasAllTags(recipeId, tagKeys, recipeTags) {
    if (!recipeTags || !recipeTags[recipeId]) return false;
    return tagKeys.every(tagKey => recipeTags[recipeId].includes(tagKey));
}

export function recipeIsFullyStocked(recipe, pantryItems = []) {
    if (!pantryItems || pantryItems.length === 0) return false;
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
    if (!pantryItems || pantryItems.length === 0) return false;
    const normPantry = pantryItems.map(normalizeSearchText);
    return recipe.ingredients.some(ing => {
        const normIng = normalizeSearchText(ing.name);
        return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
    });
}

export function matchRecipeSearch(recipe, rawQuery) {
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

export function scaleIngredientQty(qty, activePortions, servings) {
    if (qty === null || qty === undefined) return null;
    const numPortions = parseFloat(activePortions);
    if (isNaN(numPortions)) return qty;
    if (servings !== undefined && servings !== null && servings !== '') {
        const numServings = parseFloat(servings);
        if (!isNaN(numServings) && numServings > 0) {
            return qty * (numPortions / numServings);
        }
    }
    return qty * numPortions;
}

export function parseStepTimer(text) {
    if (!text) return null;
    const regex = /(\d+)\s*(min|minuto|minutos|h|hora|horas)/i;
    const match = text.match(regex);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    let totalSeconds = 0;
    let displayMinutes = 0;

    if (unit.startsWith('h')) {
        totalSeconds = value * 3600;
        displayMinutes = value * 60;
    } else {
        totalSeconds = value * 60;
        displayMinutes = value;
    }

    return {
        totalSeconds,
        displayMinutes
    };
}


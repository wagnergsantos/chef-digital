import { scaleIngredientQty } from './recipes.js';
import { normalizeUnit } from '../utils/units.js';

export function calculateConsolidatedShoppingList(allPlannedEntries, recipesList, currentShoppingList) {
    const safeShoppingList = currentShoppingList || {};
    if (!allPlannedEntries || !Array.isArray(allPlannedEntries) || allPlannedEntries.length === 0 || !Array.isArray(recipesList)) {
        return {
            ...safeShoppingList,
            "Menu Semanal Consolidado": []
        };
    }

    const checkedItemsMap = new Set();
    if (safeShoppingList["Menu Semanal Consolidado"] && Array.isArray(safeShoppingList["Menu Semanal Consolidado"])) {
        safeShoppingList["Menu Semanal Consolidado"].forEach(item => {
            if (item && item.checked && item.name) {
                checkedItemsMap.add(item.name.trim().toLowerCase());
            }
        });
    }

    const tempConsolidated = {};

    allPlannedEntries.forEach(p => {
        if (!p) return;
        const recipe = recipesList.find(r => r && r.id === p.recipeId);
        if (!recipe || !Array.isArray(recipe.ingredients)) return;

        recipe.ingredients.forEach(ing => {
            if (!ing || !ing.name) return;
            const normName = ing.name.trim();
            const normalizedUnit = normalizeUnit(ing.unit);
            const key = `${normName.toLowerCase()}|${normalizedUnit.toLowerCase()}`;

            let scaledQty = scaleIngredientQty(ing.qty, p.people, recipe.servings);

            if (tempConsolidated[key]) {
                if (tempConsolidated[key].qty !== null && scaledQty !== null) {
                    tempConsolidated[key].qty += scaledQty;
                }
            } else {
                const wasChecked = checkedItemsMap.has(normName.toLowerCase());
                tempConsolidated[key] = {
                    name: normName,
                    qty: scaledQty,
                    unit: normalizedUnit || ing.unit || '',
                    checked: wasChecked
                };
            }
        });
    });

    const consolidatedItems = Object.values(tempConsolidated);
    return {
        ...safeShoppingList,
        "Menu Semanal Consolidado": consolidatedItems
    };
}

export function formatShoppingListText(shoppingList) {
    if (!shoppingList || typeof shoppingList !== 'object') {
        return "";
    }

    let text = "🛒 MINHA LISTA DE COMPRAS - CHEF DIGITAL\n\n";
    let empty = true;

    Object.keys(shoppingList).forEach(recipeTitle => {
        const items = shoppingList[recipeTitle];
        if (Array.isArray(items) && items.length > 0) {
            empty = false;
            text += `■ ${recipeTitle.toUpperCase()}\n`;
            items.forEach(item => {
                const checkChar = item.checked ? "[x]" : "[ ]";
                const qtyText = item.qty ? ` (${item.qty} ${item.unit})` : (item.unit ? ` (${item.unit})` : '');
                text += `  ${checkChar} ${item.name}${qtyText}\n`;
            });
            text += "\n";
        }
    });

    return empty ? "" : text;
}

export function countShoppingItems(shoppingList) {
    let count = 0;
    if (!shoppingList) return 0;
    Object.keys(shoppingList).forEach(key => {
        if (Array.isArray(shoppingList[key])) {
            count += shoppingList[key].length;
        }
    });
    return count;
}

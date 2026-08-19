import { scaleIngredientQty } from './recipes.js';

export function calculateConsolidatedShoppingList(allPlannedEntries, recipesList, currentShoppingList) {
    if (!allPlannedEntries || allPlannedEntries.length === 0) {
        return null;
    }

    const checkedItemsMap = new Set();
    if (currentShoppingList["Menu Semanal Consolidado"]) {
        currentShoppingList["Menu Semanal Consolidado"].forEach(item => {
            if (item.checked) {
                checkedItemsMap.add(item.name.trim().toLowerCase());
            }
        });
    }

    const tempConsolidated = {};

    allPlannedEntries.forEach(p => {
        const recipe = recipesList.find(r => r.id === p.recipeId);
        if (!recipe || !Array.isArray(recipe.ingredients)) return;

        recipe.ingredients.forEach(ing => {
            const normName = ing.name.trim();
            const normUnit = (ing.unit || "").toLowerCase().trim();
            const key = `${normName.toLowerCase()}|${normUnit}`;

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
                    unit: ing.unit,
                    checked: wasChecked
                };
            }
        });
    });

    const consolidatedItems = Object.values(tempConsolidated);
    return {
        ...currentShoppingList,
        "Menu Semanal Consolidado": consolidatedItems
    };
}

export function formatShoppingListText(shoppingList) {
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

    return empty ? null : text;
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

import { state } from './state.js';
import { scaleIngredientQty } from '../logic/recipes.js';
import { getAllPlannedEntries } from './planner-drawer.js';

let _showToast = () => {};
let _previouslyFocusedElementRef = { current: null };

export function setShoppingDependencies({ showToast, previouslyFocusedElementRef }) {
    if (showToast) _showToast = showToast;
    if (previouslyFocusedElementRef) _previouslyFocusedElementRef = previouslyFocusedElementRef;
}

export function saveShoppingList() {
    localStorage.setItem('chef_digital_shopping', JSON.stringify(state.shoppingList));
}

export function updateShoppingListBadge() {
    const badge = document.getElementById('shopping-list-badge');
    if (!badge) return;
    let count = 0;
    Object.keys(state.shoppingList).forEach(key => {
        if (Array.isArray(state.shoppingList[key])) {
            count += state.shoppingList[key].length;
        }
    });

    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

export function toggleShoppingList() {
    const drawer = document.getElementById('shopping-list-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer || !backdrop) return;
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        backdrop.classList.remove('active');
        if (_previouslyFocusedElementRef.current) {
            _previouslyFocusedElementRef.current.focus();
            _previouslyFocusedElementRef.current = null;
        }
    } else {
        const plannerDrawer = document.getElementById('planner-drawer');
        if (plannerDrawer && plannerDrawer.classList.contains('open')) {
            plannerDrawer.classList.remove('open');
        }
        _previouslyFocusedElementRef.current = document.activeElement;
        drawer.classList.add('open');
        backdrop.classList.add('active');
        renderShoppingList();
        setTimeout(() => {
            const firstEl = drawer.querySelector('button, input');
            if (firstEl) firstEl.focus();
        }, 100);
    }
}

export function generateConsolidatedShoppingList() {
    const allEntries = getAllPlannedEntries();
    if (allEntries.length === 0) {
        _showToast('Seu menu semanal está vazio! Planeje receitas primeiro.', 'error');
        return;
    }

    const checkedItemsMap = new Set();
    if (state.shoppingList["Menu Semanal Consolidado"]) {
        state.shoppingList["Menu Semanal Consolidado"].forEach(item => {
            if (item.checked) {
                checkedItemsMap.add(item.name.trim().toLowerCase());
            }
        });
    }

    state.shoppingList["Menu Semanal Consolidado"] = [];
    const tempConsolidated = {};

    allEntries.forEach(p => {
        const recipe = state.recipes.find(r => r.id === p.recipeId);
        if (!recipe) return;

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

    Object.keys(tempConsolidated).forEach(k => {
        state.shoppingList["Menu Semanal Consolidado"].push(tempConsolidated[k]);
    });

    saveShoppingList();
    updateShoppingListBadge();
    
    const plannerDrawer = document.getElementById('planner-drawer');
    if (plannerDrawer) plannerDrawer.classList.remove('open');
    setTimeout(() => {
        toggleShoppingList();
    }, 250);
}

export function addCurrentRecipeToShoppingList(activeRecipeId, activeRecipePortions) {
    const recipe = state.recipes.find(r => r.id === activeRecipeId);
    if (!recipe) return;

    if (!state.shoppingList[recipe.title]) {
        state.shoppingList[recipe.title] = [];
    }

    recipe.ingredients.forEach(ing => {
        const exists = state.shoppingList[recipe.title].some(item => item.name === ing.name);
        if (!exists) {
            let qtyVal = scaleIngredientQty(ing.qty, activeRecipePortions, recipe.servings);
            state.shoppingList[recipe.title].push({
                name: ing.name,
                qty: qtyVal,
                unit: ing.unit,
                checked: false
            });
        }
    });

    saveShoppingList();
    updateShoppingListBadge();
    _showToast('Ingredientes adicionados à Lista!');
}

export function renderShoppingList() {
    const container = document.getElementById('shopping-list-items');
    if (!container) return;
    container.innerHTML = '';

    const keys = Object.keys(state.shoppingList);
    if (keys.length === 0) {
        container.innerHTML = `
            <div class="drawer-empty-state">
                <p>Sua lista está vazia!</p>
                <p class="sub">Abra uma receita e adicione ingredientes clicando no botão de lista.</p>
            </div>
        `;
        return;
    }

    keys.forEach(recipeTitle => {
        const items = state.shoppingList[recipeTitle];
        if (!Array.isArray(items) || items.length === 0) return;

        const section = document.createElement('div');
        section.className = "shopping-section";
        
        section.innerHTML = `
            <div class="shopping-section-header">
                <h4>${recipeTitle}</h4>
                <button onclick="removeRecipeFromShoppingList('${recipeTitle}')" class="drawer-card-remove" title="Remover grupo de compras" aria-label="Remover grupo de compras de ${recipeTitle}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        `;

        const list = document.createElement('ul');
        list.className = "shopping-list-items-wrapper";

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = "shopping-item-li";
            
            let displayQty = '';
            if (item.qty !== null) {
                const formattedQty = Number(item.qty.toFixed(2)).toString();
                displayQty = ` - <span class="qty-span">${formattedQty} ${item.unit}</span>`;
            } else if (item.unit) {
                displayQty = ` - <span class="qty-span">${item.unit}</span>`;
            }

            const rawQtyText = displayQty ? `, quantidade ${item.qty !== null ? Number(item.qty.toFixed(2)).toString() : ''} ${item.unit}` : '';
            li.innerHTML = `
                <div class="shopping-checkbox-wrapper" onclick="toggleShoppingItemCheck('${recipeTitle}', ${index})" role="checkbox" aria-checked="${item.checked}" tabindex="0" onkeydown="if(event.key === ' ' || event.key === 'Enter') { toggleShoppingItemCheck('${recipeTitle}', ${index}); event.preventDefault(); }" aria-label="${item.name}${rawQtyText}">
                    <div class="shopping-checkbox ${item.checked ? 'checked' : ''}">
                        ${item.checked ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
                    </div>
                    <span class="shopping-item-name ${item.checked ? 'checked' : ''}">${item.name}${displayQty}</span>
                </div>
            `;
            list.appendChild(li);
        });

        section.appendChild(list);
        container.appendChild(section);
    });
}

export function toggleShoppingItemCheck(recipeTitle, index) {
    if (state.shoppingList[recipeTitle] && state.shoppingList[recipeTitle][index]) {
        state.shoppingList[recipeTitle][index].checked = !state.shoppingList[recipeTitle][index].checked;
        saveShoppingList();
        renderShoppingList();
    }
}

export function removeRecipeFromShoppingList(recipeTitle) {
    delete state.shoppingList[recipeTitle];
    saveShoppingList();
    updateShoppingListBadge();
    renderShoppingList();
}

export function clearShoppingList() {
    state.shoppingList = {};
    saveShoppingList();
    updateShoppingListBadge();
    renderShoppingList();
}

export function copyShoppingList() {
    let text = "🛒 MINHA LISTA DE COMPRAS - CHEF DIGITAL\n\n";
    let empty = true;

    Object.keys(state.shoppingList).forEach(recipeTitle => {
        const items = state.shoppingList[recipeTitle];
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

    if (empty) {
        _showToast('Sua lista está vazia para ser copiada!', 'error');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        _showToast('Lista copiada para a área de transferência!');
    }).catch(() => {
        _showToast('Erro ao tentar copiar a lista.', 'error');
    });
}

export function printShoppingList() {
    window.print();
}

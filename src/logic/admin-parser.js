export function validateRecipePayloadData({ title, selectedCategories, ingredients, steps }) {
    if (!title || !title.trim()) {
        return { isValid: false, error: 'O título da receita é obrigatório.' };
    }

    if (!selectedCategories || selectedCategories.length === 0) {
        return { isValid: false, error: 'Selecione pelo menos uma categoria.' };
    }

    const validIngredients = (ingredients || []).map((ing, index) => {
        const rawQty = ing.qty !== undefined && ing.qty !== null ? String(ing.qty).trim() : '';
        const parsedQty = rawQty ? parseFloat(rawQty.replace(',', '.')) : null;
        
        return {
            name: (ing.name || '').trim(),
            qty: isNaN(parsedQty) ? null : parsedQty,
            unit: (ing.unit || '').trim() || null,
            ordem: index
        };
    }).filter(ing => ing.name);

    if (validIngredients.length === 0) {
        return { isValid: false, error: 'Adicione pelo menos um ingrediente.' };
    }

    const validSteps = (steps || []).map((s, index) => {
        return {
            step_text: (s.step_text || '').trim(),
            ordem: index
        };
    }).filter(s => s.step_text);

    if (validSteps.length === 0) {
        return { isValid: false, error: 'Adicione pelo menos um passo de preparo.' };
    }

    return {
        isValid: true,
        validIngredients,
        validSteps
    };
}

export function buildRecipePayload({
    id = null,
    title,
    emoji,
    image,
    source,
    tips,
    servings,
    selectedCategories,
    validIngredients,
    validSteps
}) {
    const numServings = servings ? parseInt(String(servings).trim(), 10) : null;
    const parsedServings = (!isNaN(numServings) && numServings > 0) ? numServings : null;

    return {
        p_id: id,
        p_title: (title || '').trim(),
        p_emoji: (emoji || '').trim() || '🍲',
        p_image: (image || '').trim() || null,
        p_source: (source || '').trim() || null,
        p_tips: (tips || '').trim() || null,
        p_servings: parsedServings,
        p_category: selectedCategories,
        p_ingredientes: validIngredients,
        p_passos: validSteps
    };
}

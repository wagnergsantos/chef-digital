export function mapSummaryRecipes(rows = []) {
    return rows.map((r) => ({
        id: r.id,
        title: r.title,
        category_id: r.category_id,
        category: r.category,
        emoji: r.emoji,
        image: r.image,
        servings: r.servings,
        prep_time: r.prep_time,
        cook_time: r.cook_time,
        source_url: r.source_url,
        author: r.author,
        tips: r.tips
    }));
}

export function mapFullRecipe(r, catById = {}) {
    const sortedIngs = Array.isArray(r.ingredientes)
        ? [...r.ingredientes].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        : [];

    const sortedSteps = Array.isArray(r.passos)
        ? [...r.passos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        : [];

    const categoryId = r.category_id || r.categoria_id || r.categorias?.id;
    const categoryKey = r.categorias?.key || (categoryId ? catById[String(categoryId)] : null) || r.category || 'outros';

    return {
        id: r.id,
        title: r.title,
        category_id: categoryId,
        category: categoryKey,
        emoji: r.emoji,
        image: r.image,
        servings: r.servings,
        prep_time: r.prep_time,
        cook_time: r.cook_time,
        source_url: r.source_url,
        author: r.author,
        tips: r.tips,
        ingredient_count: sortedIngs.length,
        ingredients: sortedIngs.map((i) => ({
            name: i.name,
            qty: i.qty,
            unit: i.unit
        })),
        steps: sortedSteps.map((s) => s.step_text)
    };
}

export function mapFullRecipes(rows = [], catById = {}) {
    return rows.map((r) => mapFullRecipe(r, catById));
}

export function buildRecipeDetailsIndex(ingredientsRows = [], stepsRows = []) {
    const details = {};

    for (const ing of ingredientsRows) {
        const recipeId = ing.receita_id;
        if (!details[recipeId]) {
            details[recipeId] = { ingredients: [], steps: [] };
        }
        details[recipeId].ingredients.push({
            name: ing.name,
            qty: ing.qty,
            unit: ing.unit
        });
    }

    for (const step of stepsRows) {
        const recipeId = step.receita_id;
        if (!details[recipeId]) {
            details[recipeId] = { ingredients: [], steps: [] };
        }
        details[recipeId].steps.push(step.step_text);
    }

    return details;
}

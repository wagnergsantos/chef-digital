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

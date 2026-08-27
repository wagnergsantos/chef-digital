export function formatRecipeShareText(recipe, categoriesMap = {}, recipeUrl = '') {
    if (!recipe) return '';

    const categoryLabel = categoriesMap[recipe.category] || recipe.category || '';
    const servingsText = recipe.servings ? ` (${recipe.servings} porções)` : '';

    let text = `🍽️ *${recipe.title}*${servingsText}\n`;
    if (categoryLabel) text += `📁 Categorias: ${categoryLabel}\n`;
    text += `\n🛒 *Ingredientes:*\n`;

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
            let qty = '';
            if (ing.qty !== null && ing.qty !== undefined) {
                qty = `${ing.qty} ${ing.unit || ''}`.trim();
            } else if (ing.unit) {
                qty = ing.unit;
            }
            text += `• ${ing.name}${qty ? ` - ${qty}` : ''}\n`;
        });
    }

    if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
        text += `\n👨‍🍳 *Modo de Preparo:*\n`;
        recipe.steps.forEach((step, idx) => {
            text += `${idx + 1}. ${step}\n`;
        });
    }

    if (recipe.tips) {
        text += `\n💡 *Dica:* ${recipe.tips}\n`;
    }

    if (recipe.source_url) {
        const authorInfo = recipe.author ? ` (${recipe.author})` : '';
        text += `\n🔗 *Fonte:* ${recipe.source_url}${authorInfo}\n`;
    }

    if (recipeUrl) {
        text += `\n📱 *Ver no app:* ${recipeUrl}\n`;
    }

    text += `\n---\nCompartilhado via *Chef Digital* 📖`;
    return text;
}

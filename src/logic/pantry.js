export function parsePantryInput(rawText) {
    if (!rawText) return [];
    return rawText
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(Boolean);
}

export function formatPantryText(pantryItems) {
    if (!Array.isArray(pantryItems)) return '';
    return pantryItems.join('\n');
}

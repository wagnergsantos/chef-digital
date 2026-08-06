export function getCardImageLoadingAttrs(index) {
    const prioritized = index < 2;
    return {
        loading: prioritized ? 'eager' : 'lazy',
        fetchpriority: prioritized ? 'high' : 'auto'
    };
}

export function buildRecipeCardAccessibleName(title) {
    return String(title || '').trim();
}

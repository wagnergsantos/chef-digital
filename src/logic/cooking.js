export function formatTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MAX_HISTORY_PER_RECIPE = 20;
const MAX_TOTAL_RECIPES_IN_HISTORY = 100;

export function recordRecipeCompletionHistory(history = {}, recipeId) {
    if (!recipeId) return history;

    const record = history[recipeId] || { count: 0, history: [] };
    const nowIso = new Date().toISOString();
    
    const previousHistory = Array.isArray(record.history) ? record.history : [];
    const updatedHistory = [nowIso, ...previousHistory].slice(0, MAX_HISTORY_PER_RECIPE);

    const updatedRecord = {
        count: (record.count || 0) + 1,
        lastCooked: nowIso,
        history: updatedHistory
    };

    const nextHistory = {
        ...history,
        [recipeId]: updatedRecord
    };

    // Poda o objeto geral caso exceda o limite de receitas armazenadas (mantém as mais recentes)
    const keys = Object.keys(nextHistory);
    if (keys.length > MAX_TOTAL_RECIPES_IN_HISTORY) {
        keys.sort((a, b) => {
            const timeA = new Date(nextHistory[a]?.lastCooked || 0).getTime();
            const timeB = new Date(nextHistory[b]?.lastCooked || 0).getTime();
            return timeB - timeA;
        });
        const pruned = {};
        keys.slice(0, MAX_TOTAL_RECIPES_IN_HISTORY).forEach(k => {
            pruned[k] = nextHistory[k];
        });
        return pruned;
    }

    return nextHistory;
}

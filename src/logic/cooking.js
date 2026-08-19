export function formatTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function recordRecipeCompletionHistory(history = {}, recipeId) {
    if (!recipeId) return history;

    const record = history[recipeId] || { count: 0, history: [] };
    const nowIso = new Date().toISOString();
    
    const updatedRecord = {
        count: (record.count || 0) + 1,
        lastCooked: nowIso,
        history: [nowIso, ...(Array.isArray(record.history) ? record.history : [])]
    };

    return {
        ...history,
        [recipeId]: updatedRecord
    };
}

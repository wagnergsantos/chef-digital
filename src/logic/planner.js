import { WEEK_DAYS } from './storage.js';

export function createEmptyPlannedByDay() {
    const byDay = {};
    WEEK_DAYS.forEach(d => { byDay[d.key] = []; });
    return byDay;
}

export function migratePlannedData(raw, recipesList = []) {
    if (Array.isArray(raw)) {
        const byDay = createEmptyPlannedByDay();
        raw.forEach(p => {
            const targetId = p.id !== undefined ? p.id : p.recipeId;
            let people = p.people;
            if (p.portions !== undefined && people === undefined) {
                let servings = 1;
                if (Array.isArray(recipesList) && recipesList.length > 0) {
                    const recipe = recipesList.find(r => String(r.id) === String(targetId));
                    if (recipe && recipe.servings) servings = recipe.servings;
                }
                people = p.portions * servings;
            }
            byDay.dom.push({ recipeId: targetId, people: people !== undefined ? people : 1 });
        });
        return { byDay, hasMigrated: true };
    }

    const byDay = createEmptyPlannedByDay();
    let hasMigrated = false;
    WEEK_DAYS.forEach(d => {
        if (raw && Array.isArray(raw[d.key])) {
            byDay[d.key] = raw[d.key];
        } else if (raw && raw[d.key] !== undefined) {
            hasMigrated = true;
        }
    });
    return { byDay, hasMigrated };
}

export function getAllPlannedEntries(plannedByDay) {
    const all = [];
    WEEK_DAYS.forEach(d => {
        if (plannedByDay && plannedByDay[d.key]) {
            plannedByDay[d.key].forEach(entry => {
                all.push({ day: d.key, recipeId: entry.recipeId, people: entry.people });
            });
        }
    });
    return all;
}

export function getPlannedDaysForRecipe(recipeId, plannedByDay) {
    return WEEK_DAYS
        .filter(d => plannedByDay && plannedByDay[d.key] && plannedByDay[d.key].some(e => e.recipeId === recipeId))
        .map(d => d.key);
}

export function isRecipePlanned(recipeId, plannedByDay) {
    return getPlannedDaysForRecipe(recipeId, plannedByDay).length > 0;
}

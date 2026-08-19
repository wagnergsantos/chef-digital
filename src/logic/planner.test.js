import { describe, it, expect } from 'vitest';
import {
    createEmptyPlannedByDay,
    migratePlannedData,
    getAllPlannedEntries,
    getPlannedDaysForRecipe,
    isRecipePlanned
} from './planner.js';

describe('planner logic', () => {
    it('cria estrutura vazia por dia da semana', () => {
        const empty = createEmptyPlannedByDay();
        expect(Object.keys(empty).length).toBe(7);
        expect(empty.dom).toEqual([]);
    });

    it('migra array antigo de planejados para estrutura por dia', () => {
        const legacy = [{ id: 10, people: 2 }];
        const { byDay, hasMigrated } = migratePlannedData(legacy);
        expect(hasMigrated).toBe(true);
        expect(byDay.dom).toEqual([{ recipeId: 10, people: 2 }]);
    });

    it('retorna todas as entradas planejadas', () => {
        const plannedByDay = createEmptyPlannedByDay();
        plannedByDay.seg.push({ recipeId: 1, people: 2 });
        plannedByDay.sex.push({ recipeId: 2, people: 4 });

        const all = getAllPlannedEntries(plannedByDay);
        expect(all.length).toBe(2);
        expect(all[0]).toEqual({ day: 'seg', recipeId: 1, people: 2 });
    });

    it('identifica em quais dias uma receita esta planejada', () => {
        const plannedByDay = createEmptyPlannedByDay();
        plannedByDay.ter.push({ recipeId: 5, people: 1 });
        plannedByDay.qui.push({ recipeId: 5, people: 1 });

        expect(getPlannedDaysForRecipe(5, plannedByDay)).toEqual(['ter', 'qui']);
        expect(isRecipePlanned(5, plannedByDay)).toBe(true);
        expect(isRecipePlanned(99, plannedByDay)).toBe(false);
    });
});

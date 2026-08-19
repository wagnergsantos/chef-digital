import { describe, it, expect } from 'vitest';
import { formatTimerDisplay, recordRecipeCompletionHistory } from './cooking.js';

describe('cooking logic', () => {
    it('formata segundos para mm:ss com zero à esquerda', () => {
        expect(formatTimerDisplay(65)).toBe('01:05');
        expect(formatTimerDisplay(0)).toBe('00:00');
    });

    it('registra conclusao de receita no historico', () => {
        const history = {};
        const updated = recordRecipeCompletionHistory(history, 10);

        expect(updated[10].count).toBe(1);
        expect(updated[10].history).toHaveLength(1);
        expect(updated[10].lastCooked).toBeDefined();
    });
});

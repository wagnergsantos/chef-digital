import { describe, it, expect } from 'vitest';
import { formatRecipeShareText } from './recipe-modal-logic.js';

describe('recipe modal logic', () => {
    it('formata receita completa para compartilhamento', () => {
        const recipe = {
            title: 'Bolo de Fubá',
            category: 'bolos',
            servings: 8,
            ingredients: [{ name: 'Fubá', qty: 2, unit: 'xícaras' }],
            steps: ['Misturar tudo', 'Assar por 40 min'],
            tips: 'Sirva morno'
        };
        const text = formatRecipeShareText(recipe, { bolos: 'Bolos & Doces' });
        expect(text).toContain('🍽️ *Bolo de Fubá* (8 porções)');
        expect(text).toContain('📁 Categorias: Bolos & Doces');
        expect(text).toContain('• Fubá - 2 xícaras');
        expect(text).toContain('1. Misturar tudo');
        expect(text).toContain('💡 *Dica:* Sirva morno');
    });

    it('inclui link do app quando fornecido', () => {
        const recipe = {
            title: 'Bolo de Fubá',
            category: 'bolos'
        };
        const text = formatRecipeShareText(recipe, {}, 'https://app.local/?receita=123');
        expect(text).toContain('📱 *Ver no app:* https://app.local/?receita=123');
    });
});

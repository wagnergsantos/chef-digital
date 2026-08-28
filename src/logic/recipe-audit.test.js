import { describe, it, expect } from 'vitest';
import { checkRecipeAudit, filterRecipesByAudit, calculateAuditCounts } from './recipe-audit.js';

describe('recipe-audit', () => {
  const completeRecipe = {
    id: 1,
    title: 'Bolo de Cenoura',
    emoji: '🥕',
    image: 'https://example.com/bolo.jpg',
    categoria_id: 2,
    prep_time: 20,
    cook_time: 40,
    servings: 8,
    tags: ['Doce', 'Fácil']
  };

  const recipeNoImage = {
    id: 2,
    title: 'Pão de Queijo',
    emoji: '🧀',
    image: '',
    categoria_id: 3,
    prep_time: 15,
    cook_time: 25,
    servings: 12,
    tags: ['Lanche']
  };

  const recipeNoCategory = {
    id: 3,
    title: 'Molho Especial',
    emoji: '🥣',
    image: 'https://example.com/molho.jpg',
    categoria_id: null,
    prep_time: 5,
    cook_time: 0,
    servings: 4,
    tags: ['Molho']
  };

  const recipeNoTime = {
    id: 4,
    title: 'Salada Simples',
    emoji: '🥗',
    image: 'https://example.com/salada.jpg',
    categoria_id: 1,
    prep_time: null,
    cook_time: null,
    servings: null,
    tags: ['Saudável']
  };

  const recipeNoTags = {
    id: 5,
    title: 'Arroz Branco',
    emoji: '🍚',
    image: 'https://example.com/arroz.jpg',
    categoria_id: 4,
    prep_time: 5,
    cook_time: 15,
    servings: 4,
    tags: []
  };

  const recipeNeedsReview = {
    id: 6,
    title: 'Feijoada Importada',
    emoji: '🍲',
    image: 'https://example.com/feijoada.jpg',
    categoria_id: 1,
    prep_time: 30,
    cook_time: 120,
    servings: 10,
    tags: ['A Revisar']
  };

  const allRecipes = [
    completeRecipe,
    recipeNoImage,
    recipeNoCategory,
    recipeNoTime,
    recipeNoTags,
    recipeNeedsReview
  ];

  it('correctly checks complete recipe', () => {
    const audit = checkRecipeAudit(completeRecipe);
    expect(audit.isIncomplete).toBe(false);
    expect(audit.issues).toHaveLength(0);
  });

  it('identifies recipe without image', () => {
    const audit = checkRecipeAudit(recipeNoImage);
    expect(audit.hasNoImage).toBe(true);
    expect(audit.isIncomplete).toBe(true);
    expect(audit.issues.some((i) => i.id === 'no-image')).toBe(true);
  });

  it('filters recipes by audit type', () => {
    expect(filterRecipesByAudit(allRecipes, 'all')).toHaveLength(6);
    expect(filterRecipesByAudit(allRecipes, 'no-image')).toEqual([recipeNoImage]);
    expect(filterRecipesByAudit(allRecipes, 'no-category')).toEqual([recipeNoCategory]);
    expect(filterRecipesByAudit(allRecipes, 'no-time-servings')).toEqual([recipeNoTime]);
    expect(filterRecipesByAudit(allRecipes, 'no-tags')).toEqual([recipeNoTags]);
    expect(filterRecipesByAudit(allRecipes, 'needs-review')).toEqual([recipeNeedsReview]);
    expect(filterRecipesByAudit(allRecipes, 'incomplete')).toHaveLength(5);
  });

  it('calculates audit counts accurately', () => {
    const counts = calculateAuditCounts(allRecipes);
    expect(counts.all).toBe(6);
    expect(counts['no-image']).toBe(1);
    expect(counts['no-category']).toBe(1);
    expect(counts['no-time-servings']).toBe(1);
    expect(counts['no-tags']).toBe(1);
    expect(counts['needs-review']).toBe(1);
    expect(counts.incomplete).toBe(5);
  });
});

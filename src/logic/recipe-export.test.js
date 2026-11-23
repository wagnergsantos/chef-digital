import { describe, it, expect } from 'vitest';
import {
  buildAuditExportPayload,
  parseAndValidateAiPatch
} from './recipe-export.js';

describe('recipe-export logic', () => {
  const mockExistingTags = ['Almoço', 'Jantar', 'Sobremesa', 'Rápido', 'Fácil'];
  const mockCategories = [
    { id: 1, key: 'carnes', label: 'Carnes' },
    { id: 2, key: 'massas', label: 'Massas' }
  ];

  const mockRecipes = [
    {
      id: 1,
      title: 'Bife Acebolado',
      category_id: 1,
      categoria_id: 1,
      image: 'https://img.com/bife.jpg',
      prep_time: null,
      cook_time: null,
      servings: null,
      tags: [],
      ingredients: [{ name: 'Alcatra', qty: 500, unit: 'g' }],
      steps: [{ step_text: 'Frite os bifes e adicione cebola fatiada.' }]
    },
    {
      id: 2,
      title: 'Macarronada Completa',
      category_id: 2,
      categoria_id: 2,
      image: 'https://img.com/macarrao.jpg',
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      tags: ['Massas', 'Jantar'],
      ingredients: [{ name: 'Espaguete', qty: 500, unit: 'g' }],
      steps: [{ step_text: 'Cozinhe o espaguete.' }]
    }
  ];

  it('coloca tags_disponiveis no começo do objeto exportado', () => {
    const payload = buildAuditExportPayload({
      recipes: mockRecipes,
      allExistingTags: mockExistingTags,
      categories: mockCategories,
      filterType: 'no-time-servings'
    });

    const keys = Object.keys(payload);
    expect(keys[0]).toBe('tags_disponiveis');
    expect(payload.tags_disponiveis).toEqual([...mockExistingTags].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    expect(payload.instrucoes).toBeDefined();
    expect(payload.formato_resposta_esperado).toBeDefined();
  });

  it('filtra apenas as receitas que estão com pendência selecionada', () => {
    const payload = buildAuditExportPayload({
      recipes: mockRecipes,
      allExistingTags: mockExistingTags,
      categories: mockCategories,
      filterType: 'no-time-servings'
    });

    expect(payload.total_receitas).toBe(1);
    expect(payload.receitas[0].id).toBe(1);
    expect(payload.receitas[0].title).toBe('Bife Acebolado');
    expect(payload.receitas[0].category).toBe('Carnes');
  });

  it('valida e faz parse do patch retornado pela LLM (array plano)', () => {
    const aiJson = JSON.stringify([
      {
        id: 1,
        prep_time: 10,
        cook_time: 15,
        servings: 2,
        tags: ['Almoço', 'Rápido']
      }
    ]);

    const result = parseAndValidateAiPatch(aiJson, mockRecipes);
    expect(result.valid).toBe(true);
    expect(result.patches).toHaveLength(1);
    expect(result.patches[0]).toEqual({
      id: 1,
      title: 'Bife Acebolado',
      prep_time: 10,
      cook_time: 15,
      servings: 2,
      tags: ['Almoço', 'Rápido']
    });
  });

  it('faz parse mesmo se a LLM responder com markdown codeblock ```json', () => {
    const aiMarkdown = '```json\n[\n  {\n    "id": 1,\n    "prep_time": "12",\n    "cook_time": "18",\n    "servings": "3",\n    "tags": ["Fácil"]\n  }\n]\n```';

    const result = parseAndValidateAiPatch(aiMarkdown, mockRecipes);
    expect(result.valid).toBe(true);
    expect(result.patches[0].prep_time).toBe(12);
    expect(result.patches[0].cook_time).toBe(18);
    expect(result.patches[0].servings).toBe(3);
    expect(result.patches[0].tags).toEqual(['Fácil']);
  });

  it('retorna erro se o formato não for um array válido', () => {
    const invalid = '{"id": 1, "prep_time": 10}';
    const result = parseAndValidateAiPatch(invalid, mockRecipes);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('array');
  });
});

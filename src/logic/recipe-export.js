import { checkRecipeAudit, filterRecipesByAudit } from './recipe-audit.js';

/**
 * Constrói o payload para exportar receitas incompletas para uma LLM.
 * Coloca as tags existentes no topo para a IA priorizar seu reaproveitamento.
 */
export function buildAuditExportPayload({
  recipes = [],
  allExistingTags = [],
  categories = [],
  filterType = 'no-time-servings'
}) {
  const filtered = filterRecipesByAudit(recipes, filterType);

  const categoryMap = new Map();
  for (const c of categories) {
    categoryMap.set(c.id, c.label || c.name || c.key);
    if (c.key) categoryMap.set(c.key, c.label || c.name || c.key);
  }

  const exportedRecipes = filtered.map((r) => {
    const catLabel =
      categoryMap.get(r.category_id) ||
      categoryMap.get(r.categoria_id) ||
      r.categoria ||
      r.category ||
      null;

    const ingList = (r.ingredients || []).map((i) => {
      const item = {
        name: i.name,
        qty: i.qty !== undefined && i.qty !== null ? i.qty : null,
        unit: i.unit || null
      };
      if (i.group_name) item.group = i.group_name;
      return item;
    });

    const stepList = (r.steps || []).map((s) => (typeof s === 'string' ? s : s.step_text || ''));

    return {
      id: r.id,
      title: r.title,
      category: catLabel,
      prep_time: r.prep_time !== undefined && r.prep_time !== null ? r.prep_time : null,
      cook_time: r.cook_time !== undefined && r.cook_time !== null ? r.cook_time : null,
      servings: r.servings !== undefined && r.servings !== null ? r.servings : null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      ingredients: ingList,
      steps: stepList
    };
  });

  // tags_disponiveis no começo absoluto do objeto
  return {
    tags_disponiveis: [...allExistingTags].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    instrucoes:
      'Você é um assistente culinário especializado. Preencha os campos vazios (prep_time, cook_time, servings e tags) para cada receita analisando o título, ingredientes e modo de preparo. Mantenha os IDs exatamente iguais. Priorize o uso das "tags_disponiveis" fornecidas acima. Retorne APENAS um array JSON puro (sem explicações adicionais).',
    regras_preenchimento: {
      prep_time: 'Tempo ativo de preparo em minutos (cortar, temperar, bater, misturar). Inteiro.',
      cook_time: 'Tempo passivo de cozimento/forno/fogo/geladeira em minutos. Inteiro.',
      servings: 'Rendimento estimado em número de porções ou unidades. Inteiro.',
      tags: 'Lista de tags adequadas. Priorize selecionar das "tags_disponiveis", podendo sugerir novas se indispensável.'
    },
    formato_resposta_esperado: [
      {
        id: 123,
        prep_time: 15,
        cook_time: 40,
        servings: 6,
        tags: ['Almoço', 'Fácil']
      }
    ],
    total_receitas: exportedRecipes.length,
    receitas: exportedRecipes
  };
}

/**
 * Faz parse e valida o texto JSON retornado pela LLM.
 */
export function parseAndValidateAiPatch(rawText, existingRecipes = []) {
  if (!rawText || typeof rawText !== 'string') {
    return { valid: false, error: 'Texto de resposta vazio ou inválido.', patches: [] };
  }

  let cleaned = rawText.trim();

  // Remove code fences markdown se houver
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  // Localiza array JSON caso haja texto antes ou depois
  const startBracket = cleaned.indexOf('[');
  const endBracket = cleaned.lastIndexOf(']');
  if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
    cleaned = cleaned.slice(startBracket, endBracket + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return {
      valid: false,
      error: `JSON malformado retornado pela IA: ${err.message}`,
      patches: []
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      valid: false,
      error: 'A resposta da IA deve ser um array JSON contendo as receitas.',
      patches: []
    };
  }

  const recipeMap = new Map((existingRecipes || []).map((r) => [Number(r.id), r]));
  const patches = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item || typeof item !== 'object') continue;

    const id = Number(item.id);
    if (!id || isNaN(id)) continue;

    const existing = recipeMap.get(id);

    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const n = parseInt(String(val).replace(/\D/g, ''), 10);
      return isNaN(n) ? null : n;
    };

    const prepTime = parseNum(item.prep_time);
    const cookTime = parseNum(item.cook_time);
    const servings = parseNum(item.servings);

    const tags = Array.isArray(item.tags)
      ? item.tags.map((t) => String(t).trim()).filter(Boolean)
      : [];

    patches.push({
      id,
      title: existing?.title || item.title || `Receita #${id}`,
      prep_time: prepTime,
      cook_time: cookTime,
      servings: servings,
      tags
    });
  }

  if (patches.length === 0) {
    return {
      valid: false,
      error: 'Nenhuma receita com ID válido foi encontrada no JSON fornecido.',
      patches: []
    };
  }

  return {
    valid: true,
    error: null,
    patches
  };
}

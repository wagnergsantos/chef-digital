import { http, HttpResponse } from 'msw';

export const mockCategories = [
  { id: 1, key: 'carnes', label: 'Carnes', sort_order: 1, description: 'Pratos com carnes' },
  { id: 2, key: 'massas', label: 'Massas', sort_order: 2, description: 'Massas e risotos' },
  { id: 3, key: 'doces', label: 'Doces & Sobremesas', sort_order: 3, description: 'Sobremesas e doces' },
  { id: 4, key: 'saladas', label: 'Saladas', sort_order: 4, description: 'Saladas e entradas' }
];

export const mockTags = [
  { id: 1, key: 'fit', label: 'Fit', sort_order: 1 },
  { id: 2, key: 'rapida', label: 'Rápida', sort_order: 2 },
  { id: 3, key: 'almoco-de-domingo', label: 'Almoço de Domingo', sort_order: 3 }
];

export const mockRecipes = [
  {
    id: 1,
    title: 'Frango com Legumes Assados',
    category_id: 1,
    emoji: '🍗',
    image: null,
    servings: 4,
    prep_time: 15,
    cook_time: 30,
    source_url: null,
    author: 'Chef',
    tips: 'Adicione alecrim.',
    categorias: { id: 1, key: 'carnes', label: 'Carnes' },
    receita_tags: [
      { tags: { key: 'fit', label: 'Fit' } },
      { tags: { key: 'rapida', label: 'Rápida' } }
    ],
    ingredientes: [
      { name: 'peito de frango', qty: 500, unit: 'g', group_name: 'Principal', ordem: 0 },
      { name: 'cenoura', qty: 2, unit: 'unidade(s)', group_name: 'Legumes', ordem: 1 },
      { name: 'azeite', qty: 2, unit: 'colheres de sopa', group_name: null, ordem: 2 }
    ],
    passos: [
      { step_text: 'Corte o frango em cubos e tempere com sal e pimenta.', ordem: 0 },
      { step_text: 'Asse por 30 minutos a 200°C.', ordem: 1 }
    ]
  },
  {
    id: 2,
    title: 'Macarrão com Molho Pesto',
    category_id: 2,
    emoji: '🍝',
    image: null,
    servings: 2,
    prep_time: 10,
    cook_time: 15,
    source_url: null,
    author: 'Chef',
    tips: 'Use manjericão fresco.',
    categorias: { id: 2, key: 'massas', label: 'Massas' },
    receita_tags: [
      { tags: { key: 'rapida', label: 'Rápida' } }
    ],
    ingredientes: [
      { name: 'macarrão espaguete', qty: 250, unit: 'g', group_name: 'Massa', ordem: 0 },
      { name: 'azeite', qty: 3, unit: 'cs', group_name: 'Molho', ordem: 1 },
      { name: 'manjericão', qty: 1, unit: 'xícara(s)', group_name: 'Molho', ordem: 2 }
    ],
    passos: [
      { step_text: 'Cozinhe o espaguete em água fervente.', ordem: 0 },
      { step_text: 'Bata o azeite e manjericão no processador.', ordem: 1 }
    ]
  },
  {
    id: 3,
    title: 'Bolo de Cenoura com Chocolate',
    category_id: 3,
    emoji: '🥕',
    image: null,
    servings: 8,
    prep_time: 20,
    cook_time: 40,
    source_url: null,
    author: 'Chef Digital',
    tips: 'Deixe esfriar antes de cobrir.',
    categorias: { id: 3, key: 'doces', label: 'Doces & Sobremesas' },
    receita_tags: [
      { tags: { key: 'almoco-de-domingo', label: 'Almoço de Domingo' } }
    ],
    ingredientes: [
      { name: 'cenoura', qty: 3, unit: 'unidade(s)', group_name: 'Massa', ordem: 0 },
      { name: 'chocolate', qty: 200, unit: 'g', group_name: 'Cobertura', ordem: 1 }
    ],
    passos: [
      { step_text: 'Bata as cenouras com ovos e óleo.', ordem: 0 },
      { step_text: 'Asse por 40 minutos.', ordem: 1 }
    ]
  },
  {
    id: 4,
    title: 'Salada Caesar Clássica',
    category_id: 4,
    emoji: '🥗',
    image: null,
    servings: 2,
    prep_time: 15,
    cook_time: 0,
    source_url: null,
    author: 'Chef',
    tips: 'Sirva fresca.',
    categorias: { id: 4, key: 'saladas', label: 'Saladas' },
    receita_tags: [
      { tags: { key: 'fit', label: 'Fit' } }
    ],
    ingredientes: [
      { name: 'alface romana', qty: 1, unit: 'unidade(s)', group_name: null, ordem: 0 },
      { name: 'molho caesar', qty: 2, unit: 'colheres de sopa', group_name: null, ordem: 1 }
    ],
    passos: [
      { step_text: 'Higienize a alface e rasgue as folhas.', ordem: 0 },
      { step_text: 'Tempere com o molho caesar.', ordem: 1 }
    ]
  }
];

export function createSupabaseHandlers({
  recipes = mockRecipes,
  categories = mockCategories,
  tags = mockTags,
  onSaveRpc,
  onDeleteRpc,
  aiParsedResponse
} = {}) {
  return [
    // Categorias
    http.get('*/rest/v1/categorias*', () => {
      return HttpResponse.json(categories);
    }),

    // Tags
    http.get('*/rest/v1/tags*', ({ request }) => {
      const url = new URL(request.url);
      const select = url.searchParams.get('select') || '';
      if (select === 'label') {
        return HttpResponse.json(tags.map((t) => ({ label: t.label })));
      }
      return HttpResponse.json(tags);
    }),

    // Receitas (listagem e detalhes)
    http.get('*/rest/v1/receitas*', ({ request }) => {
      const url = new URL(request.url);
      const idParam = url.searchParams.get('id');
      const isSingle = request.headers.get('accept')?.includes('vnd.pgrst.object+json');

      if (idParam && idParam.startsWith('eq.')) {
        const id = parseInt(idParam.replace('eq.', ''), 10);
        const recipe = recipes.find((r) => r.id === id);
        if (!recipe) {
          return HttpResponse.json({ message: 'Recipe not found' }, { status: 404 });
        }
        return HttpResponse.json(isSingle ? recipe : [recipe]);
      }

      return HttpResponse.json(recipes);
    }),

    // Ingredientes (usado no Admin fetchRecipeDetails)
    http.get('*/rest/v1/ingredientes*', ({ request }) => {
      const url = new URL(request.url);
      const recIdParam = url.searchParams.get('receita_id');
      if (recIdParam && recIdParam.startsWith('eq.')) {
        const recId = parseInt(recIdParam.replace('eq.', ''), 10);
        const recipe = recipes.find((r) => r.id === recId);
        const ings = (recipe?.ingredientes || []).map((ing, idx) => ({
          id: idx + 1,
          receita_id: recId,
          name: ing.name,
          qty: ing.qty,
          unit: ing.unit,
          group_name: ing.group_name || null,
          ordem: ing.ordem ?? idx
        }));
        return HttpResponse.json(ings);
      }
      return HttpResponse.json([]);
    }),

    // Passos (usado no Admin fetchRecipeDetails)
    http.get('*/rest/v1/passos*', ({ request }) => {
      const url = new URL(request.url);
      const recIdParam = url.searchParams.get('receita_id');
      if (recIdParam && recIdParam.startsWith('eq.')) {
        const recId = parseInt(recIdParam.replace('eq.', ''), 10);
        const recipe = recipes.find((r) => r.id === recId);
        const steps = (recipe?.passos || []).map((step, idx) => ({
          id: idx + 1,
          receita_id: recId,
          step_text: typeof step === 'string' ? step : step.step_text,
          ordem: step.ordem ?? idx
        }));
        return HttpResponse.json(steps);
      }
      return HttpResponse.json([]);
    }),

    // Receita Tags (usado no Admin fetchRecipeDetails)
    http.get('*/rest/v1/receita_tags*', ({ request }) => {
      const url = new URL(request.url);
      const recIdParam = url.searchParams.get('receita_id');
      if (recIdParam && recIdParam.startsWith('eq.')) {
        const recId = parseInt(recIdParam.replace('eq.', ''), 10);
        const recipe = recipes.find((r) => r.id === recId);
        return HttpResponse.json(recipe?.receita_tags || []);
      }
      return HttpResponse.json([]);
    }),

    // RPC: salvar_receita
    http.post('*/rest/v1/rpc/salvar_receita', async ({ request }) => {
      const payload = await request.json();
      if (onSaveRpc) {
        onSaveRpc(payload);
      }
      const returnedId = payload.p_id || 99;
      return HttpResponse.json(returnedId, { status: 200 });
    }),

    // RPC: excluir_receita
    http.post('*/rest/v1/rpc/excluir_receita', async ({ request }) => {
      const payload = await request.json();
      if (onDeleteRpc) {
        onDeleteRpc(payload);
      }
      return HttpResponse.json(null, { status: 200 });
    }),

    // Edge Function: parse-recipe
    http.post('*/functions/v1/parse-recipe', async ({ request }) => {
      const body = await request.json();
      if (aiParsedResponse) {
        const responseData = typeof aiParsedResponse === 'function' ? aiParsedResponse(body) : aiParsedResponse;
        return HttpResponse.json(responseData);
      }
      return HttpResponse.json({
        ok: true,
        recipe: {
          title: 'Frango com Legumes Assados',
          category: 'carnes',
          tags: ['Fit', 'Almoço de Domingo'],
          emoji: '🍗',
          image: null,
          ingredients: [
            { name: 'peito de frango', qty: 500, unit: 'g', group_name: 'Principal' },
            { name: 'cenoura', qty: 2, unit: 'unidade(s)', group_name: 'Legumes' }
          ],
          steps: [
            'Corte o frango em cubos e tempere com sal e pimenta.',
            'Asse por 30 minutos a 200°C.'
          ],
          servings: 4,
          prep_time: 15,
          cook_time: 30,
          source_url: null,
          author: 'Chef',
          tips: 'Adicione alecrim.'
        }
      });
    }),

    // Storage: Upload & Delete
    http.post('*/storage/v1/object/recipe-images/*', () => {
      return HttpResponse.json({ Key: 'recipe-images/mock_img.webp', path: 'mock_img.webp' });
    }),
    http.delete('*/storage/v1/object/recipe-images/*', () => {
      return HttpResponse.json([{ name: 'mock_img.webp' }]);
    })
  ];
}

export const handlers = createSupabaseHandlers();

import { supabase } from './supabase.js';

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function fetchRecipesList() {
  const { data, error } = await supabase
    .from('receitas')
    .select('id, title, emoji')
    .order('title');
  if (error) throw error;
  return data || [];
}

export async function fetchRecipeDetails(id) {
  const [recipeRes, ingredientsRes, stepsRes, tagsRes] = await Promise.all([
    supabase.from('receitas').select('*, categorias(id, key, label)').eq('id', id).single(),
    supabase.from('ingredientes').select('*').eq('receita_id', id).order('ordem'),
    supabase.from('passos').select('*').eq('receita_id', id).order('ordem'),
    supabase.from('receita_tags').select('tags(label)').eq('receita_id', id)
  ]);

  if (recipeRes.error) throw recipeRes.error;
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (stepsRes.error) throw stepsRes.error;
  if (tagsRes.error) throw tagsRes.error;

  return {
    recipe: recipeRes.data,
    ingredients: ingredientsRes.data || [],
    steps: stepsRes.data || [],
    tags: (tagsRes.data || []).map((t) => t.tags?.label).filter(Boolean)
  };
}

export async function fetchExistingTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('label')
    .order('label');
  if (error) throw error;
  return (data || []).map((t) => t.label);
}

export async function deleteRecipeRpc(id) {
  const { error } = await supabase.rpc('excluir_receita', { p_id: id });
  if (error) throw error;
}

export async function saveRecipeRpc(payload) {
  const { error } = await supabase.rpc('salvar_receita', payload);
  if (error) throw error;
}

export async function parseRecipeAiFunction(payload) {
  const body = typeof payload === 'string' ? { text: payload } : payload;
  const { data, error } = await supabase.functions.invoke('parse-recipe', {
    body
  });
  if (error) throw error;
  return data;
}

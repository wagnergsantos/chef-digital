import { supabase } from './supabase.js';
import { compressImageFile } from '../logic/image-compression.js';
import { buildRecipePayload } from '../logic/admin-parser.js';

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
    .select('id, title, emoji, image, category_id, prep_time, cook_time, servings, receita_tags(tags(label))')
    .order('title');
  if (error) throw error;
  return (data || []).map((r) => ({
    ...r,
    categoria_id: r.category_id,
    tags: (r.receita_tags || []).map((t) => t.tags?.label).filter(Boolean)
  }));
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

export async function fetchFullRecipesByIds(ids) {
  if (!ids || ids.length === 0) return [];

  const [recipesRes, ingredientsRes, stepsRes, tagsRes] = await Promise.all([
    supabase.from('receitas').select('*, categorias(id, key, label)').in('id', ids).order('title'),
    supabase.from('ingredientes').select('*').in('receita_id', ids).order('ordem'),
    supabase.from('passos').select('*').in('receita_id', ids).order('ordem'),
    supabase.from('receita_tags').select('receita_id, tags(label)').in('receita_id', ids)
  ]);

  if (recipesRes.error) throw recipesRes.error;
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (stepsRes.error) throw stepsRes.error;
  if (tagsRes.error) throw tagsRes.error;

  const ingMap = new Map();
  for (const ing of (ingredientsRes.data || [])) {
    if (!ingMap.has(ing.receita_id)) ingMap.set(ing.receita_id, []);
    ingMap.get(ing.receita_id).push(ing);
  }

  const stepsMap = new Map();
  for (const st of (stepsRes.data || [])) {
    if (!stepsMap.has(st.receita_id)) stepsMap.set(st.receita_id, []);
    stepsMap.get(st.receita_id).push(st);
  }

  const tagsMap = new Map();
  for (const rt of (tagsRes.data || [])) {
    if (!tagsMap.has(rt.receita_id)) tagsMap.set(rt.receita_id, []);
    if (rt.tags?.label) tagsMap.get(rt.receita_id).push(rt.tags.label);
  }

  return (recipesRes.data || []).map((r) => ({
    ...r,
    categoria_id: r.category_id || r.categoria_id,
    ingredients: ingMap.get(r.id) || [],
    steps: stepsMap.get(r.id) || [],
    tags: tagsMap.get(r.id) || []
  }));
}

export async function applyRecipeAuditPatches(patches = [], onProgress = null) {
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i];
    try {
      if (onProgress) {
        onProgress({ current: i + 1, total: patches.length, title: patch.title || `Receita #${patch.id}` });
      }

      const details = await fetchRecipeDetails(patch.id);
      const r = details.recipe;

      const mergedTags = patch.tags && patch.tags.length > 0
        ? Array.from(new Set([...details.tags, ...patch.tags]))
        : details.tags;

      const payload = buildRecipePayload({
        id: patch.id,
        title: r.title,
        emoji: r.emoji || '🍲',
        image: r.image,
        tips: r.tips,
        servings: patch.servings !== null && patch.servings !== undefined ? patch.servings : r.servings,
        prep_time: patch.prep_time !== null && patch.prep_time !== undefined ? patch.prep_time : r.prep_time,
        cook_time: patch.cook_time !== null && patch.cook_time !== undefined ? patch.cook_time : r.cook_time,
        source_url: r.source_url,
        author: r.author,
        selectedCategoryId: r.category_id || r.categoria_id || r.categorias?.id,
        selectedCategoryKey: r.categorias?.key || '',
        tags: mergedTags,
        validIngredients: details.ingredients.map((ing, idx) => ({
          name: ing.name,
          qty: ing.qty,
          unit: ing.unit,
          group_name: ing.group_name || null,
          ordem: ing.ordem ?? idx
        })),
        validSteps: details.steps.map((st, idx) => ({
          step_text: st.step_text,
          ordem: st.ordem ?? idx
        }))
      });

      await saveRecipeRpc(payload);
      results.success++;
    } catch (err) {
      console.error(`Erro ao aplicar patch na receita ${patch.id}:`, err);
      results.failed++;
      results.errors.push({ id: patch.id, title: patch.title, error: err.message });
    }
  }

  return results;
}

export async function parseRecipeAiFunction(payload) {
  const body = typeof payload === 'string' ? { text: payload } : payload;
  const { data, error } = await supabase.functions.invoke('parse-recipe', {
    body
  });
  if (error) {
    // FunctionsHttpError descarta o body real — tentar extrair a mensagem verdadeira
    let detail = error.message;
    try {
      if (error.context && typeof error.context.json === 'function') {
        const errJson = await error.context.json();
        detail = errJson?.error || errJson?.message || detail;
      } else if (error.context && typeof error.context.text === 'function') {
        const raw = await error.context.text();
        try {
          const parsed = JSON.parse(raw);
          detail = parsed?.error || parsed?.message || raw;
        } catch {
          detail = raw || detail;
        }
      }
    } catch {
      // mantém detail original
    }
    throw new Error(detail);
  }
  return data;
}

/**
 * Envia uma imagem para o bucket `recipe-images` no Supabase Storage.
 * Realiza compressão WebP client-side antes do upload.
 * @param {File|Blob} file
 * @returns {Promise<string>} URL pública da imagem
 */
export async function uploadRecipeImage(file) {
  const compressedBlob = await compressImageFile(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    type: 'image/webp'
  });

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const fileName = `recipe_${timestamp}_${randomSuffix}.webp`;

  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(fileName, compressedBlob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false
    });

  if (error) {
    throw new Error(`Falha no upload para o Storage: ${error.message || error.error_description || 'Erro desconhecido'}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(data.path);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública da imagem enviada.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Extrai o caminho do arquivo no bucket `recipe-images` a partir de sua URL pública.
 * Retorna null se não for uma imagem do bucket `recipe-images`.
 * @param {string} url
 * @returns {string|null}
 */
export function getStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/recipe-images\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Remove uma imagem do Supabase Storage no bucket `recipe-images`.
 * Ignora silenciosamente se a URL não for do Supabase Storage.
 * @param {string} urlOrPath
 * @returns {Promise<void>}
 */
export async function deleteRecipeImageFromStorage(urlOrPath) {
  const path = getStoragePathFromUrl(urlOrPath) || (urlOrPath.startsWith('recipe_') ? urlOrPath : null);
  if (!path) return;

  const { error } = await supabase.storage
    .from('recipe-images')
    .remove([path]);

  if (error) {
    console.warn(`Aviso: Falha ao deletar imagem anterior (${path}) do Storage:`, error.message);
  }
}



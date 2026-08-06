import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});
const LEGACY_TAG_CATEGORY_KEYS = new Set(['almoco', 'janta', 'refogados', 'marmitas', 'lancheira']);
const LEGACY_CATEGORY_MAP = new Map([
  ['bife', 'carnes'],
  ['carne', 'carnes'],
  ['peixe', 'peixes'],
  ['macarrao', 'massas'],
  ['massa', 'massas'],
  ['arroz', 'acompanhamento'],
  ['batatas', 'acompanhamento'],
  ['legumes', 'acompanhamento'],
  ['feijao', 'acompanhamento'],
  ['lancheira', 'lanches']
]);

function normalizeCategory(category) {
  if (category === 'todos' || LEGACY_TAG_CATEGORY_KEYS.has(category)) {
    return 'lanches';
  }
  return LEGACY_CATEGORY_MAP.get(category) || category;
}

async function migrate() {
  console.log('Iniciando migração...');
  
  const receitasJsPath = path.resolve('receitas.js');
  const tempJsPath = path.resolve('scripts/temp_receitas.js');
  
  const jsContent = fs.readFileSync(receitasJsPath, 'utf8');
  fs.writeFileSync(tempJsPath, jsContent + '\nexport { receitasData };');
  
  const { receitasData } = await import('./temp_receitas.js');
  fs.unlinkSync(tempJsPath);
  
  const categories = receitasData.categories;
  const recipes = receitasData.recipes;

  // 1. Migrar Categorias
  let sortOrder = 0;
  for (const [key, label] of Object.entries(categories)) {
    const { error } = await supabase.from('categorias').upsert({
      key, label, sort_order: sortOrder++
    }, { onConflict: 'key' });
    if (error) console.error(`Erro na categoria ${key}:`, error);
  }
  const { data: categoryRows, error: categoryRowsError } = await supabase
    .from('categorias')
    .select('id,key');
  if (categoryRowsError) {
    console.error('Erro ao carregar IDs das categorias:', categoryRowsError);
  }
  const categoryIdByKey = Object.fromEntries((categoryRows || []).map(cat => [cat.key, cat.id]));
  console.log('Categorias migradas com sucesso.');

  // 2. Migrar Receitas
  for (const r of recipes) {
    console.log(`Migrando receita: ${r.title} (ID: ${r.id})...`);
    
    const { error: rError } = await supabase.from('receitas').upsert({
      id: r.id,
      title: r.title,
      emoji: r.emoji,
      image: r.image || null,
      source: r.source || null,
      tips: r.tips || null,
      category_id: categoryIdByKey[normalizeCategory(Array.isArray(r.category)
        ? (r.category.find(c => !LEGACY_TAG_CATEGORY_KEYS.has(c)) || r.category[0] || 'lanches')
        : r.category)] || null,
      category: r.category
        ? (Array.isArray(r.category)
          ? normalizeCategory(r.category.find(c => !LEGACY_TAG_CATEGORY_KEYS.has(c)) || r.category[0] || 'lanches')
          : normalizeCategory(r.category))
        : null
    }, { onConflict: 'id' });

    if (rError) {
      console.error(`Erro ao inserir receita ID ${r.id}:`, rError);
      continue;
    }

    // Limpa ingredientes antigos para manter idempotência
    await supabase.from('ingredientes').delete().eq('receita_id', r.id);
    if (r.ingredients && r.ingredients.length > 0) {
      const ingredientsData = r.ingredients.map((ing, idx) => ({
        receita_id: r.id,
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit,
        ordem: idx
      }));
      const { error: ingError } = await supabase.from('ingredientes').insert(ingredientsData);
      if (ingError) console.error(`Erro ingredientes da receita ${r.id}:`, ingError);
    }

    // Limpa passos antigos
    await supabase.from('passos').delete().eq('receita_id', r.id);
    if (r.steps && r.steps.length > 0) {
      const stepsData = r.steps.map((step, idx) => ({
        receita_id: r.id,
        step_text: step,
        ordem: idx
      }));
      const { error: stepError } = await supabase.from('passos').insert(stepsData);
      if (stepError) console.error(`Erro passos da receita ${r.id}:`, stepError);
    }
  }

  // Ajusta a sequence das receitas
  const { error: seqError } = await supabase.rpc('setval', {
    seq: 'receitas_id_seq',
    val: Math.max(...recipes.map(r => r.id))
  });
  if (seqError) {
    console.warn('Aviso: Não foi possível atualizar a sequence pelo RPC (certifique-se de que a função setval(seq, val) foi criada no Supabase). Detalhe:', seqError.message);
    console.info('Você pode atualizar manualmente executando este SQL no Supabase: SELECT setval(\'receitas_id_seq\', (SELECT MAX(id) FROM receitas));');
  }

  console.log('Migração concluída com sucesso!');
}

migrate()
  .catch(console.error)
  .finally(() => process.exit(0));

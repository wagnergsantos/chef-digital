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

async function migrate() {
  console.log('Iniciando migração...');
  
  // Importa dados do receitas.js atual removendo a declaração Javascript para obter JSON puro
  const receitasJsPath = path.resolve('receitas.js');
  let content = fs.readFileSync(receitasJsPath, 'utf8');
  const startIdx = content.indexOf('const receitasData =');
  const startBrace = content.indexOf('{', startIdx);
  const endBrace = content.lastIndexOf('}');
  const jsonStr = content.slice(startBrace, endBrace + 1);
  
  const data = JSON.parse(jsonStr);
  const categories = data.categories;
  const recipes = data.recipes;

  // 1. Migrar Categorias
  let sortOrder = 0;
  for (const [key, label] of Object.entries(categories)) {
    const { error } = await supabase.from('categorias').upsert({
      key, label, sort_order: sortOrder++
    }, { onConflict: 'key' });
    if (error) console.error(`Erro na categoria ${key}:`, error);
  }
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
      category: Array.isArray(r.category) ? r.category : [r.category]
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
  await supabase.rpc('setval', {
    seq: 'receitas_id_seq',
    val: Math.max(...recipes.map(r => r.id))
  });

  console.log('Migração concluída com sucesso!');
}

migrate();

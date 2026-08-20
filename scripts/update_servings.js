import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as chaves do ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.");
  console.error("Execute o comando exportando as variáveis antes.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function updateServings() {
  console.log('Iniciando atualização do campo servings...');

  // 1. Importa os dados do arquivo receitas.js de forma robusta
  const receitasJsPath = path.resolve(__dirname, 'legacy/receitas.js');
  const tempJsPath = path.resolve(__dirname, 'temp_receitas_update.js');

  const jsContent = fs.readFileSync(receitasJsPath, 'utf8');
  fs.writeFileSync(tempJsPath, jsContent + '\nexport { receitasData };');

  const { receitasData } = await import('./temp_receitas_update.js');
  fs.unlinkSync(tempJsPath);

  const recipes = receitasData.recipes;
  console.log(`Lidas ${recipes.length} receitas do arquivo.`);

  let updatedCount = 0;
  let skippedCount = 0;

  // 2. Itera sobre cada receita e faz um UPDATE direto apenas na coluna servings
  for (const r of recipes) {
    if (r.servings !== undefined && r.servings !== null && r.servings !== "") {
      const { error } = await supabase
        .from('receitas')
        .update({ servings: String(r.servings) })
        .eq('id', r.id);

      if (error) {
        console.error(`❌ Erro ao atualizar receita ID ${r.id}:`, error.message);
      } else {
        updatedCount++;
        process.stdout.write(`\r✅ Atualizadas: ${updatedCount}`);
      }
    } else {
      skippedCount++;
    }
  }

  console.log(`\n\n🎉 Concluído!`);
  console.log(`- ${updatedCount} receitas tiveram o rendimento atualizado.`);
  console.log(`- ${skippedCount} receitas ignoradas (não possuíam rendimento no arquivo js).`);
}

updateServings()
  .catch(console.error)
  .finally(() => process.exit(0));

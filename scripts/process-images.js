import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('❌ Configuração do Supabase ausente no arquivo .env!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic'
};

async function processDirectory() {
  const args = process.argv.slice(2);
  const inputDirArg = args.find(a => !a.startsWith('--'));
  const outDirIndex = args.indexOf('--out');
  const outDir = outDirIndex !== -1 ? args[outDirIndex + 1] : './recipes-output';
  const importDb = args.includes('--import-db');

  if (!inputDirArg) {
    console.log(`
🖼️  Chef Digital - Processador de Imagens de Receitas em Lote

Uso:
  node scripts/process-images.js <diretorio-de-imagens> [opcoes]

Opções:
  --out <pasta>      Diretório para salvar os arquivos JSON (Padrão: ./recipes-output)
  --import-db        Salvar cada receita processada diretamente no banco de dados Supabase

Exemplo:
  node scripts/process-images.js ./minhas-imagens --out ./jsons --import-db
`);
    process.exit(0);
  }

  const inputDir = path.resolve(inputDirArg);
  const outputDir = path.resolve(outDir);

  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Diretório de entrada não encontrado: ${inputDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return MIME_TYPES[ext];
  });

  if (imageFiles.length === 0) {
    console.log(`⚠️ Nenhuma imagem (.jpg, .jpeg, .png, .webp) encontrada em ${inputDir}`);
    process.exit(0);
  }

  console.log(`\n🚀 Iniciando processamento de ${imageFiles.length} imagens...`);
  console.log(`📂 Entrada: ${inputDir}`);
  console.log(`💾 Saída JSON: ${outputDir}`);
  if (importDb) {
    console.log(`🗄️  Modo de importação direta no Supabase ativado!`);
  }
  console.log('--------------------------------------------------\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const fileName = imageFiles[i];
    const filePath = path.join(inputDir, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const mimeType = MIME_TYPES[ext];
    const baseName = path.basename(fileName, ext);

    console.log(`[${i + 1}/${imageFiles.length}] 📷 Processando: ${fileName}...`);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      const { data, error } = await supabase.functions.invoke('parse-recipe', {
        body: {
          image: {
            data: base64Data,
            mimeType
          }
        }
      });

      if (error || !data || !data.ok) {
        const errMsg = error?.message || data?.error || 'Erro desconhecido ao invocar Edge Function';
        console.error(`   ❌ Falha ao processar ${fileName}: ${errMsg}`);
        failCount++;
        continue;
      }

      const recipe = data.recipe;
      const jsonFileName = `${baseName}.json`;
      const jsonFilePath = path.join(outputDir, jsonFileName);

      fs.writeFileSync(jsonFilePath, JSON.stringify(recipe, null, 2), 'utf-8');
      console.log(`   ✅ JSON salvo: ${jsonFileName} (${recipe.title || 'Sem título'})`);

      if (importDb) {
        try {
          // buscar categoria key id se houver
          let categoryId = null;
          if (recipe.category) {
            const { data: catData } = await supabase
              .from('categorias')
              .select('id')
              .eq('key', recipe.category)
              .maybeSingle();
            if (catData) categoryId = catData.id;
          }

          const payload = {
            p_id: null,
            p_title: recipe.title,
            p_categoria_id: categoryId,
            p_emoji: recipe.emoji || '🍳',
            p_servings: recipe.servings || null,
            p_prep_time: recipe.prep_time || null,
            p_cook_time: recipe.cook_time || null,
            p_tips: recipe.tips || null,
            p_source_url: recipe.source_url || null,
            p_author: recipe.author || null,
            p_image: recipe.image || null,
            p_ingredients: recipe.ingredients || [],
            p_steps: recipe.steps || [],
            p_tags: recipe.tags || []
          };

          const { error: rpcErr } = await supabase.rpc('salvar_receita', payload);
          if (rpcErr) {
            console.error(`   ⚠️  Salvo JSON, mas falhou ao inserir no banco: ${rpcErr.message}`);
          } else {
            console.log(`   🗄️  Receita "${recipe.title}" salva com sucesso no Supabase!`);
          }
        } catch (dbErr) {
          console.error(`   ⚠️  Erro no DB: ${dbErr.message}`);
        }
      }

      successCount++;
    } catch (err) {
      console.error(`   ❌ Erro inesperado em ${fileName}: ${err.message}`);
      failCount++;
    }

    // Pequeno delay entre requisições para evitar rate limit
    if (i < imageFiles.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`🎉 Processamento finalizado!`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas:   ${failCount}`);
}

processDirectory();

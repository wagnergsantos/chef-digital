import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Carrega .env manualmente se existir
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY) são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const PUBLIC_DIR = path.resolve('public');
const BUCKET_NAME = 'recipe-images';

// Argumentos de linha de comando
const isDryRun = process.argv.includes('--dry-run');
const forceUpload = process.argv.includes('--force');
const limitArgIndex = process.argv.indexOf('--limit');
const limit = limitArgIndex !== -1 ? parseInt(process.argv[limitArgIndex + 1], 10) : null;

async function ensureBucketExists() {
  console.log(`🔍 Verificando bucket '${BUCKET_NAME}' no Supabase Storage...`);
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.warn('⚠️ Não foi possível listar buckets:', error.message);
    return;
  }

  const exists = buckets.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    if (isDryRun) {
      console.log(`[DRY-RUN] Criaria bucket '${BUCKET_NAME}' (público).`);
      return;
    }
    console.log(`📦 Criando bucket público '${BUCKET_NAME}'...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) {
      console.error(`❌ Erro ao criar bucket '${BUCKET_NAME}':`, createError.message);
    } else {
      console.log(`✅ Bucket '${BUCKET_NAME}' criado com sucesso.`);
    }
  } else {
    console.log(`✅ Bucket '${BUCKET_NAME}' pronto.`);
  }
}

async function migrateImages() {
  console.log(`🚀 Iniciando migração de imagens para o Supabase Storage${isDryRun ? ' [MODO DRY-RUN]' : ''}...`);

  await ensureBucketExists();

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`❌ Diretório ${PUBLIC_DIR} não encontrado.`);
    return;
  }

  const allFiles = fs.readdirSync(PUBLIC_DIR);
  let pngFiles = allFiles.filter((file) => /^\d+\.png$/i.test(file));

  if (pngFiles.length === 0) {
    pngFiles = allFiles.filter((file) => file.endsWith('.png') && file !== 'icon.png');
  }

  // Ordena numericamente
  pngFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  if (limit && !isNaN(limit) && limit > 0) {
    console.log(`⏳ Limitando execução a ${limit} imagens.`);
    pngFiles = pngFiles.slice(0, limit);
  }

  console.log(`📸 Encontradas ${pngFiles.length} imagens para migrar.`);

  // 1. Busca receitas atuais no banco para validar quais apontam para PNGs locais
  const { data: recipes, error: recError } = await supabase
    .from('receitas')
    .select('id, title, image');

  if (recError) {
    console.error('❌ Erro ao buscar receitas no Supabase:', recError.message);
    return;
  }

  console.log(`📋 Total de receitas no banco: ${recipes?.length || 0}`);

  let successCount = 0;
  let errorCount = 0;

  for (const fileName of pngFiles) {
    const filePath = path.join(PUBLIC_DIR, fileName);
    const id = path.parse(fileName).name;
    const targetStorageName = `recipe_${id}.webp`;

    try {
      console.log(`\n➡️ Processando [${fileName}] -> [${targetStorageName}]...`);

      // Verifica receitas associadas a este nome de arquivo
      const matchingRecipes = (recipes || []).filter(
        (r) => r.image === fileName || r.image === `/${fileName}` || r.image === `/chef-digital/${fileName}`
      );

      if (matchingRecipes.length === 0) {
        console.log(`   ℹ️ Nenhuma receita no banco referenciando exatamente '${fileName}' (pode já estar migrada ou ID direto).`);
      } else {
        console.log(`   🔗 Receita correspondente: ID ${matchingRecipes[0].id} ("${matchingRecipes[0].title}")`);
      }

      if (isDryRun) {
        console.log(`   [DRY-RUN] Otimizaria ${fileName} para WebP e enviaria como ${targetStorageName}`);
        console.log(`   [DRY-RUN] Atualizaria receitas WHERE image LIKE '%${fileName}' com URL pública do Storage`);
        successCount++;
        continue;
      }

      // Otimização e conversão para WebP com sharp
      const webpBuffer = await sharp(filePath)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(targetStorageName, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: forceUpload
        });

      if (uploadError) {
        if (uploadError.message?.includes('already exists') || uploadError.error === 'Duplicate') {
          console.log(`   ⚠️ Imagem ${targetStorageName} já existe no Storage. Usando existente.`);
        } else {
          throw new Error(`Falha no upload: ${uploadError.message}`);
        }
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(targetStorageName);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Falha ao gerar URL pública do Storage.');
      }

      console.log(`   🌐 URL Pública: ${publicUrl}`);

      // Atualizar receitas no banco que apontam para o nome antigo ou que sejam do mesmo ID
      const { error: updateError } = await supabase
        .from('receitas')
        .update({ image: publicUrl })
        .or(`image.eq.${fileName},image.eq./${fileName},image.eq./chef-digital/${fileName},id.eq.${id}`);

      if (updateError) {
        console.warn(`   ⚠️ Erro ao atualizar receita no banco: ${updateError.message}`);
      } else {
        console.log(`   ✅ Banco atualizado para receita (ou match por filename '${fileName}').`);
      }

      successCount++;
    } catch (err) {
      console.error(`   ❌ Erro ao processar ${fileName}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`🏁 Resumo da Migração:`);
  console.log(`   Sucessos: ${successCount}`);
  console.log(`   Falhas:    ${errorCount}`);
  console.log(`========================================\n`);
}

migrateImages()
  .catch((err) => {
    console.error('❌ Erro fatal na migração:', err);
    process.exit(1);
  });

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const CACHE_FILE = path.resolve('scripts/.optimized-cache.json');
const TARGET_DIR = path.resolve('public');
const MAX_DIMENSION = 800;
const QUALITY = 80;

function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function optimizeImages() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  const cache = force ? {} : loadCache();
  const files = fs.readdirSync(TARGET_DIR);
  const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));

  console.log(`\n🔍 Verificando ${pngFiles.length} imagens em ${TARGET_DIR}...`);
  if (force) console.log('⚡ Modo --force ativado (ignorando cache)');
  if (dryRun) console.log('🧪 Modo --dry-run ativado (sem gravação em disco)');

  let processedCount = 0;
  let skippedCount = 0;
  let initialTotalBytes = 0;
  let finalTotalBytes = 0;

  for (const fileName of pngFiles) {
    const filePath = path.join(TARGET_DIR, fileName);
    const originalBuffer = fs.readFileSync(filePath);
    const originalSize = originalBuffer.length;
    initialTotalBytes += originalSize;

    const currentHash = computeHash(originalBuffer);

    if (!force && cache[fileName] && cache[fileName].hash === currentHash) {
      skippedCount++;
      finalTotalBytes += originalSize;
      continue;
    }

    try {
      const image = sharp(originalBuffer);
      const metadata = await image.metadata();

      let pipeline = sharp(originalBuffer);

      if ((metadata.width && metadata.width > MAX_DIMENSION) || (metadata.height && metadata.height > MAX_DIMENSION)) {
        pipeline = pipeline.resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      pipeline = pipeline.png({
        palette: true,
        quality: QUALITY,
        compressionLevel: 9,
        effort: 7
      });

      const optimizedBuffer = await pipeline.toBuffer();
      const newSize = optimizedBuffer.length;

      // Se o otimizado ficou menor, aplica; senão mantém o original
      const finalBuffer = newSize < originalSize ? optimizedBuffer : originalBuffer;
      const appliedSize = finalBuffer.length;
      finalTotalBytes += appliedSize;

      if (!dryRun) {
        if (newSize < originalSize) {
          fs.writeFileSync(filePath, finalBuffer);
        }
        const finalHash = computeHash(finalBuffer);
        cache[fileName] = {
          hash: finalHash,
          originalSize,
          optimizedSize: appliedSize,
          savedBytes: originalSize - appliedSize,
          dimensions: {
            width: metadata.width,
            height: metadata.height
          },
          updatedAt: new Date().toISOString()
        };
      }

      const diff = originalSize - appliedSize;
      const pct = originalSize > 0 ? ((diff / originalSize) * 100).toFixed(1) : 0;

      console.log(`  ✓ ${fileName.padEnd(14)} ${formatBytes(originalSize).padStart(9)} → ${formatBytes(appliedSize).padStart(9)} (-${pct}%)`);
      processedCount++;
    } catch (err) {
      console.error(`  ✗ Erro em ${fileName}: ${err.message}`);
      finalTotalBytes += originalSize;
    }
  }

  if (!dryRun) {
    saveCache(cache);
  }

  const totalSaved = initialTotalBytes - finalTotalBytes;
  const totalSavedPct = initialTotalBytes > 0 ? ((totalSaved / initialTotalBytes) * 100).toFixed(1) : 0;

  console.log('\n----------------------------------------');
  console.log(`📊 Resultado:`);
  console.log(`   Processadas : ${processedCount}`);
  console.log(`   Ignoradas   : ${skippedCount} (já otimizadas)`);
  console.log(`   Tamanho ant.: ${formatBytes(initialTotalBytes)}`);
  console.log(`   Tamanho pós : ${formatBytes(finalTotalBytes)}`);
  console.log(`   Economia    : ${formatBytes(totalSaved)} (-${totalSavedPct}%)`);
  console.log('----------------------------------------\n');
}

optimizeImages();

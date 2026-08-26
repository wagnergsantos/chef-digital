const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
];

/**
 * Valida se o arquivo selecionado é uma imagem suportada e abaixo do limite de tamanho.
 * @param {File|Blob} file
 * @param {number} [maxSizeBytes=10485760]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file, maxSizeBytes = MAX_IMAGE_FILE_SIZE_BYTES) {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo fornecido.' };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato inválido. Envie uma imagem JPEG, PNG, WebP ou AVIF.'
    };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Imagem muito pesada (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limite máximo: ${maxMb}MB.`
    };
  }

  return { valid: true };
}

/**
 * Calcula dimensões proporcionais respeitando largura e altura máximas.
 * @param {number} srcWidth
 * @param {number} srcHeight
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{ width: number, height: number }}
 */
export function calculateTargetDimensions(srcWidth, srcHeight, maxWidth = 800, maxHeight = 800) {
  if (srcWidth <= 0 || srcHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  let width = srcWidth;
  let height = srcHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width: Math.max(1, width), height: Math.max(1, height) };
}

/**
 * Comprime um arquivo de imagem no navegador usando Canvas e exportando para WebP.
 * @param {File|Blob} file
 * @param {Object} [options]
 * @param {number} [options.maxWidth=800]
 * @param {number} [options.maxHeight=800]
 * @param {number} [options.quality=0.8]
 * @param {string} [options.type='image/webp']
 * @returns {Promise<Blob>}
 */
export async function compressImageFile(file, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    type = 'image/webp'
  } = options;

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width, height } = calculateTargetDimensions(
        img.naturalWidth || img.width,
        img.naturalHeight || img.height,
        maxWidth,
        maxHeight
      );

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível inicializar o contexto 2D do Canvas.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao exportar imagem compactada.'));
            return;
          }
          resolve(blob);
        },
        type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar a imagem no navegador para compressão.'));
    };

    img.src = objectUrl;
  });
}

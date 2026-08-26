/**
 * Categorias oficiais e constantes compartilhadas entre o ecossistema Chef Digital.
 */
export const OFFICIAL_CATEGORY_KEYS = [
  'carnes',
  'aves',
  'peixes',
  'massas',
  'lanches',
  'doces',
  'sopas',
  'acompanhamento',
  'temperos',
  'bebidas',
  'outros'
];

export const LEGACY_CATEGORY_MAP = {
  bife: 'carnes',
  carne: 'carnes',
  peixe: 'peixes',
  macarrao: 'massas',
  massa: 'massas',
  arroz: 'acompanhamento',
  batatas: 'acompanhamento',
  legumes: 'acompanhamento',
  feijao: 'acompanhamento',
  lancheira: 'lanches',
  sobremesas: 'doces',
  sobremesa: 'doces'
};

export const LEGACY_TAG_CATEGORY_KEYS = new Set([
  'almoco',
  'janta',
  'refogados',
  'marmitas',
  'lancheira'
]);

/**
 * Normaliza qualquer chave de categoria legada para a chave oficial padronizada.
 * @param {string} category
 * @returns {string}
 */
export function normalizeCategoryKey(category) {
  if (!category || typeof category !== 'string') return 'outros';
  const clean = category.trim().toLowerCase();
  if (clean === 'todos' || LEGACY_TAG_CATEGORY_KEYS.has(clean)) {
    return 'lanches';
  }
  return LEGACY_CATEGORY_MAP[clean] || (OFFICIAL_CATEGORY_KEYS.includes(clean) ? clean : 'outros');
}

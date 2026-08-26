/**
 * Normalizador de unidades de medida para ingredientes culinários.
 */

const UNIT_MAP = {
    // Volume / Colheres
    'colher de sopa': 'c. sopa',
    'colheres de sopa': 'c. sopa',
    'c. de sopa': 'c. sopa',
    'cs': 'c. sopa',
    'colher de chá': 'c. chá',
    'colheres de chá': 'c. chá',
    'c. de chá': 'c. chá',
    'colher de café': 'c. café',
    'colheres de café': 'c. café',
    'colher de sobremesa': 'c. sobremesa',
    'colheres de sobremesa': 'c. sobremesa',
    'xícara': 'xícara',
    'xícaras': 'xícara',
    'xicara': 'xícara',
    'xicaras': 'xícara',
    'xíc': 'xícara',
    'xic': 'xícara',
    'copo': 'copo',
    'copos': 'copo',
    
    // Peso
    'grama': 'g',
    'gramas': 'g',
    'g': 'g',
    'gr': 'g',
    'quilo': 'kg',
    'quilos': 'kg',
    'kg': 'kg',
    'kgs': 'kg',
    'miligrama': 'mg',
    'miligramas': 'mg',
    'mg': 'mg',

    // Volume líquido
    'mililitro': 'ml',
    'mililitros': 'ml',
    'ml': 'ml',
    'mls': 'ml',
    'litro': 'L',
    'litros': 'L',
    'l': 'L',

    // Unidades / Peças
    'unidade': 'un',
    'unidades': 'un',
    'un': 'un',
    'und': 'un',
    'unid': 'un',
    'dente': 'dente',
    'dentes': 'dente',
    'fatia': 'fatia',
    'fatias': 'fatia',
    'lata': 'lata',
    'latas': 'lata',
    'pacote': 'pct',
    'pacotes': 'pct',
    'pct': 'pct',
    'pitada': 'pitada',
    'pitadas': 'pitada',
    'ramo': 'ramo',
    'ramos': 'ramo',
    'folha': 'folha',
    'folhas': 'folha'
};

export function normalizeUnit(rawUnit) {
    if (!rawUnit) return '';
    const cleaned = rawUnit.toString().trim().toLowerCase().replace(/\.$/, '');
    return UNIT_MAP[cleaned] || cleaned;
}

/**
 * @doc PROMPT PARA IA - GERADOR DE RECEITAS NO FORMATO JSON
 * 
 * Se você quiser transformar um texto de receita no formato JSON deste arquivo usando uma IA (como Gemini, ChatGPT, Claude),
 * copie e envie o texto abaixo antes de enviar a receita:
 * 
 * --- COPIE A PARTIR DAQUI ---
 * Converta a receita fornecida para o formato JSON estruturado seguindo rigorosamente o esquema abaixo.
 * 
 * ### REGRAS DE CATEGORIAS (MULTITAG):
 * O campo "category" suporta uma categoria única (como string) ou múltiplas categorias (como array de strings).
 * Formatos válidos:
 * - Categoria única: "category": "bife"
 * - Múltiplas categorias: "category": ["bife", "feijao", "arroz"]
 * 
 * Chaves de categorias válidas (sempre em minúsculas):
 * - "almoco" (Almoço)
 * - "janta" (Jantares)
 * - "sopas" (Sopas & Caldos)
 * - "molhos" (Molhos)
 * - "lanches" (Lanches)
 * - "marmitas" (Marmitas)
 * - "frango" (Frango)
 * - "bife" (Carnes/Bifes)
 * - "peixe" (Peixes)
 * - "macarrao" (Massas)
 * - "refogados" (Refogados)
 * - "feijao" (Feijão)
 * - "arroz" (Arroz)
 * - "batata" (Batatas)
 * - "temperos" (Temperos)
 * 
 * ### ESTRUTURA DO JSON:
 * {
 *   "id": [Número incremental único baseado no último ID do banco],
 *   "title": "[Título da receita]",
 *   "category": "[Chave única como string, ex: 'marmitas', ou array de chaves, ex: ['almoco', 'bife']]",
 *   "source": "[Fonte da receita, ex: 'Internet' ou null]",
 *   "emoji": "[Um emoji representativo, ex: 🍲]",
 *   "image": "[Opcional: Nome do arquivo de imagem, ex: '123.png' ou null]",
 *   "ingredients": [
 *     {
 *       "name": "[Nome do ingrediente, ex: 'Peito de frango em cubos']",
 *       "qty": [Apenas o número da quantidade, ex: 500 ou 1.5. Se for 'a gosto' ou 'opcional', use null],
 *       "unit": "[Unidade de medida, ex: 'g', 'ml', 'xícaras', 'unidades', 'a gosto', 'opcional', 'colher (chá)']"
 *     }
 *   ],
 *   "steps": [
 *     "[Passo 1]",
 *     "[Passo 2]"
 *   ],
 *   "tips": "[Dica curta sobre o preparo, ou null/string vazia]"
 * }
 * 
 * ### REQUISITOS CRÍTICOS:
 * - Para o campo "category", nunca use strings separadas por vírgula (ex: "bife,feijao"). Use obrigatoriamente um array JSON: ["bife", "feijao"].
 * - O campo "qty" DEVE ser um número ou null. Nunca coloque texto como "500g" ou "2 colheres" no campo "qty". A unidade de medida deve estar exclusivamente no campo "unit".
 * - Retorne APENAS o JSON puro. Não explique nada, não use blocos de Markdown ```json. Apenas retorne o objeto JSON da receita.
 * --- FIM DO PROMPT ---
 */

/**
 * @typedef {Object} Ingredient
 * @property {string} name - Nome do ingrediente
 * @property {number|null} qty - Quantidade numérica, ou null se for a gosto/opcional
 * @property {string} unit - Unidade de medida (g, ml, xícaras, a gosto, etc)
 * 
 * @typedef {Object} Recipe
 * @property {number} id - ID único sequencial da receita
 * @property {string} title - Título da receita
 * @property {string|string[]} category - Categoria única (string) ou múltiplas categorias (array de strings) para filtro da receita
 * @property {string|null} source - Origem / Fonte da receita
 * @property {string} emoji - Emoji representativo da receita
 * @property {string|null} [image] - Nome do arquivo de imagem (opcional)
 * @property {Ingredient[]} ingredients - Lista de ingredientes
 * @property {string[]} steps - Modo de preparo passo a passo
 * @property {string|null} [tips] - Dicas adicionais
 */
 
const receitasData = {
    "categories": {
        "todos": "Todos",
        "almoco": "Almoço",
        "janta": "Jantares",
        "sopas": "Sopas & Caldos",
        "molhos": "Molhos",
        "lanches": "Lanches",
        "marmitas": "Marmitas",
        "frango": "Frango",
        "bife": "Carnes/Bifes",
        "peixe": "Peixes",
        "macarrao": "Massas",
        "refogados": "Refogados",
        "feijao": "Feijão",
        "arroz": "Arroz",
        "batata": "Batatas",
        "temperos": "Temperos"
    },
    "recipes": [
        {
            "id": 1,
            "title": "Frango com Arroz e Legumes",
            "category": [
                "marmitas",
                "arroz"
            ],
            "source": "Marmitas da Semana (Segunda)",
            "emoji": "🍱",
            "image": "1.png",
            "ingredients": [
                {
                    "name": "Peito de frango em cubos",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Arroz",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Cenoura, brócolis e milho",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Alho, cebola, sal e azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere o frango e grelhe.",
                "Cozinhe o arroz.",
                "Refogue os legumes rapidamente.",
                "Monte as marmitas equilibrando proteína, carboidrato e legumes."
            ],
            "tips": "Excelente opção para ganho de massa muscular magra e fácil pesagem das porções!"
        },
        {
            "id": 2,
            "title": "Carne Moída Cremosa com Purê",
            "category": [
                "marmitas",
                "carne",
                "batata"
            ],
            "source": "Marmitas da Semana (Terça)",
            "emoji": "🥔",
            "ingredients": [
                {
                    "name": "Carne moída (patinho ou acém)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Batatas grandes",
                    "qty": 5,
                    "unit": "unidades"
                },
                {
                    "name": "Molho de tomate",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Queijo ralado",
                    "qty": null,
                    "unit": "opcional"
                }
            ],
            "steps": [
                "Refogue a carne com alho e cebola.",
                "Acrescente molho de tomate.",
                "Faça o purê com as batatas cozidas e amassadas.",
                "Monte as marmitas acomodando o purê e a carne por cima."
            ],
            "tips": "Adicione um toque de requeijão ou creme de leite na carne moída para aumentar a cremosidade.",
            "image": "2.png"
        },
        {
            "id": 3,
            "title": "Macarrão com Frango ao Molho Branco",
            "category": [
                "marmitas",
                "macarrao",
                "frango"
            ],
            "source": "Marmitas da Semana (Quarta)",
            "emoji": "🍝",
            "ingredients": [
                {
                    "name": "Macarrão de sua preferência",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Frango desfiado",
                    "qty": 400,
                    "unit": "g"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Alho e queijo ralado",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o macarrão até ficar al dente.",
                "Refogue o frango cozido e desfiado.",
                "Misture o creme de leite e finalize com queijo."
            ],
            "tips": "Adicione uma pitada de noz-moscada ao molho branco para elevar o sabor.",
            "image": "3.png"
        },
        {
            "id": 4,
            "title": "Feijão Tropeiro Simples",
            "category": [
                "marmitas",
                "feijao"
            ],
            "source": "Marmitas da Semana (Quinta)",
            "emoji": "🥓",
            "ingredients": [
                {
                    "name": "Feijão cozido (sem caldo)",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Bacon ou calabresa em cubos",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Farinha de mandioca",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Ovo e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Refogue o bacon/calabresa.",
                "Adicione o ovo e mexa para que fique mexido.",
                "Misture o feijão cozido e finalize com farinha de mandioca e cheiro-verde.",
                "Sirva acompanhado de arroz."
            ],
            "tips": "Couve picada fininha adicionada no final dá mais frescor e riqueza de fibras.",
            "image": "4.png"
        },
        {
            "id": 5,
            "title": "Strogonoff de Frango",
            "category": [
                "marmitas",
                "frango"
            ],
            "source": "Marmitas da Semana (Sexta)",
            "emoji": "🍛",
            "ingredients": [
                {
                    "name": "Peito de frango em cubos",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Molho de tomate (ou ketchup/mostarda)",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Batata palha",
                    "qty": null,
                    "unit": "para acompanhar"
                }
            ],
            "steps": [
                "Doure o frango na panela quente.",
                "Acrescente o molho de tomate e condimentos a gosto.",
                "Adicione o creme de leite.",
                "Sirva com arroz branco e batata palha."
            ],
            "tips": "Se for congelar a marmita, guarde a batata palha em um saquinho separado para não murchar.",
            "image": "5.png"
        },
        {
            "id": 6,
            "title": "Escondidinho de Carne",
            "category": [
                "marmitas",
                "bife",
                "batata"
            ],
            "source": "Marmitas da Semana (Sábado)",
            "emoji": "🥧",
            "ingredients": [
                {
                    "name": "Carne moída temperada",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Purê de mandioca ou batata",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Queijo para gratinar",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Faça a carne refogada saborosa.",
                "Em uma marmita refratária, coloque a carne e cubra com o purê de sua preferência.",
                "Polvilhe queijo e gratine no forno."
            ],
            "tips": "O purê de mandioca (aipim) traz uma textura mais elástica e cremosa deliciosa.",
            "image": "6.png"
        },
        {
            "id": 7,
            "title": "Arroz de Forno Completo",
            "category": [
                "marmitas",
                "arroz"
            ],
            "source": "Marmitas da Semana (Domingo)",
            "emoji": "🍚",
            "ingredients": [
                {
                    "name": "Arroz cozido",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Frango desfiado ou presunto",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Milho, ervilha e queijo picado",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Misture todos os ingredientes em uma travessa.",
                "Leve ao forno até o queijo gratinar e derreter.",
                "Separe as porções nas marmitas."
            ],
            "tips": "Perfeito para reaproveitar as sobras de arroz da geladeira!",
            "image": "7.png"
        },
        {
            "id": 8,
            "title": "Frango Assado com Batatas",
            "category": [
                "frango",
                "batata"
            ],
            "source": "6 Receitas de Frango (Opção 1)",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Frango (coxas e sobrecoxas)",
                    "qty": 1,
                    "unit": "kg"
                },
                {
                    "name": "Batatas grandes",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta-do-reino e orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere o frango com alho, limão, azeite, sal, pimenta e orégano. Deixe marinar por 30 minutos.",
                "Corte as batatas em pedaços e tempere com sal, pimenta e azeite.",
                "Em uma assadeira, disponha o frango e as batatas.",
                "Leve ao forno preaquecido a 200°C por cerca de 1 hora, virando na metade do tempo, até dourar."
            ],
            "tips": "Crocante por fora e macia por dentro!",
            "image": "8.png"
        },
        {
            "id": 9,
            "title": "Frango Cremoso com Milho",
            "category": "frango",
            "source": "6 Receitas de Frango (Opção 2)",
            "emoji": "🌽",
            "ingredients": [
                {
                    "name": "Peito de frango em tiras",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Lata de milho verde (escorrido)",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, aqueça o azeite e doure o alho e a cebola.",
                "Acrescente o frango e cozinhe até dourar.",
                "Adicione o milho, tempere com sal, pimenta e misture.",
                "Desligue o fogo, acrescente o creme de leite e o cheiro-verde. Sirva com arroz branco."
            ],
            "tips": "Bater metade do milho com o creme de leite no liquidificador antes de colocar na panela cria um creme ainda mais robusto!",
            "image": "9.png"
        },
        {
            "id": 10,
            "title": "Frango Xadrez",
            "category": "frango",
            "source": "6 Receitas de Frango (Opção 3)",
            "emoji": "🫑",
            "ingredients": [
                {
                    "name": "Peito de frango em cubos",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Pimentão vermelho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão verde picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Molho shoyu",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Óleo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta e cebolinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o óleo e doure o alho e a cebola.",
                "Acrescente o frango e frite até dourar.",
                "Adicione os pimentões, o shoyu, tempere com sal e pimenta.",
                "Cozinhe por mais 5 minutos e finalize com cebolinha. Sirva com arroz."
            ],
            "tips": "Adicione amendoim torrado sem casca no final para dar o clássico toque crocante asiático.",
            "image": "10.png"
        },
        {
            "id": 11,
            "title": "Frango ao Molho de Tomate",
            "category": "frango",
            "source": "6 Receitas de Frango (Opção 4)",
            "emoji": "🍅",
            "ingredients": [
                {
                    "name": "Frango (em pedaços)",
                    "qty": 1,
                    "unit": "kg"
                },
                {
                    "name": "Sachê de molho de tomate",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Água",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, aqueça o óleo e doure o alho, a cebola e o frango.",
                "Acrescente o molho de tomate e a água.",
                "Tempere com sal e pimenta.",
                "Tampe e cozinhe por cerca de 30 minutos em fogo médio.",
                "Finalize com cheiro-verde e sirva."
            ],
            "tips": "Sirva com polenta ou arroz branco bem quentinho.",
            "image": "11.png"
        },
        {
            "id": 12,
            "title": "Filé de Frango ao Limão",
            "category": "frango",
            "source": "6 Receitas de Frango (Opção 5)",
            "emoji": "🍋",
            "ingredients": [
                {
                    "name": "Filé de frango",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Suco de limão",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta-do-reino e ervas",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés com limão, alho, azeite, sal, pimenta e ervas.",
                "Deixe marinar por 20 minutos.",
                "Grelhe os filés em uma frigideira antiaderente até dourar dos dois lados.",
                "Sirva com salada ou legumes."
            ],
            "tips": "Não grelhe em fogo muito baixo para o frango não soltar muita água e ressecar.",
            "image": "12.png"
        },
        {
            "id": 13,
            "title": "Frango com Legumes na Panela",
            "category": "frango",
            "source": "6 Receitas de Frango (Opção 6)",
            "emoji": "🥦",
            "ingredients": [
                {
                    "name": "Frango em cubos",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Batata em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Brócolis em buquês",
                    "qty": 0.5,
                    "unit": "maço"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Água",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, doure o alho, a cebola e o frango.",
                "Acrescente a batata e a cenoura e refogue.",
                "Adicione a água, tampe e cozinhe até os legumes estarem macios.",
                "Junte o brócolis, tempere com sal e pimenta e cozinhe por mais 5 minutos.",
                "Finalize com cheiro-verde e sirva."
            ],
            "tips": "Receita rápida de uma panela só para facilitar o pós-janta!",
            "image": "13.png"
        },
        {
            "id": 14,
            "title": "Batata Rústica Assada",
            "category": "batata",
            "source": "Receitas de Batata (Opção 1)",
            "emoji": "🥔",
            "ingredients": [
                {
                    "name": "Batatas com casca",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta-do-reino e páprica",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Alecrim ou salsinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Corte as batatas em gomos preservando a casca.",
                "Misture com o azeite, o alho e os temperos.",
                "Distribua em uma assadeira e leve ao forno pré-aquecido a 200°C por 35 a 40 minutos, virando na metade do tempo."
            ],
            "tips": "Crocante por fora e extremamente macia por dentro!",
            "image": "14.png"
        },
        {
            "id": 15,
            "title": "Purê de Batata Cremoso",
            "category": "batata",
            "source": "Receitas de Batata (Opção 2)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Batata",
                    "qty": 1,
                    "unit": "kg"
                },
                {
                    "name": "Manteiga",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Leite quente",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal, pimenta-do-reino e noz-moscada",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe as batatas até ficarem bem macias.",
                "Escorra a água e amasse as batatas ainda quentes.",
                "Adicione a manteiga e o leite quente aos poucos, mexendo vigorosamente até obter um purê cremoso e homogêneo.",
                "Tempere a gosto com sal, pimenta e noz-moscada, e sirva."
            ],
            "tips": "Perfeito para acompanhar carnes grelhadas e peixes!",
            "image": "15.png"
        },
        {
            "id": 16,
            "title": "Batata Gratinada com Queijo",
            "category": "batata",
            "source": "Receitas de Batata (Opção 3)",
            "emoji": "🧀",
            "ingredients": [
                {
                    "name": "Batatas fatiadas em rodelas finas",
                    "qty": 5,
                    "unit": "unidades"
                },
                {
                    "name": "Leite",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Dente de alho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Queijo muçarela ralado",
                    "qty": 1.5,
                    "unit": "xícaras"
                },
                {
                    "name": "Sal, pimenta-do-reino e noz-moscada",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Misture o leite, o creme de leite, o alho picado e os temperos em um bowl.",
                "Em um refratário, faça camadas alternadas de rodelas de batata e a mistura líquida.",
                "Finalize cobrindo com queijo muçarela por cima.",
                "Leve ao forno a 200°C por cerca de 40 minutos ou até as batatas estarem macios e o queijo gratinado."
            ],
            "tips": "Cremosa, cheia de sabor e simplesmente irresistível!",
            "image": "16.png"
        },
        {
            "id": 17,
            "title": "Batata Frita Sequinha",
            "category": "batata",
            "source": "Receitas de Batata (Opção 4)",
            "emoji": "🍟",
            "ingredients": [
                {
                    "name": "Batatas grandes",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo para fritar",
                    "qty": null,
                    "unit": "o suficiente"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Corte as batatas em palitos uniformes e deixe de molho em água fria por 30 minutos.",
                "Escorra a água e seque-as muito bem com um pano limpo ou papel-toalha.",
                "Frite as batatas em óleo bem quente até que dourem.",
                "Escorra em papel-toalha e finalize temperando com sal imediatamente."
            ],
            "tips": "O molho na água fria remove o excesso de amido, garantindo que fiquem bem sequinhas.",
            "image": "17.png"
        },
        {
            "id": 18,
            "title": "Batata Recheada ao Forno",
            "category": "batata",
            "source": "Receitas de Batata (Opção 5)",
            "emoji": "🥔",
            "ingredients": [
                {
                    "name": "Batatas grandes",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Presunto ou bacon picado",
                    "qty": 200,
                    "unit": "g"
                },
                {
                    "name": "Requeijão cremoso",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo muçarela ralado",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal, pimenta-do-reino e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Asse as batatas inteiras no forno (ou micro-ondas) até ficarem completamente macias.",
                "Corte uma tampa ao meio e retire delicadamente parte do miolo, formando uma barquinha.",
                "Misture o miolo retirado com o bacon/presunto, o requeijão e temperos.",
                "Recheie as batatas, cubra com o queijo muçarela e leve ao forno para gratinar."
            ],
            "tips": "Prática, saborosa e refeição completa!",
            "image": "18.png"
        },
        {
            "id": 19,
            "title": "Batata Salteada com Ervas",
            "category": "batata",
            "source": "Receitas de Batata (Opção 6)",
            "emoji": "🌿",
            "ingredients": [
                {
                    "name": "Batatinhas (tipo bolinha)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Azeite ou manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e ervas (salsa, alecrim ou tomilho)",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe as batatinhas com casca até que fiquem macias (não desmanchando).",
                "Aqueça o azeite ou manteiga em uma frigideira grande e doure o alho rapidamente.",
                "Adicione as batatas escorridas e os temperos.",
                "Salteie na frigideira até dourar levemente de todos os lados e finalize com as ervas frescas."
            ],
            "tips": "Simples, leve e cheia de aroma e frescor!",
            "image": "19.png"
        },
        {
            "id": 20,
            "title": "Peixe Assado com Ervas",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 1)",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de peixe (tilápia ou merluza)",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Salsinha picada",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cebolinha picada",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Ramo de alecrim",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Fatias de limão",
                    "qty": null,
                    "unit": "para decorar"
                }
            ],
            "steps": [
                "Tempere os filés com limão, alho, sal e pimenta.",
                "Regue com azeite e polvilhe a salsinha e cebolinha.",
                "Disponha em uma assadeira untada, decore com fatias de limão e o alecrim por cima.",
                "Leve ao forno preaquecido a 200°C por 25 a 30 minutos até assar por completo."
            ],
            "tips": "Fica ótimo com batatas e legumes assados na mesma travessa!",
            "image": null
        },
        {
            "id": 21,
            "title": "Peixe Grelhado Simples",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 2)",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de peixe de sua escolha",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho amassados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés com limão, alho, sal, pimenta e o azeite.",
                "Deixe marinar em um recipiente por 15 minutos.",
                "Grelhe em frigideira antiaderente (ou churrasqueira) por 4 minutos de cada lado.",
                "Sirva bem quente com salada."
            ],
            "tips": "Dica: Para não grudar na frigideira, seque muito bem os filés com papel-toalha antes de temperar e grelhar.",
            "image": null
        },
        {
            "id": 22,
            "title": "Peixe ao Molho de Tomate",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 3)",
            "emoji": "🍅",
            "ingredients": [
                {
                    "name": "Filés de peixe",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Tomates picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Molho de tomate",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Azeitonas fatiadas",
                    "qty": null,
                    "unit": "opcional"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere o peixe com limão, sal e pimenta.",
                "Doure rapidamente os filés no azeite e reserve-os.",
                "Na mesma panela, refogue a cebola e o alho picados.",
                "Acrescente os tomates picados e o molho. Cozinhe por 5 minutos.",
                "Volte os filés para o molho, adicione as azeitonas e cozinhe por mais 5 minutos.",
                "Finalize com cheiro-verde e sirva."
            ],
            "tips": "Fica divino servido com arroz branco soltinho e purê de batatas!",
            "image": null
        },
        {
            "id": 23,
            "title": "Moqueca de Peixe",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 4)",
            "emoji": "🥘",
            "ingredients": [
                {
                    "name": "Peito de peixe em postas",
                    "qty": 600,
                    "unit": "g"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão verde em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão vermelho em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Tomates em rodelas",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Leite de coco",
                    "qty": 200,
                    "unit": "ml"
                },
                {
                    "name": "Azeite de dendê",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta e coentro",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere as postas de peixe com o limão, sal e alho.",
                "Em uma panela (de preferência de barro), faça camadas intercaladas de peixe, cebola, tomates e pimentões.",
                "Regue tudo com o azeite de dendê e o leite de coco.",
                "Cozinhe em fogo baixo com a panela tampada por cerca de 20 minutos.",
                "Finalize salpicando bastante coentro fresco e sirva com arroz."
            ],
            "tips": "Cozinhar em panela de barro e fogo lento enriquece imensamente o sabor final!",
            "image": null
        },
        {
            "id": 24,
            "title": "Fish and Chips (Peixe Empanado)",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 5)",
            "emoji": "🍟",
            "ingredients": [
                {
                    "name": "Filés de peixe",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Farinha de trigo",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Ovo batido",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Farinha panko ou de rosca",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Óleo para fritar",
                    "qty": null,
                    "unit": "o suficiente"
                },
                {
                    "name": "Sal e pimenta",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés de peixe com limão, sal e pimenta.",
                "Passe os filés na farinha de trigo, depois no ovo batido e finalize pressionando na farinha panko.",
                "Frite em óleo bem quente até que fiquem dourados e crocantes.",
                "Escorra em papel-toalha e sirva imediatamente acompanhado de batatas fritas."
            ],
            "tips": "Sirva com molho tártaro ou maionese verde caseira temperada.",
            "image": null
        },
        {
            "id": 25,
            "title": "Peixe com Crosta de Ervas",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 6)",
            "emoji": "🌿",
            "ingredients": [
                {
                    "name": "Filés de peixe",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Farinha de rosca",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Queijo parmesão ralado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Salsinha picada",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dente de alho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal e pimenta",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés com limão, sal e pimenta-do-reino.",
                "Em um bowl pequeno, misture a farinha de rosca, o queijo parmesão, a salsinha e o alho picado com uma colher de azeite.",
                "Disponha os filés em uma assadeira untada e cubra o topo com a mistura de farinha, pressionando levemente.",
                "Asse no forno pré-aquecido a 200°C por 20 a 25 minutos até dourar a crosta."
            ],
            "tips": "Uma excelente forma de consumir peixe assado que permanece incrivelmente suculento por dentro!",
            "image": null
        },
        {
            "id": 26,
            "title": "Ceviche de Peixe",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 7)",
            "emoji": "🥗",
            "ingredients": [
                {
                    "name": "Peixe branco fresco (robalo, tilápia)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Suco de limão",
                    "qty": 6,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola-roxa fatiada fina",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate sem sementes picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimenta dedo-de-moça (sem sementes) picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Coentro e sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Corte o peixe fresco em cubos uniformes e acomode em um bowl frio.",
                "Despeje todo o suco de limão garantindo que cubra o peixe. Misture.",
                "Deixe curar na geladeira de 20 a 30 minutos.",
                "Retire da geladeira, acrescente a cebola-roxa, o tomate, a pimenta, o coentro e o sal. Misture bem e sirva gelado."
            ],
            "tips": "Sirva acompanhado de torradas crocantes ou chips de banana-da-terra.",
            "image": null
        },
        {
            "id": 27,
            "title": "Bolinho de Peixe",
            "category": "peixe",
            "source": "Receitas de Peixe (Opção 8)",
            "emoji": "🧆",
            "ingredients": [
                {
                    "name": "Peixe cozido e desfiado",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Batata cozida e bem amassada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Salsinha picada",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Ovo batido",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Farinha de trigo (se necessário dar ponto)",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Óleo para fritar",
                    "qty": null,
                    "unit": "o suficiente"
                },
                {
                    "name": "Sal, pimenta e cominho",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma frigideira, refogue a cebola e o alho.",
                "Em uma tigela, misture o peixe desfiado, a batata amassada, o refogado de alho/cebola e os temperos.",
                "Ajuste o sal e, se necessário, adicione um pouquinho de farinha de trigo para dar fimeza.",
                "Modele os bolinhos, passe no ovo batido e frite em óleo quente até dourar.",
                "Escorra em papel-toalha."
            ],
            "tips": "Perfeito como petisco ou acompanhamento para o almoço de domingo!",
            "image": null
        },
        {
            "id": 28,
            "title": "Espaguete ao Molho de Tomate Caseiro",
            "category": "macarrao",
            "source": "Receitas de Macarrão (Opção 1)",
            "emoji": "🍝",
            "ingredients": [
                {
                    "name": "Espaguete",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Tomates maduros picados",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola picada",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Folhas de manjericão fresco",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Queijo parmesão ralado",
                    "qty": null,
                    "unit": "opcional"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o espaguete em abundante água salgada fervendo até ficar al dente. Reserve.",
                "Em uma panela média, aqueça o azeite e refogue o alho e a cebola.",
                "Adicione os tomates picados, tempere com sal e pimenta e cozinhe por cerca de 15 minutos em fogo baixo para encorpar.",
                "Misture o macarrão escorrido ao molho, finalize com o manjericão e sirva com queijo parmesão."
            ],
            "tips": "Dica: Sempre guarde 1 concha da água do cozimento para ajustar a textura do molho, se necessário!",
            "image": null
        },
        {
            "id": 29,
            "title": "Penne ao Molho Branco com Frango",
            "category": "macarrao",
            "source": "Receitas de Macarrão (Opção 2)",
            "emoji": "🥛",
            "ingredients": [
                {
                    "name": "Penne",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Frango cozido e desfiado",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Farinha de trigo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Leite integral",
                    "qty": 500,
                    "unit": "ml"
                },
                {
                    "name": "Creme de leite",
                    "qty": 0.5,
                    "unit": "caixinha"
                },
                {
                    "name": "Queijo muçarela ralado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Sal, noz-moscada, pimenta e salsa",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o penne em água salgada e escorra.",
                "Em outra panela, derreta a manteiga, adicione a farinha e mexa sem parar por 1 minuto. Vá acrescentando o leite aos poucos, mexendo para dissolver tudo e engrossar.",
                "Tempere o creme com sal, noz-moscada e pimenta. Junte o creme de leite e o frango desfiado.",
                "Misture o penne ao molho, coloque em uma travessa, polvilhe a muçarela e leve ao forno rápido para gratinar."
            ],
            "tips": "Um prato reconfortante para jantares de inverno.",
            "image": null
        },
        {
            "id": 30,
            "title": "Parafuso ao Molho de Pesto",
            "category": "macarrao",
            "source": "Receitas de Macarrão (Opção 3)",
            "emoji": "🌱",
            "ingredients": [
                {
                    "name": "Parafuso (Fusilli)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Folhas de manjericão fresco",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Azeite de oliva extra virgem",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Nozes ou castanhas picadas",
                    "qty": 0.25,
                    "unit": "xícara"
                },
                {
                    "name": "Dente de alho",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Queijo parmesão ralado",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Tomatinhos-cereja",
                    "qty": null,
                    "unit": "para decorar"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o macarrão parafuso até ficar al dente. Reserve.",
                "No liquidificador ou processador, adicione o manjericão, o azeite, as nozes, o alho e o parmesão. Processe até obter um molho homogêneo.",
                "Tempere o molho com uma pitada de sal.",
                "Misture o pesto frio direto na massa quente, decore com tomatinhos e um fio de azeite."
            ],
            "tips": "Não cozinhe o pesto no fogo! O calor da própria massa cozida é o suficiente para liberar o perfume do manjericão.",
            "image": null
        },
        {
            "id": 31,
            "title": "Macarrão à Bolonhesa",
            "category": "macarrao",
            "source": "Receitas de Macarrão (Opção 4)",
            "emoji": "🍝",
            "ingredients": [
                {
                    "name": "Espaguete",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Carne moída",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cenoura ralada bem fina",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Molho de tomate",
                    "qty": 340,
                    "unit": "g"
                },
                {
                    "name": "Azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta e orégano",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Parmesão ralado",
                    "qty": null,
                    "unit": "para servir"
                }
            ],
            "steps": [
                "Cozinhe o macarrão. Reserve.",
                "Aqueça o azeite e refogue o alho e a cebola na panela.",
                "Adicione a carne moída e refogue até dourar por completo.",
                "Acrescente a cenoura ralada, o molho de tomate e os temperos. Deixe apurar por 15 minutos em fogo baixo.",
                "Misture tudo ou deite sobre a massa fresca e sirva com parmesão."
            ],
            "tips": "A cenoura ralada fina serve para quebrar a acidez natural do molho de tomate sem precisar usar açúcar!",
            "image": null
        },
        {
            "id": 32,
            "title": "Fettuccine ao Molho Alfredo",
            "category": "macarrao",
            "source": "Receitas de Macarrão (Opção 5)",
            "emoji": "🧈",
            "ingredients": [
                {
                    "name": "Fettuccine",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Manteiga de qualidade",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Creme de leite fresco ou caixinha",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo parmesão de boa qualidade ralado",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Salsa picada",
                    "qty": null,
                    "unit": "para finalizar"
                },
                {
                    "name": "Sal, pimenta-do-reino e noz-moscada",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o fettuccine em água salgada.",
                "Em uma panela, derreta a manteiga e refogue o alho bem rápido (sem deixar queimar).",
                "Acrescente o creme de leite, o sal, a pimenta e a noz-moscada.",
                "Adicione o queijo parmesão e mexa constantemente até derreter e engrossar levemente.",
                "Escorra a massa, envolva-a diretamente no molho cremoso e salpique salsa."
            ],
            "tips": "Refinado, rápido e incrivelmente aveludado!",
            "image": null
        },
        {
            "id": 33,
            "title": "Macarrão com Legumes Salteados",
            "category": "macarrao",
            "source": "Receitas de Macarrão (Opção 6)",
            "emoji": "🥕",
            "ingredients": [
                {
                    "name": "Macarrão penne ou gravatinha",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Abobrinha em cubos pequenos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em tiras finas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão vermelho em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Brócolis cortado em buquês",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta e ervas",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Queijo ralado",
                    "qty": null,
                    "unit": "opcional"
                }
            ],
            "steps": [
                "Cozinhe o macarrão até ficar al dente.",
                "Em uma frigideira grande (Wok de preferência), aqueça o azeite e refogue o alho.",
                "Adicione os legumes (cenoura primeiro que é mais dura, depois os demais) e salteie bem rápido até ficarem macios porém crocantes (al dente).",
                "Tempere-os com sal, pimenta e ervas.",
                "Misture o macarrão na frigideira com os legumes e finalize com queijo, se desejar."
            ],
            "tips": "Excelente forma de prato único, leve e saudável!",
            "image": null
        },
        {
            "id": 34,
            "title": "Refogado de Carne Tradicional",
            "category": "refogados",
            "source": "Receitas de Refogados (Opção 1)",
            "emoji": "🍳",
            "ingredients": [
                {
                    "name": "Carne em tiras (patinho, alcatra)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Tomate picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão",
                    "qty": 0.5,
                    "unit": "unidade (opcional)"
                },
                {
                    "name": "Sal, pimenta-do-reino e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça bem o óleo em uma panela e doure a carne, esperando secar toda a água natural que soltar.",
                "Acrescente a cebola fatiada e refogue até ficar translúcida.",
                "Adicione o alho picado e refogue por mais 1 minuto.",
                "Junte o tomate picado e o pimentão. Tempere com sal e pimenta.",
                "Deixe refogar até os tomates derreterem e criarem um molho leve encorpado. Finalize com cheiro-verde."
            ],
            "tips": "Não fique mexendo excessivamente na carne logo que colocar na panela para dourar por igual e não soltar líquidos demais!",
            "image": "34.png"
        },
        {
            "id": 35,
            "title": "Refogado de Frango da Roça",
            "category": "refogados",
            "source": "Receitas de Refogados (Opção 2)",
            "emoji": "🐔",
            "ingredients": [
                {
                    "name": "Peito de frango em tiras",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Pimentão colorido em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta, orégano e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o óleo e sele o frango até dourar por completo de todos os lados.",
                "Acrescente a cebola fatiada e refogue até que murche.",
                "Adicione o alho picado e cozinhe por 1 minuto.",
                "Adicione o tomate e o pimentão colorido. Tempere com sal, pimenta e orégano.",
                "Refogue por mais 5 minutos tampado e finalize salpicando cheiro-verde."
            ],
            "tips": "Dica de ouro: Cortar todos os ingredientes em tamanhos parecidos faz com que tudo cozinhe por igual.",
            "image": "35.png"
        },
        {
            "id": 36,
            "title": "Refogado de Legumes Especial",
            "category": "refogados",
            "source": "Receitas de Refogados (Opção 3)",
            "emoji": "🥕",
            "ingredients": [
                {
                    "name": "Cenoura cortada em rodelas finas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Abobrinha fatiada em meia-lua",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão colorido em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Brócolis cortado em buquês",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Gergelim",
                    "qty": null,
                    "unit": "opcional"
                },
                {
                    "name": "Sal, pimenta e ervas",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o óleo e refogue o alho picado até liberar aroma.",
                "Adicione primeiro a cenoura e cozinhe salteando por 2 minutos.",
                "Adicione a abobrinha, o brócolis e os pimentões. Misture tudo delicadamente.",
                "Tempere com sal, pimenta e ervas de sua escolha.",
                "Refogue por mais 5 a 7 minutos em fogo médio para que fiquem cozidos porém firmes e crocantes.",
                "Salpique gergelim e sirva."
            ],
            "tips": "Cozinhar em fogo médio para alto preserva a cor vibrante e os nutrientes dos legumes frescos!",
            "image": "36.png"
        },
        {
            "id": 37,
            "title": "Refogado de Cogumelos na Manteiga",
            "category": "refogados",
            "source": "Receitas de Refogados (Opção 4)",
            "emoji": "🍄",
            "ingredients": [
                {
                    "name": "Cogumelos fatiados (shimeji, paris)",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Manteiga ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola picada",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta-do-reino e tomilho",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cheiro-verde",
                    "qty": null,
                    "unit": "para finalizar"
                }
            ],
            "steps": [
                "Derreta a manteiga em uma frigideira e refogue a cebola e o alho.",
                "Adicione todos os cogumelos de uma vez.",
                "Tempere com sal, pimenta-do-reino e tomilho fresco.",
                "Cozinhe até os cogumelos soltarem líquido e ele secar, deixando-os levemente dourados.",
                "Finalize salpicando cheiro-verde."
            ],
            "tips": "Nunca lave os cogumelos em água corrente sob risco de encharcar! Limpe-os com pano úmido ou papel escovando as impurezas.",
            "image": "37.png"
        },
        {
            "id": 38,
            "title": "Feijão Preto Tradicional",
            "category": "feijao",
            "source": "Receitas de Feijão (Opção 1)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Feijão preto",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Linguiça calabresa fatiada",
                    "qty": 1,
                    "unit": "gomo"
                },
                {
                    "name": "Bacon picadinho",
                    "qty": 150,
                    "unit": "g"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Folhas de louro",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Deixe o feijão de molho em água morna por pelo menos 8 horas. Escorra e reserve.",
                "Na panela de pressão, frite o bacon e a calabresa.",
                "Acrescente a cebola e o alho e refogue bem.",
                "Coloque o feijão escorrido, adicione água até cobrir por completo e coloque as folhas de louro.",
                "Tampe e cozinhe sob pressão por 25 a 30 minutos.",
                "Abra, tempere com sal e finalize com cheiro-verde fresco."
            ],
            "tips": "Deixar o feijão de molho elimina fitatos que causam gases e reduz drasticamente o tempo de cozimento!",
            "image": "38.png"
        },
        {
            "id": 39,
            "title": "Feijão Carioca Simples",
            "category": "feijao",
            "source": "Receitas de Feijão (Opção 2)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Feijão carioca",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Folha de louro",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Deixe o feijão de molho de 4 a 6 horas. Escorra e reserve.",
                "Na panela de pressão, aqueça o óleo e doure o alho e a cebola.",
                "Adicione o feijão carioca, coloque água até cobrir totalmente, adicione a folha de louro e tampe.",
                "Cozinhe na pressão por 20 a 25 minutos.",
                "Tempere com sal a gosto e amasse algumas conchas de grãos nas paredes da panela para engrossar o caldo."
            ],
            "tips": "Finalize com coentro ou cheiro-verde para um toque especial de frescor.",
            "image": "39.png"
        },
        {
            "id": 40,
            "title": "Feijão Tropeiro Tradicional",
            "category": "feijao",
            "source": "Receitas de Feijão (Opção 3)",
            "emoji": "🥓",
            "ingredients": [
                {
                    "name": "Feijão carioca cozido firme (sem caldo)",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Bacon picadinho",
                    "qty": 150,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa picada",
                    "qty": 1,
                    "unit": "gomo"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Couve cortada bem fina",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Farinha de mandioca",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Sal e pimenta",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Na panela, frite o bacon e a linguiça até dourar.",
                "Adicione a cebola e o alho refogando até murchar.",
                "Adicione o feijão cozido (sem caldo) e a couve fatiada, misturando bem.",
                "Vá adicionando a farinha de mandioca aos poucos, mexendo para agregar os sabores.",
                "Ajuste com sal e pimenta e sirva quente."
            ],
            "tips": "Sirva com torresmo estalando de crocante por cima.",
            "image": "40.png"
        },
        {
            "id": 41,
            "title": "Feijão Fradinho",
            "category": "feijao",
            "source": "Receitas de Feijão (Opção 4)",
            "emoji": "🥗",
            "ingredients": [
                {
                    "name": "Feijão fradinho",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Tomate cortado em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Deixe o feijão fradinho de molho de 4 a 6 horas. Escorra.",
                "Em uma panela comum ou de pressão, aqueça o óleo e doure o alho e cebola.",
                "Adicione o feijão, cubra com água e cozinhe por 20 minutos (não deixe desmanchar).",
                "Adicione o tomate fresco e finalize ajustando o sal e o cheiro-verde."
            ],
            "tips": "Pode ser consumido morno ou gelado como uma salada refrescante com azeite de oliva extra virgem!",
            "image": "41.png"
        },
        {
            "id": 42,
            "title": "Arroz Branco Soltinho",
            "category": "arroz",
            "source": "Receitas de Arroz (Opção 1)",
            "emoji": "🍚",
            "ingredients": [
                {
                    "name": "Arroz agulhinha",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Água quente",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Fio de óleo ou manteiga",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Sal",
                    "qty": 0.5,
                    "unit": "colher (chá)"
                }
            ],
            "steps": [
                "Lave o arroz sob água corrente até escorrer bem clara (se desejar retirar amido).",
                "Em uma panela, aqueça o óleo/manteiga e refogue o arroz por 1 minuto para selar os grãos.",
                "Despeje a água fervendo e o sal, misture levemente e abaixe o fogo.",
                "Deixe cozinhar com a tampa entreaberta por 15 minutos até a água secar totalmente.",
                "Desligue o fogo e mantenha a panela tampada por 5 minutos antes de soltar com o garfo."
            ],
            "tips": "A proporção de ouro é sempre de 2 xícaras de água quente para cada 1 xícara de arroz seco!",
            "image": "42.png"
        },
        {
            "id": 43,
            "title": "Arroz Rico com Legumes",
            "category": "arroz",
            "source": "Receitas de Arroz (Opção 2)",
            "emoji": "🥕",
            "ingredients": [
                {
                    "name": "Arroz",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Água",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Cebola picadinha",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Dente de alho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em cubinhos",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Ervilhas",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Milho verde",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Óleo, sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Refogue o alho e cebola no óleo quente até que dourem.",
                "Adicione o arroz seco e a cenoura picadinha, refogando por 1 minuto.",
                "Adicione a água morna e o sal.",
                "Abaixe o fogo quando ferver e, após 10 minutos, misture as ervilhas e o milho por cima.",
                "Deixe secar totalmente, desligue e jogue o cheiro-verde salpicado."
            ],
            "tips": "Colorido, saudável e as crianças adoram!",
            "image": "43.png"
        },
        {
            "id": 44,
            "title": "Arroz Cremoso com Frango",
            "category": "arroz",
            "source": "Receitas de Arroz (Opção 3)",
            "emoji": "🍛",
            "ingredients": [
                {
                    "name": "Arroz",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Água",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Frango cozido e desfiado",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Cebola e alho picados",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Tomate maduro picado",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Fio de óleo",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, doure o alho e a cebola no óleo.",
                "Adicione o arroz e refogue por 1 minuto.",
                "Adicione o tomate picado e misture bem até amolecer.",
                "Agregue o frango desfiado, os temperos de sua preferência e a água fervente.",
                "Cozinhe em fogo baixo até que seque e finalize salpicando cheiro-verde."
            ],
            "tips": "Um prato prático e muito rico em proteínas para o dia a dia!",
            "image": "44.png"
        },
        {
            "id": 45,
            "title": "Arroz ao Alho Dourado",
            "category": "arroz",
            "source": "Receitas de Arroz (Opção 4)",
            "emoji": "🧄",
            "ingredients": [
                {
                    "name": "Arroz",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Água",
                    "qty": 2,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Dentes de alho cortados em lâminas finas",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, aqueça o óleo e doure as lâminas de alho até que fiquem bem crocantes e aromáticas (cuidado para não queimar!).",
                "Coloque o arroz seco e refogue para absorver o azeite aromatizado.",
                "Despeje a água e adicione o sal a gosto.",
                "Cozinhe em fogo brando com panela tampada.",
                "Finalize com cheiro-verde fresco."
            ],
            "tips": "O alho em lâminas confere um visual lindo e um sabor único à massa.",
            "image": "45.png"
        },
        {
            "id": 46,
            "title": "Refogado de Legumes Express",
            "category": "refogados",
            "source": "Receitas de Refogados Rápidos (Opção 1)",
            "emoji": "🥒",
            "ingredients": [
                {
                    "name": "Abobrinha cortada em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em tiras finas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão (colorido)",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola média fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 1,
                    "unit": "fio"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o azeite e refogue o alho picado e a cebola fatiada.",
                "Coloque todos os legumes picados e mexa ativamente.",
                "Tempere a gosto com sal e pimenta.",
                "Deixe refogar de 5 a 8 minutos até estarem tenros e brilhantes.",
                "Finalize com cheiro-verde."
            ],
            "tips": "Perfeito como prato de entrada ou guarnição saudável.",
            "image": "46.png"
        },
        {
            "id": 47,
            "title": "Refogado de Frango e Brócolis",
            "category": "refogados",
            "source": "Receitas de Refogados Rápidos (Opção 2)",
            "emoji": "🥦",
            "ingredients": [
                {
                    "name": "Peito de frango em tiras",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Pimentão colorido",
                    "qty": 1,
                    "unit": "unidade (opcional)"
                },
                {
                    "name": "Brócolis cortado pequeno",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 1,
                    "unit": "fio"
                },
                {
                    "name": "Sal, pimenta e páprica defumada",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere as tiras de frango com o sal, a pimenta e a páprica.",
                "Refogue o alho e a cebola no azeite.",
                "Coloque as tiras de frango e cozinhe mexendo até dourar bem.",
                "Acrescente o brócolis picadinho e o pimentão.",
                "Cozinhe até dourar bem e amaciar o brócolis. Finalize com cheiro-verde."
            ],
            "tips": "A páprica defumada traz um leve toque defumado irresistível ao frango grelhado.",
            "image": "47.png"
        },
        {
            "id": 48,
            "title": "Refogado de Carne de Panela",
            "category": "refogados",
            "source": "Receitas de Refogados Rápidos (Opção 3)",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Carne em tiras (patinho ou acém)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Pimentão fatiado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate maduro picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 1,
                    "unit": "fio"
                },
                {
                    "name": "Sal, pimenta-do-reino e cominho",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o óleo e doure o alho e cebola.",
                "Coloque as tiras de carne e refogue em fogo alto até selar.",
                "Adicione o pimentão e o tomate cortados.",
                "Tempere com sal, pimenta e cominho.",
                "Refogue tampado por mais 5 minutos e finalize com cheiro-verde."
            ],
            "tips": "Fica incrível servido sobre um purê cremoso ou arroz.",
            "image": "48.png"
        },
        {
            "id": 49,
            "title": "Refogado de Camarão com Pimentão",
            "category": "refogados",
            "source": "Receitas de Refogados Rápidos (Opção 4)",
            "emoji": "🍤",
            "ingredients": [
                {
                    "name": "Camarão limpo",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Pimentão fatiado em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 1,
                    "unit": "fio"
                },
                {
                    "name": "Suco de limão",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta e salsinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os camarões com sal, pimenta e o suco de limão.",
                "Refogue o alho e cebola picados no azeite quente.",
                "Coloque os camarões e refogue em fogo alto até mudarem de cor para rosados (cerca de 3 a 4 minutos).",
                "Junte o pimentão e mexa por 3 minutos.",
                "Finalize salpicando bastante salsinha fresca."
            ],
            "tips": "Atenção: Não cozinhe o camarão demais para que não fique duro ou com textura borrachuda.",
            "image": "49.png"
        },
        {
            "id": 50,
            "title": "Refogado de Tofu com Vegetais",
            "category": "refogados",
            "source": "Receitas de Refogados Rápidos (Opção 5)",
            "emoji": "🥬",
            "ingredients": [
                {
                    "name": "Tofu cortado em cubos firmes",
                    "qty": 200,
                    "unit": "g"
                },
                {
                    "name": "Brócolis pequeno cortado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em tiras finas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Molho shoyu",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Óleo de gergelim ou azeite",
                    "qty": 1,
                    "unit": "fio"
                },
                {
                    "name": "Dente de alho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Gergelim e cebolinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Doure os cubos de tofu em uma frigideira com azeite até ficarem crocantes por fora.",
                "Na mesma panela, refogue o alho picado e junte a cenoura e o brócolis.",
                "Coloque o shoyu e misture tudo.",
                "Cozinhe por 5 minutos tampado e finalize salpicando sementes de gergelim e cebolinha."
            ],
            "tips": "Opção vegana excelente, leve e rica em proteínas vegetais!",
            "image": "50.png"
        },
        {
            "id": 51,
            "title": "Refogado Expresso de Cogumelos",
            "category": "refogados",
            "source": "Receitas de Refogados Rápidos (Opção 6)",
            "emoji": "🍄",
            "ingredients": [
                {
                    "name": "Cogumelos frescos (shimeji ou paris)",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Cebola pequena picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Manteiga ou azeite",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Sal, pimenta e tomilho",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cheiro-verde para finalizar",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Derreta a manteiga na frigideira bem quente e refogue alho e cebola.",
                "Adicione os cogumelos fatiados e mexa constantemente.",
                "Tempere com sal, pimenta e ramos de tomilho.",
                "Deixe cozinhar de 5 a 7 minutos até dourarem.",
                "Finalize com cheiro-verde fresquinho e sirva."
            ],
            "tips": "Maravilhoso para servir como entrada, cobertura de bifes ou acompanhando massas!",
            "image": "51.png"
        },
        {
            "id": 52,
            "title": "Bife Acebolado Clássico",
            "category": "bife",
            "source": "Receitas de Bifes (Opção 1)",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Bifes de qualidade (alcatra, contrafilé)",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Óleo ou azeite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola grande fatiada em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Água",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Cheiro-verde picadinho",
                    "qty": null,
                    "unit": "opcional"
                }
            ],
            "steps": [
                "Tempere bem os bifes com sal e pimenta-do-reino de ambos os lados.",
                "Aqueça o óleo em fogo alto na frigideira e doure os bifes rapidamente por 2 a 3 minutos de cada lado.",
                "Retire-os da frigideira e reserve em um prato.",
                "Na mesma frigideira, refogue o alho e as rodelas de cebola raspando o fundo saboroso da panela.",
                "Volte os bifes e os sucos liberados à frigideira, adicione a água e tampe cozinhando por mais 2 minutos.",
                "Finalize com cheiro-verde e sirva."
            ],
            "tips": "Dica: Não fure a carne com garfos enquanto sela para que os sucos permaneçam selados no interior do bife!",
            "image": "52.png"
        },
        {
            "id": 53,
            "title": "Bife ao Molho de Mostarda",
            "category": "bife",
            "source": "Receitas de Bifes (Opção 2)",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Bifes",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo ou manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Mostarda amarela ou escura",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Creme de leite",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Água",
                    "qty": 0.25,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Sal, pimenta e salsinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os bifes com sal e pimenta-do-reino.",
                "Grelhe os bifes na manteiga ou óleo em fogo alto de ambos os lados e reserve.",
                "Na mesma frigideira quente, coloque o alho picadinho e refogue rapidamente.",
                "Acrescente a mostarda, misture bem e coloque o creme de leite e a água.",
                "Mexa constantemente até o molho encorpar.",
                "Retorne os bifes reservados ao molho quente por 1 minuto e finalize salpicando salsinha."
            ],
            "tips": "Harmoniza perfeitamente acompanhado de arroz branco e batata palha ou purê!",
            "image": "53.png"
        },
        {
            "id": 54,
            "title": "Bife ao Alho e Ervas Finas",
            "category": "bife",
            "source": "Receitas de Bifes (Opção 3)",
            "emoji": "🧄",
            "ingredients": [
                {
                    "name": "Bifes altos",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Sal grosso moído ou refinado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Manteiga com sal",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho fatiados",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Ramo de alecrim fresco",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Ramo de tomilho fresco",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os bifes com sal grosso e pimenta-do-reino.",
                "Em uma frigideira pesada bem quente, derreta a manteiga.",
                "Frite os bifes virando apenas uma vez para selar.",
                "Adicione o alho fatiado, os ramos de alecrim e de tomilho.",
                "Com uma colher, vá banhando continuamente o topo dos bifes com a manteiga derretida e aromatizada por 2 minutos.",
                "Sirva bem quente."
            ],
            "tips": "Usar manteiga de boa qualidade proporciona uma cor dourada e um brilho insuperáveis!",
            "image": "54.png"
        },
        {
            "id": 55,
            "title": "Bife ao Molho Madeira com Cogumelos",
            "category": "bife",
            "source": "Receitas de Bifes (Opção 4)",
            "emoji": "🍷",
            "ingredients": [
                {
                    "name": "Bifes altos",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Óleo ou manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola bem picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cogumelos fatiados (champignon)",
                    "qty": 1,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Vinho madeira seco (ou tinto seco)",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Água",
                    "qty": 0.5,
                    "unit": "xícara (chá)"
                },
                {
                    "name": "Amido de milho",
                    "qty": 1,
                    "unit": "colher (chá, opcional)"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere a carne e doure os bifes na frigideira quente. Reserve.",
                "Na mesma panela, doure o alho e a cebola picadinhos.",
                "Acrescente os cogumelos fatiados e refogue por 2 minutos.",
                "Despeje o vinho madeira e deixe reduzir pela metade do volume para evaporar álcool.",
                "Acrescente a água com o amido dissolvido e mexa até engrossar de forma aveludada.",
                "Deite os bifes de volta ao molho borbulhante e sirva."
            ],
            "tips": "Prato sofisticado digno de restaurante que você faz em 15 minutos em casa!",
            "image": "55.png"
        },
        {
            "id": 56,
            "title": "Frango Grelhado Clássico",
            "category": "frango",
            "source": "Receitas de Frango Rápido (Opção 1)",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Peito de frango em filés",
                    "qty": 400,
                    "unit": "g"
                },
                {
                    "name": "Dentes de alho",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Sal, pimenta e orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere o frango com alho picado, limão, azeite, sal, pimenta e orégano.",
                "Deixe marinando nos temperos por 15 minutos.",
                "Grelhe em frigideira quente por 6 a 7 minutos de cada lado até ficar dourado.",
                "Sirva com acompanhamentos frescos."
            ],
            "tips": "Excelente servido com batata-doce assada!",
            "image": "56.png"
        },
        {
            "id": 57,
            "title": "Frango Cremoso com Mostarda",
            "category": "frango",
            "source": "Receitas de Frango Rápido (Opção 2)",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Peito de frango",
                    "qty": 400,
                    "unit": "g"
                },
                {
                    "name": "Manteiga",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Mostarda amarela",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Sal, pimenta e salsinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Grelhe os filés de frango na frigideira e reserve em um prato.",
                "Na mesma panela, derreta a manteiga em fogo baixo.",
                "Adicione a mostarda e o creme de leite, mexendo ativamente.",
                "Retorne os filés ao molho cremoso de mostarda, mexe bem e finalize com salsinha picada."
            ],
            "tips": "Sirva acompanhado de arroz branco - fica simplesmente irresistível!",
            "image": "57.png"
        },
        {
            "id": 58,
            "title": "Frango Desfiado com Requeijão",
            "category": "frango",
            "source": "Receitas de Frango Rápido (Opção 3)",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Peito de frango",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Pote de requeijão cremoso",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o peito de frango em água salgada e desfie.",
                "Refogue a cebola e alho picadinhos em um fio de azeite.",
                "Adicione o frango desfiado e tempere a gosto.",
                "Misture o pote inteiro de requeijão cremoso até homogeneizar e finalize com cheiro-verde."
            ],
            "tips": "Dica: Essa receita é um recheio perfeito para panquecas, tortas ou recheio de tapiocas.",
            "image": "58.png"
        },
        {
            "id": 59,
            "title": "Frango ao Molho de Tomate Fit",
            "category": "frango",
            "source": "Receitas de Frango Rápido (Opção 4)",
            "emoji": "🍅",
            "ingredients": [
                {
                    "name": "Peito de frango em cubos ou filés",
                    "qty": 400,
                    "unit": "g"
                },
                {
                    "name": "Molho de tomate caseiro",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Cebola picadinha",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Dente de alho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta e folhas de manjericão",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Grelhe os filés ou cubos de frango e reserve.",
                "Na mesma panela quente, coloque um fio de azeite e refogue cebola e alho.",
                "Acrescente o molho de tomate.",
                "Volte o frango para a panela, misture tudo tampado por 5 minutos e finalize com folhas frescas de manjericão."
            ],
            "tips": "Refeição super leve, de baixa caloria e extremamente saudável.",
            "image": "59.png"
        },
        {
            "id": 60,
            "title": "Sopa de Legumes com Frango",
            "category": [
                "janta",
                "sopas",
                "frango"
            ],
            "source": "Receitas de Janta Leve (Opção 1)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Peito de frango desfiado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Batata picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Chuchu picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Abobrinha pequena picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola média picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta-do-reino e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o azeite e refogue o alho e a cebola.",
                "Adicione todos os legumes cortados finos e refogue-os por alguns minutos.",
                "Cubra totalmente com água quente e deixe cozinhar até estarem macios.",
                "Adicione o peito de frango cozido e desfiado, os temperos e ferva por mais 5 minutos.",
                "Finalize salpicando cheiro-verde fresco."
            ],
            "tips": "Quente, aconchegante e perfeita para noites frias de descanso rápido. Pronta em 30 min!",
            "image": null
        },
        {
            "id": 61,
            "title": "Omelete de Forno com Legumes",
            "category": [
                "janta",
                "lanches"
            ],
            "source": "Receitas de Janta Leve (Opção 2)",
            "emoji": "🍳",
            "ingredients": [
                {
                    "name": "Ovos frescos",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Leite de sua escolha",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Cenoura ralada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Pimentão picadinho",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate cortado em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Queijo ralado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, orégano e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Bata bem os ovos inteiros com o leite e adicione os temperos desejados.",
                "Incorpore todos os legumes picados e mexa.",
                "Transfira toda a mistura para um refratário levemente untado.",
                "Polvilhe o queijo ralado por toda a superfície.",
                "Leve ao forno a 180°C pré-aquecido por cerca de 20 minutos até inflar e dourar."
            ],
            "tips": "Receita pronta em apenas 25 minutos! Altamente proteica e de fácil digestão.",
            "image": null
        },
        {
            "id": 62,
            "title": "Frango Desfiado com Batata-Doce",
            "category": [
                "janta",
                "frango",
                "batata"
            ],
            "source": "Receitas de Janta Leve (Opção 3)",
            "emoji": "🍠",
            "ingredients": [
                {
                    "name": "Frango cozido e desfiado",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Batatas-doces médias em cubos",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite de oliva, sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe os cubos de batata-doce em água fervente com uma pitada de sal até ficarem macios.",
                "Em uma frigideira grande, doure a cebola e alho no azeite.",
                "Adicione o frango desfiado e tempere com sal e pimenta.",
                "Adicione a batata-doce cozida e escorrida à frigideira e salteie delicadamente para misturar os sabores.",
                "Finalize salpicando cheiro-verde e sirva."
            ],
            "tips": "Combinação clássica 'maromba', excelente refeição pré ou pós-treino noturno!",
            "image": null
        },
        {
            "id": 63,
            "title": "Tapioca de Frango com Queijo",
            "category": [
                "janta",
                "lanches",
                "frango"
            ],
            "source": "Receitas de Janta Leve (Opção 4)",
            "emoji": "🌮",
            "ingredients": [
                {
                    "name": "Goma de tapioca hidratada",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Frango cozido, desfiado e temperado",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo ralado ou fatiado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Tomate em cubinhos e orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Peneire e espalhe a goma de tapioca cobrindo o fundo de uma frigideira fria.",
                "Leve ao fogo baixo e deixe unir as partículas até firmar. Vire o lado.",
                "Coloque o queijo, o frango desfiado temperado, o tomate e o orégano em uma das metades.",
                "Dobre a tapioca ao meio, abafe por 30 segundos para o queijo derreter e sirva quente."
            ],
            "tips": "Substituto leve e sem glúten para o pão no jantar. Pronta em 15 minutos!",
            "image": null
        },
        {
            "id": 64,
            "title": "Creme de Mandioca com Calabresa",
            "category": "janta",
            "source": "Receitas de Janta Leve (Opção 5)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Mandioca (aipim) limpa",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe a mandioca na panela de pressão até ficar desmanchando. Remova as fibras centrais.",
                "Bata no liquidificador com um pouco da própria água de cozimento quente até virar um creme aveludado e reserve.",
                "Em uma panela, frite a calabresa e refogue com alho e cebola.",
                "Despeje o creme de mandioca na panela de refogado, tempere e ferva em fogo brando por 10 minutos.",
                "Sirva com cheiro-verde."
            ],
            "tips": "Creme denso e extremamente saboroso que confere imensa saciedade.",
            "image": null
        },
        {
            "id": 65,
            "title": "Salada Quente de Grão-de-Bico",
            "category": "janta",
            "source": "Receitas de Janta Leve (Opção 6)",
            "emoji": "🥗",
            "ingredients": [
                {
                    "name": "Grão-de-bico cozido",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Abobrinha pequena picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola-roxa fatiada",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite, sal, limão, pimenta e salsinha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela ou frigideira com azeite, refogue a cebola-roxa.",
                "Adicione a cenoura e a abobrinha cortadas em cubos pequenos e refogue-as até estarem macias.",
                "Adicione o grão-de-bico cozido, mexa e aqueça por 3 minutos.",
                "Tempere fora do fogo com sal, limão fresco, azeite extra virgem, pimenta e salsinha."
            ],
            "tips": "Refeição saudável, rica em fibras e proteínas vegetais, excelente digestibilidade noturna.",
            "image": null
        },
        {
            "id": 66,
            "title": "Panqueca de Aveia com Ricota e Espinafre",
            "category": [
                "janta",
                "lanches"
            ],
            "source": "Receitas de Janta Leve (Opção 7)",
            "emoji": "🥞",
            "ingredients": [
                {
                    "name": "Aveia em flocos finos",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Ovos",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Leite",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Ricota amassada",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Espinafre cozido e picado",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Sal, pimenta e molho de tomate",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Manteiga para untar",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Bata no liquidificador a aveia, os ovos, o leite e uma pitada de sal até virar uma massa líquida de panqueca.",
                "Em uma frigideira antiaderente levemente untada, monte discos de massa finos e cozinhe de ambos os lados.",
                "Misture a ricota com o espinafre refogado e tempere.",
                "Recheie as panquecas, enrole-as, disponha em uma travessa e cubra com molho de tomate quente. Leve ao forno rápido por 10 minutos."
            ],
            "tips": "Receita leve e de baixo índice glicêmico para auxiliar no bem-estar noturno!",
            "image": null
        },
        {
            "id": 67,
            "title": "Risoto Prático de Legumes",
            "category": [
                "janta",
                "arroz"
            ],
            "source": "Receitas de Janta Leve (Opção 8)",
            "emoji": "🍚",
            "ingredients": [
                {
                    "name": "Arroz arbóreo",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Cebola picadinha",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura pequena em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Abobrinha pequena em cubos",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Ervilhas frescas",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Caldo de legumes fervente",
                    "qty": 4,
                    "unit": "xícaras"
                },
                {
                    "name": "Azeite de oliva, sal, pimenta e parmesão",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o azeite de oliva em uma panela e doure a cebola picadinha.",
                "Adicione o arroz arbóreo e mexa por 1 minuto para selar os grãos.",
                "Vá regando com o caldo de legumes quente de concha em concha, mexendo sempre à medida que o arroz absorve.",
                "Quando o arroz estiver no meio do cozimento, incorpore a cenoura, abobrinha e ervilhas.",
                "Continue mexendo até ficar macio e cremoso. Finalize desligando o fogo, jogando queijo parmesão ralado e mexendo vigorosamente."
            ],
            "tips": "O segredo do risoto perfeito está em mexer constantemente para liberar o amido do arroz, criando o próprio creme!",
            "image": null
        },
        {
            "id": 68,
            "title": "Filé de Peixe Assado com Legumes",
            "category": [
                "janta",
                "peixe"
            ],
            "source": "Receitas de Janta Leve (Opção 9)",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de peixe (tilápia ou merluza)",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Batata em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Brócolis cortado em buquês",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Alho picado, limão, azeite, sal, pimenta e ervas",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés de peixe com o alho picado, limão, sal, pimenta e ervas.",
                "Em uma assadeira refratária untada, monte uma cama com rodelas de batatas, cenouras e os buquês de brócolis.",
                "Coloque o peixe por cima dos vegetais e regue com um bom fio de azeite.",
                "Asse em forno pré-aquecido a 200°C por cerca de 25 a 30 minutos."
            ],
            "tips": "Uma janta ideal, equilibrada, livre de gorduras pesadas e com digestão fantástica para garantir uma boa noite de sono!",
            "image": null
        },
        {
            "id": 69,
            "title": "Caldo Verde Tradicional",
            "category": "sopas",
            "source": "Caldo Verde Especial",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Batatas médias",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Linguiça calabresa em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Couve fatiada bem fina",
                    "qty": 1,
                    "unit": "maço"
                },
                {
                    "name": "Água",
                    "qty": 1,
                    "unit": "litro"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe as batatas descascadas com a cebola, o alho e o sal na água até ficarem bem macias.",
                "Bata as batatas cozidas junto com a água do cozimento no liquidificador para formar um creme liso.",
                "Em outra panela, frite a calabresa em rodelas até dourar.",
                "Despeje o creme de batatas na panela com a calabresa, misture bem e deixe ferver por 5 minutos.",
                "Adicione a couve fatiada e apague o fogo para que ela cozinhe apenas com o calor do caldo. Finalize com cheiro-verde."
            ],
            "tips": "A couve adicionada no final mantém sua cor verde brilhante e textura crocante perfeita!",
            "image": "69.png"
        },
        {
            "id": 70,
            "title": "Caldo de Mandioca Cremoso",
            "category": "sopas",
            "source": "Caldos de Inverno",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Mandioca (aipim) limpa",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Água de cozimento",
                    "qty": 1,
                    "unit": "litro"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe a mandioca na água com um pouco de sal até ficar desmanchando.",
                "Retire os fiapos centrais da mandioca e bata os pedaços no liquidificador com a água quente do cozimento até virar um creme homogêneo.",
                "Em uma panela grande, refogue o alho e cebola e frite bem os cubos de calabresa.",
                "Adicione o creme de mandioca, ajuste o sal e pimenta e cozinhe em fogo brando por mais 10 minutos para apurar o sabor.",
                "Finalize salpicando bastante cheiro-verde fresco."
            ],
            "tips": "Sirva acompanhado de torradas regadas com azeite de oliva e alho.",
            "image": "70.png"
        },
        {
            "id": 71,
            "title": "Caldo de Kenga de Milho",
            "category": "sopas",
            "source": "Caldos e Sopas Fortes",
            "emoji": "🌽",
            "ingredients": [
                {
                    "name": "Peito de frango cozido e desfiado",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Espigas de milho fresco (ou lata)",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Água",
                    "qty": 1,
                    "unit": "litro"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Sal, páprica e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o milho e bata-o no liquidificador com a água para obter um creme rústico de milho. Coe se preferir uma consistência super aveludada.",
                "Em uma panela grande, aqueça um fio de óleo e doure o alho e a cebola.",
                "Adicione o peito de frango cozido e desfiado, temperando com sal e bastante páprica.",
                "Despeje o creme de milho e deixe cozinhar em fogo brando, mexendo sempre, por cerca de 10 a 15 minutos até reduzir.",
                "Desligue o fogo, misture o creme de leite e finalize salpicando cheiro-verde fresco."
            ],
            "tips": "A páprica defumada adiciona uma complexidade de sabor incrível que contrasta perfeitamente com o adocicado do milho.",
            "image": null
        },
        {
            "id": 72,
            "title": "Molho Rosé de Tomate",
            "category": "molhos",
            "source": "6 Molhos para Macarrão (Card 1)",
            "emoji": "🍅",
            "ingredients": [
                {
                    "name": "Molho de tomate de boa qualidade",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Creme de leite fresco ou caixinha",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Orégano fresco ou desidratado",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça o azeite em uma panela e doure levemente o alho e a cebola.",
                "Adicione o molho de tomate, abaixe o fogo e cozinhe por 5 minutos até começar a apurar.",
                "Adicione o creme de leite aos poucos, misturando constantemente em fogo mínimo.",
                "Tempere a gosto com sal, pimenta-do-reino e orégano e sirva quente com sua massa preferida."
            ],
            "tips": "Combina perfeitamente com massas recheadas de queijo como ravióli ou capeletti.",
            "image": "72.png"
        },
        {
            "id": 73,
            "title": "Molho de Tomate Rústico Caseiro",
            "category": "molhos",
            "source": "6 Molhos para Macarrão (Card 2)",
            "emoji": "🍅",
            "ingredients": [
                {
                    "name": "Tomates maduros picados",
                    "qty": 1,
                    "unit": "kg"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Folhas frescas de manjericão",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela grande, refogue a cebola e o alho picados no azeite quente.",
                "Adicione todos os tomates picados com sementes e pele para um molho rústico e autêntico.",
                "Abaixe o fogo, tampe parcialmente e deixe cozinhar por cerca de 30 a 40 minutos, mexendo ocasionalmente, até que os tomates se desmanchem e incorporem.",
                "Ajuste o sal, a pimenta-do-reino e adicione folhas de manjericão fresco minutos antes de desligar."
            ],
            "tips": "Se preferir um molho liso de pizzaria, passe o molho pronto por uma peneira ou bata no liquidificador.",
            "image": "73.png"
        },
        {
            "id": 74,
            "title": "Molho de Carne Moída",
            "category": "molhos",
            "source": "6 Molhos para Macarrão (Card 3)",
            "emoji": "🧀",
            "ingredients": [
                {
                    "name": "Manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Farinha de trigo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Leite morno",
                    "qty": 500,
                    "unit": "ml"
                },
                {
                    "name": "Queijo muçarela ralado",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo parmesão ralado",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal e noz-moscada",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, derreta a manteiga e adicione a farinha de trigo, mexendo ativamente por 1 minuto para cozinhar o trigo.",
                "Adicione o leite morno aos poucos, mexendo vigorosamente com um batedor de arame (fouet) para não empelotar.",
                "Deixe o creme ferver e engrossar levemente em fogo baixo.",
                "Incorpore o queijo muçarela e o parmesão, mexendo até derreterem completamente.",
                "Finalize temperando com sal e uma pitada sutil de noz-moscada ralada."
            ],
            "tips": "Sirva imediatamente, pois molhos à base de queijo tendem a engrossar rápido ao esfriar!",
            "image": "74.png"
        },
        {
            "id": 75,
            "title": "Molho Branco Cremoso (Béchamel)",
            "category": "molhos",
            "source": "6 Molhos para Macarrão (Card 4)",
            "emoji": "🥛",
            "ingredients": [
                {
                    "name": "Manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Farinha de trigo",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Leite",
                    "qty": 500,
                    "unit": "ml"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Sal, noz-moscada e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Derreta a manteiga e mexa a farinha de trigo até criar uma pastinha dourada.",
                "Adicione o leite aos poucos, mexendo constantemente.",
                "Cozinhe em fogo baixo até obter um molho encorpado e liso.",
                "Desligue o fogo, misture a caixinha de creme de leite e tempere a gosto com sal, pimenta-do-reino e noz-moscada."
            ],
            "tips": "Dica clássica: Para um toque profissional de sabor, cozinhe o leite com meia cebola cravejada com uma folha de louro antes de montar o molho!",
            "image": "75.png"
        },
        {
            "id": 76,
            "title": "Molho Clássico à Bolonhesa",
            "category": "molhos",
            "source": "6 Molhos para Macarrão (Card 5)",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Carne moída",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho amassados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Molho de tomate",
                    "qty": 1,
                    "unit": "lata"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma panela, aqueça o azeite e doure o alho e a cebola picados.",
                "Adicione a carne moída e refogue bem até que ela fique sequinha e solta.",
                "Despeje o molho de tomate por cima da carne e misture.",
                "Cozinhe em fogo baixo com tampa por 15 minutos até engrossar de forma homogênea.",
                "Adicione sal, pimenta e finalize salpicando cheiro-verde fresco."
            ],
            "tips": "Excelente base para lasanhas de queijo e presunto ou espaguete tradicional!",
            "image": "76.png"
        },
        {
            "id": 77,
            "title": "Molho de Queijo Aveludado",
            "category": "molhos",
            "source": "6 Molhos para Macarrão (Card 6)",
            "emoji": "🧄",
            "ingredients": [
                {
                    "name": "Manteiga de boa qualidade",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Dentes de alho fatiados ou amassados",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Queijo parmesão ralado",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal e pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Salsinha fresca picada",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça a manteiga e o azeite juntos em fogo médio para baixo (o azeite evita que a manteiga queime).",
                "Adicione o alho picado e cozinhe lentamente até que fiquem dourados e exalem aroma (cuidado para não queimar e amargar).",
                "Adicione uma colher de água quente do cozimento da massa para criar uma emulsão leve.",
                "Retire do fogo, jogue a massa quente diretamente no molho e polvilhe o parmesão e a salsinha fresca."
            ],
            "tips": "A simplicidade desse molho italiano clássico brilha imensamente quando finalizado com raspas de limão siciliano!",
            "image": "77.png"
        },
        {
            "id": 78,
            "title": "Caldo de Feijão Reconfortante",
            "category": "sopas",
            "source": "Receitas para Dias Frios (Opção 1)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Feijão cozido (com caldo)",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Bacon picadinho",
                    "qty": 100,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Bata o feijão cozido no liquidificador com um pouco de água até virar um caldo liso.",
                "Em uma panela, frite o bacon e a calabresa fatiada.",
                "Adicione o alho amassado e refogue até dourar.",
                "Despeje o feijão batido na panela, tempere a gosto e cozinhe por 15 minutos até engrossar e encorpar sabor."
            ],
            "tips": "Sirva bem quente com croutons e gotas de pimenta.",
            "image": null
        },
        {
            "id": 79,
            "title": "Sopa de Legumes Clássica",
            "category": "sopas",
            "source": "Receitas para Dias Frios (Opção 2)",
            "emoji": "🥦",
            "ingredients": [
                {
                    "name": "Peito de frango cozido e desfiado",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Batata picadinha",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cenoura cortada em cubinhos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Chuchu cortado pequeno",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Refogue a cebola e o alho no azeite até murcharem.",
                "Adicione os legumes cortados finos e cubra com água fervente.",
                "Cozinhe em fogo médio até que todos os legumes estejam bem macios.",
                "Incorpore o frango cozido e desfiado, tempere com sal e pimenta e ferva por mais 5 minutos antes de servir."
            ],
            "tips": "Se preferir uma sopa mais espessa, amasse alguns pedaços de batata direto no caldo.",
            "image": null
        },
        {
            "id": 80,
            "title": "Polenta Cremosa com Carne Moída",
            "category": "janta",
            "source": "Receitas para Dias Frios (Opção 3)",
            "emoji": "🌽",
            "ingredients": [
                {
                    "name": "Fubá pré-cozido",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Água morna",
                    "qty": 4,
                    "unit": "xícaras"
                },
                {
                    "name": "Carne moída",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Sachê de molho de tomate",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal e azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Faça a polenta: ferva a água com um pouco de sal, acrescente o fubá aos poucos em fio constante, mexendo sem parar para não empelotar até engrossar.",
                "Em outra panela, refogue a carne moída no azeite com o alho e cebola.",
                "Adicione o molho de tomate à carne e deixe apurar.",
                "Monte colocando a polenta cremosa no fundo da travessa e despejando a carne com molho por cima."
            ],
            "tips": "Adicione duas colheres de creme de leite ou requeijão na polenta cozida para um toque extra aveludado.",
            "image": "80.png"
        },
        {
            "id": 81,
            "title": "Escondidinho de Batata com Carne",
            "category": "janta",
            "source": "Receitas para Dias Frios (Opção 4)",
            "emoji": "🥔",
            "ingredients": [
                {
                    "name": "Batatas descascadas",
                    "qty": 1,
                    "unit": "kg"
                },
                {
                    "name": "Carne moída refogada",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Cebola e alho picados",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Molho de tomate",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo ralado ou fatiado",
                    "qty": null,
                    "unit": "para gratinar"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe as batatas até que amoleçam por completo. Amasse-as bem, misturando com sal e um pouco de leite para dar ponto de purê macio.",
                "Refogue a carne com o alho, cebola, temperos e o molho de tomate.",
                "Em um refratário médio, faça camadas de purê de batatas no fundo, a carne refogada no meio e o restante do purê no topo.",
                "Polvilhe queijo generosamente e leve ao forno pré-aquecido a 200°C por 20 minutos para gratinar."
            ],
            "tips": "Pode ser feito também substituindo a batata por mandioca ou abóbora cabotiá!",
            "image": null
        },
        {
            "id": 82,
            "title": "Creme de Milho Aconchegante",
            "category": "refogados",
            "source": "Receitas para Dias Frios (Opção 5)",
            "emoji": "🌽",
            "ingredients": [
                {
                    "name": "Latas de milho verde (escorridas)",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Leite integral",
                    "qty": 500,
                    "unit": "ml"
                },
                {
                    "name": "Manteiga",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cebola ralada",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta-do-reino e noz-moscada",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "No liquidificador, bata o milho escorrido com o leite até obter uma mistura homogênea.",
                "Passe por uma peneira para remover as casquinhas (opcional, dependendo do gosto pessoal).",
                "Em uma panela, derreta a manteiga e refogue a cebola ralada rápida.",
                "Adicione o líquido batido e cozinhe em fogo baixo mexendo sempre até engrossar saborosamente. Tempere."
            ],
            "tips": "Sirva acompanhado de arroz e frango grelhado de domingo.",
            "image": null
        },
        {
            "id": 83,
            "title": "Chocolate Quente Cremoso",
            "category": "lanches",
            "source": "Receitas para Dias Frios (Opção 6)",
            "emoji": "☕",
            "ingredients": [
                {
                    "name": "Leite integral",
                    "qty": 500,
                    "unit": "ml"
                },
                {
                    "name": "Chocolate em pó de qualidade",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Amido de milho (maizena)",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Açúcar",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Essência de baunilha",
                    "qty": 0.5,
                    "unit": "colher (chá, opcional)"
                }
            ],
            "steps": [
                "Em uma leiteira fria, dissolva o amido de milho e o chocolate em pó em um pouco de leite.",
                "Adicione o restante do leite e o açúcar.",
                "Leve ao fogo médio, mexendo constantemente para não criar grumos, até ferver e engrossar de forma aveludada.",
                "Apague o fogo, misture a baunilha e sirva imediatamente em canecas."
            ],
            "tips": "Se quiser ainda mais cremosidade, adicione um quadradinho de chocolate meio amargo no final para derreter!",
            "image": null
        },
        {
            "id": 84,
            "title": "Caldo de Mandioca com Calabresa",
            "category": "sopas",
            "source": "Receitas para Dias Frios (Opção 7)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Mandioca descascada",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe a mandioca até ficar macia. Bata no liquidificador com parte da água morna de cozimento.",
                "Frite a calabresa em cubos ou rodelas finas em uma panela com cebola e alho.",
                "Junte o creme batido à panela de calabresa.",
                "Deixe ferver por 10 minutos para apurar o sal e finalize salpicando cheiro-verde."
            ],
            "tips": "Delicioso prato único para noites frias de outono.",
            "image": null
        },
        {
            "id": 85,
            "title": "Canja de Galinha Tradicional",
            "category": "sopas",
            "source": "Receitas para Dias Frios (Opção 8)",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Peito de frango cozido e desfiado",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Arroz agulhinha lavado",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Cenoura picada em cubinhos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Refogue o alho e a cebola no azeite.",
                "Adicione o frango e a cenoura picadinha, misturando.",
                "Adicione o arroz e cubra com 1,5 litros de água fervente.",
                "Deixe cozinhar em fogo baixo até que o arroz e a cenoura estejam completamente macios.",
                "Tempere com sal e pimenta e finalize com cheiro-verde."
            ],
            "tips": "Comida afetiva perfeita para combater resfriados e confortar o corpo!",
            "image": null
        },
        {
            "id": 86,
            "title": "Frango Grelhado Saudável",
            "category": [
                "almoco",
                "frango",
                "arroz"
            ],
            "source": "Receitas de Almoço (Card 1)",
            "emoji": "🍱",
            "ingredients": [
                {
                    "name": "Filés de peito de frango",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Arroz",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Cenoura em tiras",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Abobrinha em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, alho e azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés de frango com sal, alho e azeite.",
                "Grelhe os filés em uma frigideira bem quente até dourar.",
                "Cozinhe o arroz tradicionalmente.",
                "Refogue a cenoura e abobrinha rapidamente em azeite com alho.",
                "Sirva o frango com arroz e legumes coloridos."
            ],
            "tips": "Excelente opção fitness e balanceada.",
            "image": "86.png"
        },
        {
            "id": 87,
            "title": "Carne de Panela com Batatas",
            "category": [
                "almoco",
                "bife",
                "batata"
            ],
            "source": "Receitas de Almoço (Card 2)",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Carne bovina em cubos (acém, paleta)",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Batatas médias cortadas",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Sal, pimenta e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Doure a carne na panela com alho e cebola fatiados.",
                "Acrescente água fervente até cobrir, tempere e cozinhe tampado até amaciar.",
                "Adicione as batatas cortadas e deixe cozinhar no próprio caldo até ficarem macias.",
                "Finalize salpicando cheiro-verde fresco antes de servir."
            ],
            "tips": "Cozinhar em fogo brando encorpa muito o caldo!",
            "image": "87.png"
        },
        {
            "id": 88,
            "title": "Arroz de Forno com Frango Desfiado",
            "category": [
                "almoco",
                "arroz",
                "frango"
            ],
            "source": "Receitas de Almoço (Card 3)",
            "emoji": "🍛",
            "ingredients": [
                {
                    "name": "Arroz cozido",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Frango cozido e desfiado",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Lata de milho verde (escorrido)",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Requeijão cremoso",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo ralado ou fatiado",
                    "qty": null,
                    "unit": "para cobrir"
                }
            ],
            "steps": [
                "Misture o arroz cozido, o frango desfiado, o milho e o requeijão em uma travessa.",
                "Transfira a mistura para um refratário levemente untado.",
                "Cubra totalmente com queijo ralado ou muçarela fatiada.",
                "Leve ao forno a 200°C por 15 minutos até dourar e gratinar."
            ],
            "tips": "Se sobrou arroz da janta anterior, essa receita é ideal para dar vida nova a ele!",
            "image": "88.png"
        },
        {
            "id": 89,
            "title": "Strogonoff de Frango Expresso",
            "category": [
                "almoco",
                "frango"
            ],
            "source": "Receitas de Almoço (Card 4)",
            "emoji": "🍛",
            "ingredients": [
                {
                    "name": "Peito de frango em tiras",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Ketchup",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Sal, mostarda e batata palha",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Refogue o frango com a cebola em fogo alto.",
                "Adicione ketchup, uma colher de mostarda e sal, misturando.",
                "Cozinhe o frango completamente até reduzir o líquido de cozimento.",
                "Desligue o fogo e incorpore o creme de leite.",
                "Sirva com arroz branco soltinho e batata palha por cima."
            ],
            "tips": "Prato preferido das crianças de preparo extremamente rápido!",
            "image": "89.png"
        },
        {
            "id": 90,
            "title": "Feijão Tropeiro com Carne Seca",
            "category": [
                "almoco",
                "feijao"
            ],
            "source": "Receitas de Almoço (Card 5)",
            "emoji": "🥓",
            "ingredients": [
                {
                    "name": "Feijão cozido (escorrido e firme)",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Carne seca dessalgada e desfiada",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Ovos",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Farinha de mandioca e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Frite a calabresa na panela, acrescente a carne seca desfiada e doure.",
                "Adicione o feijão e misture bem por 2 minutos.",
                "Adicione os ovos fritos mexidos em cubos.",
                "Adicione a farinha de mandioca aos poucos, mexendo para não secar demais, e jogue cheiro-verde fresco."
            ],
            "tips": "Delicioso se servido com couve refogada no alho ao lado!",
            "image": "90.png"
        },
        {
            "id": 91,
            "title": "Escondidinho de Batata com Carne Moída",
            "category": [
                "almoco",
                "bife",
                "batata"
            ],
            "source": "Receitas de Almoço (Card 6)",
            "emoji": "🥧",
            "ingredients": [
                {
                    "name": "Carne moída",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Cebola picada e dentes de alho",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Batatas descascadas",
                    "qty": 1,
                    "unit": "kg"
                },
                {
                    "name": "Leite",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo ralado",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe as batatas e faça o purê adicionando leite e sal.",
                "Refogue a carne moída com alho, cebola e temperos de preferência.",
                "Monte refratários em camadas de carne moída por baixo e purê de batatas por cima.",
                "Polvilhe queijo e leve ao forno para gratinar."
            ],
            "tips": "Coloque uma colher de azeite por cima para que o queijo gratine de forma uniforme.",
            "image": "91.png"
        },
        {
            "id": 92,
            "title": "Peixe Assado com Batatas",
            "category": [
                "almoco",
                "peixe",
                "batata"
            ],
            "source": "Receitas de Almoço (Card 7)",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de peixe",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Batatas fatiadas",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola em rodelas",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, pimenta e azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere o peixe com suco de limão, sal e pimenta.",
                "Em um refratário untado, disponha fatias de batata cruas, cebola em rodelas e os filés por cima.",
                "Regue abundantemente com azeite de oliva extra virgem.",
                "Asse em forno médio por cerca de 35 a 40 minutos até que as batatas estejam tenras."
            ],
            "tips": "Cobrir com papel alumínio nos primeiros 20 minutos de cozimento agiliza o processo.",
            "image": "92.png"
        },
        {
            "id": 93,
            "title": "Macarrão Prático à Bolonhesa",
            "category": [
                "almoco",
                "macarrao"
            ],
            "source": "Receitas de Almoço (Card 8)",
            "emoji": "🍝",
            "ingredients": [
                {
                    "name": "Macarrão de sua escolha",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Carne moída",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Cebola e dentes de alho picados",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Sachê de molho de tomate",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal, orégano e queijo ralado",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o macarrão em água abundante salgada até ficar al dente.",
                "Frite a carne moída com cebola e alho.",
                "Adicione o molho de tomate e tempere com sal e orégano.",
                "Escorra a massa e envolva ao molho bolonhesa quentinho, servindo salpicado de parmesão."
            ],
            "tips": "Prato único para quem busca praticidade sem abrir mão de sabor clássico.",
            "image": "93.png"
        },
        {
            "id": 94,
            "title": "Frango ao Creme com Arroz e Salada",
            "category": [
                "almoco",
                "frango",
                "arroz"
            ],
            "source": "Receitas de Almoço (Card 9)",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Filés de peito de frango",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Creme de leite",
                    "qty": 1,
                    "unit": "caixinha"
                },
                {
                    "name": "Arroz e salada",
                    "qty": null,
                    "unit": "para acompanhar"
                }
            ],
            "steps": [
                "Tempere os filés e doure na frigideira com azeite.",
                "Refogue a cebola e alho na mesma panela.",
                "Acrescente o creme de leite e deixe ferver por 5 minutos tampado.",
                "Sirva o frango com arroz soltinho e salada verde de folhas."
            ],
            "tips": "Delicioso se salpicado de sementes de girassol tostadas na salada!",
            "image": "94.png"
        },
        {
            "id": 95,
            "title": "Misto Quente Tradicional",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 1)",
            "emoji": "🥪",
            "ingredients": [
                {
                    "name": "Pão de forma fatiado",
                    "qty": 2,
                    "unit": "fatias"
                },
                {
                    "name": "Presunto fatiado",
                    "qty": 2,
                    "unit": "fatias"
                },
                {
                    "name": "Queijo fatiado",
                    "qty": 2,
                    "unit": "fatias"
                },
                {
                    "name": "Manteiga ou requeijão",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Passe manteiga ou requeijão no pão de forma.",
                "Monte fatias de presunto e queijo muçarela no meio.",
                "Feche o sanduíche.",
                "Leve à sanduicheira ou doure na frigideira até o queijo derreter completamente."
            ],
            "tips": "Lanche clássico e reconfortante perfeito para tardes frias com café.",
            "image": "95.png"
        },
        {
            "id": 96,
            "title": "Tapioca de Frango com Queijo",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 2)",
            "emoji": "🌮",
            "ingredients": [
                {
                    "name": "Goma de tapioca",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Frango cozido e desfiado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Queijo muçarela",
                    "qty": 1,
                    "unit": "fatia"
                },
                {
                    "name": "Orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Espalhe a goma de tapioca peneirada cobrindo o fundo de uma frigideira média fria.",
                "Leve ao fogo baixo até que se unam os grânulos e vire.",
                "Recheie com o frango cozido e desfiado temperado, a fatia de queijo e orégano.",
                "Dobre ao meio e espere derreter."
            ],
            "tips": "Substituto leve e sem glúten para o jantar ou lanche pós-treino rápido.",
            "image": "96.png"
        },
        {
            "id": 97,
            "title": "Pão na Frigideira com Ovo",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 3)",
            "emoji": "🍞",
            "ingredients": [
                {
                    "name": "Fatias de pão (de fôrma ou francês)",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Ovo fresco",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Leite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Presunto e queijo fatiados",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Sal e orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Bata o ovo com o leite, uma pitada de sal e orégano em um prato fundo.",
                "Passe as fatias de pão nessa mistura umedecendo levemente.",
                "Recheie com presunto e queijo fatiados.",
                "Leve à frigideira quente untada com manteiga, dourando de ambos os lados até gratinar."
            ],
            "tips": "Receita clássica francesa (Pain Perdu) na versão salgada e deliciosa.",
            "image": "97.png"
        },
        {
            "id": 98,
            "title": "Omelete de Caneca de Micro-ondas",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 4)",
            "emoji": "🍳",
            "ingredients": [
                {
                    "name": "Ovo",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Leite",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Presunto picado",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Queijo ralado",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Sal e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Bata o ovo vigorosamente com o leite direto na caneca.",
                "Adicione o presunto picado, o queijo ralado, sal e cheiro-verde fatiado.",
                "Despeje em uma caneca untada com fio de azeite.",
                "Leve ao micro-ondas por 2 a 3 minutos na potência máxima."
            ],
            "tips": "Lanche rápido e proteico perfeito para quem tem pressa!",
            "image": "98.png"
        },
        {
            "id": 99,
            "title": "Sanduíche Natural de Frango",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 5)",
            "emoji": "🥪",
            "ingredients": [
                {
                    "name": "Pão integral fatiado",
                    "qty": 2,
                    "unit": "fatias"
                },
                {
                    "name": "Frango cozido e desfiado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Folha de alface lisa",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Fatias de tomate fresco",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cenoura ralada",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Requeijão light ou maionese light",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Passe o requeijão light nas fatias de pão integral.",
                "Monte adicionando o frango desfiado, as rodelas de tomate, alface e a cenoura ralada.",
                "Feche o sanduíche e sirva geladinho."
            ],
            "tips": "Lanche fresco excelente para transportar para o trabalho.",
            "image": "99.png"
        },
        {
            "id": 100,
            "title": "Pão de Queijo Recheado",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 6)",
            "emoji": "🥯",
            "ingredients": [
                {
                    "name": "Pães de queijo prontos",
                    "qty": 6,
                    "unit": "unidades"
                },
                {
                    "name": "Presunto fatiado",
                    "qty": 3,
                    "unit": "fatias"
                },
                {
                    "name": "Queijo fatiado",
                    "qty": 3,
                    "unit": "fatias"
                }
            ],
            "steps": [
                "Corte os pães de queijo ao meio.",
                "Recheie com presunto e queijo fatiados de forma proporcional.",
                "Leve ao forno quente ou airfryer por 5 minutos até derreter o queijo e aquecer os pães."
            ],
            "tips": "Especialmente saboroso se feito na hora do café da tarde!",
            "image": "100.png"
        },
        {
            "id": 101,
            "title": "Crepioca Proteica",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 7)",
            "emoji": "🥞",
            "ingredients": [
                {
                    "name": "Ovo",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Goma de tapioca",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Pitada de sal",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Recheio (queijo, tomate, presunto, frango)",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em um prato, bata bem o ovo com o sal e incorpore a goma de tapioca até homogeneizar.",
                "Despeje em uma frigideira antiaderente morna e doure de ambos os lados.",
                "Recheie com seu ingrediente favorito (queijo e frango, por exemplo), dobre e sirva."
            ],
            "tips": "Receita de lanche saudável que dá muita saciedade e energia.",
            "image": "101.png"
        },
        {
            "id": 102,
            "title": "Vitamina de Frutas Energética",
            "category": "lanches",
            "source": "Receitas de Lanches Práticos (Card 8)",
            "emoji": "🍓",
            "ingredients": [
                {
                    "name": "Banana prata fatiada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Maçã fatiada sem sementes",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Leite ou iogurte natural desnatado",
                    "qty": 1,
                    "unit": "copo"
                },
                {
                    "name": "Aveia em flocos",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Mel de abelha",
                    "qty": null,
                    "unit": "opcional"
                }
            ],
            "steps": [
                "Adicione todos os ingredientes fatiados no copo do liquidificador.",
                "Bata vigorosamente por 2 minutos até obter consistência cremosa.",
                "Sirva bem geladinho."
            ],
            "tips": "Perfeito para substituir café da manhã ou reforçar lanches da manhã antes do trabalho!",
            "image": "102.png"
        },
        {
            "id": 103,
            "title": "Wrap de Frango com Atum",
            "category": [
                "lanches",
                "frango",
                "peixe"
            ],
            "source": "Receitas de Lanches Práticos (Card 9)",
            "emoji": "🌯",
            "ingredients": [
                {
                    "name": "Tortilha de trigo (Rap10)",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Frango cozido desfiado (ou atum em lata)",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Folha de alface",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate em cubinhos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Requeijão ou maionese",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Espalhe o requeijão por toda a superfície da tortilha integral aquecida.",
                "Adicione a proteína escolhida (frango ou atum escorrido), a alface picada e tomate.",
                "Enrole apertado como um rocambole fatiando no meio para facilitar a mordida."
            ],
            "tips": "Uma delícia saudável de baixa caloria.",
            "image": "103.png"
        },
        {
            "id": 104,
            "title": "Cubo de Caldo de Frango Caseiro",
            "category": "temperos",
            "source": "Cubos de Caldo Caseiros",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Frango (ossos ou carne)",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cenoura",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cebola",
                    "qty": null,
                    "unit": "unidade"
                },
                {
                    "name": "Alho",
                    "qty": null,
                    "unit": "dentes"
                },
                {
                    "name": "Ervas e Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o frango com os vegetais, ervas e sal em fogo baixo por algumas horas para extrair o máximo de sabor.",
                "Reduza o caldo até ficar concentrado, descarte os ossos e bata tudo no liquidificador até formar uma pasta.",
                "Distribua em formas de gelo e leve ao congelador até firmar.",
                "Ideal para usar em sopas, arroz e pratos leves do dia a dia."
            ],
            "tips": "Desenforme os cubos congelados e guarde-os em um saco hermético no freezer para facilitar o uso!",
            "image": "104.png"
        },
        {
            "id": 105,
            "title": "Cubo de Caldo de Carne Caseiro",
            "category": "temperos",
            "source": "Cubos de Caldo Caseiros",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Carne bovina",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Aipo (Salsão)",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cebola",
                    "qty": null,
                    "unit": "unidade"
                },
                {
                    "name": "Alho",
                    "qty": null,
                    "unit": "dentes"
                },
                {
                    "name": "Ervas e Especiarias",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Prepare um cozimento longo da carne com aipo, cebola, alho e suas especiarias favoritas.",
                "Processe o conteúdo concentrado até obter uma textura pastosa e uniforme.",
                "Preencha forminhas de gelo com a mistura e congele.",
                "Excelente para encorpar molhos escuros e pratos com sabor mais intenso."
            ],
            "tips": "Substitui com extrema vantagem à saúde os tabletes industrializados carregados de sódio.",
            "image": "105.png"
        },
        {
            "id": 106,
            "title": "Cubo de Caldo de Peixe Caseiro",
            "category": "temperos",
            "source": "Cubos de Caldo Caseiros",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Espinhas de peixe ou cabeças limpas",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Alho",
                    "qty": null,
                    "unit": "dentes"
                },
                {
                    "name": "Cebola",
                    "qty": null,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate",
                    "qty": null,
                    "unit": "unidade"
                },
                {
                    "name": "Ervas frescas",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Faça uma fervura rápida (cerca de 30 a 40 minutos) das espinhas de peixe com tomate, cebola, alho e ervas.",
                "Coe o líquido para remover totalmente quaisquer espinhas e resíduos sólidos.",
                "Reduza o líquido filtrado no fogo e despeje em fôrmas para congelamento.",
                "Perfeito como base rica para sopas de frutos do mar, risotos e mariscos."
            ],
            "tips": "Caldo de peixe não deve ferver por horas como o de carne para não amargar; 30 minutos bastam.",
            "image": "106.png"
        },
        {
            "id": 107,
            "title": "Cubo de Caldo de Legumes Caseiro",
            "category": "temperos",
            "source": "Cubos de Caldo Caseiros",
            "emoji": "🥦",
            "ingredients": [
                {
                    "name": "Cenoura",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Alho",
                    "qty": null,
                    "unit": "dentes"
                },
                {
                    "name": "Tomate",
                    "qty": null,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola",
                    "qty": null,
                    "unit": "unidade"
                },
                {
                    "name": "Ervas e Azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Pique os legumes e refogue-os levemente no azeite de oliva antes de adicionar água.",
                "Cozinhe até que fiquem macios e bata tudo no liquidificador até obter um purê denso.",
                "Disponha nas fôrmas de gelo e congele.",
                "Uma opção leve, versátil e balanceada para qualquer tipo de preparação culinária."
            ],
            "tips": "Você pode aproveitar talos de brócolis, folhas de salsão e cascas de cebola bem lavadas para essa receita.",
            "image": "107.png"
        },
        {
            "id": 108,
            "title": "Omelete Completa de Frigideira",
            "category": "lanches",
            "source": "Receitas de Pratos Rápidos (Opção 1)",
            "emoji": "🍳",
            "ingredients": [
                {
                    "name": "Ovos",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Tomate picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Queijo ralado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal e Orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Bata bem os ovos em um bowl pequeno.",
                "Misture o tomate picado, o queijo ralado e os temperos.",
                "Despeje toda a mistura em uma frigideira antiaderente untada e aquecida.",
                "Cozinhe em fogo baixo por 3 a 5 minutos de cada lado até dourar e firmar."
            ],
            "tips": "Pronto em apenas 10 minutos! Uma refeição rápida e rica em proteínas.",
            "image": null
        },
        {
            "id": 109,
            "title": "Macarrão Alho e Óleo Expresso",
            "category": "macarrao",
            "source": "Receitas de Pratos Rápidos (Opção 2)",
            "emoji": "🍝",
            "ingredients": [
                {
                    "name": "Macarrão (espaguete ou outro)",
                    "qty": 250,
                    "unit": "g"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Cozinhe o macarrão em água fervente salgada até o ponto al dente.",
                "Enquanto isso, doure o alho picadinho no azeite em fogo baixo para não queimar.",
                "Misture a massa escorrida diretamente na frigideira com o azeite de alho.",
                "Incorpore bem e sirva quente."
            ],
            "tips": "Adicione uma pitada de pimenta calabresa seca junto ao alho para uma versão Alho, Óleo e Pimenta clássica.",
            "image": null
        },
        {
            "id": 110,
            "title": "Frango Grelhado Vapt-Vupt",
            "category": "frango",
            "source": "Receitas de Pratos Rápidos (Opção 3)",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Filés de peito de frango",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Alho picado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Limão",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés de frango com o sal, o alho e o suco de limão.",
                "Deixe a carne descansar por 5 minutos para fixar os sabores.",
                "Grelhe em uma frigideira antiaderente bem quente por cerca de 8 minutos de cada lado, até dourar uniformemente."
            ],
            "tips": "Fica perfeito se combinado com arroz integral e ovos cozidos para ganho de massa muscular magra!",
            "image": null
        },
        {
            "id": 111,
            "title": "Arroz de Panela Única com Calabresa",
            "category": "arroz",
            "source": "Receitas de Pratos Rápidos (Opção 4)",
            "emoji": "🥘",
            "ingredients": [
                {
                    "name": "Arroz agulhinha",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Linguiça calabresa picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Tomate picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Água quente",
                    "qty": 2,
                    "unit": "xícaras"
                }
            ],
            "steps": [
                "Em uma panela, refogue a linguiça picada em sua própria gordura até dourar.",
                "Adicione o tomate picado e o arroz seco, refogando bem por 1 minuto.",
                "Acrescente a água quente e ajuste o sal.",
                "Cozinhe em fogo brando com a tampa entreaberta até secar a água por completo."
            ],
            "tips": "Refeição completa pronta em 20 minutos com apenas uma panela para lavar.",
            "image": null
        },
        {
            "id": 112,
            "title": "Sanduíche Quente Especial",
            "category": "lanches",
            "source": "Receitas de Pratos Rápidos (Opção 5)",
            "emoji": "🥪",
            "ingredients": [
                {
                    "name": "Fatias de pão de sua escolha",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Presunto fatiado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Queijo fatiado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Tomate em rodelas",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Monte o sanduíche intercalando o presunto, o queijo e as rodelas de tomate fresco.",
                "Leve à sanduicheira ou doure em uma frigideira quente com um pouco de manteiga.",
                "Aqueça até o pão ficar crocante e o queijo derreter por completo."
            ],
            "tips": "Pronto em 5 minutos, o tomate quebra a gordura do queijo e traz frescor.",
            "image": null
        },
        {
            "id": 113,
            "title": "Tapioca Prática de Frango",
            "category": "lanches",
            "source": "Receitas de Pratos Rápidos (Opção 6)",
            "emoji": "🌮",
            "ingredients": [
                {
                    "name": "Goma de tapioca hidratada",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Queijo de sua preferência",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Frango desfiado (ou presunto)",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Espalhe a goma de tapioca uniformemente em uma frigideira antiaderente fria e leve ao fogo baixo até firmar a massa.",
                "Assim que a base se unir, adicione o queijo e o frango desfiado temperado sobre uma das metades.",
                "Dobre a massa ao meio e sirva quente."
            ],
            "tips": "Excelente opção rápida de lanche ou café da manhã fit.",
            "image": null
        },
        {
            "id": 114,
            "title": "Arroz com Ovo e Legumes Salteados",
            "category": "arroz",
            "source": "Receitas de Pratos Rápidos (Opção 7)",
            "emoji": "🍚",
            "ingredients": [
                {
                    "name": "Arroz cozido",
                    "qty": 2,
                    "unit": "xícaras"
                },
                {
                    "name": "Ovos",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cenoura ralada",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Milho verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma frigideira grande, refogue rapidamente a cenoura ralada e o milho.",
                "Acrescente os ovos diretamente na frigideira e mexa até que fiquem cozidos em pedaços.",
                "Adicione o arroz cozido frio, misture tudo e aqueça bem."
            ],
            "tips": "Ótima receita de 15 minutos para reaproveitar as sobras de arroz da geladeira!",
            "image": null
        },
        {
            "id": 115,
            "title": "Carne Acebolada de Frigideira",
            "category": "bife",
            "source": "Receitas de Pratos Rápidos (Opção 8)",
            "emoji": "🥩",
            "ingredients": [
                {
                    "name": "Carne bovina em tiras",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Cebola grande cortada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Sal e Pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Aqueça bem uma frigideira com um fio de óleo e doure as tiras de carne rapidamente.",
                "Adicione a cebola fatiada na panela junto com os sucos da carne.",
                "Refogue em fogo médio por mais 5 minutos até a cebola murchar e caramelizar levemente."
            ],
            "tips": "Use cores rápidos como patinho, alcatra ou contrafilé para manter a suculência.",
            "image": null
        },
        {
            "id": 116,
            "title": "Molho Vinagrete Clássico",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🥗",
            "ingredients": [
                {
                    "name": "Tomate, cebola-roxa e salsinha picados",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Vinagre de vinho tinto e Limão",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Sal e Pimenta",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Pique o tomate, a cebola e a salsinha em cubos bem pequenos e uniformes.",
                "Em um frasco ou pote de vidro, junte o azeite, o vinagre e o suco de limão.",
                "Tempere com sal e pimenta, feche o frasco e agite vigorosamente até emulsionar."
            ],
            "tips": "Excelente para saladas de folhas duras, churrasco ou para acompanhar feijão.",
            "image": "116.png"
        },
        {
            "id": 117,
            "title": "Molho de Limão com Ervas Finas",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🍋",
            "ingredients": [
                {
                    "name": "Azeite e Suco de limão",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Orégano, tomilho e alecrim secos",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Sal e Pimenta-do-reino",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Misture o suco de limão fresco com o azeite de oliva.",
                "Adicione as ervas secas trituradas (orégano, tomilho e alecrim).",
                "Ajuste com sal e pimenta, batendo com um garfo até obter um molho homogêneo."
            ],
            "tips": "Muito refrescante, combina perfeitamente com saladas verdes e peixes grelhados.",
            "image": "117.png"
        },
        {
            "id": 118,
            "title": "Molho Deusa Verde (Green Goddess)",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🌱",
            "ingredients": [
                {
                    "name": "Iogurte natural integral",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Salsinha, coentro e hortelã picados",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Coloque o iogurte natural, o suco de limão e o azeite no liquidificador ou mini-processador.",
                "Adicione as ervas frescas limpas (salsinha, coentro e hortelã).",
                "Bata tudo até obter um molho de consistência cremosa e coloração verde uniforme. Ajuste o sal."
            ],
            "tips": "Cremoso, leve e com baixas calorias, excelente substituto para molhos à base de maionese pesada.",
            "image": "118.png"
        },
        {
            "id": 119,
            "title": "Molho de Tahine e Aloo",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Tahine (pasta de gergelim)",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Suco de limão",
                    "qty": 0.5,
                    "unit": "unidade"
                },
                {
                    "name": "Dente de alho picado",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Água morna",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em uma tigela pequena, coloque a pasta de tahine e o alho picadinho.",
                "Adicione o suco de limão (a mistura vai engrossar e clarear inicialmente).",
                "Vá adicionando a água morna aos poucos, mexendo sempre até atingir uma consistência fluida de molho. Finalize com sal."
            ],
            "tips": "Clássico da culinária árabe, fica excelente em saladas de tomate, pepino ou grão-de-bico.",
            "image": "119.png"
        },
        {
            "id": 120,
            "title": "Molho de Maracujá e Mostarda",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🥝",
            "ingredients": [
                {
                    "name": "Polpa de maracujá fresco (com sementes)",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Mostarda Dijon ou amarela",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Suco de limão",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Extraia a polpa do maracujá e coloque em um bowl pequeno.",
                "Adicione a mostarda, o suco de limão e o azeite de oliva.",
                "Bata vigorosamente com um garfo ou fouet pequeno até emulsionar e tempere com sal."
            ],
            "tips": "O contraste entre a acidez frutada do maracujá e a picância da mostarda é perfeito para saladas tropicais.",
            "image": "120.png"
        },
        {
            "id": 121,
            "title": "Molho de Gergelim e Gengibre Asiático",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🥢",
            "ingredients": [
                {
                    "name": "Molho Shoyu",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Vinagre de arroz",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Óleo de gergelim",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Gengibre fresco ralado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Suco de laranja e Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Em um recipiente, combine o molho shoyu, o vinagre de arroz e o óleo de gergelim.",
                "Adicione o gengibre fresco ralado na hora e um toque de suco de laranja.",
                "Misture tudo muito bem até unificar os líquidos e tempere com sal se achar necessário."
            ],
            "tips": "Traz o perfil clássico de sabor oriental (umami), combinando muito bem com saladas de repolho ou acelga.",
            "image": "121.png"
        },
        {
            "id": 122,
            "title": "Molho Cremoso de Iogurte e Hortelã",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🌿",
            "ingredients": [
                {
                    "name": "Iogurte natural integral",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Folhas de hortelã fresca picadas",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Suco de limão",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Pique finamente as folhas de hortelã fresca.",
                "Em um bowl, junte o iogurte, a hortelã picada, o suco de limão e o azeite.",
                "Misture bem com uma colher e tempere com uma pitada de sal."
            ],
            "tips": "Extremamente refrescante para os dias quentes, combina muito com saladas contendo pepino e mix de folhas.",
            "image": "122.png"
        },
        {
            "id": 123,
            "title": "Molho Citrus de Laranja e Gengibre",
            "category": "molhos",
            "source": "Molhos para Salada",
            "emoji": "🍊",
            "ingredients": [
                {
                    "name": "Suco de laranja fresca",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Gengibre ralado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Pimenta-do-reino e Sal",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Esprema o suco de uma laranja e coloque em um potinho de vidro.",
                "Adicione o azeite de oliva e o gengibre fresco ralado fininho.",
                "Tempere com sal e pimenta-do-reino, feche o pote e agite bem para homogeneizar."
            ],
            "tips": "O adocicado cítrico da laranja harmoniza lindamente com saladas que levam frango desfiado ou cenoura.",
            "image": "123.png"
        },
        {
            "id": 124,
            "title": "Tilápia Assada com Legumes",
            "category": "peixe",
            "source": "Receitas de Peixes Saudáveis",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de tilápia",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Batatas em rodelas (cozidas por 10 min)",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Cebola, tomate e pimentão em tiras/rodelas",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Sal, pimenta-do-reino e orégano",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés de tilápia com o limão, alho, sal, pimenta, orégano e azeite. Deixe marinar por 20 minutos.",
                "Em uma assadeira untada, faça uma cama com as rodelas de batatas pré-cozidas, cebola, tomate e pimentão.",
                "Disponha os filés temperados por cima dos vegetais e regue com o restante da marinada.",
                "Leve ao forno preaquecido a 200°C por cerca de 30 minutos até o peixe assar por completo."
            ],
            "tips": "Para um toque especial de chef, finalize salpicando cheiro-verde fresco e raspas de limão ao sair do forno!",
            "image": "124.png"
        },
        {
            "id": 125,
            "title": "Peixe ao Molho de Limão Gourmet",
            "category": "peixe",
            "source": "Receitas de Peixes Saudáveis",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de peixe (merluza, pescada ou robalo)",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limões",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Raspas de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Manteiga",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Vinho branco seco",
                    "qty": 0.5,
                    "unit": "xícara (opcional)"
                },
                {
                    "name": "Sal, pimenta-do-reino e cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés com sal, pimenta, metade do alho e suco de limão. Deixe marinar por 15 minutos.",
                "Em uma frigideira grande, derreta a manteiga e doure os filés dos dois lados até ficarem firmes e cozidos. Retire e reserve.",
                "Na mesma frigideira, adicione o restante do alho, o vinho branco e deixe reduzir pela metade.",
                "Acrescente o restante do suco de limão e as raspas, voltando os filés para a frigideira por mais 2 minutos.",
                "Finalize com cheiro-verde picado e sirva."
            ],
            "tips": "Molho sofisticado e aveludado que fica delicioso se servido com purê de batatas ou arroz com brócolis.",
            "image": "125.png"
        },
        {
            "id": 126,
            "title": "Moqueca de Peixe com Leite de Coco",
            "category": "peixe",
            "source": "Receitas de Peixes Saudáveis",
            "emoji": "🥘",
            "ingredients": [
                {
                    "name": "Peixe em postas (cação, badejo ou robalo)",
                    "qty": 600,
                    "unit": "g"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola, tomate e pimentão vermelho/amarelo em rodelas/tiras",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Leite de coco",
                    "qty": 1,
                    "unit": "vidro (200 ml)"
                },
                {
                    "name": "Azeite de dendê",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta-do-reino e coentro",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere as postas de peixe com limão, alho, sal e pimenta. Deixe marinar por 20 minutos.",
                "Em uma panela grande, monte camadas com os ingredientes: cebola, pimentões, tomate e o peixe.",
                "Regue tudo uniformemente com o azeite de dendê e o leite de coco.",
                "Cozinhe em fogo baixo com a panela tampada por cerca de 20 minutos (evite mexer para não quebrar o peixe). Finalize com coentro."
            ],
            "tips": "Dica tradicional: Sirva bem quente acompanhado de um pirão feito com o próprio caldo da moqueca e farinha de mandioca!",
            "image": "126.png"
        },
        {
            "id": 127,
            "title": "Peixe Empanado Assado Crocante",
            "category": "peixe",
            "source": "Receitas de Peixes Saudáveis",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Filés de peixe",
                    "qty": 4,
                    "unit": "unidades"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Farinha de trigo",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Ovo batido",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Farinha de rosca",
                    "qty": 1,
                    "unit": "xícara"
                },
                {
                    "name": "Queijo parmesão ralado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal, pimenta-do-reino e azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere os filés de peixe com o suco de limão, sal e pimenta-do-reino.",
                "Passe cada filé na farinha de trigo, depois no ovo batido e por último na mistura de farinha de rosca com queijo parmesão.",
                "Disponha os filés em uma assadeira untada ou forrada com papel manteiga.",
                "Pincele ou regue com um fio de azeite por cima e leve ao forno a 200°C por cerca de 25 minutos ou até dourar."
            ],
            "tips": "Para uma crocância ainda mais potente e estilo restaurante, substitua a farinha de rosca tradicional por farinha panko!",
            "image": null
        },
        {
            "id": 128,
            "title": "Caldinho de Peixe Cremoso",
            "category": "sopas",
            "source": "Receitas de Peixes Saudáveis",
            "emoji": "🥣",
            "ingredients": [
                {
                    "name": "Peixe em cubos ou espinhas para caldo",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Cebola picada",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Dentes de alho picados",
                    "qty": 2,
                    "unit": "unidades"
                },
                {
                    "name": "Tomate e cenoura em cubos",
                    "qty": 1,
                    "unit": "unidade de cada"
                },
                {
                    "name": "Batata em cubos",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Água (ou caldo de peixe)",
                    "qty": 1,
                    "unit": "litro"
                },
                {
                    "name": "Sal, pimenta, cheiro-verde e azeite",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Tempere o peixe com suco de limão, sal e pimenta. Reserve.",
                "Em uma panela grande, refogue a cebola e o alho no azeite.",
                "Acrescente o tomate, a batata e a cenoura e refogue por 3 minutos.",
                "Junte a água (ou caldo) e deixe cozinhar em fogo médio até que os legumes fiquem macios.",
                "Adicione os cubos de peixe e cozinhe por mais 10 minutos.",
                "Acerte o sal, adicione pimenta a gosto e finalize com cheiro-verde. Sirva quente com torradas."
            ],
            "tips": "Pode ser servido rústico em pedaços ou batido no liquidificador antes de adicionar o cheiro-verde para virar um creme homogêneo.",
            "image": "128.png"
        },
        {
            "id": 129,
            "title": "Tempero Caseiro Completo",
            "category": "temperos",
            "source": "Temperos Práticos de Semana",
            "emoji": "🧄",
            "ingredients": [
                {
                    "name": "Cabeças de alho limpas",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Cebola média",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Suco de limão",
                    "qty": 1,
                    "unit": "unidade"
                },
                {
                    "name": "Azeite de oliva",
                    "qty": 0.5,
                    "unit": "xícara"
                },
                {
                    "name": "Sal refinado",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Páprica doce e Açafrão",
                    "qty": 1,
                    "unit": "colher (chá) de cada"
                },
                {
                    "name": "Cheiro-verde",
                    "qty": null,
                    "unit": "a gosto"
                }
            ],
            "steps": [
                "Descasque os alhos e corte a cebola em pedaços médios.",
                "No liquidificador ou processador de alimentos, junte o alho, a cebola, o azeite e o suco de limão.",
                "Adicione o sal, a páprica doce, o açafrão (cúrcuma) e o cheiro-verde.",
                "Bata tudo até formar uma pasta cremosa e homogênea.",
                "Transfira para um pote de vidro limpo com tampa e conserve sob refrigeração na geladeira."
            ],
            "tips": "Ideal para temperar de forma ultra rápida frango, peixe e arroz durante a semana corrida. Use pequenas porções.",
            "image": "129.png"
        },
        {
            "id": 130,
            "title": "Sal de Ervas Secas Funcional",
            "category": "temperos",
            "source": "Temperos Práticos de Semana",
            "emoji": "🌿",
            "ingredients": [
                {
                    "name": "Sal grosso",
                    "qty": 1,
                    "unit": "copo"
                },
                {
                    "name": "Manjericão, sálvia e alecrim secos",
                    "qty": 1,
                    "unit": "colher (sopa) de cada"
                },
                {
                    "name": "Orégano e coentro secos",
                    "qty": 1,
                    "unit": "colher (sopa) de cada"
                },
                {
                    "name": "Cominho e açafrão em pó",
                    "qty": 1,
                    "unit": "colher (sopa) de cada"
                },
                {
                    "name": "Páprica doce",
                    "qty": 1,
                    "unit": "colher (sopa)"
                }
            ],
            "steps": [
                "Certifique-se de que todas as ervas utilizadas estejam completamente secas/desidratadas.",
                "Coloque o sal grosso e todas as ervas e especiarias no copo do liquidificador.",
                "Triture na função pulsar até que o sal grosso quebre e se misture uniformemente com as ervas, formando um pó fino.",
                "Armazene em potes de vidro bem vedados em local seco e arejado."
            ],
            "tips": "Excelente estratégia para reduzir o consumo de sódio no dia a dia, pois as ervas intensificam o sabor salgado natural dos alimentos.",
            "image": "130.png"
        },
        {
            "id": 131,
            "title": "O Verdadeiro Sal de Ouro Aromático",
            "category": "temperos",
            "source": "Temperos Saudáveis e Funcionais",
            "emoji": "✨",
            "ingredients": [
                {
                    "name": "Sal grosso",
                    "qty": 500,
                    "unit": "g"
                },
                {
                    "name": "Folhas de louro",
                    "qty": 5,
                    "unit": "unidades"
                },
                {
                    "name": "Ramos de manjericão (com talo)",
                    "qty": 5,
                    "unit": "unidades"
                },
                {
                    "name": "Cúrcuma (açafrão-da-terra) em pó",
                    "qty": 0.5,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Pimenta-do-reino em grãos ou pó",
                    "qty": 0.5,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Linhaça dourada",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Alecrim seco",
                    "qty": 1,
                    "unit": "colher (sopa)"
                }
            ],
            "steps": [
                "Coloque o sal grosso, as folhas de louro, os ramos de manjericão e o alecrim no processador ou liquidificador.",
                "Adicione a cúrcuma, a pimenta-do-reino e as sementes de linhaça dourada.",
                "Bata tudo até atingir a consistência de um pó fino, aromático e amarelado.",
                "Guarde em um pote de vidro bem fechado, fora da geladeira."
            ],
            "tips": "Super funcional, a linhaça traz gorduras boas e a cúrcuma age como um potente antioxidente natural. Dura de 15 dias a 3 meses se bem vedado!",
            "image": "131.png"
        },
        {
            "id": 132,
            "title": "Sazón Carne Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🥩",
            "image": "132.png",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Páprica defumada",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Tomate em pó (Segredo Umami)",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cacau 100% em pó + cominho (Toque do Chef)",
                    "qty": null,
                    "unit": "uma pitada"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Misture o alho, a cebola, a páprica defumada, o tomate em pó e o amido de milho em uma tigela.",
                "Adicione uma pitada sutil de cacau 100% e cominho para cor terrosa e profundidade.",
                "Agite muito bem dentro de um pote hermético seco.",
                "Guarde bem fechado."
            ],
            "tips": "O tomate em pó é rico em ácido glutâmico natural (MSG saudável), que realça o sabor da carne instantaneamente!"
        },
        {
            "id": 133,
            "title": "Sazón Frango Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🍗",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Mix Pega Marido",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cúrcuma (açafrão-da-terra)",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Levedura Nutricional (Segredo Umami)",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Gengibre em pó + mostarda em pó (Toque do Chef)",
                    "qty": null,
                    "unit": "uma pitada"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Combine o alho em pó, a cebola em pó, o Pega Marido e a cúrcuma.",
                "Incorpore a levedura nutricional, o gengibre, a mostarda e o amido de milho.",
                "Agite bem no pote até homogeneizar o pó amarelo solar."
            ],
            "tips": "A levedura nutricional traz aquele sabor clássico e viciante de 'caldo de galinha de vó'.",
            "image": null
        },
        {
            "id": 134,
            "title": "Sazón Alho Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🧄",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 5,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 3,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Chimichurri desidratado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Sal refinado de alta qualidade",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Combine todos os ingredientes finos em pó.",
                "Passe o chimichurri seco rapidamente por um moedor de café se preferir flocos menores.",
                "Misture com o amido e guarde em pote vedado."
            ],
            "tips": "Perfeito para pães de alho, arroz rápido, batatas e ensopados.",
            "image": null
        },
        {
            "id": 135,
            "title": "Sazón Limão Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🍋",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Lemon Pepper de alta qualidade",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Raspas de limão siciliano desidratadas e moídas",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Ácido cítrico em pó (Toque Cítrico Vibrante)",
                    "qty": 1,
                    "unit": "colher (café)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Combine os pós finos e a colher de ácido cítrico.",
                "Misture as raspas de limão siciliano desidratadas para aromas essenciais reais.",
                "Agite energicamente e vede."
            ],
            "tips": "O ácido cítrico de grau culinário faz o sabor vibrar nas papilas gustativas, imitando a acidez industrial.",
            "image": null
        },
        {
            "id": 136,
            "title": "Sazón Legumes Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🌽",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Salsa desidratada bem fina",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cúrcuma",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cenoura em pó + Levedura Nutricional",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Misture o alho, cebola, salsa e açafrão.",
                "Incorpore a levedura nutricional e cenoura em pó para um perfil de caldo de vegetais.",
                "Finalize com o amido de milho e agite bem."
            ],
            "tips": "Maravilhoso sobre legumes no vapor, purês e sopas leves.",
            "image": null
        },
        {
            "id": 137,
            "title": "Sazón Saladas Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🥗",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Manjericão desidratado moído",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Orégano seco",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Ácido cítrico em pó + gergelim tostado",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Triture as ervas levemente para misturarem de forma uniforme no alho e cebola.",
                "Adicione uma pitada de ácido cítrico para o efeito vinagrete instantâneo e o gergelim para crocância.",
                "Guarde em vidro bem vedado."
            ],
            "tips": "Polvilhe diretamente sobre tomates fatiados, folhas verdes ou misture no azeite.",
            "image": null
        },
        {
            "id": 138,
            "title": "Sazón Feijão Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🫘",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Louro moído em pó fino",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Páprica defumada",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Fumaça em pó (Pó de fumaça condensada)",
                    "qty": 1,
                    "unit": "colher (café)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Misture o alho, cebola, louro e páprica.",
                "Incorpore o pó sutil de fumaça e o amido.",
                "Agite muito bem e vede."
            ],
            "tips": "A fumaça em pó dá aquele toque clássico de bacon de fazenda, mesmo que seja um feijão totalmente vegetariano!",
            "image": null
        },
        {
            "id": 139,
            "title": "Sazón Nordeste Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🌵",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Coentro em pó",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Cominho em pó",
                    "qty": 0.5,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Colorau",
                    "qty": 0.5,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Pimenta-de-cheiro desidratada ou pimenta-do-reino branca",
                    "qty": null,
                    "unit": "uma pitada"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Adicione o colorau, cominho, coentro, alho e cebola no frasco.",
                "Acrescente a pimenta aromática e o amido de milho.",
                "Misture bem até obter um tom avermelhado terroso característico."
            ],
            "tips": "Traz a ardência aromática típica da culinária nordestina sem queimar excessivamente a boca.",
            "image": null
        },
        {
            "id": 140,
            "title": "Sazón Arroz Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🍚",
            "ingredients": [
                {
                    "name": "Alho em pó (Protagonista absoluto)",
                    "qty": 6,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó (Reduzida)",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cúrcuma (açafrão-da-terra)",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Ajuste na proporção: 3 partes de alho para 1 de cebola.",
                "Misture com o açafrão-da-terra para um arroz solar perfumado.",
                "Adicione o amido de milho e agite bem."
            ],
            "tips": "No arroz brasileiro, o alho deve reinar. Reduzir a cebola evita que o arroz fique adocicado.",
            "image": null
        },
        {
            "id": 141,
            "title": "Sazón Massas Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🍝",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Orégano + Manjericão desidratado",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Páprica defumada",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Tomate em pó + Queijo parmesão ralado microfino",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Combine o alho, cebola, as ervas secas e a páprica.",
                "Agregue o tomate em pó e o parmesão microfino.",
                "Incorpore o amido de milho, agite e feche hermeticamente."
            ],
            "tips": "Cria um molho marinara ou pomodoro express instantâneo incrivelmente saboroso direto no prato!",
            "image": null
        },
        {
            "id": 142,
            "title": "Sazón Peixes Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🐟",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Lemon Pepper",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Páprica defumada + Salsa desidratada",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Semente de coentro moída (Aroma cítrico herbal)",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Adicione as sementes de coentro moídas, ricas em notas cítricas.",
                "Misture com os demais temperos secos, a salsa e o amido de milho.",
                "Armazene vedado."
            ],
            "tips": "O aroma cítrico da semente de coentro é o par absoluto e clássico para pescados e frutos do mar.",
            "image": null
        },
        {
            "id": 143,
            "title": "Sazón Churrasco Caseiro",
            "category": "temperos",
            "source": "Sazons Funcionais Otimizados",
            "emoji": "🍖",
            "ingredients": [
                {
                    "name": "Alho em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Cebola em pó",
                    "qty": 4,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Páprica defumada",
                    "qty": 2,
                    "unit": "colheres (sopa)"
                },
                {
                    "name": "Pimenta-do-reino moída de boa qualidade",
                    "qty": 1,
                    "unit": "colher (sopa)"
                },
                {
                    "name": "Açúcar mascavo + Mostarda em pó (Efeito Dry Rub)",
                    "qty": 1,
                    "unit": "colher (chá)"
                },
                {
                    "name": "Amido de milho (Anti-empedramento)",
                    "qty": 1,
                    "unit": "colher (café)"
                }
            ],
            "steps": [
                "Misture o alho, cebola, páprica, pimenta preta.",
                "Adicione a pitada de mostarda e o açúcar mascavo.",
                "Integre com o amido e vede."
            ],
            "tips": "O açúcar mascavo carameliza sutilmente a gordura da carne na grelha sob fogo alto (Reação de Maillard).",
            "image": null
        },
        {
            "id": 144,
            "title": "Arroz Biro-Biro",
            "category": [
                "almoco",
                "arroz"
            ],
            "source": "Tudo Gostoso",
            "emoji": "🍚",
            "image": "144.png",
            "ingredients": [
                {
                    "name": "Arroz",
                    "qty": 3,
                    "unit": "xícaras (chá)"
                },
                {
                    "name": "Alho",
                    "qty": 2,
                    "unit": "dentes"
                },
                {
                    "name": "Cebola",
                    "qty": 1,
                    "unit": "unidade pequena"
                },
                {
                    "name": "Manteiga",
                    "qty": 1,
                    "unit": "colher de sopa"
                },
                {
                    "name": "Óleo",
                    "qty": 1,
                    "unit": "colher de sopa"
                },
                {
                    "name": "Sal",
                    "qty": null,
                    "unit": "a gosto"
                },
                {
                    "name": "Água quente",
                    "qty": null,
                    "unit": "o suficiente para cobrir"
                },
                {
                    "name": "Ovos",
                    "qty": 3,
                    "unit": "unidades"
                },
                {
                    "name": "Bacon picado",
                    "qty": 300,
                    "unit": "g"
                },
                {
                    "name": "Linguiça calabresa picada",
                    "qty": 100,
                    "unit": "g"
                },
                {
                    "name": "Batata palha",
                    "qty": 1,
                    "unit": "pacote"
                }
            ],
            "steps": [
                "Lave o arroz, escorra bem e reserve.",
                "Em uma panela, aqueça o óleo e refogue a cebola e o alho.",
                "Adicione o arroz e refogue bem. Despeje a água quente, tempere com sal e cozinhe em fogo médio até que o arroz fique macio e soltinho. Reserve.",
                "Em outra panela, frite o bacon picado em fogo médio até ficar bem dourado e crocante. Retire o bacon da panela e reserve.",
                "Na mesma gordura do bacon (ou retirando o excesso se preferir), frite os 3 ovos mexendo levemente para que fiquem em pedaços.",
                "Em uma travessa grande, misture delicadamente o arroz cozido, o bacon frito, os ovos e a batata palha.",
                "Sirva em seguida, enquanto a batata palha ainda está crocante."
            ],
            "tips": "Para garantir a máxima crocância, adicione a batata palha apenas na hora exata de servir. Acompanha perfeitamente carnes grelhadas ou churrasco."
        }
    ]
};

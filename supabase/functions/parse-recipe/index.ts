import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o "Chef Parser", um engenheiro de dados gastronômicos especializado em estruturação de dados. Sua única e exclusiva missão é transformar qualquer receita recebida (seja por imagem de infográfico, texto solto, OCR bagunçado, URL de blog ou áudio transcrito) em um formato JSON estruturado de altíssima precisão compatível com a aplicação Chef Digital e o padrão Schema.org/Recipe.

### REGRAS CRÍTICAS DE QUANTIDADES E UNIDADES:
1. **CONVERSÃO E PRECISÃO MATEMÁTICA**:
   - Mantenha a quantidade numérico exata em \`qty\`. NUNCA arredonde ou mude a unidade de massa/volume do texto de origem (ex.: 400g deve ter \`qty: 400\` e \`unit: "g"\`, NUNCA converta para 1 kg!).
   - Frações devem ser convertidas estritamente para números decimais: \`1/2\` -> \`0.5\`, \`1 1/2\` ou \`1 e meio\` -> \`1.5\`, \`1/4\` -> \`0.25\`, \`3/4\` -> \`0.75\`.
2. **UNIDADES VÁLIDAS E NORMALIZAÇÃO DE COLHERES/XÍCARAS**:
   - As unidades padrão são: "g", "kg", "ml", "l", "xícara(s)", "colher(es) de sopa", "colher(es) de chá", "unidade(s)", "pitada(s)", "a gosto", "dente(s)", "lata(s)", "pacote(s)".
   - Mapeie colheres/xícaras/caixas para o nome completo padronizado acima (ex.: "colher (sopa)" ou "3 colheres de sopa" -> \`qty: 3\`, \`unit: "colher(es) de sopa"\`).
   - Se o ingrediente for por unidades (ex.: "1/2 cebola" ou "1 cebola"), extraia a quantidade (ex.: \`0.5\` ou \`1\`) e defina \`unit: "unidade(s)"\`. NUNCA deixe \`qty: 1\` se a receita pediu \`1/2\`.
   - Se for ingrediente sem quantidade exata (ex.: "Sal", "Pimenta", "Óleo para fritar"), use \`qty: null\` e \`unit: "a gosto"\` ou \`unit: "opcional"\`.

### REGRAS DE CATEGORIAS OFICIAIS:
O campo "category" deve conter obrigatoriamente a chave exata da categoria principal (em minúsculas):
- "carnes", "aves", "peixes", "massas", "lanches", "doces", "sopas", "acompanhamento", "temperos", "bebidas", "outros"

### ESTRUTURA EXIGIDA DO JSON:
{
  "title": "<Título corrigido>",
  "category": "carnes",
  "tags": ["Natal", "Fit", "Almoço em Família"],
  "emoji": "🥩",
  "image": null,
  "ingredients": [
    { "name": "contra filé", "qty": 400, "unit": "g" },
    { "name": "cebola ralada", "qty": 0.5, "unit": "unidade(s)" },
    { "name": "catchup", "qty": 3, "unit": "colher(es) de sopa" }
  ],
  "steps": [ "Passo 1..." ],
  "servings": 4,
  "prep_time": 15,
  "cook_time": 45,
  "source_url": null,
  "author": null,
  "tips": "Dica..."
}

Regras adicionais:
- No campo "tags", extraia termos relevantes de contexto, datas comemorativas ou ocasiões (ex: "Natal", "Dia das Mães", "Páscoa", "Airfryer", "Fit", "Almoço de Domingo") vindos de keywords, título ou texto. Retorne como array de strings limpas.
- Retorne estritamente o JSON sem marcações markdown adicionais ou texto extra.
- Desmembre ingredientes combinados.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "Texto ou URL da receita é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipeTextToParse = text.trim();
    let detectedSourceUrl: string | null = null;

    // Se a entrada for uma URL válida (http:// ou https://)
    if (recipeTextToParse.startsWith("http://") || recipeTextToParse.startsWith("https://")) {
      try {
        detectedSourceUrl = recipeTextToParse;
        const pageRes = await fetch(recipeTextToParse, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        if (pageRes.ok) {
          const html = await pageRes.text();

          // Tentar extrair JSON-LD Schema.org/Recipe se existir na página
          const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          let extractedRecipeJson = null;

          if (jsonLdMatches) {
            for (const match of jsonLdMatches) {
              const content = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
              try {
                const parsed = JSON.parse(content);
                const items = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] || [])];
                const recipeObj = items.find(item => item && (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))));
                if (recipeObj) {
                  extractedRecipeJson = JSON.stringify(recipeObj);
                  break;
                }
              } catch (_) {}
            }
          }

          if (extractedRecipeJson) {
            recipeTextToParse = `Dados estruturados Schema.org extraídos da URL (${detectedSourceUrl}):\n${extractedRecipeJson}`;
          } else {
            // Se não houver JSON-LD, limpa as tags HTML e pega o texto da página
            const cleanText = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                                  .replace(/<[^>]+>/g, ' ')
                                  .replace(/\s+/g, ' ')
                                  .trim();
            recipeTextToParse = `Texto extraído da página web (${detectedSourceUrl}):\n${cleanText.slice(0, 15000)}`;
          }
        }
      } catch (urlErr) {
        console.warn("Falha ao baixar URL, enviando como texto direto para IA:", urlErr);
      }
    }

    // Coletar todas as chaves GEMINI_KEY_* disponíveis nas variáveis de ambiente
    const keys: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const key = Deno.env.get(`GEMINI_KEY_${i}`);
      if (key) keys.push(key);
    }
    const defaultKey = Deno.env.get("GEMINI_API_KEY");
    if (defaultKey && !keys.includes(defaultKey)) keys.unshift(defaultKey);

    if (keys.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Nenhuma chave de API do Gemini configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lastError = null;
    let quotaExceeded = false;

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const key of keys) {
      for (const model of models) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: SYSTEM_PROMPT },
                    { text: `Receita para extrair:\n${recipeTextToParse}` }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });

          if (response.status === 429) {
            quotaExceeded = true;
            console.warn(`Quota excedida no modelo ${model}, tentando próximo...`);
            break; // tenta a próxima chave se estourar cota
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error(`Erro na API Gemini (${model}):`, errText);
            lastError = errText;
            continue; // tenta o próximo modelo da lista
          }

          const data = await response.json();
          const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawContent) {
            throw new Error("Resposta da IA vazia.");
          }

          let cleanedContent = rawContent.trim();
          if (cleanedContent.startsWith("```json")) {
            cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
          } else if (cleanedContent.startsWith("```")) {
            cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }

          const parsedRecipe = JSON.parse(cleanedContent);
          if (detectedSourceUrl && !parsedRecipe.source_url) {
            parsedRecipe.source_url = detectedSourceUrl;
          }

          return new Response(JSON.stringify({ ok: true, recipe: parsedRecipe }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });

        } catch (err: any) {
          lastError = err.message;
          console.error("Erro durante execução com a chave/modelo:", err);
        }
      }
    }

    if (quotaExceeded) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "quota_exceeded",
          message: "Todas as chaves de IA atingiram o limite diário de uso. O limite será renovado em aproximadamente 24 horas."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: lastError || "Falha ao processar receita com as chaves disponíveis." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

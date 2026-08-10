import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o "Chef Parser", um engenheiro de dados gastronômicos especializado em estruturação de dados. Sua única e exclusiva missão é transformar qualquer receita recebida (seja por imagem de infográfico, texto solto, OCR bagunçado, URL de blog ou áudio transcrito) em um formato JSON estruturado de altíssima precisão compatível com a aplicação Chef Digital e o padrão Schema.org/Recipe.

### REGRAS DE CATEGORIAS OFICIAIS:
O campo "category" deve conter obrigatoriamente a chave exata da categoria principal (em minúsculas):
- "carnes", "aves", "peixes", "massas", "lanches", "doces", "sopas", "acompanhamento", "temperos", "bebidas", "outros"

### ESTRUTURA EXIGIDA DO JSON:
{
  "title": "<Título corrigido>",
  "category": "carnes",
  "emoji": "🥩",
  "image": null,
  "ingredients": [
    { "name": "ingrediente", "qty": 1.5, "unit": "g" }
  ],
  "steps": [ "Passo 1..." ],
  "servings": 4,
  "prep_time": 15,
  "cook_time": 45,
  "source_url": null,
  "author": null,
  "tips": "Dica..."
}

Regras:
- Retorne estritamente o JSON sem marcações markdown adicionais ou texto extra.
- Desmembre ingredientes combinados.
- Use null para quantidades "a gosto" ou "opcional".`;

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
      return new Response(JSON.stringify({ ok: false, error: "Texto da receita é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
                    { text: `Receita para extrair:\n${text}` }
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

          const parsedRecipe = JSON.parse(rawContent);

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

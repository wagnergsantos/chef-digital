# Chef Digital — Especificação de Contratos de API & Backend

Documentação técnica oficial dos contratos de integração, RPCs do Supabase, Edge Functions e persistência de dados do **Chef Digital**.

---

## 1. Edge Function: Parser de Receitas com IA (`parse-recipe`)

Responsável por extrair receitas a partir de textos brutos, URLs de sites gastronômicos (via HTML/Schema.org) ou imagens (OCR/Multimodal) utilizando modelos Google Gemini com fallback automático, *circuit breaker* e *exponential backoff*.

- **Endpoint:** `POST /functions/v1/parse-recipe`
- **Autenticação:** Header `Authorization: Bearer <SUPABASE_ANON_KEY | USER_TOKEN>`

### Payload de Entrada (Request Body)

```json
{
  "text": "Texto da receita ou URL pública (opcional se enviar imagem)",
  "image": {
    "data": "base64_string_sem_prefixo",
    "mimeType": "image/jpeg | image/png | image/webp"
  },
  "customPrompt": "Instruções adicionais personalizadas pelo usuário (opcional)"
}
```

### Resposta de Sucesso (`HTTP 200`)

```json
{
  "ok": true,
  "recipe": {
    "title": "Frango com Legumes Assados",
    "category": "carnes",
    "tags": ["Fit", "Almoço de Domingo", "Airfryer"],
    "emoji": "🍗",
    "image": null,
    "ingredients": [
      {
        "name": "peito de frango",
        "qty": 500,
        "unit": "g",
        "group_name": "Principal"
      },
      {
        "name": "cenoura",
        "qty": 2,
        "unit": "unidade(s)",
        "group_name": "Legumes"
      }
    ],
    "steps": [
      "Corte o frango em cubos e tempere com sal e pimenta.",
      "Asse por 30 minutos a 200°C."
    ],
    "servings": 4,
    "prep_time": 15,
    "cook_time": 30,
    "source_url": "https://exemplo.com/receita",
    "author": "Chef",
    "tips": "Adicione alecrim para realçar o aroma."
  }
}
```

### Respostas de Erro & Circuit Breaker

| Cenário | Status HTTP | Payload de Retorno |
|---|---|---|
| **Entrada Vazia / Inválida** | `400` | `{"ok": false, "error": "Texto, URL ou imagem da receita é obrigatório."}` |
| **Não Autorizado** | `401` | `{"ok": false, "error": "Não autorizado"}` |
| **Circuit Breaker Ativo** | `503` | `{"ok": false, "error": "circuit_breaker_open", "message": "Serviço temporariamente indisponível devido a múltiplas falhas. Tente novamente em X segundos."}` |
| **Limite de Quota Diária IA** | `200` | `{"ok": false, "error": "quota_exceeded", "message": "Todas as chaves de IA atingiram o limite diário..."}` |

---

## 2. Funções RPC do PostgreSQL (Supabase Database)

### 2.1 `salvar_receita`

Executa inserção ou atualização atômica de uma receita, incluindo seus ingredientes, passos de preparo e tags vinculadas.

- **Assinatura RPC:** `supabase.rpc('salvar_receita', payload)`

#### Payload JSON:
```json
{
  "p_id": 10,
  "p_title": "Bolo de Cenoura",
  "p_emoji": "🥕",
  "p_image": "https://<supabase-url>/storage/v1/object/public/recipe-images/recipe_10.webp",
  "p_tips": "Deixe esfriar antes de colocar a cobertura.",
  "p_servings": 8,
  "p_prep_time": 20,
  "p_cook_time": 40,
  "p_source_url": null,
  "p_author": "Chef Digital",
  "p_category_id": 3,
  "p_category_key": "doces",
  "p_tags": ["Café da Tarde", "Bolo"],
  "p_ingredientes": [
    {
      "name": "Cenoura",
      "qty": 3,
      "unit": "unidade(s)",
      "group_name": "Massa",
      "ordem": 0
    }
  ],
  "p_passos": [
    {
      "step_text": "Bata as cenouras no liquidificador com o óleo e ovos.",
      "ordem": 0
    }
  ]
}
```

- **Retorno:** `integer` (ID da receita criada ou atualizada).

---

### 2.2 `excluir_receita`

Remove atomicamente uma receita e todas as suas dependências em cascata (`ingredientes`, `passos`, `receita_tags`).

- **Assinatura RPC:** `supabase.rpc('excluir_receita', { p_id: 10 })`
- **Retorno:** `void`

---

## 3. Consultas REST Diretas (PostgREST / Supabase JS)

### 3.1 Listagem de Receitas para Grid Principal
```javascript
const { data, error } = await supabase
  .from('receitas')
  .select(`
    id, title, category_id, emoji, image, servings, prep_time, cook_time, source_url, author, tips,
    receita_tags (tags (key, label)),
    ingredientes (name, qty, unit, group_name, ordem),
    passos (step_text, ordem)
  `)
  .order('title');
```

### 3.2 Categorias Oficiais
```javascript
const { data } = await supabase
  .from('categorias')
  .select('*')
  .order('sort_order');
```

---

## 4. Supabase Storage: Bucket `recipe-images`

- **Bucket:** `recipe-images` (Público, `public: true`).
- **Formato Padrão:** WebP, qualidade 80, redimensionamento client-side máx 800px.
- **Cache-Control:** `31536000` (1 ano).
- **Convenção de Nomenclatura:** `recipe_<timestamp>_<random>.webp` (ou `recipe_<id>.webp` na migração inicial).
- **URL Pública:** `https://<projeto>.supabase.co/storage/v1/object/public/recipe-images/<nome_arquivo>.webp`

---

## 5. Persistência de Dados no Cliente (Offline-First)

| Armazenamento | Chave / Tabela | Finalidade |
|---|---|---|
| **LocalStorage** (`StorageRepository`) | `chef_digital_favorites` | Array de IDs de receitas favoritas |
| **LocalStorage** (`StorageRepository`) | `chef_digital_planned` | Objeto com dias da semana e receitas alocadas |
| **LocalStorage** (`StorageRepository`) | `chef_digital_shopping` | Lista de compras agrupada e consolidada |
| **LocalStorage** (`StorageRepository`) | `chef_digital_pantry` | Array de ingredientes da despensa |
| **LocalStorage** (`StorageRepository`) | `chef_digital_cooking_history` | Histórico de preparo (máx 20/receita, máx 100 total) |
| **IndexedDB** (`ChefDigitalDB`) | `sync_queue` | Fila offline de receitas para sincronização online |
| **Workbox Cache** (PWA SW) | `recipe-images-cache` | Cache runtime (`CacheFirst`, 30 dias) de fotos do Supabase Storage |

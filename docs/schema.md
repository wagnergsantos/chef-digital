# Schema de Receitas & Mapeamento Schema.org

Documentação oficial da estrutura JSON de receitas, ingredientes e equivalência com o padrão internacional **`Schema.org/Recipe`**.

---

## 📌 JSDoc do Objeto Receita

```javascript
/**
 * @typedef {Object} Ingredient
 * @property {string} name - Nome limpo do ingrediente (ex: "peito de frango em cubos")
 * @property {number|null} qty - Quantidade numérica pura (float/int), ou null se for a gosto/opcional
 * @property {string|null} unit - Unidade de medida (g, ml, xícaras, colher (chá), a gosto, opcional, unidades, etc.)
 * 
 * @typedef {Object} Recipe
 * @property {number|null} [id] - ID único sequencial no banco (ou null ao criar nova receita)
 * @property {string} title - Título da receita (equivalente ao `name` no Schema.org)
 * @property {string} category - Chave da categoria principal (ex: "carnes", "aves", "peixes", "massas", "lanches", "doces", "sopas", "acompanhamento")
 * @property {number|null} [category_id] - ID numérico da categoria cadastrada no banco
 * @property {string} emoji - Emoji representativo da receita (ex: "🍲", "🥩", "🍝")
 * @property {string|null} [image] - URL pública da imagem da receita (equivalente ao `image` no Schema.org)
 * @property {Ingredient[]} ingredients - Lista de ingredientes individuais e normalizados (equivalente ao `recipeIngredient`)
 * @property {string[]} steps - Modo de preparo passo a passo (equivalente ao `recipeInstructions` / `HowToStep`)
 * @property {number|null} [servings] - Quantidade de porções que a receita rende (equivalente ao `recipeYield`)
 * @property {string|null} [tips] - Dicas adicionais de preparo ou armazenamento (opcional)
 */
```

---

## 🌐 Tabela de Mapeamento: Chef Digital ↔ Schema.org/Recipe

| Campo Chef Digital | Propriedade `Schema.org/Recipe` | Descrição / Transformação |
|---|---|---|
| `title` | `name` | Nome oficial do prato. |
| `image` | `image` | URL pública da foto do prato. |
| `servings` | `recipeYield` | Porções produzidas (ex: `4` ou `"4 porções"`). |
| `ingredients` | `recipeIngredient` | Array de strings brutas no Schema.org `["500g de frango"]` desmembrado para objetos `{ name, qty, unit }`. |
| `steps` | `recipeInstructions` | Array de instruções `["Passo 1...", "Passo 2..."]` ou lista de objetos `HowToStep.text`. |
| `tips` | `description` / `comment` | Dica complementar ou descrição sucinta da receita. |

---

## 📋 JSON Schema (Validativo)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Recipe",
  "type": "object",
  "required": ["title", "category", "emoji", "ingredients", "steps"],
  "properties": {
    "id": { "type": ["integer", "null"] },
    "title": { "type": "string" },
    "category": { "type": "string" },
    "category_id": { "type": ["integer", "null"] },
    "emoji": { "type": "string" },
    "image": { "type": ["string", "null"] },
    "ingredients": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "qty", "unit"],
        "properties": {
          "name": { "type": "string" },
          "qty": { "type": ["number", "null"] },
          "unit": { "type": ["string", "null"] }
        }
      }
    },
    "steps": {
      "type": "array",
      "items": { "type": "string" }
    },
    "servings": { "type": ["integer", "null"] },
    "tips": { "type": ["string", "null"] }
  }
}
```


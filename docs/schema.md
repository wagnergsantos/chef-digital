# Schema de Receitas

Documentação oficial da estrutura JSON de receitas e ingredientes utilizada no projeto.

## JSDoc do Objeto Receita

```javascript
/**
 * @typedef {Object} Ingredient
 * @property {string} name - Nome do ingrediente (ex: "peito de frango em cubos")
 * @property {number|null} qty - Quantidade numérica, ou null se for a gosto/opcional
 * @property {string} unit - Unidade de medida (g, ml, xícaras, a gosto, opcional, unidades, fatias, etc.)
 * 
 * @typedef {Object} Recipe
 * @property {number} id - ID único sequencial da receita
 * @property {string} title - Título da receita
 * @property {string|string[]} category - Categoria única (string) ou múltiplas categorias (array de strings)
 * @property {string} emoji - Emoji representativo da receita
 * @property {string|null} [image] - Nome do arquivo de imagem (opcional)
 * @property {Ingredient[]} ingredients - Lista de ingredientes individuais e normalizados
 * @property {string[]} steps - Modo de preparo passo a passo
 * @property {number|null} [servings] - Quantidade de pessoas que a receita serve (default: 4, valor padrão assumido caso não possa ser inferido da receita na hora do parsing)
 * @property {string|null} [tips] - Dicas adicionais (opcional)
 */
```

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Recipe",
  "type": "object",
  "required": ["id", "title", "category", "emoji", "ingredients", "steps"],
  "properties": {
    "id": { "type": "integer" },
    "title": { "type": "string" },
    "category": {
      "oneOf": [
        { "type": "string" },
        { "type": "array", "items": { "type": "string" } }
      ]
    },
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
          "unit": { "type": "string" }
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

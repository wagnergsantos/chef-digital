# Design Spec: Busca por Título e Ingrediente

**Data:** 2026-07-27
**Autor:** GitHub Copilot CLI (pair programmer)
**Status:** Em Revisão
**Projeto:** Chef Digital (Livro de Receitas & Planejador)

---

## 1. Visão Geral (Overview)

Hoje a busca (`searchQuery`) compara apenas `recipe.title` com o texto digitado. Isso não atende ao caso de uso "o que eu faço com o que eu tenho em casa?", onde o usuário quer buscar por um ingrediente (ex: "frango") e ver todas as receitas que o usam, mesmo que o ingrediente não apareça no título.

Esta spec estende a busca existente para também considerar `ingredients[].name`, mantendo um único campo de busca (sem UI adicional de "buscar só por ingrediente"). Duas melhorias pequenas e relacionadas entram no mesmo escopo:
- **Busca insensível a acentos** (ex: "pao" encontra "Pão").
- **Indicador visual "🔍 Contém: X"** no card, mostrado apenas quando o match veio exclusivamente de um ingrediente (não quando o termo já aparece no título).

---

## 2. Objetivos (Goals & Non-Goals)

### Objetivos (Goals)
* Buscar por múltiplos termos (separados por espaço) com lógica **E** (AND): toda receita retornada deve conter todos os termos, cada um batendo em título e/ou algum nome de ingrediente.
* Normalização de acentos (NFD + remoção de diacríticos) e caixa (lowercase) aplicada tanto ao texto digitado quanto ao texto comparado (título e ingredientes).
* Consolidar a lógica de match numa única função (`matchRecipeSearch`), eliminando a duplicação atual de `title.toLowerCase().includes(searchQuery)` presente em 3 pontos do código (`renderRecipes`, e duas contagens dentro de `renderCategoryFilters`).
* Selo "🔍 Contém: <ingrediente(s)>" no card, exibido somente quando pelo menos um termo bateu exclusivamente via ingrediente (nunca quando o termo já é visível no título).
* Atualizar o placeholder do campo de busca de "Buscar por título..." para "Buscar por título ou ingrediente...".
* As contagens de receitas por categoria no sidebar (`renderCategoryFilters`) devem refletir a busca por ingrediente também (comportamento consistente com a busca por título hoje).

### Non-Goals
* Não cria um campo de busca separado só para ingredientes — é sempre um único campo unificado.
* Não introduz busca fuzzy/aproximada (typo-tolerance) — apenas normalização de acentos/caixa.
* Não pré-computa nenhum índice de busca — a comparação roda sob demanda a cada tecla digitada, dentro do fluxo existente de `filterRecipes()`/`renderRecipes()`. Dataset pequeno (~150 receitas) não justifica a complexidade extra (YAGNI).
* Não altera a busca por favoritos/categoria já existentes, apenas soma a nova dimensão de matching.

---

## 3. Lógica de Matching

### 3.1. `normalizeSearchText(str)`
Helper novo, usado em todo o app para normalizar tanto o termo buscado quanto os textos comparados:
```js
function normalizeSearchText(str) {
    return (str || '').toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos
}
```

### 3.2. `matchRecipeSearch(recipe, rawQuery)`
Função central que substitui as 3 ocorrências duplicadas de `r.title.toLowerCase().includes(searchQuery)`:
```js
// Retorna { matches: boolean, matchedIngredients: string[] }
// matchedIngredients só é preenchido com termos que bateram em ingrediente
// e NÃO bateram no título (usado exclusivamente pelo selo visual).
function matchRecipeSearch(recipe, rawQuery) {
    const terms = normalizeSearchText(rawQuery).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return { matches: true, matchedIngredients: [] };

    const normTitle = normalizeSearchText(recipe.title);
    const matchedIngredients = [];

    const allTermsMatch = terms.every(term => {
        if (normTitle.includes(term)) return true;
        const hitIngredient = recipe.ingredients.find(ing =>
            normalizeSearchText(ing.name).includes(term));
        if (hitIngredient) {
            if (!matchedIngredients.includes(hitIngredient.name)) {
                matchedIngredients.push(hitIngredient.name);
            }
            return true;
        }
        return false;
    });

    return { matches: allTermsMatch, matchedIngredients: allTermsMatch ? matchedIngredients : [] };
}
```

### 3.3. Pontos de integração
- **`renderRecipes()`**: substitui o filtro atual de `searchMatch` por `matchRecipeSearch(recipe, searchQuery).matches`; guarda `matchedIngredients` para renderizar o selo no card correspondente.
- **`renderCategoryFilters()`** (contagem de "todos" e de cada categoria): substitui `r.title.toLowerCase().includes(searchQuery)` por `matchRecipeSearch(r, searchQuery).matches` nos dois pontos onde essa lógica está duplicada hoje.
- `searchQuery` continua guardando o texto cru digitado (sem normalizar antecipadamente) — a normalização acontece dentro de `matchRecipeSearch`/`normalizeSearchText`, sem necessidade de tocar em `filterSearch()` (o handler do `input` do campo de busca).

---

## 4. UI: Selo de Indicador e Placeholder

- Placeholder do input de busca (`#search-input`) atualizado de `"Buscar por título..."` para `"Buscar por título ou ingrediente..."`.
- No card de receita (dentro de `renderRecipes()`), quando `matchedIngredients.length > 0`, um pequeno selo é inserido abaixo do título:
  ```html
  <p class="card-search-match">🔍 Contém: Frango, Cebola</p>
  ```
  usando os nomes originais (não normalizados) dos ingredientes, unidos por vírgula, passados por `escapeHtml()`.
- O selo não aparece quando a busca está vazia ou quando todos os termos já bateram no título.
- Estilo do selo: texto pequeno e discreto (tom secundário, ex: `var(--text-secondary)`), sem uso de amber/cor de destaque — segue a regra do `DESIGN.md` de reservar amber para estados de marca/ativos.

---

## 5. Casos de Borda e Plano de Testes

### Casos de borda
- **Termo vazio/só espaços**: retorna match `true` para tudo — comportamento idêntico ao atual (sem busca).
- **Termo muito curto (1-2 letras)**: pode gerar falsos positivos; aceitável, já é o comportamento atual da busca por título.
- **Termo duplicado batendo no mesmo ingrediente por dois termos diferentes**: `matchedIngredients` verifica duplicata antes de inserir, evitando repetir o nome no selo.
- **Termo que bate tanto no título quanto em um ingrediente**: conta como match pelo título; não entra em `matchedIngredients` (o `find` só roda quando o título não bateu), mantendo o selo restrito a matches "invisíveis" no título.
- **Contagens de categoria mudam com busca por ingrediente**: comportamento esperado e desejado (mesma regra da busca por título hoje), deve ser conferido no teste manual.
- **Acentuação mista** (ex: receita "Açaí" buscando "acai" ou "AÇAÍ" buscando "acai"): resolvido pela normalização NFD + lowercase em ambos os lados.

### Plano de testes (manual, sem automação — projeto não possui suíte de testes)
1. Buscar por um ingrediente comum (ex: "cebola") → confirmar que aparecem receitas sem "cebola" no título mas com o ingrediente na lista, exibindo o selo "🔍 Contém: Cebola".
2. Buscar dois termos (ex: "frango batata") → confirmar que só aparecem receitas com AMBOS os termos, cada um podendo vir de título e/ou ingrediente.
3. Buscar termo sem acento correspondente a palavra acentuada (ex: "acucar" → "Açúcar") → confirmar que encontra.
4. Buscar termo que aparece no título e também bateria em um ingrediente → confirmar que o selo NÃO aparece.
5. Conferir que as contagens ao lado de cada categoria no sidebar mudam corretamente ao digitar um termo de ingrediente.
6. Limpar a busca (botão "X") → confirmar que tudo volta ao normal, sem selos residuais.
7. Testar em `file://` diretamente (sem servidor) para garantir compatibilidade offline, já que `normalize('NFD')` é uma API nativa do JS sem dependência externa.

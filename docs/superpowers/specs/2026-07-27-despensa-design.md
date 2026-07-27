# Design Spec: Despensa (Filtro "Posso Fazer com o que Tenho")

**Data:** 2026-07-27
**Autor:** GitHub Copilot CLI (pair programmer)
**Status:** Em Revisão
**Projeto:** Chef Digital (Livro de Receitas & Planejador)

---

## 1. Visão Geral (Overview)

Adiciona um filtro opcional de "despensa": o usuário informa uma lista livre de ingredientes que tem em casa, e o app destaca (via selo no card) as receitas que ele consegue preparar 100% com o que já tem, sem precisar comprar nada. Reaproveita a normalização de texto (acentos/caixa) já criada na spec de busca por ingrediente.

**Depende de:** `normalizeSearchText()` (definida em `2026-07-27-busca-ingrediente-design.md`) — implementar esta spec depois daquela, ou extrair o helper antes se a ordem de implementação for invertida.

---

## 2. Objetivos (Goals & Non-Goals)

### Objetivos (Goals)
* Modal dedicado (`modal-despensa`) com um `<textarea>` de entrada livre (um ingrediente por linha ou separado por vírgula).
* Persistência em `localStorage` (`chef_digital_pantry`), reaproveitando o padrão de fallback seguro já usado em `favorites`/`shoppingList`.
* Matching por substring bidirecional e normalizado (acentos/caixa) entre item de despensa e nome de ingrediente da receita.
* Ingredientes com unidade "a gosto" ou "opcional" sempre contam como disponíveis (não entram na checagem de match).
* Selo "✅ Você tem tudo" no card de cada receita 100% completa, quando o filtro de despensa está ativo.
* Filtro combina com **E** (AND) junto aos filtros de busca/categoria/favoritos já existentes.
* Botão novo no `header-controls`, com estado visual "ativo" análogo ao botão de favoritos, para ligar/desligar o filtro sem perder a lista salva.

### Non-Goals
* Não classifica receitas "quase completas" (ex: "falta 1 item") — é binário: completa ou não.
* Não oferece autocomplete/checklist de ingredientes conhecidos — entrada é texto livre.
* Não tem UI de gerenciamento por item individual (adicionar/remover um item específico) — a edição é sempre reescrever/ajustar o texto completo no textarea.
* Não altera a lista de compras nem o planejador — é puramente um filtro de visualização da grade de receitas.

---

## 3. Arquitetura

### 3.1. Estado
```js
let pantryItems = [];          // array de strings, ex: ["frango", "cebola", "arroz"]
let pantryFilterActive = false; // controla se o filtro está aplicado à listagem agora
```
Carregados/inicializados em `window.onload`:
```js
try {
    pantryItems = JSON.parse(localStorage.getItem('chef_digital_pantry')) || [];
} catch (e) {
    pantryItems = [];
}
```
(mesmo padrão de fallback seguro já usado para `favorites`/`shoppingList`.)

### 3.2. Parsing do textarea
Ao salvar, o conteúdo do `<textarea>` é dividido por vírgula ou quebra de linha, aparado e filtrado:
```js
const pantryItems = textareaValue.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
```

### 3.3. `recipeIsFullyStocked(recipe)`
```js
function recipeIsFullyStocked(recipe) {
    if (pantryItems.length === 0) return false;
    const normPantry = pantryItems.map(normalizeSearchText);
    return recipe.ingredients.every(ing => {
        const unit = (ing.unit || '').toLowerCase();
        if (unit.includes('a gosto') || unit.includes('opcional')) return true;
        const normIng = normalizeSearchText(ing.name);
        return normPantry.some(p => normIng.includes(p) || p.includes(normIng));
    });
}
```

### 3.4. Integração com filtros existentes
Nos 3 pontos já identificados na spec de busca (`renderRecipes()` e as duas contagens em `renderCategoryFilters()`), adiciona-se uma nova condição combinada com **E**:
```js
const pantryMatch = !pantryFilterActive || recipeIsFullyStocked(recipe);
// ... && pantryMatch
```

---

## 4. Interface

- **Botão novo no `header-controls`** (ícone de armário/despensa), ao lado dos botões de favoritos/tema. Abre `modal-despensa`. Quando `pantryFilterActive === true`, o botão fica com o mesmo estilo visual "ativo" já usado no botão de favoritos.
- **Modal `modal-despensa`**:
  - `<textarea>` com placeholder `"Ex: frango, cebola, arroz, alho..."`, sempre pré-preenchido com o conteúdo atual de `pantryItems` (um item por linha) ao reabrir.
  - Botão primário **"Salvar e Filtrar"**: faz o parsing (§3.2), salva em `localStorage`, seta `pantryFilterActive = true`, fecha o modal e re-renderiza a grade de receitas.
  - Botão secundário **"Limpar despensa"**: esvazia `pantryItems` (e o textarea), mas não fecha o modal nem altera `pantryFilterActive` — permite ao usuário recomeçar a digitação.
- **Selo no card**: quando `pantryFilterActive` é `true` e `recipeIsFullyStocked(recipe)` retorna `true`, exibe `"✅ Você tem tudo"` no card, em estilo consistente com os demais selos (ex: cor de sucesso `var(--success-color)`, não amber, já que amber é reservado para estados de marca/ativo conforme `DESIGN.md`).
- Clicar novamente no botão do header (toggle) apenas alterna `pantryFilterActive`, sem apagar `pantryItems` salvos.

---

## 5. Casos de Borda e Plano de Testes

### Casos de borda
- **Falso positivo por substring curto** (ex: "sal" na despensa batendo em "salsão" num ingrediente): limitação conhecida e aceita, trade-off da escolha de matching flexível (substring bidirecional) sobre precisão exata.
- **Despensa vazia + filtro ativo**: nenhuma receita marcada como completa — resultado esperado de `recipeIsFullyStocked` retornando `false` sempre que `pantryItems.length === 0`.
- **`localStorage` corrompido/malformado**: fallback para array vazio (try/catch), mesmo padrão de robustez já usado em `favorites`/`shoppingList`.
- **Alternância de categoria/busca com filtro de despensa ativo**: o filtro permanece ativo (é persistente de sessão/local, como "favoritos"), só é desativado explicitamente pelo botão do header ou por "Limpar despensa".
- **Toggle liga/desliga rápido**: não apaga a lista salva, só alterna a aplicação do filtro.

### Plano de testes (manual, sem automação — projeto não possui suíte de testes)
1. Abrir modal despensa, digitar `"frango, cebola, arroz, alho"` (vírgulas), salvar → confirmar que receitas com apenas esses ingredientes (+ itens "a gosto"/"opcional") ganham o selo "✅ Você tem tudo".
2. Testar variação de nome (despensa `"frango"` vs. ingrediente da receita `"peito de frango"`) → confirmar que o match funciona.
3. Testar receita com ingrediente `"sal a gosto"` sem `"sal"` na despensa → confirmar que ainda conta como completa.
4. Combinar filtro de despensa ativo + busca por categoria → confirmar que só aparecem receitas que passam em ambos os filtros.
5. Recarregar a página → confirmar que a lista de despensa persiste (reabrir o modal mostra o texto salvo anteriormente).
6. Clicar em "Limpar despensa" → confirmar que nenhuma receita fica marcada como completa e o textarea esvazia.
7. Testar em `file://` direto → confirmar que não há dependência de rede e tudo funciona offline/local.

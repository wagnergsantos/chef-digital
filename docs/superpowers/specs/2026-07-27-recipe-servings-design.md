# Design Spec: Porções Reais da Receita (`recipe.servings`)

**Data:** 2026-07-27
**Autor:** GitHub Copilot CLI (pair programmer)
**Status:** Em Revisão
**Projeto:** Chef Digital (Livro de Receitas & Planejador)

---

## 1. Visão Geral (Overview)

Hoje o modal de receita tem um multiplicador genérico "1x, 2x, 3x..." sem saber para quantas pessoas cada "1x" realmente serve. Esta spec adiciona um campo `servings` (número de porções/pessoas que a receita base rende) ao schema de dados, e transforma o multiplicador em um controle de **número de pessoas**, escalando os ingredientes proporcionalmente por pessoa.

**Regra central (única condição usada em toda a UI/lógica de negócio):** o app decide entre os dois modos exclusivamente com base em `recipe.servings === null` — nunca com base na categoria da receita. Quando `servings` é `null` (tipicamente receitas de tempero/molho, que não têm noção de "pessoas"), o app cai no multiplicador simples de hoje (`1x/2x/3x`). A categoria só é relevante para o **script de backfill** (seção 3.2), que decide quais receitas existentes ganham `servings: 4` automaticamente — o restante do app nunca inspeciona `recipe.category` para essa decisão.

---

## 2. Objetivos (Goals & Non-Goals)

### Objetivos (Goals)
* Novo campo `servings: number|null` no schema de `receitas.js`.
* Script de backfill (`scripts/add_default_servings.py`) que grava `"servings": 4` em toda receita existente que não tenha o campo, **exceto** receitas cuja categoria inclua `"temperos"` (que ficam `null` intencionalmente).
* `scripts/generate_csv.py` passa a exportar uma coluna `porcoes`, para facilitar revisão manual das exceções em planilha.
* Modal de receita: stepper de "pessoas" (em vez de multiplicador genérico) quando `recipe.servings` não for `null`, escalando ingredientes por-pessoa. Abre já com o valor de `servings` selecionado (não em "1x"/"1 pessoa" fixo).
* Selo "👥 N pessoas" no card da grade principal, quando `recipe.servings` não for `null`.
* Planejador semanal: cada receita planejada guarda `people` (em vez de `portions`), com a mesma lógica de escala por pessoa, usada na consolidação da lista de compras.
* **Regra única e simples**: sempre que `recipe.servings` for `null` — independentemente da categoria — o app usa o multiplicador simples `1x/2x/3x` de hoje (sem noção de pessoas), tanto no modal quanto no planejador. Não há fallback automático para `4`: `null` significa deliberadamente "modo multiplicador", e cabe ao dado em `receitas.js` (via backfill ou edição manual) decidir isso.

### Non-Goals
* Não adiciona um stepper editável na lista de compras — ela continua sendo somente leitura do resultado já calculado no modal (receita avulsa) ou no planejador (consolidado). Ver seção 4.3.
* Não introduz nenhuma checagem de `recipe.category` fora do script de backfill — toda a lógica de UI/negócio decide o modo (pessoas vs. multiplicador) unicamente pelo valor de `recipe.servings`.
* Não introduz suporte a faixas de porções (ex: "4-6 pessoas") — `servings` é sempre um número inteiro único ou `null`.

---

## 3. Arquitetura e Mudança de Schema

### 3.1. `receitas.js`
```js
/**
 * @property {number} [servings] - Número de pessoas que a receita base rende.
 *   Ausente/null quando a receita não tem noção de "pessoas" (ex: temperos/molhos = rendimento de lote).
 *   Regra de runtime: `servings === null` sempre significa "modo multiplicador simples" (1x/2x/3x),
 *   qualquer que seja a categoria da receita. Não há fallback automático para um valor numérico.
 */
```
Nenhuma mudança na convenção de edição do arquivo (localizar `const receitasData =`, extrair/reserializar JSON com `json.dumps(indent=4, ensure_ascii=False)`).

### 3.2. Script `scripts/add_default_servings.py` (novo)
Segue o mesmo padrão dos demais scripts em `scripts/`:
1. Localiza `const receitasData =`, extrai o JSON.
2. Para cada receita sem `servings`:
   - Se `"temperos"` estiver em `recipe.category` (string ou array) → não mexe (mantém ausente/null, entrando propositalmente em modo multiplicador).
   - Caso contrário → define `recipe["servings"] = 4`.
3. Reserializa e grava de volta em `receitas.js`.
4. Roda uma única vez, é commitado; ajustes manuais de exceções (ex: marmita individual, bolo grande) ficam por conta do usuário depois, editando o JSON diretamente — inclusive para colocar `null` em qualquer outra receita que não se encaixe no conceito de "pessoas", não só as de categoria `temperos`.

> Nota: esta é a **única** parte de todo o sistema que olha para `recipe.category`. O restante do app (modal, card, planejador, consolidação) reage exclusivamente ao valor de `recipe.servings`.

### 3.3. `scripts/generate_csv.py`
Adiciona a coluna `porcoes` ao CSV gerado (`recipe.get("servings")`, vazio quando `null`), no cabeçalho e nas linhas, mantendo o delimitador `;` e `QUOTE_ALL` já usados.

---

## 4. Especificação de Interface (UI) e Lógica de Negócio

### 4.1. Modal de receita
* Estado `activeRecipePortions` é reaproveitado para guardar o número de **pessoas** (quando `recipe.servings !== null`) ou o **multiplicador** (quando `recipe.servings === null`) — o significado depende exclusivamente de `recipe.servings`, nunca da categoria.
* Ao abrir (`openRecipeModal`):
  - Se `recipe.servings !== null`: `activeRecipePortions = recipe.servings`; rótulo exibido como `"${activeRecipePortions} pessoas"`.
  - Se `recipe.servings === null`: `activeRecipePortions = 1`; rótulo exibido como `"1x"` (comportamento atual, sem mudanças).
* Stepper `changePortions(dir)`:
  - `servings !== null`: incrementa/decrementa 1 pessoa por clique, limite `mín 1` / `máx 20`.
  - `servings === null`: mantém o comportamento atual (`mín 1` / `máx 10`, rótulo `Nx`).
* Fórmula de escala em `updateIngredientsList()`:
  - `servings !== null`: `qtd_final = ing.qty * (activeRecipePortions / recipe.servings)`.
  - `servings === null`: `qtd_final = ing.qty * activeRecipePortions` (multiplicador direto, como hoje).
* "Adicionar tudo à lista de compras" usa a mesma fórmula acima para calcular a quantidade gravada no item da lista (sem mudança na função em si, só na base de cálculo).

### 4.2. Card na grade principal (`renderRecipes`)
* Novo selo no rodapé do card, ao lado do contador de ingredientes: `👥 ${recipe.servings} pessoas` — renderizado apenas quando `recipe.servings !== null`. Receitas com `servings === null` não exibem esse selo (mantém só "N ing.").

### 4.3. Lista de compras
* Sem mudanças estruturais: continua somente leitura, exibindo o resultado já calculado por `addCurrentRecipeToShoppingList()` (modal) ou `generateConsolidatedShoppingList()` (planejador). Não ganha stepper próprio.

### 4.4. Planejador semanal (`plannedRecipes`)
* Estrutura muda de `{ id, portions }` para `{ id, people }`.
* **Migração automática** do `localStorage` existente: ao carregar, se um item tiver `portions` e não tiver `people`, copia `portions` para `people` (preserva o valor salvo pelo usuário, sem resetar planejamentos existentes).
* `togglePlanRecipe(id)`: ao planejar uma receita pela primeira vez, define `people` inicial:
  - `servings !== null`: `people = recipe.servings`.
  - `servings === null`: `people = 1` (multiplicador simples).
* `changePlannerRecipePortions(id, dir)` (renomeada/ajustada para operar sobre `people`): mesmos limites do modal (`1`–`20` quando `servings !== null`, `1`–`10` quando `servings === null`).
* `generateConsolidatedShoppingList()`: a fórmula de escala por receita planejada passa a ser:
  - `servings !== null`: `scaledQty = ing.qty * (p.people / recipe.servings)`.
  - `servings === null`: `scaledQty = ing.qty * p.people` (tratado como multiplicador).
  - Cada receita planejada calcula sua própria quantidade escalada **antes** de entrar na soma consolidada por ingrediente (a lógica de agrupamento/soma por unidade normalizada, já implementada, não muda).

---

## 5. Casos de Borda (Edge Cases)

* **`servings` ausente/`undefined` (não gravado no JSON) vs. `null` explícito**: o app trata os dois da mesma forma — qualquer valor "falsy" de `servings` (`null`, `undefined`, `0`) entra em modo multiplicador. Não há fallback automático para `4`; se uma receita precisa do modo "pessoas", o valor precisa estar explicitamente no dado.
* **Quantidades fracionárias ao escalar por pessoa** (ex: 3 pessoas numa base de 4): mantém o arredondamento de exibição já existente (`toFixed(2)`), igual ao comportamento atual.
* **Migração do planejador**: item antigo com `portions` vira `people` com o mesmo valor — nenhuma perda de estado.
* **Limite mínimo de pessoas**: nunca chega a `0`, evitando divisão por zero na escala por-pessoa.
* **Mistura de receitas com e sem `servings` no mesmo planejamento**: cada uma usa sua própria fórmula de escala antes da soma consolidada; não há mistura incorreta de lógicas no resultado final.

---

## 6. Estratégia de Teste e Validação

Testes manuais (sem test runner automatizado no projeto):

1. Rodar `add_default_servings.py` e conferir via `generate_csv.py` (coluna `porcoes`) que todas as receitas ganharam `4`, exceto as de categoria `temperos` (vazio/null).
2. Abrir uma receita de refeição (`servings=4`) → modal abre em "4 pessoas"; aumentar para 8 → ingredientes dobram; diminuir para 2 → ingredientes reduzem à metade.
3. Abrir uma receita de tempero (`servings=null`) → modal mostra "1x/2x/3x" sem falar em pessoas; ingredientes escalam como multiplicador simples.
4. Conferir selo de porções no card da grade: presente em receitas de refeição, ausente nas de tempero.
5. Planejar uma receita de refeição → planejador já inicia com `people = servings`; ajustar pessoas e consolidar a lista de compras → conferir soma proporcional correta por-pessoa.
6. Planejar uma receita de tempero junto com uma de refeição, consolidar → conferir que cada uma usa a fórmula correta (por-pessoa vs. multiplicador simples) sem misturar no resultado somado.
7. Testar com dado antigo no `localStorage` (formato `{id, portions}`) → confirmar migração automática para `{id, people}` sem perda de estado.
8. Testar "Adicionar tudo à lista de compras" a partir do modal com pessoas ajustadas → conferir quantidade gravada na lista de compras reflete a escala por-pessoa corretamente.

---

## 7. Estratégia de Rollback

Mudanças concentradas em: um novo script standalone (`add_default_servings.py`, não afeta nada além de `receitas.js`), um ajuste de coluna no `generate_csv.py`, e lógica em `index.html`/`estilos.css` para o modal, card e planejador. Reversão via Git revertendo o commit da feature; o campo `servings` em `receitas.js` pode ser removido em lote se necessário (é aditivo, não substitui nenhum campo existente).

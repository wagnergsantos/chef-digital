# Agenda Semanal (Planejamento por Dia)

## Contexto

Hoje o "Menu Semanal" (drawer de planejamento) é uma lista simples de receitas
marcadas, sem vínculo a nenhum dia da semana. O usuário quer que essa parte do
app funcione como uma **agenda semanal**: cada receita planejada é associada a
um dia da semana, e o drawer passa a exibir as receitas agrupadas por dia.

## Objetivo

Permitir que o usuário planeje receitas por dia da semana (Domingo a Sábado),
visualizando o menu como uma lista por dia (accordion), mantendo a geração da
lista de compras consolidada como funciona hoje.

## Decisões de escopo (confirmadas com o usuário)

- **Granularidade:** por dia da semana, sem distinção de refeição
  (Café/Almoço/Janta). Uma receita planejada pertence a um ou mais dias.
- **Semana genérica, sem datas:** os dias são "Domingo", "Segunda-feira", etc.,
  reutilizados toda semana — não há vínculo com datas reais e não há reset
  automático.
- **Ordem fixa dos dias:** sempre Domingo → Sábado, nessa ordem, independente
  do dia atual.
- **Múltiplos dias por receita:** a mesma receita pode ser planejada em mais
  de um dia da semana (ex.: macarrão na Segunda e na Quinta), cada ocorrência
  com sua própria contagem de porções/pessoas.
- **Escolha do dia é obrigatória:** não existe um grupo "sem dia definido" —
  toda receita planejada tem pelo menos um dia associado.
- **Fluxo de escolha do dia:** ao clicar no botão de calendário 📅 no card da
  receita, abre imediatamente um seletor com os 7 dias (não é preciso abrir a
  agenda para escolher).

## Modelo de dados

Estrutura atual (`plannedRecipes`, array plano):
```js
[{ id: 12, people: 4 }, ...]
```

Nova estrutura (`plannedByDay`, objeto agrupado por dia):
```js
{
  dom: [{ recipeId: 12, people: 4 }],
  seg: [],
  ter: [{ recipeId: 12, people: 2 }, { recipeId: 7, people: 3 }],
  qua: [],
  qui: [],
  sex: [],
  sab: []
}
```

- Chaves fixas, sempre nas 7, na ordem de iteração/exibição:
  `dom, seg, ter, qua, qui, sex, sab`.
- Cada entrada de dia é `{ recipeId, people }` (equivalente ao `{id, people}`
  de hoje, renomeado `id` → `recipeId` para clareza).
- A mesma receita pode aparecer em mais de um array de dia (cada ocorrência
  independente, com suas próprias porções).
- Persistência: mesma chave de `localStorage`, **`chef_digital_planned`**,
  agora armazenando o objeto acima em vez do array.

### Migração de dados antigos

No carregamento (`window.onload`), ao ler `chef_digital_planned`:
- Se o valor parseado for um **array** (formato antigo), migrar: criar o
  objeto `plannedByDay` com as 7 chaves vazias e colocar todas as entradas
  antigas (`{id, people}` → `{recipeId: id, people}`) dentro de `dom`
  (Domingo), já que não há informação de dia nos dados antigos. Persistir
  imediatamente o novo formato.
- Se já for um objeto (formato novo), usar diretamente, garantindo que as 7
  chaves existam (preencher com `[]` qualquer chave ausente, por robustez).

## Interface

### Botão calendário no card da receita

- Ao clicar, abre um popover pequeno e ancorado ao botão, listando os 7 dias
  da semana (Dom, Seg, Ter, Qua, Qui, Sex, Sáb) como itens clicáveis tipo
  toggle.
- Cada dia no popover mostra visualmente se a receita já está planejada
  naquele dia (ex.: destacado/marcado).
- Clicar em um dia adiciona a receita àquele dia (com porções padrão) se
  ainda não estiver lá, ou remove essa ocorrência se já estiver.
- O ícone de calendário no card (estado "planejado") permanece com indicador
  visual ativo se a receita estiver em **pelo menos um** dia.
- Popover fecha ao clicar fora ou em um botão de fechar.

### Drawer da agenda semanal ("Menu Semanal")

- Vira um accordion com 7 seções fixas, sempre na ordem Domingo → Sábado,
  mesmo que vazias.
- Cabeçalho de cada seção mostra o nome do dia (ex.: "Domingo") e,
  opcionalmente, a contagem de receitas planejadas naquele dia.
- Corpo de cada seção lista os cards das receitas planejadas naquele dia,
  reaproveitando o card atual (emoji, título, fonte, controles de
  porções/pessoas, botão remover) — sem alterações visuais no card em si.
- Seção vazia mostra uma mensagem curta, ex. "Nenhuma receita planejada" (em
  vez do texto de vazio ser só global).
- Estado vazio global (nenhuma receita em nenhum dia) mantém a mensagem atual
  ("Seu Menu Semanal está vazio!").
- Botão "Limpar planejamento" (se existir) reseta `plannedByDay` para as 7
  chaves vazias.

### Funções JS afetadas (mapeamento, não é o plano de implementação)

- `togglePlanRecipe(id)` → passa a abrir/fechar o popover de dias, ou é
  substituída por uma função por-dia, ex. `toggleRecipeOnDay(recipeId, day)`.
- `renderPlanner()` → itera as 7 chaves de `plannedByDay` na ordem fixa,
  renderizando uma seção accordion por dia.
- `changePlannerRecipePortions(id, delta)` → precisa saber também o `day` da
  entrada (já que a mesma receita pode ter porções diferentes em dias
  diferentes), ex. `changePlannerRecipePortions(recipeId, day, delta)`.
- `updatePlannerBadge()` → conta o total de entradas somando todos os dias.
- `generateConsolidatedShoppingList()` → em vez de iterar `plannedRecipes`,
  itera todas as entradas de todos os dias (`Object.values(plannedByDay).flat()`),
  mantendo a lógica de consolidação por ingrediente inalterada.

## Lista de compras

Nenhuma mudança de comportamento visível ao usuário: a lista consolidada
continua somando os ingredientes de **todas** as receitas planejadas, agora
lidas de todos os dias em vez de uma lista plana. Se a mesma receita estiver
em 2 dias com porções diferentes, ambas as ocorrências contribuem
separadamente para o total consolidado (soma das porções de cada dia).

## Fora de escopo

- Distinção por refeição (Café/Almoço/Janta) dentro do dia.
- Datas reais / calendário com semanas específicas.
- Arrastar e soltar (drag-and-drop) entre dias.
- Qualquer alteração na estrutura de dados de `receitas.js` ou no schema de
  receitas.

## Verificação

Sem pipeline de testes automatizado neste projeto. Verificar manualmente
abrindo `index.html` (idealmente via servidor estático local):
1. Planejar uma receita em 2 dias diferentes via popover do card e confirmar
   que aparece nas duas seções do accordion, com porções independentes.
2. Remover uma ocorrência específica de um dia e confirmar que a receita
   permanece na outra seção onde ainda está planejada.
3. Gerar a lista de compras consolidada e confirmar que soma corretamente as
   porções das duas ocorrências.
4. Simular dado antigo (array simples) em `localStorage.chef_digital_planned`
   e recarregar a página, confirmando a migração automática para Domingo.
5. Testar em viewport mobile/tablet (accordion deve ser utilizável com o
   polegar, alinhado ao PRODUCT.md).

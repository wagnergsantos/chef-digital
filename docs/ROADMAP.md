# Pré-Spec Integrada — Chef Digital

**Repositório:** wagnergsantos/chef-digital
**Data:** 16/08/2026
**Escopo:** Cruzamento entre `docs/ROADMAP.md` (status atual do projeto) e
revisão de código independente (correções + melhorias propostas)

---

## 1. Contexto

Chef Digital é um PWA de receitas em vanilla JS + Vite, offline-first
(IndexedDB + Supabase), com painel admin autenticado e importação de receitas
via IA (Gemini) e por URL. Segundo `docs/ROADMAP.md` (última atualização
10/08/2026, conferido diretamente no repositório):

- **Fase 1 (Estabilização Offline)** — 🟢 100% concluída
- **Fase 2 (Performance & Arquitetura)** — 🟢 100% concluída
- **Fase 3 (Funcionalidades de Experiência)** — 🟢 100% concluída
- **Fase 4 (Avançado & IA)** — 🟢 100% concluída
- **Fase 5 (Admin & Gestão de Receitas)** — 🟢 100% concluída (edição de
  receita com seletor pesquisável + autocomplete de tags no painel admin)
- **🔮 Futuro / Opcional (sem previsão)**:
  - [ ] Lista colaborativa (Supabase Realtime) — *pré-requisito: autenticação
    de usuários*
  - [ ] Notificações push (planejamento semanal / lista de compras) — *requer
    VAPID keys + Edge Function para subscriptions*

Suíte de testes: **21/21 passam** (`npx vitest run`). Um teste
(`bundle-split.test.js`) depende do `dist/` já buildado.

Este documento **não repete** o que já está descrito no ROADMAP como
concluído ou já planejado — ele soma o que a análise de código encontrou que
ainda não está documentado ali, e sinaliza onde as sugestões anteriores se
sobrepõem ou se conectam ao que já está no radar do time.

---

## 2. Achados que cruzam com o histórico do ROADMAP

### A2 (revisado) — `receitas.js` é resíduo de um bug já corrigido

O ROADMAP lista como **[RESOLVIDO]**: *"Referência a Variável Global Obsoleta
(`receitasData`)"* — a dependência da variável global foi removida de
`src/main.js`, e os dados passaram a vir do estado reativo em memória.

O que a análise de código encontrou é o **arquivo** que originava essa
variável (`receitas.js`, ~240KB/7000 linhas, na raiz do projeto) — o bug de
referência foi corrigido, mas o arquivo fonte nunca foi removido. Ele
continua sendo referenciado só por scripts de migração (`scripts/migrate.js`,
`scripts/update_servings.js`) e por `next-id.html` (ferramenta de dev), não
pelo app em si.

**Ou seja: este item completa um bug que o ROADMAP já marcou como resolvido,
mas cujo artefato de origem ficou pra trás.** Ação recomendada inalterada:
mover para `scripts/` (se os scripts de migração ainda são usados) ou
remover de vez.

---

### B4 (revisado) — sobreposição com "Lista colaborativa" pendente

A sugestão original de complementar a lista de compras com Web Share API é
pequena e independente, mas **"Lista colaborativa" (Supabase Realtime)** já
está no ROADMAP como funcionalidade pendente de Fase 4 — e é uma versão bem
mais ampla do mesmo espaço de problema (compartilhar/sincronizar lista entre
pessoas).

**Recomendação:** não tratar como itens concorrentes. Web Share API
(compartilhar um snapshot da lista via WhatsApp, por exemplo) continua útil
mesmo depois que a lista colaborativa em tempo real existir — são casos de
uso diferentes (compartilhar pontualmente vs. sincronizar continuamente).
Mas vale sequenciar: como o Realtime está no roadmap, faz sentido decidir o
modelo de dados da lista colaborativa **antes** de investir em qualquer
polimento na lista atual, pra não retrabalhar.

---

### Nota sobre status da Fase 4

Uma revisão externa deste documento sugeriu reclassificar "Lista colaborativa"
e "Notificações push" como itens de uma hipotética "Fase 5 / Futuro", sob a
alegação de que o `ROADMAP.md` original já tratava a Fase 4 como 100%
concluída e listava esses dois itens à parte, em uma seção "🔮 Futuro /
Opcional". **Isso não confere com o arquivo real**: o título da seção no
`ROADMAP.md` é literalmente *"Fase 4 (Avançado & Inteligência Artificial) —
🟡 50% Concluído"*, e os dois itens pendentes aparecem dentro da própria lista
da Fase 4, não em seção separada. Não existe seção "Futuro/Opcional" no
documento. Mantida a classificação original: Fase 4 em 50%, com os dois itens
como pendências da fase atual — evita reescrever o status do roadmap de forma
que não é suportada pelo conteúdo do arquivo.

---

### Notificações push (pendente no ROADMAP) — mesma ressalva já levantada para o AniMatch

O Chef Digital já tem "Notificações push" como item pendente de Fase 4. Vale
a mesma ressalva de custo registrada no pré-spec do AniMatch: Web Push
completo exige infraestrutura persistente (Edge Function com cron, tabela de
subscriptions, chaves VAPID, tratamento de subscriptions revogadas). Não é
uma correção deste documento, é só um alerta de escopo pra quando esse item
da Fase 4 for priorizado — o ROADMAP não detalha a complexidade de
implementação, só marca como pendente.

---

## 3. Frente A — Correções e débitos técnicos (não cobertos pelo ROADMAP)

### A1. `recipe.image` não passa por `escapeHtml()` no atributo `src`

**Onde:** `src/modules/recipes-render.js`, linha 487

```js
${hasImg ? `<img src="${recipe.image}" class="card-header-image" alt="Foto de ${safeTitle}" ... />` : ''}
```

**Problema:** título, emoji, categoria, tags e ingredientes buscados passam
por `escapeHtml()` antes de entrar no template — `recipe.image` não. Risco
prático baixo hoje (só admin autenticado escreve receitas), mas é o único
campo sem sanitização, e uma aspa dupla no valor quebra o atributo. Vale
corrigir como defesa em profundidade, especialmente se no futuro a
importação por URL (já existente, Fase 4) alimentar esse campo com dado
menos controlado.

**Correção proposta:** `<img src="${escapeHtml(recipe.image)}" ...>` —
checar se o mesmo padrão se repete no modal de receita e no modo preparo.

**Esforço estimado:** trivial.

---

### A2. `receitas.js` — ver seção 2 acima (resíduo de bug já resolvido)

**Esforço estimado:** trivial (confirmar uso + mover/deletar).

---

### A3. `console.log` de debug esquecidos em produção

**Onde:** `src/main.js`, `loadRecipeDetailsById()` e
`openRecipeModalWithDetails()` (linhas ~248-287)

**Problema:** 7 chamadas `console.log('[DEBUG Modal] ...')` logam o objeto
inteiro da receita a cada abertura de modal — não é bug funcional, mas polui
o console em produção e expõe estrutura de dados interna.

**Correção proposta:** remover, ou trocar por logger com flag de ambiente
(`if (DEBUG) console.log(...)`).

**Esforço estimado:** trivial.

---

### A4. 12MB de PNGs commitados sem otimização — decisão unificada com B2

**Onde:** `public/*.png` (127 arquivos, alguns de 500-700KB)

**Problema:** infla o clone/build do repositório. `performance-guards.js` já
implementa `loading="lazy"` para cards fora da dobra — a otimização do
arquivo em si (formato/tamanho) é o que falta.

**Ajuste em relação à versão anterior:** originalmente eu tinha separado
"otimizar as imagens existentes" (A4) de "otimizar automaticamente no upload"
(B2, seção 4). Faz mais sentido tratar como **uma decisão só**: se o destino
final é Supabase Storage/CDN com pipeline de otimização automática (B2), vale
resolver esse pipeline primeiro e rodar as imagens existentes por ele — em
vez de converter tudo para WebP agora em `public/` e, depois, ter que
reprocessar de novo ao migrar para o Storage. Ver B2 (seção 4) para o
racional completo; a ação prática de A4 fica condicionada a essa decisão.

**Correção proposta:**
- Decidir primeiro: manter em `public/` só com WebP, ou migrar para Supabase
  Storage/CDN.
- Se a decisão for Storage (recomendado, ver B2): construir o pipeline de
  upload com otimização automática primeiro, e rodar as 127 imagens
  existentes por ele como parte da migração — um único processo, não dois.
- Se a decisão for manter em `public/` por enquanto: converter para WebP
  agora é suficiente, sem depender de B2.

**Esforço estimado:** pequeno-médio (conversão em lote) a médio (se for
acompanhada da migração para Storage).

---

### A5. Fila de sincronização offline não reflete estado pendente na UI

**Onde:** `src/cache/db.js`, `processarFilaOnline()`

**Problema:** o histórico de bugs do ROADMAP mostra que o **tratamento de
erro** na sincronização já foi resolvido (Fase 1) — mas o resultado desse
tratamento (quantos itens estão na fila, se algum atingiu `MAX_TENTATIVAS`)
não é exposto visualmente, só em `console.log`/`console.warn`. É um passo
além do que já foi corrigido: a sincronização funciona e falha com
segurança, mas o admin não vê o status.

**Correção proposta:** expor contagem de itens pendentes
(`lerFilaSincronizacao()` já retorna isso) como badge simples no admin;
opcionalmente diferenciar itens travados em `MAX_TENTATIVAS`.

**Esforço estimado:** pequeno (dado já existe, é só expor).

---

## 4. Frente B — Melhorias (não cobertas pelo ROADMAP)

### B1. Badge de sincronização pendente no admin (extensão direta de A5)

Evoluir A5 para um painel de status simples: "Online e sincronizado" / "N
alterações pendentes" / "Erro de sincronização", reaproveitando `tentativas`
e `ultimo_erro` já guardados por item da fila.

**Esforço:** pequeno-médio.

---

### B2. Otimização automática de imagem no upload (admin) — decidir junto com A4

Evita que o problema de A4 volte a se acumular: converter/redimensionar no
momento do upload (client-side antes de enviar ao Storage, ou via Edge
Function), reaproveitando a infra de `supabase/functions` já existente. Como
descrito em A4, o ideal é que este pipeline seja construído **antes** de
converter manualmente as 127 imagens já existentes, e que essas imagens
passem pelo mesmo pipeline — evita fazer o trabalho de otimização duas vezes
(uma vez manual agora, outra ao migrar para Storage depois).

**Esforço:** médio.

---

### B3. Modo "o que posso cozinhar com o que eu tenho" mais visível

`recipeIsFullyStocked()` e `recipeHasAnyPantryIngredient()` já existem em
`src/logic/recipes.js`, com badge "✅ Você tem tudo" quando o filtro de
despensa está ativo. É uma feature forte, mas escondida atrás de um filtro
opcional. Vale uma seção de destaque na home ("Você pode fazer agora"),
composição de UI sobre lógica que já existe e já está testada.

**Esforço:** pequeno-médio.

---

### B4. Web Share API na lista de compras — ver ressalva na seção 2

Complementar (não substituir) o que já está planejado como "Lista
colaborativa" no ROADMAP. Ver sequenciamento recomendado na seção 2.

**Esforço:** pequeno.

---

## 5. Ordem sugerida de execução

| # | Item | Origem | Prioridade | Motivo |
|---|------|--------|------------|--------|
| 1 | A1 — escapar `recipe.image` | Código | 🔥 Alta | Risco de segurança, correção trivial. |
| 2 | A3 — remover `console.log` de debug | Código | 🔥 Alta | Trivial, vaza dado interno em produção. |
| 3 | A2 — remover/mover `receitas.js` | Código + Roadmap | 🟢 Rápida | Fecha loose end de bug já marcado como resolvido no ROADMAP. |
| 4 | A5 + B1 (entregues juntos) | Código | 🟡 Média | Fecha o ciclo do tratamento de erro de sync já resolvido (Fase 1), expondo o resultado na UI. |
| 5 | A4 + B2 (decisão e execução unificadas) | Código | 🟡 Média | Evita otimizar as 127 imagens existentes duas vezes — construir o pipeline (B2) e rodar o acervo atual (A4) por ele. |
| 6 | B3 — destaque do modo despensa | Código | 🚀 Feature | Reaproveita lógica pronta e testada. |
| 7 | **Lista colaborativa (Supabase Realtime)** | ROADMAP Fase 4 (pendente) | 🚀 Feature (já planejada) | Definir modelo de dados antes de investir mais na lista atual (ver B4). |
| 8 | B4 — Web Share na lista de compras | Código | 🚀 Feature | Complementa item 7, não compete — pode entrar antes ou depois. |
| 9 | **Notificações push** | ROADMAP Fase 4 (pendente) | ⏸️ Baixa/backlog | Já planejada, mas com custo de infra persistente maior do que o ROADMAP detalha — mesma ressalva feita para o AniMatch. |

---

## 6. Próximos passos

- Validar com o mantenedor (você) se A2 pode ser fechado como parte do
  histórico de bugs do ROADMAP (ele já cita o bug relacionado como
  resolvido — faria sentido atualizar essa entrada mencionando a limpeza do
  arquivo de origem).
- A1 e A3 podem sair numa única PR trivial de hardening + cleanup.
- Antes de priorizar "Notificações push" da Fase 4, vale um levantamento de
  esforço específico (Edge Function + cron + VAPID + tabela de
  subscriptions), já que o ROADMAP hoje só marca como pendente sem detalhar
  a complexidade.
- Ao planejar "Lista colaborativa", considerar se B4 (Web Share) entra antes
  como ganho rápido e independente, já que não compete com o modelo de dados
  do Realtime.
- Para A4+B2: decidir o destino final das imagens (Storage/CDN vs. `public/`
  com WebP) antes de converter qualquer arquivo, para não reprocessar as 127
  imagens duas vezes.

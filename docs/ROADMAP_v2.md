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
09/08/2026):

- **Fase 1 (Estabilização Offline)** — 🟢 100% concluída
- **Fase 2 (Performance & Arquitetura)** — 🟢 100% concluída
- **Fase 3 (Funcionalidades de Experiência)** — 🟢 100% concluída
- **Fase 4 (Avançado & IA)** — 🟡 50% concluída, com 2 itens pendentes:
  - [ ] Lista colaborativa (Supabase Realtime)
  - [ ] Notificações push (planejamento semanal / lista de compras)

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

### A1. `recipe.image` sanitização de imagem / atributos — CONCLUÍDA ✅

Migração para React elimina XSS por injeção direta de string em HTML (prop `src={recipe.image}` com escape nativo do JSX em `RecipeCard.jsx`). O estilo inline de background em [`RecipeModal.jsx`](file:///C:/Sistemas/Projetos/receitas/src/components/RecipeModal.jsx) foi blindado com sanitização de aspas e `encodeURI()`.

---

### A2. `receitas.js` — ver seção 2 acima (resíduo de bug já resolvido)

**Esforço estimado:** trivial (confirmar uso + mover/deletar).

---

### A3. `console.log` de debug esquecidos em produção — CONCLUÍDO ✅

Os logs verbosos `[DEBUG Modal]` presentes na versão legada vanilla foram eliminados na refatoração e migração para os componentes React (`RecipeModal.jsx` / `App.jsx`). Verificação via grep confirmou a ausência de logs residuais.

---

### A4. 12MB de PNGs commitados sem otimização

**Onde:** `public/*.png` (127 arquivos, alguns de 500-700KB)

**Problema:** infla o clone/build do repositório. `performance-guards.js` já
implementa `loading="lazy"` para cards fora da dobra — a otimização do
arquivo em si (formato/tamanho) é o que falta.

**Correção proposta:** converter para WebP; médio prazo, considerar Supabase
Storage/CDN em vez de versionar binários grandes no Git.

**Esforço estimado:** pequeno-médio.

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

### A6. Otimização de Performance da Página Principal (Code-Splitting & Query Inicial Leve)

**Onde:** `src/App.jsx`, `src/components/`, chamadas Supabase

**Problema:** Carregamento síncrono de modais e drawers (`PlannerDrawer`, `ShoppingDrawer`, `PantryDrawer`, `RecipeModal`, `CookingMode`) inflando o bundle JS principal, somado a busca de dados profundos (`ingredientes` completos e `passos`) de todas as receitas no primeiro paint.

**Correção proposta:** Code-splitting com `React.lazy()` para gavetas/modais + divisão da query Supabase em listagem rasa e detalhes sob demanda.

**Spec detalhada:** Ver [`docs/superpowers/specs/2026-08-25-performance-pagina-principal-design.md`](superpowers/specs/2026-08-25-performance-pagina-principal-design.md).

**Esforço estimado:** Médio.

---

## 4. Frente B — Melhorias (não cobertas pelo ROADMAP)

### B1. Badge de sincronização pendente no admin (extensão direta de A5)

Evoluir A5 para um painel de status simples: "Online e sincronizado" / "N
alterações pendentes" / "Erro de sincronização", reaproveitando `tentativas`
e `ultimo_erro` já guardados por item da fila.

**Esforço:** pequeno-médio.

---

### B2. Otimização automática de imagem no upload (admin) — CONCLUÍDA ✅

Implementado pipeline de compressão client-side (WebP máx 800px) e upload direto para o Supabase Storage (`recipe-images`), com componente `ImageUploadField` no admin e limpeza automática de fotos substituídas/excluídas.
Ver [`docs/spec-image-optimization-pipeline-chef-digital.md`](spec-image-optimization-pipeline-chef-digital.md).

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

## 5. Inconsistências Identificadas & Melhorias Técnicas

### 5.1 Inconsistências Mapeadas
1. **Duplicação de código:** Funções como `normalizeSearchText()` e regras de busca/filtro repetidas em múltiplos arquivos (`src/logic/recipes.js`, `src/logic/recipes-filter.js`, `src/main.js`).
2. **Ambiente de dependências:** Divergência de versão do Node.js (engines/libs exigindo Node v22+, ambiente local/CI em v20.19.5).
3. **Fragilidades no Shopping List:** `generateShoppingList()` pode retornar `null` em vez de objeto vazio `{}` em cenários vazios/inválidos, quebrando encadeamentos.
4. **Parser de Receita (Edge Function):** Timeout fixo de 12s insuficiente para parsing pesado de IA + ausência de rate limiting explícito.
5. **Gestão de Estado & Storage:** Acesso direto espalhado a `localStorage` sem camada unificada de abstração/tipagem defensiva.
6. **Tratamento de Erros:** Supabase Edge Function retornando status HTTP 200 contendo corpo com erro, mascarando falhas para clientes HTTP.

### 5.2 Sugestões de Melhoria por Prioridade

#### 🔥 Alta Prioridade
- **Eliminar duplicações de utilitários:** Criar módulo compartilhado `src/utils/text.js` consolidando `normalizeSearchText` e lógicas correlatas de strings.
- **Estabilizar ambiente de build/testes:** Harmonizar versão do Node.js (via `.nvmrc` / `package.json` engines) ou ajustar dependências conflitantes.
- **Robustez na Lista de Compras:** Garantir retorno `{}` padronizado em vez de `null` e blindar parsing.
- **Normalização de Unidades:** Implementar parser/normalizador de unidades de medida (ex: `g`/`kg`, `xícara`/`xícaras`) antes da consolidação e agregação de quantidades.

#### 🟡 Média Prioridade
- **Resiliência na Edge Function:** Implementar retries com backoff exponencial, circuit breaker e status HTTP semânticos (4xx/5xx).
- **Validação Cruzada de Categorias:** Unificar enum/validação de categorias e tags entre backend/Edge Function e frontend.
- **Limitação de Histórico:** Implementar política de retenção / LRU limitando o tamanho do histórico de `cooking` no storage local.
- **Camada de Abstração de Armazenamento:** Centralizar leituras/escritas de `localStorage` em wrapper defensivo (fallback gracioso e parse seguro).

#### 🟢 Baixa Prioridade / Backlog Técnico
- **Linting & Code Quality:** Configurar regras estritas de ESLint/Prettier específicas do projeto.
- **Testes de Integração:** Expandir cobertura com testes integrando módulos de dados, cache e UI.
- **Migração Gradual para TypeScript:** Introduzir tipagem estática nos módulos de lógica de negócio e contratos de dados.
- **Documentação de Contratos de API:** Documentar esquemas de payload/resposta das Edge Functions e estruturas de dados do IndexedDB/Storage.

---

## 6. Ordem sugerida de execução

| # | Item | Origem | Prioridade | Motivo |
|---|------|--------|------------|--------|
| 1 | A1 — escapar `recipe.image` / sanitização de imagem | Código | 🟢 Concluído | JSX prop nativo + encodeURI/strip quotes no modal background. |
| 2 | A3 — remover `console.log` de debug | Código | 🟢 Concluído | Limpeza efetuada na migração React; sem resíduos de logs no modal. |
| 3 | Módulos utilitários compartilhados (`normalizeSearchText`) | Análise | 🟢 Concluído | Criado `src/utils/text.js` e suite de testes, eliminando duplicações em `recipes.js` e `recipes-filter.js`. |
| 4 | Robustez shopping list + normalização de unidades | Análise | 🟢 Concluído | Criado `src/utils/units.js`, garantido retorno padronizado `{}` e agregação correta de unidades em `calculateConsolidatedShoppingList`. |
| 5 | Harmonização de ambiente Node.js / deps | Análise | 🔥 Alta | Garante reprodutibilidade de CI/CD e testes. |
| 6 | A2 — remover/mover `receitas.js` | Código + Roadmap | 🟢 Rápida | Fecha loose end de bug já marcado como resolvido no ROADMAP. |
| 7 | A6 — Otimização de Performance Home | Código + Spec | 🟡 Média | Code-splitting e otimização de payload inicial Supabase (reduz JS/FCP/TBT). |
| 8 | Resiliência & status HTTP na Edge Function | Análise | 🟡 Média | Corrige retorno 200 em erros e adiciona retry/timeout seguro. |
| 9 | Camada de abstração para Storage + limite de histórico | Análise | 🟡 Média | Protege `localStorage` contra corrupção e estouro de cota. |
| 10 | A5 + B1 (entregues juntos) | Código | 🟡 Média | Fecha o ciclo do tratamento de erro de sync já resolvido (Fase 1), expondo o resultado na UI. |
| 11 | A4 — otimizar imagens existentes | Código | 🟡 Média | Impacto em tempo de build/clone; pode ser feito em lote. |
| 12 | B3 — destaque do modo despensa | Código | 🚀 Feature | Reaproveita lógica pronta e testada. |
| 13 | **Lista colaborativa (Supabase Realtime)** | ROADMAP Fase 4 | 🚀 Feature (já planejada) | Definir modelo de dados antes de investir mais na lista atual (ver B4). |
| 14 | B4 — Web Share na lista de compras | Código | 🚀 Feature | Complementa item 13, não compete — pode entrar antes ou depois. |
| 15 | B2 — otimização automática de imagem no upload | Código | 🟢 Concluído | Pipeline de compressão WebP + upload Supabase Storage no Admin. |
| 16 | Backlog técnico (Linting, TypeScript, Testes integração) | Análise | ⏸️ Baixa | Evolução incremental de manutenibilidade. |
| 17 | **Notificações push** | ROADMAP Fase 4 | ⏸️ Baixa/backlog | Já planejada, mas com custo de infra persistente maior do que o ROADMAP detalha — mesma ressalva feita para o AniMatch. |

---

## 7. Próximos passos

- Validar com o mantenedor (você) se A2 pode ser fechado como parte do
  histórico de bugs do ROADMAP (ele já cita o bug relacionado como
  resolvido — faria sentido atualizar essa entrada mencionando a limpeza do
  arquivo de origem).
- A1 e A3 podem sair numa única PR trivial de hardening + cleanup.
- Extrair `normalizeSearchText` para `src/utils/text.js` e atualizar callers.
- Corrigir `generateShoppingList` (retorno de `{}`) e adicionar normalização de unidades.
- A6 (Performance da Home) está especificado em `docs/superpowers/specs/2026-08-25-performance-pagina-principal-design.md` pronto para ser planejado/executado.
- Antes de priorizar "Notificações push" da Fase 4, vale um levantamento de
  esforço específico (Edge Function + cron + VAPID + tabela de
  subscriptions), já que o ROADMAP hoje só marca como pendente sem detalhar
  a complexidade.
- Ao planejar "Lista colaborativa", considerar se B4 (Web Share) entra antes
  como ganho rápido e independente, já que não compete com o modelo de dados
  do Realtime.

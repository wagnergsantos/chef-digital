# Roadmap Visual — Chef Digital

> Baseado na avaliação Lighthouse + auditoria técnica realizada em `docs/relatorio_receitas.report.json`.

## Linha de base (snapshot atual)

- **Audit Health Score (último `impeccable audit`):** **14/20** (Good)
- **Lighthouse (mobile):**
  - Performance: **84**
  - Accessibility: **100**
  - Best Practices: **96**
  - SEO: **91**

## Como usar

- Marque `[x]` quando concluir cada item.
- Reavalie o app após blocos importantes.
- Atualize os resultados na seção de histórico ao final.

---

## P1 — Prioridade alta (antes de release)

### 1) Performance inicial (LCP/TTI/JS não utilizado)
- [ ] **Otimizar caminho crítico de carregamento**
  - **Problema:** houve regressão no último run (LCP **3.2s**, FCP **3.2s**), apesar de TTI **3.2s** e TBT **10ms**; ainda há JS não utilizado (~46 KiB no bundle `supabase-*.js`).
  - **Ação sugerida:** `$impeccable optimize`
  - **Critério de pronto:** LCP < 2.5s (ou redução substancial validada), queda do JS não utilizado e melhora perceptível no render inicial.

### 2) Instabilidade visual (CLS)
- [ ] **Reduzir deslocamento de layout**
  - **Problema:** CLS melhorou para **0.108**, mas ainda acima da meta (**<= 0.10**).
  - **Ação sugerida:** `$impeccable adapt`
  - **Critério de pronto:** CLS <= 0.10 e ausência de saltos perceptíveis em mobile.

### 3) Acessibilidade de contraste nos cards
- [x] **Corrigir contraste insuficiente**
  - **Problema:** falhas reportadas em `.card-title`, `.card-ingredients-count`, `.card-servings-count`, `.card-tag-badge`.
  - **Ação sugerida:** `$impeccable audit`
  - **Critério de pronto:** contraste conforme WCAG AA (texto normal >= 4.5:1) nos estados relevantes.

### 4) Hierarquia semântica de headings
- [x] **Ajustar ordem de títulos**
  - **Problema:** `heading-order` falhando (uso de `<h4 class="card-title">`).
  - **Ação sugerida:** `$impeccable harden`
  - **Critério de pronto:** sem falha de `heading-order` no Lighthouse.

---

## P2 — Importante (próxima passada)

### 5) Custo de main thread (layout/style)
- [ ] **Reduzir trabalho de style/layout no carregamento**
  - **Problema:** ~900ms em `styleLayout`.
  - **Ação sugerida:** `$impeccable optimize`
  - **Critério de pronto:** redução relevante no `mainthread-work-breakdown`.

### 6) Robustez de CSS no bloco `.card-title`
- [ ] **Normalizar sintaxe e validar impacto visual**
  - **Problema:** ocorrência suspeita em `estilos.css` no seletor de `.card-title`.
  - **Ação sugerida:** `$impeccable polish`
  - **Critério de pronto:** bloco CSS consistente e comportamento tipográfico estável.

---

## P3 — Polimento

### 7) Revisão de custom scrollbar
- [ ] **Validar necessidade vs. padrão nativo**
  - **Problema:** customização pode gerar inconsistências sem ganho funcional.
  - **Ação sugerida:** `$impeccable distill`
  - **Critério de pronto:** decisão documentada (manter ou simplificar) com consistência cross-browser.

---

## Sequência recomendada de execução

1. `$impeccable optimize`
2. `$impeccable harden`
3. `$impeccable audit`
4. `$impeccable adapt`
5. `$impeccable polish`
6. `$impeccable distill` (opcional/polimento)
7. **Reexecutar:** `$impeccable audit`

---

## Histórico de reavaliações

| Data | Performance | Accessibility | Best Practices | SEO | Health Score | Observações |
|---|---:|---:|---:|---:|---:|---|
| 2026-08-05 | 75 | 95 | 96 | 91 | 14/20 | Baseline inicial |
| 2026-08-06 | 87 | 100 | 96 | 91 | — | Reexecução Lighthouse após optimize/harden/adapt |
| 2026-08-06 | 84 | 100 | 96 | 91 | — | Reexecução após deploy + adapt (2a passada) |

## Registro de execução

- **2026-08-05 — `$impeccable optimize` iniciado**
  - Inicialização antecipada para `DOMContentLoaded` (antes de `window.onload`).
  - Leituras de cache (`IndexedDB`) e consultas Supabase paralelizadas com `Promise.all`.
  - Escrita de cache movida para caminho não bloqueante (sem bloquear render).
  - Cliente Supabase carregado sob demanda (dynamic import), removendo preload do bundle pesado no HTML inicial.
  - Menos trabalho por card no render inicial (delegação de teclado no grid e prioridade de imagens do topo).
  - Correção de trechos CSS inválidos com `\n` literal que quebravam minificação/parse.
  - **Pendente:** reexecutar Lighthouse para confirmar ganho em LCP/TTI/CLS e atualizar a tabela acima.

- **2026-08-06 — `$impeccable harden` aplicado**
  - Ajuste de semântica no card (`.card-title` deixou de usar heading e passou para texto semântico), removendo a quebra de hierarquia de títulos.
  - Sanitização reforçada no template dos cards para dados dinâmicos em atributos/texto (título, categoria, emoji e rendimento).
  - Guardas para payload parcial/corrompido (fallback para `ingredients` e `servings`) evitando que o render quebre em dados incompletos.

- **2026-08-06 — `$impeccable adapt` aplicado**
  - Viewport atualizado com `viewport-fit=cover` para telas com notch/safe-area.
  - Reserva de espaço inicial na grade de receitas (`data-app-loading`) com placeholder para reduzir shift no primeiro paint.
  - Estabilização de cabeçalho de resultados (altura mínima e layout vertical no mobile).
  - Ajustes responsivos estruturais no topo e sidebar em telas <=900px.
  - Badge de contagem estabilizado visualmente no estado oculto para evitar micro-shifts.

- **2026-08-06 — `$impeccable adapt` (2a passada CLS)**
  - Reserva de altura da grade no carregamento ajustada para proporção de viewport (evita troca brusca de placeholder pequeno para lista real).
  - Reserva de espaço da sidebar durante boot (`data-app-loading`) para evitar empurrar o conteúdo principal após popular filtros.

- **2026-08-06 — Lighthouse reexecutado (`docs/relatorio_receitas.report.json`)**
  - Melhoria confirmada: **Performance 75 -> 87** e **Accessibility 95 -> 100**.
  - Métricas-chave: **LCP 2.2s**, **TTI 3.5s**, **FCP 2.2s**.
  - Pendência principal: **CLS 0.173** (ainda acima da meta <= 0.10).
  - Pendência secundária: JS não utilizado (~46 KiB em `supabase-*.js`) e `styleLayout` ainda elevado no main thread.

- **2026-08-06 — Lighthouse pós deploy (fetchTime 03:42:49Z)**
  - Resultado: **Performance 84**, **Accessibility 100**, **Best Practices 96**, **SEO 91**.
  - Vitals: **LCP 3.2s**, **FCP 3.2s**, **TTI 3.2s**, **TBT 10ms**, **CLS 0.108**.
  - Leitura: CLS melhorou significativamente (**0.173 -> 0.108**), mas ainda fora da meta; houve regressão de LCP/FCP em relação ao run anterior.

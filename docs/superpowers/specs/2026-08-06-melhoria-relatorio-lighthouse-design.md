# Design: Melhorias a partir do relatorio Lighthouse (relatorio_receitas.report.json)

## Objetivo

Melhorar a nota de Performance sem regressao funcional, priorizando ganhos balanceados de impacto x esforco. O foco principal e reduzir LCP/FCP/SI e corrigir pendencias objetivas de SEO e acessibilidade identificadas no relatorio.

## Escopo

Inclui:
- Remocao de CSS do admin no carregamento da home.
- Otimizacao de imagens de cards de receitas.
- Reducao de JavaScript nao utilizado no bootstrap inicial.
- Ajustes de meta description e nome acessivel em cards.

Nao inclui:
- Reescrita ampla de arquitetura de modulos.
- Mudanca de UX do produto.
- Refatoracoes fora do caminho critico do relatorio atual.

## Arquitetura proposta

### 1) Pipeline de assets por contexto (publico vs admin)

Separar estritamente assets do `index.html` e `admin.html`, evitando que a home receba CSS exclusivo do painel administrativo durante o carregamento inicial.

Resultado esperado:
- `dist/index.html` sem referencia a `assets/admin-*.css`.
- Menos requests render-blocking no caminho critico da home.

### 2) Camada de midia otimizada para cards

Padronizar entrega de imagem com formatos modernos e responsivos:
- Geracao de variantes WebP/AVIF com fallback.
- Uso de `srcset` e `sizes` nos cards.
- Manter `loading` e `fetchpriority` com estrategia atual para acima/abaixo da dobra.

Resultado esperado:
- Reducao de bytes transferidos nas imagens com maior impacto no relatorio.
- Melhor LCP e Speed Index em mobile.

### 3) Bootstrap de dados em duas fases

Hoje a carga inicial puxa lista + ingredientes + passos. A proposta e:
- Fase 1 (inicial): carregar somente dados necessarios para render da grade (`id, title, category_id/category, emoji, image, servings, tips, tags`).
- Fase 2 (sob demanda): buscar ingredientes/passos ao abrir modal da receita.
- Cache local reaproveitavel para evitar chamadas repetidas.

Resultado esperado:
- Menor payload inicial e menor custo de parse/execucao para primeiro render.

### 4) Gate de qualidade SEO/A11y no mesmo ciclo

Aplicar dois ajustes de baixo risco:
- Inserir `meta description` na home.
- Corrigir mismatch entre texto visivel e nome acessivel nos cards clicaveis, garantindo que o nome acessivel contenha exatamente o titulo exibido no card.

Resultado esperado:
- Resolver alertas do relatorio atual em SEO/A11y sem alterar comportamento principal.

## Componentes afetados

- `vite.config.js` (entrada/build e isolamento de assets).
- `index.html` (meta description e possiveis hints de carregamento).
- `src/modules/recipes-render.js` (imagem responsiva e ajustes de acessibilidade dos cards).
- `src/main.js` (orquestracao do carregamento em duas fases).
- Eventuais scripts de build de imagem em `scripts/` (se necessario para gerar variantes).

## Fluxo de dados

1. App inicia com dados minimos para listar receitas.
2. Grid renderiza cards com imagem otimizada.
3. Usuario abre receita.
4. Se detalhes nao estiverem em cache, carregar ingredientes/passos sob demanda.
5. Persistir detalhes no cache local para proximas aberturas.

## Tratamento de erros

- Falha no fetch sob demanda deve ser exibida ao usuario no contexto do modal com opcao de tentar novamente.
- Falha de cache local nao deve interromper uso normal com backend remoto.
- Nao usar fallback silencioso que esconda erro.

## Estrategia de testes e validacao

- `npm run build`: validar saida e confirmar ausencia de CSS admin na home buildada.
- `npm run test`: garantir regressao zero de regras de negocio existentes.
- `npm run lint`: manter consistencia e padrao do projeto.
- Nova rodada de auditoria Lighthouse para comparar:
  - LCP
  - FCP
  - Speed Index
  - Pendencias de `meta-description` e `label-content-name-mismatch`

## Criterios de sucesso

- Home nao carrega `admin-*.css` no caminho critico.
- Queda de bytes de imagem nos recursos de maior peso.
- Reducao de JavaScript nao utilizado no carregamento inicial.
- Melhora mensuravel de LCP/FCP/SI na auditoria seguinte.
- Resolucao das pendencias SEO/A11y apontadas no relatorio atual.

## Plano de entrega (fases)

1. Isolamento de CSS/entrada de build.
2. Otimizacao de imagens dos cards.
3. Bootstrap em duas fases (dados sob demanda).
4. Ajustes SEO/A11y e auditoria final.

# 📋 Roadmap & Avaliação do Projeto Chef Digital

Documento de acompanhamento do status de desenvolvimento, arquitetura, bugs resolvidos, refatorações e roadmap de funcionalidades do PWA **Chef Digital**.

---

## 🎨 **TODO: POLIMENTO VISUAL & UX (Skill Impeccable)**

- [x] **Item 1: Fix no Scroll do Card de Categorias/Sidebar**
  - Ajustar `.sidebar-sticky` com `max-height: calc(100vh - 120px); overflow-y: auto;` em telas desktop/tablet para permitir rolar todas as categorias sem depender do scroll completo da página/grid de receitas.
  
- [x] **Item 2: Realocação do botão "Iniciar Modo Preparo"**
  - Mover o botão para o cabeçalho superior de ações do Modal de Receitas (ao lado de Imprimir, Planejar, Adicionar à Lista e Tela Ativa) como um botão CTA destacado.

- [x] **Item 3: Fix na quebra de linha do seletor de pessoas/porções**
  - Aplicar `white-space: nowrap; align-items: center; width: max-content;` no container `.portion-controls` e `.portion-value` para impedir a quebra `- 4 pessoas +` em duas linhas (testado para telas pequenas como 342px).

- [x] **Item 4: Remoção dos Checkboxes de Ingredientes no Modal de Receita**
  - Removidos os checkboxes interativos e manipuladores de clique do modal em `src/modules/recipe-modal.js` e `estilos.css`. A lista de ingredientes do modal agora exibe um layout limpo, elegante e fluido com marcadores sutis (`.ing-bullet`), deixando a interatividade de riscar exclusivamente para a Lista de Compras e para o Modo Preparo.

- [x] **Item 5: Responsividade do Menu Planejador & Lista de Compras (Drawers Mobile)**
  - Ajustado em `estilos.css` com suporte responsivo total para telas pequenas a partir de 342px de largura (width: 100vw fluido, padding inteligente sem estouros horizontais e sem necessidade de zoom out).

- [x] **Item 6: Otimização de Altura Vertical do Card de Categorias (Viewports Curtos/Laptops)**
  - Ajustado em `estilos.css`: o container `.sidebar-sticky` agora usa `top: 80px`, `max-height: calc(100vh - 95px)` e a lista interna `.categories-filter-list` usa `max-height: calc(100vh - 280px)` fluida com rolagem própria dedicada. Garante exibição de 100% das categorias até em resoluções como 1280x559.

- [x] **Item 7: Ajuste de Largura e Ações Superiores para Smartphones Pequenos (342px)**
  - Atualizados `index.html` e `estilos.css`: os botões de ação do topo do modal foram reagrupados em uma barra flexível responsiva (`.modal-top-actions`), e o padding/tamanho de botões dos Drawers (Carrinho e Planejador) foram recalibrados para telas de 342px de largura sem cortar conteúdo nem exigir zoom out.

---

## 🚀 **ROADMAP DE DESENVOLVIMENTO**

### Fase 1 (Crítico & Estabilização Offline) — 🟢 100% Concluído
- [x] **Corrigir bug da variável `receitasData`**: Removida dependência global estática em `src/main.js`.
- [x] **Resolver conflito de Service Workers**: Registro unificado via `vite-plugin-pwa` (`virtual:pwa-register`) e remoção do `sw.js` legado.
- [x] **Implementar tratamento de erro na sincronização**: Fallback direto para `upsert` em tabelas Supabase adicionado em `src/cache.js`.

---

### Fase 2 (Performance & Arquitetura) — 🟢 100% Concluído
- [x] **Debounce na busca**: Adicionado debounce de 250ms em `filterRecipes()`.
- [x] **Refatoração & Modularização de Código (Extra)**: Monólito `src/main.js` refatorado e dividido em 8 módulos em `src/modules/` (`state.js`, `theme.js`, `recipes-render.js`, `recipe-modal.js`, `planner-drawer.js`, `shopping-drawer.js`, `pantry-modal.js`, `cooking-mode.js`) com Event Delegation no container de receitas.
- [x] **Skeleton loading**: Placeholders animados (efeito *shimmer*) exibidos instantaneamente no HTML e via `renderSkeletonCards()` no `recipes-render.js` durante o carregamento do IndexedDB e Supabase.
- [x] **Virtualização da lista (Infinite Scroll)**: Renderização sob demanda via `IntersectionObserver` (lotes de 12 cards com `rootMargin: 200px`) em `src/modules/recipes-render.js`, garantindo performance máxima do DOM.
- [x] **Estabilização de Ordenação & Render Diffing**: Ordenação determinística de receitas (`title.localeCompare`) e comparação de estado cache vs. rede no `src/main.js` para eliminar layout shifts, reordenações visuais e piscar de tela.

---

### Fase 3 (Funcionalidades de Experiência) — 🟢 100% Concluído
- [x] **Modo Preparo completo**: Implementado em `src/modules/cooking-mode.js` com interface imersiva full-screen, Wake Lock API (para manter a tela ativa), navegação por passos, detecção automática de timers de tempo com alarme e painel retrátil de ingredientes.
- [x] **Compartilhamento de receitas**: Adicionada função `shareRecipe()` com suporte a Web Share API (WhatsApp/Redes) e fallback automático para cópia de texto formatado na área de transferência com notificação Toast.
- [x] **Histórico de preparo**: Registro automático de dados de preparo (data/hora e contador de conclusões) ao finalizar o Modo Preparo (`recordRecipeCompletion()`), além da exibição de selo informativo no modal da receita (`👨‍🍳 Preparado Xx (DD/MM)`).
- [x] **Leitura assistida do modo de preparo (Acessibilidade - SpeechSynthesis TTS)**: Botão `Ouvir / Pausar Voz` em `src/modules/cooking-mode.js` para leitura em voz alta dos passos em Português usando a Web Speech API nativa.

---

### Fase 4 (Avançado & Inteligência Artificial) — 🟡 50% Concluído
- [x] **Integração com IA para Importação de Receitas**: Parser inteligente via Edge Function Supabase + Gemini 1.5 Flash com suporte a rotação de múltiplas chaves de API (`GEMINI_KEY_1..N`) e fallback automático para limite diário. Extração estruturada a partir de texto livre.
- [x] **Importação de URLs**: Scraping/parsing automático de blogs de receitas usando `Recipe Schema.org` (JSON-LD) e extração de texto HTML com pré-preenchimento automático da URL fonte.
- [ ] **Lista colaborativa**: Sincronização em tempo real da lista de compras entre múltiplos usuários via Supabase Realtime.
- [ ] **Notificações push**: Lembretes de planejamento semanal de refeições e alertas de listas de compras.

---

## 💰 **ANÁLISE DE CUSTOS & ARQUITETURA**

| Funcionalidade | API / Tecnologia | Custo Financeiro (Execução) | Custo de Dev (Sessão) |
|---|---|---|---|
| **Leitura por Voz (TTS)** | Web Speech API (`SpeechSynthesis`) | 🟢 **R$ 0,00** (Nativo do Navegador, 100% Offline) | 🟢 **Baixo** (~1 rodada) |
| **Compartilhamento & Print** | Web Share API / `window.print()` | 🟢 **R$ 0,00** (APIs Nativas) | 🟢 **Baixo** |
| **Histórico de Preparo** | IndexedDB / LocalStorage | 🟢 **R$ 0,00** (Armazenamento Local) | 🟢 **Baixo** |
| **Importador de URL (Scraping)** | `Schema.org/Recipe` (JSON-LD) | 🟢 **R$ 0,00** (Gratuito) | 🟡 **Médio** |
| **Importador com IA (Gemini)** | Google Gemini 1.5 Flash API | 🟢 **R$ 0,00** (Cota Grátis: 1.500 req/dia)<br>*(~R$ 0,05 por 100 receitas se exceder cota)* | 🟡 **Médio-Alto** |

---

## 🐛 **HISTÓRICO DE BUGS E CORREÇÕES**

1. **[RESOLVIDO] Referência a Variável Global Obsoleta (`receitasData`)**
   - *Solução*: Dados buscados diretamente do estado reativo em memória (`recipes`).
2. **[RESOLVIDO] Service Worker Manual + Plugin PWA Conflitantes**
   - *Solução*: `sw.js` removido e registro delegado 100% ao Vite PWA.
3. **[RESOLVIDO] Falta de Tratamento de Erro na Sincronização Offline**
   - *Solução*: Implementado fallback em `src/cache.js` para operações da fila de sincronização.
4. **[RESOLVIDO] Acoplamento e Re-renderizações do Monólito `main.js`**
   - *Solução*: Arquitetura modularizada em `src/modules/` e manipulação de eventos por delegação no DOM.
5. **[RESOLVIDO] Layout Shift e Reordenação Visual das Receitas**
   - *Solução*: Ordenação alfabética determinística (`title.localeCompare`) e render diffing para sincronia entre IndexedDB e Supabase.

---

## 📊 **MÉTRICAS DO CÓDIGO**

| Métrica | Valor Atual | Status |
|---------|-------------|--------|
| Linhas em `main.js` | ~175 | 🟢 Excelente (Modularizado) |
| Módulos em `src/modules/` | 8 arquivos | 🟢 Alta coesão |
| PWA & Cache Offline | Ativo (IndexedDB + PWA) | 🟢 Funcional |
| Performance Lighthouse | FCP/LCP Otimizados + TBT 80ms | 🟢 Excelente |

---

*Última atualização: 09/08/2026*

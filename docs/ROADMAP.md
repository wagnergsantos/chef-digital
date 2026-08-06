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

### Fase 2 (Performance & Arquitetura) — 🟡 70% Concluído
- [x] **Debounce na busca**: Adicionado debounce de 250ms em `filterRecipes()`.
- [x] **Refatoração & Modularização de Código (Extra)**: Monólito `src/main.js` refatorado e dividido em 8 módulos em `src/modules/` (`state.js`, `theme.js`, `recipes-render.js`, `recipe-modal.js`, `planner-drawer.js`, `shopping-drawer.js`, `pantry-modal.js`, `cooking-mode.js`) com Event Delegation no container de receitas.
- [ ] **Virtualização da lista**: Paginação infinita ou virtual scrolling para grandes listas de receitas.
- [ ] **Skeleton loading**: Placeholder animado durante o carregamento de dados do IndexedDB/Supabase.

---

### Fase 3 (Funcionalidades de Experiência) — 🟡 33% Concluído
- [x] **Modo Preparo completo**: Implementado em `src/modules/cooking-mode.js` com interface imersiva full-screen, Wake Lock API (para manter a tela ativa), navegação por passos, detecção automática de timers de tempo com alarme e painel retrátil de ingredientes.
- [ ] **Leitura assistida do modo de preparo (Acessibilidade)**: Leitura em voz dos passos da receita (TTS) com controles de reproduzir/pausar/retomar e destaque do passo atual para pessoas cegas ou com baixa visão.
- [ ] **Compartilhamento de receitas**: Compartilhamento via Web Share API, exportação PDF ou links públicos.
- [ ] **Histórico de preparo**: Registro de datas e estatísticas de preparo de receitas.

---

### Fase 4 (Avançado & Inteligência Artificial) — 🔴 0% Concluído
- [ ] **Integração com IA para Importação de Receitas**: Parser inteligente com LLM/Gemini para extrair dados estruturados (título, porções, tempos, lista de ingredientes e modo de preparo) a partir de texto livre ou imagens de receitas.
- [ ] **Importação de URLs**: Scraping/parsing automático de blogs de receitas usando Recipe Schema.org.
- [ ] **Lista colaborativa**: Sincronização em tempo real da lista de compras entre múltiplos usuários via Supabase Realtime.
- [ ] **Notificações push**: Lembretes de planejamento semanal de refeições e alertas de listas de compras.

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

---

## 📊 **MÉTRICAS DO CÓDIGO**

| Métrica | Valor Atual | Status |
|---------|-------------|--------|
| Linhas em `main.js` | ~168 | 🟢 Excelente (Modularizado) |
| Módulos em `src/modules/` | 8 arquivos | 🟢 Alta coesão |
| PWA & Cache Offline | Ativo (IndexedDB + PWA) | 🟢 Funcional |

---

*Última atualização: 05/08/2026*

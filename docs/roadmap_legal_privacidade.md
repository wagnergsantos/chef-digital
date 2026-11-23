# Roadmap — Adequação Legal, Direito Autoral, Privacidade (LGPD / GA4) e Acessibilidade

**Repositório:** wagnergsantos/chef-digital  
**Data:** 10/11/2026  
**Escopo:** Auditoria jurídica e técnica para o Brasil (LGPD — Lei 13.709/18, LDA — Lei 9.610/98, CDC — Lei 8.078/90, LBI — Lei 13.146/15 / WCAG 2.2 Nível AA) e boas práticas internacionais (GDPR / Google Consent Mode v2).  
**Documento complementar:** Ver [roadmap_seguranca.md](./roadmap_seguranca.md) para os itens de Segurança da Informação e Hardening (`S1–S4`, Issues `#1`, `#11–#13`).

---

## 1. Premissas e Decisões de Produto

1. **PWA Público Gratuito com Administração Única:** Qualquer visitante pode acessar o catálogo de receitas, planejar o menu semanal, controlar a despensa, gerar lista de compras e usar o Modo Preparo gratuitamente (inclusive instalando como PWA). Não há cadastro ou login de usuários finais — o login em `admin.html` é de uso exclusivo do proprietário para curadoria e publicação.
2. **Dispensa de Obrigações de SaaS Pago e Cadastro Público:** Por não haver vendas, assinaturas nem criação de contas por visitantes, não se aplicam regras de e-commerce (Decreto 7.962/13 e CDC Art. 49) nem fluxos de registro de aceite em cadastro (`accepted_terms_at`) ou exclusão de conta de usuário final.
3. **Direito Autoral em Catálogo Culinário (LDA Lei 9.610/98):** Listas de ingredientes e instruções técnicas funcionais não constituem obra protegida isoladamente, mas textos autorais e fotografias são protegidos (LDA Art. 7º). O sistema deve exibir os créditos da fonte original (`author` e `source_url`) sempre que informados (LDA Art. 24, II) e oferecer canal de contato para notificações de retirada (DMCA/Takedown).
4. **Preparação para Google Analytics (GA4):** Hoje o app utiliza apenas `localStorage` e `IndexedDB` estritamente necessários para funcionamento local. Como há plano de adicionar o Google Analytics no futuro, a arquitetura de privacidade já deixará pronto o aviso legal e a estrutura de consentimento opt-in (*Google Consent Mode*), além de ajustar a comunicação no `README.md` quando o GA4 entrar no ar.

---

## 2. Fases de Implementação e Issues Vinculadas

### [ ] Fase 1 (L1) — Direito Autoral: Atribuição de Fonte (`author` e `source_url`) no Modal Público e Opt-in no Lote (#14)

**Referência Legal:** Lei de Direitos Autorais (Lei 9.610/98 — Arts. 7º e 24, II).

**Problema no Código:**
- Os campos `author` e `source_url` são buscados do Supabase em `src/App.jsx` (linha 177), mapeados em `src/api/recipes-loader.js` (linhas 39–40), extraídos na Edge Function `parse-recipe` e editáveis em `src/AdminApp.jsx` (linhas 550–577), mas **`src/components/RecipeModal.jsx` nunca exibe `recipe.author` nem `recipe.source_url`** para o visitante.
- Em `src/components/admin/BulkImportModal.jsx` (linha 11), o estado `autoSaveDb` inicia como `true` (*"Salvar direto no Supabase ao concluir"*), publicando automaticamente no catálogo público lotes de receitas extraídas por IA sem revisão humana prévia.

**Correção Técnica:**
1. **Exibição de Autoria e Fonte Original (`src/components/RecipeModal.jsx` e `RecipeModal.module.css`)**:
   - Exibir badge/crédito no modal da receita quando `recipe.author` e/ou `recipe.source_url` estiverem preenchidos.
   - Se `recipe.source_url` for uma URL `http(s)://` válida, renderizar link clicável seguro (`target="_blank" rel="noopener noreferrer"`) creditando o autor ou domínio de origem.
2. **Créditos no Texto de Compartilhamento (`src/logic/recipe-modal-logic.js`)**:
   - Incluir `author` / `source_url` (quando existentes) na formatação de compartilhamento (`formatRecipeShareText`).
3. **Revisão Antes de Publicar em Lote (`src/components/admin/BulkImportModal.jsx`)**:
   - Alterar `const [autoSaveDb, setAutoSaveDb] = useState(false)` para exigir opt-in explícito ao importar lotes via IA.

---

### [ ] Fase 2 (L2) — Fontes Locais (`@fontsource`), Manifesto PWA Único e Reconexão do Cache Offline (`IndexedDB`) (#15)

**Referência Legal:** LGPD Art. 7º / GDPR (prevenção de compartilhamento desnecessário de IP com terceiros) e CDC Art. 37 (coerência entre o prometido na documentação e o comportamento real do software).

**Problema no Código:**
1. **Google Fonts CDN expondo IP dos visitantes (`index.html:9-13` e `next-id.html:7`)**:
   - As fontes `Inter` e `Playfair Display` possuem licença aberta **SIL Open Font License 1.1 (OFL-1.1)**, mas são carregadas remotamente dos servidores do Google (`fonts.googleapis.com` / `fonts.gstatic.com`), transmitindo o IP do visitante sem necessidade e deixando `admin.html` sem carregamento das fontes.
2. **Cache Offline (`IndexedDB`) desconectado em `src/App.jsx` (`App.jsx:170-224`)**:
   - O `README.md` (linha 19) promete: *"Funciona 100% Offline: Todas as suas receitas ficam salvas no navegador (IndexedDB) para consulta mesmo sem internet"*. Contudo, `src/App.jsx` consulta apenas o Supabase via rede e não chama `lerCacheLocal` nem `salvarCacheLocal` (`src/cache/local-cache.js`).
3. **Conflito de Manifesto PWA Duplicado (`index.html:15` vs. `vite.config.js:15-44`)**:
   - `index.html` inclui `<link rel="manifest" href="./manifest.json">` manualmente (`start_url: "./index.html"`), enquanto o `vite-plugin-pwa` injeta um segundo manifesto (`manifest.webmanifest` com `start_url: "/chef-digital/"`).

**Correção Técnica:**
1. **Hospedagem Local das Fontes (`package.json`, `src/main.jsx`, `src/admin-main.jsx`, `index.html`, `next-id.html`)**:
   - Instalar `@fontsource/inter` e `@fontsource/playfair-display` (licença aberta SIL OFL-1.1) e importá-las localmente no bundle Vite.
   - Remover as tags `<link>` para `fonts.googleapis.com` e `fonts.gstatic.com` de `index.html` e `next-id.html`. *(Benefício adicional: melhora direta no LCP e funcionamento offline da Fase 5 de Performance do `docs/ROADMAP.md`).*
2. **Reconexão do Cache Offline (`src/App.jsx` e `src/cache/local-cache.js`)**:
   - Em `loadInitialData()` (`src/App.jsx`), hidratar o estado inicial imediatamente a partir do `IndexedDB` (`lerCacheLocal('receitas')`, `lerCacheLocal('categorias')`, `lerCacheLocal('tags')`, `lerCacheLocal('recipeTags')`) e, ao obter resposta atualizada do Supabase, persistir no `IndexedDB` via `salvarCacheLocal`.
3. **Unificação do Manifesto PWA (`index.html`, `manifest.json`, `vite.config.js`)**:
   - Remover `<link rel="manifest" href="./manifest.json">` de `index.html` e remover o arquivo `manifest.json` manual da raiz, mantendo a geração única e consistente pelo `vite-plugin-pwa`.

---

### [ ] Fase 3 (L3) — Rodapé e Modal "Sobre, Privacidade & Termos", Disclaimer Alimentar e Preparação para GA4 (#16)

**Referência Legal:** LGPD Arts. 7º, 9º, 33 e 41 / LDA Lei 9.610/98 / CDC.

**Problema no Código:**
- Ausência de rodapé informativo na interface pública (`src/App.jsx`) com identificação de contato do controlador (LGPD Art. 9º, IV), transparência sobre armazenamento local/infraestrutura (LGPD Art. 9º e 33), canal para solicitações de direitos autorais (DMCA/LDA) e aviso de isenção de responsabilidade sobre preparo culinário e alergênicos.
- Necessidade de preparar a base de consentimento opt-in para a futura introdução do Google Analytics (GA4).

**Correção Técnica:**
1. **Componente `src/components/LegalModal.jsx` e Rodapé em `src/App.jsx`**:
   - Adicionar rodapé discreto na página principal (oculto na impressão via `data-print-hide`) com link **"Sobre, Privacidade & Termos"** abrindo modal acessível (`useFocusTrap`) estruturado em 4 seções:
     - **1. Sobre & Direitos Autorais:** Aplicativo web progressivo gratuito para organização culinária; respeito aos créditos e links das fontes originais (`source_url`); canal de contato para pedidos de atribuição ou remoção de conteúdo (DMCA/LDA).
     - **2. Aviso de Saúde e Preparo Culinário (*Disclaimer*):** Receitas, conversões automáticas de porções, tempos de cozimento e dados estruturados por IA possuem caráter meramente informativo. Cabe ao usuário verificar ingredientes alergênicos (glúten, lactose, oleaginosas, etc.), restrições médicas e o cozimento seguro dos alimentos.
     - **3. Privacidade & Armazenamento de Dados:** Favoritos, despensa, lista de compras e planejamento semanal ficam salvos exclusivamente no navegador do próprio dispositivo (`localStorage` e `IndexedDB`). A infraestrutura de hospedagem e banco de receitas utiliza GitHub Pages (EUA/CDN Global) e Supabase (AWS `sa-east-1` — São Paulo, Brasil).
     - **4. Cookies & Analytics (Preparado para GA4):** Chave/preferência de consentimento analítico salva em `localStorage` (`chef_digital_analytics_consent`: `'granted' | 'denied' | null`), pronta para exibir banner opt-in (botões "Aceitar" e "Recusar" equivalentes) assim que um `VITE_GA_MEASUREMENT_ID` for configurado no futuro, e lembrete de atualizar o `README.md` (linha 3) ao ativar o GA4.

---

### [ ] Fase 4 (L4) — Acessibilidade Digital (LBI — Lei 13.146/2015 & WCAG 2.2 Nível AA) (#17)

**Referência Legal:** Lei Brasileira de Inclusão da Pessoa com Deficiência (Lei 13.146/2015 — Art. 63) e diretrizes internacionais **WCAG 2.2 Nível AA**.

**Problema no Código:**
1. **Vazamento de Foco do Teclado (`Tab`) para Gavetas Fechadas (WCAG 2.1.1 / 2.4.3)**:
   - `PlannerDrawer.jsx`, `ShoppingDrawer.jsx`, `PantryDrawer.jsx` e a gaveta de ingredientes de `CookingMode.jsx` permanecem montados no DOM apenas deslocados fora da tela com `transform: translate3d(100%, 0, 0)` (`src/components/DrawerShell.module.css:17-37`), sem `visibility: hidden` ou atributo `inert` quando `isOpen === false`. Usuários navegando por teclado na grade de receitas perdem o foco para dentro das 3 gavetas invisíveis.
2. **Contraste Insuficiente no Tema Claro (WCAG 1.4.3)**:
   - `estilos.css`: texto branco (`#ffffff`) sobre `--primary-color: #f59e0b` (botões primários e badges) possui contraste **`2.15:1`** (abaixo do mínimo `4.5:1`); texto branco sobre `--success-color: #16a34a` (`.btnLargeSuccess`) possui **`3.30:1`**; subtítulo `.brand-text p` (`#d97706` em `12px` sobre `#ffffff`) possui **`3.19:1`**.
3. **Elementos Clicáveis sem Teclado, Focus Trap em Modal Admin e Nomes Acessíveis (WCAG 2.1.1 / 2.1.2 / 2.4.7 / 4.1.2)**:
   - `src/components/admin/TagInput.jsx` (linhas 94–100): botão de remover tag é um `<span onClick>` sem `tabIndex` nem `onKeyDown`.
   - `src/components/admin/BulkImportModal.jsx` (linhas 129–142): modal não utiliza `useFocusTrap`, não define `role="dialog"` nem `aria-modal="true"`, e os botões `✕` (linhas 134 e 224) não possuem `aria-label`.
   - `estilos.css` (linhas 170–177): define `:focus-visible` para `button, a, input`, mas omite `select:focus-visible` e `textarea:focus-visible`.
   - Faltam rótulos programáticos (`label`/`aria-label`) em `PantryDrawer.jsx` (`#pantry-textarea`), `ImageUploadField.jsx` (`#recipe-image-manual-url`) e `AIImportBox.jsx` (botão `✕`), além de `aria-hidden="true"` em emojis decorativos (`CookingMode.jsx`, `RecipeCard.jsx`, `RecipeModal.jsx`, `RecipeSearchCombobox.jsx`).

**Correção Técnica:**
1. **Isolamento das Gavetas Fechadas (`DrawerShell.module.css`, `CookingMode.module.css` e componentes Drawer)**:
   - Aplicar `visibility: hidden` no estado fechado e `visibility: visible` em `.open`, além de passar `inert={!isOpen || undefined}` e `aria-hidden={!isOpen}` nos elementos `<aside>` / `<div id="cooking-ingredients-drawer">`.
2. **Ajuste de Contraste no Tema Claro (`estilos.css`, `DrawerShell.module.css`, `RecipeModal.module.css`, `AdminUI.module.css`)**:
   - Garantir razão de contraste `>= 4.5:1` nos botões primários, botões de sucesso, badges de contagem e subtítulo `.brand-text p` no tema claro (ex.: texto escuro `#1c1917` sobre `#f59e0b` com contraste `8.4:1` ou fundo `#b45309` / `#15803d` para texto branco).
3. **Teclado, Focus Trap e Rótulos (`TagInput.jsx`, `BulkImportModal.jsx`, `PantryDrawer.jsx`, `ImageUploadField.jsx`, `AIImportBox.jsx`, `estilos.css`)**:
   - Substituir `<span onClick>` por `<button type="button" aria-label={`Remover tag ${tag}`}>` em `TagInput.jsx`.
   - Aplicar `useFocusTrap`, `role="dialog"`, `aria-modal="true"` e `aria-label` em `BulkImportModal.jsx`.
   - Adicionar `select:focus-visible, textarea:focus-visible` em `estilos.css`.
   - Adicionar `aria-label` / `<label htmlFor>` nos controles pendentes e `<span aria-hidden="true">` nos emojis decorativos.

---

## 3. Resumo de Execução (Legal, Privacidade & Acessibilidade)

| Ordem | Issue | Código | Fase / Entrega | Prioridade | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **#17** | **L4** | Acessibilidade Digital (LBI / WCAG 2.2 AA): isolamento de foco nas gavetas, contraste no tema claro e teclado | 🔥 Alta | 📋 Aberto |
| **2** | **#15** | **L2** | Fontes locais (`@fontsource`), manifesto PWA único e reconexão do cache offline `IndexedDB` em `App.jsx` | 🔥 Alta | 📋 Aberto |
| **3** | **#14** | **L1** | Direito Autoral: exibir `author` e link `source_url` no `RecipeModal.jsx` + opt-in no `BulkImportModal.jsx` | 🟡 Alta | 📋 Aberto |
| **4** | **#16** | **L3** | Rodapé e Modal Sobre/Privacidade/Termos, disclaimer de alergênicos/preparo e estrutura pronta para GA4 | 🟡 Média | 📋 Aberto |

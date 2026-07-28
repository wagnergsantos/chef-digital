# PWA e Suporte Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o Chef Digital instalável (PWA) e funcional offline via `manifest.json` + `sw.js`, sem quebrar o funcionamento atual em `file://`.

**Architecture:** Três arquivos novos na raiz (`manifest.json`, `icon.svg`, `sw.js`) e duas pequenas edições em `index.html` (`<head>` + `window.onload`). O Service Worker usa 3 caches nomeados (`chef-digital-shell-v1`, `chef-digital-fonts-v1`, `chef-digital-images-v1`), cada um com sua própria estratégia (stale-while-revalidate / cache-first / cache-first sob demanda), conforme `docs/superpowers/specs/2026-07-27-pwa-offline-design.md`.

**Tech Stack:** HTML/CSS/JS vanilla (sem build), Service Worker API, Web App Manifest. Nenhuma dependência nova. Validação com `python` (JSON/XML parsing) e `node --check` (sintaxe JS), já que o projeto não tem suíte de testes automatizada.

---

## Contexto de arquivos existentes (não modificar fora do indicado)

- `index.html` linhas 1-25: `<head>` atual. O `<link rel="stylesheet" href="estilos.css?v=1.0.1">` está na linha 10; o script inline de tema fica logo depois; `</head>` fecha na linha 25.
- `index.html` linha ~495: `window.onload = function() { try { ... } catch (err) { ... } };` — é aqui que o `receitasData` é copiado para o estado global e a UI é renderizada pela primeira vez.
- `.brand-icon svg` (linha ~34 de `index.html`) usa o path: `M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253` — esse mesmo path será reaproveitado no `icon.svg`.
- `estilos.css` define `--bg-main: #fafaf9` e `--primary-color: #f59e0b` (amber-500) — cores usadas no manifest.

---

### Task 1: Criar `manifest.json`

**Files:**
- Create: `manifest.json` (raiz do projeto)

- [ ] **Step 1: Criar o arquivo com o conteúdo do manifest**

```json
{
    "name": "Chef Digital - Meu Livro de Receitas",
    "short_name": "Chef Digital",
    "description": "Livro de receitas pessoal com planejamento semanal e lista de compras",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#fafaf9",
    "theme_color": "#f59e0b",
    "lang": "pt-BR",
    "icons": [
        { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" },
        { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "maskable" }
    ]
}
```

- [ ] **Step 2: Validar que é JSON válido**

Run:
```powershell
python -c "import json; json.load(open('manifest.json', encoding='utf-8')); print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```powershell
git add manifest.json
git commit -m "feat: add PWA manifest.json"
```

---

### Task 2: Criar `icon.svg`

**Files:**
- Create: `icon.svg` (raiz do projeto)

- [ ] **Step 1: Criar o ícone vetorial (fundo âmbar arredondado + traço do livro em branco)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect x="0" y="0" width="512" height="512" rx="102" fill="#f59e0b"/>
    <g transform="translate(96 96) scale(13.333)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </g>
</svg>
```

Notas de design: `rx="102"` é ~20% de 512 (cantos arredondados à la iOS/Android); o `<g transform>` centraliza e escala o mesmo path 24x24 usado em `.brand-icon` para caber num quadrado de 320x320 com 96px de margem em cada lado.

- [ ] **Step 2: Validar que é XML/SVG bem formado**

Run:
```powershell
python -c "import xml.etree.ElementTree as ET; ET.parse('icon.svg'); print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```powershell
git add icon.svg
git commit -m "feat: add PWA vector icon (icon.svg)"
```

---

### Task 3: Registrar manifest, ícone e theme-color no `<head>` de `index.html`

**Files:**
- Modify: `index.html:9-11`

- [ ] **Step 1: Adicionar as tags logo após o link do `estilos.css`, antes do script de tema**

Old (linhas 9-11):
```html
    <!-- Local Custom CSS (Vanilla CSS Stylesheet) -->
    <link rel="stylesheet" href="estilos.css?v=1.0.1">
    <!-- Inline Script to prevent Theme Flash on load -->
```

New:
```html
    <!-- Local Custom CSS (Vanilla CSS Stylesheet) -->
    <link rel="stylesheet" href="estilos.css?v=1.0.1">
    <!-- PWA: Manifest, Ícone e Theme Color -->
    <link rel="manifest" href="manifest.json">
    <link rel="icon" href="icon.svg" type="image/svg+xml">
    <meta name="theme-color" content="#f59e0b">
    <!-- Inline Script to prevent Theme Flash on load -->
```

- [ ] **Step 2: Verificar que as tags foram inseridas corretamente**

Run:
```powershell
Select-String -Path index.html -Pattern 'rel="manifest"|rel="icon"|name="theme-color"'
```
Expected: 3 linhas encontradas, uma para cada tag nova.

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "feat: link PWA manifest, icon and theme-color in index.html head"
```

---

### Task 4: Criar `sw.js` (Service Worker com 3 estratégias de cache)

**Files:**
- Create: `sw.js` (raiz do projeto)

- [ ] **Step 1: Criar o Service Worker**

```js
// Service Worker do Chef Digital.
// Três caches nomeados, cada um com sua estratégia (ver docs/superpowers/specs/2026-07-27-pwa-offline-design.md).
const SHELL_CACHE = 'chef-digital-shell-v1';
const FONTS_CACHE = 'chef-digital-fonts-v1';
const IMAGES_CACHE = 'chef-digital-images-v1';
const CURRENT_CACHES = [SHELL_CACHE, FONTS_CACHE, IMAGES_CACHE];

// Mesmas URLs referenciadas em index.html (inclui a query string de cache-busting do CSS).
const SHELL_ASSETS = [
    './index.html',
    './estilos.css?v=1.0.1',
    './receitas.js',
    './icon.svg',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    // Remove caches antigos do próprio app (nomes chef-digital-* que não são os atuais).
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((name) => name.startsWith('chef-digital-') && !CURRENT_CACHES.includes(name))
                .map((name) => caches.delete(name))
        ))
    );
});

function isFontRequest(url) {
    return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

function isRecipeImageRequest(url) {
    return url.origin === self.location.origin && /\/[^/]+\.png$/i.test(url.pathname);
}

// Estratégia cache-first genérica: serve do cache se existir, senão busca da rede e salva.
function cacheFirst(request, cacheName) {
    return caches.open(cacheName).then((cache) => cache.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
        });
    }));
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Fontes do Google Fonts: cache-first (raramente mudam).
    if (isFontRequest(url)) {
        event.respondWith(cacheFirst(event.request, FONTS_CACHE));
        return;
    }

    // Fotos de receita (*.png na raiz): cache sob demanda + cache-first.
    if (isRecipeImageRequest(url)) {
        event.respondWith(cacheFirst(event.request, IMAGES_CACHE));
        return;
    }

    // App shell: stale-while-revalidate (serve do cache, atualiza em paralelo).
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.open(SHELL_CACHE).then((cache) => cache.match(event.request).then((cached) => {
                const networkFetch = fetch(event.request)
                    .then((response) => {
                        cache.put(event.request, response.clone());
                        return response;
                    })
                    .catch(() => cached);
                return cached || networkFetch;
            }))
        );
    }
});
```

- [ ] **Step 2: Validar a sintaxe do arquivo**

Run:
```powershell
node --check sw.js
```
Expected: sem saída (sucesso silencioso = sintaxe válida).

- [ ] **Step 3: Commit**

```powershell
git add sw.js
git commit -m "feat: add service worker with shell/fonts/images cache strategies"
```

---

### Task 5: Registrar o Service Worker em `window.onload`

**Files:**
- Modify: `index.html:494-496`

- [ ] **Step 1: Adicionar o registro do SW com fallback silencioso no início de `window.onload`**

Old:
```js
        // Document Ready init
        window.onload = function() {
            try {
```

New:
```js
        // Document Ready init
        window.onload = function() {
            // Registro do Service Worker (PWA). Falha silenciosa em file:// ou navegadores sem suporte:
            // o app continua funcionando de forma idêntica, apenas sem instalação/offline.
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            }
            try {
```

- [ ] **Step 2: Verificar que a chamada foi inserida e que a sintaxe do arquivo continua íntegra**

Run:
```powershell
Select-String -Path index.html -Pattern "serviceWorker.register"
```
Expected: 1 linha encontrada.

Run também um teste manual rápido: sirva o projeto localmente e confirme no console do navegador que não há erros de sintaxe.
```powershell
python -m http.server 8000
```
Abra `http://localhost:8000/index.html`, abra o DevTools Console — não deve haver erros JS. Pare o servidor com Ctrl+C quando terminar.

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "feat: register service worker on window.onload"
```

---

### Task 6: Validar a PWA localmente (checklist manual)

**Files:** nenhum (apenas verificação, servidor estático local)

- [ ] **Step 1: Subir servidor estático e checar respostas HTTP dos novos arquivos**

Run:
```powershell
python -m http.server 8000
```
Em outra sessão/terminal:
```powershell
curl -s -o NUL -w "manifest: %{http_code}`n" http://localhost:8000/manifest.json
curl -s -o NUL -w "icon: %{http_code}`n" http://localhost:8000/icon.svg
curl -s -o NUL -w "sw: %{http_code}`n" http://localhost:8000/sw.js
```
Expected: `manifest: 200`, `icon: 200`, `sw: 200`.

- [ ] **Step 2: Verificação manual no navegador (Chrome desktop)**

Com o servidor ainda rodando, abra `http://localhost:8000/index.html` no Chrome e confirme, via DevTools → Application:
1. **Manifest**: nome, ícone e cores carregados sem erro.
2. **Service Workers**: registrado e ativado (`sw.js`), status "activated and is running".
3. **Cache Storage**: os 3 caches (`chef-digital-shell-v1`, `chef-digital-fonts-v1`, `chef-digital-images-v1`) aparecem; `shell` populado após o primeiro load, `fonts`/`images` populados incrementalmente ao navegar/abrir receitas com foto.
4. Ative "Offline" no DevTools (aba Network) e recarregue a página → app abre normalmente (busca, planejador, lista de compras funcionando).
5. Abra uma receita com foto **nunca vista antes** estando offline → texto/ingredientes/passos aparecem, a imagem falha graciosamente (sem quebrar o layout).
6. Abra `index.html` diretamente via `file://` (duplo clique) → nenhum erro no console; app funciona idêntico a hoje, sem SW ativo (registro falha silenciosamente).

- [ ] **Step 3: Parar o servidor local**

Pare o processo do `python -m http.server` (Ctrl+C).

Nenhum commit nesta task (é só validação).

---

### Task 7: Atualizar o índice de specs

**Files:**
- Modify: `docs\superpowers\specs\README.md`

- [ ] **Step 1: Marcar a spec de PWA/Offline como implementada**

Old:
```markdown
| 5 | [PWA e Suporte Offline](2026-07-27-pwa-offline-design.md) | Nenhuma técnica, mas recomendado por último (evita bump de cache repetido durante o desenvolvimento das outras) | ⬜ Não implementado |
```

New:
```markdown
| 5 | [PWA e Suporte Offline](2026-07-27-pwa-offline-design.md) | Nenhuma técnica, mas recomendado por último (evita bump de cache repetido durante o desenvolvimento das outras) | ✅ Implementado |
```

- [ ] **Step 2: Conferir visualmente a tabela**

Run:
```powershell
Select-String -Path docs\superpowers\specs\README.md -Pattern "PWA e Suporte Offline"
```
Expected: a linha mostra `✅ Implementado` no final.

- [ ] **Step 3: Commit**

```powershell
git add docs\superpowers\specs\README.md
git commit -m "docs: mark PWA offline spec as implemented"
```

---

## Resumo de cobertura da spec

- Manifest com metadados de instalação → Task 1.
- Ícone SVG único, sem PNGs/dependências novas → Task 2.
- `<link rel="manifest">`, `<link rel="icon">`, `<meta name="theme-color">` → Task 3.
- Registro do SW com fallback silencioso → Task 5.
- `sw.js` com as 3 estratégias (shell stale-while-revalidate, fonts cache-first, images cache sob demanda) e limpeza de caches antigos no `activate` → Task 4.
- Casos de borda (`file://`, imagem nunca vista offline, ciclo de vida do SW sem `skipWaiting`) e plano de testes manual da spec → Task 6.
- Atualização do índice de specs conforme convenção do projeto → Task 7.

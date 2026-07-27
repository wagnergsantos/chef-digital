# Design Spec: PWA e Suporte Offline

**Data:** 2026-07-27
**Autor:** GitHub Copilot CLI (pair programmer)
**Status:** Em Revisão
**Projeto:** Chef Digital (Livro de Receitas & Planejador)

---

## 1. Visão Geral (Overview)

O app já é local-first (dados em `receitas.js` + `localStorage`), faltando apenas os artefatos de PWA (manifest + service worker) para poder ser "instalado" na tela inicial do celular da cozinha e funcionar offline em tela cheia/standalone.

**Restrição técnica fundamental:** Service Workers exigem contexto seguro (`https://` ou `localhost`) — não funcionam em `file://`. O projeto é acessado em produção via GitHub Pages (`https://`), então o SW funciona normalmente lá; em desenvolvimento local via `file://`, o registro do SW falha silenciosamente e o app continua funcionando de forma idêntica a hoje, apenas sem instalação/offline.

---

## 2. Objetivos (Goals & Non-Goals)

### Objetivos (Goals)
* `manifest.json` na raiz, com metadados de instalação (nome, ícone, cores, display mode `standalone`).
* `icon.svg` vetorial único (reaproveitando o traço do livro do cabeçalho), sem gerar PNGs nem adicionar dependências novas (ex: Pillow).
* `sw.js` (Service Worker) com 3 estratégias de cache diferenciadas por tipo de recurso: app shell (stale-while-revalidate), fontes do Google Fonts (cache-first), fotos de receita (cache sob demanda).
* Registro do SW em `window.onload`, com fallback silencioso (sem erro visível ao usuário) quando indisponível (ex: `file://`).
* `<link rel="manifest">`, `<link rel="icon">` e `<meta name="theme-color">` adicionados ao `<head>` de `index.html`.

### Non-Goals
* Não gera ícones PNG via script (mantém filosofia "zero dependências novas" do projeto) — usa um único SVG vetorial.
* Não implementa sincronização em background (Background Sync API) nem push notifications — fora de escopo.
* Não força atualização imediata do Service Worker (`skipWaiting`/`clients.claim`) — atualização de versão só é vista na próxima abertura do app, para manter a lógica simples.
* Não cacheia todas as ~150 fotos de receita antecipadamente — cache é incremental, só das receitas efetivamente abertas (ver seção 3).

---

## 3. Arquitetura

### 3.1. `manifest.json` (novo arquivo, raiz do projeto)
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
`background_color`/`theme_color` reaproveitam as cores de marca já definidas em `estilos.css` (`--bg-main: #fafaf9`, `--primary-color: #f59e0b`).

### 3.2. `icon.svg` (novo arquivo, raiz do projeto)
Ícone quadrado com fundo âmbar (`#f59e0b`) arredondado (cantos ~20% do lado, à la iOS/Android) e o mesmo traço de livro usado no `.brand-icon` do cabeçalho, em branco. Vetorial, então serve para qualquer resolução sem gerar múltiplos arquivos PNG.

### 3.3. Mudanças em `index.html` (`<head>`)
```html
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<meta name="theme-color" content="#f59e0b">
```
E, dentro de `window.onload` (ou script equivalente já existente lá):
```js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
        // Falha silenciosa: file://, navegador sem suporte, etc. App continua funcionando normalmente.
    });
}
```

### 3.4. `sw.js` (novo arquivo, raiz do projeto)
Três caches nomeados, cada um com sua estratégia:

| Cache | Conteúdo | Estratégia |
|---|---|---|
| `chef-digital-shell-v1` | `index.html`, `estilos.css`, `receitas.js`, `icon.svg`, `manifest.json` | Stale-while-revalidate: serve do cache imediatamente, busca versão nova em paralelo e atualiza o cache para a próxima visita. |
| `chef-digital-fonts-v1` | Requisições para `fonts.googleapis.com` e `fonts.gstatic.com` (CSS + `.woff2`) | Cache-first: se está no cache, serve direto; senão busca da rede e salva. Fontes raramente mudam, não precisam de revalidação. |
| `chef-digital-images-v1` | Requisições para `*.png` na raiz (fotos de receita) | Cache sob demanda + cache-first: no evento `fetch`, se a URL bate no padrão de foto de receita e não está no cache, busca da rede, salva a resposta no cache e retorna; se já está no cache, serve direto sem revalidar (fotos não mudam após publicadas). |

Versionamento: o número (`v1`) no nome de cada cache é incrementado manualmente por você quando quiser forçar a atualização daquele grupo de recursos. No evento `activate` do SW, qualquer cache com nome `chef-digital-*` que não seja um dos nomes "atuais" (a versão vigente de cada um dos 3) é deletado.

---

## 4. Casos de Borda e Plano de Testes

### Casos de borda
- **`localStorage`** (favoritos, planejador, lista de compras) não é afetado pelo SW — continua funcionando normalmente offline, por ser síncrono e local ao navegador.
- **Imagem nunca vista offline**: se o usuário abre uma receita nova sem tê-la aberto antes (imagem nunca cacheada) estando offline, a foto simplesmente não carrega (`<img>` quebrada); texto/ingredientes/passos continuam funcionando pois o app shell já está cacheado.
- **Atualização do SW**: ao publicar uma nova versão (bump manual do nome do cache), o usuário só vê a versão nova depois de fechar e reabrir o app — comportamento padrão do ciclo de vida do SW, sem `skipWaiting`/`clients.claim` para manter a lógica simples.
- **`file://`**: nenhuma funcionalidade quebra; o app roda idêntico a hoje, apenas sem instalação/offline (registro do SW falha silenciosamente, capturado via `.catch()`).

### Plano de testes (manual, sem automação — projeto não possui suíte de testes)
1. Publicar no GitHub Pages, abrir no Chrome desktop, verificar ícone de "instalar app" na barra de endereço.
2. Instalar o app, abrir pela tela inicial (ou atalho), confirmar modo standalone (sem barra de endereço do navegador).
3. Abrir DevTools → Application → Service Workers, confirmar registro ativo e os 3 caches (`shell`, `fonts`, `images`) populados incrementalmente conforme uso.
4. Colocar o DevTools em modo offline, recarregar o app → confirmar que abre normalmente com receitas, planejador e lista de compras funcionando.
5. Abrir uma receita nunca vista antes em modo offline → confirmar que o texto aparece mas a imagem falha graciosamente (sem quebrar o layout).
6. Testar em `file://` direto → confirmar que não há erros no console e o app funciona normalmente (sem SW ativo).
7. Testar em um celular Android real via GitHub Pages → "Adicionar à tela inicial" → confirmar ícone/nome corretos.

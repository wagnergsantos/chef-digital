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

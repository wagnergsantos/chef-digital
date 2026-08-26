# Spec: Otimização de imagens + pipeline de upload/compressão — chef-digital

## Contexto

`chef-digital` continha 127 imagens de receita em `public/*.png` (11.62MB no
total), referenciadas pela coluna `receitas.image` no Supabase como nomes de
arquivo locais (`"148.png"`, `"10.png"`, etc.). O `vite.config.js` fazia o
service worker do PWA pré-cachear todas essas imagens no navegador de todo
usuário (`globPatterns: ['**/*.{js,css,html,png,svg,ico}']`).

Hoje o campo de imagem em `src/AdminApp.jsx` é um `<input type="text">` onde o
usuário digita manualmente o nome do arquivo.

**Decisão de produto atualizada**:
Unificar 100% do armazenamento de imagens no Supabase Storage. A entrega foi
estruturada em 3 fases sequenciais e seguras:
1. **Fase 1 (Concluída)**: Otimização *in place* das 127 imagens existentes em `public/` com script permanente e idempotente.
2. **Fase 2 (Concluída ✅)**: Infraestrutura de Storage + Pipeline de Upload completo no Admin (API + UI integrada com preview, compressão WebP e limpeza automática).
3. **Fase 3 (Próxima)**: Migração total das 127 imagens para o Storage, atualização no banco de dados, limpeza de `public/` e configuração de cache offline (Workbox) no PWA.

---

## Fase 1 — Otimizar as 127 imagens existentes (CONCLUÍDA ✅)

### O que foi implementado
- Script idempotente permanente [`scripts/optimize-images.js`](../scripts/optimize-images.js) com `sharp`.
- Manifesto de cache com SHA-256 em [`scripts/.optimized-cache.json`](../scripts/.optimized-cache.json) para evitar reprocessamento/degradação cumulativa em novas execuções.
- Comando npm adicionado: `npm run optimize-images` (suporta `--dry-run` e `--force`).
- Teto de redimensionamento em 800px de largura máxima (atende com folga os 768px do modal e ~350px dos cards).
- Compressão PNG com quantização de paleta (qualidade 80).

### Resultados
- Redução de **11.62 MB** para **3.47 MB** (**-70.2% / 8.15 MB economizados**).
- Precache do PWA reduzido de ~12MB para ~4.1MB.

---

## Fase 2 — Pipeline de Upload no Admin (Supabase Storage) (CONCLUÍDA ✅)

### Escopo unificado (API + UI)

Seguindo a separação de camadas do projeto (`api/` para chamadas externas, `logic/` para lógica pura, componentes React orquestrando UI):

1. **Infraestrutura Supabase**:
   - Bucket `recipe-images` com acesso público de leitura (`public: true`).
2. **Compressão client-side**:
   - Reutilizar e adaptar [`src/logic/image-compression.js`](../src/logic/image-compression.js) (`compressImageFile`) para redimensionar (máx 800px) e converter para WebP antes do envio.
3. **Camada de API (`src/api/admin.js`)**:
   - Função `uploadRecipeImage(file)`: valida tamanho pré-upload (< 10MB), comprime no navegador, envia para `supabase.storage.from('recipe-images').upload(...)` com nome único baseado em timestamp/UUID e retorna a URL pública gerada.
4. **Interface no Admin (`src/AdminApp.jsx`)**:
   - Substituição do `<input type="text">` por componente de upload com seletor de arquivo e suporte a drag-and-drop.
   - Preview visual instantâneo da imagem selecionada.
   - Feedback visual de loading/spinner durante o upload.
   - Ações de "Trocar imagem" e "Remover".
   - Vinculação da URL do Storage em `formData.image`.
5. **Fluxo offline**:
   - Upload de binário não entra na fila offline do IndexedDB.
   - Bloqueio amigável: se desconectado, exibe aviso claro solicitando conexão para enviar a foto.

### Validação da Fase 2
- `npm run lint` && `npm run test` && `npm run build`.
- Teste manual: upload de foto crua de alta resolução $\rightarrow$ verificar compressão client-side $\rightarrow$ salvar receita $\rightarrow$ validar exibição da URL no card e no modal.

---

## Fase 3 — Migração Total para Storage & PWA Runtime Cache

### Escopo

1. **Script de migração em lote (`scripts/migrate-images-to-storage.js`)**:
   - Lê as 127 imagens de `public/*.png`.
   - Faz upload em lote para o bucket `recipe-images`.
   - Executa `UPDATE receitas SET image = '<storage_url>' WHERE image = '<nome.png>'` no Supabase.
2. **Limpeza do repositório**:
   - Exclusão dos arquivos `public/*.png` legados.
   - Remoção de ~3.5MB de binários do histórico recente/working tree.
3. **PWA & Cache Offline (`vite.config.js`)**:
   - Configurar `workbox.runtimeCaching` no plugin PWA com estratégia `CacheFirst` (ou `StaleWhileRevalidate`) para o domínio do Supabase Storage.
   - Garantir que imagens acessadas fiquem salvas no cache do navegador para uso offline posterior.
   - O precache inicial de build cai para **< 500 KB** (apenas assets essenciais de código JS/CSS).

### Validação da Fase 3
- Todas as 127 receitas continuam renderizando suas fotos normalmente.
- Precache do Service Worker cai drasticamente.
- Teste offline: receitas abertas anteriormente continuam exibindo imagens sem rede via runtime cache do Workbox.

---

## Fora de escopo
- CDN dedicada / transformações dinâmicas pagas do Supabase.
- Redesenho completo do formulário do admin além do campo de imagem.

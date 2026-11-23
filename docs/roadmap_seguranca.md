# Roadmap — Segurança da Informação, Hardening e Infraestrutura

**Repositório:** wagnergsantos/chef-digital  
**Data:** 10/11/2026  
**Escopo:** Revisão das "5 Portas Abertas" (Chave no navegador, Tabela sem RLS, Servidor sem firewall, Consulta sem parâmetro e Configuração de teste no ar) + unificação da Issue `#1` (`S3`).  
**Modelo de Acesso:** PWA de catálogo público gratuito (leitura aberta a visitantes) com administração única (login, escrita e importação via IA exclusivos do proprietário).  
**Documento complementar:** Ver [roadmap_legal_privacidade.md](./roadmap_legal_privacidade.md) para os itens de Adequação Legal, Direito Autoral, Privacidade (LGPD / GA4) e Acessibilidade Digital (`L1–L4`, Issues `#14–#17`).

---

## 1. Diagnóstico das 5 Portas Abertas

| Porta | O que já está protegido | O que precisa ser fechado | Issue |
| :--- | :--- | :--- | :--- |
| **1. Chave de API no navegador** | Chaves `GEMINI_KEY_*` / `GEMINI_API_KEY` ficam apenas na Edge Function (`parse-recipe`); `.env` está fora do Git (`git ls-files` e `git log` limpos); front usa `VITE_SUPABASE_ANON_KEY`. | Falta trava em `src/api/supabase.js` impedindo uso acidental de chave secreta (`sb_secret_` / `service_role`) em `VITE_SUPABASE_ANON_KEY`; falta exceção `!.env.example` no `.gitignore` e variáveis de CLI/Edge documentadas em `.env.example`. | **#12 (`S4`)** |
| **2. Tabela sem RLS** | Tabelas possuem RLS de leitura pública (`SELECT`) e tabela `public.admins` para controle administrativo. | As RPCs `public.salvar_receita` e `public.excluir_receita` usam `SECURITY DEFINER` (ignoram RLS), **não verificam `public.is_admin()`** no corpo e `salvar_receita` foi recriada sem `REVOKE ALL FROM PUBLIC, anon`; faltam policies de escrita versionadas em `tags`, `receita_tags` e Storage (`recipe-images`) e constraints `CHECK` de tamanho máximo. | **#11 (`S1`)** |
| **3. Servidor sem firewall** | Chamadas ao Gemini passam pela Edge Function `parse-recipe` com circuit breaker e backoff exponencial. | `parse-recipe` verifica apenas `if (!authHeader)`, aceitando a `VITE_SUPABASE_ANON_KEY` pública sem exigir login de admin; CORS com wildcard `*`; sem rate-limit por IP; falta `Content-Security-Policy` (CSP) e `Referrer-Policy` em `index.html` e `admin.html`. | **#13 (`S2`)** |
| **4. Consulta sem parâmetro / SSRF / Links** | Queries PostgREST usam filtros parametrizados. | `parse-recipe` faz `fetch(url)` de qualquer string `http(s)://` sem bloquear IPs privados/loopback/metadata AWS (SSRF), sem timeout e sem limite de bytes; `image` e `source_url` não validam protocolo `http/https` contra `javascript:`/`data:`; botão `admin.html?edit=` fica visível para visitantes públicos. | **#13 (`S2`)** + **#1 (`S3`)** |
| **5. Configuração de teste no ar** | Testes rodam isolados em Vitest/JSDOM com MSW. | `supabase/config.toml` mantém `enable_signup = true` (permitindo criar contas via API mesmo sendo app de admin único), `minimum_password_length = 6` e `enable_confirmations = false`; job `Build` em `.github/workflows/deploy.yml` não falha previamente se secrets estiverem vazios; `signOut()` não limpa `sync_queue` do IndexedDB. | **#12 (`S4`)** + **#1 (`S3`)** |

---

## 2. Itens de Implementação

### [ ] S1 — Blindagem de Banco de Dados (RLS & RPCs `SECURITY DEFINER`), Policies de Storage e Limites JSONB/Text (#11)

**Onde:** `scripts/sql/2026-08-25_add_ingredient_groups.sql`, `scripts/sql/2026-08-10_excluir_receita.sql`, `scripts/sql/create_tags_schema.sql` (nova migration consolidada em `scripts/sql/`)

1. **Função `public.is_admin()` e Hardening das RPCs `SECURITY DEFINER`**:
   - Garantir função `public.is_admin()` (`LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public`) verificando `EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())`.
   - Em `public.salvar_receita` e `public.excluir_receita`: adicionar `SET search_path = public` e checagem obrigatória no início do bloco `BEGIN`:
     ```sql
     IF NOT public.is_admin() THEN
         RAISE EXCEPTION 'Permissão negada: apenas administradores podem modificar receitas.';
     END IF;
     ```
   - Executar `REVOKE ALL ON FUNCTION public.salvar_receita(...) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.salvar_receita(...) TO authenticated;` (idem para `public.excluir_receita(INT)`).
2. **Policies RLS Explícitas de Escrita (`INSERT`, `UPDATE`, `DELETE`)**:
   - Versionar policies `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())` para `receitas`, `categorias`, `ingredientes`, `passos`, `tags`, `receita_tags` e para o bucket `recipe-images` em `storage.objects`.
3. **Constraints de Tamanho Máximo contra Abuso de Armazenamento**:
   - Adicionar `CHECK` constraints razoáveis: `receitas.title` (`<= 200` chars), `receitas.tips` (`<= 2000` chars), `receitas.source_url` e `receitas.image` (`<= 1000` chars), `ingredientes.name` (`<= 200` chars), `passos.step_text` (`<= 4000` chars) e limite de elementos nos arrays `p_ingredientes` (`<= 100`), `p_passos` (`<= 100`) e `p_tags` (`<= 30`) dentro de `salvar_receita`.

---

### [ ] S2 — Firewall na Edge Function `parse-recipe` (Auth Admin, CORS Restrito, Anti-SSRF) e CSP (#13)

**Onde:** `supabase/functions/parse-recipe/index.ts`, `index.html`, `admin.html`

1. **Autenticação Real de Administrador na Edge Function (`supabase/functions/parse-recipe/index.ts`)**:
   - Substituir a checagem superficial `if (!authHeader)` por validação real do JWT usando `@supabase/supabase-js` com `SUPABASE_URL` e `SUPABASE_ANON_KEY`:
     - Obter o usuário autenticado via `supabase.auth.getUser(token)`.
     - Verificar na tabela `public.admins` se `user.id` é administrador antes de realizar qualquer scraping ou chamada à API do Gemini (retornando `401`/`403` caso contrário).
2. **CORS Restrito e Rate-Limit**:
   - Substituir `'Access-Control-Allow-Origin': '*'` por função `getCorsHeaders(req)` validando o `Origin` contra allowlist (`https://wagnergsantos.github.io`, `http://localhost:5173`, `http://127.0.0.1:5173`).
   - Adicionar rate-limit por usuário/IP em memória (ex.: máx. 20 requisições por minuto) para proteger a cota das chaves `GEMINI_KEY_*`.
3. **Proteção Anti-SSRF no Scraping de URLs (`index.ts:90-138`)**:
   - Validar a URL com `new URL(recipeTextToParse)`: permitir apenas protocolos `http:` e `https:`.
   - Bloquear hostnames locais e faixas de IP privadas/loopback/link-local (`localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `[::1]`, `.local`, `.internal`).
   - Adicionar `signal: AbortSignal.timeout(5000)` no `fetch` da página externa e limitar o tamanho máximo lido da resposta (ex.: máx. 1 MB).
4. **Content Security Policy (CSP) e Referrer-Policy (`index.html`, `admin.html`)**:
   - Adicionar `<meta name="referrer" content="strict-origin-when-cross-origin">`.
   - Adicionar `<meta http-equiv="Content-Security-Policy" ...>` restringindo `default-src 'self'`, `script-src`, `style-src`, `font-src`, `img-src` (`'self' data: blob: https:`) e `connect-src` (`'self' https://*.supabase.co`).

---

### [ ] S3 (antiga #1) — Sanitização de URLs (`image`/`source_url`), Ocultação de Link Admin Público e Limpeza no Logout (#1)

**Onde:** `src/logic/admin-parser.js`, `src/components/RecipeModal.jsx`, `src/components/RecipeCard.jsx`, `src/App.jsx`, `src/auth/session.js`, `src/cache/db.js`, `src/AdminApp.jsx`

1. **Validação e Sanitização de URLs (`image` e `source_url`)**:
   - Criar helper `isSafeHttpUrl(url)` (`/^https?:\/\//i.test(url)`) e `isSafeImageUrl(url)` (aceitando `https://`, `http://` ou caminho relativo simples sem `:`, `//` ou caracteres de quebra CSS).
   - Aplicar validação em `buildRecipePayload()` (`src/logic/admin-parser.js`) e antes de renderizar `recipe.image` (`src/components/RecipeModal.jsx` e `src/components/RecipeCard.jsx`) ou `recipe.source_url`.
2. **Ocultar Atalho de Edição Admin para Visitantes Públicos (`src/components/RecipeModal.jsx`)**:
   - Exibir o botão `<a href="admin.html?edit=...">` no `RecipeModal.jsx` apenas quando houver sessão administrativa ativa (ou ocultar para visitantes anônimos do catálogo público).
3. **Limpeza de Fila Local no Logout e Remoção de Imagens Órfãs no Storage**:
   - Criar `limparFilaSincronizacao()` em `src/cache/db.js` e acioná-la dentro de `signOut()` (`src/auth/session.js`) para não deixar payloads administrativos pendentes em dispositivos compartilhados.
   - Em `handleDeleteRecipe` (`src/AdminApp.jsx`), buscar a receita em `recipesList` (`recipesList.find(r => r.id === id)`) para garantir que `deleteRecipeImageFromStorage(recipe.image)` seja executada mesmo quando a receita excluída não estiver carregada no formulário de edição.

---

### [ ] S4 — Higiene de `.env`, Trava Anti-`service_role` no Navegador, Hardening de Auth (`config.toml`) e Deploy Seguro (#12)

**Onde:** `src/api/supabase.js`, `.gitignore`, `.env.example`, `supabase/config.toml`, `.github/workflows/deploy.yml`, `README_TEC.md`

1. **Trava contra Chave Secreta no Bundle do Navegador (`src/api/supabase.js`)**:
   - Verificar se `VITE_SUPABASE_ANON_KEY` começa com `sb_secret_` ou se o payload JWT decodificado contém `"role":"service_role"`, lançando erro explícito imediatamente para impedir exposição acidental da chave mestra no frontend.
2. **Higiene de `.gitignore` e `.env.example`**:
   - Adicionar `!.env.example` logo abaixo de `.env.*` no `.gitignore`.
   - Atualizar `.env.example` documentando claramente as variáveis públicas de frontend (`VITE_SUPABASE_URL=`, `VITE_SUPABASE_ANON_KEY=`) e as variáveis exclusivas de scripts CLI / Edge Functions (`SUPABASE_URL=`, `SUPABASE_SERVICE_ROLE_KEY=`, `GEMINI_API_KEY=`).
3. **Hardening de Autenticação (`supabase/config.toml`)**:
   - Definir `enable_signup = false` em `[auth]` e `[auth.email]` (impedindo criação de contas por terceiros via API, já que o sistema possui administrador único).
   - Definir `minimum_password_length = 8`, `enable_confirmations = true` e incluir `https://wagnergsantos.github.io/chef-digital/**` em `additional_redirect_urls`.
   - *(Conferir também no painel do Supabase: Authentication → User Signups → "Allow new users to sign up" = OFF e senha mínima = 8).*
4. **Falha Rápida no Deploy sem Secrets (`.github/workflows/deploy.yml`)**:
   - No step `Build`, validar que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão preenchidos antes de executar `npm run build`.

---

## 3. Ordem Recomendada de Execução (Segurança)

| Ordem | Issue | Código | Entrega | Prioridade | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **#11** | **S1** | Blindagem SQL (`is_admin()` em `salvar_receita`/`excluir_receita`, `REVOKE anon`, policies Storage e `CHECK` limits) | 🔥 Crítica | 📋 Aberto |
| **2** | **#13** | **S2** | Auth Admin na Edge Function `parse-recipe`, CORS restrito, proteção Anti-SSRF e CSP | 🔥 Crítica | 📋 Aberto |
| **3** | **#1** | **S3** | Sanitização de URLs (`image`/`source_url`), ocultar link admin para público e limpeza no logout/Storage | 🟡 Alta | 📋 Aberto |
| **4** | **#12** | **S4** | Trava anti-`service_role` no browser, `.gitignore`/`.env.example`, `config.toml` (`enable_signup=false`) e CI/CD | 🟡 Alta | 📋 Aberto |

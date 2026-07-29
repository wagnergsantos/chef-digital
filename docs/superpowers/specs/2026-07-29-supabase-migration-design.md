# Spec: Migração de Receitas para Supabase e Upgrade para Vite

Este documento especifica o design arquitetural para migrar o banco de dados do Chef Digital (atualmente estático no arquivo `receitas.js`) para um banco de dados relacional no **Supabase**, incluindo o upgrade do projeto estático para o ecossistema **Vite**, implementação de autenticação administrativa e sincronização offline-first com **IndexedDB**.

---

## 1. Visão Geral

Atualmente, as receitas do Chef Digital são salvas em um objeto Javascript rígido de mais de 6 mil linhas (`receitas.js`). Essa estrutura dificulta a edição móvel, causa lentidão no editor de código e gera diffs gigantescos no histórico do Git. 

A nova arquitetura moverá o armazenamento para o **Supabase** (PostgreSQL na nuvem), fornecendo:
* Banco de dados relacional flexível.
* Painel administrativo próprio no PWA para cadastrar e editar receitas diretamente.
* Autenticação segura para proteger o painel.
* Funcionamento offline instantâneo (offline-first) via cache no **IndexedDB**.
* Build rápido e moderno via **Vite** com deploy contínuo para o GitHub Pages.

---

## 2. Estrutura do Projeto (Vite)

O projeto será reestruturado de um conjunto de arquivos HTML/CSS/JS estáticos puros para uma estrutura modularizada gerida pelo **Vite**.

### Nova Organização de Pastas

```
receitas/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Action para Deploy automático no GitHub Pages
├── public/
│   └── *.png                   # Imagens das receitas (<id>.png), servidas como estáticas pelo Vite
├── scripts/
│   └── migrate.js              # Script de migração idempotente receitas.js -> Supabase (seção 7)
├── src/
│   ├── main.js                 # Código principal do livro de receitas (carregamento e filtros)
│   ├── supabase.js             # Inicialização e chamadas do cliente Supabase
│   ├── cache.js                # Lógica de banco de dados offline (IndexedDB) + fila de sync
│   └── admin.js                # Lógica do painel de administração e formulário dinâmico
├── .env                        # Variáveis de ambiente locais (não enviado ao Git)
├── .env.example                # Modelo de exemplo de variáveis de ambiente
├── .gitignore                  # Regras para ignorar node_modules, dist e arquivos .env
├── index.html                  # Interface do livro de receitas (atualizada para usar src/main.js)
├── estilos.css                 # Folha de estilo do PWA (mantida intacta)
├── admin.html                  # Interface do painel de administração (nova)
├── package.json                # Gerenciamento de pacotes npm (inclui @supabase/supabase-js, vite-plugin-pwa)
└── vite.config.js              # Configuração do Vite (base path, vite-plugin-pwa e servidor local)
```

> Nota: `sw.js` e `manifest.json` manuais na raiz do projeto atual são **removidos** e substituídos pela geração automática do `vite-plugin-pwa` (ver seção 8), evitando que o service worker referencie assets com nomes que não existirão mais após o build com hash do Vite.

---

## 3. Schema do Banco de Dados (Supabase/PostgreSQL)

O banco de dados relacional conterá quatro tabelas principais.

> ⚠️ **Preservação de IDs na migração**: os `id` de receita usados hoje já são referenciados fora do banco de dados — em `localStorage` (`chef_digital_favorites`, `chef_digital_planned`) e no nome dos arquivos de imagem na raiz do repo (`<id>.png`). Trocar esses IDs quebraria favoritos, planejamento semanal e a associação com imagens de todo usuário que já usa o app. Por isso a tabela `receitas` usa `id INT PRIMARY KEY` (sem `GENERATED ALWAYS`), e o script de migração (seção 7) **insere explicitamente os IDs atuais**, ajustando a sequence depois. Novas receitas criadas pelo admin recebem ID pela sequence normalmente.

### 3.1 Tabela de Categorias

Para não perder o mapa `chave -> rótulo` (e a ordem de exibição) hoje definido em `receitasData.categories`, as categorias viram uma tabela própria em vez de apenas strings soltas:

```sql
CREATE TABLE categorias (
  key TEXT PRIMARY KEY,           -- ex.: "arroz"
  label TEXT NOT NULL,            -- ex.: "Arroz"
  sort_order INT NOT NULL DEFAULT 0
);
```

### 3.2 Tabela de Receitas

```sql
CREATE TABLE receitas (
  id INT PRIMARY KEY,             -- preservado da migração; novas receitas usam a sequence abaixo
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍲',
  image TEXT,
  source TEXT,
  tips TEXT,
  category TEXT[] NOT NULL DEFAULT '{}',  -- chaves que devem existir em categorias.key (validado na RPC salvar_receita/admin, não há FK nativa para array)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sequence própria para novas receitas (não usamos IDENTITY para poder inserir IDs explícitos na migração)
CREATE SEQUENCE receitas_id_seq OWNED BY receitas.id;
ALTER TABLE receitas ALTER COLUMN id SET DEFAULT nextval('receitas_id_seq');
-- Após a migração (seção 7), rodar: SELECT setval('receitas_id_seq', (SELECT MAX(id) FROM receitas));

-- Trigger para manter updated_at em dia (usado também para resolução de conflitos offline, ver seção 5)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receitas_updated_at BEFORE UPDATE ON receitas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 3.3 Tabela de Ingredientes

```sql
CREATE TABLE ingredientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id INT REFERENCES receitas(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  qty NUMERIC,
  unit TEXT,
  ordem INT NOT NULL
);
```

### 3.4 Tabela de Passos (Modo de Preparo)

```sql
CREATE TABLE passos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id INT REFERENCES receitas(id) ON DELETE CASCADE NOT NULL,
  step_text TEXT NOT NULL,
  ordem INT NOT NULL
);
```

---

## 4. Segurança e Políticas de Acesso (RLS)

Habilitaremos o **Row Level Security (RLS)** em todas as tabelas para garantir a segurança da gravação mesmo com chaves de acesso públicas no navegador.

> ⚠️ **Por que não basta `TO authenticated`**: a chave anon fica embutida (pública) no bundle JS de produção. Se a policy de escrita liberar qualquer usuário `authenticated`, **qualquer pessoa que crie uma conta** no projeto Supabase (via signup público do Auth) ganha permissão de alterar/apagar receitas. Como o painel é de uso pessoal, a policy precisa checar explicitamente que o usuário é o administrador — não apenas que está logado.

* **Tabela de administradores** (allowlist explícita, evita depender de custom claims):
  ```sql
  CREATE TABLE admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
  );
  -- Inserir manualmente o seu próprio user_id (obtido após o primeiro login) via SQL editor do Supabase.

  CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
  $$ LANGUAGE sql STABLE SECURITY DEFINER;
  ```
* **Leitura (SELECT):** Permitida publicamente para qualquer usuário (anon), incluindo `categorias`.
  ```sql
  ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
  ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE passos ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Permitir leitura pública" ON categorias FOR SELECT USING (true);
  CREATE POLICY "Permitir leitura pública" ON receitas FOR SELECT USING (true);
  CREATE POLICY "Permitir leitura pública" ON ingredientes FOR SELECT USING (true);
  CREATE POLICY "Permitir leitura pública" ON passos FOR SELECT USING (true);
  ```
* **Modificação (INSERT, UPDATE, DELETE):** Permitida **apenas para o(s) administrador(es) cadastrado(s)** em `admins`, não para qualquer usuário autenticado:
  ```sql
  CREATE POLICY "Somente admin modifica" ON receitas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  CREATE POLICY "Somente admin modifica" ON ingredientes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  CREATE POLICY "Somente admin modifica" ON passos FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  CREATE POLICY "Somente admin modifica" ON categorias FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  ```
* Também: **desabilitar signup público** em Authentication → Settings do projeto Supabase (ou restringir a domínio de e-mail específico), já que o único usuário legítimo é o administrador, cadastrado manualmente.

---

## 5. Lógica de Dados e Persistência Offline (IndexedDB)

Para manter o PWA 100% usável na cozinha sem depender de internet, a lógica de dados utilizará uma estratégia **offline-first**.

```
+---------------+      1. Lê Local      +------------+
|  Inicializa   | --------------------> | IndexedDB  | (Carregamento instantâneo)
|  PWA App      |                       +------------+
+---------------+                             |
        | 2. Fetch em Background              | Renderiza
        v                                     v
+---------------+  Sucesso: Atualiza    +------------+
|   Supabase    | --------------------> |   Tela /   |
|   Database    |                       | IndexedDB  |
+---------------+                       +------------+
```

### Detalhes do Cache Offline:
* **Leitura**: O app carrega as receitas do IndexedDB local imediatamente. Logo após, tenta consultar o Supabase via rede. Se retornar dados novos (comparando `updated_at`), atualiza o cache local no IndexedDB e renderiza na tela de forma limpa.
* **Sincronização de Escrita Offline**:
  > ⚠️ Como a criação de receitas envolve 3 tabelas relacionadas (`receitas`, `ingredientes`, `passos`), **não fazemos 3 requisições soltas ao Supabase** — uma falha de rede no meio deixaria dados órfãos (ex.: receita criada sem ingredientes). Toda gravação (criar ou editar receita completa) é enviada como **uma única chamada atômica** a uma **Postgres Function (RPC)** que roda em transação no servidor:
  ```sql
  CREATE OR REPLACE FUNCTION salvar_receita(receita JSONB, ingredientes JSONB, passos JSONB)
  RETURNS INT AS $$
  DECLARE
    novo_id INT;
  BEGIN
    -- INSERT ou UPDATE em receitas conforme receita->>'id' exista ou não,
    -- depois DELETE + INSERT dos ingredientes/passos associados ao receita_id.
    -- Toda a função roda em uma única transação implícita do Postgres;
    -- qualquer erro reverte todas as alterações.
    ...
    RETURN novo_id;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
  1. No admin, ao salvar uma receita **online**, o app chama `supabase.rpc('salvar_receita', {...})` diretamente — sem estado intermediário multi-etapas.
  2. Se estiver **offline**, o payload completo (receita + ingredientes + passos) é salvo como um único item na fila `pendentes_sincronizacao` do IndexedDB, com um **ID temporário local** (`temp_<uuid>`) caso seja uma receita nova (edições usam o `id` real existente).
  3. O navegador escuta o evento de conexão: `window.addEventListener('online', processarFila)`. Ao restabelecer conexão, o app percorre a fila **em ordem** e chama `salvar_receita` para cada item pendente.
  4. Para receitas novas, a resposta da RPC retorna o **ID real gerado pelo servidor**; o app atualiza a referência local (troca `temp_<uuid>` pelo ID real no IndexedDB) antes de remover o item da fila.
  5. Cada item da fila guarda `tentativas` e `ultimo_erro`; após N tentativas falhas, o item é marcado como `falha_manual` e exibido no admin para revisão manual (evita loop infinito de retry silencioso).
  6. **Resolução de conflito**: como o uso é de um único administrador, adotamos "última escrita vence" comparando `updated_at` — não há merge automático de campos. Isso é aceitável dado o escopo de uso pessoal, mas está documentado aqui como limitação consciente.

---

## 6. Autenticação e Painel do Administrador

A nova página `admin.html` fornecerá a interface de administração.

* **Login (Autenticação):** 
  Utilizará o Supabase Auth com login clássico por e-mail e senha. 
  ```javascript
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  ```
  A sessão ativa é guardada automaticamente no `localStorage` pelo cliente do Supabase. Se um usuário não autenticado acessar `admin.html`, será redirecionado para a tela de login.
* **Interface Dinâmica:**
  * **Ingredientes:** Permite adicionar ou remover linhas com inputs para `Quantidade`, `Unidade` e `Nome` dinamicamente no DOM.
  * **Passos:** Permite adicionar ou remover caixas de texto de forma ordenada.
  * **Imagem:** Para o MVP, o campo `image` continua sendo o nome de um arquivo estático já existente em `public/` (ex.: `1.png`), selecionado/digitado manualmente — **não há upload de imagem pelo painel nesta primeira versão**. Evoluir para upload real (Supabase Storage, com `image_url` completo) fica como melhoria futura explícita, fora do escopo desta migração.
* **Gravação Relacional:**
  Ao salvar uma receita, o admin monta um único payload (dados da receita + array de ingredientes + array de passos) e chama a RPC `salvar_receita` (seção 5), que executa o insert/update da receita e o replace de ingredientes/passos **em uma única transação no servidor** — eliminando o risco de gravação parcial que existiria com 3 inserts sequenciais feitos pelo cliente.

---

## 7. Script de Migração (Node.js)

Criaremos um script utilitário em `scripts/migrate.js` que fará a leitura única e transição do seu banco atual para o Supabase, com atenção especial a **preservar IDs** e ser **seguro para reexecução**:

1. O script importa o arquivo atual `receitas.js` e lê `categories` e `recipes`.
2. **Categorias**: faz `upsert` em `categorias` usando `key` como chave natural (`onConflict: 'key'`), preservando `label` e definindo `sort_order` pela ordem em que aparecem no map original.
3. **Receitas**: para cada receita, faz `upsert` em `receitas` **usando o `id` numérico já existente no `receitas.js`** (não deixa o banco gerar um novo) via `onConflict: 'id'` — assim o script pode ser rodado mais de uma vez sem duplicar dados.
4. **Ingredientes e passos**: como não têm uma chave natural própria, o script primeiro faz `DELETE FROM ingredientes WHERE receita_id = ?` / `DELETE FROM passos WHERE receita_id = ?` para aquela receita e depois insere a lista atual — garantindo idempotência (reexecutar não duplica linhas).
5. Ao final, ajusta a sequence de novos IDs: `SELECT setval('receitas_id_seq', (SELECT MAX(id) FROM receitas))`, para que a próxima receita criada pelo admin (fora da migração) receba um ID livre.
6. Exibe um relatório de migração com quantidade de categorias/receitas/ingredientes/passos criados ou atualizados, e uma lista de eventuais erros (ex.: receita sem categoria válida) sem interromper o restante do lote.
7. O script roda contra variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — usa a **service role key** (não a anon key) para poder inserir ignorando RLS, e nunca deve ser commitado com credenciais.

---

## 8. Estratégia de Deploy (GitHub Pages)

Configuraremos uma GitHub Action em `.github/workflows/deploy.yml` para compilar o projeto Vite e fazer o deploy contínuo para o GitHub Pages.

As credenciais do Supabase serão salvas como **Repository Secrets** no GitHub (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) e injetadas pelo runner do GitHub durante o build de produção (`npm run build`), mantendo o repositório 100% limpo e sem chaves em hardcode no Git. A chave usada aqui é sempre a **anon key** (protegida pela RLS da seção 4) — a `service_role` key (usada só pelo script de migração) nunca é exposta ao bundle nem ao workflow de deploy.

### PWA: migrando `sw.js`/`manifest.json` para o Vite

O `sw.js` e `manifest.json` atuais pré-cacheiam nomes de arquivo fixos (`index.html`, `estilos.css`, `receitas.js`...). Com o Vite, os assets de produção saem com hash no nome (`main.a1b2c3.js`), então o service worker manual atual ficaria referenciando arquivos que não existem mais no build, quebrando o offline. Por isso:
* Substituímos o service worker manual por **`vite-plugin-pwa`** (baseado em Workbox), que gera automaticamente um `sw.js` com a lista correta de assets versionados a cada build (`precache manifest`).
* `manifest.json` passa a ser gerado/gerenciado pelo mesmo plugin, garantindo que `start_url` e `scope` fiquem alinhados ao `base` configurado em `vite.config.js` (necessário porque o GitHub Pages publica em um subpath, ex.: `/receitas/`).
* Mantemos o comportamento de cache "network-first para dados do Supabase, cache-first para assets estáticos", compatível com a camada de offline-first da seção 5 (que já cuida do cache de dados via IndexedDB — o service worker cuida apenas do cache de *assets* da aplicação, não dos dados das receitas).

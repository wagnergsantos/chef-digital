# Chef Digital - PWA de Receitas com Supabase e Vite

Este é um PWA (Progressive Web App) offline-first para gerenciamento e visualização de receitas pessoais sem anúncios. O sistema foi migrado de uma estrutura estática de arquivos JS locais para um banco de dados relacional robusto no **Supabase (Postgres)**, gerenciado por build e deploys automatizados via **Vite** e **GitHub Actions**.

---

## 🚀 Arquitetura do Projeto

1. **Frontend**: HTML5 semântico estruturado e CSS modularizado com suporte automático a Dark/Light Mode.
2. **Componentização & Escopo**: Lógica do cliente desacoplada em ES Modules (`src/main.js`).
3. **Persistência Local (IndexedDB)**: Cache automático no navegador (`src/cache.js`) que permite abrir e navegar por todas as receitas em modo 100% offline.
4. **Fila de Sincronização (Sync Queue)**: Se o administrador cadastrar ou editar uma receita sem conexão com a internet, as modificações são gravadas em uma fila IndexedDB local e enviadas ao banco de dados Supabase automaticamente assim que o sinal de rede é reestabelecido.
5. **Automação PWA**: Service Workers gerados dinamicamente via `vite-plugin-pwa`.

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
* Node.js (v18 ou superior) instalado no computador.
* Gerenciador de pacotes `npm`.

### Passo a Passo

1. **Instalar dependências**:
   No terminal da pasta do projeto, execute:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Abra o arquivo `.env` gerado e insira a URL e a chave pública Anon do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

3. **Rodar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a URL gerada no terminal (ex: `http://localhost:5173/receitas/`).

---

## 📦 Como Migrar os Dados Locais para o Supabase

O script `scripts/migrate.js` lê todas as receitas e categorias contidas no seu antigo arquivo estático `receitas.js`, faz o parse dos dados e insere tudo de forma normalizada e idempotente no Supabase.

### Como Executar a Migração:

Para executar a escrita direta no banco, você precisará da **Service Role Key** (chave privada administrativa do Supabase). Ela pode ser copiada no painel do Supabase em **Settings (engrenagem)** -> **API** -> `service_role`.

Execute o script de migração no terminal passando as credenciais como variáveis de ambiente:

#### No Windows (PowerShell)
```powershell
$env:SUPABASE_URL="https://wwggutgdluiaaquzvmau.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_SERVICE_ROLE_AQUI"
node scripts/migrate.js
```

#### No Linux / macOS / Git Bash
```bash
SUPABASE_URL="https://wwggutgdluiaaquzvmau.supabase.co" SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_SERVICE_ROLE_AQUI" node scripts/migrate.js
```

---

## 🗄️ Conectando com Ferramentas Desktop (DBeaver / TablePlus)

Como o Supabase utiliza o banco de dados relacional **PostgreSQL**, você pode gerenciar sua estrutura e visualizar seus dados diretamente do seu computador utilizando qualquer programa de administração SQL tradicional.

### Ferramentas Desktop Recomendadas:
* **DBeaver** (Grátis, Open Source e super completo)
* **TablePlus** (Rápido, nativo e muito moderno)
* **Beekeeper Studio** (Interface limpa e visualmente amigável)

### Dados de Conexão:
No painel do Supabase, acesse **Settings (engrenagem)** -> **Database** -> seção **Connection Info**. Preencha os campos da sua ferramenta desktop com os seguintes dados:

* **Host**: `db.wwggutgdluiaaquzvmau.supabase.co`
* **Port**: `5432` (Conexão direta) ou `6543` (Com Pool de conexão)
* **User**: `postgres`
* **Database**: `postgres`
* **Password**: A senha mestra que você definiu ao criar o projeto no Supabase.

---

## 🤖 Configuração do Deploy Automático (GitHub Actions)

O deploy é feito de forma totalmente automatizada pelo **GitHub Actions** toda vez que você enviar novos commits para a branch `main`.

Para que a compilação funcione, você deve configurar os segredos do Supabase no repositório do seu GitHub:

1. No repositório do seu projeto no GitHub, clique na aba **Settings**.
2. No menu lateral esquerdo, vá em **Secrets and variables** -> **Actions**.
3. Clique no botão **New repository secret** e cadastre as seguintes duas variáveis secretas:
   * Nome: `VITE_SUPABASE_URL` | Valor: `https://wwggutgdluiaaquzvmau.supabase.co`
   * Nome: `VITE_SUPABASE_ANON_KEY` | Valor: *(Sua chave Anon Key)*
4. Envie seus códigos para a branch `main` e o GitHub Actions fará o build e deploy na branch `gh-pages` de forma autônoma.
5. Nas configurações de **Pages** do repositório, certifique-se de que a origem do deploy está configurada como a branch `gh-pages` (pasta raiz).

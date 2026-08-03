# Chef Digital — Documentação Técnica & Arquitetura

Documentação técnica destinada a desenvolvedores, mantenedores e agentes de IA sobre a arquitetura, instalação local, banco de dados e pipeline de deploy do **Chef Digital**.

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
* Node.js (v18 ou superior).
* Gerenciador de pacotes `npm`.

### Passo a Passo

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Preencha `.env` com suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

3. **Rodar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Executar Testes e Linter**:
   ```bash
   npm run test   # Suíte de testes com Vitest
   npm run lint   # Verificação estática com Oxlint
   ```

---

## 🚀 Arquitetura do Projeto (Arquitetura Unificada)

O projeto segue a **Arquitetura Unificada** desacoplada em camadas:

```
src/
├── api/            # I/O externo: Supabase client (supabase.js)
├── logic/          # Regras de negócio puras sem DOM (recipes.js, admin-parser.js, cooking-timer.js)
├── cache/          # Persistência local e fila de sync (db.js - IndexedDB)
├── modules/        # UI & Handlers DOM (recipes-render.js, theme.js, state.js, planner-drawer.js, etc.)
└── main.js         # Bootstrap enxuto de inicialização e exportações globais
```

---

## 🔑 Painel Administrativo (`admin.html`)

Para acessar a área de gestão de receitas (`admin.html`) e publicar novos pratos:

1. **Criar Usuário no Supabase Auth**:
   No painel do Supabase, vá em **Authentication** -> **Create User**.
2. **Conceder Permissão de Admin**:
   Insira o UUID do usuário criado na tabela **`admins`**.
3. Acesse `admin.html` e faça login.

---

## 🤖 Deploy Automático (GitHub Actions / Pages)

- **Deploy**: Realizado automaticamente pelo GitHub Actions ao enviar commits para `main`.
- **Vite Base Path**: Configurado em `vite.config.js` (`base: '/<repo-name>/'`).
- **Segredos de Repositório**: Cadastrar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações de Secrets do repositório no GitHub.

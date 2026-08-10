# Especificação de Design: Alinhamento de Schema e Interface para Novos Campos de Receita

**Data:** 09/08/2026  
**Status:** Aprovado  
**Objetivo:** Expandir a estrutura de dados e a interface do **Chef Digital** para suportar os novos campos padronizados do **Schema.org/Recipe** (`prep_time`, `cook_time`, `source_url`, `author`), preparando o terreno para a importação via IA/URL sem quebras de contrato.

---

## 1. Arquitetura de Dados & Atualização do Schema

### 1.1 Novos Campos no Objeto Receita (`Recipe`)

| Campo no App | Tipo | Schema.org Equivalente | Descrição |
|---|---|---|---|
| `prep_time` | `number \| null` | `prepTime` (ISO 8601 -> min) | Tempo de preparo em minutos (ex: `15`). |
| `cook_time` | `number \| null` | `cookTime` (ISO 8601 -> min) | Tempo de cozimento/fogo em minutos (ex: `45`). |
| `source_url` | `string \| null` | `url` / `mainEntityOfPage` | URL original da receita importada (ex: `https://panelinha.com.br/...`). |
| `author` | `string \| null` | `author.name` / `publisher` | Nome da fonte ou autor (ex: `Rita Lobo / Panelinha`). |

### 1.2 Atualização em `docs/schema.md` e `docs/prompt.md`

- **JSDoc / JSON Schema**: Incorporar os 4 novos campos opcionais (`prep_time`, `cook_time`, `source_url`, `author`).
- **Prompt IA (`prompt.md`)**: Instruir o "Chef Parser" a extrair tempos de preparo (em minutos inteiros), autor e URL da fonte quando disponíveis.

---

## 2. Mudanças na Interface (UI / UX)

### 2.1 Modal de Detalhes da Receita (`index.html` / `recipe-modal.js`)
1. **Badges no Banner de Cabeçalho**:
   - `⏱️ Preparo: 15 min` (se `prep_time` estiver preenchido).
   - `🍳 Fogo: 45 min` (se `cook_time` estiver preenchido).
   - `🍽️ X porções` (já existente).
2. **Rodapé de Atribuição e Origem**:
   - Exibir no final da coluna de dicas um link discreto e elegante para a fonte original:
     `🔗 Origem: Panelinha (Rita Lobo)` direcionando para `source_url` com `target="_blank" rel="noopener noreferrer"`.

### 2.2 Formulário Admin de Cadastro/Edição (`admin.html` / `admin.js`)
- Adicionar campos numéricos no form:
  - `Tempo de Preparo (minutos)`
  - `Tempo de Cozimento (minutos)`
  - `URL de Origem`
  - `Autor / Fonte`
- Atualizar a função `buildRecipePayload()` em `admin-parser.js` para validar e construir o payload completo.

---

## 3. Sincronização e Persistência de Dados

- **Supabase / IndexedDB**: Garantir que as consultas `select()` em `main.js` tragam `prep_time`, `cook_time`, `source_url` e `author` e os salvem no cache local IndexedDB.

---

## 4. Plano de Testes & Validação
- Teste unitário em `admin-parser.test.js` para garantir parsing correto dos novos campos.
- Execução de `npm test` e `npx vite build`.

# Plano de Implementação: Consolidação Não-Destrutiva do Planejamento Semanal e Lista de Compras

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alterar o comportamento da consolidação da lista de compras no menu semanal para atualizar apenas a seção correspondente ("Menu Semanal Consolidado") em vez de apagar toda a lista de compras, preservando os itens marcados como comprados e as outras receitas adicionadas avulsas.

**Architecture:**
O estado da lista de compras (`shoppingList`) continuará sendo um objeto chave-valor armazenado no `localStorage`.
A consolidação de receitas planejadas será isolada na chave `shoppingList["Menu Semanal Consolidado"]`. Ao executar a consolidação, a lista de itens anteriores desse grupo será inspecionada para extrair o estado `checked` de cada ingrediente (mapeado pelo nome normalizado), aplicando-o aos novos itens gerados.

**Architecture Diagram:**

```mermaid
graph TD
    A[Usuário clica em Consolidar] --> B[Obter plannedRecipes]
    B --> C[Mapear checked em shoppingList['Menu Semanal Consolidado']]
    C --> D[Gerar nova consolidação de ingredientes]
    D --> E[Aplicar checked preservado para cada ingrediente]
    E --> F[Atualizar apenas a chave 'Menu Semanal Consolidado']
    F --> G[Salvar no localStorage]
    G --> H[Recarregar UI da Lista de Compras]
```

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, LocalStorage API.

## Global Constraints
- Nenhuma dependência externa nova deve ser introduzida.
- Preservar o suporte a multitag de categorias e compatibilidade com receitas existentes.
- Garantir acessibilidade (atributos `aria-*` e foco de teclado).

---

### Task 1: Ajustar a Lógica de Consolidação

**Files:**
- Modify: `index.html:901-952`

**Interfaces:**
- Consumes: `plannedRecipes`, `recipes`, `shoppingList`
- Produces: Atualização isolada da chave `shoppingList["Menu Semanal Consolidado"]` no `localStorage`.

- [ ] **Step 1: Modificar a função `generateConsolidatedShoppingList`**

Substituir o bloco da função no arquivo [index.html](file:///C:/Sistemas/Projetos/receitas/index.html) (linhas 901-952) para:

```javascript
        function generateConsolidatedShoppingList() {
            if (plannedRecipes.length === 0) {
                showToast('Seu menu semanal está vazio! Planeje receitas primeiro.', 'error');
                return;
            }

            // 1. Mapear itens que já estavam marcados como comprados para manter o estado (checked)
            const checkedItemsMap = new Set();
            if (shoppingList["Menu Semanal Consolidado"]) {
                shoppingList["Menu Semanal Consolidado"].forEach(item => {
                    if (item.checked) {
                        checkedItemsMap.add(item.name.trim().toLowerCase());
                    }
                });
            }

            // 2. Limpar apenas o grupo do menu semanal consolidado para recriação
            shoppingList["Menu Semanal Consolidado"] = [];

            const tempConsolidated = {};

            plannedRecipes.forEach(p => {
                const recipe = recipes.find(r => r.id === p.id);
                if (!recipe) return;

                recipe.ingredients.forEach(ing => {
                    const normName = ing.name.trim();
                    const normUnit = (ing.unit || "").toLowerCase().trim();
                    const key = `${normName.toLowerCase()}|${normUnit}`;

                    let scaledQty = ing.qty !== null ? ing.qty * p.portions : null;

                    if (tempConsolidated[key]) {
                        if (tempConsolidated[key].qty !== null && scaledQty !== null) {
                            tempConsolidated[key].qty += scaledQty;
                        }
                    } else {
                        // Preserva o estado 'checked' se já estava marcado antes
                        const wasChecked = checkedItemsMap.has(normName.toLowerCase());
                        tempConsolidated[key] = {
                            name: normName,
                            qty: scaledQty,
                            unit: ing.unit,
                            checked: wasChecked
                        };
                    }
                });
            });

            // 3. Converter de mapa para array no grupo correspondente da lista de compras
            Object.keys(tempConsolidated).forEach(k => {
                shoppingList["Menu Semanal Consolidado"].push(tempConsolidated[k]);
            });

            saveShoppingList();
            updateShoppingListBadge();
            
            // Transição suave de drawers
            document.getElementById('planner-drawer').classList.remove('open');
            setTimeout(() => {
                toggleShoppingList();
            }, 250);
        }
```

- [ ] **Step 2: Atualizar a dica de rodapé (Tooltip/Tip) no HTML**

Modificar a linha 176 no arquivo [index.html](file:///C:/Sistemas/Projetos/receitas/index.html) para esclarecer que a ação é não-destrutiva.

```diff
-            <p class="drawer-footer-tip">Essa ação junta e soma de forma inteligente as quantidades de ingredientes idênticos de todas as receitas planejadas!</p>
+            <p class="drawer-footer-tip">Essa ação junta e soma as quantidades de ingredientes das receitas planejadas na sua lista de compras, sem apagar seus outros itens!</p>
```

- [ ] **Step 3: Testar manualmente a consolidação no navegador**

1. Abra o arquivo `index.html` em seu navegador.
2. Abra qualquer receita (ex: a primeira da lista) e clique em `Adicionar à Lista de Compras`. Abra o drawer da lista de compras e verifique que ela está listada de forma avulsa.
3. Adicione 2 outras receitas diferentes ao planejador (usando o ícone de calendário no card ou no modal).
4. Abra o planejador e clique em `Consolidar Lista de Compras`.
5. Verifique que a lista de compras abre e contém **tanto** a receita adicionada de forma avulsa (preservada) **quanto** o grupo `"Menu Semanal Consolidado"`.
6. Marque um ou dois ingredientes do grupo `"Menu Semanal Consolidado"` como comprados (riscando-os).
7. Mude as porções de uma das receitas no planejador ou adicione mais uma receita ao planejador.
8. Clique em `Consolidar Lista de Compras` novamente.
9. Verifique que as quantidades foram atualizadas, mas os ingredientes marcados no passo 6 **continuam riscados/comprados**.

- [ ] **Step 4: Comitar as alterações**

Executar no terminal:
```bash
git add index.html
git commit -m "feat: make weekly planner consolidation non-destructive and preserve checked states"
```

# Especificação de Design: Unificação Não-Destrutiva do Planejamento Semanal e Lista de Compras

Este documento descreve a especificação de design para aprimorar as funcionalidades de **Menu Semanal (Planejador)** e **Lista de Compras**, tornando-as conceitualmente claras, independentes e não-destrutivas.

## 1. Contexto e Objetivos

Atualmente, o aplicativo possui duas funcionalidades principais de organização:
1. **Menu Semanal (Planejamento):** Organização das refeições a serem preparadas durante a semana.
2. **Lista de Compras:** Checklist de ingredientes para compra.

### O Problema
No estado atual, quando o usuário clica em "Consolidar Lista de Compras" no drawer do Menu Semanal, todo o estado da `shoppingList` é sobrescrito (`shoppingList = {}`), deletando receitas adicionadas individualmente ou quaisquer itens futuros que o usuário venha a gerenciar na lista. Além disso, a consolidação repetida faz com que itens já comprados (marcados como `checked`) percam seu estado.

### Objetivos do Aprimoramento
- **Independência de Fluxos:** O usuário pode adicionar receitas individuais diretamente à lista de compras ou planejar o menu da semana sem que uma ação interfira de forma destrutiva na outra.
- **Consolidação Inteligente e Não-Destrutiva:** O botão "Consolidar Lista de Compras" atualizará **apenas** a seção `"Menu Semanal Consolidado"`, preservando outras seções de receitas avulsas.
- **Preservação do Estado de Checklist:** Itens já marcados como comprados (`checked: true`) na seção consolidada devem permanecer marcados caso continuem presentes no novo menu semanal consolidado.

---

## 2. Detalhes de Implementação

### 2.1. Ajuste da Função de Consolidação (`generateConsolidatedShoppingList`)
A função em [index.html](file:///C:/Sistemas/Projetos/receitas/index.html) será alterada para:
1. Ler o estado atual da chave `shoppingList["Menu Semanal Consolidado"]` se ela existir.
2. Mapear quais ingredientes (normalizados por nome e unidade) já estavam marcados como `checked`.
3. Consolidar os ingredientes das receitas em `plannedRecipes` (multiplicados pelo respectivo número de porções de cada receita planejada).
4. Para cada ingrediente consolidado, definir a propriedade `checked` com base no mapa do passo 2.
5. Atualizar o valor de `shoppingList["Menu Semanal Consolidado"]` com a nova lista consolidada, mantendo as outras chaves do objeto `shoppingList` intactas.

### 2.2. Fluxo e Transições na Interface (UX)
- O botão "Consolidar Lista de Compras" continua no drawer do **Menu Semanal** para dar controle intencional ao usuário.
- Ao clicar no botão, a consolidação ocorre silenciosamente nos dados, e o drawer do planejador é fechado, abrindo o drawer da lista de compras em seguida com animação fluida (atraso de 250ms).
- A mensagem de rodapé no planejador será atualizada para reforçar que a consolidação adiciona/atualiza os ingredientes na lista de compras sem apagar seus outros itens.

---

## 3. Plano de Testes e Validação

### Cenários a Validar:
1. **Adição de Receita Avulsa:** Adicionar ingredientes da "Receita A" à lista diretamente do modal. A lista de compras deve conter o grupo `"Receita A"`.
2. **Planejamento e Consolidação:** Adicionar "Receita B" e "Receita C" ao planejador. Clicar em "Consolidar". A lista de compras deve conter `"Receita A"` (preservada) e `"Menu Semanal Consolidado"` com ingredientes de B e C somados.
3. **Preservação de Checkbox:** Marcar um ingrediente do `"Menu Semanal Consolidado"` como feito. Adicionar uma nova receita ao planejador e clicar em "Consolidar". O item marcado anteriormente deve continuar riscado/comprado.
4. **Limpeza do Menu:** Limpar o Menu Semanal e clicar em consolidar, ou remover o grupo pela lixeira da seção na lista. O grupo consolidado deve sumir sem afetar `"Receita A"`.

---

## 4. Estratégia de Rollback
As alterações afetam apenas a lógica em memória e armazenamento local (`localStorage`) no arquivo [index.html](file:///C:/Sistemas/Projetos/receitas/index.html). Caso ocorra algum problema inesperado, a versão anterior do arquivo pode ser restaurada facilmente via Git.

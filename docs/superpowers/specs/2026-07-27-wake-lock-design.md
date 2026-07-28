# Design Spec: Tela Ativa Durante o Preparo (Wake Lock)

**Data:** 2026-07-27
**Autor:** GitHub Copilot CLI (pair programmer)
**Status:** Em Revisão
**Projeto:** Chef Digital (Livro de Receitas & Planejador)

---

## 1. Visão Geral (Overview)

Enquanto o usuário está cozinhando com o modal de receita aberto (mãos sujas, sem tocar no celular), a tela do dispositivo apaga sozinha após o tempo padrão de bloqueio automático, interrompendo a leitura do passo a passo. Esta spec usa a **Screen Wake Lock API** para manter a tela ativa automaticamente enquanto o modal de receita estiver aberto.

Esta é uma versão **enxuta e independente** de Wake Lock, sem o escopo maior de "Modo Cozinha" (passo-a-passo em tela cheia + temporizadores) já descrito em `2026-07-15-modo-cozinha-design.md`, que permanece como um projeto futuro separado, ainda não implementado.

---

## 2. Objetivos (Goals & Non-Goals)

### Objetivos (Goals)
* Manter a tela ativa automaticamente sempre que o modal de receita estiver aberto, por padrão — sem exigir nenhuma ação do usuário.
* Liberar o wake lock ao fechar o modal, evitando dreno de bateria desnecessário.
* Readquirir o wake lock automaticamente quando o usuário volta à aba/desbloqueia o dispositivo com o modal ainda aberto (a API libera o lock sozinha ao ir para segundo plano) — desde que o usuário não tenha desativado manualmente.
* Indicador visual discreto ("🔆") no modal, visível apenas quando o wake lock está de fato ativo.
* Oferecer um botão dedicado no modal ("Manter tela ativa") para o usuário desativar/reativar o wake lock manualmente, mesmo com a receita aberta (ex: se preferir economizar bateria numa receita rápida).
* Degradar graciosamente (sem erros visíveis, sem quebrar o app) em navegadores sem suporte à API ou quando a requisição falhar.

### Non-Goals
* Não implementa modo passo-a-passo em tela cheia, tipografia ampliada, nem temporizadores — isso continua coberto (separadamente, no futuro) por `2026-07-15-modo-cozinha-design.md`.
* Não persiste a preferência de ligado/desligado em `localStorage` — é um comportamento por sessão de visualização daquela receita; ao fechar e reabrir (a mesma receita ou outra), o wake lock volta a ficar ativado por padrão.

---

## 3. Arquitetura

### 3.1. Estado
```js
let wakeLockSentinel = null;
let wakeLockUserDisabled = false; // intenção do usuário nesta sessão de visualização (não persiste)
```

### 3.2. `acquireWakeLock()`
Chamado dentro de `openRecipeModal()`, após o modal ser exibido, e também pelo botão de toggle ao reativar:
```js
async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return; // navegador sem suporte, sem indicador
    if (wakeLockUserDisabled) return; // usuário desativou manualmente para esta receita
    try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
            updateWakeLockIndicator(); // esconde o ícone
        });
        updateWakeLockIndicator(); // mostra o ícone
    } catch (e) {
        // Falha silenciosa (ex: bateria fraca, NotAllowedError) — app segue normalmente sem o wake lock.
        wakeLockSentinel = null;
    }
}
```

### 3.3. `releaseWakeLock()`
Chamado dentro de `closeRecipeModal()` e pelo botão de toggle ao desativar. Apenas libera o sentinel atual — não mexe em `wakeLockUserDisabled` (quem seta essa flag é `toggleWakeLock()`):
```js
function releaseWakeLock() {
    if (wakeLockSentinel) {
        wakeLockSentinel.release();
        wakeLockSentinel = null;
    }
    updateWakeLockIndicator();
}
```

### 3.4. `toggleWakeLock()`
Acionado pelo botão "Manter tela ativa" no modal. Alterna a intenção do usuário e imediatamente adquire/libera o lock:
```js
function toggleWakeLock() {
    if (wakeLockUserDisabled) {
        wakeLockUserDisabled = false;
        acquireWakeLock();
    } else {
        wakeLockUserDisabled = true;
        releaseWakeLock();
    }
    updateWakeLockToggleButton();
}
```
`openRecipeModal()` reseta `wakeLockUserDisabled = false` antes de chamar `acquireWakeLock()`, garantindo que cada nova receita aberta (ou a mesma reaberta) comece com o comportamento padrão (ativado), sem persistir a escolha anterior em `localStorage`.

### 3.5. Reaquisição automática
Listener único, registrado uma vez (fora de qualquer função de modal), cobrindo o caso em que o SO libera o lock ao ir para segundo plano (troca de app, bloqueio de tela) e o usuário volta com o modal ainda aberto — mas apenas se o usuário não tiver desativado manualmente:
```js
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && activeRecipeId !== null && !wakeLockSentinel && !wakeLockUserDisabled) {
        acquireWakeLock();
    }
});
```
(`activeRecipeId !== null` já funciona como proxy de "modal de receita aberto", reaproveitando a variável de estado existente em vez de um novo helper.)

### 3.6. `updateWakeLockIndicator()` e `updateWakeLockToggleButton()`
- `updateWakeLockIndicator()` alterna a visibilidade do ícone `#wake-lock-indicator`, com base em `wakeLockSentinel !== null` (reflete se o lock está de fato concedido pelo navegador).
- `updateWakeLockToggleButton()` alterna o texto/estado visual do botão `#wake-lock-toggle-btn` (ex: "Manter tela ativa" ativo vs. "Tela ativa desligada"), com base em `!wakeLockUserDisabled` (reflete a intenção do usuário, independente de suporte do navegador).

---

## 4. Interface

- Ícone discreto "🔆" posicionado próximo ao título da receita dentro do modal, com `aria-label="Tela ativa durante o preparo"` para acessibilidade. Visível **somente** quando `wakeLockSentinel !== null` (wake lock de fato concedido pelo navegador).
- Botão dedicado de toggle na `.modal-header-banner`, ao lado do botão de fechar (mesmo estilo circular/icon-only de `.modal-close-btn`, posicionado à sua esquerda). Alterna entre estado ativado/desativado (`aria-pressed`, `aria-label`/`title` dinâmicos), permitindo desligar/religar o wake lock manualmente mesmo com a receita aberta. Em navegadores sem suporte à API, o botão continua visível mas sua ação não tem efeito perceptível (não há wake lock para desativar); ele não precisa ser escondido, pois não representa erro.
- Nenhum outro elemento de UI é adicionado — sem configuração adicional, sem mensagens de erro.

---

## 5. Casos de Borda e Plano de Testes

### Casos de borda
- **Fechar o modal com wake lock ativo**: libera corretamente via `releaseWakeLock()`, evitando dreno de bateria após o usuário sair da tela.
- **Troca de aba/bloqueio de tela com modal aberto**: o SO libera o lock automaticamente (evento `release` disparado); ao usuário voltar (`visibilitychange` → `visible`), o lock é readquirido automaticamente e o ícone reaparece.
- **`file://`**: a Wake Lock API não exige necessariamente contexto seguro em todos os navegadores (comportamento pode variar por browser/versão) — deve ser testada nesse protocolo e degradar graciosamente se a requisição falhar.
- **Navegador sem suporte** (ex: Safari mais antigo, alguns navegadores desktop): `'wakeLock' in navigator` é `false`, função retorna imediatamente, nenhum erro no console, nenhum ícone exibido.
- **Requisição rejeitada** (ex: `NotAllowedError` por bateria fraca/economia de energia do sistema): capturado no `catch`, app segue funcionando normalmente sem a proteção.
- **Usuário desativa manualmente pelo botão**: `releaseWakeLock()` é chamado e `wakeLockUserDisabled = true`; o listener de `visibilitychange` não readquire o lock enquanto essa flag estiver ativa, mesmo trocando de aba e voltando.
- **Usuário reativa manualmente pelo botão**: `wakeLockUserDisabled = false` e `acquireWakeLock()` é chamado imediatamente, sem esperar o próximo `visibilitychange`.
- **Fechar e reabrir o modal (mesma receita ou outra) após ter desativado manualmente**: `openRecipeModal()` reseta `wakeLockUserDisabled = false`, então o wake lock volta a ficar ativado por padrão — a escolha não persiste entre aberturas do modal.

### Plano de testes (manual, sem automação — projeto não possui suíte de testes)
1. Abrir uma receita no Chrome/Edge desktop ou Android (que suportam Wake Lock) → confirmar que o ícone "🔆" aparece e a tela não apaga sozinha após o tempo normal de bloqueio automático do dispositivo.
2. Fechar o modal → confirmar que o ícone some e o comportamento de bloqueio automático da tela volta ao normal.
3. Com o modal aberto, trocar de aba (ou minimizar/bloquear a tela no celular) e voltar → confirmar que o wake lock é readquirido automaticamente (ícone reaparece).
4. Testar em um navegador/dispositivo sem suporte à API → confirmar que não há erros no console e o app funciona normalmente, apenas sem o ícone.
5. Testar em `file://` diretamente → confirmar o comportamento (com ou sem suporte da API), sem quebrar nenhuma outra funcionalidade do app.
6. Clicar no botão "Manter tela ativa" para desativar → confirmar que o ícone "🔆" some e o botão reflete o estado desativado.
7. Com o wake lock desativado manualmente, trocar de aba e voltar → confirmar que o lock **não** é readquirido automaticamente.
8. Clicar novamente no botão para reativar → confirmar que o ícone volta a aparecer imediatamente (sem precisar trocar de aba).
9. Fechar o modal com o wake lock desativado manualmente e reabrir (a mesma receita ou outra) → confirmar que o wake lock volta a ativar por padrão (a desativação não persiste entre aberturas do modal).

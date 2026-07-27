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
* Manter a tela ativa automaticamente sempre que o modal de receita estiver aberto — sem necessidade de um botão/toggle manual.
* Liberar o wake lock ao fechar o modal, evitando dreno de bateria desnecessário.
* Readquirir o wake lock automaticamente quando o usuário volta à aba/desbloqueia o dispositivo com o modal ainda aberto (a API libera o lock sozinha ao ir para segundo plano).
* Indicador visual discreto ("🔆") no modal, visível apenas quando o wake lock está de fato ativo.
* Degradar graciosamente (sem erros visíveis, sem quebrar o app) em navegadores sem suporte à API ou quando a requisição falhar.

### Non-Goals
* Não implementa modo passo-a-passo em tela cheia, tipografia ampliada, nem temporizadores — isso continua coberto (separadamente, no futuro) por `2026-07-15-modo-cozinha-design.md`.
* Não adiciona um botão manual de ativação/desativação — o comportamento é automático e vinculado ao ciclo de vida do modal.
* Não persiste nenhuma preferência em `localStorage` — é um comportamento de sessão/interação, sempre vinculado ao modal estar aberto.

---

## 3. Arquitetura

### 3.1. Estado
```js
let wakeLockSentinel = null;
```

### 3.2. `acquireWakeLock()`
Chamado dentro de `openRecipeModal()`, após o modal ser exibido:
```js
async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return; // navegador sem suporte, sem indicador
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
Chamado dentro de `closeRecipeModal()`:
```js
function releaseWakeLock() {
    if (wakeLockSentinel) {
        wakeLockSentinel.release();
        wakeLockSentinel = null;
    }
    updateWakeLockIndicator();
}
```

### 3.4. Reaquisição automática
Listener único, registrado uma vez (fora de qualquer função de modal), cobrindo o caso em que o SO libera o lock ao ir para segundo plano (troca de app, bloqueio de tela) e o usuário volta com o modal ainda aberto:
```js
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRecipeModalOpen() && !wakeLockSentinel) {
        acquireWakeLock();
    }
});
```
(`isRecipeModalOpen()` é um helper simples que checa se o modal de receita está atualmente visível, ex: verificando a classe/estilo do elemento do modal ou uma variável de estado já existente como `activeRecipeId !== null`.)

### 3.5. `updateWakeLockIndicator()`
Alterna a visibilidade de um pequeno ícone dentro do modal (ex: `#wake-lock-indicator`), com base em `wakeLockSentinel !== null`.

---

## 4. Interface

- Ícone discreto "🔆" posicionado próximo ao título da receita dentro do modal, com `aria-label="Tela ativa durante o preparo"` para acessibilidade.
- Visível **somente** quando `wakeLockSentinel !== null` (wake lock de fato concedido pelo navegador).
- Nenhum outro elemento de UI é adicionado — sem botão, sem configuração, sem mensagens de erro.

---

## 5. Casos de Borda e Plano de Testes

### Casos de borda
- **Fechar o modal com wake lock ativo**: libera corretamente via `releaseWakeLock()`, evitando dreno de bateria após o usuário sair da tela.
- **Troca de aba/bloqueio de tela com modal aberto**: o SO libera o lock automaticamente (evento `release` disparado); ao usuário voltar (`visibilitychange` → `visible`), o lock é readquirido automaticamente e o ícone reaparece.
- **`file://`**: a Wake Lock API não exige necessariamente contexto seguro em todos os navegadores (comportamento pode variar por browser/versão) — deve ser testada nesse protocolo e degradar graciosamente se a requisição falhar.
- **Navegador sem suporte** (ex: Safari mais antigo, alguns navegadores desktop): `'wakeLock' in navigator` é `false`, função retorna imediatamente, nenhum erro no console, nenhum ícone exibido.
- **Requisição rejeitada** (ex: `NotAllowedError` por bateria fraca/economia de energia do sistema): capturado no `catch`, app segue funcionando normalmente sem a proteção.

### Plano de testes (manual, sem automação — projeto não possui suíte de testes)
1. Abrir uma receita no Chrome/Edge desktop ou Android (que suportam Wake Lock) → confirmar que o ícone "🔆" aparece e a tela não apaga sozinha após o tempo normal de bloqueio automático do dispositivo.
2. Fechar o modal → confirmar que o ícone some e o comportamento de bloqueio automático da tela volta ao normal.
3. Com o modal aberto, trocar de aba (ou minimizar/bloquear a tela no celular) e voltar → confirmar que o wake lock é readquirido automaticamente (ícone reaparece).
4. Testar em um navegador/dispositivo sem suporte à API → confirmar que não há erros no console e o app funciona normalmente, apenas sem o ícone.
5. Testar em `file://` diretamente → confirmar o comportamento (com ou sem suporte da API), sem quebrar nenhuma outra funcionalidade do app.

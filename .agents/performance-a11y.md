# Diretrizes de Performance e Acessibilidade (Qualidade Lighthouse 100/100)

## 🎯 Objetivo de Performance e Qualidade
Todas as novas implementações e evoluções de UI/UX devem ser projetadas para manter as pontuações do Lighthouse no padrão de excelência atingido:
- **Performance**: ≥ 95 (FCP ≤ 1.5s, LCP ≤ 1.5s, TBT ≤ 100ms, CLS ≤ 0.05)
- **Acessibilidade (A11y)**: 100
- **Boas Práticas (Best Practices)**: 100
- **SEO**: 100

---

## ⚡ 1. Regras de Performance (Core Web Vitals & Render)

1. **Evitar Trabalhos Excessivos na Main Thread (Reflows & Layout Thrashing)**:
   - Não altere o DOM ou consulte propriedades de layout (`offsetHeight`, `getBoundingClientRect()`) repetidamente dentro de loops ou em cada evento de scroll/input.
   - Use `requestAnimationFrame` ou `debounce` para atualizações contínuas de UI.
   - Prefira alterações de classes ou variáveis CSS customizadas (`var(--...)`) para estados visuais em vez de mutações diretas inline (`element.style.xxx`).

2. **Gerenciamento de Estilos (CSS Vanilla)**:
   - Toda regra CSS deve ser adicionada organizadamente em `estilos.css` utilizando o sistema de tokens em `:root`.
   - Evite injetar blocos `<style>` inline ou estilos dinâmicos via JS quando for possível resolver via classes e variáveis CSS.
   - Utilize a propriedade `contain` ou `content-visibility: auto` em listas extensas de cards (ex: listagem de receitas) para otimizar a fase de renderização do navegador.

3. **Imagens e Assets**:
   - Sempre declare atributos explícitos `width` e `height` (ou mantenha o aspect-ratio reservado via CSS) em elementos `<img>` ou `<svg>` para garantir `CLS` próximo de `0`.
   - Use `loading="lazy"` e `decoding="async"` para imagens abaixo da dobra (*below-the-fold*).

4. **Bundling e Modularização (JS)**:
   - Mantenha a separação em funções puras na camada `src/logic/` e UI em `src/modules/`.
   - Evite importações massivas não utilizadas e dependências pesadas na thread principal.

---

## ♿ 2. Regras de Acessibilidade (A11y)

1. **Rótulos e Nomes Acessíveis**:
   - Todo botão com apenas ícone (ex: botões de curtir, fechar modal, menu) **DEVE** possuir atributo `aria-label` descritivo ou texto interno visivelmente oculto para leitores de tela.
   - Todos os inputs de formulário devem possuir `<label>` vinculado via atributo `for` ou wrapping semântico.

2. **Semântica HTML5 e Estrutura Hn**:
   - Mantenha a hierarquia semântica de cabeçalhos (`<h1>` único por página/modal principal, seguido sequencialmente por `<h2>`, `<h3>`).
   - Use tags semânticas (`<nav>`, `<main>`, `<article>`, `<header>`, `<footer>`, `<aside>`) em vez de estruturas genéricas baseadas apenas em `<div>`.

3. **Contraste de Cores e Foco Visível**:
   - Garanta que todos os elementos interativos tenham indicador visual claro quando focados por teclado (`:focus-visible`).
   - Respeite o contraste mínimo de cores (WCAG AA: 4.5:1 para texto normal, 3:1 para texto grande) em ambos os temas (`light` e `dark`).

---

## 🛡️ 3. Boas Práticas & SEO

1. **Console Limpo**:
   - Nenhum aviso (warning), exceção não capturada ou erro deve ser deixado no console durante a execução normal do aplicativo.
2. **SEO & PWA**:
   - Mantiver metatags essenciais (`viewport`, `description`, `theme-color`, `manifest.json`) em `index.html`.
   - Garantir tags de acessibilidade em recursos multimídia/SVGs (`aria-hidden="true"` quando decorativo).

---

## 🧪 4. Check-list de Validação Pré-Commit

Antes de considerar qualquer nova funcionalidade concluída:
- [ ] Executou `npm run test` (todos os testes passando em 100%).
- [ ] Executou `npm run lint` (zero erros no Oxlint).
- [ ] Validou que novos botões/inputs possuem rótulos acessíveis (`aria-label` / `label`).
- [ ] Verificou que não houve impacto em métricas visuais (sem trepidação de layout / CLS).

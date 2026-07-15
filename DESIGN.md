---
name: Chef Digital
description: Livro de receitas pessoal, planejamento semanal e lista de compras sem anúncios.
colors:
  primary: "#f59e0b"
  primary-hover: "#d97706"
  primary-active: "#b45309"
  primary-light: "#fffbeb"
  primary-light-border: "#fef3c7"
  success: "#16a34a"
  success-hover: "#15803d"
  success-light: "#f0fdf4"
  success-light-border: "#dcfce7"
  danger: "#ef4444"
  danger-hover: "#dc2626"
  danger-light: "#fef2f2"
  neutral-bg: "#fafaf9"
  neutral-card: "#ffffff"
  neutral-light: "#f8fafc"
  neutral-border: "#f1f5f9"
  neutral-border-dark: "#e2e8f0"
  text-main: "#1e293b"
  text-muted: "#64748b"
  text-light: "#94a3b8"
  text-white: "#ffffff"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, Cambria, serif"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-control:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: "10px"
  button-control-hover:
    backgroundColor: "{colors.neutral-light}"
    textColor: "{colors.text-main}"
  button-large-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.md}"
    padding: "14px"
  button-large-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-large-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.md}"
    padding: "14px"
  button-large-success-hover:
    backgroundColor: "{colors.success-hover}"
---

# Design System: Chef Digital

## 1. Overview

**Creative North Star: "O Caderno de Receitas Moderno"**

O Chef Digital combina a sensação clássica e o calor editorial de um livro de receitas físico com a eficiência dinâmica de um utilitário de cozinha digital moderna. O design prioriza a clareza e a legibilidade na bancada de preparo, eliminando qualquer tipo de publicidade, pop-up ou poluição visual comum em blogs culinários comerciais. A interface utiliza tons de âmbar aconchegantes e contrastes suaves sobre superfícies brancas e off-white, criando uma atmosfera que convida à culinária doméstica com prazer e facilidade.

**Key Characteristics:**
- Estilo editorial refinado com tipografia serifada clássica nos títulos principais.
- Usabilidade rápida por meio de gavetas deslizantes (drawers) e modais para tarefas rápidas.
- Densidade visual confortável, adequada para visualização a distância na cozinha.
- Controles interativos amplos com cantos confortavelmente arredondados.

## 2. Colors

A paleta de cores adota uma estratégia de restrição, concentrando os tons mais quentes (âmbar) apenas para pontos estratégicos de interação e indicação ativa.

### Primary
- **Amber Warmth** (#f59e0b): Cor primária representativa. Usada para marcas, destaques ativos, badges de categorias ativas e botões primários.

### Secondary
- **Success Green** (#16a34a): Usado para sinalizar o planejador semanal (Menu Semanal), botões de consolidação e confirmações bem-sucedidas.
- **Danger Red** (#ef4444): Reservado para o botão de receitas favoritas, corações ativos e ações de limpeza ou exclusão.

### Neutral
- **Background Main** (#fafaf9): O fundo principal da página, oferecendo um contraste off-white quente e confortável.
- **Card Background** (#ffffff): O fundo das receitas e blocos principais, destacando-se de forma limpa sobre o fundo geral.
- **Text Main** (#1e293b): Cor principal do texto para garantir legibilidade de ingredientes e etapas de receitas.
- **Text Muted** (#64748b): Usado para legendas secundárias e rótulos discretos.
- **Border Color** (#f1f5f9): Cor padrão de contornos e linhas de separação discretas.

**The Amber Warmth Rule.** O tom primário de âmbar (#f59e0b) é reservado para marca, estados ativos e ações primárias. Ele nunca deve exceder 10% da superfície de qualquer tela para manter sua força de destaque e evitar saturação visual.

## 3. Typography

**Display Font:** Playfair Display (serif-title) (com fallback em Georgia, Cambria, serif)
**Body Font:** Inter (com fallback em -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif)

**Character:** A tipografia contrasta a elegância clássica de uma fonte serifada nos títulos das receitas com a nitidez limpa da fonte sem serifa Inter em todo o texto de suporte, etapas de preparo, quantidades e controles interativos.

### Hierarchy
- **Display** (bold, 36px/40px, 1.2): Usado no título imersivo da receita no modal.
- **Headline** (semibold, 24px, 1.25): Usado em títulos de seções principais ou no cabeçalho.
- **Title** (semibold, 18px, 1.3): Usado nos títulos dos cards de receita.
- **Body** (regular, 14px/16px, 1.5): Usado para a lista de ingredientes, etapas de preparo e descrições.
- **Label** (bold, 11px, 0.05em, uppercase): Usado em etiquetas de categoria, origem de receita e marcações secundárias.

**The Editorial Contrast Rule.** Títulos de receitas usam sempre "Playfair Display" para manter a herança tátil dos livros de culinária físicos. Textos utilitários, ingredientes e modos de preparo utilizam exclusivamente a fonte "Inter" para alta legibilidade.

## 4. Elevation

O Chef Digital utiliza uma elevação plana por padrão, dependendo de contornos discretos e diferenças de contraste cromático para delimitar seções. As sombras são usadas estrategicamente apenas para indicar camadas flutuantes temporárias (gavetas, modais) ou resposta visual ao hover do usuário.

### Shadow Vocabulary
- **Card Hover** (0 4px 6px -1px rgba(0, 0, 0, 0.05)): Aplicado em cards de receita apenas ao passar o cursor, sinalizando interatividade.
- **Overlay Drop** (0 20px 25px -5px rgba(0, 0, 0, 0.08)): Aplicado a modais e gavetas laterais para separá-los do plano de fundo escurecido.

**The State Elevation Rule.** Superfícies estáticas permanecem no nível do plano de fundo com contornos planos de 1px. Sombras e elevações discretas só são ativadas em resposta ao hover ou foco do usuário.

## 5. Components

### Buttons
- **Shape:** Cantos arredondados confortáveis (12px de raio / var(--radius-md)).
- **Primary Large:** Fundo Amber (#f59e0b) com texto branco. Altura generosa com preenchimento interno de 14px de padding vertical.
- **Success Large:** Fundo Success Green (#16a34a) com texto branco. Usado na finalização/consolidação da lista de compras.
- **Control Buttons:** Botões de cabeçalho discretos com ícone SVG, cor Text Muted (#64748b), ganhando fundo cinza-claro (#f8fafc) e sua respectiva cor semântica em hover (verde para planejador, âmbar para compras, vermelho para favoritos).

### Cards
- **Corner Style:** Cantos arredondados de 16px (var(--radius-lg)).
- **Background:** Branco (#ffffff) com borda fina de 1px (#f1f5f9).
- **Behavior:** Ao passar o mouse, desloca-se ligeiramente 2px para cima (transform: translateY(-2px)) e ganha sombra média (`var(--shadow-md)`).

### Inputs
- **Style:** Fundo neutro suave com borda fina, cantos arredondados de 12px (var(--radius-md)).
- **Focus:** Contorno destacado na cor âmbar primária e suave transição de fundo.

## 6. Do's and Don'ts

### Do:
- **Do** usar "Playfair Display" apenas para títulos de receitas em locais de destaque.
- **Do** garantir que todo texto de ingredientes e modos de preparo tenha no mínimo 4.5:1 de contraste (usando Text Main #1e293b).
- **Do** projetar ações primárias (adicionar à lista de compras ou planejador) com dimensões amplas (mínimo de 44px de altura) facilitando o toque na cozinha.

### Don't:
- **Don't** aplicar bordas coloridas espessas (como border-left maior que 1px) como decorações em cards ou alertas.
- **Don't** utilizar textos com gradientes de cores ou fundos com efeitos de vidro embaçado (glassmorphism) de forma puramente decorativa.
- **Don't** adicionar kickers/eyebrows em maiúsculas com espaçamento largo acima de cada título de seção.
- **Don't** permitir que elementos de texto fiquem espremidos ou com tamanhos de fonte minúsculos (menores que 12px) nas visualizações mobile.

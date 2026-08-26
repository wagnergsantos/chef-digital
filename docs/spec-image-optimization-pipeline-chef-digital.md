# Spec: Otimização de imagens + pipeline de upload/compressão — chef-digital

## Contexto

`chef-digital` tem 127 imagens de receita em `public/*.png` (12MB no
total), referenciadas pela coluna `receitas.image` no Supabase como
**nomes de arquivo locais** (`"148.png"`, `"10.png"`, etc. — confirmado
via `receitas.image: "1.png"` no formato usado desde antes da migração
pro Supabase). O `vite.config.js` faz o service worker do PWA pré-cachear
**todas** essas imagens no navegador de todo usuário
(`globPatterns: ['**/*.{js,css,html,png,svg,ico}']`), usadas ou não.

**Hoje não existe upload de imagem de verdade no admin** — o campo
`recipe-image` em `src/AdminApp.jsx` é um `<input type="text">` onde o
usuário digita manualmente o nome de um arquivo que precisa já estar
presente em `public/` (colocado lá por fora, via FTP/commit direto). Não
há Supabase Storage configurado no projeto (confirmado: nenhuma referência
a `supabase.storage` em todo o código).

**Decisão de produto**: as imagens novas devem passar a ser armazenadas no
Supabase Storage, com compressão no cliente antes do upload. As 127
imagens antigas continuam sendo otimizadas *in place* em `public/` — a
decisão de migrá-las pro Storage também é adiada, não é bloqueante.

## Por que em duas fases, não uma coisa só

Estas são duas mudanças de risco muito diferente e **devem ser patches
separados**, mesmo compartilhando esta spec:

- **Fase 1** (otimizar as 127 existentes): não toca banco de dados, não
  toca URLs, não toca admin. É troca de bytes por bytes menores no mesmo
  caminho de arquivo. Baixíssimo risco, reversível com um `git revert`.
- **Fase 2** (pipeline novo): cria infraestrutura nova (bucket, política
  de acesso), constrói UI de upload que não existe hoje, e muda o que a
  coluna `receitas.image` passa a conter pra receitas novas. Risco real —
  bug aqui afeta o fluxo de salvar receita inteiro.

Não prosseguir pra Fase 2 sem a Fase 1 estar validada e no ar.

---

## Fase 1 — Otimizar as 127 imagens existentes (baixo risco)

### Levantamento atual
- 127 arquivos, 12MB total, dimensões de 146×83 até 988×664 (média
  ~250×147px)
- Dois outliers bem acima da média: `148.png` (988×664, 762KB) e `98.png`
  (784×441, 554KB) — provavelmente fotos de celular coladas sem redimensionar
- Mesmo imagens pequenas estão pesadas pro tamanho: `100.png` (315×180)
  pesa 113KB — um PNG bem otimizado nessas dimensões deveria pesar uma
  fração disso
- Renderização real: `RecipeCard.module.css` (`.cardHeaderImage`) usa
  `object-fit: cover` preenchendo o card — não precisa de imagem em
  resolução maior que o card exibido. Confirme a largura máxima real do
  card renderizado (provavelmente não passa de ~400-500px em nenhum
  breakpoint) antes de decidir a dimensão-alvo do redimensionamento.

### O que fazer
1. Redimensionar toda imagem cuja maior dimensão passe de um teto razoável
   (sugestão: 800px de largura máxima, dá margem pra telas retina/2x sem
   desperdiçar em telas normais — confirme contra a largura real do card
   antes de fixar o número)
2. Recomprimir mantendo o mesmo nome de arquivo e extensão `.png`
   (`pngquant`, `oxipng` ou equivalente) — **não renomear, não trocar
   extensão**, já que `receitas.image` referencia o nome exato
3. Depois de otimizar, medir o tamanho total de `public/` de novo e
   reportar a redução

### Validação
- Comparar visualmente uma amostra (os 2 outliers + 3-4 aleatórias) antes
  e depois — perda de qualidade perceptível é motivo pra usar uma
  qualidade de compressão menos agressiva, não é uma race-to-the-bottom
- `npm run build` continua funcionando normalmente (nada de código muda
  nesta fase, só os bytes dos arquivos)
- Conferir que o app carrega essas receitas normalmente depois do build

---

## Fase 2 — Pipeline de upload com Supabase Storage (risco real, faça depois da Fase 1 validada)

### Arquitetura sugerida

Seguindo a mesma separação de camadas do resto do projeto (`api/` pra
chamadas externas, `logic/` pra lógica pura, componente só orquestra):

1. **Bucket no Supabase Storage** (ex.: `recipe-images`), com acesso
   público de leitura (as imagens de receita não são sensíveis)
2. **Compressão no cliente antes do upload** — já existe
   `src/logic/image-compression.js` (`compressImageFile`), criado pra
   comprimir imagens antes de mandar pro import via IA. **Reaproveitar
   essa mesma função aqui**, não duplicar lógica de redimensionamento/
   recompressão de novo
3. **`src/api/admin.js`**: adicionar uma função `uploadRecipeImage(file)`
   que comprime via `compressImageFile`, sobe pro bucket
   (`supabase.storage.from('recipe-images').upload(...)`) com um nome de
   arquivo único (ex.: timestamp + id da receita, ou UUID — não usar o
   nome original do arquivo do usuário), e retorna a URL pública
4. **`src/AdminApp.jsx`**: trocar o `<input type="text">` do campo de
   imagem por um upload de arquivo real (input file ou drag-and-drop),
   mostrando preview e barra/indicador de progresso simples. O valor
   salvo em `formData.image` passa a ser a URL pública retornada pelo
   Storage em vez de um nome de arquivo local
5. Manter compatibilidade com receitas antigas: `receitas.image` vai ter
   uma mistura de `"148.png"` (resolve contra `public/`, imagens da Fase 1)
   e URLs completas do Storage (`https://...supabase.co/storage/...`,
   imagens novas) — o componente que renderiza a imagem (`RecipeCard.jsx`,
   `RecipeModal.jsx`) já usa `src={recipe.image}` direto, então **isso já
   funciona sem mudança**, já que ambos os formatos são strings válidas
   pra atributo `src`. Não precisa de lógica condicional pra isso.

### Fluxo offline
O app já tem fila de sincronização offline (`enfileirarSincronizacao` em
`src/cache/db.js`) pro `salvar_receita`. Upload de imagem **não** deve
tentar entrar nessa fila — se estiver offline, o upload deve falhar
explicitamente com uma mensagem clara ("Você está offline — conecte-se
pra enviar a imagem"), não tentar enfileirar um arquivo binário grande no
IndexedDB. Simplicidade antes de robustez aqui, dado o porte do projeto.

### O que perguntar/decidir antes de implementar
- Nome do bucket e se já existe ou precisa ser criado manualmente no
  painel do Supabase antes do código ser escrito (a criação do bucket em
  si não é algo que dá pra fazer só com o patch — precisa acontecer no
  painel/CLI do Supabase, como qualquer mudança de infra)
- Tamanho máximo de upload aceito (sugestão: recusar arquivos acima de um
  teto generoso tipo 8-10MB *antes* de comprimir, pra não travar o
  navegador tentando processar uma foto de 40MB de celular moderno)

### Validação
- Mesmo processo de sempre: clone limpo → patch → `npm install` →
  `npm run lint` → `npx vitest run` → `npm run build`
- Testar manualmente: upload de uma imagem grande (foto de celular sem
  redimensionar) e confirmar que primeiro comprime no cliente antes de
  subir; testar receita salva com sucesso e imagem aparecendo no card e
  no modal depois

## Fora de escopo (nas duas fases)
- Migrar as 127 imagens antigas pro Storage — decisão adiada, sem
  bloquear nada
- CDN/otimização de entrega (ex.: Supabase Image Transformations) — só
  considerar se a Fase 2 já estiver estável e o custo/benefício fizer
  sentido pro porte do projeto
- Qualquer mudança de design do formulário além do campo de imagem em si

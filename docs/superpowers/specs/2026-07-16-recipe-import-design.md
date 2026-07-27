# Spec: Importação de Receitas via URL com Agente IA (Antigravity)

Este documento define o processo e o design para a importação de novas receitas diretamente a partir de um link da internet para o arquivo local `receitas.js`, usando as capacidades do assistente Antigravity.

## 1. Overview
Em vez de construir uma infraestrutura complexa com servidores locais de API ou proxies de CORS para executar o scraping e a extração no navegador, aproveitamos o próprio assistente IA (Antigravity) que roda no ambiente de desenvolvimento local. O fluxo permite que o usuário apenas forneça um link no chat e o assistente cuide de todo o pipeline de extração, estruturação de dados e gravação direta no arquivo de banco de dados.

## 2. Fluxo de Trabalho do Agente
Quando o usuário colar um link no chat solicitando a adição da receita:
1. **Scraping**: O assistente usa a ferramenta `read_url_content` (ou `search_web` se necessário) para ler o conteúdo da página do link fornecido.
2. **Processamento e Estruturação**: O assistente analisa o conteúdo HTML/Markdown da página e extrai os dados estruturados conforme as regras definidas no topo de `receitas.js`:
   - `id`: O próximo número incremental único (último id do banco + 1).
   - `title`: O título da receita.
   - `category`: Uma ou mais categorias válidas em formato de string ou array (ex: `['almoco', 'bife']`).
   - `source`: A URL de origem.
   - `emoji`: Um emoji adequado e representativo.
   - `image`: `null`.
   - `ingredients`: Array de objetos `{ name, qty, unit }` seguindo estritamente as regras de campos numéricos para `qty` e de texto para `unit`.
   - `steps`: Array de strings para cada passo do modo de preparo.
   - `tips`: Dica adicional (se houver, ou string vazia/null).
3. **Gravação**: O assistente lê a parte final do array de receitas em `receitas.js`, encontra o ponto correto de inserção, gera a substituição e insere a nova receita.
4. **Confirmação**: O assistente avisa que a receita foi importada com sucesso e exibe um resumo da receita importada.

## 3. Benefícios
- **Simplicidade**: Zero dependências de rede complexas, servidores locais ativos ou chaves de API extras no navegador.
- **Robustez**: O Gemini (agente) é excelente para limpar dados bagunçados de páginas web de culinária (normalmente lotadas de anúncios e textos pessoais) e convertê-los na estrutura limpa exigida pelo Chef Digital.
- **Integração Imediata**: Basta atualizar a página `index.html` aberta localmente para ver a nova receita renderizada.

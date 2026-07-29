# -*- coding: utf-8 -*-
"""
Script para substituir nomes de ingredientes diretamente no arquivo de dados 'receitasData'.
Preserva 100% da estrutura JSON/JavaScript (aspas, vírgulas, chaves e colchetes).
"""

import sys
import json
import re

# Dicionário com todas as padronizações de ingredientes
MAPA_SUBSTITUICOES = {
    # Erros de digitação
    "inguiça calabresa fatiada": "linguiça calabresa fatiada",

    # Abobrinha
    "abobrinha cortada em cubos": "abobrinha em cubos",
    "abobrinha em cubos pequenos": "abobrinha em cubos",
    "abobrinha fatiada em meia-lua": "abobrinha em meia-lua",
    "abobrinha pequena em cubos": "abobrinha em cubos",

    # Alho
    "alho em pó (protagonista absoluto)": "alho em pó",
    "dente de alho picado": "alho picado",
    "dentes de alho picado": "alho picado",
    "dente de alho": "dentes de alho",
    "dentes de alho amassados": "alho amassado",
    "cabeças de alho limpas": "cabeças de alho",

    # Brócolis
    "brócolis cortado em buquês": "brócolis em buquês",
    "brócolis cortado pequeno": "brócolis picado",
    "brócolis pequeno cortado": "brócolis picado",

    # Pimentão
    "pimentão (colorido)": "pimentão colorido",
    "pimentão fatiado em tiras": "pimentão em tiras",
    "pimentão fatiado": "pimentão em tiras",
    "pimentão picadinho": "pimentão picado",

    # Batata / Batatas
    "batata em rodelas": "batatas em rodelas",
    "batatas fatiadas em rodelas finas": "batatas em rodelas",
    "batatas fatiadas": "batatas em rodelas",
    "batatas em rodelas (cozidas por 10 min)": "batatas em rodelas cozidas",
    "batatas médias cortadas": "batatas médias picadas",
    "batata": "batatas",

    # Cebola
    "cebola bem picadinha": "cebola picada",
    "cebola pequena picadinha": "cebola picada",
    "cebola grande cortada": "cebola picada",
    "cebola grande fatiada em rodelas": "cebola em rodelas",
    "cebola média fatiada": "cebola em rodelas",
    "cebola fatiada": "cebola em rodelas",
    "cebola em pó (reduzida)": "cebola em pó",
    "cebola pequena": "cebola",
    "cebola média": "cebola",

    # Cenoura
    "cenoura em cubinhos": "cenoura em cubos",
    "cenouras médias cortadas": "cenoura picada",
    "cenoura em rodelas finas": "cenoura em rodelas",

    # Adjetivos e comentários entre parênteses
    "açúcar mascavo (efeito dry rub)": "açúcar mascavo",
    "cacau 100% em pó (toque do chef)": "cacau em pó 100%",
    "cominho em pó (toque do chef)": "cominho em pó",
    "gengibre em pó (toque do chef)": "gengibre em pó",
    "lemon pepper de alta qualidade": "lemon pepper",
    "levedura nutricional (segredo umami)": "levedura nutricional",
    "mostarda em pó (efeito dry rub)": "mostarda em pó",
    "mostarda em pó (toque do chef)": "mostarda em pó",
    "sal refinado de alta qualidade": "sal refinado",
    "pitada de sal": "sal",
    "semente de coentro moída (aroma cítrico herbal)": "semente de coentro moída",
    "tomate em pó (segredo umami)": "tomate em pó",
    "ácido cítrico em pó (toque cítrico vibrante)": "ácido cítrico em pó",
    "manteiga de boa qualidade": "manteiga",
    "manteiga de qualidade": "manteiga",
    "molho de tomate de boa qualidade": "molho de tomate",
    "pimenta-do-reino moída de boa qualidade": "pimenta-do-reino moída",
    "queijo parmesão de boa qualidade ralado": "queijo parmesão ralado",
    "queijo parmesão ralado microfino": "queijo parmesão ralado",

    # Ovos & Ervas
    "ovo fresco": "ovo",
    "ovos frescos": "ovos",
    "salsa picada": "salsinha picada",
    "salsinha fresca picada": "salsinha picada",
    "salsa desidratada bem fina": "salsa desidratada",
    "ramo de alecrim fresco": "ramo de alecrim",
    "folhas frescas de manjericão": "folhas de manjericão fresco",

    # Frango e Milho
    "peito de frango (peito desfiado)": "frango desfiado (peito)",
    "frango (peito desfiado)": "frango desfiado (peito)",
    "frango (peito em cubos)": "peito de frango em cubos",
    "frango (peito em tiras)": "peito de frango em tiras",
    "lata de milho verde (escorrido)": "milho verde em lata (escorrido)",
    "lata de milho verde": "milho verde em lata",
    "latas de milho verde (escorrido)": "milho verde em lata (escorrido)",

    # Tomate
    "tomates maduros picados": "tomate picado",
    "tomate maduro picado": "tomate picado",
    "tomates picados": "tomate picado",
    "tomate cortado em cubos": "tomate em cubos",
    "tomate em cubinhos": "tomate em cubos",
    
    
    # Outros
    "fumaça em pó (pó de fumaça condensada)":"fumaça em pó",
    "gengibre fresco ralado":"gengibre ralado",
    "leite integral":"leite",
    "milho verde em lata (escorrido)":"milho verde em lata",
    "orégano seco":"orégano",
    "ovos":"ovo",
    "páprica doce":"páprica",
    "couve cortada bem fina":"couve fatiada bem fina",
    "cúrcuma (açafrão-da-terra) em pó":"cúrcuma (açafrão-da-terra)",
    "salsinha picada":"salsinha",
    "batatas médias picadas":"batatas médias",
    "carne em tiras (patinho ou acém)":"carne em tiras (patinho, alcatra)",
    "carne moída (patinho ou acém)":"carne moída",
    "carne moída refogada":"carne moída",
    "cebola picada":"cebola",
    "coentro picado":"coentro",
    "couve cortada bem fina":"couve fatiada bem fina",
    "ervilhas frescas":"ervilhas",
    "filés de peito de frango":"frango (filé)",
    "peito de frango em filés":"frango (filé)",
    "filés de peixe de sua escolha":"filés de peixe",
    "filés de tilápia":"filés de peixe (tilápia ou merluza)",
    "macarrão (espaguete ou outro)":"macarrão espaguete",
    "penne":"macarrão (penne)",
}

# Dicionário para desmembrar 1 ingrediente combinado em N ingredientes individuais
MAPA_DESMEMBRAMENTO = {
    "pimenta-do-reino e sal":["pimenta-do-reino","sal"],
    "manjericão, sálvia e alecrim secos":["manjericão secos","sálvia secos","alecrim secos"],
    "sal, pimenta-do-reino e azeite": ["sal", "pimenta-do-reino", "azeite"],
    "azeite, sal, pimenta e cheiro-verde": ["azeite", "sal", "pimenta", "cheiro-verde"],
    "azeite, sal, pimenta e parmesão": ["azeite", "sal", "pimenta", "queijo parmesão ralado"],
    "cebola e alho picado": ["cebola picada", "alho picado"],
    "azeite e suco de limão": ["azeite", "suco de limão"],
    "sal e azeite": ["sal", "azeite"],
    "sal e cheiro-verde": ["sal", "cheiro-verde"],
    "sal e orégano": ["sal", "orégano"],
    "sal e pimenta": ["sal", "pimenta"],
    "sal e pimenta-do-reino": ["sal", "pimenta-do-reino"],
    "sal, noz-moscada e pimenta-do-reino": ["sal", "noz-moscada", "pimenta-do-reino"],
    "sal, noz-moscada, pimenta e salsa": ["sal", "noz-moscada", "pimenta", "salsinha picada"],
    "sal, orégano e pimenta-do-reino": ["sal", "orégano", "pimenta-do-reino"],
    "sal, pimenta e azeite": ["sal", "pimenta", "azeite"],
    "sal, pimenta e cebolinha": ["sal", "pimenta", "cebolinha picada"],
    "sal, pimenta e cheiro-verde": ["sal", "pimenta", "cheiro-verde"],
    "sal, pimenta e cominho": ["sal", "pimenta", "cominho em pó"],
    "sal, pimenta e ervas": ["sal", "pimenta", "ervas frescas"],
    "sal, pimenta e folhas de manjericão": ["sal", "pimenta", "folhas de manjericão fresco"],
    "sal, pimenta e orégano": ["sal", "pimenta", "orégano"],
    "sal, pimenta e páprica defumada": ["sal", "pimenta", "páprica defumada"],
    "sal, pimenta e salsinha": ["sal", "pimenta", "salsinha picada"],
    "sal, pimenta e tomilho": ["sal", "pimenta", "ramo de tomilho fresco"],
    "sal, pimenta, cheiro-verde e azeite": ["sal", "pimenta", "cheiro-verde", "azeite"],
    "sal, pimenta, orégano e cheiro-verde": ["sal", "pimenta", "orégano", "cheiro-verde"],
    "sal, pimenta-do-reino e azeite": ["sal", "pimenta-do-reino", "azeite"],
    "sal, pimenta-do-reino e cheiro-verde": ["sal", "pimenta-do-reino", "cheiro-verde"],
    "sal, pimenta-do-reino e coentro": ["sal", "pimenta-do-reino", "coentro"],
    "sal, pimenta-do-reino e cominho": ["sal", "pimenta-do-reino", "cominho em pó"],
    "sal, pimenta-do-reino e ervas": ["sal", "pimenta-do-reino", "ervas frescas"],
    "sal, pimenta-do-reino e noz-moscada": ["sal", "pimenta-do-reino", "noz-moscada"],
    "sal, pimenta-do-reino e orégano": ["sal", "pimenta-do-reino", "orégano"],
    "sal, pimenta-do-reino e tomilho": ["sal", "pimenta-do-reino", "ramo de tomilho fresco"],
    "coentro e sal": ["coentro", "sal"],
    "cominho e açafrão em pó": ["cominho em pó", "cúrcuma (açafrão-da-terra) em pó"],
    "ervas e azeite": ["ervas frescas", "azeite"],
    "ervas e sal": ["ervas frescas", "sal"],
    "farinha de mandioca e cheiro-verde": ["farinha de mandioca", "cheiro-verde"],
    "gergelim e cebolinha": ["gergelim", "cebolinha picada"],
    "óleo, sal, pimenta e cheiro-verde": ["óleo", "sal", "pimenta", "cheiro-verde"],
    "tomate e cenoura em cubos": ["tomate em cubos", "cenoura em cubos"],
    "presunto e queijo fatiados": ["presunto fatiado", "queijo fatiado"],
    "alho picado, limão, azeite, sal, pimenta e ervas": ["alho picado", "suco de limão", "azeite", "sal", "pimenta", "ervas frescas"],
    "cebola, tomate e pimentão em tiras/rodelas":["cebola", "tomate","pimentão em tiras/rodelas"],
    "cebola, tomate e pimentão vermelho/amarelo em rodelas/tiras":["cebola", "tomate","pimentão vermelho/amarelo em rodelas/tiras"],
    "farinha de mandioca e cheiro-verde":["farinha de mandioca","cheiro-verde"],
    "manjericão, sálvia e alecrim secos":["manjericão, sálvia e alecrim secos"],
    "orégano e coentro secos":["orégano","coentro seco"],
    "orégano, tomilho e alecrim secos":["orégano","tomilho seco","alecrim seco"],
    "páprica doce e açafrão":["páprica","açafrão"],
    "sal e azeite":["sal","azeite"],
    "sal e cheiro-verde":["sal","cheiro-verde"],
    "sal e orégano":["sal","orégano"],
    "sal e pimenta":["sal","pimenta"],
    "sal e pimenta-do-reino":["sal","pimenta-do-reino"],
    "sal, mostarda e batata palha": ["sal", "mostarda", "batata palha"],
    "sal, noz-moscada e pimenta-do-reino": ["sal", "noz-moscada", "pimenta-do-reino"],
    "sal, noz-moscada, pimenta e salsa": ["sal", "noz-moscada", "pimenta", "salsa"],
    "sal, orégano e pimenta-do-reino": ["sal", "orégano", "pimenta-do-reino"],
    "sal, pimenta e azeite": ["sal", "pimenta", "azeite"],
    "sal, pimenta e cebolinha": ["sal", "pimenta", "cebolinha"],
    "sal, pimenta e cheiro-verde": ["sal", "pimenta", "cheiro-verde"],
    "sal, pimenta e cominho": ["sal", "pimenta", "cominho"],
    "sal, pimenta e ervas": ["sal", "pimenta", "ervas"],
    "sal, pimenta e folhas de manjericão": ["sal", "pimenta", "folhas de manjericão"],
    "sal, pimenta e orégano": ["sal", "pimenta", "orégano"],
    "sal, pimenta e páprica defumada": ["sal", "pimenta", "páprica defumada"],
    "sal, pimenta e salsinha": ["sal", "pimenta", "salsinha"],
    "sal, pimenta e tomilho": ["sal", "pimenta", "tomilho"],
    "sal, pimenta, cheiro-verde e azeite": ["sal", "pimenta", "cheiro-verde", "azeite"],
    "sal, pimenta, orégano e cheiro-verde": ["sal", "pimenta", "orégano", "cheiro-verde"],
    "sal, pimenta-do-reino e azeite": ["sal", "pimenta-do-reino", "azeite"],
    "sal, pimenta-do-reino e cheiro-verde": ["sal", "pimenta-do-reino", "cheiro-verde"],
    "sal, pimenta-do-reino e coentro": ["sal", "pimenta-do-reino", "coentro"],
    "sal, pimenta-do-reino e cominho": ["sal", "pimenta-do-reino", "cominho"],
    "sal, pimenta-do-reino e ervas": ["sal", "pimenta-do-reino", "ervas"],
    "sal, pimenta-do-reino e noz-moscada": ["sal", "pimenta-do-reino", "noz-moscada"],
    "sal, pimenta-do-reino e orégano": ["sal", "pimenta-do-reino", "orégano"],
    "sal, pimenta-do-reino e tomilho": ["sal", "pimenta-do-reino", "tomilho"],
    "salsinha, coentro e hortelã picados": ["salsinha picada", "coentro picado", "hortelã picada"],
    "suco de laranja e sal": ["suco de laranja", "sal"],
    "tomate, cebola-roxa e salsinha picados": ["tomate picado", "cebola-roxa picada", "salsinha picada"],
    "vinagre de vinho tinto e limão": ["vinagre de vinho tinto", "limão"],
    "óleo, sal, pimenta e cheiro-verde": ["óleo", "sal", "pimenta", "cheiro-verde"],
    "tomate e cenoura em cubos":["tomate em cubos","cenoura em cubos"]
}

def padronizar_nome_ingrediente(nome: str) -> str:
    """Substitui o nome do ingrediente se estiver no dicionário ou aplica regras básicas."""
    if not nome:
        return nome
    
    nome_limpo = nome.strip()
    
    # Busca no mapa direto (ignorando maiúsculas/minúsculas)
    if nome_limpo.lower() in MAPA_SUBSTITUICOES:
        return MAPA_SUBSTITUICOES[nome_limpo.lower()]
    
    # Remove marcas poéticas genéricas se houver
    nome_limpo = re.sub(r'\s*\((toque do chef|segredo umami|efeito dry rub)\)', '', nome_limpo, flags=re.IGNORECASE)
    
    return nome_limpo.strip()

def desmembrar_ou_padronizar(ing: dict) -> list:
    """Retorna uma lista com 1 ou mais dicionários de ingredientes."""
    nome = ing.get("name", "").strip()
    nome_lower = nome.lower()
    
    if nome_lower in MAPA_DESMEMBRAMENTO:
        itens = MAPA_DESMEMBRAMENTO[nome_lower]
        novos = []
        for item in itens:
            nome_padrao = MAPA_SUBSTITUICOES.get(item.lower(), item)
            novos.append({
                "name": nome_padrao,
                "qty": ing.get("qty"),
                "unit": ing.get("unit")
            })
        return novos
    else:
        nome_padrao = padronizar_nome_ingrediente(nome)
        copia = dict(ing)
        copia["name"] = nome_padrao
        return [copia]

def limpar_json_js(conteudo_js: str) -> tuple:
    """Isola o bloco de objeto/array JS e remove comentários e vírgulas sobressalentes."""
    primeira_chave = conteudo_js.find('{')
    ultima_chave = conteudo_js.rfind('}')
    
    if primeira_chave == -1 or ultima_chave == -1:
        raise ValueError("Nenhum bloco de objeto JS/JSON encontrado no arquivo.")
        
    prefixo = conteudo_js[:primeira_chave]
    sufixo = conteudo_js[ultima_chave + 1:]
    json_str = conteudo_js[primeira_chave:ultima_chave + 1]
    
    # Remove comentários JS
    json_limpo = re.sub(r'//.*?\n', '\n', json_str)
    json_limpo = re.sub(r'/\*.*?\*/', '', json_limpo, flags=re.DOTALL)
    # Remove vírgulas extras antes de } ou ]
    json_limpo = re.sub(r',\s*([}\]])', r'\1', json_limpo)
    
    return prefixo, json_limpo, sufixo

def atualizar_arquivo_receitas(caminho_entrada: str, caminho_saida: str):
    """Lê o arquivo .js, processa a estrutura JSON e desmembra/substitui ingredientes."""
    try:
        with open(caminho_entrada, 'r', encoding='utf-8') as f:
            for _ in range(87):  # pula 87 linhas
                next(f, None)
            conteudo = f.read()
    except Exception as e:
        print(f"Erro ao ler o arquivo '{caminho_entrada}': {e}")
        return

    try:
        prefixo, json_str, sufixo = limpar_json_js(conteudo)
        dados = json.loads(json_str)
        
        total_desmembrados = 0
        total_substituidos = 0
        
        receitas = dados.get("recipes", dados.get("receitas", []))
        if isinstance(dados, list):
            receitas = dados
            
        for receita in receitas:
            ingredientes = receita.get("ingredients", receita.get("ingredientes", []))
            novos_ingredientes = []
            for ing in ingredientes:
                nome_orig = ing.get("name", "")
                resultado = desmembrar_ou_padronizar(ing)
                if len(resultado) > 1:
                    total_desmembrados += 1
                elif resultado[0].get("name") != nome_orig:
                    total_substituidos += 1
                novos_ingredientes.extend(resultado)
            
            if "ingredients" in receita:
                receita["ingredients"] = novos_ingredientes
            elif "ingredientes" in receita:
                receita["ingredientes"] = novos_ingredientes

        conteudo_final = prefixo + json.dumps(dados, ensure_ascii=False, indent=4) + sufixo
        
        with open(caminho_saida, 'w', encoding='utf-8') as f:
            f.write(conteudo_final)
            
        print(f"Sucesso! {total_substituidos} substituições diretas e {total_desmembrados} desmembramentos realizados.")
        print(f"Arquivo salvo em: {caminho_saida}")

    except Exception as e:
        print(f"Erro ao processar a estrutura de receitas: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arq_in = sys.argv[1]
        arq_out = sys.argv[2] if len(sys.argv) > 2 else "receitasData_atualizado.js"
        atualizar_arquivo_receitas(arq_in, arq_out)
    else:
        print("Uso: python substituir_receitas.py receitasData.js [receitasData_atualizado.js]")
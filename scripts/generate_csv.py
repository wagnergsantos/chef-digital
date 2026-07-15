import os
import json
import csv

# Resolve paths dynamically relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

def main():
    js_file_path = os.path.join(PROJECT_ROOT, 'receitas.js')
    csv_file_path = os.path.join(SCRIPT_DIR, 'receitas.csv')

    if not os.path.exists(js_file_path):
        print(f"Erro: {js_file_path} não encontrado.")
        return

    print(f"Lendo receitas de {js_file_path}...")
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrai o objeto JSON
    decl_token = 'const receitasData ='
    start_idx = content.find(decl_token)
    if start_idx == -1:
        print("Erro: Não foi possível encontrar a declaração 'const receitasData ='.")
        return

    start_brace = content.find('{', start_idx)
    end_brace = content.rfind('}')
    
    json_str = content[start_brace : end_brace + 1]

    try:
        data = json.loads(json_str)
    except Exception as e:
        print(f"Erro ao parsear o JSON: {e}")
        return

    categories_map = data.get("categories", {})
    recipes = data.get("recipes", [])
    
    rows = []
    for recipe in recipes:
        recipe_id = recipe.get("id")
        title = recipe.get("title")
        
        # Pega as chaves (IDs) das categorias diretamente
        cats = recipe.get("category", [])
        if isinstance(cats, str):
            cats = [cats]
        cat_str = ", ".join(cats)
        
        # Pega apenas o nome de cada ingrediente (sem quantidade nem unidade)
        ingredients_list = recipe.get("ingredients", [])
        ingredient_names = [ing.get("name", "").strip() for ing in ingredients_list if ing.get("name")]
        ing_str = ", ".join(ingredient_names)
        
        rows.append({
            "id": recipe_id,
            "titulo": title,
            "ingrediente": ing_str,
            "categorias": cat_str
        })

    print(f"Escrevendo {len(rows)} receitas em {csv_file_path}...")
    
    # Grava o CSV com delimitador ; e envolvendo todos os campos em aspas duplas (QUOTE_ALL)
    with open(csv_file_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, delimiter=';', quoting=csv.QUOTE_ALL)
        # Escreve o cabeçalho
        writer.writerow(["id", "titulo", "ingrediente", "categorias"])
        
        for row in rows:
            writer.writerow([row["id"], row["titulo"], row["ingrediente"], row["categorias"]])

    print("Arquivo receitas.csv gerado com sucesso com aspas e sem quantidades na pasta scripts!")

if __name__ == '__main__':
    main()

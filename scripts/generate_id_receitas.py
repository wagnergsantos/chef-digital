import os
import json

# Resolve paths dynamically relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

def main():
    js_file_path = os.path.join(PROJECT_ROOT, 'receitas.js')
    txt_file_path = os.path.join(SCRIPT_DIR, 'id_receitas.txt')
    
    if not os.path.exists(js_file_path):
        print(f"Error: {js_file_path} not found.")
        return

    print(f"Lendo receitas de {js_file_path}...")
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrai o objeto JSON receitasData do arquivo JavaScript
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

    recipes = data.get("recipes", [])
    lines = []
    
    # Gera a lista no formato: ID - Nome da Receita
    for recipe in recipes:
        recipe_id = recipe.get("id")
        title = recipe.get("title")
        if recipe_id is not None and title:
            lines.append(f"{recipe_id} - {title}\n")

    print(f"Escrevendo {len(lines)} receitas em {txt_file_path}...")
    with open(txt_file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Arquivo id_receitas.txt gerado com sucesso!")

if __name__ == '__main__':
    main()

import os
import json

# Resolve paths dynamically relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

def main():
    js_file_path = os.path.join(PROJECT_ROOT, 'receitas.js')

    if not os.path.exists(js_file_path):
        print(f"Error: {js_file_path} not found.")
        return

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
    ids = [recipe.get("id") for recipe in recipes if isinstance(recipe.get("id"), int)]

    if not ids:
        print("Nenhum id encontrado. Próximo id: 1")
        return

    maior_id = max(ids)
    print(f"Total de receitas: {len(recipes)}")
    print(f"Maior id atual: {maior_id}")
    print(f"Próximo id: {maior_id + 1}")

if __name__ == '__main__':
    main()

import os
import json
import re

# Resolve paths dynamically relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

def main():
    txt_file_path = os.path.join(SCRIPT_DIR, 'id_receitas.txt')
    js_file_path = os.path.join(PROJECT_ROOT, 'receitas.js')

    if not os.path.exists(txt_file_path):
        print(f"Erro: {txt_file_path} não encontrado.")
        return
    if not os.path.exists(js_file_path):
        print(f"Erro: {js_file_path} não encontrado.")
        return

    # 1. Ler os IDs do arquivo TXT
    ids_to_remove = set()
    with open(txt_file_path, 'r', encoding='utf-8') as f:
        for line in f:
            stripped = line.strip()
            if not stripped:
                continue
            match = re.match(r'^(\d+)\s*-\s*(.*)$', stripped)
            if match:
                ids_to_remove.add(int(match.group(1)))

    if not ids_to_remove:
        print("Nenhum ID encontrado em id_receitas.txt para remover.")
        return

    print(f"IDs a serem removidos de {js_file_path}: {sorted(list(ids_to_remove))}")

    # 2. Ler receitas.js
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 3. Extrair a parte JSON do arquivo JS
    decl_token = 'const receitasData ='
    start_idx = content.find(decl_token)
    if start_idx == -1:
        print("Erro: Não foi possível encontrar a declaração 'const receitasData ='.")
        return

    header = content[:start_idx] + decl_token + ' '
    
    start_brace = content.find('{', start_idx)
    end_brace = content.rfind('}')
    
    json_str = content[start_brace : end_brace + 1]

    # 4. Parsear o JSON
    try:
        data = json.loads(json_str)
    except Exception as e:
        print(f"Erro ao parsear o JSON: {e}")
        return

    recipes = data.get("recipes", [])
    initial_count = len(recipes)
    
    # Filtrar removendo os IDs listados no TXT
    new_recipes = [r for r in recipes if r.get("id") not in ids_to_remove]
    removed_count = initial_count - len(new_recipes)
    
    data["recipes"] = new_recipes

    # 5. Serializar de volta com formatação UTF-8
    new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
    new_content = header + new_json_str + ";\n"

    # 6. Salvar em receitas.js
    with open(js_file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 7. Esvaziar o id_receitas.txt já que os pendentes foram removidos
    with open(txt_file_path, 'w', encoding='utf-8') as f:
        f.write("")

    print(f"Sucesso! {removed_count} receita(s) removida(s) de {js_file_path}.")
    print(f"O arquivo {txt_file_path} foi limpo.")

if __name__ == '__main__':
    main()

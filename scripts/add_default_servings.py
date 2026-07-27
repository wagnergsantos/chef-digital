import os
import json

def backfill(data):
    recipes = data.get("recipes", [])
    for recipe in recipes:
        if "servings" not in recipe or recipe["servings"] is None:
            cats = recipe.get("category", [])
            if isinstance(cats, str):
                cats = [cats]
            
            is_tempero = any("temperos" in cat.lower() for cat in cats)
            if is_tempero:
                recipe["servings"] = None
            else:
                recipe["servings"] = 4
    return data

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    js_file_path = os.path.join(project_root, 'receitas.js')
    
    if not os.path.exists(js_file_path):
        print(f"Erro: {js_file_path} não encontrado.")
        return
        
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    decl_token = 'const receitasData ='
    start_idx = content.find(decl_token)
    if start_idx == -1:
        print("Erro: Não foi possível encontrar a declaração 'const receitasData ='.")
        return
        
    start_brace = content.find('{', start_idx)
    end_brace = content.rfind('}')
    
    json_str = content[start_brace : end_brace + 1]
    data = json.loads(json_str)
    
    updated_data = backfill(data)
    
    new_json_str = json.dumps(updated_data, indent=4, ensure_ascii=False)
    new_content = content[:start_brace] + new_json_str + content[end_brace+1:]
    
    with open(js_file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Backfill finalizado com sucesso!")

if __name__ == '__main__':
    main()

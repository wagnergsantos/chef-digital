import os
import json
import re

# Resolve paths dynamically relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

def update_txt_file(txt_file_path):
    if not os.path.exists(txt_file_path):
        print(f"Warning: {txt_file_path} not found. Skipping text file update.")
        return []

    with open(txt_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    removed_ids = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            new_lines.append(line)  # Keep empty lines
            continue
        
        # Match lines starting with a number followed by '-' (e.g., "1 - Frango com Arroz")
        match = re.match(r'^(\d+)\s*-\s*(.*)$', stripped)
        if match:
            recipe_id = match.group(1)
            img_filename = f"{recipe_id}.png"
            img_path = os.path.join(PROJECT_ROOT, img_filename)
            if os.path.exists(img_path):
                # Image exists, so we resolve it and remove it from the list
                removed_ids.append(int(recipe_id))
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    # Write the remaining lines back
    with open(txt_file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    return removed_ids

def main():
    # 1. Update id_receitas.txt first
    txt_file = os.path.join(SCRIPT_DIR, 'id_receitas.txt')
    removed_ids = update_txt_file(txt_file)

    # 2. Read receitas.js
    js_file_path = os.path.join(PROJECT_ROOT, 'receitas.js')
    if not os.path.exists(js_file_path):
        print(f"Error: {js_file_path} not found.")
        return

    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 3. Extract header and JSON parts
    decl_token = 'const receitasData ='
    start_idx = content.find(decl_token)
    if start_idx == -1:
        print("Error: Could not find 'const receitasData =' declaration.")
        return

    header = content[:start_idx] + decl_token + ' '
    
    start_brace = content.find('{', start_idx)
    end_brace = content.rfind('}')
    
    json_str = content[start_brace : end_brace + 1]

    # 4. Parse JSON
    try:
        data = json.loads(json_str)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return

    # 5. Scan for images and update
    recipes = data.get("recipes", [])
    updated_count = 0
    added_images = []
    removed_images = []
    
    for recipe in recipes:
        recipe_id = recipe.get("id")
        if recipe_id is None:
            continue
        
        # Check if {recipe_id}.png exists
        img_filename = f"{recipe_id}.png"
        img_path = os.path.join(PROJECT_ROOT, img_filename)
        old_image = recipe.get("image")
        
        if os.path.exists(img_path):
            recipe["image"] = img_filename
            if old_image != img_filename:
                updated_count += 1
                added_images.append((recipe_id, img_filename))
        else:
            recipe["image"] = None
            if old_image is not None:
                updated_count += 1
                removed_images.append((recipe_id, old_image))

    # 6. Serialize back preserving UTF-8 formatting
    new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
    
    # Assemble the final content
    new_content = header + new_json_str + ";\n"

    # 7. Write back to receitas.js
    with open(js_file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Update completed successfully!")
    print(f"Updated images in JS: {updated_count} change(s)")
    if removed_ids:
        print(f"Removed resolved recipe IDs from txt: {sorted(removed_ids)}")
    else:
        print("No IDs were removed from the text file.")

if __name__ == '__main__':
    main()

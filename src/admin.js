import { supabase } from './api/supabase.js';
import { enfileirarSincronizacao } from './cache/db.js';
import { validateRecipePayloadData, buildRecipePayload } from './logic/admin-parser.js';

let session = null;

// DOM Elements
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

const categoriesContainer = document.getElementById('categories-container');
const ingredientsList = document.getElementById('ingredients-list');
const stepsList = document.getElementById('steps-list');
const btnAddIngredient = document.getElementById('btn-add-ingredient');
const btnAddStep = document.getElementById('btn-add-step');
const btnSave = document.getElementById('btn-save');

// State
let ingredients = [];
let steps = [];
let recipeTags = [];
let editingRecipeId = null;
let allExistingTags = [];
let allRecipes = [];

// Init
async function init() {
    setupAuthListeners();
    setupEventListeners();
    await checkSession();
}

// Auth
function setupAuthListeners() {
    supabase.auth.onAuthStateChange((_event, _session) => {
        session = _session;
        updateUI();
        if (session) {
            loadCategories();
            loadRecipes();
            loadExistingTags();
            if (ingredients.length === 0) addIngredient();
            if (steps.length === 0) addStep();
        }
    });
}

async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error('Erro ao verificar sessão:', error);
    session = data ? data.session : null;
    updateUI();
}

function updateUI() {
    if (session) {
        loginContainer.classList.add('hidden');
        adminPanel.classList.remove('hidden');
    } else {
        loginContainer.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
}

async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = 'Preencha todos os campos.';
        errorEl.style.display = 'block';
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        errorEl.textContent = 'Erro ao fazer login: ' + error.message;
        errorEl.style.display = 'block';
    }
    
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
}

async function logout() {
    await supabase.auth.signOut();
}

// Load Categories
async function loadCategories() {
    const { data, error } = await supabase.from('categorias').select('*').order('sort_order');
    if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
    }

    categoriesContainer.innerHTML = '';
    data.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'category-checkbox-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'recipe-category';
        radio.value = cat.id;
        radio.dataset.key = cat.key;
        radio.className = 'category-checkbox';

        label.appendChild(radio);
        label.appendChild(document.createTextNode(' ' + cat.label));
        categoriesContainer.appendChild(label);
    });
}

// Load Recipes for Edit Selector (combobox)
async function loadRecipes() {
    const { data, error } = await supabase
        .from('receitas')
        .select('id, title, emoji')
        .order('title');

    if (error) {
        console.error('Erro ao carregar lista de receitas:', error);
        return;
    }

    allRecipes = data || [];
    setupRecipeSearch();
}

function setupRecipeSearch() {
    const searchInput = document.getElementById('recipe-search');
    const hiddenInput = document.getElementById('recipe-select');
    const dropdown = document.getElementById('recipe-dropdown');
    if (!searchInput || !dropdown) return;

    let highlightedIdx = -1;

    function renderDropdown(query) {
        highlightedIdx = -1;
        dropdown.innerHTML = '';

        const q = query.trim().toLowerCase();
        const matches = q
            ? allRecipes.filter(r => r.title.toLowerCase().includes(q)).slice(0, 10)
            : allRecipes.slice(0, 10);

        if (matches.length === 0) {
            dropdown.classList.remove('visible');
            searchInput.setAttribute('aria-expanded', 'false');
            return;
        }

        matches.forEach((r, idx) => {
            const item = document.createElement('div');
            item.className = 'admin-recipe-dropdown-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.dataset.id = r.id;
            item.dataset.idx = idx;

            const emoji = document.createElement('span');
            emoji.className = 'admin-recipe-dropdown-emoji';
            emoji.textContent = r.emoji || '\uD83C\uDF72';

            const name = document.createElement('span');
            name.textContent = r.title;

            item.appendChild(emoji);
            item.appendChild(name);

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                selectRecipe(r);
            });

            dropdown.appendChild(item);
        });

        dropdown.classList.add('visible');
        searchInput.setAttribute('aria-expanded', 'true');
    }

    function selectRecipe(r) {
        searchInput.value = `${r.emoji || '\uD83C\uDF72'} ${r.title}`;
        hiddenInput.value = r.id;
        dropdown.innerHTML = '';
        dropdown.classList.remove('visible');
        searchInput.setAttribute('aria-expanded', 'false');
        highlightedIdx = -1;
    }

    function updateHighlight(items) {
        items.forEach((el, i) => {
            el.classList.toggle('highlighted', i === highlightedIdx);
            el.setAttribute('aria-selected', i === highlightedIdx ? 'true' : 'false');
        });
    }

    searchInput.addEventListener('input', () => {
        hiddenInput.value = ''; // limpa seleção ao digitar
        renderDropdown(searchInput.value);
    });

    searchInput.addEventListener('focus', () => {
        if (!hiddenInput.value) renderDropdown(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.admin-recipe-dropdown-item');
        if (!dropdown.classList.contains('visible') || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIdx = Math.max(highlightedIdx - 1, -1);
            updateHighlight(items);
        } else if (e.key === 'Enter' && highlightedIdx >= 0) {
            e.preventDefault();
            const id = parseInt(items[highlightedIdx].dataset.id, 10);
            const r = allRecipes.find(r => r.id === id);
            if (r) selectRecipe(r);
        } else if (e.key === 'Escape') {
            dropdown.innerHTML = '';
            dropdown.classList.remove('visible');
            searchInput.setAttribute('aria-expanded', 'false');
            highlightedIdx = -1;
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            dropdown.innerHTML = '';
            dropdown.classList.remove('visible');
            searchInput.setAttribute('aria-expanded', 'false');
            highlightedIdx = -1;
        }, 150);
    });
}

// Load full recipe data and populate form for editing
async function loadRecipeForEdit(id) {
    if (!id) return;

    const btnLoad = document.getElementById('btn-load-recipe');
    if (btnLoad) { btnLoad.disabled = true; btnLoad.textContent = 'Carregando...'; }

    try {
        // Buscar receita principal
        const { data: recipe, error: recipeErr } = await supabase
            .from('receitas')
            .select('*, categorias(id, key, label)')
            .eq('id', id)
            .single();
        if (recipeErr) throw recipeErr;

        // Buscar ingredientes
        const { data: ings, error: ingsErr } = await supabase
            .from('ingredientes')
            .select('*')
            .eq('receita_id', id)
            .order('ordem');
        if (ingsErr) throw ingsErr;

        // Buscar passos
        const { data: stepsData, error: stepsErr } = await supabase
            .from('passos')
            .select('*')
            .eq('receita_id', id)
            .order('ordem');
        if (stepsErr) throw stepsErr;

        // Buscar tags via receita_tags → tags
        const { data: tagsData, error: tagsErr } = await supabase
            .from('receita_tags')
            .select('tags(label)')
            .eq('receita_id', id);
        if (tagsErr) throw tagsErr;

        const tagLabels = (tagsData || []).map(t => t.tags?.label).filter(Boolean);

        // Montar objeto compatível com populateFormWithRecipe
        const recipeObj = {
            title: recipe.title,
            emoji: recipe.emoji,
            image: recipe.image,
            tips: recipe.tips,
            servings: recipe.servings,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            source_url: recipe.source_url,
            author: recipe.author,
            category: recipe.categorias?.key || '',
            tags: tagLabels,
            ingredients: (ings || []).map(i => ({ name: i.name, qty: i.qty, unit: i.unit })),
            steps: (stepsData || []).map(s => ({ step_text: s.step_text }))
        };

        populateFormWithRecipe(recipeObj);
        enterEditMode(id, recipe.title);
    } catch (err) {
        console.error('Erro ao carregar receita para edição:', err);
        alert('Erro ao carregar receita: ' + err.message);
    } finally {
        if (btnLoad) { btnLoad.disabled = false; btnLoad.textContent = 'Carregar'; }
    }
}

function enterEditMode(id, title) {
    editingRecipeId = id;
    const banner = document.getElementById('edit-mode-banner');
    const bannerTitle = document.getElementById('edit-mode-title');
    const btnSaveEl = document.getElementById('btn-save');
    if (banner) banner.style.display = 'flex';
    if (bannerTitle) bannerTitle.textContent = `Editando: "${title}"`;
    if (btnSaveEl) {
        btnSaveEl.textContent = 'Salvar Alterações';
        btnSaveEl.classList.remove('admin-btn-success');
        btnSaveEl.classList.add('admin-btn-success-edit');
        btnSaveEl.setAttribute('aria-label', 'Salvar alterações da receita');
    }
    // Scroll suave até o form
    document.getElementById('recipe-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exitEditMode() {
    editingRecipeId = null;
    const banner = document.getElementById('edit-mode-banner');
    const btnSaveEl = document.getElementById('btn-save');
    const searchInput = document.getElementById('recipe-search');
    const hiddenInput = document.getElementById('recipe-select');
    if (banner) banner.style.display = 'none';
    if (btnSaveEl) {
        btnSaveEl.textContent = 'Publicar Receita';
        btnSaveEl.classList.remove('admin-btn-success-edit');
        btnSaveEl.classList.add('admin-btn-success');
        btnSaveEl.setAttribute('aria-label', 'Salvar receita');
    }
    if (searchInput) searchInput.value = '';
    if (hiddenInput) hiddenInput.value = '';
}

async function deleteRecipe() {
    const hiddenInput = document.getElementById('recipe-select');
    const searchInput = document.getElementById('recipe-search');
    const id = hiddenInput ? parseInt(hiddenInput.value, 10) : null;

    if (!id) {
        alert('Selecione uma receita para excluir.');
        return;
    }

    const recipeName = searchInput?.value || `ID ${id}`;
    const confirmed = confirm(`Tem certeza que deseja excluir "${recipeName.replace(/^\S+\s/, '')}"?\n\nEssa ação é irreversível.`);
    if (!confirmed) return;

    const btnDelete = document.getElementById('btn-delete-recipe');
    if (btnDelete) { btnDelete.disabled = true; btnDelete.textContent = 'Excluindo...'; }

    try {
        // RPC atômica — deleta receita_tags, ingredientes, passos e receitas em uma transação
        const { error } = await supabase.rpc('excluir_receita', { p_id: id });
        if (error) throw error;

        // Se estava editando essa receita, limpar o form
        if (editingRecipeId === id) {
            resetForm(); // já chama exitEditMode internamente
        } else {
            exitEditMode();
        }

        // Atualizar lista
        allRecipes = allRecipes.filter(r => r.id !== id);
        if (searchInput) searchInput.value = '';
        if (hiddenInput) hiddenInput.value = '';

        alert('Receita excluída com sucesso.');
    } catch (err) {
        console.error('Erro ao excluir receita:', err);
        alert('Erro ao excluir: ' + err.message);
    } finally {
        if (btnDelete) { btnDelete.disabled = false; btnDelete.textContent = 'Excluir'; }
    }
}

// Dynamic Tags UI
function renderTagChips() {
    const container = document.getElementById('tags-chips-container');
    if (!container) return;
    container.innerHTML = '';

    if (recipeTags.length === 0) {
        const emptyHint = document.createElement('span');
        emptyHint.className = 'text-sm text-muted';
        emptyHint.style.color = 'var(--text-muted)';
        emptyHint.textContent = 'Nenhuma tag adicionada ainda.';
        container.appendChild(emptyHint);
        return;
    }

    recipeTags.forEach((tag, index) => {
        const chip = document.createElement('span');
        chip.className = 'admin-tag-chip';
        chip.textContent = tag;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'admin-tag-chip-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remover tag';
        removeBtn.onclick = () => {
            recipeTags.splice(index, 1);
            renderTagChips();
        };

        chip.appendChild(removeBtn);
        container.appendChild(chip);
    });
}

function addTagFromInput() {
    const input = document.getElementById('tag-input');
    if (!input) return;
    const value = input.value.trim();
    if (value && !recipeTags.includes(value)) {
        recipeTags.push(value);
        input.value = '';
        renderTagChips();
    }
}

// Event Listeners
function setupEventListeners() {
    btnLogin.addEventListener('click', login);
    btnLogout.addEventListener('click', logout);
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    btnAddIngredient.addEventListener('click', () => addIngredient());
    btnAddStep.addEventListener('click', () => addStep());
    btnSave.addEventListener('click', saveRecipe);

    const btnAddTag = document.getElementById('btn-add-tag');
    const tagInput = document.getElementById('tag-input');
    if (btnAddTag) {
        btnAddTag.addEventListener('click', addTagFromInput);
    }
    if (tagInput) {
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTagFromInput();
            }
        });
        setupTagAutocomplete(tagInput);
    }

    const btnImport = document.getElementById('btn-import-gemini');
    if (btnImport) {
        btnImport.addEventListener('click', handleAIImport);
    }

    // Edit mode: load recipe
    const btnLoadRecipe = document.getElementById('btn-load-recipe');
    if (btnLoadRecipe) {
        btnLoadRecipe.addEventListener('click', () => {
            const hiddenInput = document.getElementById('recipe-select');
            const id = hiddenInput ? parseInt(hiddenInput.value, 10) : null;
            if (id) loadRecipeForEdit(id);
        });
    }

    // Edit mode: delete recipe
    const btnDeleteRecipe = document.getElementById('btn-delete-recipe');
    if (btnDeleteRecipe) {
        btnDeleteRecipe.addEventListener('click', deleteRecipe);
    }

    // Edit mode: new recipe (exit edit)
    const btnNewRecipe = document.getElementById('btn-new-recipe');
    if (btnNewRecipe) {
        btnNewRecipe.addEventListener('click', () => {
            exitEditMode();
            resetForm();
        });
    }

    // Duplo clique no input de busca = carregar receita selecionada
    const recipeSearch = document.getElementById('recipe-search');
    if (recipeSearch) {
        recipeSearch.addEventListener('dblclick', () => {
            const hiddenInput = document.getElementById('recipe-select');
            const id = hiddenInput ? parseInt(hiddenInput.value, 10) : null;
            if (id) loadRecipeForEdit(id);
        });
    }
}

async function handleAIImport() {
    const textarea = document.getElementById('gemini-json-input');
    const statusBox = document.getElementById('import-status');
    const btnImport = document.getElementById('btn-import-gemini');
    const rawText = textarea ? textarea.value.trim() : '';

    if (!rawText) {
        if (statusBox) {
            statusBox.textContent = 'Por favor, insira o texto ou receita a ser processada.';
            statusBox.style.display = 'block';
        }
        return;
    }

    if (statusBox) statusBox.style.display = 'none';
    btnImport.disabled = true;
    btnImport.textContent = '⏳ Processando com IA...';

    try {
        // Se o usuário colou diretamente um JSON pré-gerado, faz o parse local seguro
        if (rawText.startsWith('{') && rawText.endsWith('}')) {
            try {
                const parsed = JSON.parse(rawText);
                populateFormWithRecipe(parsed);
                textarea.value = '';
                btnImport.disabled = false;
                btnImport.textContent = '🪄 Processar e Preencher com IA';
                return;
            } catch (jsonErr) {
                throw new Error('O texto colado parece um JSON, mas contém erros de formatação. Verifique a estrutura.');
            }
        }

        // Caso contrário, invoca a Edge Function via Supabase
        const { data, error } = await supabase.functions.invoke('parse-recipe', {
            body: { text: rawText }
        });

        if (error) {
            let detail = error.message;
            if (error.context && typeof error.context.text === 'function') {
                try {
                    const rawErrorResponse = await error.context.text();
                    try {
                        const errJson = JSON.parse(rawErrorResponse);
                        if (errJson && (errJson.error || errJson.message)) {
                            detail = errJson.error || errJson.message;
                        }
                    } catch (_) {
                        if (rawErrorResponse) detail = rawErrorResponse;
                    }
                } catch (_) {}
            }
            throw new Error(detail || 'Erro ao comunicar com a função de IA.');
        }

        if (!data || !data.ok) {
            if (data?.error === 'quota_exceeded') {
                throw new Error(data.message || 'Limite diário de IA exaurido.');
            }
            throw new Error(data?.error || 'Não foi possível extrair os dados da receita.');
        }

        populateFormWithRecipe(data.recipe);
        textarea.value = '';
    } catch (err) {
        console.error('Erro na importação IA:', err);
        if (statusBox) {
            statusBox.textContent = 'Erro ao importação: ' + err.message;
            statusBox.style.display = 'block';
        }
    } finally {
        btnImport.disabled = false;
        btnImport.textContent = '🪄 Processar e Preencher com IA';
    }
}

function populateFormWithRecipe(recipe) {
    if (recipe.title) document.getElementById('recipe-title').value = recipe.title;
    if (recipe.emoji) document.getElementById('recipe-emoji').value = recipe.emoji;
    if (recipe.image) document.getElementById('recipe-image').value = recipe.image;
    if (recipe.tips) document.getElementById('recipe-tips').value = recipe.tips;
    if (recipe.servings) document.getElementById('recipe-servings').value = recipe.servings;
    if (recipe.prep_time) document.getElementById('recipe-prep-time').value = recipe.prep_time;
    if (recipe.cook_time) document.getElementById('recipe-cook-time').value = recipe.cook_time;
    if (recipe.source_url) document.getElementById('recipe-source-url').value = recipe.source_url;
    if (recipe.author) document.getElementById('recipe-author').value = recipe.author;

    // Preencher tags sugeridas pela IA ou receita
    if (Array.isArray(recipe.tags) && recipe.tags.length > 0) {
        recipeTags = [...recipe.tags];
    } else {
        recipeTags = [];
    }
    renderTagChips();

    // Selecionar categoria se informada (com fallback de correspondência inteligente)
    if (recipe.category) {
        const catKey = String(recipe.category).toLowerCase().trim();
        const radios = categoriesContainer.querySelectorAll('input[type="radio"]');
        let matched = false;

        // 1. Tentar por chave exata (ex: 'carnes')
        radios.forEach(radio => {
            if (radio.dataset.key && radio.dataset.key.toLowerCase().trim() === catKey) {
                radio.checked = true;
                matched = true;
            }
        });

        // 2. Se não casou por chave exata, tentar por rótulo ou inclusão de texto (ex: 'Carnes' ou 'carnes e assados')
        if (!matched) {
            radios.forEach(radio => {
                const parentLabel = radio.parentElement ? radio.parentElement.textContent.toLowerCase() : '';
                const rKey = (radio.dataset.key || '').toLowerCase();
                if (parentLabel.includes(catKey) || catKey.includes(rKey)) {
                    radio.checked = true;
                    matched = true;
                }
            });
        }

        // 3. Fallback padrão: se ainda não casar nenhuma, selecionar a primeira categoria disponível para não barrar a validação
        if (!matched && radios.length > 0) {
            radios[0].checked = true;
        }
    }

    // Preencher ingredientes
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        ingredients = recipe.ingredients.map(ing => ({
            name: ing.name || '',
            qty: ing.qty !== undefined && ing.qty !== null ? ing.qty : '',
            unit: ing.unit || ''
        }));
        renderIngredients();
    }

    // Preencher passos
    if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
        steps = recipe.steps.map(s => ({
            step_text: typeof s === 'string' ? s : s.step_text || ''
        }));
        renderSteps();
    }
}

// Helper Delete Button
function createDeleteButton(onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-delete-row';
    btn.title = 'Remover item';
    btn.setAttribute('aria-label', 'Remover item');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;
    btn.onclick = onClick;
    return btn;
}

// Dynamic Lists (Ingredients)
function renderIngredients() {
    ingredientsList.innerHTML = '';
    ingredients.forEach((ing, index) => {
        const row = document.createElement('div');
        row.className = 'ingredient-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input ingredient-name';
        nameInput.placeholder = 'Nome do ingrediente...';
        nameInput.required = true;
        nameInput.value = ing.name;
        nameInput.setAttribute('aria-label', `Nome do ingrediente ${index + 1}`);
        nameInput.oninput = (e) => ingredients[index].name = e.target.value;

        const qtyInput = document.createElement('input');
        qtyInput.type = 'text';
        qtyInput.className = 'form-input ingredient-qty';
        qtyInput.placeholder = 'Qtd (ex: 1.5)';
        qtyInput.value = ing.qty !== null ? ing.qty : '';
        qtyInput.setAttribute('aria-label', `Quantidade do ingrediente ${index + 1}`);
        qtyInput.oninput = (e) => ingredients[index].qty = e.target.value;

        const unitSelect = document.createElement('select');
        unitSelect.className = 'form-input ingredient-unit';
        unitSelect.setAttribute('aria-label', `Unidade do ingrediente ${index + 1}`);
        const units = ['', 'g', 'kg', 'ml', 'l', 'xícara(s)', 'colher(es) de sopa', 'colher(es) de chá', 'unidade(s)', 'pitada(s)', 'a gosto', 'dente(s)', 'lata(s)', 'pacote(s)'];
        units.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.textContent = u || 'Sem unidade';
            if (ing.unit === u) opt.selected = true;
            unitSelect.appendChild(opt);
        });
        unitSelect.onchange = (e) => ingredients[index].unit = e.target.value;

        row.appendChild(nameInput);
        row.appendChild(qtyInput);
        row.appendChild(unitSelect);

        const deleteIng = () => {
            ingredients.splice(index, 1);
            renderIngredients();
        };
        row.appendChild(createDeleteButton(deleteIng));

        ingredientsList.appendChild(row);
    });
}

function addIngredient() {
    ingredients.push({ name: '', qty: '', unit: '' });
    renderIngredients();
}

// Dynamic Lists (Steps)
function renderSteps() {
    stepsList.innerHTML = '';
    steps.forEach((step, index) => {
        const row = document.createElement('div');
        row.className = 'step-row';

        const textInput = document.createElement('textarea');
        textInput.className = 'form-input step-text admin-textarea';
        textInput.placeholder = `Passo ${index + 1}...`;
        textInput.required = true;
        textInput.value = step.step_text;
        textInput.rows = 2;
        textInput.setAttribute('aria-label', `Texto do passo ${index + 1}`);
        textInput.oninput = (e) => steps[index].step_text = e.target.value;

        row.appendChild(textInput);

        const deleteStep = () => {
            steps.splice(index, 1);
            renderSteps();
        };
        row.appendChild(createDeleteButton(deleteStep));

        stepsList.appendChild(row);
    });
}

function collectIngredientsFromDOM() {
    const rows = ingredientsList.querySelectorAll('.ingredient-row');
    const newIngredients = [];
    rows.forEach(row => {
        const nameInput = row.querySelector('.ingredient-name');
        const qtyInput = row.querySelector('.ingredient-qty');
        const unitSelect = row.querySelector('.ingredient-unit');
        if (nameInput) {
            newIngredients.push({
                name: nameInput.value.trim(),
                qty: qtyInput ? qtyInput.value.trim() : '',
                unit: unitSelect ? unitSelect.value : ''
            });
        }
    });
    if (newIngredients.length > 0) {
        ingredients = newIngredients;
    }
}

function collectStepsFromDOM() {
    const rows = stepsList.querySelectorAll('.step-row');
    const newSteps = [];
    rows.forEach(row => {
        const textInput = row.querySelector('.step-text');
        if (textInput) {
            newSteps.push({
                step_text: textInput.value.trim()
            });
        }
    });
    if (newSteps.length > 0) {
        steps = newSteps;
    }
}

function addStep() {
    steps.push({ step_text: '' });
    renderSteps();
}

// Save Recipe
async function saveRecipe(e) {
    if (e) e.preventDefault();
    const errorContainer = document.getElementById('recipe-error');
    errorContainer.style.display = 'none';
    
    const title = document.getElementById('recipe-title').value.trim();
    const selectedCategoryInput = categoriesContainer.querySelector('input[type="radio"]:checked');
    const selectedCategoryId = selectedCategoryInput ? selectedCategoryInput.value : '';
    const selectedCategoryKey = selectedCategoryInput ? selectedCategoryInput.dataset.key : '';

    // Sincronizar ingredientes e passos a partir do DOM antes de salvar
    collectIngredientsFromDOM();
    collectStepsFromDOM();

    const validation = validateRecipePayloadData({
        title,
        selectedCategoryId,
        ingredients,
        steps
    });

    if (!validation.isValid) {
        errorContainer.textContent = validation.error;
        errorContainer.style.display = 'block';
        return;
    }

    const prepTimeInput = document.getElementById('recipe-prep-time');
    const cookTimeInput = document.getElementById('recipe-cook-time');
    const sourceUrlInput = document.getElementById('recipe-source-url');
    const authorInput = document.getElementById('recipe-author');

    const payload = buildRecipePayload({
        title,
        emoji: document.getElementById('recipe-emoji').value,
        image: document.getElementById('recipe-image').value,
        tips: document.getElementById('recipe-tips').value,
        servings: document.getElementById('recipe-servings').value,
        prep_time: prepTimeInput ? prepTimeInput.value : null,
        cook_time: cookTimeInput ? cookTimeInput.value : null,
        source_url: sourceUrlInput ? sourceUrlInput.value : null,
        author: authorInput ? authorInput.value : null,
        selectedCategoryId,
        selectedCategoryKey,
        tags: recipeTags,
        validIngredients: validation.validIngredients,
        validSteps: validation.validSteps,
        id: editingRecipeId
    });

    btnSave.disabled = true;
    btnSave.textContent = editingRecipeId ? 'Salvando alterações...' : 'Salvando...';

    if (!navigator.onLine) {
        try {
            await enfileirarSincronizacao(payload);
            alert('Você está offline! A receita foi salva na fila e será sincronizada quando houver conexão.');
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar no cache:', error);
            errorContainer.textContent = 'Erro ao salvar localmente: ' + error.message;
            errorContainer.style.display = 'block';
        }
    } else {
        try {
            console.log('Enviando payload para salvar_receita:', payload);
            const { data, error } = await supabase.rpc('salvar_receita', payload);
            console.log('Resposta do Supabase RPC:', { data, error });
            if (error) throw error;
            
            const isEdit = !!editingRecipeId;
            alert(isEdit ? 'Receita atualizada com sucesso!' : 'Receita salva com sucesso!');
            // Recarregar lista de receitas (pode ter mudado o título)
            await loadRecipes();
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            errorContainer.textContent = 'Erro ao salvar receita: ' + error.message;
            errorContainer.style.display = 'block';
        }
    }

    btnSave.disabled = false;
    btnSave.textContent = editingRecipeId ? 'Salvar Alterações' : 'Publicar Receita';
}

function resetForm() {
    document.getElementById('recipe-title').value = '';
    document.getElementById('recipe-emoji').value = '🍲';
    document.getElementById('recipe-image').value = '';
    document.getElementById('recipe-tips').value = '';
    document.getElementById('recipe-servings').value = '';

    const prepEl = document.getElementById('recipe-prep-time');
    const cookEl = document.getElementById('recipe-cook-time');
    const srcEl = document.getElementById('recipe-source-url');
    const authEl = document.getElementById('recipe-author');
    if (prepEl) prepEl.value = '';
    if (cookEl) cookEl.value = '';
    if (srcEl) srcEl.value = '';
    if (authEl) authEl.value = '';
    
    const radios = categoriesContainer.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => radio.checked = false);

    ingredients = [];
    steps = [];
    recipeTags = [];
    renderTagChips();
    addIngredient();
    addStep();
    exitEditMode();
}

// ========================================================================
// Tag Autocomplete
// ========================================================================
async function loadExistingTags() {
    const { data, error } = await supabase
        .from('tags')
        .select('label')
        .order('label');
    if (error) {
        console.error('Erro ao carregar tags:', error);
        return;
    }
    allExistingTags = (data || []).map(t => t.label).filter(Boolean);
}

function renderTagSuggestions(query) {
    const suggestionsEl = document.getElementById('tag-suggestions');
    if (!suggestionsEl) return;

    const q = query.trim().toLowerCase();
    if (!q) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('visible');
        return;
    }

    const matches = allExistingTags
        .filter(tag => tag.toLowerCase().includes(q) && !recipeTags.includes(tag))
        .slice(0, 8);

    if (matches.length === 0) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('visible');
        return;
    }

    suggestionsEl.innerHTML = '';
    matches.forEach((tag, idx) => {
        const item = document.createElement('div');
        item.className = 'admin-tag-suggestion-item';
        item.textContent = tag;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.dataset.idx = idx;
        item.addEventListener('mousedown', (e) => {
            e.preventDefault(); // evita blur no input antes do click
            const input = document.getElementById('tag-input');
            if (!recipeTags.includes(tag)) {
                recipeTags.push(tag);
                renderTagChips();
            }
            if (input) input.value = '';
            suggestionsEl.innerHTML = '';
            suggestionsEl.classList.remove('visible');
        });
        suggestionsEl.appendChild(item);
    });
    suggestionsEl.classList.add('visible');
}

function setupTagAutocomplete(input) {
    const suggestionsEl = document.getElementById('tag-suggestions');
    let highlightedIdx = -1;

    input.addEventListener('input', () => {
        highlightedIdx = -1;
        renderTagSuggestions(input.value);
    });

    input.addEventListener('keydown', (e) => {
        const items = suggestionsEl ? suggestionsEl.querySelectorAll('.admin-tag-suggestion-item') : [];
        if (!suggestionsEl?.classList.contains('visible') || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('highlighted', i === highlightedIdx));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIdx = Math.max(highlightedIdx - 1, -1);
            items.forEach((el, i) => el.classList.toggle('highlighted', i === highlightedIdx));
        } else if (e.key === 'Tab' || (e.key === 'Enter' && highlightedIdx >= 0)) {
            if (highlightedIdx >= 0 && items[highlightedIdx]) {
                e.preventDefault();
                const tag = items[highlightedIdx].textContent;
                if (!recipeTags.includes(tag)) {
                    recipeTags.push(tag);
                    renderTagChips();
                }
                input.value = '';
                suggestionsEl.innerHTML = '';
                suggestionsEl.classList.remove('visible');
                highlightedIdx = -1;
            }
        } else if (e.key === 'Escape') {
            suggestionsEl.innerHTML = '';
            suggestionsEl.classList.remove('visible');
            highlightedIdx = -1;
        }
    });

    // Fechar ao perder o foco (com delay para permitir mousedown no item)
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (suggestionsEl) {
                suggestionsEl.innerHTML = '';
                suggestionsEl.classList.remove('visible');
            }
            highlightedIdx = -1;
        }, 150);
    });
}

init();

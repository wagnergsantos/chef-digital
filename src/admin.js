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

    const btnImport = document.getElementById('btn-import-gemini');
    if (btnImport) {
        btnImport.addEventListener('click', handleAIImport);
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
        // Se o usuário colou diretamente um JSON pré-gerado, faz o parse local instantâneo
        if (rawText.startsWith('{') && rawText.endsWith('}')) {
            const parsed = JSON.parse(rawText);
            populateFormWithRecipe(parsed);
            textarea.value = '';
            btnImport.disabled = false;
            btnImport.textContent = '🪄 Processar e Preencher com IA';
            return;
        }

        // Caso contrário, invoca a Edge Function via Supabase
        const { data, error } = await supabase.functions.invoke('parse-recipe', {
            body: { text: rawText }
        });

        if (error) {
            let detail = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const errBody = await error.context.json();
                    if (errBody && errBody.error) detail = errBody.error;
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
        validIngredients: validation.validIngredients,
        validSteps: validation.validSteps
    });

    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';

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
            
            alert('Receita salva com sucesso!');
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            errorContainer.textContent = 'Erro ao salvar receita: ' + error.message;
            errorContainer.style.display = 'block';
        }
    }

    btnSave.disabled = false;
    btnSave.textContent = 'Publicar Receita';
}

function resetForm() {
    document.getElementById('recipe-title').value = '';
    document.getElementById('recipe-emoji').value = '🍲';
    document.getElementById('recipe-image').value = '';
    document.getElementById('recipe-tips').value = '';
    document.getElementById('recipe-servings').value = '';
    
    const radios = categoriesContainer.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => radio.checked = false);

    ingredients = [];
    steps = [];
    addIngredient();
    addStep();
}

init();

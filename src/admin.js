import { supabase } from './supabase.js';
import { enfileirarSincronizacao } from './cache.js';

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
    supabase.auth.onAuthStateChange((event, _session) => {
        session = _session;
        updateUI();
        if (session) {
            loadCategories();
            // Inicia com um ingrediente e um passo
            if (ingredients.length === 0) addIngredient();
            if (steps.length === 0) addStep();
        }
    });
}

async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error('Erro ao verificar sessão:', error);
    session = data.session;
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

async function handleLogin(e) {
    if (e) e.preventDefault();
    const errorContainer = document.getElementById('login-error');
    errorContainer.style.display = 'none';
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        errorContainer.textContent = 'Por favor, preencha e-mail e senha.';
        errorContainer.style.display = 'block';
        return;
    }
    btnLogin.textContent = 'Entrando...';
    btnLogin.disabled = true;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    btnLogin.textContent = 'Entrar';
    btnLogin.disabled = false;

    if (error) {
        errorContainer.textContent = 'E-mail ou senha incorretos.';
        errorContainer.style.display = 'block';
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
}

// Categories
async function loadCategories() {
    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('key, label')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
    }

    categoriesContainer.innerHTML = '';
    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'admin-category-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat.key;
        checkbox.id = `cat-${cat.key}`;

        const label = document.createElement('label');
        label.htmlFor = `cat-${cat.key}`;
        label.textContent = cat.label;
        label.className = 'admin-category-label';

        div.appendChild(checkbox);
        div.appendChild(label);
        categoriesContainer.appendChild(div);
    });
}

// Dynamic Inputs
function createDeleteButton(onClick) {
    const btn = document.createElement('button');
    btn.textContent = 'X';
    btn.className = 'admin-btn admin-btn-danger';
    btn.type = 'button';
    if (onClick.name === 'deleteIngredient') {
        btn.setAttribute('aria-label', 'Remover ingrediente');
    } else if (onClick.name === 'deleteStep') {
        btn.setAttribute('aria-label', 'Remover passo');
    } else {
        btn.setAttribute('aria-label', 'Remover');
    }
    btn.onclick = onClick;
    return btn;
}

function renderIngredients() {
    ingredientsList.innerHTML = '';
    ingredients.forEach((ing, index) => {
        const row = document.createElement('div');
        row.className = 'admin-ingredient-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input ingredient-name';
        nameInput.placeholder = 'Nome (ex: Arroz)';
        nameInput.required = true;
        nameInput.value = ing.name;
        nameInput.setAttribute('aria-label', `Nome do ingrediente ${index + 1}`);
        nameInput.oninput = (e) => ingredients[index].name = e.target.value;

        const qtyInput = document.createElement('input');
        qtyInput.type = 'text';
        qtyInput.className = 'form-input ingredient-qty';
        qtyInput.placeholder = 'Qtd (ex: 1)';
        qtyInput.value = ing.qty;
        qtyInput.setAttribute('aria-label', `Quantidade do ingrediente ${index + 1}`);
        qtyInput.oninput = (e) => ingredients[index].qty = e.target.value;

        const unitInput = document.createElement('input');
        unitInput.type = 'text';
        unitInput.className = 'form-input ingredient-unit';
        unitInput.placeholder = 'Unid (ex: xícara)';
        unitInput.value = ing.unit;
        unitInput.setAttribute('aria-label', `Unidade do ingrediente ${index + 1}`);
        unitInput.oninput = (e) => ingredients[index].unit = e.target.value;

        row.appendChild(nameInput);
        row.appendChild(qtyInput);
        row.appendChild(unitInput);
        
        const deleteIngredient = () => {
            ingredients.splice(index, 1);
            renderIngredients();
        };
        row.appendChild(createDeleteButton(deleteIngredient));

        ingredientsList.appendChild(row);
    });
}

function addIngredient() {
    ingredients.push({ name: '', qty: '', unit: '' });
    renderIngredients();
}

function renderSteps() {
    stepsList.innerHTML = '';
    steps.forEach((step, index) => {
        const row = document.createElement('div');
        row.className = 'admin-step-row';

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
    if (!title) {
        errorContainer.textContent = 'O título da receita é obrigatório.';
        errorContainer.style.display = 'block';
        return;
    }

    // Coleta categorias selecionadas
    const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]:checked');
    const selectedCategories = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCategories.length === 0) {
        errorContainer.textContent = 'Selecione pelo menos uma categoria.';
        errorContainer.style.display = 'block';
        return;
    }

    // Prepara ingredientes validos e com ordem
    const ingredientRows = ingredientsList.children;
    const validIngredients = Array.from(ingredientRows).map((row, index) => {
        const nameInput = row.querySelector('.ingredient-name');
        const qtyInput = row.querySelector('.ingredient-qty');
        const unitSelect = row.querySelector('.ingredient-unit');
        
        const rawQty = qtyInput.value.trim();
        const parsedQty = rawQty ? parseFloat(rawQty.replace(',', '.')) : null;
        
        return {
            name: nameInput.value.trim(),
            qty: isNaN(parsedQty) ? null : parsedQty,
            unit: unitSelect.value.trim() || null,
            ordem: index
        };
    }).filter(ing => ing.name);

    if (validIngredients.length === 0) {
        errorContainer.textContent = 'Adicione pelo menos um ingrediente.';
        errorContainer.style.display = 'block';
        return;
    }

    // Prepara passos validos e com ordem
    const stepRows = stepsList.children;
    const validSteps = Array.from(stepRows).map((row, index) => {
        const textInput = row.querySelector('.step-text');
        return {
            step_text: textInput.value.trim(),
            ordem: index
        };
    }).filter(s => s.step_text);

    if (validSteps.length === 0) {
        errorContainer.textContent = 'Adicione pelo menos um passo de preparo.';
        errorContainer.style.display = 'block';
        return;
    }

    const payload = {
        p_id: null, // Novo registro
        p_title: title,
        p_emoji: document.getElementById('recipe-emoji').value.trim() || '🍲',
        p_image: document.getElementById('recipe-image').value.trim() || null,
        p_source: document.getElementById('recipe-source').value.trim() || null,
        p_tips: document.getElementById('recipe-tips').value.trim() || null,
        p_servings: (() => {
            const val = document.getElementById('recipe-servings').value.trim();
            const num = val ? parseInt(val, 10) : null;
            return (!isNaN(num) && num > 0) ? num : null;
        })(),
        p_category: selectedCategories,
        p_ingredientes: validIngredients,
        p_passos: validSteps
    };

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
            const { data, error } = await supabase.rpc('salvar_receita', payload);
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
    document.getElementById('recipe-source').value = '';
    document.getElementById('recipe-servings').value = '';
    document.getElementById('recipe-tips').value = '';
    
    const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);

    ingredients = [];
    steps = [];
    addIngredient();
    addStep();
}

function importFromGemini() {
    const rawJson = document.getElementById('gemini-json-input').value.trim();
    if (!rawJson) {
        alert('Por favor, cole o JSON gerado pelo Gemini.');
        return;
    }

    try {
        const data = JSON.parse(rawJson);

        if (data.title) document.getElementById('recipe-title').value = data.title;
        if (data.emoji) document.getElementById('recipe-emoji').value = data.emoji;
        if (data.image) document.getElementById('recipe-image').value = data.image;
        if (data.source) document.getElementById('recipe-source').value = data.source;
        if (data.servings) document.getElementById('recipe-servings').value = data.servings;
        if (data.tips) document.getElementById('recipe-tips').value = data.tips;

        const categoriesList = data.category || data.categories || [];
        const targetCategories = (Array.isArray(categoriesList) ? categoriesList : [categoriesList])
            .map(c => String(c).trim().toLowerCase());

        if (targetCategories.length > 0) {
            const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = targetCategories.includes(cb.value.toLowerCase());
            });
        }

        if (Array.isArray(data.ingredients)) {
            ingredients = data.ingredients.map(ing => ({
                name: ing.name || '',
                qty: ing.qty !== undefined && ing.qty !== null ? String(ing.qty) : '',
                unit: ing.unit || ''
            }));
            renderIngredients();
        }

        if (Array.isArray(data.steps)) {
            steps = data.steps.map(step => ({
                step_text: typeof step === 'string' ? step : (step.step_text || '')
            }));
            renderSteps();
        }

        // Limpa a caixa de entrada após importar com sucesso
        document.getElementById('gemini-json-input').value = '';
        alert('Dados da receita importados com sucesso! Revise e clique em Salvar.');
    } catch (err) {
        alert('Erro ao processar JSON do Gemini: ' + err.message);
    }
}

function setupEventListeners() {
    document.getElementById('login-container').addEventListener('submit', handleLogin);
    btnLogout.addEventListener('click', handleLogout);
    btnAddIngredient.addEventListener('click', addIngredient);
    btnAddStep.addEventListener('click', addStep);
    document.getElementById('admin-panel').addEventListener('submit', saveRecipe);
    
    const btnImportGemini = document.getElementById('btn-import-gemini');
    if (btnImportGemini) {
        btnImportGemini.addEventListener('click', importFromGemini);
    }
}

init();

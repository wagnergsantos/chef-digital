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

async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        alert('Por favor, preencha e-mail e senha.');
        return;
    }
    btnLogin.textContent = 'Entrando...';
    btnLogin.disabled = true;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    btnLogin.textContent = 'Entrar';
    btnLogin.disabled = false;

    if (error) {
        alert('Erro ao fazer login: ' + error.message);
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
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '4px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat.key;
        checkbox.id = `cat-${cat.key}`;

        const label = document.createElement('label');
        label.htmlFor = `cat-${cat.key}`;
        label.textContent = cat.label;
        label.style.fontFamily = "'Inter', sans-serif";
        label.style.fontSize = '14px';
        label.style.color = 'var(--text-main)';

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
    btn.onclick = onClick;
    return btn;
}

function renderIngredients() {
    ingredientsList.innerHTML = '';
    ingredients.forEach((ing, index) => {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '2fr 1fr 1fr auto';
        row.style.gap = '8px';
        row.style.marginBottom = '8px';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input ingredient-name';
        nameInput.placeholder = 'Nome (ex: Arroz)';
        nameInput.value = ing.name;
        nameInput.oninput = (e) => ingredients[index].name = e.target.value;

        const qtyInput = document.createElement('input');
        qtyInput.type = 'text';
        qtyInput.className = 'form-input ingredient-qty';
        qtyInput.placeholder = 'Qtd (ex: 1)';
        qtyInput.value = ing.qty;
        qtyInput.oninput = (e) => ingredients[index].qty = e.target.value;

        const unitInput = document.createElement('input');
        unitInput.type = 'text';
        unitInput.className = 'form-input ingredient-unit';
        unitInput.placeholder = 'Unid (ex: xícara)';
        unitInput.value = ing.unit;
        unitInput.oninput = (e) => ingredients[index].unit = e.target.value;

        row.appendChild(nameInput);
        row.appendChild(qtyInput);
        row.appendChild(unitInput);
        row.appendChild(createDeleteButton(() => {
            ingredients.splice(index, 1);
            renderIngredients();
        }));

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
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '8px';

        const textInput = document.createElement('textarea');
        textInput.className = 'form-input step-text';
        textInput.placeholder = `Passo ${index + 1}...`;
        textInput.value = step.step_text;
        textInput.style.resize = 'vertical';
        textInput.rows = 2;
        textInput.oninput = (e) => steps[index].step_text = e.target.value;

        row.appendChild(textInput);
        row.appendChild(createDeleteButton(() => {
            steps.splice(index, 1);
            renderSteps();
        }));

        stepsList.appendChild(row);
    });
}

function addStep() {
    steps.push({ step_text: '' });
    renderSteps();
}

// Save Recipe
async function saveRecipe() {
    const title = document.getElementById('recipe-title').value.trim();
    if (!title) {
        alert('O título da receita é obrigatório.');
        return;
    }

    // Coleta categorias selecionadas
    const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]:checked');
    const selectedCategories = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCategories.length === 0) {
        alert('Selecione pelo menos uma categoria.');
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
        alert('Adicione pelo menos um ingrediente.');
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
        alert('Adicione pelo menos um passo de preparo.');
        return;
    }

    const payload = {
        p_id: null, // Novo registro
        p_title: title,
        p_emoji: document.getElementById('recipe-emoji').value.trim() || '🍲',
        p_image: document.getElementById('recipe-image').value.trim() || null,
        p_source: document.getElementById('recipe-source').value.trim() || null,
        p_tips: document.getElementById('recipe-tips').value.trim() || null,
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
            alert('Erro ao salvar localmente: ' + error.message);
        }
    } else {
        try {
            const { data, error } = await supabase.rpc('salvar_receita', payload);
            if (error) throw error;
            
            alert('Receita salva com sucesso! ID: ' + data);
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            alert('Erro ao salvar receita: ' + error.message);
        }
    }

    btnSave.disabled = false;
    btnSave.textContent = 'Salvar Receita no Supabase';
}

function resetForm() {
    document.getElementById('recipe-title').value = '';
    document.getElementById('recipe-emoji').value = '🍲';
    document.getElementById('recipe-image').value = '';
    document.getElementById('recipe-source').value = '';
    document.getElementById('recipe-tips').value = '';
    
    const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);

    ingredients = [];
    steps = [];
    addIngredient();
    addStep();
}

function setupEventListeners() {
    btnLogin.addEventListener('click', handleLogin);
    btnLogout.addEventListener('click', handleLogout);
    btnAddIngredient.addEventListener('click', addIngredient);
    btnAddStep.addEventListener('click', addStep);
    btnSave.addEventListener('click', saveRecipe);
    
    // Login on Enter key
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

init();

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
            const { error } = await supabase.rpc('salvar_receita', payload);
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

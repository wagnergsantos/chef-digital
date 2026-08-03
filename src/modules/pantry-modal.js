import { state } from './state.js';

export function openPantryModal(previouslyFocusedElementRef) {
    const modal = document.getElementById('pantry-modal');
    const textarea = document.getElementById('pantry-textarea');
    if (modal) {
        if (textarea) {
            textarea.value = state.pantryItems.join('\n');
        }
        if (previouslyFocusedElementRef) {
            previouslyFocusedElementRef.current = document.activeElement;
        }
        modal.classList.add('open');
        setTimeout(() => {
            if (textarea) textarea.focus();
        }, 100);
    }
}

export function closePantryModal(previouslyFocusedElementRef) {
    const modal = document.getElementById('pantry-modal');
    if (modal) {
        modal.classList.remove('open');
    }
    if (previouslyFocusedElementRef && previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
        previouslyFocusedElementRef.current = null;
    }
}

export function closePantryModalOnBackdrop(e, previouslyFocusedElementRef) {
    if (e.target.id === 'pantry-modal') {
        closePantryModal(previouslyFocusedElementRef);
    }
}

export function updatePantryEditBtnVisibility() {
    const editBtn = document.getElementById('pantry-edit-btn');
    if (!editBtn) return;
    editBtn.classList.toggle('hidden', state.pantryItems.length === 0);
}

export function saveAndFilterPantry({ renderRecipes, showToast, previouslyFocusedElementRef }) {
    const textarea = document.getElementById('pantry-textarea');
    if (textarea) {
        state.pantryItems = textarea.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
        localStorage.setItem('chef_digital_pantry', JSON.stringify(state.pantryItems));
    }
    state.showPantryOnly = state.pantryItems.length > 0;
    
    const btn = document.getElementById('pantry-toggle');
    if (btn) {
        btn.classList.toggle('active', state.showPantryOnly);
    }
    updatePantryEditBtnVisibility();
    
    closePantryModal(previouslyFocusedElementRef);
    renderRecipes();
    showToast(state.showPantryOnly ? 'Ingredientes salvos e filtro aplicado!' : 'Ingredientes salvos.');
}

export function clearPantry({ renderRecipes, showToast }) {
    const textarea = document.getElementById('pantry-textarea');
    if (textarea) {
        textarea.value = '';
    }
    state.pantryItems = [];
    localStorage.setItem('chef_digital_pantry', JSON.stringify([]));
    state.showPantryOnly = false;
    const btn = document.getElementById('pantry-toggle');
    if (btn) {
        btn.classList.remove('active');
    }
    updatePantryEditBtnVisibility();
    renderRecipes();
    showToast('Despensa limpa!');
}

export function togglePantryFilterOrOpenModal(event, { renderRecipes, previouslyFocusedElementRef }) {
    if (state.pantryItems.length === 0) {
        openPantryModal(previouslyFocusedElementRef);
    } else {
        state.showPantryOnly = !state.showPantryOnly;
        const btn = document.getElementById('pantry-toggle');
        if (btn) {
            if (state.showPantryOnly) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        renderRecipes();
    }
}

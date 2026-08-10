import { escapeHtml, parseStepTimer } from '../logic/recipes.js';

let currentRecipe = null;
let currentStepIndex = 0;
let isDrawerOpen = false;
let _previouslyFocusedElementRef = { current: null };

// Cooking mode Wake Lock sentinel
let cookingWakeLockSentinel = null;

// Timer state per step index: { [stepIndex]: { totalSeconds, remainingSeconds, isRunning, intervalId } }
let stepTimers = {};

export function setCookingModeDependencies({ previouslyFocusedElementRef }) {
    if (previouslyFocusedElementRef) _previouslyFocusedElementRef = previouslyFocusedElementRef;
}

export function getCurrentStepIndex() {
    return currentStepIndex;
}

export function getCurrentRecipe() {
    return currentRecipe;
}

export async function acquireCookingWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        cookingWakeLockSentinel = await navigator.wakeLock.request('screen');
        cookingWakeLockSentinel.addEventListener('release', () => {
            cookingWakeLockSentinel = null;
        });
    } catch (e) {
        cookingWakeLockSentinel = null;
    }
}

export function releaseCookingWakeLock() {
    if (cookingWakeLockSentinel) {
        cookingWakeLockSentinel.release();
        cookingWakeLockSentinel = null;
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', async () => {
        const overlay = document.getElementById('cooking-mode-overlay');
        if (overlay && overlay.classList.contains('open') && document.visibilityState === 'visible') {
            await acquireCookingWakeLock();
        }
    });
}


function clearAllTimers() {
    Object.values(stepTimers).forEach(timer => {
        if (timer.intervalId) {
            clearInterval(timer.intervalId);
        }
    });
    stepTimers = {};
}

export function startCookingMode(recipe) {
    if (!recipe || !recipe.steps || recipe.steps.length === 0) return;

    clearAllTimers();
    currentRecipe = recipe;
    currentStepIndex = 0;
    isDrawerOpen = false;

    const overlay = document.getElementById('cooking-mode-overlay');
    if (!overlay) return;

    _previouslyFocusedElementRef.current = document.activeElement;

    // Acquire Wake Lock for screen lock in cooking mode
    acquireCookingWakeLock();

    // Set title
    const titleEl = document.getElementById('cooking-title');
    if (titleEl) {
        titleEl.textContent = recipe.title || 'Modo Preparo';
    }

    // Render ingredients drawer list
    renderIngredientsDrawer();

    // Render step
    renderStep();

    // Show overlay
    overlay.classList.add('open');

    // Close ingredients drawer initially if open
    const drawer = document.getElementById('cooking-ingredients-drawer');
    if (drawer) {
        drawer.classList.remove('open');
    }
    const drawerToggle = document.getElementById('cooking-drawer-toggle');
    if (drawerToggle) {
        drawerToggle.setAttribute('aria-expanded', 'false');
    }

    // Focus close button
    setTimeout(() => {
        const closeBtn = document.getElementById('cooking-close-btn');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

export function recordRecipeCompletion(recipe) {
    if (!recipe || !recipe.id) return;
    const recipeId = recipe.id;
    const history = state.cookingHistory || {};
    const record = history[recipeId] || { count: 0, history: [] };

    const nowIso = new Date().toISOString();
    record.count = (record.count || 0) + 1;
    record.lastCooked = nowIso;
    if (!Array.isArray(record.history)) record.history = [];
    record.history.unshift(nowIso);

    history[recipeId] = record;
    state.cookingHistory = history;

    try {
        localStorage.setItem('chef_digital_cooking_history', JSON.stringify(history));
    } catch (e) {
        console.warn('Falha ao salvar histórico no localStorage:', e);
    }

    const dateStr = new Date().toLocaleDateString('pt-BR');
    if (typeof window.showToast === 'function') {
        window.showToast(`🎉 Parabéns! Receita concluída (${record.count}ª vez - ${dateStr})`, 'success');
    }
}

export function nextStep() {
    if (!currentRecipe || !currentRecipe.steps) return;
    if (currentStepIndex < currentRecipe.steps.length - 1) {
        currentStepIndex++;
        renderStep();
        return;
    }
    recordRecipeCompletion(currentRecipe);
    exitCookingMode();
}

export function prevStep() {
    if (!currentRecipe || !currentRecipe.steps) return;
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
    }
}

export function toggleIngredientsDrawer() {
    isDrawerOpen = !isDrawerOpen;
    const drawer = document.getElementById('cooking-ingredients-drawer');
    const drawerToggle = document.getElementById('cooking-drawer-toggle');
    
    if (drawer) {
        drawer.classList.toggle('open', isDrawerOpen);
    }
    if (drawerToggle) {
        drawerToggle.setAttribute('aria-expanded', isDrawerOpen ? 'true' : 'false');
    }
}

let isSpeaking = false;

export function stopSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    updateSpeechBtnState();
}

export function speakCurrentStep() {
    if (!('speechSynthesis' in window) || !currentRecipe || !currentRecipe.steps) return;

    window.speechSynthesis.cancel();
    const stepText = currentRecipe.steps[currentStepIndex];
    if (!stepText) return;

    const utterance = new SpeechSynthesisUtterance(stepText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;

    utterance.onstart = () => {
        isSpeaking = true;
        updateSpeechBtnState();
    };

    utterance.onend = () => {
        isSpeaking = false;
        updateSpeechBtnState();
    };

    utterance.onerror = () => {
        isSpeaking = false;
        updateSpeechBtnState();
    };

    window.speechSynthesis.speak(utterance);
}

export function toggleSpeech() {
    if (isSpeaking) {
        stopSpeech();
    } else {
        speakCurrentStep();
    }
}

function updateSpeechBtnState() {
    const btn = document.getElementById('cooking-speech-btn');
    if (!btn) return;

    if (isSpeaking) {
        btn.classList.add('speaking');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pausar Voz</span>
        `;
    } else {
        btn.classList.remove('speaking');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Ouvir</span>
        `;
    }
}

export function exitCookingMode() {
    stopSpeech();
    releaseCookingWakeLock();
    clearAllTimers();

    const overlay = document.getElementById('cooking-mode-overlay');
    if (overlay) {
        overlay.classList.remove('open');
    }

    isDrawerOpen = false;
    const drawer = document.getElementById('cooking-ingredients-drawer');
    if (drawer) {
        drawer.classList.remove('open');
    }

    if (_previouslyFocusedElementRef.current) {
        _previouslyFocusedElementRef.current.focus();
        _previouslyFocusedElementRef.current = null;
    }
}

function formatTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function playTimerSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
        // AudioContext might be blocked or unsupported
    }
}

export function startTimer(stepIdx) {
    let timer = stepTimers[stepIdx];
    if (!timer) return;

    if (timer.isRunning) return;

    timer.isRunning = true;
    timer.intervalId = setInterval(() => {
        if (timer.remainingSeconds > 0) {
            timer.remainingSeconds--;
        }

        if (timer.remainingSeconds <= 0) {
            clearInterval(timer.intervalId);
            timer.intervalId = null;
            timer.isRunning = false;
            renderTimerContainer(stepIdx);
            playTimerSound();
            if (typeof window.showToast === 'function') {
                window.showToast('⏱️ O tempo do timer acabou!', 'success');
            }
        } else {
            renderTimerContainer(stepIdx);
        }
    }, 1000);

    renderTimerContainer(stepIdx);
}

export function pauseTimer(stepIdx) {
    let timer = stepTimers[stepIdx];
    if (!timer || !timer.isRunning) return;

    if (timer.intervalId) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
    }
    timer.isRunning = false;
    renderTimerContainer(stepIdx);
}

export function resetTimer(stepIdx) {
    let timer = stepTimers[stepIdx];
    if (!timer) return;

    if (timer.intervalId) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
    }
    timer.isRunning = false;
    timer.remainingSeconds = timer.totalSeconds;
    renderTimerContainer(stepIdx);
}

function renderTimerContainer(stepIdx) {
    // Only render if it's currently the active step rendered
    if (stepIdx !== currentStepIndex) return;

    const timerContainer = document.getElementById('cooking-step-timer-container');
    if (!timerContainer) return;

    const timer = stepTimers[stepIdx];
    if (!timer) {
        timerContainer.innerHTML = '';
        return;
    }

    const timeDisplayStr = formatTimerDisplay(timer.remainingSeconds);
    const isFinished = timer.remainingSeconds === 0;

    if (!timer.isRunning && timer.remainingSeconds === timer.totalSeconds) {
        // Initial state before starting
        timerContainer.innerHTML = `
            <button class="cooking-timer-btn" onclick="startTimer(${stepIdx})">
                ⏱️ Iniciar Timer (${timer.displayMinutes} min)
            </button>
        `;
    } else {
        // Running, paused or finished state
        timerContainer.innerHTML = `
            <div class="cooking-timer-card ${isFinished ? 'timer-finished' : ''}">
                <div class="timer-display-time">${timeDisplayStr}</div>
                <div class="timer-card-actions">
                    ${timer.isRunning ? `
                        <button class="timer-action-btn btn-pause" onclick="pauseTimer(${stepIdx})" title="Pausar">Pausar</button>
                    ` : `
                        ${!isFinished ? `<button class="timer-action-btn btn-start" onclick="startTimer(${stepIdx})" title="Retomar">Retomar</button>` : ''}
                    `}
                    <button class="timer-action-btn btn-reset" onclick="resetTimer(${stepIdx})" title="Reiniciar">Reiniciar</button>
                </div>
            </div>
        `;
    }
}

export function renderStep() {
    stopSpeech();
    if (!currentRecipe || !currentRecipe.steps) return;
    const totalSteps = currentRecipe.steps.length;
    const stepNumber = currentStepIndex + 1;
    const stepText = currentRecipe.steps[currentStepIndex];

    // Progress bar and text
    const progressBar = document.getElementById('cooking-progress-bar');
    const progressText = document.getElementById('cooking-progress-text');
    const percentage = Math.round((stepNumber / totalSteps) * 100);

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `Passo ${stepNumber} de ${totalSteps} (${percentage}%)`;
    }

    // Step counter and step text
    const counterEl = document.getElementById('cooking-step-counter');
    const stepTextEl = document.getElementById('cooking-step-text');

    if (counterEl) {
        counterEl.textContent = `Passo ${stepNumber} de ${totalSteps}`;
    }
    if (stepTextEl) {
        stepTextEl.textContent = stepText;
    }

    // Timer check for step text
    const parsedTimer = parseStepTimer(stepText);
    if (parsedTimer) {
        if (!stepTimers[currentStepIndex]) {
            stepTimers[currentStepIndex] = {
                totalSeconds: parsedTimer.totalSeconds,
                remainingSeconds: parsedTimer.totalSeconds,
                displayMinutes: parsedTimer.displayMinutes,
                isRunning: false,
                intervalId: null
            };
        }
        renderTimerContainer(currentStepIndex);
    } else {
        const timerContainer = document.getElementById('cooking-step-timer-container');
        if (timerContainer) timerContainer.innerHTML = '';
    }

    // Prev / Next button states
    const prevBtn = document.getElementById('cooking-prev-btn');
    const nextBtn = document.getElementById('cooking-next-btn');

    if (prevBtn) {
        prevBtn.disabled = currentStepIndex === 0;
    }
    if (nextBtn) {
        if (currentStepIndex === totalSteps - 1) {
            nextBtn.classList.add('cooking-btn-finish');
            nextBtn.setAttribute('aria-label', 'Concluir preparo');
            nextBtn.innerHTML = `
                <span>Concluir</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            `;
        } else {
            nextBtn.classList.remove('cooking-btn-finish');
            nextBtn.setAttribute('aria-label', 'Próximo Passo');
            nextBtn.innerHTML = `
                <span>Próximo</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            `;
        }
    }
}

function renderIngredientsDrawer() {
    const listEl = document.getElementById('cooking-ingredients-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!currentRecipe.ingredients || currentRecipe.ingredients.length === 0) {
        listEl.innerHTML = '<li class="cooking-ingredient-item">Nenhum ingrediente especificado.</li>';
        return;
    }

    currentRecipe.ingredients.forEach(ing => {
        const li = document.createElement('li');
        li.className = 'cooking-ingredient-item';

        let qtyDisplay = '';
        if (ing.qty !== null && ing.qty !== undefined) {
            const formattedQty = Number(ing.qty.toFixed(2)).toString();
            qtyDisplay = `<strong class="cooking-ing-qty">${formattedQty} ${escapeHtml(ing.unit || '')}</strong>`;
        } else if (ing.unit) {
            qtyDisplay = `<strong class="cooking-ing-qty">${escapeHtml(ing.unit)}</strong>`;
        }

        li.innerHTML = `
            <span class="cooking-ing-name">${escapeHtml(ing.name)}</span>
            ${qtyDisplay}
        `;
        listEl.appendChild(li);
    });
}

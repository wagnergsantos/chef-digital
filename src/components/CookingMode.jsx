import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseStepTimer } from '../logic/recipes.js';
import { formatTimerDisplay, recordRecipeCompletionHistory } from '../logic/cooking.js';
import { STORAGE_KEYS } from '../logic/storage.js';

export function CookingMode({
    isOpen,
    onClose,
    recipe,
    onComplete
}) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [timersState, setTimersState] = useState({});

    const wakeLockRef = useRef(null);

    // Acquire Wake Lock
    useEffect(() => {
        if (!isOpen) return;

        async function acquireWakeLock() {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch {
                    wakeLockRef.current = null;
                }
            }
        }

        acquireWakeLock();

        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isOpen]);

    // Reset step index when recipe changes or opens
    useEffect(() => {
        if (isOpen && recipe) {
            setCurrentStepIndex(0);
            setIsDrawerOpen(false);
            setTimersState({});
        }
    }, [isOpen, recipe]);

    const steps = recipe?.steps || [];
    const totalSteps = steps.length;
    const currentStepText = steps[currentStepIndex] || '';

    // Handle timer for current step
    useEffect(() => {
        if (!currentStepText) return;

        const parsed = parseStepTimer(currentStepText);
        if (parsed && !timersState[currentStepIndex]) {
            setTimersState(prev => ({
                ...prev,
                [currentStepIndex]: {
                    totalSeconds: parsed.totalSeconds,
                    remainingSeconds: parsed.totalSeconds,
                    displayMinutes: parsed.displayMinutes,
                    isRunning: false
                }
            }));
        }
    }, [currentStepIndex, currentStepText, timersState]);

    // Interval handler for running timer
    useEffect(() => {
        const timer = timersState[currentStepIndex];
        if (!timer || !timer.isRunning || timer.remainingSeconds <= 0) return;

        const intervalId = setInterval(() => {
            setTimersState(prev => {
                const currentTimer = prev[currentStepIndex];
                if (!currentTimer) return prev;

                const nextRemaining = currentTimer.remainingSeconds - 1;
                const isFinished = nextRemaining <= 0;

                if (isFinished) {
                    // Play sound fallback
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                        osc.connect(audioCtx.destination);
                        osc.start();
                        osc.stop(audioCtx.currentTime + 1);
                    } catch {}
                }

                return {
                    ...prev,
                    [currentStepIndex]: {
                        ...currentTimer,
                        remainingSeconds: Math.max(0, nextRemaining),
                        isRunning: !isFinished
                    }
                };
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [currentStepIndex, timersState]);

    const toggleSpeech = useCallback(() => {
        if (!('speechSynthesis' in window) || !currentStepText) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentStepText);
            utterance.lang = 'pt-BR';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    }, [currentStepText, isSpeaking]);

    if (!isOpen || !recipe || totalSteps === 0) return null;

    const percentage = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
    const activeTimer = timersState[currentStepIndex];

    const handleNext = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);

        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Record completion
            try {
                const raw = localStorage.getItem(STORAGE_KEYS.COOKING_HISTORY);
                const history = raw ? JSON.parse(raw) : {};
                const updated = recordRecipeCompletionHistory(history, recipe.id);
                localStorage.setItem(STORAGE_KEYS.COOKING_HISTORY, JSON.stringify(updated));
            } catch {}

            if (onComplete) onComplete(recipe);
            onClose();
        }
    };

    const handlePrev = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);

        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleTimerStart = () => {
        setTimersState(prev => ({
            ...prev,
            [currentStepIndex]: { ...prev[currentStepIndex], isRunning: true }
        }));
    };

    const handleTimerPause = () => {
        setTimersState(prev => ({
            ...prev,
            [currentStepIndex]: { ...prev[currentStepIndex], isRunning: false }
        }));
    };

    const handleTimerReset = () => {
        setTimersState(prev => ({
            ...prev,
            [currentStepIndex]: {
                ...prev[currentStepIndex],
                isRunning: false,
                remainingSeconds: prev[currentStepIndex].totalSeconds
            }
        }));
    };

    return (
        <div className={`cooking-overlay ${isOpen ? 'open' : ''}`} id="cooking-mode-overlay" role="dialog" aria-modal="true" aria-labelledby="cooking-title">
            {/* Header */}
            <header className="cooking-header">
                <div className="cooking-header-top">
                    <h2 id="cooking-title" className="cooking-title">{recipe.title || 'Modo Preparo'}</h2>
                    <button id="cooking-close-btn" type="button" onClick={onClose} className="cooking-close-btn" title="Sair do Modo Preparo" aria-label="Sair do Modo Preparo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                </div>
                <div className="cooking-progress-container">
                    <div id="cooking-progress-bar" className="cooking-progress-bar" style={{ width: `${percentage}%` }}></div>
                </div>
                <div id="cooking-progress-text" className="cooking-progress-text">Passo {currentStepIndex + 1} de {totalSteps} ({percentage}%)</div>
            </header>

            {/* Main Step Area */}
            <main className="cooking-main">
                <div className="cooking-step-card">
                    <div className="cooking-step-header-row">
                        <span id="cooking-step-counter" className="cooking-step-counter">Passo {currentStepIndex + 1} de {totalSteps}</span>
                    </div>

                    <p id="cooking-step-text" className="cooking-step-text">{currentStepText}</p>

                    {activeTimer && (
                        <div id="cooking-step-timer-container" className="cooking-step-timer-container">
                            {!activeTimer.isRunning && activeTimer.remainingSeconds === activeTimer.totalSeconds ? (
                                <button type="button" className="cooking-timer-btn" onClick={handleTimerStart}>
                                    ⏱️ Iniciar Timer ({activeTimer.displayMinutes} min)
                                </button>
                            ) : (
                                <div className={`cooking-timer-card ${activeTimer.remainingSeconds === 0 ? 'timer-finished' : ''}`}>
                                    <div className="timer-display-time">{formatTimerDisplay(activeTimer.remainingSeconds)}</div>
                                    <div className="timer-card-actions">
                                        {activeTimer.isRunning ? (
                                            <button type="button" className="timer-action-btn btn-pause" onClick={handleTimerPause}>Pausar</button>
                                        ) : (
                                            activeTimer.remainingSeconds > 0 && (
                                                <button type="button" className="timer-action-btn btn-start" onClick={handleTimerStart}>Retomar</button>
                                            )
                                        )}
                                        <button type="button" className="timer-action-btn btn-reset" onClick={handleTimerReset}>Reiniciar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer / Navigation Controls */}
            <footer className="cooking-footer">
                <button
                    id="cooking-prev-btn"
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    className="cooking-nav-btn cooking-btn-prev"
                    aria-label="Passo Anterior"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    <span>Anterior</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        id="cooking-speech-btn"
                        type="button"
                        onClick={toggleSpeech}
                        className={`cooking-speech-btn ${isSpeaking ? 'speaking' : ''}`}
                        title="Ouvir instrução por voz"
                        aria-label="Ouvir instrução em voz alta"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                        </svg>
                        <span>{isSpeaking ? 'Pausar' : 'Ouvir'}</span>
                    </button>

                    <button
                        id="cooking-drawer-toggle"
                        type="button"
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        className="cooking-drawer-toggle"
                        aria-label="Ver Ingredientes"
                        aria-expanded={isDrawerOpen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <span>Ingredientes</span>
                    </button>
                </div>

                <button
                    id="cooking-next-btn"
                    type="button"
                    onClick={handleNext}
                    className={`cooking-nav-btn cooking-btn-next ${currentStepIndex === totalSteps - 1 ? 'cooking-btn-finish' : ''}`}
                    aria-label={currentStepIndex === totalSteps - 1 ? 'Concluir preparo' : 'Próximo Passo'}
                >
                    <span>{currentStepIndex === totalSteps - 1 ? 'Concluir' : 'Próximo'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d={currentStepIndex === totalSteps - 1 ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"}></path>
                    </svg>
                </button>
            </footer>

            {/* Floating Ingredients Drawer */}
            <div id="cooking-ingredients-drawer" className={`cooking-ingredients-drawer ${isDrawerOpen ? 'open' : ''}`} aria-label="Painel de Ingredientes">
                <div className="cooking-drawer-header">
                    <h3>Ingredientes</h3>
                    <button type="button" onClick={() => setIsDrawerOpen(false)} className="cooking-drawer-close" aria-label="Fechar painel de ingredientes">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                </div>
                <ul id="cooking-ingredients-list" className="cooking-ingredients-list">
                    {(recipe.ingredients || []).map((ing, idx) => (
                        <li key={idx} className="cooking-ingredient-item">
                            <span className="cooking-ing-name">{ing.name}</span>
                            {ing.qty !== null && ing.qty !== undefined ? (
                                <strong className="cooking-ing-qty">{Number(ing.qty.toFixed(2))} {ing.unit || ''}</strong>
                            ) : (
                                ing.unit && <strong className="cooking-ing-qty">{ing.unit}</strong>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

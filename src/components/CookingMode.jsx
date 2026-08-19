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
        <div className="cooking-mode-overlay open" id="cooking-mode-overlay" role="dialog" aria-label="Modo Preparo">
            <div className="cooking-header">
                <button
                    type="button"
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className="cooking-drawer-toggle"
                    aria-expanded={isDrawerOpen}
                    aria-label="Alternar lista de ingredientes"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="22" height="22">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Ingredientes</span>
                </button>

                <h3 id="cooking-title" className="cooking-title">{recipe.title || 'Modo Preparo'}</h3>

                <button type="button" onClick={onClose} className="cooking-close-btn" aria-label="Sair do Modo Preparo">
                    ✕
                </button>
            </div>

            <div className={`cooking-ingredients-drawer ${isDrawerOpen ? 'open' : ''}`}>
                <ul className="cooking-ingredients-list">
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

            <div className="cooking-progress-container">
                <div className="cooking-progress-bar" style={{ width: `${percentage}%` }} />
                <span className="cooking-progress-text">Passo {currentStepIndex + 1} de {totalSteps} ({percentage}%)</span>
            </div>

            <div className="cooking-body">
                <div className="cooking-step-card">
                    <span className="cooking-step-counter">Passo {currentStepIndex + 1} de {totalSteps}</span>
                    <p className="cooking-step-text">{currentStepText}</p>

                    {activeTimer && (
                        <div className="cooking-step-timer-container">
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
            </div>

            <div className="cooking-footer">
                <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    className="cooking-nav-btn cooking-btn-prev"
                    aria-label="Passo Anterior"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Anterior</span>
                </button>

                <button
                    type="button"
                    onClick={toggleSpeech}
                    className={`cooking-speech-btn ${isSpeaking ? 'speaking' : ''}`}
                >
                    <span>{isSpeaking ? 'Pausar Voz' : 'Ouvir'}</span>
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    className={`cooking-nav-btn cooking-btn-next ${currentStepIndex === totalSteps - 1 ? 'cooking-btn-finish' : ''}`}
                    aria-label={currentStepIndex === totalSteps - 1 ? 'Concluir preparo' : 'Próximo Passo'}
                >
                    <span>{currentStepIndex === totalSteps - 1 ? 'Concluir' : 'Próximo'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d={currentStepIndex === totalSteps - 1 ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} />
                    </svg>
                </button>
            </div>
        </div>
    );
}

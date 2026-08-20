import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus inside a modal/drawer element while active and restore focus upon close.
 * Also handles Esc key press.
 */
export function useFocusTrap(isOpen, onClose, containerRef) {
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;

            const getFocusableElements = () => {
                if (!containerRef.current) return [];
                return Array.from(
                    containerRef.current.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    )
                ).filter(el => !el.disabled && el.offsetParent !== null);
            };

            const handleKeyDown = (e) => {
                if (e.key === 'Escape' && onClose) {
                    onClose();
                    return;
                }

                if (e.key === 'Tab') {
                    const focusables = getFocusableElements();
                    if (focusables.length === 0) return;

                    const firstEl = focusables[0];
                    const lastEl = focusables[focusables.length - 1];

                    if (e.shiftKey) {
                        if (document.activeElement === firstEl) {
                            lastEl.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastEl) {
                            firstEl.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            // Initial focus timeout to ensure animation/render completes
            const focusTimer = setTimeout(() => {
                const focusables = getFocusableElements();
                if (focusables.length > 0) {
                    focusables[0].focus();
                }
            }, 50);

            document.addEventListener('keydown', handleKeyDown);

            return () => {
                clearTimeout(focusTimer);
                document.removeEventListener('keydown', handleKeyDown);
                if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                    previousFocusRef.current.focus();
                }
            };
        }
    }, [isOpen, onClose, containerRef]);
}

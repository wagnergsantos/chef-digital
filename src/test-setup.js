import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

const createLocalStorageMock = () => {
    const store = new Map();
    return {
        getItem: (key) => store.get(String(key)) ?? null,
        setItem: (key, value) => store.set(String(key), String(value)),
        removeItem: (key) => store.delete(String(key)),
        clear: () => store.clear(),
        key: (index) => Array.from(store.keys())[index] ?? null,
        get length() { return store.size; }
    };
};

try {
    Object.defineProperty(globalThis, 'localStorage', {
        value: createLocalStorageMock(),
        configurable: true,
        writable: true
    });
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'localStorage', {
            value: globalThis.localStorage,
            configurable: true,
            writable: true
        });
    }
} catch {
    // fallback silencioso
}

if (typeof window !== 'undefined') {
    if (!window.IntersectionObserver) {
        class IntersectionObserverMock {
            constructor(callback) {
                this.callback = callback;
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        }
        window.IntersectionObserver = IntersectionObserverMock;
        globalThis.IntersectionObserver = IntersectionObserverMock;
    }

    if (!window.scrollTo) {
        window.scrollTo = () => {};
    }
}

import '@testing-library/jest-dom';

if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
    const store = new Map();
    globalThis.localStorage = {
        getItem: (key) => store.get(String(key)) ?? null,
        setItem: (key, value) => store.set(String(key), String(value)),
        removeItem: (key) => store.delete(String(key)),
        clear: () => store.clear(),
        key: (index) => Array.from(store.keys())[index] ?? null,
        get length() { return store.size; }
    };
}

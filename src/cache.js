import { supabase } from './supabase.js';

const DB_NAME = 'ChefDigitalDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('receitas')) {
        db.createObjectStore('receitas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categorias')) {
        db.createObjectStore('categorias', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function salvarCacheLocal(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    data.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function lerCacheLocal(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enfileirarSincronizacao(payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    store.put({
      payload,
      timestamp: Date.now(),
      tentativas: 0,
      ultimo_erro: null
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function lerFilaSincronizacao() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removerDaFila(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function atualizarItemFila(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function processarFilaOnline() {
  if (!navigator.onLine) return;
  
  const queue = await lerFilaSincronizacao();
  for (const item of queue) {
    if (item.tentativas >= 5) continue; // Pula se falhou muitas vezes (necessita intervenção manual)
    
    try {
      const { data, error } = await supabase.rpc('salvar_receita', item.payload);
      if (error) throw error;
      
      // Sucesso! Remove da fila
      await removerDaFila(item.id);
      console.log(`Receita sincronizada com sucesso. ID gerado: ${data}`);
    } catch (err) {
      item.tentativas++;
      item.ultimo_erro = err.message || err;
      await atualizarItemFila(item);
      console.error(`Falha ao sincronizar item ${item.id}:`, err);
    }
  }
}
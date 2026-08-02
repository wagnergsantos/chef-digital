import { supabase } from './supabase.js';

const DB_NAME = 'ChefDigitalDB';
const DB_VERSION = 1;
let isProcessingQueue = false;
const MAX_TENTATIVAS = 5;

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
  if (!Array.isArray(data)) return;
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
  if (!navigator.onLine || isProcessingQueue) return;
  isProcessingQueue = true;
  
  try {
    const queue = await lerFilaSincronizacao();
    for (const item of queue) {
      if (item.tentativas >= MAX_TENTATIVAS) continue;
      
      try {
        const { data, error } = await supabase.rpc('salvar_receita', item.payload);
        if (error) {
          // Se a RPC não existir no Supabase, tenta upsert direto
          if (error.code === 'PGRST202' || (error.message && (error.message.includes('function') || error.message.includes('not found')))) {
            const p = item.payload;
            const recipeData = {
              title: p.p_title,
              emoji: p.p_emoji,
              image: p.p_image,
              source: p.p_source,
              tips: p.p_tips,
              servings: p.p_servings,
              category: p.p_category
            };
            if (p.p_id) recipeData.id = p.p_id;

            const { data: recData, error: recErr } = await supabase.from('receitas').upsert(recipeData).select().single();
            if (recErr) throw recErr;

            const recId = recData.id;

            if (Array.isArray(p.p_ingredientes) && p.p_ingredientes.length > 0) {
              await supabase.from('ingredientes').delete().eq('receita_id', recId);
              const ingRows = p.p_ingredientes.map(ing => ({
                receita_id: recId,
                name: ing.name,
                qty: ing.qty,
                unit: ing.unit,
                ordem: ing.ordem
              }));
              const { error: ingErr } = await supabase.from('ingredientes').insert(ingRows);
              if (ingErr) throw ingErr;
            }

            if (Array.isArray(p.p_passos) && p.p_passos.length > 0) {
              await supabase.from('passos').delete().eq('receita_id', recId);
              const passoRows = p.p_passos.map(passo => ({
                receita_id: recId,
                step_text: passo.step_text,
                ordem: passo.ordem
              }));
              const { error: passoErr } = await supabase.from('passos').insert(passoRows);
              if (passoErr) throw passoErr;
            }
          } else {
            throw error;
          }
        }
        
        await removerDaFila(item.id);
        console.log(`Receita sincronizada com sucesso. ID gerado: ${data}`);
      } catch (err) {
        const errMessage = (err.message || '').toLowerCase();
        if (errMessage.includes('fetch') || errMessage.includes('network') || errMessage.includes('failed to fetch')) {
          console.warn('Sincronização interrompida devido a falha de conexão:', err);
          break; // Aborda para não consumir tentativas dos outros itens da fila
        }
        
        item.tentativas++;
        item.ultimo_erro = err.message || err;
        await atualizarItemFila(item);
        console.error(`Falha ao sincronizar item ${item.id}:`, err);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

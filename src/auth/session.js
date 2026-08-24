import { supabase } from '../api/supabase.js';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getUserId(session) {
  return session?.user?.id ?? null;
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Use Vite env variables if available, else fallback to window.env for static HTML
const supabaseUrl = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || window.env?.VITE_SUPABASE_URL
const supabaseAnonKey = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || window.env?.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Auth helpers ---
export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function logoutAdmin() {
  await supabase.auth.signOut()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
}

// --- User management helpers ---
export async function fetchAllUsers() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) throw error
  return data
}

export async function updateUser(uid, fields) {
  const { error } = await supabase.from('users').update(fields).eq('id', uid)
  if (error) throw error
}

export async function getUser(uid) {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error) throw error
  return data
}

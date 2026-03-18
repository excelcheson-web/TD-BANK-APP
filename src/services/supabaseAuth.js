import { supabase } from './supabaseClient'

// Register a new user and insert profile
export async function registerUser(email, password, userData) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: userData.name } }
  })
  if (signUpError) throw signUpError
  const user = signUpData.user
  // Insert profile into 'users' table
  const { error: profileError } = await supabase.from('users').insert([
    {
      id: user.id,
      email,
      name: userData.name,
      accountNumber: userData.accountNumber,
      accountType: userData.accountType,
      pin: userData.pin,
      profilePic: userData.profilePic || '',
      balance: 0,
      createdAt: new Date().toISOString()
    }
  ])
  if (profileError) throw profileError
  return { uid: user.id, ...userData, balance: 0, email }
}

// Login and fetch profile
export async function loginUser(email, password) {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  const user = signInData.user
  const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (profileError) throw profileError
  return { uid: user.id, ...profile }
}

export async function logoutUser() {
  await supabase.auth.signOut()
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error) return null
  return { uid, ...data }
}

export async function updateUserProfile(uid, fields) {
  await supabase.from('users').update(fields).eq('id', uid)
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
}

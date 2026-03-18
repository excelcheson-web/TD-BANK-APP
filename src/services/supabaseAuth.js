import { supabase } from './supabaseClient'

// Register a new user and insert profile
export async function registerUser(email, password, userData) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: userData.full_name } }
  })
  if (signUpError) throw signUpError
  const user = signUpData.user
  // Insert profile into 'profiles' table
  if (user) {
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        full_name: userData.full_name || 'New User',
        email,
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
  return null;
}

// Login and fetch profile
export async function loginUser(email, password) {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  const user = signInData.user
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profileError) throw profileError
  if (!profile) {
    throw new Error('Profile does not exist for this user. Please contact support or complete registration.')
  }
  return { uid: user.id, ...profile }
}

export async function logoutUser() {
  await supabase.auth.signOut()
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
  if (error) return null
  return { uid, ...data }
}

export async function updateUserProfile(uid, fields) {
  await supabase.from('profiles').update(fields).eq('id', uid)
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
}

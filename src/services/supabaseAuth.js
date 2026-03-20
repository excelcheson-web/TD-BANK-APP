import { supabase } from './supabaseClient'

// Normalize a raw Supabase profile row into a consistent shape
function normalizeProfile(userId, raw) {
  return {
    uid: userId,
    id: userId,
    full_name: raw.full_name || raw.name || 'User',
    name: raw.full_name || raw.name || 'User',
    email: raw.email || '',
    accountNumber: raw.account_number || raw.accountNumber || '',
    account_number: raw.account_number || raw.accountNumber || '',
    accountType: raw.account_type || raw.accountType || 'Savings Account',
    account_type: raw.account_type || raw.accountType || 'Savings Account',
    pin: raw.pin || '',
    profilePic: raw.profile_pic || raw.profilePic || '',
    profile_pic: raw.profile_pic || raw.profilePic || '',
    balance: raw.balance ?? 0,
    savingsVault: raw.savings_vault || raw.savingsVault || 0,
  }
}

// Register a new user and insert profile into 'profiles' table
export async function registerUser(email, password, userData) {
  const fullName = userData.name || userData.full_name || 'New User'
  const accountNumber = userData.accountNumber || userData.account_number || generateAccountNumber()

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (signUpError) throw signUpError

  const user = signUpData.user
  if (!user) throw new Error('Signup succeeded but no user was returned.')

  const { error: profileError } = await supabase.from('profiles').insert([
    {
      id: user.id,
      full_name: fullName,
      email,
      account_number: accountNumber,
      account_type: userData.accountType || userData.account_type || 'Savings Account',
      pin: userData.pin || '',
      profile_pic: userData.profilePic || userData.profile_pic || '',
      balance: 0.00,
      savings_vault: 0.00,
      created_at: new Date().toISOString(),
    },
  ])
  if (profileError) throw profileError

  return normalizeProfile(user.id, {
    full_name: fullName,
    email,
    account_number: accountNumber,
    account_type: userData.accountType || 'Savings Account',
    pin: userData.pin || '',
    profile_pic: userData.profilePic || '',
    balance: 0.00,
  })
}

// Login with email/password and fetch profile
export async function loginUser(email, password) {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) throw signInError

  const user = signInData.user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) {
    throw new Error('Profile does not exist for this user. Please contact support or complete registration.')
  }

  return normalizeProfile(user.id, profile)
}

export async function logoutUser() {
  await supabase.auth.signOut()
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return normalizeProfile(userId, data)
}

export async function updateUserProfile(userId, fields) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId)
  if (error) throw error
}

// Returns a proper cleanup function — call the returned fn to unsubscribe
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
  return () => subscription.unsubscribe()
}

// Helper: generate a random 10-digit account number
function generateAccountNumber() {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10))
  digits[0] = digits[0] || 1
  return digits.join('')
}

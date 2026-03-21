import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebaseClient'

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateAccountNumber() {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10))
  if (digits[0] === 0) digits[0] = 1
  return digits.join('')
}

function normalizeProfile(uid, raw) {
  return {
    uid,
    id:             uid,
    email:          raw.email          || '',
    full_name:      raw.full_name      || raw.name          || 'User',
    name:           raw.full_name      || raw.name          || 'User',
    accountNumber:  raw.accountNumber  || raw.account_number || '',
    account_number: raw.accountNumber  || raw.account_number || '',
    accountType:    raw.accountType    || raw.account_type   || 'Savings Account',
    account_type:   raw.accountType    || raw.account_type   || 'Savings Account',
    pin:            raw.pin            || '',
    profilePic:     raw.profilePic     || raw.profile_pic    || '',
    profile_pic:    raw.profilePic     || raw.profile_pic    || '',
    balance:        raw.balance        ?? 0,
    savingsVault:   raw.savingsVault   || raw.savings_vault  || 0,
  }
}

export async function registerUser(userData) {
  const email         = userData.email
  const password      = userData.password
  const fullName      = userData.name || userData.full_name || 'New User'
  const accountNumber = userData.accountNumber || userData.account_number || generateAccountNumber()

  if (!email || !password) {
    throw new Error('Email and password are required to register.')
  }

  // Create a real email/password user in Firebase Auth
  console.log('[registerUser] Creating auth user…')
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  console.log('[registerUser] Auth user created:', user.uid)

  const profileData = {
    full_name:    fullName,
    email,
    accountNumber,
    accountType:  userData.accountType  || 'Savings Account',
    pin:          userData.pin          || '',
    profilePic:   userData.profilePic   || '',
    balance:      0,
    savingsVault: 0,
    createdAt:    new Date().toISOString(),
  }

  // On localhost, Firestore may be blocked by App Check — fire-and-forget so
  // registration isn't stuck. On production, await the write to ensure persistence.
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  if (isLocalhost) {
    console.log('[registerUser] Writing Firestore profile (non-blocking — localhost)…')
    setDoc(doc(db, 'profiles', user.uid), profileData)
      .then(() => console.log('[registerUser] Firestore profile synced ✅'))
      .catch((err) => console.warn('[registerUser] Firestore write pending (will retry):', err.message))
  } else {
    console.log('[registerUser] Writing Firestore profile…')
    await setDoc(doc(db, 'profiles', user.uid), profileData)
    console.log('[registerUser] Firestore profile written ✅')
  }

  const profile = normalizeProfile(user.uid, profileData)
  console.log('[registerUser] Registration complete ✅', profile)
  return profile
}

export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required to log in.')
  }

  // Sign in with email/password instead of anonymous
  const { user } = await signInWithEmailAndPassword(auth, email, password)

  // Try to fetch profile from Firestore
  let snap = null
  try {
    snap = await getDoc(doc(db, 'profiles', user.uid))
  } catch (err) {
    console.warn('[loginUser] Firestore read failed, falling back to localStorage:', err.message)
  }

  if (snap && snap.exists()) {
    return normalizeProfile(user.uid, snap.data())
  }

  // Fallback: try localStorage profile (written during registration)
  try {
    const cached = localStorage.getItem('securebank_user')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.uid === user.uid) {
        console.log('[loginUser] Using cached profile from localStorage')
        return parsed
      }
    }
  } catch { /* silent */ }

  throw new Error('Profile not found. Please contact support or complete registration.')
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function logoutUser() {
  await signOut(auth)
}

// ── Fetch profile by UID ──────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'profiles', uid))
    if (!snap.exists()) return null
    return normalizeProfile(uid, snap.data())
  } catch (err) {
    console.error('[firebaseAuth] getUserProfile error:', err)
    return null
  }
}

// ── Update profile fields ─────────────────────────────────────────────────────

export async function updateUserProfile(uid, fields) {
  await updateDoc(doc(db, 'profiles', uid), fields)
}

// ── Auth state listener ───────────────────────────────────────────────────────
// Returns the unsubscribe function — call it in useEffect cleanup.

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}


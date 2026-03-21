import {
  signInAnonymously,
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
  const fullName      = userData.name || userData.full_name || 'New User'
  const accountNumber = userData.accountNumber || userData.account_number || generateAccountNumber()

  const { user } = await signInAnonymously(auth)

  const profileData = {
    full_name:    fullName,
    accountNumber,
    accountType:  userData.accountType  || 'Savings Account',
    pin:          userData.pin          || '',
    profilePic:   userData.profilePic   || '',
    balance:      0,
    savingsVault: 0,
    createdAt:    new Date().toISOString(),
  }

  await setDoc(doc(db, 'profiles', user.uid), profileData)
  return normalizeProfile(user.uid, profileData)
}

export async function loginUser() {
  const { user } = await signInAnonymously(auth)
  const snap = await getDoc(doc(db, 'profiles', user.uid))
  if (!snap.exists()) {
    throw new Error('Profile not found. Please contact support or complete registration.')
  }
  return normalizeProfile(user.uid, snap.data())
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


import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBgeXJBhlGTddJ8sfxV9Qg6chZpvs39ZR4",
  authDomain: "td-global.firebaseapp.com",
  projectId: "td-global",
  storageBucket: "td-global.firebasestorage.app",
  messagingSenderId: "10234950847",
  appId: "1:10234950847:web:0b9561007e47ac3f4dc20a"
}

console.log('Firebase Config:', firebaseConfig.apiKey)

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Keep user signed in across page refreshes
setPersistence(auth, browserLocalPersistence).catch((err) =>
  console.error('Firebase persistence error:', err)
)

/**
 * Register a new user with Firebase Auth + save profile to Firestore.
 */
export async function registerUser(email, password, userData) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const uid = cred.user.uid

  await setDoc(doc(db, 'users', uid), {
    email,
    name: userData.name,
    accountNumber: userData.accountNumber,
    accountType: userData.accountType,
    pin: userData.pin,
    profilePic: userData.profilePic || '',
    balance: 0,
    createdAt: new Date().toISOString()
  })

  return {
    uid,
    email,
    name: userData.name,
    accountNumber: userData.accountNumber,
    accountType: userData.accountType,
    pin: userData.pin,
    profilePic: userData.profilePic || '',
    balance: 0
  }
}

/**
 * Sign in an existing user and fetch their Firestore profile.
 */
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const uid = cred.user.uid

  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) {
    throw new Error('User profile not found in database.')
  }

  const data = snap.data()
  return {
    uid,
    email: data.email,
    name: data.name,
    accountNumber: data.accountNumber,
    accountType: data.accountType,
    pin: data.pin,
    profilePic: data.profilePic || '',
    balance: data.balance || 0
  }
}

/**
 * Sign out the current user.
 */
export async function logoutUser() {
  await signOut(auth)
}

/**
 * Fetch the current user's profile from Firestore.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid, ...snap.data() }
}

/**
 * Update specific fields in the user's Firestore document.
 */
export async function updateUserProfile(uid, fields) {
  await updateDoc(doc(db, 'users', uid), fields)
}

/**
 * Listen for Firebase Auth state changes.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Add a transaction to the user's Firestore history and update balance.
 */
export async function addTransaction(uid, txn, newBalance) {
  await updateDoc(doc(db, 'users', uid), {
    transferHistory: arrayUnion(txn),
    balance: newBalance
  })
}

/**
 * Get the user's transfer history from Firestore.
 */
export async function getTransferHistory(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return []
  return snap.data().transferHistory || []
}

/**
 * Sync local transfer history + balance to Firestore.
 * Called after any transaction to keep the cloud in sync.
 */
export async function syncLocalToCloud() {
  const user = auth.currentUser
  if (!user) return
  const history = JSON.parse(localStorage.getItem('transfer_history') || '[]')
  const balance = parseFloat(localStorage.getItem('bank_balance') || '0')
  await updateDoc(doc(db, 'users', user.uid), {
    transferHistory: history,
    balance
  })
}

/**
 * Pull transfer history + balance from Firestore into localStorage.
 */
export async function syncCloudToLocal(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return
  const data = snap.data()
  if (data.transferHistory) {
    localStorage.setItem('transfer_history', JSON.stringify(data.transferHistory))
  }
  if (data.balance !== undefined) {
    localStorage.setItem('bank_balance', String(data.balance))
  }
}

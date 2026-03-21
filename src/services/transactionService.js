/**
 * transactionService.js
 * Centralised transaction persistence — writes to localStorage (immediate)
 * AND Firestore subcollection profiles/{uid}/transactions/{id} (cross-device sync).
 */
import { db } from './firebaseClient'
import { doc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'

const HISTORY_KEY = 'transfer_history'

/** Read the current user's UID from localStorage. */
function getUid() {
  try {
    const u = JSON.parse(localStorage.getItem('securebank_user') || '{}')
    return u.uid || u.id || null
  } catch { return null }
}

/**
 * Save a transaction to localStorage AND Firestore (fire-and-forget).
 * Call this instead of directly writing to localStorage in each component.
 */
export function saveTransaction(txn) {
  // 1. Write to localStorage immediately (always works, even offline)
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (!history.find((t) => t.id === txn.id)) {
      history.unshift(txn)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  } catch { /* silent */ }

  // 2. Fire-and-forget Firestore write
  const uid = getUid()
  if (uid) {
    setDoc(doc(db, 'profiles', uid, 'transactions', String(txn.id)), txn)
      .catch((err) => console.warn('[transactionService] Firestore write failed (localStorage fallback active):', err.message))
  }
}

/**
 * Load transactions for a user — merges Firestore + localStorage, deduplicates,
 * sorts newest-first. Falls back to localStorage if Firestore is unavailable.
 */
export async function loadTransactions(uid) {
  // Always start with localStorage as the baseline
  let localTxns = []
  try {
    localTxns = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch { /* silent */ }

  if (!uid) return localTxns

  try {
    const q = query(
      collection(db, 'profiles', uid, 'transactions'),
      orderBy('date', 'desc')
    )
    const snap = await getDocs(q)
    const firestoreTxns = snap.docs.map((d) => d.data())

    if (firestoreTxns.length === 0 && localTxns.length === 0) return []

    // Merge: start with Firestore, add any local-only txns not yet synced
    const merged = [...firestoreTxns]
    localTxns.forEach((lt) => {
      if (!merged.find((ft) => String(ft.id) === String(lt.id))) {
        merged.push(lt)
        // Back-fill this local-only txn to Firestore (fire-and-forget)
        setDoc(doc(db, 'profiles', uid, 'transactions', String(lt.id)), lt)
          .catch(() => {})
      }
    })

    // Sort newest first
    merged.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Update localStorage with the merged result so it's available offline
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(merged)) } catch { /* silent */ }

    return merged
  } catch (err) {
    console.warn('[transactionService] Firestore load failed, using localStorage:', err.message)
    return localTxns
  }
}

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// ─────────────────────────────────────────────────────────────────────────────
// Firebase config — apiKey is read from .env so it stays off GitHub.
// All other values are non-secret project identifiers.
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        'td-project-pro.firebaseapp.com',
  projectId:         'td-project-pro',
  storageBucket:     'td-project-pro.firebasestorage.app',
  messagingSenderId: '750514900015',
  appId:             '1:750514900015:web:c49df7bdf3503d2faccada',
}
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)

// ── App Check (reCAPTCHA v3) ──────────────────────────────────────────────────
// On localhost enable the debug token so App Check doesn't block Auth / Firestore.
// In production the real reCAPTCHA v3 provider is used.
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1')

if (typeof window !== 'undefined') {
  try {
    if (isLocalhost) {
      // Debug token lets App Check pass on localhost without a real reCAPTCHA domain
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LekIpIsAAAAANyoVvklRU5sfyjht_NCUp-roZOu'),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (e) {
    console.warn('[AppCheck] initialization skipped:', e.message)
  }
}

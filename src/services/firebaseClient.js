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
// Firestore has App Check enforcement enabled, so we MUST initialize App Check
// on every environment — including localhost.
//
// On localhost we use a debug token. The first time you run the app locally,
// Firebase will log a debug token to the browser console like:
//   "App Check debug token: <UUID>"
// Copy that token and register it in:
//   Firebase Console → App Check → Apps → ⋮ → Manage debug tokens → Add debug token
//
// In production the real reCAPTCHA v3 provider is used automatically.
// ──────────────────────────────────────────────────────────────────────────────
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1')

if (typeof window !== 'undefined') {
  try {
    if (isLocalhost) {
      // Use a fixed debug token on localhost so it's easy to register once
      // in Firebase Console → App Check → Apps → Manage debug tokens.
      // Token: 'B9C21B4E-3D2A-4F8E-9B6C-7A1D5E0F3C8B'
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = 'B9C21B4E-3D2A-4F8E-9B6C-7A1D5E0F3C8B'
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LekIpIsAAAAANyoVvklRU5sfyjht_NCUp-roZOu'),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (e) {
    console.warn('[AppCheck] initialization skipped:', e.message)
  }
}

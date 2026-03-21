# Fix Firebase Email/Password Authentication

## Completed ✅
- [x] **`src/services/firebaseClient.js`** — App Check with debug token for localhost, real reCAPTCHA v3 for production
- [x] **`src/services/firebaseAuth.js`** — `registerUser()` uses `createUserWithEmailAndPassword`; `loginUser()` uses `signInWithEmailAndPassword`; localStorage fallback for both
- [x] **`src/components/OnboardingFlow.jsx`** — Added email & password fields; removed KYC step (2-step flow: Identity → Security)
- [x] **`src/App.jsx`** — Passes email & password to `registerUser()`; `isRegisteringRef` guard; localStorage fallback in `onAuthStateChanged`

## Netlify Deployment Checklist
- [ ] Set `VITE_FIREBASE_API_KEY` environment variable in Netlify (Site settings → Environment variables)
- [ ] Ensure reCAPTCHA v3 site key `6LekIpIsAAAAANyoVvklRU5sfyjht_NCUp-roZOu` is registered for your Netlify domain at https://www.google.com/recaptcha/admin
- [ ] Ensure Firebase Auth → Sign-in method → Email/Password is **enabled**
- [ ] Ensure Firestore security rules allow authenticated users to read/write their own profile
- [ ] App Check enforcement: ensure your Netlify domain is listed in Firebase Console → App Check → reCAPTCHA v3 → allowed domains

## How It Works
- **Localhost**: App Check uses debug token (fire-and-forget Firestore writes, localStorage fallback)
- **Production (Netlify)**: App Check uses real reCAPTCHA v3 → Firestore writes are awaited and fully persistent
- **Registration**: Creates Firebase Auth user with email/password → writes profile to Firestore → navigates to Dashboard
- **Login**: Signs in with email/password → reads profile from Firestore (falls back to localStorage if unavailable)

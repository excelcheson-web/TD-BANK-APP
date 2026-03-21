# Fix Firebase Email/Password Authentication

## Plan
- [x] **`src/services/firebaseClient.js`** — Add App Check debug token for localhost
- [x] **`src/services/firebaseAuth.js`** — Replace `signInAnonymously` with `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`; add `email` to `normalizeProfile`
- [x] **`src/components/OnboardingFlow.jsx`** — Add email, password & confirmPassword fields to registration Step 1
- [x] **`src/App.jsx`** — Pass email & password from onboarding data to `registerUser()`
- [x] **Build** — Verified `npm run build` succeeds with zero errors

## Follow-up (Manual Steps)
- [ ] Ensure "Email/Password" sign-in method is enabled in Firebase Console → Authentication → Sign-in method
- [ ] Test registration flow end-to-end
- [ ] Verify new users appear in Firebase Auth console with email (envelope icon)
- [ ] Verify login works with registered email/password

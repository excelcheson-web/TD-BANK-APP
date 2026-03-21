# TODO — Firebase Auth Fix + i18n Integration

## Firebase Email/Password Auth ✅
- [x] `src/services/firebaseAuth.js` — Use `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`
- [x] `src/services/firebaseClient.js` — Debug token for localhost App Check
- [x] `src/components/OnboardingFlow.jsx` — Collect email + password + confirmPassword
- [x] `src/App.jsx` — Pass email/password to `registerUser()`

## i18n Language Files ✅
- [x] `src/i18n/en.js` — English
- [x] `src/i18n/fr.js` — French
- [x] `src/i18n/es.js` — Spanish
- [x] `src/i18n/zh.js` — Chinese
- [x] `src/i18n/ar.js` — Arabic
- [x] `src/i18n/hi.js` — Hindi
- [x] `src/i18n/pt.js` — Portuguese
- [x] `src/i18n/de.js` — German
- [x] `src/i18n/translations.js` — Index combining all languages
- [x] `src/i18n/LanguageContext.jsx` — React Context + useLanguage hook
- [x] `src/main.jsx` — Wrap App with LanguageProvider

## i18n Component Integration ✅
- [x] `src/components/Dashboard.jsx` — Added useLanguage, language selector in logo menu, ~30+ strings translated with t()
- [x] `src/style.css` — Added `.db-lang-picker`, `.db-lang-option`, `.db-lang-flag`, `.db-lang-label` styles (dark + light mode)
- [x] Verify build passes — ✅ `npm run build` succeeds
- [ ] `src/components/LoginScreen.jsx` — Translate strings (optional)
- [ ] `src/components/OnboardingFlow.jsx` — Translate strings (optional)

## PDF Receipt Fix ✅
- [x] `src/services/pdfReceipt.js` — All content drawn at full opacity FIRST, watermark drawn LAST at 0.07 opacity
- [x] Bold "TD Bank" header (24pt) at top-left
- [x] US + Canadian bank addresses in footer
- [x] Centered watermark logo

## Bug Fix: formatCurrency TypeError ✅
- [x] `src/components/LocalTransfer.jsx` — `(n ?? 0).toLocaleString(...)` 
- [x] `src/components/InternationalTransfer.jsx` — same fix
- [x] `src/components/AccountInfo.jsx` — same fix
- [x] `src/components/DepositOverlay.jsx` — same fix
- [x] `src/components/ScheduledTransfer.jsx` — same fix
- [x] `src/components/BillPayment.jsx` — same fix
- [x] `src/components/Investment.jsx` — same fix (`fmt` function)
- Root cause: `bankBalance` initialized as `useState(null)` in Dashboard, passed to child components where `formatCurrency(null)` crashed

## Balance Persistence Fix ✅
- [x] `src/components/Dashboard.jsx` — `fetchBalance` rewritten: reads localStorage first, on Firestore success uses `Math.max(firestoreBal, localBal)` to prevent losing unsynced deposits; if localStorage higher, pushes to Firestore (fire-and-forget); on Firestore failure falls back to localStorage
- [x] `src/components/Dashboard.jsx` — `handleBalanceUpdate` created: wraps `setBankBalance` + `localStorage.setItem` + `updateDoc` (fire-and-forget Firestore sync)
- [x] All 7 child components (`InternationalTransfer`, `LocalTransfer`, `DepositOverlay`, `ScheduledTransfer`, `BillPayment`, `Investment`, `FinancialServices`) now use `handleBalanceUpdate` instead of raw `setBankBalance`
- [x] `src/components/Dashboard.jsx` — `onStorage` handler watches `bank_balance` key changes (admin credits reflect immediately in same browser)
- [x] `src/components/Dashboard.jsx` — `onFocus` handler calls `fetchBalance()` on tab switch (picks up Firestore/localStorage updates)
- [x] Build passes — ✅ 307 modules, 0 errors

## Admin → App Balance Sync Fix ✅
- [x] `src/admin/App.jsx` — `handleCredit` now also pushes balance to Firestore via `updateUserProfile(uid, { balance })` (fire-and-forget) so balance reflects on other devices/browsers
- [x] `src/admin/App.jsx` — `handleFundTransfer` now also updates `localStorage.setItem('bank_balance', ...)` + dispatches StorageEvent so same-browser Dashboard picks it up immediately
- [x] Build passes — ✅ 307 modules, 0 errors

## Session Security ✅
- [x] `src/components/SecurityLock.jsx` — 60s idle → PIN lock, 20min → force logout (already implemented)
- [x] `src/App.jsx` — `handleForceLogout` calls `logoutUser()`, `<SecurityLock onForceLogout={handleForceLogout}>` wraps Dashboard

## Follow-up
- [ ] Test registration end-to-end (new user appears in Firebase with email)
- [ ] Test login with registered email/password
- [ ] Test language switching in Dashboard
- [ ] Test PDF receipt generation (clear text, watermark, addresses)
- [ ] Test balance persistence: deposit → refresh → balance should persist
- [x] Fix formatCurrency null crash in transfer/payment components

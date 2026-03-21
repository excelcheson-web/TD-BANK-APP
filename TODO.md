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

## Follow-up
- [ ] Test registration end-to-end (new user appears in Firebase with email)
- [ ] Test login with registered email/password
- [ ] Test language switching in Dashboard
- [ ] Test PDF receipt generation (clear text, watermark, addresses)
- [x] Fix formatCurrency null crash in transfer/payment components

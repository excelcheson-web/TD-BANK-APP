# TD Global → Supabase Migration TODO

## Steps

- [x] 1. Update `src/services/supabaseClient.js` — Add session persistence options
- [x] 2. Update `src/services/supabaseAuth.js` — Fix onAuthChange, registerUser field names, profile normalization
- [x] 3. Update `src/App.jsx` — Fix uid→id, prop name user→profile, unsubscribe, loading state, logout cleanup
- [x] 4. Update `src/components/Dashboard.jsx` — Fix BankCard prop, profile name fallback
- [x] 5. Update `src/components/TransactionSuccess.jsx` — Black text, watermark opacity, Local/Intl distinction
- [x] 6. Update `src/services/pdfReceipt.js` — Solid black text colors

## All steps completed ✓

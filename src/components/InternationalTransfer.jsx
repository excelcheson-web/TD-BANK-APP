import { useState } from 'react'
import { generateTransferPDF } from '../services/pdfReceipt'
import { sendTransferEmail } from '../services/emailNotification'

const HISTORY_KEY = 'transfer_history'

function genRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let ref = 'TXN-'
  for (let i = 0; i < 12; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

function formatCurrency(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export default function InternationalTransfer({ balance, onClose, onBalanceUpdate, initialAmount }) {
  const [form, setForm] = useState({
    beneficiary: '',
    iban: '',
    swift: '',
    bankName: '',
    country: '',
    amount: initialAmount || '',
  })
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { beneficiary, iban, swift, bankName, country, amount } = form

    if (!beneficiary.trim() || !iban.trim() || !swift.trim() || !bankName.trim() || !country.trim() || !amount.trim()) {
      setError('All fields are required.')
      return
    }

    const amt = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount.')
      return
    }

    if (amt > balance) {
      setError('Insufficient balance for this transfer.')
      return
    }

    const newBalance = balance - amt
    const ref = genRef()
    const txn = {
      id: Date.now(),
      ref,
      type: 'international',
      beneficiary: beneficiary.trim(),
      iban: iban.trim(),
      swift: swift.trim(),
      bankName: bankName.trim(),
      country: country.trim(),
      amount: amt,
      balanceAfter: newBalance,
      date: new Date().toISOString(),
    }

    // Save to history
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    history.unshift(txn)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))

    // Update balance
    localStorage.setItem('bank_balance', String(newBalance))
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'bank_balance',
      newValue: String(newBalance),
    }))
    onBalanceUpdate(newBalance)

    sendTransferEmail(txn)
    setReceipt(txn)
  }

  // ── Receipt view ──
  if (receipt) {
    return (
      <div className="tf-overlay" onClick={onClose}>
        <div className="tf-sheet tf-receipt" onClick={(e) => e.stopPropagation()}>
          <div className="tf-receipt-check">✓</div>
          <h2 className="tf-receipt-title">Transfer Successful</h2>
          <div className="tf-receipt-rows">
            <div className="tf-receipt-row"><span>Reference</span><strong>{receipt.ref}</strong></div>
            <div className="tf-receipt-row"><span>To</span><strong>{receipt.beneficiary}</strong></div>
            <div className="tf-receipt-row"><span>Amount</span><strong className="tf-receipt-amt">-${formatCurrency(receipt.amount)}</strong></div>
            <div className="tf-receipt-row"><span>New Balance</span><strong>${formatCurrency(receipt.balanceAfter)}</strong></div>
          </div>
          <button className="tf-btn tf-btn--download" onClick={() => generateTransferPDF(receipt)}>
            ↓ Download PDF Receipt
          </button>
          <button className="tf-btn tf-btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    )
  }

  // ── Form view ──
  return (
    <div className="tf-overlay" onClick={onClose}>
      <div className="tf-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tf-header">
          <div className="tf-header-icon tf-header-icon--intl"><GlobeIcon /></div>
          <div>
            <h2 className="tf-title">International Transfer</h2>
            <p className="tf-subtitle">Send money worldwide via SWIFT</p>
          </div>
          <button className="tf-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Balance chip */}
        <div className="tf-bal-chip">
          Available: <strong>${formatCurrency(balance)}</strong>
        </div>

        <form className="tf-form" onSubmit={handleSubmit}>
          <div className="tf-field">
            <label className="tf-label">Beneficiary Name</label>
            <input className="tf-input" placeholder="Full legal name" value={form.beneficiary} onChange={(e) => update('beneficiary', e.target.value)} />
          </div>

          <div className="tf-row-2">
            <div className="tf-field">
              <label className="tf-label">IBAN / Account No.</label>
              <input className="tf-input" placeholder="e.g. GB29 NWBK 6016..." value={form.iban} onChange={(e) => update('iban', e.target.value)} />
            </div>
            <div className="tf-field">
              <label className="tf-label">SWIFT / BIC Code</label>
              <input className="tf-input" placeholder="e.g. NWBKGB2L" value={form.swift} onChange={(e) => update('swift', e.target.value)} />
            </div>
          </div>

          <div className="tf-row-2">
            <div className="tf-field">
              <label className="tf-label">Bank Name</label>
              <input className="tf-input" placeholder="e.g. Barclays UK" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
            </div>
            <div className="tf-field">
              <label className="tf-label">Country</label>
              <input className="tf-input" placeholder="e.g. United Kingdom" value={form.country} onChange={(e) => update('country', e.target.value)} />
            </div>
          </div>

          <div className="tf-field">
            <label className="tf-label">Amount ($)</label>
            <input className="tf-input tf-input--amount" type="text" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(e) => update('amount', e.target.value)} />
          </div>

          {error && <div className="tf-error">{error}</div>}

          <button type="submit" className="tf-btn tf-btn--primary">Confirm Transfer</button>
        </form>
      </div>
    </div>
  )
}

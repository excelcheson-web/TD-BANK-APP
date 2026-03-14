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

const BoltIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

export default function LocalTransfer({ balance, onClose, onBalanceUpdate }) {
  const [form, setForm] = useState({
    beneficiary: '',
    accountNumber: '',
    bankName: '',
    amount: '',
  })
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { beneficiary, accountNumber, bankName, amount } = form

    if (!beneficiary.trim() || !accountNumber.trim() || !bankName.trim() || !amount.trim()) {
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
      type: 'local',
      beneficiary: beneficiary.trim(),
      accountNumber: accountNumber.trim(),
      bankName: bankName.trim(),
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
          <div className="tf-header-icon tf-header-icon--local"><BoltIcon /></div>
          <div>
            <h2 className="tf-title">Local Transfer</h2>
            <p className="tf-subtitle">Instant domestic bank transfer</p>
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
            <input className="tf-input" placeholder="Recipient's full name" value={form.beneficiary} onChange={(e) => update('beneficiary', e.target.value)} />
          </div>

          <div className="tf-field">
            <label className="tf-label">Account Number</label>
            <input className="tf-input" placeholder="e.g. 0123456789" value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} />
          </div>

          <div className="tf-field">
            <label className="tf-label">Bank Name</label>
            <input className="tf-input" placeholder="e.g. TD Bank" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
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

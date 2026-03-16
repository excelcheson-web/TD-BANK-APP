import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'securebank_admin'
const NOTIF_KEY = 'securebank_notifications'
const HISTORY_KEY = 'transfer_history'
const USER_KEY = 'securebank_user'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getUserEmail() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw).email : null
  } catch { return null }
}

function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new StorageEvent('storage', {
    key: USER_KEY,
    newValue: JSON.stringify(user),
  }))
}

function parseBalance(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(/,/g, '')) || 0
}

function formatBalance(num) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
}

function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  window.dispatchEvent(new StorageEvent('storage', { key: HISTORY_KEY, newValue: JSON.stringify(h) }))
}

function genRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let ref = 'TXN-'
  for (let i = 0; i < 12; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

function randomDate(startMonths, endMonths) {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(start.getMonth() - startMonths)
  const end = new Date(now)
  end.setMonth(end.getMonth() - endMonths)
  const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return new Date(ts)
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function randomAcct() {
  let s = ''
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10)
  return s
}

function randomIban() {
  const cc = randomFrom(['GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'CH', 'BE', 'AT', 'SE'])
  let digits = ''
  for (let i = 0; i < 20; i++) digits += Math.floor(Math.random() * 10)
  return cc + digits.slice(0, 2) + ' ' + digits.slice(2, 6) + ' ' + digits.slice(6, 10) + ' ' + digits.slice(10, 14) + ' ' + digits.slice(14, 18)
}

function randomSwift() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

const BANKS = ['TD Bank', 'RBC Royal Bank', 'Bank of Montreal', 'CIBC', 'Scotiabank', 'Chase', 'Wells Fargo', 'HSBC', 'Barclays', 'Deutsche Bank', 'BNP Paribas', 'UBS', 'Credit Suisse', 'Standard Chartered', 'Citibank']
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Netherlands', 'Switzerland', 'Japan', 'Australia', 'Singapore', 'Hong Kong', 'Italy', 'Spain', 'Sweden', 'Belgium']
const FIRST_NAMES = ['James', 'Maria', 'Robert', 'Jennifer', 'William', 'Sarah', 'David', 'Linda', 'Michael', 'Elizabeth', 'Richard', 'Patricia', 'Thomas', 'Barbara', 'Charles', 'Susan', 'Daniel', 'Jessica', 'John', 'Karen', 'Yuki', 'Wei', 'Ahmed', 'Fatima', 'Igor', 'Anya', 'Pierre', 'Sophie', 'Luis', 'Carmen']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Tanaka', 'Chen', 'Kumar', 'Müller', 'Dubois', 'Rossi', 'Petrov', 'Johansson', 'Fernandez', 'O\'Brien']

function generateRandomTxn(monthsBack) {
  const isIntl = Math.random() > 0.45
  const date = randomDate(monthsBack, Math.max(0, monthsBack - 3))
  const amount = Math.round((Math.random() * 45000 + 50) * 100) / 100
  const name = randomFrom(FIRST_NAMES) + ' ' + randomFrom(LAST_NAMES)
  const base = {
    id: Date.now() + Math.floor(Math.random() * 999999),
    ref: genRef(),
    beneficiary: name,
    amount,
    balanceAfter: 0,
    date: date.toISOString(),
    bankName: randomFrom(BANKS),
    accountNumber: randomAcct(),
  }
  if (isIntl) {
    return {
      ...base,
      type: 'international',
      iban: randomIban(),
      swift: randomSwift(),
      country: randomFrom(COUNTRIES),
    }
  }
  return { ...base, type: 'local' }
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [form, setForm] = useState({
    balance: '',
    lastTxnAmount: '',
    receiverName: '',
    txnDate: '',
    suspended: false,
    suspendReason: '',
  })
  const [synced, setSynced] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [actionStatus, setActionStatus] = useState(null)

  // Customer management states
  const [creditAmount, setCreditAmount] = useState('')
  const [history, setHistory] = useState(getHistory)
  const [editingTxn, setEditingTxn] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Bulk generator
  const [bulkCount, setBulkCount] = useState(10)
  const [bulkMonths, setBulkMonths] = useState(12)
  const [bulkPreview, setBulkPreview] = useState([])
  const [bulkEditIdx, setBulkEditIdx] = useState(null)

  // Profile picture
  const [profilePic, setProfilePic] = useState('')
  const fileInputRef = useRef(null)

  // System alert
  const [alertMsg, setAlertMsg] = useState('')
  const [alertSent, setAlertSent] = useState(false)

  const broadcastAlert = () => {
    if (!alertMsg.trim()) return
    const payload = JSON.stringify({ id: Date.now(), message: alertMsg.trim(), timestamp: new Date().toLocaleString() })
    localStorage.setItem('system_notification', payload)
    window.dispatchEvent(new StorageEvent('storage', { key: 'system_notification', newValue: payload }))
    setAlertSent(true)
    setTimeout(() => setAlertSent(false), 3000)
  }

  const clearAlert = () => {
    localStorage.removeItem('system_notification')
    setAlertMsg('')
    showStatus('success', 'System alert cleared.')
  }

  // Block transfers
  const BLOCK_MSG = 'TD Bank has temporarily suspended transfer activities from this account due to suspicious activity detected during routine security monitoring. Please contact customer support or visit the nearest branch to verify your account and restore full access.'

  // Load
  useEffect(() => {
    const saved = loadData()
    if (Object.keys(saved).length) {
      setForm((prev) => ({ ...prev, ...saved }))
      setLastSync(saved._syncedAt || null)
    }
    setHistory(getHistory())
    const user = getUser()
    if (user?.profilePic) setProfilePic(user.profilePic)
  }, [])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSynced(false)
  }

  const showStatus = (type, message) => {
    setActionStatus({ type, message })
    setTimeout(() => setActionStatus(null), 4000)
  }

  // ── Sync ──
  const handleSync = () => {
    const now = new Date().toLocaleString()
    const payload = { ...form, _syncedAt: now }
    saveData(payload)
    const numericBal = parseBalance(form.balance)
    localStorage.setItem('bank_balance', String(numericBal))
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(payload) }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'bank_balance', newValue: String(numericBal) }))
    setLastSync(now)
    setSynced(true)
    setTimeout(() => setSynced(false), 2500)
  }

  // ── Manual credit (inline) ──
  const handleCredit = async () => {
    const amount = parseFloat(creditAmount.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) {
      showStatus('error', 'Enter a valid credit amount.')
      return
    }
    const currentBalance = parseBalance(form.balance)
    const newBalance = currentBalance + amount
    const newBalanceStr = formatBalance(newBalance)
    const amountStr = formatBalance(amount)
    const updatedForm = { ...form, balance: newBalanceStr }
    setForm(updatedForm)

    const now = new Date().toLocaleString()
    const payload = { ...updatedForm, _syncedAt: now }
    saveData(payload)
    localStorage.setItem('bank_balance', String(newBalance))
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(payload) }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'bank_balance', newValue: String(newBalance) }))
    setLastSync(now)

    const notif = { id: Date.now(), type: 'credit', amount: amountStr, newBalance: newBalanceStr, timestamp: now, read: false }
    const existing = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]')
    existing.push(notif)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(existing))
    window.dispatchEvent(new StorageEvent('storage', { key: NOTIF_KEY, newValue: JSON.stringify(existing) }))

    setCreditAmount('')
    showStatus('success', `Credit of $${amountStr} applied. New balance: $${newBalanceStr}`)

    const email = getUserEmail()
    if (email) {
      try {
        await fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, alertType: 'credit', amount: amountStr, newBalance: newBalanceStr }),
        })
      } catch { /* silent */ }
    }
  }

  // ── Old manual txn (keep for debit button) ──
  const handleManualTxn = async (type) => {
    const label = type === 'credit' ? 'Credit' : 'Debit'
    const input = window.prompt(`Enter ${label} amount ($):`)
    if (!input) return
    const amount = parseFloat(input.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) {
      showStatus('error', 'Invalid amount entered.')
      return
    }
    const currentBalance = parseBalance(form.balance)
    const newBalance = type === 'credit' ? currentBalance + amount : Math.max(0, currentBalance - amount)
    const newBalanceStr = formatBalance(newBalance)
    const amountStr = formatBalance(amount)
    const updatedForm = { ...form, balance: newBalanceStr }
    setForm(updatedForm)

    const now = new Date().toLocaleString()
    const payload = { ...updatedForm, _syncedAt: now }
    saveData(payload)
    localStorage.setItem('bank_balance', String(newBalance))
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(payload) }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'bank_balance', newValue: String(newBalance) }))
    setLastSync(now)

    const notif = { id: Date.now(), type, amount: amountStr, newBalance: newBalanceStr, timestamp: now, read: false }
    const existing = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]')
    existing.push(notif)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(existing))
    window.dispatchEvent(new StorageEvent('storage', { key: NOTIF_KEY, newValue: JSON.stringify(existing) }))

    showStatus('success', `${label} of $${amountStr} applied. New balance: $${newBalanceStr}`)

    const email = getUserEmail()
    if (email) {
      try {
        await fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, alertType: type, amount: amountStr, newBalance: newBalanceStr }),
        })
      } catch { /* silent */ }
    }
  }

  // ── Transaction History CRUD ──
  const deleteTxn = (id) => {
    const updated = history.filter((t) => t.id !== id)
    saveHistory(updated)
    setHistory(updated)
    showStatus('success', 'Transaction deleted.')
  }

  const startEdit = (txn) => {
    setEditingTxn(txn.id)
    setEditForm({ ...txn })
  }

  const saveEdit = () => {
    const updated = history.map((t) => t.id === editingTxn ? { ...editForm, amount: parseFloat(String(editForm.amount).replace(/,/g, '')) || 0 } : t)
    saveHistory(updated)
    setHistory(updated)
    setEditingTxn(null)
    setEditForm({})
    showStatus('success', 'Transaction updated.')
  }

  const clearAllHistory = () => {
    if (!window.confirm('Delete ALL transaction history? This cannot be undone.')) return
    saveHistory([])
    setHistory([])
    showStatus('success', 'All transaction history cleared.')
  }

  // ── Bulk generator ──
  const generateBulk = () => {
    const items = []
    for (let i = 0; i < bulkCount; i++) {
      const monthsBack = Math.floor(Math.random() * bulkMonths)
      items.push(generateRandomTxn(monthsBack))
    }
    items.sort((a, b) => new Date(b.date) - new Date(a.date))
    setBulkPreview(items)
    setBulkEditIdx(null)
  }

  const updateBulkItem = (idx, field, value) => {
    setBulkPreview((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const removeBulkItem = (idx) => {
    setBulkPreview((prev) => prev.filter((_, i) => i !== idx))
  }

  const confirmBulk = () => {
    const cleaned = bulkPreview.map((item) => ({
      ...item,
      amount: typeof item.amount === 'string' ? parseFloat(item.amount) || 0 : item.amount,
    }))
    const merged = [...cleaned, ...history]
    merged.sort((a, b) => new Date(b.date) - new Date(a.date))
    saveHistory(merged)
    setHistory(merged)
    setBulkPreview([])
    showStatus('success', `${cleaned.length} transactions added to history.`)
  }

  // ── Profile picture ──
  const handlePicUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setProfilePic(dataUrl)
      const user = getUser() || {}
      user.profilePic = dataUrl
      saveUser(user)
      showStatus('success', 'Profile picture updated.')
    }
    reader.readAsDataURL(file)
  }

  const removePic = () => {
    setProfilePic('')
    const user = getUser() || {}
    user.profilePic = ''
    saveUser(user)
    showStatus('success', 'Profile picture removed.')
  }

  // ── Block transfers ──
  const enableBlock = () => {
    const updatedForm = { ...form, suspended: true, suspendReason: BLOCK_MSG }
    setForm(updatedForm)
    const now = new Date().toLocaleString()
    const payload = { ...updatedForm, _syncedAt: now }
    saveData(payload)
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(payload) }))
    setLastSync(now)
    showStatus('success', 'Transfers BLOCKED. Suspension message is active.')
  }

  const disableBlock = () => {
    const updatedForm = { ...form, suspended: false, suspendReason: '' }
    setForm(updatedForm)
    const now = new Date().toLocaleString()
    const payload = { ...updatedForm, _syncedAt: now }
    saveData(payload)
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(payload) }))
    setLastSync(now)
    showStatus('success', 'Transfers UNBLOCKED.')
  }

  return (
    <div className="admin-shell">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="admin-header bg-admin">
        <div className="admin-header-inner">
          <div>
            <h1 className="admin-title">Admin Portal</h1>
            <p className="admin-subtitle">Control Panel</p>
          </div>
          <div className="admin-badge">🔒</div>
        </div>
      </header>

      <main className="admin-main">
        {/* ── Sync status bar ───────────────────────────── */}
        {lastSync && (
          <div className="admin-sync-bar">
            Last synced: <strong>{lastSync}</strong>
          </div>
        )}

        {/* ── Global status message ─────────────────────── */}
        {actionStatus && (
          <div className={`admin-alert admin-alert--${actionStatus.type === 'success' ? 'success' : 'warn'}`} style={{ margin: '0 0 12px' }}>
            {actionStatus.type === 'success' ? '✅' : '⚠️'} {actionStatus.message}
          </div>
        )}

        {/* ── Account Controls ──────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">💰</span>
            Account Controls
          </h2>
          <div className="admin-card">
            <label className="admin-label" htmlFor="balance">Current Balance ($)</label>
            <input id="balance" className="admin-input" type="text" inputMode="decimal"
              placeholder="e.g. 1,490,000.00" value={form.balance}
              onChange={(e) => update('balance', e.target.value)} />

            {/* Account Type Dropdown */}
            <label className="admin-label" htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              className="admin-input"
              value={form.accountType || 'Savings Account'}
              onChange={e => {
                update('accountType', e.target.value);
                localStorage.setItem('user_account_type', e.target.value);
                // Also update user object if exists
                try {
                  const user = JSON.parse(localStorage.getItem('securebank_user') || '{}');
                  user.accountType = e.target.value;
                  localStorage.setItem('securebank_user', JSON.stringify(user));
                } catch {}
              }}
            >
              <option>Savings Account</option>
              <option>Checking Account</option>
              <option>Current Account</option>
              <option>Fixed Deposit</option>
            </select>

            <label className="admin-label" htmlFor="lastTxn">Last Transaction Amount ($)</label>
            <input id="lastTxn" className="admin-input" type="text" inputMode="decimal"
              placeholder="e.g. 5,000.00" value={form.lastTxnAmount}
              onChange={(e) => update('lastTxnAmount', e.target.value)} />

            <label className="admin-label" htmlFor="receiver">Receiver Name</label>
            <input id="receiver" className="admin-input" type="text" placeholder="e.g. Weicheng"
              value={form.receiverName}
              onChange={(e) => update('receiverName', e.target.value)} />

            <label className="admin-label" htmlFor="txnDate">Transaction Date</label>
            <input id="txnDate" className="admin-input" type="date" value={form.txnDate}
              onChange={(e) => update('txnDate', e.target.value)} />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            CUSTOMER MANAGEMENT
            ════════════════════════════════════════════════════ */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">👤</span>
            Customer Management
          </h2>

          {/* ── Manual Credit ─────────────────────────────── */}
          <div className="admin-card">
            <h3 className="admin-card-title">Manual Credit</h3>
            <div className="adm-credit-row">
              <input
                className="admin-input"
                type="text"
                inputMode="decimal"
                placeholder="Amount to credit ($)"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
              <button className="admin-action-btn admin-action-btn--credit adm-credit-btn" onClick={handleCredit}>
                <span className="admin-action-icon">↓</span> Credit Account
              </button>
            </div>
          </div>

          {/* ── Profile Picture ──────────────────────────── */}
          <div className="admin-card">
            <h3 className="admin-card-title">Profile Picture</h3>
            <div className="adm-pic-row">
              <div className="adm-pic-preview">
                {profilePic
                  ? <img src={profilePic} alt="Profile" className="adm-pic-img" />
                  : <span className="adm-pic-placeholder">👤</span>}
              </div>
              <div className="adm-pic-actions">
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={handlePicUpload} />
                <button className="adm-pic-btn" onClick={() => fileInputRef.current?.click()}>
                  📷 Upload New Photo
                </button>
                {profilePic && (
                  <button className="adm-pic-btn adm-pic-btn--danger" onClick={removePic}>
                    🗑 Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Transaction Logs ──────────────────────────── */}
          <div className="admin-card">
            <div className="adm-txlog-header">
              <h3 className="admin-card-title">Transaction Logs</h3>
              {history.length > 0 && (
                <button className="adm-txlog-clear" onClick={clearAllHistory}>🗑 Clear All</button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="adm-txlog-empty">No transactions recorded.</p>
            ) : (
              <div className="adm-txlog-table-wrap">
                <table className="adm-txlog-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Type</th>
                      <th>Beneficiary</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Bank</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((txn) => (
                      editingTxn === txn.id ? (
                        <tr key={txn.id} className="adm-txlog-edit-row">
                          <td><input className="adm-txlog-input" value={editForm.ref || ''} onChange={(e) => setEditForm(p => ({ ...p, ref: e.target.value }))} /></td>
                          <td>
                            <select className="adm-txlog-input" value={editForm.type || 'local'} onChange={(e) => setEditForm(p => ({ ...p, type: e.target.value }))}>
                              <option value="local">Local</option>
                              <option value="international">International</option>
                            </select>
                          </td>
                          <td><input className="adm-txlog-input" value={editForm.beneficiary || ''} onChange={(e) => setEditForm(p => ({ ...p, beneficiary: e.target.value }))} /></td>
                          <td><input className="adm-txlog-input" type="text" value={editForm.amount || ''} onChange={(e) => setEditForm(p => ({ ...p, amount: e.target.value }))} /></td>
                          <td><input className="adm-txlog-input" type="datetime-local" value={editForm.date ? editForm.date.slice(0, 16) : ''} onChange={(e) => setEditForm(p => ({ ...p, date: new Date(e.target.value).toISOString() }))} /></td>
                          <td><input className="adm-txlog-input" value={editForm.bankName || ''} onChange={(e) => setEditForm(p => ({ ...p, bankName: e.target.value }))} /></td>
                          <td className="adm-txlog-actions">
                            <button className="adm-txlog-btn adm-txlog-btn--save" onClick={saveEdit}>Save</button>
                            <button className="adm-txlog-btn" onClick={() => setEditingTxn(null)}>Cancel</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={txn.id}>
                          <td className="font-mono">{txn.ref}</td>
                          <td><span className={`adm-txlog-badge adm-txlog-badge--${txn.type}`}>{txn.type === 'international' ? '🌐 Intl' : '⚡ Local'}</span></td>
                          <td>{txn.beneficiary}</td>
                          <td className="adm-txlog-amt">${formatBalance(txn.amount)}</td>
                          <td>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td>{txn.bankName}</td>
                          <td className="adm-txlog-actions">
                            <button className="adm-txlog-btn" onClick={() => startEdit(txn)}>✏️</button>
                            <button className="adm-txlog-btn adm-txlog-btn--del" onClick={() => deleteTxn(txn.id)}>🗑</button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Bulk Transaction Generator ────────────────── */}
          <div className="admin-card">
            <h3 className="admin-card-title">Bulk Transaction Generator</h3>
            <p className="adm-bulk-desc">Generate multiple realistic transactions with random dates, names, accounts, and countries. Review and edit before saving.</p>

            <div className="adm-bulk-controls">
              <div className="adm-bulk-field">
                <label className="admin-label">Number of Transactions</label>
                <input className="admin-input" type="number" min="1" max="200" value={bulkCount}
                  onChange={(e) => setBulkCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))} />
              </div>
              <div className="adm-bulk-field">
                <label className="admin-label">Date Range (months back)</label>
                <input className="admin-input" type="number" min="1" max="60" value={bulkMonths}
                  onChange={(e) => setBulkMonths(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))} />
              </div>
              <button className="admin-action-btn admin-action-btn--credit" onClick={generateBulk}>
                ⚡ Generate Preview
              </button>
            </div>

            {bulkPreview.length > 0 && (
              <div className="adm-bulk-preview">
                <div className="adm-bulk-preview-header">
                  <span className="adm-bulk-count">{bulkPreview.length} transactions ready</span>
                  <div>
                    <button className="adm-txlog-btn adm-txlog-btn--save" onClick={confirmBulk}>
                      ✓ Add All to History
                    </button>
                    <button className="adm-txlog-btn" onClick={() => setBulkPreview([])} style={{ marginLeft: 8 }}>
                      ✕ Discard
                    </button>
                  </div>
                </div>

                <div className="adm-txlog-table-wrap">
                  <table className="adm-txlog-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Type</th>
                        <th>Beneficiary</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Bank</th>
                        <th>Country</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((txn, idx) => (
                        bulkEditIdx === idx ? (
                          <tr key={idx} className="adm-txlog-edit-row">
                            <td>{idx + 1}</td>
                            <td>
                              <select className="adm-txlog-input" value={txn.type}
                                onChange={(e) => updateBulkItem(idx, 'type', e.target.value)}>
                                <option value="local">Local</option>
                                <option value="international">International</option>
                              </select>
                            </td>
                            <td><input className="adm-txlog-input" value={txn.beneficiary}
                              onChange={(e) => updateBulkItem(idx, 'beneficiary', e.target.value)} /></td>
                            <td><input className="adm-txlog-input" type="text" value={txn.amount}
                              onChange={(e) => updateBulkItem(idx, 'amount', e.target.value)} /></td>
                            <td><input className="adm-txlog-input" type="datetime-local"
                              value={txn.date.slice(0, 16)}
                              onChange={(e) => updateBulkItem(idx, 'date', new Date(e.target.value).toISOString())} /></td>
                            <td><input className="adm-txlog-input" value={txn.bankName}
                              onChange={(e) => updateBulkItem(idx, 'bankName', e.target.value)} /></td>
                            <td><input className="adm-txlog-input" value={txn.country || 'N/A'}
                              onChange={(e) => updateBulkItem(idx, 'country', e.target.value)} /></td>
                            <td className="adm-txlog-actions">
                              <button className="adm-txlog-btn adm-txlog-btn--save" onClick={() => setBulkEditIdx(null)}>Done</button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><span className={`adm-txlog-badge adm-txlog-badge--${txn.type}`}>{txn.type === 'international' ? '🌐' : '⚡'}</span></td>
                            <td>{txn.beneficiary}</td>
                            <td className="adm-txlog-amt">${formatBalance(txn.amount)}</td>
                            <td>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>{txn.bankName}</td>
                            <td>{txn.country || '—'}</td>
                            <td className="adm-txlog-actions">
                              <button className="adm-txlog-btn" onClick={() => setBulkEditIdx(idx)}>✏️</button>
                              <button className="adm-txlog-btn adm-txlog-btn--del" onClick={() => removeBulkItem(idx)}>🗑</button>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Block Transfers ───────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">🛡️</span>
            Block Transfers (Security Hold)
          </h2>
          <div className="admin-card">
            <p className="adm-block-desc">
              When enabled, ALL transfer attempts will be blocked and the user will see a suspicious-activity suspension message.
            </p>
            <div className="adm-block-msg-preview">
              <strong>Message shown to user:</strong>
              <p className="adm-block-msg-text">{BLOCK_MSG}</p>
            </div>
            <div className="adm-block-actions">
              {form.suspended ? (
                <>
                  <div className="adm-block-status adm-block-status--active">
                    🔴 TRANSFERS ARE BLOCKED
                  </div>
                  <button className="admin-action-btn admin-action-btn--credit" onClick={disableBlock}>
                    ✓ Unblock Transfers
                  </button>
                </>
              ) : (
                <>
                  <div className="adm-block-status adm-block-status--inactive">
                    🟢 Transfers are active
                  </div>
                  <button className="admin-action-btn admin-action-btn--debit" onClick={enableBlock}>
                    🛑 Block All Transfers
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Account Suspension (legacy, now simplified) ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">🚫</span>
            Account Suspension
          </h2>
          <div className="admin-card">
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">Suspend Transfers</span>
              <button type="button"
                className={`admin-toggle ${form.suspended ? 'admin-toggle--on' : ''}`}
                onClick={() => update('suspended', !form.suspended)}
                role="switch" aria-checked={form.suspended}>
                <span className="admin-toggle-knob" />
              </button>
            </div>
            {form.suspended && (
              <div className="admin-reason-wrap">
                <label className="admin-label" htmlFor="reason">Suspension Message (shown to user)</label>
                <textarea id="reason" className="admin-input admin-textarea"
                  placeholder="Custom suspension message..." rows={3}
                  value={form.suspendReason}
                  onChange={(e) => update('suspendReason', e.target.value)} />
              </div>
            )}
            {form.suspended && (
              <div className="admin-alert admin-alert--warn">
                ⚠️ Transfers are <strong>disabled</strong>. Users will see the suspension message when they attempt a transfer.
              </div>
            )}
          </div>
        </section>

        {/* ── Manual Transactions (legacy) ─────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">⚡</span>
            Manual Transactions
          </h2>
          <div className="admin-card admin-txn-actions">
            <button className="admin-action-btn admin-action-btn--credit" onClick={() => handleManualTxn('credit')}>
              <span className="admin-action-icon">↓</span> Manual Credit
            </button>
            <button className="admin-action-btn admin-action-btn--debit" onClick={() => handleManualTxn('debit')}>
              <span className="admin-action-icon">↑</span> Manual Debit
            </button>
          </div>
        </section>

        {/* ── System Alert ────────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">📢</span>
            System Alert Broadcast
          </h2>
          <div className="admin-card">
            <label className="admin-label">Alert Message</label>
            <textarea
              className="admin-input admin-textarea"
              placeholder="Type your system alert message here..."
              rows={3}
              value={alertMsg}
              onChange={(e) => { setAlertMsg(e.target.value); setAlertSent(false) }}
            />
            <div className="adm-alert-actions">
              <button
                className={`admin-action-btn admin-action-btn--credit ${alertSent ? 'adm-alert-sent' : ''}`}
                onClick={broadcastAlert}
                disabled={!alertMsg.trim()}
              >
                {alertSent ? '✓ Broadcasted!' : '📡 Broadcast Alert'}
              </button>
              <button className="adm-txlog-btn adm-txlog-btn--del" onClick={clearAlert}>Clear Alert</button>
            </div>
            {alertSent && (
              <div className="admin-alert admin-alert--success" style={{ marginTop: 10 }}>
                ✅ Alert sent to user dashboard.
              </div>
            )}
          </div>
        </section>

        {/* ── Sync button ───────────────────────────────── */}
        <div className="admin-sync-wrap">
          <button className={`admin-sync-btn ${synced ? 'admin-sync-btn--done' : ''}`} onClick={handleSync}>
            {synced ? '✓  Synced to App' : '⟳  Sync App'}
          </button>
          <p className="admin-sync-hint">Pushes all changes to the main banking app instantly.</p>
        </div>
      </main>
    </div>
  )
}

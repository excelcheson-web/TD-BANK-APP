import { useState } from 'react'
import VaultLoader from './VaultLoader'
import TDLogo from './TDLogo'
import { loginUser } from '../services/supabaseAuth'

/* ── Inline SVG icons ────────────────────────────────────── */

const LockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
)

const FaceIdIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* corners */}
    <path d="M7 3H5a2 2 0 0 0-2 2v2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
    {/* face features */}
    <line x1="9" y1="9" x2="9" y2="10.5" />
    <line x1="15" y1="9" x2="15" y2="10.5" />
    <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
    <line x1="12" y1="9" x2="12" y2="13" />
  </svg>
)

export default function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [faceIdState, setFaceIdState] = useState('idle') // idle | scanning | success | denied
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState('email') // email | reset | done
  const [newPin, setNewPin] = useState('')
  const [forgotError, setForgotError] = useState('')

  const getStoredUser = () => {
    try { return JSON.parse(localStorage.getItem('securebank_user') || 'null') } catch { return null }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    setLoading(true)
    setLoadingMsg('Verifying credentials…')

    try {
      setTimeout(() => setLoadingMsg('Authenticating with server…'), 2000)
      setTimeout(() => setLoadingMsg('Establishing secure session…'), 3800)

      const profile = await loginUser(email.trim(), password)

      // Sync to localStorage for EmailJS and other features
      localStorage.setItem('securebank_user', JSON.stringify(profile))
      localStorage.setItem('user_account_type', profile.accountType)
      localStorage.setItem('user_email', profile.email)
      localStorage.setItem('user_name', profile.name)
      localStorage.setItem('bank_balance', String(profile.balance || 0))

      // Keep the loading UI for at least 5s for UX
      setTimeout(() => {
        setLoading(false)
        setLoadingMsg('')
        onLogin(profile)
      }, 5000)
    } catch (err) {
      setLoading(false)
      setLoadingMsg('')
      console.log('Login error:', err.code, err.message)
      const code = err.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(err.message || 'Login failed. Please try again.')
      }
    }
  }

  /* ── Face ID Handler ─────────────────────────────────── */
  const handleFaceId = () => {
    if (faceIdState === 'scanning') return
    setError('')
    setFaceIdState('scanning')

    setTimeout(() => {
      const stored = getStoredUser()
      if (stored) {
        setFaceIdState('success')
        setTimeout(() => onLogin(stored), 600)
      } else {
        setFaceIdState('denied')
        setTimeout(() => setFaceIdState('idle'), 3000)
      }
    }, 5000)
  }

  /* ── Forgot Password Handler ─────────────────────────── */
  const handleForgotSubmit = (e) => {
    e.preventDefault()
    setForgotError('')
    const stored = getStoredUser()
    if (!stored) {
      setForgotError('No account found.')
      return
    }
    if (stored.email?.toLowerCase() !== forgotEmail.trim().toLowerCase()) {
      setForgotError('Email does not match our records.')
      return
    }
    setForgotStep('reset')
  }

  const handleResetPin = (e) => {
    e.preventDefault()
    setForgotError('')
    if (newPin.length < 4) {
      setForgotError('PIN must be at least 4 digits.')
      return
    }
    const stored = getStoredUser()
    if (stored) {
      stored.pin = newPin
      localStorage.setItem('securebank_user', JSON.stringify(stored))
    }
    setForgotStep('done')
    setTimeout(() => {
      setShowForgot(false)
      setForgotStep('email')
      setForgotEmail('')
      setNewPin('')
    }, 5000)
  }

  const openForgot = (e) => {
    e.preventDefault()
    setShowForgot(true)
    setForgotStep('email')
    setForgotEmail('')
    setNewPin('')
    setForgotError('')
  }

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-blob login-blob--1" />
        <div className="login-blob login-blob--2" />
        <div className="login-blob login-blob--3" />
        <div className="login-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="login-logo">
            <TDLogo size={72} className="td-logo" />
          </div>
          <div className="server-progress">
            <div className="server-progress-bar"><div className="server-progress-fill" /></div>
            <p className="server-progress-msg">{loadingMsg}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-screen">
      {/* Decorative blurred circles */}
      <div className="login-blob login-blob--1" />
      <div className="login-blob login-blob--2" />
      <div className="login-blob login-blob--3" />

      <div className="login-content">
        {/* Logo area */}
        <div className="login-logo">
          <TDLogo size={72} className="td-logo" />
          <h1 className="login-title">TD Bank</h1>
          <p className="login-subtitle">Sign in to continue</p>
        </div>

        {/* Glassmorphism card */}
        <form className="login-card" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="login-field">
            <label className="login-label" htmlFor="email">Email or Username</label>
            <input
              id="email"
              className="login-input"
              type="text"
              placeholder="you@example.com"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <input
                id="password"
                className="login-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Forgot link */}
          <div className="login-forgot-row">
            <a href="#forgot" className="login-forgot" onClick={openForgot}>Forgot password?</a>
          </div>

          {/* Error message */}
          {error && <p className="login-error">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Sign In'
            )}
          </button>

          {/* Divider */}
          <div className="login-divider">
            <span>or sign in with</span>
          </div>

          {/* Face ID */}
          <button
            type="button"
            className={`login-biometric ${faceIdState === 'scanning' ? 'login-biometric--scanning' : ''} ${faceIdState === 'denied' ? 'login-biometric--denied' : ''} ${faceIdState === 'success' ? 'login-biometric--success' : ''}`}
            onClick={handleFaceId}
            disabled={faceIdState === 'scanning'}
          >
            {faceIdState === 'scanning' ? (
              <>
                <div className="faceid-scan-ring" />
                <FaceIdIcon />
                <span className="login-biometric-label">Scanning…</span>
              </>
            ) : faceIdState === 'denied' ? (
              <>
                <FaceIdIcon />
                <span className="login-biometric-label login-biometric-label--denied">Access Denied</span>
              </>
            ) : faceIdState === 'success' ? (
              <>
                <FaceIdIcon />
                <span className="login-biometric-label login-biometric-label--success">Verified ✓</span>
              </>
            ) : (
              <>
                <FaceIdIcon />
                <span className="login-biometric-label">Face ID</span>
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="login-register">
          Don't have an account?{' '}
          <a href="#register" onClick={(e) => { e.preventDefault(); onRegister?.(); }}>Create one</a>
        </p>
      </div>

      {/* ── Forgot Password Modal ──────────────────────────── */}
      {showForgot && (
        <div className="forgot-overlay" onClick={() => setShowForgot(false)}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <button className="forgot-close" onClick={() => setShowForgot(false)} aria-label="Close">&times;</button>

            {forgotStep === 'email' && (
              <form onSubmit={handleForgotSubmit}>
                <div className="forgot-icon">🔑</div>
                <h2 className="forgot-title">Reset Password</h2>
                <p className="forgot-desc">Enter your registered email to verify your identity.</p>
                <input
                  className="forgot-input"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
                {forgotError && <p className="forgot-error">{forgotError}</p>}
                <button type="submit" className="forgot-btn">Verify Email</button>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPin}>
                <div className="forgot-icon">🔒</div>
                <h2 className="forgot-title">Set New PIN</h2>
                <p className="forgot-desc">Create a new 4-digit security PIN.</p>
                <input
                  className="forgot-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                {forgotError && <p className="forgot-error">{forgotError}</p>}
                <button type="submit" className="forgot-btn">Reset PIN</button>
              </form>
            )}

            {forgotStep === 'done' && (
              <div className="forgot-done">
                <div className="forgot-icon forgot-icon--success">✓</div>
                <h2 className="forgot-title">PIN Reset Successful</h2>
                <p className="forgot-desc">Your security PIN has been updated. You can now sign in.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

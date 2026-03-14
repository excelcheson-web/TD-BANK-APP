import { useState } from 'react'
import VaultLoader from './VaultLoader'
import TDLogo from './TDLogo'

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
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Check if a registered account exists
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('securebank_user') || 'null') } catch { return null }
    })()

    if (!stored) {
      setError('No account found. Please create an account first.')
      return
    }

    // Match email (case-insensitive)
    if (stored.email?.toLowerCase() !== email.trim().toLowerCase()) {
      setError('Invalid email or password.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(stored)
    }, 2200)
  }

  if (loading) {
    return <VaultLoader message="Verifying credentials…" />
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
            <a href="#forgot" className="login-forgot">Forgot password?</a>
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
            className="login-biometric"
            onClick={() => {
              const stored = (() => { try { return JSON.parse(localStorage.getItem('securebank_user') || 'null') } catch { return null } })()
              if (stored) { onLogin(stored) } else { setError('No account found. Please create an account first.') }
            }}
          >
            <FaceIdIcon />
            <span className="login-biometric-label">Face ID</span>
          </button>
        </form>

        {/* Register link */}
        <p className="login-register">
          Don&apos;t have an account?{' '}
          <a href="#register" onClick={(e) => { e.preventDefault(); onRegister?.(); }}>Create one</a>
        </p>
      </div>
    </div>
  )
}

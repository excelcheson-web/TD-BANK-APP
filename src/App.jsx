import { useState, useEffect } from 'react'
import VaultLoader from './components/VaultLoader'
import LoginScreen from './components/LoginScreen'
import OnboardingFlow from './components/OnboardingFlow'
import Dashboard from './components/Dashboard'
import SecurityLock from './components/SecurityLock'
import { registerUser, getUserProfile, onAuthChange, logoutUser } from './services/supabaseAuth'
import { supabase } from './services/supabaseClient'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState(null)
  // authLoading stays true until Supabase resolves the session — prevents React #310 flash
  const [authLoading, setAuthLoading] = useState(true)
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [registering, setRegistering] = useState(false)

  // ── Optimized Auth Handshake ──────────────────────────────
  // Step 1: supabase.auth.getSession() reads the persisted session from
  //         localStorage synchronously (~0 ms) — this is what prevents
  //         the React #310 "guessing" flash on every refresh.
  // Step 2: onAuthStateChange listens for subsequent changes
  //         (login, logout, token auto-refresh) so the UI stays in sync.
  useEffect(() => {
    let isMounted = true
    let initialResolved = false

    // Shared helper — resolves a Supabase user into a profile and updates state
    const resolveAuth = async (supabaseUser) => {
      if (!isMounted) return
      if (supabaseUser) {
        const profile = await getUserProfile(supabaseUser.id)
        if (!isMounted) return
        if (profile) {
          setUser(profile)
          localStorage.setItem('securebank_user', JSON.stringify(profile))
          localStorage.setItem('user_account_type', profile.accountType || 'Savings Account')
          localStorage.setItem('user_email', profile.email || '')
          localStorage.setItem('user_name', profile.name || profile.full_name || '')
          localStorage.setItem('bank_balance', String(profile.balance ?? 0))
        } else {
          // Auth user exists but no profile row — clear state
          setUser(null)
          clearLocalStorage()
        }
      } else {
        setUser(null)
      }
      if (isMounted) setAuthLoading(false)
    }

    // ── Primary: immediate session check from localStorage ──
    // getSession() reads the persisted token from localStorage (~0 ms,
    // no network round-trip needed). This resolves authLoading well
    // before the 5-second vault splash ends, eliminating the #310 flash.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!initialResolved) {
        initialResolved = true
        if (error) {
          // Stale / invalid refresh token (HTTP 400 "Refresh Token Not Found").
          // signOut() wipes the bad token from localStorage so the error
          // never appears again on the next page load.
          supabase.auth.signOut().catch(() => {})
          clearLocalStorage()
          if (isMounted) {
            setUser(null)
            setAuthLoading(false)
          }
        } else {
          resolveAuth(session?.user || null)
        }
      }
    }).catch(() => {
      if (!initialResolved && isMounted) {
        initialResolved = true
        setUser(null)
        setAuthLoading(false)
      }
    })

    // ── Secondary: react to future auth changes ─────────────
    // Fires on: login, logout, token refresh, tab focus with expired token
    const unsubscribe = onAuthChange((supabaseUser) => {
      if (!initialResolved) {
        // Race: onAuthStateChange fired before getSession resolved
        initialResolved = true
        resolveAuth(supabaseUser)
      } else {
        // Subsequent change after initial load — keep UI in sync
        resolveAuth(supabaseUser)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Initialize bank_balance in localStorage if not set
  useEffect(() => {
    if (localStorage.getItem('bank_balance') === null) {
      localStorage.setItem('bank_balance', '0')
    }
  }, [])

  // Show vault splash on first load (5 seconds)
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const handleRetry = () => {
    setAuthTimedOut(false)
    setAuthLoading(true)
    window.location.reload()
  }

  // Show loader while booting OR while Supabase is resolving the session
  if (booting || authLoading) {
    if (authTimedOut) {
      return (
        <div className="vault-loader-screen">
          <p className="vault-message" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Connection Timed Out</p>
          <p className="vault-message" style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem' }}>
            Unable to reach the server. Please check your connection and try again.
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: '12px 32px', borderRadius: '8px', border: 'none',
              background: '#008a00', color: '#fff', fontSize: '1rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return <VaultLoader message="Welcome to TD Bank" />
  }

  if (registering) {
    return (
      <OnboardingFlow
        onComplete={async (data) => {
          try {
            const profile = await registerUser(data.email, data.password, {
              name: data.fullName,
              accountNumber: data.accountNumber,
              accountType: data.accountType,
              pin: data.pin,
              profilePic: data.profilePic || '',
            })
            localStorage.setItem('securebank_user', JSON.stringify(profile))
            localStorage.setItem('user_account_type', profile.accountType || data.accountType)
            localStorage.setItem('user_email', profile.email || data.email)
            localStorage.setItem('user_name', profile.name || data.fullName)
            localStorage.setItem('bank_balance', '0')
            setUser(profile)
            setRegistering(false)
          } catch (err) {
            alert(err.message)
          }
        }}
      />
    )
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(u) => {
          setUser(u)
          localStorage.setItem('securebank_user', JSON.stringify(u))
          localStorage.setItem('user_account_type', u.accountType || 'Savings Account')
          localStorage.setItem('user_email', u.email || '')
          localStorage.setItem('user_name', u.name || u.full_name || '')
          localStorage.setItem('bank_balance', String(u.balance ?? 0))
        }}
        onRegister={() => setRegistering(true)}
      />
    )
  }

  const handleForceLogout = async () => {
    try { await logoutUser() } catch { /* silent */ }
    clearLocalStorage()
    setUser(null)
  }

  return (
    <SecurityLock onForceLogout={handleForceLogout}>
      {/* Pass as `profile` — Dashboard expects `profile` prop, not `user` */}
      <Dashboard profile={user} onLogout={() => {
        clearLocalStorage()
        setUser(null)
      }} />
    </SecurityLock>
  )
}

// Clear all auth-related localStorage keys on logout
function clearLocalStorage() {
  localStorage.removeItem('securebank_user')
  localStorage.removeItem('user_account_type')
  localStorage.removeItem('user_email')
  localStorage.removeItem('user_name')
  localStorage.removeItem('privacy_state')
}

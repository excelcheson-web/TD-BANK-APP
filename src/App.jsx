import { useState, useEffect } from 'react'
import VaultLoader from './components/VaultLoader'
import LoginScreen from './components/LoginScreen'
import OnboardingFlow from './components/OnboardingFlow'
import Dashboard from './components/Dashboard'
import SecurityLock from './components/SecurityLock'
import { registerUser, getUserProfile, onAuthChange, logoutUser } from './services/supabaseAuth'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [registering, setRegistering] = useState(false)

  // Listen for Supabase Auth state changes and persist session
  useEffect(() => {
    let unsubSnapshot = null
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) setAuthTimedOut(true)
    }, 5000)

    const unsub = onAuthChange(async (firebaseUser) => {
      resolved = true
      clearTimeout(timeout)
      setAuthTimedOut(false)
      if (unsubSnapshot) { unsubSnapshot(); unsubSnapshot = null }
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        if (profile) {
          setUser(profile)
          localStorage.setItem('securebank_user', JSON.stringify(profile))
          localStorage.setItem('user_account_type', profile.accountType)
          localStorage.setItem('user_email', profile.email)
          localStorage.setItem('user_name', profile.full_name)
          localStorage.setItem('bank_balance', String(profile.balance || 0))
        }
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })
    // On mount, try to restore session from localStorage
    const stored = localStorage.getItem('securebank_user')
    if (stored && !user) {
      try {
        setUser(JSON.parse(stored))
        setAuthLoading(false)
      } catch {}
    }
    return () => { clearTimeout(timeout); unsub(); if (unsubSnapshot) unsubSnapshot() }
  }, [])

  // Initialize bank_balance in localStorage if not set
  useEffect(() => {
    if (localStorage.getItem('bank_balance') === null) {
      localStorage.setItem('bank_balance', '0')
    }
  }, [])

  // Show vault splash on first load
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const handleRetry = () => {
    setAuthTimedOut(false)
    setAuthLoading(true)
    window.location.reload()
  }

  if (booting || authLoading) {
    if (authTimedOut) {
      return (
        <div className="vault-loader-screen">
          <p className="vault-message" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Connection Timed Out</p>
          <p className="vault-message" style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem' }}>Unable to reach the server. Please check your connection and try again.</p>
          <button onClick={handleRetry} style={{
            padding: '12px 32px', borderRadius: '8px', border: 'none',
            background: '#008a00', color: '#fff', fontSize: '1rem',
            fontWeight: 600, cursor: 'pointer'
          }}>Retry</button>
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
            localStorage.setItem('user_account_type', data.accountType)
            localStorage.setItem('user_email', data.email)
            localStorage.setItem('user_name', data.fullName)
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
        onLogin={(u) => setUser(u)}
        onRegister={() => setRegistering(true)}
      />
    )
  }

  const handleForceLogout = async () => {
    await logoutUser()
    setUser(null)
  }

  return (
    <SecurityLock onForceLogout={handleForceLogout}>
      <Dashboard user={user} onLogout={() => setUser(null)} />
    </SecurityLock>
  )
}

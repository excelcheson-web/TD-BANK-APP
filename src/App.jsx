import { useState, useEffect } from 'react'
import VaultLoader from './components/VaultLoader'
import LoginScreen from './components/LoginScreen'
import OnboardingFlow from './components/OnboardingFlow'
import Dashboard from './components/Dashboard'
import SecurityLock from './components/SecurityLock'
import { registerUser, getUserProfile, onAuthChange, logoutUser } from './services/firebaseAuth'

export default function App() {
  const [booting, setBooting]         = useState(true)
  const [user, setUser]               = useState(null)
  // authLoading stays true until Firebase's onAuthStateChanged fires once.
  // This prevents the React #310 "flash of unauthenticated content" on refresh.
  const [authLoading, setAuthLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  // ── Firebase auth state listener ─────────────────────────
  // onAuthStateChanged fires immediately with the persisted session (or null).
  // We wait for that first callback before rendering any screen.
  useEffect(() => {
    // Safety net: if onAuthStateChanged never fires (e.g. network issue),
    // force authLoading to false after 8 s so the app never stays white.
    const safetyTimer = setTimeout(() => setAuthLoading(false), 8000)

    const unsub = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in — fetch their Firestore profile
          const profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            setUser(profile)
            try {
              // Avoid storing large base64 profilePic in localStorage
              const lsProfile = { ...profile }
              if (lsProfile.profilePic && lsProfile.profilePic.length > 5000) {
                lsProfile.profilePic = ''
                lsProfile.profile_pic = ''
              }
              localStorage.setItem('securebank_user',   JSON.stringify(lsProfile))
              localStorage.setItem('user_account_type', profile.accountType || '')
              localStorage.setItem('user_email',        profile.email       || '')
              localStorage.setItem('user_name',         profile.full_name   || '')
              localStorage.setItem('bank_balance',      String(profile.balance ?? 0))
            } catch (storageErr) {
              console.warn('[App] localStorage write failed (quota?):', storageErr.message)
            }
          } else {
            // Auth token exists but no Firestore profile — sign out cleanly
            try { await logoutUser() } catch { /* silent */ }
            clearLocalStorage()
            setUser(null)
          }
        } else {
          // No session
          setUser(null)
        }
      } catch (err) {
        console.warn('[App] auth callback error:', err)
        setUser(null)
      } finally {
        // Always resolve authLoading — prevents permanent white screen
        clearTimeout(safetyTimer)
        setAuthLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      unsub()
    }
  }, [])

  // Show vault splash on first load (5 seconds)
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 5000)
    return () => clearTimeout(t)
  }, [])

  // Show loader while vault is booting OR while Firebase auth hasn't resolved yet
  if (booting || authLoading) {
    return <VaultLoader message="Welcome to TD Bank" />
  }

  if (registering) {
    return (
      <OnboardingFlow
        onComplete={async (data) => {
          try {
            const profile = await registerUser({
              email: data.email,
              password: data.password,
              name: data.fullName,
              accountNumber: data.accountNumber,
              accountType: data.accountType,
              pin: data.pin,
              profilePic: data.profilePic || '',
            })
            // Wipe any previous user's data (transfer_history, notifications,
            // balance etc.) before writing the new account's data so a fresh
            // account always starts with an empty transaction history.
            clearLocalStorage()
            try {
              // Avoid storing large base64 profilePic in localStorage
              const lsProfile = { ...profile }
              if (lsProfile.profilePic && lsProfile.profilePic.length > 5000) {
                lsProfile.profilePic = ''
                lsProfile.profile_pic = ''
              }
              localStorage.setItem('securebank_user', JSON.stringify(lsProfile))
              localStorage.setItem('user_account_type', profile.accountType || data.accountType)
              localStorage.setItem('user_name', profile.name || data.fullName)
              localStorage.setItem('bank_balance', '0')
            } catch (storageErr) {
              console.warn('[App] localStorage write failed (quota?):', storageErr.message)
            }
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
          try {
            const lsUser = { ...u }
            if (lsUser.profilePic && lsUser.profilePic.length > 5000) {
              lsUser.profilePic = ''
              lsUser.profile_pic = ''
            }
            localStorage.setItem('securebank_user', JSON.stringify(lsUser))
            localStorage.setItem('user_account_type', u.accountType || 'Savings Account')
            localStorage.setItem('user_name', u.name || u.full_name || '')
            localStorage.setItem('bank_balance', String(u.balance ?? 0))
          } catch (storageErr) {
            console.warn('[App] localStorage write failed (quota?):', storageErr.message)
          }
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

function clearLocalStorage() {
  // Auth & profile
  localStorage.removeItem('securebank_user')
  localStorage.removeItem('user_account_type')
  localStorage.removeItem('user_name')
  // Balance — must reset so new user starts at 0
  localStorage.removeItem('bank_balance')
  // Transaction history — the source of the "ghost transactions" bug
  localStorage.removeItem('transfer_history')
  // Notifications
  localStorage.removeItem('securebank_notifications')
  localStorage.removeItem('email_notifications_log')
  // UI state
  localStorage.removeItem('privacy_state')
  localStorage.removeItem('system_notification_dismissed')
}

import { useState, useEffect } from 'react'
import VaultLoader from './components/VaultLoader'
import LoginScreen from './components/LoginScreen'
import OnboardingFlow from './components/OnboardingFlow'
import Dashboard from './components/Dashboard'
import SecurityLock from './components/SecurityLock'
import { registerUser, getUserProfile, onAuthChange, syncCloudToLocal } from './services/firebase'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        if (profile) {
          setUser(profile)
          // Keep localStorage in sync for EmailJS and other features
          localStorage.setItem('securebank_user', JSON.stringify(profile))
          localStorage.setItem('user_account_type', profile.accountType)
          localStorage.setItem('user_email', profile.email)
          localStorage.setItem('user_name', profile.name)
          localStorage.setItem('bank_balance', String(profile.balance || 0))
          // Pull transfer history from cloud
          await syncCloudToLocal(firebaseUser.uid).catch(() => {})
        }
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })
    return () => unsub()
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

  if (booting || authLoading) {
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

  return (
    <SecurityLock>
      <Dashboard user={user} onLogout={() => setUser(null)} />
    </SecurityLock>
  )
}

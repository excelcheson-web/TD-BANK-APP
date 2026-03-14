import { useState, useEffect } from 'react'
import VaultLoader from './components/VaultLoader'
import LoginScreen from './components/LoginScreen'
import OnboardingFlow from './components/OnboardingFlow'
import Dashboard from './components/Dashboard'
import SecurityLock from './components/SecurityLock'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState(null)
  const [registering, setRegistering] = useState(false)

  // Initialize bank_balance in localStorage if not set
  useEffect(() => {
    if (localStorage.getItem('bank_balance') === null) {
      localStorage.setItem('bank_balance', '0')
    }
  }, [])

  // Show vault splash on first load
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2000)
    return () => clearTimeout(t)
  }, [])

  if (booting) {
    return <VaultLoader message="Welcome to TD Bank" />
  }

  if (registering) {
    return (
      <OnboardingFlow
        onComplete={(data) => {
          setRegistering(false)
          const u = { email: data.email, name: data.fullName, accountNumber: data.accountNumber, profilePic: data.profilePic || '', pin: data.pin }
          localStorage.setItem('securebank_user', JSON.stringify(u))
          setUser(u)
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

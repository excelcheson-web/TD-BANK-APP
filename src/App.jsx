
import { useState, useEffect, useCallback } from 'react'
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
  const [isLoading, setIsLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  // Supabase session persistence and auth state
  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    checkSession();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setIsLocked(false);
    });

    // 3. Inactivity Timers
    let lockTimer, logoutTimer;
    const resetTimers = () => {
      clearTimeout(lockTimer);
      clearTimeout(logoutTimer);
      if (user) {
        lockTimer = setTimeout(() => setIsLocked(true), 60000); // 60s Lock
        logoutTimer = setTimeout(() => supabase.auth.signOut(), 1200000); // 20m Logout
      }
    };
    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('mousedown', resetTimers);
    resetTimers();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('mousedown', resetTimers);
    };
  }, [user]);

  // Inactivity & auto-lock timers
  useEffect(() => {
    let lockTimer, logoutTimer;
    const lockCallback = () => {
      window.dispatchEvent(new CustomEvent('app-lock'));
    };
    const logoutCallback = () => {
      window.dispatchEvent(new CustomEvent('app-force-logout'));
    };
    const resetTimers = () => {
      clearTimeout(lockTimer);
      clearTimeout(logoutTimer);
      lockTimer = setTimeout(lockCallback, 60000); // 60s
      logoutTimer = setTimeout(logoutCallback, 1200000); // 20m
    };
    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('keypress', resetTimers);
    resetTimers();
    return () => {
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('keypress', resetTimers);
      clearTimeout(lockTimer);
      clearTimeout(logoutTimer);
    };
  }, []);

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

  if (booting || isLoading) {
    return <VaultLoader message="Welcome to TD Bank" />;
  }

  if (isLocked) {
    return <SecurityLock onUnlock={() => setIsLocked(false)} />;
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

  const handleForceLogout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  // Listen for global lock/logout events
  useEffect(() => {
    const lockListener = () => {
      // Show lock overlay (handled by SecurityLock)
      window.dispatchEvent(new CustomEvent('show-lock'));
    };
    const logoutListener = () => {
      handleForceLogout();
    };
    window.addEventListener('app-lock', lockListener);
    window.addEventListener('app-force-logout', logoutListener);
    return () => {
      window.removeEventListener('app-lock', lockListener);
      window.removeEventListener('app-force-logout', logoutListener);
    };
  }, [handleForceLogout]);

  return (
    <Dashboard user={user} onLogout={() => setUser(null)} />
  );
}

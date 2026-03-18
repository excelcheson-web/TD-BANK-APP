
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [appLocked, setAppLocked] = useState(false)

  // Supabase session persistence and auth state
  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsCheckingAuth(false);
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setAppLocked(false);
    });

    // 3. Inactivity Timers
    let lockTimer, logoutTimer;
    const resetSecurityTimers = () => {
      clearTimeout(lockTimer);
      clearTimeout(logoutTimer);
      if (user) {
        lockTimer = setTimeout(() => setAppLocked(true), 60000); // 60s Lock
        logoutTimer = setTimeout(() => supabase.auth.signOut(), 1200000); // 20m Logout
      }
    };
    window.onmousemove = resetSecurityTimers;
    window.onkeydown = resetSecurityTimers;
    resetSecurityTimers();

    return () => {
      subscription.unsubscribe();
      window.onmousemove = null;
      window.onkeydown = null;
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

  if (booting || isCheckingAuth) {
    return <div className="loading-spinner">TD Global Securing Session...</div>;
  }

  if (appLocked) {
    return <SecurityLock onUnlock={() => setAppLocked(false)} />;
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
    <Dashboard profile={user} onLogout={() => setUser(null)} />
  );
}

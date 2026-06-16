import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import api from './lib/api'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OnboardingKey from './pages/OnboardingKey'
import OnboardingMode from './pages/OnboardingMode'
import Nav from './components/Nav'
import LoadingScreen from './components/LoadingScreen'
import type { Session } from '@supabase/supabase-js'

type Screen = 'loading' | 'landing' | 'login' | 'signup' | 'onboarding-key' | 'onboarding-mode' | 'app'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [screen, setScreen] = useState<Screen>('loading')
  const [userMode, setUserMode] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        const path = window.location.pathname
        if (path === '/signup') setScreen('signup')
        else if (path === '/login') setScreen('login')
        else setScreen('landing')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setScreen('login')
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    initUser()
  }, [session])

  async function initUser() {
    setScreen('loading')
    try {
      await api.post('/api/users/sync')
      const { data } = await api.get('/api/users/profile')
      setUserMode(data.mode)

      if (!data.hasKey) {
        setScreen('onboarding-key')
        return
      }

      const { data: keyStatus } = await api.get('/api/keys/validate')
      if (!keyStatus.valid) {
        setScreen('onboarding-key')
        return
      }

      if (!data.mode) {
        setScreen('onboarding-mode')
      } else {
        setScreen('app')
      }
    } catch {
      setScreen('login')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUserMode(null)
    setScreen('login')
  }

  if (screen === 'loading') return <LoadingScreen />

  if (screen === 'landing') return <Landing />
  if (screen === 'signup') return <Signup />
  if (screen === 'login') return <Login />

  if (screen === 'onboarding-key') {
    return <OnboardingKey onDone={() => setScreen('onboarding-mode')} />
  }

  if (screen === 'onboarding-mode') {
    return (
      <OnboardingMode
        onBack={() => setScreen('onboarding-key')}
        onDone={(mode) => {
          setUserMode(mode)
          setScreen('app')
        }}
      />
    )
  }

  // Logged-in placeholder — will be replaced by Dashboard in Block E
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Nav
        logoHref="#"
        rightSlot={
          <button onClick={handleLogout} className="text-ink-secondary text-sm hover:text-ink transition-colors">
            Sign out
          </button>
        }
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-secondary text-sm mb-1">Logged in as {session?.user.email}</p>
          <p className="text-ink-secondary text-sm">Mode: <span className="text-accent-text">{userMode}</span></p>
        </div>
      </div>
    </div>
  )
}

export default App

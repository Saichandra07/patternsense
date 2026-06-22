import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import api from './lib/api'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OnboardingKey from './pages/OnboardingKey'
import OnboardingMode from './pages/OnboardingMode'
import Home from './pages/Home'
import DashboardGuided from './pages/DashboardGuided'
import SessionPage from './pages/SessionPage'
import WeaknessMap from './pages/WeaknessMap'
import Roadmap from './pages/Roadmap'
import LoadingScreen from './components/LoadingScreen'
import type { Session } from '@supabase/supabase-js'

type Screen =
  | 'loading' | 'landing' | 'login' | 'signup'
  | 'onboarding-key' | 'onboarding-mode'
  | 'home' | 'session' | 'weakness-map' | 'roadmap'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [screen, setScreen] = useState<Screen>('loading')
  const [userMode, setUserMode] = useState<string | null>(null)
  const [sessionUrl, setSessionUrl] = useState<string>('')
  const isInitialized = useRef(false)

  useEffect(() => {
    // Initial load — check existing session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        initUser()
      } else {
        const path = window.location.pathname
        if (path === '/signup') setScreen('signup')
        else if (path === '/login') setScreen('login')
        else setScreen('landing')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (!session) {
        isInitialized.current = false
        setScreen('login')
      } else if (event === 'SIGNED_IN' && !isInitialized.current) {
        initUser()
      }
      // TOKEN_REFRESHED, INITIAL_SESSION, session recovery: do nothing
    })

    return () => subscription.unsubscribe()
  }, [])

  async function initUser() {
    isInitialized.current = true
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
        setScreen('home')
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

  function startSession(url: string) {
    setSessionUrl(url)
    setScreen('session')
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
          setScreen('home')
        }}
      />
    )
  }

  if (screen === 'home') {
    if (userMode === 'guided') {
      return (
        <DashboardGuided
          onStart={startSession}
          onLogout={handleLogout}
          onWeaknessMap={() => setScreen('weakness-map')}
          onRoadmap={() => setScreen('roadmap')}
        />
      )
    }
    return (
      <Home
        onStart={startSession}
        onLogout={handleLogout}
        onWeaknessMap={() => setScreen('weakness-map')}
      />
    )
  }

  if (screen === 'session') {
    return (
      <SessionPage
        url={sessionUrl}
        onBack={() => setScreen('home')}
        onLogout={handleLogout}
      />
    )
  }

  if (screen === 'weakness-map') {
    return (
      <WeaknessMap
        onBack={() => setScreen('home')}
        onLogout={handleLogout}
      />
    )
  }

  if (screen === 'roadmap') {
    return (
      <Roadmap
        onBack={() => setScreen('home')}
        onStart={startSession}
        onLogout={handleLogout}
      />
    )
  }

  return null
}

export default App

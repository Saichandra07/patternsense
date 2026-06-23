import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import api from './lib/api'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OnboardingKey from './pages/OnboardingKey'
import Home from './pages/Home'
import SessionPage from './pages/SessionPage'
import WeaknessMap from './pages/WeaknessMap'
import Roadmap from './pages/Roadmap'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'
import LoadingScreen from './components/LoadingScreen'
import type { Session } from '@supabase/supabase-js'

type Screen =
  | 'loading' | 'landing' | 'login' | 'signup'
  | 'onboarding-key'
  | 'home' | 'session' | 'weakness-map' | 'roadmap' | 'settings'

export type SessionSource =
  | { type: 'url'; url: string }
  | { type: 'paste'; title: string; text: string }
  | {
      type: 'resume'
      sessionId: string
      problem: { slug: string; title: string; difficulty: string; description: string; topicTags?: string[] }
      messages: { role: 'user' | 'assistant'; content: string }[]
      phase: number
      sessionState: string
    }

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [screen, setScreen] = useState<Screen>('loading')
  const [sessionSource, setSessionSource] = useState<SessionSource>({ type: 'url', url: '' })
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

      if (!data.hasKey) {
        setScreen('onboarding-key')
        return
      }

      const { data: keyStatus } = await api.get('/api/keys/validate')
      if (!keyStatus.valid) {
        setScreen('onboarding-key')
        return
      }

      setScreen('home')
    } catch {
      setScreen('login')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setScreen('login')
  }

  function startSession(url: string) {
    setSessionSource({ type: 'url', url })
    setScreen('session')
  }

  function startSessionPaste(title: string, text: string) {
    setSessionSource({ type: 'paste', title, text })
    setScreen('session')
  }

  function startSessionResume(
    sessionId: string,
    problem: { slug: string; title: string; difficulty: string; description: string; topicTags?: string[] },
    messages: { role: 'user' | 'assistant'; content: string }[],
    phase: number,
    sessionState: string
  ) {
    setSessionSource({ type: 'resume', sessionId, problem, messages, phase, sessionState })
    setScreen('session')
  }

  if (screen === 'loading') return <LoadingScreen />

  if (screen === 'landing') return <Landing />
  if (screen === 'signup') return <Signup />
  if (screen === 'login') return <Login />

  if (screen === 'onboarding-key') {
    return <OnboardingKey onDone={() => setScreen('home')} />
  }

  if (screen === 'session') {
    return (
      <SessionPage
        source={sessionSource}
        onBack={() => setScreen('home')}
        onLogout={handleLogout}
      />
    )
  }

  if (['home', 'roadmap', 'weakness-map', 'settings'].includes(screen)) {
    return (
      <div className="flex h-screen overflow-hidden bg-page">
        <Sidebar
          activeScreen={screen}
          onNavigate={s => setScreen(s)}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-y-auto">
          {screen === 'home' && (
            <Home
              onStart={startSession}
              onStartPaste={startSessionPaste}
              onResume={startSessionResume}
            />
          )}
          {screen === 'roadmap' && <Roadmap onStart={startSession} />}
          {screen === 'weakness-map' && <WeaknessMap />}
          {screen === 'settings' && <Settings />}
        </div>
      </div>
    )
  }

  return null
}

export default App

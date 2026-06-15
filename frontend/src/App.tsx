import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import type { Session } from '@supabase/supabase-js'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    axios.get(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(res => setUserId(res.data.userId))
      .catch(() => setUserId('error — token rejected'))
  }, [session])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUserId('')
  }

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'monospace' }}>Loading...</div>

  const path = window.location.pathname
  if (!session) {
    if (path === '/signup') return <Signup />
    return <Login />
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>PatternSense</h1>
      <p>Logged in as: <strong>{session.user.email}</strong></p>
      <p>Backend userId: <strong>{userId || 'fetching...'}</strong></p>
      <button onClick={handleLogout}>Sign out</button>
    </div>
  )
}

export default App

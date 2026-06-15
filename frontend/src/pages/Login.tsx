import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173' }
    })
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'monospace' }}>
      <h2>Sign in to PatternSense</h2>

      <button
        onClick={handleGoogleLogin}
        style={{ width: '100%', padding: 10, marginBottom: 16, cursor: 'pointer' }}
      >
        Continue with Google
      </button>

      <div style={{ textAlign: 'center', marginBottom: 16, color: '#888' }}>or</div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onPaste={e => setPassword(e.clipboardData.getData('text/plain'))}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p>No account? <a href="/signup">Sign up</a></p>
    </div>
  )
}

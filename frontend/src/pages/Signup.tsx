import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173' }
    })
  }

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'monospace' }}>
        <h2>Check your email</h2>
        <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        <a href="/login">Back to sign in</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'monospace' }}>
      <h2>Create your PatternSense account</h2>

      <button
        onClick={handleGoogleSignup}
        style={{ width: '100%', padding: 10, marginBottom: 16, cursor: 'pointer' }}
      >
        Continue with Google
      </button>

      <div style={{ textAlign: 'center', marginBottom: 16, color: '#888' }}>or</div>

      <form onSubmit={handleSignup}>
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
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p>Already have an account? <a href="/login">Sign in</a></p>
    </div>
  )
}

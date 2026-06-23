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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173' }
    })
  }

  return (
    <div className="min-h-screen bg-page flex flex-col relative overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{
          top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '700px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 65%)'
        }} />
        <div className="absolute" style={{
          bottom: '-80px', right: '-100px',
          width: '400px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)'
        }} />
      </div>

      {/* ── Decorative floating app elements ── */}

      {/* Top-left: pattern chip */}
      <div className="absolute top-24 left-10 opacity-20 rotate-[-8deg] pointer-events-none hidden md:block">
        <div className="flex flex-col gap-2">
          {['Arrays & Hashing', 'Two Pointers', 'Sliding Window'].map(p => (
            <div key={p} className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent-text"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
              ◆ {p}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-left: dialogue bubble */}
      <div className="absolute bottom-24 left-8 opacity-15 rotate-[6deg] pointer-events-none hidden md:block" style={{ maxWidth: '260px' }}>
        <div className="px-4 py-3 rounded-xl text-xs text-ink leading-relaxed"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <p className="text-accent-text text-xs font-semibold mb-1">PATTERNSENSE</p>
          What about this problem tells you to use a sliding window?
        </div>
      </div>

      {/* Top-right: user response bubble */}
      <div className="absolute top-32 right-8 opacity-15 rotate-[5deg] pointer-events-none hidden md:block" style={{ maxWidth: '240px' }}>
        <div className="px-4 py-3 rounded-xl text-xs text-ink-secondary leading-relaxed bg-elevated"
          style={{ border: '1px solid #232330' }}>
          <p className="text-ink-muted text-xs font-semibold mb-1">YOU</p>
          We're looking for a continuous range that can shrink and expand...
        </div>
      </div>

      {/* Bottom-right: confidence chip */}
      <div className="absolute bottom-32 right-10 opacity-20 rotate-[-4deg] pointer-events-none hidden md:block">
        <div className="flex flex-col gap-2">
          {[
            { label: 'Sliding Window', score: 82, color: '#10B981' },
            { label: 'Binary Search', score: 61, color: '#F59E0B' },
            { label: 'Two Pointers', score: 45, color: '#EF4444' },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface"
              style={{ border: '1px solid #232330', minWidth: '200px' }}>
              <span className="text-ink-secondary text-xs flex-1">{p.label}</span>
              <div className="h-1.5 w-16 rounded-full bg-elevated overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: p.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: p.color }}>{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center-left: active problem card */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 opacity-15 rotate-[4deg] pointer-events-none hidden md:block">
        <div className="px-4 py-3 rounded-xl" style={{ background: '#111118', border: '1px solid #232330', maxWidth: '210px' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>Medium</div>
            <span className="text-ink-muted text-xs ml-auto">LC 3</span>
          </div>
          <p className="text-ink text-xs font-semibold mb-1 leading-snug">Longest Substring Without Repeating Chars</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-accent-text text-xs">Phase 2 — Solving</span>
          </div>
        </div>
      </div>

      {/* Center-right: user stats */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-15 rotate-[-2deg] pointer-events-none hidden md:block">
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Current streak', value: '7 days', color: '#F59E0B' },
            { label: 'Sessions done', value: '23', color: '#A78BFA' },
            { label: 'Problems solved', value: '41', color: '#10B981' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#111118', border: '1px solid #232330', minWidth: '175px' }}>
              <span className="text-ink-muted text-xs">{s.label}</span>
              <span className="ml-auto text-xs font-semibold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5">
        <a href="/" className="flex items-center gap-2.5 font-bold text-lg text-ink no-underline">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white text-sm">◆</div>
          PatternSense
        </a>
        <a href="/signup" className="text-ink-secondary text-sm hover:text-ink transition-colors">
          No account? <span className="text-accent-text">Sign up free</span>
        </a>
      </div>

      {/* ── Form card ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
        <div className="w-full" style={{ maxWidth: '400px' }}>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-ink font-bold mb-2" style={{ fontSize: '30px', letterSpacing: '-0.8px' }}>
              Welcome back
            </h1>
            <p className="text-ink-secondary text-sm">Sign in to continue your sessions</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6"
            style={{
              background: 'rgba(17,17,24,0.85)',
              border: '1px solid rgba(35,35,48,0.8)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 24px 48px rgba(0,0,0,0.4)'
            }}>

            {/* Google */}
            <button onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-ink text-sm font-medium mb-4 hover:border-ink-muted transition-all active:scale-[0.98]"
              style={{ background: '#18181F', border: '1px solid #232330' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#232330' }} />
              <span className="text-ink-muted text-xs">or</span>
              <div className="flex-1 h-px" style={{ background: '#232330' }} />
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-ink text-sm focus:outline-none transition-colors"
                style={{ background: '#18181F', border: '1px solid #232330', placeholder: '#4E4C5E' }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onPaste={e => { e.preventDefault(); setPassword(e.clipboardData.getData('text/plain')) }}
                className="w-full rounded-xl px-4 py-3 text-ink text-sm focus:outline-none transition-colors"
                style={{ background: '#18181F', border: '1px solid #232330' }}
                required
              />
              {error && <p className="text-xs" style={{ color: '#F59E0B' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:active:scale-100"
                style={{ background: loading ? '#5B21B6' : '#7C3AED', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

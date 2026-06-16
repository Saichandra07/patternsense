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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173' }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center px-6 relative overflow-hidden"
        style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.15) 0%, transparent 65%)' }} />
        <div className="text-center relative z-10" style={{ maxWidth: '400px' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l6 6 12-12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-ink font-bold mb-3" style={{ fontSize: '26px', letterSpacing: '-0.5px' }}>Check your inbox</h2>
          <p className="text-ink-secondary text-sm leading-relaxed mb-8">
            Confirmation link sent to <span className="text-ink font-semibold">{email}</span>.<br/>
            Click it to activate your account.
          </p>
          <a href="/login"
            className="inline-flex items-center gap-2 text-ink-secondary text-sm px-5 py-2.5 rounded-xl hover:text-ink transition-colors"
            style={{ background: '#18181F', border: '1px solid #232330' }}>
            ← Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex flex-col relative overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{
          top: '-80px', right: '-80px',
          width: '600px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 65%)'
        }} />
        <div className="absolute" style={{
          bottom: '-100px', left: '-60px',
          width: '500px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)'
        }} />
      </div>

      {/* ── Decorative floating elements (different from login for variety) ── */}

      {/* Top-left: session phase indicator */}
      <div className="absolute top-20 left-8 opacity-20 rotate-[6deg] pointer-events-none hidden md:block">
        <div className="flex flex-col gap-1.5">
          {[
            { phase: 'Phase 1', label: 'Comprehension', done: true },
            { phase: 'Phase 2', label: 'Solving', active: true },
            { phase: 'Phase 3', label: 'Verification', done: false },
          ].map(p => (
            <div key={p.phase} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: p.active ? 'rgba(124,58,237,0.12)' : '#111118',
                border: p.active ? '1px solid rgba(124,58,237,0.3)' : '1px solid #232330',
                minWidth: '200px'
              }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: p.done ? '#10B981' : p.active ? '#7C3AED' : '#4E4C5E' }} />
              <span className="text-xs" style={{ color: p.active ? '#A78BFA' : '#8B879E' }}>{p.phase}</span>
              <span className="text-xs ml-auto" style={{ color: p.active ? '#EEEDF8' : '#4E4C5E' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top-right: dialogue */}
      <div className="absolute top-24 right-8 opacity-15 rotate-[-5deg] pointer-events-none hidden md:block" style={{ maxWidth: '250px' }}>
        <div className="px-4 py-3 rounded-xl text-xs leading-relaxed"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <p className="text-accent-text text-xs font-semibold mb-1">PATTERNSENSE</p>
          <span className="text-ink">Good instinct. What in the problem tells you that?</span>
        </div>
      </div>

      {/* Bottom-left: roadmap strip */}
      <div className="absolute bottom-20 left-6 opacity-18 rotate-[-3deg] pointer-events-none hidden md:block">
        <div className="flex gap-2">
          {['Arrays', 'Two Ptr', 'Sliding', 'Kadane', 'Stack'].map((p, i) => (
            <div key={p} className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: i < 3 ? 'rgba(16,185,129,0.1)' : i === 3 ? 'rgba(124,58,237,0.12)' : '#18181F',
                border: i < 3 ? '1px solid rgba(16,185,129,0.2)' : i === 3 ? '1px solid rgba(124,58,237,0.3)' : '1px solid #232330',
                color: i < 3 ? '#10B981' : i === 3 ? '#A78BFA' : '#4E4C5E',
              }}>
              {i < 3 ? '✓ ' : ''}{p}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-right: weakness score */}
      <div className="absolute bottom-28 right-8 opacity-20 rotate-[4deg] pointer-events-none hidden md:block">
        <div className="px-4 py-3 rounded-xl bg-surface" style={{ border: '1px solid #232330', minWidth: '190px' }}>
          <p className="text-ink-muted text-xs font-medium mb-2.5 uppercase tracking-wide">Weakness Map</p>
          {[
            { label: 'Binary Search', val: 78, color: '#10B981' },
            { label: 'Backtracking', val: 41, color: '#F59E0B' },
            { label: 'Dynamic Prog', val: 29, color: '#EF4444' },
          ].map(w => (
            <div key={w.label} className="flex items-center gap-2 mb-1.5">
              <span className="text-ink-secondary text-xs" style={{ width: '95px' }}>{w.label}</span>
              <div className="flex-1 h-1 rounded-full" style={{ background: '#232330' }}>
                <div className="h-full rounded-full" style={{ width: `${w.val}%`, background: w.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center-left: complexity reference */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 opacity-14 rotate-[-2deg] pointer-events-none hidden md:block">
        <div className="px-4 py-3 rounded-xl" style={{ background: '#111118', border: '1px solid #232330', minWidth: '185px' }}>
          <p className="text-ink-muted text-xs font-medium mb-2.5 uppercase tracking-wide">Complexity Guide</p>
          {[
            { pattern: 'Sliding Window', complexity: 'O(n)', color: '#10B981' },
            { pattern: 'Binary Search', complexity: 'O(log n)', color: '#A78BFA' },
            { pattern: 'Backtracking', complexity: 'O(2ⁿ)', color: '#EF4444' },
          ].map(c => (
            <div key={c.pattern} className="flex items-center gap-2 mb-1.5">
              <span className="text-ink-secondary text-xs flex-1">{c.pattern}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: c.color }}>{c.complexity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center-right: recent activity */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-15 rotate-[3deg] pointer-events-none hidden md:block">
        <div className="flex flex-col gap-1.5">
          {[
            { label: '✓ Two Sum', sub: 'Pattern recognized', color: '#10B981' },
            { label: '✓ Best Time to Buy', sub: "Kadane's variant", color: '#10B981' },
            { label: '● 3Sum', sub: 'In progress...', color: '#A78BFA' },
          ].map(a => (
            <div key={a.label} className="px-3 py-2 rounded-lg" style={{ background: '#111118', border: '1px solid #232330', minWidth: '185px' }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: a.color }}>{a.label}</p>
              <p className="text-ink-muted text-xs">{a.sub}</p>
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
        <a href="/login" className="text-ink-secondary text-sm hover:text-ink transition-colors">
          Already have an account? <span className="text-accent-text">Sign in</span>
        </a>
      </div>

      {/* ── Form card ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
        <div className="w-full" style={{ maxWidth: '400px' }}>

          <div className="text-center mb-8">
            <h1 className="text-ink font-bold mb-2" style={{ fontSize: '30px', letterSpacing: '-0.8px' }}>
              Start for free
            </h1>
            <p className="text-ink-secondary text-sm">Build real DSA intuition — not just a solved count</p>
          </div>

          <div className="rounded-2xl p-6"
            style={{
              background: 'rgba(17,17,24,0.85)',
              border: '1px solid rgba(35,35,48,0.8)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 24px 48px rgba(0,0,0,0.4)'
            }}>

            <button onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-ink text-sm font-medium mb-4 hover:border-ink-muted transition-colors"
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

            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-ink text-sm focus:outline-none transition-colors"
                style={{ background: '#18181F', border: '1px solid #232330' }}
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
                className="w-full text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                style={{ background: '#7C3AED', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Creating account…' : 'Get started free →'}
              </button>
            </form>

            <p className="text-ink-muted text-xs text-center mt-4 leading-relaxed">
              Free to start · No credit card · Bring your own AI key
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

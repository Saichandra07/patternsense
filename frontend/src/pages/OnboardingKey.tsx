import { useState } from 'react'
import api from '../lib/api'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabase'

interface Props {
  onDone: () => void
}

function KeyVerifying() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.14) 0%, transparent 65%)' }} />
      <div className="text-center relative z-10" style={{ maxWidth: '380px' }}>
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl">◆</div>
        <h2 className="text-ink font-bold text-xl mb-2">Connecting to Gemini…</h2>
        <p className="text-ink-secondary text-sm mb-7">Verifying your key with Google AI Studio</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function KeySuccess({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(16,185,129,0.10) 0%, transparent 65%)' }} />
      <div className="text-center relative z-10 px-6" style={{ maxWidth: '440px' }}>

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14l6 6 12-12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-medium text-success"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          Gemini 2.5 Flash · Connected
        </div>

        <h2 className="text-ink font-bold mb-3" style={{ fontSize: '26px', letterSpacing: '-0.5px' }}>
          AI connection established
        </h2>
        <p className="text-ink-secondary text-sm leading-relaxed mb-7">
          PatternSense is now powered by your Gemini key — unlimited Socratic sessions, no cutoffs, fully personalized to your reasoning.
        </p>

        <div className="rounded-xl p-4 mb-8 text-left"
          style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
          {[
            { label: 'Model', value: 'Gemini 2.5 Flash' },
            { label: 'Status', value: 'Ready' },
            { label: 'Key security', value: 'AES-256 encrypted' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-1.5">
              <span className="text-ink-muted text-xs">{row.label}</span>
              <span className="text-success text-xs font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-accent text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
        >
          Choose your learning path →
        </button>
      </div>
    </div>
  )
}

export default function OnboardingKey({ onDone }: Props) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed) return
    setStatus('verifying')
    setError('')
    try {
      await api.post('/api/keys/save', { apiKey: trimmed })
      setStatus('success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Failed to save key. Check your connection and try again.')
      setStatus('idle')
    }
  }

  if (status === 'verifying') return <KeyVerifying />
  if (status === 'success') return <KeySuccess onContinue={onDone} />

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Nav rightSlot={
        <button onClick={() => supabase.auth.signOut()} className="text-ink-secondary text-sm hover:text-ink transition-colors">
          Sign out
        </button>
      } />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">

          <div className="flex items-center gap-2 mb-10">
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">1</div>
              <span className="text-ink font-medium">Connect AI key</span>
            </div>
            <div className="flex-1 h-px bg-sep" />
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-6 h-6 rounded-full bg-elevated border border-sep flex items-center justify-center text-ink-muted text-xs font-semibold">2</div>
              <span className="text-ink-muted">Choose your path</span>
            </div>
          </div>

          <h1 className="text-ink text-3xl font-bold mb-2.5">Connect your Gemini key</h1>
          <p className="text-ink-secondary text-sm leading-relaxed mb-9">
            To give you full, uninterrupted Socratic sessions that never cut off mid-pattern, we use your own free Gemini API key.
          </p>

          <div className="bg-surface border border-sep rounded-xl overflow-hidden mb-7">
            {[
              { n: '1', text: <span>Go to <strong className="text-ink">Google AI Studio</strong> and sign in with your Google account</span>, link: 'https://aistudio.google.com/app/apikey' },
              { n: '2', text: <span>Click <strong className="text-ink">"Get API Key"</strong> and create a new key — it's completely free</span> },
              { n: '3', text: <span>Copy your key and paste it below</span> },
            ].map((step, i, arr) => (
              <div key={step.n} className={`flex items-center gap-4 px-5 py-4 ${i < arr.length - 1 ? 'border-b border-sep' : ''}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-accent-text text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  {step.n}
                </div>
                <p className="text-ink-secondary text-sm flex-1">{step.text}</p>
                {step.link && (
                  <a href={step.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-elevated border border-sep text-accent-text text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap hover:border-accent-text transition-colors">
                    Open →
                  </a>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <p className="text-ink-secondary text-xs font-medium mb-2">Your Gemini API key</p>
            <div className="relative mb-2.5">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                onPaste={e => { e.preventDefault(); setKey(e.clipboardData.getData('text/plain')) }}
                placeholder="Paste your API key here"
                className="w-full bg-surface border border-sep rounded-lg px-4 py-3.5 pr-12 text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors text-base">
                {show ? '🙈' : '👁'}
              </button>
            </div>

            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-7"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="text-sm mt-0.5">🔒</span>
              <p className="text-ink-secondary text-xs leading-relaxed">
                <strong className="text-success">Encrypted and private.</strong> Your key is AES-256 encrypted before storage. It never appears in any logs, never leaves your account, and is only used to run your sessions.
              </p>
            </div>

            {error && <p className="text-warning text-xs mb-3">{error}</p>}

            <button
              type="submit"
              disabled={!key.trim() || status !== 'idle'}
              className="w-full bg-accent text-white rounded-lg py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6D28D9] transition-colors"
            >
              Verify & Continue →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

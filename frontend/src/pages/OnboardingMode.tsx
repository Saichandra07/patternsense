import { useState } from 'react'
import api from '../lib/api'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabase'

interface Props {
  onDone: (mode: 'guided' | 'self_directed') => void
  onBack: () => void
}

export default function OnboardingMode({ onDone, onBack }: Props) {
  const [selected, setSelected] = useState<'guided' | 'self_directed' | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue(mode: 'guided' | 'self_directed') {
    setLoading(true)
    try {
      await api.patch('/api/users/mode', { mode })
      onDone(mode)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Nav rightSlot={
        <button onClick={() => supabase.auth.signOut()} className="text-ink-secondary text-sm hover:text-ink transition-colors">
          Sign out
        </button>
      } />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-12">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-white text-xs font-semibold">✓</div>
            <span className="text-ink-secondary">Connect AI key</span>
          </div>
          <div className="w-15 h-px bg-sep" />
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">2</div>
            <span className="text-ink font-medium">Choose your path</span>
          </div>
        </div>

        <button onClick={onBack} className="text-ink-muted text-sm hover:text-ink-secondary transition-colors mb-8">
          ← Change API key
        </button>

        <h1 className="text-ink text-3xl font-bold mb-2.5 text-center">How do you want to learn?</h1>
        <p className="text-ink-secondary text-sm mb-11 text-center">You can always switch later from your settings.</p>

        {/* Mode cards */}
        <div className="flex gap-5 w-full max-w-3xl mb-6">
          {/* Guided */}
          <button
            onClick={() => setSelected('guided')}
            className="flex-1 text-left rounded-2xl p-8 transition-all duration-200 cursor-pointer"
            style={{
              background: selected === 'guided' ? 'rgba(124,58,237,0.06)' : 'var(--color-surface, #111118)',
              border: selected === 'guided' ? '2px solid #7C3AED' : '2px solid #232330',
            }}
          >
            <div className="relative">
              {selected === 'guided' && (
                <span className="absolute -top-2 right-0 bg-accent text-white text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wide">SELECTED</span>
              )}
              <div className="text-3xl mb-4">🗺️</div>
              <h3 className="text-ink text-base font-bold mb-2">Build my roadmap</h3>
              <p className="text-ink-secondary text-sm leading-relaxed mb-6">
                I want a structured path from beginner to interview-ready, with patterns in the right order.
              </p>
              <div className="space-y-2.5 mb-7">
                {['Patterns sequenced for maximum understanding', 'Each question builds on the previous one', 'Socratic session on every step', 'Progress tracked across your full roadmap'].map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-text flex-shrink-0 mt-1.5" />
                    <span className={selected === 'guided' ? 'text-ink' : 'text-ink-secondary'}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleContinue('guided') }}
                disabled={loading}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={selected === 'guided'
                  ? { background: '#7C3AED', color: '#fff', border: '1px solid #7C3AED' }
                  : { background: '#18181F', color: '#8B879E', border: '1px solid #232330' }}
              >
                {loading && selected === 'guided' ? 'Saving…' : 'Start with a roadmap →'}
              </button>
            </div>
          </button>

          {/* Self-directed */}
          <button
            onClick={() => setSelected('self_directed')}
            className="flex-1 text-left rounded-2xl p-8 transition-all duration-200 cursor-pointer"
            style={{
              background: selected === 'self_directed' ? 'rgba(124,58,237,0.06)' : 'var(--color-surface, #111118)',
              border: selected === 'self_directed' ? '2px solid #7C3AED' : '2px solid #232330',
            }}
          >
            <div className="relative">
              {selected === 'self_directed' && (
                <span className="absolute -top-2 right-0 bg-accent text-white text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wide">SELECTED</span>
              )}
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-ink text-base font-bold mb-2">I have my own path</h3>
              <p className="text-ink-secondary text-sm leading-relaxed mb-6">
                I'm already working through a course, sheet, or list. I'll bring my own problems to work through.
              </p>
              <div className="space-y-2.5 mb-7">
                {['Paste any LeetCode URL — auto-fetched', 'Or paste any problem from any platform', 'Socratic session on whatever you bring', 'Weakness map builds from your sessions'].map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-text flex-shrink-0 mt-1.5" />
                    <span className={selected === 'self_directed' ? 'text-ink' : 'text-ink-secondary'}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleContinue('self_directed') }}
                disabled={loading}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={selected === 'self_directed'
                  ? { background: '#7C3AED', color: '#fff', border: '1px solid #7C3AED' }
                  : { background: '#18181F', color: '#8B879E', border: '1px solid #232330' }}
              >
                {loading && selected === 'self_directed' ? 'Saving…' : 'Bring my own problems →'}
              </button>
            </div>
          </button>
        </div>

        <p className="text-ink-muted text-sm text-center">
          Not sure? <span className="text-accent-text">Start with the roadmap</span> — it's easier to switch to self-directed later.
        </p>
      </div>
    </div>
  )
}

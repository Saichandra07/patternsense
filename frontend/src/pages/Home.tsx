import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import api from '../lib/api'

interface RecentSession {
  sessionId: string
  problemTitle: string
  difficulty: string | null
  pattern: string | null
  gapNote: string | null
  completedAt: string | null
}

interface WeaknessEntry {
  pattern: string
  confidenceScore: number
  recentGapNote: string | null
}

interface Props {
  onStart: (url: string) => void
  onLogout: () => void
  onWeaknessMap: () => void
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-red-400',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Home({ onStart, onLogout, onWeaknessMap }: Props) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [activeGaps, setActiveGaps] = useState<WeaknessEntry[]>([])

  useEffect(() => {
    api.get('/api/sessions/recent').then(r => setRecentSessions(r.data)).catch(() => {})
    api.get('/api/weakness').then(r => {
      const gaps = (r.data as WeaknessEntry[])
        .filter(w => w.confidenceScore < 60)
        .sort((a, b) => a.confidenceScore - b.confidenceScore)
        .slice(0, 3)
      setActiveGaps(gaps)
    }).catch(() => {})
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.includes('leetcode.com/problems/')) {
      setError('Please paste a LeetCode problem URL (e.g. https://leetcode.com/problems/two-sum/)')
      return
    }
    setError(null)
    onStart(trimmed)
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Nav
        rightSlot={
          <div className="flex items-center gap-4">
            <button
              onClick={onWeaknessMap}
              className="text-ink-secondary text-sm hover:text-ink transition-colors"
            >
              Weakness Map
            </button>
            <button
              onClick={onLogout}
              className="text-ink-muted text-sm hover:text-ink-secondary transition-colors"
            >
              Sign out
            </button>
          </div>
        }
      />

      <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full flex flex-col gap-8">

        {/* URL input */}
        <div>
          <div className="mb-6 text-center">
            <h1 className="text-ink text-2xl font-semibold mb-2">Start a session</h1>
            <p className="text-ink-secondary text-sm">
              Paste a LeetCode problem URL. We'll begin a Socratic session — pattern hidden.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 border border-sep">
            <label className="block text-ink-muted text-xs font-medium uppercase tracking-wider mb-2">
              LeetCode URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(null) }}
              placeholder="https://leetcode.com/problems/two-sum/"
              className="w-full bg-elevated border border-sep text-ink rounded-lg px-4 py-3 text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={!url.trim()}
              className="mt-4 w-full bg-accent text-white rounded-lg py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Start Session
            </button>
          </form>

          <p className="mt-3 text-center text-ink-muted text-xs">
            The pattern tag is hidden during your session — you'll discover it yourself.
          </p>
        </div>

        {/* Active gaps strip */}
        {activeGaps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ink-muted text-xs font-medium uppercase tracking-wider">Active gaps</h2>
              <button
                onClick={onWeaknessMap}
                className="text-accent-text text-xs hover:text-accent transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {activeGaps.map(w => (
                <div key={w.pattern} className="bg-surface rounded-xl border border-sep px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-ink text-sm">{w.pattern}</span>
                      <span className="text-warning text-xs">{w.confidenceScore}/100</span>
                    </div>
                    {w.recentGapNote && (
                      <p className="text-ink-muted text-xs mt-0.5 truncate">{w.recentGapNote}</p>
                    )}
                  </div>
                  <div className="w-16 h-1.5 bg-elevated rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-warning rounded-full"
                      style={{ width: `${w.confidenceScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div>
          <h2 className="text-ink-muted text-xs font-medium uppercase tracking-wider mb-3">Recent sessions</h2>
          {recentSessions.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-sep p-8 text-center">
              <p className="text-ink-secondary text-sm">Start your first session to see history here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSessions.slice(0, 3).map(s => (
                <div key={s.sessionId} className="bg-surface rounded-xl border border-sep px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ink text-sm font-medium">{s.problemTitle}</span>
                      {s.difficulty && (
                        <span className={`text-xs ${DIFF_COLORS[s.difficulty] ?? 'text-ink-muted'}`}>
                          {s.difficulty}
                        </span>
                      )}
                    </div>
                    {s.pattern && (
                      <p className="text-ink-muted text-xs mt-0.5">{s.pattern}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-ink-muted text-xs">{formatDate(s.completedAt)}</span>
                    {s.gapNote ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-warning ml-auto mt-1" title="Active gap" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-success ml-auto mt-1" title="Clean session" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

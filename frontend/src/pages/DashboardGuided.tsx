import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import api from '../lib/api'
import { ROADMAP } from '../constants/roadmap'

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
  onRoadmap: () => void
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

export default function DashboardGuided({ onStart, onLogout, onWeaknessMap, onRoadmap }: Props) {
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [weaknesses, setWeaknesses] = useState<WeaknessEntry[]>([])
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/sessions/recent').then(r => r.data),
      api.get('/api/weakness').then(r => r.data),
      api.get('/api/roadmap/progress').then(r => r.data),
    ]).then(([sessions, weakness, progress]) => {
      setRecentSessions(sessions)
      setWeaknesses(weakness)
      setCompletedSlugs(new Set(progress.completedSlugs as string[]))
    }).catch(() => {/* partial data is fine, show what loaded */}).finally(() => setLoading(false))
  }, [])

  // Find the next incomplete LeetCode problem in the roadmap
  const nextProblem = (() => {
    for (const pattern of ROADMAP) {
      for (const problem of pattern.problems) {
        if (problem.slug && !completedSlugs.has(problem.slug)) {
          return { pattern: pattern.pattern, problem }
        }
      }
    }
    return null
  })()

  const activeGaps = weaknesses
    .filter(w => w.confidenceScore < 60)
    .sort((a, b) => a.confidenceScore - b.confidenceScore)
    .slice(0, 3)

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.includes('leetcode.com/problems/')) {
      setUrlError('Please paste a LeetCode problem URL (e.g. https://leetcode.com/problems/two-sum/)')
      return
    }
    setUrlError(null)
    onStart(trimmed)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex flex-col">
        <Nav rightSlot={
          <button onClick={onLogout} className="text-ink-secondary text-sm hover:text-ink transition-colors">Sign out</button>
        } />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Nav
        rightSlot={
          <div className="flex items-center gap-4">
            <button
              onClick={onRoadmap}
              className="text-ink-secondary text-sm hover:text-ink transition-colors"
            >
              Roadmap
            </button>
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

      <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-8">

        {/* Continue card */}
        <section>
          <h2 className="text-ink-muted text-xs font-medium uppercase tracking-wider mb-3">Continue where you left off</h2>
          {nextProblem ? (
            <div className="bg-surface rounded-2xl border border-sep p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-accent-text bg-accent/10 px-2.5 py-1 rounded-full">
                    {nextProblem.pattern}
                  </span>
                  <h3 className="text-ink text-lg font-semibold mt-3 mb-1">{nextProblem.problem.title}</h3>
                  <span className={`text-xs ${DIFF_COLORS[nextProblem.problem.difficulty] ?? 'text-ink-muted'}`}>
                    {nextProblem.problem.difficulty}
                  </span>
                  <p className="text-ink-secondary text-sm mt-2 leading-relaxed">{nextProblem.problem.teaches}</p>
                </div>
                <button
                  onClick={() => onStart(nextProblem.problem.url)}
                  className="shrink-0 bg-accent text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Start Session →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-sep p-6 text-center">
              <p className="text-success text-sm font-medium">🎉 Roadmap complete!</p>
              <p className="text-ink-muted text-xs mt-1">You've worked through all 110 problems.</p>
            </div>
          )}
        </section>

        {/* Practice any problem */}
        <section>
          <h2 className="text-ink-muted text-xs font-medium uppercase tracking-wider mb-3">Practice any problem</h2>
          <form onSubmit={handleUrlSubmit} className="bg-surface rounded-2xl border border-sep p-5 flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setUrlError(null) }}
                placeholder="https://leetcode.com/problems/two-sum/"
                className="w-full bg-elevated border border-sep text-ink rounded-lg px-4 py-2.5 text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
              />
              {urlError && <p className="mt-1.5 text-xs text-red-400">{urlError}</p>}
            </div>
            <button
              type="submit"
              disabled={!url.trim()}
              className="shrink-0 bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Start →
            </button>
          </form>
        </section>

        {/* Active gaps */}
        {activeGaps.length > 0 && (
          <section>
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
          </section>
        )}

        {/* Recent sessions */}
        <section>
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
        </section>
      </div>
    </div>
  )
}

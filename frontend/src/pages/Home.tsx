import { useEffect, useState } from 'react'
import api from '../lib/api'
import { ROADMAP } from '../constants/roadmap'

interface RecentSession {
  sessionId: string
  status: 'active' | 'complete'
  phase: number
  problemSlug: string
  problemTitle: string
  difficulty: string | null
  description: string
  topicTags: string[]
  pattern: string | null
  gapNote: string | null
  completedAt: string | null
  messageCount: number
  sessionState: string
}

interface WeaknessEntry {
  pattern: string
  confidenceScore: number
  recentGapNote: string | null
}

interface Props {
  onStart: (url: string) => void
  onStartPaste: (title: string, text: string) => void
  onResume: (
    sessionId: string,
    problem: { slug: string; title: string; difficulty: string; description: string; topicTags?: string[] },
    messages: { role: 'user' | 'assistant'; content: string }[],
    phase: number,
    sessionState: string
  ) => void
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

export default function Home({ onStart, onStartPaste, onResume }: Props) {
  const [tab, setTab]                   = useState<'url' | 'paste'>('url')
  const [url, setUrl]                   = useState('')
  const [urlError, setUrlError]         = useState<string | null>(null)
  const [pasteTitle, setPasteTitle]     = useState('')
  const [pasteText, setPasteText]       = useState('')
  const [pasteError, setPasteError]     = useState<string | null>(null)
  const [recentSessions, setRecent]     = useState<RecentSession[]>([])
  const [activeGaps, setGaps]           = useState<WeaknessEntry[]>([])
  const [completedSlugs, setCompleted]  = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(true)
  const [resumingId, setResumingId]     = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/session/recent').then(r => r.data),
      api.get('/api/weakness').then(r => r.data),
      api.get('/api/roadmap/progress').then(r => r.data),
    ]).then(([sessions, weakness, progress]) => {
      setRecent(sessions)
      setGaps(
        (weakness as WeaknessEntry[])
          .filter(w => w.confidenceScore < 60)
          .sort((a, b) => a.confidenceScore - b.confidenceScore)
          .slice(0, 3)
      )
      setCompleted(new Set(progress.completedSlugs as string[]))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const nextProblem = (() => {
    for (const p of ROADMAP) {
      for (const prob of p.problems) {
        if (prob.slug && !completedSlugs.has(prob.slug)) return { pattern: p.pattern, problem: prob }
      }
    }
    return null
  })()

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = url.trim()
    if (!t) return
    if (!t.includes('leetcode.com/problems/')) {
      setUrlError('Paste a LeetCode problem URL — e.g. https://leetcode.com/problems/two-sum/')
      return
    }
    setUrlError(null)
    onStart(t)
  }

  async function handleDelete(sessionId: string) {
    try {
      await api.delete(`/api/session/${sessionId}`)
      setRecent(prev => prev.filter(s => s.sessionId !== sessionId))
    } catch {}
    setDeletingId(null)
  }

  async function handleResume(s: RecentSession) {
    setResumingId(s.sessionId)
    try {
      const { data } = await api.get(`/api/session/${s.sessionId}/messages`)
      const messages = data as { role: 'user' | 'assistant'; content: string }[]
      onResume(
        s.sessionId,
        { slug: s.problemSlug, title: s.problemTitle, difficulty: s.difficulty ?? '', description: s.description, topicTags: s.topicTags },
        messages,
        s.phase,
        s.sessionState
      )
    } catch {
      setResumingId(null)
    }
  }

  function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = pasteTitle.trim()
    const text  = pasteText.trim()
    if (!title) { setPasteError('Add a problem title'); return }
    if (text.length < 30) { setPasteError('Paste the full problem text'); return }
    setPasteError(null)
    onStartPaste(title, text)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-page flex flex-col">

      <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full flex flex-col gap-6">

        {/* ── Guided path ── */}
        <section>
          <div className="mb-3">
            <span className="text-ink-muted text-xs font-semibold uppercase tracking-wider">Guided path</span>
          </div>

          {nextProblem ? (
            <div className="bg-surface rounded-2xl border border-sep p-6 relative overflow-hidden">
              {/* subtle purple gradient */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, transparent 60%)' }} />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-xs text-accent-text bg-accent/10 border border-accent/15 px-2.5 py-0.5 rounded-full mb-3">
                    {nextProblem.pattern}
                  </span>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-ink text-base font-semibold leading-tight">{nextProblem.problem.title}</h3>
                    <span className={`text-xs ${DIFF_COLORS[nextProblem.problem.difficulty] ?? 'text-ink-muted'}`}>
                      {nextProblem.problem.difficulty}
                    </span>
                  </div>
                  <p className="text-ink-secondary text-sm leading-relaxed">{nextProblem.problem.teaches}</p>
                </div>
                <button
                  onClick={() => onStart(nextProblem.problem.url)}
                  className="shrink-0 bg-accent text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.97] whitespace-nowrap"
                >
                  Start →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-sep p-6 text-center">
              <p className="text-success text-sm font-medium mb-1">Roadmap complete</p>
              <p className="text-ink-muted text-xs">You've worked through all 110 problems.</p>
            </div>
          )}
        </section>

        {/* ── Practice session ── */}
        <section>
          <span className="text-ink-muted text-xs font-semibold uppercase tracking-wider mb-3 block">Practice session</span>

          <div className="bg-surface rounded-2xl border border-sep overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-sep">
              <button
                onClick={() => setTab('url')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === 'url' ? 'text-ink border-b-2 border-accent -mb-px' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                From LeetCode
              </button>
              <button
                onClick={() => setTab('paste')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === 'paste' ? 'text-ink border-b-2 border-accent -mb-px' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                Paste a Problem
              </button>
            </div>

            {/* Tab content */}
            {tab === 'url' ? (
              <form onSubmit={handleUrlSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-ink-muted text-xs font-medium uppercase tracking-wider mb-2">LeetCode URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => { setUrl(e.target.value); setUrlError(null) }}
                    placeholder="https://leetcode.com/problems/two-sum/"
                    className="w-full bg-elevated border border-sep text-ink rounded-lg px-4 py-3 text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
                  />
                  {urlError && <p className="mt-1.5 text-xs text-red-400">{urlError}</p>}
                  <p className="mt-1.5 text-xs text-ink-muted">Pattern is hidden — you discover it through the session.</p>
                </div>
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="w-full bg-accent text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Start Session
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasteSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-ink-muted text-xs font-medium uppercase tracking-wider mb-2">Problem Title</label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={e => { setPasteTitle(e.target.value); setPasteError(null) }}
                    placeholder="e.g. Maximum Subarray"
                    className="w-full bg-elevated border border-sep text-ink rounded-lg px-4 py-3 text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted text-xs font-medium uppercase tracking-wider mb-2">Problem Text</label>
                  <textarea
                    value={pasteText}
                    onChange={e => { setPasteText(e.target.value); setPasteError(null) }}
                    placeholder="Paste the full problem — description, examples, constraints. Works with GFG, HackerRank, anything."
                    rows={5}
                    className="w-full bg-elevated border border-sep text-ink rounded-lg px-4 py-3 text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                  {pasteError && <p className="mt-1 text-xs text-red-400">{pasteError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={!pasteTitle.trim() || !pasteText.trim()}
                  className="w-full bg-accent text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Start Session
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Active gaps ── */}
        {activeGaps.length > 0 && (
          <section>
            <div className="mb-3">
              <span className="text-ink-muted text-xs font-semibold uppercase tracking-wider">Active gaps</span>
            </div>
            <div className="flex flex-col gap-2">
              {activeGaps.map(w => (
                <div key={w.pattern} className="bg-surface rounded-xl border border-sep px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-ink text-sm">{w.pattern}</span>
                      <span className="text-warning text-xs">{w.confidenceScore}/100</span>
                    </div>
                    {w.recentGapNote && <p className="text-ink-muted text-xs mt-0.5 truncate">{w.recentGapNote}</p>}
                  </div>
                  <div className="w-16 h-1.5 bg-elevated rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${w.confidenceScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent sessions ── */}
        <section>
          <span className="text-ink-muted text-xs font-semibold uppercase tracking-wider mb-3 block">Recent sessions</span>
          {recentSessions.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-sep p-8 text-center">
              <p className="text-ink-secondary text-sm">Start your first session to see history here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSessions.slice(0, 5).map(s => (
                <div key={s.sessionId} className="bg-surface rounded-xl border border-sep px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ink text-sm font-medium">{s.problemTitle}</span>
                      {s.difficulty && (
                        <span className={`text-xs ${DIFF_COLORS[s.difficulty] ?? 'text-ink-muted'}`}>{s.difficulty}</span>
                      )}
                      {s.status === 'active' && (
                        <span className="text-xs text-accent-text bg-accent/10 border border-accent/15 px-1.5 py-0.5 rounded">
                          Phase {s.phase} · {s.messageCount} turns
                        </span>
                      )}
                    </div>
                    {s.pattern && <p className="text-ink-muted text-xs mt-0.5">{s.pattern}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {deletingId === s.sessionId ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-ink-muted">Delete?</span>
                        <button onClick={() => handleDelete(s.sessionId)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Yes</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-ink-muted hover:text-ink transition-colors">No</button>
                      </div>
                    ) : (
                      <>
                        {s.status === 'active' ? (
                          <button
                            onClick={() => handleResume(s)}
                            disabled={resumingId === s.sessionId}
                            className="text-xs text-accent-text border border-accent/25 bg-accent/8 rounded-lg px-3 py-1.5 hover:bg-accent/15 transition-colors disabled:opacity-50"
                          >
                            {resumingId === s.sessionId ? '…' : 'Resume →'}
                          </button>
                        ) : (
                          <div className="text-right">
                            <span className="text-ink-muted text-xs">{formatDate(s.completedAt)}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ml-auto mt-1 ${s.gapNote ? 'bg-warning' : 'bg-success'}`} />
                          </div>
                        )}
                        <button
                          onClick={() => setDeletingId(s.sessionId)}
                          className="text-ink-muted hover:text-red-400 transition-colors text-sm leading-none"
                          title="Delete session"
                        >
                          ×
                        </button>
                      </>
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

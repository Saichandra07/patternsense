import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import api from '../lib/api'
import { ROADMAP, type RoadmapPattern } from '../constants/roadmap'

interface Props {
  onBack: () => void
  onStart: (url: string) => void
  onLogout: () => void
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-red-400',
}

export default function Roadmap({ onBack, onStart, onLogout }: Props) {
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    api.get('/api/roadmap/progress')
      .then(({ data }) => setCompletedSlugs(new Set(data.completedSlugs as string[])))
      .catch(() => {/* show all patterns unlocked on error */})
      .finally(() => setLoading(false))
  }, [])

  function isPatternUnlocked(pattern: RoadmapPattern): boolean {
    if (pattern.order === 1) return true
    const prev = ROADMAP.find(p => p.order === pattern.order - 1)
    if (!prev) return true
    return prev.problems.some(p => p.slug && completedSlugs.has(p.slug))
  }

  function patternDone(pattern: RoadmapPattern): number {
    return pattern.problems.filter(p => p.slug && completedSlugs.has(p.slug)).length
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Nav
        rightSlot={
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-ink-secondary text-sm hover:text-ink transition-colors"
            >
              ← Dashboard
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

      <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-ink text-2xl font-semibold mb-1">Learning Roadmap</h1>
          <p className="text-ink-secondary text-sm">
            13 patterns in epistemic order. Each pattern unlocks once you've started the previous one.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-3">
            {ROADMAP.map(pattern => {
              const unlocked = isPatternUnlocked(pattern)
              const done = patternDone(pattern)
              const total = pattern.problems.length
              const allDone = done === total && total > 0
              const isExpanded = expanded === pattern.order

              return (
                <div
                  key={pattern.pattern}
                  className={`bg-surface rounded-2xl border transition-colors ${
                    allDone ? 'border-success/30' : 'border-sep'
                  } ${!unlocked ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={() => unlocked && setExpanded(isExpanded ? null : pattern.order)}
                    disabled={!unlocked}
                    className="w-full flex items-center gap-4 p-5 text-left disabled:cursor-default"
                  >
                    {/* Order badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      allDone ? 'bg-success/10 text-success' :
                      unlocked ? 'bg-accent/10 text-accent-text' :
                      'bg-elevated text-ink-muted'
                    }`}>
                      {allDone ? '✓' : !unlocked ? '🔒' : pattern.order}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-ink text-sm font-medium">{pattern.pattern}</span>
                        {allDone && (
                          <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Complete</span>
                        )}
                      </div>
                      <p className="text-ink-muted text-xs truncate">{pattern.coreLesson}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`text-xs font-medium tabular-nums ${
                        allDone ? 'text-success' : unlocked ? 'text-ink-secondary' : 'text-ink-muted'
                      }`}>
                        {done}/{total}
                      </span>
                      {unlocked && (
                        <div className="text-ink-muted text-xs mt-0.5">{isExpanded ? '▲' : '▼'}</div>
                      )}
                    </div>
                  </button>

                  {/* Progress bar */}
                  {unlocked && (
                    <div className="px-5 pb-3 -mt-2">
                      <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${allDone ? 'bg-success' : 'bg-accent'}`}
                          style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded problem list */}
                  {isExpanded && unlocked && (
                    <div className="border-t border-sep mx-5 mb-4 pt-4 flex flex-col gap-2">
                      {pattern.problems.map(problem => {
                        const isDone = problem.slug !== null && completedSlugs.has(problem.slug)
                        return (
                          <div
                            key={problem.order}
                            className="flex items-start gap-3 py-2"
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                              isDone
                                ? 'bg-success border-success text-white'
                                : 'border-sep text-ink-muted'
                            }`}>
                              {isDone ? '✓' : problem.order}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm ${isDone ? 'text-ink-secondary line-through' : 'text-ink'}`}>
                                  {problem.title}
                                </span>
                                <span className={`text-xs ${DIFF_COLORS[problem.difficulty] ?? 'text-ink-muted'}`}>
                                  {problem.difficulty}
                                </span>
                              </div>
                              <p className="text-ink-muted text-xs mt-0.5 leading-snug">{problem.teaches}</p>
                            </div>

                            {problem.slug && !isDone && (
                              <button
                                onClick={() => onStart(problem.url)}
                                className="shrink-0 text-xs text-accent-text bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors whitespace-nowrap"
                              >
                                Start →
                              </button>
                            )}
                            {problem.slug === null && (
                              <a
                                href={problem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-xs text-ink-muted border border-sep px-3 py-1.5 rounded-lg hover:text-ink transition-colors whitespace-nowrap"
                              >
                                Open ↗
                              </a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../lib/api'

interface WeaknessEntry {
  pattern: string
  confidenceScore: number
  lastUpdated: string | null
  recentGapNote: string | null
}


function confidenceColor(score: number): string {
  if (score > 60) return 'bg-success'
  if (score >= 40) return 'bg-warning'
  return 'bg-red-500'
}

function confidenceLabel(score: number): string {
  if (score > 60) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-red-400'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WeaknessMap() {
  const [weaknesses, setWeaknesses] = useState<WeaknessEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/api/weakness')
      .then(({ data }) => setWeaknesses(data))
      .catch(() => setError('Failed to load weakness map.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-page flex flex-col">

      <div className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-ink text-2xl font-semibold mb-1">Weakness Map</h1>
          <p className="text-ink-secondary text-sm">
            Your confidence score per pattern, updated after each session.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-surface rounded-xl p-6 border border-sep">{error}</div>
        )}

        {!loading && !error && weaknesses.length === 0 && (
          <div className="bg-surface rounded-2xl border border-sep p-12 text-center">
            <p className="text-ink-secondary text-sm">Complete sessions to build your weakness map.</p>
            <p className="text-ink-muted text-xs mt-1">Your pattern confidence will appear here after each session ends.</p>
          </div>
        )}

        {!loading && !error && weaknesses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weaknesses.map(w => (
              <div key={w.pattern} className="bg-surface rounded-2xl border border-sep p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-ink text-sm font-medium leading-tight">{w.pattern}</span>
                  <span className={`text-sm font-semibold tabular-nums ${confidenceLabel(w.confidenceScore)}`}>
                    {w.confidenceScore}/100
                  </span>
                </div>

                {/* Confidence bar */}
                <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${confidenceColor(w.confidenceScore)}`}
                    style={{ width: `${w.confidenceScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Last session: {formatDate(w.lastUpdated)}</span>
                  {w.confidenceScore > 60 && (
                    <span className="text-success">On track</span>
                  )}
                </div>

                {w.recentGapNote && w.confidenceScore <= 60 && (
                  <div className="bg-elevated rounded-lg px-3 py-2">
                    <p className="text-warning text-xs leading-snug">{w.recentGapNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import Nav from '../components/Nav'

interface Props {
  onStart: (url: string) => void
  onLogout: () => void
}

export default function Home({ onStart, onLogout }: Props) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

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
          <button
            onClick={onLogout}
            className="text-ink-secondary text-sm hover:text-ink transition-colors"
          >
            Sign out
          </button>
        }
      />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-ink text-2xl font-semibold mb-2">Start a session</h1>
            <p className="text-ink-secondary text-sm">
              Paste a LeetCode problem URL. We'll fetch the problem and begin a Socratic session.
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

          <p className="mt-4 text-center text-ink-muted text-xs">
            The pattern tag is hidden during your session — you'll discover it yourself.
          </p>
        </div>
      </div>
    </div>
  )
}

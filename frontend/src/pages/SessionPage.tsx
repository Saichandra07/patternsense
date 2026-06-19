import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import Nav from '../components/Nav'

interface Props {
  url: string
  onBack: () => void
  onLogout: () => void
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface Problem {
  slug: string
  title: string
  difficulty: string
  description: string
}

interface EndData {
  pattern: string
  confidenceDelta: number
  newConfidenceScore: number
  gapNote: string | null
}

function difficultyClass(d: string) {
  const lower = d.toLowerCase()
  if (lower === 'easy') return 'text-success'
  if (lower === 'medium') return 'text-warning'
  return 'text-red-400'
}

export default function SessionPage({ url, onBack, onLogout }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState(1)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [stuckLoading, setStuckLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [endData, setEndData] = useState<EndData | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function start() {
      const { data } = await api.post('/api/session/start', { url })
      setSessionId(data.sessionId)
      setProblem(data.problem)
      setMessages([{ role: 'assistant', content: data.firstMessage }])
      const state = JSON.parse(data.sessionState)
      setPhase(state.phase)
      setLoading(false)
    }
    start().catch(err => {
      setError(err?.response?.data?.error ?? 'Failed to start session. Check the URL and try again.')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending || stuckLoading) return
    setMessages(m => [...m, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const { data } = await api.post(`/api/session/${sessionId}/message`, { content: text })
      setMessages(m => [...m, { role: 'assistant', content: data.message }])
      const state = JSON.parse(data.sessionState)
      setPhase(state.phase)
      if (data.complete) {
        const { data: end } = await api.post(`/api/session/${sessionId}/end`)
        setEndData(end)
        setComplete(true)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setMessages(m => [...m, { role: 'assistant', content: msg ?? 'Something went wrong. Please try again.' }])
    }
    setSending(false)
  }

  async function handleStuck() {
    if (sending || stuckLoading) return
    setStuckLoading(true)
    try {
      const { data } = await api.post(`/api/session/${sessionId}/stuck`)
      setMessages(m => [...m, { role: 'assistant', content: data.message }])
      const state = JSON.parse(data.sessionState)
      setPhase(state.phase)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setMessages(m => [...m, { role: 'assistant', content: msg ?? 'Something went wrong. Please try sending a message instead.' }])
    } finally {
      setStuckLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  // Loading — session starting
  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-secondary text-sm">Fetching problem and starting session…</p>
        </div>
      </div>
    )
  }

  // Error — session failed to start
  if (error) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl p-8 border border-sep max-w-md w-full text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={onBack}
            className="text-ink-secondary text-sm hover:text-ink transition-colors"
          >
            ← Go back
          </button>
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
              onClick={onBack}
              className="text-ink-secondary text-sm hover:text-ink transition-colors"
            >
              ← New session
            </button>
            <button
              onClick={onLogout}
              className="text-ink-secondary text-sm hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>

        {/* LEFT — Problem panel */}
        <div className="w-[44%] border-r border-sep bg-surface flex flex-col overflow-hidden">
          {/* Problem header */}
          <div className="p-6 border-b border-sep flex-shrink-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-ink text-lg font-semibold leading-snug">
                {problem?.title}
              </h1>
              <span className={`text-xs font-medium capitalize flex-shrink-0 mt-0.5 ${difficultyClass(problem?.difficulty ?? '')}`}>
                {problem?.difficulty}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-accent-text bg-accent/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-text" />
              Phase {phase} of 3 — {phase === 1 ? 'Comprehension' : phase === 2 ? 'Solving' : 'Verification'}
            </span>
          </div>

          {/* Problem description */}
          <div
            ref={undefined}
            className="flex-1 overflow-y-auto p-6 text-ink-secondary text-sm leading-relaxed whitespace-pre-wrap"
          >
            {problem?.description}
          </div>
        </div>

        {/* RIGHT — Dialogue panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}
              >
                <div
                  className={
                    msg.role === 'assistant'
                      ? 'bg-elevated rounded-2xl rounded-tl-sm p-4 text-ink text-sm leading-relaxed'
                      : 'bg-accent/10 border border-accent/20 rounded-2xl rounded-tr-sm p-4 text-ink text-sm leading-relaxed'
                  }
                >
                  {msg.content}
                </div>
                <p className={`text-ink-muted text-xs mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.role === 'assistant' ? 'PatternSense' : 'You'}
                </p>
              </div>
            ))}

            {(sending || stuckLoading) && (
              <div className="max-w-[85%]">
                <div className="bg-elevated rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-sep p-4 bg-surface flex gap-3 flex-shrink-0">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response… (Ctrl+Enter to send)"
              rows={3}
              disabled={sending || stuckLoading}
              className="flex-1 bg-elevated border border-sep text-ink rounded-lg p-3 text-sm resize-none placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending || stuckLoading}
                className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Send
              </button>
              <button
                onClick={handleStuck}
                disabled={sending || stuckLoading}
                className="border border-warning text-warning rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warning/10 transition-colors whitespace-nowrap"
              >
                I'm Stuck
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completion overlay */}
      {complete && endData && (
        <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-8 border border-sep max-w-md w-full">
            <div className="text-center mb-6">
              <span className="text-success text-3xl mb-3 block">✓</span>
              <h2 className="text-ink text-xl font-semibold mb-1">Session Complete</h2>
              <p className="text-ink-secondary text-sm">You worked through all three phases.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-elevated rounded-xl p-4">
                <p className="text-ink-muted text-xs uppercase tracking-wider mb-1">Pattern</p>
                <p className="text-ink font-medium">{endData.pattern}</p>
              </div>

              <div className="bg-elevated rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-ink-muted text-xs uppercase tracking-wider mb-1">Confidence</p>
                  <p className="text-ink font-medium">{endData.newConfidenceScore} / 100</p>
                </div>
                <span className={`text-sm font-semibold ${endData.confidenceDelta >= 0 ? 'text-success' : 'text-red-400'}`}>
                  {endData.confidenceDelta >= 0 ? '+' : ''}{endData.confidenceDelta}
                </span>
              </div>

              {endData.gapNote && (
                <div className="bg-elevated rounded-xl p-4">
                  <p className="text-ink-muted text-xs uppercase tracking-wider mb-1">Gap to revisit</p>
                  <p className="text-ink-secondary text-sm">{endData.gapNote}</p>
                </div>
              )}
            </div>

            <button
              onClick={onBack}
              className="w-full bg-accent text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start New Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

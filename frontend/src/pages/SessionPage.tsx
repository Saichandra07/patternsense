import React, { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import Nav from '../components/Nav'
import type { SessionSource } from '../App'

interface Props {
  source: SessionSource
  onBack: () => void
  onLogout: () => void
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface Problem {
  slug: string
  title: string
  difficulty: string
  description: string
  topicTags?: string[]
}

interface EndData {
  pattern: string
  confidenceDelta: number
  newConfidenceScore: number
  gapNote: string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const PHASE_NAMES = ['Comprehension', 'Solving', 'Pattern']
const PHASE_GOALS = [
  'Confirm what to return and the key constraints',
  'Walk your approach — trace it step by step',
  'Name the pattern and explain exactly why it fits',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function difficultyStyle(d: string) {
  const l = d.toLowerCase()
  if (l === 'easy')   return { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.22)' }
  if (l === 'medium') return { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' }
  if (l === 'hard')   return { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.22)' }
  return              { color: '#A78BFA', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' }
}

function llmErrorMessage(raw: string) {
  if (raw.includes('429') || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit'))
    return "You've hit your daily API quota. It resets tomorrow — or switch to the other provider."
  if (raw.includes('503') || raw.toLowerCase().includes('unavailable'))
    return 'The AI service is under high demand. Wait a moment and try again.'
  return 'Something went wrong. Please try again.'
}

// ── Description parsing + highlighting ──────────────────────────────────────

interface DescSection { label?: string; content: string }

function normalizeContent(content: string, label?: string): string {
  if (content.includes('\n')) return content.replace(/\n{3,}/g, '\n\n').trim()
  let s = content
  if (label && /^example/i.test(label)) {
    s = s
      .replace(/(?<=\S)\s+(Input\s*:)/g,  '\n$1')
      .replace(/(?<=\S)\s+(Output\s*:)/g, '\n$1')
      .replace(/(?<=\S)\s+(Explanation\s*:)/g, '\n$1')
  }
  if (label && /^constraints/i.test(label)) {
    s = s.replace(/\s+(•)/g, '\n$1')
  }
  return s.trim()
}

function parseDescription(text: string): DescSection[] {
  const headerPattern = /(Example\s+\d+\s*[:.]?|Constraints\s*[:]|Note\s*[:]|Follow[- ]up\s*[:])/gi
  const parts = text.split(headerPattern)
  if (parts.length <= 1) return [{ content: text.trim() }]
  const sections: DescSection[] = []
  if (parts[0].trim()) sections.push({ content: normalizeContent(parts[0].trim()) })
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i].replace(/[:.]?\s*$/, '').trim()
    const rawContent = (parts[i + 1] ?? '').trim()
    if (rawContent) sections.push({ label, content: normalizeContent(rawContent, label) })
  }
  return sections.filter(s => s.content)
}

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(pattern)
  return parts.map((part, i) =>
    keywords.some(k => k.toLowerCase() === part.toLowerCase())
      ? <mark key={i} style={{ background: 'rgba(124,58,237,0.18)', color: '#A78BFA', borderRadius: 3, padding: '0 3px', fontWeight: 600 }}>{part}</mark>
      : part
  )
}

function ProblemDescription({ text, keywords }: { text: string; keywords: string[] }) {
  if (text === 'PREMIUM_NO_DESCRIPTION') return (
    <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
      <p style={{ fontSize: 12.5, color: '#8B879E', margin: 0, lineHeight: 1.6 }}>
        This is a <span style={{ color: '#A78BFA', fontWeight: 600 }}>LeetCode Premium</span> problem — the description isn't available via the API. Open it on LeetCode to read the problem, then come back and start the session.
      </p>
    </div>
  )
  const sections = parseDescription(text)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sections.map((section, i) => (
        <div key={i}>
          {section.label && (
            <div style={{
              padding: '5px 10px', marginBottom: 8, borderRadius: 6,
              background: 'rgba(124,58,237,0.07)', borderLeft: '2px solid rgba(124,58,237,0.35)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              color: '#A78BFA',
            }}>
              {section.label}
            </div>
          )}
          <p style={{ fontSize: 13, lineHeight: 1.75, color: '#8B879E', whiteSpace: 'pre-wrap', margin: 0 }}>
            {highlightKeywords(section.content, keywords)}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ background: '#18181F', border: '1px solid #27273A', borderRadius: 13, borderTopLeftRadius: 3, padding: '13px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0, 180, 360].map((delay, i) => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#4E4C5E', animation: `dot-bounce 1.2s ${delay}ms infinite` }} />
      ))}
    </div>
  )
}

// ── Card shell ───────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: '#11111A',
  border: '1px solid #27273A',
  borderRadius: '14px 14px 0 0',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 0 0 1px rgba(124,58,237,0.04), 0 20px 40px rgba(0,0,0,0.4)',
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SessionPage({ source, onBack, onLogout }: Props) {
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [sessionId, setSessionId]       = useState('')
  const [problem, setProblem]           = useState<Problem | null>(null)
  const [signalKeywords, setKeywords]   = useState<string[]>([])
  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [phase, setPhase]               = useState(1)
  const [hintsUsed, setHintsUsed]       = useState(0)
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [stuckLoading, setStuckLoading] = useState(false)
  const [complete, setComplete]         = useState(false)
  const [endData, setEndData]           = useState<EndData | null>(null)
  const [quotaError, setQuotaError]     = useState(false)

  const scrollRef  = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (source.type === 'resume') {
      setSessionId(source.sessionId)
      setProblem(source.problem)
      setMessages(source.messages)
      setPhase(source.phase)
      try {
        const s = JSON.parse(source.sessionState)
        setHintsUsed(s.phase2?.stuck_count ?? 0)
      } catch {}
      setLoading(false)
      return
    }

    async function start() {
      const body = source.type === 'url'
        ? { url: source.url }
        : { title: source.title, text: source.text }
      const { data } = await api.post('/api/session/start', body)
      setSessionId(data.sessionId)
      setProblem(data.problem)
      setKeywords(data.signalKeywords ?? [])
      setMessages([{ role: 'assistant', content: data.firstMessage }])
      setPhase(JSON.parse(data.sessionState).phase)
      setLoading(false)
    }
    start().catch(err => {
      const raw = (err?.response?.data?.error ?? '') as string
      setError(
        raw.includes('PREMIUM_PROBLEM')
          ? 'PREMIUM'
          : raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit')
          ? "Your API quota is exhausted. It resets tomorrow — or add a Groq key as an alternative."
          : raw.toLowerCase().includes('not a valid leetcode')
          ? "That doesn't look like a valid LeetCode URL. Please check and try again."
          : raw.toLowerCase().includes('problem not found')
          ? 'Problem not found on LeetCode. Check the URL and try again.'
          : 'Failed to start session. Check the URL and try again.'
      )
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  function syncState(stateStr: string) {
    try {
      const s = JSON.parse(stateStr)
      setPhase(s.phase ?? 1)
      setHintsUsed(s.phase2?.stuck_count ?? 0)
    } catch {}
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending || stuckLoading) return
    setMessages(m => [...m, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const { data } = await api.post(`/api/session/${sessionId}/message`, { content: text })
      setMessages(m => [...m, { role: 'assistant', content: data.message }])
      syncState(data.sessionState)
      if (data.complete) {
        const { data: end } = await api.post(`/api/session/${sessionId}/end`)
        setEndData(end)
        setComplete(true)
      }
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? ''
      if (raw.includes('429') || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit')) {
        setQuotaError(true)
      } else {
        setMessages(m => [...m, { role: 'assistant', content: llmErrorMessage(raw) }])
      }
    } finally {
      setSending(false)
    }
  }

  async function handleStuck() {
    if (sending || stuckLoading) return
    setStuckLoading(true)
    try {
      const { data } = await api.post(`/api/session/${sessionId}/stuck`)
      setMessages(m => [...m, { role: 'assistant', content: data.message }])
      syncState(data.sessionState)
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? ''
      if (raw.includes('429') || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit')) {
        setQuotaError(true)
      } else {
        setMessages(m => [...m, { role: 'assistant', content: llmErrorMessage(raw) }])
      }
    } finally {
      setStuckLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ height: '100vh', background: '#07070D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#8B879E', fontSize: 13 }}>Fetching problem and starting session…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div style={{ height: '100vh', background: '#07070D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#11111A', border: '1px solid #27273A', borderRadius: 16, padding: 32, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {error === 'PREMIUM' ? (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20 }}>🔒</div>
            <p style={{ color: '#EEEDF8', fontSize: 15, fontWeight: 600, marginBottom: 8, margin: '0 0 8px' }}>LeetCode Premium Problem</p>
            <p style={{ color: '#8B879E', fontSize: 13, lineHeight: 1.6, marginBottom: 20, margin: '0 0 20px' }}>
              This problem's description isn't accessible. Copy the full problem text from{' '}
              <span style={{ color: '#A78BFA' }}>GFG, NeetCode, or any other site</span> and use{' '}
              <strong style={{ color: '#EEEDF8' }}>Paste a Problem</strong> on the dashboard instead.
            </p>
          </>
        ) : (
          <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}
        <button onClick={onBack} style={{ color: '#8B879E', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>← Go back</button>
      </div>
    </div>
  )

  // ── Computed values ──
  const turnCount = messages.length
  const dc = difficultyStyle(problem?.difficulty ?? '')
  const progress = Math.min(93, (phase - 1) * 33 + Math.min(turnCount * 3, 28))
  const tags = (problem?.topicTags ?? []).slice(0, 4)

  return (
    <div style={{ height: '100vh', background: '#07070D', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, -apple-system, sans-serif', position: 'relative' }}>

      {/* Dot-grid texture */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.055) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button onClick={onBack} style={{ color: '#4E4C5E', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8B879E')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4E4C5E')}>
              ← New session
            </button>
            <div style={{ width: 1, height: 16, background: '#1F1F2E' }} />
            <button onClick={onLogout} style={{ color: '#4E4C5E', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8B879E')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4E4C5E')}>
              Sign out
            </button>
          </div>
        } />
      </div>

      {/* ── 3-column workspace ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '36% 1fr 220px', gap: 10, padding: '10px 12px 0', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── PROBLEM CARD ── */}
        <div style={CARD}>

          {/* Gradient header */}
          <div style={{ padding: '16px 20px 14px', position: 'relative', overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid #27273A' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.13) 0%, rgba(124,58,237,0.03) 55%, transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, rgba(124,58,237,0.35), transparent 55%)' }} />

            {/* Title + difficulty */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10, position: 'relative' }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.25, color: '#EEEDF8' }}>
                {problem?.title}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0, background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}>
                {(problem?.difficulty ?? '').charAt(0).toUpperCase() + (problem?.difficulty ?? '').slice(1)}
              </div>
            </div>

            {/* Phase pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: tags.length ? 10 : 0, position: 'relative', flexWrap: 'wrap' }}>
              {PHASE_NAMES.map((name, idx) => {
                const isActive = phase === idx + 1
                const isDone   = phase > idx + 1
                return (
                  <React.Fragment key={name}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                      background: isActive ? 'rgba(124,58,237,0.15)' : isDone ? 'rgba(16,185,129,0.1)' : 'transparent',
                      color:      isActive ? '#A78BFA' : isDone ? '#10B981' : '#4E4C5E',
                      border:     `1px solid ${isActive ? 'rgba(124,58,237,0.3)' : isDone ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#A78BFA' : isDone ? '#10B981' : '#4E4C5E', boxShadow: isActive ? '0 0 5px #A78BFA' : 'none' }} />
                      {name}
                    </div>
                    {idx < 2 && <span style={{ color: '#4E4C5E', fontSize: 9 }}>›</span>}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Topic chips */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', position: 'relative' }}>
                {tags.map(tag => (
                  <span key={tag} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 5, background: 'rgba(124,58,237,0.07)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.12)', fontWeight: 500 }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable description */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {problem && <ProblemDescription text={problem.description} keywords={signalKeywords} />}
          </div>
        </div>

        {/* ── CHAT CARD ── */}
        <div style={CARD}>

          {/* Chat header */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #27273A', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 90% 50%, rgba(124,58,237,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative' }}>
              <div style={{ width: 28, height: 28, background: '#7C3AED', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', boxShadow: '0 0 10px rgba(124,58,237,0.35)', flexShrink: 0 }}>◆</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#EEEDF8' }}>PatternSense</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                </div>
                <div style={{ fontSize: 10.5, color: '#4E4C5E', marginTop: 1 }}>Socratic session · Phase {phase} active</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
              <div style={{ fontSize: 10.5, color: '#4E4C5E', background: '#18181F', border: '1px solid #27273A', padding: '2px 8px', borderRadius: 5 }}>Turn {turnCount}</div>
              <div style={{ fontSize: 10.5, background: '#18181F', padding: '2px 8px', borderRadius: 5, color: hintsUsed > 0 ? '#F59E0B' : '#10B981', border: `1px solid ${hintsUsed > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>{hintsUsed} hints</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, maxWidth: '92%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 17, background: msg.role === 'assistant' ? '#7C3AED' : 'rgba(124,58,237,0.14)', color: msg.role === 'assistant' ? 'white' : '#A78BFA', border: msg.role === 'user' ? '1px solid rgba(124,58,237,0.22)' : 'none', boxShadow: msg.role === 'assistant' ? '0 0 8px rgba(124,58,237,0.3)' : 'none' }}>
                  {msg.role === 'assistant' ? '◆' : 'Y'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 10.5, color: '#4E4C5E', fontWeight: 500, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.role === 'assistant' ? 'PatternSense' : 'You'}
                  </div>
                  <div style={{ padding: '11px 14px', borderRadius: 13, borderTopLeftRadius: msg.role === 'assistant' ? 3 : 13, borderTopRightRadius: msg.role === 'user' ? 3 : 13, fontSize: 13, lineHeight: 1.65, background: msg.role === 'assistant' ? '#18181F' : 'rgba(124,58,237,0.13)', border: `1px solid ${msg.role === 'assistant' ? '#27273A' : 'rgba(124,58,237,0.22)'}`, color: '#EEEDF8' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {(sending || stuckLoading) && (
              <div style={{ display: 'flex', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', marginTop: 17, flexShrink: 0, boxShadow: '0 0 8px rgba(124,58,237,0.3)' }}>◆</div>
                <div style={{ marginTop: 17 }}><TypingDots /></div>
              </div>
            )}
          </div>

          {/* Editor-style input / quota error */}
          {quotaError ? (
            <div style={{ padding: '16px 18px', borderTop: '1px solid #27273A', background: 'rgba(24,24,31,0.7)', flexShrink: 0 }}>
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F59E0B', marginBottom: 3 }}>API quota exhausted</div>
                  <div style={{ fontSize: 11.5, color: '#8B879E', lineHeight: 1.5 }}>Your daily limit is reached. Switch to the other provider to continue — your session progress is saved.</div>
                </div>
                <button
                  onClick={onBack}
                  style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Go to Settings →
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px 14px', borderTop: '1px solid #27273A', background: 'rgba(24,24,31,0.7)', backdropFilter: 'blur(8px)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response…"
                rows={2}
                disabled={sending || stuckLoading}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#EEEDF8', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: 0, resize: 'none', outline: 'none', lineHeight: 1.55, opacity: (sending || stuckLoading) ? 0.5 : 1 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9, borderTop: '1px solid #1F1F2E' }}>
                <span style={{ fontSize: 11, color: '#4E4C5E' }}>Ctrl + Enter to send</span>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button
                    onClick={handleStuck}
                    disabled={sending || stuckLoading}
                    style={{ background: 'rgba(245,158,11,0.07)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 8, padding: '7px 14px', fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', opacity: (sending || stuckLoading) ? 0.4 : 1, transition: 'all 0.15s' }}
                  >
                    I'm Stuck
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending || stuckLoading}
                    style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: 8, padding: '7px 20px', fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 14px rgba(124,58,237,0.35)', opacity: (!input.trim() || sending || stuckLoading) ? 0.4 : 1, transition: 'all 0.15s' }}
                  >
                    Send →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SESSION INTEL CARD ── */}
        <div style={CARD}>
          <div style={{ padding: '13px 16px 11px', borderBottom: '1px solid #27273A', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#4E4C5E' }}>Session</span>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#A78BFA', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 8px', borderRadius: 5 }}>Phase {phase}/3</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Phase steps */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {PHASE_NAMES.map((name, idx) => {
                const isActive = phase === idx + 1
                const isDone   = phase > idx + 1
                return (
                  <div key={name} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                    {idx < PHASE_NAMES.length - 1 && (
                      <div style={{ position: 'absolute', left: 9, top: 22, bottom: -4, width: 1, background: isDone ? 'rgba(16,185,129,0.3)' : '#27273A' }} />
                    )}
                    <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0, position: 'relative', zIndex: 1, marginTop: 1, background: isActive ? '#7C3AED' : isDone ? 'rgba(16,185,129,0.12)' : '#18181F', color: isActive ? 'white' : isDone ? '#10B981' : '#4E4C5E', border: `1.5px solid ${isActive ? '#7C3AED' : isDone ? 'rgba(16,185,129,0.35)' : '#27273A'}`, boxShadow: isActive ? '0 0 0 3px rgba(124,58,237,0.2), 0 0 10px rgba(124,58,237,0.3)' : 'none' }}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, color: isActive ? '#A78BFA' : isDone ? '#10B981' : '#4E4C5E' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#4E4C5E', lineHeight: 1.4 }}>
                        {idx === 0 ? 'Understand return value + key rules' : idx === 1 ? 'Walk your approach step by step' : 'Name the pattern, own the why'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Current goal */}
            <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.14)', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 6 }}>Current goal</div>
              <div style={{ fontSize: 11.5, color: '#8B879E', lineHeight: 1.5 }}>{PHASE_GOALS[phase - 1]}</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#4E4C5E', marginBottom: 2 }}>This session</div>
              {[
                { key: 'Turns',      val: turnCount, color: '#EEEDF8' },
                { key: 'Hints used', val: hintsUsed,  color: hintsUsed > 0 ? '#F59E0B' : '#10B981' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#18181F', border: '1px solid #27273A', borderRadius: 7 }}>
                  <span style={{ fontSize: 11.5, color: '#4E4C5E' }}>{s.key}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#4E4C5E' }}>
                <span>Session progress</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 4, background: '#27273A', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${progress}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', boxShadow: '0 0 8px rgba(124,58,237,0.4)', transition: 'width 0.6s ease' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Status bar ── */}
      <div style={{ height: 26, background: '#7C3AED', display: 'flex', alignItems: 'center', padding: '0 18px', flexShrink: 0, position: 'relative', zIndex: 10, boxShadow: '0 -1px 0 rgba(0,0,0,0.3)' }}>
        {([
          { dot: true,  text: `Phase ${phase} — ${PHASE_NAMES[phase - 1]}` },
          { text: `Turn ${turnCount}` },
          { text: problem?.title ?? '' },
          { text: `${hintsUsed} hints used`, right: true },
        ] as { dot?: boolean; text: string; right?: boolean }[]).map((seg, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.82)', paddingRight: seg.right ? 0 : 14, marginRight: seg.right ? 0 : 14, borderRight: (!seg.right && i < arr.length - 1) ? '1px solid rgba(255,255,255,0.18)' : 'none', marginLeft: seg.right ? 'auto' : 0 }}>
            {seg.dot && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />}
            {seg.text}
          </div>
        ))}
      </div>

      {/* ── Completion overlay ── */}
      {complete && endData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,7,13,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#11111A', borderRadius: 20, padding: 32, border: '1px solid #27273A', maxWidth: 420, width: '100%', boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 30px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20 }}>✓</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EEEDF8', marginBottom: 6, letterSpacing: '-0.4px', margin: '0 0 6px' }}>Session Complete</h2>
              <p style={{ fontSize: 13, color: '#8B879E', margin: 0 }}>You worked through all three phases.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#18181F', borderRadius: 10, padding: '12px 16px', border: '1px solid #27273A' }}>
                <div style={{ fontSize: 10.5, color: '#4E4C5E', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>Pattern</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#EEEDF8' }}>{endData.pattern}</div>
              </div>
              <div style={{ background: '#18181F', borderRadius: 10, padding: '12px 16px', border: '1px solid #27273A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#4E4C5E', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>Confidence</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#EEEDF8' }}>{endData.newConfidenceScore} / 100</div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: endData.confidenceDelta >= 0 ? '#10B981' : '#EF4444' }}>
                  {endData.confidenceDelta >= 0 ? '+' : ''}{endData.confidenceDelta}
                </span>
              </div>
              {endData.gapNote && (
                <div style={{ background: '#18181F', borderRadius: 10, padding: '12px 16px', border: '1px solid #27273A' }}>
                  <div style={{ fontSize: 10.5, color: '#4E4C5E', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>Gap to revisit</div>
                  <div style={{ fontSize: 12.5, color: '#8B879E', lineHeight: 1.5 }}>{endData.gapNote}</div>
                </div>
              )}
            </div>
            <button onClick={onBack} style={{ width: '100%', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
              Start New Session
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../lib/api'

type Provider = 'gemini' | 'groq'

export default function Settings() {
  const [currentProvider, setCurrentProvider] = useState<Provider>('gemini')
  const [maskedKey, setMaskedKey] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider>('gemini')
  const [newKey, setNewKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/keys/info')
      .then(({ data }) => {
        setCurrentProvider(data.provider)
        setSelectedProvider(data.provider)
        setMaskedKey(data.maskedKey)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!newKey.trim()) {
      setStatus({ type: 'error', message: 'Enter your API key to save.' })
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      await api.post('/api/keys/save', { apiKey: newKey.trim(), provider: selectedProvider })
      const { data } = await api.get('/api/keys/info')
      setCurrentProvider(data.provider)
      setMaskedKey(data.maskedKey)
      setNewKey('')
      setStatus({ type: 'success', message: `${selectedProvider === 'gemini' ? 'Gemini' : 'Groq'} key saved. You're good to go.` })
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to save key.'
      setStatus({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <main className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">API Settings</h1>
            <p className="text-ink-secondary text-sm mt-1">Switch providers or update your API key anytime.</p>
          </div>

          {loading ? (
            <div className="text-ink-secondary text-sm">Loading...</div>
          ) : (
            <>
              <div className="bg-surface border border-sep rounded-xl p-5 space-y-1">
                <p className="text-xs text-ink-muted uppercase tracking-wider">Active provider</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-ink capitalize">{currentProvider}</span>
                  <span className="text-xs text-ink-muted font-mono">{maskedKey}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-ink-secondary">Select provider</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['gemini', 'groq'] as Provider[]).map(p => (
                    <button
                      key={p}
                      onClick={() => { setSelectedProvider(p); setStatus(null) }}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        selectedProvider === p
                          ? 'border-accent bg-accent/10'
                          : 'border-sep bg-surface hover:border-accent/40'
                      }`}
                    >
                      <p className={`font-semibold text-sm capitalize ${selectedProvider === p ? 'text-accent-text' : 'text-ink'}`}>
                        {p === 'gemini' ? 'Gemini' : 'Groq'}
                      </p>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        {p === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Llama 3.3 70B'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-ink-secondary">
                  {selectedProvider === 'gemini' ? 'Gemini' : 'Groq'} API key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    onPaste={e => {
                      e.preventDefault()
                      setNewKey(e.clipboardData.getData('text').trim())
                    }}
                    placeholder={`Paste your ${selectedProvider === 'gemini' ? 'Gemini' : 'Groq'} key`}
                    className="w-full bg-elevated border border-sep rounded-lg px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {status && (
                <p className={`text-sm ${status.type === 'success' ? 'text-success' : 'text-red-400'}`}>
                  {status.message}
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Validating & saving...' : 'Save key'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState<string>('checking...')

  useEffect(() => {
    axios.get('http://localhost:8080/api/health')
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('error — backend not reachable'))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>PatternSense</h1>
      <p>Backend: <strong>{status}</strong></p>
    </div>
  )
}

export default App

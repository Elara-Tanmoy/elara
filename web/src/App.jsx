import React, { useState } from 'react'

function App() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const scan = async () => {
    if (!input) return
    setLoading(true)
    
    const isUrl = input.startsWith('http')
    const endpoint = isUrl ? '/scan-link' : '/scan-message'
    const body = isUrl ? {url: input} : {content: input}
    
    try {
      const response = await fetch('https://elara-api-dev.azurewebsites.net' + endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({status: 'error', reasons: ['API connection failed']})
    }
    setLoading(false)
  }

  return (
    <div style={{maxWidth: '800px', margin: '50px auto', padding: '20px', fontFamily: 'Arial'}}>
      <h1>Elara Security Dashboard</h1>
      
      <div style={{margin: '20px 0'}}>
        <textarea 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter URL or message to scan..."
          style={{width: '70%', height: '80px', padding: '10px'}}
        />
        <br/>
        <button 
          onClick={scan} 
          disabled={loading}
          style={{padding: '10px 20px', background: '#065f46', color: 'white', border: 'none', marginTop: '10px'}}
        >
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '15px', 
          borderRadius: '5px',
          background: result.status === 'safe' ? '#f0fdf4' : result.status === 'warn' ? '#fefce8' : '#fef2f2',
          borderLeft: result.status === 'safe' ? '4px solid #22c55e' : result.status === 'warn' ? '4px solid #f59e0b' : '4px solid #ef4444'
        }}>
          <h3>Result: {result.status.toUpperCase()}</h3>
          {result.trust_score && <p>Trust Score: {result.trust_score}/100</p>}
          <ul>
            {result.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App

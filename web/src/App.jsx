import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    threatsBlocked: 24,
    screenshotsAnalyzed: 67
  });

  const API_BASE = 'https://elara-api-dev.azurewebsites.net';

  const handleScan = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResult(null);

    const isUrl = input.startsWith('http') || input.includes('.');
    const endpoint = isUrl ? '/scan-link' : '/scan-message';
    const body = isUrl ? { url: input.trim() } : { content: input.trim() };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      if (data.status === 'block') {
        setStats(prev => ({ ...prev, threatsBlocked: prev.threatsBlocked + 1 }));
      }

    } catch (error) {
      setResult({
        status: 'error',
        reasons: [`Connection failed: ${error.message}. Check if API endpoints are deployed.`],
        trust_score: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '16px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '700' }}>
          Elara Security Platform v2.0
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          AI-powered threat detection with external verification & multi-screenshot analysis
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>AI Models</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>GPT-4.1 + GPT-5</div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>External APIs</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>VirusTotal + Google</div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Threats Blocked</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{stats.threatsBlocked}</div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Screenshots Analyzed</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{stats.screenshotsAnalyzed}</div>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Enhanced URL & Message Scanner</h2>
        <p style={{ margin: '0 0 25px 0', color: '#6b7280' }}>
          AI-powered threat analysis with external database verification from VirusTotal, Google Safe Browsing, and threat intelligence feeds.
        </p>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter URL or message content to analyze for threats..."
          style={{
            width: '100%',
            height: '120px',
            padding: '15px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
            marginBottom: '20px'
          }}
        />
        
        <button
          onClick={handleScan}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 30px',
            background: loading || !input.trim() ? '#9ca3af' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Analyzing Threat...' : 'Analyze Threat'}
        </button>

        {result && (
          <div style={{
            marginTop: '25px',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid',
            borderColor: result.status === 'safe' ? '#059669' : 
                        result.status === 'warn' ? '#d97706' : '#dc2626',
            background: result.status === 'safe' ? '#f0fdf4' : 
                       result.status === 'warn' ? '#fefce8' : '#fef2f2'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{
                color: result.status === 'safe' ? '#059669' : 
                      result.status === 'warn' ? '#d97706' : '#dc2626'
              }}>
                Threat Level: {result.status.toUpperCase()}
              </strong>
              {result.trust_score !== undefined && (
                <span style={{ marginLeft: '15px', fontSize: '14px' }}>
                  Trust Score: {result.trust_score}/100
                </span>
              )}
            </div>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <strong>Findings:</strong>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                {result.reasons.map((reason, i) => (
                  <li key={i} style={{ marginBottom: '5px' }}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Test Examples</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626', marginBottom: '5px' }}>
              Phishing URL
            </div>
            <button
              onClick={() => setInput('http://auth-ledgerlive-login-x-en-us.pages.dev')}
              style={{
                width: '100%',
                padding: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              http://auth-ledgerlive-login-x-en-us.pages.dev
            </button>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', marginBottom: '5px' }}>
              Legitimate Business
            </div>
            <button
              onClick={() => setInput('https://13spices.com')}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              https://13spices.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

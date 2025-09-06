import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    scansToday: 247,
    threatsBlocked: 12,
    safetyScore: 99.8
  });

  const API_BASE = 'https://elara-api-dev.azurewebsites.net';

  const scan = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    
    const isUrl = input.trim().startsWith('http');
    const endpoint = isUrl ? '/scan-link' : '/scan-message';
    const body = isUrl ? { url: input.trim() } : { content: input.trim() };
    
    try {
      const response = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        scansToday: prev.scansToday + 1,
        threatsBlocked: data.status === 'block' ? prev.threatsBlocked + 1 : prev.threatsBlocked
      }));
      
    } catch (error) {
      console.error('Scan error:', error);
      setResult({
        status: 'error',
        reasons: [`Connection failed: ${error.message}. Check if API endpoints are deployed.`],
        trust_score: 0
      });
    }
    setLoading(false);
  };

  const clearResult = () => {
    setResult(null);
    setInput('');
  };

  const testExamples = [
    {
      type: 'Suspicious URL',
      content: 'http://paypal-security-verification.suspicious-domain.com/login',
      description: 'HTTP + suspicious domain'
    },
    {
      type: 'Suspicious Message',
      content: 'URGENT: Your account expires today! Verify your password immediately or lose access forever!',
      description: 'Urgency + password request'
    },
    {
      type: 'Safe URL',
      content: 'https://microsoft.com',
      description: 'HTTPS + legitimate domain'
    },
    {
      type: 'Safe Message',
      content: 'Hello, hope you are having a great day!',
      description: 'Normal friendly message'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return '#059669';
      case 'warn': return '#d97706';
      case 'block': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'safe': return '#f0fdf4';
      case 'warn': return '#fefce8';
      case 'block': return '#fef2f2';
      default: return '#f3f4f6';
    }
  };

  const getStatusBorder = (status) => {
    switch (status) {
      case 'safe': return '#22c55e';
      case 'warn': return '#f59e0b';
      case 'block': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '20px auto',
      padding: '30px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          color: '#111827', 
          margin: '0 0 10px 0', 
          fontSize: '2.5rem',
          fontWeight: '700'
        }}>
          Elara Security Dashboard
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: 0, 
          fontSize: '1.1rem' 
        }}>
          Real-time threat detection and analysis
        </p>
      </header>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Safety Score
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#059669' }}>
            {stats.safetyScore}%
          </p>
        </div>
        
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scans Today
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#059669' }}>
            {stats.scansToday.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Threats Blocked
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#dc2626' }}>
            {stats.threatsBlocked}
          </p>
        </div>
      </div>

      {/* Main Scan Section */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#111827', fontSize: '1.5rem' }}>
          Security Scanner
        </h2>
        <p style={{ margin: '0 0 25px 0', color: '#6b7280', lineHeight: '1.6' }}>
          Paste any URL or message below. The system automatically detects the type and performs appropriate security analysis.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL (http/https) or message content to analyze for threats..."
            style={{
              width: '100%',
              height: '120px',
              padding: '15px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            onClick={scan}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 30px',
              background: loading || !input.trim() ? '#9ca3af' : '#065f46',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Analyzing...' : 'Scan for Threats'}
          </button>
          
          {result && (
            <button
              onClick={clearResult}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{
            marginTop: '30px',
            padding: '25px',
            borderRadius: '10px',
            background: getStatusBg(result.status),
            borderLeft: `5px solid ${getStatusBorder(result.status)}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#111827',
                fontSize: '1.3rem'
              }}>
                Analysis Result: 
                <span style={{ 
                  color: getStatusColor(result.status),
                  marginLeft: '10px',
                  fontWeight: '700'
                }}>
                  {result.status.toUpperCase()}
                </span>
              </h3>
              
              {result.trust_score !== undefined && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Trust Score: {result.trust_score}/100
                </div>
              )}
            </div>
            
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              lineHeight: '1.6'
            }}>
              {result.reasons.map((reason, i) => (
                <li key={i} style={{ marginBottom: '8px', color: '#374151' }}>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Test Examples */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '1.3rem' }}>
          Test Examples
        </h3>
        <p style={{ margin: '0 0 25px 0', color: '#6b7280', fontSize: '14px' }}>
          Click any example below to test the scanner with different threat types
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          {testExamples.map((example, i) => (
            <div
              key={i}
              onClick={() => setInput(example.content)}
              style={{
                padding: '15px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'white'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {example.type}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#374151',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}>
                {example.content.length > 100 ? 
                  example.content.substring(0, 100) + '...' : 
                  example.content
                }
              </div>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                {example.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Status */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <strong>API Status:</strong> Connected to {API_BASE}
        <br />
        <strong>Available Endpoints:</strong> /health, /scan-link, /scan-message, /ask-elara
      </div>
    </div>
  );
}

export default App;
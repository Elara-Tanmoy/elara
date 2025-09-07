import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('url');
  const [stats, setStats] = useState({
    threatsBlocked: 24,
    screenshotsAnalyzed: 67,
    filesScanned: 156
  });

  const API_BASE = 'https://elara-api-dev.azurewebsites.net';

  const handleScan = async () => {
    if (!input.trim() && files.length === 0) return;
    
    setLoading(true);
    setResult(null);

    try {
      let response, data;

      if (activeTab === 'files' && files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        response = await fetch(`${API_BASE}/scan-attachments`, {
          method: 'POST',
          body: formData,
        });
      } else {
        const isUrl = input.startsWith('http') || input.includes('.');
        const endpoint = isUrl ? '/scan-link' : '/scan-message';
        const body = isUrl ? { url: input.trim() } : { content: input.trim() };

        response = await fetch(${API_BASE}System.Collections.Hashtable, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        throw new Error(HTTP );
      }

      data = await response.json();
      setResult(data);
      
      if (data.status === 'block') {
        setStats(prev => ({ ...prev, threatsBlocked: prev.threatsBlocked + 1 }));
      }
      if (data.files_analyzed) {
        setStats(prev => ({ ...prev, filesScanned: prev.filesScanned + data.files_analyzed }));
      }

    } catch (error) {
      setResult({
        status: 'error',
        reasons: [Connection failed: . Check if API endpoints are deployed.],
        trust_score: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
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
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Files Scanned</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{stats.filesScanned}</div>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('url')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'url' ? '#059669' : 'transparent',
              color: activeTab === 'url' ? 'white' : '#6b7280',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer'
            }}
          >
            URL/Message Scanner
          </button>
          <button
            onClick={() => setActiveTab('files')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'files' ? '#059669' : 'transparent',
              color: activeTab === 'files' ? 'white' : '#6b7280',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer'
            }}
          >
            Multi-Screenshot Analysis
          </button>
        </div>

        {activeTab === 'url' ? (
          <div>
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
          </div>
        ) : (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Multi-Screenshot & Attachment Analysis</h2>
            <p style={{ margin: '0 0 25px 0', color: '#6b7280' }}>
              Upload multiple screenshots, images, or documents for comprehensive OCR analysis and threat detection.
            </p>
            
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            />
            
            {files.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: '600', marginBottom: '10px' }}>Files selected: {files.length}</p>
                {files.map((file, index) => (
                  <div key={index} style={{ 
                    background: '#f3f4f6', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    marginBottom: '5px',
                    fontSize: '14px'
                  }}>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleScan}
          disabled={loading || (!input.trim() && files.length === 0)}
          style={{
            padding: '12px 30px',
            background: loading || (!input.trim() && files.length === 0) ? '#9ca3af' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || (!input.trim() && files.length === 0) ? 'not-allowed' : 'pointer'
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
              {result.files_analyzed && (
                <span style={{ marginLeft: '15px', fontSize: '14px' }}>
                  Files Analyzed: {result.files_analyzed}
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
              
              {result.file_details && (
                <div style={{ marginTop: '15px' }}>
                  <strong>File Analysis:</strong>
                  {result.file_details.map((file, i) => (
                    <div key={i} style={{ 
                      background: 'rgba(255,255,255,0.5)', 
                      padding: '10px', 
                      borderRadius: '4px', 
                      marginTop: '8px' 
                    }}>
                      <div><strong>{file.filename}</strong> - {file.status.toUpperCase()}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Size: {(file.size / 1024).toFixed(1)} KB | Type: {file.type}
                      </div>
                      {file.ocr_analysis && <div style={{ fontSize: '12px' }}>OCR: {file.ocr_analysis}</div>}
                      {file.screenshot_analysis && <div style={{ fontSize: '12px' }}>Visual: {file.screenshot_analysis}</div>}
                    </div>
                  ))}
                </div>
              )}
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
              onClick={() => {setInput('http://auth-ledgerlive-login-x-en-us.pages.dev'); setActiveTab('url');}}
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
              onClick={() => {setInput('https://13spices.com'); setActiveTab('url');}}
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

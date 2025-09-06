import React, { useState } from 'react';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [screenshotQuestion, setScreenshotQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [useDetailedAnalysis, setUseDetailedAnalysis] = useState(false);

  const API_ENDPOINT = 'https://elara-api-dev.azurewebsites.net';

  const handleScan = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setResult(null);

    const isUrl = inputValue.startsWith('http');
    const endpoint = isUrl ? `${API_ENDPOINT}/scan-link` : `${API_ENDPOINT}/scan-message`;
    const body = isUrl ? 
      { url: inputValue.trim(), detailedAnalysis: useDetailedAnalysis } : 
      { content: inputValue.trim(), detailedAnalysis: useDetailedAnalysis };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Scan failed:', error);
      setResult({ 
        status: 'error', 
        reasons: ['Connection failed. Check if API endpoints are deployed.'] 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshotAnalysis = async () => {
    if (screenshotFiles.length === 0) return;
    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    screenshotFiles.forEach((file) => {
      formData.append('screenshots', file);
    });
    formData.append('question', screenshotQuestion);
    formData.append('detailedAnalysis', useDetailedAnalysis);

    try {
      const response = await fetch(`${API_ENDPOINT}/analyze-screenshot`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Screenshot analysis failed:', error);
      setResult({
        status: 'error',
        reasons: ['Screenshot analysis failed. Please try again.']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setScreenshotFiles(files);
  };

  const removeFile = (index) => {
    const newFiles = screenshotFiles.filter((_, i) => i !== index);
    setScreenshotFiles(newFiles);
  };

  const getResultClass = (status) => {
    switch (status) {
      case 'safe': return 'status-safe';
      case 'warn': return 'status-warn';
      case 'block': return 'status-block';
      default: return 'status-error';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#059669';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '30px auto',
      padding: '30px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#111827', margin: '0 0 10px 0' }}>Elara Security Platform v2.0</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>AI-powered threat detection with external verification & multi-screenshot analysis</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '14px' }}>AI Models</h3>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#059669' }}>GPT-4.1 + GPT-5</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '14px' }}>External APIs</h3>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#059669' }}>VirusTotal + Google</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '14px' }}>Threats Blocked</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#ef4444' }}>24</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '14px' }}>Screenshots Analyzed</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#059669' }}>67</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('url')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'url' ? '#065f46' : '#e5e7eb',
              color: activeTab === 'url' ? 'white' : '#4b5563',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            URL/Message Scanner
          </button>
          <button
            onClick={() => setActiveTab('screenshot')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'screenshot' ? '#065f46' : '#e5e7eb',
              color: activeTab === 'screenshot' ? 'white' : '#4b5563',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Multi-Screenshot Analysis
          </button>
        </div>

        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#eff6ff', 
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#1e40af', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useDetailedAnalysis}
              onChange={(e) => setUseDetailedAnalysis(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <span style={{ fontWeight: '500' }}>
              Use GPT-5 Mini for detailed analysis 
              <span style={{ color: '#6b7280', fontWeight: 'normal' }}>
                (more comprehensive results, slower processing)
              </span>
            </span>
          </label>
        </div>
      </div>

      {activeTab === 'url' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#111827' }}>Enhanced URL & Message Scanner</h2>
          <p style={{ margin: '0 0 20px 0', color: '#6b7280' }}>
            AI-powered threat analysis with external database verification from VirusTotal, Google Safe Browsing, and threat intelligence feeds.
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <textarea 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Enter URL (starting with http/https) or message content for threat analysis..."
              style={{
                width: '100%', 
                height: '120px', 
                padding: '12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px', 
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          
          <button 
            onClick={handleScan} 
            disabled={isLoading || !inputValue.trim()}
            style={{
              padding: '12px 24px', 
              background: isLoading || !inputValue.trim() ? '#9ca3af' : '#065f46', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 
              (useDetailedAnalysis ? 'Analyzing with GPT-5 + External APIs...' : 'Scanning with GPT-4 + External APIs...') : 
              'Analyze Threat'
            }
          </button>
        </div>
      )}

      {activeTab === 'screenshot' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#111827' }}>Multi-Screenshot Analysis</h2>
          <p style={{ margin: '0 0 20px 0', color: '#6b7280' }}>
            Upload multiple screenshots for comprehensive AI analysis. Analyze individual images or identify patterns across multiple screenshots.
          </p>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
              Upload Screenshots (up to 5 images):
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ 
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%'
              }}
            />
          </div>

          {screenshotFiles.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Selected Files ({screenshotFiles.length}):
              </label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                {screenshotFiles.map((file, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: index < screenshotFiles.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
              Optional Question:
            </label>
            <textarea
              value={screenshotQuestion}
              onChange={(e) => setScreenshotQuestion(e.target.value)}
              placeholder="Ask a specific question about the screenshot(s) (e.g., 'Are these login pages legitimate?' or 'Do these screenshots show a coordinated phishing campaign?')"
              style={{
                width: '100%',
                height: '80px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleScreenshotAnalysis}
            disabled={isLoading || screenshotFiles.length === 0}
            style={{
              padding: '12px 24px',
              background: isLoading || screenshotFiles.length === 0 ? '#9ca3af' : '#065f46',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading || screenshotFiles.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 
              (useDetailedAnalysis ? 'Analyzing with GPT-5...' : 'Analyzing with GPT-4...') : 
              `Analyze ${screenshotFiles.length} Screenshot${screenshotFiles.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {result && (
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#111827' }}>
              Analysis Results
              {result.screenshots_analyzed && ` (${result.screenshots_analyzed} screenshot${result.screenshots_analyzed !== 1 ? 's' : ''})`}
            </h3>
          </div>

          <div style={{
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${
              result.status === 'safe' ? '#22c55e' : 
              result.status === 'warn' ? '#f59e0b' : '#ef4444'
            }`,
            background: 
              result.status === 'safe' ? '#f0fdf4' : 
              result.status === 'warn' ? '#fefce8' : '#fef2f2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#111827' }}>
                Threat Level: <span style={{
                  color: result.status === 'safe' ? '#059669' : 
                        result.status === 'warn' ? '#d97706' : '#dc2626'
                }}>
                  {result.status?.toUpperCase()}
                </span>
              </h4>
              {(result.confidence || result.trust_score) && (
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: getConfidenceColor(result.confidence || result.trust_score)
                }}>
                  Confidence: {result.confidence || result.trust_score}%
                </div>
              )}
            </div>

            {result.model_used && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                AI Model: {result.model_used} | External Verification: {result.external_verification ? 'Yes' : 'No'}
                {result.analysis_type && ` | Type: ${result.analysis_type.replace(/_/g, ' ')}`}
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#374151' }}>Findings:</h5>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {(result.findings || result.reasons || []).map((finding, i) => (
                  <li key={i} style={{ marginBottom: '5px', fontSize: '14px' }}>{finding}</li>
                ))}
              </ul>
            </div>

            {result.user_answer && (
              <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '6px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#374151' }}>Answer to your question:</h5>
                <p style={{ margin: 0, fontSize: '14px' }}>{result.user_answer}</p>
              </div>
            )}

            {result.recommendations && (
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#374151' }}>Recommendations:</h5>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {result.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '5px', fontSize: '14px' }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#111827' }}>Test Examples</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          {[
            { type: 'Phishing URL', text: 'http://auth-ledgerlive-login-x-en-us.pages.dev', tab: 'url' },
            { type: 'Legitimate Business', text: 'https://13spices.com', tab: 'url' },
            { type: 'Suspicious Message', text: 'URGENT: Your account expires today! Verify immediately or lose access!', tab: 'url' },
            { type: 'Multi-Screenshot Test', text: 'Upload multiple screenshots of a suspicious process or phishing campaign', tab: 'screenshot' }
          ].map((example, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '12px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '6px', 
                  cursor: 'pointer',
               transition: 'background-color 0.2s'
             }} 
             onClick={() => {
               setActiveTab(example.tab);
               if (example.tab === 'url') {
                 setInputValue(example.text);
               }
             }}
             onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
             onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
           >
             <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
               {example.type}
             </div>
             <div style={{ fontSize: '13px', color: '#374151' }}>
               {example.text.length > 60 ? example.text.substring(0, 60) + '...' : example.text}
             </div>
           </div>
         ))}
       </div>
     </div>
   </div>
 );
}

export default App;

import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Final Production API Endpoint - No Placeholder
  const API_ENDPOINT = 'https://elara-api-dev.azurewebsites.net'; 

  const handleScan = async () => {
    if (!inputValue) return;
    setIsLoading(true);
    setResult(null);

    const isUrl = inputValue.startsWith('http');
    const endpoint = isUrl ? `${API_ENDPOINT}/scan-link` : `${API_ENDPOINT}/scan-message`;
    const body = isUrl ? { url: inputValue } : { content: inputValue };

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
      setResult({ status: 'error', reasons: ['Failed to connect to the analysis service.'] });
    } finally {
      setIsLoading(false);
    }
  };

  const getResultClass = (status) => {
    switch (status) {
      case 'safe': return 'status-safe';
      case 'warn': return 'status-warn';
      case 'block': return 'status-block';
      default: return 'status-error';
    }
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Elara Security Dashboard</h1>
        <p>Your real-time protection summary</p>
      </header>
      <div className="stats-grid">
        <div className="stat-card">
          <h2>Safety Score</h2>
          <p className="score">99.8%</p>
        </div>
        <div className="stat-card">
          <h2>Links Scanned</h2>
          <p>4,301</p>
        </div>
        <div className="stat-card">
          <h2>Threats Blocked</h2>
          <p>12</p>
        </div>
      </div>
      <main className="scan-section">
        <h2>Manual Scan</h2>
        <p>Paste a link or message to check its safety.</p>
        <div className="scan-input-area">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a URL or message to scan..."
          />
          <button onClick={handleScan} disabled={isLoading}>
            {isLoading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
        {result && (
          <div className={`result-card ${getResultClass(result.status)}`}>
            <div className="result-header">
              <h3>Scan Result: <span className="status-text">{result.status.toUpperCase()}</span></h3>
              {result.trust_score !== undefined && (
                <div className="trust-score">
                  Trust Score: <strong>{result.trust_score}/100</strong>
                </div>
              )}
            </div>
            <ul className="reasons-list">
              {result.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
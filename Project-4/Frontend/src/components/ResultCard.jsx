import { useState } from "react";

const ResultCard = ({ result }) => {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="card">
        <h2>Refined Output</h2>
        <div className="result-box">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '200px',
            color: '#9bb0c6',
            textAlign: 'center'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '16px', opacity: 0.5 }}>
              <path d="M12 8V12L15 15" stroke="#9bb0c6" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="#9bb0c6" strokeWidth="1.5"/>
            </svg>
            <p>Your refined text will appear here</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Enter text and click refine to get started</p>
          </div>
        </div>
      </div>
    );
  }

  // Convert score to percentage (assuming score is between 0 and 1)
  const aiProbability = (result.local_ai_score * 100).toFixed(1);

  // Determine color based on probability
  const getScoreColor = () => {
    if (result.local_ai_score < 0.3) return '#4caf50'; // Green - low AI probability (good)
    if (result.local_ai_score < 0.6) return '#ff9800'; // Orange - medium AI probability
    return '#f44336'; // Red - high AI probability (bad)
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.refined_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="card">
      <h2>Refined Output</h2>
      
      {/* Refined Text Section */}
      <div className="result-box">
        <p>{result.refined_text}</p>
      </div>
      
      {/* Character and word count for refined text */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        gap: '16px',
        marginTop: '8px',
        marginBottom: '20px',
        fontSize: '0.8rem',
        color: '#6b8cae'
      }}>
        <span>{result.refined_text.length} characters</span>
        <span>{Math.round(result.refined_text.length / 4)} words approx.</span>
      </div>

      {/* Score Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={getScoreColor()}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                  stroke="currentColor" fill={getScoreColor()} strokeWidth="1.5"/>
          </svg>
          <span style={{ color: '#2c3e50', fontWeight: '500' }}>AI Detection Probability:</span>
        </div>

        {/* Score Display with Progress Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>AI Score</span>
            <span style={{
              fontWeight: 'bold',
              fontSize: '1.3rem',
              color: getScoreColor()
            }}>
              {aiProbability}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${aiProbability}%`,
              height: '100%',
              backgroundColor: getScoreColor(),
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Interpretation Text */}
        <div style={{
          fontSize: '0.9rem',
          color: '#666',
          padding: '8px',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          marginBottom: '16px'
        }}>
          {result.local_ai_score < 0.3 ? (
            <span>✓ This text appears to be human-written (low AI probability)</span>
          ) : result.local_ai_score < 0.6 ? (
            <span>⚠️ This text shows some AI characteristics (medium AI probability)</span>
          ) : (
            <span>🤖 This text appears to be AI-generated (high AI probability)</span>
          )}
        </div>

        {/* Copy Button - Moved to the end, below everything */}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px',
            backgroundColor: copied ? '#4caf50' : '#2c3e50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" fill="none"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" fill="none"/>
          </svg>
          {copied ? 'Copied to Clipboard!' : 'Copy Refined Text'}
        </button>
      </div>

      {/* Optional stats section if your API returns metrics */}
      {result.metrics && (
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-value">{result.metrics.readability || 'A'}</span>
            <span className="stat-label">Readability</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.metrics.confidence || '95%'}</span>
            <span className="stat-label">Confidence</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.metrics.changes || '12'}</span>
            <span className="stat-label">Improvements</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
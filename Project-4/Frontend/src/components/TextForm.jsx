import { useState } from "react";
import { refineText } from "../services/api";

const TextForm = ({ setResult, setInitialScore }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [localInitialScore, setLocalInitialScore] = useState(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setCharCount(e.target.value.length);
    if (e.target.value.length === 0) {
      setLocalInitialScore(null);
      if (setInitialScore) setInitialScore(null);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const data = await refineText({ text, tone: "human" });
      
      setResult(data);
      setLocalInitialScore(data.initial_ai_score);
      if (setInitialScore) {
        setInitialScore(data.initial_ai_score);
      }
      
    } catch (error) {
      alert("Error connecting to backend");
    }
    setLoading(false);
  };

  const handleClear = () => {
    setText("");
    setCharCount(0);
    setResult(null);
    setLocalInitialScore(null);
    if (setInitialScore) setInitialScore(null);
  };

  // Convert score to percentage
  const initialProbability = localInitialScore !== null 
    ? (localInitialScore * 100).toFixed(1) 
    : null;

  // Determine color based on probability
  const getScoreColor = () => {
    if (localInitialScore < 0.3) return '#4caf50'; // Green - low AI probability (good)
    if (localInitialScore < 0.6) return '#ff9800'; // Orange - medium AI probability
    return '#f44336'; // Red - high AI probability (bad)
  };

  return (
    <div className="card">
      <h2>Input Text</h2>
      
      <textarea
        placeholder="Paste AI-generated text here..."
        value={text}
        onChange={handleTextChange}
        disabled={loading}
      />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '8px',
        marginBottom: '16px',
        fontSize: '0.8rem',
        color: '#6b8cae'
      }}>
        <span>{charCount} characters</span>
        {charCount > 0 && <span>{Math.round(charCount / 4)} words approx.</span>}
      </div>

      {/* Initial AI Score Section - With percentage and progress bar */}
      {localInitialScore !== null && (
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196f3">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#2c3e50', fontWeight: '500' }}>Initial AI Detection Probability:</span>
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
                {initialProbability}%
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
                width: `${initialProbability}%`,
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
            border: '1px solid #e0e0e0'
          }}>
            {localInitialScore < 0.3 ? (
              <span>✓ This text appears to be human-written (low AI probability)</span>
            ) : localInitialScore < 0.6 ? (
              <span>⚠️ This text shows some AI characteristics (medium AI probability)</span>
            ) : (
              <span>🤖 This text appears to be AI-generated (high AI probability)</span>
            )}
          </div>
        </div>
      )}
      
      {/* Buttons - Styled to match ResultCard */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={handleClear} 
          disabled={loading || !text.trim()}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#f0f0f0',  // Keeping grey background
            color: '#a1a0a0',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            opacity: loading || !text.trim() ? 0.6 : 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!loading && text.trim()) {
              e.currentTarget.style.backgroundColor = '#e0e0e0'; // Darker grey on hover
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && text.trim()) {
              e.currentTarget.style.backgroundColor = '#f0f0f0'; // Back to original grey
            }
          }}
        >
          {/* Broom/Mop (Jhadoo) Icon */}
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Broom handle */}
            <path d="M18 4L8 14" />
            <path d="M21 7L17 11" />
            <path d="M14 14L4 4" />
            {/* Broom bristles */}
            <path d="M4 14L8 10" />
            <path d="M6 18L10 14" />
            <path d="M8 22L12 18" />
            {/* Broom head */}
            <path d="M3 18L7 14" />
          </svg>
          Clear Input
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !text.trim()}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#2c3e50',  // Dark background (unchanged)
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            opacity: loading || !text.trim() ? 0.6 : 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!loading && text.trim()) {
              e.currentTarget.style.backgroundColor = '#1e2b37'; // Darker on hover
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && text.trim()) {
              e.currentTarget.style.backgroundColor = '#2c3e50'; // Back to original
            }
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="loader"></span>
              Refining...
            </span>
          ) : (
            <>
              {/* Wand/Sparkle icon for refine button */}
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 4V2" />
                <path d="M15 16v-2" />
                <path d="M8 9h2" />
                <path d="M20 9h2" />
                <path d="M17.8 11.8L19 13" />
                <path d="M15 9h.01" />
                <path d="M17.8 6.2L19 5" />
                <path d="M3 21L12 12" />
                <path d="M12.2 6.2L11 5" />
              </svg>
              Refine Text
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TextForm;
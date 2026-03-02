import React from 'react';
import { FaTimes, FaChartBar } from 'react-icons/fa';
import './LimeExplanationModal.css';

const LimeExplanationModal = ({ isOpen, onClose, explanation, reviewText }) => {
  if (!isOpen) return null;

  return (
    <div className="lime-modal-overlay" onClick={onClose}>
      <div className="lime-modal" onClick={e => e.stopPropagation()}>
        <div className="lime-modal-header">
          <h2>
            <FaChartBar className="header-icon" />
            LIME Explanation
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="lime-modal-content">
          <div className="review-section">
            <h3>Review Text:</h3>
            <p className="review-text">{reviewText}</p>
          </div>

          <div className="explanation-section">
            <h3>Word Importance:</h3>
            {explanation && Object.keys(explanation).length > 0 ? (
              <div className="word-importance-list">
                {Object.entries(explanation).map(([word, weight], index) => (
                  <div key={index} className="word-item">
                    <span className="word">{word}</span>
                    <div className="weight-bar-container">
                      <div 
                        className={`weight-bar ${weight > 0 ? 'positive' : 'negative'}`}
                        style={{ 
                          width: `${Math.min(Math.abs(weight) * 100, 100)}%`,
                          backgroundColor: weight > 0 ? '#10b981' : '#ef4444'
                        }}
                      />
                    </div>
                    <span className="weight-value">{weight.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-explanation">No LIME explanation available for this review.</p>
            )}
          </div>

          <div className="explanation-note">
            <p><strong>Note:</strong> Positive weights (green) indicate words that contributed to the prediction, while negative weights (red) indicate words that opposed it.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimeExplanationModal;
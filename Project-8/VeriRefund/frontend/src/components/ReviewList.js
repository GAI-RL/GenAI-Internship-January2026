import React from 'react';
import { FaUser, FaRobot, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import './ReviewList.css';

const ReviewList = ({ reviews, currentUser }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  return (
    <div className="review-list">
      {reviews.map((review) => {
        const isOwnReview = currentUser && review.user_id === currentUser.user_id;
        const showPrediction = !isOwnReview && review.predicted_class;

        return (
          <div key={review.id} className={`review-card ${isOwnReview ? 'own-review' : ''}`}>
            <div className="review-header">
              <div className="reviewer-info">
                {review.predicted_class === 'AI Review' ? (
                  <div className="reviewer-avatar ai">
                    <FaRobot />
                  </div>
                ) : (
                  <div className="reviewer-avatar human">
                    <FaUser />
                  </div>
                )}
                <div className="reviewer-details">
                  <span className="reviewer-name">
                    {isOwnReview ? 'You' : `User ${review.user_id}`}
                    {isOwnReview && <span className="own-badge">(Your Review)</span>}
                  </span>
                  <span className="review-date">
                    <FaCalendarAlt /> {formatDate(review.created_at)}
                  </span>
                </div>
              </div>

              {showPrediction && (
                <div className={`prediction-badge ${review.predicted_class === 'AI Review' ? 'ai' : 'human'}`}>
                  {review.predicted_class === 'AI Review' ? (
                    <>
                      <FaRobot /> AI Generated
                    </>
                  ) : (
                    <>
                      <FaShieldAlt /> Verified Human
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="review-content">
              <p className="review-text">{review.text}</p>
            </div>

            {showPrediction && review.confidence && (
              <div className="review-confidence">
                <div className="confidence-bar">
                  <div 
                    className={`confidence-fill ${getConfidenceColor(review.confidence)}`}
                    style={{ width: `${review.confidence * 100}%` }}
                  />
                </div>
                <span className="confidence-text">
                  Confidence: {(review.confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {isOwnReview && (
              <div className="own-review-note">
                <p>Your review is hidden from AI detection analysis</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
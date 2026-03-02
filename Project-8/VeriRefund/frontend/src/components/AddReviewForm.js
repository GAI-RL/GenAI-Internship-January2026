import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import './AddReviewForm.css';

const AddReviewForm = ({ onSubmit, onCancel }) => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(review.trim());
      setReview('');
      setRating(0);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-review-form-container">
      <div className="form-header">
        <h3>Write Your Review</h3>
        <button onClick={onCancel} className="close-form-btn">
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-review-form">
        <div className="form-group">
          <label htmlFor="review">Your Review</label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this product..."
            rows="5"
            required
            disabled={submitting}
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-btn"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={!review.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddReviewForm;
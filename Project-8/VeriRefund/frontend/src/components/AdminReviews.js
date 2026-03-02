import React, { useState, useEffect } from 'react';
import { FaRobot, FaUser, FaChartBar, FaFilter, FaSyncAlt, FaEye } from 'react-icons/fa';
import { getAllReviews } from '../api';
import LoadingSpinner from './LoadingSpinner';
import LimeExplanationModal from './LimeExplanationModal';
import './AdminReviews.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showLimeModal, setShowLimeModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    ai: 0,
    human: 0,
    avgConfidence: 0,
    avgProbAI: 0,
    avgProbHuman: 0
  });

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getAllReviews(filter !== 'all' ? filter : null);
      console.log('Reviews fetched:', data); // Debug log
      setReviews(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData) => {
    const total = reviewsData.length;
    const ai = reviewsData.filter(r => r.predicted_class === 'AI Review').length;
    const human = reviewsData.filter(r => r.predicted_class === 'Human Review').length;
    
    // Calculate average probabilities
    const avgProbAI = reviewsData.reduce((acc, r) => acc + (r.prob_ai || 0), 0) / total || 0;
    const avgProbHuman = reviewsData.reduce((acc, r) => acc + (r.prob_human || 0), 0) / total || 0;
    const avgConfidence = reviewsData.reduce((acc, r) => acc + (r.confidence || 0), 0) / total || 0;

    setStats({
      total,
      ai,
      human,
      avgConfidence: avgConfidence * 100,
      avgProbAI: avgProbAI * 100,
      avgProbHuman: avgProbHuman * 100
    });
  };

  const handleViewLime = (review) => {
    setSelectedReview(review);
    setShowLimeModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="admin-reviews-container">
      <div className="admin-reviews-header">
        <h1>
          <FaChartBar className="header-icon" />
          Review Monitor
        </h1>
        <p>Monitor and analyze all customer reviews</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FaChartBar />
          </div>
          <div className="stat-info">
            <h3>Total Reviews</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon ai">
            <FaRobot />
          </div>
          <div className="stat-info">
            <h3>AI Reviews</h3>
            <p className="stat-value">{stats.ai}</p>
            <p className="stat-percentage">
              {stats.total > 0 ? ((stats.ai / stats.total) * 100).toFixed(1) : 0}%
            </p>
            <p className="stat-prob">Avg Prob: {stats.avgProbAI.toFixed(1)}%</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon human">
            <FaUser />
          </div>
          <div className="stat-info">
            <h3>Human Reviews</h3>
            <p className="stat-value">{stats.human}</p>
            <p className="stat-percentage">
              {stats.total > 0 ? ((stats.human / stats.total) * 100).toFixed(1) : 0}%
            </p>
            <p className="stat-prob">Avg Prob: {stats.avgProbHuman.toFixed(1)}%</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon confidence">
            <FaChartBar />
          </div>
          <div className="stat-info">
            <h3>Avg Confidence</h3>
            <p className="stat-value">{stats.avgConfidence.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="reviews-controls">
        <div className="filter-section">
          <FaFilter className="filter-icon" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reviews</option>
            <option value="Human Review">Human Reviews</option>
            <option value="AI Review">AI Reviews</option>
          </select>
        </div>

        <button onClick={fetchReviews} className="refresh-btn">
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <div className="reviews-table-container">
        <table className="reviews-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product ID</th>
              <th>User ID</th>
              <th>Review Text</th>
              <th>Prediction</th>
              <th>AI Probability</th>
              <th>Human Probability</th>
              <th>Confidence</th>
              <th>Date</th>
              <th>LIME</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.id}</td>
                <td>{review.product_id}</td>
                <td>{review.user_id}</td>
                <td className="review-text-cell">
                  <div className="review-text-preview" title={review.text}>
                    {review.text?.substring(0, 100)}
                    {review.text?.length > 100 && '...'}
                  </div>
                </td>
                <td>
                  <span className={`prediction-badge ${review.predicted_class === 'AI Review' ? 'ai' : 'human'}`}>
                    {review.predicted_class === 'AI Review' ? <FaRobot /> : <FaUser />}
                    {review.predicted_class}
                  </span>
                </td>
                <td>
                  <div className="probability-bar">
                    <div className="probability-info">
                      <span>{(review.prob_ai * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill ai-bar"
                        style={{ width: `${review.prob_ai * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="probability-bar">
                    <div className="probability-info">
                      <span>{(review.prob_human * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill human-bar"
                        style={{ width: `${review.prob_human * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="confidence-indicator">
                    <div 
                      className="confidence-dot"
                      style={{ backgroundColor: getConfidenceColor(review.confidence) }}
                    />
                    {(review.confidence * 100).toFixed(1)}%
                  </div>
                </td>
                <td>{formatDate(review.created_at)}</td>
                <td>
                  {review.lime_explanation && Object.keys(review.lime_explanation).length > 0 ? (
                    <button 
                      className="view-lime-btn"
                      onClick={() => handleViewLime(review)}
                    >
                      <FaEye /> View
                    </button>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reviews.length === 0 && (
          <div className="no-reviews">
            <p>No reviews found</p>
          </div>
        )}
      </div>

      <LimeExplanationModal
        isOpen={showLimeModal}
        onClose={() => setShowLimeModal(false)}
        explanation={selectedReview?.lime_explanation}
        reviewText={selectedReview?.text}
      />
    </div>
  );
};

export default AdminReviews;
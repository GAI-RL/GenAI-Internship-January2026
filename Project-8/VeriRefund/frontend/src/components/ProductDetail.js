import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaRobot, FaUser } from 'react-icons/fa';
import { getProducts, getProductReviews, addReview } from '../api';
import AddReviewForm from './AddReviewForm';
import ReviewList from './ReviewList';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  const fetchProductAndReviews = async () => {
    try {
      setLoading(true);
      const [productsData, reviewsData] = await Promise.all([
        getProducts(),
        getProductReviews(id)
      ]);
      
      const currentProduct = productsData.find(p => p.id === parseInt(id));
      if (!currentProduct) {
        toast.error('Product not found');
        navigate('/');
        return;
      }
      
      setProduct(currentProduct);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (reviewText) => {
    if (!currentUser) {
      toast.error('Please login to add a review');
      return;
    }

    try {
      await addReview(parseInt(id), reviewText);
      toast.success('Review added successfully!');
      setShowReviewForm(false);
      // Refresh reviews
      const updatedReviews = await getProductReviews(id);
      setReviews(updatedReviews);
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/')} className="back-btn">
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  const aiReviews = reviews.filter(r => r.predicted_class === 'AI Review');
  const humanReviews = reviews.filter(r => r.predicted_class === 'Human Review');
  const userReview = reviews.find(r => r.user_id === currentUser?.user_id);

  return (
    <div className="product-detail-container">
      <button onClick={() => navigate(-1)} className="back-btn">
        <FaArrowLeft /> Back
      </button>

      <div className="product-detail-content">
        <div className="product-detail-image">
          <img 
            src={product.image || 'https://via.placeholder.com/500x400'} 
            alt={product.name}
          />
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-description">{product.description}</p>
          
          <div className="product-detail-price">
            ${product.price}
          </div>

          <div className="review-stats">
            <div className="stat-item">
              <FaRobot className="ai-icon" />
              <span className="stat-label">AI Reviews</span>
              <span className="stat-value">{aiReviews.length}</span>
            </div>
            <div className="stat-item">
              <FaUser className="human-icon" />
              <span className="stat-label">Human Reviews</span>
              <span className="stat-value">{humanReviews.length}</span>
            </div>
          </div>

          {currentUser && !userReview && !showReviewForm && (
            <button 
              className="add-review-btn"
              onClick={() => setShowReviewForm(true)}
            >
              Add Your Review
            </button>
          )}

          {showReviewForm && (
            <AddReviewForm 
              onSubmit={handleAddReview}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        <ReviewList reviews={reviews} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default ProductDetail;
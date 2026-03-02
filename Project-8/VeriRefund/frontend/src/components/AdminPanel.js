import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaBox, FaImage, FaDollarSign, FaAlignLeft, FaTag, FaMoneyBill, FaFileAlt, FaLink } from 'react-icons/fa';
import { addProduct } from '../api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await addProduct({
        ...formData,
        price: parseFloat(formData.price)
      });
      
      toast.success('Product added successfully!');
      setFormData({
        name: '',
        price: '',
        description: '',
        image: ''
      });
      
      // Navigate to home to see the new product
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>
          <FaBox className="header-icon" />
          Admin Panel
        </h1>
        <p>Add new products to the store</p>
      </div>

      <div className="admin-content">
        <div className="add-product-form-container">
          <h2>
            <FaPlus className="form-icon" />
            Add New Product
          </h2>

          <form onSubmit={handleSubmit} className="add-product-form">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <div className="input-wrapper">
                <FaTag className="input-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className={errors.name ? 'error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <div className="input-wrapper">
                <FaMoneyBill className="input-icon" />
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={errors.price ? 'error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <div className="input-wrapper">
                <FaFileAlt className="input-icon" />
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description (minimum 20 characters)"
                  rows="5"
                  className={errors.description ? 'error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.description && <span className="error-message">{errors.description}</span>}
              {formData.description && (
                <span className="char-count">
                  {formData.description.length} / 20 minimum
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="image">Image URL (Optional)</label>
              <div className="input-wrapper">
                <FaLink className="input-icon" />
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className={errors.image ? 'error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.image && <span className="error-message">{errors.image}</span>}
            </div>

            {formData.image && (
              <div className="image-preview">
                <img src={formData.image} alt="Preview" />
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Add Product'}
            </button>
          </form>
        </div>

        <div className="admin-info">
          <div className="info-card">
            <h3>Quick Tips</h3>
            <ul>
              <li>Product names should be clear and descriptive</li>
              <li>Use high-quality product images</li>
              <li>Write detailed descriptions to help customers</li>
              <li>Set competitive prices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
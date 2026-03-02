import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaEye } from 'react-icons/fa';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const placeholderImage = 'https://via.placeholder.com/300x200?text=Product+Image';

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image || placeholderImage} 
          alt={product.name}
          onError={(e) => {
            e.target.src = placeholderImage;
          }}
        />
        <div className="product-overlay">
          <Link to={`/product/${product.id}`} className="view-btn">
            <FaEye /> Quick View
          </Link>
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">
          {product.description?.substring(0, 100)}
          {product.description?.length > 100 ? '...' : ''}
        </p>
        
        <div className="product-footer">
          <span className="product-price">${product.price}</span>
          <Link to={`/product/${product.id}`} className="details-btn">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
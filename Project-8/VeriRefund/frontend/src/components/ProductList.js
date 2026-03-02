import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaShoppingBag } from 'react-icons/fa';
import { getProducts, searchProducts } from '../api';
import ProductCard from './ProductCard';
import SearchBar from './SearchBar';
import LoadingSpinner from './LoadingSpinner';
import './ProductList.css';

// In ProductList.js, add this right after imports
console.log('ProductCard:', ProductCard);
console.log('SearchBar:', SearchBar);
console.log('LoadingSpinner:', LoadingSpinner);

const ProductList = ({ currentUser }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    try {
      setLoading(true);
      const results = await searchProducts(query);
      setFilteredProducts(results);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <div className="header-content">
          <h1>
            <FaShoppingBag className="header-icon" />
            Discover Products
          </h1>
          <p>Find the best products with authentic reviews</p>
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="products-section">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <FaSearch className="no-products-icon" />
            <h3>No products found</h3>
            <p>Try searching with different keywords</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
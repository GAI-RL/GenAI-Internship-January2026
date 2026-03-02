import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8001';

// Debug: Log the API configuration
console.log('%c🔌 API Configuration:', 'color: #6366f1; font-weight: bold', {
    baseURL: API_BASE_URL,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// In api.js - Clean separation
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (isAdmin) {
      // Admin - just send admin flag
      config.headers['is-admin'] = 'true';
      // NO user_id needed!
    } else if (user?.user_id) {
      // Regular user - send their ID
      config.headers['X-User-Id'] = user.user_id;
    }
    
    return config;
  }
);

// Debug: Log all responses
api.interceptors.response.use(
  (response) => {
    // Debug: Log successful response
    console.group(`%c📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, 'color: #10b981; font-weight: bold');
    console.log('Status:', response.status, response.statusText);
    console.log('Data:', response.data);
    console.log('Response Time:', response.headers['x-response-time'] || 'N/A');
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();

    return response;
  },
  (error) => {
    // Debug: Log error response
    console.group('%c❌ API Error:', 'color: #ef4444; font-weight: bold');
    console.log('Message:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout Error: The server took too long to respond');
      toast.error('Server is taking too long to respond. Please check if backend is running.');
    } else if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Response Data:', error.response.data);
      console.log('Headers:', error.response.headers);
      
      // Specific error messages based on status
      switch (error.response.status) {
        case 400:
          toast.error('Bad request. Please check your input.');
          break;
        case 401:
          toast.error('Unauthorized. Please login again.');
          break;
        case 403:
          toast.error('Access denied. Admin privileges required.');
          break;
        case 404:
          toast.error('Resource not found on server.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(error.response.data?.detail || 'An error occurred');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('Request:', error.request);
      console.error('No response received from server');
      
      // Check if backend is running
      toast.error(
        'Cannot connect to backend server. Please ensure:\n' +
        '1. FastAPI server is running on http://localhost:8000\n' +
        '2. No firewall is blocking the connection\n' +
        '3. CORS is properly configured'
      );
    } else {
      // Something happened in setting up the request
      console.log('Error:', error.message);
      toast.error('Request setup error: ' + error.message);
    }
    
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

// Test backend connection
export const testBackendConnection = async () => {
  console.log('%c🔍 Testing Backend Connection...', 'color: #f59e0b; font-weight: bold');
  
  try {
    const startTime = performance.now();
    const response = await api.get('/health');
    const endTime = performance.now();
    
    console.log('%c✅ Backend Connection Successful!', 'color: #10b981; font-weight: bold', {
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      status: response.status,
      data: response.data,
      serverTime: response.headers.date
    });
    
    return {
      connected: true,
      responseTime: endTime - startTime,
      data: response.data
    };
  } catch (error) {
    console.error('%c❌ Backend Connection Failed!', 'color: #ef4444; font-weight: bold', {
      message: error.message,
      code: error.code
    });
    
    return {
      connected: false,
      error: error.message,
      code: error.code
    };
  }
};

// Auth APIs
export const signup = async (username, password) => {
  console.log('%c🔐 Signup Attempt:', 'color: #6366f1; font-weight: bold', { username });
  try {
    const response = await api.post('/signup', { username, password });
    console.log('%c✅ Signup Successful:', 'color: #10b981; font-weight: bold', response.data);
    return response.data;
  } catch (error) {
    console.error('%c❌ Signup Failed:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

export const login = async (username, password) => {
  console.log('%c🔐 Login Attempt:', 'color: #6366f1; font-weight: bold', { username });
  try {
    const response = await api.post('/login', { username, password });
    console.log('%c✅ Login Successful:', 'color: #10b981; font-weight: bold', response.data);
    return response.data;
  } catch (error) {
    console.error('%c❌ Login Failed:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

export const adminLogin = async (username, password) => {
  console.log('%c👑 Admin Login Attempt:', 'color: #f59e0b; font-weight: bold', { username });
  try {
    const response = await api.post('/admin/login', { username, password });
    console.log('%c✅ Admin Login Successful:', 'color: #10b981; font-weight: bold', response.data);
    return response.data;
  } catch (error) {
    console.error('%c❌ Admin Login Failed:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

// Product APIs
export const getProducts = async () => {
  console.log('%c📦 Fetching Products...', 'color: #6366f1; font-weight: bold');
  try {
    const response = await api.get('/products');
    console.log('%c✅ Products Fetched:', 'color: #10b981; font-weight: bold', {
      count: response.data.length,
      products: response.data
    });
    return response.data;
  } catch (error) {
    console.error('%c❌ Failed to Fetch Products:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

export const searchProducts = async (keyword) => {
  console.log('%c🔍 Searching Products:', 'color: #6366f1; font-weight: bold', { keyword });
  try {
    const response = await api.get('/search_products', {
      params: { keyword }
    });
    console.log('%c✅ Search Results:', 'color: #10b981; font-weight: bold', {
      keyword,
      count: response.data.length,
      results: response.data
    });
    return response.data;
  } catch (error) {
    console.error('%c❌ Search Failed:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  console.log('%c➕ Adding Product:', 'color: #6366f1; font-weight: bold', productData);
  try {
    const response = await api.post('/admin/add_product', productData);
    console.log('%c✅ Product Added:', 'color: #10b981; font-weight: bold', response.data);
    return response.data;
  } catch (error) {
    console.error('%c❌ Failed to Add Product:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

// Review APIs
export const addReview = async (productId, review) => {
  console.log('%c✍️ Adding Review:', 'color: #6366f1; font-weight: bold', { 
    productId, 
    reviewLength: review.length 
  });
  try {
    const response = await api.post('/reviews', {
      product_id: productId,
      review
    });
    console.log('%c✅ Review Added:', 'color: #10b981; font-weight: bold', response.data);
    return response.data;
  } catch (error) {
    console.error('%c❌ Failed to Add Review:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

export const getProductReviews = async (productId) => {
  console.log('%c📖 Fetching Reviews:', 'color: #6366f1; font-weight: bold', { productId });
  try {
    const response = await api.get(`/products/${productId}/reviews`);
    console.log('%c✅ Reviews Fetched:', 'color: #10b981; font-weight: bold', {
      productId,
      count: response.data.length,
      reviews: response.data
    });
    return response.data;
  } catch (error) {
    console.error('%c❌ Failed to Fetch Reviews:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

// Admin APIs
export const getAllReviews = async (filterClass = null) => {
  console.log('%c👑 Fetching All Reviews:', 'color: #f59e0b; font-weight: bold', { filterClass });
  try {
    const response = await api.get('/admin/reviews', {
      params: filterClass ? { filter_class: filterClass } : {}
    });
    console.log('%c✅ All Reviews Fetched:', 'color: #10b981; font-weight: bold', {
      filter: filterClass || 'all',
      count: response.data.length,
      aiReviews: response.data.filter(r => r.predicted_class === 'AI Review').length,
      humanReviews: response.data.filter(r => r.predicted_class === 'Human Review').length
    });
    return response.data;
  } catch (error) {
    console.error('%c❌ Failed to Fetch All Reviews:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  console.log('%c🏥 Checking Backend Health...', 'color: #6366f1; font-weight: bold');
  try {
    const response = await api.get('/health');
    console.log('%c✅ Backend Healthy:', 'color: #10b981; font-weight: bold', response.data);
    return response.data;
  } catch (error) {
    console.error('%c❌ Backend Unhealthy:', 'color: #ef4444; font-weight: bold', error);
    throw error;
  }
};

// Export all APIs
export default api;
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import AdminPanel from './components/AdminPanel';
import AdminReviews from './components/AdminReviews';
import AuthModal from './components/AuthModal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('isAdmin');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, admin = false) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(admin);
    localStorage.setItem('user', JSON.stringify(userData));
    if (admin) {
      localStorage.setItem('isAdmin', 'true');
    }
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  };

  if (loading) {
    return <div className="loading-app">Loading...</div>;
  }

  return (
    <div className="App">
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }} />
      
      <Navbar 
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuthModal(true)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProductList currentUser={currentUser} />} />
          <Route path="/product/:id" element={<ProductDetail currentUser={currentUser} />} />
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/reviews" 
            element={isAdmin ? <AdminReviews /> : <Navigate to="/" />} 
          />
        </Routes>
      </main>
    </div>
  );
  
}

export default App;
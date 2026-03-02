import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaCrown } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ isAuthenticated, isAdmin, currentUser, onLogout, onShowAuth }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">Online Store ReviewChecker</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            
            {isAdmin && (
              <>
                <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Admin Panel
                </Link>
                <Link to="/admin/reviews" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Review Monitor
                </Link>
              </>
            )}
          </div>

          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <div className="user-info">
                  <FaUser className="user-icon" />
                  <span className="username">{currentUser?.username}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button onClick={() => { onShowAuth(); setIsMenuOpen(false); }} className="login-btn">
                <FaUser />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
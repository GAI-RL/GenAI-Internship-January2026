// About.jsx
import React from 'react';
import './About.css'; // We'll create this CSS file next

const About = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="highlight">Authentify</span>
          </h1>
          <p className="hero-subtitle">
            Making AI Text More Reliable, Engaging, and Human
          </p>
          <div className="hero-decoration">
            <div className="decoration-dot"></div>
            <div className="decoration-line"></div>
            <div className="decoration-dot"></div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="section-container">
          <div className="mission-grid">
            <div className="mission-content">
              <h2 className="section-title">Our Mission</h2>
              <p className="mission-text">
                At Authentify, we're on a mission to bridge the gap between AI-generated content 
                and authentic human communication. We believe that AI should enhance, not replace, 
                the genuine human touch in writing.
              </p>
              <div className="mission-stats">
                <div className="stat-item">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Texts Refined</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">95%</span>
                  <span className="stat-label">Satisfaction Rate</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">AI Processing</span>
                </div>
              </div>
            </div>
            <div className="mission-image">
              <div className="image-placeholder">
                <svg viewBox="0 0 100 100" className="placeholder-svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0066cc" strokeWidth="2" />
                  <path d="M30 50 L45 65 L70 35" stroke="#0066cc" strokeWidth="3" fill="none" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title text-center">Why Choose Authentify?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Precision Refinement</h3>
              <p>Advanced algorithms that understand context and nuance, ensuring your text maintains its original meaning while sounding more natural.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Get refined text in seconds with our optimized processing engine, perfect for quick iterations and improvements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Multiple Tones</h3>
              <p>Choose from various writing styles - professional, casual, academic, or creative - to match your specific needs.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>Your content is processed securely and never stored. We respect your privacy and intellectual property.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Development Story */}
      <section className="development-section">
        <div className="section-container">
          <div className="development-grid">
            <div className="development-content">
              <h2 className="section-title">Born at NCAI</h2>
              <p className="development-text">
                Authentify was developed at the National Center for Artificial Intelligence (NCAI) 
                as a learning initiative to explore the intersection of AI and human communication. 
                What started as a student project quickly evolved into a powerful tool for making 
                AI-generated content more authentic and engaging.
              </p>
              <div className="development-highlight">
                <span className="highlight-quote">"</span>
                <p>Learning by doing - creating solutions that matter.</p>
                <span className="highlight-quote">"</span>
              </div>
            </div>
            <div className="development-badge">
              <div className="badge-container">
                <span className="badge-ncai">NCAI</span>
                <span className="badge-year">2024</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="section-container">
          <h2 className="section-title text-center">Our Team</h2>
          <p className="team-subtitle">Passionate learners and developers creating meaningful AI solutions</p>
          <div className="team-grid">
            <div className="team-card">
              <div className="team-avatar">
                <div className="avatar-placeholder">👨‍💻</div>
              </div>
              <h3>AI Research Team</h3>
              <p>Machine Learning Experts</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">
                <div className="avatar-placeholder">👩‍💻</div>
              </div>
              <h3>Development Team</h3>
              <p>Full Stack Developers</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">
                <div className="avatar-placeholder">🧑‍🔬</div>
              </div>
              <h3>UX Research Team</h3>
              <p>User Experience Specialists</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to make your AI text more human?</h2>
            <p>Join users who trust Authentify for their content refinement needs</p>
            <button className="cta-button" onClick={() => window.location.href = '/'}>
              Try It Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
const Features = () => {
  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" strokeLinecap="round"/>
          <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" strokeLinecap="round"/>
          <rect x="2" y="7" width="20" height="3" rx="1" fill="currentColor" fillOpacity="0.1"/>
          <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round"/>
          <line x1="8" y1="16" x2="16" y2="16" strokeLinecap="round"/>
        </svg>
      ),
      title: "No Word Limit",
      description: "Process documents, articles, and manuscripts of any length. From tweets to entire books—we handle it all without restrictions.",
      highlight: true
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round"/>
          <path d="M3 9h18" strokeLinecap="round"/>
          <path d="M9 21V9" strokeLinecap="round"/>
          <circle cx="15" cy="15" r="2" fill="currentColor" fillOpacity="0.2"/>
        </svg>
      ),
      title: "Smart Preservation",
      description: "Maintains key terminology and technical accuracy while transforming AI-sounding phrases into natural language.",
      highlight: false
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v4" strokeLinecap="round"/>
          <path d="M12 18v4" strokeLinecap="round"/>
          <path d="M4.93 4.93l2.83 2.83" strokeLinecap="round"/>
          <path d="M16.24 16.24l2.83 2.83" strokeLinecap="round"/>
          <path d="M2 12h4" strokeLinecap="round"/>
          <path d="M18 12h4" strokeLinecap="round"/>
          <path d="M4.93 19.07l2.83-2.83" strokeLinecap="round"/>
          <path d="M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2"/>
        </svg>
      ),
      title: "AI Score Detection",
      description: "Real-time AI probability scoring shows you exactly how human-like your text has become after refinement.",
      highlight: false
    }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .features-section {
          padding: 60px 24px;
          background: #ffffff;
          border-radius: 24px;
          margin: 40px 0;
        }

        .features-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .features-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .features-header h2 span {
          color: #2563eb;
        }

        .features-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 400;
        }

        .feature-highlight-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 48px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }

        .feature-highlight-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #2563eb;
        }

        .highlight-content {
          display: flex;
          gap: 32px;
          align-items: center;
          flex-wrap: wrap;
        }

        .highlight-icon-wrapper {
          flex-shrink: 0;
        }

        .highlight-icon {
          width: 170px;
          height: 179px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }

        .highlight-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* This ensures the image covers the entire area */
          border-radius: 24px;
        }

        .highlight-text {
          flex: 1;
        }

        .highlight-text h3 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #1e293b;
          margin-bottom: 12px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .highlight-text p {
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .highlight-text strong {
          color: #2563eb;
          font-weight: 600;
        }

        .highlight-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat-chip {
          background: #23385c;
          padding: 8px 16px;
          border-radius: 40px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e2e8f0;
        }

        .stat-chip-value {
          font-weight: 600;
          color: #ffffff;
          font-size: 1.1rem;
        }

        .stat-chip-label {
          color: #bbc6d4;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .feature-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }

        .feature-card:hover {
          border-color: #2563eb;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.1);
        }

        .feature-icon-wrapper {
          margin-bottom: 20px;
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          transition: all 0.2s ease;
        }

        .feature-card:hover .feature-icon {
          background: #2563eb;
          color: #ffffff;
          border-color: #0066CC30;
        }

        .feature-card h4 {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          color: #1e293b;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .feature-card p {
          font-family: 'Inter', sans-serif;
          color: #64748b;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .features-cta {
          background: #1e293b;
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          color: white;
        }

        .cta-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          margin-bottom: 12px;
          font-weight: 600;
          color: #ffffff;
        }

        .cta-content p {
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        .cta-button {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 16px 32px;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .cta-button:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
        }

        @media (max-width: 768px) {
          .features-header h2 {
            font-size: 2rem;
          }
          
          .highlight-content {
            flex-direction: column;
            text-align: center;
          }
          
          .highlight-stats {
            justify-content: center;
          }
          
          .feature-highlight-card {
            padding: 24px;
          }
          
          .features-cta {
            padding: 32px 24px;
          }
          
          .cta-content h3 {
            font-size: 1.6rem;
          }
        }
      `}</style>

      <div className="features-section">
        <div className="features-header">
          <h2>Powerful Features for <span>Limitless Writing</span></h2>
          <p className="features-subtitle">
            Transform AI-generated content into authentic, human-like text with our advanced refinement engine
          </p>
        </div>

        {/* Highlighted Feature - No Word Limit */}
        <div className="feature-highlight-card">
          <div className="highlight-content">
            <div className="highlight-icon-wrapper">
              <div className="highlight-icon">
                {/* Image from assets folder */}
                <img 
                  src="src/assets/words3.png" // Update this path to match your image filename
                  alt="Unlimited Words"
                />
              </div>
            </div>
            <div className="highlight-text">
              <h3>No Word Limit — Ever.</h3>
              <p>
                Unlike other tools that restrict you to a few hundred words, Authentify handles text of any length. 
                From blog posts to research papers, from entire books to technical documentation — 
                <strong> process unlimited content without compromise.</strong>
              </p>
              <div className="highlight-stats">
                <div className="stat-chip">
                  <span className="stat-chip-value">∞</span>
                  <span className="stat-chip-label">Unlimited Words</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-chip-value">+</span>
                  <span className="stat-chip-label">Preserves Meaning</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-chip-value">📚</span>
                  <span className="stat-chip-label">Book-length ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card ${feature.highlight ? 'highlighted' : ''}`}>
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  {feature.icon}
                </div>
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="features-cta">
          <div className="cta-content">
            <h3>Ready to humanize your content?</h3>
            <p>No sign-up required. No word limits. Start refining right now.</p>
            <button className="cta-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span>Try It Now</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" strokeLinecap="round"/>
                <path d="M12 5l7 7-7 7" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Features;
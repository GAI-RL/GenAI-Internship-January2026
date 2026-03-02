import logo from '../assets/Authentify.png';

const Header = () => {
  const scrollToFeatures = () => {
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>    
      <header className="app-header">
        <div className="app-header-content">
          <div className="app-brand">
            <div className="app-logo">
              <div className="app-logo-image">
                <img 
                  src={logo} 
                  alt="Authentify Logo" 
                  className="app-logo-img"
                />
              </div>
              <h1>Authentify</h1>
            </div>
          </div>
          
          <div className="app-header-divider"></div>
          
          <p className="app-subtitle">Human-Centric AI Text Refinement</p>
          
          <div className="app-header-right">
            <button 
              className="app-about-btn" 
              onClick={scrollToFeatures}
            >
              About
              
            </button>
          </div>
        </div>

        <style jsx>{`
          .app-header {
            background: white;
            border-bottom: 2px solid #E5EFF9;
            padding: 1.25rem 0;
            width: 100vw;
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0, 102, 204, 0.12);
            margin: 0;
          }

          .app-header-content {
            display: flex;
            align-items: center;
            gap: 2.5rem;
            width: 100%;
            padding: 0 2.5rem;
            box-sizing: border-box;
            max-width: 1400px;
            margin: 0 auto;
          }

          .app-brand {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          .app-logo {
            display: flex;
            align-items: center;
            gap: 1.25rem;
          }

          .app-logo-image {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .app-logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .app-header h1 {
            font-size: 1.9rem;
            font-weight: 600;
            color: #003366;
            margin: 0;
            letter-spacing: -0.3px;
            white-space: nowrap;
            background: linear-gradient(135deg, #003366 0%, #2c3e50 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .app-header-divider {
            width: 2px;
            height: 36px;
            background: linear-gradient(to bottom, transparent, #0066CC, transparent);
            flex-shrink: 0;
          }

          .app-subtitle {
            color: #2c3e50;
            font-size: 1.1rem;
            margin: 0;
            font-weight: 400;
            opacity: 0.85;
            white-space: nowrap;
            flex: 1;
            text-align: left;
          }

          .app-header-right {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          .app-about-btn {
            padding: 10px 24px;
            border: none;
            background: transparent;
            color: #003366;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            box-shadow: none;
            margin: 0;
            width: auto;
            position: relative;
            cursor: pointer;
          }

          .app-about-btn::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 2px;
            background: #2563eb;
            transition: width 0.3s ease;
          }

          .app-about-btn:hover {
            color: #ffffff;
          }

          .app-about-btn:hover::after {
            width: 70%;
          }

          @media (max-width: 768px) {
            .app-header-content {
              padding: 0 1.5rem;
              gap: 1.5rem;
            }
            
            .app-subtitle {
              font-size: 1rem;
            }
          }

          @media (max-width: 640px) {
            .app-header {
              padding: 1rem 0;
            }

            .app-header-content {
              flex-wrap: wrap;
              gap: 0.75rem;
              padding: 0 1rem;
            }
            
            .app-header-divider {
              display: none;
            }

            .app-logo-image {
              width: 40px;
              height: 40px;
            }

            .app-header h1 {
              font-size: 1.6rem;
            }

            .app-subtitle {
              font-size: 0.95rem;
              white-space: normal;
              text-align: left;
              order: 3;
              width: 100%;
              margin-left: 52px;
            }
            
            .app-header-right {
              order: 2;
              margin-left: auto;
            }
            
            .app-about-btn {
              padding: 8px 16px;
              font-size: 0.9rem;
            }
          }

          @media (max-width: 480px) {
            .app-header-content {
              padding: 0 0.75rem;
            }
            
            .app-subtitle {
              margin-left: 0;
            }
          }
        `}</style>
      </header>
    </>
  );
};

export default Header;
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="copyright">
          © {currentYear} Authentify. All rights reserved.
        </p>
        <div className="support">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4L8 8L14 4M2 12H14V4H2V12Z" stroke="#0066CC" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <a href="mailto:support@authentify.ai">support@authentify.ai</a>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: white;
          border-top: 1px solid #E5EFF9;
          padding: 1.2rem 0;
          width: 100%;
          margin-top: 3rem;
        }

        .footer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          box-sizing: border-box;
        }

        .copyright {
          color: #6688AA;
          font-size: 0.85rem;
          margin: 0;
        }

        .support {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .support a {
          color: #0066CC;
          font-size: 0.85rem;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .support a:hover {
          color: #003366;
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .footer-content {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }

          .copyright {
            font-size: 0.8rem;
          }

          .support a {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
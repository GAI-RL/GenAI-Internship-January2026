import React, { useState } from 'react';
import { testBackendConnection, healthCheck, getProducts } from '../api';
import './DebugPanel.css';

const DebugPanel = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendInfo, setBackendInfo] = useState(null);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testBackendConnection();
      setTestResult(result);
      
      if (result.connected) {
        // Also test other endpoints
        const health = await healthCheck();
        const products = await getProducts();
        setBackendInfo({
          health,
          productCount: products.length
        });
      }
    } catch (error) {
      console.error('Debug test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="debug-panel">
      <h3>🔧 Backend Connection Debug</h3>
      
      <button 
        onClick={handleTestConnection} 
        disabled={loading}
        className="debug-btn"
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>

      {testResult && (
        <div className={`test-result ${testResult.connected ? 'success' : 'error'}`}>
          <h4>{testResult.connected ? '✅ Connected' : '❌ Connection Failed'}</h4>
          <pre>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}

      {backendInfo && (
        <div className="backend-info">
          <h4>📊 Backend Info</h4>
          <pre>{JSON.stringify(backendInfo, null, 2)}</pre>
        </div>
      )}

      <div className="debug-instructions">
        <h4>📝 Troubleshooting Steps:</h4>
        <ol>
          <li>Make sure FastAPI server is running: <code>uvicorn main:app --reload</code></li>
          <li>Check if server is on port 8000: <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a></li>
          <li>Verify CORS is enabled in backend</li>
          <li>Check browser console for detailed logs (F12)</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPanel;
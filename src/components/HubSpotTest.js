import React, { useState } from 'react';
import axios from 'axios';

const HubSpotTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testDirectFunction = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Test the test-hubspot function
      const response = await axios.get('/.netlify/functions/test-hubspot');
      setResult(response.data);
    } catch (err) {
      console.error('Error testing HubSpot:', err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const testProxyFunction = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Test the hubspot-proxy function with explicit endpoint
      const response = await axios.get('/.netlify/functions/hubspot-proxy/crm/v3/objects/contacts', {
        params: { limit: 1 }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Error testing HubSpot proxy:', err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>HubSpot API Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testDirectFunction} 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Direct Function
        </button>
        
        <button 
          onClick={testProxyFunction} 
          disabled={loading}
          style={{ 
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Proxy Function
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Error:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '15px', 
          borderRadius: '4px' 
        }}>
          <h3>Success:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default HubSpotTest; 
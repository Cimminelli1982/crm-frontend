import React, { useState } from 'react';
import axios from 'axios';

const HubSpotMigrationTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [secretKey, setSecretKey] = useState('');

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await axios.post('/.netlify/functions/companies-hubspot-supabase-migration', {
        limit,
        offset
      }, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResult(response.data);
      
      // Auto-update offset for next batch if there are more items
      if (response.data.remaining > 0) {
        setOffset(response.data.next_offset);
      }
    } catch (err) {
      console.error('Error running HubSpot migration:', err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>HubSpot Companies Migration Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Secret Key:
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                marginTop: '5px'
              }}
              placeholder="Enter your migration secret key"
            />
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <label>
            Limit:
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              style={{ 
                width: '70px', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc' 
              }}
              min="1"
              max="100"
            />
          </label>
          
          <label>
            Offset:
            <input
              type="number"
              value={offset}
              onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
              style={{ 
                width: '70px', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc' 
              }}
              min="0"
            />
          </label>
        </div>
        
        <button 
          onClick={runMigration} 
          disabled={loading || !secretKey}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || !secretKey) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Running Migration...' : 'Run Migration'}
        </button>
      </div>
      
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
          <h3>Migration Results:</h3>
          <div style={{ marginBottom: '10px' }}>
            <p><strong>Message:</strong> {result.message}</p>
            <p><strong>Timestamp:</strong> {result.timestamp}</p>
            <p><strong>Next Offset:</strong> {result.next_offset}</p>
            <p><strong>Total Count:</strong> {result.total_count}</p>
            <p><strong>Remaining:</strong> {result.remaining}</p>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <h4>Stats:</h4>
            <ul>
              <li>Processed: {result.stats.processed}</li>
              <li>Enriched: {result.stats.enriched}</li>
              <li>Skipped: {result.stats.skipped}</li>
              <li>Errors: {result.stats.errors}</li>
            </ul>
          </div>
          
          <div>
            <h4>Details:</h4>
            <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          </div>
          
          {result.remaining > 0 && (
            <div style={{ marginTop: '15px' }}>
              <button 
                onClick={runMigration} 
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
                Process Next Batch
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HubSpotMigrationTest;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HubSpotMigrationTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [secretKey, setSecretKey] = useState('');
  const [envVarsStatus, setEnvVarsStatus] = useState(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalEnriched, setTotalEnriched] = useState(0);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState(false);

  // Check if we should pre-fill the secret key from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('hubspot_migration_key');
    if (savedKey) {
      setSecretKey(savedKey);
    }
  }, []);

  // Save key to local storage when changed
  useEffect(() => {
    if (secretKey) {
      localStorage.setItem('hubspot_migration_key', secretKey);
    }
  }, [secretKey]);

  // Check environment variables status
  const checkEnvironment = async () => {
    try {
      const response = await axios.post('/.netlify/functions/companies-hubspot-supabase-migration', {
        limit: 1,
        offset: 0,
        check_environment: true
      }, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      setEnvVarsStatus(response.data.env_vars_set || {
        status: 'Unknown',
        message: 'Could not determine environment variables status'
      });
    } catch (err) {
      console.error('Error checking environment:', err);
      setEnvVarsStatus({
        status: 'Error',
        message: err.response?.data?.env_vars_set || 'Failed to check environment variables'
      });
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Attempting migration with secret key:', secretKey);
      console.log('Using limit:', limit, 'and offset:', offset);
      
      // Call the function endpoint
      try {
        const response = await axios.post('/.netlify/functions/companies-hubspot-supabase-migration', {
          limit,
          offset,
          scheduled
        }, {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        });
      
        setResult(response.data);
        
        // Update totals
        if (response.data.stats) {
          setTotalProcessed(prev => prev + response.data.stats.processed);
          setTotalEnriched(prev => prev + response.data.stats.enriched);
        }
        
        // Add to history
        setHistory(prev => [
          {
            timestamp: new Date().toISOString(),
            offset,
            limit,
            stats: response.data.stats,
            success: true
          },
          ...prev.slice(0, 9) // Keep only last 10 entries
        ]);
        
        // Auto-update offset for next batch if there are more items
        if (response.data.remaining > 0) {
          setOffset(response.data.next_offset);
        }
      } catch (directError) {
        console.error('Error with function call:', directError);
        console.log('Response error:', directError.response?.data);
        
        // Add to history
        setHistory(prev => [
          {
            timestamp: new Date().toISOString(),
            offset,
            limit,
            error: directError.response?.data || directError.message,
            success: false
          },
          ...prev.slice(0, 9) // Keep only last 10 entries
        ]);
        
        // Show detailed error
        setError({
          message: 'Function request failed',
          status: directError.response?.status,
          statusText: directError.response?.statusText,
          data: directError.response?.data,
          originalError: directError.message,
          path: '/.netlify/functions/companies-hubspot-supabase-migration'
        });
      }
    } catch (err) {
      console.error('Error running HubSpot migration:', err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetStats = () => {
    setTotalProcessed(0);
    setTotalEnriched(0);
    setHistory([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>HubSpot Companies Migration Tool</h1>
      <p>Use this tool to enrich Supabase companies with data from HubSpot.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '20px' 
      }}>
        {/* Left column - Controls */}
        <div>
          <div style={{ 
            padding: '15px',
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Configuration</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>
                Batch Size:
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                  style={{ 
                    width: '70px', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    marginLeft: '8px'
                  }}
                  min="1"
                  max="100"
                />
              </label>
              
              <label style={{ fontWeight: 'bold' }}>
                Offset:
                <input
                  type="number"
                  value={offset}
                  onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                  style={{ 
                    width: '90px', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    marginLeft: '8px'
                  }}
                  min="0"
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={scheduled}
                  onChange={(e) => setScheduled(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Mark as scheduled run (for logging purposes)
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={runMigration} 
                disabled={loading || !secretKey}
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (loading || !secretKey) ? 'not-allowed' : 'pointer',
                  flex: '1'
                }}
              >
                {loading ? 'Running Migration...' : 'Run Migration'}
              </button>
              
              <button 
                onClick={checkEnvironment} 
                disabled={loading || !secretKey}
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (loading || !secretKey) ? 'not-allowed' : 'pointer'
                }}
              >
                Check Env
              </button>
            </div>
          </div>
          
          {/* Session Stats */}
          <div style={{ 
            padding: '15px',
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Session Statistics</h3>
              <button 
                onClick={resetStats}
                style={{ 
                  padding: '6px 12px', 
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                Reset
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#e2e3e5', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#495057' }}>Total Processed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>{totalProcessed}</div>
              </div>
              
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#d1e7dd', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f5132' }}>Total Enriched</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f5132' }}>{totalEnriched}</div>
              </div>
            </div>
            
            <h4 style={{ marginBottom: '10px', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>Run History</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <p style={{ color: '#6c757d', textAlign: 'center', fontStyle: 'italic' }}>No history yet</p>
              ) : (
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                  {history.map((item, index) => (
                    <li key={index} style={{ 
                      padding: '8px', 
                      backgroundColor: item.success ? '#f8f9fa' : '#f8d7da',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span style={{ fontWeight: 'bold', color: item.success ? '#0f5132' : '#842029' }}>
                          {item.success ? 
                            `Processed: ${item.stats.processed}, Enriched: ${item.stats.enriched}` : 
                            'Failed'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Results */}
        <div>
          {envVarsStatus && (
            <div style={{ 
              backgroundColor: '#cff4fc', 
              color: '#055160', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #b6effb'
            }}>
              <h3 style={{ marginTop: 0 }}>Environment Variables Status</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {JSON.stringify(envVarsStatus, null, 2)}
              </pre>
            </div>
          )}
          
          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f5c2c7'
            }}>
              <h3 style={{ marginTop: 0 }}>Error:</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
          
          {result && (
            <div style={{ 
              backgroundColor: '#d4edda', 
              color: '#155724', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid #c3e6cb', paddingBottom: '8px' }}>Migration Results</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div>
                  <p><strong>Message:</strong> {result.message}</p>
                  <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p><strong>Next Offset:</strong> {result.next_offset}</p>
                  <p><strong>Remaining:</strong> {result.remaining} of {result.total_count}</p>
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                gap: '10px',
                marginBottom: '15px' 
              }}>
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#e2e3e5', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#495057' }}>Processed</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#212529' }}>{result.stats.processed}</div>
                </div>
                
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#d1e7dd', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f5132' }}>Enriched</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f5132' }}>{result.stats.enriched}</div>
                </div>
                
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#fff3cd', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#664d03' }}>Skipped</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#664d03' }}>{result.stats.skipped}</div>
                </div>
                
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: result.stats.errors > 0 ? '#f8d7da' : '#e2e3e5',  
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold', 
                    color: result.stats.errors > 0 ? '#842029' : '#495057'  
                  }}>Errors</div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    color: result.stats.errors > 0 ? '#842029' : '#212529'  
                  }}>{result.stats.errors}</div>
                </div>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '10px' }}>Details:</h4>
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto', 
                  border: '1px solid #c3e6cb', 
                  borderRadius: '4px', 
                  padding: '10px',
                  backgroundColor: '#f8f9fa' 
                }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              </div>
              
              {result.remaining > 0 && (
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <button 
                    onClick={runMigration} 
                    disabled={loading}
                    style={{ 
                      padding: '10px 20px', 
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Process Next Batch ({result.remaining} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HubSpotMigrationTest;
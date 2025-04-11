import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from 'ag-grid-react';

// Styled components
const Container = styled.div`
  padding: 20px;
  height: calc(100vh - 120px);
  width: 100%;
`;

const Title = styled.h1`
  color: #00ff00;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
`;

const ErrorText = styled.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const LoadingContainer = styled.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingBar = styled.div`
  width: 300px;
  height: 8px;
  background-color: #111;
  margin: 20px 0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background-color: #00ff00;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px #00ff00;
    border-radius: 4px;
  }
  
  @keyframes pulse {
    0% {
      left: -30%;
      opacity: 0.8;
    }
    100% {
      left: 100%;
      opacity: 0.2;
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 15px;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  letter-spacing: 1px;
  font-size: 16px;
  opacity: 0.9;
  animation: blink 1.5s ease-in-out infinite alternate;
  
  @keyframes blink {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
`;

const LoadingMatrix = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #00ff00;
  text-align: center;
  margin-top: 30px;
  height: 100px;
  width: 300px;
  overflow: hidden;
  position: relative;
  
  &:after {
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000011 01101111 01101110 01110100 01100001 01100011 01110100 01110011 00101110 00101110 00101110";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(to bottom, transparent, #000 80%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    opacity: 0.7;
    text-shadow: 0 0 5px #00ff00;
    animation: matrix 5s linear infinite;
  }
  
  @keyframes matrix {
    0% { transform: translateY(-60px); }
    100% { transform: translateY(60px); }
  }
`;

const Badge = styled.span`
  display: inline-block;
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 2px 6px;
  margin-right: 3px;
  border-radius: 4px;
  font-size: 11px;
`;

// Simple frequency renderer
const FrequencyRenderer = (props) => {
  const frequency = props.value;
  if (!frequency) return '-';
  return frequency;
};


// Renderer for the snooze days
const SnoozeDaysRenderer = (props) => {
  const days = props.value || 0;
  if (days <= 0) return '-';
  
  return (
    <span style={{ 
      color: '#00ff00',
      backgroundColor: '#222',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '11px'
    }}>
      +{days} days
    </span>
  );
};

const SimpleKeepInTouch = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true); // Can be true/false or a string message
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false); // Flag to prevent multiple data loads
  const [showGrid, setShowGrid] = useState(false); // Flag to control grid visibility with delay
  const navigate = useNavigate();
  
  // Column definitions with improved display of related data
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Contact', 
      field: 'full_name',
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
    },
    { 
      headerName: 'Why Keep in Touch', 
      field: 'why_keeping_in_touch',
      valueGetter: (params) => {
        return params.data?.why_keeping_in_touch || '-';
      },
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 150,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Frequency', 
      field: 'frequency',
      valueFormatter: (params) => params.value || '-',
      minWidth: 130,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Snooze Days', 
      field: 'snooze_days', 
      cellRenderer: SnoozeDaysRenderer,
      width: 120,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Next Interaction', 
      field: 'next_interaction_date', 
      valueFormatter: (params) => {
        if (!params.value) return '-';
        
        const date = new Date(params.value);
        const today = new Date();
        const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) return 'DUE';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 180,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
      cellStyle: params => {
        if (!params.value) return { color: '#cccccc' };
        
        const date = new Date(params.value);
        const today = new Date();
        const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) return { color: '#ff4444', fontWeight: 'bold' }; // Overdue
        if (daysUntil <= 7) return { color: '#00ff00', fontWeight: 'bold' }; // Coming soon
        return { color: '#cccccc' }; // Normal
      }
    },
    { 
      headerName: 'Next Follow-up Notes', 
      field: 'next_follow_up_notes', 
      valueGetter: (params) => {
        return params.data?.next_follow_up_notes || '-';
      },
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);

  // Grid ready event handler - wrapped in React.useCallback to prevent recreation
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    // Wait for a tick to ensure grid is properly initialized
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Row clicked handler - wrapped in React.useCallback to prevent recreation
  const handleRowClicked = React.useCallback((params) => {
    // We don't have contact_id in the view, so we need to implement a different approach
    // For now, just log the clicked row
    console.log('Row clicked:', params.data);
  }, [navigate]);

  // Fetch data from v_keep_in_touch view
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Helper function to retry failed Supabase requests
      const retrySupabaseRequest = async (request, maxRetries = 3, delay = 1000) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await request();
          } catch (err) {
            console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, err);
            lastError = err;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for next attempt (exponential backoff)
            delay *= 1.5;
          }
        }
        // If we get here, all retries failed
        throw lastError;
      };
      
      setLoading('Accessing Keep in Touch data...');
      
      // Fetch data from v_keep_in_touch
      const { data, error } = await retrySupabaseRequest(async () => {
        return supabase
          .from('v_keep_in_touch')
          .select('*')
          .order('days_until_next', { ascending: true });
      });
      
      if (error) throw error;
      
      // Process the data
      console.log(`Fetched ${data.length} contacts from v_keep_in_touch`);
      
      setContacts(data);
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
      
    } catch (err) {
      console.error('Error fetching keep in touch data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data ONLY on component mount (empty dependency array)
  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!dataLoaded) {
      console.log('Initiating data fetch');
      fetchContacts();
    }
  }, [dataLoaded]);
  
  // Separate effect for window resize
  useEffect(() => {
    // Only add resize handler if gridApi exists
    if (!gridApi) return;
    
    const handleResize = () => {
      gridApi.sizeColumnsToFit();
    };
    
    // Use the resize event with options object (passive: true)
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize, { passive: true });
    };
  }, [gridApi]);

  return (
    <Container>
      <Title>Keep in Touch ({contacts.length})</Title>
      
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {loading !== false ? (
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' 
              ? loading.replace(/Loading .+ \d+\/\d+/, 'Initializing Matrix') 
              : 'Accessing Keep in Touch Database...'}
          </LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : !showGrid && !error ? (
        <LoadingContainer>
          <LoadingText>Preparing interface...</LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : contacts.length === 0 && !error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No keep in touch data found. Try refreshing the page or check database connection.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 60px)', 
            width: '100%',
            opacity: showGrid ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': '#2a2a2a',
            '--ag-border-color': '#333333'
          }}
        >
          <AgGridReact
            rowData={contacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            suppressCellFocus={true}
            enableCellTextSelection={true}
          />
        </div>
      )}
    </Container>
  );
};

export default SimpleKeepInTouch;
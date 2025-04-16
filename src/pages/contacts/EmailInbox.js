import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 20px 40px 20px 20px;
  height: calc(100vh - 60px);
  width: 100%;
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
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000101 01101101 01100001 01101001 01101100 01110011 00101110 00101110 00101110";
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

const ActionButton = styled.button`
  background-color: ${props => props.color || 'transparent'};
  color: ${props => props.textColor || 'white'};
  border: 1px solid ${props => props.borderColor || 'transparent'};
  border-radius: 4px;
  padding: 5px 10px;
  margin: 0 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Direction renderer to show arrow icons
const DirectionCellRenderer = (props) => {
  if (!props.value) return null;
  
  if (props.value.toLowerCase() === 'sent') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        paddingTop: '8px' 
      }}>
        <FiArrowRight color="#00aaff" size={18} />
      </div>
    );
  } else {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        paddingTop: '8px'
      }}>
        <FiArrowLeft color="#00ff00" size={18} />
      </div>
    );
  }
};

// Cell renderer for action buttons
const ActionCellRenderer = (props) => {
  const handleSkip = () => {
    if (props.onSkip) {
      props.onSkip(props.data);
    }
  };
  
  const handleAddToCRM = () => {
    if (props.onAddToCRM) {
      props.onAddToCRM(props.data);
    }
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '8px',
      paddingBottom: '4px',
      height: '100%'
    }}>
      <ActionButton 
        onClick={handleSkip} 
        color="#333" 
        textColor="#ff5555" 
        borderColor="#ff5555"
      >
        <FiXCircle /> Skip
      </ActionButton>
      <ActionButton 
        onClick={handleAddToCRM}
        color="#333"
        textColor="#55ff55"
        borderColor="#55ff55"
      >
        <FiCheckCircle /> Add to CRM
      </ActionButton>
    </div>
  );
};

const EmailInbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const navigate = useNavigate();
  
  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Direction', 
      field: 'direction',
      minWidth: 80,
      width: 80,
      cellRenderer: DirectionCellRenderer,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['sent', 'received'],
      },
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Contact', 
      field: 'contact_name',
      valueGetter: params => {
        if (!params.data) return '';
        // If direction is sent, use to_name, otherwise use from_name
        return params.data.direction?.toLowerCase() === 'sent' 
          ? params.data.to_name 
          : params.data.from_name;
      },
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Subject', 
      field: 'subject',
      minWidth: 230,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Message', 
      field: 'message_text',
      valueFormatter: params => {
        if (!params.value) return '';
        return params.value.length > 100 
          ? params.value.substring(0, 100) + '...' 
          : params.value;
      },
      minWidth: 300,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Date', 
      field: 'message_timestamp',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
      },
      minWidth: 100,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    {
      headerName: 'Actions',
      minWidth: 220,
      width: 220,
      cellRenderer: ActionCellRenderer,
      cellRendererParams: {
        onSkip: handleSkipEmail,
        onAddToCRM: handleAddToCRM
      },
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true
  }), []);

  // Grid ready event handler
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    // Wait for a tick to ensure grid is properly initialized
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Handle skipping an email
  async function handleSkipEmail(emailData) {
    console.log('Skip email clicked:', emailData);
    // Implementation will be added later
  }
  
  // Handle adding email sender to CRM
  async function handleAddToCRM(emailData) {
    console.log('Add to CRM clicked:', emailData);
    // Implementation will be added later
  }

  // Fetch emails from email_inbox table
  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch emails from the email_inbox table
      const { data, error } = await supabase
        .from('email_inbox')
        .select('*')
        .order('message_timestamp', { ascending: false });
      
      if (error) throw error;
      
      console.log(`Successfully fetched ${data.length} emails`);
      setEmails(data || []);
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!dataLoaded) {
      console.log('Initiating email inbox data fetch');
      fetchEmails();
    }
  }, [dataLoaded]);
  
  // Handle window resize
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
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {loading !== false ? (
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' 
              ? loading 
              : 'Accessing Email Database...'}
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
      ) : emails.length === 0 && !error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No emails found. The inbox is empty.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 60px)', 
            width: 'calc(100% - 20px)',
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
            rowData={emails}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            sortingOrder={['desc', 'asc', null]}
            sortModel={[
              { colId: 'message_timestamp', sort: 'desc' }
            ]}
          />
        </div>
      )}
    </Container>
  );
};

export default EmailInbox;
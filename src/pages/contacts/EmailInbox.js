import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

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
      headerName: 'From Name', 
      field: 'from_name',
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'From Email', 
      field: 'from_email',
      minWidth: 170,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Subject', 
      field: 'subject',
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
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 120,
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
    try {
      setLoading(true);
      
      // Add record to emails_spam table
      const insertResult = await supabase
        .from('emails_spam')
        .insert([{ 
          email: emailData.from_email,
          counter: 1
        }]);
      
      if (insertResult.error) {
        console.error('Error inserting to emails_spam:', insertResult.error);
        throw new Error(insertResult.error.message || 'Failed to add to spam list');
      }
      
      // Delete the email record from email_inbox
      const deleteResult = await supabase
        .from('email_inbox')
        .delete()
        .eq('id', emailData.id);
      
      if (deleteResult.error) {
        console.error('Error deleting from email_inbox:', deleteResult.error);
        throw new Error(deleteResult.error.message || 'Failed to delete email');
      }
      
      // Remove the email from the local state
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailData.id));
      
      console.log(`Email from ${emailData.from_email} added to emails_spam and removed`);
      setLoading(false);
    } catch (err) {
      console.error('Error skipping email:', err);
      setError(`Failed to skip email: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }
  
  // Handle adding email sender to CRM
  async function handleAddToCRM(emailData) {
    try {
      setLoading(true);
      
      // Update the email record to set special_case to null and start_trigger to true
      const { error: updateError } = await supabase
        .from('email_inbox')
        .update({ 
          special_case: null,
          start_trigger: true
        })
        .eq('id', emailData.id);
      
      if (updateError) throw updateError;
      
      // Remove the email from the local state
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailData.id));
      
      console.log(`Email marked for processing: ${emailData.from_email}`);
      setLoading(false);
    } catch (err) {
      console.error('Error marking email for processing:', err);
      setError(`Failed to process email: ${err.message}`);
      setLoading(false);
    }
  }

  // Fetch emails from email_inbox table with special_case = 'pending_approval'
  const fetchEmails = async () => {
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
      
      // Fetch emails from the email_inbox table
      const { data, error } = await retrySupabaseRequest(async () => {
        return supabase
          .from('email_inbox')
          .select('*')
          .eq('special_case', 'pending_approval')
          .order('message_timestamp', { ascending: false });
      });
      
      if (error) throw error;
      
      console.log(`Successfully fetched ${data.length} pending approval emails`);
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
      <Title>Email Inbox ({emails.length})</Title>
      
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
          No pending emails found. All emails have been processed.
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
          />
        </div>
      )}
    </Container>
  );
};

export default EmailInbox;
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiUser, FiCalendar } from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 20px 40px 20px 20px;
  height: calc(100vh - 60px);
  width: 100%;
  
  .clickable-cell {
    cursor: default;
  }
  
  .name-cell-clickable {
    cursor: pointer;
  }
  
  .ag-row {
    cursor: default;
  }
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

const SkipInbox = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  const navigate = useNavigate();
  
  // Simpler name formatter function
  const formatName = (params) => {
    if (!params.data) return '';
    const firstName = params.data.first_name || '';
    const lastName = params.data.last_name || '';
    return `${firstName} ${lastName}`.trim() || '(No name)';
  };
  
  // React cell renderer for name column
  const NameCellRenderer = (props) => {
    const navigate = useNavigate();
    const value = props.valueFormatted || props.value || '';

    const handleClick = (e) => {
      e.stopPropagation();
      if (props.data && props.data.contact_id) {
        // Navigate to ContactCrmWorkflow page when clicking on a name
        navigate(`/contacts/workflow/${props.data.contact_id}`);
      }
    };

    return (
      <div
        className="name-link"
        style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
        onClick={handleClick}
      >
        {value}
      </div>
    );
  };

  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Name', 
      field: 'name',
      valueGetter: formatName,
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
      cellClass: 'name-cell-clickable',
      cellRenderer: NameCellRenderer
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 140,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Category', 
      field: 'category',
      minWidth: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      cellRenderer: (params) => {
        const value = params.value || '-';
        return <span style={{ color: '#ff9900' }}>{value}</span>;
      }
    },
    { 
      headerName: 'Mobile', 
      field: 'mobile',
      valueGetter: (params) => {
        if (!params.data) return '';
        return params.data.mobile || '-';
      },
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      cellRenderer: (params) => {
        const value = params.value || '-';
        if (value === '-') return value;
        return <span style={{ color: '#cccccc' }}>{value}</span>;
      }
    },
    { 
      headerName: 'Email', 
      field: 'email',
      valueGetter: (params) => {
        if (!params.data) return '';
        return params.data.email || '-';
      },
      minWidth: 250,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      cellRenderer: (params) => {
        const value = params.value || '-';
        if (value === '-') return value;
        return <span style={{ color: '#cccccc' }}>{value}</span>;
      }
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    cellClass: 'clickable-cell'
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

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
    if (params.data && params.data.contact_id) {
      console.log('Row clicked, navigating to workflow page', params.data);
      navigate(`/contacts/workflow/${params.data.contact_id}`);
    }
  }, [navigate]);

  // Fetch contacts with last interactions within the last 90 days
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
      
      // Calculate date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const formattedDate = ninetyDaysAgo.toISOString();
      
      // Get contacts count with retry
      const { count, error: countError } = await retrySupabaseRequest(async () => {
        return supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'Skip')
          .gte('last_interaction_at', formattedDate)
          .not('last_interaction_at', 'is', null);
      });
        
      if (countError) throw countError;
      console.log(`Total Skip contacts with recent interactions: ${count}`);
      
      // Function to fetch contacts in batches with retry
      const fetchBatch = async (from, to) => {
        console.log(`Fetching batch from ${from} to ${to}`);
        return retrySupabaseRequest(async () => {
          return supabase
            .from('contacts')
            .select(`
              contact_id, 
              first_name, 
              last_name, 
              category,
              last_interaction_at,
              created_at
            `)
            .eq('category', 'Skip')
            .gte('last_interaction_at', formattedDate)
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })  // Most recent interactions first
            .range(from, to);
        });
      };
      
      // Fetch contacts in batches
      let allContacts = [];
      const batchSize = 500;
      let totalFetchedCount = 0;
      let failedBatches = 0;
      
      // Limit to 4000 contacts max for performance if needed
      const maxContacts = Math.min(count, 4000);
      for (let i = 0; i < maxContacts; i += batchSize) {
        try {
          setLoading(`Loading contacts... ${Math.min(i + batchSize, count)}/${count}`);
          
          const { data: batchData, error: batchError } = await fetchBatch(i, i + batchSize - 1);
          
          if (batchError) {
            console.error(`Error fetching contacts batch from ${i} to ${i + batchSize - 1}:`, batchError);
            failedBatches++;
            
            // Continue to next batch unless too many failures
            if (failedBatches > 3) {
              throw new Error(`Too many failed batches (${failedBatches}). Last error: ${batchError.message}`);
            }
            continue;
          }
          
          if (batchData && batchData.length > 0) {
            allContacts = [...allContacts, ...batchData];
            totalFetchedCount += batchData.length;
          }
        } catch (err) {
          console.error(`Error in batch fetch loop at index ${i}:`, err);
          // Only throw if we haven't fetched anything yet
          if (totalFetchedCount === 0) {
            throw err;
          }
          break; // Stop fetching more batches but use what we have
        }
      }
      
      console.log(`Successfully fetched ${totalFetchedCount} contacts in ${Math.ceil(totalFetchedCount/batchSize)} batches with ${failedBatches} failed batches`);
      
      // Get the contact data
      const contactsData = allContacts;
      
      // Guard against empty results
      if (!contactsData || contactsData.length === 0) {
        setContacts([]);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      
      // Get all contact IDs to fetch related data
      const contactIds = contactsData.map(contact => contact.contact_id).filter(Boolean);
      
      // Guard against empty contact IDs
      if (contactIds.length === 0) {
        setContacts(contactsData);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      
      setLoading('Loading related data (emails, mobiles)...');
      
      // Function to fetch related data in batches
      const fetchRelatedDataBatch = async (entityName, query, ids, batchSize = 100) => {
        console.log(`Fetching ${entityName} data for ${ids.length} contacts in batches of ${batchSize}`);
        let allData = [];
        
        for (let i = 0; i < ids.length; i += batchSize) {
          const batchIds = ids.slice(i, i + batchSize);
          
          try {
            const { data, error } = await query.in('contact_id', batchIds);
            
            if (error) throw error;
            allData = [...allData, ...(data || [])];
            
            // Update progress
            setLoading(`Loading ${entityName} data... ${Math.min(i + batchSize, ids.length)}/${ids.length}`);
          } catch (err) {
            console.error(`Error fetching batch of ${entityName} data:`, err);
            // Continue with next batch instead of failing completely
          }
        }
        
        return { data: allData };
      };
      
      try {
        // Fetch emails and mobiles in parallel
        const [emailsData, mobilesData] = await Promise.all([
          // Fetch emails (with primary flag)
          fetchRelatedDataBatch('emails', 
            supabase.from('contact_emails').select('contact_id, email, is_primary'), 
            contactIds
          ),
            
          // Fetch mobile numbers (with primary flag)
          fetchRelatedDataBatch('mobiles', 
            supabase.from('contact_mobiles').select('contact_id, mobile, is_primary'), 
            contactIds
          )
        ]);
        
        setLoading('Processing data and preparing contacts...');
        
        // Map the related data to each contact
        const contactsWithRelations = contactsData.map((contact, index) => {
          if (!contact || !contact.contact_id) {
            console.warn('Skipping invalid contact:', contact);
            return null;
          }
          
          // Update progress for very large data sets
          if (index > 0 && index % 1000 === 0) {
            setLoading(`Processing contacts... ${index}/${contactsData.length}`);
          }
          
          // Find emails and mobiles for this contact
          const contactEmails = (emailsData.data || [])
            .filter(email => email?.contact_id === contact.contact_id);
            
          const contactMobiles = (mobilesData.data || [])
            .filter(mobile => mobile?.contact_id === contact.contact_id);
          
          // Get primary email or first available
          const primaryEmail = contactEmails.find(email => email?.is_primary);
          const email = primaryEmail?.email || 
                      (contactEmails.length > 0 ? contactEmails[0]?.email : null);
                      
          // Get primary mobile or first available
          const primaryMobile = contactMobiles.find(mobile => mobile?.is_primary);
          const mobile = primaryMobile?.mobile || 
                       (contactMobiles.length > 0 ? contactMobiles[0]?.mobile : null);
          
          return {
            ...contact,
            id: contact.contact_id, // Add id as alias for contact_id for compatibility
            email: email || null,
            mobile: mobile || null
          };
        });
        
        // Filter out any null contacts from our processing
        const filteredContacts = contactsWithRelations.filter(Boolean);
        
        console.log(`Successfully processed ${filteredContacts.length} contacts out of ${contactsData.length} total`);
        
        // Set the contacts with all data
        setContacts(filteredContacts);
        setLoading(false);
        setDataLoaded(true);
        
        // Delay showing the grid to avoid abrupt transitions
        setTimeout(() => {
          setShowGrid(true);
        }, 800);
      } catch (err) {
        console.error('Error loading related data:', err);
        // Fallback to basic contact data if related data loading fails
        const basicContacts = contactsData.map(contact => ({
          ...contact,
          id: contact.contact_id
        }));
        setContacts(basicContacts);
        setLoading(false);
        setDataLoaded(true);
        
        // Delay showing the grid to avoid abrupt transitions
        setTimeout(() => {
          setShowGrid(true);
        }, 800);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      console.log('Initiating data fetch');
      fetchContacts();
    }
  }, [dataLoaded]);
  
  // Handle window resize
  useEffect(() => {
    if (!gridApi) return;
    
    const handleResize = () => {
      gridApi.sizeColumnsToFit();
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
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
              ? loading.replace(/Loading .+ \d+\/\d+/, 'Initializing Matrix') 
              : 'Accessing Contact Database...'}
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
          No 'Skip' category contacts found with interactions in the last 90 days.
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
            sortingOrder={['asc', 'desc', null]}
            sortModel={[
              { colId: 'last_interaction_at', sort: 'desc' }
            ]}
          />
        </div>
      )}
    </Container>
  );
};

export default SkipInbox;
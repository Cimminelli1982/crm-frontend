import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

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
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000011 01101111 01101101 01110000 01100001 01101110 01101001 01100101 01110011 00101110 00101110 00101110";
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

// Simple tags renderer
const TagsRenderer = (props) => {
  const tags = props.value || [];
  if (!tags.length) return '-';
  
  return tags.join(', ');
};

// Simple cities renderer
const CitiesRenderer = (props) => {
  const cities = props.value || [];
  if (!cities.length) return '-';
  
  return cities.join(', ');
};

// Simple contacts renderer
const ContactsRenderer = (props) => {
  const contacts = props.value || [];
  if (!contacts.length) return '-';
  
  return contacts.join(', ');
};

// Website link renderer
const WebsiteRenderer = (props) => {
  const website = props.value;
  if (!website) return '-';
  
  // Extract domain name for display
  let displayUrl = website;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    displayUrl = url.hostname.replace('www.', '');
  } catch (e) {
    // If URL parsing fails, just display as is
  }
  
  return (
    <a 
      href={website.startsWith('http') ? website : `https://${website}`} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        color: '#00ff00',
        textDecoration: 'none',
        fontSize: '13px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {displayUrl}
    </a>
  );
};

const SimpleCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const navigate = useNavigate();
  
  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Company', 
      field: 'name',
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
    },
    { 
      headerName: 'Website', 
      field: 'website',
      cellRenderer: WebsiteRenderer,
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Category', 
      field: 'category',
      valueFormatter: (params) => params.value || '-',
      minWidth: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Tags', 
      field: 'tags',
      cellRenderer: TagsRenderer,
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
    },
    { 
      headerName: 'Cities', 
      field: 'cities',
      cellRenderer: CitiesRenderer,
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
    },
    { 
      headerName: 'Contacts', 
      field: 'contacts',
      cellRenderer: ContactsRenderer,
      minWidth: 220,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
    },
    { 
      headerName: 'Created', 
      field: 'created_at', 
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 120,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
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

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
    // Navigate to company details page
    if (params.data && params.data.company_id) {
      // navigate(`/companies/${params.data.company_id}`);
      console.log('Company clicked:', params.data);
    }
  }, [navigate]);

  // Fetch companies data
  const fetchCompanies = async () => {
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
      
      setLoading('Accessing Companies data...');
      
      // First, fetch all companies (excluding "Skip" category) using pagination to get more than default 1000 limit
      let allCompanies = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pageData, error: pageError } = await retrySupabaseRequest(async () => {
          setLoading(`Loading companies page ${page + 1}...`);
          return supabase
            .from('companies')
            .select('*')
            .not('category', 'eq', 'Skip')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
        });
        
        if (pageError) throw pageError;
        
        if (pageData && pageData.length > 0) {
          allCompanies = [...allCompanies, ...pageData];
          page++;
          console.log(`Loaded page ${page} with ${pageData.length} companies, total so far: ${allCompanies.length}`);
          
          // If we got fewer results than the page size, we've reached the end
          if (pageData.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      const companiesData = allCompanies;
      
      console.log(`Fetched ${companiesData.length} companies`);
      
      // Log a few companies to debug
      console.log('Sample companies:', companiesData.slice(0, 3));
      
      // Check which ID field to use
      const idField = companiesData[0]?.company_id ? 'company_id' : 'id';
      console.log(`Using company ID field: ${idField}`);
      
      // Get all company IDs
      const companyIds = companiesData.map(company => company[idField]);
      
      // Batch processing for performance
      const batchSize = 50;
      const processBatch = async (ids) => {
        // Fetch tags, cities, and contact counts for each company
        const [tagsResult, citiesResult, contactsResult] = await Promise.all([
          // Get tags
          supabase
            .from('company_tags')
            .select('company_id, tag_id, tags:tag_id(name)')
            .in('company_id', ids),
            
          // Get cities
          supabase
            .from('company_cities')
            .select('company_id, city_id, cities:city_id(name)')
            .in('company_id', ids),
            
          // Get contact counts
          supabase
            .from('contact_companies')
            .select('company_id, contact_id')
            .in('company_id', ids)
        ]);
        
        return {
          tags: tagsResult.data || [],
          tagsError: tagsResult.error,
          cities: citiesResult.data || [],
          citiesError: citiesResult.error,
          contacts: contactsResult.data || [],
          contactsError: contactsResult.error
        };
      };
      
      // First fetch all contacts linked to any company we're displaying
      const { data: contactsData, error: contactsFetchError } = await retrySupabaseRequest(async () => {
        return supabase
          .from('contacts')
          .select('contact_id, first_name, last_name');
      });
      
      if (contactsFetchError) {
        console.error('Error fetching contacts:', contactsFetchError);
      }
      
      // Create a lookup map for contacts
      const contactsMap = {};
      contactsData?.forEach(contact => {
        contactsMap[contact.contact_id] = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      });
      
      console.log(`Created contacts map with ${Object.keys(contactsMap).length} entries`);
      
      // Process all companies in batches
      const processedCompanies = [];
      for (let i = 0; i < companyIds.length; i += batchSize) {
        setLoading(`Loading companies data... ${Math.min(i + batchSize, companyIds.length)}/${companyIds.length}`);
        
        // Get current batch of IDs
        const batchIds = companyIds.slice(i, i + batchSize);
        const batchResults = await processBatch(batchIds);
        
        // Log any errors but continue processing
        if (batchResults.tagsError) console.error('Error fetching tags:', batchResults.tagsError);
        if (batchResults.citiesError) console.error('Error fetching cities:', batchResults.citiesError);
        if (batchResults.contactsError) console.error('Error fetching contacts:', batchResults.contactsError);
        
        // Map data to companies
        const batchCompanies = companiesData.filter(company => batchIds.includes(company[idField])).map(company => {
          // Get tags for this company
          const companyTags = batchResults.tags
            .filter(tag => tag.company_id === company.company_id)
            .map(tag => tag.tags?.name)
            .filter(Boolean);
            
          // Get cities for this company
          const companyCities = batchResults.cities
            .filter(city => city.company_id === company.company_id)
            .map(city => city.cities?.name)
            .filter(Boolean);
            
          // Get contacts for this company
          const contactIds = batchResults.contacts
            .filter(relation => relation.company_id === company.company_id)
            .map(relation => relation.contact_id);
          
          console.log(`Company ${company.name}: Found ${contactIds.length} contact IDs`);
            
          const companyContacts = contactIds
            .map(id => contactsMap[id])
            .filter(Boolean);
            
          console.log(`Company ${company.name}: Mapped to ${companyContacts.length} contact names`);
            
          return {
            ...company,
            tags: companyTags,
            cities: companyCities,
            contacts: companyContacts
          };
        });
        
        // Add processed companies to the result array
        processedCompanies.push(...batchCompanies);
      }
      
      setCompanies(processedCompanies);
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
      
    } catch (err) {
      console.error('Error fetching companies data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      console.log('Initiating companies data fetch');
      fetchCompanies();
    }
  }, [dataLoaded]);
  
  // Separate effect for window resize
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
      <Title>Companies ({companies.length})</Title>
      
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {loading !== false ? (
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' 
              ? loading.replace(/Loading .+ \d+\/\d+/, 'Initializing Matrix') 
              : 'Accessing Companies Database...'}
          </LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : !showGrid && !error ? (
        <LoadingContainer>
          <LoadingText>Preparing companies grid...</LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : companies.length === 0 && !error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No companies found. Try refreshing the page or check database connection.
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
            rowData={companies}
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

export default SimpleCompanies;
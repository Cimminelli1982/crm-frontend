import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';

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

// Simple text renderers for related data
const TagsRenderer = (props) => {
  const tags = props.value || [];
  if (!tags.length) return '-';
  return tags.map(tag => tag.name).join(', ');
};

const CompaniesRenderer = (props) => {
  const companies = props.value || [];
  if (!companies.length) return '-';
  return companies.map(company => company.name).join(', ');
};

const CitiesRenderer = (props) => {
  const cities = props.value || [];
  if (!cities.length) return '-';
  return cities.map(city => city.name).join(', ');
};

const ScoreRenderer = (props) => {
  const score = props.value;
  if (score === null || score === undefined) return '-';
  
  const getColor = (score) => {
    if (score >= 8) return '#00cc00';
    if (score >= 6) return '#aacc00';
    if (score >= 4) return '#ccaa00';
    if (score >= 2) return '#cc7700';
    return '#cc3300';
  };
  
  return (
    <span style={{ 
      color: getColor(score),
      fontWeight: 'bold',
      fontSize: '14px'
    }}>
      {score}
    </span>
  );
};

const SimpleContacts = () => {
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
      headerName: 'Name', 
      field: 'name',
      valueGetter: (params) => {
        if (!params.data) return '';
        const firstName = params.data.first_name || '';
        const lastName = params.data.last_name || '';
        return `${firstName} ${lastName}`.trim() || '(No name)';
      },
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
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
      valueGetter: (params) => {
        if (!params.data) return '';
        return params.data.category || params.data.contact_category || '-';
      },
      minWidth: 130,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Mobile', 
      field: 'mobile',
      valueGetter: (params) => {
        if (!params.data) return '';
        return params.data.mobile || '-';
      },
      minWidth: 130,
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
      minWidth: 180,
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
      headerName: 'Score', 
      field: 'score', 
      cellRenderer: ScoreRenderer,
      width: 90,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Tags', 
      field: 'tags', 
      cellRenderer: TagsRenderer,
      minWidth: 150,
      sortable: false,
      filter: false,
    },
    { 
      headerName: 'Companies', 
      field: 'companies', 
      cellRenderer: CompaniesRenderer,
      minWidth: 150,
      sortable: false,
      filter: false,
    },
    { 
      headerName: 'Cities', 
      field: 'cities', 
      cellRenderer: CitiesRenderer,
      minWidth: 140,
      sortable: false,
      filter: false,
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
    if (params.data && params.data.contact_id) {
      navigate(`/contacts/${params.data.contact_id}`);
    }
  }, [navigate]);

  // Fetch only basic contact data - we'll load related data separately 
  // to improve initial load performance
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
      
      // Get all contacts count first with retry
      const { count, error: countError } = await retrySupabaseRequest(async () => {
        return supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true });
      });
        
      if (countError) throw countError;
      console.log(`Total contacts: ${count}`);
      
      // Function to fetch contacts in batches with retry
      const fetchBatch = async (from, to) => {
        console.log(`Fetching batch from ${from} to ${to}`);
        return retrySupabaseRequest(async () => {
          // Get date from 21 days ago
          const twentyOneDaysAgo = new Date();
          twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
          const formattedDate = twentyOneDaysAgo.toISOString();
          
          return supabase
            .from('contacts')
            .select(`
              contact_id, 
              first_name, 
              last_name, 
              category,
              score, 
              last_interaction_at,
              created_at
            `)
            .gte('last_interaction_at', formattedDate)
            .order('last_interaction_at', { ascending: false, nullsFirst: false })
            .range(from, to);
        });
      };
      
      // Fetch all contacts in batches of 500 (smaller batches for faster response)
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
      
      // Get the contact data - now let's fetch the related data
      const contactsData = allContacts;
      
      // Guard against empty results
      if (!contactsData || contactsData.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }
      
      // Get all contact IDs to fetch related data
      const contactIds = contactsData.map(contact => contact.contact_id).filter(Boolean);
      
      // Guard against empty contact IDs
      if (contactIds.length === 0) {
        setContacts(contactsData);
        setLoading(false);
        return;
      }
      
      setLoading('Loading related data (companies, tags, cities)...');
      
      // Function to fetch related data in batches with optimal batch size
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
      
      // Function to fetch details in smaller batches 
      const fetchDetailsBatch = async (entityName, table, idField, ids, fields, batchSize = 100) => {
        console.log(`Fetching ${entityName} details for ${ids.length} entities in batches of ${batchSize}`);
        let allData = [];
        
        for (let i = 0; i < ids.length; i += batchSize) {
          const batchIds = ids.slice(i, i + batchSize);
          
          try {
            const { data, error } = await supabase
              .from(table)
              .select(fields)
              .in(idField, batchIds);
            
            if (error) throw error;
            allData = [...allData, ...(data || [])];
            
            // Update progress
            setLoading(`Loading ${entityName} details... ${Math.min(i + batchSize, ids.length)}/${ids.length}`);
          } catch (err) {
            console.error(`Error fetching batch of ${entityName} details:`, err);
            // Continue with next batch instead of failing completely
          }
        }
        
        return { data: allData };
      };
      
      try {
        // Fetch all related data in batches
        const [
          companyRelationships,
          tagRelationships,
          cityRelationships,
          emailsData,
          mobilesData
        ] = await Promise.all([
          // 1. Fetch company relationships
          fetchRelatedDataBatch('companies', 
            supabase.from('contact_companies').select('contact_id, company_id'), 
            contactIds
          ),
          
          // 2. Fetch tag relationships
          fetchRelatedDataBatch('tags', 
            supabase.from('contact_tags').select('contact_id, tag_id'), 
            contactIds
          ),
          
          // 3. Fetch city relationships
          fetchRelatedDataBatch('cities', 
            supabase.from('contact_cities').select('contact_id, city_id'), 
            contactIds
          ),
            
          // 4. Fetch emails (with primary flag)
          fetchRelatedDataBatch('emails', 
            supabase.from('contact_emails').select('contact_id, email, is_primary'), 
            contactIds
          ),
            
          // 5. Fetch mobile numbers (with primary flag)
          fetchRelatedDataBatch('mobiles', 
            supabase.from('contact_mobiles').select('contact_id, mobile, is_primary'), 
            contactIds
          )
        ]);
        
        // Extract the unique related IDs for each type
        const companyIds = [...new Set(
          (companyRelationships.data || [])
            .map(rel => rel.company_id)
            .filter(Boolean)
        )];
        
        const tagIds = [...new Set(
          (tagRelationships.data || [])
            .map(rel => rel.tag_id)
            .filter(Boolean)
        )];
        
        const cityIds = [...new Set(
          (cityRelationships.data || [])
            .map(rel => rel.city_id)
            .filter(Boolean)
        )];
        
        setLoading('Loading details for related data...');
        
        // Fetch the details for each type of relationship in parallel
        const [
          companiesData,
          tagsData,
          citiesData
        ] = await Promise.all([
          // Only fetch if we have IDs
          companyIds.length > 0 
            ? fetchDetailsBatch('companies', 'companies', 'company_id', companyIds, 'company_id, name, website')
            : { data: [] },
          
          tagIds.length > 0
            ? fetchDetailsBatch('tags', 'tags', 'tag_id', tagIds, 'tag_id, name')
            : { data: [] },
          
          cityIds.length > 0
            ? fetchDetailsBatch('cities', 'cities', 'city_id', cityIds, 'city_id, name')
            : { data: [] }
        ]);
        
        setLoading('Processing data and preparing contacts...');
        
        // Map all the related data to each contact
        const contactsWithRelations = contactsData.map((contact, index) => {
          if (!contact || !contact.contact_id) {
            console.warn('Skipping invalid contact:', contact);
            return null;
          }
          
          // Update progress for very large data sets
          if (index > 0 && index % 1000 === 0) {
            setLoading(`Processing contacts... ${index}/${contactsData.length}`);
          }
          
          // Find all relationships for this contact
          const contactCompanyRelationships = (companyRelationships.data || [])
            .filter(rel => rel?.contact_id === contact.contact_id);
          
          const contactTagRelationships = (tagRelationships.data || [])
            .filter(rel => rel?.contact_id === contact.contact_id);
            
          const contactCityRelationships = (cityRelationships.data || [])
            .filter(rel => rel?.contact_id === contact.contact_id);
            
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
          
          // Map relationships to actual entity objects
          const companies = contactCompanyRelationships.map(rel => {
            if (!rel?.company_id) return null;
            const company = companiesData.data?.find(c => c?.company_id === rel.company_id);
            return company ? {
              id: company.company_id,
              name: company.name || 'Unknown',
              website: company.website
            } : null;
          }).filter(Boolean);
          
          const tags = contactTagRelationships.map(rel => {
            if (!rel?.tag_id) return null;
            const tag = tagsData.data?.find(t => t?.tag_id === rel.tag_id);
            return tag ? {
              id: tag.tag_id,
              name: tag.name || 'Unknown Tag'
            } : null;
          }).filter(Boolean);
          
          const cities = contactCityRelationships.map(rel => {
            if (!rel?.city_id) return null;
            const city = citiesData.data?.find(c => c?.city_id === rel.city_id);
            return city ? {
              id: city.city_id,
              name: city.name || 'Unknown Location'
            } : null;
          }).filter(Boolean);
          
          return {
            ...contact,
            id: contact.contact_id, // Add id as alias for contact_id for compatibility
            email: email || null,
            mobile: mobile || null,
            companies: companies || [],
            tags: tags || [],
            cities: cities || []
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
          id: contact.contact_id,
          companies: [],
          tags: [],
          cities: []
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
      <Title>Recent Contacts - Last 21 Days ({contacts.length})</Title>
      
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
          No contacts found. Try refreshing the page or check database connection.
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

export default SimpleContacts;
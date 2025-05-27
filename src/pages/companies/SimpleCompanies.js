import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiList, FiInbox, FiCpu, FiDollarSign, FiBriefcase, FiUser, FiPackage, FiEdit2, FiPlus } from 'react-icons/fi';
import NewEditCompanyModal from '../../components/modals/NewEditCompanyModal';
import toast from 'react-hot-toast';
import AssociateContactModal from '../../components/modals/AssociateContactModal';

// Styled components
const Container = styled.div`
  padding: 0 20px 20px 20px;
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

// Style for the top menu (matches SimpleDeals.js)
const TopMenuContainer = styled.div`
  display: flex;
  background-color: #111;
  border-bottom: 1px solid #333;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #222;
  padding: 8px 0;
  margin-bottom: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 48px;
  align-items: center;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

// Style for the menu items (matches SimpleDeals.js)
const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: ${props => props.$active ? '#00ff00' : '#888'};
  background-color: ${props => props.$active ? '#1a1a1a' : 'transparent'};
  border: ${props => props.$active ? '1px solid #00ff00' : '1px solid transparent'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  white-space: nowrap;
  margin: 0 4px;
  transition: all 0.2s ease;
  min-width: fit-content;
  
  &:hover {
    color: #00ff00;
    background-color: #1a1a1a;
    border-color: #00ff00;
  }
  
  svg {
    font-size: 16px;
    flex-shrink: 0;
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
  const [currentContactIndex, setCurrentContactIndex] = React.useState(0);
  const [showAssociateModal, setShowAssociateModal] = React.useState(false);
  
  const contacts = props.value || [];
  const companyId = props.data?.company_id;
  const hasMultipleContacts = contacts.length > 1;
  
  // Debug logging for multiple contacts
  if (contacts.length > 0) {
    console.log(`Company ${props.data?.name}: ${contacts.length} contacts, hasMultipleContacts: ${hasMultipleContacts}`);
  }
  
  // Handle associating a contact
  const handleAssociateContact = (e) => {
    e?.stopPropagation(); // Prevent row selection
    setShowAssociateModal(true);
  };
  
  // Navigation function for contact carousel
  const goToNextContact = (e) => {
    e?.stopPropagation();
    setCurrentContactIndex((prevIndex) => (prevIndex + 1) % contacts.length);
  };
  
  // Handle removing a contact association
  const handleRemoveContact = async (contactId, e) => {
    e?.stopPropagation(); // Prevent row selection
    
    if (!companyId || !contactId) return;
    
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('company_id', companyId)
        .eq('contact_id', contactId);
        
      if (error) throw error;
      
      // Success message
      toast.success('Contact association removed');
      
      // Refresh the grid
      if (props.api) {
        props.api.refreshCells({ force: true });
      }
      
      // Initiate a full data refresh
      setTimeout(() => {
        if (props.context && props.context.refreshData) {
          props.context.refreshData();
        }
      }, 100);
    } catch (error) {
      console.error('Error removing contact association:', error);
      toast.error('Failed to remove contact association');
    }
  };
  
  // Handle contact association completion
  const handleContactAssociated = (result) => {
    console.log('handleContactAssociated called with result:', result);
    setShowAssociateModal(false);
    
    // Immediate grid refresh
    if (props.api) {
      console.log('Refreshing grid cells immediately');
      props.api.refreshCells({ force: true });
    }
    
    // Full data refresh
    if (props.context && props.context.refreshData) {
      console.log('Calling refreshData after contact association');
      setTimeout(() => {
        props.context.refreshData();
      }, 500); // Increased delay to allow for database propagation
    } else {
      console.error('refreshData not available in context:', props.context);
    }
  };
  
  // Prevent event propagation
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  if (!contacts.length) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%'
      }}
      onClick={handleContainerClick}
      >
        <div
          onClick={handleAssociateContact}
          style={{
            color: '#ffffff',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Associate Contact"
        >
          Add contacts
        </div>
        
        {showAssociateModal && (
          <AssociateContactModal 
            isOpen={showAssociateModal}
            onRequestClose={() => setShowAssociateModal(false)}
            companyId={companyId}
            onContactAssociated={handleContactAssociated}
          />
        )}
      </div>
    );
  }
  
  // Current contact to display
  const currentContact = contacts[currentContactIndex];
  const fullName = [currentContact.first_name || '', currentContact.last_name || ''].filter(Boolean).join(' ') || 'Unnamed';
  
  // Navigation button styles
  const navButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    fontSize: '10px',
    opacity: '0.8'
  };
  
  // Fixed row height
  const rowHeight = 36;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: rowHeight + 'px',
      minHeight: rowHeight + 'px',
      width: '100%',
      position: 'relative'
    }}
    onClick={handleContainerClick}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '4px'
      }}>
        {/* Contact display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          padding: '0px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          border: '1px solid #ffffff',
          boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          lineHeight: '16px',
          width: '100%',
          maxWidth: hasMultipleContacts ? '170px' : '190px',
          height: '18px',
          position: 'relative'
        }}>
          <span style={{
            cursor: 'pointer',
            maxWidth: hasMultipleContacts ? '120px' : '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block'
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Could add navigation to contact details here
            console.log('Contact clicked:', currentContact);
          }}
          title={`${fullName}${currentContact.job_role ? ` - ${currentContact.job_role}` : ''}`}
          >
            {fullName}
          </span>
          
          {/* Counter indicator for multiple contacts */}
          {hasMultipleContacts && (
            <div style={{
              fontSize: '9px',
              color: '#cccccc',
              marginLeft: '4px',
              padding: '0 2px',
              borderRadius: '3px',
              backgroundColor: '#333333'
            }}>
              {currentContactIndex + 1}/{contacts.length}
            </div>
          )}
          
          <button
            onClick={(e) => handleRemoveContact(currentContact.contact_id, e)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '4px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Remove Contact Association"
          >
            ✕
          </button>
        </div>
        
        {/* Right navigation arrow (only visible for multiple contacts) */}
        {hasMultipleContacts && (
          <button
            onClick={goToNextContact}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              fontSize: '10px',
              opacity: '0.8',
              marginLeft: '2px'
            }}
            title="Next contact"
          >
            &#9654;
          </button>
        )}
        
        {/* Add contact button */}
        <button 
          onClick={handleAssociateContact}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            borderRadius: '4px',
            width: '20px',
            height: '20px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          title="Associate Contact"
        >
          <FiPlus size={14} />
        </button>
      </div>
      
      {showAssociateModal && (
        <AssociateContactModal 
          isOpen={showAssociateModal}
          onRequestClose={() => setShowAssociateModal(false)}
          companyId={companyId}
          onContactAssociated={handleContactAssociated}
        />
      )}
    </div>
  );
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

// Company name renderer (matches Name column UX from ContactsListTable)
// Updated: 2024-12-19 - Force cache refresh
const CompanyRenderer = (props) => {
  const companyName = props.value;
  if (!companyName) return '-';
  
  // Make company name clickable (placeholder for future navigation)
  const handleClick = () => {
    if (props.data && props.data.company_id) {
      // navigate(`/companies/${props.data.company_id}`);
      console.log('Company clicked:', props.data);
    }
  };
  
  // Handle edit icon click
  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent triggering the name click
    if (props.data && props.data.company_id) {
      // Set the selected company and open the modal
      props.context.setSelectedCompany(props.data);
      props.context.setShowEditModal(true);
    }
  };
  
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        height: '100%'
      }}
    >
      <div 
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer',
          flex: 1
        }}
        onClick={handleClick}
      >
        {companyName}
      </div>
      <button
        onClick={handleEditClick}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.6',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        title="Edit Company"
      >
        <FiEdit2 size={12} />
      </button>
    </div>
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
  
  // Menu tab state
  const [activeTab, setActiveTab] = useState('full_list');
  
  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Define menu items with icons
  const menuItems = [
    { id: 'full_list', name: 'Full List', icon: <FiList /> },
    { id: 'inbox', name: 'Inbox', icon: <FiInbox /> },
    { id: 'startup', name: 'Startup', icon: <FiCpu /> },
    { id: 'investors', name: 'Investors', icon: <FiDollarSign /> },
    { id: 'institutions', name: 'Institutions', icon: <FiBriefcase /> },
    { id: 'advisor', name: 'Advisor', icon: <FiUser /> },
    { id: 'others', name: 'Others', icon: <FiPackage /> }
  ];
  
  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Company', 
      field: 'name',
      cellRenderer: CompanyRenderer,
      minWidth: 150,
      flex: 2,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left'
    },
    { 
      headerName: 'Associated Contacts', 
      field: 'contacts',
      cellRenderer: ContactsRenderer,
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
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
      headerName: 'Created', 
      field: 'created_at', 
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 140,
      width: 140,
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
          
          // If we got fewer results than the page size, we've reached the end
          if (pageData.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      const companiesData = allCompanies;
      
      // Debug: Check if Calzedonia is in the list
      const calzedonia = companiesData.find(c => c.name === 'Calzedonia');
      if (calzedonia) {
        console.log('Calzedonia found in companies list:', calzedonia.company_id);
      } else {
        console.log('Calzedonia NOT found in companies list');
      }
      
      // Check which ID field to use
      const idField = companiesData[0]?.company_id ? 'company_id' : 'id';
      
      // Get all company IDs
      const companyIds = companiesData.map(company => company[idField]);
      
      // We'll fetch contact associations in batches during company processing
      // to avoid overwhelming the database with a single large query
      
      // Batch processing for performance
      const batchSize = 50;
      const processedCompanies = [];
      for (let i = 0; i < companyIds.length; i += batchSize) {
        setLoading(`Loading companies data... ${Math.min(i + batchSize, companyIds.length)}/${companyIds.length}`);
        
        // Get current batch of IDs
        const batchIds = companyIds.slice(i, i + batchSize);
        
        // Fetch tags, cities, and contact associations for each company
        const [tagsResult, citiesResult, contactsResult] = await Promise.all([
          // Get tags
          supabase
            .from('company_tags')
            .select('company_id, tag_id, tags:tag_id(name)')
            .in('company_id', batchIds),
            
          // Get cities
          supabase
            .from('company_cities')
            .select('company_id, city_id, cities:city_id(name)')
            .in('company_id', batchIds),
            
          // Get contact associations
          supabase
            .from('contact_companies')
            .select('company_id, contact_id')
            .in('company_id', batchIds)
        ]);
        
        // Log any errors but continue processing
        if (tagsResult.error) console.error('Error fetching tags:', tagsResult.error);
        if (citiesResult.error) console.error('Error fetching cities:', citiesResult.error);
        if (contactsResult.error) console.error('Error fetching contacts:', contactsResult.error);
        
        // Get all unique contact IDs for this batch
        const batchContactIds = [...new Set(contactsResult.data?.map(item => item.contact_id) || [])];
        
        // Fetch contact details for this batch
        let batchContactsData = [];
        if (batchContactIds.length > 0) {
          const { data: contactDetails, error: contactDetailsError } = await retrySupabaseRequest(async () => {
            return supabase
              .from('contacts')
              .select('contact_id, first_name, last_name, job_role, category, linkedin, description, score')
              .in('contact_id', batchContactIds);
          });
          
          if (contactDetailsError) {
            console.error('Error fetching contact details:', contactDetailsError);
          } else {
            batchContactsData = contactDetails || [];
          }
        }
        
        // Create a lookup map for this batch's contacts
        const batchContactsMap = {};
        batchContactsData.forEach(contact => {
          batchContactsMap[contact.contact_id] = contact;
        });
        
        // Debug: Log if we found contacts in this batch
        if (batchContactsData.length > 0) {
          console.log(`Batch ${Math.floor(i/batchSize) + 1}: Found ${batchContactsData.length} contacts`);
        }
        
        // Map data to companies
        const batchCompanies = companiesData.filter(company => batchIds.includes(company[idField])).map(company => {
          // Get tags for this company
          const companyTags = tagsResult.data
            .filter(tag => tag.company_id === company.company_id)
            .map(tag => tag.tags?.name)
            .filter(Boolean);
            
          // Get cities for this company
          const companyCities = citiesResult.data
            .filter(city => city.company_id === company.company_id)
            .map(city => city.cities?.name)
            .filter(Boolean);
            
          // Get contacts for this company
          const contactIds = contactsResult.data
            .filter(relation => relation.company_id === company.company_id)
            .map(relation => relation.contact_id);
            
          // Get contact details for this company
          const companyContacts = contactIds
            .map(id => batchContactsMap[id])
            .filter(Boolean);
          
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

  // Handle company update completion
  const handleCompanyUpdated = () => {
    setShowEditModal(false);
    setSelectedCompany(null);
    
    // Refresh the grid data
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
    
    // Optionally refresh the entire data
    setTimeout(() => {
      fetchCompanies();
    }, 100);
  };

  // Function to refresh data
  const refreshData = () => {
    setDataLoaded(false); // Force a complete refresh
    fetchCompanies();
  };

  return (
    <Container>
      <TopMenuContainer>
        {menuItems.map(item => (
          <MenuItem 
            key={item.id}
            $active={item.id === activeTab}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon} {item.name}
          </MenuItem>
        ))}
      </TopMenuContainer>
      
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
            height: 'calc(100% - 10px)', 
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
            context={{
              setSelectedCompany,
              setShowEditModal,
              refreshData
            }}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            suppressCellFocus={true}
            enableCellTextSelection={true}
          />
        </div>
      )}
      
      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && (
        <NewEditCompanyModal 
          isOpen={showEditModal}
          onRequestClose={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}
    </Container>
  );
};

export default SimpleCompanies;
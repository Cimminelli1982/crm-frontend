import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import ContactsInteractionModal from '../../components/modals/ContactsInteractionModal';
import { FiMail, FiLinkedin, FiDollarSign } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

// Styled components - Updated to match ContactsListTable
const Container = styled.div`
  height: calc(100vh - 60px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`;

const Title = styled.h1`
  color: #00ff00;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
  font-size: 24px;
  padding: 20px;
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

const SimpleKeepInTouch = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState({});
  const navigate = useNavigate();
  
  // Frequency Renderer with dropdown functionality
  const FrequencyRenderer = useCallback((props) => {
    const contactId = props.data?.contact_id;
    const currentFrequency = props.value || '';
    const isDropdownOpen = showFrequencyDropdown[contactId] || false;
    
    const frequencyOptions = [
      { value: 'Do not keep in touch', label: 'Do not keep in touch' },
      { value: 'Weekly', label: 'Weekly' },
      { value: 'Monthly', label: 'Monthly' },
      { value: 'Quarterly', label: 'Quarterly' },
      { value: 'Twice per Year', label: 'Twice per Year' },
      { value: 'Once per Year', label: 'Once per Year' }
    ];
    
    const handleFrequencyChange = async (newFrequency) => {
      try {
        // Update the database
        const { error } = await supabase
          .from('contacts')
          .update({ keep_in_touch_frequency: newFrequency })
          .eq('contact_id', contactId);
          
        if (error) throw error;
        
        // Update the local data
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.contact_id === contactId 
              ? { ...contact, frequency: newFrequency }
              : contact
          )
        );
        
        // Close the dropdown
        setShowFrequencyDropdown(prev => ({
          ...prev,
          [contactId]: false
        }));
        
        console.log(`Updated frequency for contact ${contactId} to ${newFrequency}`);
      } catch (err) {
        console.error('Error updating frequency:', err);
        alert('Failed to update frequency. Please try again.');
      }
    };
    
    const handleClick = (e) => {
      e.stopPropagation();
      setShowFrequencyDropdown(prev => ({
        ...prev,
        [contactId]: !prev[contactId]
      }));
    };
    
    const handleBlur = () => {
      // Delay closing to allow click on dropdown options
      setTimeout(() => {
        setShowFrequencyDropdown(prev => ({
          ...prev,
          [contactId]: false
        }));
      }, 150);
    };
    
    if (isDropdownOpen) {
      return (
        <div style={{ position: 'relative', width: '100%' }}>
          <select
            value={currentFrequency}
            onChange={(e) => handleFrequencyChange(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '12px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    
    return (
      <div 
        onClick={handleClick}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer',
          width: '100%',
          fontSize: '12px',
          textAlign: 'center',
          color: currentFrequency ? '#00ff00' : '#aaaaaa', // Green for all values, gray for empty
          padding: '4px',
          borderRadius: '4px'
        }}
      >
        {currentFrequency || 'Not set'}
      </div>
    );
  }, [showFrequencyDropdown, setContacts, setShowFrequencyDropdown]);

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

  // Actions Renderer with LinkedIn, WhatsApp, Deal, and Email buttons - Updated to use icons
  const ActionsRenderer = (props) => {
    const data = props.data;
    
    // Get contact data from nested structure
    const contactData = data.contacts || {};
    
    // Get primary email or first available
    const email = data.email || '';
    
    // Get primary mobile (for WhatsApp)
    const mobile = data.mobile || '';
    
    // Get LinkedIn URL from joined contacts table
    const linkedin = contactData.linkedin || '';
    
    const handleLinkedInClick = (e) => {
      e.stopPropagation();
      if (linkedin) {
        window.open(linkedin, '_blank');
      } else if (data.full_name || (data.first_name && data.last_name)) {
        const searchName = data.full_name || `${data.first_name} ${data.last_name}`;
        window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchName)}`, '_blank');
      }
    };
    
    const handleWhatsAppClick = (e) => {
      e.stopPropagation();
      if (mobile) {
        const formattedNumber = mobile.replace(/\D/g, '');
        window.open(`https://wa.me/${formattedNumber}`, '_blank');
      }
    };
    
    const handleEmailClick = (e) => {
      e.stopPropagation();
      if (email) {
        window.location.href = `mailto:${email}`;
      }
    };
    
    const handleDealClick = (e) => {
      e.stopPropagation();
      console.log('Deal button clicked - no action implemented yet');
    };
    
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px',
        width: '100%',
        height: '100%'
      }}>
        {/* LinkedIn Button */}
        <button
          onClick={handleLinkedInClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: linkedin ? '#00ff00' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="LinkedIn"
        >
          <FiLinkedin size={16} />
        </button>
        
        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          disabled={!mobile}
          style={{
            background: 'transparent',
            border: 'none',
            color: mobile ? '#25D366' : '#666',
            cursor: mobile ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => mobile && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => mobile && (e.currentTarget.style.transform = 'scale(1)')}
          title="WhatsApp"
        >
          <FaWhatsapp size={16} />
        </button>
        
        {/* Deal Button */}
        <button
          onClick={handleDealClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffc107',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Deal (Coming Soon)"
        >
          <FiDollarSign size={16} />
        </button>
        
        {/* Email Button */}
        <button
          onClick={handleEmailClick}
          disabled={!email}
          style={{
            background: 'transparent',
            border: 'none',
            color: email ? '#4a9eff' : '#666',
            cursor: email ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => email && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => email && (e.currentTarget.style.transform = 'scale(1)')}
          title="Email"
        >
          <FiMail size={16} />
        </button>
      </div>
    );
  };
  
  // Last Interaction Renderer with modal functionality
  const LastInteractionRenderer = (props) => {
    if (!props.value) return '';
    
    const date = new Date(props.value);
    // Format as MM/YY
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
    
    const handleClick = (e) => {
      e.stopPropagation();
      setSelectedContactForModal(props.data);
      setShowInteractionModal(true);
    };
    
    return (
      <div 
        onClick={handleClick}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: '0',
          width: '100%',
          fontSize: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          color: '#aaaaaa'
        }}
      >
        {formattedDate}
      </div>
    );
  };
  
  // Column definitions with improved display of related data
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Contact', 
      field: 'full_name',
      cellRenderer: (params) => {
        if (!params.value) return '-';
        
        // Make contact name clickable
        const handleClick = () => {
          if (params.data && params.data.contact_id) {
            navigate(`/contacts/${params.data.contact_id}`);
          }
        };
        
        return (
          <div 
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={handleClick}
          >
            {params.value}
          </div>
        );
      },
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      cellRenderer: LastInteractionRenderer,
      minWidth: 150,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Frequency', 
      field: 'frequency',
      cellRenderer: FrequencyRenderer,
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
    },
    { 
      headerName: 'Actions', 
      field: 'actions',
      cellRenderer: ActionsRenderer,
      minWidth: 140,
      sortable: false,
      filter: false,
    }
  ], [navigate, FrequencyRenderer]);
  
  // Load data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      fetchContacts();
    }
  }, [dataLoaded]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  // Grid ready event handler
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
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
          .select(`
            *,
            contacts!inner(linkedin)
          `)
          .order('next_interaction_date', { ascending: true });
      });
      
      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }
      
      console.log('Fetched contacts:', data);
      setContacts(data || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setError(`Failed to load contacts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Container>
        <Title>Keep in Touch Contacts</Title>
        <ErrorText>{error}</ErrorText>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Title>Keep in Touch Contacts</Title>
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' ? loading : 'Loading contacts...'}
          </LoadingText>
          <LoadingBar />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {contacts.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No contacts found for this category.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 80px)', 
            width: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            marginRight: '5px',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': 'transparent',
            '--ag-border-color': '#333333',
            '--ag-cell-horizontal-padding': '8px',
            '--ag-borders': 'none',
            '--ag-header-height': '32px',
            '--ag-header-column-separator-display': 'none',
            '--ag-font-size': '12px',
            '--ag-paging-panel-height': '42px',
            '--ag-row-height': '36px'
          }}
        >
          <AgGridReact
            rowData={contacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            animateRows={false}
            suppressRowClickSelection={true}
            enableCellTextSelection={true}
            pagination={true}
            paginationPageSize={50}
            domLayout="normal"
            suppressColumnVirtualisation={true}
            suppressRowVirtualisation={false}
            suppressCellFocus={true}
            suppressHorizontalScroll={true}
            alwaysShowHorizontalScroll={false}
            alwaysShowVerticalScroll={false}
            overlayNoRowsTemplate='<span style="padding: 10px; border: 1px solid #00ff00; background: #121212; color: #00ff00;">No contacts found</span>'
          />
        </div>
      )}
      
      {/* Interaction Modal */}
      {showInteractionModal && selectedContactForModal && (
        <ContactsInteractionModal
          isOpen={showInteractionModal}
          onRequestClose={() => {
            setShowInteractionModal(false);
            setSelectedContactForModal(null);
          }}
          contact={selectedContactForModal}
        />
      )}
    </Container>
  );
};

export default SimpleKeepInTouch;
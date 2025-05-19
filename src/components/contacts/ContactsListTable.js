import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiMail, FiLinkedin, FiPlus } from 'react-icons/fi';
import { FaWhatsapp, FaStar, FaRegStar } from 'react-icons/fa';
import { MdClear } from 'react-icons/md';

// Styled components
const Container = styled.div`
  height: calc(100vh - 120px);
  width: 100%;
  padding: 0;
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

const ActionsContainer = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
  padding-right: 0;
  width: 100%;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  transition: all 0.2s;
  padding: 0;
  
  &:hover {
    background-color: #1a1a1a;
    transform: scale(1.1);
  }

  &.linkedin {
    color: #0077b5;
  }
  
  &.email {
    color: #00aeff;
  }
  
  &.whatsapp {
    color: #25D366;
  }
`;

// Modal for editing tags
const TagsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const TagsModalContent = styled.div`
  background-color: #121212;
  border: 1px solid #00ff00;
  border-radius: 8px;
  padding: 20px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  
  h3 {
    color: #00ff00;
    margin-top: 0;
    margin-bottom: 16px;
    font-family: 'Courier New', monospace;
  }
`;

const TagContainer = styled.div`
  display: flex;
  gap: 1px;
  align-items: center;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  color: #00ff00;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #00ff00;
  box-shadow: 0 0 4px rgba(0, 255, 0, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85px;
  line-height: 18px;
  margin-right: 4px;
  
  button {
    background: none;
    border: none;
    color: #ff3333;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #ff0000;
    }
  }
`;

const AddTagButton = styled.button`
  background: none;
  border: 1px dashed #00ff00;
  color: #00ff00;
  border-radius: 4px;
  width: 18px;
  height: 18px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
  }
`;

// Custom renderers for the table cells
const TagsRenderer = (props) => {
  const [showModal, setShowModal] = React.useState(false);
  const tags = props.value || [];
  const contact = props.data;
  
  if (!tags.length && !contact) return '-';
  
  // Get first 2 tags to display
  const visibleTags = tags.slice(0, 2);
  const remainingCount = tags.length - 2;
  
  const handleRemoveTag = async (e, tagId) => {
    e.stopPropagation(); // Prevent row selection
    
    try {
      // Delete the tag relationship
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      // Refresh the data
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['tags']
        });
      }
    } catch (err) {
      console.error('Error removing tag:', err);
      // You could add a toast message here
    }
  };
  
  const handleAddTagClick = (e) => {
    e.stopPropagation(); // Prevent row selection
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  // We'll stop event propagation on the container to prevent row selection when clicking tags
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <TagContainer 
      onClick={handleContainerClick}
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        paddingRight: '0',
        width: '100%'
      }}
    >
      {visibleTags.map(tag => (
        <TagItem key={tag.id} title={tag.name}>
          {tag.name}
          <button onClick={(e) => handleRemoveTag(e, tag.id)} title="Remove tag">
            <MdClear style={{ color: '#00ff00' }} />
          </button>
        </TagItem>
      ))}
      
      {remainingCount > 0 && (
        <TagItem title={`${remainingCount} more tags`}>
          +{remainingCount}
        </TagItem>
      )}
      
      <AddTagButton 
        onClick={handleAddTagClick}
        title="Add or edit tags"
      >
        <FiPlus />
      </AddTagButton>
      
      {showModal && (
        <TagsModal onClick={handleCloseModal}>
          <TagsModalContent onClick={e => e.stopPropagation()}>
            <h3>Edit Tags for {contact.first_name} {contact.last_name}</h3>
            {/* Tags edit form would go here */}
            <p style={{ color: '#ccc' }}>
              This would contain a form to add/remove tags for this contact.
            </p>
            <button 
              style={{ 
                backgroundColor: '#00ff00', 
                color: 'black', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginTop: '16px'
              }}
              onClick={handleCloseModal}
            >
              Close
            </button>
          </TagsModalContent>
        </TagsModal>
      )}
    </TagContainer>
  );
};

const CompanyRenderer = (props) => {
  const companies = props.value || [];
  if (!companies.length) return '-';
  
  // Show primary company or first in the list
  const company = companies[0];
  
  return (
    <div style={{
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingRight: '8px',
      width: '100%'
    }} title={company.name}>
      {company.name}
    </div>
  );
};

const CitiesRenderer = (props) => {
  const cities = props.value || [];
  if (!cities.length) return '-';
  
  const cityNames = cities.map(city => city.name).join(', ');
  
  return (
    <div style={{
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingRight: '0',
      width: '100%'
    }} title={cityNames}>
      {cityNames}
    </div>
  );
};

const RatingRenderer = (props) => {
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      padding: '0',
      margin: '0'
    }}>
      <span style={{ 
        color: getColor(score),
        fontWeight: 'bold',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {score}
      </span>
    </div>
  );
};

const LastInteractionRenderer = (props) => {
  if (!props.value) return '-';
  const formattedDate = new Date(props.value).toLocaleDateString();
  
  return (
    <div style={{
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingRight: '0',
      width: '100%'
    }}>
      {formattedDate}
    </div>
  );
};

const ActionsRenderer = (props) => {
  const data = props.data;
  
  // Get primary email or first available
  const email = data.email || '';
  
  // Get primary mobile (for WhatsApp) or first available
  const mobile = data.mobile || '';
  
  // LinkedIn isn't available in this data, so we'll always search by name
  
  const handleEmailClick = (e) => {
    e.stopPropagation();
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };
  
  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    if (mobile) {
      // Format phone number for WhatsApp (remove non-digits)
      const formattedNumber = mobile.replace(/\D/g, '');
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };
  
  const handleLinkedInClick = (e) => {
    e.stopPropagation();
    if (data.first_name && data.last_name) {
      // Search for the person on LinkedIn
      const searchName = `${data.first_name} ${data.last_name}`;
      window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchName)}`, '_blank');
    }
  };
  
  return (
    <ActionsContainer>
      <ActionButton 
        className="linkedin" 
        onClick={handleLinkedInClick}
        title="Open LinkedIn"
      >
        <FiLinkedin size={16} />
      </ActionButton>
      
      <ActionButton 
        className="email" 
        onClick={handleEmailClick}
        title={email ? `Email: ${email}` : 'No email available'}
        disabled={!email}
      >
        <FiMail size={16} />
      </ActionButton>
      
      <ActionButton 
        className="whatsapp" 
        onClick={handleWhatsAppClick}
        title={mobile ? `WhatsApp: ${mobile}` : 'No mobile available'}
        disabled={!mobile}
      >
        <FaWhatsapp size={16} />
      </ActionButton>
    </ActionsContainer>
  );
};

const ContactsListTable = ({ category }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const navigate = useNavigate();

  // Keep in Touch renderer
  const KeepInTouchRenderer = (params) => {
    const frequency = params.value || 'Not Set';
    
    return (
      <div style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        paddingRight: '0',
        width: '100%',
        color: frequency !== 'Not Set' ? '#00ff00' : '#aaa'
      }}>
        {frequency}
      </div>
    );
  };

  // Column definitions with the requested fields
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
      cellRenderer: (params) => {
        if (!params.value) return '-';
        
        return (
          <div style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingRight: '0',
            width: '100%'
          }}>
            {params.value}
          </div>
        );
      },
      minWidth: 170,
      width: 170,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
      suppressSizeToFit: true,
    },
    { 
      headerName: 'Company', 
      field: 'companies', 
      cellRenderer: CompanyRenderer,
      minWidth: 140,
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      suppressSizeToFit: true,
    },
    { 
      headerName: 'Tags', 
      field: 'tags', 
      cellRenderer: TagsRenderer,
      minWidth: 200,
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressSizeToFit: true,
    },
    { 
      headerName: 'Rating', 
      field: 'score', 
      cellRenderer: RatingRenderer,
      width: 80,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Keep in Touch', 
      field: 'keep_in_touch_frequency',
      cellRenderer: KeepInTouchRenderer,
      minWidth: 120,
      width: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      suppressSizeToFit: true,
    },
    { 
      headerName: 'City', 
      field: 'cities', 
      cellRenderer: CitiesRenderer,
      minWidth: 110,
      width: 100,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressSizeToFit: true,
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      cellRenderer: LastInteractionRenderer,
      minWidth: 110,
      width: 110,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
      suppressSizeToFit: true,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionsRenderer,
      width: 110,
      sortable: false,
      filter: false,
      pinned: 'right',
      suppressSizeToFit: true,
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);

  // Grid ready event handler
  const onGridReady = (params) => {
    setGridApi(params.api);
    
    // Size columns to fit
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  };

  // Row clicked handler
  const handleRowClicked = (params) => {
    if (params.data && params.data.contact_id) {
      navigate(`/contacts/integrity/${params.data.contact_id}`);
    }
  };

  // Fetch contacts based on the selected category
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Base query to get contacts
        let query = supabase
          .from('contacts')
          .select(`
            contact_id, 
            first_name, 
            last_name, 
            score,
            last_interaction_at,
            created_at,
            keep_in_touch_frequency
          `)
          .order('first_name', { ascending: true });
        
        // Apply category filter if provided
        if (category) {
          query = query.eq('category', category);
        }
        
        const { data: contactsData, error: contactsError } = await query;
        
        if (contactsError) throw contactsError;
        
        // Guard against empty results
        if (!contactsData || contactsData.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }
        
        // Get all contact IDs to fetch related data
        const contactIds = contactsData.map(contact => contact.contact_id);
        
        // Fetch related data in parallel
        const [
          companyRelationsData,
          tagRelationsData,
          cityRelationsData,
          emailsData,
          mobilesData
        ] = await Promise.all([
          // Get company relations
          supabase
            .from('contact_companies')
            .select('contact_id, company_id')
            .in('contact_id', contactIds),
            
          // Get tag relations
          supabase
            .from('contact_tags')
            .select('contact_id, tag_id')
            .in('contact_id', contactIds),
            
          // Get city relations
          supabase
            .from('contact_cities')
            .select('contact_id, city_id')
            .in('contact_id', contactIds),
            
          // Get emails
          supabase
            .from('contact_emails')
            .select('contact_id, email, is_primary')
            .in('contact_id', contactIds),
            
          // Get mobile numbers
          supabase
            .from('contact_mobiles')
            .select('contact_id, mobile, is_primary')
            .in('contact_id', contactIds)
        ]);
        
        // Check for errors from all parallel requests
        if (companyRelationsData.error) throw companyRelationsData.error;
        if (tagRelationsData.error) throw tagRelationsData.error;
        if (cityRelationsData.error) throw cityRelationsData.error;
        if (emailsData.error) throw emailsData.error;
        if (mobilesData.error) throw mobilesData.error;
        
        // Extract unique IDs for companies, tags, and cities
        const companyIds = [...new Set(companyRelationsData.data.map(rel => rel.company_id))];
        const tagIds = [...new Set(tagRelationsData.data.map(rel => rel.tag_id))];
        const cityIds = [...new Set(cityRelationsData.data.map(rel => rel.city_id))];
        
        // Fetch details for companies, tags, and cities in parallel
        const [
          companiesData,
          tagsData,
          citiesData
        ] = await Promise.all([
          // Get company details
          supabase
            .from('companies')
            .select('company_id, name, website')
            .in('company_id', companyIds),
            
          // Get tag details
          supabase
            .from('tags')
            .select('tag_id, name')
            .in('tag_id', tagIds),
            
          // Get city details
          supabase
            .from('cities')
            .select('city_id, name')
            .in('city_id', cityIds)
        ]);
        
        // Check for errors from all parallel requests
        if (companiesData.error) throw companiesData.error;
        if (tagsData.error) throw tagsData.error;
        if (citiesData.error) throw citiesData.error;
        
        // Map related data to each contact
        const contactsWithRelations = contactsData.map(contact => {
          // Find relations for this contact
          const contactCompanyRelations = companyRelationsData.data.filter(rel => rel.contact_id === contact.contact_id);
          const contactTagRelations = tagRelationsData.data.filter(rel => rel.contact_id === contact.contact_id);
          const contactCityRelations = cityRelationsData.data.filter(rel => rel.contact_id === contact.contact_id);
          
          // Find emails for this contact
          const contactEmails = emailsData.data.filter(email => email.contact_id === contact.contact_id);
          const primaryEmail = contactEmails.find(email => email.is_primary);
          const email = primaryEmail?.email || (contactEmails.length > 0 ? contactEmails[0].email : null);
          
          // Find mobiles for this contact
          const contactMobiles = mobilesData.data.filter(mobile => mobile.contact_id === contact.contact_id);
          const primaryMobile = contactMobiles.find(mobile => mobile.is_primary);
          const mobile = primaryMobile?.mobile || (contactMobiles.length > 0 ? contactMobiles[0].mobile : null);
          
          // Map to full entities
          const companies = contactCompanyRelations.map(rel => {
            const company = companiesData.data.find(c => c.company_id === rel.company_id);
            return company ? {
              id: company.company_id,
              name: company.name || 'Unknown',
              website: company.website
            } : null;
          }).filter(Boolean);
          
          const tags = contactTagRelations.map(rel => {
            const tag = tagsData.data.find(t => t.tag_id === rel.tag_id);
            return tag ? {
              id: tag.tag_id,
              name: tag.name || 'Unknown Tag'
            } : null;
          }).filter(Boolean);
          
          const cities = contactCityRelations.map(rel => {
            const city = citiesData.data.find(c => c.city_id === rel.city_id);
            return city ? {
              id: city.city_id,
              name: city.name || 'Unknown Location'
            } : null;
          }).filter(Boolean);
          
          // Return the contact with all related data
          return {
            ...contact,
            email,
            mobile,
            companies,
            tags,
            cities
          };
        });
        
        setContacts(contactsWithRelations);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [category]);
  
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
      
      {loading ? (
        <LoadingContainer>
          <LoadingText>Loading contacts...</LoadingText>
          <LoadingBar />
        </LoadingContainer>
      ) : contacts.length === 0 ? (
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
            height: '100%', 
            width: '100%',
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

export default ContactsListTable;
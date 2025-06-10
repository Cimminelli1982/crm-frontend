import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiEdit, FiPhone, FiMail, FiMapPin, FiTag, FiBriefcase, FiCalendar, FiClock, FiCheck, FiX, FiStar, FiLinkedin, FiPlus, FiTrash, FiEdit2, FiDollarSign, FiGlobe, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import TagsModalComponent from '../components/modals/TagsModal';

// Styled components (reusing from ContactRecord.js)
const Container = styled.div`
  padding: 10px 30px 30px 20px;
  width: calc(100% - 50px);
  max-width: calc(100% - 50px);
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
  width: 100%;
`;

const Title = styled.h1`
  color: #00ff00;
  margin: 0;
  font-family: 'Courier New', monospace;
`;

const EditButton = styled.button`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 10px 20px;
  margin-right: 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const ContentGrid = styled.div`
  display: flex;
  width: 100%;
  gap: 35px;
  box-sizing: border-box;
  margin-top: 30px;
  
  @media (max-width: 992px) {
    flex-direction: column;
    
    > div {
      width: 100% !important;
    }
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
  color: #00ff00;
  margin-top: 0;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    font-size: 1.2rem;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  color: #eee;
  font-size: 0.95rem;
`;

const RelatedItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #222;
  }
`;

const RelatedTitle = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 4px;
`;

const RelatedSubtitle = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
`;

const Badge = styled.span`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
  width: 100%;
  padding-left: 10px;
`;

const Tab = styled.div`
  padding: 10px 30px;
  margin-right: 15px;
  cursor: pointer;
  color: ${props => props.active ? '#00ff00' : '#ccc'};
  border-bottom: 2px solid ${props => props.active ? '#00ff00' : 'transparent'};
  
  &:hover {
    color: ${props => props.active ? '#00ff00' : '#eee'};
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  margin-top: -5px;
  font-size: 0.9rem;
  color: #999;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #00ff00;
`;

const ErrorScreen = styled.div`
  padding: 20px;
  background-color: #331111;
  color: #ff5555;
  border-radius: 4px;
  margin: 20px 0;
`;

const LinkedInIcon = styled(FiLinkedin)`
  cursor: pointer;
  color: ${props => props.hasLink ? '#00ff00' : '#666'};
  transition: color 0.2s ease;
  padding: 2px;
  border-radius: 3px;
  outline: none;
  
  &:hover {
    color: ${props => props.hasLink ? '#00cc00' : '#888'};
  }
  
  &:focus {
    outline: none;
  }
`;

const LinkedInContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Tags Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  width: 80%;
  max-width: 1000px;
  height: 70%;
  max-height: 600px;
  display: flex;
  overflow: hidden;
`;

const ModalSidebar = styled.div`
  width: 200px;
  background-color: #222;
  border-right: 1px solid #333;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: #00ff00;
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #fff;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.active ? '#00ff00' : '#333'};
  color: ${props => props.active ? '#000' : '#fff'};
  border: 1px solid ${props => props.active ? '#00ff00' : '#555'};
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#00cc00' : '#444'};
  }
`;

const FilterableTag = styled.div`
  background-color: ${props => props.selected ? '#00ff00' : '#222'};
  color: ${props => props.selected ? '#000' : '#00ff00'};
  border: 1px solid #00ff00;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  white-space: nowrap;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.selected ? '#00cc00' : '#333'};
  }
`;

const ResultItem = styled.div`
  padding: 12px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #222;
  }
`;

const ResultTitle = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 4px;
`;

const ResultSubtitle = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #00ff00;
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
`;

const TagsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const CompanyRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('contacts');
  
  // Tags modal state
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState('contacts');
  
  // TagsModalComponent state
  const [isTagsManagerModalOpen, setIsTagsManagerModalOpen] = useState(false);
  
  // Add new state for tag filtering
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  // Fetch company data and related info
  useEffect(() => {
    if (!id) return;
    
    const fetchCompanyData = async () => {
      // Reset all state when ID changes
      setCompany(null);
      setContacts([]);
      setTags([]);
      setCities([]);
      setDeals([]);
      setNotes([]);
      setError(null);
      setLoading(true);
      
      try {
        // Get basic company info
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('company_id', id)
          .single();
          
        if (companyError) throw companyError;
        if (!companyData) throw new Error('Company not found');
        
        setCompany(companyData);
        
        // Fetch related data in parallel
        const [
          contactsResult,
          tagsResult,
          citiesResult,
          dealsResult,
          notesResult
        ] = await Promise.all([
          // Get contacts
          supabase
            .from('contact_companies')
            .select(`
              contact_companies_id,
              relationship,
              is_primary,
              contacts (
                contact_id,
                first_name,
                last_name,
                job_role,
                score,
                category
              )
            `)
            .eq('company_id', id),
            
          // Get tags
          supabase
            .from('company_tags')
            .select(`
              entry_id,
              tags (
                tag_id,
                name
              )
            `)
            .eq('company_id', id),
            
          // Get cities
          supabase
            .from('companies_cities')
            .select(`
              entry_id,
              cities (
                city_id,
                name,
                country
              )
            `)
            .eq('company_id', id),
            
          // Get deals
          supabase
            .from('deals_companies')
            .select(`
              deals_companies_id,
              relationship,
              deals (
                deal_id,
                opportunity,
                total_investment,
                category,
                stage,
                description,
                created_at,
                updated_at
              )
            `)
            .eq('company_id', id),
            
          // Get notes
          supabase
            .from('notes_companies')
            .select(`
              note_company_id,
              notes (
                note_id,
                title,
                text,
                created_at
              )
            `)
            .eq('company_id', id)
            .order('created_at', { foreignTable: 'notes', ascending: false })
        ]);
        
        // Set all related data
        setContacts(contactsResult.data || []);
        setTags(tagsResult.data?.map(t => t.tags) || []);
        setCities(citiesResult.data?.map(c => c.cities) || []);
        setDeals(dealsResult.data || []);
        setNotes(notesResult.data?.map(n => n.notes) || []);
        
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError(err.message || 'Error loading company data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanyData();
  }, [id]);
  
  // Reset active tab when company changes
  useEffect(() => {
    setActiveTab('contacts');
  }, [id]);
  
  // Handle edit button click (placeholder for now)
  const handleEdit = () => {
    // TODO: Navigate to company edit page when created
    toast.info('Company editing coming soon');
  };
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // LinkedIn handlers
  const handleLinkedInClick = () => {
    try {
      if (company.linkedin && company.linkedin.trim()) {
        // Open LinkedIn profile
        const linkedinUrl = company.linkedin.startsWith('http') 
          ? company.linkedin 
          : `https://${company.linkedin}`;
        window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Search on LinkedIn
        const searchQuery = company.name || '';
        if (searchQuery) {
          const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchQuery)}`;
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast.info('No company name available to search on LinkedIn');
        }
      }
    } catch (error) {
      console.error('Error opening LinkedIn:', error);
      toast.error('Failed to open LinkedIn');
    }
  };

  // Website handler
  const handleWebsiteClick = () => {
    try {
      if (company.website && company.website.trim()) {
        const websiteUrl = company.website.startsWith('http') 
          ? company.website 
          : `https://${company.website}`;
        window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      toast.error('Failed to open website');
    }
  };

  // Navigation handlers
  const handleContactClick = (contact) => {
    navigate(`/contacts/${contact.contact_id}`);
  };

  const handleDealClick = (deal) => {
    // TODO: Navigate to deal page when created
    toast.info('Deal details coming soon');
  };
  
  // TagsModalComponent handlers
  const handleOpenTagsManagerModal = () => {
    setIsTagsManagerModalOpen(true);
  };

  const handleCloseTagsManagerModal = () => {
    setIsTagsManagerModalOpen(false);
  };

  const handleTagAdded = (newTag) => {
    // Refresh tags when a tag is added
    setTags(prev => {
      const exists = prev.some(tag => tag.tag_id === newTag.tag_id);
      if (!exists) {
        return [...prev, newTag];
      }
      return prev;
    });
  };

  const handleTagRemoved = (removedTag) => {
    // Refresh tags when a tag is removed
    setTags(prev => prev.filter(tag => tag.tag_id !== removedTag.tag_id));
  };

  // Tags modal handlers
  const handleOpenTagsModal = () => {
    setIsTagsModalOpen(true);
    // Reset state when opening modal
    setSelectedTags([]);
    setFilteredResults([]);
    setActiveTagFilter('contacts');
  };

  const handleCloseTagsModal = () => {
    setIsTagsModalOpen(false);
    // Reset state when closing modal
    setSelectedTags([]);
    setFilteredResults([]);
  };

  const handleFilterChange = (filter) => {
    setActiveTagFilter(filter);
  };
  
  // Add new filtering handlers
  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => {
      const newSelected = prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      // Fetch results when tags change
      if (newSelected.length > 0) {
        fetchFilteredResults(newSelected, activeTagFilter);
      } else {
        setFilteredResults([]);
      }
      
      return newSelected;
    });
  };

  const handleEntityTypeChange = (entityType) => {
    setActiveTagFilter(entityType);
    if (selectedTags.length > 0) {
      fetchFilteredResults(selectedTags, entityType);
    }
  };

  const fetchFilteredResults = async (tagIds, entityType) => {
    if (tagIds.length === 0) {
      setFilteredResults([]);
      return;
    }

    setIsLoadingResults(true);
    
    try {
      let entityField;
      let entityTable;
      let mainTable;
      let selectFields;
      
      if (entityType === 'contacts') {
        entityField = 'contact_id';
        entityTable = 'contact_tags';
        mainTable = 'contacts';
        selectFields = `
          contact_id,
          first_name,
          last_name,
          job_role,
          score,
          category
        `;
      } else if (entityType === 'companies') {
        entityField = 'company_id';
        entityTable = 'company_tags';
        mainTable = 'companies';
        selectFields = `
          company_id,
          name,
          website,
          category,
          description
        `;
      } else if (entityType === 'deals') {
        entityField = 'deal_id';
        entityTable = 'deals_tags';
        mainTable = 'deals';
        selectFields = `
          deal_id,
          opportunity,
          total_investment,
          category,
          stage,
          description,
          created_at
        `;
      }

      // Get all tag associations for the selected tags
      const { data: tagAssociations, error } = await supabase
        .from(entityTable)
        .select(`${entityField}, tag_id`)
        .in('tag_id', tagIds);
        
      if (error) throw error;
      
      // Group by entity and count matching tags
      const entityTagCounts = {};
      tagAssociations.forEach(association => {
        const entityId = association[entityField];
        if (!entityTagCounts[entityId]) {
          entityTagCounts[entityId] = 0;
        }
        entityTagCounts[entityId]++;
      });
      
      // Filter entities that have ALL selected tags
      const entityIdsWithAllTags = Object.keys(entityTagCounts)
        .filter(entityId => entityTagCounts[entityId] === tagIds.length);
      
      if (entityIdsWithAllTags.length === 0) {
        setFilteredResults([]);
        return;
      }
      
      // Now fetch the actual entity data directly from main table
      const { data: entities, error: entitiesError } = await supabase
        .from(mainTable)
        .select(selectFields)
        .in(entityField, entityIdsWithAllTags);
      
      if (entitiesError) throw entitiesError;
      
      // The results are already the direct entity data, no need to extract nested data
      setFilteredResults(entities || []);
      
    } catch (err) {
      console.error('Error fetching filtered results:', err);
      toast.error('Failed to fetch filtered results');
      setFilteredResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };
  
  if (loading) {
    return (
      <Container key={id}>
        <LoadingScreen>
          <div>Loading Company Data...</div>
        </LoadingScreen>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container key={id}>
        <ErrorScreen>
          <h2>Error Loading Company</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/companies')}>Back to Companies</button>
        </ErrorScreen>
      </Container>
    );
  }
  
  if (!company) {
    return (
      <Container key={id}>
        <ErrorScreen>
          <h2>Company Not Found</h2>
          <p>The requested company could not be found.</p>
          <button onClick={() => navigate('/companies')}>Back to Companies</button>
        </ErrorScreen>
      </Container>
    );
  }
  
  return (
    <Container key={id}>
      <Breadcrumbs>
        <span onClick={() => navigate('/companies')} style={{ cursor: 'pointer' }}>Companies</span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span 
          onClick={() => navigate(`/companies?category=${encodeURIComponent(company.category || 'Uncategorized')}`)} 
          style={{ cursor: 'pointer' }}
        >
          {company.category || 'Uncategorized'}
        </span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#ccc' }}>{company.name}</span>
      </Breadcrumbs>
      
      <Header>
        <div>
          <Title>{company.name}</Title>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', color: '#999', fontSize: '0.85rem' }}>
            <div style={{ marginRight: '20px' }}>
              <span>Created: </span>
              <span style={{ color: '#eee' }}>{formatDateTime(company.created_at)}</span>
            </div>
            <div>
              <span>Last modified: </span>
              <span style={{ color: '#eee' }}>{formatDateTime(company.updated_at)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {company.website && (
            <button
              onClick={handleWebsiteClick}
              style={{
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <FiGlobe style={{ marginRight: '5px' }} /> Website
            </button>
          )}
          
          {company.linkedin && (
            <LinkedInContainer>
              <LinkedInIcon 
                size={20}
                hasLink={!!(company.linkedin && company.linkedin.trim())}
                onClick={handleLinkedInClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLinkedInClick();
                  }
                }}
                tabIndex={0}
                title={
                  company.linkedin && company.linkedin.trim() 
                    ? "Click to open LinkedIn profile" 
                    : `Click to search for ${company.name} on LinkedIn`
                }
              />
            </LinkedInContainer>
          )}
          
          <EditButton onClick={handleEdit}>
            <FiEdit /> Edit
          </EditButton>
        </div>
      </Header>
      
      <ContentGrid>
        {/* Left Column - Company Info */}
        <div style={{ width: '20%', flexShrink: 0 }}>
          <Card>
            <CardTitle><FiBriefcase /> Company Information</CardTitle>
            
            <InfoItem>
              <InfoLabel>Website</InfoLabel>
              {company.website ? (
                <InfoValue 
                  onClick={handleWebsiteClick}
                  style={{ 
                    cursor: 'pointer',
                    color: '#00ff00'
                  }}
                  title="Click to open website"
                >
                  {company.website}
                </InfoValue>
              ) : (
                <InfoValue>-</InfoValue>
              )}
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>LinkedIn</InfoLabel>
              <LinkedInContainer>
                <LinkedInIcon 
                  size={16}
                  hasLink={!!(company.linkedin && company.linkedin.trim())}
                  onClick={handleLinkedInClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLinkedInClick();
                    }
                  }}
                  tabIndex={0}
                  title={
                    company.linkedin && company.linkedin.trim() 
                      ? "Click to open LinkedIn profile" 
                      : `Click to search for ${company.name} on LinkedIn`
                  }
                />
              </LinkedInContainer>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Category</InfoLabel>
              <InfoValue>{company.category || '-'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Description</InfoLabel>
              <InfoValue style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                {company.description || '-'}
              </InfoValue>
            </InfoItem>
          </Card>
          
          <Card>
            <TagsHeader>
              <CardTitle 
                onClick={handleOpenTagsModal}
                style={{ cursor: 'pointer' }}
                title="Click to view tag relationships"
              >
                <FiTag /> Tags
              </CardTitle>
            </TagsHeader>
            
            <BadgeContainer>
              {tags.length > 0 ? (
                tags.map(tag => (
                  <Badge 
                    key={tag.tag_id}
                    onClick={handleOpenTagsManagerModal}
                    style={{ cursor: 'pointer' }}
                    title="Click to manage tags"
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span 
                  style={{ 
                    color: '#00ff00', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  onClick={handleOpenTagsManagerModal}
                  title="Click to add tags"
                >
                  Add Tags
                </span>
              )}
            </BadgeContainer>
          </Card>
          
          {cities.length > 0 && (
            <Card>
              <CardTitle><FiMapPin /> Locations</CardTitle>
              <BadgeContainer>
                {cities.map(city => (
                  <Badge key={city.city_id}>
                    {city.name}, {city.country}
                  </Badge>
                ))}
              </BadgeContainer>
            </Card>
          )}
        </div>
        
        {/* Right Column - Related Data */}
        <div style={{ width: '80%', flexGrow: 1, boxSizing: 'border-box', overflow: 'hidden', paddingRight: '5px' }}>
          <Tabs>
            <Tab 
              active={activeTab === 'contacts'}
              onClick={() => setActiveTab('contacts')}
            >
              Contacts ({contacts.length})
            </Tab>
            <Tab 
              active={activeTab === 'deals'}
              onClick={() => setActiveTab('deals')}
            >
              Deals ({deals.length})
            </Tab>
          </Tabs>
          
          <TabContent active={activeTab === 'contacts'}>
            <Card>
              <CardTitle><FiUsers /> Associated Contacts</CardTitle>
              {contacts.length === 0 ? (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>
                  No contacts associated with this company
                </div>
              ) : (
                <div>
                  {contacts.map(contactRelation => (
                    <RelatedItem 
                      key={contactRelation.contact_companies_id} 
                      onClick={() => handleContactClick(contactRelation.contacts)}
                    >
                      <RelatedTitle>
                        {contactRelation.contacts.first_name} {contactRelation.contacts.last_name}
                      </RelatedTitle>
                      <RelatedSubtitle>
                        {contactRelation.contacts.job_role && `${contactRelation.contacts.job_role} • `}
                        {contactRelation.relationship || 'Associated'}
                        {contactRelation.contacts.score && ` • Score: ${contactRelation.contacts.score}/5`}
                      </RelatedSubtitle>
                    </RelatedItem>
                  ))}
                </div>
              )}
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'deals'}>
            <Card>
              <CardTitle><FiDollarSign /> Associated Deals</CardTitle>
              {deals.length === 0 ? (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>
                  No deals associated with this company
                </div>
              ) : (
                <div>
                  {deals.map(dealRelation => (
                    <RelatedItem 
                      key={dealRelation.deals_companies_id} 
                      onClick={() => handleDealClick(dealRelation.deals)}
                    >
                      <RelatedTitle>{dealRelation.deals.opportunity}</RelatedTitle>
                      <RelatedSubtitle>
                        {dealRelation.deals.total_investment && 
                          `$${dealRelation.deals.total_investment.toLocaleString()} • `
                        }
                        {dealRelation.deals.stage && `${dealRelation.deals.stage} • `}
                        {dealRelation.deals.category}
                        <div style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                          Created: {formatDate(dealRelation.deals.created_at)}
                        </div>
                      </RelatedSubtitle>
                    </RelatedItem>
                  ))}
                </div>
              )}
            </Card>
          </TabContent>
        </div>
      </ContentGrid>

      {/* TagsModalComponent */}
      {isTagsManagerModalOpen && (
        <TagsModalComponent
          isOpen={isTagsManagerModalOpen}
          onRequestClose={handleCloseTagsManagerModal}
          company={company}
          onTagAdded={handleTagAdded}
          onTagRemoved={handleTagRemoved}
        />
      )}

      {/* Tags Relationships Modal */}
      {isTagsModalOpen && (
        <ModalOverlay onClick={handleCloseTagsModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalSidebar>
              <FilterButton 
                active={activeTagFilter === 'contacts'}
                onClick={() => handleEntityTypeChange('contacts')}
              >
                Related Contacts
              </FilterButton>
              <FilterButton 
                active={activeTagFilter === 'companies'}
                onClick={() => handleEntityTypeChange('companies')}
              >
                Related Companies
              </FilterButton>
              <FilterButton 
                active={activeTagFilter === 'deals'}
                onClick={() => handleEntityTypeChange('deals')}
              >
                Related Deals
              </FilterButton>
              
              {/* Tags display in sidebar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Filter by Tags
                  {selectedTags.length > 0 && (
                    <span style={{ color: '#999', fontSize: '0.8rem', marginLeft: '8px' }}>
                      ({selectedTags.length} selected)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {tags.length > 0 ? (
                    tags.map(tag => (
                      <FilterableTag
                        key={tag.tag_id}
                        selected={selectedTags.includes(tag.tag_id)}
                        onClick={() => handleTagToggle(tag.tag_id)}
                      >
                        {tag.name}
                      </FilterableTag>
                    ))
                  ) : (
                    <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No tags
                    </span>
                  )}
                </div>
              </div>
            </ModalSidebar>
            
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Tag Relationships</ModalTitle>
                <CloseButton onClick={handleCloseTagsModal}>
                  <FiX size={20} />
                </CloseButton>
              </ModalHeader>
              
              <ResultsContainer>
                {selectedTags.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px',
                    color: '#999',
                    textAlign: 'center'
                  }}>
                    Select one or more tags to see related {activeTagFilter}
                  </div>
                ) : isLoadingResults ? (
                  <LoadingSpinner>
                    Loading {activeTagFilter}...
                  </LoadingSpinner>
                ) : filteredResults.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px',
                    color: '#999',
                    textAlign: 'center'
                  }}>
                    No {activeTagFilter} found with selected tags
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      padding: '15px 20px 10px 20px', 
                      borderBottom: '1px solid #333',
                      color: '#00ff00',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {filteredResults.length} {activeTagFilter} found
                    </div>
                    {filteredResults.map(item => {
                      if (activeTagFilter === 'contacts') {
                        return (
                          <ResultItem 
                            key={item.contact_id}
                            onClick={() => {
                              navigate(`/contacts/${item.contact_id}`);
                              handleCloseTagsModal();
                            }}
                          >
                            <ResultTitle>
                              {item.first_name} {item.last_name}
                            </ResultTitle>
                            <ResultSubtitle>
                              {item.job_role && `${item.job_role} • `}
                              {item.category || 'Uncategorized'}
                              {item.score && ` • Score: ${item.score}/5`}
                            </ResultSubtitle>
                          </ResultItem>
                        );
                      } else if (activeTagFilter === 'companies') {
                        return (
                          <ResultItem 
                            key={item.company_id}
                            onClick={() => {
                              if (item.company_id !== id) {
                                navigate(`/companies/${item.company_id}`);
                                handleCloseTagsModal();
                              }
                            }}
                          >
                            <ResultTitle>{item.name}</ResultTitle>
                            <ResultSubtitle>
                              {item.category && `${item.category} • `}
                              {item.website && `${item.website} • `}
                              {item.description || 'No description'}
                            </ResultSubtitle>
                          </ResultItem>
                        );
                      } else if (activeTagFilter === 'deals') {
                        return (
                          <ResultItem 
                            key={item.deal_id}
                            onClick={() => {
                              // Since we're using inline display, we can just switch to the deals tab
                              setActiveTab('deals');
                              handleCloseTagsModal();
                            }}
                          >
                            <ResultTitle>{item.opportunity}</ResultTitle>
                            <ResultSubtitle>
                              {item.total_investment && `$${item.total_investment.toLocaleString()} • `}
                              {item.category && `${item.category} • `}
                              {item.stage}
                            </ResultSubtitle>
                          </ResultItem>
                        );
                      }
                      return null; // Default return for any unmatched cases
                    })}
                  </div>
                )}
              </ResultsContainer>
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default CompanyRecord; 
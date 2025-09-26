import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
// Note: Modal components are embedded in this file to match the new CRM theme

const RelatedSection = ({ contactId, theme }) => {
  const navigate = useNavigate();

  // State management
  const [contactCities, setContactCities] = useState([]);
  const [contactTags, setContactTags] = useState([]);
  const [contactCompanies, setContactCompanies] = useState([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  // Modal states
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [associateCompanyModalOpen, setAssociateCompanyModalOpen] = useState(false);

  // Fetch related data
  const fetchRelatedData = async () => {
    if (!contactId) return;
    setLoadingRelatedData(true);
    try {
      // Fetch cities
      const { data: cities } = await supabase
        .from('contact_cities')
        .select(`
          contact_id,
          city_id,
          cities (
            name,
            country
          )
        `)
        .eq('contact_id', contactId);

      // Fetch tags
      const { data: tags } = await supabase
        .from('contact_tags')
        .select(`
          contact_id,
          tag_id,
          tags (
            tag_id,
            name
          )
        `)
        .eq('contact_id', contactId);

      // Fetch companies
      const { data: companies } = await supabase
        .from('contact_companies')
        .select(`
          contact_id,
          company_id,
          relationship,
          is_primary,
          companies (
            company_id,
            name,
            website,
            category
          )
        `)
        .eq('contact_id', contactId);

      setContactCities(cities || []);
      setContactTags(tags || []);
      setContactCompanies(companies || []);
    } catch (error) {
      console.error('Error fetching related data:', error);
      toast.error('Failed to load related data');
    } finally {
      setLoadingRelatedData(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchRelatedData();
  }, [contactId]);

  // Click handlers
  const handleCityClick = (cityRelation) => {
    const cityId = cityRelation.city_id;
    const cityName = cityRelation.cities?.name || 'Unknown City';
    if (cityId) {
      navigate(`/city/${cityId}/contacts`, {
        state: {
          cityName: cityName,
          contactId: contactId
        }
      });
    }
  };

  const handleTagClick = (tag) => {
    const tagId = tag?.tag_id;
    const tagName = tag?.name || 'Unknown Tag';
    if (tagId) {
      navigate(`/tag/${tagId}/contacts`, {
        state: {
          tagName: tagName,
          contactId: contactId
        }
      });
    }
  };

  const handleCompanyClick = (companyRelation) => {
    const companyId = companyRelation.companies?.company_id;
    if (companyId) {
      navigate(`/company/${companyId}`, {
        state: {
          contactId: contactId
        }
      });
    }
  };

  // Modal handlers
  const handleAddCities = () => {
    setCityModalOpen(true);
  };

  const handleAddTags = () => {
    setTagModalOpen(true);
  };

  const handleAddCompanies = () => {
    setAssociateCompanyModalOpen(true);
  };

  const handleLinkedinEnrich = () => {
    toast.success('LinkedIn Enrich coming soon!');
  };

  // Modal data handlers
  const handleCityAdded = () => {
    fetchRelatedData(); // Refresh data when city is added
  };

  const handleCityRemoved = () => {
    fetchRelatedData(); // Refresh data when city is removed
  };

  const handleTagAdded = () => {
    fetchRelatedData(); // Refresh data when tag is added
  };

  const handleTagRemoved = () => {
    fetchRelatedData(); // Refresh data when tag is removed
  };

  const handleCompanyAdded = () => {
    fetchRelatedData(); // Refresh data when company is added
  };

  const handleCompanyRemoved = () => {
    fetchRelatedData(); // Refresh data when company is removed
  };

  if (loadingRelatedData) {
    return (
      <RelatedContainer theme={theme}>
        <RelatedLoading theme={theme}>
          <LoadingText theme={theme}>Loading related data...</LoadingText>
        </RelatedLoading>
      </RelatedContainer>
    );
  }

  return (
    <RelatedContainer theme={theme}>
      {/* Cities Section */}
      <RelatedSectionBlock theme={theme}>
        <RelatedSectionHeader>
          <RelatedSectionTitle theme={theme} style={{ borderBottom: 'none', paddingBottom: '0' }}>
            🌍 Cities
          </RelatedSectionTitle>
          <AddButton theme={theme} onClick={handleAddCities}>
            + Add Cities
          </AddButton>
        </RelatedSectionHeader>
        {contactCities.length === 0 ? (
          <RelatedEmptyMessage theme={theme}>
            No cities associated with this contact
          </RelatedEmptyMessage>
        ) : (
          <RelatedGrid>
            {contactCities.map((cityRelation, index) => (
              <RelatedCard
                key={index}
                theme={theme}
                $clickable={true}
                onClick={() => handleCityClick(cityRelation)}
              >
                <RelatedCardIcon theme={theme}>
                  🏙️
                </RelatedCardIcon>
                <RelatedCardContent>
                  <RelatedCardTitle theme={theme}>
                    {cityRelation.cities?.name || 'Unknown City'}
                  </RelatedCardTitle>
                  {cityRelation.cities?.country && (
                    <RelatedCardSubtitle theme={theme}>
                      {cityRelation.cities.country}
                    </RelatedCardSubtitle>
                  )}
                </RelatedCardContent>
              </RelatedCard>
            ))}
          </RelatedGrid>
        )}
      </RelatedSectionBlock>

      {/* Divider */}
      <Divider theme={theme} />

      {/* Tags Section */}
      <RelatedSectionBlock theme={theme}>
        <RelatedSectionHeader>
          <RelatedSectionTitle theme={theme} style={{ borderBottom: 'none', paddingBottom: '0' }}>
            🏷️ Tags
          </RelatedSectionTitle>
          <AddButton theme={theme} onClick={handleAddTags}>
            + Add Tags
          </AddButton>
        </RelatedSectionHeader>
        {contactTags.length === 0 ? (
          <RelatedEmptyMessage theme={theme}>
            No tags associated with this contact
          </RelatedEmptyMessage>
        ) : (
          <TagsContainer>
            {contactTags.map((tagRelation, index) => (
              <TagBadge
                key={index}
                theme={theme}
                $clickable={true}
                onClick={() => handleTagClick(tagRelation.tags)}
              >
                {tagRelation.tags?.name || 'Unknown Tag'}
              </TagBadge>
            ))}
          </TagsContainer>
        )}
      </RelatedSectionBlock>

      {/* Divider */}
      <Divider theme={theme} />

      {/* Companies Section */}
      <RelatedSectionBlock theme={theme}>
        <RelatedSectionHeader>
          <RelatedSectionTitle theme={theme} style={{ borderBottom: 'none', paddingBottom: '0' }}>
            🏢 Companies
          </RelatedSectionTitle>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AddButton theme={theme} onClick={handleAddCompanies}>
              + Add Companies
            </AddButton>
            <AddButton theme={theme} onClick={handleLinkedinEnrich} style={{ background: '#0077b5', borderColor: '#0077b5' }}>
              🔗 LinkedIn Enrich
            </AddButton>
          </div>
        </RelatedSectionHeader>
        {contactCompanies.length === 0 ? (
          <RelatedEmptyMessage theme={theme}>
            No companies associated with this contact
          </RelatedEmptyMessage>
        ) : (
          <RelatedGrid>
            {contactCompanies.map((companyRelation, index) => (
              <RelatedCard
                key={index}
                theme={theme}
                $clickable={true}
                onClick={() => handleCompanyClick(companyRelation)}
              >
                <RelatedCardIcon theme={theme}>
                  🏢
                </RelatedCardIcon>
                <RelatedCardContent>
                  <RelatedCardTitle theme={theme}>
                    {companyRelation.companies?.name || 'Unknown Company'}
                  </RelatedCardTitle>
                  {companyRelation.companies?.category && (
                    <RelatedCardSubtitle theme={theme}>
                      {companyRelation.companies.category}
                    </RelatedCardSubtitle>
                  )}
                  {companyRelation.companies?.website && (
                    <RelatedCardLink
                      href={companyRelation.companies.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      theme={theme}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Website
                    </RelatedCardLink>
                  )}
                  {companyRelation.is_primary && (
                    <PrimaryBadge theme={theme}>Primary</PrimaryBadge>
                  )}
                </RelatedCardContent>
              </RelatedCard>
            ))}
          </RelatedGrid>
        )}
      </RelatedSectionBlock>

      {/* City Management Modal */}
      <Modal
        isOpen={cityModalOpen}
        onRequestClose={() => setCityModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <CityManagementModal
          theme={theme}
          contact={{ contact_id: contactId }}
          contactCities={contactCities}
          onCityAdded={handleCityAdded}
          onCityRemoved={handleCityRemoved}
          onClose={() => setCityModalOpen(false)}
        />
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        isOpen={tagModalOpen}
        onRequestClose={() => setTagModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <TagManagementModal
          theme={theme}
          contact={{ contact_id: contactId }}
          contactTags={contactTags}
          onTagAdded={handleTagAdded}
          onTagRemoved={handleTagRemoved}
          onClose={() => setTagModalOpen(false)}
        />
      </Modal>

      {/* Associate Company Modal */}
      <Modal
        isOpen={associateCompanyModalOpen}
        onRequestClose={() => setAssociateCompanyModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <AssociateCompanyModal
          theme={theme}
          contact={{ contact_id: contactId }}
          contactCompanies={contactCompanies}
          onCompanyAdded={handleCompanyAdded}
          onCompanyRemoved={handleCompanyRemoved}
          onClose={() => setAssociateCompanyModalOpen(false)}
        />
      </Modal>
    </RelatedContainer>
  );
};

// Styled Components
const RelatedContainer = styled.div`
  padding: 20px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const RelatedLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-direction: column;
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const RelatedSectionBlock = styled.div`
  margin-bottom: 32px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const RelatedSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const RelatedSectionTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const RelatedEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border-radius: 8px;
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const RelatedCard = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  }
`;

const RelatedCardIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const RelatedCardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RelatedCardTitle = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  word-break: break-word;
`;

const RelatedCardSubtitle = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  margin-bottom: 8px;
`;

const RelatedCardLink = styled.a`
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  text-decoration: none;
  font-size: 0.875rem;
  display: inline-block;
  margin-top: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
    text-decoration: underline;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E40AF'};
    transform: ${props => props.$clickable ? 'translateY(-1px)' : 'none'};
  }
`;

const AddButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const PrimaryBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#92400E'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FEF3C7'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 4px;
  display: inline-block;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  margin: 24px 0;
`;

// Modal Components
const CityManagementModal = ({ theme, contact, contactCities, onCityAdded, onCityRemoved, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCitySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);
      if (error) throw error;
      const filteredSuggestions = data.filter(city =>
        !contactCities.some(cityRelation =>
          cityRelation.city_id === city.city_id
        )
      );
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchCitySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactCities]);

  const handleAddCity = async (cityToAdd) => {
    try {
      setLoading(true);
      const { data: existingCheck, error: checkError } = await supabase
        .from('contact_cities')
        .select('contact_id, city_id')
        .eq('contact_id', contact.contact_id)
        .eq('city_id', cityToAdd.city_id);
      if (checkError) throw checkError;
      if (existingCheck && existingCheck.length > 0) {
        setMessage({ type: 'info', text: 'This city is already linked to the contact' });
        return;
      }
      const { error } = await supabase
        .from('contact_cities')
        .insert({
          contact_id: contact.contact_id,
          city_id: cityToAdd.city_id,
          created_at: new Date().toISOString()
        });
      if (error) throw error;
      onCityAdded();
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'City linked successfully' });
    } catch (error) {
      console.error('Error linking city:', error);
      setMessage({ type: 'error', text: `Failed to link city: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCity = async (cityRelation) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contact_cities')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('city_id', cityRelation.city_id);
      if (error) throw error;
      onCityRemoved();
      setMessage({ type: 'success', text: 'City unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking city:', error);
      setMessage({ type: 'error', text: 'Failed to unlink city' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cities')
        .insert({
          name: searchTerm.trim(),
          country: 'Unknown',
          created_at: new Date().toISOString()
        })
        .select();
      if (error) throw error;
      if (data && data[0]) {
        await handleAddCity(data[0]);
      }
    } catch (error) {
      console.error('Error creating city:', error);
      setMessage({ type: 'error', text: 'Failed to create city' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <CityModalHeader theme={theme}>
        <CityModalTitle theme={theme}>Manage Cities</CityModalTitle>
        <CityModalCloseButton theme={theme} onClick={onClose}>
          ×
        </CityModalCloseButton>
      </CityModalHeader>
      <CityModalBody theme={theme}>
        <CityModalSection>
          <CityModalSectionTitle theme={theme}>Related Cities</CityModalSectionTitle>
          <CitiesList>
            {contactCities.map((cityRelation, index) => (
              <CityTag key={index} theme={theme}>
                <span>{cityRelation.cities?.name || 'Unknown City'}</span>
                <CityRemoveButton
                  theme={theme}
                  onClick={() => handleRemoveCity(cityRelation)}
                  disabled={loading}
                >
                  ×
                </CityRemoveButton>
              </CityTag>
            ))}
            {contactCities.length === 0 && (
              <CityEmptyMessage theme={theme}>No cities linked</CityEmptyMessage>
            )}
          </CitiesList>
        </CityModalSection>
        <CityModalSection>
          <CityModalSectionTitle theme={theme}>Add Cities</CityModalSectionTitle>
          <CitySearchContainer>
            <CitySearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a city (type at least 2 letters)..."
            />
          </CitySearchContainer>
          {showSuggestions && (
            <CitySuggestionsContainer theme={theme}>
              {suggestions.map(suggestion => (
                <CitySuggestionItem
                  key={suggestion.city_id}
                  theme={theme}
                  onClick={() => handleAddCity(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name}
                  {suggestion.country && suggestion.country !== 'Unknown' && (
                    <span style={{ opacity: 0.7 }}> • {suggestion.country}</span>
                  )}
                </CitySuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <CityNoResults theme={theme}>No cities found</CityNoResults>
              )}
              {searchTerm.length >= 2 && (
                <CityCreateButton
                  theme={theme}
                  onClick={handleCreateCity}
                  disabled={loading}
                >
                  + Create "{searchTerm}" as new city
                </CityCreateButton>
              )}
            </CitySuggestionsContainer>
          )}
        </CityModalSection>
        {message.text && (
          <CityMessage theme={theme} type={message.type}>
            {message.text}
          </CityMessage>
        )}
      </CityModalBody>
      <CityModalFooter theme={theme}>
        <CityModalButton theme={theme} onClick={onClose}>
          Done
        </CityModalButton>
      </CityModalFooter>
      {loading && (
        <CityLoadingOverlay theme={theme}>
          Loading...
        </CityLoadingOverlay>
      )}
    </>
  );
};

// Full Tag Management Modal Implementation - Copied exactly from ContactDetail.js
const TagManagementModal = ({ theme, contact, contactTags, onTagAdded, onTagRemoved, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch tag suggestions
  const fetchTagSuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out tags already associated with contact
      const filteredSuggestions = data.filter(tag =>
        !contactTags.some(contactTag => contactTag.tags?.tag_id === tag.tag_id || contactTag.tags?.id === tag.id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchTagSuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactTags]);

  const handleAddTag = async (tag) => {
    try {
      setLoading(true);
      const tagId = tag.tag_id || tag.id;
      const tagName = tag.name || tag.tag_name;

      if (!tagId) {
        throw new Error('Invalid tag ID');
      }

      // Add relationship in contact_tags table
      const { error } = await supabase
        .from('contact_tags')
        .insert({
          contact_id: contact.contact_id,
          tag_id: tagId
        });

      if (error) throw error;

      setMessage({ type: 'success', text: `Added "${tagName}" successfully` });

      if (onTagAdded) {
        onTagAdded({ tag_id: tagId, name: tagName });
      }

      setSearchTerm('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error adding tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to add tag' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagRelation) => {
    try {
      setLoading(true);
      const tagId = tagRelation.tags?.tag_id || tagRelation.tags?.id;
      const tagName = tagRelation.tags?.name || tagRelation.tags?.tag_name;

      if (!tagId) {
        throw new Error('Invalid tag ID');
      }

      // Remove relationship from contact_tags table
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('tag_id', tagId);

      if (error) throw error;

      setMessage({ type: 'success', text: `Removed "${tagName}" successfully` });

      if (onTagRemoved) {
        onTagRemoved({ tag_id: tagId, name: tagName });
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to remove tag' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);

      // Check if tag already exists
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', searchTerm.trim())
        .limit(1);

      if (checkError) throw checkError;

      let tagToUse;

      if (existingTags && existingTags.length > 0) {
        // Use existing tag
        tagToUse = existingTags[0];
      } else {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({ name: searchTerm.trim() })
          .select()
          .single();

        if (createError) throw createError;
        tagToUse = newTag;
      }

      // Add the tag to contact
      await handleAddTag(tagToUse);
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create tag' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TagModalHeader theme={theme}>
        <TagModalTitle theme={theme}>Manage Tags</TagModalTitle>
        <TagModalCloseButton theme={theme} onClick={onClose}>
          ×
        </TagModalCloseButton>
      </TagModalHeader>

      <TagModalContent theme={theme}>
        <TagModalSection>
          <TagModalSectionTitle theme={theme}>Current Tags</TagModalSectionTitle>
          <TagsList>
            {contactTags.map((tagRelation, index) => (
              <TagBadge key={index} theme={theme}>
                <span>{tagRelation.tags?.name || tagRelation.tags?.tag_name || 'Unknown Tag'}</span>
                <TagRemoveButton
                  theme={theme}
                  onClick={() => handleRemoveTag(tagRelation)}
                  disabled={loading}
                >
                  ×
                </TagRemoveButton>
              </TagBadge>
            ))}
            {contactTags.length === 0 && (
              <TagEmptyMessage theme={theme}>No tags assigned</TagEmptyMessage>
            )}
          </TagsList>
        </TagModalSection>

        <TagModalSection>
          <TagModalSectionTitle theme={theme}>Add Tags</TagModalSectionTitle>
          <TagSearchContainer>
            <TagSearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a tag or create new (type at least 2 letters)..."
            />
          </TagSearchContainer>

          {showSuggestions && (
            <TagSuggestionsContainer theme={theme}>
              {suggestions.map((suggestion, index) => (
                <TagSuggestionItem
                  key={index}
                  theme={theme}
                  onClick={() => handleAddTag(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name || suggestion.tag_name}
                </TagSuggestionItem>
              ))}

              {searchTerm.trim() && !suggestions.find(s =>
                (s.name || s.tag_name)?.toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <TagCreateButton
                  theme={theme}
                  onClick={handleCreateTag}
                  disabled={loading}
                >
                  + Create "{searchTerm}"
                </TagCreateButton>
              )}
            </TagSuggestionsContainer>
          )}
        </TagModalSection>

        {message.text && (
          <TagModalMessage theme={theme} type={message.type}>
            {message.text}
          </TagModalMessage>
        )}
      </TagModalContent>

      <TagModalFooter theme={theme}>
        <TagModalButton theme={theme} onClick={onClose}>
          Done
        </TagModalButton>
      </TagModalFooter>

      {loading && (
        <TagLoadingOverlay theme={theme}>
          Loading...
        </TagLoadingOverlay>
      )}
    </>
  );
};

// Full Associate Company Modal Implementation
const AssociateCompanyModal = ({ theme, contact, contactCompanies, onCompanyAdded, onCompanyRemoved, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [removingCompany, setRemovingCompany] = useState(null);

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 3) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out companies that are already associated
      const filteredSuggestions = data.filter(company => {
        const companyId = company.company_id || company.id;
        return !contactCompanies.some(relation => {
          const relationCompanyId = relation.companies?.company_id || relation.companies?.id;
          return relationCompanyId === companyId;
        });
      });

      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching company suggestions:', err);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 3) {
      fetchCompanySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactCompanies]);

  const handleAddCompany = async (company) => {
    try {
      setLoading(true);

      // Add relationship in contact_companies table
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id
        });

      if (error) throw error;

      onCompanyAdded(company);
      setSearchTerm('');
      setShowSuggestions(false);
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (companyRelation) => {
    try {
      setRemovingCompany(companyRelation.company_id);

      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('company_id', companyRelation.company_id);

      if (error) throw error;

      onCompanyRemoved(companyRelation);
    } catch (err) {
      console.error('Error removing company:', err);
      toast.error('Failed to remove company association');
    } finally {
      setRemovingCompany(null);
    }
  };

  const handleCreateCompany = () => {
    toast.success('Create company feature coming soon!');
  };

  return (
    <CompanyModalContainer theme={theme}>
      <CompanyModalHeader theme={theme}>
        <CompanyModalTitle theme={theme}>Manage Companies</CompanyModalTitle>
        <CompanyModalCloseButton theme={theme} onClick={onClose}>
          ×
        </CompanyModalCloseButton>
      </CompanyModalHeader>

      <CompanyModalContent theme={theme}>
        {/* Associated Companies Section */}
        <CompanyModalSection>
          <CompanyModalSectionTitle theme={theme}>Associated Companies</CompanyModalSectionTitle>
          {contactCompanies.length === 0 ? (
            <CompanyEmptyMessage theme={theme}>
              No companies associated with this contact
            </CompanyEmptyMessage>
          ) : (
            <CompanyList>
              {contactCompanies.map((companyRelation, index) => (
                <CompanyTag key={index} theme={theme}>
                  <CompanyTagContent>
                    <CompanyTagName>
                      {companyRelation.companies?.name || 'Unknown Company'}
                      {companyRelation.is_primary && (
                        <PrimaryBadge theme={theme}>Primary</PrimaryBadge>
                      )}
                    </CompanyTagName>
                    {(companyRelation.companies?.category || companyRelation.companies?.website) && (
                      <CompanyTagDetails theme={theme}>
                        {companyRelation.companies?.category && companyRelation.companies.category}
                        {companyRelation.companies?.category && companyRelation.companies?.website && ' • '}
                        {companyRelation.companies?.website && (
                          <a
                            href={companyRelation.companies.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit' }}
                          >
                            Website
                          </a>
                        )}
                      </CompanyTagDetails>
                    )}
                  </CompanyTagContent>
                  <CompanyRemoveButton
                    theme={theme}
                    onClick={() => handleRemoveCompany(companyRelation)}
                    disabled={removingCompany === companyRelation.company_id}
                  >
                    {removingCompany === companyRelation.company_id ? '...' : '×'}
                  </CompanyRemoveButton>
                </CompanyTag>
              ))}
            </CompanyList>
          )}
        </CompanyModalSection>

        {/* Add Companies Section */}
        <CompanyModalSection>
          <CompanyModalSectionTitle theme={theme}>Add Companies</CompanyModalSectionTitle>
          <CompanySearchContainer>
            <CompanySearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a company by name (type at least 3 letters)..."
            />
          </CompanySearchContainer>
        </CompanyModalSection>

        {showSuggestions && (
          <CompanySuggestionsContainer theme={theme}>
            {suggestions.length > 0
              ? suggestions.map((suggestion, index) => (
                  <CompanySuggestionItem
                    key={suggestion.id || suggestion.company_id || `suggestion-${index}`}
                    theme={theme}
                    onClick={() => handleAddCompany(suggestion)}
                    disabled={loading}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{suggestion.name}</div>
                      {suggestion.website && (
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                          {suggestion.website}
                        </div>
                      )}
                    </div>
                  </CompanySuggestionItem>
                ))
              : searchTerm.length >= 3
                ? [<CompanyNoResults key={`no-results-${searchTerm}`} theme={theme}>
                    No companies found with that name.
                    <CompanyCreateButton
                      theme={theme}
                      onClick={handleCreateCompany}
                    >
                      + Create "{searchTerm}"
                    </CompanyCreateButton>
                  </CompanyNoResults>]
                : []
            }
          </CompanySuggestionsContainer>
        )}
      </CompanyModalContent>

      <CompanyModalFooter theme={theme}>
        <CompanyModalButton theme={theme} onClick={onClose}>
          Done
        </CompanyModalButton>
      </CompanyModalFooter>
    </CompanyModalContainer>
  );
};

// City Modal Styled Components
const CityModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CityModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CityModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;
  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const CityModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CityModalSection = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const CityModalSectionTitle = styled.h4`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const CitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 32px;
`;

const CityTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 8px;
`;

const CityRemoveButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CityEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 12px;
`;

const CitySearchContainer = styled.div`
  margin-bottom: 12px;
`;

const CitySearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }
`;

const CitySuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  max-height: 200px;
  overflow-y: auto;
`;

const CitySuggestionItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
  }
  &:last-child {
    border-bottom: none;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CityNoResults = styled.div`
  padding: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  text-align: center;
`;

const CityCreateButton = styled.div`
  padding: 12px;
  cursor: pointer;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  color: ${props => props.theme === 'light' ? '#166534' : '#34D399'};
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  font-weight: 500;
  &:hover {
    background: ${props => props.theme === 'light' ? '#DCFCE7' : '#065F46'};
  }
`;

const CityMessage = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
  background: ${props => {
    if (props.type === 'success') return props.theme === 'light' ? '#F0FDF4' : '#064E3B';
    if (props.type === 'error') return props.theme === 'light' ? '#FEF2F2' : '#7F1D1D';
    return props.theme === 'light' ? '#F0F9FF' : '#0C4A6E';
  }};
  color: ${props => {
    if (props.type === 'success') return props.theme === 'light' ? '#166534' : '#34D399';
    if (props.type === 'error') return props.theme === 'light' ? '#DC2626' : '#F87171';
    return props.theme === 'light' ? '#1D4ED8' : '#60A5FA';
  }};
  font-size: 0.875rem;
`;

const CityModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CityModalButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const CityLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
`;

// Tag Modal Styled Components
const TagModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const TagModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const TagModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const TagModalContent = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const TagModalSection = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const TagModalSectionTitle = styled.h4`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 32px;
`;

const RelatedTagBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 8px;
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 12px;
`;

const TagSearchContainer = styled.div`
  margin-bottom: 12px;
`;

const TagSearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }
`;

const TagSuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  max-height: 200px;
  overflow-y: auto;
`;

const TagSuggestionItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
  }
  &:last-child {
    border-bottom: none;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagCreateButton = styled.div`
  padding: 12px;
  cursor: pointer;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  color: ${props => props.theme === 'light' ? '#166534' : '#34D399'};
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  font-weight: 500;
  &:hover {
    background: ${props => props.theme === 'light' ? '#DCFCE7' : '#065F46'};
  }
`;

const TagModalMessage = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
  background: ${props => {
    if (props.type === 'success') return props.theme === 'light' ? '#F0FDF4' : '#064E3B';
    if (props.type === 'error') return props.theme === 'light' ? '#FEF2F2' : '#7F1D1D';
    return props.theme === 'light' ? '#F0F9FF' : '#0C4A6E';
  }};
  color: ${props => {
    if (props.type === 'success') return props.theme === 'light' ? '#166534' : '#34D399';
    if (props.type === 'error') return props.theme === 'light' ? '#DC2626' : '#F87171';
    return props.theme === 'light' ? '#1D4ED8' : '#60A5FA';
  }};
  font-size: 0.875rem;
`;

const TagModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const TagModalButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const TagLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  z-index: 10;
`;

// Company Modal Styled Components
const CompanyModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CompanyModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CompanyModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CompanyModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const CompanyModalContent = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CompanyModalSection = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const CompanyModalSectionTitle = styled.h4`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const CompanyEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border-radius: 8px;
`;

const CompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CompanyTag = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const CompanyTagContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CompanyTagName = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CompanyTagDetails = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  margin-top: 4px;
`;

const CompanyRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompanySearchContainer = styled.div`
  margin-bottom: 12px;
`;

const CompanySearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }
`;

const CompanySuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  max-height: 200px;
  overflow-y: auto;
`;

const CompanySuggestionItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
  }
  &:last-child {
    border-bottom: none;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompanyNoResults = styled.div`
  padding: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  text-align: center;
`;

const CompanyCreateButton = styled.div`
  padding: 12px;
  cursor: pointer;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  color: ${props => props.theme === 'light' ? '#166534' : '#34D399'};
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  font-weight: 500;
  margin-top: 8px;
  border-radius: 4px;
  &:hover {
    background: ${props => props.theme === 'light' ? '#DCFCE7' : '#065F46'};
  }
`;

const CompanyModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CompanyModalButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

export default RelatedSection;
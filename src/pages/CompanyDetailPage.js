import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaArrowLeft, FaEdit, FaTrash, FaGlobe, FaLinkedin, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const CompanyDetailPage = ({ theme }) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Main company data
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation management
  const [activeTab, setActiveTab] = useState(() => location.state?.activeRelatedTab || 'Contacts');

  // Description expand state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Related data
  const [companyContacts, setCompanyContacts] = useState([]);
  const [companyCities, setCompanyCities] = useState([]);
  const [companyTags, setCompanyTags] = useState([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  const fetchCompany = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company details');
      navigate('/sort');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    if (!companyId) return;

    setLoadingRelatedData(true);
    try {
      // Fetch contacts associated with this company
      const { data: contacts, error: contactsError } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          is_primary,
          relationship,
          contacts (
            contact_id,
            first_name,
            last_name,
            job_role,
            category
          )
        `)
        .eq('company_id', companyId);

      if (contactsError) throw contactsError;

      // Transform the contacts data to match ContactsList expectations
      const transformedContacts = (contacts || []).map(contactRelation => {
        const contact = contactRelation.contacts;
        return {
          ...contact,
          // Add relationship info for display
          company_relationship: contactRelation.relationship,
          is_primary_company_contact: contactRelation.is_primary,
          // Format expected arrays
          emails: [],
          mobiles: [],
          companies: [{ name: company.name }] // Add current company for display
        };
      });

      // Fetch cities associated with this company
      const { data: cities, error: citiesError } = await supabase
        .from('company_cities')
        .select(`
          entry_id,
          cities (
            city_id,
            name,
            country
          )
        `)
        .eq('company_id', companyId);

      if (citiesError) throw citiesError;

      // Fetch tags associated with this company
      const { data: tags, error: tagsError } = await supabase
        .from('company_tags')
        .select(`
          entry_id,
          tags (
            tag_id,
            name
          )
        `)
        .eq('company_id', companyId);

      if (tagsError) throw tagsError;

      setCompanyContacts(transformedContacts || []);
      setCompanyCities(cities || []);
      setCompanyTags(tags || []);

      console.log('Related data loaded:', { contacts, cities, tags });
    } catch (error) {
      console.error('Error fetching related data:', error);
      toast.error('Failed to load related data');
    } finally {
      setLoadingRelatedData(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  useEffect(() => {
    if (company) {
      fetchRelatedData();
    }
  }, [company, companyId]);

  const handleBack = () => {
    const previousContactId = location.state?.previousContactId;
    if (previousContactId) {
      // Navigate back to the specific contact detail page
      navigate(`/contact/${previousContactId}`, {
        state: { activeTab: 'Related', activeRelatedTab: 'Companies' }
      });
    } else {
      // Fallback: go back in history
      navigate(-1);
    }
  };

  const handleWebsiteClick = () => {
    if (!company?.website) return;

    let url = company.website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    window.open(url, '_blank');
  };

  const handleLinkedInClick = () => {
    if (!company?.linkedin) return;

    let url = company.linkedin;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://linkedin.com/company/${url}`;
    }
    window.open(url, '_blank');
  };

  const handleContactClick = (contact) => {
    if (!contact?.contacts?.contact_id) return;

    navigate(`/contact/${contact.contacts.contact_id}`, {
      state: {
        activeTab: 'Related',
        activeRelatedTab: 'Companies',
        previousCompanyId: companyId
      }
    });
  };

  const handleCityClick = (city) => {
    if (!city?.cities?.city_id || !city?.cities?.name) return;

    navigate(`/city/${city.cities.city_id}/contacts`, {
      state: {
        cityName: city.cities.name,
        companyId: companyId
      }
    });
  };

  const handleTagClick = (tag) => {
    if (!tag?.tags?.tag_id || !tag?.tags?.name) return;

    navigate(`/tag/${tag.tags.tag_id}/contacts`, {
      state: {
        tagName: tag.tags.name,
        companyId: companyId
      }
    });
  };

  const getRelationshipBadgeColor = (relationship) => {
    switch (relationship) {
      case 'founder': return '#10B981'; // Green
      case 'employee': return '#3B82F6'; // Blue
      case 'advisor': return '#8B5CF6'; // Purple
      case 'manager': return '#F59E0B'; // Orange
      case 'investor': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  if (loading) {
    return (
      <PageContainer theme={theme}>
        <LoadingContainer>
          <LoadingSpinner theme={theme} />
          <LoadingText theme={theme}>Loading company details...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (!company) {
    return (
      <PageContainer theme={theme}>
        <ErrorContainer>
          <ErrorText theme={theme}>Company not found</ErrorText>
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer theme={theme}>
      <CompanyDetailView>
        {/* Header */}
        <CompanyHeader theme={theme}>
          <HeaderTop>
            <BackButton theme={theme} onClick={handleBack}>
              <FaArrowLeft />
              <span>Back</span>
            </BackButton>
          </HeaderTop>

          <HeaderMain>
            <CompanyInfo>
              <CompanyAvatar theme={theme}>
                🏢
              </CompanyAvatar>
              <CompanyDetails>
                <CompanyName theme={theme}>{company.name}</CompanyName>
                {company.category && (
                  <CompanyCategory theme={theme}>
                    {company.category}
                  </CompanyCategory>
                )}
                {company.description && (
                  <CompanyDescription theme={theme}>
                    {isDescriptionExpanded || company.description.length <= 200
                      ? company.description
                      : `${company.description.substring(0, 200)}...`
                    }
                    {company.description.length > 200 && (
                      <ShowMoreButton
                        theme={theme}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDescriptionExpanded(!isDescriptionExpanded);
                        }}
                      >
                        {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                      </ShowMoreButton>
                    )}
                  </CompanyDescription>
                )}
                {(companyTags.length > 0 || companyCities.length > 0) && (
                  <CompanyMeta>
                    {companyCities.length > 0 && (
                      <MetaSection>
                        <MetaLabel>🌍 Cities:</MetaLabel>
                        <MetaItems>
                          {companyCities.slice(0, 3).map((cityRelation, index) => (
                            <MetaItem key={index} theme={theme}>
                              {cityRelation.cities?.name}
                              {cityRelation.cities?.country && cityRelation.cities.country !== 'Unknown' && (
                                <span>, {cityRelation.cities.country}</span>
                              )}
                            </MetaItem>
                          ))}
                          {companyCities.length > 3 && (
                            <MetaItem theme={theme}>+{companyCities.length - 3} more</MetaItem>
                          )}
                        </MetaItems>
                      </MetaSection>
                    )}
                    {companyTags.length > 0 && (
                      <MetaSection>
                        <MetaLabel>🏷️ Tags:</MetaLabel>
                        <MetaItems>
                          {companyTags.slice(0, 4).map((tagRelation, index) => (
                            <MetaTag key={index} theme={theme}>
                              {tagRelation.tags?.name}
                            </MetaTag>
                          ))}
                          {companyTags.length > 4 && (
                            <MetaTag theme={theme}>+{companyTags.length - 4}</MetaTag>
                          )}
                        </MetaItems>
                      </MetaSection>
                    )}
                  </CompanyMeta>
                )}
                <CompanyLinks>
                  {company.website && (
                    <LinkButton theme={theme} onClick={handleWebsiteClick}>
                      <FaGlobe />
                      <span>Website</span>
                    </LinkButton>
                  )}
                  {company.linkedin && (
                    <LinkButton theme={theme} onClick={handleLinkedInClick}>
                      <FaLinkedin />
                      <span>LinkedIn</span>
                    </LinkButton>
                  )}
                </CompanyLinks>
              </CompanyDetails>
            </CompanyInfo>

            <ActionButtons>
              <ActionButton theme={theme} $primary>
                <FaEdit />
                <ActionButtonText>Edit</ActionButtonText>
              </ActionButton>
              <ActionButton theme={theme} $merge>
                <FaLayerGroup />
                <ActionButtonText>Merge</ActionButtonText>
              </ActionButton>
              <ActionButton theme={theme} $danger>
                <FaTrash />
                <ActionButtonText>Delete</ActionButtonText>
              </ActionButton>
            </ActionButtons>
          </HeaderMain>
        </CompanyHeader>

        {/* Main Navigation */}
        <RelatedSubMenu theme={theme}>
          {['Contacts', 'Files', 'Deals'].map(tab => (
            <RelatedSubTab
              key={tab}
              theme={theme}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </RelatedSubTab>
          ))}
        </RelatedSubMenu>

        {/* Main Content */}
        <MainContent>
          {/* Contacts */}
          {activeTab === 'Contacts' && (
            <RelatedSection>
              <RelatedSectionHeader>
                <SectionTitle theme={theme}>
                  🧑‍💼 Associated Contacts ({companyContacts.length})
                </SectionTitle>
                <AddButton theme={theme}>
                  + Add Contacts
                </AddButton>
              </RelatedSectionHeader>

              <ContactsList
                contacts={companyContacts}
                loading={loadingRelatedData}
                theme={theme}
                emptyStateConfig={{
                  icon: '🧑‍💼',
                  title: 'No contacts associated',
                  text: 'No contacts are currently associated with this company.'
                }}
                onContactUpdate={fetchRelatedData}
                showActions={true}
                badgeType="category"
                onContactClick={(contact) => handleContactClick({ contacts: contact })}
              />
            </RelatedSection>
          )}

          {/* Files - Coming Soon */}
          {activeTab === 'Files' && (
            <RelatedSection>
              <ComingSoonContainer>
                <ComingSoonIcon>📁</ComingSoonIcon>
                <ComingSoonTitle theme={theme}>Files Coming Soon</ComingSoonTitle>
                <ComingSoonText theme={theme}>
                  File management for companies will be available in a future update
                </ComingSoonText>
              </ComingSoonContainer>
            </RelatedSection>
          )}

          {/* Deals - Coming Soon */}
          {activeTab === 'Deals' && (
                  <RelatedSection>
                    <ComingSoonContainer>
                      <ComingSoonIcon>🚧</ComingSoonIcon>
                      <ComingSoonTitle theme={theme}>Deals Coming Soon</ComingSoonTitle>
                      <ComingSoonText theme={theme}>
                        Deal relationships will be available in a future update
                      </ComingSoonText>
            </ComingSoonContainer>
          </RelatedSection>
          )}
        </MainContent>
      </CompanyDetailView>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const CompanyDetailView = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const CompanyHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }

  svg {
    font-size: 12px;
  }
`;

const HeaderMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
`;

const CompanyAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
`;

const CompanyDetails = styled.div`
  flex: 1;
`;

const CompanyName = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const CompanyCategory = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 12px;
`;

const CompanyDescription = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 12px 0;
  max-width: 500px;
`;

const CompanyLinks = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const LinkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }

  svg {
    font-size: 12px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.$primary && `
    background: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#2563EB' : '#3B82F6'};
    }
  `}

  ${props => props.$danger && `
    background: ${props.theme === 'light' ? '#EF4444' : '#F87171'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#DC2626' : '#EF4444'};
    }
  `}

  ${props => props.$merge && `
    background: ${props.theme === 'light' ? '#F59E0B' : '#FBBF24'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#D97706' : '#F59E0B'};
    }
  `}

  ${props => !props.$primary && !props.$danger && !props.$merge && `
    background: ${props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props.theme === 'light' ? '#374151' : '#D1D5DB'};

    &:hover {
      background: ${props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
    }
  `}

  svg {
    font-size: 14px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 20px 0;
`;

const RelatedSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 600px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const RelatedSubTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover:not([disabled]) {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.15)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }
`;

const RelatedContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const RelatedSection = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const RelatedSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const RelatedEmptyMessage = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;


const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
`;

const ComingSoonIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ComingSoonTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const ComingSoonText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-top-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
`;

const ErrorText = styled.div`
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  font-size: 18px;
  font-weight: 500;
`;

// New Styled Components for updated features

const ActionButtonText = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ShowMoreButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 8px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const CompanyMeta = styled.div`
  margin: 16px 0 12px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MetaSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#9CA3AF'};
  min-width: fit-content;
`;

const MetaItems = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const MetaTag = styled.span`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

export default CompanyDetailPage;
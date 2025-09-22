import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaClock, FaComments, FaEdit, FaTrash, FaSearch, FaSync } from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';

const StandaloneInteractions = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      // Get contacts with last_interaction data
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_emails (email, type, is_primary),
          contact_mobiles (mobile, type, is_primary),
          contact_companies (
            company_id,
            relationship,
            is_primary,
            companies (name, website, category)
          ),
          contact_tags (
            tags (name)
          ),
          contact_cities (
            cities (name, country)
          )
        `)
        .order('last_interaction_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      // Filter and process contacts with last interaction data (client-side filtering)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredContacts = data.filter(contact => {
        if (!contact.last_interaction_at) return false;

        // Filter out contacts with category "Skip"
        if (contact.category === 'Skip') return false;

        // Filter out contacts with category "WhatsApp Group Contact"
        if (contact.category === 'WhatsApp Group Contact') return false;

        const lastInteractionDate = new Date(contact.last_interaction_at);
        return lastInteractionDate >= thirtyDaysAgo;
      });

      // Process contacts with last interaction data
      const processedInteractions = filteredContacts.slice(0, 30).map(contact => ({
        id: `contact_${contact.contact_id}_${contact.last_interaction_at}`,
        contact_id: contact.contact_id,
        created_at: contact.last_interaction_at,
        type: 'interaction', // Generic type since we don't have specific interaction type
        notes: null, // No specific notes from interaction records
        contact: {
          ...contact,
          emails: contact.contact_emails || [],
          mobiles: contact.contact_mobiles || [],
          companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
          tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
          cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
        }
      }));

      setInteractions(processedInteractions);
    } catch (error) {
      console.error('Error fetching contacts with recent interactions:', error);
      toast.error('Failed to load recent interactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchInteractions();
      console.log('Auto-refreshing interactions data...');
    }, 60000); // 60 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToInteractions = () => {
    setSelectedContact(null);
  };

  const handleEditContact = (contactId) => {
    window.location.href = `/contacts/workflow/${contactId}?step=2`;
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactId);

      if (error) throw error;

      toast.success('Contact deleted successfully');

      // Remove the contact from the interactions list
      setInteractions(prev => prev.filter(interaction => interaction.contact_id !== contactId));

      // If this was the selected contact, go back to the list
      if (selectedContact && selectedContact.contact_id === contactId) {
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInteractions();
    console.log('Manual refresh triggered...');

    // Stop the refresh animation after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const formatInteractionDate = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInteractionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return <FaEnvelope />;
      case 'call':
      case 'phone':
        return <FaPhone />;
      case 'meeting':
        return <FaComments />;
      default:
        return <FaComments />;
    }
  };

  return (
    <FullScreenContainer>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#000',
              color: '#00ff00',
              border: '1px solid #00ff00',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#000',
              color: '#ff0000',
              border: '1px solid #ff0000',
            },
          },
        }}
      />

      {!selectedContact ? (
        <InteractionsView>
          <InteractionsHeader>
            <HeaderContent>
              <HeaderText>
                <AppTitle>Recent Interactions</AppTitle>
                <AppSubtitle>Last 30 days of contact interactions</AppSubtitle>
              </HeaderText>
              <HeaderButtons>
                <HeaderButton
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  title="Refresh interactions (Auto-refreshes every 60s)"
                  $isRefreshing={isRefreshing}
                >
                  <FaSync />
                </HeaderButton>
                <SearchIconButton
                  onClick={() => window.location.href = 'https://crm-editor-frontend.netlify.app/search'}
                  title="Switch to Search"
                >
                  <FaSearch />
                </SearchIconButton>
              </HeaderButtons>
            </HeaderContent>
          </InteractionsHeader>

          {loading && (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Loading interactions...</LoadingText>
            </LoadingContainer>
          )}

          <ResultsContainer>

            {interactions.map(interaction => (
              <InteractionCard key={interaction.id}>
                <InteractionCardContent onClick={() => handleContactSelect(interaction.contact)}>
                  <InteractionCardHeader>
                    <ContactAvatar>
                      {interaction.contact?.profile_image_url ? (
                        <img src={interaction.contact.profile_image_url} alt="Profile" />
                      ) : (
                        <FaUser />
                      )}
                    </ContactAvatar>
                    <InteractionInfo>
                      <ContactName>
                        {interaction.contact?.first_name} {interaction.contact?.last_name}
                      </ContactName>
                      {interaction.contact?.job_role && <ContactRole>{interaction.contact.job_role}</ContactRole>}
                      {interaction.contact?.companies[0] && (
                        <ContactCompany>
                          <FaBuilding style={{ marginRight: '6px' }} />
                          {interaction.contact.companies[0].name}
                        </ContactCompany>
                      )}
                    </InteractionInfo>
                    <InteractionMeta>
                      <InteractionType>
                        <FaComments />
                        <span>Last Contact</span>
                      </InteractionType>
                      <InteractionDate>
                        <FaClock />
                        <span>{formatInteractionDate(interaction.created_at)}</span>
                      </InteractionDate>
                    </InteractionMeta>
                  </InteractionCardHeader>

                </InteractionCardContent>

                <InteractionCardActions>
                  <CardActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditContact(interaction.contact.contact_id);
                    }}
                    $edit
                  >
                    <FaEdit />
                  </CardActionButton>
                  <CardActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteContact(interaction.contact.contact_id);
                    }}
                    $delete
                  >
                    <FaTrash />
                  </CardActionButton>
                </InteractionCardActions>
              </InteractionCard>
            ))}

            {!loading && interactions.length === 0 && (
              <NoResultsContainer>
                <NoResultsIcon>📅</NoResultsIcon>
                <NoResultsTitle>No recent interactions</NoResultsTitle>
                <NoResultsText>No interactions found in the last 30 days</NoResultsText>
              </NoResultsContainer>
            )}
          </ResultsContainer>
        </InteractionsView>
      ) : (
        <DetailView>
          <DetailHeader>
            <BackButton onClick={handleBackToInteractions}>
              <FaArrowLeft />
              <span>Back to Interactions</span>
            </BackButton>
            <ActionButtons>
              <ActionButton
                as="button"
                onClick={() => handleEditContact(selectedContact.contact_id)}
                $edit
              >
                <FaEdit />
                Edit
              </ActionButton>
              <ActionButton
                as="button"
                onClick={() => handleDeleteContact(selectedContact.contact_id)}
                $delete
              >
                <FaTrash />
                Delete
              </ActionButton>
              {selectedContact.emails?.length > 0 && selectedContact.emails[0]?.email && (
                <ActionButton
                  href={`mailto:${selectedContact.emails[0].email}`}
                  $primary
                >
                  <FaEnvelope />
                  Email
                </ActionButton>
              )}
              {selectedContact.mobiles?.length > 0 && selectedContact.mobiles[0]?.mobile && (
                <ActionButton
                  href={`https://wa.me/${selectedContact.mobiles[0].mobile.replace(/\D/g, '')}`}
                  $secondary
                >
                  <FaPhone />
                  WhatsApp
                </ActionButton>
              )}
            </ActionButtons>
          </DetailHeader>

          <DetailContent>
            <ProfileSection>
              <ProfileAvatar>
                {selectedContact.profile_image_url ? (
                  <img src={selectedContact.profile_image_url} alt="Profile" />
                ) : (
                  <FaUser />
                )}
              </ProfileAvatar>
              <ProfileInfo>
                <ProfileName>
                  {selectedContact.first_name} {selectedContact.last_name}
                </ProfileName>
                {selectedContact.job_role && (
                  <ProfileRole>{selectedContact.job_role}</ProfileRole>
                )}
                {selectedContact.score && (
                  <ScoreBadge>Score: {selectedContact.score}</ScoreBadge>
                )}
              </ProfileInfo>
            </ProfileSection>

            <InfoGrid>
              {(selectedContact.emails?.length > 0 || selectedContact.mobiles?.length > 0) && (
                <InfoSection>
                  <SectionTitle>Contact Information</SectionTitle>
                  <InfoList>
                    {selectedContact.emails?.map((email, idx) => (
                      <InfoItem key={`email-${idx}`}>
                        <InfoItemIcon><FaEnvelope /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>{email.type} Email</InfoItemLabel>
                          <InfoItemValue>
                            <a href={`mailto:${email.email}`}>{email.email}</a>
                            {email.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                          </InfoItemValue>
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                    {selectedContact.mobiles?.map((mobile, idx) => (
                      <InfoItem key={`mobile-${idx}`}>
                        <InfoItemIcon><FaPhone /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>{mobile.type} Phone</InfoItemLabel>
                          <InfoItemValue>
                            <a href={`https://wa.me/${mobile.mobile.replace(/\D/g, '')}`}>{mobile.mobile}</a>
                            {mobile.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                          </InfoItemValue>
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                  </InfoList>
                </InfoSection>
              )}

              {selectedContact.companies?.length > 0 && (
                <InfoSection>
                  <SectionTitle>Company Information</SectionTitle>
                  <InfoList>
                    {selectedContact.companies.map((company, idx) => (
                      <InfoItem key={`company-${idx}`}>
                        <InfoItemIcon><FaBuilding /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>Company</InfoItemLabel>
                          <InfoItemValue>{company.name}</InfoItemValue>
                          {company.website && (
                            <InfoItemSubValue>
                              <a href={company.website} target="_blank" rel="noopener noreferrer">
                                {company.website}
                              </a>
                            </InfoItemSubValue>
                          )}
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                  </InfoList>
                </InfoSection>
              )}

              {selectedContact.cities?.length > 0 && (
                <InfoSection>
                  <SectionTitle>Location</SectionTitle>
                  <InfoList>
                    {selectedContact.cities.map((city, idx) => (
                      <InfoItem key={`city-${idx}`}>
                        <InfoItemIcon><FaMapMarkerAlt /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>Location</InfoItemLabel>
                          <InfoItemValue>{city.name}, {city.country}</InfoItemValue>
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                  </InfoList>
                </InfoSection>
              )}

              {selectedContact.tags?.length > 0 && (
                <InfoSection>
                  <SectionTitle>Tags</SectionTitle>
                  <TagList>
                    {selectedContact.tags.map((tag, idx) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </TagList>
                </InfoSection>
              )}

              {selectedContact.description && (
                <InfoSection>
                  <SectionTitle>Notes</SectionTitle>
                  <NotesText>{selectedContact.description}</NotesText>
                </InfoSection>
              )}

              {selectedContact.linkedin && (
                <InfoSection>
                  <SectionTitle>Social Media</SectionTitle>
                  <InfoList>
                    <InfoItem>
                      <InfoItemContent>
                        <InfoItemLabel>LinkedIn Profile</InfoItemLabel>
                        <InfoItemValue>
                          <a href={selectedContact.linkedin} target="_blank" rel="noopener noreferrer">
                            View LinkedIn Profile
                          </a>
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  </InfoList>
                </InfoSection>
              )}
            </InfoGrid>
          </DetailContent>
        </DetailView>
      )}
    </FullScreenContainer>
  );
};

// Styled Components (reusing from StandaloneContactSearch with specific modifications)
const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
`;

const InteractionsView = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    height: calc(100% - 40px);
  }
`;

const InteractionsHeader = styled.div`
  background: white;
  padding: 24px 20px 20px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 800px;
  margin: 0 auto;
`;

const HeaderText = styled.div`
  text-align: center;
  flex: 1;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const HeaderButton = styled.button`
  background: none;
  border: 2px solid #10b981;
  color: #10b981;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 18px;
  flex-shrink: 0;

  &:hover {
    background: #10b981;
    color: white;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  ${props => props.$isRefreshing && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 16px;
  }
`;

const SearchIconButton = styled.button`
  background: none;
  border: 2px solid #3b82f6;
  color: #3b82f6;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;
  flex-shrink: 0;

  &:hover {
    background: #3b82f6;
    color: white;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
`;

const AppTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;

  @media (min-width: 768px) {
    font-size: 32px;
  }
`;

const AppSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 16px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

const ResultsHeader = styled.div`
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  padding: 0 20px 16px 20px;
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
`;

const InteractionCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: stretch;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const InteractionCardContent = styled.div`
  flex: 1;
  padding: 16px;
  cursor: pointer;
  min-width: 0;
`;

const InteractionCardActions = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  border-left: 1px solid #e5e7eb;
  min-width: 60px;
  justify-content: center;
  align-items: center;
`;

const InteractionCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
`;

const ContactAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9ca3af;
    font-size: 20px;
  }
`;

const InteractionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
  line-height: 1.4;
  margin-bottom: 2px;
`;

const ContactRole = styled.div`
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 4px;
`;

const ContactCompany = styled.div`
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;

  svg {
    font-size: 12px;
  }
`;

const InteractionMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
`;

const InteractionType = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;

  svg {
    font-size: 12px;
  }
`;

const InteractionDate = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;

  svg {
    font-size: 10px;
  }
`;

const InteractionNotes = styled.div`
  color: #374151;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #e5e7eb;
`;

const InteractionCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContactDetail = styled.div`
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 12px;
    flex-shrink: 0;
    color: #9ca3af;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const NoResultsContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const NoResultsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const NoResultsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const NoResultsText = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

// Detail view components (reused from StandaloneContactSearch)
const DetailView = styled.div`
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    height: calc(100% - 40px);
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-family: inherit;

  ${props => props.$primary && `
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
      color: white;
    }
  `}

  ${props => props.$secondary && `
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
      color: white;
    }
  `}

  ${props => props.$edit && `
    background: #f59e0b;
    color: white;

    &:hover {
      background: #d97706;
      color: white;
    }
  `}

  ${props => props.$delete && `
    background: #ef4444;
    color: white;

    &:hover {
      background: #dc2626;
      color: white;
    }
  `}
`;

const CardActionButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;

  ${props => props.$edit && `
    color: #f59e0b;
    &:hover {
      background: #fef3c7;
      color: #d97706;
    }
  `}

  ${props => props.$delete && `
    color: #ef4444;
    &:hover {
      background: #fee2e2;
      color: #dc2626;
    }
  `}

  &:active {
    transform: scale(0.95);
  }
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  -webkit-overflow-scrolling: touch;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  border: 3px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9ca3af;
    font-size: 32px;
  }

  @media (min-width: 768px) {
    width: 100px;
    height: 100px;

    svg {
      font-size: 40px;
    }
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px 0;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const ProfileRole = styled.div`
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 8px;
`;

const ScoreBadge = styled.div`
  background: #dbeafe;
  color: #1d4ed8;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InfoSection = styled.div``;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
`;

const InfoItemIcon = styled.div`
  width: 40px;
  display: flex;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;

  svg {
    color: #6b7280;
    font-size: 16px;
  }
`;

const InfoItemContent = styled.div`
  flex: 1;
`;

const InfoItemLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
`;

const InfoItemValue = styled.div`
  color: #1f2937;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  a {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const InfoItemSubValue = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;

  a {
    color: #6b7280;
  }
`;

const PrimaryTag = styled.span`
  background: #d1fae5;
  color: #065f46;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
`;

const NotesText = styled.div`
  color: #374151;
  line-height: 1.6;
  font-size: 16px;
`;

export default StandaloneInteractions;
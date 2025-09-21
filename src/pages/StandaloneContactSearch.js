import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSearch, FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaClock } from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';

const StandaloneContactSearch = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return [];

    const term = searchTerm.toLowerCase();
    return contacts.filter(contact => {
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      const company = contact.companies?.[0]?.name?.toLowerCase() || '';
      const jobRole = contact.job_role?.toLowerCase() || '';
      const email = contact.emails?.[0]?.email?.toLowerCase() || '';
      const mobile = contact.mobiles?.[0]?.mobile?.toLowerCase() || '';

      return fullName.includes(term) ||
             company.includes(term) ||
             jobRole.includes(term) ||
             email.includes(term) ||
             mobile.includes(term);
    });
  }, [contacts, searchTerm]);

  const fetchContacts = async (search = '') => {
    if (!search.trim()) {
      setContacts([]);
      return;
    }

    setLoading(true);
    try {
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
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,job_role.ilike.%${search}%`)
        .limit(50);

      if (error) throw error;

      const processedContacts = data.map(contact => ({
        ...contact,
        emails: contact.contact_emails || [],
        mobiles: contact.contact_mobiles || [],
        companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      }));

      setContacts(processedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to search contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContacts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);

    // Add to search history
    const newHistory = [contact.contact_id, ...searchHistory.filter(id => id !== contact.contact_id)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('contactSearchHistory', JSON.stringify(newHistory));
  };

  const handleBackToSearch = () => {
    setSelectedContact(null);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('contactSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

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
        <SearchView>
          <SearchHeader>
            <HeaderContent>
              <HeaderText>
                <AppTitle>Contact Search</AppTitle>
                <AppSubtitle>Find and connect with your contacts</AppSubtitle>
              </HeaderText>
              <InteractionsIconButton
                onClick={() => window.location.href = 'https://crm-editor-frontend.netlify.app/interactions'}
                title="Switch to Interactions"
              >
                <FaClock />
              </InteractionsIconButton>
            </HeaderContent>
          </SearchHeader>

          <SearchContainer>
            <SearchInputWrapper>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search contacts by name, company, role, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </SearchInputWrapper>

            {loading && (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Searching...</LoadingText>
              </LoadingContainer>
            )}

            {searchTerm && !loading && (
              <ResultsHeader>
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
              </ResultsHeader>
            )}
          </SearchContainer>

          <ResultsContainer>
            {filteredContacts.map(contact => (
              <ContactCard key={contact.contact_id} onClick={() => handleContactSelect(contact)}>
                <ContactCardHeader>
                  <ContactAvatar>
                    {contact.profile_image_url ? (
                      <img src={contact.profile_image_url} alt="Profile" />
                    ) : (
                      <FaUser />
                    )}
                  </ContactAvatar>
                  <ContactInfo>
                    <ContactName>
                      {contact.first_name} {contact.last_name}
                    </ContactName>
                    {contact.job_role && <ContactRole>{contact.job_role}</ContactRole>}
                    {contact.companies[0] && (
                      <ContactCompany>
                        <FaBuilding style={{ marginRight: '6px' }} />
                        {contact.companies[0].name}
                      </ContactCompany>
                    )}
                  </ContactInfo>
                </ContactCardHeader>

                <ContactCardDetails>
                  {contact.emails?.length > 0 && contact.emails[0]?.email && (
                    <ContactDetail>
                      <FaEnvelope />
                      <span>{contact.emails[0].email}</span>
                    </ContactDetail>
                  )}
                  {contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
                    <ContactDetail>
                      <FaPhone />
                      <span>{contact.mobiles[0].mobile}</span>
                    </ContactDetail>
                  )}
                </ContactCardDetails>
              </ContactCard>
            ))}

            {searchTerm && !loading && filteredContacts.length === 0 && (
              <NoResultsContainer>
                <NoResultsIcon>🔍</NoResultsIcon>
                <NoResultsTitle>No contacts found</NoResultsTitle>
                <NoResultsText>Try searching with different keywords or check your spelling</NoResultsText>
              </NoResultsContainer>
            )}

            {!searchTerm && (
              <WelcomeContainer>
                <WelcomeIcon>👋</WelcomeIcon>
                <WelcomeTitle>Welcome to Contact Search</WelcomeTitle>
                <WelcomeText>Start typing to search your contacts by name, company, role, email, or phone number</WelcomeText>
              </WelcomeContainer>
            )}
          </ResultsContainer>
        </SearchView>
      ) : (
        <DetailView>
          <DetailHeader>
            <BackButton onClick={handleBackToSearch}>
              <FaArrowLeft />
              <span>Back to Search</span>
            </BackButton>
            <ActionButtons>
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

// Styled Components
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

const SearchView = styled.div`
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

const SearchHeader = styled.div`
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

const InteractionsIconButton = styled.button`
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
  font-size: 20px;
  flex-shrink: 0;

  &:hover {
    background: #10b981;
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

const SearchContainer = styled.div`
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
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
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
  -webkit-overflow-scrolling: touch;
`;

const ContactCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ContactCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ContactAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
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

const ContactInfo = styled.div`
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

const ContactCardDetails = styled.div`
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

const WelcomeContainer = styled.div`
  text-align: center;
  padding: 80px 20px;
`;

const WelcomeIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const WelcomeTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
`;

const WelcomeText = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

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

export default StandaloneContactSearch;
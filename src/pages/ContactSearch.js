import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSearch, FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ContactSearch = () => {
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
          contact_emails!inner (email, type, is_primary),
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

  useEffect(() => {
    const savedHistory = localStorage.getItem('contactSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  return (
    <Container>
      <SearchSection>
        <SearchHeader>
          <Title>Contact Search</Title>
          <Subtitle>Search and view your contacts</Subtitle>
        </SearchHeader>

        <SearchInputContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by name, company, job role, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputContainer>

        {loading && <LoadingText>Searching...</LoadingText>}

        {searchTerm && !loading && (
          <ResultsCount>
            {filteredContacts.length} result{filteredContacts.length !== 1 ? 's' : ''} found
          </ResultsCount>
        )}
      </SearchSection>

      <ContentSection>
        <ContactsList visible={!selectedContact}>
          {filteredContacts.map(contact => (
            <ContactCard key={contact.contact_id} onClick={() => handleContactSelect(contact)}>
              <ContactHeader>
                <ContactAvatar>
                  {contact.profile_image_url ? (
                    <img src={contact.profile_image_url} alt="Profile" />
                  ) : (
                    <FaUser />
                  )}
                </ContactAvatar>
                <ContactBasicInfo>
                  <ContactName>
                    {contact.first_name} {contact.last_name}
                  </ContactName>
                  {contact.job_role && <ContactJobRole>{contact.job_role}</ContactJobRole>}
                  {contact.companies[0] && (
                    <ContactCompany>
                      <FaBuilding /> {contact.companies[0].name}
                    </ContactCompany>
                  )}
                </ContactBasicInfo>
              </ContactHeader>

              <ContactDetails>
                {contact.emails[0] && (
                  <ContactDetail>
                    <FaEnvelope /> {contact.emails[0].email}
                  </ContactDetail>
                )}
                {contact.mobiles[0] && (
                  <ContactDetail>
                    <FaPhone /> {contact.mobiles[0].mobile}
                  </ContactDetail>
                )}
              </ContactDetails>
            </ContactCard>
          ))}

          {searchTerm && !loading && filteredContacts.length === 0 && (
            <NoResults>
              <div>No contacts found for "{searchTerm}"</div>
              <div>Try searching with different keywords</div>
            </NoResults>
          )}
        </ContactsList>

        <ContactDetailView visible={selectedContact}>
          {selectedContact && (
            <>
              <DetailHeader>
                <BackButton onClick={() => setSelectedContact(null)}>
                  ← Back to Search
                </BackButton>
                <DetailActions>
                  <ActionButton href={`mailto:${selectedContact.emails[0]?.email}`}>
                    Email
                  </ActionButton>
                  <ActionButton href={`tel:${selectedContact.mobiles[0]?.mobile}`}>
                    Call
                  </ActionButton>
                </DetailActions>
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
                      <ProfileJobRole>{selectedContact.job_role}</ProfileJobRole>
                    )}
                    {selectedContact.score && (
                      <ContactScore>Score: {selectedContact.score}</ContactScore>
                    )}
                  </ProfileInfo>
                </ProfileSection>

                <InfoSections>
                  {(selectedContact.emails?.length > 0 || selectedContact.mobiles?.length > 0) && (
                    <InfoSection>
                      <SectionTitle>Contact Information</SectionTitle>
                      {selectedContact.emails?.map((email, idx) => (
                        <InfoItem key={idx}>
                          <InfoIcon><FaEnvelope /></InfoIcon>
                          <InfoContent>
                            <InfoLabel>{email.type} Email</InfoLabel>
                            <InfoValue>
                              <a href={`mailto:${email.email}`}>{email.email}</a>
                              {email.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
                            </InfoValue>
                          </InfoContent>
                        </InfoItem>
                      ))}
                      {selectedContact.mobiles?.map((mobile, idx) => (
                        <InfoItem key={idx}>
                          <InfoIcon><FaPhone /></InfoIcon>
                          <InfoContent>
                            <InfoLabel>{mobile.type} Phone</InfoLabel>
                            <InfoValue>
                              <a href={`tel:${mobile.mobile}`}>{mobile.mobile}</a>
                              {mobile.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
                            </InfoValue>
                          </InfoContent>
                        </InfoItem>
                      ))}
                    </InfoSection>
                  )}

                  {selectedContact.companies?.length > 0 && (
                    <InfoSection>
                      <SectionTitle>Company Information</SectionTitle>
                      {selectedContact.companies.map((company, idx) => (
                        <InfoItem key={idx}>
                          <InfoIcon><FaBuilding /></InfoIcon>
                          <InfoContent>
                            <InfoLabel>Company</InfoLabel>
                            <InfoValue>{company.name}</InfoValue>
                            {company.website && (
                              <InfoSubValue>
                                <a href={company.website} target="_blank" rel="noopener noreferrer">
                                  {company.website}
                                </a>
                              </InfoSubValue>
                            )}
                          </InfoContent>
                        </InfoItem>
                      ))}
                    </InfoSection>
                  )}

                  {selectedContact.cities?.length > 0 && (
                    <InfoSection>
                      <SectionTitle>Location</SectionTitle>
                      {selectedContact.cities.map((city, idx) => (
                        <InfoItem key={idx}>
                          <InfoIcon><FaMapMarkerAlt /></InfoIcon>
                          <InfoContent>
                            <InfoLabel>Location</InfoLabel>
                            <InfoValue>{city.name}, {city.country}</InfoValue>
                          </InfoContent>
                        </InfoItem>
                      ))}
                    </InfoSection>
                  )}

                  {selectedContact.tags?.length > 0 && (
                    <InfoSection>
                      <SectionTitle>Tags</SectionTitle>
                      <TagContainer>
                        {selectedContact.tags.map((tag, idx) => (
                          <Tag key={idx}>{tag}</Tag>
                        ))}
                      </TagContainer>
                    </InfoSection>
                  )}

                  {selectedContact.description && (
                    <InfoSection>
                      <SectionTitle>Description</SectionTitle>
                      <DescriptionText>{selectedContact.description}</DescriptionText>
                    </InfoSection>
                  )}

                  {selectedContact.linkedin && (
                    <InfoSection>
                      <SectionTitle>Social Media</SectionTitle>
                      <InfoItem>
                        <InfoContent>
                          <InfoLabel>LinkedIn</InfoLabel>
                          <InfoValue>
                            <a href={selectedContact.linkedin} target="_blank" rel="noopener noreferrer">
                              View LinkedIn Profile
                            </a>
                          </InfoValue>
                        </InfoContent>
                      </InfoItem>
                    </InfoSection>
                  )}
                </InfoSections>
              </DetailContent>
            </>
          )}
        </ContactDetailView>
      </ContentSection>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const SearchSection = styled.div`
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem;

  @media (min-width: 768px) {
    width: 400px;
    min-width: 400px;
    border-right: 1px solid #e9ecef;
    border-bottom: none;
    overflow-y: auto;
  }
`;

const SearchHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  color: #6c757d;
  margin: 0;
  font-size: 0.875rem;
`;

const SearchInputContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  }

  @media (min-width: 768px) {
    padding: 1rem 1rem 1rem 2.75rem;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 1rem;
`;

const ResultsCount = styled.div`
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const ContentSection = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContactsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: ${props => props.visible ? 'block' : 'none'};

  @media (min-width: 768px) {
    display: block;
  }
`;

const ContactCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0d6efd;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ContactHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ContactAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #6c757d;
    font-size: 1.25rem;
  }
`;

const ContactBasicInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: #212529;
  font-size: 1rem;
  line-height: 1.4;
`;

const ContactJobRole = styled.div`
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.125rem;
`;

const ContactCompany = styled.div`
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.125rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  svg {
    font-size: 0.75rem;
  }
`;

const ContactDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ContactDetail = styled.div`
  color: #6c757d;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 0.75rem;
    flex-shrink: 0;
  }
`;

const NoResults = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 2rem;

  div:first-child {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  div:last-child {
    font-size: 0.875rem;
  }
`;

const ContactDetailView = styled.div`
  flex: 1;
  background: white;
  overflow-y: auto;
  display: ${props => props.visible ? 'block' : 'none'};

  @media (min-width: 768px) {
    display: ${props => props.visible ? 'block' : 'none'};
    border-left: 1px solid #e9ecef;
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #0d6efd;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.5rem 0;

  &:hover {
    text-decoration: underline;
  }
`;

const DetailActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.a`
  background: #0d6efd;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease;

  &:hover {
    background: #0b5ed7;
    text-decoration: none;
    color: white;
  }
`;

const DetailContent = styled.div`
  padding: 1.5rem;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #6c757d;
    font-size: 2rem;
  }

  @media (min-width: 768px) {
    width: 96px;
    height: 96px;

    svg {
      font-size: 2.5rem;
    }
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

const ProfileJobRole = styled.div`
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const ContactScore = styled.div`
  background: #e7f1ff;
  color: #0d6efd;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
`;

const InfoSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoSection = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoIcon = styled.div`
  width: 40px;
  display: flex;
  justify-content: center;
  margin-top: 0.125rem;
  flex-shrink: 0;

  svg {
    color: #6c757d;
    font-size: 1rem;
  }
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.125rem;
`;

const InfoValue = styled.div`
  color: #212529;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  a {
    color: #0d6efd;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const InfoSubValue = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;

  a {
    color: #6c757d;
  }
`;

const PrimaryBadge = styled.span`
  background: #d4edda;
  color: #155724;
  padding: 0.125rem 0.375rem;
  border-radius: 0.125rem;
  font-size: 0.75rem;
  font-weight: 500;
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const DescriptionText = styled.div`
  color: #495057;
  line-height: 1.6;
`;

export default ContactSearch;
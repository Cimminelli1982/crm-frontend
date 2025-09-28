import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiSearch, FiArrowRight } from 'react-icons/fi';
import { FaUser, FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const FindDuplicatesModal = ({
  isOpen,
  onClose,
  theme,
  contact,
  onMergeContact
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Clear search when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Auto-search for duplicates when modal opens
  useEffect(() => {
    if (isOpen && contact) {
      performAutoSearch();
    }
  }, [isOpen, contact]);

  const performAutoSearch = async () => {
    if (!contact) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const duplicates = await searchForDuplicates(contact.first_name, contact.last_name, contact.contact_id);
      setSearchResults(duplicates);
    } catch (error) {
      console.error('Error in auto-search:', error);
      toast.error('Failed to search for duplicates');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchContacts(searchQuery, contact?.contact_id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const searchForDuplicates = async (firstName, lastName, excludeContactId) => {
    const allMatches = [];

    try {
      // 1. SURNAME MATCHES - Dedicated query
      if (lastName) {
        const { data: surnameMatches, error: surnameError } = await supabase
          .from('contacts')
          .select(`
            contact_id,
            first_name,
            last_name,
            category,
            profile_image_url,
            created_at,
            contact_emails (email, type, is_primary),
            contact_mobiles (mobile, type, is_primary)
          `)
          .neq('contact_id', excludeContactId)
          .ilike('last_name', lastName);

        if (surnameError) throw surnameError;

        surnameMatches?.forEach(contact => {
          allMatches.push({
            ...contact,
            matchReasons: ['Same surname'],
            matchType: 'surname'
          });
        });
      }

      // 2. EMAIL MATCHES - Dedicated query
      const { data: currentEmails } = await supabase
        .from('contact_emails')
        .select('email')
        .eq('contact_id', excludeContactId);

      if (currentEmails?.length > 0) {
        for (const emailObj of currentEmails) {
          const { data: emailMatches, error: emailError } = await supabase
            .from('contacts')
            .select(`
              contact_id,
              first_name,
              last_name,
              category,
              profile_image_url,
              created_at,
              contact_emails!inner (email, type, is_primary),
              contact_mobiles (mobile, type, is_primary)
            `)
            .neq('contact_id', excludeContactId)
            .eq('contact_emails.email', emailObj.email);

          if (emailError) throw emailError;

          emailMatches?.forEach(contact => {
            // Check if already added
            if (!allMatches.find(m => m.contact_id === contact.contact_id)) {
              allMatches.push({
                ...contact,
                matchReasons: [`Same email: ${emailObj.email}`],
                matchType: 'email'
              });
            } else {
              // Add to existing match reasons
              const existing = allMatches.find(m => m.contact_id === contact.contact_id);
              existing.matchReasons.push(`Same email: ${emailObj.email}`);
            }
          });
        }
      }

      // 3. MOBILE MATCHES - Dedicated query
      const { data: currentMobiles } = await supabase
        .from('contact_mobiles')
        .select('mobile')
        .eq('contact_id', excludeContactId);

      if (currentMobiles?.length > 0) {
        for (const mobileObj of currentMobiles) {
          const { data: mobileMatches, error: mobileError } = await supabase
            .from('contacts')
            .select(`
              contact_id,
              first_name,
              last_name,
              category,
              profile_image_url,
              created_at,
              contact_emails (email, type, is_primary),
              contact_mobiles!inner (mobile, type, is_primary)
            `)
            .neq('contact_id', excludeContactId)
            .eq('contact_mobiles.mobile', mobileObj.mobile);

          if (mobileError) throw mobileError;

          mobileMatches?.forEach(contact => {
            // Check if already added
            if (!allMatches.find(m => m.contact_id === contact.contact_id)) {
              allMatches.push({
                ...contact,
                matchReasons: [`Same mobile: ${mobileObj.mobile}`],
                matchType: 'mobile'
              });
            } else {
              // Add to existing match reasons
              const existing = allMatches.find(m => m.contact_id === contact.contact_id);
              existing.matchReasons.push(`Same mobile: ${mobileObj.mobile}`);
            }
          });
        }
      }

      console.log('DEBUG: All matches found:', allMatches.length, allMatches.map(c => ({ name: `${c.first_name} ${c.last_name}`, type: c.matchType, reasons: c.matchReasons })));
      return allMatches;

    } catch (error) {
      console.error('Error in searchForDuplicates:', error);
      throw error;
    }
  };

  const searchContacts = async (query, excludeContactId) => {
    const searchTerm = query.trim();

    if (!searchTerm) return [];

    // Split the query into words for smart matching (copied from SearchPage)
    const nameWords = searchTerm.split(/\s+/);
    let nameQuery = '';

    if (nameWords.length === 1) {
      // Single word - search in both first and last name
      nameQuery = `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`;
    } else if (nameWords.length === 2) {
      // Two words - try both combinations
      const [word1, word2] = nameWords;
      nameQuery = `and(first_name.ilike.%${word1}%,last_name.ilike.%${word2}%),and(first_name.ilike.%${word2}%,last_name.ilike.%${word1}%),first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`;
    } else {
      // Multiple words - search in both fields for the full query and individual words
      const wordQueries = nameWords.map(word => `first_name.ilike.%${word}%,last_name.ilike.%${word}%`).join(',');
      nameQuery = `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,${wordQueries}`;
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        contact_id,
        first_name,
        last_name,
        category,
        profile_image_url,
        created_at,
        contact_emails (email, type, is_primary),
        contact_mobiles (mobile, type, is_primary)
      `)
      .neq('contact_id', excludeContactId || 'none')
      .or(nameQuery)
      .order('created_at', { ascending: false })
      .limit(200);

    if (contactsError) throw contactsError;

    return contacts || [];
  };

  const handleMergeClick = (targetContact) => {
    if (onMergeContact) {
      onMergeContact(contact, targetContact);
    }
    onClose();
  };

  const formatContactEmails = (emails) => {
    if (!emails || emails.length === 0) return 'No email';
    const primary = emails.find(e => e.is_primary);
    if (primary) return primary.email;
    return emails[0].email;
  };

  const formatContactMobiles = (mobiles) => {
    if (!mobiles || mobiles.length === 0) return 'No mobile';
    const primary = mobiles.find(m => m.is_primary);
    if (primary) return primary.mobile;
    return mobiles[0].mobile;
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        },
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
          maxWidth: '533px',
          width: '60%',
          height: '70vh',
          maxHeight: '70vh'
        }
      }}
    >
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            Find Duplicates: {contact?.first_name} {contact?.last_name}
          </h3>
          <CloseButton
            theme={theme}
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Search Section */}
          <SearchSection>
            <SearchInputContainer>
              <SearchInput
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts by name, email, or mobile..."
                theme={theme}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <SearchButton
                onClick={handleSearch}
                theme={theme}
                disabled={isSearching}
              >
                <FiSearch />
                {isSearching ? 'Searching...' : 'Search'}
              </SearchButton>
            </SearchInputContainer>
          </SearchSection>

          {/* Results Section */}
          <ResultsSection>
            {isSearching && (
              <LoadingMessage theme={theme}>
                Searching for potential duplicates...
              </LoadingMessage>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <EmptyMessage theme={theme}>
                No potential duplicates found.
              </EmptyMessage>
            )}

{(() => {
              // Group results by match type
              const surnameMatches = searchResults.filter(r => r.matchType === 'surname');
              const emailMatches = searchResults.filter(r => r.matchType === 'email');
              const mobileMatches = searchResults.filter(r => r.matchType === 'mobile');
              const multipleMatches = searchResults.filter(r => r.matchReasons?.length > 1);

              return (
                <>
                  {searchResults.length > 0 && (
                    <ResultsHeader theme={theme}>
                      Found {searchResults.length} potential duplicate{searchResults.length !== 1 ? 's' : ''}
                    </ResultsHeader>
                  )}

                  {/* Surname Matches Section */}
                  {surnameMatches.length > 0 && (
                    <>
                      <SectionHeader theme={theme}>Same Surname ({surnameMatches.length})</SectionHeader>
                      <ContactsList>
                        {surnameMatches.map((result) => (
                          <ContactCard key={result.contact_id} theme={theme}>
                            <ContactInfo>
                              <ContactAvatar theme={theme}>
                                {result.profile_image_url ? (
                                  <img src={result.profile_image_url} alt="Profile" />
                                ) : (
                                  <FaUser />
                                )}
                              </ContactAvatar>

                              <ContactDetails>
                                <ContactName theme={theme}>
                                  {result.first_name} {result.last_name}
                                </ContactName>

                                <MatchReasons theme={theme}>
                                  {result.matchReasons.join(' • ')}
                                </MatchReasons>

                                <ContactMeta theme={theme}>
                                  <div>
                                    <FaEnvelope style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactEmails(result.contact_emails)}
                                  </div>
                                  <div>
                                    <FaPhone style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactMobiles(result.contact_mobiles)}
                                  </div>
                                </ContactMeta>

                                {result.category && (
                                  <CategoryBadge theme={theme}>
                                    {result.category}
                                  </CategoryBadge>
                                )}
                              </ContactDetails>
                            </ContactInfo>

                            <MergeButton
                              onClick={() => handleMergeClick(result)}
                              theme={theme}
                              title="Merge with this contact"
                            >
                              <FiArrowRight />
                            </MergeButton>
                          </ContactCard>
                        ))}
                      </ContactsList>
                    </>
                  )}

                  {/* Email Matches Section */}
                  {emailMatches.length > 0 && (
                    <>
                      <SectionHeader theme={theme}>Same Email ({emailMatches.length})</SectionHeader>
                      <ContactsList>
                        {emailMatches.map((result) => (
                          <ContactCard key={result.contact_id} theme={theme}>
                            <ContactInfo>
                              <ContactAvatar theme={theme}>
                                {result.profile_image_url ? (
                                  <img src={result.profile_image_url} alt="Profile" />
                                ) : (
                                  <FaUser />
                                )}
                              </ContactAvatar>

                              <ContactDetails>
                                <ContactName theme={theme}>
                                  {result.first_name} {result.last_name}
                                </ContactName>

                                <MatchReasons theme={theme}>
                                  {result.matchReasons.join(' • ')}
                                </MatchReasons>

                                <ContactMeta theme={theme}>
                                  <div>
                                    <FaEnvelope style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactEmails(result.contact_emails)}
                                  </div>
                                  <div>
                                    <FaPhone style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactMobiles(result.contact_mobiles)}
                                  </div>
                                </ContactMeta>

                                {result.category && (
                                  <CategoryBadge theme={theme}>
                                    {result.category}
                                  </CategoryBadge>
                                )}
                              </ContactDetails>
                            </ContactInfo>

                            <MergeButton
                              onClick={() => handleMergeClick(result)}
                              theme={theme}
                              title="Merge with this contact"
                            >
                              <FiArrowRight />
                            </MergeButton>
                          </ContactCard>
                        ))}
                      </ContactsList>
                    </>
                  )}

                  {/* Mobile Matches Section */}
                  {mobileMatches.length > 0 && (
                    <>
                      <SectionHeader theme={theme}>Same Mobile ({mobileMatches.length})</SectionHeader>
                      <ContactsList>
                        {mobileMatches.map((result) => (
                          <ContactCard key={result.contact_id} theme={theme}>
                            <ContactInfo>
                              <ContactAvatar theme={theme}>
                                {result.profile_image_url ? (
                                  <img src={result.profile_image_url} alt="Profile" />
                                ) : (
                                  <FaUser />
                                )}
                              </ContactAvatar>

                              <ContactDetails>
                                <ContactName theme={theme}>
                                  {result.first_name} {result.last_name}
                                </ContactName>

                                <MatchReasons theme={theme}>
                                  {result.matchReasons.join(' • ')}
                                </MatchReasons>

                                <ContactMeta theme={theme}>
                                  <div>
                                    <FaEnvelope style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactEmails(result.contact_emails)}
                                  </div>
                                  <div>
                                    <FaPhone style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactMobiles(result.contact_mobiles)}
                                  </div>
                                </ContactMeta>

                                {result.category && (
                                  <CategoryBadge theme={theme}>
                                    {result.category}
                                  </CategoryBadge>
                                )}
                              </ContactDetails>
                            </ContactInfo>

                            <MergeButton
                              onClick={() => handleMergeClick(result)}
                              theme={theme}
                              title="Merge with this contact"
                            >
                              <FiArrowRight />
                            </MergeButton>
                          </ContactCard>
                        ))}
                      </ContactsList>
                    </>
                  )}

                  {/* Manual Search Results - Show when user searched manually */}
                  {hasSearched && !isSearching && searchResults.length > 0 && !searchResults[0].matchType && (
                    <>
                      <SectionHeader theme={theme}>Search Results ({searchResults.length})</SectionHeader>
                      <ContactsList>
                        {searchResults.map((result) => (
                          <ContactCard key={result.contact_id} theme={theme}>
                            <ContactInfo>
                              <ContactAvatar theme={theme}>
                                {result.profile_image_url ? (
                                  <img src={result.profile_image_url} alt="Profile" />
                                ) : (
                                  <FaUser />
                                )}
                              </ContactAvatar>

                              <ContactDetails>
                                <ContactName theme={theme}>
                                  {result.first_name} {result.last_name}
                                </ContactName>

                                <ContactMeta theme={theme}>
                                  <div>
                                    <FaEnvelope style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactEmails(result.contact_emails)}
                                  </div>
                                  <div>
                                    <FaPhone style={{ marginRight: '4px', fontSize: '12px' }} />
                                    {formatContactMobiles(result.contact_mobiles)}
                                  </div>
                                </ContactMeta>

                                {result.category && (
                                  <CategoryBadge theme={theme}>
                                    {result.category}
                                  </CategoryBadge>
                                )}
                              </ContactDetails>
                            </ContactInfo>

                            <MergeButton
                              onClick={() => handleMergeClick(result)}
                              theme={theme}
                              title="Merge with this contact"
                            >
                              <FiArrowRight />
                            </MergeButton>
                          </ContactCard>
                        ))}
                      </ContactsList>
                    </>
                  )}
                </>
              );
            })()}
          </ResultsSection>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Styled Components
const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h3 {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-size: 16px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const ModalBody = styled.div`
  padding: 0 20px 20px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
`;

const SearchSection = styled.div`
  margin-top: 24px;
  margin-bottom: 24px;
`;

const SearchInputContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultsSection = styled.div`
  flex: 1;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ResultsHeader = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const SectionHeader = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 20px 0 12px 0;
  padding: 8px 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
`;

const ContactsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContactCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FAFAFA' : '#1F2937'};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  }
`;

const ContactInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const ContactAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 20px;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContactDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

const MatchReasons = styled.div`
  font-size: 12px;
  color: #10B981;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ContactMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};

  div {
    display: flex;
    align-items: center;
  }
`;

const CategoryBadge = styled.div`
  display: inline-block;
  margin-top: 8px;
  padding: 4px 8px;
  background: ${props => props.theme === 'light' ? '#EBF8FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#93C5FD'};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const MergeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #059669;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default FindDuplicatesModal;
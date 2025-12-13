import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSearch, FiPlus, FiLink, FiLoader } from 'react-icons/fi';
import { FaBuilding, FaUser, FaLightbulb } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

// Styled components
const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  margin-left: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  }
`;

const ModalContent = styled.div`
  padding: 20px 24px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  max-height: 60vh;
  overflow-y: auto;
`;

const SectionCard = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#2D3748'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#4A5568'};
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 6px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SuggestionInfo = styled.div`
  flex: 1;
`;

const SuggestionName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const SuggestionMeta = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const SourceBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background: ${props => props.$type === 'contact'
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A8A')
    : (props.theme === 'light' ? '#D1FAE5' : '#064E3B')};
  color: ${props => props.$type === 'contact'
    ? (props.theme === 'light' ? '#1D4ED8' : '#93C5FD')
    : (props.theme === 'light' ? '#065F46' : '#6EE7B7')};
  border-radius: 4px;
  margin-left: 8px;
`;

const LinkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#10B981' : '#059669'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#059669' : '#047857'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 1px ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  margin-bottom: 12px;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SearchResults = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const CreateNewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
  }
`;

const getModalStyles = (theme) => ({
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    background: theme === 'light' ? '#FFFFFF' : '#1F2937',
    border: theme === 'light' ? '1px solid #E5E7EB' : '1px solid #374151',
    borderRadius: '12px',
    padding: '0',
    width: '550px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1050
  }
});

if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const LinkToExistingModal = ({
  isOpen,
  onClose,
  entityType, // 'company' or 'contact'
  itemData, // { domain, email, mobile, name, issueId }
  theme = 'light',
  onLink, // callback when linked successfully
  onCreateNew // callback to open create new modal
}) => {
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch suggestions on open
  useEffect(() => {
    if (isOpen && itemData) {
      fetchSuggestions();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, itemData]);

  const fetchSuggestions = async () => {
    if (!itemData) return;

    setLoading(true);
    const allSuggestions = [];

    try {
      if (entityType === 'company') {
        // 1. Find contacts with this domain and get their linked companies
        const domain = itemData.domain;

        // Step 1: Get contacts with this email domain
        const { data: contactEmails } = await supabase
          .from('contact_emails')
          .select('contact_id, email')
          .ilike('email', `%@${domain}`);

        if (contactEmails && contactEmails.length > 0) {
          const contactIds = [...new Set(contactEmails.map(ce => ce.contact_id))];

          try {
            // Step 2: Get contact details
            const { data: contacts, error: contactsError } = await supabase
              .from('contacts')
              .select('contact_id, first_name, last_name')
              .in('contact_id', contactIds);

            if (contactsError) {
              console.error('Error fetching contacts:', contactsError);
            }

            const contactMap = new Map(contacts?.map(c => [
              c.contact_id,
              [c.first_name, c.last_name].filter(Boolean).join(' ')
            ]) || []);

            // Step 3: Get companies linked to these contacts
            const { data: contactCompanies, error: companiesError } = await supabase
              .from('contact_companies')
              .select('contact_id, company_id, companies(company_id, name, category)')
              .in('contact_id', contactIds);

            if (companiesError) {
              console.error('Error fetching contact companies:', companiesError);
            }

            if (contactCompanies) {
              const seenCompanies = new Set();
              for (const cc of contactCompanies) {
                if (cc.companies && !seenCompanies.has(cc.companies.company_id)) {
                  seenCompanies.add(cc.companies.company_id);
                  allSuggestions.push({
                    id: cc.companies.company_id,
                    name: cc.companies.name,
                    category: cc.companies.category,
                    source: 'contact',
                    sourceDetail: `From ${contactMap.get(cc.contact_id) || 'contact'}`
                  });
                }
              }
            }
          } catch (err) {
            console.error('Error in contact suggestions:', err);
          }
        }

        // 2. Fuzzy match on domain name
        const domainName = domain.split('.')[0].replace(/-/g, ' ');
        const { data: fuzzyCompanies } = await supabase
          .from('companies')
          .select('company_id, name, category')
          .ilike('name', `%${domainName}%`)
          .limit(5);

        if (fuzzyCompanies) {
          for (const c of fuzzyCompanies) {
            if (!allSuggestions.find(s => s.id === c.company_id)) {
              allSuggestions.push({
                id: c.company_id,
                name: c.name,
                category: c.category,
                source: 'fuzzy',
                sourceDetail: 'Similar name'
              });
            }
          }
        }
      } else if (entityType === 'contact') {
        // 1. Fuzzy match on name
        const nameParts = (itemData.name || '').split(' ').filter(p => p.length > 1);

        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');

          // Search by first name AND last name
          const { data: nameMatches } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name, category')
            .ilike('first_name', `%${firstName}%`)
            .ilike('last_name', `%${lastName}%`)
            .limit(5);

          if (nameMatches) {
            for (const c of nameMatches) {
              allSuggestions.push({
                id: c.contact_id,
                name: [c.first_name, c.last_name].filter(Boolean).join(' '),
                category: c.category,
                source: 'fuzzy',
                sourceDetail: 'Similar name'
              });
            }
          }
        }

        // 2. Find contacts with same email domain
        if (itemData.email) {
          const domain = itemData.email.split('@')[1];
          const { data: domainContacts } = await supabase
            .from('contact_emails')
            .select(`
              contacts (
                contact_id,
                first_name,
                last_name,
                category
              )
            `)
            .ilike('email', `%@${domain}`)
            .limit(10);

          if (domainContacts) {
            for (const ce of domainContacts) {
              if (ce.contacts && !allSuggestions.find(s => s.id === ce.contacts.contact_id)) {
                allSuggestions.push({
                  id: ce.contacts.contact_id,
                  name: [ce.contacts.first_name, ce.contacts.last_name].filter(Boolean).join(' '),
                  category: ce.contacts.category,
                  source: 'domain',
                  sourceDetail: `Same domain @${domain}`
                });
              }
            }
          }
        }
      }

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      if (entityType === 'company') {
        const { data } = await supabase
          .from('companies')
          .select('company_id, name, category')
          .ilike('name', `%${query}%`)
          .limit(10);

        setSearchResults((data || []).map(c => ({
          id: c.company_id,
          name: c.name,
          category: c.category
        })));
      } else {
        const { data } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, category')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .limit(10);

        setSearchResults((data || []).map(c => ({
          id: c.contact_id,
          name: [c.first_name, c.last_name].filter(Boolean).join(' '),
          category: c.category
        })));
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  }, [entityType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Link handler
  const handleLink = async (targetId, targetName) => {
    setLinking(targetId);

    try {
      if (entityType === 'company') {
        // Link domain to company
        const { error } = await supabase
          .from('company_domains')
          .insert({
            company_id: targetId,
            domain: itemData.domain,
            is_primary: false
          });

        if (error) {
          console.log('Link error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            toast.error('This domain is already linked to a company');
          } else {
            toast.error(error.message || 'Failed to link domain');
          }
          setLinking(null);
          return;
        }

        // Mark all issues as resolved for this domain
        if (itemData.issueIds && itemData.issueIds.length > 0) {
          await supabase
            .from('data_integrity_inbox')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .in('id', itemData.issueIds);
        } else if (itemData.issueId) {
          // Fallback for single issueId
          await supabase
            .from('data_integrity_inbox')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', itemData.issueId);
        }

        toast.success(`Linked ${itemData.domain} to ${targetName}`);
      } else {
        // Link email/mobile to contact
        if (itemData.email) {
          const { error } = await supabase
            .from('contact_emails')
            .insert({
              contact_id: targetId,
              email: itemData.email,
              type: 'work',
              is_primary: false
            });

          if (error) {
            if (error.code === '23505') {
              toast.error('This email is already linked to a contact');
            } else {
              throw error;
            }
            return;
          }
        }

        if (itemData.mobile) {
          const { error } = await supabase
            .from('contact_mobiles')
            .insert({
              contact_id: targetId,
              mobile: itemData.mobile,
              type: 'work',
              is_primary: false
            });

          if (error) {
            if (error.code === '23505') {
              toast.error('This mobile is already linked to a contact');
            } else {
              throw error;
            }
            return;
          }
        }

        // Mark issue as resolved
        if (itemData.issueId) {
          await supabase
            .from('data_integrity_inbox')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', itemData.issueId);
        }

        toast.success(`Linked ${itemData.email || itemData.mobile} to ${targetName}`);
      }

      if (onLink) onLink(targetId);
      onClose();
    } catch (error) {
      console.error('Error linking:', error);
      toast.error('Failed to link');
    } finally {
      setLinking(null);
    }
  };

  const handleCreateNew = () => {
    // Store itemData before closing (in case onClose clears state)
    const dataToPass = { ...itemData };
    onClose();
    if (onCreateNew) onCreateNew(dataToPass);
  };

  if (!itemData) return null;

  const displayValue = entityType === 'company'
    ? itemData.domain
    : (itemData.email || itemData.mobile || itemData.name);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={getModalStyles(theme)}
      contentLabel="Link to Existing"
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>
          {entityType === 'company' ? <FaBuilding /> : <FaUser />}
          Link to Existing {entityType === 'company' ? 'Company' : 'Contact'}
          <Badge theme={theme}>{displayValue}</Badge>
        </ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>

      <ModalContent theme={theme}>
        {/* Suggestions Section */}
        {loading ? (
          <LoadingState theme={theme}>
            <FiLoader className="animate-spin" />
            Finding suggestions...
          </LoadingState>
        ) : suggestions.length > 0 ? (
          <SectionCard theme={theme}>
            <SectionTitle theme={theme}>
              <FaLightbulb color="#F59E0B" /> Suggestions
            </SectionTitle>
            {suggestions.map(suggestion => (
              <SuggestionItem key={suggestion.id} theme={theme}>
                <SuggestionInfo>
                  <SuggestionName theme={theme}>
                    {suggestion.name}
                    <SourceBadge theme={theme} $type={suggestion.source}>
                      {suggestion.sourceDetail}
                    </SourceBadge>
                  </SuggestionName>
                  {suggestion.category && (
                    <SuggestionMeta theme={theme}>{suggestion.category}</SuggestionMeta>
                  )}
                </SuggestionInfo>
                <LinkButton
                  theme={theme}
                  onClick={() => handleLink(suggestion.id, suggestion.name)}
                  disabled={linking === suggestion.id}
                >
                  {linking === suggestion.id ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiLink />
                  )}
                  Link
                </LinkButton>
              </SuggestionItem>
            ))}
          </SectionCard>
        ) : null}

        {/* Search Section */}
        <SectionCard theme={theme}>
          <SectionTitle theme={theme}>
            <FiSearch /> Search {entityType === 'company' ? 'Companies' : 'Contacts'}
          </SectionTitle>
          <SearchWrapper theme={theme}>
            <FiSearch />
            <SearchInput
              theme={theme}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by name...`}
            />
          </SearchWrapper>

          {searching ? (
            <LoadingState theme={theme}>
              <FiLoader className="animate-spin" />
              Searching...
            </LoadingState>
          ) : searchResults.length > 0 ? (
            <SearchResults>
              {searchResults.map(result => (
                <SuggestionItem key={result.id} theme={theme}>
                  <SuggestionInfo>
                    <SuggestionName theme={theme}>{result.name}</SuggestionName>
                    {result.category && (
                      <SuggestionMeta theme={theme}>{result.category}</SuggestionMeta>
                    )}
                  </SuggestionInfo>
                  <LinkButton
                    theme={theme}
                    onClick={() => handleLink(result.id, result.name)}
                    disabled={linking === result.id}
                  >
                    {linking === result.id ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <FiLink />
                    )}
                    Link
                  </LinkButton>
                </SuggestionItem>
              ))}
            </SearchResults>
          ) : searchQuery.length >= 2 ? (
            <EmptyState theme={theme}>
              No {entityType === 'company' ? 'companies' : 'contacts'} found
            </EmptyState>
          ) : null}
        </SectionCard>
      </ModalContent>

      <FooterButtons theme={theme}>
        <CancelButton theme={theme} onClick={onClose}>
          Cancel
        </CancelButton>
        <CreateNewButton theme={theme} onClick={handleCreateNew}>
          <FiPlus /> Create New {entityType === 'company' ? 'Company' : 'Contact'}
        </CreateNewButton>
      </FooterButtons>
    </Modal>
  );
};

LinkToExistingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['company', 'contact']).isRequired,
  itemData: PropTypes.shape({
    domain: PropTypes.string,
    email: PropTypes.string,
    mobile: PropTypes.string,
    name: PropTypes.string,
    issueId: PropTypes.string
  }),
  theme: PropTypes.oneOf(['light', 'dark']),
  onLink: PropTypes.func,
  onCreateNew: PropTypes.func
};

export default LinkToExistingModal;

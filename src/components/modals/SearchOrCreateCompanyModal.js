import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FaBuilding, FaPlus, FaGlobe, FaLinkedin, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Styled Components
const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
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

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const SearchContainer = styled.div`
  margin-bottom: 16px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const HelpText = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 8px;
`;

const SuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  transition: background-color 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuggestionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3B82F6;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
`;

const SuggestionContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const SuggestionName = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
`;

const SuggestionMeta = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MatchBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch(props.$type) {
      case 'domain': return props.theme === 'light' ? '#DBEAFE' : '#1E40AF';
      case 'linkedin': return props.theme === 'light' ? '#E0E7FF' : '#3730A3';
      case 'name': return props.theme === 'light' ? '#FEF3C7' : '#78350F';
      default: return props.theme === 'light' ? '#F3F4F6' : '#374151';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'domain': return props.theme === 'light' ? '#1D4ED8' : '#BFDBFE';
      case 'linkedin': return props.theme === 'light' ? '#4338CA' : '#C7D2FE';
      case 'name': return props.theme === 'light' ? '#92400E' : '#FDE68A';
      default: return props.theme === 'light' ? '#374151' : '#D1D5DB';
    }
  }};
`;

const NoResults = styled.div`
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  text-align: center;
`;

const CreateButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 16px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  cursor: pointer;
  font-size: 0.9rem;
  color: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DCFCE7' : '#065F46'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
`;

const SearchOrCreateCompanyModal = ({
  isOpen,
  onClose,
  onCompanySelected,
  contactToLink = null, // Optional: contact to link the company to
  contactEmails = [], // Optional: contact's emails for auto-suggestion
  theme = 'dark'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  // Helper to link company to contact
  const linkCompanyToContact = async (companyId) => {
    if (!contactToLink?.contact_id) return;

    try {
      // Check if link already exists
      const { data: existingLink } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', contactToLink.contact_id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existingLink) {
        // Link already exists, no need to create
        return;
      }

      // Check if contact has any companies linked (for is_primary)
      const { data: existingCompanies } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', contactToLink.contact_id)
        .limit(1);

      const isPrimary = !existingCompanies || existingCompanies.length === 0;

      // Create the link
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contactToLink.contact_id,
          company_id: companyId,
          is_primary: isPrimary
        });

      if (error) throw error;

      const contactName = contactToLink.first_name || contactToLink.name || 'Contact';
      toast.success(`Company linked to ${contactName}`);
    } catch (error) {
      console.error('Error linking company to contact:', error);
      // Don't show error toast - the company was still created/selected successfully
    }
  };

  // Reset state when modal opens and auto-search based on email domain
  useEffect(() => {
    if (isOpen) {
      setInitialSearchDone(false);
      setSuggestions([]);
      setShowSuggestions(false);

      // Auto-populate with email domain if available
      const primaryEmail = contactEmails?.find(e => e.is_primary)?.email || contactEmails?.[0]?.email;
      if (primaryEmail && primaryEmail.includes('@')) {
        const domain = primaryEmail.split('@')[1]?.toLowerCase();
        if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail') && !domain.includes('outlook')) {
          // Use the domain name part (before .com, .eu, etc)
          const domainName = domain.split('.')[0];
          setSearchTerm(domainName);
        } else {
          setSearchTerm('');
        }
      } else {
        setSearchTerm('');
      }
    }
  }, [isOpen, contactEmails]);

  // Helper to check if search term looks like a domain
  const isDomainLike = (term) => {
    return term.includes('.') && !term.includes(' ');
  };

  // Helper to check if search term looks like a LinkedIn URL
  const isLinkedInUrl = (term) => {
    return term.toLowerCase().includes('linkedin.com');
  };

  // Extract company slug from LinkedIn URL
  const extractLinkedInSlug = (url) => {
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/i);
    return match ? match[1] : null;
  };

  // Fetch company suggestions based on search term
  const fetchCompanySuggestions = useCallback(async (search) => {
    if (search.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = [];
      const addedCompanyIds = new Set();

      // 1. Check if it looks like a domain - search in company_domains
      if (isDomainLike(search)) {
        const cleanDomain = search.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

        const { data: domainMatches } = await supabase
          .from('company_domains')
          .select('company_id, domain, is_primary, companies(company_id, name, category, linkedin)')
          .ilike('domain', `%${cleanDomain}%`)
          .limit(5);

        if (domainMatches) {
          domainMatches.forEach(match => {
            if (match.companies && !addedCompanyIds.has(match.companies.company_id)) {
              addedCompanyIds.add(match.companies.company_id);
              results.push({
                ...match.companies,
                matchType: 'domain',
                matchValue: match.domain
              });
            }
          });
        }
      }

      // 2. Check if it looks like a LinkedIn URL
      if (isLinkedInUrl(search)) {
        const slug = extractLinkedInSlug(search);
        if (slug) {
          const { data: linkedinMatches } = await supabase
            .from('companies')
            .select('company_id, name, category, linkedin')
            .or(`linkedin.ilike.%${slug}%,linkedin.ilike.%linkedin.com/company/${slug}%`)
            .limit(5);

          if (linkedinMatches) {
            linkedinMatches.forEach(match => {
              if (!addedCompanyIds.has(match.company_id)) {
                addedCompanyIds.add(match.company_id);
                results.push({
                  ...match,
                  matchType: 'linkedin',
                  matchValue: match.linkedin
                });
              }
            });
          }
        }
      }

      // 3. Search by name (always)
      const { data: nameMatches } = await supabase
        .from('companies')
        .select('company_id, name, category, linkedin')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (nameMatches) {
        nameMatches.forEach(match => {
          if (!addedCompanyIds.has(match.company_id)) {
            addedCompanyIds.add(match.company_id);
            results.push({
              ...match,
              matchType: 'name',
              matchValue: match.name
            });
          }
        });
      }

      // 4. Also search domains by name fragment
      if (!isDomainLike(search)) {
        const { data: domainNameMatches } = await supabase
          .from('company_domains')
          .select('company_id, domain, companies(company_id, name, category, linkedin)')
          .ilike('domain', `%${search}%`)
          .limit(5);

        if (domainNameMatches) {
          domainNameMatches.forEach(match => {
            if (match.companies && !addedCompanyIds.has(match.companies.company_id)) {
              addedCompanyIds.add(match.companies.company_id);
              results.push({
                ...match.companies,
                matchType: 'domain',
                matchValue: match.domain
              });
            }
          });
        }
      }

      // 5. Search LinkedIn URLs for partial matches (e.g., "gopillar" matches linkedin.com/company/gopillar)
      if (!isLinkedInUrl(search) && search.length >= 3) {
        const { data: linkedinPartialMatches } = await supabase
          .from('companies')
          .select('company_id, name, category, linkedin')
          .ilike('linkedin', `%${search}%`)
          .limit(5);

        if (linkedinPartialMatches) {
          linkedinPartialMatches.forEach(match => {
            if (!addedCompanyIds.has(match.company_id)) {
              addedCompanyIds.add(match.company_id);
              results.push({
                ...match,
                matchType: 'linkedin',
                matchValue: match.linkedin
              });
            }
          });
        }
      }

      // Load domains for each company to show in results
      if (results.length > 0) {
        const companyIds = results.map(r => r.company_id);
        const { data: allDomains } = await supabase
          .from('company_domains')
          .select('company_id, domain, is_primary')
          .in('company_id', companyIds)
          .order('is_primary', { ascending: false });

        // Attach domains to results
        results.forEach(result => {
          result.domains = allDomains?.filter(d => d.company_id === result.company_id).map(d => d.domain) || [];
        });
      }

      setSuggestions(results.slice(0, 10));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search on initial load with email domain
  useEffect(() => {
    if (isOpen && searchTerm && !initialSearchDone) {
      setInitialSearchDone(true);
      fetchCompanySuggestions(searchTerm);
    }
  }, [isOpen, searchTerm, initialSearchDone, fetchCompanySuggestions]);

  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchCompanySuggestions(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, fetchCompanySuggestions]);

  // Handle selecting an existing company
  const handleSelectCompany = async (company) => {
    // Link company to contact if provided
    await linkCompanyToContact(company.company_id);

    if (onCompanySelected) {
      onCompanySelected(company.company_id);
    }
    onClose();
  };

  // Handle creating a new company
  const handleCreateCompany = async () => {
    if (!searchTerm.trim()) return;

    setCreating(true);
    try {
      // Determine what to use as name and domain
      let companyName = searchTerm.trim();
      let domainToAdd = null;

      // If search term looks like a domain, extract name from it
      if (isDomainLike(searchTerm)) {
        const cleanDomain = searchTerm.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        domainToAdd = cleanDomain;
        // Capitalize the domain name part (before .com etc)
        const namePart = cleanDomain.split('.')[0];
        companyName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      }

      // Create the company
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          category: 'Inbox' // Default category
        })
        .select()
        .single();

      if (createError) throw createError;

      // If we have a domain, add it
      if (domainToAdd && newCompany) {
        await supabase
          .from('company_domains')
          .insert({
            company_id: newCompany.company_id,
            domain: domainToAdd,
            is_primary: true
          });
      }

      // Link company to contact if provided
      if (newCompany) {
        await linkCompanyToContact(newCompany.company_id);
      }

      toast.success(`Company "${companyName}" created`);

      // Call callback with the new company ID
      if (onCompanySelected && newCompany) {
        onCompanySelected(newCompany.company_id);
      }
      onClose();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999
        }
      }}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>
          <FaBuilding style={{ color: '#3B82F6' }} />
          Find or Create Company
        </ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>×</CloseButton>
      </ModalHeader>

      <ModalBody theme={theme}>
        <SearchContainer>
          <SearchInputWrapper>
            <SearchIcon theme={theme}>
              <FaSearch size={14} />
            </SearchIcon>
            <SearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, domain, or LinkedIn URL..."
              autoFocus
            />
          </SearchInputWrapper>
          <HelpText theme={theme}>
            Type at least 2 characters to search
          </HelpText>
        </SearchContainer>

        {loading && (
          <LoadingSpinner theme={theme}>
            Searching...
          </LoadingSpinner>
        )}

        {showSuggestions && !loading && (
          <SuggestionsContainer theme={theme}>
            {suggestions.map(suggestion => (
              <SuggestionItem
                key={suggestion.company_id}
                theme={theme}
                onClick={() => handleSelectCompany(suggestion)}
                disabled={creating}
              >
                <SuggestionIcon theme={theme}>
                  {getInitials(suggestion.name)}
                </SuggestionIcon>
                <SuggestionContent>
                  <SuggestionName>{suggestion.name}</SuggestionName>
                  <SuggestionMeta theme={theme}>
                    {suggestion.category && suggestion.category !== 'Inbox' && (
                      <span>{suggestion.category}</span>
                    )}
                    {suggestion.domains?.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaGlobe size={10} />
                        {suggestion.domains[0]}
                        {suggestion.domains.length > 1 && ` +${suggestion.domains.length - 1}`}
                      </span>
                    )}
                    <MatchBadge theme={theme} $type={suggestion.matchType}>
                      {suggestion.matchType === 'domain' && <FaGlobe size={8} />}
                      {suggestion.matchType === 'linkedin' && <FaLinkedin size={8} />}
                      {suggestion.matchType} match
                    </MatchBadge>
                  </SuggestionMeta>
                </SuggestionContent>
              </SuggestionItem>
            ))}

            {suggestions.length === 0 && searchTerm.length >= 2 && (
              <NoResults theme={theme}>
                No companies found matching "{searchTerm}"
              </NoResults>
            )}

            {searchTerm.length >= 2 && (
              <CreateButton
                theme={theme}
                onClick={handleCreateCompany}
                disabled={creating}
              >
                <FaPlus size={14} />
                {creating ? 'Creating...' : `Create "${isDomainLike(searchTerm) ? searchTerm.split('.')[0].charAt(0).toUpperCase() + searchTerm.split('.')[0].slice(1) : searchTerm}" as new company`}
              </CreateButton>
            )}
          </SuggestionsContainer>
        )}
      </ModalBody>
    </Modal>
  );
};

export default SearchOrCreateCompanyModal;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaSync, FaSearch } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const SearchPage = ({ theme }) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Name');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (searchQuery.trim()) {
      await performSearch(searchQuery);
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setContacts([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let data = [];
      let error = null;

      switch (filterCategory) {
        case 'Name':
          // Split the query into words for smart matching
          const nameWords = query.trim().split(/\s+/);
          let nameQuery = '';

          if (nameWords.length === 1) {
            // Single word - search in both first and last name
            nameQuery = `first_name.ilike.%${query}%,last_name.ilike.%${query}%`;
          } else if (nameWords.length === 2) {
            // Two words - try both combinations
            const [word1, word2] = nameWords;
            nameQuery = `and(first_name.ilike.%${word1}%,last_name.ilike.%${word2}%),and(first_name.ilike.%${word2}%,last_name.ilike.%${word1}%),first_name.ilike.%${query}%,last_name.ilike.%${query}%`;
          } else {
            // Multiple words - search in both fields for the full query and individual words
            const wordQueries = nameWords.map(word => `first_name.ilike.%${word}%,last_name.ilike.%${word}%`).join(',');
            nameQuery = `first_name.ilike.%${query}%,last_name.ilike.%${query}%,${wordQueries}`;
          }

          const nameResult = await supabase
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
            .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set")')
            .or(nameQuery)
            .order('last_interaction_at', { ascending: false, nullsLast: true })
            .limit(100);
          data = nameResult.data;
          error = nameResult.error;
          break;

        case 'Company':
          const companyResult = await supabase
            .from('contacts')
            .select(`
              *,
              contact_emails (email, type, is_primary),
              contact_mobiles (mobile, type, is_primary),
              contact_companies!inner (
                company_id,
                relationship,
                is_primary,
                companies!inner (name, website, category)
              ),
              contact_tags (
                tags (name)
              ),
              contact_cities (
                cities (name, country)
              )
            `)
            .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set")')
            .ilike('contact_companies.companies.name', `%${query}%`)
            .order('last_interaction_at', { ascending: false, nullsLast: true })
            .limit(100);
          data = companyResult.data;
          error = companyResult.error;
          break;

        case 'City':
          const cityResult = await supabase
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
              contact_cities!inner (
                cities!inner (name, country)
              )
            `)
            .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set")')
            .ilike('contact_cities.cities.name', `%${query}%`)
            .order('last_interaction_at', { ascending: false, nullsLast: true })
            .limit(100);
          data = cityResult.data;
          error = cityResult.error;
          break;

        case 'Tags':
          const tagsResult = await supabase
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
              contact_tags!inner (
                tags!inner (name)
              ),
              contact_cities (
                cities (name, country)
              )
            `)
            .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set")')
            .ilike('contact_tags.tags.name', `%${query}%`)
            .order('last_interaction_at', { ascending: false, nullsLast: true })
            .limit(100);
          data = tagsResult.data;
          error = tagsResult.error;
          break;

        default:
          data = [];
          error = null;
      }

      if (error) throw error;

      // Process the contacts data to match expected format
      const processedContacts = (data || []).map(contact => ({
        ...contact,
        emails: contact.contact_emails || [],
        mobiles: contact.contact_mobiles || [],
        companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      }));

      setContacts(processedContacts);
      console.log(`Found ${processedContacts.length} contacts matching "${query}" in ${filterCategory}`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeout;
      return (query) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => performSearch(query), 300);
      };
    })(),
    [filterCategory]
  );

  // Effect for handling search input changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Clear search when changing filter category
  useEffect(() => {
    setSearchQuery('');
    setContacts([]);
    setHasSearched(false);
  }, [filterCategory]);

  const searchCategories = ['Name', 'Company', 'City', 'Tags'];

  return (
    <PageContainer theme={theme}>
      <SearchView>
        <SearchHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>Search</PageTitle>
              <PageSubtitle theme={theme}>
                Find contacts by name, company, or details
              </PageSubtitle>
            </HeaderText>
            <RefreshButton
              theme={theme}
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              $isRefreshing={isRefreshing}
            >
              <FaSync />
            </RefreshButton>
          </HeaderContent>

          <FilterTabs theme={theme}>
            {searchCategories.map(category => (
              <FilterTab
                key={category}
                theme={theme}
                $active={filterCategory === category}
                onClick={() => setFilterCategory(category)}
              >
                {category}
              </FilterTab>
            ))}
          </FilterTabs>

          <SearchInputContainer theme={theme}>
            <SearchInputWrapper>
              <SearchIcon theme={theme}>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                theme={theme}
                type="text"
                placeholder={`Search by ${filterCategory.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <ClearButton
                  theme={theme}
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </ClearButton>
              )}
            </SearchInputWrapper>
          </SearchInputContainer>
        </SearchHeader>

        <ContentArea>
          {!hasSearched && !searchQuery && (
            <EmptySearchState theme={theme}>
              <SearchStateIcon>🔍</SearchStateIcon>
              <SearchStateTitle theme={theme}>Start searching</SearchStateTitle>
              <SearchStateText theme={theme}>
                Enter a search term to find contacts by {filterCategory.toLowerCase()}
              </SearchStateText>
            </EmptySearchState>
          )}

          {hasSearched && (
            <ContactsList
              contacts={contacts}
              loading={loading}
              theme={theme}
              emptyStateConfig={{
                icon: '🔍',
                title: 'No contacts found',
                text: `No contacts match "${searchQuery}" in ${filterCategory.toLowerCase()}.`
              }}
              onContactUpdate={() => performSearch(searchQuery)}
              showActions={true}
              badgeType="category"
            />
          )}
        </ContentArea>
      </SearchView>
    </PageContainer>
  );
};

// Styled Components (same pattern as other pages)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const SearchView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const SearchHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px 20px 24px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto 20px auto;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
  font-size: 16px;
`;

const RefreshButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$isRefreshing && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  &:hover {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 1200px;
  margin: 20px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 12px;
  padding: 6px;
  width: fit-content;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

const FilterTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-size: 15px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: fit-content;
  white-space: nowrap;
  position: relative;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)'
        : '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme === 'light'
      ? '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active {
    transform: translateY(0);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const SearchInputContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 600px;
  margin: 20px auto 0 auto;
  width: 100%;
  padding: 0 20px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  z-index: 2;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 48px 16px 48px;
  border: 2px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  transition: all 0.2s ease;
  outline: none;

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 20px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const EmptySearchState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const SearchStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const SearchStateTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const SearchStateText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
  max-width: 400px;
`;

export default SearchPage;
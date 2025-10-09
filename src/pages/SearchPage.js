import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaSync, FaSearch } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import ContactsListDRY from '../components/ContactsListDRY';
import {
  PageContainer,
  PageView,
  PageHeader,
  HeaderContent,
  HeaderText,
  PageTitle,
  PageSubtitle,
  RefreshButton,
  FilterTabs,
  FilterTab,
  ContentArea
} from '../components/shared/PageLayout';

const SearchPage = ({ theme }) => {
  const navigate = useNavigate();

  // Handle clicks on both contacts and company records
  const handleItemClick = (item) => {
    if (item.isCompanyRecord) {
      // Navigate to company detail page
      navigate(`/company/${item.company_id}`);
    } else {
      // Navigate to contact detail page
      navigate(`/contact/${item.contact_id}`);
    }
  };
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
          // Search for both contacts associated with companies AND companies themselves
          const [companyContactsResult, companiesResult] = await Promise.all([
            // 1. Search for contacts associated with companies
            supabase
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
              .limit(50),

            // 2. Search for companies directly
            supabase
              .from('companies')
              .select('company_id, name, website, category, description')
              .ilike('name', `%${query}%`)
              .not('category', 'eq', 'Skip')
              .order('name')
              .limit(50)
          ]);

          if (companyContactsResult.error) throw companyContactsResult.error;
          if (companiesResult.error) throw companiesResult.error;

          // Combine both results - companies first, then contacts
          data = [
            ...(companiesResult.data || []).map(company => ({
              // Mark as company record for identification
              isCompanyRecord: true,
              company_id: company.company_id,
              contact_id: `company_${company.company_id}`, // Unique ID for React keys
              name: company.name,
              first_name: company.name, // Display name
              last_name: '', // Empty last name
              website: company.website,
              category: company.category,
              description: company.description
            })),
            ...(companyContactsResult.data || [])
          ];
          error = null;
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

      // Process the data to handle both contacts and company records
      const processedResults = (data || []).map(item => {
        // Check if this is a company record
        if (item.isCompanyRecord) {
          console.log('SearchPage processing company record:', item.name);
          return {
            ...item,
            // Add display properties for company records
            display_name: item.name,
            display_type: 'company',
            emails: [],
            mobiles: [],
            companies: [{ name: item.name, website: item.website, category: item.category }],
            tags: [],
            cities: []
          };
        } else {
          // Process contact records as before
          console.log('SearchPage processing contact:', item.first_name, item.contact_companies);
          const companies = item.contact_companies?.map(cc => {
            console.log('Processing company relation:', cc);
            return {
              ...cc.companies,
              company_id: cc.company_id // Preserve company_id from the join table
            };
          }).filter(Boolean) || [];
          console.log('Processed companies:', companies);

          return {
            ...item,
            display_type: 'contact',
            emails: item.contact_emails || [],
            mobiles: item.contact_mobiles || [],
            companies: companies,
            tags: item.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
            cities: item.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
          };
        }
      });

      setContacts(processedResults);
      console.log(`Found ${processedResults.length} results matching "${query}" in ${filterCategory}`);

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
      <PageView>
        <PageHeader theme={theme}>
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
        </PageHeader>

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
            <ContactsListDRY
              dataSource={{
                type: 'search',
                searchQuery: searchQuery,
                filterCategory: filterCategory,
                preloadedData: contacts
              }}
              refreshTrigger={isRefreshing}
              theme={theme}
              emptyStateConfig={{
                icon: '🔍',
                title: 'No results found',
                text: `No contacts or companies match "${searchQuery}" in ${filterCategory.toLowerCase()}.`
              }}
              onContactUpdate={() => performSearch(searchQuery)}
              onContactClick={handleItemClick}
              showActions={true}
              badgeType="category"
              pageContext="search"
            />
          )}
        </ContentArea>
      </PageView>
    </PageContainer>
  );
};

// Styled Components specific to Search page (search bar components)

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
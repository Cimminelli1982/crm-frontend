import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiSearch, FiEdit, FiZap } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import CompanyEnrichmentModal from './CompanyEnrichmentModal';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #1f2937;
      background-color: #f3f4f6;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 6px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: black;
    color: white;
    border: none;

    &:hover {
      background-color: #333333;
    }
  }

  &.secondary {
    background-color: white;
    color: #4b5563;
    border: 1px solid #d1d5db;

    &:hover {
      background-color: #f9fafb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.$textColor || '#4b5563'};
  font-weight: 500;
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  display: flex;
  align-items: center;
`;

const TagInput = styled.div`
  position: relative;
  margin-top: 8px;
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
`;

const Suggestion = styled.div`
  padding: 8px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const NewTagButton = styled.div`
  padding: 8px 12px;
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;

  &.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.error {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
  overflow-x: auto;

  @media (max-width: 640px) {
    margin: -20px -20px 20px -20px;
    padding: 0 20px;
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 12px 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$active ? '#3b82f6' : '#6b7280'};
  border-bottom: 3px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;

  &:hover {
    color: #3b82f6;
    background-color: #f8fafc;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 640px) {
    padding: 10px 16px;
    font-size: 0.8rem;
  }
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
  animation: ${props => props.$active ? 'fadeIn 0.2s ease-in' : 'none'};
  min-height: 400px;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const NextButton = styled(Button)`
  margin-left: auto;

  &.next-button {
    background-color: #3b82f6;
    color: white;
    border: none;

    &:hover {
      background-color: #2563eb;
    }
  }
`;

const ListContainer = styled.div`
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const ListItemText = styled.div`
  font-size: 0.875rem;
  color: #1f2937;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: #fee2e2;
  }
`;

// Company categories - matches database enum exactly
const COMPANY_CATEGORIES = [
  'Advisory',
  'Corporate',
  'Corporation',
  'Hold',
  'Inbox',
  'Institution',
  'Media',
  'Not Set',
  'Professional Investor',
  'SME',
  'Skip',
  'Startup'
];

// Helper function to get tag colors - for consistent coloring
const getTagColor = (tagName) => {
  const colors = [
    { bg: '#fee2e2', text: '#b91c1c' }, // Red
    { bg: '#fef3c7', text: '#92400e' }, // Amber
    { bg: '#ecfccb', text: '#3f6212' }, // Lime
    { bg: '#d1fae5', text: '#065f46' }, // Emerald
    { bg: '#e0f2fe', text: '#0369a1' }, // Sky
    { bg: '#ede9fe', text: '#5b21b6' }, // Violet
    { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
    { bg: '#fce7f3', text: '#9d174d' }  // Pink
  ];

  // Handle null/undefined tag names
  if (!tagName || typeof tagName !== 'string') {
    return colors[0]; // Return first color as default
  }

  // Generate a consistent index based on the tag name
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % colors.length;

  return colors[index];
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// Calculate similarity score (0-1, where 1 is identical)
const stringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
};

// Extract base domain (remove www, protocol, path)
const extractBaseDomain = (domain) => {
  if (!domain) return '';
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .split('/')[0];
};

// Helper function to get city flag emoji
const getFlagEmoji = (cityName) => {
  // Map of some cities to their country codes
  const cityCountryMap = {
    'New York': 'US',
    'San Francisco': 'US',
    'Los Angeles': 'US',
    'Chicago': 'US',
    'London': 'GB',
    'Berlin': 'DE',
    'Paris': 'FR',
    'Rome': 'IT',
    'Madrid': 'ES',
    'Amsterdam': 'NL',
    'Tokyo': 'JP',
    'Sydney': 'AU',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Dubai': 'AE',
    'Mumbai': 'IN',
    'Toronto': 'CA',
    'Zurich': 'CH',
    'Milan': 'IT',
    'Barcelona': 'ES',
    'Stockholm': 'SE',
  };
  
  // Extract country code or default to question mark
  const countryCode = cityCountryMap[cityName] || 'unknown';
  
  // If unknown, return the city name without a flag
  if (countryCode === 'unknown') {
    return null;
  }
  
  // Convert country code to flag emoji
  return countryCode
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
};

const EditCompanyModal = ({ isOpen, onRequestClose, company }) => {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('basic');

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companyCategory, setCompanyCategory] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  // Domains states (replacing single website)
  const [domains, setDomains] = useState([]);
  const [domainSearchTerm, setDomainSearchTerm] = useState('');

  // Tags states
  const [tags, setTags] = useState([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Cities states
  const [cities, setCities] = useState([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Tab definitions
  const tabs = [
    { id: 'duplicates', label: 'Duplicates', icon: '🔍' },
    { id: 'infos', label: 'Infos', icon: '📝' },
    { id: 'related', label: 'Related', icon: '🏷️' },
    { id: 'recap', label: 'Recap', icon: '✅' }
  ];

  // Duplicates state
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [duplicateSearchTerm, setDuplicateSearchTerm] = useState('');

  // Enrichment modal state
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);

  // Tab navigation helpers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  // Manual search for duplicates
  const handleManualDuplicateSearch = async () => {
    if (!duplicateSearchTerm.trim()) return;

    setLoadingDuplicates(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category, website')
        .neq('company_id', company?.company_id || '')
        .ilike('name', `%${duplicateSearchTerm.trim()}%`)
        .limit(20);

      if (error) throw error;

      // Add match type for manual search results
      const results = (data || []).map(comp => ({
        ...comp,
        matchTypes: [{ type: 'manual-search', label: 'Manual search' }],
        nameScore: stringSimilarity(companyName, comp.name),
        domainScore: 0
      }));

      setPotentialDuplicates(results);
    } catch (error) {
      console.error('Error searching companies:', error);
      setError('Search failed: ' + error.message);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Handle merge - insert into company_duplicates table
  const handleMergeCompany = async (duplicateCompany) => {
    try {
      const { error } = await supabase
        .from('company_duplicates')
        .insert({
          primary_company_id: company.company_id,
          duplicate_company_id: duplicateCompany.company_id,
          start_trigger: true,
          merge_selections: {
            contacts: 'combine',
            domains: 'combine',
            tags: 'combine',
            cities: 'combine'
          },
          notes: `Duplicate match from EditCompanyModal: ${duplicateCompany.matchTypes?.map(m => m.label).join(', ') || 'manual'}`
        });

      if (error) throw error;

      // Remove from list and show success
      setPotentialDuplicates(prev => prev.filter(d => d.company_id !== duplicateCompany.company_id));
      setMessage({ type: 'success', text: `Merge queued for "${duplicateCompany.name}"` });

    } catch (error) {
      console.error('Error creating merge record:', error);
      setError('Failed to queue merge: ' + error.message);
    }
  };

  // Search for potential duplicates - matches by domain (exact/fuzzy) and name (exact/fuzzy)
  const searchDuplicates = async (name, currentDomainsList = []) => {
    if ((!name || name.length < 2) && currentDomainsList.length === 0) {
      setPotentialDuplicates([]);
      return;
    }

    setLoadingDuplicates(true);
    try {
      const scoredResults = new Map();
      const currentCompanyId = company?.company_id || '';

      // Get base domains for comparison
      const currentBaseDomains = currentDomainsList.map(d => extractBaseDomain(d.domain || d));

      // 1. Search by name (substring match to get candidates)
      if (name && name.length >= 2) {
        const searchTerms = name.split(/\s+/).filter(t => t.length >= 2);
        const firstWord = searchTerms[0] || name;

        const { data: nameMatches, error: nameError } = await supabase
          .from('companies')
          .select('company_id, name, category, website')
          .neq('company_id', currentCompanyId)
          .or(`name.ilike.%${name}%,name.ilike.%${firstWord}%`)
          .limit(50);

        if (nameError) throw nameError;

        // Score name matches
        for (const match of (nameMatches || [])) {
          const nameSim = stringSimilarity(name, match.name);
          const matchTypes = [];

          if (nameSim === 1) {
            matchTypes.push({ type: 'name-exact', label: 'Exact name' });
          } else if (nameSim >= 0.8) {
            matchTypes.push({ type: 'name-fuzzy', label: 'Similar name', score: Math.round(nameSim * 100) });
          } else if (nameSim >= 0.5) {
            matchTypes.push({ type: 'name-fuzzy', label: 'Partial name', score: Math.round(nameSim * 100) });
          }

          if (matchTypes.length > 0) {
            scoredResults.set(match.company_id, {
              company: match,
              nameScore: nameSim,
              domainScore: 0,
              matchTypes
            });
          }
        }
      }

      // 2. Search by domain if we have domains
      if (currentBaseDomains.length > 0) {
        // Get all company domains to compare
        const { data: allDomains, error: domainError } = await supabase
          .from('company_domains')
          .select('company_id, domain, companies(company_id, name, category, website)')
          .neq('company_id', currentCompanyId)
          .limit(500);

        if (!domainError && allDomains) {
          for (const domainRecord of allDomains) {
            const matchDomain = extractBaseDomain(domainRecord.domain);
            const companyData = domainRecord.companies;
            if (!companyData) continue;

            for (const currentDomain of currentBaseDomains) {
              if (!currentDomain) continue;

              const domainSim = stringSimilarity(currentDomain, matchDomain);

              if (domainSim >= 0.6) {
                const existing = scoredResults.get(companyData.company_id);
                const matchType = domainSim === 1
                  ? { type: 'domain-exact', label: 'Exact domain', domain: matchDomain }
                  : { type: 'domain-fuzzy', label: 'Similar domain', domain: matchDomain, score: Math.round(domainSim * 100) };

                if (existing) {
                  existing.domainScore = Math.max(existing.domainScore, domainSim);
                  // Avoid duplicate match types
                  if (!existing.matchTypes.some(m => m.type === matchType.type && m.domain === matchType.domain)) {
                    existing.matchTypes.push(matchType);
                  }
                } else {
                  const nameSim = name ? stringSimilarity(name, companyData.name) : 0;
                  scoredResults.set(companyData.company_id, {
                    company: companyData,
                    nameScore: nameSim,
                    domainScore: domainSim,
                    matchTypes: [matchType]
                  });
                }
              }
            }
          }
        }
      }

      // Convert to array and sort by priority: exact domain > exact name > fuzzy scores
      const results = Array.from(scoredResults.values())
        .sort((a, b) => {
          // Priority 1: Exact domain matches
          const aExactDomain = a.matchTypes.some(m => m.type === 'domain-exact') ? 1 : 0;
          const bExactDomain = b.matchTypes.some(m => m.type === 'domain-exact') ? 1 : 0;
          if (aExactDomain !== bExactDomain) return bExactDomain - aExactDomain;

          // Priority 2: Exact name matches
          const aExactName = a.matchTypes.some(m => m.type === 'name-exact') ? 1 : 0;
          const bExactName = b.matchTypes.some(m => m.type === 'name-exact') ? 1 : 0;
          if (aExactName !== bExactName) return bExactName - aExactName;

          // Priority 3: Combined score (domain weighted higher)
          const aScore = a.nameScore * 0.4 + a.domainScore * 0.6;
          const bScore = b.nameScore * 0.4 + b.domainScore * 0.6;
          return bScore - aScore;
        })
        .slice(0, 15)
        .map(r => ({
          ...r.company,
          matchTypes: r.matchTypes,
          nameScore: r.nameScore,
          domainScore: r.domainScore
        }));

      setPotentialDuplicates(results);
    } catch (error) {
      console.error('Error searching duplicates:', error);
      setPotentialDuplicates([]);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Load company data when modal opens
  useEffect(() => {
    const loadData = async () => {
      if (isOpen && company) {
        // Reset to first tab
        setActiveTab('duplicates');

        // Set basic company info
        setCompanyName(company.name || '');
        setCompanyLinkedin(company.linkedin || '');
        setCompanyCategory(company.category || '');
        setCompanyDescription(company.description || '');

        // Load domains from company_domains table
        const loadedDomains = await loadCompanyDomainsAsync();

        // Load related data
        setTags(company.tags || []);
        setCities(company.cities || []);

        // Reset UI states
        setError('');
        setMessage({ type: '', text: '' });

        // Search for duplicates with both name and domains
        searchDuplicates(company.name, loadedDomains);
      }
    };
    loadData();
  }, [isOpen, company]);

  // Async version of loadCompanyDomains that returns the domains
  const loadCompanyDomainsAsync = async () => {
    if (!company?.company_id) return [];

    try {
      const { data: domainsData, error: domainsError } = await supabase
        .from('company_domains')
        .select('id, domain, is_primary, created_at')
        .eq('company_id', company.company_id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (domainsError) throw domainsError;

      const processedDomains = (domainsData || []).map(d => ({
        ...d,
        isExisting: true
      }));

      setDomains(processedDomains);
      return processedDomains;
    } catch (error) {
      console.error('Error loading company domains:', error);
      if (company.website) {
        const legacyDomains = [{
          domain: company.website.replace(/^https?:\/\//, ''),
          is_primary: true,
          isLegacy: true
        }];
        setDomains(legacyDomains);
        return legacyDomains;
      }
      return [];
    }
  };

  // Load company domains
  const loadCompanyDomains = async () => {
    if (!company?.company_id) return;

    try {
      const { data: domainsData, error: domainsError } = await supabase
        .from('company_domains')
        .select('id, domain, is_primary, created_at')
        .eq('company_id', company.company_id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (domainsError) throw domainsError;

      // Add the id field to each domain for tracking
      const processedDomains = (domainsData || []).map(d => ({
        ...d,
        isExisting: true // Flag to indicate this is from database
      }));

      setDomains(processedDomains);
    } catch (error) {
      console.error('Error loading company domains:', error);
      // Fallback to legacy website field if domains table fails
      if (company.website) {
        setDomains([{
          domain: company.website.replace(/^https?:\/\//, ''),
          is_primary: true,
          isLegacy: true // Flag to indicate this came from legacy field
        }]);
      }
    }
  };

  // Handle tag search
  useEffect(() => {
    const fetchTagSuggestions = async () => {
      if (!tagSearchTerm || tagSearchTerm.length < 2) {
        setTagSuggestions([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .ilike('name', `%${tagSearchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out already added tags
        const filteredSuggestions = data.filter(tag =>
          !tags.some(existingTag => (existingTag.tag_id || existingTag.id) === (tag.tag_id || tag.id))
        );
        
        setTagSuggestions(filteredSuggestions);
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
      }
    };
    
    fetchTagSuggestions();
  }, [tagSearchTerm, tags]);

  // Handle city search
  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (!citySearchTerm || citySearchTerm.length < 2) {
        setCitySuggestions([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .ilike('name', `%${citySearchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out already added cities
        const filteredSuggestions = data.filter(city =>
          !cities.some(existingCity => (existingCity.city_id || existingCity.id) === (city.city_id || city.id))
        );
        
        setCitySuggestions(filteredSuggestions);
        setShowCitySuggestions(filteredSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      }
    };
    
    fetchCitySuggestions();
  }, [citySearchTerm, cities]);


  // Handle domain add/remove
  const handleAddDomain = () => {
    const domainToAdd = domainSearchTerm.trim();
    if (!domainToAdd) return;

    // Clean up the domain (remove protocol, trailing slash)
    const cleanDomain = domainToAdd.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Check if domain already exists
    if (domains.some(d => d.domain === cleanDomain)) {
      setError('Domain already exists');
      return;
    }

    const newDomain = {
      domain: cleanDomain,
      is_primary: domains.length === 0, // First domain is primary by default
      isNew: true // Flag to indicate this is a new domain
    };

    setDomains([...domains, newDomain]);
    setDomainSearchTerm('');
    setError(''); // Clear any previous errors
  };

  const handleRemoveDomain = (domainToRemove) => {
    const updatedDomains = domains.filter(d => d.domain !== domainToRemove.domain);

    // If we removed the primary domain, make the first remaining domain primary
    if (domainToRemove.is_primary && updatedDomains.length > 0) {
      updatedDomains[0].is_primary = true;
    }

    setDomains(updatedDomains);
  };

  const handleSetPrimaryDomain = (domainToMakePrimary) => {
    setDomains(domains.map(d => ({
      ...d,
      is_primary: d.domain === domainToMakePrimary.domain
    })));
  };

  // Handle tag add/remove
  const handleAddTag = async (tag) => {
    setTags([...tags, tag]);
    setTagSearchTerm('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId) => {
    setTags(tags.filter(tag => (tag.tag_id || tag.id) !== tagId));
  };

  const handleCreateTag = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: tagSearchTerm.trim() })
        .select()
        .single();

      if (error) throw error;

      handleAddTag(data);
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag: ' + error.message);
    }
  };
  
  // Handle city add/remove
  const handleAddCity = (city) => {
    setCities([...cities, city]);
    setCitySearchTerm('');
    setShowCitySuggestions(false);
  };
  
  const handleRemoveCity = (cityId) => {
    setCities(cities.filter(city => (city.city_id || city.id) !== cityId));
  };
  
  const handleCreateCity = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert({ name: citySearchTerm.trim() })
        .select()
        .single();
        
      if (error) throw error;
      
      handleAddCity(data);
    } catch (error) {
      console.error('Error creating city:', error);
      setError('Failed to create city: ' + error.message);
    }
  };
  

  // Save the company (can optionally close modal or move to next tab)
  const handleSave = async (options = { closeAfter: false, nextTab: false }) => {
    setError('');

    // Validate required fields
    if (!companyName.trim()) {
      setError('Company name is required');
      setActiveTab('infos');
      return false;
    }

    if (!companyCategory) {
      setError('Company category is required');
      setActiveTab('infos');
      return false;
    }

    try {
      setLoading(true);

      let formattedLinkedin = companyLinkedin.trim();

      // Update company (remove website field since we now use company_domains)
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          name: companyName.trim(),
          linkedin: formattedLinkedin,
          category: companyCategory,
          description: companyDescription.trim(),
          last_modified_at: new Date()
        })
        .eq('company_id', company.company_id)
        .select();

      if (updateError) throw updateError;

      // Handle domains relationships
      // First, get existing domain relationships
      const { data: existingDomains, error: existingDomainsError } = await supabase
        .from('company_domains')
        .select('id, domain, is_primary')
        .eq('company_id', company.company_id);

      if (existingDomainsError) throw existingDomainsError;

      // Determine which domains to add, update, and remove
      const existingDomainsList = (existingDomains || []).map(d => d.domain);
      const newDomainsList = domains.map(d => d.domain);

      // Debug logging
      console.log('Domains state:', domains);
      console.log('Existing domains in DB:', existingDomainsList);
      console.log('New domains list:', newDomainsList);

      // Find domains to add - either marked as new OR not in existing list (but not already in DB)
      const domainsToAdd = domains.filter(d => (d.isNew || !d.isExisting) && !existingDomainsList.includes(d.domain));
      const domainsToRemove = (existingDomains || []).filter(d => !newDomainsList.includes(d.domain));
      const domainsToUpdate = domains.filter(d => d.isExisting && existingDomainsList.includes(d.domain));

      console.log('Domains to add:', domainsToAdd);
      console.log('Domains to remove:', domainsToRemove);

      // Remove domains that are no longer associated
      if (domainsToRemove.length > 0) {
        const { error: removeDomainsError } = await supabase
          .from('company_domains')
          .delete()
          .eq('company_id', company.company_id)
          .in('id', domainsToRemove.map(d => d.id));

        if (removeDomainsError) throw removeDomainsError;
      }

      // Add new domains
      if (domainsToAdd.length > 0) {
        const domainConnections = domainsToAdd.map(domain => ({
          company_id: company.company_id,
          domain: domain.domain,
          is_primary: domain.is_primary
        }));

        const { error: addDomainsError } = await supabase
          .from('company_domains')
          .insert(domainConnections);

        if (addDomainsError) throw addDomainsError;
      }

      // Update existing domains (mainly for primary status changes)
      for (const domain of domainsToUpdate) {
        const existingDomain = existingDomains.find(d => d.domain === domain.domain);
        if (existingDomain && existingDomain.is_primary !== domain.is_primary) {
          const { error: updateDomainError } = await supabase
            .from('company_domains')
            .update({ is_primary: domain.is_primary })
            .eq('id', existingDomain.id);

          if (updateDomainError) throw updateDomainError;
        }
      }
      
      // Handle tags relationships
      // First, get existing tag relationships
      const { data: existingTags, error: existingTagsError } = await supabase
        .from('company_tags')
        .select('tag_id')
        .eq('company_id', company.company_id);
        
      if (existingTagsError) throw existingTagsError;
      
      // Determine which tags to add and which to remove
      const existingTagIds = existingTags.map(tag => tag.tag_id);
      const newTagIds = tags.map(tag => tag.tag_id || tag.id);

      const tagsToAdd = newTagIds.filter(id => !existingTagIds.includes(id));
      const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));

      // Remove tags that are no longer associated
      if (tagsToRemove.length > 0) {
        const { error: removeTagsError } = await supabase
          .from('company_tags')
          .delete()
          .eq('company_id', company.company_id)
          .in('tag_id', tagsToRemove);

        if (removeTagsError) throw removeTagsError;
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        const tagConnections = tagsToAdd.map(tagId => ({
          company_id: company.company_id,
          tag_id: tagId
        }));

        const { error: addTagsError } = await supabase
          .from('company_tags')
          .insert(tagConnections);

        if (addTagsError) throw addTagsError;
      }
      
      // Handle cities relationships
      // First, get existing city relationships
      const { data: existingCities, error: existingCitiesError } = await supabase
        .from('company_cities')
        .select('city_id')
        .eq('company_id', company.company_id);

      if (existingCitiesError) throw existingCitiesError;

      // Determine which cities to add and which to remove
      const existingCityIds = existingCities.map(city => city.city_id);
      const newCityIds = cities.map(city => city.city_id || city.id);

      const citiesToAdd = newCityIds.filter(id => !existingCityIds.includes(id));
      const citiesToRemove = existingCityIds.filter(id => !newCityIds.includes(id));

      // Remove cities that are no longer associated
      if (citiesToRemove.length > 0) {
        const { error: removeCitiesError } = await supabase
          .from('company_cities')
          .delete()
          .eq('company_id', company.company_id)
          .in('city_id', citiesToRemove);

        if (removeCitiesError) throw removeCitiesError;
      }

      // Add new cities
      if (citiesToAdd.length > 0) {
        const cityConnections = citiesToAdd.map(cityId => ({
          company_id: company.company_id,
          city_id: cityId
        }));

        const { error: addCitiesError } = await supabase
          .from('company_cities')
          .insert(cityConnections);

        if (addCitiesError) throw addCitiesError;
      }
      
      setMessage({ type: 'success', text: 'Company updated successfully' });

      // Handle next actions based on options
      if (options.closeAfter) {
        setTimeout(() => {
          onRequestClose();
        }, 500);
      } else if (options.nextTab) {
        handleNextTab();
      }

      return true;

    } catch (error) {
      console.error('Error updating company:', error);
      setError('Failed to update company: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Form submit handler (for final save)
  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSave({ closeAfter: true });
  };

  // Save and move to next tab
  const handleSaveAndNext = async () => {
    await handleSave({ nextTab: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ color: '#6b7280', fontSize: '1rem' }}>Edit:</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{
                border: 'none',
                borderBottom: '2px solid transparent',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                background: 'transparent',
                padding: '4px 8px',
                margin: 0,
                flex: 1,
                minWidth: 0,
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderBottomColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
              placeholder="Company name"
            />
          </div>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {message.text && <Message className={message.type}>{message.text}</Message>}
        
        {/* Tab Navigation */}
        <TabContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              type="button"
            >
              <span style={{ marginRight: '6px' }}>{tab.icon}</span>
              {tab.label}
            </Tab>
          ))}
        </TabContainer>

        <form onSubmit={handleSubmit}>
          {/* Duplicates Tab */}
          <TabContent $active={activeTab === 'duplicates'}>
            <Section>
              <SectionTitle>Potential Duplicates</SectionTitle>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
                Companies matched by name and domain (exact and fuzzy matching).
              </p>

              {/* Manual search */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Input
                  type="text"
                  value={duplicateSearchTerm}
                  onChange={(e) => setDuplicateSearchTerm(e.target.value)}
                  placeholder="Search for a company..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualDuplicateSearch();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  className="secondary"
                  onClick={handleManualDuplicateSearch}
                  disabled={loadingDuplicates || !duplicateSearchTerm.trim()}
                >
                  <FiSearch size={14} style={{ marginRight: '4px' }} />
                  Search
                </Button>
              </div>

              {loadingDuplicates ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Searching for duplicates...
                </div>
              ) : potentialDuplicates.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '30px',
                  background: '#d1fae5',
                  borderRadius: '8px',
                  color: '#065f46'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
                  <div style={{ fontWeight: 500 }}>No duplicates found</div>
                  <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>This company appears to be unique.</div>
                </div>
              ) : (
                <ListContainer style={{ maxHeight: '350px' }}>
                  {potentialDuplicates.map((dup) => (
                    <ListItem key={dup.company_id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <ListItemText>
                          <div style={{ fontWeight: 500 }}>{dup.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {dup.category || 'No category'} {dup.website && `• ${dup.website}`}
                          </div>
                        </ListItemText>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <Button
                            type="button"
                            className="secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => window.open(`/company/${dup.company_id}`, '_blank')}
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none'
                            }}
                            onClick={() => handleMergeCompany(dup)}
                            disabled={loadingDuplicates}
                          >
                            Merge
                          </Button>
                        </div>
                      </div>
                      {/* Match type badges */}
                      {dup.matchTypes && dup.matchTypes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {dup.matchTypes.map((match, idx) => {
                            const isExact = match.type.includes('exact');
                            const isDomain = match.type.includes('domain');
                            const bgColor = isExact
                              ? (isDomain ? '#fee2e2' : '#fef3c7')
                              : (isDomain ? '#fce7f3' : '#e0f2fe');
                            const textColor = isExact
                              ? (isDomain ? '#b91c1c' : '#92400e')
                              : (isDomain ? '#9d174d' : '#0369a1');

                            return (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: bgColor,
                                  color: textColor,
                                  fontWeight: 500
                                }}
                              >
                                {match.label}
                                {match.score && ` (${match.score}%)`}
                                {match.domain && `: ${match.domain}`}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </ListItem>
                  ))}
                </ListContainer>
              )}
            </Section>
          </TabContent>

          {/* Infos Tab (merged Basic Info + Links) */}
          <TabContent $active={activeTab === 'infos'}>
            <Section>
              <FormGroup>
                <Label htmlFor="companyCategory">Category *</Label>
                <Select
                  id="companyCategory"
                  value={companyCategory}
                  onChange={(e) => setCompanyCategory(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {COMPANY_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="companyDescription">Description</Label>
                <TextArea
                  id="companyDescription"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Enter company description"
                  rows="3"
                />
              </FormGroup>

              <SectionTitle style={{ marginTop: '24px' }}>Domains</SectionTitle>

              {domains.length > 0 && (
                <ListContainer>
                  {domains.map((domain, index) => (
                    <ListItem key={`domain-${domain.domain}-${index}`}>
                      <ListItemText>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{domain.domain}</span>
                          {domain.is_primary && (
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#3b82f6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              Primary
                            </span>
                          )}
                        </div>
                      </ListItemText>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {!domain.is_primary && domains.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryDomain(domain)}
                            style={{
                              background: 'none',
                              border: '1px solid #d1d5db',
                              cursor: 'pointer',
                              color: '#6b7280',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            Set Primary
                          </button>
                        )}
                        <RemoveButton
                          onClick={() => handleRemoveDomain(domain)}
                          type="button"
                        >
                          ×
                        </RemoveButton>
                      </div>
                    </ListItem>
                  ))}
                </ListContainer>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Input
                  type="text"
                  value={domainSearchTerm}
                  onChange={(e) => setDomainSearchTerm(e.target.value)}
                  placeholder="example.com"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  className="secondary"
                  onClick={handleAddDomain}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <FiPlus size={14} style={{ marginRight: '4px' }} />
                  Add
                </Button>
              </div>

              <FormGroup style={{ marginTop: '20px' }}>
                <Label htmlFor="companyLinkedin">LinkedIn</Label>
                <Input
                  id="companyLinkedin"
                  type="text"
                  value={companyLinkedin}
                  onChange={(e) => setCompanyLinkedin(e.target.value)}
                  placeholder="LinkedIn URL or username"
                />
              </FormGroup>

              {/* Enrich with Apollo button */}
              <Button
                type="button"
                style={{
                  marginTop: '20px',
                  width: '100%',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => setEnrichmentModalOpen(true)}
              >
                <FiZap size={16} />
                Enrich with Apollo (LinkedIn, Logo, Description)
              </Button>

            </Section>
          </TabContent>

          {/* Related Tab */}
          <TabContent $active={activeTab === 'related'}>
            <Section>
              <SectionTitle>Tags</SectionTitle>

              <TagsContainer>
                {tags.map((tag, index) => {
                  const color = getTagColor(tag.name);
                  const tagId = tag.tag_id || tag.id || index;
                  return (
                    <Tag
                      key={`tag-${tagId}-${index}`}
                      color={color.bg}
                      $textColor={color.text}
                    >
                      {tag.name}
                      <TagRemoveButton
                        onClick={() => handleRemoveTag(tagId)}
                        type="button"
                      >
                        ×
                      </TagRemoveButton>
                    </Tag>
                  );
                })}
              </TagsContainer>

              <TagInput>
                <Input
                  type="text"
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  placeholder="Search for tags or add new ones"
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                />

                {showTagSuggestions && (
                  <SuggestionsContainer>
                    {tagSuggestions.map((tag, index) => (
                      <Suggestion
                        key={`suggestion-${tag.id || tag.tag_id}-${index}`}
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag.name}
                      </Suggestion>
                    ))}

                    {tagSearchTerm.trim() && !tagSuggestions.some(tag =>
                      tag.name.toLowerCase() === tagSearchTerm.toLowerCase()
                    ) && (
                      <NewTagButton onClick={handleCreateTag}>
                        <FiPlus size={14} />
                        Create "{tagSearchTerm}"
                      </NewTagButton>
                    )}
                  </SuggestionsContainer>
                )}
              </TagInput>
            </Section>

            <Section style={{ marginTop: '30px' }}>
              <SectionTitle>Cities</SectionTitle>

              {cities.length > 0 && (
                <ListContainer>
                  {cities.map((city, index) => {
                    const cityId = city.city_id || city.id || index;
                    return (
                      <ListItem key={`city-${cityId}-${index}`}>
                        <ListItemText>
                          {getFlagEmoji(city.name) && (
                            <span style={{ marginRight: '5px' }}>
                              {getFlagEmoji(city.name)}
                            </span>
                          )}
                          {city.name}
                        </ListItemText>
                        <RemoveButton
                          onClick={() => handleRemoveCity(cityId)}
                          type="button"
                        >
                          ×
                        </RemoveButton>
                      </ListItem>
                    );
                  })}
                </ListContainer>
              )}

              <TagInput>
                <Input
                  type="text"
                  value={citySearchTerm}
                  onChange={(e) => setCitySearchTerm(e.target.value)}
                  placeholder="Search for cities or add new ones"
                  onFocus={() => {
                    if (citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                />

                {showCitySuggestions && (
                  <SuggestionsContainer>
                    {citySuggestions.map((city, index) => (
                      <Suggestion
                        key={`city-suggestion-${city.city_id || city.id}-${index}`}
                        onClick={() => handleAddCity(city)}
                      >
                        {getFlagEmoji(city.name) && (
                          <span style={{ marginRight: '5px' }}>
                            {getFlagEmoji(city.name)}
                          </span>
                        )}
                        {city.name}
                      </Suggestion>
                    ))}

                    {citySearchTerm.trim() && !citySuggestions.some(city =>
                      city.name.toLowerCase() === citySearchTerm.toLowerCase()
                    ) && (
                      <NewTagButton onClick={handleCreateCity}>
                        <FiPlus size={14} />
                        Create "{citySearchTerm}"
                      </NewTagButton>
                    )}
                  </SuggestionsContainer>
                )}
              </TagInput>
            </Section>

          </TabContent>

          {/* Recap Tab */}
          <TabContent $active={activeTab === 'recap'}>
            <Section>
              <SectionTitle>Summary</SectionTitle>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
                Review your changes before saving.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Infos Summary */}
                <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>📝 Infos</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6b7280' }}>Name:</span>
                    <span style={{ fontWeight: 500 }}>{companyName || '-'}</span>
                    <span style={{ color: '#6b7280' }}>Category:</span>
                    <span style={{ fontWeight: 500 }}>{companyCategory || '-'}</span>
                    <span style={{ color: '#6b7280' }}>Description:</span>
                    <span style={{ fontWeight: 500 }}>{companyDescription ? (companyDescription.length > 50 ? companyDescription.substring(0, 50) + '...' : companyDescription) : '-'}</span>
                    <span style={{ color: '#6b7280' }}>Domains:</span>
                    <span style={{ fontWeight: 500 }}>{domains.length > 0 ? domains.map(d => d.domain).join(', ') : '-'}</span>
                    <span style={{ color: '#6b7280' }}>LinkedIn:</span>
                    <span style={{ fontWeight: 500 }}>{companyLinkedin || '-'}</span>
                  </div>
                </div>

                {/* Related Summary */}
                <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>🏷️ Related</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6b7280' }}>Tags:</span>
                    <span style={{ fontWeight: 500 }}>{tags.length > 0 ? tags.map(t => t.name).join(', ') : '-'}</span>
                    <span style={{ color: '#6b7280' }}>Cities:</span>
                    <span style={{ fontWeight: 500 }}>{cities.length > 0 ? cities.map(c => c.name).join(', ') : '-'}</span>
                  </div>
                </div>
              </div>
            </Section>
          </TabContent>

          <ButtonGroup style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <Button
              type="button"
              className="secondary"
              onClick={onRequestClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </ButtonGroup>
        </form>
      </div>

      {/* Enrichment Modal */}
      <CompanyEnrichmentModal
        isOpen={enrichmentModalOpen}
        onClose={() => setEnrichmentModalOpen(false)}
        company={company}
        companyDomains={domains}
        onEnrichComplete={(enrichedData) => {
          // Update local state with enriched data
          if (enrichedData.linkedin) {
            setCompanyLinkedin(enrichedData.linkedin);
          }
          if (enrichedData.description) {
            setCompanyDescription(enrichedData.description);
          }
          setEnrichmentModalOpen(false);
          setMessage({ type: 'success', text: 'Company enriched with Apollo data' });
        }}
      />
    </Modal>
  );
};

export default EditCompanyModal;
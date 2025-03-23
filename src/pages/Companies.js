import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiFilter, FiSearch, FiPlus, FiChevronDown, FiClock, FiAlertCircle, FiRefreshCw, FiGlobe, FiMapPin, FiEdit, FiTag, FiLinkedin } from 'react-icons/fi';
import { FaBuilding, FaEllipsisH, FaTimesCircle } from 'react-icons/fa';
import Modal from 'react-modal';
import CompanyModal from '../components/modals/CompanyModal';
import TagsModal from '../components/modals/TagsModal';
import CityModal from '../components/modals/CityModal';

Modal.setAppElement('#root');

// Styled components matching the Contact page pattern
const PageContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CompanyCount = styled.span`
  font-size: 1rem;
  font-weight: 400;
  color: white;
`;

const Description = styled.p`
  color: white;
  margin: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background-color: #3b82f6;
  color: white;
  border: none;
  
  &:hover {
    background-color: #2563eb;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: transparent;
  color: black;
  border: 1px solid black;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background-color: white;
  border: 1px solid black;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-top: 1rem;
  box-shadow: none;
`;

const SearchDropdown = styled.div`
  position: relative;
  min-width: 140px;
  border-right: 1px solid black;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: black;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid black;
  border-radius: 0.375rem;
  box-shadow: none;
  z-index: 50;
  max-height: 250px;
  overflow-y: auto;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  color: black;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &.active {
    background-color: rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: black;
  border: none;
  outline: none;
  
  &::placeholder {
    color: #555555;
  }
`;

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  color: black;
`;

const ContentSection = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

// Filter buttons styled components
const FilterButtonsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 2rem 0 0.5rem 0;
  margin: 0 1.5rem;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
    padding: 1.5rem 0 0.25rem 0;
    margin: 0 1rem;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.active ? 'black' : 'white'};
  color: ${props => props.active ? 'white' : 'black'};
  border: 1px solid black;
  position: relative;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.active ? '#333333' : 'rgba(0, 0, 0, 0.05)'};
  }
  
  svg {
    font-size: 1rem;
  }
  
  .count {
    margin-left: 0.25rem;
    background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
    padding: 0.125rem 0.375rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }
`;

const NotificationDot = styled.div`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  background-color: black;
  border-radius: 50%;
  border: 2px solid white;
`;

// Company Card Styled Components
const CompaniesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const CompanyCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const CompanyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const CompanyName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
`;

const ActionMenu = styled.div`
  position: relative;
`;

const ActionMenuToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  
  &:hover {
    color: #111827;
  }
`;

const ActionMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  width: 160px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const ActionMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  font-size: 0.875rem;
  color: #4b5563;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const CategoryBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
  margin-right: 8px;
  margin-bottom: 12px;
  background-color: #f3f4f6;
  color: #4b5563;
  cursor: pointer;
  
  &:hover {
    background-color: #e5e7eb;
  }
`;

const CompanyDescription = styled.p`
  color: #4b5563;
  font-size: 0.875rem;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 1rem;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#4b5563'};
  font-weight: 500;
  border: 1px solid ${props => props.textColor || '#4b5563'};
`;

const CitiesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
`;

const CityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  background-color: white;
  color: #4b5563;
  font-weight: 500;
  border: 1px solid #d1d5db;
  
  .flag {
    margin-right: 4px;
  }
`;

const ExternalLinksContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
  
  &:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
  
  svg {
    font-size: 1.25rem;
  }
`;

const RelatedContactsContainer = styled.div`
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
`;

const RelatedContactsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  h4 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
    margin: 0;
  }
`;

const RelatedContactsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ContactBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  background-color: #f3f4f6;
  color: #4b5563;
  font-weight: 500;
`;

const EditableBadge = styled.div`
  display: inline-block;
  position: relative;
`;

// Helper function to get tag colors
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
  
  // Generate a consistent index based on the tag name
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % colors.length;
  
  return colors[index];
};

// Helper function to get flag emoji from city name/country
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

// Category options
const COMPANY_CATEGORIES = [
  'Advisory',
  'Corporation',
  'Institution',
  'Professional Investor',
  'SME',
  'Startup',
  'Supplier',
  'Media',
  'Team'
];

const Companies = () => {
  // State variables
  const [companies, setCompanies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editingCategoryCompanyId, setEditingCategoryCompanyId] = useState(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDescriptionCompanyId, setEditingDescriptionCompanyId] = useState(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Filter counts
  const [filterCounts, setFilterCounts] = useState({
    missingCategory: 0,
    missingCities: 0,
    missingDescription: 0,
    missingTags: 0,
    missingWebsite: 0,
    recentlyCreated: 0,
    recentlyEdited: 0,
    lastInteracted: 0
  });
  
  // Search field options
  const searchFields = [
    { id: 'name', label: 'Company Name' },
    { id: 'contact', label: 'Related Contact' },
    { id: 'website', label: 'Website' },
    { id: 'tags', label: 'Tags' },
    { id: 'category', label: 'Category' }
  ];
  
  // Fetch companies with details (tags, cities, contacts)
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('companies')
        .select(`
          *,
          companies_tags!inner (
            tag_id,
            tags:tag_id (
              id,
              name
            )
          ),
          companies_cities!inner (
            city_id,
            cities:city_id (
              id,
              name
            )
          ),
          contact_companies!inner (
            contact_id,
            contacts:contact_id (
              id,
              first_name,
              last_name,
              last_interaction
            )
          )
        `);
      
      // Apply search filters
      if (searchTerm.length >= 3) {
        if (searchField === 'name') {
          query = query.ilike('name', `%${searchTerm}%`);
        } else if (searchField === 'website') {
          query = query.ilike('website', `%${searchTerm}%`);
        } else if (searchField === 'category') {
          query = query.ilike('category', `%${searchTerm}%`);
        } else if (searchField === 'contact') {
          // This would require a more complex query in a real app
          query = query.filter('contact_companies.contacts.first_name.ilike', `%${searchTerm}%`);
        } else if (searchField === 'tags') {
          query = query.filter('companies_tags.tags.name.ilike', `%${searchTerm}%`);
        }
      }
      
      // Apply active filter
      if (activeFilter) {
        switch (activeFilter) {
          case 'missingCategory':
            query = query.is('category', null);
            break;
          case 'missingCities':
            // This would require a more complex query in a real app
            // For this implementation, we'll filter client-side
            break;
          case 'missingDescription':
            query = query.is('description', null);
            break;
          case 'missingTags':
            // This would require a more complex query in a real app
            // For this implementation, we'll filter client-side
            break;
          case 'missingWebsite':
            query = query.is('website', null);
            break;
          case 'recentlyCreated':
            // All results are sorted by created_at by default
            break;
          case 'recentlyEdited':
            setSortBy('modified_at');
            break;
          case 'lastInteracted':
            // This would require a more complex query in a real app
            // For this implementation, we'll filter client-side
            break;
          default:
            break;
        }
      }
      
      // Apply sorting
      if (sortBy) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc', nullsLast: true });
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data to extract nested objects
      const processedData = data.map(company => {
        const tags = company.companies_tags.map(tagRelation => tagRelation.tags);
        const cities = company.companies_cities.map(cityRelation => cityRelation.cities);
        const contacts = company.contact_companies.map(contactRelation => contactRelation.contacts);
        
        // Remove the nested join data to avoid confusion
        const { companies_tags, companies_cities, contact_companies, ...companyData } = company;
        
        return {
          ...companyData,
          tags,
          cities,
          contacts
        };
      });
      
      // Apply client-side filters for complex cases
      let filteredData = processedData;
      if (activeFilter === 'missingCities') {
        filteredData = processedData.filter(company => company.cities.length === 0);
      } else if (activeFilter === 'missingTags') {
        filteredData = processedData.filter(company => company.tags.length === 0);
      } else if (activeFilter === 'lastInteracted') {
        // Sort by the most recent last_interaction of any contact
        filteredData = processedData.sort((a, b) => {
          const aLatest = a.contacts.reduce((latest, contact) => {
            if (!contact.last_interaction) return latest;
            return contact.last_interaction > latest ? contact.last_interaction : latest;
          }, '0000-00-00');
          
          const bLatest = b.contacts.reduce((latest, contact) => {
            if (!contact.last_interaction) return latest;
            return contact.last_interaction > latest ? contact.last_interaction : latest;
          }, '0000-00-00');
          
          return sortOrder === 'desc' ? 
            new Date(bLatest) - new Date(aLatest) : 
            new Date(aLatest) - new Date(bLatest);
        });
      }
      
      setCompanies(filteredData);
      setFilteredCount(filteredData.length);
      
      // Update filter counts
      await fetchFilterCounts();
      
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch total count and filter counts
  const fetchFilterCounts = async () => {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Get missing category count
      const { count: missingCategoryCount, error: categoryError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .is('category', null);
      
      if (categoryError) throw categoryError;
      
      // Get missing description count
      const { count: missingDescriptionCount, error: descriptionError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .is('description', null);
      
      if (descriptionError) throw descriptionError;
      
      // Get missing website count
      const { count: missingWebsiteCount, error: websiteError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .is('website', null);
      
      if (websiteError) throw websiteError;
      
      // For missing tags and cities, we'd need custom SQL in a real app
      // Here we'll just set placeholder values
      
      setFilterCounts({
        missingCategory: missingCategoryCount || 0,
        missingCities: 0, // Placeholder
        missingDescription: missingDescriptionCount || 0,
        missingTags: 0, // Placeholder
        missingWebsite: missingWebsiteCount || 0,
        recentlyCreated: count || 0, // Using total as placeholder
        recentlyEdited: count || 0, // Using total as placeholder
        lastInteracted: count || 0 // Using total as placeholder
      });
      
    } catch (error) {
      console.error('Error fetching filter counts:', error);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchCompanies();
    fetchFilterCounts();
  }, [refreshTrigger, activeFilter, sortBy, sortOrder]);
  
  // Handle search input change
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 3 || value.length === 0) {
      setActiveFilter(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };
  
  // Handle search field change
  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    setDropdownOpen(false);
    setSearchTerm('');
  };
  
  // Handle filter button click
  const handleFilterButtonClick = (filterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
    setSearchTerm('');
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle creating a new company
  const handleAddCompany = () => {
    setSelectedCompany(null);
    setShowCompanyModal(true);
  };
  
  // Handle opening company modal
  const handleOpenCompanyModal = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };
  
  // Handle opening tags modal
  const handleOpenTagsModal = (company) => {
    setSelectedCompany(company);
    setShowTagsModal(true);
  };
  
  // Handle opening city modal
  const handleOpenCityModal = (company) => {
    setSelectedCompany(company);
    setShowCityModal(true);
  };
  
  // Handle category inline edit
  const handleCategoryClick = (company) => {
    setEditingCategoryCompanyId(company.id);
    setShowCategoryDropdown(true);
  };
  
  // Handle category selection
  const handleCategorySelect = async (category) => {
    if (!editingCategoryCompanyId) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ category, modified_at: new Date() })
        .eq('id', editingCategoryCompanyId)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setCompanies(companies.map(company => 
        company.id === editingCategoryCompanyId ? { ...company, category } : company
      ));
      
      // Clean up
      setEditingCategoryCompanyId(null);
      setShowCategoryDropdown(false);
      
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error updating company category:', error);
    }
  };
  
  // Handle description inline edit
  const handleDescriptionClick = (company) => {
    setEditingDescriptionCompanyId(company.id);
    setEditingDescriptionValue(company.description || '');
    setEditingDescription(true);
  };
  
  // Handle description save
  const handleDescriptionSave = async () => {
    if (!editingDescriptionCompanyId) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ 
          description: editingDescriptionValue.trim(), 
          modified_at: new Date() 
        })
        .eq('id', editingDescriptionCompanyId)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setCompanies(companies.map(company => 
        company.id === editingDescriptionCompanyId ? 
          { ...company, description: editingDescriptionValue.trim() } : 
          company
      ));
      
      // Clean up
      setEditingDescriptionCompanyId(null);
      setEditingDescriptionValue('');
      setEditingDescription(false);
      
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error updating company description:', error);
    }
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setShowCompanyModal(false);
    setShowTagsModal(false);
    setShowCityModal(false);
    setSelectedCompany(null);
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle action menu toggle
  const handleActionMenuToggle = (companyId) => {
    setActionMenuOpen(actionMenuOpen === companyId ? null : companyId);
  };
  
  // Get filter title based on active filter
  const getFilterTitle = () => {
    if (!activeFilter) return "All Companies";
    
    switch (activeFilter) {
      case 'missingCategory': return "Missing Category";
      case 'missingCities': return "Missing Cities";
      case 'missingDescription': return "Missing Description";
      case 'missingTags': return "Missing Tags";
      case 'missingWebsite': return "Missing Website";
      case 'recentlyCreated': return "Recently Created";
      case 'recentlyEdited': return "Recently Edited";
      case 'lastInteracted': return "Recently Interacted";
      default: return "All Companies";
    }
  };
  
  // Format the company name for display
  const formatCompanyName = (name) => {
    return name || "Unnamed Company";
  };
  
  // Format the contact name for display
  const formatContactName = (contact) => {
    if (!contact) return "";
    return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
  };
  
  // Get website display format
  const getWebsiteDisplay = (website) => {
    if (!website) return null;
    let url = website;
    
    // Handle protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Extract domain for display
    let domain = url.replace(/^https?:\/\//, '');
    domain = domain.split('/')[0];
    
    return { url, domain };
  };
  
  // Description truncation for display
  const getTruncatedDescription = (description, limit = 150) => {
    if (!description) return "No description available";
    
    if (description.length <= limit) return description;
    
    return description.substring(0, limit) + "...";
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <HeaderContent>
          <HeaderTitle>
            <Title>
              {getFilterTitle()}
              {filteredCount > 0 && (
                <CompanyCount>({filteredCount})</CompanyCount>
              )}
            </Title>
            <Description>
              View and manage your company database
            </Description>
          </HeaderTitle>
          
          <HeaderActions>
            <SecondaryButton onClick={handleRefresh} title="Refresh companies">
              <FiRefreshCw />
              Refresh
            </SecondaryButton>
            <PrimaryButton onClick={handleAddCompany}>
              <FiPlus />
              Add Company
            </PrimaryButton>
          </HeaderActions>
        </HeaderContent>
        
        <SearchContainer>
          <SearchDropdown>
            <DropdownButton onClick={() => setDropdownOpen(!dropdownOpen)}>
              {searchFields.find(f => f.id === searchField)?.label}
              <FiChevronDown />
            </DropdownButton>
            <DropdownMenu isOpen={dropdownOpen}>
              {searchFields.map(field => (
                <DropdownItem 
                  key={field.id}
                  className={field.id === searchField ? 'active' : ''}
                  onClick={() => handleSearchFieldChange(field.id)}
                >
                  {field.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </SearchDropdown>
          <SearchInput 
            type="text" 
            placeholder={`Search by ${searchFields.find(f => f.id === searchField)?.label.toLowerCase()}...`} 
            value={searchTerm}
            onChange={handleSearch}
          />
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
        </SearchContainer>
        
        <FilterButtonsContainer>
          <FilterButton 
            active={activeFilter === 'recentlyCreated'} 
            onClick={() => handleFilterButtonClick('recentlyCreated')}
          >
            <FiClock />
            Recently Created
            <span className="count">{filterCounts.recentlyCreated}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'recentlyEdited'} 
            onClick={() => handleFilterButtonClick('recentlyEdited')}
          >
            <FiEdit />
            Recently Edited
            <span className="count">{filterCounts.recentlyEdited}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'lastInteracted'} 
            onClick={() => handleFilterButtonClick('lastInteracted')}
          >
            <FiAlertCircle />
            Last Interacted
            <span className="count">{filterCounts.lastInteracted}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingCategory'} 
            onClick={() => handleFilterButtonClick('missingCategory')}
          >
            <FaBuilding />
            Missing Category
            <span className="count">{filterCounts.missingCategory}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingCities'} 
            onClick={() => handleFilterButtonClick('missingCities')}
          >
            <FiMapPin />
            Missing Cities
            <span className="count">{filterCounts.missingCities}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingDescription'} 
            onClick={() => handleFilterButtonClick('missingDescription')}
          >
            <FiEdit />
            Missing Description
            <span className="count">{filterCounts.missingDescription}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingTags'} 
            onClick={() => handleFilterButtonClick('missingTags')}
          >
            <FiTag />
            Missing Tags
            <span className="count">{filterCounts.missingTags}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingWebsite'} 
            onClick={() => handleFilterButtonClick('missingWebsite')}
          >
            <FiGlobe />
            Missing Website
            <span className="count">{filterCounts.missingWebsite}</span>
          </FilterButton>
        </FilterButtonsContainer>
      </PageHeader>
      
      <ContentSection>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No companies found. Try changing your search or filter criteria.</p>
          </div>
        ) : (
          <CompaniesGrid>
            {companies.map(company => (
              <CompanyCard key={company.id}>
                <CompanyHeader>
                  <CompanyName title={company.name}>
                    {formatCompanyName(company.name)}
                  </CompanyName>
                  <ActionMenu>
                    <ActionMenuToggle 
                      onClick={() => handleActionMenuToggle(company.id)}
                      title="Company actions"
                    >
                      <FaEllipsisH />
                    </ActionMenuToggle>
                    <ActionMenuDropdown isOpen={actionMenuOpen === company.id}>
                      <ActionMenuItem onClick={() => handleOpenCompanyModal(company)}>
                        <FiEdit size={14} />
                        Edit Company
                      </ActionMenuItem>
                      <ActionMenuItem onClick={() => handleOpenTagsModal(company)}>
                        <FiTag size={14} />
                        Manage Tags
                      </ActionMenuItem>
                      <ActionMenuItem onClick={() => handleOpenCityModal(company)}>
                        <FiMapPin size={14} />
                        Manage Cities
                      </ActionMenuItem>
                    </ActionMenuDropdown>
                  </ActionMenu>
                </CompanyHeader>
                
                <EditableBadge>
                  <CategoryBadge 
                    onClick={() => handleCategoryClick(company)}
                    title="Click to edit category"
                  >
                    {company.category || "Uncategorized"}
                  </CategoryBadge>
                  {showCategoryDropdown && editingCategoryCompanyId === company.id && (
                    <DropdownMenu isOpen={true} style={{ 
                      position: 'absolute', 
                      top: '30px', 
                      left: '0',
                      width: '200px', 
                      zIndex: 100
                    }}>
                      {COMPANY_CATEGORIES.map(category => (
                        <DropdownItem 
                          key={category} 
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  )}
                </EditableBadge>
                
                <div>
                  {editingDescription && editingDescriptionCompanyId === company.id ? (
                    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                      <textarea
                        style={{ 
                          width: '100%', 
                          minHeight: '80px', 
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                        value={editingDescriptionValue}
                        onChange={e => setEditingDescriptionValue(e.target.value)}
                      />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        marginTop: '5px',
                        gap: '5px'
                      }}>
                        <button onClick={() => setEditingDescription(false)} style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          background: 'white'
                        }}>
                          Cancel
                        </button>
                        <button onClick={handleDescriptionSave} style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          background: 'black',
                          color: 'white'
                        }}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CompanyDescription 
                      onClick={() => handleDescriptionClick(company)}
                      title="Click to edit description"
                    >
                      {getTruncatedDescription(company.description)}
                    </CompanyDescription>
                  )}
                </div>
                
                {company.tags && company.tags.length > 0 && (
                  <TagsContainer>
                    {company.tags.slice(0, 3).map(tag => {
                      const color = getTagColor(tag.name);
                      return (
                        <Tag 
                          key={tag.id} 
                          color={color.bg}
                          textColor={color.text}
                        >
                          {tag.name}
                        </Tag>
                      );
                    })}
                    {company.tags.length > 3 && (
                      <Tag>+{company.tags.length - 3} more</Tag>
                    )}
                  </TagsContainer>
                )}
                
                {company.cities && company.cities.length > 0 && (
                  <CitiesContainer>
                    {company.cities.slice(0, 3).map(city => {
                      const flag = getFlagEmoji(city.name);
                      return (
                        <CityBadge key={city.id}>
                          {flag && <span className="flag">{flag}</span>}
                          {city.name}
                        </CityBadge>
                      );
                    })}
                    {company.cities.length > 3 && (
                      <CityBadge>+{company.cities.length - 3} more</CityBadge>
                    )}
                  </CitiesContainer>
                )}
                
                <ExternalLinksContainer>
                  {company.website && getWebsiteDisplay(company.website) && (
                    <ExternalLink 
                      href={getWebsiteDisplay(company.website).url} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FiGlobe />
                      {getWebsiteDisplay(company.website).domain}
                    </ExternalLink>
                  )}
                  {company.linkedin && (
                    <ExternalLink 
                      href={company.linkedin.startsWith('http') ? company.linkedin : `https://linkedin.com/company/${company.linkedin}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FiLinkedin />
                      LinkedIn
                    </ExternalLink>
                  )}
                </ExternalLinksContainer>
                
                {company.contacts && company.contacts.length > 0 && (
                  <RelatedContactsContainer>
                    <RelatedContactsHeader>
                      <h4>Associated Contacts ({company.contacts.length})</h4>
                    </RelatedContactsHeader>
                    <RelatedContactsList>
                      {company.contacts.slice(0, 2).map(contact => (
                        <ContactBadge key={contact.id}>
                          {formatContactName(contact)}
                        </ContactBadge>
                      ))}
                      {company.contacts.length > 2 && (
                        <ContactBadge>+{company.contacts.length - 2} more</ContactBadge>
                      )}
                    </RelatedContactsList>
                  </RelatedContactsContainer>
                )}
              </CompanyCard>
            ))}
          </CompaniesGrid>
        )}
      </ContentSection>
      
      {/* Modals */}
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onRequestClose={handleModalClose}
          contact={selectedCompany}
        />
      )}
      
      {showTagsModal && selectedCompany && (
        <TagsModal
          isOpen={showTagsModal}
          onRequestClose={handleModalClose}
          contact={selectedCompany}
        />
      )}
      
      {showCityModal && selectedCompany && (
        <CityModal
          isOpen={showCityModal}
          onRequestClose={handleModalClose}
          contact={selectedCompany}
        />
      )}
    </PageContainer>
  );
};

export default Companies;
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiFilter, FiSearch, FiPlus, FiChevronDown, FiClock, FiAlertCircle, FiRefreshCw, FiGlobe, FiMapPin, FiEdit, FiTag, FiLinkedin, FiUser } from 'react-icons/fi';
import { FaBuilding, FaEllipsisH, FaTimesCircle } from 'react-icons/fa';
import Modal from 'react-modal';
import Select from 'react-select';
import CompanyModal from '../components/modals/CompanyModal';
import CompanyTagsModal from '../components/modals/CompanyTagsModal';
import CompanyCityModal from '../components/modals/CompanyCityModal';
import CompanyContactsModal from '../components/modals/CompanyContactsModal';
import ContactsModal from '../components/modals/ContactsModal';

Modal.setAppElement('#root');

// Styled components matching the Contact page pattern
const PageContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: 1.5rem 1.5rem 0 1.5rem;
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
  color: black;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CompanyCount = styled.span`
  font-size: 1rem;
  font-weight: 400;
  color: black;
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
  background-color: black;
  color: white;
  border: none;
  
  &:hover {
    background-color: #333;
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
  overflow: visible;
  margin-top: 2rem;
  box-shadow: none;
  position: relative;
  z-index: 1;
`;

// Removed unused dropdown styled components as we're now using a native select

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
  margin: 0;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
    padding: 1.5rem 0 0.25rem 0;
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
  height: 360px;
  display: flex;
  flex-direction: column;
  
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
  flex: 0 0 auto;
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
  margin-bottom: 0;
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
  min-height: 24px;
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: black;
  text-decoration: none;
  font-size: 0.875rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RelatedContactsContainer = styled.div`
  padding: 0;
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
  'Skip',
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editingCategoryCompanyId, setEditingCategoryCompanyId] = useState(null);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const categoryDropdownRef = useRef(null);
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
      
      // First, fetch all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*');
      
      if (companiesError) throw companiesError;
      
      // Set companies with basic data first
      let allCompanies = companiesData.map(company => ({
        ...company,
        tags: [],
        cities: [],
        contacts: []
      }));
      
      // Apply search filters if needed
      if (searchTerm.length >= 3) {
        if (searchField === 'name') {
          allCompanies = allCompanies.filter(company => 
            company.name && company.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (searchField === 'website') {
          allCompanies = allCompanies.filter(company => 
            company.website && company.website.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (searchField === 'category') {
          allCompanies = allCompanies.filter(company => 
            company.category && company.category.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      }
      
      // Apply active filter
      if (activeFilter) {
        switch (activeFilter) {
          case 'missingCategory':
            allCompanies = allCompanies.filter(company => !company.category);
            break;
          case 'missingDescription':
            allCompanies = allCompanies.filter(company => !company.description);
            break;
          case 'missingWebsite':
            allCompanies = allCompanies.filter(company => !company.website);
            break;
          case 'recentlyCreated':
            allCompanies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
          case 'recentlyEdited':
            allCompanies.sort((a, b) => new Date(b.modified_at || 0) - new Date(a.modified_at || 0));
            break;
          default:
            break;
        }
      } else {
        // Default sort by created_at
        allCompanies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      // Now fetch the related data for each entity separately (more reliable)
      try {
        // Fetch tags for all companies
        const { data: tagsData, error: tagsError } = await supabase
          .from('companies_tags')
          .select(`
            company_id,
            tag_id,
            tags:tag_id (id, name)
          `);
          
        if (!tagsError && tagsData) {
          // Group tags by company
          const tagsByCompany = {};
          tagsData.forEach(item => {
            if (item.company_id && item.tags) {
              if (!tagsByCompany[item.company_id]) {
                tagsByCompany[item.company_id] = [];
              }
              tagsByCompany[item.company_id].push(item.tags);
            }
          });
          
          // Add tags to companies
          allCompanies = allCompanies.map(company => ({
            ...company,
            tags: tagsByCompany[company.id] || []
          }));
        }
      } catch (e) {
        console.error('Error fetching tags:', e);
      }
      
      try {
        // Fetch cities for all companies
        const { data: citiesData, error: citiesError } = await supabase
          .from('companies_cities')
          .select(`
            company_id,
            city_id,
            cities:city_id (id, name)
          `);
          
        if (!citiesError && citiesData) {
          // Group cities by company
          const citiesByCompany = {};
          citiesData.forEach(item => {
            if (item.company_id && item.cities) {
              if (!citiesByCompany[item.company_id]) {
                citiesByCompany[item.company_id] = [];
              }
              citiesByCompany[item.company_id].push(item.cities);
            }
          });
          
          // Add cities to companies
          allCompanies = allCompanies.map(company => ({
            ...company,
            cities: citiesByCompany[company.id] || []
          }));
        }
      } catch (e) {
        console.error('Error fetching cities:', e);
      }
      
      try {
        // Fetch contacts for all companies
        const { data: contactsData, error: contactsError } = await supabase
          .from('contact_companies')
          .select(`
            company_id,
            contact_id,
            contacts:contact_id (id, first_name, last_name, last_interaction)
          `);
          
        if (!contactsError && contactsData) {
          // Group contacts by company
          const contactsByCompany = {};
          contactsData.forEach(item => {
            if (item.company_id && item.contacts) {
              if (!contactsByCompany[item.company_id]) {
                contactsByCompany[item.company_id] = [];
              }
              contactsByCompany[item.company_id].push(item.contacts);
            }
          });
          
          // Add contacts to companies
          allCompanies = allCompanies.map(company => ({
            ...company,
            contacts: contactsByCompany[company.id] || []
          }));
        }
      } catch (e) {
        console.error('Error fetching contacts:', e);
      }
      
      // Apply client-side filters that depend on relationships
      if (activeFilter === 'missingCities') {
        allCompanies = allCompanies.filter(company => company.cities.length === 0);
      } else if (activeFilter === 'missingTags') {
        allCompanies = allCompanies.filter(company => company.tags.length === 0);
      } else if (activeFilter === 'lastInteracted') {
        // Sort by the most recent last_interaction of any contact
        allCompanies.sort((a, b) => {
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
      
      // Apply search filters for related entities
      if (searchTerm.length >= 3) {
        if (searchField === 'contact') {
          // First, make sure we have contacts data
          try {
            // For contact search, we need to ensure we have all the contacts data
            const { data: contactsData, error: contactsError } = await supabase
              .from('contact_companies')
              .select(`
                company_id,
                contact_id,
                contacts:contact_id (id, first_name, last_name, email, mobile)
              `);
              
            if (!contactsError && contactsData) {
              // Group contacts by company and update allCompanies
              const contactsByCompany = {};
              contactsData.forEach(item => {
                if (item.company_id && item.contacts) {
                  if (!contactsByCompany[item.company_id]) {
                    contactsByCompany[item.company_id] = [];
                  }
                  contactsByCompany[item.company_id].push(item.contacts);
                }
              });
              
              // Update contacts for all companies
              allCompanies = allCompanies.map(company => ({
                ...company,
                contacts: contactsByCompany[company.id] || []
              }));
            }
          } catch (e) {
            console.error('Error fetching contact data for search:', e);
          }
          
          // Now filter by contacts
          allCompanies = allCompanies.filter(company => 
            company.contacts && company.contacts.some(contact => {
              if (!contact) return false;
              
              const firstName = contact.first_name || '';
              const lastName = contact.last_name || '';
              const email = contact.email || '';
              const mobile = contact.mobile || '';
              
              const fullName = `${firstName} ${lastName}`.toLowerCase();
              const searchLower = searchTerm.toLowerCase();
              
              return (
                fullName.includes(searchLower) ||
                firstName.toLowerCase().includes(searchLower) ||
                lastName.toLowerCase().includes(searchLower) ||
                email.toLowerCase().includes(searchLower) ||
                mobile.toLowerCase().includes(searchLower)
              );
            })
          );
        } else if (searchField === 'tags') {
          allCompanies = allCompanies.filter(company => 
            company.tags.some(tag => 
              tag.name && tag.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
        }
      }
      
      setCompanies(allCompanies);
      setFilteredCount(allCompanies.length);
      
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
      // Get all companies to calculate counts client-side
      const { data: allCompaniesData, error: companiesError } = await supabase
        .from('companies')
        .select('*');
      
      if (companiesError) throw companiesError;
      
      const totalCount = allCompaniesData.length;
      setTotalCount(totalCount);
      
      // Calculate missing fields counts
      const missingCategoryCount = allCompaniesData.filter(c => !c.category).length;
      const missingDescriptionCount = allCompaniesData.filter(c => !c.description).length;
      const missingWebsiteCount = allCompaniesData.filter(c => !c.website).length;
      
      // Get missing tags count
      let missingTagsCount = 0;
      try {
        // Get all companies with tags
        const { data: companiesWithTags } = await supabase
          .from('companies_tags')
          .select('company_id');
        
        // Create a set of company IDs that have tags
        const companyIdsWithTags = new Set();
        if (companiesWithTags) {
          companiesWithTags.forEach(item => {
            if (item.company_id) {
              companyIdsWithTags.add(item.company_id);
            }
          });
        }
        
        // Count companies without tags
        missingTagsCount = allCompaniesData.filter(company => 
          !companyIdsWithTags.has(company.id)
        ).length;
      } catch (e) {
        console.error('Error calculating missing tags count:', e);
      }
      
      // Get missing cities count
      let missingCitiesCount = 0;
      try {
        // Get all companies with cities
        const { data: companiesWithCities } = await supabase
          .from('companies_cities')
          .select('company_id');
        
        // Create a set of company IDs that have cities
        const companyIdsWithCities = new Set();
        if (companiesWithCities) {
          companiesWithCities.forEach(item => {
            if (item.company_id) {
              companyIdsWithCities.add(item.company_id);
            }
          });
        }
        
        // Count companies without cities
        missingCitiesCount = allCompaniesData.filter(company => 
          !companyIdsWithCities.has(company.id)
        ).length;
      } catch (e) {
        console.error('Error calculating missing cities count:', e);
      }
      
      setFilterCounts({
        missingCategory: missingCategoryCount,
        missingCities: missingCitiesCount,
        missingDescription: missingDescriptionCount,
        missingTags: missingTagsCount,
        missingWebsite: missingWebsiteCount,
        recentlyCreated: totalCount, // Using total as reference
        recentlyEdited: totalCount, // Using total as reference
        lastInteracted: totalCount // Using total as reference
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
  
  // Listen for custom events to open contact modal
  useEffect(() => {
    const handleOpenContactModal = (event) => {
      setSelectedContact(event.detail);
      setShowContactModal(true);
    };
    
    window.addEventListener('openContactModal', handleOpenContactModal);
    
    return () => {
      window.removeEventListener('openContactModal', handleOpenContactModal);
    };
  }, []);
  
  // We're using a native select now, so no custom dropdown state needed
  
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
    if (field === searchField) {
      return;
    }
    
    setSearchField(field);
    setSearchTerm('');
    setActiveFilter(null); // Reset any active filters
    
    // If selected related contact, ensure contacts are loaded
    if (field === 'contact') {
      // Trigger a refresh to load the contact data
      setRefreshTrigger(prev => prev + 1);
    }
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
    setSelectedCompany(null); // Set to null to indicate we're creating a new company
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
    console.log('Opening city modal for company:', company.id, company.name);
    setSelectedCompany(company);
    setShowCityModal(true);
  };

  // Handle opening contacts modal
  const handleOpenContactsModal = (company) => {
    console.log('Opening contacts modal for company:', company.id, company.name);
    setSelectedCompany(company);
    setShowContactsModal(true);
  };
  
  // Handle contact click to open contact modal
  const handleContactClick = async (contactId) => {
    if (contactId) {
      try {
        console.log('Opening contact modal for contact ID:', contactId);
        // Fetch full contact details
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();
        
        if (error) throw error;
        
        // Set the selected contact and show the modal
        setSelectedContact(data);
        setShowContactModal(true);
      } catch (error) {
        console.error('Error fetching contact details:', error);
      }
    }
  };
  
  // Handle removing a tag from a company
  const handleRemoveTag = async (companyId, tagId) => {
    try {
      const { error } = await supabase
        .from('companies_tags')
        .delete()
        .eq('company_id', companyId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
      
      // Update local state
      setCompanies(companies.map(company => {
        if (company.id === companyId) {
          return {
            ...company,
            tags: company.tags.filter(tag => tag.id !== tagId)
          };
        }
        return company;
      }));
      
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };
  
  // Handle removing a city from a company
  const handleRemoveCity = async (companyId, cityId) => {
    try {
      const { error } = await supabase
        .from('companies_cities')
        .delete()
        .eq('company_id', companyId)
        .eq('city_id', cityId);
      
      if (error) throw error;
      
      // Update local state
      setCompanies(companies.map(company => {
        if (company.id === companyId) {
          return {
            ...company,
            cities: company.cities.filter(city => city.id !== cityId)
          };
        }
        return company;
      }));
      
    } catch (error) {
      console.error('Error removing city:', error);
    }
  };
  
  // Handle removing a contact from a company
  const handleRemoveContact = async (companyId, contactId) => {
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('company_id', companyId)
        .eq('contact_id', contactId);
      
      if (error) throw error;
      
      // Update local state
      setCompanies(companies.map(company => {
        if (company.id === companyId) {
          return {
            ...company,
            contacts: company.contacts.filter(contact => contact.id !== contactId)
          };
        }
        return company;
      }));
      
    } catch (error) {
      console.error('Error removing contact:', error);
    }
  };
  
  // Click outside handler for category dropdown
  useEffect(() => {
    if (!showCategoryDropdown) return;
    
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setFocusedCategoryIndex(0);
      }
    };
    
    const handleKeyDown = (event) => {
      if (!showCategoryDropdown) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedCategoryIndex(prev => 
            prev < COMPANY_CATEGORIES.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedCategoryIndex(prev => 
            prev > 0 ? prev - 1 : 0
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (editingCategoryCompanyId) {
            handleCategorySelect(COMPANY_CATEGORIES[focusedCategoryIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setShowCategoryDropdown(false);
          setFocusedCategoryIndex(0);
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCategoryDropdown, focusedCategoryIndex, editingCategoryCompanyId]);
  
  // Handle category inline edit
  const handleCategoryClick = (company) => {
    setEditingCategoryCompanyId(company.id);
    setShowCategoryDropdown(true);
    setFocusedCategoryIndex(0); // Reset focused index
  };
  
  // Handle category selection
  const handleCategorySelect = async (category) => {
    if (!editingCategoryCompanyId) return;
    
    // Clean up dropdown state first
    setEditingCategoryCompanyId(null);
    setShowCategoryDropdown(false);
    setFocusedCategoryIndex(0);
    
    // If Skip option was selected, just close the dropdown without making changes
    if (category === 'Skip') {
      return;
    }
    
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
      
      // Clean up and close editor
      setEditingDescriptionCompanyId(null);
      setEditingDescriptionValue('');
      setEditingDescription(false);
      
    } catch (error) {
      console.error('Error updating company description:', error);
    }
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setShowCompanyModal(false);
    setShowTagsModal(false);
    setShowCityModal(false);
    setShowContactsModal(false);
    setShowContactModal(false);
    setSelectedCompany(null);
    setSelectedContact(null);
    // Refresh the companies list to show any newly created company
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
            </Title>
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
          <div 
            id="searchDropdownContainer"
            style={{
              minWidth: '160px',
              borderRight: '1px solid black',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Select
              value={searchFields.find(option => option.id === searchField)}
              onChange={(selectedOption) => handleSearchFieldChange(selectedOption.id)}
              options={searchFields}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.id}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                container: (provided) => ({
                  ...provided,
                  width: '100%',
                  zIndex: 9999,
                }),
                control: (provided) => ({
                  ...provided,
                  border: 'none',
                  boxShadow: 'none',
                  background: 'none',
                  minHeight: 'unset',
                  padding: '0.2rem 0',
                  cursor: 'pointer'
                }),
                indicatorSeparator: () => ({
                  display: 'none'
                }),
                dropdownIndicator: (provided) => ({
                  ...provided,
                  padding: '0 8px',
                  color: 'black'
                }),
                menu: (provided) => ({
                  ...provided,
                  width: '100%',
                  marginTop: '2px',
                  borderRadius: '0.375rem',
                  border: '1px solid black',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 9999,
                  position: 'absolute'
                }),
                menuPortal: (provided) => ({
                  ...provided,
                  zIndex: 9999
                }),
                option: (provided, state) => ({
                  ...provided,
                  padding: '0.5rem 1rem',
                  color: state.isFocused ? 'white' : state.isSelected ? 'black' : 'black',
                  backgroundColor: state.isFocused ? 'black' : 'white',
                  fontWeight: state.isSelected ? '600' : 'normal',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'black',
                    color: 'white'
                  }
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: 'black',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }),
                valueContainer: (provided) => ({
                  ...provided,
                  padding: '0 8px',
                })
              }}
            />
          </div>
          <SearchInput 
            type="text" 
            placeholder={`Search by ${searchField === 'name' ? 'company name' : searchFields.find(f => f.id === searchField)?.label.toLowerCase()}...`} 
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
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'recentlyEdited'} 
            onClick={() => handleFilterButtonClick('recentlyEdited')}
          >
            <FiEdit />
            Recently Edited
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'lastInteracted'} 
            onClick={() => handleFilterButtonClick('lastInteracted')}
          >
            <FiAlertCircle />
            Last Interacted
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingCategory'} 
            onClick={() => handleFilterButtonClick('missingCategory')}
          >
            <FaBuilding />
            Missing Category
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingCities'} 
            onClick={() => handleFilterButtonClick('missingCities')}
          >
            <FiMapPin />
            Missing Cities
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingDescription'} 
            onClick={() => handleFilterButtonClick('missingDescription')}
          >
            <FiEdit />
            Missing Description
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingTags'} 
            onClick={() => handleFilterButtonClick('missingTags')}
          >
            <FiTag />
            Missing Tags
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
                {/* SECTION 1: Title & Actions - Fixed Height */}
                <div style={{ height: "40px", marginBottom: "0" }}>
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
                </div>
                
                {/* SECTION 2: Category - Fixed Height */}
                <div style={{ height: "24px", marginTop: "-4px", marginBottom: "6px" }}>
                  <EditableBadge>
                    <CategoryBadge 
                      onClick={() => handleCategoryClick(company)}
                      title="Click to edit category"
                    >
                      {company.category || "Uncategorized"}
                    </CategoryBadge>
                    {showCategoryDropdown && editingCategoryCompanyId === company.id && (
                      <div 
                        ref={categoryDropdownRef}
                        style={{ 
                          position: 'absolute', 
                          top: '30px', 
                          left: '0',
                          width: '200px', 
                          zIndex: 100,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          overflow: 'hidden'
                        }}
                      >
                        {COMPANY_CATEGORIES.map((category, index) => (
                          <button 
                            key={category} 
                            onClick={() => handleCategorySelect(category)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.5rem 1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              color: 'black',
                              background: index === focusedCategoryIndex ? 'rgba(0, 0, 0, 0.1)' : 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: index === focusedCategoryIndex ? '500' : 'normal'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                              setFocusedCategoryIndex(index);
                            }}
                            onMouseOut={(e) => {
                              if (index !== focusedCategoryIndex) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                  </EditableBadge>
                </div>
                
                {/* SECTION 3: Description - Fixed Height */}
                <div style={{ height: "60px", marginBottom: "14px" }}>
                  {editingDescription && editingDescriptionCompanyId === company.id ? (
                    <div>
                      <textarea
                        style={{ 
                          width: '100%', 
                          height: '40px', 
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                        value={editingDescriptionValue}
                        onChange={e => setEditingDescriptionValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            setEditingDescription(false);
                            setEditingDescriptionCompanyId(null);
                          } else if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleDescriptionSave();
                          }
                        }}
                        autoFocus
                      />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        marginTop: '5px',
                        gap: '5px'
                      }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: '#6b7280', 
                          marginRight: 'auto',
                          alignSelf: 'center'
                        }}>
                          Press Esc to cancel, Enter to save
                        </span>
                        <button 
                          onClick={() => {
                            setEditingDescription(false);
                            setEditingDescriptionCompanyId(null);
                          }} 
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            background: 'white'
                          }}
                        >
                          Cancel
                        </button>
                        <button onClick={handleDescriptionSave} style={{
                          padding: '2px 6px',
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
                
                {/* SECTION 4: Tags - Fixed Height */}
                <div style={{ height: "60px", marginBottom: "16px", overflow: "hidden" }}>
                  <TagsContainer>
                    {company.tags && company.tags.length > 0 ? (
                      <>
                        {company.tags.slice(0, 3).map(tag => {
                          const color = getTagColor(tag.name);
                          return (
                            <Tag 
                              key={tag.id} 
                              color={color.bg}
                              textColor={color.text}
                            >
                              {tag.name}
                              <span 
                                style={{ 
                                  marginLeft: '4px', 
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '10px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTag(company.id, tag.id);
                                }}
                                title="Remove tag"
                              >
                                ×
                              </span>
                            </Tag>
                          );
                        })}
                        {company.tags.length > 3 && (
                          <Tag 
                            title={company.tags.slice(3).map(tag => tag.name).join(', ')}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOpenTagsModal(company)}
                          >
                            +{company.tags.length - 3} more
                          </Tag>
                        )}
                        <Tag 
                          color="white" 
                          textColor="black"
                          style={{ 
                            cursor: 'pointer', 
                            minWidth: '22px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            border: '1px solid black'
                          }}
                          onClick={() => handleOpenTagsModal(company)}
                        >
                          +
                        </Tag>
                      </>
                    ) : (
                      <Tag 
                        color="white" 
                        textColor="black"
                        style={{ cursor: 'pointer', border: '1px solid black' }}
                        onClick={() => handleOpenTagsModal(company)}
                      >
                        + Add Tags
                      </Tag>
                    )}
                  </TagsContainer>
                </div>
                
                {/* SECTION 5: Cities - Fixed Height */}
                <div style={{ height: "30px", marginBottom: "0", overflow: "hidden" }}>
                  <CitiesContainer>
                    {company.cities && company.cities.length > 0 ? (
                      <>
                        {company.cities.slice(0, 3).map(city => {
                          const flag = getFlagEmoji(city.name);
                          return (
                            <CityBadge 
                              key={city.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleOpenCityModal(company)}
                            >
                              {flag && <span className="flag">{flag}</span>}
                              {city.name}
                              <span 
                                style={{ 
                                  marginLeft: '4px', 
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '10px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCity(company.id, city.id);
                                }}
                                title="Remove city"
                              >
                                ×
                              </span>
                            </CityBadge>
                          );
                        })}
                        {company.cities.length > 3 && (
                          <CityBadge 
                            title={company.cities.slice(3).map(city => city.name).join(', ')}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOpenCityModal(company)}
                          >
                            +{company.cities.length - 3} more
                          </CityBadge>
                        )}
                      </>
                    ) : (
                      <CityBadge 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenCityModal(company)}
                      >
                        + Add City
                      </CityBadge>
                    )}
                  </CitiesContainer>
                </div>
                
                {/* SECTION 6: Links - Fixed Height */}
                <div style={{ 
                  height: "40px",
                  marginTop: "15px",
                  marginBottom: "5px"
                }}>
                  <ExternalLinksContainer>
                    {company.website && getWebsiteDisplay(company.website) ? (
                      <ExternalLink 
                        href={getWebsiteDisplay(company.website).url} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Web
                      </ExternalLink>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No website</span>
                    )}
                    {company.linkedin && (
                      <ExternalLink 
                        href={company.linkedin.startsWith('http') ? company.linkedin : `https://linkedin.com/company/${company.linkedin}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </ExternalLink>
                    )}
                  </ExternalLinksContainer>
                </div>
                
                {/* Divider before contacts */}
                <div style={{borderBottom: "1px solid #e5e7eb"}}></div>
                
                {/* SECTION 7: Contacts - Remaining Height */}
                <div style={{ marginTop: "10px", flex: "1 1 auto" }}>
                  <RelatedContactsContainer>
                    <RelatedContactsHeader>
                      <h4>Associated Contacts</h4>
                    </RelatedContactsHeader>
                    <RelatedContactsList>
                      {company.contacts && company.contacts.length > 0 ? (
                        <>
                          {company.contacts.slice(0, 2).map(contact => (
                            <ContactBadge 
                              key={contact.id}
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: 'black',
                                color: 'white',
                                borderColor: 'black'
                              }}
                              onClick={() => handleContactClick(contact.id)}
                            >
                              {formatContactName(contact)}
                              <span 
                                style={{ 
                                  marginLeft: '4px', 
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '10px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveContact(company.id, contact.id);
                                }}
                                title="Remove contact"
                              >
                                ×
                              </span>
                            </ContactBadge>
                          ))}
                          {company.contacts.length > 2 && (
                            <ContactBadge
                              title={company.contacts.slice(2).map(contact => formatContactName(contact)).join(', ')}
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: 'black',
                                color: 'white',
                                borderColor: 'black'
                              }}
                              onClick={() => handleOpenContactsModal(company)}
                            >
                              +{company.contacts.length - 2} more
                            </ContactBadge>
                          )}
                        </>
                      ) : null}
                      
                      <ContactBadge 
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: 'black',
                          color: 'white',
                          borderColor: 'black',
                        }}
                        onClick={() => handleOpenContactsModal(company)}
                      >
                        + Add
                      </ContactBadge>
                    </RelatedContactsList>
                  </RelatedContactsContainer>
                </div>
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
        <CompanyTagsModal
          isOpen={showTagsModal}
          onRequestClose={handleModalClose}
          company={selectedCompany}
        />
      )}
      
      {showCityModal && selectedCompany && (
        <CompanyCityModal
          isOpen={showCityModal}
          onRequestClose={handleModalClose}
          company={selectedCompany}
        />
      )}
      
      {showContactsModal && selectedCompany && (
        <CompanyContactsModal
          isOpen={showContactsModal}
          onRequestClose={handleModalClose}
          company={selectedCompany}
        />
      )}
      
      {showContactModal && selectedContact && (
        <ContactsModal
          isOpen={showContactModal}
          onRequestClose={handleModalClose}
          contact={selectedContact}
        />
      )}
    </PageContainer>
  );
};

export default Companies;
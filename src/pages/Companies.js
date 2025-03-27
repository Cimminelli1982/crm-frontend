import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiFilter, FiSearch, FiPlus, FiChevronDown, FiClock, FiAlertCircle, FiRefreshCw, FiGlobe, FiMapPin, FiEdit, FiTag, FiLinkedin, FiUser } from 'react-icons/fi';
import { FaBuilding, FaEllipsisH, FaTimesCircle } from 'react-icons/fa';
import Modal from 'react-modal';
import Select from 'react-select';
import CompanyModal from '../components/modals/CompanyModal';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import CompanyTagsModal from '../components/modals/CompanyTagsModal';
import CompanyCityModal from '../components/modals/CompanyCityModal';
import CompanyContactsModal from '../components/modals/CompanyContactsModal';
import ContactsModal from '../components/modals/ContactsModal';
import MergeCompanyModal from '../components/modals/MergeCompanyModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import CompanyMainModal from '../components/modals/CompanyMainModal';

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
  cursor: pointer;
  
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
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
    color: black;
  }
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
  position: relative;
  
  &:hover {
    background-color: black;
    color: white;
  }
  
  &:hover::after {
    content: ">";
    position: absolute;
    right: 12px;
    font-weight: bold;
  }
`;

const DeleteButton = styled.button`
  background-color: black;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: 5px;
  
  &:hover {
    background-color: #333;
  }
  
  &.confirm {
    background-color: #ef4444;
    
    &:hover {
      background-color: #dc2626;
    }
  }
`;

const SkipButton = styled.button`
  background-color: #6B7280;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: 5px;
  
  &:hover {
    background-color: #4B5563;
  }
  
  &.confirm {
    background-color: #9CA3AF;
    
    &:hover {
      background-color: #6B7280;
    }
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
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
    border-radius: 4px;
    padding: 4px;
    margin: -4px;
    margin-bottom: 12px;
  }
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
  // URL parameter handling
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check URL params for modal control
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('addCompany') === 'true') {
      setShowAddCompanyModal(true);
    }
  }, [location]);
  
  // State variables
  const [companies, setCompanies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false); // New state for edit company modal
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editingCategoryCompanyId, setEditingCategoryCompanyId] = useState(null);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const categoryDropdownRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [editingNameCompanyId, setEditingNameCompanyId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDescriptionCompanyId, setEditingDescriptionCompanyId] = useState(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // Track which company is in delete confirmation state
  const [skipConfirmId, setSkipConfirmId] = useState(null); // Track which company is in skip confirmation state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCompanyMainModal, setShowCompanyMainModal] = useState(false); // To control the display of the merge modal
  
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
    { id: 'contact', label: 'Related Contact' }
  ];
  
  // Fetch companies with details (tags, cities, contacts)
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      
      // Variable to hold companies data
      let companiesData = [];
      
      // STEP 1: Fetch base companies data based on search parameters
      if (searchTerm.length >= 2 && searchField === 'name') {
        // Use server-side search for company name
        console.log("Performing server-side name search for:", searchTerm);
        
        const { data: matchingCompanies, error: matchingError } = await supabase
          .from('companies')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
          .neq('category', 'Skip')
          .or('category.is.null'); // Include companies with null category
          
        if (matchingError) {
          console.error("Error searching companies by name:", matchingError);
          throw matchingError;
        }
        
        console.log(`Found ${matchingCompanies?.length || 0} companies matching "${searchTerm}" in name`);
        companiesData = matchingCompanies || [];
      } else {
        // Get all companies - excluding 'Skip' category, including null category
        const { data: allCompaniesData, error: allCompaniesError } = await supabase
          .from('companies')
          .select('*')
          .or('category.neq.Skip,category.is.null');
        
        if (allCompaniesError) {
          throw allCompaniesError;
        }
        
        companiesData = allCompaniesData || [];
      }
      
      // Initialize empty arrays for relationships 
      companiesData = companiesData.map(company => ({
        ...company,
        tags: [],
        cities: [],
        contacts: []
      }));
      
      // Default sort by created_at
      companiesData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // STEP 2: If we have companies, fetch their related data
      if (companiesData.length > 0) {
        const companyIds = companiesData.map(company => company.id);
        
        // STEP 2.1: Fetch and join tags data - COMPLETELY SIMPLIFIED METHOD
        try {
          // Fetch all tags associations at once
          const { data: allTagAssociations, error: tagsAssocError } = await supabase
            .from('companies_tags')
            .select('company_id, tag_id');

          if (tagsAssocError) {
            console.error('Error fetching companies_tags:', tagsAssocError);
          } else if (allTagAssociations && allTagAssociations.length > 0) {
            // Get all unique tag IDs
            const allTagIds = [...new Set(allTagAssociations.map(item => item.tag_id))];
            
            // Fetch all tag details at once
            const { data: allTagDetails, error: tagsDetailsError } = await supabase
              .from('tags')
              .select('id, name');

            if (tagsDetailsError) {
              console.error('Error fetching tag details:', tagsDetailsError);
            } else if (allTagDetails && allTagDetails.length > 0) {
              // Create a tag lookup map for fast access
              const tagMap = {};
              allTagDetails.forEach(tag => {
                tagMap[tag.id] = tag;
              });
              
              // Group tag associations by company
              const tagsByCompany = {};
              allTagAssociations.forEach(assoc => {
                const tag = tagMap[assoc.tag_id];
                if (tag && assoc.company_id) {
                  if (!tagsByCompany[assoc.company_id]) {
                    tagsByCompany[assoc.company_id] = [];
                  }
                  tagsByCompany[assoc.company_id].push({
                    id: tag.id,
                    name: tag.name
                  });
                }
              });
              
              // Add tags to each company
              companiesData.forEach(company => {
                company.tags = tagsByCompany[company.id] || [];
              });
            }
          }
        } catch (error) {
          console.error('Error fetching company tags:', error);
        }
        
        // STEP 2.2: Fetch and join cities data - USING THE SAME IMPROVED METHOD AS TAGS
        try {
          // Fetch all city associations at once
          const { data: allCityAssociations, error: citiesAssocError } = await supabase
            .from('companies_cities')
            .select('company_id, city_id');

          if (citiesAssocError) {
            console.error('Error fetching companies_cities:', citiesAssocError);
          } else if (allCityAssociations && allCityAssociations.length > 0) {
            // Get all unique city IDs
            const allCityIds = [...new Set(allCityAssociations.map(item => item.city_id))];
            
            // Fetch all city details at once
            const { data: allCityDetails, error: citiesDetailsError } = await supabase
              .from('cities')
              .select('id, name');

            if (citiesDetailsError) {
              console.error('Error fetching city details:', citiesDetailsError);
            } else if (allCityDetails && allCityDetails.length > 0) {
              // Create a city lookup map for fast access
              const cityMap = {};
              allCityDetails.forEach(city => {
                cityMap[city.id] = city;
              });
              
              // Group city associations by company
              const citiesByCompany = {};
              allCityAssociations.forEach(assoc => {
                const city = cityMap[assoc.city_id];
                if (city && assoc.company_id) {
                  if (!citiesByCompany[assoc.company_id]) {
                    citiesByCompany[assoc.company_id] = [];
                  }
                  citiesByCompany[assoc.company_id].push({
                    id: city.id,
                    name: city.name
                  });
                }
              });
              
              // Add cities to each company
              companiesData.forEach(company => {
                company.cities = citiesByCompany[company.id] || [];
              });
            }
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
        }
        
        // STEP 2.3: Fetch and join contacts data - SIMPLIFIED VERSION
        try {
          console.log('Starting contact association fetch for companies');
          
          // Fetch all contact associations at once
          const { data: contactAssocs, error: contactsAssocError } = await supabase
            .from('contact_companies')
            .select('company_id, contact_id');

          if (contactsAssocError) {
            console.error('Error fetching contact_companies:', contactsAssocError);
          } else {
            console.log(`Found ${contactAssocs?.length || 0} total contact-company associations`);
            
            // Count companies with at least one contact
            const companiesWithContacts = new Set();
            contactAssocs?.forEach(assoc => companiesWithContacts.add(assoc.company_id));
            console.log(`Found ${companiesWithContacts.size} companies with at least one contact`);
            
            if (contactAssocs && contactAssocs.length > 0) {
              // Get all unique contact IDs
              const contactIds = [...new Set(contactAssocs.map(item => item.contact_id))];
              console.log(`Found ${contactIds.length} unique contacts to fetch details for`);
              
              // Fetch only the specific contacts we need using their IDs
              const { data: contactDetails, error: contactsDetailsError } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, email, mobile, last_interaction')
                .in('id', contactIds); // Filter to only include contacts we need

              if (contactsDetailsError) {
                console.error('Error fetching contact details:', contactsDetailsError);
              } else {
                console.log(`Successfully fetched ${contactDetails?.length || 0} out of ${contactIds.length} needed contacts`);
                // Check if we're missing any contacts
                if (contactDetails && contactIds.length !== contactDetails.length) {
                  const fetchedIds = new Set(contactDetails.map(c => c.id));
                  const missingIds = contactIds.filter(id => !fetchedIds.has(id));
                  console.log(`Missing ${missingIds.length} contacts: ${missingIds.slice(0, 5).join(', ')}${missingIds.length > 5 ? '...' : ''}`);
                }
                
                // Create a contact lookup map for fast access
                const contactMap = {};
                contactDetails?.forEach(contact => {
                  if (contact && contact.id) {
                    contactMap[contact.id] = contact;
                  }
                });
                
                // Group contact associations by company
                const contactsByCompany = {};
                let missingContactCount = 0;
                
                contactAssocs.forEach(assoc => {
                  const contact = contactMap[assoc.contact_id];
                  if (contact && assoc.company_id) {
                    if (!contactsByCompany[assoc.company_id]) {
                      contactsByCompany[assoc.company_id] = [];
                    }
                    contactsByCompany[assoc.company_id].push(contact);
                  } else if (!contact) {
                    missingContactCount++;
                  }
                });
                
                console.log(`Found ${missingContactCount} contact associations with missing contacts`);
                console.log(`Created contact groupings for ${Object.keys(contactsByCompany).length} companies`);
                
                // Add contacts to each company
                companiesData.forEach(company => {
                  company.contacts = contactsByCompany[company.id] || [];
                });
                
                // Log how many companies have contacts after assignment
                const companiesWithContactsCount = companiesData.filter(c => c.contacts && c.contacts.length > 0).length;
                console.log(`After assignment: ${companiesWithContactsCount} out of ${companiesData.length} companies have contacts`);
                
                // Additional filtering by contact if needed
                if (searchField === 'contact' && searchTerm.length >= 3) {
                  const searchLower = searchTerm.toLowerCase();
                  
                  console.log(`Filtering by contacts containing: "${searchLower}"`);
                  
                  // Filter companies with matching contacts
                  companiesData = companiesData.filter(company => 
                    company.contacts && company.contacts.some(contact => {
                      if (!contact) return false;
                      
                      const firstName = (contact.first_name || '').toLowerCase();
                      const lastName = (contact.last_name || '').toLowerCase();
                      const fullName = `${firstName} ${lastName}`;
                      const email = (contact.email || '').toLowerCase();
                      const mobile = (contact.mobile || '').toLowerCase();
                      
                      return (
                        firstName.includes(searchLower) ||
                        lastName.includes(searchLower) ||
                        fullName.includes(searchLower) ||
                        email.includes(searchLower) ||
                        mobile.includes(searchLower)
                      );
                    })
                  );
                  
                  console.log(`After contact filtering: ${companiesData.length} companies`);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching contacts:', error);
        }
      }
      
      // STEP 4: Set state with the enriched companies data
      setCompanies(companiesData);
      setFilteredCount(companiesData.length);
      
      // STEP 5: Update filter counts
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
      // Get all companies to calculate counts client-side (excluding 'Skip' category, including null)
      const { data: allCompaniesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .or('category.neq.Skip,category.is.null'); // Filter out Skip category but include null category
      
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
  }, [refreshTrigger, sortBy, sortOrder]);
  
  // Add event listener to handle clicks outside menu/buttons and escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close confirmation states if clicking outside
      if ((deleteConfirmId !== null || skipConfirmId !== null) && !e.target.closest('button')) {
        setDeleteConfirmId(null);
        setSkipConfirmId(null);
      }
      
      // Close action menu if clicking outside
      if (actionMenuOpen !== null && !e.target.closest('.action-menu-container')) {
        setActionMenuOpen(null);
      }
    };
    
    // Handle escape key press
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Close action menu
        if (actionMenuOpen !== null) {
          setActionMenuOpen(null);
        }
        
        // Reset confirmation states
        setDeleteConfirmId(null);
        setSkipConfirmId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteConfirmId, skipConfirmId, actionMenuOpen]);
  
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
  
  // Direct search functionality - uses server-side search for efficiency
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log(`Search term changed to: "${value}"`);
    
    // Only trigger search if length is 2+ characters for name search, 3+ for others, or 0 (clearing)
    const minLength = searchField === 'name' ? 2 : 3;
    if (value.length >= minLength || value.length === 0) {
      console.log(`Triggering search for: "${value}"`);
      
      // For name, website, category, contacts, and tags searches, we'll implement a direct search approach
      if ((value.length >= minLength) && ['name', 'website', 'category', 'contact', 'tags'].includes(searchField)) {
        setIsLoading(true);
        try {
          // Use server-side filtering with ilike for better search and to avoid pagination issues
          console.log("Fetching from Supabase URL:", supabase.supabaseUrl);
          console.log(`Searching for companies with ${searchField} containing: "${value}"`);
          
          // Use direct server-side search with ilike
          // Always filter out companies with 'Skip' category
          let query = supabase.from('companies')
            .select('*')
            .neq('category', 'Skip');
          
          // Different search approach based on search field
          if (searchField === 'name') {
            // For name search, use a simple direct approach
            console.log("Performing company name search directly");
            
            // IMPORTANT: We need a direct query, not a filter on top of previous query!
            // This is the key fix to ensure we search the entire database
            try {
              // Direct query to search by name including ALL companies (except Skip)
              const { data: nameSearchResults, error: nameSearchError } = await supabase
                .from('companies')
                .select('*')
                .ilike('name', `%${value}%`) // Case-insensitive search
                .or('category.neq.Skip,category.is.null'); // Include companies with NULL category AND exclude Skip
                
              if (nameSearchError) {
                console.error("Error searching companies by name:", nameSearchError);
                throw nameSearchError;
              }
              
              console.log(`Direct name search found ${nameSearchResults?.length || 0} companies matching "${value}"`);
                
              if (nameSearchResults && nameSearchResults.length > 0) {
                console.log("First 5 company matches:", 
                  nameSearchResults.slice(0, 5).map(c => ({ id: c.id, name: c.name, category: c.category || 'null' })));
                  
                // Directly set companies and update UI
                setCompanies(nameSearchResults);
                setFilteredCount(nameSearchResults.length);
                setIsLoading(false);
                
                // After setting companies, trigger a relationship fetch
                // (We'll fetch relationships in a separate step)
                
                // Early return to avoid the regular flow
                return;
              } else {
                console.log("No companies found matching the name search term");
                setCompanies([]);
                setFilteredCount(0);
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error("Error in direct name search:", error);
              setCompanies([]);
              setFilteredCount(0);
              setIsLoading(false);
              return;
            }
            
          } else if (searchField === 'tags') {
            // For tags search, we need to join with companies_tags and tags tables
            console.log("Performing tags search");
            // Get tag IDs that match the search term
            const { data: matchingTags, error: tagsError } = await supabase
              .from('tags')
              .select('id')
              .ilike('name', `%${value}%`);
              
            if (tagsError) {
              console.error("Error searching tags:", tagsError);
              return;
            }
            
            if (!matchingTags || matchingTags.length === 0) {
              console.log("No matching tags found");
              setCompanies([]);
              setFilteredCount(0);
              setIsLoading(false);
              return;
            }
            
            console.log(`Found ${matchingTags.length} matching tags`);
            
            // Get companies linked to these tags
            const tagIds = matchingTags.map(tag => tag.id);
            const { data: companyTagLinks, error: linksError } = await supabase
              .from('companies_tags')
              .select('company_id')
              .in('tag_id', tagIds);
              
            if (linksError) {
              console.error("Error fetching company-tag links:", linksError);
              return;
            }
            
            if (!companyTagLinks || companyTagLinks.length === 0) {
              console.log("No companies have the matching tags");
              setCompanies([]);
              setFilteredCount(0);
              setIsLoading(false);
              return;
            }
            
            const companyIds = [...new Set(companyTagLinks.map(link => link.company_id))];
            console.log(`Found ${companyIds.length} companies with matching tags`);
            
            // Get the actual companies - make sure to include those with null category
            query = supabase
              .from('companies')
              .select('*')
              .in('id', companyIds)
              .neq('category', 'Skip')
              .or('category.is.null'); // Include companies with NULL category
              
            console.log(`Using companyIds: ${companyIds.slice(0, 5).join(', ')}${companyIds.length > 5 ? '...' : ''}`);
            
          } else if (searchField === 'contact') {
            // For contact search, we need to join with contact_companies and contacts tables
            console.log("Performing contacts search directly");
            
            try {
              // STEP 1: Find contacts matching the search term - more comprehensive search
              const { data: matchingContacts, error: contactsError } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, email')
                .or(`first_name.ilike.%${value}%,last_name.ilike.%${value}%,email.ilike.%${value}%`);
                
              if (contactsError) {
                console.error("Error searching contacts:", contactsError);
                throw contactsError;
              }
              
              if (!matchingContacts || matchingContacts.length === 0) {
                console.log("No matching contacts found");
                setCompanies([]);
                setFilteredCount(0);
                setIsLoading(false);
                return;
              }
              
              console.log(`Found ${matchingContacts.length} matching contacts`);
              console.log("First 5 matching contacts:", matchingContacts.slice(0, 5).map(c => 
                `${c.first_name} ${c.last_name} (${c.id})`));
              
              // STEP 2: Find companies linked to these contacts
              const contactIds = matchingContacts.map(contact => contact.id);
              const { data: companyContactLinks, error: linksError } = await supabase
                .from('contact_companies')
                .select('company_id, contact_id')  // Include contact_id for debugging
                .in('contact_id', contactIds);
                
              if (linksError) {
                console.error("Error fetching company-contact links:", linksError);
                throw linksError;
              }
              
              if (!companyContactLinks || companyContactLinks.length === 0) {
                console.log("No companies have the matching contacts");
                setCompanies([]);
                setFilteredCount(0);
                setIsLoading(false);
                return;
              }
              
              console.log(`Found ${companyContactLinks.length} company-contact associations`);
              
              // STEP 3: Get unique company IDs
              const companyIds = [...new Set(companyContactLinks.map(link => link.company_id))];
              console.log(`Found ${companyIds.length} unique companies with matching contacts`);
              
              // STEP 4: Query companies directly to include ones without a category
              const { data: matchingCompanies, error: companiesError } = await supabase
                .from('companies')
                .select('*')
                .in('id', companyIds)
                .or('category.neq.Skip,category.is.null'); // Include NULL category companies & exclude Skip
                
              if (companiesError) {
                console.error("Error fetching companies by contact:", companiesError);
                throw companiesError;
              }
              
              console.log(`Direct contact search found ${matchingCompanies?.length || 0} companies`);
                
              if (matchingCompanies && matchingCompanies.length > 0) {
                console.log("First 5 company matches:", 
                  matchingCompanies.slice(0, 5).map(c => ({ id: c.id, name: c.name })));
                  
                // Create a map of contact IDs to contact data for faster lookups
                const contactMap = {};
                matchingContacts.forEach(contact => {
                  contactMap[contact.id] = contact;
                });
                
                // Create a map of company IDs to associated contact IDs
                const companyContactsMap = {};
                companyContactLinks.forEach(link => {
                  if (!companyContactsMap[link.company_id]) {
                    companyContactsMap[link.company_id] = [];
                  }
                  companyContactsMap[link.company_id].push(link.contact_id);
                });
                
                // Associate contacts with their companies
                const companiesWithContacts = matchingCompanies.map(company => {
                  // Get contact IDs for this company
                  const contactsForCompany = companyContactsMap[company.id] || [];
                  
                  // Look up full contact data for each ID
                  const contactsData = contactsForCompany
                    .map(contactId => contactMap[contactId])
                    .filter(contact => contact !== undefined); // Filter out any undefined entries
                    
                  return {
                    ...company,
                    contacts: contactsData, // Pre-populate contacts array
                    tags: [],  // Initialize empty tags array
                    cities: [] // Initialize empty cities array
                  };
                });
                
                // Directly set companies and update UI
                setCompanies(companiesWithContacts);
                setFilteredCount(companiesWithContacts.length);
                setIsLoading(false);
                
                // After setting companies, trigger a refresh to load other relationships
                setTimeout(() => {
                  setRefreshTrigger(prev => prev + 1);
                }, 500);
                
                // Early return to avoid the regular flow
                return;
              } else {
                console.log("No companies found with matching contacts");
                setCompanies([]);
                setFilteredCount(0);
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error("Error in direct contact search:", error);
              setCompanies([]);
              setFilteredCount(0);
              setIsLoading(false);
              return;
            }
            
          } else {
            // Simple field search for website, category
            query = query.ilike(searchField, `%${value}%`);
          }
          
          // Execute the final query
          const { data: matchingCompanies, error } = await query;
            
          if (error) {
            console.error("Error fetching companies:", error);
            return;
          }
          
          console.log(`Found ${matchingCompanies?.length || 0} companies matching "${value}"`);
          if (matchingCompanies && matchingCompanies.length > 0) {
            console.log("Matching companies:", matchingCompanies.map(c => c.name));
          } else {
            console.log("No companies found with query, trying broader approach");
            
            // Try a broader search without category filters
            const { data: broaderResult } = await supabase
              .from('companies')
              .select('*')
              .ilike('name', `%${value}%`);
              
            console.log("Broader query result:", broaderResult);
            
            // If still no results, try an even broader approach with 'or' syntax
            if (!broaderResult || broaderResult.length === 0) {
              console.log("Still no results, trying widest possible search");
              
              const { data: widestSearch } = await supabase
                .from('companies')
                .select('*')
                .or(`name.ilike.%${value}%`);
              
              console.log("Widest search results:", widestSearch);
              
              if (widestSearch && widestSearch.length > 0) {
                matchingCompanies = widestSearch;
                console.log("Using widest search results");
              }
            } else {
              matchingCompanies = broaderResult;
              console.log("Using broader search results");
            }
          }
          
          // Direct update the debug output
          const debugElement = document.getElementById('search-debug');
          if (debugElement) {
            debugElement.innerHTML = `
              <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <strong>Searching for:</strong> "${value}" in ${searchFields.find(f => f.id === searchField)?.label}<br/>
                <strong>Results:</strong> ${matchingCompanies.length} companies<br/>
                ${matchingCompanies.length > 0 ? 
                  '<strong>Top matches:</strong><br/>' + 
                  matchingCompanies.slice(0, 5).map(c => `${c.name}`).join('<br/>') + 
                  (matchingCompanies.length > 5 ? `<br/>...and ${matchingCompanies.length - 5} more` : '')
                  : 'No matches found'}
              </div>
            `;
          }
          
          // Now load related data (tags, cities, contacts) for these companies
          const companyIds = matchingCompanies.map(company => company.id);
          
          if (companyIds.length > 0) {
            // Process in parallel all the relationship fetches
            const [tagsResult, citiesResult, contactsResult] = await Promise.all([
              // Fetch tags
              supabase
                .from('companies_tags')
                .select('company_id, tag_id, tags:tag_id (id, name)')
                .in('company_id', companyIds),
              
              // Fetch cities
              supabase
                .from('companies_cities')
                .select('company_id, city_id, cities:city_id (id, name)')
                .in('company_id', companyIds),
              
              // Fetch contacts
              supabase
                .from('contact_companies')
                .select('company_id, contact_id, contacts:contact_id (id, first_name, last_name, email, mobile)')
                .in('company_id', companyIds)
            ]);
            
            // Process tags
            if (!tagsResult.error && tagsResult.data) {
              const tagsByCompany = {};
              tagsResult.data.forEach(item => {
                if (item.company_id && item.tags) {
                  if (!tagsByCompany[item.company_id]) {
                    tagsByCompany[item.company_id] = [];
                  }
                  tagsByCompany[item.company_id].push(item.tags);
                }
              });
              
              // Add tags to each company
              matchingCompanies.forEach(company => {
                company.tags = tagsByCompany[company.id] || [];
              });
            }
            
            // Process cities
            if (!citiesResult.error && citiesResult.data) {
              const citiesByCompany = {};
              citiesResult.data.forEach(item => {
                if (item.company_id && item.cities) {
                  if (!citiesByCompany[item.company_id]) {
                    citiesByCompany[item.company_id] = [];
                  }
                  citiesByCompany[item.company_id].push(item.cities);
                }
              });
              
              // Add cities to each company
              matchingCompanies.forEach(company => {
                company.cities = citiesByCompany[company.id] || [];
              });
            }
            
            // Process contacts
            if (!contactsResult.error && contactsResult.data) {
              const contactsByCompany = {};
              contactsResult.data.forEach(item => {
                if (item.company_id && item.contacts) {
                  if (!contactsByCompany[item.company_id]) {
                    contactsByCompany[item.company_id] = [];
                  }
                  contactsByCompany[item.company_id].push(item.contacts);
                }
              });
              
              // Add contacts to each company
              matchingCompanies.forEach(company => {
                company.contacts = contactsByCompany[company.id] || [];
              });
            }
          }
          
          // Directly set the companies
          setCompanies(matchingCompanies);
          setFilteredCount(matchingCompanies.length);
          
        } catch (error) {
          console.error("Error during direct search:", error);
        } finally {
          setIsLoading(false);
        }
        
        // Skip the regular fetchCompanies call by not triggering refreshTrigger
        return;
      }
      
      // For empty search or clearing, use the normal flow to reset
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
    
    // Reset the list of companies when switching search fields
    setRefreshTrigger(prev => prev + 1);
  };
  
  
  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle creating a new company
  const handleAddCompany = () => {
    setSelectedCompany(null); // Set to null to indicate we're creating a new company
    setShowAddCompanyModal(true);
  };
  
  // Handle opening company modal
  const handleOpenCompanyModal = (company) => {
    setSelectedCompany(company);
    setShowCompanyMainModal(true);
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
  
  // Handle name inline edit
  const handleNameClick = (company) => {
    setEditingNameCompanyId(company.id);
    setEditingNameValue(company.name || '');
    setEditingName(true);
  };
  
  // Handle name save
  const handleNameSave = async () => {
    if (!editingNameCompanyId || !editingNameValue.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ 
          name: editingNameValue.trim(), 
          modified_at: new Date() 
        })
        .eq('id', editingNameCompanyId)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setCompanies(companies.map(company => 
        company.id === editingNameCompanyId ? 
          { ...company, name: editingNameValue.trim() } : 
          company
      ));
      
      // Clean up and close editor
      setEditingNameCompanyId(null);
      setEditingNameValue('');
      setEditingName(false);
      
    } catch (error) {
      console.error('Error updating company name:', error);
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
    // Close all modals
    setShowCompanyModal(false);
    setShowAddCompanyModal(false);
    setShowEditCompanyModal(false); // Close edit company modal
    
    // Clear URL parameters if present
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has('addCompany')) {
      queryParams.delete('addCompany');
      navigate({ search: queryParams.toString() }, { replace: true });
    }
    setShowTagsModal(false);
    setShowCityModal(false);
    setShowContactsModal(false);
    setShowContactModal(false);
    setShowMergeModal(false);
    
    // Reset selection states
    setSelectedCompany(null);
    setSelectedContact(null);
    
    // Reset confirmation states
    setDeleteConfirmId(null);
    setSkipConfirmId(null);
    
    // Reset inline editing states
    setEditingName(false);
    setEditingNameCompanyId(null);
    setEditingNameValue('');
    setEditingDescription(false);
    setEditingDescriptionCompanyId(null);
    setEditingDescriptionValue('');
    
    // Refresh the companies list to show any newly created company
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle action menu toggle
  const handleActionMenuToggle = (companyId) => {
    // Reset any confirmation states when opening/closing the menu
    if (actionMenuOpen === companyId) {
      setActionMenuOpen(null);
      setDeleteConfirmId(null);
      setSkipConfirmId(null);
    } else {
      setActionMenuOpen(companyId);
    }
  };
  
  // Handle merge company action
  const handleMergeCompany = (company) => {
    setSelectedCompany(company);
    setShowMergeModal(true);
    setActionMenuOpen(null); // Close the action menu
  };
  
  // Handle skip company - change category to Skip so it disappears from view
  const handleSkipCompany = async (companyId) => {
    // If already in skip confirmation mode for this company
    if (skipConfirmId === companyId) {
      try {
        // Update company category to "Skip"
        const { error } = await supabase
          .from('companies')
          .update({ category: 'Skip', modified_at: new Date() })
          .eq('id', companyId);
          
        if (error) throw error;
        
        // Update local state to remove the company
        setCompanies(companies.filter(company => company.id !== companyId));
        
        // Reset confirmation state
        setSkipConfirmId(null);
      } catch (error) {
        console.error('Error setting company to Skip:', error);
        // Reset confirmation state on error
        setSkipConfirmId(null);
      }
    } else {
      // First click, set confirmation state
      setSkipConfirmId(companyId);
      // Reset delete confirmation if it was active
      setDeleteConfirmId(null);
      
      // Auto-reset after 5 seconds for safety
      setTimeout(() => {
        setSkipConfirmId(current => current === companyId ? null : current);
      }, 5000);
    }
  };
  
  // Handle delete company - first click sets confirmation state
  const handleDeleteCompany = async (companyId) => {
    // If already in delete confirmation mode for this company
    if (deleteConfirmId === companyId) {
      setIsLoading(true); // Show loading state
      try {
        console.log(`Starting deletion process for company ${companyId}`);
        
        // STEP 1: Find contacts with direct foreign key to this company
        console.log(`Finding contacts with direct company_id foreign key to ${companyId}`);
        const { data: directLinkedContacts, error: contactsFetchError } = await supabase
          .from('contacts')
          .select('id')
          .eq('company_id', companyId);
          
        if (contactsFetchError) {
          console.error('Error fetching directly linked contacts:', contactsFetchError);
          throw new Error(`Failed to fetch linked contacts: ${contactsFetchError.message}`);
        }
        
        // If there are directly linked contacts, handle them first
        if (directLinkedContacts && directLinkedContacts.length > 0) {
          const contactIds = directLinkedContacts.map(c => c.id);
          console.log(`Found ${contactIds.length} contacts directly linked to company:`, contactIds);
          
          // Delete tags for these contacts first
          for (const contactId of contactIds) {
            console.log(`Deleting tags for contact ${contactId}`);
            const { error: tagDeleteError } = await supabase
              .from('contact_tags')
              .delete()
              .eq('contact_id', contactId);
              
            if (tagDeleteError) {
              console.error(`Error deleting tags for contact ${contactId}:`, tagDeleteError);
              throw new Error(`Failed to delete contact tags: ${tagDeleteError.message}`);
            }
          }
          
          // Now update the contacts to break the direct foreign key constraint
          for (const contactId of contactIds) {
            console.log(`Updating contact ${contactId} to remove company_id`);
            const { error: contactUpdateError } = await supabase
              .from('contacts')
              .update({ company_id: null })
              .eq('id', contactId);
              
            if (contactUpdateError) {
              console.error(`Error updating contact ${contactId}:`, contactUpdateError);
              throw new Error(`Failed to update contact: ${contactUpdateError.message}`);
            }
          }
        }
        
        // STEP 2: Delete company-tag relationships (junction table)
        console.log(`Deleting company tags for company ${companyId}`);
        const { error: tagsError } = await supabase
          .from('companies_tags')
          .delete()
          .eq('company_id', companyId);
          
        if (tagsError) {
          console.error('Error deleting company tags:', tagsError);
          throw new Error(`Failed to delete company tags: ${tagsError.message}`);
        }
        
        // STEP 3: Delete company-city relationships (junction table)
        console.log(`Deleting company cities for company ${companyId}`);
        const { error: citiesError } = await supabase
          .from('companies_cities')
          .delete()
          .eq('company_id', companyId);
          
        if (citiesError) {
          console.error('Error deleting company cities:', citiesError);
          throw new Error(`Failed to delete company cities: ${citiesError.message}`);
        }
        
        // STEP 4: Delete company-contact relationships (junction table)
        console.log(`Deleting company-contact relationships for company ${companyId}`);
        const { error: contactsError } = await supabase
          .from('contact_companies')
          .delete()
          .eq('company_id', companyId);
          
        if (contactsError) {
          console.error('Error deleting company contacts:', contactsError);
          throw new Error(`Failed to delete company contacts: ${contactsError.message}`);
        }
        
        // STEP 5: Finally, delete the company record itself
        console.log(`Deleting company ${companyId}`);
        const { error: companyError } = await supabase
          .from('companies')
          .delete()
          .eq('id', companyId);
          
        if (companyError) {
          console.error('Error deleting company record:', companyError);
          throw new Error(`Failed to delete company: ${companyError.message}`);
        }
        
        // Update local state to remove the company
        setCompanies(companies.filter(company => company.id !== companyId));
        console.log(`Company ${companyId} successfully deleted`);
        
        // Reset confirmation state
        setDeleteConfirmId(null);
      } catch (error) {
        console.error('Error in deletion process:', error);
        alert(`Failed to delete company: ${error.message}`);
        // Reset confirmation state on error
        setDeleteConfirmId(null);
      } finally {
        setIsLoading(false); // Hide loading state
      }
    } else {
      // First click, set confirmation state
      setDeleteConfirmId(companyId);
      // Reset skip confirmation if it was active
      setSkipConfirmId(null);
      
      // Auto-reset after 5 seconds for safety
      setTimeout(() => {
        setDeleteConfirmId(current => current === companyId ? null : current);
      }, 5000);
    }
  };
  
  // Get filter title
  const getFilterTitle = () => {
    return "All Companies";
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
            <SecondaryButton onClick={() => navigate('?addCompany=true')}>
              Add Company Direct
            </SecondaryButton>
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
      </PageHeader>
      
      <ContentSection>
        {/* Quick Test Debug Element */}
        <div id="search-debug"></div>
        
        {/* Search Debug Element */}
        {searchTerm.length >= 3 && (
          <div style={{ 
            padding: '1rem', 
            margin: '0 0 1rem 0',
            backgroundColor: '#f3f4f6', 
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#4b5563',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div>
                <strong>Searching for:</strong> "{searchTerm}" in {searchFields.find(f => f.id === searchField)?.label}
              </div>
              <div>
                <strong>Results:</strong> {companies.length} companies
              </div>
            </div>
            
            {/* Show the names of the first few companies found */}
            {companies.length > 0 && (
              <div>
                <strong>Top matches:</strong>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  {companies.slice(0, 5).map(company => (
                    <li key={company.id}>{company.name}</li>
                  ))}
                  {companies.length > 5 && <li>... and {companies.length - 5} more</li>}
                </ul>
              </div>
            )}
          </div>
        )}
        
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
              <CompanyCard 
                key={company.id} 
                onClick={(e) => {
                  // Prevent opening modal when clicking on editable fields or buttons
                  if (
                    e.target.tagName.toLowerCase() === 'button' || 
                    e.target.tagName.toLowerCase() === 'input' || 
                    e.target.tagName.toLowerCase() === 'textarea' ||
                    e.target.closest('.action-menu') // Don't trigger when clicking on the action menu
                  ) {
                    return;
                  }
                  handleOpenCompanyModal(company);
                }}
              >
                {/* SECTION 1: Title & Actions - Fixed Height */}
                <div style={{ height: "40px", marginBottom: "0" }}>
                  <CompanyHeader>
                    {editingName && editingNameCompanyId === company.id ? (
                      <div style={{ flex: 1 }}>
                        <input
                          style={{ 
                            width: '100%', 
                            padding: '4px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '1.1rem',
                            fontWeight: '600'
                          }}
                          value={editingNameValue}
                          onChange={e => setEditingNameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              setEditingName(false);
                              setEditingNameCompanyId(null);
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              handleNameSave();
                            }
                          }}
                          autoFocus
                        />
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          marginTop: '5px',
                          gap: '5px',
                          fontSize: '0.7rem'
                        }}>
                          <span style={{ 
                            color: '#6b7280', 
                            marginRight: 'auto',
                            alignSelf: 'center'
                          }}>
                            Press Esc to cancel, Enter to save
                          </span>
                        </div>
                      </div>
                    ) : (
                      <CompanyName 
                        title="Click to edit company name"
                        onClick={() => handleNameClick(company)}
                      >
                        {formatCompanyName(company.name)}
                      </CompanyName>
                    )}
                    <ActionMenu className="action-menu action-menu-container">
                      <ActionMenuToggle 
                        onClick={() => handleActionMenuToggle(company.id)}
                        title="Company actions"
                        className="action-menu-container"
                      >
                        <FaEllipsisH />
                      </ActionMenuToggle>
                      <ActionMenuDropdown isOpen={actionMenuOpen === company.id} className="action-menu-container">
                        <ActionMenuItem onClick={() => handleOpenCompanyModal(company)}>
                          Edit
                        </ActionMenuItem>
                        {skipConfirmId === company.id ? (
                          <ActionMenuItem 
                            onClick={() => handleSkipCompany(company.id)}
                            style={{ color: '#4B5563', fontWeight: 'bold' }}
                          >
                            Confirm Skip
                          </ActionMenuItem>
                        ) : (
                          <ActionMenuItem onClick={() => handleSkipCompany(company.id)}>
                            Skip
                          </ActionMenuItem>
                        )}
                        {deleteConfirmId === company.id ? (
                          <ActionMenuItem 
                            onClick={() => handleDeleteCompany(company.id)}
                            style={{ color: '#EF4444', fontWeight: 'bold' }}
                          >
                            Confirm Delete
                          </ActionMenuItem>
                        ) : (
                          <ActionMenuItem onClick={() => handleDeleteCompany(company.id)}>
                            Delete
                          </ActionMenuItem>
                        )}
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
                          backgroundColor: 'white',
                          color: 'black',
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
      {showAddCompanyModal && (
        <AddCompanyModal
          isOpen={showAddCompanyModal}
          onRequestClose={handleModalClose}
          onSuccess={(newCompany) => {
            console.log('Company created:', newCompany);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onRequestClose={handleModalClose}
          contact={selectedCompany}
        />
      )}
      
      {/* Company Main Modal */}
      {showCompanyMainModal && selectedCompany && (
        <CompanyMainModal
          isOpen={showCompanyMainModal}
          onClose={() => {
            setShowCompanyMainModal(false);
            fetchCompanies(); // Refresh data when modal is closed
          }}
          companyId={selectedCompany?.id}
          refreshData={fetchCompanies}
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

      {showMergeModal && selectedCompany && (
        <MergeCompanyModal
          isOpen={showMergeModal}
          onRequestClose={handleModalClose}
          company={selectedCompany}
        />
      )}
    </PageContainer>
  );
};

export default Companies;
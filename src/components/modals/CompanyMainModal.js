import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FaTimes, FaLink, FaLinkedin, FaMapMarkerAlt, FaTag, FaPlus, FaChevronDown, FaUser } from 'react-icons/fa';
import dayjs from 'dayjs';
import CompanyTagsModal from './CompanyTagsModal';
import CompanyCityModal from './CompanyCityModal';
import CompanyContactsModal from './CompanyContactsModal';

// Company categories from Companies.js
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

// Modal.setAppElement is called in the parent component

// Styled Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalHeaderInfo = styled.div`
  flex: 1;
`;

const NameAndCities = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
`;

const CityTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const CityTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #000000;
  color: white;
  border-radius: 4px;
  margin-left: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  gap: 4px;
  
  button {
    background: none;
    border: none;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
  }
`;

const AddCityButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: transparent;
  border: none;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  margin-left: 8px;
  gap: 4px;
  
  &:hover {
    color: #000000;
  }
`;

const ModalSubtitle = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  &:hover {
    color: #000;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

const TabButton = styled.button`
  background: none;
  border: none;
  font-size: 0.875rem;
  padding: 12px 16px;
  cursor: pointer;
  color: ${props => (props.active ? '#000000' : '#6b7280')};
  border-bottom: ${props => (props.active ? '2px solid #000000' : '2px solid transparent')};
  margin-right: 8px;
  &:hover {
    color: #000000;
  }
`;

const ContentSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 200, 200, 0.5) transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(200, 200, 200, 0.5);
    border-radius: 10px;
    border: none;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(180, 180, 180, 0.8);
  }
`;

const FormContent = styled.div`
  width: 90%;
  margin: 0 auto;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  color: #111827;
  margin: 32px 0 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  
  &.full-width {
    grid-column: span 3;
  }
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 102%; /* 5% smaller than previous 107% */
  height: 52px; /* Increased by 30% from original 40px */
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  
  &:hover {
    border-color: #9ca3af;
  }
  
  &:focus {
    border-color: #9ca3af;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 105%; /* Matched to dropdown button width */
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  background-color: ${props => props.active ? '#f3f4f6' : 'white'};
  font-size: 0.875rem;
  color: #111827;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
`;

const Input = styled.input`
  width: 95%;
  height: 34px; /* Set to 34px */
  padding: 8px 12px; /* Standard padding */
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  &:focus {
    border-color: #9ca3af;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
  &:focus {
    border-color: #9ca3af;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  gap: 12px;
`;

// Tags Styling
const TagsContainer = styled.div`
  position: relative;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 1rem;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#4b5563'};
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid black;
  gap: 6px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
    color: #6b7280;
    cursor: pointer;
    
    &:hover { 
      color: #ef4444; 
    }
  }
`;

// Helper function to get tag colors - matches ContactsModal
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
  
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % colors.length;
  
  return colors[index];
};

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #4b5563;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  svg {
    font-size: 12px;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #4b5563;
  cursor: pointer;
  
  &:hover {
    background-color: #e5e7eb;
  }
`;

// Cities Styling
const CityItem = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #4b5563;
  font-weight: 500;
  margin-right: 8px;
  margin-bottom: 8px;
  border: 1px solid #d1d5db;
  
  button {
    background: none;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    cursor: pointer;
    padding: 0 2px;
    color: #4b5563;
    font-size: 14px;
    
    &:hover {
      color: #ef4444;
    }
  }
`;

const CitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
`;

// We've moved to inline styles for contacts to match the ContactsModal design

// Utility Styled Components
const InfoItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  margin-bottom: 8px;
  color: #4b5563;
  
  svg {
    margin-right: 8px;
    min-width: 16px;
  }
  
  a {
    color: #4b5563;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

// These are not used anymore but keeping them for reference
const TagsSection = styled.div`
  margin-top: 16px;
`;

const TagsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SectionHeader = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RelatedContactsSection = styled.div`
  margin-top: 16px;
`;

function CompanyMainModal({ isOpen, onClose, companyId, refreshData }) {
  console.log('%c ============ MODAL INITIALIZATION ============', 'background: #222; color: #bada55');
  console.log('CompanyMainModal initialized with companyId:', companyId);
  console.log('companyId type:', typeof companyId);
  console.log('companyId direct inspection:', {companyId});
  
  const [activeTab, setActiveTab] = useState('about');
  const [company, setCompany] = useState(null);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  
  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && companyId) {
      console.log('Modal open with companyId, fetching data...');
      fetchCompanyData();
    }
  }, [isOpen, companyId]);
  
  // Debug company state changes
  useEffect(() => {
    if (company) {
      console.log('%c ============ COMPANY STATE UPDATED ============', 'background: #222; color: #bada55');
      console.log('Company state updated:', company);
    }
  }, [company]);

  const fetchCompanyData = async () => {
    console.log('%c ============ FETCH COMPANY DATA STARTED ============', 'background: #222; color: #bada55');
    setLoading(true);
    try {
      if (!companyId) {
        console.error('ERROR: No companyId provided to modal');
        setLoading(false);
        return;
      }
      
      console.log('Fetching data for company ID:', companyId);
      console.log('companyId JSON string:', JSON.stringify(companyId));
      
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
        
      if (companyError) {
        console.error('Error fetching company data:', companyError);
        throw companyError;
      }
      
      if (!companyData) {
        console.error('No company data found for ID:', companyId);
        setLoading(false);
        return;
      }
      
      console.log('%c ============ COMPANY DATA FETCHED ============', 'background: #222; color: #bada55');
      console.log('Company data fetched:', companyData);
      console.log('Company has name:', companyData.name);
      console.log('Company has category:', companyData.category);
      console.log('Company has website:', companyData.website);
      console.log('Company has linkedin:', companyData.linkedin);
      console.log('Company has description:', companyData.description);
      console.log('Company ID from fetched data:', companyData.id, 'Type:', typeof companyData.id);
      
      // Set the company data in state
      setCompany(companyData);
      
      // Explicitly set the selectedCategory for the dropdown
      setSelectedCategory(companyData.category || '');
      
      // Fetch company tags with detailed logging
      console.log('%c ============ FETCHING TAGS STARTED ============', 'background: #222; color: #bada55');
      console.log('Fetching tags for companyId:', companyId);
      
      const { data: tagsData, error: tagsError } = await supabase
        .from('companies_tags')
        .select('tags(id, name)')
        .eq('company_id', companyId);
        
      if (tagsError) {
        console.error('Error fetching company tags:', tagsError);
        throw tagsError;
      }
      
      console.log('Raw tags data:', tagsData);
      
      // Transform the data structure to be consistent with cities
      const formattedTags = tagsData.map(t => ({
        id: t.tags.id,  // This is the tag ID to use for removal
        name: t.tags.name,
        tag_id: t.tags.id  // Keep a copy of the tag_id for easier deletion
      }));
      
      console.log('Formatted tags:', formattedTags);
      setTags(formattedTags);
      
      // Fetch company cities
      console.log('%c ============ FETCHING CITIES STARTED ============', 'background: #222; color: #bada55');
      console.log('Fetching cities for companyId:', companyId);
      console.log('companyId instanceof Object:', companyId instanceof Object);
      
      // IMPORTANT DEBUGGING: Try all different forms of the company ID to see which one works
      const companyIdStr = String(companyId);
      const companyIdJSON = JSON.stringify(companyId);
      
      console.log('Debug versions of companyId:');
      console.log('- Raw:', companyId);
      console.log('- String:', companyIdStr);
      console.log('- JSON:', companyIdJSON);
      
      // Try different approaches for querying the companies_cities table
      console.log('Trying multiple ways to query companies_cities:');
      
      // Approach 1: Use raw companyId
      console.log('APPROACH 1: Raw companyId');
      const query1 = await supabase
        .from('companies_cities')
        .select('company_id, city_id')
        .eq('company_id', companyId);
      console.log('Query 1 result:', query1);
      
      // Approach 2: Use string version
      console.log('APPROACH 2: String companyId');
      const query2 = await supabase
        .from('companies_cities')
        .select('company_id, city_id')
        .eq('company_id', companyIdStr);
      console.log('Query 2 result:', query2);
      
      // Approach 3: Literal UUID value for debugging
      console.log('APPROACH 3: Hardcoded test with a literal UUID');
      // This query should return data if the issue is with our variable
      const query3 = await supabase
        .from('companies_cities')
        .select('*');
      console.log('Query 3 result (all records):', query3);
      
      // Set the one that works (using raw as default)
      const cityAssociations = query1.data || [];
      const cityAssocError = query1.error;
        
      if (cityAssocError) {
        console.error('Error fetching companies_cities:', cityAssocError);
      } else if (cityAssociations && cityAssociations.length > 0) {
        console.log('Found city associations:', cityAssociations);
        
        // Get all unique city IDs
        const cityIds = [...new Set(cityAssociations.map(item => item.city_id))];
        console.log('Unique city IDs:', cityIds);
        
        // Step 2: Fetch details for all cities
        const { data: cityDetails, error: cityDetailsError } = await supabase
          .from('cities')
          .select('id, name')
          .in('id', cityIds);
          
        if (cityDetailsError) {
          console.error('Error fetching city details:', cityDetailsError);
        } else if (cityDetails && cityDetails.length > 0) {
          console.log('City details fetched:', cityDetails);
          
          // Create a city lookup map for fast access
          const cityMap = {};
          cityDetails.forEach(city => {
            cityMap[city.id] = city;
          });
          console.log('City map created:', cityMap);
          
          // Format cities exactly as in Companies.js
          const formattedCities = cityAssociations.map(assoc => {
            console.log('Processing association:', assoc, 'looking for city_id:', assoc.city_id);
            const city = cityMap[assoc.city_id];
            console.log('Found city in map:', city);
            
            if (city) {
              // Important: The city_id in the junction table is a UUID and we should use it directly
              const formattedCity = {
                id: assoc.city_id, // Use the city_id from the junction table (this is a UUID)
                name: city.name
              };
              console.log('Created formatted city:', formattedCity);
              return formattedCity;
            }
            console.log('No city found for association, returning null');
            return null;
          }).filter(city => city !== null);
          
          console.log('Fetched cities:', formattedCities);
          setCities(formattedCities);
          
          // DON'T replace the entire company object - just update the cities
          // This was overwriting the company with only a cities property!
          setCities(formattedCities);
        } else {
          setCities([]);
        }
      } else {
        setCities([]);
      }
      
      // Fetch related contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contact_companies')
        .select('contacts(id, first_name, last_name), is_primary')
        .eq('company_id', companyId);
        
      if (contactsError) throw contactsError;
      setContacts(contactsData.map(c => ({
        ...c.contacts,
        is_primary: c.is_primary
      })));
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      console.log('Removing tag with ID:', tagId);
      
      const { error } = await supabase
        .from('companies_tags')
        .delete()
        .eq('company_id', companyId)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      // Update local state
      setTags(tags.filter(tag => tag.id !== tagId));
      console.log('Tag removed successfully');
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };
  
  const handleRemoveCity = async (cityId) => {
    try {
      console.log('%c ============ REMOVING CITY STARTED ============', 'background: #222; color: #bada55');
      console.log('Removing city with ID:', cityId, 'from company:', companyId);
      
      // IMPORTANT: Try different approaches for city ID formats
      const cityIdStr = String(cityId);
      const companyIdStr = String(companyId);
      
      console.log('Debug versions of IDs:');
      console.log('- Raw companyId:', companyId);
      console.log('- String companyId:', companyIdStr);
      console.log('- Raw cityId:', cityId);
      console.log('- String cityId:', cityIdStr);
      
      // Try multiple approaches to see which one works
      console.log('APPROACH 1: Using raw IDs');
      const delete1 = await supabase
        .from('companies_cities')
        .delete()
        .eq('company_id', companyId)
        .eq('city_id', cityId);
      console.log('Delete 1 result:', delete1);
      
      // Check if the first delete didn't work, and try a string approach
      if (delete1.error) {
        console.log('APPROACH 2: Using string IDs');
        const delete2 = await supabase
          .from('companies_cities')
          .delete()
          .eq('company_id', companyIdStr)
          .eq('city_id', cityIdStr);
        console.log('Delete 2 result:', delete2);
        
        // Use the second result if first failed
        if (!delete2.error) {
          console.log('APPROACH 2 WORKED!');
          var error = delete2.error;
        } else {
          var error = delete1.error;
        }
      } else {
        var error = delete1.error;
      }
        
      if (error) throw error;
      
      // Update local state exactly as Companies.js does
      const updatedCities = cities.filter(city => city.id !== cityId);
      setCities(updatedCities);
      
      // Also update the company object to maintain consistent structure
      setCompany({
        ...company,
        cities: updatedCities
      });
      
      console.log('City removed successfully');
    } catch (error) {
      console.error('Error removing city:', error);
    }
  };
  
  const handleRemoveCityFromHeader = async (city) => {
    console.log('Removing city from header:', city);
    try {
      // Using same approach as the working CompanyCityModal
      await handleRemoveCity(city.id);
      // No need to refresh data as we're already updating state
    } catch (error) {
      console.error('Error removing city from header:', error);
    }
  };
  
  const handleRemoveContact = async (contactId) => {
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('company_id', companyId)
        .eq('contact_id', contactId);
        
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.filter(contact => contact.id !== contactId));
    } catch (error) {
      console.error('Error removing contact:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('MMM D, YYYY');
  };
  
  // Helper function to ensure company.cities is always an array
  const getCities = () => {
    console.log('%c ============ GET CITIES CALLED ============', 'background: #222; color: #bada55');
    
    // Try multiple options to find cities
    console.log('Cities state variable:', cities);
    console.log('Company object:', company);
    if (company) console.log('company.cities:', company.cities);
    
    // Option 1: Use cities state var directly
    if (cities && cities.length > 0) {
      console.log('OPTION 1: Using cities state variable with length', cities.length);
      return cities;
    }
    
    // Option 2: Use company.cities if available
    if (company && company.cities && company.cities.length > 0) {
      console.log('OPTION 2: Using company.cities with length', company.cities.length);
      return company.cities;
    }
    
    // Option 3: If we detect any structured objects that look like cities, use those
    if (company) {
      for (const [key, value] of Object.entries(company)) {
        if (Array.isArray(value) && value.length > 0 && value[0].name) {
          console.log(`OPTION 3: Found array with name property in company.${key}:`, value);
          return value;
        }
      }
    }
    
    console.log('No cities found with any method, returning empty array');
    return [];
  };
  
  // Category handlers
  const toggleCategoryDropdown = () => {
    setShowCategoryDropdown(prev => !prev);
  };
  
  const handleCategorySelect = async (category) => {
    // Close dropdown
    setShowCategoryDropdown(false);
    setSelectedCategory(category);
    
    // Update the company in the database
    try {
      const { error } = await supabase
        .from('companies')
        .update({ category })
        .eq('id', companyId);
        
      if (error) throw error;
      
      // Update local state
      setCompany({
        ...company,
        category
      });
      
      console.log('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    if (!showCategoryDropdown) return;
    
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);
  
  // Modal handlers
  const handleOpenTagsModal = () => {
    setShowTagsModal(true);
  };
  
  const handleCloseTagsModal = () => {
    setShowTagsModal(false);
    fetchCompanyData(); // Refresh data
  };
  
  const handleOpenCityModal = () => {
    setShowCityModal(true);
  };
  
  const handleCloseCityModal = () => {
    setShowCityModal(false);
    fetchCompanyData(); // Refresh data
  };
  
  const handleOpenContactsModal = () => {
    setShowContactsModal(true);
  };
  
  const handleCloseContactsModal = () => {
    setShowContactsModal(false);
    fetchCompanyData(); // Refresh data
  };

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 75vh;
  min-height: 600px;
  overflow: hidden;
`;

  return (
    <>
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
            padding: '24px',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '75%',
            maxHeight: '85vh',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          },
        }}
      >
        <ModalContainer>
        {!loading && company && (
          <>
            {console.log('%c ============ RENDERING WITH COMPANY DATA ============', 'background: #222; color: #bada55')}
            {console.log('Rendering with company:', company)}
            {console.log('Company name for rendering:', company.name)}
            <ModalHeader>
              <ModalHeaderInfo>
                <NameAndCities>
                  <ModalTitle>{company.name || 'Company'}</ModalTitle>
                  <CityTags>
                    {(() => {
                      const displayCities = getCities();
                      console.log('%c ============ RENDERING CITIES IN JSX ============', 'background: #222; color: #bada55');
                      console.log('Cities to render:', displayCities);
                      
                      if (displayCities.length > 0) {
                        return displayCities.map(city => {
                          console.log('Rendering city:', city);
                          return (
                            <CityTag key={city.id}>
                              {city.name}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Remove button clicked for city:', city);
                                  handleRemoveCity(city.id);
                                }} 
                                title="Remove city"
                              >
                                <FaTimes size={12} />
                              </button>
                            </CityTag>
                          );
                        });
                      }
                      return null;
                    })()}
                    <AddCityButton onClick={handleOpenCityModal}>
                      <FaPlus size={12} />
                      Add City
                    </AddCityButton>
                  </CityTags>
                </NameAndCities>
                <ModalSubtitle>
                  Created on {formatDate(company.created_at)}
                  {company.modified_at && ` · Modified on ${formatDate(company.modified_at)}`}
                </ModalSubtitle>
              </ModalHeaderInfo>
              <CloseButton onClick={onClose}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>

            <TabsContainer>
              <TabButton
                active={activeTab === 'about'}
                onClick={() => setActiveTab('about')}
              >
                About
              </TabButton>
              <TabButton
                active={activeTab === 'merge'}
                onClick={() => setActiveTab('merge')}
              >
                Merge
              </TabButton>
              <TabButton
                active={activeTab === 'related'}
                onClick={() => setActiveTab('related')}
              >
                Related
              </TabButton>
              <TabButton
                active={activeTab === 'deals'}
                onClick={() => setActiveTab('deals')}
              >
                Deals
              </TabButton>
              <TabButton
                active={activeTab === 'intros'}
                onClick={() => setActiveTab('intros')}
              >
                Intros
              </TabButton>
              <TabButton
                active={activeTab === 'meetings'}
                onClick={() => setActiveTab('meetings')}
              >
                Meetings
              </TabButton>
            </TabsContainer>

            <ContentSection>
              {activeTab === 'about' && (
                <FormContent>
                  {console.log('%c ============ RENDERING ABOUT TAB ============', 'background: #222; color: #bada55')}
                  {console.log('Company for about tab:', company)}
                  {console.log('Company name for about tab:', company.name)}
                  {console.log('Company category for about tab:', company.category)}
                  {console.log('Company website for about tab:', company.website)}
                  <SectionTitle>Company Information</SectionTitle>
                  <FormGrid>
                    <FormGroup>
                      <Label htmlFor="name">Company Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={company.name || ''}
                        onChange={() => {
                          console.log('Company name change attempted');
                        }}
                        placeholder="Company name"
                      />
                      {console.log('Company name in input:', company.name)}
                    </FormGroup>
                    
                    <FormGroup ref={categoryDropdownRef}>
                      <Label htmlFor="category">Category</Label>
                      <DropdownButton 
                        type="button"
                        onClick={toggleCategoryDropdown}
                      >
                        {company.category || 'Select a category'}
                        <FaChevronDown size={12} />
                      </DropdownButton>
                      {console.log('Company category in dropdown:', company.category)}
                      
                      {showCategoryDropdown && (
                        <DropdownMenu>
                          {COMPANY_CATEGORIES.map((category) => (
                            <DropdownItem
                              key={category}
                              active={category === company.category}
                              onClick={() => handleCategorySelect(category)}
                            >
                              {category}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      )}
                    </FormGroup>
                    
                    <FormGroup>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="text"
                        value={company.website || ''}
                        onChange={() => {}}
                        placeholder="https://example.com"
                      />
                      {console.log('Company website in input:', company.website)}
                    </FormGroup>
                    
                    {/* LinkedIn */}
                    <FormGroup>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="text"
                        value={company.linkedin || ''}
                        onChange={() => {}}
                        placeholder="LinkedIn profile URL"
                      />
                    </FormGroup>
                    
                    {/* Tags section */}
                    <FormGroup style={{ marginTop: '5px' }}>
                      <Label>Keywords</Label>
                      <TagsList>
                        {tags.length > 0 ? (
                          tags.map(tag => {
                            const color = getTagColor(tag.name);
                            return (
                              <Tag 
                                key={tag.id} 
                                color={color.bg}
                                textColor={color.text}
                              >
                                <span title={tag.name}>
                                  {tag.name.length > 25 ? `${tag.name.substring(0, 25)}...` : tag.name}
                                </span>
                                <button onClick={() => handleRemoveTag(tag.tag_id || tag.id)} title="Remove tag">
                                  <FaTimes size={12} />
                                </button>
                              </Tag>
                            );
                          })
                        ) : (
                          <div style={{ margin: '5px 0', color: '#6b7280', fontSize: '0.75rem' }}>No keywords added</div>
                        )}
                      </TagsList>
                      <div>
                        <ActionButton onClick={handleOpenTagsModal} style={{ backgroundColor: 'white', border: 'none', padding: '4px 0' }}>
                          <FaTag size={14} /> Manage Tags
                        </ActionButton>
                      </div>
                    </FormGroup>
                    
                    {/* Related Contacts section - moved next to Keywords */}
                    <FormGroup style={{ marginTop: '10px' }}>
                      <Label style={{ marginBottom: '12px' }}>Related Contacts</Label>
                      <div>
                        {contacts.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', marginTop: '5px' }}>
                            {contacts.map(contact => (
                              <div 
                                key={contact.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.3rem 0.6rem',  /* Increased padding */
                                  fontSize: '0.8rem',  /* Increased font size */
                                  borderRadius: '0.375rem',
                                  backgroundColor: 'white',
                                  color: 'black',
                                  fontWeight: 500,
                                  marginRight: '0.5rem',  /* Increased margin between bubbles */
                                  marginBottom: '0.5rem', /* Increased vertical spacing */
                                  border: '1px solid black'
                                }}
                              >
                                <span style={{ marginRight: '10px' }}>
                                  {contact.first_name} {contact.last_name}
                                  {contact.is_primary && (
                                    <span style={{ 
                                      marginLeft: '6px',
                                      fontSize: '0.65rem',
                                      padding: '2px 5px',
                                      backgroundColor: 'black',
                                      color: 'white',
                                      borderRadius: '3px'
                                    }}>P</span>
                                  )}
                                </span>
                                <button 
                                  onClick={() => handleRemoveContact(contact.id)} 
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '0.25rem',
                                    color: '#6b7280',
                                    cursor: 'pointer'
                                  }}
                                  title="Remove contact"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ margin: '5px 0', color: '#6b7280', fontSize: '0.75rem' }}>No contacts associated</div>
                        )}
                        <div>
                          <ActionButton onClick={handleOpenContactsModal} style={{ backgroundColor: 'white', border: 'none', padding: '4px 0' }}>
                            <FaUser size={14} /> Manage Contacts
                          </ActionButton>
                        </div>
                      </div>
                    </FormGroup>
                    
                    <FormGroup className="full-width">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={company.description || ''}
                        onChange={() => {}}
                        placeholder="Company description"
                      />
                    </FormGroup>
                  </FormGrid>
                </FormContent>
              )}
              
              {activeTab === 'merge' && (
                <div>Merge functionality will be implemented here</div>
              )}
              
              {activeTab === 'related' && (
                <div>Related companies will be displayed here</div>
              )}
              
              {activeTab === 'deals' && (
                <div>Deals will be displayed here</div>
              )}
              
              {activeTab === 'intros' && (
                <div>Introductions will be displayed here</div>
              )}
              
              {activeTab === 'meetings' && (
                <div>Meetings will be displayed here</div>
              )}
            </ContentSection>
          </>
        )}
        
        {loading && <div>Loading...</div>}
        
        {!loading && company && activeTab !== 'merge' && (
          <ButtonContainer>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onClick={onClose}
            >
              Close
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onClick={() => {
                // Save changes would go here
                onClose();
              }}
            >
              Save Changes
            </button>
          </ButtonContainer>
        )}
        </ModalContainer>
      </Modal>
      
      {/* Sub-modals */}
      {showTagsModal && (
        <CompanyTagsModal
          isOpen={showTagsModal}
          onRequestClose={handleCloseTagsModal}
          company={company}
        />
      )}
      
      {showCityModal && (
        <CompanyCityModal
          isOpen={showCityModal}
          onRequestClose={handleCloseCityModal}
          company={company}
        />
      )}
      
      {showContactsModal && (
        <CompanyContactsModal
          isOpen={showContactsModal}
          onRequestClose={handleCloseContactsModal}
          company={company}
        />
      )}
    </>
  );
}

export default CompanyMainModal;
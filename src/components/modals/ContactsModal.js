import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSave, FiPlus, FiSearch, FiX as FiXCircle, FiTag, FiLink, FiTrash2, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import TagsModal from './TagsModal';
import CompanyModal from './CompanyModal';
import CityModal from './CityModal';
import { toast } from 'react-hot-toast';

// Define Contact Categories with the specified options
const ContactCategories = [
  'Founder', 
  'Professional Investor', 
  'Advisor', 
  'Team', 
  'Friend and Family', 
  'Manager', 
  'Institution', 
  'Media', 
  'Student', 
  'Supplier', 
  'Skip'
];

// Styled Components with improved styling and consistency
const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 75vh;
  min-height: 600px;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  
  .header-content {
    flex: 1;
    
    .name-and-cities {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 8px;
      
      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
      }
      
      .city-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }
    
    .dates {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.875rem;
      color: #6b7280;
      
      span {
        display: inline-block;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const TabButton = styled.button`
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#007BFF' : 'transparent'};
  color: ${props => props.active ? '#007BFF' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 0.938rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.active ? '#007BFF' : '#1f2937'};
  }
  
  &:disabled {
    color: #9ca3af;
    font-style: italic;
    cursor: not-allowed;
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
  
  &.full-width {
    grid-column: span 3;
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
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  line-height: 24px;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  line-height: 24px;
  
  /* Custom styling to ensure consistent appearance */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  
  /* Custom dropdown arrow */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }
  
  &::-ms-expand {
    display: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 90%;
  margin: 0 auto;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
`;

const SaveButton = styled(Button)`
  background-color: #007BFF;
  color: white;
  border: none;
  
  &:hover {
    background-color: #0069d9;
  }
`;

// Add new styled components for tags and companies
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
  padding: 4px 8px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#374151'};
  border-radius: 16px;
  font-size: 0.875rem;
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
    padding: 2px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  padding-right: 30px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SuggestionList = styled.div`
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #111827;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const NewItemButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: #f3f4f6;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5e7eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompanyList = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  gap: 4px;
`;

const CompanyItem = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background-color: #1d4ed8;
  color: white;
  border-radius: 4px;
  margin: 0 4px 4px 0;
  font-size: 0.875rem;
  font-weight: 500;

  span {
    margin-right: 6px;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    padding: 0;
    color: white;
    
    &:hover {
      color: #f8fafc;
    }
  }
`;

// Helper function to get a color for a tag based on its name
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
  
  let sum = 0;
  for (let i = 0; i < tagName.length; i++) {
    sum += tagName.charCodeAt(i);
  }
  
  const colorIndex = sum % colors.length;
  return colors[colorIndex];
};

// Helper function to get a color for a company
const getCompanyColor = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']; 
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

// Update the styling for buttons
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  svg {
    color: #6b7280;
    font-size: 14px;
  }
`;

// Add a styled component for the merge tab
const MergeContainer = styled.div`
  width: 90%;
  margin: 0 auto;
`;

const MergeGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => 
    props.duplicatesCount === 0 ? '1fr' : 
    props.duplicatesCount === 1 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
  };
  gap: 24px;
`;

const ContactColumn = styled.div`
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid ${props => props.isMain ? '#3b82f6' : '#e5e7eb'};
  position: relative;
  
  h3 {
    margin: 0 0 16px;
    font-size: 1rem;
    color: ${props => props.isMain ? '#3b82f6' : '#111827'};
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const SetMainButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #dbeafe;
  }
`;

const MainLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background-color: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const FieldRow = styled.div`
  margin-bottom: 12px;
  
  .label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 0.875rem;
    color: #111827;
    word-break: break-word;
  }
  
  &.empty .value {
    color: #9ca3af;
    font-style: italic;
  }
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
  
  .label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 4px;
    width: 100%;
  }
  
  &.empty .value {
    color: #9ca3af;
    font-style: italic;
    font-size: 0.875rem;
  }
`;

const CompaniesRow = styled.div`
  margin-bottom: 12px;
  
  .label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 4px;
  }
  
  .company-item {
    font-size: 0.875rem;
    background-color: #f3f4f6;
    padding: 4px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
    display: inline-block;
    margin-right: 4px;
  }
  
  &.empty .value {
    color: #9ca3af;
    font-style: italic;
    font-size: 0.875rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #fee2e2;
  color: #b91c1c;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #fecaca;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Add a styled component for the arrow button
const ArrowButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  
  &:hover {
    color: #007BFF;
  }
`;

// Add styled components for the tags and companies in the Merge tab
const TransferButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  margin-left: 4px;
  padding: 0;
  
  &:hover {
    color: #1d4ed8;
  }
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  margin-left: 4px;
  padding: 0;
  
  &:hover {
    color: #1d4ed8;
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #1d4ed8;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 4px;
  
  &:hover {
    background-color: #eff6ff;
  }
`;

// Update CityTag component to include remove button
const CityTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  margin-left: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  gap: 4px;

  button {
    background: none;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    cursor: pointer;
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
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  margin-left: 8px;
  gap: 4px;
  
  &:hover {
    background-color: #e0f2fe;
    border-radius: 4px;
  }
`;

const NotificationDot = styled.span`
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  display: inline-block;
  margin-left: 6px;
`;

const ContactsModal = ({ isOpen, onRequestClose, contact }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    email2: '',
    email3: '',
    mobile: '',
    mobile2: '',
    job_title: '',
    contact_category: '',
    about_the_contact: '',
    linkedin: ''
  });
  
  // State for tags and companies
  const [contactTags, setContactTags] = useState([]);
  const [relatedCompanies, setRelatedCompanies] = useState([]);
  
  // Add state for contact cities
  const [contactCities, setContactCities] = useState([]);
  
  // State for external modals
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  
  // State for duplicate contacts
  const [duplicateContacts, setDuplicateContacts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // State to track the main contact
  const [mainContact, setMainContact] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  
  const [showCityModal, setShowCityModal] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  
  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        email2: contact.email2 || '',
        email3: contact.email3 || '',
        mobile: contact.mobile || '',
        mobile2: contact.mobile2 || '',
        job_title: contact.job_title || '',
        contact_category: contact.contact_category || '',
        about_the_contact: contact.about_the_contact || '',
        linkedin: contact.linkedin || ''
      });
      
      // Set the main contact
      setMainContact(contact);
      
      // Fetch tags and companies when contact changes
      fetchContactTags();
      fetchRelatedCompanies();
      
      // Fetch contact cities
      fetchContactCities();
    }
  }, [contact]);
  
  // Function to handle making a duplicate the main contact
  const handleMakeMainContact = async (duplicateId) => {
    try {
      setIsSwapping(true);
      
      // Find the duplicate contact to make main
      const duplicateToMake = duplicateContacts.find(dup => dup.id === duplicateId);
      
      if (!duplicateToMake) {
        throw new Error('Duplicate contact not found');
      }
      
      // Show status notification
      toast.loading('Swapping contacts...');
      
      // Update the UI with the duplicate's information
      setFormData({
        first_name: duplicateToMake.first_name || '',
        last_name: duplicateToMake.last_name || '',
        email: duplicateToMake.email || '',
        email2: duplicateToMake.email2 || '',
        email3: duplicateToMake.email3 || '',
        mobile: duplicateToMake.mobile || '',
        mobile2: duplicateToMake.mobile2 || '',
        job_title: duplicateToMake.job_title || '',
        contact_category: duplicateToMake.contact_category || '',
        about_the_contact: duplicateToMake.about_the_contact || '',
        linkedin: duplicateToMake.linkedin || ''
      });
      
      // Swap the tags, companies, and cities
      // Set the main contact's tags, companies, and cities
      setContactTags(duplicateToMake.tags || []);
      setRelatedCompanies(duplicateToMake.companies || []);
      setContactCities(duplicateToMake.cities || []);
      
      // Update the main contact reference
      setMainContact(duplicateToMake);
      
      // Update the duplicates list by removing the new main contact and adding the old main contact
      const oldMain = contact;
      
      // Get the old main contact's tags, companies, and cities
      const oldMainTags = contactTags;
      const oldMainCompanies = relatedCompanies;
      const oldMainCities = contactCities;
      
      // Create an updated version of the old main contact with its details
      const oldMainWithDetails = {
        ...oldMain,
        tags: oldMainTags,
        companies: oldMainCompanies,
        cities: oldMainCities
      };
      
      // Update the duplicates list
      setDuplicateContacts(prev => 
        prev.filter(dup => dup.id !== duplicateId).concat([oldMainWithDetails])
      );
      
      toast.dismiss();
      toast.success('Main contact changed successfully');
      
    } catch (error) {
      console.error('Error making duplicate the main contact:', error);
      toast.error('Failed to change main contact');
    } finally {
      setIsSwapping(false);
    }
  };
  
  // Add effect to find duplicates when the active tab is 'merge'
  useEffect(() => {
    if (activeTab === 'merge' && contact) {
      fetchDuplicateContacts();
    }
  }, [activeTab, contact]);
  
  // Add effect to check for duplicates
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!contact || !contact.first_name || !contact.last_name) return;
      
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id')
          .eq('first_name', contact.first_name)
          .eq('last_name', contact.last_name)
          .neq('id', contact.id);
          
        if (error) throw error;
        setHasDuplicates(data && data.length > 0);
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    };

    checkDuplicates();
  }, [contact]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Update fetchDuplicateContacts to also fetch cities for duplicate contacts
  const fetchDuplicateContacts = async () => {
    if (!contact || !contact.first_name || !contact.last_name) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('first_name', contact.first_name)
        .eq('last_name', contact.last_name)
        .neq('id', contact.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Get tags, companies, and cities for each duplicate contact
      const duplicatesWithDetails = await Promise.all(
        data.map(async (dupContact) => {
          const tagData = await fetchContactTagsForContact(dupContact.id);
          const companyData = await fetchRelatedCompaniesForContact(dupContact.id);
          const cityData = await fetchContactCitiesForContact(dupContact.id);
          
          return {
            ...dupContact,
            tags: tagData,
            companies: companyData,
            cities: cityData
          };
        })
      );
      
      setDuplicateContacts(duplicatesWithDetails);
    } catch (error) {
      console.error('Error fetching duplicate contacts:', error);
    }
  };
  
  // Add function to fetch cities for a specific contact
  const fetchContactCitiesForContact = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('contact_cities')
        .select(`
          city_id,
          cities:city_id(id, name)
        `)
        .eq('contact_id', contactId);
        
      if (error) throw error;
      
      return data.map(item => ({
        id: item.city_id,
        name: item.cities.name
      }));
    } catch (error) {
      console.error('Error fetching contact cities:', error);
      return [];
    }
  };
  
  // Add function to handle removing a city from a duplicate contact
  const handleRemoveDuplicateCity = async (duplicateId, cityId) => {
    try {
      // Make sure we're deleting from the correct duplicate contact
      const { error } = await supabase
        .from('contact_cities')
        .delete()
        .eq('contact_id', duplicateId)
        .eq('city_id', cityId);
      
      if (error) throw error;
      
      // Update the local state to reflect the change
      setDuplicateContacts(prev => 
        prev.map(dup => {
          if (dup.id === duplicateId) {
            return {
              ...dup,
              cities: dup.cities.filter(city => city.id !== cityId)
            };
          }
          return dup;
        })
      );
      
      toast.success('City removed successfully');
    } catch (error) {
      console.error('Error removing city:', error);
      toast.error('Failed to remove city');
    }
  };
  
  // Add function to handle city removal
  const handleRemoveCityFromHeader = async (cityToRemove) => {
    try {
      const { error } = await supabase
        .from('contact_cities')
        .delete()
        .match({ contact_id: contact.id, city_id: cityToRemove.id });
        
      if (error) throw error;
      
      setContactCities(prev => prev.filter(city => city.id !== cityToRemove.id));
      toast.success('City removed successfully');
    } catch (error) {
      console.error('Error removing city:', error);
      toast.error('Failed to remove city');
    }
  };
  
  // Add function to transfer a city from a duplicate to the main contact
  const handleTransferCity = async (city) => {
    try {
      // Check if the city already exists for the main contact
      const cityExists = contactCities.some(c => c.id === city.id);
      
      if (!cityExists) {
        // Add the city to the main contact
        const { error } = await supabase
          .from('contact_cities')
          .insert({ contact_id: contact.id, city_id: city.id });
        
        if (error) throw error;
        
        // Update the local state
        setContactCities(prev => [...prev, city]);
        toast.success('City added to main contact');
      } else {
        toast.info('City already exists on main contact');
      }
    } catch (error) {
      console.error('Error transferring city:', error);
      toast.error('Failed to transfer city');
    }
  };
  
  // Add function to fetch duplicate contacts
  const fetchContactTagsForContact = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select(`
          tag_id,
          tags:tag_id(id, name)
        `)
        .eq('contact_id', contactId);
        
      if (error) throw error;
      
      return data.map(item => ({
        id: item.tag_id,
        name: item.tags.name
      }));
    } catch (error) {
      console.error('Error fetching contact tags:', error);
      return [];
    }
  };
  
  const fetchRelatedCompaniesForContact = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          company_id,
          companies:company_id(id, name, website, category)
        `)
        .eq('contact_id', contactId);
        
      if (error) throw error;
      
      return data.map(item => ({
        id: item.company_id,
        name: item.companies.name,
        website: item.companies.website,
        category: item.companies.category
      }));
    } catch (error) {
      console.error('Error fetching related companies:', error);
      return [];
    }
  };
  
  // Add function to delete duplicate contact with cascading deletion for associations
  const handleDeleteDuplicate = async (duplicateId) => {
    console.log('Attempting to delete duplicate with ID:', duplicateId); // Debug log
    setIsDeleting(true);
    setDeleteSuccess('');
    setDeleteError('');
    
    try {
      // Create a loading toast notification
      toast.loading('Deleting contact and related data...');
      
      // First delete all associated records for this contact to ensure clean deletion
      // 1. Delete contact_tags associations
      const { error: tagsError } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', duplicateId);
        
      if (tagsError) {
        console.error('Error deleting contact tags:', tagsError);
        // Continue with other deletions even if this fails
      }
      
      // 2. Delete contact_companies associations
      const { error: companiesError } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', duplicateId);
        
      if (companiesError) {
        console.error('Error deleting contact companies:', companiesError);
        // Continue with other deletions even if this fails
      }
      
      // 3. Delete contact_cities associations
      const { error: citiesError } = await supabase
        .from('contact_cities')
        .delete()
        .eq('contact_id', duplicateId);
        
      if (citiesError) {
        console.error('Error deleting contact cities:', citiesError);
        // Continue with other deletions even if this fails
      }
      
      // Now delete the contact itself
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', duplicateId);
        
      if (error) throw error;
      
      // Update local state to remove the deleted contact
      setDuplicateContacts(prev => {
        const updatedContacts = prev.filter(c => c.id !== duplicateId);
        console.log('Updated duplicate contacts:', updatedContacts); // Debug log
        return updatedContacts;
      });
      
      // Dismiss loading toast and show success
      toast.dismiss();
      toast.success('Contact and all related data deleted successfully');
      setDeleteSuccess(`Contact deleted successfully.`);
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.dismiss();
      toast.error('Failed to delete contact');
      setDeleteError('Failed to delete contact. Please try again.');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setDeleteError('');
      }, 3000);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Add function to transfer field value from duplicate to main contact
  const handleTransferField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add function to save main contact changes
  const handleSaveMainContact = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(formData)
        .eq('id', contact.id);
      
      if (error) throw error;
      
      alert('Main contact updated successfully.');
    } catch (error) {
      console.error('Error updating main contact:', error);
      alert('Failed to update main contact. Please try again.');
    }
  };
  
  // Tags functionality
  const fetchContactTags = async () => {
    if (!contact || !contact.id) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select(`
          tag_id,
          tags:tag_id(id, name)
        `)
        .eq('contact_id', contact.id);
        
      if (error) throw error;
      
      const formattedTags = data.map(item => ({
        id: item.tag_id,
        name: item.tags.name
      }));
      
      setContactTags(formattedTags);
    } catch (error) {
      console.error('Error fetching contact tags:', error);
    }
  };
  
  const handleRemoveTag = async (tagToRemove) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.id)
        .eq('tag_id', tagToRemove.id);
        
      if (error) throw error;
      
      setContactTags(prev => prev.filter(tag => tag.id !== tagToRemove.id));
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };
  
  // Companies functionality
  const fetchRelatedCompanies = async () => {
    if (!contact || !contact.id) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          company_id,
          companies:company_id(id, name, website, category)
        `)
        .eq('contact_id', contact.id);
        
      if (error) throw error;
      
      const formattedCompanies = data.map(item => ({
        id: item.company_id,
        name: item.companies.name,
        website: item.companies.website,
        category: item.companies.category
      }));
      
      setRelatedCompanies(formattedCompanies);
    } catch (error) {
      console.error('Error fetching related companies:', error);
    }
  };
  
  const handleRemoveCompany = async (companyToRemove) => {
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', contact.id)
        .eq('company_id', companyToRemove.id);
        
      if (error) throw error;
      
      setRelatedCompanies(prev => prev.filter(company => company.id !== companyToRemove.id));
    } catch (error) {
      console.error('Error removing company:', error);
    }
  };
  
  // Modal handlers
  const handleOpenTagsModal = () => {
    setShowTagsModal(true);
  };
  
  const handleCloseTagsModal = () => {
    setShowTagsModal(false);
    fetchContactTags(); // Refresh tags after modal closes
  };
  
  const handleOpenCompanyModal = () => {
    setShowCompanyModal(true);
  };
  
  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    fetchRelatedCompanies(); // Refresh companies after modal closes
  };
  
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          email2: formData.email2,
          email3: formData.email3,
          mobile: formData.mobile,
          mobile2: formData.mobile2,
          job_title: formData.job_title,
          contact_category: formData.contact_category,
          about_the_contact: formData.about_the_contact,
          linkedin: formData.linkedin,
          last_modified: new Date()
        })
        .eq('id', contact.id);
        
      if (error) throw error;
      
      onRequestClose();
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Failed to update contact. Please try again.');
    }
  };
  
  // Add function to fetch contact cities
  const fetchContactCities = async () => {
    if (!contact) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_cities')
        .select(`
          city_id,
          cities:city_id(id, name)
        `)
        .eq('contact_id', contact.id);
        
      if (error) throw error;
      
      const cities = data.map(item => ({
        id: item.city_id,
        name: item.cities.name
      }));
      
      setContactCities(cities);
    } catch (error) {
      console.error('Error fetching contact cities:', error);
      setContactCities([]);
    }
  };
  
  // Add function to handle opening city modal
  const handleOpenCityModal = () => {
    setShowCityModal(true);
  };

  // Add function to handle closing city modal
  const handleCloseCityModal = () => {
    setShowCityModal(false);
    fetchContactCities(); // Refresh cities after modal closes
  };
  
  // Add back the renderAboutTab function
  const renderAboutTab = () => {
    return (
      <FormContent>
        <SectionTitle>Contact Information</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter first name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Enter last name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              placeholder="Enter job title"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="contact_category">Main Category</Label>
            <Select
              id="contact_category"
              name="contact_category"
              value={formData.contact_category}
              onChange={handleInputChange}
            >
              <option value="">Select Category</option>
              {ContactCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Keywords</Label>
            <TagsList>
              {contactTags.map((tag) => {
                const { bg, text } = getTagColor(tag.name);
                return (
                  <Tag key={tag.id} color={bg} textColor={text}>
                    <span>{tag.name}</span>
                    <button onClick={() => handleRemoveTag(tag)}>
                      <FiX size={14} />
                    </button>
                  </Tag>
                );
              })}
            </TagsList>
            <ActionButton onClick={handleOpenTagsModal}>
              <FiTag size={14} /> Manage Tags
            </ActionButton>
          </FormGroup>
          
          <FormGroup>
            <Label>Related Companies</Label>
            <TagsList>
              {relatedCompanies.map((company) => (
                <CompanyItem key={company.id}>
                  <span>{company.name}</span>
                  <button onClick={() => handleRemoveCompany(company)}>
                    <FiX size={14} />
                  </button>
                </CompanyItem>
              ))}
            </TagsList>
            <ActionButton onClick={handleOpenCompanyModal}>
              <FiLink size={14} /> Manage Companies
            </ActionButton>
          </FormGroup>
        </FormGrid>
        
        <SectionTitle>Contact Details</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="text"
              name="linkedin"
              value={formData.linkedin || ''}
              onChange={handleInputChange}
              placeholder="https://www.linkedin.com/in/username"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              placeholder="+447597685011"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="mobile2">Mobile 2</Label>
            <Input
              id="mobile2"
              type="tel"
              name="mobile2"
              value={formData.mobile2}
              onChange={handleInputChange}
              placeholder="+447597685011"
            />
          </FormGroup>
        </FormGrid>
        
        <FormGrid>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email2">Email 2</Label>
            <Input
              id="email2"
              type="email"
              name="email2"
              value={formData.email2}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email3">Email 3</Label>
            <Input
              id="email3"
              type="email"
              name="email3"
              value={formData.email3}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </FormGroup>
        </FormGrid>
        
        <SectionTitle>Additional Information</SectionTitle>
        <FormGrid>
          <FormGroup className="full-width">
            <Label htmlFor="about_the_contact">About the Contact</Label>
            <TextArea
              id="about_the_contact"
              name="about_the_contact"
              value={formData.about_the_contact}
              onChange={handleInputChange}
              placeholder="Enter notes and details about this contact..."
            />
          </FormGroup>
        </FormGrid>
      </FormContent>
    );
  };

  // Update the renderMergeTab function to include cities
  const renderMergeTab = () => {
    // Check if we have any duplicate contacts
    if (duplicateContacts.length === 0) {
      return (
        <MergeContainer>
          <p style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            No duplicate contacts found for {contact.first_name} {contact.last_name}.
          </p>
        </MergeContainer>
      );
    }
    
    // Fetch main contact's tags, companies, and cities for comparison
    const mainContactWithDetails = {
      ...contact,
      tags: contactTags,
      companies: relatedCompanies,
      cities: contactCities
    };
    
    // Function to handle removing a tag from a duplicate contact
    const handleRemoveDuplicateTag = async (duplicateId, tagId) => {
      try {
        const { error } = await supabase
          .from('contact_tags')
          .delete()
          .match({ contact_id: duplicateId, tag_id: tagId });
        
        if (error) throw error;
        
        // Update the local state to reflect the change
        setDuplicateContacts(prev => 
          prev.map(dup => {
            if (dup.id === duplicateId) {
              return {
                ...dup,
                tags: dup.tags.filter(tag => tag.id !== tagId)
              };
            }
            return dup;
          })
        );
        
        toast.success('Tag removed successfully');
      } catch (error) {
        console.error('Error removing tag:', error);
        toast.error('Failed to remove tag');
      }
    };
    
    // Function to handle removing a company from a duplicate contact
    const handleRemoveDuplicateCompany = async (duplicateId, companyId) => {
      try {
        const { error } = await supabase
          .from('contact_companies')
          .delete()
          .match({ contact_id: duplicateId, company_id: companyId });
        
        if (error) throw error;
        
        // Update the local state to reflect the change
        setDuplicateContacts(prev => 
          prev.map(dup => {
            if (dup.id === duplicateId) {
              return {
                ...dup,
                companies: dup.companies.filter(company => company.id !== companyId)
              };
            }
            return dup;
          })
        );
        
        toast.success('Company removed successfully');
      } catch (error) {
        console.error('Error removing company:', error);
        toast.error('Failed to remove company');
      }
    };
    
    // Function to transfer a tag from a duplicate to the main contact
    const handleTransferTag = async (tag) => {
      try {
        // Check if the tag already exists for the main contact
        const tagExists = contactTags.some(t => t.id === tag.id);
        
        if (!tagExists) {
          // Add the tag to the main contact
          const { error } = await supabase
            .from('contact_tags')
            .insert({ contact_id: contact.id, tag_id: tag.id });
          
          if (error) throw error;
          
          // Update the local state
          setContactTags(prev => [...prev, tag]);
          toast.success('Tag added to main contact');
        } else {
          toast.info('Tag already exists on main contact');
        }
      } catch (error) {
        console.error('Error transferring tag:', error);
        toast.error('Failed to transfer tag');
      }
    };
    
    // Function to transfer a company from a duplicate to the main contact
    const handleTransferCompany = async (company) => {
      try {
        // Check if the company already exists for the main contact
        const companyExists = relatedCompanies.some(c => c.id === company.id);
        
        if (!companyExists) {
          // Add the company to the main contact
          const { error } = await supabase
            .from('contact_companies')
            .insert({ contact_id: contact.id, company_id: company.id });
          
          if (error) throw error;
          
          // Update the local state
          setRelatedCompanies(prev => [...prev, company]);
          toast.success('Company added to main contact');
        } else {
          toast.info('Company already exists on main contact');
        }
      } catch (error) {
        console.error('Error transferring company:', error);
        toast.error('Failed to transfer company');
      }
    };
    
    return (
      <MergeContainer>
        {deleteSuccess && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px' }}>
            {deleteSuccess}
          </div>
        )}
        
        {deleteError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px' }}>
            {deleteError}
          </div>
        )}
        
        <h3 style={{ marginBottom: '16px' }}>Duplicate Contacts</h3>
        <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.875rem' }}>
          The following contacts have the same name. Review and delete duplicates as needed.
        </p>
        
        <MergeGrid duplicatesCount={duplicateContacts.length}>
          {/* Main contact column */}
          <ContactColumn isMain={true}>
            <h3>
              <MainLabel>
                <FiCheckCircle size={12} />
                Main Contact
              </MainLabel>
            </h3>
            
            <FieldRow>
              <div className="label">ID</div>
              <div className="value">{mainContactWithDetails.id}</div>
            </FieldRow>
            
            <FieldRow>
              <div className="label">Created</div>
              <div className="value">{formatDate(mainContactWithDetails.created_at)}</div>
            </FieldRow>
            
            <FieldRow>
              <div className="label">Last Modified</div>
              <div className="value">{formatDate(mainContactWithDetails.last_modified)}</div>
            </FieldRow>
            
            <FieldRow>
              <div className="label">Email</div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="value"
              />
            </FieldRow>
            
            <FieldRow>
              <div className="label">Email 2</div>
              <input
                type="email"
                name="email2"
                value={formData.email2}
                onChange={handleInputChange}
                className="value"
              />
            </FieldRow>
            
            <FieldRow>
              <div className="label">Email 3</div>
              <input
                type="email"
                name="email3"
                value={formData.email3}
                onChange={handleInputChange}
                className="value"
              />
            </FieldRow>
            
            <FieldRow>
              <div className="label">Mobile</div>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="value"
              />
            </FieldRow>
            
            <FieldRow>
              <div className="label">Mobile 2</div>
              <input
                type="tel"
                name="mobile2"
                value={formData.mobile2}
                onChange={handleInputChange}
                className="value"
              />
            </FieldRow>
            
            <FieldRow>
              <div className="label">LinkedIn</div>
              <input
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                className="value"
              />
            </FieldRow>
            
            <TagsRow>
              <div className="label">Tags</div>
              <div className="value-container">
                {mainContactWithDetails.tags.length > 0 ? (
                  <div className="tags-list">
                    {mainContactWithDetails.tags.map(tag => {
                      const { bg, text } = getTagColor(tag.name);
                      return (
                        <Tag key={tag.id} color={bg} textColor={text} style={{ margin: '0 4px 4px 0' }}>
                          <span>{tag.name}</span>
                          <RemoveButton onClick={() => handleRemoveTag(tag)}>
                            <FiXCircle size={14} />
                          </RemoveButton>
                        </Tag>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-message">No tags</div>
                )}
                <AddButton onClick={handleOpenTagsModal}>
                  <FiPlus size={16} />
                  Add Tags
                </AddButton>
              </div>
            </TagsRow>
            
            <TagsRow>
              <div className="label">Companies</div>
              <div className="value-container">
                {mainContactWithDetails.companies.length > 0 ? (
                  <div className="tags-list">
                    {mainContactWithDetails.companies.map(company => (
                      <CompanyItem key={company.id}>
                        <span>{company.name}</span>
                        <RemoveButton onClick={() => handleRemoveCompany(company)}>
                          <FiXCircle size={14} />
                        </RemoveButton>
                      </CompanyItem>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">No companies</div>
                )}
                <AddButton onClick={handleOpenCompanyModal}>
                  <FiPlus size={16} />
                  Add Company
                </AddButton>
              </div>
            </TagsRow>
            
            {/* Add Cities section for main contact */}
            <TagsRow>
              <div className="label">Cities</div>
              <div className="value-container">
                {mainContactWithDetails.cities.length > 0 ? (
                  <div className="tags-list">
                    {mainContactWithDetails.cities.map(city => (
                      <CityTag key={city.id}>
                        <span>{city.name}</span>
                        <RemoveButton onClick={() => handleRemoveCityFromHeader(city)}>
                          <FiXCircle size={14} />
                        </RemoveButton>
                      </CityTag>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">No cities</div>
                )}
              </div>
            </TagsRow>
            
            <ButtonContainer>
              <SaveButton onClick={handleSaveMainContact}>
                <FiSave size={16} />
                Save Main Contact
              </SaveButton>
            </ButtonContainer>
          </ContactColumn>
          
          {/* Duplicate contact columns */}
          {duplicateContacts.map(duplicate => (
            <ContactColumn key={duplicate.id}>
              <h3>
                <span>Duplicate</span>
                <SetMainButton 
                  onClick={() => handleMakeMainContact(duplicate.id)}
                  disabled={isSwapping}
                >
                  Make Main
                </SetMainButton>
              </h3>
              
              <FieldRow>
                <div className="label">ID</div>
                <div className="value">{duplicate.id}</div>
              </FieldRow>
              
              <FieldRow>
                <div className="label">Created</div>
                <div className="value">{formatDate(duplicate.created_at)}</div>
              </FieldRow>
              
              <FieldRow>
                <div className="label">Last Modified</div>
                <div className="value">{formatDate(duplicate.last_modified)}</div>
              </FieldRow>
              
              <FieldRow className={!duplicate.email ? 'empty' : ''}>
                <div className="label">Email</div>
                <div className="value">{duplicate.email || 'Not set'}</div>
                <ArrowButton onClick={() => handleTransferField('email', duplicate.email)}>
                  <FiArrowLeft size={16} />
                </ArrowButton>
              </FieldRow>
              
              <FieldRow className={!duplicate.email2 ? 'empty' : ''}>
                <div className="label">Email 2</div>
                <div className="value">{duplicate.email2 || 'Not set'}</div>
                <ArrowButton onClick={() => handleTransferField('email2', duplicate.email2)}>
                  <FiArrowLeft size={16} />
                </ArrowButton>
              </FieldRow>
              
              <FieldRow className={!duplicate.email3 ? 'empty' : ''}>
                <div className="label">Email 3</div>
                <div className="value">{duplicate.email3 || 'Not set'}</div>
                <ArrowButton onClick={() => handleTransferField('email3', duplicate.email3)}>
                  <FiArrowLeft size={16} />
                </ArrowButton>
              </FieldRow>
              
              <FieldRow className={!duplicate.mobile ? 'empty' : ''}>
                <div className="label">Mobile</div>
                <div className="value">{duplicate.mobile || 'Not set'}</div>
                <ArrowButton onClick={() => handleTransferField('mobile', duplicate.mobile)}>
                  <FiArrowLeft size={16} />
                </ArrowButton>
              </FieldRow>
              
              <FieldRow className={!duplicate.mobile2 ? 'empty' : ''}>
                <div className="label">Mobile 2</div>
                <div className="value">{duplicate.mobile2 || 'Not set'}</div>
                <ArrowButton onClick={() => handleTransferField('mobile2', duplicate.mobile2)}>
                  <FiArrowLeft size={16} />
                </ArrowButton>
              </FieldRow>
              
              <FieldRow className={!duplicate.linkedin ? 'empty' : ''}>
                <div className="label">LinkedIn</div>
                <div className="value">{duplicate.linkedin || 'Not set'}</div>
                <ArrowButton onClick={() => handleTransferField('linkedin', duplicate.linkedin)}>
                  <FiArrowLeft size={16} />
                </ArrowButton>
              </FieldRow>
              
              <TagsRow className={duplicate.tags.length === 0 ? 'empty' : ''}>
                <div className="label">Tags</div>
                <div className="value-container">
                  {duplicate.tags.length > 0 ? (
                    <div className="tags-list">
                      {duplicate.tags.map(tag => {
                        const { bg, text } = getTagColor(tag.name);
                        return (
                          <Tag key={tag.id} color={bg} textColor={text} style={{ margin: '0 4px 4px 0' }}>
                            <span>{tag.name}</span>
                            <RemoveButton onClick={() => handleRemoveDuplicateTag(duplicate.id, tag.id)}>
                              <FiXCircle size={14} />
                            </RemoveButton>
                            <TransferButton onClick={() => handleTransferTag(tag)}>
                              <FiArrowLeft size={14} />
                            </TransferButton>
                          </Tag>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-message">No tags</div>
                  )}
                </div>
              </TagsRow>
              
              <TagsRow className={duplicate.companies.length === 0 ? 'empty' : ''}>
                <div className="label">Companies</div>
                <div className="value-container">
                  {duplicate.companies.length > 0 ? (
                    <div className="tags-list">
                      {duplicate.companies.map(company => (
                        <CompanyItem key={company.id}>
                          <span>{company.name}</span>
                          <RemoveButton onClick={() => handleRemoveDuplicateCompany(duplicate.id, company.id)}>
                            <FiXCircle size={14} />
                          </RemoveButton>
                          <TransferButton onClick={() => handleTransferCompany(company)}>
                            <FiArrowLeft size={14} />
                          </TransferButton>
                        </CompanyItem>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-message">No companies</div>
                  )}
                </div>
              </TagsRow>
              
              {/* Add Cities section for duplicate contacts */}
              <TagsRow className={duplicate.cities && duplicate.cities.length === 0 ? 'empty' : ''}>
                <div className="label">Cities</div>
                <div className="value-container">
                  {duplicate.cities && duplicate.cities.length > 0 ? (
                    <div className="tags-list">
                      {duplicate.cities.map(city => (
                        <CityTag key={city.id}>
                          <span>{city.name}</span>
                          <RemoveButton onClick={() => handleRemoveDuplicateCity(duplicate.id, city.id)}>
                            <FiXCircle size={14} />
                          </RemoveButton>
                          <TransferButton onClick={() => handleTransferCity(city)}>
                            <FiArrowLeft size={14} />
                          </TransferButton>
                        </CityTag>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-message">No cities</div>
                  )}
                </div>
              </TagsRow>
              
              <DeleteButton 
                onClick={() => handleDeleteDuplicate(duplicate.id)}
                disabled={isDeleting}
              >
                <FiTrash2 size={16} />
                Delete Duplicate
              </DeleteButton>
            </ContactColumn>
          ))}
        </MergeGrid>
      </MergeContainer>
    );
  };
  
  return (
    <>
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
          }
        }}
      >
        <ModalContainer>
          <ModalHeader>
            <div className="header-content">
              <div className="name-and-cities">
                <h2>{`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}</h2>
                <div className="city-tags">
                  {contactCities.map(city => (
                    <CityTag key={city.id}>
                      {city.name}
                      <button onClick={() => handleRemoveCityFromHeader(city)} title="Remove city">
                        <FiX size={12} />
                      </button>
                    </CityTag>
                  ))}
                  <AddCityButton onClick={handleOpenCityModal}>
                    <FiPlus size={12} />
                    Add City
                  </AddCityButton>
                </div>
              </div>
              <div className="dates">
                <span>Created: {formatDate(contact.created_at)}</span>
                <span>Last Modified: {formatDate(contact.last_modified)}</span>
              </div>
            </div>
            <CloseButton onClick={onRequestClose} aria-label="Close modal">
              <FiX size={20} />
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
              {hasDuplicates && <NotificationDot />}
            </TabButton>
            <TabButton 
              active={activeTab === 'intros'} 
              onClick={() => setActiveTab('intros')}
              disabled
            >
              Intros (Coming Soon)
            </TabButton>
            <TabButton 
              active={activeTab === 'deals'} 
              onClick={() => setActiveTab('deals')}
              disabled
            >
              Deals (Coming Soon)
            </TabButton>
            <TabButton 
              active={activeTab === 'notes'} 
              onClick={() => setActiveTab('notes')}
              disabled
            >
              Notes (Coming Soon)
            </TabButton>
          </TabsContainer>
          
          <ContentSection>
            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'merge' && renderMergeTab()}
            {activeTab === 'intros' && <div>Intros tab content coming soon</div>}
            {activeTab === 'deals' && <div>Deals tab content coming soon</div>}
            {activeTab === 'notes' && <div>Notes tab content coming soon</div>}
          </ContentSection>
          
          {activeTab !== 'merge' && (
            <ButtonContainer>
              <CancelButton onClick={onRequestClose}>
                Cancel
              </CancelButton>
              <SaveButton onClick={handleSave}>
                <FiSave size={16} />
                Save Changes
              </SaveButton>
            </ButtonContainer>
          )}
        </ModalContainer>
      </Modal>
      
      {/* External modals */}
      {showTagsModal && (
        <TagsModal 
          isOpen={showTagsModal}
          onRequestClose={handleCloseTagsModal}
          contact={contact}
        />
      )}
      
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onRequestClose={handleCloseCompanyModal}
          contact={contact}
        />
      )}
      
      {showCityModal && (
        <CityModal
          isOpen={showCityModal}
          onRequestClose={handleCloseCityModal}
          contact={contact}
        />
      )}
    </>
  );
};

export default ContactsModal; 

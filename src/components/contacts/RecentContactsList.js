import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import { 
  FiEdit2, FiStar, FiCheck, FiX, 
  FiMail, FiExternalLink
} from 'react-icons/fi';
import { 
  FaWhatsapp, FaLinkedin, FaHubspot, FaStar
} from 'react-icons/fa';
import { format, parseISO, isValid } from 'date-fns';
import Modal from 'react-modal';
import NameEditForm from './forms/NameEditForm';
import CompanyEditForm from './forms/CompanyEditForm';
import TagsModal from '../modals/TagsModal';
import KeepInTouchModal from '../modals/KeepInTouchModal';
import CategoryModal from '../modals/CategoryModal';
import LastInteractionModal from '../modals/LastInteractionModal';

// Set the app element for react-modal
Modal.setAppElement('#root');

// Container styling
const Container = styled.div`
  position: relative;
  width: 100%;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.2s ease-in-out;
  
  p {
    background-color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }
`;

// Table styling
const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1.5rem;
  table-layout: fixed; /* Use fixed layout for better column control */
  
  /* Column width specifications - adjusted as requested */
  th:nth-child(1) { width: 21%; }    /* Name column */
  th:nth-child(2) { width: 17%; }    /* Company column */
  th:nth-child(3) { width: 18%; }    /* Tags column - reduced by 1% */
  th:nth-child(4) { width: 9%; }     /* Last Interaction column - reduced by 1% */
  th:nth-child(5) { width: 8%; }     /* Category column */
  th:nth-child(6) { width: 8%; }     /* Keep in Touch column */
  th:nth-child(7) { width: 6%; }     /* Score column */
  th:nth-child(8) { width: 13%; }    /* Actions column - increased by 2% */
  
  @media (max-width: 1200px) {
    th:nth-child(3) { width: 16%; } /* Slightly reduce Tags column on smaller screens */
    th:nth-child(8) { width: 14%; } /* Slightly increase Actions column on smaller screens */
  }
`;

const TableHead = styled.thead`
  background-color: #f9fafb;
  
  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
    white-space: nowrap;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.15s;
    
    &:hover {
      background-color: #f9fafb;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: #1f2937;
    vertical-align: middle;
    
    &.actions-cell {
      padding-right: 0.5rem; /* Reduce right padding */
      min-width: 120px; /* Increased from 110px to match column width increase */
      white-space: nowrap; /* Prevent wrapping */
      overflow: visible; /* Allow overflow */
    }
    
    .cell-content {
  display: flex;
  align-items: center;
    }
    
    .actions {
      margin-left: auto;
      display: flex;
      visibility: hidden;
    }
    
    &:hover .actions {
      visibility: visible;
    }
    
    input, select {
  width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background-color: white;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
      }
    }
  }
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  color: #6b7280;
  width: 26px; /* Slightly reduced from 28px */
  height: 26px; /* Slightly reduced from 28px */
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem; /* Slightly reduced from 1rem */
  transition: all 0.2s;
  padding: 0; /* Ensure no extra padding */
  margin: 0 1px; /* Add tiny horizontal margins */
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  
  &.edit:hover {
    color: #3b82f6;
  }
  
  &.delete:hover {
    color: #ef4444;
  }
  
  &.whatsapp:hover {
    color: #25D366;
  }
  
  &.email:hover {
    color: #4285F4;
  }
  
  &.linkedin:hover {
    color: #0077B5;
  }
  
  &.hubspot:hover {
    color: #FF7A59;
  }
`;

// Star rating component
const StarContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Star = styled.span`
  color: ${props => props.filled ? '#f59e0b' : '#d1d5db'};
  cursor: pointer;
  margin-right: 2px;
  transition: color 0.2s;
  
  &:hover {
    color: #f59e0b;
  }
`;

// Tag component
const Tag = styled.span`
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

const AddTagButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #e5e7eb;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: all 0.2s;
  
  &:hover { 
    background-color: #d1d5db;
    color: #1f2937;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%; /* Use full width of the cell */
  min-width: 0; /* Allow proper truncation */
`;

// Category badge
const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => {
    switch (props.category) {
      case 'Team': return '#e0f2fe';
      case 'Manager': return '#f0fdf4';
      case 'Advisor': return '#fef3c7';
      case 'Professional Investor': return '#ede9fe';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.category) {
      case 'Team': return '#0369a1';
      case 'Manager': return '#166534';
      case 'Advisor': return '#92400e';
      case 'Professional Investor': return '#5b21b6';
      default: return '#4b5563';
    }
  }};
  font-weight: 500;
`;

// Keep in touch badge
const KeepInTouchBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => {
    switch (props.frequency) {
      case 'Weekly': return '#fee2e2';
      case 'Monthly': return '#fef3c7';
      case 'Quarterly': return '#e0f2fe';
      case 'Do not keep': return '#f3f4f6';
      default: return '#fecaca';
    }
  }};
  color: ${props => {
    switch (props.frequency) {
      case 'Weekly': return '#b91c1c';
      case 'Monthly': return '#92400e';
      case 'Quarterly': return '#0369a1';
      case 'Do not keep': return '#4b5563';
      default: return '#b91c1c';
    }
  }};
  font-weight: 500;
`;

// Last interaction date formatter
const LastInteractionDate = styled.span`
  color: ${props => props.isRecent ? '#059669' : '#6b7280'};
  font-weight: ${props => props.isRecent ? '500' : 'normal'};
  position: relative; /* Added for overlay positioning */
`;

const HoverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
  
  span {
    background-color: #3b82f6;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

// Tooltip
const Tooltip = styled.div`
  position: relative;
  display: inline-flex;
  
  .tooltip-text {
    visibility: hidden;
    position: absolute;
    z-index: 100;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1f2937;
    color: white;
    text-align: center;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 0.7rem; /* Smaller font size */
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none; /* Prevent tooltip from interfering with clicks */
  }
  
  &:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
`;

// Actions container
const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem; /* Reduced from 0.5rem to create more compact spacing */
  flex-wrap: wrap; /* Allow wrapping if needed */
  justify-content: flex-start;
  width: 100%;
  
  /* Ensure consistent spacing when wrapping */
  & > * {
    margin-bottom: 2px;
  }
`;

// Pagination controls
const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1rem 0;
`;

const PageButton = styled.button`
  background-color: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#4b5563'};
  border: 1px solid ${props => props.active ? '#3b82f6' : '#d1d5db'};
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  margin: 0 0.25rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#2563eb' : '#f9fafb'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
`;

const PageInfo = styled.div`
  margin: 0 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

// Empty state component
// eslint-disable-next-line no-unused-vars
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 500;
    color: #4b5563;
  margin-bottom: 0.5rem;
  }
  
  p {
    color: #6b7280;
  font-size: 0.875rem;
  }
`;

// Truncated text with ellipsis
const TruncatedText = styled.span`
  display: block;
  max-width: ${props => props.maxWidth || '150px'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Company tag styling
const CompanyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  background-color: #e0f2fe;
  color: #0369a1;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  
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

const CompaniesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

// Add styled component for "More Tags" indicator
const MoreTagsIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.45rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #e5e7eb;
  color: #4b5563;
  cursor: pointer;
  line-height: 1.2;
  margin-left: 3px;
  vertical-align: top;
  transform: translateY(-1px); /* Fine-tune vertical alignment */
  
  &:hover {
    background-color: #d1d5db;
  }
`;

// Helper function to get a random color for tags
const getTagColor = (tagName) => {
  // Generate a consistent color based on the tag name
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
  
  // Use the sum of character codes to pick a color
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % colors.length;
  
  return colors[index];
};

// Create a custom hook for debounced values
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Add styled components for clickable cells
const ClickableCell = styled.td`
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  
  /* For proper content handling */
  overflow: hidden; /* Prevent content overflow */
  
  .cell-content {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0; /* Allow children to truncate */
    padding: 0.25rem 0; /* Add some vertical padding */
  }
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &:hover::after {
    content: "${props => props.hoverText || 'Click to edit'}";
  position: absolute;
    top: 0;
    right: 0;
    background-color: #3b82f6;
    color: white;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 0 0 0 4px;
    opacity: 0.8;
    z-index: 10; /* Ensure it's above other elements */
  }
`;

// Modal components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
  }
  
  button {
  background: none;
  border: none;
  cursor: pointer;
    color: #6b7280;
    
  &:hover {
      color: #1f2937;
    }
  }
`;

// Update the ContactName styling for a cleaner look
const ContactName = styled.div`
  font-weight: 500;
  color: #111827;
  
  /* Text truncation styling */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  min-width: 0;
  display: block; /* Better for consistent spacing */
`;

const ContactEmail = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 8px;
`;

const ContactActions = styled.div`
  display: flex;
  gap: 8px;
`;

// Helper function to truncate names
const truncateName = (firstName, lastName) => {
  // Create full name, handling undefined/null values
  const fullName = [(firstName || ''), (lastName || '')].filter(Boolean).join(' ');
  
  // Return default for empty names
  if (!fullName) return { 
    displayName: 'Unknown', 
    fullName: 'Unknown', 
    isTruncated: false 
  };
  
  const MAX_LENGTH = 20;
  const isTruncated = fullName.length > MAX_LENGTH;
  const displayName = isTruncated ? fullName.substring(0, MAX_LENGTH) + '...' : fullName;
  
  // For debugging - remove in production
  if (process.env.NODE_ENV === 'development' && isTruncated) {
    console.log(`Truncated name: "${fullName}" → "${displayName}" (${fullName.length} chars)`);
  }
  
  return {
    displayName,
    fullName,
    isTruncated
  };
};

// Add a styled component for the score cell
const ScoreCell = styled.td`
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f3f4f6; /* Same gray color as ClickableCell hover */
  }
`;

const RecentContactsList = ({ 
  defaultShowAll = false,
  defaultFilter = 'all',
  searchTerm = '',
  searchField = 'name'
}) => {
  // --------- STATE MANAGEMENT ---------
  // UI State - clearly separated from data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Data State
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contactTags, setContactTags] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState([]);
  
  // Editing State
  const [editingContact, setEditingContact] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Dropdown States
  const [showTagDropdown, setShowTagDropdown] = useState({});
  const [tagInput, setTagInput] = useState('');
  
  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalContact, setModalContact] = useState(null);
  const [modalType, setModalType] = useState('contact'); // 'contact', 'company', or 'tags'
  const [modalContent, setModalContent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // WhatsApp specific states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showWhatsAppDropdown, setShowWhatsAppDropdown] = useState({});
  const [mobileInput, setMobileInput] = useState('');
  const [currentContactForMobile, setCurrentContactForMobile] = useState(null);
  
  // Email specific states
  const [showEmailDropdown, setShowEmailDropdown] = useState({});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');
  const [currentContactForEmail, setCurrentContactForEmail] = useState(null);
  
  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Add a state for local validation errors
  const [mobileInputError, setMobileInputError] = useState('');
  
  // Add new state for category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedContactForCategory, setSelectedContactForCategory] = useState(null);
  
  // Add new state for LastInteractionModal
  const [showLastInteractionModal, setShowLastInteractionModal] = useState(false);
  
  // --------- DATA FETCHING FUNCTIONS ---------
  
  // Fetch contacts - core data fetching function
  const fetchContacts = useCallback(async () => {
    if (!debouncedSearchTerm && debouncedSearchTerm !== '') {
      return; // Don't fetch until debounce completes
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Build basic query
      let query = supabase
          .from('contacts')
        .select('*, companies:company_id(*)')
        .not('contact_category', 'eq', 'Skip');
      
      // Apply search if term has at least 3 characters
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
        switch (searchField) {
          case 'name':
            query = query.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`);
            break;
          case 'email':
            query = query.ilike('email', `%${debouncedSearchTerm}%`);
            break;
          case 'mobile':
            query = query.ilike('mobile', `%${debouncedSearchTerm}%`);
            break;
          case 'city':
            query = query.ilike('city', `%${debouncedSearchTerm}%`);
            break;
          // Company & tags filtering handled after fetch
          default:
            query = query.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`);
        }
      }
      
      // Apply sorting - always use last_modified as primary sort
      query = query.order('last_modified', { 
        ascending: false,
        nullsFirst: false
      });
      
      // Apply secondary sorting - always use last_interaction as secondary sort
      query = query.order('last_interaction', {
        ascending: false,
        nullsFirst: false
      });
      
      // Apply pagination
      const from = currentPage * 10;
      const to = from + 9;
      query = query.range(from, to);
      
      // Execute query
      const { data: contactsData, error: contactsError } = await query;
      
      if (contactsError) throw contactsError;
      
      // Debug log to check keep_in_touch values
      if (contactsData && contactsData.length > 0) {
        console.log("Sample contact data:", contactsData[0]);
        console.log("Keep in touch values:", contactsData.map(c => ({ 
          id: c.id, 
          keep_in_touch_frequency: c.keep_in_touch_frequency, 
          type: typeof c.keep_in_touch_frequency 
        })));
      }
      
      // Get count for pagination
      const { count, error: countError } = await supabase
          .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('contact_category', 'eq', 'Skip');
      
      if (countError) throw countError;
      
      // If we have contacts, fetch related data
      if (contactsData && contactsData.length > 0) {
        const contactIds = contactsData.map(contact => contact.id);
        
        // Fetch tags for all contacts
        const { data: tagsData, error: tagsError } = await supabase
          .from('contact_tags')
          .select('*, tag_id(*)')
          .in('contact_id', contactIds);
          
        if (tagsError) throw tagsError;
        
        // Process tags data
        const tagsMap = {};
        tagsData?.forEach(tagRel => {
          if (!tagsMap[tagRel.contact_id]) {
            tagsMap[tagRel.contact_id] = [];
          }
          
          tagsMap[tagRel.contact_id].push({
            id: tagRel.id,
            name: tagRel.tag_id.name,
            tag_id: tagRel.tag_id.id
          });
        });
        
        setContactTags(tagsMap);
        
        // Process companies data
        contactsData.forEach(contact => {
          contact.companiesList = [];
          if (contact.companies) {
            contact.companiesList.push({
              id: contact.company_id,
              name: contact.companies.name
            });
          }
        });
        
        // Apply post-filtering for special cases
        let filteredContacts = [...contactsData];
        
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
          if (searchField === 'company') {
            filteredContacts = filteredContacts.filter(contact => {
              const company = contact.companies;
              return company && company.name && 
                company.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            });
          } else if (searchField === 'tags') {
            filteredContacts = filteredContacts.filter(contact => {
              const tags = tagsMap[contact.id] || [];
              return tags.some(tag => 
                tag.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
              );
            });
          }
        }
        
        // Update data state all at once to avoid multiple renders
        setContacts(filteredContacts);
        setTotalCount(count);
        setTotalPages(Math.ceil(count / 10));
      } else {
        // No contacts found
        setContacts([]);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / 10));
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      setContacts([]);
    } finally {
      // Always clear loading when done, regardless of success/failure
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, searchField, currentPage]);
  
  // Fetch tag suggestions
  const fetchTagSuggestions = useCallback(async (searchVal = '') => {
    try {
      let query = supabase.from('tags').select('*').order('name');
      
      if (searchVal) {
        query = query.ilike('name', `%${searchVal}%`);
      }
      
      const { data, error } = await query.limit(10);
      
      if (error) throw error;
      
      setTagSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
    }
  }, []);

  // --------- EFFECT HOOKS ---------
  
  // Initial data load
  useEffect(() => {
    fetchContacts();
    fetchTagSuggestions();
  }, [fetchContacts, fetchTagSuggestions]);
  
  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, searchField]);
  
  // Add useEffect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close any open WhatsApp dropdowns when clicking outside
      if (Object.keys(showWhatsAppDropdown).some(id => showWhatsAppDropdown[id])) {
        // Check if the click was inside a dropdown
        const isDropdownClick = event.target.closest('[data-whatsapp-dropdown]');
        const isButtonClick = event.target.closest('[data-whatsapp-button]');
        
        if (!isDropdownClick && !isButtonClick) {
          // Reset all dropdowns
          setShowWhatsAppDropdown({});
        }
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWhatsAppDropdown]);
  
  // Add back the useEffect for email dropdown clicks
  useEffect(() => {
    const handleEmailClickOutside = (event) => {
      // Close any open email dropdowns when clicking outside
      if (Object.keys(showEmailDropdown).some(id => showEmailDropdown[id])) {
        // Check if the click was inside a dropdown
        const isDropdownClick = event.target.closest('[data-email-dropdown]');
        const isButtonClick = event.target.closest('[data-email-button]');
        
        if (!isDropdownClick && !isButtonClick) {
          // Reset all dropdowns
          setShowEmailDropdown({});
        }
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleEmailClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleEmailClickOutside);
    };
  }, [showEmailDropdown]);
  
  // --------- HANDLERS ---------
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      
      // Use a shorter format: D/M/YY instead of DD-MM-YYYY
      return format(date, 'd/M/yy');
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Check if date is recent
  const isRecentDate = (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return false;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      return date > sevenDaysAgo;
    } catch (err) {
      return false;
    }
  };
  
  // Handle edit operations
  const handleEditStart = (contact, field) => {
    setEditingContact(contact);
    setEditingField(field);
    setEditData({
      ...contact,
      [field]: contact[field] || ''
    });
  };
  
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = async () => {
    if (!editingContact || !editingField) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('contacts')
        .update({ [editingField]: editData[editingField] })
        .eq('id', editingContact.id);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === editingContact.id ? { ...c, [editingField]: editData[editingField] } : c
      ));
      
      // Reset editing state
      setEditingContact(null);
      setEditingField(null);
      setEditData({});
      
    } catch (err) {
      console.error('Error saving contact:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setEditingContact(null);
    setEditingField(null);
    setEditData({});
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  // Tag operations
  const handleTagDropdownToggle = (contactId) => {
    setShowTagDropdown(prev => ({
        ...prev,
      [contactId]: !prev[contactId]
    }));
    
    if (!showTagDropdown[contactId]) {
      fetchTagSuggestions();
    }
  };
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
    fetchTagSuggestions(e.target.value);
  };
  
  const handleTagSelect = async (contactId, tagId) => {
    try {
      // Check if already assigned
      const existingTags = contactTags[contactId] || [];
      if (existingTags.some(tag => tag.tag_id === tagId)) {
      return;
    }
      
      // Add tag to contact
      const { error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tagId });
      
      if (error) throw error;
      
      // Refresh data
      await fetchContacts();
      
      // Reset UI state
      setTagInput('');
      setShowTagDropdown(prev => ({
        ...prev,
        [contactId]: false
      }));
    } catch (err) {
      console.error('Error adding tag:', err);
      setError(err.message);
    }
  };
  
  const handleRemoveTag = async (contactId, tagId) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
      
      // Update local state
      setContactTags(prev => {
        const updated = { ...prev };
        if (updated[contactId]) {
          updated[contactId] = updated[contactId].filter(tag => tag.tag_id !== tagId);
        }
        return updated;
      });
    } catch (err) {
      console.error('Error removing tag:', err);
      setError(err.message);
    }
  };
  
  const handleCreateTag = async (contactId, tagName) => {
    try {
      // First create the tag
      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert({ name: tagName })
            .select()
            .single();
      
      if (createError) throw createError;
      
      // Then assign it to the contact
      await handleTagSelect(contactId, newTag.id);
    } catch (err) {
      console.error('Error creating tag:', err);
      setError(err.message);
    }
  };
  
  // Handle modal open for different types of content
  const handleOpenModal = (type, contact) => {
    setModalType(type);
    setModalContact(contact);
    setModalOpen(true);
    
    // Set appropriate modal content based on type
    switch (type) {
      case 'name':
        setModalContent(<NameEditForm contact={contact} onSave={handleSave} onClose={() => setModalOpen(false)} />);
        break;
      case 'company':
        setModalContent(<CompanyEditForm contact={contact} onSave={handleSave} onClose={() => setModalOpen(false)} />);
        break;
      case 'tags':
        setModalContent(<TagsModal isOpen={true} onRequestClose={() => setModalOpen(false)} contact={contact} />);
        break;
      case 'history':
        setModalContent(
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Communication History</h3>
            <p>Communication history view coming soon...</p>
            <button 
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        );
        break;
      default:
        setModalContent(null);
    }
  };

  // Make the entire cell clickable for company and tags
  const handleCellClick = (contact, type) => {
    if (type === 'category') {
      setSelectedContactForCategory(contact);
      setShowCategoryModal(true);
    } else if (type === 'history') {
      setModalContact(contact);
      setShowLastInteractionModal(true);
    } else {
      handleOpenModal(type, contact);
    }
  };
  
  // Skip contact
  const handleSkipContact = async (contactId) => {
    try {
      const { error } = await supabase
            .from('contacts')
        .update({ contact_category: 'Skip' })
            .eq('id', contactId);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Error skipping contact:', err);
      setError(err.message);
    }
  };
  
  // Remove company
  const handleRemoveCompany = async (contactId, companyId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ company_id: null })
        .eq('id', contactId);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => {
        if (c.id === contactId) {
          return {
            ...c,
            companies: null,
            companiesList: []
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error removing company association:', err);
      setError(err.message);
    }
  };
  
  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(0);
  const goToPrevPage = () => setCurrentPage(prev => Math.max(0, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages - 1);
  
  // Debug info display
  const renderDebug = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div style={{
        margin: '10px 0',
        padding: '10px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div><strong>Debug:</strong></div>
        <div>Search: {searchField}="{searchTerm}" / Debounced: "{debouncedSearchTerm}"</div>
        <div>Loading: {isLoading ? 'true' : 'false'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Page: {currentPage + 1} of {totalPages}</div>
        <div>Contacts: {contacts.length} shown / {totalCount} total</div>
      </div>
    );
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setShowEditModal(false);
    setModalContact(null);
  };

  // Render the modal content based on type
  const renderModalContent = () => {
    if (!modalContact) return null;
    
    // Helper function to format name
    const getFormattedName = (contact) => {
      const firstName = contact.first_name || '';
      const lastName = contact.last_name || '';
      if (!firstName && !lastName) return '(No name)';
      return `${firstName} ${lastName}`.trim();
    };
    
    switch (modalType) {
      case 'name':
        return <NameEditForm contact={modalContact} onSave={handleSave} onClose={() => setModalOpen(false)} />;
      case 'company':
        return <CompanyEditForm contact={modalContact} onSave={handleSave} onClose={() => setModalOpen(false)} />;
      case 'tags':
        return <TagsModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} contact={modalContact} />;
      case 'history':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Communication History</h3>
            <p>Communication history view coming soon...</p>
            <button 
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Handle star rating click
  const handleStarClick = async (contactId, score) => {
    try {
      // Update in Supabase
      await supabase
        .from('contacts')
        .update({ score })
        .eq('id', contactId);
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, score } : c
      ));
    } catch (error) {
      console.error('Error updating contact score:', error);
      setError(error.message);
    }
  };
  
  // Add this function to handle the WhatsApp icon click
  const handleWhatsAppClick = (contact, event) => {
    event.stopPropagation(); // Prevent event bubbling
    
    // Check if the contact has no mobile numbers
    if (!contact.mobile && !contact.mobile2) {
      // Open modal to add a mobile number
      setCurrentContactForMobile(contact);
      setMobileInput('');
      setShowWhatsAppModal(true);
    } 
    // Check if the contact has both mobile numbers
    else if (contact.mobile && contact.mobile2) {
      // Show dropdown to select between two numbers
      setShowWhatsAppDropdown(prev => ({
        ...prev,
        [contact.id]: !prev[contact.id]
      }));
    } 
    // Contact has exactly one mobile number (either mobile or mobile2)
    else {
      // Open WhatsApp with the available number
      const mobileNumber = contact.mobile || contact.mobile2;
      window.open(`https://wa.me/${mobileNumber.replace(/\D/g, '')}`, '_blank');
    }
  };
  
  // Update the handleSaveMobileNumber function
  const handleSaveMobileNumber = async () => {
    if (!currentContactForMobile || !mobileInput.trim()) {
      setMobileInputError('Please enter a mobile number');
      return;
    }
    
    try {
      // Reset error state
      setMobileInputError('');
      setIsLoading(true);
      
      // Validate phone number format
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(mobileInput.trim())) {
        setMobileInputError('Please enter a valid phone number (10-15 digits)');
        return;
      }
      
      // Determine which field to update
      const fieldToUpdate = currentContactForMobile.mobile ? 'mobile2' : 'mobile';
      
      // Update in Supabase
      const { error } = await supabase
        .from('contacts')
        .update({ [fieldToUpdate]: mobileInput.trim() })
        .eq('id', currentContactForMobile.id);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === currentContactForMobile.id ? { ...c, [fieldToUpdate]: mobileInput.trim() } : c
      ));
      
      // Close modal and reset state
      setShowWhatsAppModal(false);
      setCurrentContactForMobile(null);
      setMobileInput('');
      
    } catch (err) {
      console.error('Error saving mobile number:', err);
      setError(err.message);
      setMobileInputError('Failed to save mobile number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add this function to open WhatsApp with a specific number
  const handleOpenWhatsApp = (mobileNumber, contactId) => {
    // Close the dropdown
    setShowWhatsAppDropdown(prev => ({
      ...prev,
      [contactId]: false
    }));
    
    // Open WhatsApp
    if (mobileNumber) {
      window.open(`https://wa.me/${mobileNumber.replace(/\D/g, '')}`, '_blank');
    }
  };
  
  // Update the renderWhatsAppModal function to show which field we're updating
  const renderWhatsAppModal = () => {
    if (!showWhatsAppModal || !currentContactForMobile) return null;
    
    const getFormattedName = (contact) => {
      const firstName = contact.first_name || '';
      const lastName = contact.last_name || '';
      if (!firstName && !lastName) return '(No name)';
      return `${firstName} ${lastName}`.trim();
    };
    
    const fieldToUpdate = currentContactForMobile.mobile ? 'mobile2' : 'mobile';
    const fieldLabel = fieldToUpdate === 'mobile' ? 'Primary Mobile Number' : 'Secondary Mobile Number';
    const actionText = fieldToUpdate === 'mobile' ? 'Add' : 'Add secondary';
    
    return (
      <ModalOverlay onClick={() => setShowWhatsAppModal(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <h2>{actionText} Mobile Number</h2>
            <button onClick={() => setShowWhatsAppModal(false)}>
              <FiX size={20} />
            </button>
          </ModalHeader>
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              {actionText} a mobile number for {getFormattedName(currentContactForMobile)} to enable WhatsApp messaging.
              {fieldToUpdate === 'mobile2' && (
                <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  This will be saved as a secondary number. Primary number: {currentContactForMobile.mobile}
                </span>
              )}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="mobileInput" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {fieldLabel}:
              </label>
              <input
                id="mobileInput"
                type="tel"
                value={mobileInput}
                onChange={(e) => {
                  setMobileInput(e.target.value);
                  setMobileInputError(''); // Clear error on change
                }}
                placeholder="Enter mobile number with country code (e.g. +1234567890)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveMobileNumber();
                  } else if (e.key === 'Escape') {
                    setShowWhatsAppModal(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${mobileInputError ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
              {mobileInputError && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  {mobileInputError}
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Include the country code with + symbol (e.g. +1 for US)
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMobileNumber}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  };
  
  // Add a new handler function for LinkedIn clicks
  const handleLinkedInClick = (contact, event) => {
    event.stopPropagation(); // Prevent event bubbling
    
    if (contact.linkedin) {
      // Case 1: LinkedIn URL exists - navigate directly to the stored URL
      window.open(contact.linkedin, '_blank');
    } else {
      // Case 2: No LinkedIn URL - search for the contact on LinkedIn
      // Get the name to search for
      let searchTerms = '';
      
      // Try to use first_name and last_name
      if (contact.first_name || contact.last_name) {
        searchTerms = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      } 
      // If no name available, try email
      else if (contact.email) {
        // Extract name part from email (before @)
        searchTerms = contact.email.split('@')[0].replace(/[._]/g, ' ');
      }
      // If no email, try company name
      else if (contact.companies?.name) {
        searchTerms = contact.companies.name;
      }
      // Fallback to a default message if all else fails
      else {
        searchTerms = 'Contact';
      }
      
      // Encode the search terms and build the URL
      const encodedSearchTerms = encodeURIComponent(searchTerms);
      const linkedInSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodedSearchTerms}`;
      
      // Open LinkedIn search in a new tab
      window.open(linkedInSearchUrl, '_blank');
    }
  };
  
  // Add back the helper functions to check email availability
  const hasAnyEmail = (contact) => {
    return Boolean(contact.email || contact.email2 || contact.email3);
  };
  
  // Updated email click handler with two different behaviors
  const handleEmailClick = (contact, event) => {
    event.stopPropagation(); // Prevent event bubbling
    
    if (hasAnyEmail(contact)) {
      // Case 1: At least one email exists - directly open the search
      openSuperhuman(contact);
    } else {
      // Case 2: No emails - toggle dropdown
      setShowEmailDropdown(prev => ({
        ...prev,
        [contact.id]: !prev[contact.id]
      }));
    }
  };
  
  // Function to open Superhuman search
  const openSuperhuman = (contact) => {
    // Build search terms
    let searchTerms = '';
    
    // Try to use first_name and last_name
    if (contact.first_name || contact.last_name) {
      searchTerms = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    } 
    // If no name, try company name
    else if (contact.companies?.name) {
      searchTerms = contact.companies.name;
    }
    // Fallback
    else {
      searchTerms = 'Contact';
    }
    
    // Encode and build search URL
    const encodedSearchTerms = encodeURIComponent(searchTerms);
    const searchUrl = `https://mail.superhuman.com/search/${encodedSearchTerms}`;
    
    // Open search in new tab
    window.open(searchUrl, '_blank');
  };
  
  // Handler for "Add" option in dropdown - open email modal
  const handleAddEmail = (contact, event) => {
    event.stopPropagation(); // Prevent event bubbling
    
    // Close dropdown
    setShowEmailDropdown(prev => ({
      ...prev,
      [contact.id]: false
    }));
    
    // Open email modal
    setCurrentContactForEmail(contact);
    setEmailInput('');
    setEmailInputError('');
    setShowEmailModal(true);
  };
  
  // Handler for "Search" option in dropdown
  const handleSearchEmail = (contact, event) => {
    event.stopPropagation(); // Prevent event bubbling
    
    // Close dropdown
    setShowEmailDropdown(prev => ({
      ...prev,
      [contact.id]: false
    }));
    
    // Open Superhuman search
    openSuperhuman(contact);
  };
  
  // Handler for saving email
  const handleSaveEmail = async () => {
    if (!currentContactForEmail || !emailInput.trim()) {
      setEmailInputError('Please enter an email address');
      return;
    }
    
    try {
      // Reset error state
      setEmailInputError('');
      setIsLoading(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.trim())) {
        setEmailInputError('Please enter a valid email address');
        return;
      }
      
      // Determine which field to update - always use primary email if all are empty
      let fieldToUpdate = 'email';
      
      // Update in Supabase
      const { error } = await supabase
        .from('contacts')
        .update({ [fieldToUpdate]: emailInput.trim() })
        .eq('id', currentContactForEmail.id);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === currentContactForEmail.id ? { ...c, [fieldToUpdate]: emailInput.trim() } : c
      ));
      
      // Close modal and reset state
      setShowEmailModal(false);
      setCurrentContactForEmail(null);
      setEmailInput('');
      
    } catch (err) {
      console.error('Error saving email:', err);
      setError(err.message);
      setEmailInputError('Failed to save email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Email modal component
  const renderEmailModal = () => {
    if (!showEmailModal || !currentContactForEmail) return null;
    
    const getFormattedName = (contact) => {
      const firstName = contact.first_name || '';
      const lastName = contact.last_name || '';
      if (!firstName && !lastName) return '(No name)';
      return `${firstName} ${lastName}`.trim();
    };
    
    return (
      <ModalOverlay onClick={() => setShowEmailModal(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <h2>Add Email Address</h2>
            <button onClick={() => setShowEmailModal(false)}>
              <FiX size={20} />
            </button>
          </ModalHeader>
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              Add an email address for {getFormattedName(currentContactForEmail)}.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="emailInput" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email Address:
              </label>
              <input
                id="emailInput"
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailInputError(''); // Clear error on change
                }}
                placeholder="Enter email address"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEmail();
                  } else if (e.key === 'Escape') {
                    setShowEmailModal(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${emailInputError ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
              {emailInputError && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  {emailInputError}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  };
  
  // Add the HubSpot handler function
  const handleHubSpotClick = (contact, event) => {
    event.stopPropagation(); // Prevent event bubbling
    
    // Format name for search query (handling null/undefined)
    const formatNameForQuery = (contact) => {
      const firstName = contact.first_name || '';
      const lastName = contact.last_name || '';
      return `${firstName}+${lastName}`.trim().replace(/\++$/, ''); // Remove trailing + if last name is empty
    };
    
    let hubspotUrl;
    
    // Check if contact has a HubSpot ID
    if (contact.hubspot_id) {
      // Direct link to the contact record
      hubspotUrl = `https://app-eu1.hubspot.com/contacts/144666820/record/0-1/${contact.hubspot_id}`;
    } else {
      // Search query with name
      const searchName = formatNameForQuery(contact);
      hubspotUrl = `https://app-eu1.hubspot.com/search/144666820/search?query=${searchName}`;
    }
    
    // Open the URL in a new tab
    window.open(hubspotUrl, '_blank');
  };
  
  // Add handleCloseCategoryModal function
  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedContactForCategory(null);
    // Refresh the contacts list to show updated category
    fetchContacts();
  };
  
  // --------- RENDER ---------
  return (
    <Container>
      {process.env.NODE_ENV === 'development' && renderDebug()}
      
      {isLoading && (
        <LoadingOverlay>
          <p>Loading contacts...</p>
        </LoadingOverlay>
      )}
      
      {error && (
        <div style={{ 
          background: '#FEF2F2', 
          color: '#B91C1C', 
          padding: '1rem', 
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Update modal rendering */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '0',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              maxWidth: '500px',
              width: '90%'
            },
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }
          }}
        >
          {modalContent}
        </Modal>
      )}
      
      {showWhatsAppModal && renderWhatsAppModal()}
      
      {showEmailModal && renderEmailModal()}
      
      <ContactTable>
        <TableHead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Tags</th>
            <th>Last Interaction</th>
            <th>Category</th>
            <th>Keep in Touch</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </TableHead>
        <TableBody>
          {!isLoading && contacts.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                {debouncedSearchTerm && debouncedSearchTerm.length >= 3
                  ? `No contacts found matching "${debouncedSearchTerm}" in ${searchField}`
                  : 'No contacts found'
                }
              </td>
            </tr>
          ) : (
            contacts.map(contact => (
              <tr key={contact.id}>
                {/* NAME COLUMN */}
                <ClickableCell onClick={() => handleCellClick(contact, 'name')}>
                  <div className="cell-content">
                    <ContactName title={truncateName(contact.first_name, contact.last_name).fullName}>
                      {truncateName(contact.first_name, contact.last_name).displayName}
                    </ContactName>
                  </div>
                </ClickableCell>
                
                {/* COMPANY COLUMN */}
                <ClickableCell onClick={() => handleCellClick(contact, 'company')}>
                  <div className="cell-content">
                    <CompaniesContainer>
                      {contact.companiesList?.length > 0 ? (
                        contact.companiesList.map(company => (
                          <CompanyBadge key={company.id}>
                            {company.name}
                          </CompanyBadge>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No company</span>
                      )}
                    </CompaniesContainer>
                  </div>
                </ClickableCell>
                
                {/* TAGS COLUMN */}
                <ClickableCell onClick={() => handleCellClick(contact, 'tags')}>
                  <div className="cell-content">
                    <TagsContainer>
                      {contactTags[contact.id]?.length > 0 ? (
                        <>
                          {/* Show only first 2 tags */}
                          {contactTags[contact.id].slice(0, 2).map(tag => (
                            <Tag 
                              key={tag.id} 
                              color={getTagColor(tag.name).bg} 
                              textColor={getTagColor(tag.name).text}
                            >
                              {tag.name}
                            </Tag>
                          ))}
                          
                          {/* Show "More Tags" indicator if there are more than 2 tags */}
                          {contactTags[contact.id].length > 2 && (
                            <MoreTagsIndicator>
                              +{contactTags[contact.id].length - 2} more
                            </MoreTagsIndicator>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags</span>
                      )}
                    </TagsContainer>
                  </div>
                </ClickableCell>
                
                {/* LAST INTERACTION COLUMN */}
                <ClickableCell onClick={() => handleCellClick(contact, 'history')} hoverText="View history">
                  <div className="cell-content">
                    <LastInteractionDate isRecent={isRecentDate(contact.last_interaction)}>
                      {formatDate(contact.last_interaction)}
                    </LastInteractionDate>
                  </div>
                </ClickableCell>
                
                {/* CATEGORY COLUMN */}
                <ClickableCell onClick={() => handleCellClick(contact, 'category')}>
                  <div className="cell-content">
                    {contact.contact_category ? (
                      <CategoryBadge category={contact.contact_category}>
                        {contact.contact_category}
                      </CategoryBadge>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </div>
                </ClickableCell>
                
                {/* KEEP IN TOUCH COLUMN */}
                <ClickableCell onClick={() => handleCellClick(contact, 'keepInTouch')}>
                  <div className="cell-content">
                    {contact.keep_in_touch_frequency ? (
                      <KeepInTouchBadge frequency={contact.keep_in_touch_frequency}>
                        {contact.keep_in_touch_frequency}
                      </KeepInTouchBadge>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </div>
                </ClickableCell>
                
                {/* SCORE COLUMN */}
                <ScoreCell>
                  <StarContainer>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        filled={star <= (contact.score || 0)}
                        onClick={() => handleStarClick(contact.id, star)}
                      >
                        {star <= (contact.score || 0) ? <FaStar /> : <FiStar />}
                      </Star>
                    ))}
                  </StarContainer>
                </ScoreCell>
                
                {/* ACTIONS COLUMN */}
                <td className="actions-cell">
                  <ActionsContainer>
                    <Tooltip>
                      <ActionButton 
                        className="whatsapp" 
                        onClick={(e) => handleWhatsAppClick(contact, e)}
                        style={{ 
                          color: contact.mobile || contact.mobile2 ? '#25D366' : '#9CA3AF'
                        }}
                        data-whatsapp-button={true}
                      >
                        <FaWhatsapp />
                      </ActionButton>
                      <span className="tooltip-text">
                        {!contact.mobile && !contact.mobile2 
                          ? 'Add mobile number' 
                          : contact.mobile && contact.mobile2 
                            ? 'Choose mobile number' 
                            : 'WhatsApp'}
                      </span>
                      
                      {/* WhatsApp number dropdown */}
                      {showWhatsAppDropdown[contact.id] && (contact.mobile && contact.mobile2) && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            zIndex: 50,
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            width: '180px',
                            overflow: 'hidden'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          data-whatsapp-dropdown={true}
                        >
                          <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.75rem', color: '#4b5563' }}>Select number to use</div>
                          </div>
                          <div 
                            style={{ 
                              padding: '0.5rem', 
                              borderBottom: '1px solid #e5e7eb', 
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              ':hover': { backgroundColor: '#f9fafb' }
                            }}
                            onClick={() => handleOpenWhatsApp(contact.mobile, contact.id)}
                          >
                            <div style={{ fontWeight: '500', fontSize: '0.75rem', color: '#6b7280' }}>Primary</div>
                            <div style={{ fontSize: '0.875rem' }}>{contact.mobile}</div>
                          </div>
                          <div 
                            style={{ 
                              padding: '0.5rem', 
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              ':hover': { backgroundColor: '#f9fafb' }
                            }}
                            onClick={() => handleOpenWhatsApp(contact.mobile2, contact.id)}
                          >
                            <div style={{ fontWeight: '500', fontSize: '0.75rem', color: '#6b7280' }}>Secondary</div>
                            <div style={{ fontSize: '0.875rem' }}>{contact.mobile2}</div>
                          </div>
                        </div>
                      )}
                    </Tooltip>
                    
                    <Tooltip>
                      <ActionButton 
                        className="email"
                        onClick={(e) => handleEmailClick(contact, e)}
                        data-email-button={true}
                        style={{ 
                          // Light blue (#93C5FD) if NO email, darker blue (#4285F4) if email exists
                          color: hasAnyEmail(contact) ? '#4285F4' : '#93C5FD'
                        }}
                      >
                        <FiMail />
                      </ActionButton>
                      <span className="tooltip-text">
                        {hasAnyEmail(contact) ? 'Search in Superhuman' : 'Add/Search'}
                      </span>
                      
                      {/* Email dropdown - only show for contacts without email */}
                      {showEmailDropdown[contact.id] && !hasAnyEmail(contact) && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            zIndex: 50,
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            width: '180px',
                            overflow: 'hidden'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          data-email-dropdown={true}
                        >
                          <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.75rem', color: '#4b5563' }}>Email Options</div>
                          </div>
                          
                          {/* Add option */}
                          <div 
                            style={{ 
                              padding: '0.5rem', 
                              borderBottom: '1px solid #e5e7eb', 
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onClick={(e) => handleAddEmail(contact, e)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem' }}>Add</span>
                            </div>
                          </div>
                          
                          {/* Search option */}
                          <div 
                            style={{ 
                              padding: '0.5rem', 
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onClick={(e) => handleSearchEmail(contact, e)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem' }}>Search</span>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 'auto' }}>Superhuman</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Tooltip>
                    
                    <Tooltip>
                      <ActionButton 
                        className="linkedin"
                        onClick={(e) => handleLinkedInClick(contact, e)}
                        style={{ 
                          color: contact.linkedin ? '#0077B5' : '#4299E1' // LinkedIn blue vs. lighter blue
                        }}
                      >
                        <FaLinkedin />
                      </ActionButton>
                      <span className="tooltip-text">
                        {contact.linkedin ? 'View LinkedIn profile' : 'Search on LinkedIn'}
                      </span>
                    </Tooltip>
                    
                    <Tooltip>
                      <ActionButton 
                        className="hubspot"
                        onClick={(e) => handleHubSpotClick(contact, e)}
                        style={{ 
                          color: contact.hubspot_id ? '#FF7A59' : '#9CA3AF' // Orange if has HubSpot ID, gray if not
                        }}
                      >
                        <FaHubspot size={16} />
                      </ActionButton>
                      <span className="tooltip-text">
                        {contact.hubspot_id ? 'View in HubSpot' : 'Search in HubSpot'}
                      </span>
                    </Tooltip>
                    
                    <Tooltip>
                      <ActionButton
                        className="edit"
                        onClick={() => handleOpenModal('edit', contact)}
                      >
                        <FiEdit2 size={16} />
                      </ActionButton>
                      <span className="tooltip-text">Edit Contact</span>
                    </Tooltip>
                  </ActionsContainer>
                </td>
              </tr>
            ))
          )}
        </TableBody>
      </ContactTable>
      
      {/* Only show pagination when appropriate */}
      {!isLoading && (contacts.length > 0 || !debouncedSearchTerm) && totalPages > 1 && (
        <PaginationControls>
          <PageButton onClick={goToFirstPage} disabled={currentPage === 0 || isLoading}>
            First
          </PageButton>
          <PageButton onClick={goToPrevPage} disabled={currentPage === 0 || isLoading}>
            Previous
          </PageButton>
          <PageInfo>
            Page {currentPage + 1} of {totalPages}
          </PageInfo>
          <PageButton onClick={goToNextPage} disabled={currentPage === totalPages - 1 || isLoading}>
            Next
          </PageButton>
          <PageButton onClick={goToLastPage} disabled={currentPage === totalPages - 1 || isLoading}>
            Last
          </PageButton>
        </PaginationControls>
      )}
      
      {modalOpen && modalType === 'keepInTouch' && (
        <KeepInTouchModal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          contact={modalContact}
        />
      )}

      {/* Add CategoryModal */}
      {showCategoryModal && selectedContactForCategory && (
        <CategoryModal
          isOpen={showCategoryModal}
          onRequestClose={handleCloseCategoryModal}
          contact={selectedContactForCategory}
        />
      )}

      {showLastInteractionModal && modalContact && (
        <LastInteractionModal
          isOpen={showLastInteractionModal}
          onRequestClose={() => setShowLastInteractionModal(false)}
          contact={modalContact}
        />
      )}
    </Container>
  );
};

export default RecentContactsList;

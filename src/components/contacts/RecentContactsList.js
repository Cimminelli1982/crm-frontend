import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import { 
  FiTrash2, FiStar, FiCheck, FiX, 
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
import CompanyModal from '../modals/CompanyModal';
import ContactsModal from '../modals/ContactsModal';

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

// Make sure we're properly defining the component with forwardRef
const RecentContactsList = forwardRef(({ 
  defaultShowAll = false,
  defaultFilter = 'all',
  searchTerm = '',
  searchField = 'name',
  activeFilter = null,
  onCountUpdate = () => {},
  refreshTrigger = 0
}, ref) => {
  // State for filter counts
  const [filterCountsData, setFilterCountsData] = useState({
    lastInteraction: 0,
    recentlyCreated: 0,
    missingKeepInTouch: 0,
    missingScore: 0,
    missingCities: 0,
    missingCompanies: 0,
    missingTags: 0
  });
  // --------- STATE MANAGEMENT ---------
  // UI State - clearly separated from data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Data State
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contactTags, setContactTags] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState([]);
  
  // Sort and filter tracking for debug
  const [currentSorting, setCurrentSorting] = useState('last_modified desc');
  const [currentFiltering, setCurrentFiltering] = useState('none');
  
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
  
  // Add state for ContactsModal
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState(null);
  
  // Add new state for duplicate contacts
  const [duplicateContacts, setDuplicateContacts] = useState(new Set());

  // Add function to check for duplicates
  const checkForDuplicates = useCallback(async (contacts) => {
    if (!contacts || contacts.length === 0) return;

    const duplicates = new Set();
    
    // Check for duplicates based on email
    const emailMap = new Map();
    contacts.forEach(contact => {
      if (contact.email) {
        if (!emailMap.has(contact.email)) {
          emailMap.set(contact.email, contact.id);
        } else {
          duplicates.add(contact.id);
          duplicates.add(emailMap.get(contact.email));
        }
      }
    });

    // Check for duplicates based on mobile
    const mobileMap = new Map();
    contacts.forEach(contact => {
      if (contact.mobile) {
        if (!mobileMap.has(contact.mobile)) {
          mobileMap.set(contact.mobile, contact.id);
        } else {
          duplicates.add(contact.id);
          duplicates.add(mobileMap.get(contact.mobile));
        }
      }
    });

    setDuplicateContacts(duplicates);
  }, []);
  
  // Fetch contacts - core data fetching function
  const fetchContacts = useCallback(async () => {
    if (!debouncedSearchTerm && debouncedSearchTerm !== '' && !activeFilter) {
      return; // Don't fetch until debounce completes or filter is active
    }
    
    // Track the current sorting and filtering for debug info
    let sortDescription = 'last_modified desc, last_interaction desc';
    let filterDescription = 'contact_category != Skip';
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Build basic query
      let query = supabase
          .from('contacts')
        .select(`*, contact_companies:contact_companies(contact_id, company_id, companies:company_id(id, name, website))`);

      // Apply different filters based on activeFilter
      if (activeFilter) {
        switch (activeFilter) {
          case 'recentlyCreated':
            // Filter for contacts where contact_category is NULL and last interaction within last week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const formattedDate = oneWeekAgo.toISOString();
            
            // Apply pagination to this query
            const from = currentPage * 10;
            const to = from + 9;
            
            query = query
              .is('contact_category', null)
              .gte('last_interaction', formattedDate)
              .order('last_interaction', { ascending: false })
              .range(from, to);  // Add pagination
              
            sortDescription = 'last_interaction desc';
            filterDescription = 'contact_category is NULL with recent interactions';
            break;
            
          case 'lastInteraction':
            // Last Interaction: last_interaction within last week where contact_category is not Skip
            const lastInteractionOneWeekAgo = new Date();
            lastInteractionOneWeekAgo.setDate(lastInteractionOneWeekAgo.getDate() - 7);
            const lastInteractionFormattedDate = lastInteractionOneWeekAgo.toISOString();
            
            // Apply pagination to this query
            const lastInteractionFrom = currentPage * 10;
            const lastInteractionTo = lastInteractionFrom + 9;
            
            query = query
              .gte('last_interaction', lastInteractionFormattedDate)
              .not('contact_category', 'eq', 'Skip')
              .order('last_interaction', { ascending: false })
              .range(lastInteractionFrom, lastInteractionTo);
              
            sortDescription = 'last_interaction desc';
            filterDescription = `last_interaction >= ${lastInteractionFormattedDate}, excluding "Skip" category`;
            break;
            
          case 'missingKeepInTouch':
            // Missing Keep in Touch: keep_in_touch_frequency is null and not category Skip
            // Apply pagination to this query
            const missingKeepInTouchFrom = currentPage * 10;
            const missingKeepInTouchTo = missingKeepInTouchFrom + 9;
            
            query = query
              .is('keep_in_touch_frequency', null)
              .not('contact_category', 'eq', 'Skip')
              .order('last_modified', { ascending: false })
              .range(missingKeepInTouchFrom, missingKeepInTouchTo);
              
            sortDescription = 'last_modified desc';
            filterDescription = 'keep_in_touch_frequency is null, excluding Skip category';
            break;
            
          case 'missingScore':
            // Missing Score: score is null, not category Skip, and last interaction within last 7 days
            const missingScoreOneWeekAgo = new Date();
            missingScoreOneWeekAgo.setDate(missingScoreOneWeekAgo.getDate() - 7);
            const missingScoreFormattedDate = missingScoreOneWeekAgo.toISOString();
            
            // Apply pagination to this query
            const missingScoreFrom = currentPage * 10;
            const missingScoreTo = missingScoreFrom + 9;
            
            query = query
              .is('score', null)
              .not('contact_category', 'eq', 'Skip')
              .gte('last_interaction', missingScoreFormattedDate)
              .order('last_interaction', { ascending: false })
              .range(missingScoreFrom, missingScoreTo);
              
            sortDescription = 'last_interaction desc';
            filterDescription = 'score is null, excluding Skip category, with recent interactions';
            break;
            
          case 'keepInTouch':
            // Keep in touch: keep_in_touch_frequency is not null or Do not keep in touch
            query = query
              .not('keep_in_touch_frequency', 'is', null)
              .not('keep_in_touch_frequency', 'eq', 'Do not keep');
            sortDescription = 'calculated due date (asc)';
            filterDescription = 'keep_in_touch_frequency is not null AND keep_in_touch_frequency != "Do not keep"';
            break;
            
          case 'missingInfos':
            // Missing infos: contact_category is not Skip and one of fields is missing
            // This complex filter will be handled in post-processing
            query = query.order('last_interaction', { ascending: false });
            sortDescription = 'last_interaction desc';
            filterDescription = 'missing required fields (applied after fetch)';
            break;
            
          case 'missingCities':
            // Call the stored procedure for contacts without cities
            const { data: missingCitiesData, error: missingCitiesError } = await supabase
              .rpc('get_contacts_without_cities', {
                page_size: 10,
                page_number: currentPage,
                search_term: debouncedSearchTerm || ''
              });
            
            if (missingCitiesError) throw missingCitiesError;
            
            // Get the total count of contacts without cities
            const { data: countData, error: countError } = await supabase
              .rpc('get_contacts_without_cities_count');
              
            if (countError) throw countError;
            
            // Set the data and count directly
            setContacts(missingCitiesData || []);
            setTotalCount(countData[0]?.count || 0);
            setFilteredCount(countData[0]?.count || 0);
            
            // Return early since we've handled everything in this case
            return;
            
          case 'missingCompanies':
            // Call the stored procedure for contacts without companies
            const { data: missingCompaniesData, error: missingCompaniesError } = await supabase
              .rpc('get_contacts_without_companies', {
                page_size: 10,
                page_number: currentPage,
                search_term: debouncedSearchTerm || ''
              });
            
            if (missingCompaniesError) throw missingCompaniesError;
            
            // Get the total count of contacts without companies
            const { data: companiesCountData, error: companiesCountError } = await supabase
              .rpc('get_contacts_without_companies_count');
              
            if (companiesCountError) throw companiesCountError;
            
            // Set the data and count directly
            setContacts(missingCompaniesData || []);
            setTotalCount(companiesCountData[0]?.count || 0);
            setFilteredCount(companiesCountData[0]?.count || 0);
            
            // Return early since we've handled everything in this case
            return;
            
          case 'missingTags':
            // Call the stored procedure for contacts without tags
            const { data: missingTagsData, error: missingTagsError } = await supabase
              .rpc('get_contacts_without_tags', {
                page_size: 10,
                page_number: currentPage,
                search_term: debouncedSearchTerm || ''
              });
            
            if (missingTagsError) throw missingTagsError;
            
            // Get the total count of contacts without tags
            const { data: tagsCountData, error: tagsCountError } = await supabase
              .rpc('get_contacts_without_tags_count');
              
            if (tagsCountError) throw tagsCountError;
            
            // Set the data and count directly
            setContacts(missingTagsData || []);
            setTotalCount(tagsCountData[0]?.count || 0);
            setFilteredCount(tagsCountData[0]?.count || 0);
            
            // Set sorting description for debugging/reference
            sortDescription = 'last_interaction desc';
            filterDescription = 'contacts without tags and recent interactions';
            
            // Return early since we've handled everything in this case
            return;
            
          default:
            // Default sorting for all other cases
            query = query.order('last_modified', { ascending: false });
            break;
        }
      } else if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
        // Apply search if term has at least 3 characters
        switch (searchField) {
          case 'name':
            query = query.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`);
            filterDescription = `first_name ILIKE "%${debouncedSearchTerm}%" OR last_name ILIKE "%${debouncedSearchTerm}%"`;
            break;
          case 'email':
            query = query.ilike('email', `%${debouncedSearchTerm}%`);
            filterDescription = `email ILIKE "%${debouncedSearchTerm}%"`;
            break;
          case 'mobile':
            query = query.ilike('mobile', `%${debouncedSearchTerm}%`);
            filterDescription = `mobile ILIKE "%${debouncedSearchTerm}%"`;
            break;
          case 'city':
            query = query.ilike('city', `%${debouncedSearchTerm}%`);
            filterDescription = `city ILIKE "%${debouncedSearchTerm}%"`;
            break;
          // Company & tags filtering handled after fetch
          default:
            query = query.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`);
            filterDescription = `Search in ${searchField}: "${debouncedSearchTerm}" (applied after fetch)`;
        }
        
        // Apply default sorting for search
        query = query.order('last_modified', { ascending: false })
                     .order('last_interaction', { ascending: false });
      } else {
        // Default sorting when no filter or search is active
        query = query.order('last_modified', { ascending: false })
                     .order('last_interaction', { ascending: false });
      }

      // Update current sorting and filtering for debug info
      setCurrentSorting(sortDescription);
      setCurrentFiltering(filterDescription);
      
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
      
      // Get count for pagination - modify to include active filter
      let countQuery = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('contact_category', 'eq', 'Skip');
      
      // Calculate counts for each filter type for badges
      const calculateFilterCounts = async () => {
        try {
          // Calculate count for "Last Interaction" filter
          const lastInteractionOneWeekAgo = new Date();
          lastInteractionOneWeekAgo.setDate(lastInteractionOneWeekAgo.getDate() - 7);
          const lastInteractionDate = lastInteractionOneWeekAgo.toISOString();
          const { count: lastInteractionCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .gte('last_interaction', lastInteractionDate)
            .not('contact_category', 'eq', 'Skip');
            
          // Calculate count for "Missing Category" filter
          const recentlyCreatedOneWeekAgo = new Date();
          recentlyCreatedOneWeekAgo.setDate(recentlyCreatedOneWeekAgo.getDate() - 7);
          const recentlyCreatedDate = recentlyCreatedOneWeekAgo.toISOString();
          const { count: recentlyCreatedCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .is('contact_category', null)
            .gte('last_interaction', recentlyCreatedDate);
            
          // Calculate count for "Missing Keep In Touch" filter
          const { count: missingKeepInTouchCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .is('keep_in_touch_frequency', null)
            .not('contact_category', 'eq', 'Skip');
            
          // Calculate count for "Missing Score" filter - only showing contacts with recent interactions
          const missingScoreOneWeekAgo = new Date();
          missingScoreOneWeekAgo.setDate(missingScoreOneWeekAgo.getDate() - 7);
          const missingScoreDate = missingScoreOneWeekAgo.toISOString();
          const { count: missingScoreCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .is('score', null)
            .not('contact_category', 'eq', 'Skip')
            .gte('last_interaction', missingScoreDate);
            
          // Calculate count for "Missing Cities" filter using the stored procedure
          const { data: missingCitiesData, error: missingCitiesError } = await supabase
            .rpc('get_contacts_without_cities_count');
            
          // Handle the response and extract the count
          let missingCitiesCount = 0;
          if (missingCitiesError) {
            console.error('Error fetching missing cities count:', missingCitiesError);
          } else if (Array.isArray(missingCitiesData) && missingCitiesData.length > 0) {
            missingCitiesCount = missingCitiesData[0].count;
          } else if (typeof missingCitiesData === 'object' && missingCitiesData !== null) {
            missingCitiesCount = missingCitiesData.count;
          } else {
            missingCitiesCount = missingCitiesData || 0;
          }
          
          // Calculate count for "Missing Companies" filter using the stored procedure
          const { data: missingCompaniesData, error: missingCompaniesError } = await supabase
            .rpc('get_contacts_without_companies_count');
            
          // Handle the response and extract the count
          let missingCompaniesCount = 0;
          if (missingCompaniesError) {
            console.error('Error fetching missing companies count:', missingCompaniesError);
          } else if (Array.isArray(missingCompaniesData) && missingCompaniesData.length > 0) {
            missingCompaniesCount = missingCompaniesData[0].count;
          } else if (typeof missingCompaniesData === 'object' && missingCompaniesData !== null) {
            missingCompaniesCount = missingCompaniesData.count;
          } else {
            missingCompaniesCount = missingCompaniesData || 0;
          }
          
          // Calculate count for "Missing Tags" filter using the stored procedure
          const { data: missingTagsData, error: missingTagsError } = await supabase
            .rpc('get_contacts_without_tags_count');
            
          // Handle the response and extract the count
          let missingTagsCount = 0;
          if (missingTagsError) {
            console.error('Error fetching missing tags count:', missingTagsError);
          } else if (Array.isArray(missingTagsData) && missingTagsData.length > 0) {
            missingTagsCount = missingTagsData[0].count;
          } else if (typeof missingTagsData === 'object' && missingTagsData !== null) {
            missingTagsCount = missingTagsData.count;
          } else {
            missingTagsCount = missingTagsData || 0;
          }
            
          // Update filter counts state
          setFilterCountsData({
            lastInteraction: lastInteractionCount || 0,
            recentlyCreated: recentlyCreatedCount || 0,
            missingKeepInTouch: missingKeepInTouchCount || 0,
            missingScore: missingScoreCount || 0,
            missingCities: missingCitiesCount || 0,
            missingCompanies: missingCompaniesCount || 0,
            missingTags: missingTagsCount || 0
          });
        } catch (error) {
          console.error('Error calculating filter counts:', error);
        }
      };
      
      // Run the filter counts calculation
      calculateFilterCounts();
      
      // Apply the same filters to the count query for accurate pagination
      if (activeFilter) {
        switch (activeFilter) {
          case 'recentlyCreated':
            const recentlyCreatedOneWeekAgo = new Date();
            recentlyCreatedOneWeekAgo.setDate(recentlyCreatedOneWeekAgo.getDate() - 7);
            const recentlyCreatedFormattedDate = recentlyCreatedOneWeekAgo.toISOString();
            
            countQuery = countQuery
              .is('contact_category', null)
              .gte('last_interaction', recentlyCreatedFormattedDate);
            break;
            
          case 'lastInteraction':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const formattedDate = oneWeekAgo.toISOString();
            countQuery = countQuery
              .gte('last_interaction', formattedDate)
              .not('contact_category', 'eq', 'Skip');
            break;
            
          case 'keepInTouch':
            countQuery = countQuery
              .not('keep_in_touch_frequency', 'is', null)
              .not('keep_in_touch_frequency', 'eq', 'Do not keep');
            break;
            
          case 'missingKeepInTouch':
            countQuery = countQuery
              .is('keep_in_touch_frequency', null)
              .not('contact_category', 'eq', 'Skip');
            break;
            
          case 'missingScore':
            const missingScoreOneWeekAgo = new Date();
            missingScoreOneWeekAgo.setDate(missingScoreOneWeekAgo.getDate() - 7);
            const missingScoreFormattedDate = missingScoreOneWeekAgo.toISOString();
            
            countQuery = countQuery
              .is('score', null)
              .not('contact_category', 'eq', 'Skip')
              .gte('last_interaction', missingScoreFormattedDate);
            break;
            
          case 'missingCities':
            // Count is handled in the main query case
            return;
            
          case 'missingCompanies':
            // Count is handled in the main query case
            return;
            
          case 'missingTags':
            // Count is handled in the main query case
            return;
            
          // For missingInfos, we'll handle the count after fetching all data
        }
      } else if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
        // Apply the same search filter to the count query
        switch (searchField) {
          case 'name':
            countQuery = countQuery.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`);
            break;
          case 'email':
            countQuery = countQuery.ilike('email', `%${debouncedSearchTerm}%`);
            break;
          case 'mobile':
            countQuery = countQuery.ilike('mobile', `%${debouncedSearchTerm}%`);
            break;
          case 'city':
            countQuery = countQuery.ilike('city', `%${debouncedSearchTerm}%`);
            break;
          // Company & tags filtering handled after fetch
        }
      }
      
      // Execute count query
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      // Store the database count (before post-filtering)
      setTotalCount(count || 0);
      
      // Calculate and set total pages - this ensures pagination works for all filters
      setTotalPages(Math.ceil((count || 0) / 10));
      
      // Update filtered count for parent component
      if (onCountUpdate) {
        onCountUpdate(count || 0, filterCountsData);
      }
      
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
          if (contact.contact_companies) {
            contact.contact_companies.forEach(companyRel => {
              if (companyRel.companies) {
                contact.companiesList.push({
                  id: companyRel.company_id,
                  name: companyRel.companies.name,
                  website: companyRel.companies.website
                });
              }
            });
          }
        });
        
        // Apply post-filtering for special cases
        let filteredContacts = [...contactsData];
        
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
          if (searchField === 'company') {
            filteredContacts = filteredContacts.filter(contact => {
              return contact.companiesList.some(company => 
                company.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
              );
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
        
        // If we did post-filtering for search, adjust the count
        if ((searchField === 'company' || searchField === 'tags') && debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
          // We need to fetch all contacts to get accurate count for these search fields
          const { data: allContactsData, error: allContactsError } = await supabase
            .from('contacts')
            .select(`id, contact_companies:contact_companies(company_id, companies:company_id(name))`)
            .not('contact_category', 'eq', 'Skip');
            
          if (!allContactsError && allContactsData) {
            const allContactIds = allContactsData.map(contact => contact.id);
            
            // For tags search, fetch all tags
            if (searchField === 'tags') {
              const { data: allTagsData } = await supabase
                .from('contact_tags')
                .select('contact_id, tag_id(name)')
                .in('contact_id', allContactIds);
                
              if (allTagsData) {
                // Group tags by contact
                const allTagsMap = {};
                allTagsData.forEach(tagRel => {
                  if (!allTagsMap[tagRel.contact_id]) {
                    allTagsMap[tagRel.contact_id] = [];
                  }
                  if (tagRel.tag_id) {
                    allTagsMap[tagRel.contact_id].push(tagRel.tag_id.name);
                  }
                });
                
                // Filter and count
                const filteredCount = allContactsData.filter(contact => {
                  const tags = allTagsMap[contact.id] || [];
                  return tags.some(tag => 
                    tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                  );
                }).length;
                
                setFilteredCount(filteredCount);
                setTotalPages(Math.ceil(filteredCount / 10));
              }
            } 
            // For company search
            else if (searchField === 'company') {
              const filteredCount = allContactsData.filter(contact => {
                if (!contact.contact_companies) return false;
                return contact.contact_companies.some(companyRel => 
                  companyRel.companies && 
                  companyRel.companies.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                );
              }).length;
              
              setFilteredCount(filteredCount);
              setTotalPages(Math.ceil(filteredCount / 10));
            }
          }
        }
        
        // Apply special post-filtering for the activeFilter cases that can't be handled in the query
        if (activeFilter) {
          switch (activeFilter) {
            case 'missingInfos':
              // Filter contacts with missing information
              filteredContacts = filteredContacts.filter(contact => {
                return !contact.first_name || 
                       !contact.last_name || 
                       !contact.city || 
                       !contact.keywords || 
                       !contact.contact_category || 
                       !contact.keep_in_touch_frequency;
              });
              
              // For missingInfos we need to calculate the total count
              const { data: allContacts, error: allContactsError } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, city, keywords, contact_category, keep_in_touch_frequency')
                .not('contact_category', 'eq', 'Skip');
                
              if (!allContactsError && allContacts) {
                const missingInfoCount = allContacts.filter(contact => {
                  return !contact.first_name || 
                         !contact.last_name || 
                         !contact.city || 
                         !contact.keywords || 
                         !contact.contact_category || 
                         !contact.keep_in_touch_frequency;
                }).length;
                
                setFilteredCount(missingInfoCount);
                setTotalPages(Math.ceil(missingInfoCount / 10));
              }
              break;
              
            case 'keepInTouch':
              // Calculate due date for each contact
              filteredContacts.forEach(contact => {
                if (contact.last_interaction && contact.keep_in_touch_frequency) {
                  const lastInteraction = new Date(contact.last_interaction);
                  let daysToAdd = 0;
                  
                  // Calculate days to add based on frequency
                  switch (contact.keep_in_touch_frequency) {
                    case 'Weekly':
                      daysToAdd = 7;
                      break;
                    case 'Monthly':
                      daysToAdd = 30;
                      break;
                    case 'Quarterly':
                      daysToAdd = 90;
                      break;
                    default:
                      daysToAdd = 999; // Far future for 'Do not keep'
                  }
                  
                  // Calculate due date
                  const dueDate = new Date(lastInteraction);
                  dueDate.setDate(dueDate.getDate() + daysToAdd);
                  contact.dueDate = dueDate;
                } else {
                  // If no last interaction or frequency, set a far future date
                  contact.dueDate = new Date('2099-12-31');
                }
              });
              
              // Sort by due date (ascending - earliest due first)
              filteredContacts.sort((a, b) => {
                return a.dueDate - b.dueDate;
              });
              
              // For keepInTouch, we already have accurate count from query
              setFilteredCount(count || 0);
              break;
              
            default:
              // No additional post-processing needed, use query count
              setFilteredCount(count || 0);
              break;
          }
        } else {
          // For normal queries, use count from query
          setFilteredCount(count || 0);
        }
        
        // Update data state all at once to avoid multiple renders
        setContacts(filteredContacts);
        setTotalPages(Math.ceil((filteredCount || count || 0) / 10));
      } else {
        // No contacts found
        setContacts([]);
        setFilteredCount(0);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / 10));
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      setContacts([]);
      setFilteredCount(0);
    } finally {
      // Always clear loading when done, regardless of success/failure
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, searchField, currentPage, activeFilter, checkForDuplicates]);

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

  // Now we can safely use fetchContacts in useImperativeHandle
  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchContacts();
    }
  }), [fetchContacts]);
  
  // --------- EFFECT HOOKS ---------
  
  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter]);
  
  // Report filtered count back to parent component
  useEffect(() => {
    onCountUpdate(filteredCount);
  }, [filteredCount, onCountUpdate]);
  
  // Add an effect to refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchContacts();
    }
  }, [refreshTrigger, fetchContacts]);

  // Initial data load
  useEffect(() => {
    fetchContacts();
    fetchTagSuggestions();
  }, [fetchContacts, fetchTagSuggestions]);
  
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
        setModalContent(<CompanyModal isOpen={true} onRequestClose={() => setModalOpen(false)} contact={contact} />);
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
    if (type === 'name') {
      setSelectedContactForEdit(contact);
      setShowContactsModal(true);
    } else if (type === 'category') {
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
  
  // Debug info display with refresh information
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
        <div>Active Filter: {activeFilter || 'None'}</div>
        <div>Sorting: {currentSorting}</div>
        <div>Filtering: {currentFiltering}</div>
        <div>Refresh Trigger: {refreshTrigger}</div>
        <div>Loading: {isLoading ? 'true' : 'false'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Page: {currentPage + 1} of {totalPages}</div>
        <div>Contacts: {contacts.length} shown / {filteredCount} filtered / {totalCount} total</div>
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
        return <CompanyModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} contact={modalContact} />;
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
  
  // Add delete contact handler
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      // Update local state by removing the deleted contact
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
      
      {/* Filter description */}
      {activeFilter && !isLoading && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '0.25rem',
          margin: '0.5rem 1rem',
          fontSize: '0.875rem',
          color: '#4b5563'
        }}>
          {activeFilter === 'recentlyCreated' && 'Showing uncategorized contacts with interactions in the last 7 days'}
          {activeFilter === 'lastInteraction' && 'Showing contacts with interactions in the last 7 days (excluding Skip category)'}
          {activeFilter === 'keepInTouch' && 'Showing contacts sorted by keep-in-touch due date'}
          {activeFilter === 'missingKeepInTouch' && 'Showing contacts with no keep-in-touch frequency set (excluding Skip category)'}
          {activeFilter === 'missingScore' && 'Showing contacts with no score set and recent interactions (last 7 days)'}
          {activeFilter === 'missingCities' && 'Showing contacts with no city associations'}
          {activeFilter === 'missingCompanies' && 'Showing contacts with no company associations'}
          {activeFilter === 'missingTags' && 'Showing contacts with no tag associations and recent interactions (last 7 days)'}
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
                      {duplicateContacts.has(contact.id) && (
                        <span 
                          style={{ 
                            marginLeft: '0.25rem',
                            color: '#ef4444',
                            fontSize: '0.875rem',
                            cursor: 'help'
                          }}
                          title="This contact has potential duplicates"
                        >
                          ⚠️
                        </span>
                      )}
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
                    </Tooltip>
                    
                    <Tooltip>
                      <ActionButton 
                        className="email"
                        onClick={(e) => handleEmailClick(contact, e)}
                        data-email-button={true}
                        style={{ 
                          color: hasAnyEmail(contact) ? '#4285F4' : '#93C5FD'
                        }}
                      >
                        <FiMail />
                      </ActionButton>
                      <span className="tooltip-text">
                        {hasAnyEmail(contact) ? 'Search in Superhuman' : 'Add/Search'}
                      </span>
                    </Tooltip>
                    
                    <Tooltip>
                      <ActionButton 
                        className="hubspot"
                        onClick={(e) => handleHubSpotClick(contact, e)}
                        style={{ 
                          color: contact.hubspot_id ? '#FF7A59' : '#9CA3AF'
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
                        className="delete"
                        onClick={() => handleDeleteContact(contact.id)}
                        style={{ color: '#ef4444' }}
                      >
                        <FiTrash2 size={16} />
                      </ActionButton>
                      <span className="tooltip-text">Delete Contact</span>
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
            ⟪
          </PageButton>
          <PageButton onClick={goToPrevPage} disabled={currentPage === 0 || isLoading}>
            ⟨
          </PageButton>
          <PageButton onClick={goToNextPage} disabled={currentPage === totalPages - 1 || isLoading}>
            ⟩
          </PageButton>
          <PageButton onClick={goToLastPage} disabled={currentPage === totalPages - 1 || isLoading}>
            ⟫
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

      {/* Add ContactsModal */}
      {showContactsModal && selectedContactForEdit && (
        <ContactsModal
          isOpen={showContactsModal}
          onRequestClose={() => {
            setShowContactsModal(false);
            setSelectedContactForEdit(null);
            // Refresh the contacts list to show updated data
            fetchContacts();
          }}
          contact={selectedContactForEdit}
        />
      )}
    </Container>
  );
});

// Make sure it has a display name for better debugging
RecentContactsList.displayName = 'RecentContactsList';

export default RecentContactsList;

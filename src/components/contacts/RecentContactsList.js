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
import TagsEditForm from './forms/TagsEditForm';

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
  
  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
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
    
    // Set appropriate modal content based on type
    switch (type) {
      case 'name':
        setModalContent(<NameEditForm contact={contact} onSave={handleSave} onClose={() => setModalOpen(false)} />);
        break;
      case 'company':
        setModalContent(<CompanyEditForm contact={contact} onSave={handleSave} onClose={() => setModalOpen(false)} />);
        break;
      case 'tags':
        setModalContent(<TagsEditForm contact={contact} onSave={handleSave} onClose={() => setModalOpen(false)} />);
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
      case 'category':
        setModalContent(
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Edit Category</h3>
            <p>Category editing modal coming soon...</p>
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
        break;
    }
    
    setModalOpen(true);
  };

  // Make the entire cell clickable for company and tags
  const handleCellClick = (contact, type) => {
    handleOpenModal(type, contact);
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
    
    let title = '';
    let content = null;
    
    switch (modalType) {
      case 'name':
        title = `Edit Contact: ${getFormattedName(modalContact)}`;
        content = (
          <div>
            <p>Name: {getFormattedName(modalContact)}</p>
            <p>Email: {modalContact.email || 'Not specified'}</p>
            <p>Mobile: {modalContact.mobile || 'Not specified'}</p>
            <p>Contact editing functionality coming soon!</p>
          </div>
        );
        break;
      case 'company':
        title = `Edit Company for ${getFormattedName(modalContact)}`;
        content = (
          <div>
            <p>Current company: {modalContact.companies?.name || 'None'}</p>
            <p>Company editing functionality coming soon!</p>
          </div>
        );
        break;
      case 'tags':
        title = `Edit Tags for ${getFormattedName(modalContact)}`;
        content = (
          <div>
            <p>Current tags: {contactTags[modalContact.id]?.map(tag => tag.name).join(', ') || 'None'}</p>
            <p>Tag editing functionality coming soon!</p>
          </div>
        );
        break;
      default:
        title = `Edit ${getFormattedName(modalContact)}`;
        content = (
          <div>
            <p>Contact editing functionality coming soon!</p>
          </div>
        );
    }
    
    return (
      <ModalOverlay onClick={handleCloseModal}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <h2>{title}</h2>
            <button onClick={handleCloseModal}>
              <FiX size={20} />
            </button>
          </ModalHeader>
          {content}
        </ModalContent>
      </ModalOverlay>
    );
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
            <td>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {editingContact?.id === contact.id && editingField === 'keep_in_touch' ? (
                  <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
                    <select
                      name="keep_in_touch"
                      value={editData.keep_in_touch || ''}
                      onChange={handleFieldChange}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      style={{ flex: 1 }}
                    >
                      <option value="">Select frequency</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Do not keep">Do not keep</option>
                    </select>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <ActionButton onClick={handleSave}><FiCheck /></ActionButton>
                      <ActionButton onClick={handleCancel}><FiX /></ActionButton>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
                      {contact.keep_in_touch ? (
                        <KeepInTouchBadge frequency={contact.keep_in_touch}>
                          {contact.keep_in_touch}
                        </KeepInTouchBadge>
                      ) : (
                        <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Missing</span>
                      )}
            </div>
                    <div className="actions">
                      <ActionButton className="edit" onClick={() => handleEditStart(contact, 'keep_in_touch')}>
                        <FiEdit2 size={16} />
                      </ActionButton>
            </div>
          </div>
                )}
        </div>
            </td>
            
            {/* SCORE COLUMN */}
            <td>
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
              </td>
            
            {/* ACTIONS COLUMN */}
            <td className="actions-cell">
              <ActionsContainer>
                <Tooltip>
                  <ActionButton 
                    className="whatsapp" 
                    onClick={() => contact.mobile ? window.open(`https://wa.me/${contact.mobile.replace(/\D/g, '')}`, '_blank') : null}
                    style={{ opacity: contact.mobile ? 1 : 0.5 }}
                  >
                    <FaWhatsapp />
                  </ActionButton>
                  <span className="tooltip-text">
                    {contact.mobile ? 'WhatsApp' : 'No mobile number'}
                </span>
                </Tooltip>
                
                <Tooltip>
                  <ActionButton 
                    className="email" 
                    onClick={() => contact.email ? window.open(`mailto:${contact.email}`, '_blank') : null}
                    style={{ opacity: contact.email ? 1 : 0.5 }}
                  >
                    <FiMail />
                  </ActionButton>
                  <span className="tooltip-text">
                    {contact.email ? 'Email' : 'No email address'}
                  </span>
                </Tooltip>
                
                <Tooltip>
                  <ActionButton 
                    className="linkedin" 
                    onClick={() => contact.linkedin ? window.open(contact.linkedin, '_blank') : null}
                    style={{ opacity: contact.linkedin ? 1 : 0.5 }}
                  >
                    <FaLinkedin />
                  </ActionButton>
                  <span className="tooltip-text">
                    {contact.linkedin ? 'LinkedIn' : 'No LinkedIn profile'}
                  </span>
                </Tooltip>
                
                <Tooltip>
                  <ActionButton
                    className="hubspot"
                    onClick={() => window.open(contact.hubspot_url, '_blank')}
                  >
                    <FaHubspot size={16} />
                  </ActionButton>
                  <span className="tooltip-text">Open in HubSpot</span>
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
    </Container>
  );
};

export default RecentContactsList;

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import { 
  FiEdit2, FiStar, FiPlus, FiCheck, FiX, 
  FiChevronDown, FiChevronUp, FiMail, FiExternalLink
} from 'react-icons/fi';
import { 
  FaWhatsapp, FaLinkedin, FaHubspot, FaStar
} from 'react-icons/fa';
import { format, parseISO, isValid } from 'date-fns';

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
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  
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
    transition: background-color 0.2s;
    
    &.sortable {
      cursor: pointer;
      user-select: none;
    }
    
    .sort-icon {
      margin-left: 0.25rem;
      display: inline-flex;
      align-items: center;
    }
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
    
    .cell-content {
      display: flex;
      align-items: center;
      position: relative;
      min-height: 24px;
    }
    
    .actions {
      display: none;
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background-color: white;
      padding-left: 0.5rem;
    }
    
    &:hover .actions {
      display: flex;
      gap: 0.25rem;
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
  width: 28px;
  height: 28px;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  
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
  gap: 2px;
`;

const Star = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${props => props.filled ? '#f59e0b' : '#d1d5db'};
  font-size: 1.25rem;
  transition: transform 0.1s, color 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    fill: ${props => props.filled ? '#f59e0b' : 'none'};
    stroke: ${props => props.filled ? '#f59e0b' : '#d1d5db'};
    stroke-width: ${props => props.filled ? '0' : '2'};
  }
  
  &:hover {
    transform: scale(1.2);
    color: #f59e0b;
    
    svg {
      fill: #f59e0b;
      stroke: #f59e0b;
      stroke-width: 0;
    }
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
`;

// Tooltip
const Tooltip = styled.div`
  position: relative;
  
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
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
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
  gap: 0.5rem;
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
const EmptyState = styled.div`
  padding: 3rem 0;
  text-align: center;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 1.5rem;
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
const CompanyTag = styled.span`
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

const RecentContactsList = ({ 
  defaultShowAll = false,
  defaultFilter = 'all'
}) => {
  // State variables
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Editing state
  const [editingContact, setEditingContact] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Modal state (to be implemented later)
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalContact, setModalContact] = useState(null);
  
  // Tags state
  const [contactTags, setContactTags] = useState({});
  const [showTagDropdown, setShowTagDropdown] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  
  // Sorting state
  const [sortField, setSortField] = useState('last_interaction');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Fetch tags for contacts
  const fetchTagsForContacts = useCallback(async (contactIds) => {
    if (!contactIds || contactIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*, tag_id(*)')
        .in('contact_id', contactIds);
      
      if (error) throw error;
      
      // Group tags by contact ID
      const tagsMap = {};
      
      data?.forEach(tagRel => {
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
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);
  
  // Fetch companies for contacts - using the direct company_id relationship
  const fetchCompaniesForContacts = useCallback(async (contactIds, contactsData) => {
    if (!contactIds || contactIds.length === 0) return;
    
    try {
      // Update contacts with their companies
      contactsData.forEach(contact => {
        // Initialize empty list
        contact.companiesList = [];
        
        // If contact has a company, add it to the list
        if (contact.companies) {
          contact.companiesList.push({
            id: contact.company_id, // This is the relationship ID
            company_id: contact.companies.id,
            name: contact.companies.name
          });
        }
      });
    } catch (err) {
      console.error('Error processing companies:', err);
    }
  }, []);
  
  // Fetch contacts
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query with filters
      let query = supabase
        .from('contacts')
        .select('*, companies:company_id(*)')
        // Filter out your own contact
        .not('first_name', 'eq', 'Simone')
        .not('last_name', 'eq', 'Cimminelli')
        // Filter out contacts with category 'Skip'
        .not('contact_category', 'eq', 'Skip');
      
      // Apply sorting
      query = query.order(sortField, { 
        ascending: sortDirection === 'asc',
        nullsFirst: false
      });
      
      // Apply pagination
      const from = currentPage * 10;
      const to = from + 9;
      query = query.range(from, to);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch total count for pagination with the same filters
      const { count: totalCount, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('first_name', 'eq', 'Simone')
        .not('last_name', 'eq', 'Cimminelli')
        .not('contact_category', 'eq', 'Skip');
      
      if (countError) throw countError;
      
      // Fetch company associations for each contact
      const contactIds = data?.map(contact => contact.id) || [];
      await fetchCompaniesForContacts(contactIds, data);
      
      setContacts(data || []);
      setTotalCount(totalCount || 0);
      setTotalPages(Math.ceil((totalCount || 0) / 10));
      
      // Fetch tags for each contact
      await fetchTagsForContacts(contactIds);
      
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortDirection, fetchTagsForContacts, fetchCompaniesForContacts]);
  
  // Fetch all available tags for suggestions
  const fetchTagSuggestions = useCallback(async (searchTerm = '') => {
    try {
      let query = supabase.from('tags').select('*');
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.limit(10);
      
      if (error) throw error;
      
      setTagSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
    fetchTagSuggestions();
  }, [fetchData, fetchTagSuggestions]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      
      // Always format as DD-MM-YYYY
      return format(date, 'dd-MM-yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };
  
  // Check if date is recent (within last 7 days)
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
  
  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle edit start
  const handleEditStart = (contact, field) => {
    setEditingContact(contact);
    setEditingField(field);
    setEditData({
      ...contact,
      [field]: contact[field] || ''
    });
  };
  
  // Handle field change
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle save
  const handleSave = async () => {
    if (!editingContact || !editingField) return;
    
    try {
      setLoading(true);
      
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
      setLoading(false);
    }
  };
  
  // Handle cancel edit
  const handleCancel = () => {
    setEditingContact(null);
    setEditingField(null);
    setEditData({});
  };
  
  // Handle key events for editing
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
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
  
  // Handle tag dropdown toggle
  const handleTagDropdownToggle = (contactId) => {
    setShowTagDropdown(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }));
    
    // Fetch tag suggestions when opening dropdown
    if (!showTagDropdown[contactId]) {
      fetchTagSuggestions();
    }
  };
  
  // Handle tag input change
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
    fetchTagSuggestions(e.target.value);
  };
  
  // Handle tag selection
  const handleTagSelect = async (contactId, tagId) => {
    try {
      // Check if tag is already assigned to contact
      const existingTags = contactTags[contactId] || [];
      if (existingTags.some(tag => tag.tag_id === tagId)) {
        return;
      }
      
      // Add tag to contact
      const { error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tagId });
      
      if (error) throw error;
      
      // Refresh tags for this contact
      await fetchTagsForContacts([contactId]);
      
      // Reset input and close dropdown
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
  
  // Handle tag removal
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
  
  // Handle create new tag
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
  
  // Handle modal open
  const handleOpenModal = (contact) => {
    setModalContact(contact);
    setShowEditModal(true);
  };
  
  // Handle skip contact
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
  
  // Handle company removal
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
  const goToFirstPage = () => {
    setCurrentPage(0);
  };
  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
  const goToLastPage = () => {
    setCurrentPage(totalPages - 1);
  };
  
  // Render the table
  return (
    <Container>
      {loading && (
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
      
      {!loading && contacts.length === 0 ? (
        <EmptyState>
          <h3>No contacts found</h3>
          <p>Try adjusting your filters or adding new contacts.</p>
        </EmptyState>
      ) : (
        <>
          <ContactTable>
            <TableHead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('last_name')}
                >
                  Name
                  {sortField === 'last_name' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('companies')}
                >
                  Company
                  {sortField === 'companies' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th>Tags</th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('last_interaction')}
                >
                  Last Interaction
                  {sortField === 'last_interaction' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('contact_category')}
                >
                  Category
                  {sortField === 'contact_category' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('keep_in_touch_frequency')}
                >
                  Keep in Touch
                  {sortField === 'keep_in_touch_frequency' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('score')}
                >
                  Score
                  {sortField === 'score' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </TableHead>
            <TableBody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  {/* NAME COLUMN */}
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'name' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                          <input
                            name="first_name"
                            value={editData.first_name || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            placeholder="First name"
                            autoFocus
                          />
                          <input
                            name="last_name"
                            value={editData.last_name || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Last name"
                          />
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.first_name || contact.last_name ? (
                            <TruncatedText 
                              maxWidth="180px"
                              style={{ fontWeight: '500', cursor: 'pointer' }}
                              onClick={() => handleEditStart(contact, 'name')}
                            >
                              {`${contact.first_name || ''} ${contact.last_name || ''}`}
                            </TruncatedText>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No name</span>
                          )}
                          
                          <div className="actions">
                            <Tooltip>
                              <ActionButton 
                                className="edit" 
                                onClick={() => handleOpenModal(contact)}
                              >
                                <FiEdit2 size={16} />
                              </ActionButton>
                              <span className="tooltip-text">Edit Contact</span>
                            </Tooltip>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  {/* COMPANY COLUMN */}
                  <td>
                    <div className="cell-content">
                      <CompaniesContainer>
                        {contact.companiesList.length > 0 ? (
                          contact.companiesList.map(company => (
                            <CompanyTag key={company.id}>
                              <TruncatedText maxWidth="120px">
                                {company.name}
                              </TruncatedText>
                              <button onClick={() => handleRemoveCompany(contact.id, company.company_id)}>
                                <FiX size={12} />
                              </button>
                            </CompanyTag>
                          ))
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No company</span>
                        )}
                        
                        <Tooltip>
                          <AddTagButton onClick={() => handleOpenModal(contact)}>
                            <FiPlus size={12} />
                          </AddTagButton>
                          <span className="tooltip-text">Associate Company</span>
                        </Tooltip>
                      </CompaniesContainer>
                    </div>
                  </td>
                  
                  {/* TAGS COLUMN */}
                  <td>
                    <div className="cell-content">
                      <TagsContainer>
                        {contactTags[contact.id]?.length > 0 ? (
                          contactTags[contact.id].map(tag => (
                            <Tag 
                              key={tag.id} 
                              color={getTagColor(tag.name).bg} 
                              textColor={getTagColor(tag.name).text}
                            >
                              {tag.name}
                              <button onClick={() => handleRemoveTag(contact.id, tag.tag_id)}>
                                <FiX size={12} />
                              </button>
                            </Tag>
                          ))
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags</span>
                        )}
                        
                        <Tooltip>
                          <AddTagButton onClick={() => handleTagDropdownToggle(contact.id)}>
                            <FiPlus size={12} />
                          </AddTagButton>
                          <span className="tooltip-text">Add Tag</span>
                        </Tooltip>
                      </TagsContainer>
                      
                      {/* Tag dropdown (to be implemented) */}
                      {showTagDropdown[contact.id] && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          zIndex: 20,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          width: '200px',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          <div style={{ padding: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="Search or create tag..."
                              value={tagInput}
                              onChange={handleTagInputChange}
                              style={{
                                width: '100%',
                                padding: '0.375rem 0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          
                          <div>
                            {tagSuggestions.length > 0 ? (
                              tagSuggestions.map(tag => (
                                <div
                                  key={tag.id}
                                  onClick={() => handleTagSelect(contact.id, tag.id)}
                                  style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    borderTop: '1px solid #f3f4f6'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {tag.name}
                                </div>
                              ))
                            ) : (
                              tagInput ? (
                                <div
                                  onClick={() => handleCreateTag(contact.id, tagInput)}
                                  style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    borderTop: '1px solid #f3f4f6'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  Create "{tagInput}"
                                </div>
                              ) : (
                                <div style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                  No tags found
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* LAST INTERACTION COLUMN */}
                  <td>
                    <LastInteractionDate isRecent={isRecentDate(contact.last_interaction)}>
                      {formatDate(contact.last_interaction)}
                    </LastInteractionDate>
                  </td>
                  
                  {/* CATEGORY COLUMN */}
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'contact_category' ? (
                        <div style={{ display: 'flex', width: '100%' }}>
                          <select
                            name="contact_category"
                            value={editData.contact_category || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{ flex: 1 }}
                          >
                            <option value="">Select category</option>
                            <option value="Team">Team</option>
                            <option value="Manager">Manager</option>
                            <option value="Advisor">Advisor</option>
                            <option value="Professional Investor">Professional Investor</option>
                          </select>
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.contact_category ? (
                            <CategoryBadge category={contact.contact_category}>
                              {contact.contact_category}
                            </CategoryBadge>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'contact_category')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  {/* KEEP IN TOUCH COLUMN */}
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'keep_in_touch_frequency' ? (
                        <div style={{ display: 'flex', width: '100%' }}>
                          <select
                            name="keep_in_touch_frequency"
                            value={editData.keep_in_touch_frequency || ''}
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
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.keep_in_touch_frequency ? (
                            <KeepInTouchBadge frequency={contact.keep_in_touch_frequency}>
                              {contact.keep_in_touch_frequency}
                            </KeepInTouchBadge>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Missing</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'keep_in_touch_frequency')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
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
                  <td>
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
                        <ActionButton className="hubspot">
                          <FaHubspot />
                        </ActionButton>
                        <span className="tooltip-text">View in HubSpot</span>
                      </Tooltip>
                      
                      <Tooltip>
                        <ActionButton className="delete" onClick={() => handleSkipContact(contact.id)}>
                          <FiX />
                        </ActionButton>
                        <span className="tooltip-text">Skip Contact</span>
                      </Tooltip>
                      
                      <Tooltip>
                        <ActionButton className="edit" onClick={() => handleOpenModal(contact)}>
                          <FiExternalLink />
                        </ActionButton>
                        <span className="tooltip-text">Check Duplicates</span>
                      </Tooltip>
                    </ActionsContainer>
                  </td>
                </tr>
              ))}
            </TableBody>
          </ContactTable>
          
          {totalPages > 1 && (
            <PaginationControls>
              <PageButton onClick={goToFirstPage} disabled={currentPage === 0}>
                First
              </PageButton>
              <PageButton onClick={goToPrevPage} disabled={currentPage === 0}>
                Previous
              </PageButton>
              
              <PageInfo>
                Page {currentPage + 1} of {totalPages}
              </PageInfo>
              
              <PageButton onClick={goToNextPage} disabled={currentPage === totalPages - 1}>
                Next
              </PageButton>
              <PageButton onClick={goToLastPage} disabled={currentPage === totalPages - 1}>
                Last
              </PageButton>
            </PaginationControls>
          )}
        </>
      )}
    </Container>
  );
};

export default RecentContactsList;

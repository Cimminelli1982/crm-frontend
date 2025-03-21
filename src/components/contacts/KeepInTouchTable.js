import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import { FiClock } from 'react-icons/fi';
import ContactsModal from '../modals/ContactsModal';
import CompanyModal from '../modals/CompanyModal';
import TagsModal from '../modals/TagsModal';
import KeepInTouchModal from '../modals/KeepInTouchModal';
import CategoryModal from '../modals/CategoryModal';
import LastInteractionModal from '../modals/LastInteractionModal';
import Modal from 'react-modal';

// Set the app element for react-modal
Modal.setAppElement('#root');

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

const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1.5rem;
  table-layout: fixed; /* Use fixed layout for better column control */
  padding: 0 1rem;
  
  /* Column width specifications */
  th:nth-child(1) { width: 19%; }  /* Name */
  th:nth-child(2) { width: 16%; }  /* Company */
  th:nth-child(3) { width: 12%; }  /* Category */
  th:nth-child(4) { width: 16%; }  /* Tags */
  th:nth-child(5) { width: 10%; }  /* Keep in Touch */
  th:nth-child(6) { width: 8%; }   /* Last Interaction */
  th:nth-child(7) { width: 8%; }   /* Snooze */
  th:nth-child(8) { width: 11%; }  /* Next Due */
  
  @media (max-width: 1200px) {
    th:nth-child(1) { width: 20%; } /* Increase Name column on smaller screens */
    th:nth-child(2) { width: 15%; } /* Reduce Company column on smaller screens */
    th:nth-child(3) { width: 11%; } /* Reduce Category column on smaller screens */
    th:nth-child(4) { width: 16%; } /* Keep Tags column the same on smaller screens */
    th:nth-child(6) { width: 7%; }  /* Reduce Last Interaction column on smaller screens */
    th:nth-child(7) { width: 7%; }  /* Reduce Snooze column on smaller screens */
  }
`;

const TableHead = styled.thead`
  background-color: white;
  
  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-weight: 700;
    font-size: 0.75rem;
    color: black;
    border-bottom: 1px solid black;
    position: sticky;
    top: 0;
    z-index: 10;
    white-space: nowrap;
    
    &.centered {
      text-align: center;
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
    
    &.centered {
      text-align: center;
    }
    
    .cell-content {
      display: flex;
      align-items: center;
    }
  }
`;

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
    gap: 0.5rem;
  }
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.05);
  }
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.25rem;
  min-width: 80px;
  font-size: 0.7rem;
  border-radius: 0.375rem;
  background-color: ${props => {
    switch (props.category) {
      case 'Client': return '#e0f2fe';
      case 'Lead': return '#fef3c7';
      case 'Partner': return '#f3e8ff';
      case 'Vendor': return '#dcfce7';
      case 'Inbox': return '#ffefef';
      case 'Skip': return '#f3f4f6';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.category) {
      case 'Client': return '#0369a1';
      case 'Lead': return '#92400e';
      case 'Partner': return '#6b21a8';
      case 'Vendor': return '#15803d';
      case 'Inbox': return '#ef4444';
      case 'Skip': return '#4b5563';
      default: return '#4b5563';
    }
  }};
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
`;

const KeepInTouchBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => {
    switch (props.frequency) {
      case 'Weekly': return '#000000';           /* Black for weekly */
      case 'Monthly': return '#000000';          /* Black for monthly */
      case 'Quarterly': return '#444444';        /* Dark gray for quarterly */
      case 'Twice per Year': 
      case 'Twice a year': return '#888888';     /* Medium gray for twice a year */
      case 'Once per Year':
      case 'Once a year': return '#ffffff';      /* White for once a year */
      case 'Do not keep': return '#ffffff';      /* White for do not keep */
      default: return '#ffffff';                 /* Default white */
    }
  }};
  color: ${props => {
    switch (props.frequency) {
      case 'Weekly': return '#ffffff';           /* White text for weekly */
      case 'Monthly': return '#ffffff';          /* White text for monthly */
      case 'Quarterly': return '#ffffff';        /* White text for quarterly */
      case 'Twice per Year':
      case 'Twice a year': return '#333333';     /* Dark gray text for twice a year */
      case 'Once per Year':
      case 'Once a year': return '#000000';      /* Black text for once a year */
      case 'Do not keep': return '#000000';      /* Black text for do not keep */
      default: return '#000000';                 /* Default black text */
    }
  }};
  font-weight: 500;
  border: 1px solid #d1d5db;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%; /* Use full width of the cell */
  min-width: 0; /* Allow proper truncation */
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
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid black;
`;

const CompaniesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

const CompanyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  background-color: white;
  color: black;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid black;
  text-transform: uppercase;
  
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
`;

const DateCell = styled.td`
  color: ${props => props.isOverdue ? '#dc2626' : props.isUpcoming ? '#059669' : '#000000'};
  font-weight: ${props => (props.isOverdue || props.isUpcoming) ? '500' : 'normal'};
`;

// Truncated text with ellipsis
const TruncatedText = styled.span`
  display: block;
  max-width: ${props => props.maxWidth || '150px'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Last interaction date formatter
const LastInteractionDate = styled.span`
  color: #000000;
  font-weight: normal;
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

const SnoozeSelectContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const SnoozeSelect = styled.select`
  padding: 0.35rem;
  border-radius: 0.25rem;
  border: 1px solid #000000;
  font-size: 0.7rem;
  background-color: white;
  cursor: pointer;
  width: 95%;
  margin: 0 auto;
  appearance: menulist;
  
  &:hover {
    border-color: #000000;
  }
  
  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
`;

const SnoozeIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.7rem;
  font-weight: ${props => props.days > 0 ? '500' : 'normal'};
  color: #000000;
  padding: 0.35rem;
  background-color: white;
  border-radius: 0.25rem;
  cursor: pointer;
  border: 1px solid ${props => props.days > 0 ? '#000000' : '#d1d5db'};
  width: 95%;
  margin: 0 auto;
  transition: all 0.2s;
  
  svg {
    font-size: 0.8rem;
  }
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const EmptySnoozeIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  color: #6b7280;
  font-size: 0.7rem;
  cursor: pointer;
  width: 95%;
  margin: 0 auto;
  border: 1px dashed #d1d5db;
  border-radius: 0.25rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #000000;
    background-color: #f3f4f6;
  }
  
  &::before {
    content: "+";
    margin-right: 4px;
    font-weight: bold;
  }
`;

const StatusBubble = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.12rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 600;
  border-radius: 1rem;
  margin-left: 0.5rem;
  white-space: nowrap;
  
  /* Overdue: black with white text */
  ${props => props.overdue && `
    background-color: #000000;
    color: #FFFFFF;
  `}
  
  /* Upcoming: white with black text and border */
  ${props => props.upcoming && `
    background-color: #FFFFFF;
    color: #000000;
    border: 1px solid #000000;
  `}
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 6px; /* Add spacing between buttons */
  margin-bottom: 1.5rem;
  padding-left: 1.5rem; /* Align with page title */
  margin-top: -0.5rem; /* Reduce space to get closer to subtitle */
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.active ? `
    background-color: black;
    color: white;
    border: 1px solid black;
  ` : `
    background-color: white;
    color: black;
    border: 1px solid black;
  `}
  
  &:hover {
    opacity: 0.9;
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

const calculateNextDueDate = (lastInteraction, frequency, snoozeDays = 0) => {
  if (!lastInteraction || !frequency || frequency === 'Do not keep') return null;
  
  try {
    const lastDate = new Date(lastInteraction);
    if (isNaN(lastDate.getTime())) return null;
    
    let nextDueDate;
    
    switch (frequency) {
      case 'Weekly':
        nextDueDate = addWeeks(lastDate, 1);
        break;
      case 'Monthly':
        nextDueDate = addMonths(lastDate, 1);
        break;
      case 'Quarterly':
        nextDueDate = addMonths(lastDate, 3);
        break;
      case 'Twice per Year':
      case 'Twice a year':
        nextDueDate = addMonths(lastDate, 6);
        break;
      case 'Once per Year':
      case 'Once a year':
        nextDueDate = addYears(lastDate, 1);
        break;
      default:
        return null;
    }
    
    // Add snooze days if any
    if (snoozeDays > 0) {
      nextDueDate = addDays(nextDueDate, snoozeDays);
    }
    
    return nextDueDate;
  } catch (error) {
    console.error('Error calculating next due date:', error);
    return null;
  }
};

const KeepInTouchTable = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeepInTouchModal, setShowKeepInTouchModal] = useState(false);
  const [showLastInteractionModal, setShowLastInteractionModal] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState(null);
  const [filterCounts, setFilterCounts] = useState({ overdue: 0, upcoming: 0, needFixing: 0 });
  const [contactSnoozes, setContactSnoozes] = useState({});
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState({});
  
  useEffect(() => {
    fetchContacts();
  }, []);
  
  useEffect(() => {
    applyFilter(activeFilter);
    updateFilterCounts();
  }, [contacts, activeFilter, contactSnoozes]);
  
  // Calculate and update filter counts
  const updateFilterCounts = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    setFilterCounts({
      overdue: contacts.filter(c => {
        // Recalculate next due date with current snooze days to ensure accuracy
        const snoozeDays = contactSnoozes[c.id] || 0;
        const dueDate = calculateNextDueDate(c.last_interaction, c.keep_in_touch_frequency, snoozeDays);
        return dueDate && dueDate < today;
      }).length,
      upcoming: contacts.filter(c => { 
        // Recalculate next due date with current snooze days to ensure accuracy
        const snoozeDays = contactSnoozes[c.id] || 0;
        const dueDate = calculateNextDueDate(c.last_interaction, c.keep_in_touch_frequency, snoozeDays);
        return dueDate && dueDate >= today && dueDate <= nextWeek;
      }).length,
      needFixing: contacts.filter(c => 
        (!c.nextDueDate || !c.last_interaction) && 
        c.keep_in_touch_frequency && 
        c.keep_in_touch_frequency !== 'Do not keep'
      ).length
    });
  };
  
  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First fetch contacts with tags
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          tags:contact_tags(tag_id, tags(name))
        `)
        .in('keep_in_touch_frequency', ['Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year'])
        .neq('contact_category', 'Skip');
        
      if (error) throw error;
      
      // Get all contact IDs
      const contactIds = data.map(contact => contact.id);
      
      // Fetch company data using the same structure as RecentContactsList
      const { data: companiesData, error: companiesError } = await supabase
        .from('contact_companies')
        .select('contact_id, company_id, companies:company_id(id, name, website)')
        .in('contact_id', contactIds);
        
      if (companiesError) throw companiesError;
      
      // Fetch snooze data for contacts
      const { data: snoozeData, error: snoozeError } = await supabase
        .from('contact_snoozes')
        .select('contact_id, snooze_days')
        .in('contact_id', contactIds);
        
      if (snoozeError) {
        console.error('Error fetching snooze data:', snoozeError);
        // Continue without snooze data if table doesn't exist yet
      }
      
      // Create a map of contact IDs to snooze days
      const snoozeMap = {};
      if (snoozeData) {
        snoozeData.forEach(item => {
          snoozeMap[item.contact_id] = item.snooze_days;
        });
      }
      
      // Update the contactSnoozes state
      setContactSnoozes(snoozeMap);
      
      // Process contacts data
      const processedContacts = data.map(contact => {
        // Get companies for this contact
        const companies = companiesData ? companiesData.filter(cc => cc.contact_id === contact.id) : [];
        // Get snooze days for this contact
        const snoozeDays = snoozeMap[contact.id] || 0;
        
        return {
          ...contact,
          tags: contact.tags?.map(t => t.tags?.name).filter(Boolean) || [],
          nextDueDate: calculateNextDueDate(contact.last_interaction, contact.keep_in_touch_frequency, snoozeDays),
          contact_companies: companies,
          companiesList: companies.map(cc => ({
            id: cc.company_id,
            name: cc.companies?.name || 'Unknown',
            website: cc.companies?.website
          })),
          snoozeDays
        };
      });
      
      // Sort by next due date descending (latest first)
      const sortedContacts = processedContacts.sort((a, b) => {
        if (!a.nextDueDate) return 1; // Contacts without nextDueDate go to the end
        if (!b.nextDueDate) return -1;
        return b.nextDueDate - a.nextDueDate; // Descending order (larger/later dates first)
      });
      
      setContacts(sortedContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilter = (filter) => {
    if (!filter) {
      setFilteredContacts(contacts);
      return;
    }

    const today = new Date();
    const nextWeek = addDays(today, 7);

    switch (filter) {
      case 'overdue':
        setFilteredContacts(contacts.filter(contact => {
          // Recalculate next due date with current snooze days to ensure accuracy
          const snoozeDays = contactSnoozes[contact.id] || 0;
          const dueDate = calculateNextDueDate(contact.last_interaction, contact.keep_in_touch_frequency, snoozeDays);
          return dueDate && dueDate < today;
        }));
        break;
      case 'upcoming':
        setFilteredContacts(contacts.filter(contact => {
          // Recalculate next due date with current snooze days to ensure accuracy
          const snoozeDays = contactSnoozes[contact.id] || 0;
          const dueDate = calculateNextDueDate(contact.last_interaction, contact.keep_in_touch_frequency, snoozeDays);
          return dueDate && dueDate >= today && dueDate <= nextWeek;
        }));
        break;
      case 'needFixing':
        setFilteredContacts(contacts.filter(contact => 
          (!contact.nextDueDate || !contact.last_interaction) && 
          contact.keep_in_touch_frequency && 
          contact.keep_in_touch_frequency !== 'Do not keep'
        ));
        break;
      default:
        setFilteredContacts(contacts);
    }
  };
  
  const handleFilterClick = (filter) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };
  
  const handleCellClick = (contact, type) => {
    setSelectedContactForEdit(contact);
    switch (type) {
      case 'name':
        setShowContactsModal(true);
        break;
      case 'company':
        setShowCompanyModal(true);
        break;
      case 'tags':
        setShowTagsModal(true);
        break;
      case 'category':
        setShowCategoryModal(true);
        break;
      case 'keepInTouch':
        setShowKeepInTouchModal(true);
        break;
      case 'lastInteraction':
        setShowLastInteractionModal(true);
        break;
      default:
        break;
    }
  };
  
  const handleModalClose = () => {
    setShowContactsModal(false);
    setShowCompanyModal(false);
    setShowTagsModal(false);
    setShowCategoryModal(false);
    setShowKeepInTouchModal(false);
    setShowLastInteractionModal(false);
    setSelectedContactForEdit(null);
    fetchContacts(); // Refresh the list after modal closes
  };
  
  const formatLastInteractionDate = (date) => {
    if (!date) return '-';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return '-';
      
      const currentYear = new Date().getFullYear();
      const dateYear = parsedDate.getFullYear();
      
      // If it's the current year, only show month and day
      if (dateYear === currentYear) {
        return format(parsedDate, 'MMM d');
      } 
      // If it's a previous year, only show the year
      else {
        return format(parsedDate, 'yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };
  
  const formatNextDueDate = (date) => {
    if (!date) return '-';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return '-';
      
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      // If it's more than a month overdue, just show "Overdue"
      if (parsedDate < oneMonthAgo) {
        return 'Overdue';
      }
      // Otherwise show full date
      else {
        return format(parsedDate, 'MMM d, yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };
  
  const toggleSnoozeDropdown = (contactId) => {
    setShowSnoozeDropdown(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }));
  };
  
  const handleSnoozeChange = async (contactId, snoozeDays) => {
    try {
      // Convert to integer and handle string input
      const parsedSnoozeDays = parseInt(snoozeDays, 10);
      
      // Update local state first for immediate UI feedback
      setContactSnoozes(prev => ({
        ...prev,
        [contactId]: parsedSnoozeDays
      }));
      
      // Hide the dropdown after selection
      setShowSnoozeDropdown(prev => ({
        ...prev,
        [contactId]: false
      }));
      
      // Update contacts with new due dates
      setContacts(prevContacts => {
        return prevContacts.map(contact => {
          if (contact.id === contactId) {
            return {
              ...contact,
              nextDueDate: calculateNextDueDate(
                contact.last_interaction, 
                contact.keep_in_touch_frequency, 
                parsedSnoozeDays
              )
            };
          }
          return contact;
        });
      });
      
      // Update database
      const { error } = await supabase
        .from('contact_snoozes')
        .upsert({ 
          contact_id: contactId, 
          snooze_days: parsedSnoozeDays,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'contact_id' 
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Error updating snooze days:', err);
      // Revert the change in state if the update fails
      fetchContacts();
    }
  };
  
  return (
    <Container>
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
      
      <FiltersContainer>
        <FilterButton
          active={activeFilter === 'overdue'}
          onClick={() => handleFilterClick('overdue')}
        >
          Overdue
        </FilterButton>
        
        <FilterButton
          active={activeFilter === 'upcoming'}
          onClick={() => handleFilterClick('upcoming')}
        >
          Upcoming
        </FilterButton>
        
        <FilterButton
          active={activeFilter === 'needFixing'}
          onClick={() => handleFilterClick('needFixing')}
        >
          Need Fixing
        </FilterButton>
      </FiltersContainer>
      
      <ContactTable>
        <TableHead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Keep in Touch</th>
            <th>Last Interaction</th>
            <th>Snooze</th>
            <th className="centered">Next Due</th>
          </tr>
        </TableHead>
        <TableBody>
          {filteredContacts.map(contact => {
            const snoozeDays = contactSnoozes[contact.id] || 0;
            // Recalculate next due date with current snooze days to ensure accuracy
            const nextDueDate = calculateNextDueDate(
              contact.last_interaction, 
              contact.keep_in_touch_frequency, 
              snoozeDays
            );
            const isOverdue = nextDueDate && nextDueDate < new Date();
            const isUpcoming = nextDueDate && !isOverdue && nextDueDate < addDays(new Date(), 7);
            
            return (
              <tr key={contact.id}>
                <ClickableCell onClick={() => handleCellClick(contact, 'name')}>
                  <div className="cell-content">
                    <span style={{ fontWeight: 'bold' }}>
                      {contact.first_name} {contact.last_name}
                    </span>
                    {isOverdue && <StatusBubble overdue>Overdue</StatusBubble>}
                    {isUpcoming && !isOverdue && <StatusBubble upcoming>Soon</StatusBubble>}
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'company')}>
                  <div className="cell-content">
                    <CompaniesContainer>
                      {contact.companiesList?.length > 0 ? (
                        contact.companiesList.map(company => (
                          <CompanyBadge key={company.id}>
                            <span>{company.name}</span>
                          </CompanyBadge>
                        ))
                      ) : (
                        <span style={{ color: '#444444', fontStyle: 'italic' }}>No company</span>
                      )}
                    </CompaniesContainer>
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'category')}>
                  <div className="cell-content">
                    {contact.contact_category ? (
                      <CategoryBadge category={contact.contact_category}>
                        {contact.contact_category === 'Professional Investor' ? '💰 Investor' :
                         contact.contact_category === 'Friend and Family' ? '❤️ Loved one' :
                         contact.contact_category === 'Client' ? '🤝 Client' :
                         contact.contact_category === 'Colleague' ? '👥 Colleague' :
                         contact.contact_category === 'Prospect' ? '🎯 Prospect' :
                         contact.contact_category === 'Advisor' ? '🧠 Advisor' :
                         contact.contact_category === 'Team' ? '⚽ Team' :
                         contact.contact_category === 'Manager' ? '💼 Manager' :
                         contact.contact_category === 'Founder' ? '💻 Founder' :
                         contact.contact_category === 'Supplier' ? '📦 Supplier' :
                         contact.contact_category === 'Skip' ? '❌ Skip' :
                         contact.contact_category === 'Inbox' ? '📬 Inbox' :
                         contact.contact_category === 'Other' ? '📌 Other' :
                         `⚪ ${contact.contact_category}`}
                      </CategoryBadge>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'tags')}>
                  <TagsContainer>
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.slice(0, 3).map((tag, index) => {
                        const tagColor = getTagColor(tag);
                        return (
                          <Tag key={index} color={tagColor.bg} textColor={tagColor.text}>
                            {tag}
                          </Tag>
                        );
                      })
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags</span>
                    )}
                    {contact.tags && contact.tags.length > 3 && (
                      <span style={{ 
                        fontSize: '0.75rem',
                        color: '#4b5563',
                        marginLeft: '2px'
                      }}>
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </TagsContainer>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'keepInTouch')}>
                  <div className="cell-content">
                    {contact.keep_in_touch_frequency ? (
                      contact.keep_in_touch_frequency === 'Do not keep' || contact.keep_in_touch_frequency === 'Do not keep in touch' ? (
                        <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2em' }}>❌</span>
                      ) : (
                        <KeepInTouchBadge frequency={contact.keep_in_touch_frequency}>
                          {contact.keep_in_touch_frequency === 'Monthly' ? '❤️ ' : ''}
                          {contact.keep_in_touch_frequency}
                        </KeepInTouchBadge>
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'lastInteraction')}>
                  <div className="cell-content" style={{ justifyContent: 'center' }}>
                    <LastInteractionDate>
                      {formatLastInteractionDate(contact.last_interaction)}
                    </LastInteractionDate>
                  </div>
                </ClickableCell>
                
                <td className="centered">
                  <div className="cell-content" style={{ justifyContent: 'center' }}>
                    {contact.keep_in_touch_frequency && contact.keep_in_touch_frequency !== 'Do not keep' ? (
                      <SnoozeSelectContainer>
                        {showSnoozeDropdown[contact.id] ? (
                          <SnoozeSelect 
                            value={contactSnoozes[contact.id] || 0}
                            onChange={(e) => handleSnoozeChange(contact.id, e.target.value)}
                            onBlur={() => toggleSnoozeDropdown(contact.id)}
                            autoFocus
                          >
                            <option value="0">No snooze</option>
                            <option value="1">+1 day</option>
                            <option value="2">+2 days</option>
                            <option value="3">+3 days</option>
                            <option value="7">+1 week</option>
                            <option value="14">+2 weeks</option>
                            <option value="30">+1 month</option>
                          </SnoozeSelect>
                        ) : (
                          <>
                            {contactSnoozes[contact.id] > 0 ? (
                              <SnoozeIndicator 
                                days={contactSnoozes[contact.id]} 
                                onClick={() => toggleSnoozeDropdown(contact.id)}
                              >
                                <FiClock /> {contactSnoozes[contact.id]} day{contactSnoozes[contact.id] > 1 ? 's' : ''}
                              </SnoozeIndicator>
                            ) : (
                              <EmptySnoozeIndicator onClick={() => toggleSnoozeDropdown(contact.id)}>
                                Snooze
                              </EmptySnoozeIndicator>
                            )}
                          </>
                        )}
                      </SnoozeSelectContainer>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
                    )}
                  </div>
                </td>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'lastInteraction')} className="centered">
                  <div className="cell-content" style={{ justifyContent: 'center', position: 'relative', textAlign: 'center' }}>
                    <DateCell isOverdue={isOverdue} isUpcoming={isUpcoming}>
                      {nextDueDate ? formatNextDueDate(nextDueDate) : '-'}
                    </DateCell>
                    <HoverOverlay></HoverOverlay>
                  </div>
                </ClickableCell>
              </tr>
            );
          })}
        </TableBody>
      </ContactTable>
      
      {/* Modals */}
      {showContactsModal && selectedContactForEdit && (
        <ContactsModal
          isOpen={showContactsModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showCompanyModal && selectedContactForEdit && (
        <CompanyModal
          isOpen={showCompanyModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showTagsModal && selectedContactForEdit && (
        <TagsModal
          isOpen={showTagsModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showKeepInTouchModal && selectedContactForEdit && (
        <KeepInTouchModal
          isOpen={showKeepInTouchModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showCategoryModal && selectedContactForEdit && (
        <CategoryModal
          isOpen={showCategoryModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showLastInteractionModal && selectedContactForEdit && (
        <LastInteractionModal
          isOpen={showLastInteractionModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
    </Container>
  );
};

export default KeepInTouchTable; 
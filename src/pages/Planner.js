import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiCalendar, FiClock, FiUsers, FiFileText, FiStar, FiMessageSquare, FiExternalLink, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import PlannerModal from '../components/modals/PlannerModal';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, isSameWeek, startOfMonth, endOfMonth, addMonths, subMonths, getWeek, isSameMonth } from 'date-fns';

// Container styling
const PageContainer = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
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
  color: #111827;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MeetingCount = styled.span`
  font-size: 1rem;
  font-weight: 400;
  color: #6b7280;
`;

const Description = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
`;

const ContentSection = styled.div`
  padding: 1.5rem 0 0;
`;

// Styling for date navigation
const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
`;

const MonthNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #1d4ed8;
  }
`;

const MonthDisplay = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  min-width: 150px;
  text-align: center;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WeekSummary = styled.div`
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
`;

// Styling for week sections
const WeekSection = styled.div`
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const WeekHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const WeekTitle = styled.h2`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AddEventButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: #e0f2fe;
  color: #0284c7;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #bae6fd;
  }
`;

const WeekDateRange = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const NoMeetingsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
`;

// Table styling
const PlannerTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1.5rem;
  table-layout: fixed; /* Use fixed layout for better column control */
  
  /* Column width specifications - adjusted as requested */
  th:nth-child(1) { width: 6%; }   /* Date column */
  th:nth-child(2) { width: 12%; }  /* Meeting column */
  th:nth-child(3) { width: 12%; }  /* Attendees column */
  th:nth-child(4) { width: 12%; }  /* Tags column - reduced to 12% */
  th:nth-child(5) { width: 6%; }   /* Record column */
  th:nth-child(6) { width: 6%; }   /* Score column */
  th:nth-child(7) { width: 46%; }  /* Note column - increased to use remaining space */
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
`;

const ClickableCell = styled.td`
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #1f2937;
  vertical-align: middle;
  overflow: hidden;
  
  .cell-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-width: 0;
    padding: 0.25rem 0;
  }
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #6b7280;
`;

const TableCell = styled.td`
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #1f2937;
  vertical-align: middle;
`;

const ScoreCell = styled(TableCell)`
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  .stars {
    color: #f59e0b;
    display: flex;
    gap: 2px;
  }
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: ${props => props.color || '#e5f9ee'};
  color: ${props => props.textColor || '#065f46'};
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &.company {
    background-color: #e0f2fe;
    color: #0369a1;
  }
  
  &.more {
    background-color: #f3f4f6;
    color: #6b7280;
  }
  
  &.has-remove {
    padding-right: 0.25rem;
  }
`;

const TagContent = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.25rem;
  padding: 0.125rem;
  border-radius: 50%;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const AddTagButton = styled.button`
  display: inline-flex;
  align-items: center;
  background-color: #f9fafb;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px dashed #d1d5db;
  cursor: pointer;
  
  &:hover {
    background-color: #f3f4f6;
    color: #4b5563;
  }
`;

const NoDataRow = styled.tr`
  td {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
`;

const LinkIcon = styled.a`
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  
  &:hover {
    color: #2563eb;
  }
`;

// Tag color mapping based on category
const getTagColor = (tagName) => {
  const lowerTag = tagName.toLowerCase();
  
  if (lowerTag.includes('founder') || lowerTag.includes('ceo') || lowerTag.includes('owner')) {
    return { bg: '#e5f9ee', text: '#065f46' }; // Green
  } else if (lowerTag.includes('compliance') || lowerTag.includes('legal')) {
    return { bg: '#e5f9ee', text: '#065f46' }; // Green
  } else if (lowerTag.includes('finance') || lowerTag.includes('accounting')) {
    return { bg: '#fef3c7', text: '#92400e' }; // Yellow
  } else if (lowerTag.includes('marketing') || lowerTag.includes('sales')) {
    return { bg: '#fee2e2', text: '#991b1b' }; // Red
  } else if (lowerTag.includes('tech') || lowerTag.includes('developer')) {
    return { bg: '#dbeafe', text: '#1e40af' }; // Blue
  } else {
    return { bg: '#f3f4f6', text: '#4b5563' }; // Gray
  }
};

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
  z-index: 50;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s;
  cursor: pointer;
  
  &:focus {
    outline: none;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3b82f6;
  color: white;
  border: none;
  
  &:hover {
    background-color: #2563eb;
  }
  
  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const SearchInput = styled.div`
  position: relative;
  margin-bottom: 1rem;
  
  input {
    width: 100%;
    padding: 0.625rem 1rem 0.625rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.15s;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }
  }
  
  svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }
`;

const ItemsList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
`;

const ItemOption = styled.div`
  display: flex;
  align-items: center;
  padding: 0.625rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &.selected {
    background-color: #eff6ff;
  }
  
  .checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    margin-right: 0.75rem;
    color: white;
    transition: all 0.15s;
    
    &.checked {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
  }
  
  .item-label {
    flex: 1;
    font-size: 0.875rem;
    color: #111827;
  }
`;

const NoItemsMessage = styled.div`
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const Planner = () => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Date navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weeksInView, setWeeksInView] = useState([]);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch meetings data
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*');
      
      if (meetingsError) throw meetingsError;
      
      console.log('Meetings data fetched:', meetingsData?.length || 0, 'records');
      
      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      // Fetch relationships between meetings and contacts with contact details
      const { data: contactsData, error: contactsError } = await supabase
        .from('meetings_contacts')
        .select(`
          meeting_id,
          contact_id,
          contacts:contact_id (id, first_name, last_name)
        `);
      
      if (contactsError) {
        console.error('Error fetching meetings_contacts:', contactsError);
      }
      
      console.log('Fetched contacts data:', contactsData?.length || 0, 'records');

      // Fetch tags from the meetings_tags junction table
      const { data: tagsConnectionData, error: tagsConnectionError } = await supabase
        .from('meetings_tags')
        .select('meeting_id, tags:tag_id(id, name)');
        
      if (tagsConnectionError) {
        console.error('Error fetching meetings_tags:', tagsConnectionError);
      }
      
      // Process meetings with contacts and tags information
      const meetingsWithContactsAndTags = meetingsData.map(meeting => {
        let relatedContacts = [];
        let relatedTags = [];
        
        // Process contact relationships if we have the data
        if (contactsData) {
          relatedContacts = contactsData
            .filter(contact => contact.meeting_id === meeting.id)
            // Filter out "Simone Cimminelli" contacts
            .filter(contact => {
              if (!contact.contacts) return true;
              
              const firstName = (contact.contacts.first_name || '').toLowerCase();
              const lastName = (contact.contacts.last_name || '').toLowerCase();
              const fullName = `${firstName} ${lastName}`.trim();
              
              // Skip if the name contains "simone cimminelli" (case insensitive)
              return !fullName.includes('simone cimminelli');
            })
            .map(contact => {
              if (!contact.contacts) return 'Unknown Contact';
              
              // Handle different combinations of null or empty first/last names
              const firstName = contact.contacts.first_name || '';
              const lastName = contact.contacts.last_name || '';
              
              if (firstName && lastName) {
                return `${firstName} ${lastName}`;
              } else if (firstName) {
                return firstName;
              } else if (lastName) {
                return lastName;
              } else {
                return `Contact #${contact.contacts.id}`;
              }
            });
        }
        
        // Process tag relationships if we have the data
        if (tagsConnectionData) {
          relatedTags = tagsConnectionData
            .filter(tc => tc.meeting_id === meeting.id)
            .map(tc => tc.tags?.name || 'Unknown tag');
        }
        
        console.log(`Meeting ${meeting.id} tags:`, relatedTags);
        
        return { 
          ...meeting, 
          meeting_contacts: relatedContacts,
          // Ensure these fields exist with default values if they're missing
          meeting_name: meeting.meeting_name || 'Untitled Meeting',
          meeting_date: meeting.meeting_date || new Date().toISOString(),
          meeting_score: meeting.meeting_score || 0,
          meeting_tags: relatedTags,  // Use the tags from the junction table
          meeting_note: meeting.meeting_note || '',
          meeting_record: meeting.meeting_record || ''
        };
      });

      // Sort meetings by date, newest first
      const sortedMeetings = meetingsWithContactsAndTags.sort((a, b) => {
        const dateA = new Date(a.meeting_date);
        const dateB = new Date(b.meeting_date);
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return dateB - dateA;
        } else if (!isNaN(dateA)) {
          return -1;
        } else if (!isNaN(dateB)) {
          return 1;
        } else {
          return 0;
        }
      });
      
      console.log('Processed meetings:', sortedMeetings.length);
      setMeetings(sortedMeetings);
      setTotalCount(sortedMeetings.length);

      // Fetch available tags for dropdown
      try {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('name');
          
        if (!tagsError && tagsData) {
          setAvailableTags(tagsData.map(tag => tag.name));
        }
      } catch (e) {
        console.error('Error fetching tags:', e);
      }
      
      // Fetch available contacts for dropdown
      try {
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name');
          
        if (!contactsError && contactsData) {
          setAvailableContacts(contactsData.map(contact => ({
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`
          })));
        }
      } catch (e) {
        console.error('Error fetching contacts:', e);
      }
    } catch (error) {
      console.error('Error in meeting data processing:', error);
      setError(`Failed to load meetings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate and update the weeks to show based on current month
  const calculateWeeksInView = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday as first day of week
    const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    // Generate array of weeks within the month range
    let weeks = [];
    let current = firstWeekStart;
    
    while (current <= lastWeekEnd) {
      const weekStart = current;
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
      const weekNumber = getWeek(current, { weekStartsOn: 1 });
      
      weeks.push({
        weekNumber,
        start: weekStart,
        end: weekEnd,
        meetings: [],
        isInCurrentMonth: isSameMonth(weekStart, date) || isSameMonth(weekEnd, date)
      });
      
      current = addWeeks(current, 1);
    }
    
    return weeks;
  };
  
  // Group meetings by week
  const groupMeetingsByWeek = (meetingsData, weeks) => {
    if (!meetingsData || !weeks) return [];
    
    // Create deep copy of weeks to avoid mutating the original
    const updatedWeeks = JSON.parse(JSON.stringify(weeks));
    
    // Ensure all weeks start with empty meetings arrays
    updatedWeeks.forEach(week => {
      week.meetings = [];
    });
    
    // Track which meetings have been assigned to prevent duplicates
    const assignedMeetingIds = new Set();
    
    // Assign meetings to appropriate weeks
    meetingsData.forEach(meeting => {
      // Skip if already assigned or no valid id
      if (!meeting.id || assignedMeetingIds.has(meeting.id)) {
        return;
      }
      
      const meetingDate = new Date(meeting.meeting_date);
      
      for (let i = 0; i < updatedWeeks.length; i++) {
        const week = updatedWeeks[i];
        const weekStart = new Date(week.start);
        const weekEnd = new Date(week.end);
        
        if (meetingDate >= weekStart && meetingDate <= weekEnd) {
          week.meetings.push(meeting);
          assignedMeetingIds.add(meeting.id);
          break; // Stop checking additional weeks once assigned
        }
      }
    });
    
    // Sort meetings within each week by date (most recent on top)
    updatedWeeks.forEach(week => {
      week.meetings.sort((a, b) => {
        // Sort by date (newest first)
        return new Date(b.meeting_date) - new Date(a.meeting_date);
      });
    });
    
    return updatedWeeks;
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    console.log('Navigating to previous month');
    const prevMonth = subMonths(currentMonth, 1);
    setCurrentMonth(prevMonth);
  };
  
  const goToNextMonth = () => {
    console.log('Navigating to next month');
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
  };
  
  const goToCurrentMonth = () => {
    console.log('Navigating to current month');
    setCurrentMonth(new Date());
  };
  
  // When month changes, we need to recalculate visible weeks
  useEffect(() => {
    const weeks = calculateWeeksInView(currentMonth);
    console.log('Month changed to:', format(currentMonth, 'MMMM yyyy'));
    setWeeksInView(weeks);
    
    // Store month bounds for filtering meetings later
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // When month changes, we need to filter meetings to only include those in this month's view
    if (meetings.length > 0) {
      console.log('Filtering meetings for new month:', format(currentMonth, 'MMMM yyyy'));
      
      const visibleMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.meeting_date);
        const weekStart = new Date(weeks[0].start);
        const weekEnd = new Date(weeks[weeks.length - 1].end);
        // Include meetings that fall between first day of first week and last day of last week
        return meetingDate >= weekStart && meetingDate <= weekEnd;
      });
      
      console.log(`Found ${visibleMeetings.length} meetings in current month's view range`);
      
      // Group filtered meetings into their respective weeks
      const updatedWeeks = groupMeetingsByWeek(visibleMeetings, weeks);
      setWeeksInView(updatedWeeks);
    }
  }, [currentMonth]);
  
  // When meetings data changes, we need to update the week structure
  useEffect(() => {
    if (meetings.length > 0 && weeksInView.length > 0) {
      console.log('New meetings data received:', meetings.length, 'meetings');
      
      // Filter meetings for current month view
      const monthViewStart = weeksInView[0].start;
      const monthViewEnd = weeksInView[weeksInView.length - 1].end;
      
      const visibleMeetings = meetings.filter(meeting => {
        if (!meeting.meeting_date) return false;
        
        const meetingDate = new Date(meeting.meeting_date);
        const viewStart = new Date(monthViewStart);
        const viewEnd = new Date(monthViewEnd);
        
        // Check if meeting date is within the week range
        return !isNaN(meetingDate.getTime()) && 
               meetingDate >= viewStart && 
               meetingDate <= viewEnd;
      });
      
      console.log(`Filtering meetings for current view: ${visibleMeetings.length} meetings in range`);
      
      // Empty the weeks first
      const emptyWeeks = weeksInView.map(week => ({
        ...week,
        meetings: [] // Reset meetings array to empty
      }));
      
      // Group meetings into weeks
      const updatedWeeks = groupMeetingsByWeek(visibleMeetings, emptyWeeks);
      setWeeksInView(updatedWeeks);
    }
  }, [meetings]);
  
  // Initial load of meetings
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Format date to DD/MM/YY
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return 'Invalid date';
      
      // Format as DD/MM/YY
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit'
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  // Check if string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Render record as link icon if it's a URL
  const renderRecord = (record) => {
    if (!record) return <span style={{ color: '#9ca3af' }}>N/A</span>;
    
    if (isValidUrl(record)) {
      return (
        <LinkIcon href={record} target="_blank" rel="noopener noreferrer" title={record}>
          <FiExternalLink size={18} />
        </LinkIcon>
      );
    } else {
      return record;
    }
  };

  // Render stars for score
  const renderStars = (score) => {
    return (
      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <FiStar 
            key={i} 
            style={{ 
              fill: i < score ? '#f59e0b' : 'transparent',
              color: i < score ? '#f59e0b' : '#d1d5db'
            }} 
          />
        ))}
      </div>
    );
  };

  // Handle tag removal
  const handleRemoveTag = async (meetingId, tagToRemove) => {
    try {
      console.log(`Removing tag "${tagToRemove}" from meeting ${meetingId}`);
      
      // First we need to find the tag ID associated with this tag name
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagToRemove)
        .single();
      
      if (tagError) {
        console.error('Error finding tag:', tagError);
        return;
      }
      
      if (!tagData) {
        console.error('Tag not found:', tagToRemove);
        return;
      }
      
      const tagId = tagData.id;
      console.log(`Found tag ID ${tagId} for tag "${tagToRemove}"`);
      
      // Delete the connection from the junction table
      const { error: deleteError } = await supabase
        .from('meetings_tags')
        .delete()
        .eq('meeting_id', meetingId)
        .eq('tag_id', tagId);
      
      if (deleteError) {
        console.error('Error deleting tag connection:', deleteError);
        throw deleteError;
      }
      
      console.log(`Successfully removed tag "${tagToRemove}" from meeting ${meetingId}`);
      
      // Update local state
      const meetingToUpdate = meetings.find(m => m.id === meetingId);
      if (meetingToUpdate) {
        const updatedTags = meetingToUpdate.meeting_tags.filter(tag => tag !== tagToRemove);
        
        setMeetings(meetings.map(meeting => 
          meeting.id === meetingId 
            ? { ...meeting, meeting_tags: updatedTags } 
            : meeting
        ));
      }
      
      // Refresh meetings data to ensure UI is in sync with database
      await fetchMeetings();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };
  
  // Handle attendee removal
  const handleRemoveAttendee = async (meetingId, attendeeToRemove) => {
    try {
      // Find the meeting and update contacts
      const meetingToUpdate = meetings.find(m => m.id === meetingId);
      if (!meetingToUpdate) return;
      
      // Remove the attendee
      const updatedAttendees = meetingToUpdate.meeting_contacts.filter(contact => contact !== attendeeToRemove);
      
      // Note: This would require proper backend support to update meeting_contacts junction table
      // For this demo, we'll just update the UI
      
      // Update local state
      setMeetings(meetings.map(meeting => 
        meeting.id === meetingId 
          ? { ...meeting, meeting_contacts: updatedAttendees } 
          : meeting
      ));
    } catch (error) {
      console.error('Error removing attendee:', error);
    }
  };
  
  // Open modal for adding tags
  const openTagsModal = (meeting) => {
    const existingTags = meeting.meeting_tags || [];
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMeeting(null);
  };
  
  // Render tags
  const renderTags = (meeting) => {
    const MAX_VISIBLE_TAGS = 2;
    
    if (!meeting.meeting_tags || meeting.meeting_tags.length === 0) {
      return (
        <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.75rem' }}>
          No tags
        </span>
      );
    }
    
    const visibleTags = meeting.meeting_tags.slice(0, MAX_VISIBLE_TAGS);
    const hiddenCount = Math.max(0, meeting.meeting_tags.length - MAX_VISIBLE_TAGS);
    
    return (
      <>
        {visibleTags.map((tag, idx) => {
          const { bg, text } = getTagColor(tag);
          return (
            <Tag key={idx} color={bg} textColor={text} className="has-remove">
              <TagContent>{tag}</TagContent>
              <RemoveButton onClick={() => handleRemoveTag(meeting.id, tag)}>
                <FiX size={12} />
              </RemoveButton>
            </Tag>
          );
        })}
        
        {hiddenCount > 0 && (
          <Tag className="more">
            +{hiddenCount} more
          </Tag>
        )}
      </>
    );
  };
  
  // Render attendees
  const renderAttendees = (meeting) => {
    const MAX_VISIBLE_ATTENDEES = 1;
    
    if (!meeting.meeting_contacts || meeting.meeting_contacts.length === 0) {
      return (
        <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.75rem' }}>
          No attendees
        </span>
      );
    }
    
    const visibleAttendees = meeting.meeting_contacts.slice(0, MAX_VISIBLE_ATTENDEES);
    const hiddenCount = Math.max(0, meeting.meeting_contacts.length - MAX_VISIBLE_ATTENDEES);
    
    return (
      <>
        {visibleAttendees.map((attendee, idx) => (
          <Tag key={idx} color="#eef2ff" textColor="#4338ca" className="has-remove">
            <TagContent>{attendee}</TagContent>
            <RemoveButton onClick={() => handleRemoveAttendee(meeting.id, attendee)}>
              <FiX size={12} />
            </RemoveButton>
          </Tag>
        ))}
        
        {hiddenCount > 0 && (
          <Tag className="more">
            +{hiddenCount} more
          </Tag>
        )}
      </>
    );
  };

  // Function to truncate note text
  const truncateNote = (note, maxLength = 60) => {
    if (!note) return 'No notes';
    if (note.length <= maxLength) return note;
    
    // Find the last space within the maxLength to avoid cutting words
    let lastSpace = note.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace === -1) lastSpace = maxLength;
    
    return `${note.substring(0, lastSpace)}...`;
  };
  
  // Handle opening the modal with default Details tab
  const handleRowClick = (meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };
  
  // Handle opening the modal with Notes tab selected
  const handleNoteClick = (e, meeting) => {
    e.stopPropagation(); // Prevent the row click handler from being called
    setSelectedMeeting({...meeting, initialTab: 'notes'});
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setSelectedMeeting(null);
    setIsModalOpen(false);
    // Refresh meetings data after modal closes
    await fetchMeetings();
  };
  
  // Function to create a new meeting based on a given date
  const handleAddMeeting = (date = new Date()) => {
    // Format the date for the form
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Create a new meeting object
    const newMeeting = {
      id: null, // Will be assigned by the database
      meeting_name: "New Meeting",
      meeting_date: formattedDate,
      meeting_note: "",
      meeting_record: "",
      meeting_score: 0,
      meeting_contacts: [],
      meeting_tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      initialTab: 'details' // Open in details tab
    };
    
    // Set as selected meeting and open modal
    setSelectedMeeting(newMeeting);
    setIsModalOpen(true);
  };
  
  // Function to create a new meeting for a specific week
  const handleAddMeetingForWeek = (week) => {
    // Create a template meeting object with the week's Monday as the default date
    const weekStart = new Date(week.start);
    
    // If Monday is in the past, use today's date instead
    const today = new Date();
    const meetingDate = weekStart < today ? today : weekStart;
    
    // Use the common function to create the meeting
    handleAddMeeting(meetingDate);
  };

  // Format date range for display
  const formatDateRange = (start, end) => {
    return `${format(new Date(start), 'd/M')} - ${format(new Date(end), 'd/M/yyyy')}`;
  };
  
  const renderWeekTable = (meetings) => {
    if (!meetings || meetings.length === 0) {
      return (
        <NoMeetingsMessage>No meetings scheduled for this week</NoMeetingsMessage>
      );
    }
    
    return (
      <PlannerTable>
        <TableHead>
          <tr>
            <th>Date</th>
            <th>Meeting</th>
            <th>Attendees</th>
            <th>Tags</th>
            <th>Record</th>
            <th>Score</th>
            <th>Note</th>
          </tr>
        </TableHead>
        <TableBody>
          {meetings.map((meeting, index) => (
            <tr key={meeting.id || index} onClick={() => handleRowClick(meeting)} style={{ cursor: 'pointer' }}>
              <ClickableCell>
                <div className="cell-content">
                  <IconWrapper><FiClock /></IconWrapper>
                  {formatDate(meeting.meeting_date)}
                </div>
              </ClickableCell>
              
              <ClickableCell>
                <div className="cell-content">
                  {meeting.meeting_name || 'Untitled Meeting'}
                </div>
              </ClickableCell>
              
              <ClickableCell>
                <div className="cell-content">
                  <IconWrapper><FiUsers /></IconWrapper>
                  <TagContainer>
                    {renderAttendees(meeting)}
                  </TagContainer>
                </div>
              </ClickableCell>
              
              <ClickableCell>
                <div className="cell-content">
                  <TagContainer>
                    {renderTags(meeting)}
                  </TagContainer>
                </div>
              </ClickableCell>
              
              <ClickableCell>
                <div className="cell-content">
                  <IconWrapper><FiFileText /></IconWrapper>
                  {renderRecord(meeting.meeting_record)}
                </div>
              </ClickableCell>
              
              <ScoreCell>
                {renderStars(meeting.meeting_score || 0)}
              </ScoreCell>
              
              <ClickableCell onClick={(e) => handleNoteClick(e, meeting)}>
                <div className="cell-content">
                  <IconWrapper><FiMessageSquare /></IconWrapper>
                  <div 
                    style={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      color: meeting.meeting_note ? '#000' : '#9ca3af',
                      fontStyle: meeting.meeting_note ? 'normal' : 'italic',
                      cursor: 'pointer'
                    }}
                    title={meeting.meeting_note || 'No notes'}
                  >
                    {truncateNote(meeting.meeting_note)}
                  </div>
                </div>
              </ClickableCell>
            </tr>
          ))}
        </TableBody>
      </PlannerTable>
    );
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderContent>
          <HeaderTitle>
            <Title>
              <FiCalendar />
              Planner
              {!isLoading && <MeetingCount>({totalCount})</MeetingCount>}
            </Title>
            <Description>
              Schedule and manage your meetings and follow-ups.
            </Description>
          </HeaderTitle>
          <ActionButton onClick={() => handleAddMeeting()}>
            <FiPlus size={16} />
            New Event
          </ActionButton>
        </HeaderContent>
      </PageHeader>
      
      {/* Month navigation */}
      <NavigationContainer>
        <MonthNavigation>
          <NavButton onClick={goToPreviousMonth}>
            <FiChevronLeft />
          </NavButton>
          <MonthDisplay>
            {format(currentMonth, 'MMMM yyyy')}
          </MonthDisplay>
          <NavButton onClick={goToNextMonth}>
            <FiChevronRight />
          </NavButton>
          <NavButton 
            onClick={goToCurrentMonth}
            style={{ 
              marginLeft: '8px',
              fontSize: '0.75rem',
              width: 'auto',
              height: 'auto',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: isSameMonth(currentMonth, new Date()) ? '#f3f4f6' : '#e0f2fe',
              color: isSameMonth(currentMonth, new Date()) ? '#6b7280' : '#0284c7'
            }}
          >
            Today
          </NavButton>
        </MonthNavigation>
        <WeekSummary>
          {weeksInView.filter(week => week.isInCurrentMonth && week.meetings.length > 0).length} weeks with meetings
        </WeekSummary>
      </NavigationContainer>
      
      <ContentSection>
        {isLoading ? (
          <NoMeetingsMessage>Loading meetings...</NoMeetingsMessage>
        ) : error ? (
          <NoMeetingsMessage style={{ color: '#ef4444' }}>{error}</NoMeetingsMessage>
        ) : weeksInView.length === 0 ? (
          <NoMeetingsMessage>No weeks found for this month</NoMeetingsMessage>
        ) : (
          // Render all weeks that are in the current month, newest first
          weeksInView
            .filter(week => week.isInCurrentMonth) // Show all weeks in current month
            .sort((a, b) => b.weekNumber - a.weekNumber) // Sort weeks newest first
            .map((week, index) => (
              <WeekSection key={`week-${week.weekNumber}`}>
                <WeekHeader>
                  <WeekTitle>
                    Week #{week.weekNumber}
                    <AddEventButton onClick={() => handleAddMeetingForWeek(week)}>
                      <FiPlus size={12} />
                      Add Event
                    </AddEventButton>
                  </WeekTitle>
                  <WeekDateRange>{formatDateRange(week.start, week.end)}</WeekDateRange>
                </WeekHeader>
                {renderWeekTable(week.meetings)}
              </WeekSection>
            ))
        )}
        
        {/* Add the PlannerModal */}
        <PlannerModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          meeting={selectedMeeting}
        />
      </ContentSection>
    </PageContainer>
  );
};

export default Planner; 
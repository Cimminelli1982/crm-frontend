import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiCalendar, FiClock, FiUsers, FiTag, FiFileText, FiStar, FiMessageSquare, FiExternalLink, FiPlus, FiX, FiCheck, FiSearch } from 'react-icons/fi';

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
  padding: 0;
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
  const [tagEditing, setTagEditing] = useState(null); // Format: {meetingId, type: 'tags'|'attendees'}
  const [availableTags, setAvailableTags] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'tags' or 'attendees'
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch meetings data
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('meetings')
          .select('*'); // Select all fields to ensure we get everything
        
        if (meetingsError) throw meetingsError;
        
        console.log('Meetings data fetched:', meetingsData?.length || 0, 'records');
        
        if (!meetingsData || meetingsData.length === 0) {
          setMeetings([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }

        // Fetch relationships between meetings and contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('meetings_contacts')
          .select('*');
        
        if (contactsError) {
          console.error('Error fetching meetings_contacts:', contactsError);
          // Continue with processing even if we can't get contacts
        }

        // Fetch contact names
        const { data: contactNamesData, error: contactNamesError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name');
        
        if (contactNamesError) {
          console.error('Error fetching contacts:', contactNamesError);
          // Continue with processing even if we can't get contact names
        }

        // Process meetings with contacts information when available
        const meetingsWithContacts = meetingsData.map(meeting => {
          let relatedContacts = [];
          
          // Only process contact relationships if we have both contacts data
          if (contactsData && contactNamesData) {
            relatedContacts = contactsData
              .filter(contact => contact.meeting_id === meeting.id)
              .map(contact => {
                const contactName = contactNamesData.find(cn => cn.id === contact.contact_id);
                return contactName ? `${contactName.first_name} ${contactName.last_name}` : 'Unknown';
              });
          }
          
          return { 
            ...meeting, 
            meeting_contacts: relatedContacts,
            // Ensure these fields exist with default values if they're missing
            meeting_name: meeting.meeting_name || 'Untitled Meeting',
            meeting_date: meeting.meeting_date || new Date().toISOString(),
            meeting_score: meeting.meeting_score || 0,
            meeting_tags: meeting.meeting_tags || [],
            meeting_note: meeting.meeting_note || '',
            meeting_record: meeting.meeting_record || ''
          };
        });

        // Sort meetings by date, newest first
        const sortedMeetings = meetingsWithContacts.sort((a, b) => {
          // Handle invalid dates by putting them at the end
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
      // Find the meeting to update
      const meetingToUpdate = meetings.find(m => m.id === meetingId);
      if (!meetingToUpdate) return;
      
      // Remove the tag
      const updatedTags = meetingToUpdate.meeting_tags.filter(tag => tag !== tagToRemove);
      
      // Update in Supabase
      const { error } = await supabase
        .from('meetings')
        .update({ meeting_tags: updatedTags })
        .eq('id', meetingId);
      
      if (error) throw error;
      
      // Update local state
      setMeetings(meetings.map(meeting => 
        meeting.id === meetingId 
          ? { ...meeting, meeting_tags: updatedTags } 
          : meeting
      ));
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
    setActiveMeeting(meeting);
    setSelectedItems(existingTags);
    setModalType('tags');
    setModalOpen(true);
  };
  
  // Open modal for adding attendees
  const openAttendeesModal = (meeting) => {
    const existingAttendees = meeting.meeting_contacts || [];
    setActiveMeeting(meeting);
    setSelectedItems(existingAttendees);
    setModalType('attendees');
    setModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setActiveMeeting(null);
    setSelectedItems([]);
    setSearchTerm('');
    setModalType(null);
  };
  
  // Toggle selection of an item (tag or attendee)
  const toggleItemSelection = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };
  
  // Save selected items
  const saveSelectedItems = async () => {
    if (!activeMeeting) return;
    
    try {
      if (modalType === 'tags') {
        // Update tags in database
        const { error } = await supabase
          .from('meetings')
          .update({ meeting_tags: selectedItems })
          .eq('id', activeMeeting.id);
        
        if (error) throw error;
        
        // Update local state
        setMeetings(meetings.map(meeting => 
          meeting.id === activeMeeting.id 
            ? { ...meeting, meeting_tags: selectedItems } 
            : meeting
        ));
      } else if (modalType === 'attendees') {
        // In a real implementation, this would update the junction table
        // For this demo, we'll just update the local state
        setMeetings(meetings.map(meeting => 
          meeting.id === activeMeeting.id 
            ? { ...meeting, meeting_contacts: selectedItems } 
            : meeting
        ));
      }
      
      closeModal();
    } catch (error) {
      console.error(`Error saving ${modalType}:`, error);
    }
  };
  
  // Filter items based on search term
  const getFilteredItems = () => {
    const items = modalType === 'tags' 
      ? availableTags
      : availableContacts.map(c => c.name);
    
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Render the modal content
  const renderModalContent = () => {
    const filteredItems = getFilteredItems();
    const title = modalType === 'tags' ? 'Select Tags' : 'Select Attendees';
    
    return (
      <ModalOverlay onClick={closeModal}>
        <ModalContainer onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <h3>{title}</h3>
            <SecondaryButton onClick={closeModal}>
              <FiX />
            </SecondaryButton>
          </ModalHeader>
          <ModalBody>
            <SearchInput>
              <FiSearch />
              <input 
                type="text"
                placeholder={`Search ${modalType}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </SearchInput>
            
            <ItemsList>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <ItemOption 
                    key={index}
                    className={selectedItems.includes(item) ? 'selected' : ''}
                    onClick={() => toggleItemSelection(item)}
                  >
                    <div className={`checkbox ${selectedItems.includes(item) ? 'checked' : ''}`}>
                      {selectedItems.includes(item) && <FiCheck size={14} />}
                    </div>
                    <div className="item-label">{item}</div>
                  </ItemOption>
                ))
              ) : (
                <NoItemsMessage>
                  No {modalType} found matching your search
                </NoItemsMessage>
              )}
            </ItemsList>
          </ModalBody>
          <ModalFooter>
            <SecondaryButton onClick={closeModal}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={saveSelectedItems}>
              Save
            </PrimaryButton>
          </ModalFooter>
        </ModalContainer>
      </ModalOverlay>
    );
  };
  
  // Render tags
  const renderTags = (meeting) => {
    const MAX_VISIBLE_TAGS = 2;
    
    if (!meeting.meeting_tags || meeting.meeting_tags.length === 0) {
      return (
        <AddTagButton onClick={() => openTagsModal(meeting)}>
          <FiPlus size={12} style={{ marginRight: '4px' }} /> Add
        </AddTagButton>
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
        
        <AddTagButton onClick={() => openTagsModal(meeting)}>
          <FiPlus size={12} style={{ marginRight: '4px' }} /> Add
        </AddTagButton>
      </>
    );
  };
  
  // Render attendees
  const renderAttendees = (meeting) => {
    const MAX_VISIBLE_ATTENDEES = 1;
    
    if (!meeting.meeting_contacts || meeting.meeting_contacts.length === 0) {
      return (
        <AddTagButton onClick={() => openAttendeesModal(meeting)}>
          <FiPlus size={12} style={{ marginRight: '4px' }} /> Add
        </AddTagButton>
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
        
        <AddTagButton onClick={() => openAttendeesModal(meeting)}>
          <FiPlus size={12} style={{ marginRight: '4px' }} /> Add
        </AddTagButton>
      </>
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
        </HeaderContent>
      </PageHeader>
      
      <ContentSection>
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
            {isLoading ? (
              <NoDataRow>
                <td colSpan="7">Loading meetings...</td>
              </NoDataRow>
            ) : error ? (
              <NoDataRow>
                <td colSpan="7" style={{ color: '#ef4444' }}>{error}</td>
              </NoDataRow>
            ) : meetings.length === 0 ? (
              <NoDataRow>
                <td colSpan="7">No meetings found in database</td>
              </NoDataRow>
            ) : (
              meetings.map((meeting, index) => (
                <tr key={meeting.id || index}>
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
                  
                  <ClickableCell>
                    <div className="cell-content">
                      <IconWrapper><FiMessageSquare /></IconWrapper>
                      {meeting.meeting_note || 'No notes'}
                    </div>
                  </ClickableCell>
                </tr>
              ))
            )}
          </TableBody>
        </PlannerTable>
        
        {/* Add the modal */}
        {modalOpen && renderModalContent()}
      </ContentSection>
    </PageContainer>
  );
};

export default Planner; 
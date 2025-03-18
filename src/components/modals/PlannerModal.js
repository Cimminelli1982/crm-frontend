import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { 
  FiX, FiSave, FiClock, FiUsers, FiTag, 
  FiFileText, FiMessageSquare, FiEdit, FiTrash2,
  FiPlus, FiLink, FiStar
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import TagsModal from './TagsModal';
import AttendeesModal from './AttendeesModal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Styled Components
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
    
    .meeting-title {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
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
`;

const FormContent = styled.div`
  width: 90%;
  margin: 0 auto;
  padding: 16px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  color: #111827;
  margin: 32px 0 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  
  &.full-width {
    grid-column: span 2;
  }
`;

const Label = styled.label`
  display: block;
  margin: 16px 0 8px 0;
  font-size: 16px;
  color: #4b5563;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  height: 38px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: 0;
    border-color: #2196F3;
    border-width: 2px;
  }

  &.error {
    border-color: #E53935;
    border-width: 2px;
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

const Select = styled.select`
  width: 100%;
  height: 38px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  background-size: 8px auto;
  padding-right: 24px;
  
  &:focus {
    outline: 0;
    border-color: #2196F3;
    border-width: 2px;
  }
  
  &.error {
    border-color: #E53935;
    border-width: 2px;
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

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

    &:hover {
      opacity: 1;
    }
  }
`;

const StarRating = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  
  button {
    background: none;
    border: none;
    padding: 0;
    margin-right: 4px;
    cursor: pointer;
    color: ${props => props.active ? '#f59e0b' : '#d1d5db'};
    transition: color 0.2s;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #f59e0b;
    }
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 16px;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e5e7eb;
  }
`;

const PlannerModal = ({ isOpen, onRequestClose, meeting }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    meeting_name: '',
    meeting_date: '',
    meeting_note: '',
    meeting_record: '',
    meeting_score: 0,
    meeting_category: ''
  });
  
  const [meetingTags, setMeetingTags] = useState([]);
  const [meetingAttendees, setMeetingAttendees] = useState([]);
  const [relatedMeetingsByAttendees, setRelatedMeetingsByAttendees] = useState([]);
  const [relatedMeetingsByTags, setRelatedMeetingsByTags] = useState([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Cancel delete confirmation when user clicks outside modal or presses ESC
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (meeting) {
      console.log('Initializing form with meeting:', meeting);
      try {
        const meetingDate = meeting.meeting_date ? new Date(meeting.meeting_date) : new Date();
        const formattedDate = meetingDate.toISOString().slice(0, 10); // Get only the date part YYYY-MM-DD
        console.log('Formatted meeting date:', formattedDate);
        
        // Check if we should set a specific tab active
        if (meeting.initialTab) {
          setActiveTab(meeting.initialTab);
        }
        
        setFormData({
          meeting_name: meeting.meeting_name || '',
          meeting_date: formattedDate,
          meeting_note: meeting.meeting_note || '',
          meeting_record: meeting.meeting_record || '',
          meeting_score: meeting.meeting_score || 0,
          meeting_category: meeting.meeting_category || meeting.meeting_rationelle || ''
        });
        
        // Fetch tags and attendees
        fetchMeetingTags();
        fetchMeetingAttendees();
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Error initializing form data');
      }
    }
  }, [meeting]);
  
  // Fetch related meetings when the attendees or tags change
  useEffect(() => {
    if (activeTab === 'related' && meeting && meeting.id) {
      fetchRelatedMeetingsByAttendees();
      fetchRelatedMeetingsByTags();
    }
  }, [activeTab, meetingAttendees, meetingTags, meeting]);
  
  // Function to fetch meetings related by attendees
  const fetchRelatedMeetingsByAttendees = async () => {
    if (!meeting || !meeting.id || meetingAttendees.length === 0) {
      setRelatedMeetingsByAttendees([]);
      return;
    }
    
    try {
      // Get attendee IDs, excluding Simone Cimminelli
      const attendeeIds = meetingAttendees
        .filter(attendee => !attendee.name.toLowerCase().includes('simone cimminelli'))
        .map(attendee => attendee.id);
      
      if (attendeeIds.length === 0) {
        setRelatedMeetingsByAttendees([]);
        return;
      }
      
      // Find meetings that share attendees with the current meeting
      const { data, error } = await supabase
        .from('meetings_contacts')
        .select(`
          meeting_id,
          contact_id,
          contacts:contact_id(first_name, last_name),
          meetings:meeting_id(
            id, 
            meeting_name, 
            meeting_date
          )
        `)
        .in('contact_id', attendeeIds)
        .neq('meeting_id', meeting.id); // Exclude current meeting
        
      if (error) throw error;
      
      // Filter out Simone Cimminelli's contact records
      const filteredData = data.filter(item => {
        const fullName = `${item.contacts.first_name} ${item.contacts.last_name}`.toLowerCase();
        return !fullName.includes('simone cimminelli');
      });
      
      // Group by meeting and count occurrences (how many common attendees)
      const meetingMap = {};
      filteredData.forEach(item => {
        const meetingId = item.meeting_id;
        const meetingInfo = item.meetings;
        
        if (!meetingMap[meetingId]) {
          meetingMap[meetingId] = {
            id: meetingId,
            name: meetingInfo.meeting_name,
            date: meetingInfo.meeting_date,
            commonAttendees: 1
          };
        } else {
          meetingMap[meetingId].commonAttendees++;
        }
      });
      
      // Convert to array and sort by commonAttendees (descending)
      const relatedMeetings = Object.values(meetingMap)
        .sort((a, b) => b.commonAttendees - a.commonAttendees);
      
      setRelatedMeetingsByAttendees(relatedMeetings);
    } catch (error) {
      console.error('Error fetching related meetings by attendees:', error);
    }
  };
  
  // Function to fetch meetings related by tags
  const fetchRelatedMeetingsByTags = async () => {
    if (!meeting || !meeting.id || meetingTags.length === 0) {
      setRelatedMeetingsByTags([]);
      return;
    }
    
    try {
      console.log('Fetching related meetings by tags for meeting ID:', meeting.id);
      console.log('Current meeting tags:', meetingTags);
      
      // Get tag IDs from the current meeting's tags
      const tagIds = meetingTags.map(tag => tag.tag_id);
      console.log('Tag IDs for related meetings search:', tagIds);
      
      if (tagIds.length === 0) {
        console.log('No tag IDs found, skipping related meetings query');
        setRelatedMeetingsByTags([]);
        return;
      }
      
      // Find meetings that share tags with the current meeting
      const { data, error } = await supabase
        .from('meetings_tags')
        .select(`
          meeting_id,
          meetings:meeting_id(
            id, 
            meeting_name, 
            meeting_date
          )
        `)
        .in('tag_id', tagIds)
        .neq('meeting_id', meeting.id); // Exclude current meeting
        
      if (error) throw error;
      
      console.log('Found related meetings:', data);
      
      // Group by meeting and count occurrences (how many common tags)
      const meetingMap = {};
      data.forEach(item => {
        const meetingId = item.meeting_id;
        const meetingInfo = item.meetings;
        
        if (!meetingMap[meetingId]) {
          meetingMap[meetingId] = {
            id: meetingId,
            name: meetingInfo.meeting_name,
            date: meetingInfo.meeting_date,
            commonTags: 1
          };
        } else {
          meetingMap[meetingId].commonTags++;
        }
      });
      
      // Convert to array and sort by commonTags (descending)
      const relatedMeetings = Object.values(meetingMap)
        .sort((a, b) => b.commonTags - a.commonTags);
      
      setRelatedMeetingsByTags(relatedMeetings);
    } catch (error) {
      console.error('Error fetching related meetings by tags:', error);
    }
  };
  
  const fetchMeetingTags = async () => {
    if (!meeting) return;
    
    try {
      console.log('Fetching tags for meeting ID:', meeting.id);
      
      // Join meetings_tags with tags to get tag names in one query
      const { data, error } = await supabase
        .from('meetings_tags')
        .select(`
          meeting_id,
          tag_id,
          tags:tag_id (id, name)
        `)
        .eq('meeting_id', meeting.id);
        
      if (error) throw error;
      
      console.log('Meeting tags raw data:', data);
      
      if (data && data.length > 0) {
        // Format the data for display
        const formattedTags = data.map(item => {
          return {
            id: `${item.meeting_id}-${item.tag_id}`, // Create a unique ID for UI purposes
            tag_id: item.tag_id,                     // Store this for reference
            name: item.tags?.name || 'Unknown tag'
          };
        });
        
        console.log('Formatted tags:', formattedTags);
        setMeetingTags(formattedTags);
      } else {
        setMeetingTags([]);
      }
    } catch (error) {
      console.error('Error fetching meeting tags:', error);
      toast.error('Failed to load meeting tags');
    }
  };
  
  const fetchMeetingAttendees = async () => {
    if (!meeting) return;
    
    try {
      const { data, error } = await supabase
        .from('meetings_contacts')
        .select(`
          contact_id,
          contacts:contact_id(id, first_name, last_name)
        `)
        .eq('meeting_id', meeting.id);
        
      if (error) throw error;
      
      const formattedAttendees = data.map(item => ({
        id: item.contact_id,
        name: `${item.contacts.first_name} ${item.contacts.last_name}`
      }));
      
      setMeetingAttendees(formattedAttendees);
    } catch (error) {
      console.error('Error fetching meeting attendees:', error);
      toast.error('Failed to load attendees');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change event:', { name, value, type: e.target.type });
    
    // Special handling for date input
    if (name === 'meeting_date') {
      try {
        // Ensure the date is valid before updating state
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setFormData(prev => ({
            ...prev,
            [name]: value
          }));
        }
      } catch (error) {
        console.error('Error handling date input:', error);
      }
    } else {
      // For select inputs, log more detailed info
      if (name === 'meeting_category') {
        console.log('Updating meeting_category to:', value);
      }
      
      setFormData(prev => {
        const newState = {
          ...prev,
          [name]: value
        };
        console.log('Updated form data:', newState);
        return newState;
      });
    }
  };
  
  const handleRemoveTag = async (tagToRemove) => {
    try {
      console.log('Removing tag with name:', tagToRemove.name);
      
      // First we need to get the tag_id for this tag
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagToRemove.name)
        .single();
        
      if (tagError) {
        console.error('Error finding tag ID:', tagError);
        throw tagError;
      }
      
      if (!tagData) {
        console.error('Tag not found with name:', tagToRemove.name);
        throw new Error('Tag not found');
      }
      
      const tagId = tagData.id;
      console.log(`Found tag ID ${tagId} for tag name ${tagToRemove.name}`);
      
      // Now delete the connection using meeting_id and tag_id
      console.log(`Deleting tag connection from meetings_tags where meeting_id=${meeting.id} and tag_id=${tagId}`);
      
      const { error } = await supabase
        .from('meetings_tags')
        .delete()
        .eq('meeting_id', meeting.id)
        .eq('tag_id', tagId);
        
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      console.log('Successfully deleted from meetings_tags');
      
      // Update UI - need to filter by name since our local state uses different IDs
      setMeetingTags(prev => prev.filter(tag => tag.name !== tagToRemove.name));
      toast.success('Tag removed successfully');
      
      // Refresh related meetings
      await fetchRelatedMeetingsByTags();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error(`Failed to remove tag: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleAddAttendee = async (contactId) => {
    try {
      const { error } = await supabase
        .from('meetings_contacts')
        .insert({
          meeting_id: meeting.id,
          contact_id: contactId
        });
        
      if (error) throw error;
      
      await fetchMeetingAttendees();
      toast.success('Attendee added successfully');
    } catch (error) {
      console.error('Error adding attendee:', error);
      toast.error('Failed to add attendee');
    }
  };
  
  const handleRemoveAttendee = async (attendeeToRemove) => {
    try {
      const { error } = await supabase
        .from('meetings_contacts')
        .delete()
        .eq('meeting_id', meeting.id)
        .eq('contact_id', attendeeToRemove.id);
        
      if (error) throw error;
      
      setMeetingAttendees(prev => prev.filter(att => att.id !== attendeeToRemove.id));
      toast.success('Attendee removed successfully');
    } catch (error) {
      console.error('Error removing attendee:', error);
      toast.error('Failed to remove attendee');
    }
  };
  
  const handleSetScore = async (score) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ meeting_score: score })
        .eq('id', meeting.id);
        
      if (error) throw error;
      
      setFormData(prev => ({ ...prev, meeting_score: score }));
      toast.success('Score updated successfully');
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    }
  };
  
  const handleDeleteMeeting = async () => {
    if (!meeting || !meeting.id) {
      toast.error('Invalid meeting data');
      return;
    }

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      toast.custom(
        (t) => (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              background: '#f97316', // Orange warning color
              color: 'white',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span style={{ marginRight: '8px' }}>⚠️</span>
            <span>Click delete again to confirm deletion</span>
          </div>
        ),
        { duration: 5000 }
      );
      return;
    }

    try {
      console.log('Starting meeting deletion process for meeting ID:', meeting.id);
      
      // First, delete related records in junction tables to maintain referential integrity
      // Delete meetings_tags
      console.log('Deleting associated tags from meetings_tags...');
      const { data: tagsData, error: tagsError } = await supabase
        .from('meetings_tags')
        .delete()
        .eq('meeting_id', meeting.id)
        .select();
      
      if (tagsError) {
        console.error('Error deleting tags:', tagsError);
        throw tagsError;
      }
      
      console.log('Successfully deleted tags associations:', tagsData?.length || 0);

      // Delete meetings_contacts
      console.log('Deleting associated contacts from meetings_contacts...');
      const { data: contactsData, error: contactsError } = await supabase
        .from('meetings_contacts')
        .delete()
        .eq('meeting_id', meeting.id)
        .select();
      
      if (contactsError) {
        console.error('Error deleting contacts:', contactsError);
        throw contactsError;
      }
      
      console.log('Successfully deleted contacts associations:', contactsData?.length || 0);

      // Finally, delete the meeting record
      console.log('Deleting the meeting record...');
      
      // First check if the meeting still exists
      const { data: checkData, error: checkError } = await supabase
        .from('meetings')
        .select('id')
        .eq('id', meeting.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking meeting existence:', checkError);
        throw checkError;
      }
      
      if (!checkData) {
        console.warn('Meeting already deleted or does not exist');
        throw new Error('Meeting not found. It may have been already deleted.');
      }
      
      // Proceed with deletion
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meeting.id)
        .select();
      
      if (meetingError) {
        console.error('Error deleting meeting:', meetingError);
        throw meetingError;
      }
      
      console.log('Successfully deleted meeting:', meetingData);

      toast.success('Meeting deleted successfully');
      
      // Close the modal
      onRequestClose();
      
      // Force a refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error(`Failed to delete meeting: ${error.message}`);
      setShowDeleteConfirm(false);
    } finally {
      // Reset delete confirmation state
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('Starting save process...', { formData, meeting });
      console.log('Meeting ID:', meeting?.id);
      console.log('Meeting Category value:', formData.meeting_category);
      
      // Validate required fields
      if (!formData.meeting_name.trim()) {
        toast.error('Meeting name is required');
        return;
      }

      if (!formData.meeting_date) {
        toast.error('Meeting date is required');
        return;
      }

      if (!meeting || !meeting.id) {
        toast.error('Invalid meeting data');
        console.error('Meeting ID is missing or invalid', meeting);
        return;
      }

      // Format the date properly for the database - add time to make it a full ISO date
      const dateObj = new Date(formData.meeting_date);
      // Set the time to noon to avoid timezone issues
      dateObj.setHours(12, 0, 0, 0);
      const formattedDate = dateObj.toISOString();
      console.log('Formatted date:', formattedDate);

      const updateData = {
        meeting_name: formData.meeting_name.trim(),
        meeting_date: formattedDate,
        meeting_note: formData.meeting_note || '',
        meeting_record: formData.meeting_record || '',
        meeting_score: formData.meeting_score || 0,
        meeting_category: formData.meeting_category || '',
        updated_at: new Date().toISOString()
      };
      
      // Log complete update data to verify what's being sent
      console.log('Update data with meeting_category:', updateData);
      
      console.log('Updating meeting with data:', updateData);
      console.log('For meeting ID:', meeting.id);

      // Perform the update
      const { data, error } = await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', meeting.id)
        .select();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      toast.success('Meeting updated successfully');
      
      // Close the modal and notify the parent
      onRequestClose();
      
      // Force a refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating meeting:', error);
      toast.error(`Failed to update meeting: ${error.message}`);
    }
  };
  
  const renderDetailsTab = () => {
    return (
      <FormContent>
        <SectionTitle>Details</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="meeting_name">Meeting Name</Label>
            <Input
              id="meeting_name"
              name="meeting_name"
              value={formData.meeting_name}
              onChange={handleInputChange}
              placeholder="Enter meeting name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="meeting_date">Meeting Date</Label>
            <Input
              id="meeting_date"
              name="meeting_date"
              type="date"
              value={formData.meeting_date ? new Date(formData.meeting_date).toISOString().slice(0, 10) : ''}
              onChange={handleInputChange}
            />
          </FormGroup>
        </FormGrid>
        
        <SectionTitle>Attendees</SectionTitle>
        <TagsList style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {meetingAttendees.map((attendee) => (
            <Tag key={attendee.id} color="#e0f2fe" textColor="#0369a1">
              <span>{attendee.name}</span>
              <button onClick={() => handleRemoveAttendee(attendee)}>
                <FiX size={14} />
              </button>
            </Tag>
          ))}
          <AddButton onClick={() => setShowAttendeesModal(true)}>
            <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Attendees
          </AddButton>
        </TagsList>
        
        <SectionTitle>Tags</SectionTitle>
        <TagsList style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {meetingTags.map((tag) => (
            <Tag key={tag.id} color="#f3f4f6" textColor="#374151">
              <span>{tag.name}</span>
              <button onClick={() => handleRemoveTag(tag)}>
                <FiX size={14} />
              </button>
            </Tag>
          ))}
          <AddButton onClick={() => setShowTagsModal(true)}>
            <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Tags
          </AddButton>
        </TagsList>
      </FormContent>
    );
  };
  
  const renderNotesTab = () => {
    // Meeting category options
    const categoryOptions = [
      { value: '', label: 'Select a category' },
      { value: 'inbox', label: 'Inbox' },
      { value: 'karma_points', label: 'Karma Points' },
      { value: 'dealflow', label: 'Dealflow Related' },
      { value: 'portfolio', label: 'Portfolio Company Related' }
    ];
    
    return (
      <FormContent>
        <FormGroup className="full-width">
          <Label htmlFor="meeting_note">Notes</Label>
          <TextArea
            name="meeting_note"
            value={formData.meeting_note}
            onChange={handleInputChange}
            placeholder="Enter meeting notes..."
            style={{ minHeight: '250px' }}
          />
        </FormGroup>
        
        {/* Meeting Details with pixel-perfect layout */}
        <SectionTitle>Meeting Details</SectionTitle>
        <FormGrid>
          {/* First column */}
          <div>
            {/* Score section */}
            <FormGroup>
              <Label>Meeting Score</Label>
              <StarRating active={formData.meeting_score > 0}>
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => handleSetScore(score)}
                    type="button"
                  >
                    <FiStar
                      size={22}
                      style={{
                        fill: score <= formData.meeting_score ? '#f59e0b' : 'none'
                      }}
                    />
                  </button>
                ))}
              </StarRating>
            </FormGroup>
            
            {/* Record section with exactly 24px margin */}
            <FormGroup style={{ marginTop: '24px' }}>
              <Label htmlFor="meeting_record">Meeting Record</Label>
              <Input
                id="meeting_record"
                name="meeting_record"
                value={formData.meeting_record}
                onChange={handleInputChange}
                placeholder="Enter meeting record URL"
              />
            </FormGroup>
          </div>
          
          {/* Second column */}
          <FormGroup>
            <Label htmlFor="meeting_category">Meeting Category</Label>
            <Select
              id="meeting_category"
              name="meeting_category"
              value={formData.meeting_category}
              onChange={handleInputChange}
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormGroup>
        </FormGrid>
      </FormContent>
    );
  };
  
  const MeetingRow = styled.div`
    display: flex;
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #f9fafb;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .meeting-info {
      flex: 1;
      
      .meeting-name {
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
      }
      
      .meeting-date {
        font-size: 0.75rem;
        color: #6b7280;
      }
    }
    
    .meeting-meta {
      display: flex;
      align-items: center;
      color: #6b7280;
      font-size: 0.75rem;
      
      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  `;
  
  const NoRelatedItems = styled.div`
    padding: 24px;
    text-align: center;
    color: #6b7280;
    font-style: italic;
  `;
  
  const RelatedList = styled.div`
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 32px;
    max-height: 300px;
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.7);
      border-radius: 4px;
      border: 2px solid #f1f1f1;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.9);
    }
  `;
  
  const renderRelatedTab = () => {
    const handleMeetingClick = (meetingId) => {
      // Navigate to the meeting
      window.location.href = `/meetings/${meetingId}`;
    };
    
    return (
      <FormContent>
        <SectionTitle>Related Meetings by Attendees</SectionTitle>
        <RelatedList>
          {relatedMeetingsByAttendees.length === 0 ? (
            <NoRelatedItems>No related meetings found by attendees</NoRelatedItems>
          ) : (
            relatedMeetingsByAttendees.map(meeting => (
              <MeetingRow 
                key={meeting.id} 
                onClick={() => handleMeetingClick(meeting.id)}
              >
                <div className="meeting-info">
                  <div className="meeting-name">{meeting.name}</div>
                  <div className="meeting-date">{format(new Date(meeting.date), 'dd/MM/yyyy')}</div>
                </div>
                <div className="meeting-meta">
                  <span>
                    <FiUsers size={14} />
                    {meeting.commonAttendees} common {meeting.commonAttendees === 1 ? 'attendee' : 'attendees'}
                  </span>
                </div>
              </MeetingRow>
            ))
          )}
        </RelatedList>
        
        <SectionTitle>Related Meetings by Tags</SectionTitle>
        <RelatedList>
          {relatedMeetingsByTags.length === 0 ? (
            <NoRelatedItems>No related meetings found by tags</NoRelatedItems>
          ) : (
            relatedMeetingsByTags.map(meeting => (
              <MeetingRow 
                key={meeting.id} 
                onClick={() => handleMeetingClick(meeting.id)}
              >
                <div className="meeting-info">
                  <div className="meeting-name">{meeting.name}</div>
                  <div className="meeting-date">{format(new Date(meeting.date), 'dd/MM/yyyy')}</div>
                </div>
                <div className="meeting-meta">
                  <span>
                    <FiTag size={14} />
                    {meeting.commonTags} common {meeting.commonTags === 1 ? 'tag' : 'tags'}
                  </span>
                </div>
              </MeetingRow>
            ))
          )}
        </RelatedList>
      </FormContent>
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
              <div className="meeting-title">
                <h2>{meeting?.meeting_name || 'New Meeting'}</h2>
              </div>
              <div className="dates">
                <span>Created: {format(new Date(meeting?.created_at || new Date()), 'dd/MM/yyyy HH:mm')}</span>
                <span>Last Modified: {format(new Date(meeting?.updated_at || new Date()), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
            <CloseButton onClick={onRequestClose}>
              <FiX size={20} />
            </CloseButton>
          </ModalHeader>
          
          <TabsContainer>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <div>
                <TabButton
                  active={activeTab === 'details'}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </TabButton>
                <TabButton
                  active={activeTab === 'notes'}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes
                </TabButton>
                <TabButton
                  active={activeTab === 'related'}
                  onClick={() => setActiveTab('related')}
                >
                  Related
                </TabButton>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                <Button 
                  onClick={handleDeleteMeeting}
                  style={{ 
                    backgroundColor: showDeleteConfirm ? '#b91c1c' : '#ef4444', 
                    color: 'white', 
                    border: 'none',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: showDeleteConfirm ? '0 0 0 2px rgba(239, 68, 68, 0.5)' : 'none'
                  }}
                >
                  <FiTrash2 size={14} />
                  {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                </Button>
              </div>
            </div>
          </TabsContainer>
          
          <ContentSection>
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'notes' && renderNotesTab()}
            {activeTab === 'related' && renderRelatedTab()}
          </ContentSection>
          
          <ButtonContainer>
            <CancelButton onClick={onRequestClose}>
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSave}>
              <FiSave size={16} />
              Save Changes
            </SaveButton>
          </ButtonContainer>
        </ModalContainer>
      </Modal>
      
      {showTagsModal && (
        <TagsModal
          isOpen={showTagsModal}
          onRequestClose={() => {
            setShowTagsModal(false);
            fetchMeetingTags();
          }}
          meeting={meeting}
        />
      )}
      
      {showAttendeesModal && (
        <AttendeesModal
          isOpen={showAttendeesModal}
          onRequestClose={() => {
            setShowAttendeesModal(false);
            fetchMeetingAttendees();
          }}
          meeting={meeting}
          onAddAttendee={handleAddAttendee}
        />
      )}
    </>
  );
};

export default PlannerModal; 
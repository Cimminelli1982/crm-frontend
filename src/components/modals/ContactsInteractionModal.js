import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { 
  FiX, 
  FiMessageSquare, 
  FiMail, 
  FiUsers,
  FiCalendar,
  FiAlertTriangle,
  FiClock,
  FiArrowRight,
  FiArrowLeft
} from 'react-icons/fi';
import { RiWhatsappFill } from 'react-icons/ri';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import { format } from 'date-fns';

// ==================== Styled Components ====================
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #00ff00;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ffffff;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #ff5555;
    }
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 10px;
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Card = styled.div`
  background-color: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// Interactions Layout
const InteractionsLayout = styled.div`
  display: flex;
  height: 575px;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
  background-color: #1a1a1a;
`;

const ChannelsMenu = styled.div`
  flex: 0 0 180px;
  border-right: 1px solid #333;
  background-color: #111;
  overflow-y: auto;
`;

const ChannelItem = styled.div`
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #222;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.active ? '#222' : 'transparent'};
  
  .channel-name {
    font-weight: ${props => props.active ? 'bold' : 'normal'};
    color: ${props => {
      if (!props.active) return '#aaa';
      switch(props.channel) {
        case 'Email': return '#4a9eff';
        case 'Meeting': return '#ff9900';
        case 'Phone': return '#00ff00';
        case 'Slack': return '#9000ff';
        case 'WhatsApp': return '#25d366';
        default: return '#ccc';
      }
    }};
  }
  
  .channel-count {
    background-color: ${props => props.active ? '#333' : '#222'};
    color: ${props => props.active ? '#fff' : '#888'};
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    margin-left: auto;
  }
  
  &:hover {
    background-color: #1e1e1e;
  }
`;

const InteractionsContainer = styled.div`
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background-color: #181818;
`;

const InteractionItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InteractionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
  
  .interaction-direction {
    font-size: 0.75rem;
    background-color: ${props => props.direction === 'Outbound' ? '#2d562d' : '#333'};
    color: ${props => props.direction === 'Outbound' ? '#8aff8a' : '#ccc'};
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .interaction-date {
    color: #888;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    
    .date {
      color: #999;
    }
    
    .time {
      color: #777;
      font-size: 0.7rem;
    }
  }
`;

const InteractionContent = styled.div`
  color: #ddd;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #aaa;
  font-style: italic;
`;

const NoDataMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #aaa;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 15px;
  color: #ff6b6b;
`;

// WhatsApp specific components
const WhatsAppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0b1a1a; /* Dark WhatsApp background */
  position: relative;
  border-radius: 4px;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  background-color: #075e54; /* WhatsApp green */
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #054d44;
`;

const ChatAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #25d366;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ChatName = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 2px;
`;

const ChatStatus = styled.div`
  font-size: 0.75rem;
  color: #888;
`;

const MessagesList = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #0b1a1a; /* Dark WhatsApp background */
`;

// Simple container div without styled-components
const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 255px);
  background-color: #0b1a1a;
  width: 100%;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;
  line-height: 1.4;
  font-size: 0.95rem;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
  align-self: ${props => props.$direction === 'outbound' ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.$direction === 'outbound' ? '#055e54' : '#202c33'};
  color: ${props => props.$direction === 'outbound' ? '#e9e9e9' : '#e9e9e9'};
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    ${props => props.$direction === 'outbound' ? 'right: -8px;' : 'left: -8px;'}
    width: 0;
    height: 0;
    border-top: 8px solid ${props => props.$direction === 'outbound' ? '#055e54' : '#202c33'};
    border-right: ${props => props.$direction === 'outbound' ? '8px solid transparent' : 'none'};
    border-left: ${props => props.$direction !== 'outbound' ? '8px solid transparent' : 'none'};
  }
  
  .message-time {
    font-size: 0.65rem;
    color: ${props => props.$direction === 'outbound' ? 'rgba(255, 255, 255, 0.7)' : '#999'};
    text-align: right;
    margin-top: 4px;
  }
`;

// Email Thread UI Components
const EmailThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
`;

const EmailHeader = styled.div`
  background-color: #2a2a2a;
  color: white;
  padding: 16px;
  border-bottom: 1px solid #444;
`;

const EmailSubject = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #e0e0e0;
`;

const EmailCount = styled.div`
  font-size: 0.8rem;
  color: #aaa;
`;

const EmailList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
`;

const EmailItem = styled.div`
  border-bottom: 1px solid #333;
  padding: 6px 64px 16px 0px;
  background-color: #1a1a1a;
  transition: background-color 0.2s;

  &:hover {
    background-color: #222;
  }
  
  ${props => props.$expanded && `
    background-color: #222;
  `}
`;

const EmailHeader2 = styled.div`
  padding: 16px;
  cursor: pointer;
`;

const EmailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const EmailSender = styled.div`
  font-weight: bold;
  color: #e0e0e0;
`;

const EmailDate = styled.div`
  color: #999;
  font-size: 0.8rem;
`;

const EmailPreview = styled.div`
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
`;

const EmailBody = styled.div`
  padding: 0 0 16px 16px;
  color: #e0e0e0;
  font-size: 0.9rem;
  line-height: 1.5;
  
  p {
    margin-bottom: 8px;
  }
  
  a {
    color: #4a9eff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const EmailAttachments = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #252525;
  border-radius: 4px;
  margin-top: 8px;
  
  svg {
    margin-right: 8px;
    color: #999;
  }
`;

// Keep backward compatibility
const EmailContainer = EmailThreadContainer;
const EmailContent = EmailList;

// Meeting specific components
const MeetingContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const MeetingHeader = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid #272727;
  background-color: #171717;
`;

const MeetingTitle = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 8px;
  font-size: 16px;
`;

const MeetingTime = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #ff9900;
  margin-bottom: 10px;
`;

const MeetingAttendees = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`;

const MeetingAttendee = styled.div`
  background-color: #333;
  color: #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const MeetingDetails = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
`;

const MeetingNotes = styled.div`
  color: #ddd;
  white-space: pre-wrap;
  line-height: 1.6;
`;

// Main component
const ContactsInteractionModal = ({ 
  isOpen, 
  onRequestClose, 
  contact, 
  showWhatsApp = true, 
  showEmail = true, 
  showMeetings = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  
  // State for different interaction types
  const [whatsappChats, setWhatsappChats] = useState([]);
  const [emailThreads, setEmailThreads] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  // Selected items
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // State for email threads
  const [selectedEmailThread, setSelectedEmailThread] = useState(null);
  const [emailMessages, setEmailMessages] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState({});
  
  // State for meetings
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  
  useEffect(() => {
    if (isOpen && contact) {
      loadInteractions();
    } else {
      // Reset selections when modal closes
      resetSelections();
    }
  }, [isOpen, contact]);
  
  const resetSelections = () => {
    setSelectedChat(null);
    setSelectedEmailThread(null);
    setSelectedMeeting(null);
    setChatMessages([]);
    setEmailMessages([]);
    setMeetingDetails(null);
  };
  
  // Load all interactions when the modal opens
  const loadInteractions = async () => {
    if (!contact || !contact.contact_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load WhatsApp chats, email threads, and meetings in parallel
      await Promise.all([
        loadWhatsappChats(contact.contact_id),
        loadEmailThreads(contact.contact_id),
        loadMeetings(contact.contact_id)
      ]);
    } catch (err) {
      console.error('Error loading interactions:', err);
      setError('Failed to load interaction data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load WhatsApp chats for a contact based on interactions
  const loadWhatsappChats = async (contactId) => {
    try {
      console.log('Loading WhatsApp chats for contact ID:', contactId);
      
      // 1. First get interactions with type 'whatsapp' for this contact
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          chat_id,
          interaction_date
        `)
        .eq('contact_id', contactId)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: false });
      
      if (interactionError) {
        console.error('Error loading WhatsApp interactions:', interactionError);
        return;
      }
      
      console.log('Found WhatsApp interactions:', interactionData);
      
      if (!interactionData || interactionData.length === 0) {
        return; // No WhatsApp interactions found
      }
      
      // Extract unique chat_ids from the interactions
      const chatIds = [...new Set(interactionData.map(item => item.chat_id))].filter(Boolean);
      
      if (chatIds.length === 0) {
        return; // No valid chat IDs found
      }
      
      // 2. Get chat details for each unique chat_id
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          chat_name,
          is_group_chat,
          external_chat_id
        `)
        .in('id', chatIds);
      
      if (chatError) {
        console.error('Error loading chats:', chatError);
        return;
      }
      
      console.log('Found chats:', chatData);
      
      if (chatData && chatData.length > 0) {
        // Format the chats data
        const formattedChats = chatData.map(chat => ({
          chat_id: chat.id,
          chat_name: chat.chat_name || 'Unnamed Chat',
          is_group_chat: chat.is_group_chat || false,
          external_chat_id: chat.external_chat_id,
          unread_count: 0
        }));
        
        console.log('Setting WhatsApp chats:', formattedChats);
        setWhatsappChats(formattedChats);
        
        // Set default active section if there are any chats
        if (formattedChats.length > 0 && !activeSection && showWhatsApp) {
          setActiveSection('whatsapp');
          setSelectedChat(formattedChats[0].chat_id);
          loadChatMessages(formattedChats[0].chat_id);
        }
      }
    } catch (err) {
      console.error('Error loading WhatsApp chats:', err);
    }
  };

  // Get email threads using the contact_email_threads table
  const loadEmailThreads = async (contactId) => {
    try {
      console.log('Loading email threads for contact ID:', contactId);
      
      // Query the contact_email_threads table directly to get all email threads for this contact
      const { data, error } = await supabase
        .from('contact_email_threads')
        .select(`
          email_thread_id,
          email_threads:email_thread_id (
            email_thread_id, 
            subject,
            thread_id,
            last_message_timestamp,
            updated_at
          )
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading email threads:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No email threads found for contact ID:', contactId);
        setEmailThreads([]);
        return;
      }
      
      console.log('Found email threads:', data);
      
      // Format the threads - no need for deduplication since contact_email_threads has unique constraints
      const formattedThreads = data
        .filter(item => item.email_threads) // Filter out any null references
        .map(item => ({
          thread_id: item.email_thread_id,
          title: item.email_threads.subject || 'No Subject',
          date: item.email_threads.last_message_timestamp,
          updated_at: item.email_threads.updated_at,
          gmail_thread_id: item.email_threads.thread_id // Include this for email fetching
        }))
        // Sort by date (newest first)
        .sort((a, b) => new Date(b.date || b.updated_at) - new Date(a.date || a.updated_at));
      
      console.log('Setting email threads:', formattedThreads);
      setEmailThreads(formattedThreads);
      
      // Set default active section if there are any email threads and no chats
      if (formattedThreads.length > 0 && !activeSection && showEmail && (!showWhatsApp || whatsappChats.length === 0)) {
        setActiveSection('email');
        setSelectedEmailThread(formattedThreads[0].thread_id);
        loadEmailMessages(formattedThreads[0].thread_id);
      }
      
      // Try alternate method if no threads found with primary method
      if (formattedThreads.length === 0) {
        await loadEmailThreadsFromInteractions(contactId);
      }
    } catch (err) {
      console.error('Error loading email threads:', err);
    }
  };
  
  // Alternative method to load email threads from interactions
  const loadEmailThreadsFromInteractions = async (contactId) => {
    try {
      console.log('Trying alternate method to find email threads...');
      
      // First get all interactions with type 'email' for this contact
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          email_thread_id,
          summary
        `)
        .eq('contact_id', contactId)
        .eq('interaction_type', 'email')
        .order('interaction_date', { ascending: false });
      
      if (interactionError) {
        console.error('Error loading email interactions:', interactionError);
        return;
      }
      
      if (!interactionData || interactionData.length === 0) {
        console.log('No email interactions found for contact ID:', contactId);
        return;
      }
      
      console.log('Found email interactions:', interactionData);
      
      // Extract unique thread_ids from the interactions
      const threadIds = [...new Set(interactionData.map(item => item.email_thread_id))].filter(Boolean);
      
      if (threadIds.length === 0) {
        console.log('No valid thread IDs found in interactions');
        return;
      }
      
      // Get thread details for each unique thread_id
      const { data: threadData, error: threadError } = await supabase
        .from('email_threads')
        .select(`
          email_thread_id,
          subject,
          thread_id,
          last_message_timestamp,
          updated_at
        `)
        .in('email_thread_id', threadIds);
      
      if (threadError) {
        console.error('Error loading thread details:', threadError);
        return;
      }
      
      if (!threadData || threadData.length === 0) {
        console.log('No thread details found for the thread IDs');
        return;
      }
      
      console.log('Found email thread details:', threadData);
      
      // Format and set email threads
      const formattedThreads = threadData.map(thread => ({
        thread_id: thread.email_thread_id,
        title: thread.subject || 'No Subject',
        date: thread.last_message_timestamp,
        updated_at: thread.updated_at,
        gmail_thread_id: thread.thread_id
      }))
      .sort((a, b) => new Date(b.date || b.updated_at) - new Date(a.date || a.updated_at));
      
      console.log('Setting email threads from interactions:', formattedThreads);
      setEmailThreads(formattedThreads);
      
      // Set default active section if there are any email threads and no chats
      if (formattedThreads.length > 0 && !activeSection && showEmail && (!showWhatsApp || whatsappChats.length === 0)) {
        setActiveSection('email');
        setSelectedEmailThread(formattedThreads[0].thread_id);
        loadEmailMessages(formattedThreads[0].thread_id);
      }
    } catch (err) {
      console.error('Error loading email threads from interactions:', err);
    }
  };
  
  // Load meetings for a contact
  const loadMeetings = async (contactId) => {
    try {
      console.log('Loading meetings for contact ID:', contactId);
      
      // First get all interactions with type 'meeting' for this contact
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          interaction_date,
          summary
        `)
        .eq('contact_id', contactId)
        .eq('interaction_type', 'meeting')
        .order('interaction_date', { ascending: false });
      
      if (interactionError) {
        console.error('Error loading meeting interactions:', interactionError);
        return;
      }
      
      console.log('Found meeting interactions:', interactionData);
      
      if (!interactionData || interactionData.length === 0) {
        return; // No meeting interactions found
      }
      
      // For now, we'll use interaction data directly instead of looking up meetings
      // since the meeting_id column doesn't exist
      
      // Create formatted meeting objects directly from interactions
      if (interactionData && interactionData.length > 0) {
        const formattedMeetings = interactionData.map(interaction => ({
          id: interaction.interaction_id, // Use interaction_id as meeting id
          title: interaction.summary || 'Untitled Meeting',
          start_time: interaction.interaction_date,
          end_time: interaction.interaction_date, // We don't have end time, use same as start
          notes: interaction.summary || '',
          created_at: interaction.interaction_date
        }))
        .sort((a, b) => new Date(b.start_time || b.created_at) - new Date(a.start_time || a.created_at));
        
        console.log('Setting meetings from interactions:', formattedMeetings);
        setMeetings(formattedMeetings);
        
        // Set default active section if there are any meetings and no other interactions
        if (formattedMeetings.length > 0 && !activeSection && whatsappChats.length === 0 && emailThreads.length === 0) {
          setActiveSection('meetings');
          setSelectedMeeting(formattedMeetings[0].id);
          loadMeetingDetails(formattedMeetings[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading meetings:', err);
    }
  };
  
  // Load chat messages for a specific chat
  const loadChatMessages = async (chatId) => {
    if (!chatId) return;
    
    setLoadingMessages(true);
    try {
      console.log('Loading messages for chat ID:', chatId);
      
      // Since 'messages' table doesn't exist, let's create placeholder messages
      // from interactions instead
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          summary,
          interaction_date,
          direction
        `)
        .eq('chat_id', chatId)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: true });
      
      if (interactionError) {
        console.error('Error loading chat interactions:', interactionError);
        setChatMessages([]);
        return;
      }
      
      if (interactionData && interactionData.length > 0) {
        // Format interactions as messages
        const formattedMessages = interactionData.map(interaction => {
          // Make sure we alternate messages for testing if direction is missing
          const fakeDirection = interaction.interaction_id % 2 === 0 ? 'outbound' : 'inbound';
          
          return {
            id: interaction.interaction_id,
            content: interaction.summary || 'No content available',
            sent: interaction.direction === 'outbound' || fakeDirection === 'outbound',
            direction: interaction.direction || fakeDirection,
            timestamp: interaction.interaction_date,
            // Add property specifically for UI rendering
            isOutbound: interaction.direction === 'outbound' || fakeDirection === 'outbound'
          };
        });
        
        console.log('Setting chat messages from interactions:', formattedMessages);
        setChatMessages(formattedMessages);
      } else {
        // Create some test messages showing different directions
        const placeholderMessages = [
          {
            id: 'placeholder-1',
            content: 'This is an inbound test message (should be on the left with dark background)',
            sent: false,
            direction: 'inbound',
            isOutbound: false,
            timestamp: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
          },
          {
            id: 'placeholder-2',
            content: 'This is an outbound test message (should be on the right with green background)',
            sent: true,
            direction: 'outbound',
            isOutbound: true,
            timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
          },
          {
            id: 'placeholder-3',
            content: 'Another inbound message (left, dark)',
            sent: false,
            direction: 'inbound',
            isOutbound: false,
            timestamp: new Date().toISOString() // Now
          }
        ];
        setChatMessages(placeholderMessages);
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Load email messages for a specific thread with proper sender and recipient information
  const loadEmailMessages = async (threadId) => {
    if (!threadId) return;
    
    setLoadingEmails(true);
    try {
      console.log('Loading emails for thread ID:', threadId);
      
      // Get emails for this thread without the ambiguous join
      const { data, error } = await supabase
        .from('emails')
        .select(`
          email_id,
          subject,
          body_plain,
          body_html,
          message_timestamp,
          direction,
          sender_contact_id,
          has_attachments,
          attachment_count
        `)
        .eq('email_thread_id', threadId)
        .order('message_timestamp', { ascending: false });
      
      if (error) {
        console.error('Error loading email messages:', error);
        setEmailMessages([]);
        return;
      }
      
      console.log('Found email messages:', data);
      
      if (data && data.length > 0) {
        // Process email messages in parallel with additional sender and participant info
        const emailsWithDetails = await Promise.all(data.map(async (email) => {
          // Get email participants (to, cc, bcc)
          const { data: participantsData, error: participantsError } = await supabase
            .from('email_participants')
            .select(`
              participant_id,
              participant_type,
              contact_id
            `)
            .eq('email_id', email.email_id);
            
          if (participantsError) {
            console.error(`Error loading participants for email ${email.email_id}:`, participantsError);
            return { ...email, participants: [] };
          }
          
          // Get sender contact details if sender_contact_id exists
          let senderData = null;
          if (email.sender_contact_id) {
            const { data: sender, error: senderError } = await supabase
              .from('contacts')
              .select(`
                contact_id,
                first_name,
                last_name
              `)
              .eq('contact_id', email.sender_contact_id)
              .single();
              
            if (senderError) {
              console.error(`Error loading sender for email ${email.email_id}:`, senderError);
            } else {
              senderData = sender;
            }
            
            // Get sender's email address if available
            if (senderData) {
              const { data: senderEmails, error: senderEmailsError } = await supabase
                .from('contact_emails')
                .select('email')
                .eq('contact_id', email.sender_contact_id)
                .limit(1);
                
              if (!senderEmailsError && senderEmails && senderEmails.length > 0) {
                senderData.email = senderEmails[0].email;
              }
            }
          }
          
          // For each participant, get their contact details if contact_id exists
          const participantsWithDetails = await Promise.all((participantsData || []).map(async (participant) => {
            if (participant.contact_id) {
              const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .select(`
                  first_name,
                  last_name
                `)
                .eq('contact_id', participant.contact_id)
                .single();
                
              if (contactError) {
                console.error(`Error loading contact for participant:`, contactError);
                return participant;
              }
              
              // Get contact's email
              const { data: contactEmails, error: contactEmailsError } = await supabase
                .from('contact_emails')
                .select('email')
                .eq('contact_id', participant.contact_id)
                .limit(1);
                
              return {
                ...participant,
                contact_name: contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : '',
                contact_email: contactEmails && contactEmails.length > 0 ? contactEmails[0].email : ''
              };
            }
            return participant;
          }));
          
          return { 
            ...email, 
            participants: participantsWithDetails || [],
            sender: senderData 
          };
        }));
        
        // Format emails with all participant information
        const formattedEmails = emailsWithDetails.map(email => {
          // Extract sender information
          let senderName = 'Unknown Sender';
          let senderEmail = '';
          
          if (email.sender) {
            senderName = `${email.sender.first_name || ''} ${email.sender.last_name || ''}`.trim() || 'Unknown Sender';
            senderEmail = email.sender.email || '';
          }
          
          // Group participants by type
          const toRecipients = [];
          const ccRecipients = [];
          const bccRecipients = [];
          
          if (email.participants && email.participants.length > 0) {
            email.participants.forEach(participant => {
              // Use contact name if available, otherwise use email from contact_emails
              const name = participant.contact_name || '';
              const emailAddress = participant.contact_email || '';
              
              const recipientInfo = {
                name: name || 'Unknown Recipient',
                email: emailAddress
              };
              
              if (participant.participant_type === 'to') {
                toRecipients.push(recipientInfo);
              } else if (participant.participant_type === 'cc') {
                ccRecipients.push(recipientInfo);
              } else if (participant.participant_type === 'bcc') {
                bccRecipients.push(recipientInfo);
              }
            });
          }
          
          return {
            id: email.email_id,
            subject: email.subject || 'No Subject',
            body: email.body_plain || '',
            html: email.body_html || '',
            timestamp: email.message_timestamp,
            direction: email.direction || 'inbound',
            sender: {
              name: senderName,
              email: senderEmail
            },
            recipients: toRecipients,
            ccRecipients: ccRecipients,
            bccRecipients: bccRecipients,
            hasAttachments: email.has_attachments || false,
            attachmentCount: email.attachment_count || 0
          };
        });
        
        console.log('Setting formatted email messages:', formattedEmails);
        setEmailMessages(formattedEmails);
      } else {
        setEmailMessages([]);
      }
    } catch (err) {
      console.error('Error loading email messages:', err);
      setEmailMessages([]);
    } finally {
      setLoadingEmails(false);
    }
  };
  
  // Load meeting details including attendees
  const loadMeetingDetails = async (meetingId) => {
    if (!meetingId) return;
    
    setLoadingMeeting(true);
    try {
      console.log('Loading details for meeting ID:', meetingId);
      
      // Find meeting in already loaded meetings array
      const meeting = meetings.find(m => m.id === meetingId);
      
      if (!meeting) {
        console.log('No meeting found with ID:', meetingId);
        setMeetingDetails(null);
        return;
      }
      
      // For now, we'll use interaction data directly instead of fetching attendees
      // since the meeting_attendees table might not exist
      
      // Set simplified meeting details 
      const meetingDetails = {
        ...meeting,
        attendees: [] // Empty array since we can't get attendees
      };
      
      console.log('Setting meeting details from interaction:', meetingDetails);
      setMeetingDetails(meetingDetails);
    } catch (err) {
      console.error('Error loading meeting details:', err);
      setMeetingDetails(null);
    } finally {
      setLoadingMeeting(false);
    }
  };
  
  // Handlers for selection
  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
    setSelectedEmailThread(null);
    setSelectedMeeting(null);
    setActiveSection('whatsapp');
    loadChatMessages(chatId);
  };
  
  const handleSelectEmailThread = (threadId) => {
    setSelectedEmailThread(threadId);
    setSelectedChat(null);
    setSelectedMeeting(null);
    setActiveSection('email');
    loadEmailMessages(threadId);
  };
  
  const handleSelectMeeting = (meetingId) => {
    setSelectedMeeting(meetingId);
    setSelectedChat(null);
    setSelectedEmailThread(null);
    setActiveSection('meetings');
    loadMeetingDetails(meetingId);
  };
  
  // Format timestamp for display
  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return { date: 'Unknown', time: '' };
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return { date: 'Unknown', time: '' };
      
      return {
        date: format(date, 'MMM d, yyyy'),
        time: format(date, 'h:mm a')
      };
    } catch (err) {
      console.error('Error formatting date:', err);
      return { date: 'Unknown', time: '' };
    }
  };
  
  // Toggle email expanded state
  const toggleEmailExpanded = (emailId) => {
    setExpandedEmails(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };
  
  // Render WhatsApp chat using styled components
  const renderWhatsAppChat = (chatId) => {
    console.log('Rendering WhatsApp chat ID:', chatId);
    console.log('Chat messages:', chatMessages);
    
    if (loadingMessages) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#aaa',
          fontStyle: 'italic'
        }}>
          Loading messages...
        </div>
      );
    }
    
    if (!chatMessages || chatMessages.length === 0) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#aaa',
          fontStyle: 'italic'
        }}>
          No messages available
        </div>
      );
    }
    
    const chat = whatsappChats.find(c => c.chat_id === chatId);
    const chatName = chat?.chat_name || 'Chat';
    const isGroupChat = chat?.is_group_chat ? 'Group Chat' : 'Direct Message';
    
    return (
      <WhatsAppContainer>
        <ChatHeader>
          <ChatAvatar>
            {chatName.charAt(0).toUpperCase()}
          </ChatAvatar>
          <ChatInfo>
            <ChatName>
              {chatName}
            </ChatName>
            <ChatStatus>
              {isGroupChat} • {chatMessages.length} messages
            </ChatStatus>
          </ChatInfo>
        </ChatHeader>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box',
          backgroundColor: '#0b1a1a',
          maxHeight: 'calc(100vh - 280px)',
          width: '100%'
        }}>
          {chatMessages.map(message => {
            console.log('=======================================');
            console.log('Message being rendered:', JSON.stringify(message, null, 2));
            
            // Examine all possible direction properties in detail
            console.log('Raw direction property:', message.direction);
            console.log('Raw isOutbound property:', message.isOutbound);
            console.log('Raw sent property:', message.sent);
            
            // Determine message direction with explicit logging of each condition
            const fromDirection = message.direction === 'outbound' || message.direction === 'sent';
            const fromIsOutbound = Boolean(message.isOutbound);
            const fromSent = Boolean(message.sent);
            console.log('Direction conditions:', { fromDirection, fromIsOutbound, fromSent });
            
            // Final direction decision
            const direction = message.direction || (message.isOutbound || message.sent ? 'outbound' : 'inbound');
            const isOutbound = direction === 'outbound' || direction === 'sent';
            console.log('FINAL DIRECTION DECISION:', { direction, isOutbound });
            
            const formattedTime = formatTime(message.timestamp).time;
            
            // Two-column grid approach for clear left/right positioning
            return (
              <div 
                key={message.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  width: '100%',
                  marginBottom: '10px'
                }}
              >
                {/* LEFT COLUMN - only used for inbound messages */}
                {!isOutbound && (
                  <div style={{ gridColumn: 1, paddingRight: '15%' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      borderTopLeftRadius: '3px',
                      position: 'relative',
                      wordWrap: 'break-word',
                      lineHeight: 1.4,
                      fontSize: '0.95rem',
                      boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#202c33',
                      color: '#e9e9e9',
                    }}>
                      {message.content}
                      <div style={{
                        fontSize: '0.65rem',
                        color: '#999',
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>{formattedTime}</div>
                      
                      {/* Chat bubble triangle */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: -6,
                        width: 0,
                        height: 0,
                        borderTop: '8px solid #202c33',
                        borderLeft: '8px solid transparent'
                      }} />
                    </div>
                  </div>
                )}
                
                {/* RIGHT COLUMN - only used for outbound messages */}
                {isOutbound && (
                  <div style={{ gridColumn: 2, paddingLeft: '15%' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      borderTopRightRadius: '3px',
                      position: 'relative',
                      wordWrap: 'break-word',
                      lineHeight: 1.4,
                      fontSize: '0.95rem',
                      boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#055e54',
                      color: '#e9e9e9',
                    }}>
                      {message.content}
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>{formattedTime}</div>
                      
                      {/* Chat bubble triangle */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: -6,
                        width: 0,
                        height: 0,
                        borderTop: '8px solid #055e54',
                        borderRight: '8px solid transparent'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </WhatsAppContainer>
    );
  };
  
  // Render email thread with new UI
  const renderEmailThread = (threadId) => {
    if (loadingEmails) {
      return <LoadingContainer>Loading emails...</LoadingContainer>;
    }
    
    if (!emailMessages || emailMessages.length === 0) {
      return <NoDataMessage>No emails available</NoDataMessage>;
    }
    
    // Use the most recent email as the thread information
    const threadTitle = emailMessages[0]?.subject || 'No Subject';
    
    return (
      <EmailThreadContainer>
        <EmailHeader>
          <EmailSubject>{threadTitle}</EmailSubject>
          <EmailCount>{emailMessages.length} emails in this thread</EmailCount>
        </EmailHeader>
        
        <EmailList>
          {emailMessages.map(email => {
            const isExpanded = expandedEmails[email.id] || false;
            const time = formatTime(email.timestamp);
            
            return (
              <EmailItem key={email.id} $expanded={isExpanded}>
                <EmailHeader2 onClick={() => toggleEmailExpanded(email.id)}>
                  <EmailMeta>
                    <EmailSender>
                      {email.sender.name} 
                      <span style={{ fontWeight: 'normal', fontSize: '0.85rem', marginLeft: '8px', color: '#aaa' }}>
                        {email.sender.email ? `<${email.sender.email}>` : ''}
                      </span>
                    </EmailSender>
                    <EmailDate>{time.date}, {time.time}</EmailDate>
                  </EmailMeta>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px' 
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      backgroundColor: email.direction === 'outbound' ? '#2d562d' : '#333',
                      color: email.direction === 'outbound' ? '#8aff8a' : '#ccc',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginRight: '8px'
                    }}>
                      {email.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#ddd' }}>
                      <strong>Subject:</strong> {email.subject}
                    </div>
                  </div>
                  
                  {!isExpanded && (
                    <EmailPreview>
                      {email.body.length > 100
                        ? `${email.body.substring(0, 100).replace(/\n/g, ' ')}...`
                        : email.body.replace(/\n/g, ' ')}
                    </EmailPreview>
                  )}
                </EmailHeader2>
                
                {isExpanded && (
                  <>
                    <div style={{ padding: '0 16px 16px' }}>
                      {/* Recipient info section */}
                      {email.recipients && email.recipients.length > 0 && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#ccc',
                          marginBottom: '6px',
                          display: 'flex'
                        }}>
                          <div style={{ minWidth: '45px', fontWeight: 'bold', color: '#999' }}>To:</div>
                          <div>{email.recipients.map(r => 
                            r.name !== 'Unknown Recipient' ? `${r.name}${r.email ? ` <${r.email}>` : ''}` : (r.email || 'Unknown')
                          ).join(', ')}</div>
                        </div>
                      )}
                      
                      {/* CC Recipients */}
                      {email.ccRecipients && email.ccRecipients.length > 0 && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#ccc',
                          marginBottom: '6px',
                          display: 'flex'
                        }}>
                          <div style={{ minWidth: '45px', fontWeight: 'bold', color: '#999' }}>CC:</div>
                          <div>{email.ccRecipients.map(r => 
                            r.name !== 'Unknown Recipient' ? `${r.name}${r.email ? ` <${r.email}>` : ''}` : (r.email || 'Unknown')
                          ).join(', ')}</div>
                        </div>
                      )}
                      
                      {/* BCC Recipients (only shown if there are some) */}
                      {email.bccRecipients && email.bccRecipients.length > 0 && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#ccc',
                          marginBottom: '6px',
                          display: 'flex' 
                        }}>
                          <div style={{ minWidth: '45px', fontWeight: 'bold', color: '#999' }}>BCC:</div>
                          <div>{email.bccRecipients.map(r => 
                            r.name !== 'Unknown Recipient' ? `${r.name}${r.email ? ` <${r.email}>` : ''}` : (r.email || 'Unknown')
                          ).join(', ')}</div>
                        </div>
                      )}
                      
                      {/* Attachments (if any) */}
                      {email.hasAttachments && email.attachmentCount > 0 && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#4a9eff',
                          marginTop: '8px',
                          borderTop: '1px solid #333',
                          paddingTop: '8px'
                        }}>
                          <div style={{ fontWeight: 'bold' }}>
                            {email.attachmentCount} Attachment{email.attachmentCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <EmailBody>
                      {email.html ? (
                        <div dangerouslySetInnerHTML={{ __html: email.html }} />
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{email.body}</div>
                      )}
                    </EmailBody>
                  </>
                )}
                
                {email.body.length > 100 && (
                  <div 
                    style={{ 
                      textAlign: 'center', 
                      padding: '8px 0', 
                      cursor: 'pointer',
                      color: '#4a9eff',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => toggleEmailExpanded(email.id)}
                  >
                    {isExpanded ? '▲ Show less' : '▼ Show more'}
                  </div>
                )}
              </EmailItem>
            );
          })}
        </EmailList>
      </EmailThreadContainer>
    );
  };
  
  // Render meeting
  const renderMeeting = (meetingId) => {
    if (loadingMeeting) {
      return <LoadingContainer>Loading meeting details...</LoadingContainer>;
    }
    
    if (!meetingDetails) {
      return <NoDataMessage>Meeting details not available</NoDataMessage>;
    }
    
    const startTime = formatTime(meetingDetails.start_time);
    const endTime = formatTime(meetingDetails.end_time);
    
    return (
      <MeetingContainer>
        <MeetingHeader>
          <MeetingTitle>{meetingDetails.title}</MeetingTitle>
          <MeetingTime>
            <FiCalendar />
            <span>{startTime.date}, {startTime.time} - {endTime.time}</span>
          </MeetingTime>
          
          <MeetingAttendees>
            {meetingDetails.attendees.map((attendee, index) => (
              <MeetingAttendee key={index}>{attendee}</MeetingAttendee>
            ))}
            {meetingDetails.attendees.length === 0 && (
              <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                No attendees listed
              </span>
            )}
          </MeetingAttendees>
        </MeetingHeader>
        
        <MeetingDetails>
          <SectionTitle>Notes</SectionTitle>
          <MeetingNotes>
            {meetingDetails.notes || 'No notes available for this meeting.'}
          </MeetingNotes>
        </MeetingDetails>
      </MeetingContainer>
    );
  };
  
  return (
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
          padding: '25px',
          maxWidth: '920px',
          width: '95%',
          backgroundColor: '#121212',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          color: '#e0e0e0',
          maxHeight: '92vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <ModalHeader>
        <h2>Recent Interactions{contact ? ` - ${contact.first_name} ${contact.last_name}` : ''}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => contact?.mobile && window.open(`https://wa.me/${contact.mobile.replace(/\D/g, '')}`, '_blank')}
            aria-label="WhatsApp"
            title="Open WhatsApp"
            style={{ color: '#25D366' }} // Neon green for WhatsApp
          >
            <RiWhatsappFill size={24} />
          </button>
          <button 
            onClick={() => {
              // Get primary email address from contact_emails for this contact
              if (contact?.contact_id) {
                // First try to use the contact email if it exists
                if (contact.email) {
                  window.open(`https://mail.superhuman.com/search/${encodeURIComponent(contact.email)}`, '_blank');
                } else {
                  // If no email directly on contact, fetch from contact_emails
                  (async () => {
                    try {
                      const { data: emails, error } = await supabase
                        .from('contact_emails')
                        .select('email')
                        .eq('contact_id', contact.contact_id)
                        .eq('is_primary', true)
                        .limit(1);
                        
                      if (error) throw error;
                      
                      if (emails && emails.length > 0) {
                        window.open(`https://mail.superhuman.com/search/${encodeURIComponent(emails[0].email)}`, '_blank');
                      } else {
                        // Try any email if no primary found
                        const { data: anyEmails, error: anyEmailError } = await supabase
                          .from('contact_emails')
                          .select('email')
                          .eq('contact_id', contact.contact_id)
                          .limit(1);
                          
                        if (anyEmailError) throw anyEmailError;
                        
                        if (anyEmails && anyEmails.length > 0) {
                          window.open(`https://mail.superhuman.com/search/${encodeURIComponent(anyEmails[0].email)}`, '_blank');
                        }
                      }
                    } catch (err) {
                      console.error('Error fetching contact email for Superhuman link:', err);
                    }
                  })();
                }
              }
            }}
            aria-label="Email in Superhuman"
            title="Open in Superhuman"
            style={{ color: '#4a9eff' }} // Blue for Email
          >
            <FiMail size={24} />
          </button>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>
      </ModalHeader>
      
      {error && (
        <ErrorMessage>
          <FiAlertTriangle size={20} />
          <div>{error}</div>
        </ErrorMessage>
      )}
      
      <Card>
        
        {loading ? (
          <LoadingContainer style={{ minHeight: '200px' }}>
            Loading interactions...
          </LoadingContainer>
        ) : (
          <InteractionsLayout>
            {/* Channel headers in left sidebar */}
            <ChannelsMenu>
              {showWhatsApp && whatsappChats.length > 0 && (
                <>
                  <div style={{ padding: '10px 15px', color: '#aaa', fontSize: '0.8rem', borderBottom: '1px solid #272727', fontWeight: 'bold' }}>
                    WHATSAPP
                  </div>
                  
                  {/* WhatsApp chat items */}
                  {whatsappChats.map((chat, index) => (
                    <div 
                      key={chat.chat_id || index}
                      style={{ 
                        padding: '10px 15px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #191919',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: selectedChat === chat.chat_id ? '#1e1e1e' : 'transparent'
                      }}
                      onClick={() => handleSelectChat(chat.chat_id)}
                    >
                      {chat.is_group_chat ? (
                        <FiUsers size={16} color="#25d366" />
                      ) : (
                        <FiMessageSquare size={16} color="#25d366" />
                      )}
                      <span style={{ color: '#25d366' }}>
                        {chat.chat_name}
                      </span>
                      {chat.unread_count > 0 && (
                        <span style={{ 
                          backgroundColor: '#222',
                          color: '#888', 
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          marginLeft: 'auto'
                        }}>{chat.unread_count}</span>
                      )}
                    </div>
                  ))}
                </>
              )}
              
              {showEmail && emailThreads.length > 0 && (
                <>
                  <div style={{ padding: '10px 15px', color: '#aaa', fontSize: '0.8rem', borderBottom: '1px solid #272727', fontWeight: 'bold' }}>
                    EMAIL
                  </div>
                  
                  {/* Email thread items */}
                  {emailThreads.map((thread) => (
                    <div 
                      key={thread.thread_id}
                      style={{ 
                        padding: '10px 15px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #191919',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: selectedEmailThread === thread.thread_id ? '#1e1e1e' : 'transparent'
                      }}
                      onClick={() => handleSelectEmailThread(thread.thread_id)}
                    >
                      <FiMail size={16} color="#4a9eff" />
                      <span style={{ color: '#4a9eff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {thread.title}
                      </span>
                    </div>
                  ))}
                </>
              )}
              
              {showMeetings && meetings.length > 0 && (
                <>
                  <div style={{ padding: '10px 15px', color: '#aaa', fontSize: '0.8rem', borderBottom: '1px solid #272727', fontWeight: 'bold' }}>
                    MEETINGS
                  </div>
                  
                  {/* Meeting items */}
                  {meetings.map((meeting) => (
                    <div 
                      key={meeting.id}
                      style={{ 
                        padding: '10px 15px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #191919',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: selectedMeeting === meeting.id ? '#1e1e1e' : 'transparent'
                      }}
                      onClick={() => handleSelectMeeting(meeting.id)}
                    >
                      <FiCalendar size={16} color="#ff9900" />
                      <span style={{ color: '#ff9900', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meeting.title}
                      </span>
                    </div>
                  ))}
                </>
              )}
              
              {(
                (!showWhatsApp || whatsappChats.length === 0) && 
                (!showEmail || emailThreads.length === 0) && 
                (!showMeetings || meetings.length === 0)
              ) && (
                <NoDataMessage>No interactions found</NoDataMessage>
              )}
            </ChannelsMenu>
            
            {/* Interactions content */}
            <InteractionsContainer>
              {selectedChat && activeSection === 'whatsapp' && renderWhatsAppChat(selectedChat)}
              {selectedEmailThread && activeSection === 'email' && renderEmailThread(selectedEmailThread)}
              {selectedMeeting && activeSection === 'meetings' && renderMeeting(selectedMeeting)}
              
              {!activeSection && (
                <NoDataMessage>Select an interaction to view details</NoDataMessage>
              )}
            </InteractionsContainer>
          </InteractionsLayout>
        )}
      </Card>
    </Modal>
  );
};

export default ContactsInteractionModal;
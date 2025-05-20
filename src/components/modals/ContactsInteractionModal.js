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
  height: 500px;
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
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #272727;
  background-color: #171717;
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
`;

const Message = styled.div`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  position: relative;
  word-wrap: break-word;
  
  &.sent {
    align-self: flex-end;
    background-color: #025C4C;
    color: #fff;
    border-top-right-radius: 0;
  }
  
  &.received {
    align-self: flex-start;
    background-color: #222;
    color: #eee;
    border-top-left-radius: 0;
  }
  
  .message-time {
    font-size: 0.65rem;
    color: ${props => props.sent ? 'rgba(255, 255, 255, 0.7)' : '#999'};
    text-align: right;
    margin-top: 4px;
  }
`;

// Email specific components
const EmailContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const EmailHeader = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid #272727;
  background-color: #171717;
`;

const EmailSubject = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 8px;
  font-size: 16px;
`;

const EmailMetadata = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 5px;
`;

const EmailContent = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  line-height: 1.6;
  color: #ddd;
  white-space: pre-wrap;
`;

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
const ContactsInteractionModal = ({ isOpen, onRequestClose, contact }) => {
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
        if (formattedChats.length > 0 && !activeSection) {
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
      if (formattedThreads.length > 0 && !activeSection && whatsappChats.length === 0) {
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
      if (formattedThreads.length > 0 && !activeSection && whatsappChats.length === 0) {
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
          meeting_id,
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
      
      // Extract unique meeting_ids from the interactions
      const meetingIds = [...new Set(interactionData.map(item => item.meeting_id))].filter(Boolean);
      
      if (meetingIds.length === 0) {
        return; // No valid meeting IDs found
      }
      
      // Get meeting details for each unique meeting_id
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          start_time,
          end_time,
          notes,
          created_at
        `)
        .in('id', meetingIds);
      
      if (meetingError) {
        console.error('Error loading meetings:', meetingError);
        return;
      }
      
      console.log('Found meetings:', meetingData);
      
      if (meetingData && meetingData.length > 0) {
        // Format the meetings data
        const formattedMeetings = meetingData.map(meeting => ({
          id: meeting.id,
          title: meeting.title || 'Untitled Meeting',
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          notes: meeting.notes || '',
          created_at: meeting.created_at
        }))
        .sort((a, b) => new Date(b.start_time || b.created_at) - new Date(a.start_time || a.created_at));
        
        console.log('Setting meetings:', formattedMeetings);
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
      
      // Query for messages in this chat
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          is_from_me,
          timestamp,
          external_message_id
        `)
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error('Error loading chat messages:', error);
        setChatMessages([]);
        return;
      }
      
      console.log('Found chat messages:', data);
      
      if (data && data.length > 0) {
        // Format the messages
        const formattedMessages = data.map(message => ({
          id: message.id,
          content: message.content || '',
          sent: message.is_from_me || false,
          timestamp: message.timestamp
        }));
        
        console.log('Setting chat messages:', formattedMessages);
        setChatMessages(formattedMessages);
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Load email messages for a specific thread
  const loadEmailMessages = async (threadId) => {
    if (!threadId) return;
    
    setLoadingEmails(true);
    try {
      console.log('Loading emails for thread ID:', threadId);
      
      // Get emails for this thread
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
          email_participants (
            participant_id,
            contact_id,
            participant_type,
            contacts (
              first_name,
              last_name,
              contact_emails (
                email
              )
            )
          )
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
        // Process and format emails
        const formattedEmails = data.map(email => {
          // Extract sender information
          let senderName = '';
          let senderEmail = '';
          
          if (email.email_participants && email.email_participants.length > 0) {
            const sender = email.email_participants.find(p => p.participant_type === 'from');
            if (sender && sender.contacts) {
              senderName = `${sender.contacts.first_name || ''} ${sender.contacts.last_name || ''}`.trim();
              if (sender.contacts.contact_emails && sender.contacts.contact_emails.length > 0) {
                senderEmail = sender.contacts.contact_emails[0].email || '';
              }
            }
          }
          
          // Extract all recipients
          const recipients = [];
          if (email.email_participants) {
            const toParticipants = email.email_participants.filter(p => p.participant_type === 'to');
            for (const participant of toParticipants) {
              if (participant.contacts) {
                const name = `${participant.contacts.first_name || ''} ${participant.contacts.last_name || ''}`.trim();
                let participantEmail = '';
                if (participant.contacts.contact_emails && participant.contacts.contact_emails.length > 0) {
                  participantEmail = participant.contacts.contact_emails[0].email || '';
                }
                if (name || participantEmail) {
                  recipients.push({
                    name,
                    email: participantEmail
                  });
                }
              }
            }
          }
          
          return {
            id: email.email_id,
            subject: email.subject || 'No Subject',
            body: email.body_plain || '',
            html: email.body_html || '',
            timestamp: email.message_timestamp,
            direction: email.direction || 'inbound',
            sender: {
              name: senderName || 'Unknown Sender',
              email: senderEmail || ''
            },
            recipients
          };
        });
        
        console.log('Setting email messages:', formattedEmails);
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
      
      // First get the meeting details
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();
      
      if (meetingError) {
        console.error('Error loading meeting details:', meetingError);
        setMeetingDetails(null);
        return;
      }
      
      if (!meetingData) {
        console.log('No meeting found with ID:', meetingId);
        setMeetingDetails(null);
        return;
      }
      
      // Then get the attendees
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('meeting_attendees')
        .select(`
          attendee_id,
          contact_id,
          contacts (
            first_name,
            last_name
          )
        `)
        .eq('meeting_id', meetingId);
      
      if (attendeesError) {
        console.error('Error loading meeting attendees:', attendeesError);
      }
      
      // Format attendees
      const attendees = [];
      if (attendeesData && attendeesData.length > 0) {
        for (const attendee of attendeesData) {
          if (attendee.contacts) {
            const name = `${attendee.contacts.first_name || ''} ${attendee.contacts.last_name || ''}`.trim();
            if (name) {
              attendees.push(name);
            }
          }
        }
      }
      
      // Set the complete meeting details
      const meetingDetails = {
        ...meetingData,
        attendees
      };
      
      console.log('Setting meeting details:', meetingDetails);
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
      const date = new Date(timestamp);
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
  
  // Render WhatsApp chat
  const renderWhatsAppChat = (chatId) => {
    if (loadingMessages) {
      return <LoadingContainer>Loading messages...</LoadingContainer>;
    }
    
    if (!chatMessages || chatMessages.length === 0) {
      return <NoDataMessage>No messages available</NoDataMessage>;
    }
    
    const chat = whatsappChats.find(c => c.chat_id === chatId);
    
    return (
      <WhatsAppContainer>
        <ChatHeader>
          <ChatAvatar>
            {(chat?.chat_name || '').charAt(0).toUpperCase()}
          </ChatAvatar>
          <ChatInfo>
            <ChatName>
              {chat?.chat_name || 'Chat'}
            </ChatName>
            <ChatStatus>
              {chat?.is_group_chat ? 'Group Chat' : 'Direct Message'}
            </ChatStatus>
          </ChatInfo>
        </ChatHeader>
        
        <MessagesList>
          {chatMessages.map(message => (
            <Message key={message.id} className={message.sent ? 'sent' : 'received'} sent={message.sent}>
              {message.content}
              <div className="message-time">{formatTime(message.timestamp).time}</div>
            </Message>
          ))}
        </MessagesList>
      </WhatsAppContainer>
    );
  };
  
  // Render email thread
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
      <EmailContainer>
        <EmailHeader>
          <EmailSubject>{threadTitle}</EmailSubject>
        </EmailHeader>
        
        <EmailContent>
          {emailMessages.map(email => {
            const isExpanded = expandedEmails[email.id] || false;
            const time = formatTime(email.timestamp);
            return (
              <InteractionItem key={email.id}>
                <InteractionHeader direction={email.direction === 'outbound' ? 'Outbound' : 'Inbound'}>
                  <div>
                    <strong>{email.sender.name}</strong> {email.sender.email ? `<${email.sender.email}>` : ''}
                    <div className="interaction-direction">
                      {email.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                    </div>
                  </div>
                  <div className="interaction-date">
                    <div className="date">{time.date}</div>
                    <div className="time">{time.time}</div>
                  </div>
                </InteractionHeader>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Subject:</strong> {email.subject}
                </div>
                
                {email.recipients.length > 0 && (
                  <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: '#888' }}>
                    <strong>To:</strong> {email.recipients.map(r => r.name || r.email).join(', ')}
                  </div>
                )}
                
                <InteractionContent>
                  {isExpanded ? (
                    <div dangerouslySetInnerHTML={{ __html: email.html || email.body }} />
                  ) : (
                    <>
                      {email.body.length > 200
                        ? `${email.body.substring(0, 200)}...`
                        : email.body
                      }
                    </>
                  )}
                </InteractionContent>
                
                {email.body.length > 200 && (
                  <div 
                    style={{ 
                      textAlign: 'center', 
                      marginTop: '10px', 
                      cursor: 'pointer',
                      color: '#00ff00',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => toggleEmailExpanded(email.id)}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </div>
                )}
              </InteractionItem>
            );
          })}
        </EmailContent>
      </EmailContainer>
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
          maxWidth: '800px',
          width: '90%',
          backgroundColor: '#121212',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          color: '#e0e0e0',
          maxHeight: '90vh',
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
            onClick={() => contact?.email && window.open(`mailto:${contact.email}`, '_blank')}
            aria-label="Email"
            title="Send Email"
            style={{ color: '#25D366' }} // Neon green for Email
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
              {whatsappChats.length > 0 && (
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
              
              {emailThreads.length > 0 && (
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
              
              {meetings.length > 0 && (
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
              
              {whatsappChats.length === 0 && emailThreads.length === 0 && meetings.length === 0 && (
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
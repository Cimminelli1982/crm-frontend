import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiPhone, FiMail, FiMessageCircle } from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 10px 0 0 0; /* Add just a bit of top padding */
  min-height: 100vh; /* Full viewport height */
  height: auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  
  .clickable-cell {
    cursor: default;
  }
  
  .name-cell-clickable {
    cursor: pointer;
  }
  
  .ag-row {
    cursor: default;
  }
  
  .phone-link, .email-link {
    z-index: 100;
    position: relative;
  }
  
  .phone-link:hover, .email-link:hover {
    color: #00ff00 !important;
    text-decoration: underline;
    background-color: rgba(0, 255, 0, 0.1);
  }
`;

const ErrorText = styled.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const LoadingContainer = styled.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingBar = styled.div`
  width: 300px;
  height: 8px;
  background-color: #111;
  margin: 20px 0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background-color: #00ff00;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px #00ff00;
    border-radius: 4px;
  }
  
  @keyframes pulse {
    0% {
      left: -30%;
      opacity: 0.8;
    }
    100% {
      left: 100%;
      opacity: 0.2;
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 15px;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  letter-spacing: 1px;
  font-size: 16px;
  opacity: 0.9;
  animation: blink 1.5s ease-in-out infinite alternate;
  
  @keyframes blink {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
`;

const LoadingMatrix = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #00ff00;
  text-align: center;
  margin-top: 30px;
  height: 100px;
  width: 300px;
  overflow: hidden;
  position: relative;
  
  &:after {
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000011 01101111 01101110 01110100 01100001 01100011 01110100 01110011 00101110 00101110 00101110";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(to bottom, transparent, #000 80%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    opacity: 0.7;
    text-shadow: 0 0 5px #00ff00;
    animation: matrix 5s linear infinite;
  }
  
  @keyframes matrix {
    0% { transform: translateY(-60px); }
    100% { transform: translateY(60px); }
  }
`;

// Modal components for messages
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #121212;
  border-radius: 8px;
  border: 1px solid #333;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  color: #00ff00;
  margin: 0;
  font-size: 1.2rem;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: #cccccc;
  font-family: 'Courier New', monospace;
`;

const MessageDate = styled.div`
  color: #888;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: right;
`;

const MessageContent = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
`;

const MessageInfo = styled.div`
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  
  & > svg {
    margin-right: 10px;
    color: #00ff00;
  }
`;

const SkipInbox = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  const navigate = useNavigate();
  
  // Simpler name formatter function
  const formatName = (params) => {
    if (!params.data) return '';
    const firstName = params.data.first_name || '';
    const lastName = params.data.last_name || '';
    return `${firstName} ${lastName}`.trim() || '(No name)';
  };
  
  // React cell renderer for name column
  const NameCellRenderer = (props) => {
    const navigate = useNavigate();
    const value = props.valueFormatted || props.value || '';

    const handleClick = (e) => {
      e.stopPropagation();
      if (props.data && props.data.contact_id) {
        // Navigate to ContactCrmWorkflow page when clicking on a name
        navigate(`/contacts/workflow/${props.data.contact_id}`);
      }
    };

    return (
      <div
        className="name-link"
        style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
        onClick={handleClick}
      >
        {value}
      </div>
    );
  };

  // Cell renderer for action buttons with improved event handling
  const ActionCellRenderer = (props) => {
    // Create refs to store references to the buttons
    const spamButtonRef = React.useRef(null);
    const crmButtonRef = React.useRef(null);
    
    React.useEffect(() => {
      // Get the buttons from refs after render
      const spamButton = spamButtonRef.current;
      const crmButton = crmButtonRef.current;
      
      if (!spamButton || !crmButton) return;
      
      // Function to handle spam button click with complete event isolation
      const spamClickHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Delay the actual action just to be sure all event bubbling is done
        setTimeout(() => {
          handleMarkAsSpam(props.data);
        }, 10);
        
        return false;
      };
      
      // Function to handle add to CRM button click with complete event isolation
      const crmClickHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Delay the actual action just to be sure all event bubbling is done
        setTimeout(() => {
          handleAddToCRM(props.data);
        }, 10);
        
        return false;
      };
      
      // Add the click handlers to all buttons
      spamButton.addEventListener('click', spamClickHandler, true);
      crmButton.addEventListener('click', crmClickHandler, true);
      
      // Cleanup - remove handlers when component unmounts
      return () => {
        spamButton.removeEventListener('click', spamClickHandler, true);
        crmButton.removeEventListener('click', crmClickHandler, true);
      };
    }, [props.data]);
    
    return (
      <div
        className="action-buttons-container"
        style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '4px',
          paddingBottom: '0px',
          height: '100%'
        }}
        // This is critical - stop propagation at the container level too
        onClick={(e) => { 
          e.stopPropagation(); 
          e.preventDefault();
        }}
      >
        <div 
          ref={spamButtonRef}
          style={{
            backgroundColor: '#333',
            color: '#ff5555',
            border: '1px solid #ff5555',
            borderRadius: '4px',
            padding: '5px 10px',
            margin: '0 8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            height: '24px'
          }}
        >
          <FiXCircle /> Spam
        </div>
        
        <div 
          ref={crmButtonRef}
          style={{
            backgroundColor: '#333',
            color: '#55ff55',
            border: '1px solid #55ff55',
            borderRadius: '4px',
            padding: '5px 10px',
            margin: '0 8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            height: '24px'
          }}
        >
          <FiCheckCircle /> Add to CRM
        </div>
      </div>
    );
  };

  // WhatsApp Message Modal Component
  const WhatsAppModal = ({ message, onClose }) => {
    if (!message) return null;
    
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              <FiPhone style={{ marginRight: '10px' }} /> WhatsApp Message
            </ModalTitle>
            <ModalCloseButton onClick={onClose}>×</ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <MessageInfo>
              <FiPhone /> From: {message.mobile_number}
            </MessageInfo>
            <MessageContent>
              {message.message}
            </MessageContent>
            <MessageDate>
              Received: {new Date(message.created_at).toLocaleString()}
            </MessageDate>
            
            {message.interaction_id && (
              <div style={{ marginTop: '20px' }}>
                <button 
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#00ff00',
                    border: '1px solid #00ff00',
                    borderRadius: '4px',
                    padding: '8px 15px',
                    cursor: 'pointer',
                    fontFamily: 'Courier New, monospace'
                  }}
                  onClick={() => {
                    if (message.contact_id) {
                      sessionStorage.setItem('workflow_contact_id', message.contact_id);
                      window.location.href = `/contacts/workflow/${message.contact_id}`;
                    }
                    onClose();
                  }}
                >
                  View Full Conversation History
                </button>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    );
  };
  
  // Email Message Modal Component
  const EmailModal = ({ email, onClose }) => {
    if (!email) return null;
    
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              <FiMail style={{ marginRight: '10px' }} /> Email Message
            </ModalTitle>
            <ModalCloseButton onClick={onClose}>×</ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <MessageInfo>
              <FiMail /> From: {email.email_address}
            </MessageInfo>
            <div style={{ marginTop: '10px' }}>
              <strong>Subject:</strong> {email.subject || '(No Subject)'}
              {email.has_attachments && (
                <span style={{ marginLeft: '10px', color: '#aaa', fontSize: '0.9em' }}>
                  ({email.attachment_count || 1} attachment{email.attachment_count > 1 ? 's' : ''})
                </span>
              )}
            </div>
            <MessageContent>
              {email.body}
            </MessageContent>
            <MessageDate>
              {email.direction === 'outgoing' ? 'Sent: ' : 'Received: '} 
              {new Date(email.created_at).toLocaleString()}
            </MessageDate>
            
            {(email.interaction_id || email.email_id || email.email_thread_id) && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#00ff00',
                    border: '1px solid #00ff00',
                    borderRadius: '4px',
                    padding: '8px 15px',
                    cursor: 'pointer',
                    fontFamily: 'Courier New, monospace'
                  }}
                  onClick={() => {
                    if (email.contact_id) {
                      sessionStorage.setItem('workflow_contact_id', email.contact_id);
                      window.location.href = `/contacts/workflow/${email.contact_id}`;
                    }
                    onClose();
                  }}
                >
                  View Contact History
                </button>
                
                {email.email_thread_id && (
                  <button 
                    style={{
                      backgroundColor: '#1a1a1a',
                      color: '#5599ff',
                      border: '1px solid #5599ff',
                      borderRadius: '4px',
                      padding: '8px 15px',
                      cursor: 'pointer',
                      fontFamily: 'Courier New, monospace'
                    }}
                    onClick={() => {
                      // Navigate to email thread view
                      alert('Email thread view is not implemented yet');
                      // Future implementation could use something like:
                      // window.location.href = `/emails/thread/${email.email_thread_id}`;
                    }}
                  >
                    View Thread
                  </button>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    );
  };

  // State for modals
  const [whatsappMessage, setWhatsappMessage] = useState(null);
  const [emailMessage, setEmailMessage] = useState(null);
  
  // Handler for mobile phone number click to view whatsapp messages
  const handleViewWhatsappMessage = async (mobile, contactId) => {
    if (!mobile || mobile === '-') return;
    
    try {
      let queryContactId = contactId;
      
      // If no contactId was provided, look it up from mobile number
      if (!queryContactId) {
        const { data: mobileData, error: mobileError } = await supabase
          .from('contact_mobiles')
          .select('contact_id')
          .eq('mobile', mobile)
          .limit(1);
        
        if (mobileError) throw mobileError;
        
        if (!mobileData || mobileData.length === 0) {
          alert(`Could not find contact associated with ${mobile}`);
          return;
        }
        
        queryContactId = mobileData[0].contact_id;
      }
      
      // Find the latest WhatsApp interaction for this contact
      // Get the chat ID first if possible
      const { data: contactChats, error: chatError } = await supabase
        .from('contact_chats')
        .select('chat_id')
        .eq('contact_id', queryContactId);
      
      if (chatError) throw chatError;
      
      let interactions = [];
      
      // If we found chat associations, get interactions for those chats
      if (contactChats && contactChats.length > 0) {
        const chatIds = contactChats.map(cc => cc.chat_id).filter(Boolean);
        
        if (chatIds.length > 0) {
          // Get interactions for these chat IDs
          const { data: chatInteractions, error: interactionsError } = await supabase
            .from('interactions')
            .select(`
              interaction_id,
              interaction_date,
              summary,
              chat_id,
              contact_id,
              interaction_type,
              direction
            `)
            .eq('contact_id', queryContactId)
            .in('chat_id', chatIds)
            .order('interaction_date', { ascending: false })
            .limit(10);
          
          if (interactionsError) throw interactionsError;
          
          if (chatInteractions && chatInteractions.length > 0) {
            interactions = chatInteractions;
          }
        }
      }
      
      // As fallback, try to get any interaction for this contact
      if (interactions.length === 0) {
        const { data: directInteractions, error: directError } = await supabase
          .from('interactions')
          .select(`
            interaction_id,
            interaction_date,
            summary,
            chat_id,
            contact_id,
            interaction_type,
            direction
          `)
          .eq('contact_id', queryContactId)
          .order('interaction_date', { ascending: false })
          .limit(5);
        
        if (!directError && directInteractions && directInteractions.length > 0) {
          interactions = directInteractions;
        }
      }
      
      if (interactions && interactions.length > 0) {
        // Find the latest WhatsApp-like interaction
        const whatsappInteraction = interactions.find(i => 
          i.summary && (
            i.interaction_type === 'whatsapp' || 
            i.interaction_type === 'chat' || 
            i.interaction_type === 'message'
          )
        ) || interactions[0];
        
        // Construct a message object for the modal
        const messageData = {
          mobile_number: mobile,
          message: whatsappInteraction.summary || 'No message content available',
          created_at: whatsappInteraction.interaction_date,
          interaction_id: whatsappInteraction.interaction_id,
          contact_id: queryContactId,
          direction: whatsappInteraction.direction || 'incoming'
        };
        
        setWhatsappMessage(messageData);
      } else {
        alert(`No WhatsApp messages found for ${mobile}`);
      }
    } catch (err) {
      console.error('Error retrieving WhatsApp messages:', err);
      alert('Failed to retrieve WhatsApp messages. Please try again.');
    }
  };
  
  // Handler for email click to view latest email
  const handleViewEmailMessage = async (email, contactId) => {
    if (!email || email === '-') return;
    
    try {
      let queryContactId = contactId;
      
      // If no contactId was provided, look it up from email address
      if (!queryContactId) {
        const { data: emailData, error: emailError } = await supabase
          .from('contact_emails')
          .select('contact_id')
          .eq('email', email)
          .limit(1);
        
        if (emailError) throw emailError;
        
        if (!emailData || emailData.length === 0) {
          alert(`Could not find contact associated with ${email}`);
          return;
        }
        
        queryContactId = emailData[0].contact_id;
      }
      
      // Try first to get the latest email directly from the emails table
      const { data: emails, error: emailsError } = await supabase
        .from('emails')
        .select(`
          email_id,
          email_thread_id,
          subject,
          body_plain,
          body_html,
          message_timestamp,
          direction,
          sender_contact_id,
          thread_id,
          has_attachments,
          attachment_count
        `)
        .eq('sender_contact_id', queryContactId)
        .order('message_timestamp', { ascending: false })
        .limit(1);
      
      if (emailsError) throw emailsError;
      
      // If direct email found, use that
      if (emails && emails.length > 0) {
        const latestEmail = emails[0];
        
        // Get thread info if available
        let threadSubject = latestEmail.subject;
        if (latestEmail.email_thread_id) {
          const { data: threadData } = await supabase
            .from('email_threads')
            .select('subject')
            .eq('email_thread_id', latestEmail.email_thread_id)
            .limit(1);
            
          if (threadData && threadData.length > 0) {
            threadSubject = threadData[0].subject || threadSubject;
          }
        }
        
        // Construct an email object for the modal
        const emailData = {
          email_address: email,
          subject: threadSubject || 'Email from ' + email,
          body: latestEmail.body_plain || latestEmail.body_html || 'No email content available',
          created_at: latestEmail.message_timestamp,
          email_id: latestEmail.email_id,
          email_thread_id: latestEmail.email_thread_id,
          thread_id: latestEmail.thread_id,
          contact_id: queryContactId,
          direction: latestEmail.direction,
          has_attachments: latestEmail.has_attachments,
          attachment_count: latestEmail.attachment_count
        };
        
        setEmailMessage(emailData);
        return;
      }
      
      // Fallback to interactions table if no direct emails found
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          interaction_date,
          summary,
          contact_id,
          interaction_type,
          direction,
          email_thread_id
        `)
        .eq('contact_id', queryContactId)
        .order('interaction_date', { ascending: false })
        .limit(5);
      
      if (interactionsError) throw interactionsError;
      
      if (interactions && interactions.length > 0) {
        // Find the latest email interaction if possible
        const emailInteraction = interactions.find(i => 
          i.summary && (
            i.interaction_type === 'email' || 
            i.email_thread_id ||
            (i.summary && i.summary.includes('@'))
          )
        ) || interactions[0];
        
        // Construct an email object for the modal
        const emailData = {
          email_address: email,
          subject: emailInteraction.email_thread_id ? 
            `Email thread: ${emailInteraction.email_thread_id}` : 
            'Email from ' + email,
          body: emailInteraction.summary || 'No email content available',
          created_at: emailInteraction.interaction_date,
          interaction_id: emailInteraction.interaction_id,
          contact_id: queryContactId,
          direction: emailInteraction.direction || 'incoming'
        };
        
        setEmailMessage(emailData);
      } else {
        alert(`No emails found for ${email}`);
      }
    } catch (err) {
      console.error('Error retrieving emails:', err);
      alert('Failed to retrieve emails. Please try again.');
    }
  };

  // Handler for marking a contact as spam
  const handleMarkAsSpam = async (contact) => {
    if (!contact || !contact.contact_id) return;
    
    try {
      // Update the contact record 
      const { error } = await supabase
        .from('contacts')
        .update({ 
          category: 'Spam',
          last_modified_at: new Date().toISOString(),
          last_modified_by: 'User'
        })
        .eq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      // Remove the contact from the displayed list
      const updatedContacts = contacts.filter(c => c.contact_id !== contact.contact_id);
      setContacts(updatedContacts);
      
      // Check if we need to refresh the data
      if (updatedContacts.length === 0) {
        // Trigger a refresh to get more data
        setDataLoaded(false);
      }
    } catch (err) {
      console.error('Error marking contact as spam:', err);
      alert('Failed to mark contact as spam. Please try again.');
    }
  };
  
  // Handler for adding a contact to CRM
  const handleAddToCRM = async (contact) => {
    if (!contact || !contact.contact_id) return;
    
    try {
      // Update the contact record
      const { error } = await supabase
        .from('contacts')
        .update({ 
          category: 'Inbox',
          last_modified_at: new Date().toISOString(),
          last_modified_by: 'User'
        })
        .eq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      // Remove the contact from the displayed list
      const updatedContacts = contacts.filter(c => c.contact_id !== contact.contact_id);
      setContacts(updatedContacts);
      
      // Check if we need to refresh the data
      if (updatedContacts.length === 0) {
        // Trigger a refresh to get more data
        setDataLoaded(false);
      }
    } catch (err) {
      console.error('Error adding contact to CRM:', err);
      alert('Failed to add contact to CRM. Please try again.');
    }
  };
  
  // Mobile cell renderer with click functionality
  const MobileCellRenderer = (props) => {
    const value = props.value || '-';
    // Create a ref to access the DOM element
    const cellRef = React.useRef(null);
    
    // Add a more robust click handling on mount
    React.useEffect(() => {
      // Skip effect if no value or no ref element
      if (value === '-' || !cellRef.current) return;
      
      const handleCellClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Delay to make sure all propagation is stopped
        setTimeout(() => {
          handleViewWhatsappMessage(value, props.data?.contact_id);
        }, 10);
        
        return false;
      };
      
      // Add the event listener
      const cell = cellRef.current;
      cell.addEventListener('click', handleCellClick, true);
      
      // Cleanup
      return () => {
        cell.removeEventListener('click', handleCellClick, true);
      };
    }, [value, props.data?.contact_id]);
    
    // Return a simple dash for empty values
    if (value === '-') return value;
    
    return (
      <div 
        ref={cellRef}
        className="phone-link"
        style={{ 
          color: '#cccccc', 
          cursor: 'pointer',
          textDecoration: 'underline',
          position: 'relative',
          zIndex: 10
        }}
        title="Click to view latest WhatsApp message"
      >
        <FiPhone style={{ marginRight: '5px', color: '#55ff55' }} />
        {value}
      </div>
    );
  };
  
  // Email cell renderer with click functionality
  const EmailCellRenderer = (props) => {
    const value = props.value || '-';
    // Create a ref to access the DOM element
    const cellRef = React.useRef(null);
    
    // Add a more robust click handling on mount
    React.useEffect(() => {
      // Skip effect if no value or no ref element
      if (value === '-' || !cellRef.current) return;
      
      const handleCellClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Delay to make sure all propagation is stopped
        setTimeout(() => {
          handleViewEmailMessage(value, props.data?.contact_id);
        }, 10);
        
        return false;
      };
      
      // Add the event listener
      const cell = cellRef.current;
      cell.addEventListener('click', handleCellClick, true);
      
      // Cleanup
      return () => {
        cell.removeEventListener('click', handleCellClick, true);
      };
    }, [value, props.data?.contact_id]);
    
    // Return a simple dash for empty values
    if (value === '-') return value;
    
    return (
      <div 
        ref={cellRef}
        className="email-link"
        style={{ 
          color: '#cccccc', 
          cursor: 'pointer',
          textDecoration: 'underline',
          position: 'relative',
          zIndex: 10 
        }}
        title="Click to view latest email"
      >
        <FiMail style={{ marginRight: '5px', color: '#55ff55' }} />
        {value}
      </div>
    );
  };

  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Name', 
      field: 'name',
      valueGetter: formatName,
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: false,
      sortable: true,
      pinned: 'left',
      cellClass: 'name-cell-clickable',
      cellRenderer: NameCellRenderer
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 140,
      filter: 'agDateColumnFilter',
      floatingFilter: false,
      sortable: true,
    },
    { 
      headerName: 'Mobile', 
      field: 'mobile',
      valueGetter: (params) => {
        if (!params.data) return '';
        return params.data.mobile || '-';
      },
      minWidth: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: false,
      sortable: true,
      cellRenderer: MobileCellRenderer
    },
    { 
      headerName: 'Email', 
      field: 'email',
      valueGetter: (params) => {
        if (!params.data) return '';
        return params.data.email || '-';
      },
      minWidth: 250,
      filter: 'agTextColumnFilter',
      floatingFilter: false,
      sortable: true,
      cellRenderer: EmailCellRenderer
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 250,
      width: 250,
      cellRenderer: ActionCellRenderer,
      sortable: false,
      filter: false,
      suppressSizeToFit: false,
      cellClass: 'action-cell-no-click'
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    cellClass: 'clickable-cell',
    suppressCellFocus: true
  }), []);

  // Grid ready event handler
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    // Wait for a tick to ensure grid is properly initialized
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
    // Check if the click is on a phone or email cell
    if (params.event && (params.event.target.closest('.phone-link') || params.event.target.closest('.email-link'))) {
      // Prevent row click behavior for these cells
      params.event.stopPropagation();
      return;
    }
    
    if (params.data && params.data.contact_id) {
      console.log('Row clicked, navigating to workflow page', params.data);
      navigate(`/contacts/workflow/${params.data.contact_id}`);
    }
  }, [navigate]);

  // Fetch contacts with last interactions within the last 90 days
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Helper function to retry failed Supabase requests
      const retrySupabaseRequest = async (request, maxRetries = 3, delay = 1000) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await request();
          } catch (err) {
            console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, err);
            lastError = err;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for next attempt (exponential backoff)
            delay *= 1.5;
          }
        }
        // If we get here, all retries failed
        throw lastError;
      };
      
      // Calculate date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const formattedDate = ninetyDaysAgo.toISOString();
      
      // Get contacts count with retry
      const { count, error: countError } = await retrySupabaseRequest(async () => {
        return supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'Skip')
          .gte('last_interaction_at', formattedDate)
          .not('last_interaction_at', 'is', null);
      });
        
      if (countError) throw countError;
      console.log(`Total Skip contacts with recent interactions: ${count}`);
      
      // Function to fetch contacts in batches with retry
      const fetchBatch = async (from, to) => {
        console.log(`Fetching batch from ${from} to ${to}`);
        return retrySupabaseRequest(async () => {
          return supabase
            .from('contacts')
            .select(`
              contact_id, 
              first_name, 
              last_name, 
              category,
              last_interaction_at,
              created_at
            `)
            .eq('category', 'Skip')
            .gte('last_interaction_at', formattedDate)
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })  // Most recent interactions first
            .range(from, to);
        });
      };
      
      // Fetch contacts in batches
      let allContacts = [];
      const batchSize = 500;
      let totalFetchedCount = 0;
      let failedBatches = 0;
      
      // Limit to 4000 contacts max for performance if needed
      const maxContacts = Math.min(count, 4000);
      for (let i = 0; i < maxContacts; i += batchSize) {
        try {
          setLoading(`Loading contacts... ${Math.min(i + batchSize, count)}/${count}`);
          
          const { data: batchData, error: batchError } = await fetchBatch(i, i + batchSize - 1);
          
          if (batchError) {
            console.error(`Error fetching contacts batch from ${i} to ${i + batchSize - 1}:`, batchError);
            failedBatches++;
            
            // Continue to next batch unless too many failures
            if (failedBatches > 3) {
              throw new Error(`Too many failed batches (${failedBatches}). Last error: ${batchError.message}`);
            }
            continue;
          }
          
          if (batchData && batchData.length > 0) {
            allContacts = [...allContacts, ...batchData];
            totalFetchedCount += batchData.length;
          }
        } catch (err) {
          console.error(`Error in batch fetch loop at index ${i}:`, err);
          // Only throw if we haven't fetched anything yet
          if (totalFetchedCount === 0) {
            throw err;
          }
          break; // Stop fetching more batches but use what we have
        }
      }
      
      console.log(`Successfully fetched ${totalFetchedCount} contacts in ${Math.ceil(totalFetchedCount/batchSize)} batches with ${failedBatches} failed batches`);
      
      // Get the contact data
      const contactsData = allContacts;
      
      // Guard against empty results
      if (!contactsData || contactsData.length === 0) {
        setContacts([]);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      
      // Get all contact IDs to fetch related data
      const contactIds = contactsData.map(contact => contact.contact_id).filter(Boolean);
      
      // Guard against empty contact IDs
      if (contactIds.length === 0) {
        setContacts(contactsData);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      
      setLoading('Loading related data (emails, mobiles)...');
      
      // Function to fetch related data in batches
      const fetchRelatedDataBatch = async (entityName, query, ids, batchSize = 100) => {
        console.log(`Fetching ${entityName} data for ${ids.length} contacts in batches of ${batchSize}`);
        let allData = [];
        
        for (let i = 0; i < ids.length; i += batchSize) {
          const batchIds = ids.slice(i, i + batchSize);
          
          try {
            const { data, error } = await query.in('contact_id', batchIds);
            
            if (error) throw error;
            allData = [...allData, ...(data || [])];
            
            // Update progress
            setLoading(`Loading ${entityName} data... ${Math.min(i + batchSize, ids.length)}/${ids.length}`);
          } catch (err) {
            console.error(`Error fetching batch of ${entityName} data:`, err);
            // Continue with next batch instead of failing completely
          }
        }
        
        return { data: allData };
      };
      
      try {
        // Fetch emails and mobiles in parallel
        const [emailsData, mobilesData] = await Promise.all([
          // Fetch emails (with primary flag)
          fetchRelatedDataBatch('emails', 
            supabase.from('contact_emails').select('contact_id, email, is_primary'), 
            contactIds
          ),
            
          // Fetch mobile numbers (with primary flag)
          fetchRelatedDataBatch('mobiles', 
            supabase.from('contact_mobiles').select('contact_id, mobile, is_primary'), 
            contactIds
          )
        ]);
        
        setLoading('Processing data and preparing contacts...');
        
        // Map the related data to each contact
        const contactsWithRelations = contactsData.map((contact, index) => {
          if (!contact || !contact.contact_id) {
            console.warn('Skipping invalid contact:', contact);
            return null;
          }
          
          // Update progress for very large data sets
          if (index > 0 && index % 1000 === 0) {
            setLoading(`Processing contacts... ${index}/${contactsData.length}`);
          }
          
          // Find emails and mobiles for this contact
          const contactEmails = (emailsData.data || [])
            .filter(email => email?.contact_id === contact.contact_id);
            
          const contactMobiles = (mobilesData.data || [])
            .filter(mobile => mobile?.contact_id === contact.contact_id);
          
          // Get primary email or first available
          const primaryEmail = contactEmails.find(email => email?.is_primary);
          const email = primaryEmail?.email || 
                      (contactEmails.length > 0 ? contactEmails[0]?.email : null);
                      
          // Get primary mobile or first available
          const primaryMobile = contactMobiles.find(mobile => mobile?.is_primary);
          const mobile = primaryMobile?.mobile || 
                       (contactMobiles.length > 0 ? contactMobiles[0]?.mobile : null);
          
          return {
            ...contact,
            id: contact.contact_id, // Add id as alias for contact_id for compatibility
            email: email || null,
            mobile: mobile || null
          };
        });
        
        // Filter out any null contacts from our processing
        const filteredContacts = contactsWithRelations.filter(Boolean);
        
        console.log(`Successfully processed ${filteredContacts.length} contacts out of ${contactsData.length} total`);
        
        // Set the contacts with all data
        setContacts(filteredContacts);
        setLoading(false);
        setDataLoaded(true);
        
        // Delay showing the grid to avoid abrupt transitions
        setTimeout(() => {
          setShowGrid(true);
        }, 800);
      } catch (err) {
        console.error('Error loading related data:', err);
        // Fallback to basic contact data if related data loading fails
        const basicContacts = contactsData.map(contact => ({
          ...contact,
          id: contact.contact_id
        }));
        setContacts(basicContacts);
        setLoading(false);
        setDataLoaded(true);
        
        // Delay showing the grid to avoid abrupt transitions
        setTimeout(() => {
          setShowGrid(true);
        }, 800);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      console.log('Initiating data fetch');
      fetchContacts();
    }
  }, [dataLoaded]);
  
  // Handle window resize
  useEffect(() => {
    if (!gridApi) return;
    
    const handleResize = () => {
      gridApi.sizeColumnsToFit();
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize, { passive: true });
    };
  }, [gridApi]);

  return (
    <Container>
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {/* WhatsApp Message Modal */}
      {whatsappMessage && (
        <WhatsAppModal 
          message={whatsappMessage} 
          onClose={() => setWhatsappMessage(null)} 
        />
      )}
      
      {/* Email Message Modal */}
      {emailMessage && (
        <EmailModal 
          email={emailMessage} 
          onClose={() => setEmailMessage(null)} 
        />
      )}
      
      {loading !== false ? (
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' 
              ? loading.replace(/Loading .+ \d+\/\d+/, 'Initializing Matrix') 
              : 'Accessing Contact Database...'}
          </LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : !showGrid && !error ? (
        <LoadingContainer>
          <LoadingText>Preparing interface...</LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : contacts.length === 0 && !error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No 'Skip' category contacts found with interactions in the last 90 days.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100vh - 120px)', /* Adjusted for increased row height */
            width: 'calc(100% - 30px)', /* Adjusted for left/right padding */
            overflow: 'auto', /* Add scroll if content exceeds container */
            margin: '15px 15px 0 15px', /* Left and right margin */
            marginTop: '30px', /* Increased top margin */
            opacity: showGrid ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': '#2a2a2a',
            '--ag-border-color': '#333333'
          }}
        >
          <AgGridReact
            rowData={contacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={100} /* Show more rows per page */
            suppressCellFocus={true}
            enableCellTextSelection={true}
            rowHeight={42} /* Increased row height for better spacing */
            domLayout="autoHeight"
            paginationAutoPageSize={true} /* Auto-adjust page size to fill available height */
            stopEditingWhenCellsLoseFocus={false}
            suppressRowClickSelection={false}
            sortingOrder={['asc', 'desc', null]}
            sortModel={[
              { colId: 'last_interaction_at', sort: 'desc' }
            ]}
          />
        </div>
      )}
    </Container>
  );
};

export default SkipInbox;
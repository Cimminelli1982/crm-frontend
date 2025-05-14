import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiPhone, FiUser, FiCalendar, FiExternalLink, FiUsers, FiMessageCircle, FiHash } from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 15px 25px 15px 15px;
  height: calc(100vh - 60px);
  width: 100%;
  display: flex;
  
  .action-cell-no-click {
    z-index: 5;
  }
`;

const SidebarContainer = styled.div`
  width: 15%;
  padding-right: 15px;
  border-right: 1px solid #333;
`;

const MainContainer = styled.div`
  width: 85%;
  padding-left: 15px;
  overflow: hidden;
`;

const SidebarTitle = styled.h3`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const SpamList = styled.div`
  height: calc(100vh - 120px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #121212;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #333;
    border-radius: 3px;
  }
`;

const SpamItem = styled.div`
  padding: 6px 8px;
  margin-bottom: 4px;
  background-color: #1a1a1a;
  border-radius: 3px;
  border: 1px solid transparent;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #cccccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #00ff00;
    background-color: #112211;
  }
`;

const SpamNumber = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 75%;
`;

const SpamCounter = styled.span`
  background-color: #112211;
  color: #00ff00;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 0.7rem;
  min-width: 20px;
  text-align: center;
  margin-left: 4px;
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
  font-family: 'Courier New', monospace;
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
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01010111 01101000 01100001 01110100 01110011 01100001 01110000 01110000...";
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

const ActionButton = styled.button`
  background-color: ${props => props.color || 'transparent'};
  color: ${props => props.textColor || 'white'};
  border: 1px solid ${props => props.borderColor || 'transparent'};
  border-radius: 4px;
  padding: 5px 10px;
  margin: 0 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Contact Modal Styled Components
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
  max-width: 800px;
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
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
`;

const ContactDetails = styled.div`
  margin-bottom: 20px;
`;

const ContactInfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
`;

const ContactInfoLabel = styled.div`
  color: #999;
  width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContactInfoValue = styled.div`
  color: #eee;
  flex: 1;
`;

// Contact cell renderer with workflow link
const ContactCellRenderer = (props) => {
  const contactName = props.value || 'Unknown';
  const contactId = props.data?.contact_id;
  
  // Truncate contact name if longer than 50 characters
  const displayName = contactName.length > 50 ? contactName.substring(0, 50) + '...' : contactName;
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (contactId) {
      // Store contact ID in session storage for workflow
      sessionStorage.setItem('workflow_contact_id', contactId);
      // Navigate to the workflow page
      window.location.href = `/contacts/workflow/${contactId}`;
    }
  };
  
  return (
    <div 
      style={{ 
        fontSize: '0.85rem',
        color: '#ffffff',
        cursor: 'pointer',
        textDecoration: 'underline'
      }}
      onClick={handleClick}
      className="action-cell-no-click"
      title={contactName} // Show full name on hover
    >
      {displayName}
    </div>
  );
};

// Custom tooltip style
const CustomTooltip = styled.div`
  position: absolute;
  top: -5px;
  left: 0;
  transform: translateY(-100%);
  background-color: #222;
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 400px;
  word-wrap: break-word;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease, visibility 0.1s ease;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  pointer-events: none;
`;

// Cell renderer for text with hover tooltip
const TooltipCellRenderer = (props) => {
  const fullText = props.value || '';
  const displayText = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div 
      style={{ 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText}
      <CustomTooltip style={{ 
        opacity: isHovering ? 1 : 0, 
        visibility: isHovering ? 'visible' : 'hidden'
      }}>
        {fullText}
      </CustomTooltip>
    </div>
  );
};

// Cell renderer for action buttons with improved event handling
const ActionCellRenderer = (props) => {
  // Create refs to store references to the buttons
  const skipButtonRef = React.useRef(null);
  const addButtonRef = React.useRef(null);
  
  React.useEffect(() => {
    // Get the buttons from refs after render
    const skipButton = skipButtonRef.current;
    const addButton = addButtonRef.current;
    
    if (!skipButton || !addButton) return;
    
    // Function to handle skip button click with complete event isolation
    const skipClickHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // Delay the actual action just to be sure all event bubbling is done
      setTimeout(() => {
        if (props.onSkip) {
          props.onSkip(props.data);
        }
      }, 10);
      
      return false;
    };
    
    // Function to handle add to CRM button click with complete event isolation
    const addClickHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // Delay the actual action just to be sure all event bubbling is done
      setTimeout(() => {
        if (props.onAddToCRM) {
          props.onAddToCRM(props.data);
        }
      }, 10);
      
      return false;
    };
    
    // Add the click handlers to all buttons
    skipButton.addEventListener('click', skipClickHandler, true);
    addButton.addEventListener('click', addClickHandler, true);
    
    // Cleanup - remove handlers when component unmounts
    return () => {
      skipButton.removeEventListener('click', skipClickHandler, true);
      addButton.removeEventListener('click', addClickHandler, true);
    };
  }, [props]);
  
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
        ref={skipButtonRef}
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
        ref={addButtonRef}
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

// Contact Modal Component
const ContactModal = ({ contact, onClose, onSkip, onAddToCRM, onWorkflow }) => {
  if (!contact) return null;
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiPhone style={{ marginRight: '10px' }} /> WhatsApp Contact Details
          </ModalTitle>
          <ModalCloseButton onClick={onClose}>×</ModalCloseButton>
        </ModalHeader>
        
        <ModalBody>
          <ContactDetails>
            <ContactInfoItem>
              <ContactInfoLabel>
                <FiUser /> Name:
              </ContactInfoLabel>
              <ContactInfoValue>
                {contact.first_name || ''} {contact.last_name || ''}
              </ContactInfoValue>
            </ContactInfoItem>
            
            <ContactInfoItem>
              <ContactInfoLabel>
                <FiUsers /> Group Chat:
              </ContactInfoLabel>
              <ContactInfoValue>
                {contact.is_group_chat ? 'Yes' : 'No'}
              </ContactInfoValue>
            </ContactInfoItem>
            
            {contact.chat_name && (
              <ContactInfoItem>
                <ContactInfoLabel>
                  <FiHash /> Chat Name:
                </ContactInfoLabel>
                <ContactInfoValue>
                  {contact.chat_name}
                </ContactInfoValue>
              </ContactInfoItem>
            )}
            
            <ContactInfoItem>
              <ContactInfoLabel>
                <FiMessageCircle /> Last Interaction:
              </ContactInfoLabel>
              <ContactInfoValue>
                {contact.last_message || 'No recent interactions'}
              </ContactInfoValue>
            </ContactInfoItem>
            
            {contact.last_message_at && (
              <ContactInfoItem>
                <ContactInfoLabel>
                  <FiCalendar /> Interaction Date:
                </ContactInfoLabel>
                <ContactInfoValue>
                  {formatDate(contact.last_message_at)}
                </ContactInfoValue>
              </ContactInfoItem>
            )}
            
          </ContactDetails>
        </ModalBody>
        
        <ModalFooter>
          <ActionButton 
            onClick={() => {
              onSkip(contact);
              onClose();
            }}
            color="#333" 
            textColor="#ff5555" 
            borderColor="#ff5555"
          >
            <FiXCircle /> Spam
          </ActionButton>
          <ActionButton 
            onClick={() => {
              onAddToCRM(contact);
              onClose();
            }}
            color="#333"
            textColor="#55ff55"
            borderColor="#55ff55"
          >
            <FiCheckCircle /> Add to CRM
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

const WhatsappInbox = () => {
  const [contacts, setContacts] = useState([]);
  const [spamNumbers, setSpamNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spamLoading, setSpamLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spamError, setSpamError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [spamLoaded, setSpamLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [confirmSpam, setConfirmSpam] = useState(null);
  const navigate = useNavigate();
  
  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Name', 
      valueGetter: params => {
        if (!params.data) return '';
        return `${params.data.first_name || ''} ${params.data.last_name || ''}`.trim() || 'Unknown';
      },
      minWidth: 150,
      width: 150,
      suppressSizeToFit: false,
      cellRenderer: ContactCellRenderer,
      filter: false,
      sortable: true,
    },
    { 
      headerName: 'Group', 
      valueGetter: params => {
        if (!params.data) return '';
        if (params.data.is_group_chat) {
          return params.data.chat_name || 'Group Chat';
        } else {
          return 'Individual';
        }
      },
      minWidth: 180,
      width: 180,
      suppressSizeToFit: false,
      cellRenderer: TooltipCellRenderer,
      filter: false,
      sortable: true,
    },
    { 
      headerName: 'Last Message', 
      field: 'last_message',
      minWidth: 170,
      width: 170,
      valueGetter: (params) => {
        if (!params.data || !params.data.last_message) return '';
        const message = params.data.last_message;
        return message.length > 50 ? message.substring(0, 50) + '...' : message;
      },
      cellRenderer: TooltipCellRenderer,
      filter: false,
      sortable: true,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 250,
      width: 250,
      cellRenderer: ActionCellRenderer,
      cellRendererParams: {
        onSkip: handleSpamClick,
        onAddToCRM: handleAddToCRM
      },
      sortable: false,
      filter: false,
      suppressSizeToFit: false,
      cellClass: 'action-cell-no-click'
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true
  }), []);
  
  // Auto group column definition
  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'Group',
    field: 'chat_name',
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
    },
    minWidth: 200,
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
  
  // Handle row click to show contact details modal
  const handleRowClick = React.useCallback((event) => {
    // Check if this is a click on the action buttons or name column
    if (event.colDef && (event.colDef.headerName === 'Actions' || event.colDef.headerName === 'Name')) {
      // Skip opening the modal when clicking these columns
      return;
    }
    setSelectedContact(event.data);
  }, []);

  // Show spam confirmation modal
  function handleSpamClick(contactData) {
    console.log('Spam button clicked:', contactData);
    setConfirmSpam(contactData);
  }
  
  // Handle marking a contact as spam after confirmation
  async function handleConfirmSpam() {
    if (!confirmSpam) return;
    
    const contactData = confirmSpam;
    try {
      // Get the contact's mobile number
      const { data: mobiles, error: mobilesError } = await supabase
        .from('contact_mobiles')
        .select('mobile_number')
        .eq('contact_id', contactData.contact_id)
        .limit(1);
      
      if (mobilesError) throw mobilesError;
      
      if (mobiles && mobiles.length > 0) {
        // Add the mobile number to the whatsapp_spam table
        const { error: spamError } = await supabase
          .from('whatsapp_spam')
          .upsert({ 
            mobile_number: mobiles[0].mobile_number,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          }, {
            onConflict: 'mobile_number',
            returning: 'minimal'
          });
        
        if (spamError) throw spamError;
      }
      
      // Update the contact record to mark it as processed
      const { error } = await supabase
        .from('contacts')
        .update({ 
          category: 'Skip',
          last_modified_at: new Date().toISOString(),
          last_modified_by: 'User'
        })
        .eq('contact_id', contactData.contact_id);
      
      if (error) throw error;
      
      // Remove the contact from the displayed list
      const updatedContacts = contacts.filter(contact => contact.contact_id !== contactData.contact_id);
      setContacts(updatedContacts);
      
      // Check if we need to refresh the data
      if (updatedContacts.length === 0) {
        // Trigger a refresh to get more data
        setDataLoaded(false);
      }
      
      // Close the confirmation dialog
      setConfirmSpam(null);
      
      console.log('Contact marked as spam:', contactData.contact_id);
    } catch (err) {
      console.error('Error marking contact as spam:', err);
      // You could show an error toast here
    }
  }
  
  // Handle adding a contact to CRM
  async function handleAddToCRM(contactData) {
    console.log('Add to CRM clicked:', contactData);
    try {
      // Update the contact record to mark it with a different category
      const { error } = await supabase
        .from('contacts')
        .update({ 
          category: 'Inbox',
          last_modified_at: new Date().toISOString(),
          last_modified_by: 'User'
        })
        .eq('contact_id', contactData.contact_id);
      
      if (error) throw error;
      
      // Remove the contact from the displayed list
      const updatedContacts = contacts.filter(contact => contact.contact_id !== contactData.contact_id);
      setContacts(updatedContacts);
      
      // Check if we need to refresh the data
      if (updatedContacts.length === 0) {
        // Trigger a refresh to get more data
        setDataLoaded(false);
      }
      
      console.log('Contact marked for normal CRM processing:', contactData.contact_id);
    } catch (err) {
      console.error('Error processing contact for CRM:', err);
      // You could show an error toast here
    }
  }
  
  // Handle sending a contact to the workflow
  function handleWorkflowClick(contactData) {
    console.log('Workflow button clicked:', contactData);
    if (!contactData || !contactData.contact_id) return;
    
    // Store contact ID in session storage for workflow
    sessionStorage.setItem('workflow_contact_id', contactData.contact_id);
    
    // Navigate to the workflow page
    navigate(`/contacts/workflow/${contactData.contact_id}`);
  }
  
  // Handle click on spam number item
  async function handleSpamNumberClick(spamNumber) {
    console.log('Spam number clicked:', spamNumber);
    try {
      // Find a contact with this mobile number
      const { data: mobilesData, error: mobilesError } = await supabase
        .from('contact_mobiles')
        .select('contact_id')
        .eq('mobile_number', spamNumber.mobile_number)
        .limit(1);
      
      if (mobilesError) throw mobilesError;
      
      if (mobilesData && mobilesData.length > 0) {
        // Get the contact details
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('contact_id', mobilesData[0].contact_id)
          .limit(1);
        
        if (contactError) throw contactError;
        
        if (contactData && contactData.length > 0) {
          // Show the contact in the modal
          setSelectedContact(contactData[0]);
        }
      } else {
        // If no matching contact found, create a simplified version for display
        setSelectedContact({
          contact_id: `spam-${spamNumber.id || Date.now()}`,
          first_name: 'Unknown',
          last_name: 'Contact',
          job_role: 'WhatsApp Spam',
          description: `This number (${spamNumber.mobile_number}) has been marked as spam ${spamNumber.counter} times.`,
          created_at: spamNumber.created_at || new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching contact details for spam number:', err);
    }
  }

  // Fetch contacts from contacts table with chat and message info
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch the contacts with the WhatsApp category
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('category', 'WhatsApp Group Contact')
        .order('created_at', { ascending: false });
      
      if (contactsError) throw contactsError;
      
      // If no contacts, set empty array and finish loading immediately
      if (!contactsData || contactsData.length === 0) {
        console.log('No WhatsApp contacts found');
        setContacts([]);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      
      // Enhanced contacts array with group and message info
      const enhancedContacts = [...contactsData];
      
      // Get all contact IDs
      const contactIds = contactsData.map(contact => contact.contact_id);
      
      // Get chat associations for these contacts
      const { data: chatLinks, error: chatLinksError } = await supabase
        .from('contact_chats')
        .select('contact_id, chat_id')
        .in('contact_id', contactIds);
        
      if (chatLinksError) throw chatLinksError;
      
      // If we have chat links, get the chat information
      if (chatLinks && chatLinks.length > 0) {
        // Get all chat IDs
        const chatIds = chatLinks.map(link => link.chat_id).filter(Boolean);
        
        if (chatIds.length > 0) {
          // Get chat data
          const { data: chatsData, error: chatsError } = await supabase
            .from('chats')
            .select('id, chat_name, is_group_chat')
            .in('id', chatIds);
            
          if (chatsError) throw chatsError;
          
          // Create a lookup map for chats
          const chatsMap = {};
          if (chatsData) {
            chatsData.forEach(chat => {
              chatsMap[chat.id] = chat;
            });
          }
          
          // Create a lookup map for contact to chat relationship
          const contactChatMap = {};
          chatLinks.forEach(link => {
            if (link.contact_id && link.chat_id) {
              contactChatMap[link.contact_id] = link.chat_id;
            }
          });
          
          // Enhance contacts with chat data
          enhancedContacts.forEach(contact => {
            const chatId = contactChatMap[contact.contact_id];
            const chatInfo = chatId ? chatsMap[chatId] : null;
            
            if (chatInfo) {
              contact.is_group_chat = chatInfo.is_group_chat || false;
              contact.chat_name = chatInfo.chat_name || '';
              // Add chat_id for grouping
              contact.chat_id = chatId;
              // Add group info for ag-grid grouping
              contact.group = chatInfo.chat_name || 'Unknown Group';
            } else {
              contact.is_group_chat = false;
              contact.chat_name = '';
              contact.chat_id = null;
              contact.group = 'Individual Chats';
            }
            
            // For now, use placeholder for last message
            contact.last_message = ""; // We'll update this later if possible
          });
          
          // Get the last interactions for each contact
          try {
            // Fetch the latest interaction for each contact from interactions table
            const { data: interactionsData, error: interactionsError } = await supabase
              .from('interactions')
              .select('contact_id, summary, interaction_date')
              .in('contact_id', contactIds)
              .in('chat_id', chatIds)
              .order('interaction_date', { ascending: false });
              
            if (!interactionsError && interactionsData && interactionsData.length > 0) {
              console.log(`Successfully fetched ${interactionsData.length} interactions`);
              
              // Create a map of latest interaction per contact
              const lastInteractionByContactId = {};
              interactionsData.forEach(interaction => {
                if (!lastInteractionByContactId[interaction.contact_id] || 
                    new Date(interaction.interaction_date) > new Date(lastInteractionByContactId[interaction.contact_id].interaction_date)) {
                  lastInteractionByContactId[interaction.contact_id] = interaction;
                }
              });
              
              // Add last interaction summaries to contacts
              enhancedContacts.forEach(contact => {
                const lastInteraction = lastInteractionByContactId[contact.contact_id];
                
                if (lastInteraction) {
                  contact.last_message = lastInteraction.summary || '';
                  contact.last_message_at = lastInteraction.interaction_date || null;
                } else {
                  contact.last_message = 'No recent interactions';
                }
              });
            } else {
              console.log('No interactions found or error fetching interactions');
              enhancedContacts.forEach(contact => {
                contact.last_message = 'No interactions found';
              });
            }
          } catch (interactionErr) {
            // If we can't get interactions, just continue with the contacts we have
            console.error('Error fetching interactions:', interactionErr);
            enhancedContacts.forEach(contact => {
              contact.last_message = 'Error retrieving interactions';
            });
          }
        }
      }
      
      // Group contacts by chat_name for better organization
      const organizedContacts = [...enhancedContacts];
      
      // Sort contacts: first by group/chat name, then by person name within each group
      organizedContacts.sort((a, b) => {
        // First sort by group/chat name
        const aGroupName = a.chat_name || '';
        const bGroupName = b.chat_name || '';
        
        if (aGroupName !== bGroupName) {
          return aGroupName.localeCompare(bGroupName);
        }
        
        // Then sort by contact name within the same group
        const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim();
        return aName.localeCompare(bName);
      });
      
      console.log(`Successfully processed ${organizedContacts.length} WhatsApp contacts grouped by chat`);
      
      setContacts(organizedContacts);
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
    } catch (err) {
      console.error('Error fetching WhatsApp contacts:', err);
      setError(err?.message || 'Unknown error');
      setLoading(false);
    }
  };

  // Fetch spam numbers from whatsapp_spam table
  const fetchSpamNumbers = async () => {
    try {
      setSpamLoading(true);
      setSpamError(null);
      
      // Fetch the last 25 spam numbers ordered by last_modified_at
      const { data, error } = await supabase
        .from('whatsapp_spam')
        .select('*')
        .order('last_modified_at', { ascending: false })
        .limit(25);
      
      if (error) throw error;
      
      console.log(`Successfully fetched ${data?.length || 0} WhatsApp spam numbers`);
      
      setSpamNumbers(data || []);
      setSpamLoading(false);
      setSpamLoaded(true);
    } catch (err) {
      console.error('Error fetching WhatsApp spam numbers:', err);
      setSpamError(err.message);
      setSpamLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!dataLoaded) {
      console.log('Initiating WhatsApp contacts data fetch');
      fetchContacts();
    }
    
    // Fetch spam numbers independently
    if (!spamLoaded) {
      console.log('Initiating WhatsApp spam numbers fetch');
      fetchSpamNumbers();
    }
  }, [dataLoaded, spamLoaded]);
  
  // Handle window resize
  useEffect(() => {
    // Only add resize handler if gridApi exists
    if (!gridApi) return;
    
    const handleResize = () => {
      gridApi.sizeColumnsToFit();
    };
    
    // Use the resize event with options object (passive: true)
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize, { passive: true });
    };
  }, [gridApi]);

  return (
    <Container>
      {/* Contact details modal */}
      {selectedContact && (
        <ContactModal 
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onSkip={handleSpamClick}
          onAddToCRM={handleAddToCRM}
          onWorkflow={handleWorkflowClick}
        />
      )}
      
      {/* Spam confirmation modal */}
      {confirmSpam && (
        <ModalOverlay onClick={() => setConfirmSpam(null)}>
          <ModalContent 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', padding: '20px' }}
          >
            <ModalHeader>
              <ModalTitle>
                <FiXCircle style={{ marginRight: '10px', color: '#ff5555' }} /> Confirm Spam
              </ModalTitle>
              <ModalCloseButton onClick={() => setConfirmSpam(null)}>×</ModalCloseButton>
            </ModalHeader>
            
            <ModalBody>
              <p style={{ marginBottom: '20px' }}>
                Are you sure you want to mark this contact as spam?
              </p>
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '20px' 
              }}>
                <p><strong>Name:</strong> {`${confirmSpam.first_name || ''} ${confirmSpam.last_name || ''}`.trim() || 'Unknown'}</p>
              </div>
            </ModalBody>
            
            <ModalFooter>
              <ActionButton 
                onClick={() => setConfirmSpam(null)}
                color="#333" 
                textColor="#cccccc" 
                borderColor="#555"
              >
                Cancel
              </ActionButton>
              <ActionButton 
                onClick={handleConfirmSpam}
                color="#333"
                textColor="#ff5555"
                borderColor="#ff5555"
              >
                <FiXCircle /> Mark as Spam
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Sidebar for Spam Numbers */}
      <SidebarContainer>
        <SidebarTitle>Spam Numbers</SidebarTitle>
        
        {spamLoading ? (
          <div style={{ padding: '10px', color: '#00ff00', textAlign: 'center', fontSize: '0.75rem' }}>
            Loading...
          </div>
        ) : spamError ? (
          <ErrorText style={{ fontSize: '0.75rem', padding: '8px' }}>Error: {spamError}</ErrorText>
        ) : spamNumbers.length === 0 ? (
          <div style={{ padding: '10px', color: '#cccccc', textAlign: 'center', fontSize: '0.75rem' }}>
            No spam numbers
          </div>
        ) : (
          <SpamList>
            {spamNumbers.map((spam, index) => (
              <SpamItem 
                key={index} 
                onClick={() => handleSpamNumberClick(spam)}
              >
                <SpamNumber>
                  {spam.mobile_number && spam.mobile_number.length > 40 
                    ? `${spam.mobile_number.substring(0, 40)}...` 
                    : spam.mobile_number}
                </SpamNumber>
                <SpamCounter>
                  {spam.counter || 1}
                </SpamCounter>
              </SpamItem>
            ))}
          </SpamList>
        )}
      </SidebarContainer>
      
      {/* Main Content - WhatsApp Contacts */}
      <MainContainer>
        {error && <ErrorText>Error: {error}</ErrorText>}
        
        {loading !== false ? (
          <LoadingContainer>
            <LoadingText>
              {typeof loading === 'string' 
                ? loading 
                : 'Accessing WhatsApp Contacts...'}
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
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px'
          }}>
            <div style={{ marginBottom: '15px' }}>No more WhatsApp contacts to process 😊</div>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <div style={{ fontSize: '14px', color: '#aaa', marginTop: '10px' }}>
              Click <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#00ff00' }} onClick={() => setDataLoaded(false)}>here</span> to check for new contacts
            </div>
          </div>
        ) : (
          <div 
            className="ag-theme-alpine" 
            style={{ 
              height: 'calc(100vh - 120px)',
              width: 'calc(100% - 15px)',
              overflow: 'auto',
              margin: '15px 0 0 0',
              marginTop: '30px',
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
              autoGroupColumnDef={autoGroupColumnDef}
              onGridReady={onGridReady}
              rowSelection="single"
              animateRows={true}
              pagination={true}
              paginationPageSize={100}
              suppressCellFocus={true}
              enableCellTextSelection={true}
              rowHeight={42}
              domLayout="autoHeight"
              paginationAutoPageSize={true}
              sortingOrder={['desc', 'asc', null]}
              onRowClicked={handleRowClick}
              rowGroupPanelShow='never'
              groupDefaultExpanded={-1}
              groupDisplayType='groupRows'
              rowStyle={params => {
                // Apply alternating styles based on groups
                const groupName = params.data?.chat_name || '';
                let backgroundIntensity = '';
                
                if (groupName) {
                  // Calculate a simple hash for the group name to use for intensity
                  const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const intensity = hash % 3; // 0, 1, or 2
                  backgroundIntensity = intensity === 0 ? '1a' : intensity === 1 ? '22' : '2a'; 
                }
                
                return { 
                  cursor: 'pointer',
                  backgroundColor: groupName ? `#${backgroundIntensity}1a${backgroundIntensity}a` : '',
                };
              }}
              getRowId={params => params.data.contact_id}
              groupRowRendererParams={{
                suppressCount: true,
                innerRenderer: params => {
                  return `<span style="font-weight: bold; color: #00ff00;">${params.node.key}</span> (${params.node.allChildrenCount} contacts)`;
                }
              }}
              rowGroupingColumnHidingStrategy='hide'
              groupIncludeFooter={false}
              groupRemoveSingleChildren={false}
              rowData={contacts}
              rowGroupingAutoColumn={true}
              rowGroupColumns={['group']}
            />
          </div>
        )}
      </MainContainer>
    </Container>
  );
};

export default WhatsappInbox;
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';

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

const SpamEmail = styled.span`
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
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000101 01101101 01100001 01101001 01101100 01110011 00101110 00101110 00101110";
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

// Email Modal Styled Components
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

const EmailDetails = styled.div`
  margin-bottom: 20px;
`;

const EmailInfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
`;

const EmailInfoLabel = styled.div`
  color: #999;
  width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmailInfoValue = styled.div`
  color: #eee;
  flex: 1;
`;

const EmailMessageContainer = styled.div`
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #ddd;
  max-height: 400px;
  overflow-y: auto;
`;

const EmailSubject = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #00aaff;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
`;

// Contact cell renderer - simplified with no link
const ContactCellRenderer = (props) => {
  const contactName = props.value || 'Unknown';
  
  return (
    <div 
      style={{ 
        fontSize: '0.85rem'
      }}
    >
      {contactName}
    </div>
  );
};

// Direction renderer to show arrow icons
const DirectionCellRenderer = (props) => {
  if (!props.value) return null;
  
  if (props.value.toLowerCase() === 'sent') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        paddingTop: '8px' 
      }}>
        <FiArrowLeft color="#00aaff" size={18} />
      </div>
    );
  } else {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        paddingTop: '8px'
      }}>
        <FiArrowRight color="#00ff00" size={18} />
      </div>
    );
  }
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
    
    // Add the click handlers to both buttons
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
          padding: '4px 8px',
          margin: '0 5px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          height: '22px'
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
          padding: '4px 8px',
          margin: '0 5px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          height: '22px'
        }}
      >
        <FiCheckCircle /> Add to CRM
      </div>
    </div>
  );
};

// Styled Link for Original Email
const OriginalEmailLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: #00aaff;
  text-decoration: none;
  margin-left: auto;
  font-size: 0.9rem;
  gap: 5px;
  border: 1px solid #00aaff;
  border-radius: 4px;
  padding: 6px 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 170, 255, 0.1);
    text-decoration: none;
  }
`;

// Email Modal Component
const EmailModal = ({ email, onClose, onSkip, onAddToCRM }) => {
  if (!email) return null;
  
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
  
  // Determine contact info based on direction
  const isSent = email.direction?.toLowerCase() === 'sent';
  const contactName = isSent ? email.to_name : email.from_name;
  const contactEmail = isSent ? email.to_email : email.from_email;
  const myEmail = 'simone@cimminelli.com'; // Hardcoded as requested
  
  // Create the Superhuman search URL for the original email
  const searchEmail = encodeURIComponent(contactEmail);
  const superhuman_url = `https://mail.superhuman.com/search/${searchEmail}`;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiMail style={{ marginRight: '10px' }} /> Email Details
          </ModalTitle>
          
          <OriginalEmailLink href={superhuman_url} target="_blank" rel="noopener noreferrer">
            <FiExternalLink /> Original
          </OriginalEmailLink>
          
          <ModalCloseButton onClick={onClose} style={{ marginLeft: '15px' }}>×</ModalCloseButton>
        </ModalHeader>
        
        <ModalBody>
          <EmailDetails>
            <EmailInfoItem>
              <EmailInfoLabel>
                <FiUser /> {isSent ? 'To:' : 'From:'}
              </EmailInfoLabel>
              <EmailInfoValue>
                {contactName} &lt;{contactEmail}&gt;
              </EmailInfoValue>
            </EmailInfoItem>
            
            <EmailInfoItem>
              <EmailInfoLabel>
                <FiUser /> {isSent ? 'From:' : 'To:'}
              </EmailInfoLabel>
              <EmailInfoValue>
                Simone Cimminelli &lt;{myEmail}&gt;
              </EmailInfoValue>
            </EmailInfoItem>
            
            <EmailInfoItem>
              <EmailInfoLabel>
                <FiCalendar /> Date:
              </EmailInfoLabel>
              <EmailInfoValue>
                {formatDate(email.message_timestamp)}
              </EmailInfoValue>
            </EmailInfoItem>
          </EmailDetails>
          
          <EmailSubject>
            {email.subject || '(No Subject)'}
          </EmailSubject>
          
          <EmailMessageContainer>
            <FiMessageSquare style={{ marginRight: '10px', opacity: 0.6 }} />
            {email.message_text || '(No message content)'}
          </EmailMessageContainer>
        </ModalBody>
        
        <ModalFooter>
          <ActionButton 
            onClick={() => {
              onSkip(email);
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
              onAddToCRM(email);
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

const EmailInbox = () => {
  const [emails, setEmails] = useState([]);
  const [spamEmails, setSpamEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spamLoading, setSpamLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spamError, setSpamError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [spamLoaded, setSpamLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [confirmSpam, setConfirmSpam] = useState(null);
  const navigate = useNavigate();
  
  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: '', // Empty header for Direction
      field: 'direction',
      minWidth: 50,
      width: 50,
      cellRenderer: DirectionCellRenderer,
      filter: false,
      sortable: true,
    },
    { 
      headerName: 'Contact', 
      field: 'contact_name',
      valueGetter: params => {
        if (!params.data) return '';
        // If direction is sent, use to_name, otherwise use from_name
        return params.data.direction?.toLowerCase() === 'sent' 
          ? params.data.to_name 
          : params.data.from_name;
      },
      minWidth: 100,
      width: 120,
      cellRenderer: ContactCellRenderer,
      filter: false,
      sortable: true,
    },
    { 
      headerName: 'Subject', 
      field: 'subject',
      minWidth: 230,
      cellRenderer: TooltipCellRenderer,
      filter: false,
      sortable: true,
    },
    { 
      headerName: 'Message', 
      field: 'message_text',
      cellRenderer: TooltipCellRenderer,
      minWidth: 300,
      filter: false,
      sortable: true,
    },
    { 
      headerName: 'Date', 
      field: 'message_timestamp',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
      },
      minWidth: 70,
      width: 80,
      cellStyle: { fontSize: '0.85rem' },
      filter: false,
      sortable: true,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 220,
      width: 220,
      cellRenderer: ActionCellRenderer,
      cellRendererParams: {
        onSkip: handleSpamClick,
        onAddToCRM: handleAddToCRM
      },
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
      cellClass: 'action-cell-no-click'
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true
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
  
  // Handle row click to show email details modal
  const handleRowClick = React.useCallback((event) => {
    // Check if this is a click on the action buttons
    if (event.colDef && event.colDef.headerName === 'Actions') {
      // Skip opening the modal when clicking the actions column
      return;
    }
    setSelectedEmail(event.data);
  }, []);

  // Show spam confirmation modal
  function handleSpamClick(emailData) {
    console.log('Spam button clicked:', emailData);
    setConfirmSpam(emailData);
  }
  
  // Handle marking an email as spam after confirmation
  async function handleConfirmSpam() {
    if (!confirmSpam) return;
    
    const emailData = confirmSpam;
    try {
      // Update the email record to mark it as reject
      const { error } = await supabase
        .from('email_inbox')
        .update({ 
          special_case: 'reject', 
          last_processed_at: new Date().toISOString() 
        })
        .eq('id', emailData.id);
      
      if (error) throw error;
      
      // Remove the email from the displayed list
      setEmails(emails.filter(email => email.id !== emailData.id));
      
      // Close the confirmation dialog
      setConfirmSpam(null);
      
      console.log('Email marked as spam:', emailData.id);
    } catch (err) {
      console.error('Error marking email as spam:', err);
      // You could show an error toast here
    }
  }
  
  // Handle adding email sender to CRM
  async function handleAddToCRM(emailData) {
    console.log('Add to CRM clicked:', emailData);
    try {
      // Update the email record to mark it with null special_case
      const { error } = await supabase
        .from('email_inbox')
        .update({ 
          special_case: null, 
          last_processed_at: new Date().toISOString() 
        })
        .eq('id', emailData.id);
      
      if (error) throw error;
      
      // Remove the email from the displayed list
      setEmails(emails.filter(email => email.id !== emailData.id));
      
      // Here you would typically navigate to contact creation screen or similar
      // For now we'll just log it
      console.log('Email marked for CRM processing:', emailData.id);
    } catch (err) {
      console.error('Error processing email for CRM:', err);
      // You could show an error toast here
    }
  }
  
  // Handle click on spam email item
  async function handleSpamEmailClick(spamEmail) {
    console.log('Spam email clicked:', spamEmail);
    try {
      // Find an email in email_inbox that matches this spam email
      const { data, error } = await supabase
        .from('email_inbox')
        .select('*')
        .filter('from_email', 'eq', spamEmail.email)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // If we found a matching email, show it in the modal
        setSelectedEmail(data[0]);
      } else {
        // If no matching email found, create a simplified version for display
        setSelectedEmail({
          id: `spam-${spamEmail.id || Date.now()}`,
          from_name: 'Spam Sender',
          from_email: spamEmail.email,
          to_name: 'You',
          to_email: 'your.email@example.com',
          subject: 'Spam Email',
          message_text: 'This email was marked as spam.',
          message_timestamp: spamEmail.last_modified_at || new Date().toISOString(),
          direction: 'received'
        });
      }
    } catch (err) {
      console.error('Error fetching email details for spam:', err);
    }
  }

  // Fetch emails from email_inbox table
  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch emails from the email_inbox table with special_case = 'pending_approval'
      const { data, error } = await supabase
        .from('email_inbox')
        .select('*')
        .eq('special_case', 'pending_approval')
        .order('message_timestamp', { ascending: false });
      
      if (error) throw error;
      
      console.log(`Successfully fetched ${data?.length || 0} emails`);
      
      // If no emails, set empty array and finish loading immediately
      if (!data || data.length === 0) {
        setEmails([]);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      setEmails(data || []);
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch spam emails from emails_spam table
  const fetchSpamEmails = async () => {
    try {
      setSpamLoading(true);
      setSpamError(null);
      
      // Fetch the last 25 spam emails ordered by last_modified_at
      const { data, error } = await supabase
        .from('emails_spam')
        .select('*')
        .order('last_modified_at', { ascending: false })
        .limit(25);
      
      if (error) throw error;
      
      console.log(`Successfully fetched ${data?.length || 0} spam emails`);
      
      setSpamEmails(data || []);
      setSpamLoading(false);
      setSpamLoaded(true);
    } catch (err) {
      console.error('Error fetching spam emails:', err);
      setSpamError(err.message);
      setSpamLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!dataLoaded) {
      console.log('Initiating email inbox data fetch');
      fetchEmails();
    }
    
    // Fetch spam emails independently
    if (!spamLoaded) {
      console.log('Initiating spam emails fetch');
      fetchSpamEmails();
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
      {/* Email details modal */}
      {selectedEmail && (
        <EmailModal 
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onSkip={handleSpamClick}
          onAddToCRM={handleAddToCRM}
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
                Are you sure you want to mark this email as spam?
              </p>
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '20px' 
              }}>
                <p><strong>From:</strong> {confirmSpam.direction?.toLowerCase() === 'sent' ? 
                  confirmSpam.to_name : confirmSpam.from_name}</p>
                <p><strong>Subject:</strong> {confirmSpam.subject || '(No Subject)'}</p>
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
      
      {/* Sidebar for Spam Emails */}
      <SidebarContainer>
        <SidebarTitle>Spam Emails</SidebarTitle>
        
        {spamLoading ? (
          <div style={{ padding: '10px', color: '#00ff00', textAlign: 'center', fontSize: '0.75rem' }}>
            Loading...
          </div>
        ) : spamError ? (
          <ErrorText style={{ fontSize: '0.75rem', padding: '8px' }}>Error: {spamError}</ErrorText>
        ) : spamEmails.length === 0 ? (
          <div style={{ padding: '10px', color: '#cccccc', textAlign: 'center', fontSize: '0.75rem' }}>
            No spam emails
          </div>
        ) : (
          <SpamList>
            {spamEmails.map((spam, index) => (
              <SpamItem 
                key={index} 
                onClick={() => handleSpamEmailClick(spam)}
              >
                <SpamEmail>
                  {spam.email && spam.email.length > 40 
                    ? `${spam.email.substring(0, 40)}...` 
                    : spam.email}
                </SpamEmail>
                <SpamCounter>
                  {spam.counter || 1}
                </SpamCounter>
              </SpamItem>
            ))}
          </SpamList>
        )}
      </SidebarContainer>
      
      {/* Main Content - Email Inbox */}
      <MainContainer>
        {error && <ErrorText>Error: {error}</ErrorText>}
        
        {loading !== false ? (
          <LoadingContainer>
            <LoadingText>
              {typeof loading === 'string' 
                ? loading 
                : 'Accessing Email Database...'}
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
        ) : emails.length === 0 && !error ? (
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
            <div style={{ marginBottom: '15px' }}>All records processed 😊</div>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
          </div>
        ) : (
          <div 
            className="ag-theme-alpine" 
            style={{ 
              height: 'calc(100vh - 120px)', /* Adjusted for increased row height */
              width: 'calc(100% - 15px)', /* Adjusted for left/right padding */
              overflow: 'auto', /* Add scroll if content exceeds container */
              margin: '15px 0 0 0', /* Top margin only */
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
              rowData={emails}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              rowSelection="single"
              animateRows={true}
              pagination={true}
              paginationPageSize={100} /* Show more rows per page */
              suppressCellFocus={true}
              enableCellTextSelection={true}
              rowHeight={42} /* Increased row height for better spacing */
              domLayout="autoHeight"
              paginationAutoPageSize={true} /* Auto-adjust page size to fill available height */
              sortingOrder={['desc', 'asc', null]}
              sortModel={[
                { colId: 'message_timestamp', sort: 'desc' }
              ]}
              onRowClicked={handleRowClick}
              rowStyle={{ cursor: 'pointer' }}
            />
          </div>
        )}
      </MainContainer>
    </Container>
  );
};

export default EmailInbox;
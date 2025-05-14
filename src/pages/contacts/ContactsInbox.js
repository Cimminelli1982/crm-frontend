import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { 
  FiTrash2, 
  FiCheck, 
  FiX, 
  FiAlertTriangle, 
  FiMail, 
  FiMessageSquare, 
  FiPhone, 
  FiFile, 
  FiTag,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiLink,
  FiCheckCircle
} from 'react-icons/fi';
import Modal from 'react-modal';
import toast from 'react-hot-toast';

// Styled components
const Container = styled.div`
  padding: 10px 0 0 0; /* Add just a bit of top padding */
  min-height: 100vh; /* Full viewport height */
  height: auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  
  .clickable-cell {
    cursor: pointer;
  }
  
  .ag-row {
    cursor: pointer;
  }
  
  .action-cell-no-click {
    z-index: 5;
  }
`;

const Title = styled.h1`
  color: #00ff00;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
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

const Badge = styled.span`
  display: inline-block;
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 2px 6px;
  margin-right: 3px;
  border-radius: 4px;
  font-size: 11px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 6px 10px;
  margin: 0 4px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.8;
    background-color: ${props => props.hoverBg || '#333'};
  }
`;

// Modal styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ff0000;
  }
`;

const ModalContent = styled.div`
  margin-bottom: 20px;
  color: #cccccc;
  font-size: 0.9rem;
`;

const RelatedItemsGroup = styled.div`
  background-color: #1a1a1a;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #333;
`;

const RelatedItemsTitle = styled.div`
  font-size: 0.85rem;
  color: #00ff00;
  margin-bottom: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    font-size: 16px;
  }
`;

const CheckboxContainer = styled.div`
  margin-bottom: 25px;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  color: #cccccc;
`;

const Checkbox = styled.input`
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
  appearance: none;
  border: 1px solid #00ff00;
  background: #222;
  border-radius: 3px;
  position: relative;
  
  &:checked {
    background: #00ff00;
    
    &:after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid #000;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
`;

const ContactDetail = styled.div`
  background-color: #1a1a1a;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #333;
`;

const DetailItem = styled.div`
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: #999;
  margin-right: 10px;
  font-size: 0.8rem;
`;

const DetailValue = styled.span`
  color: #cccccc;
  font-weight: normal;
`;

const WarningMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 85, 85, 0.2);
  border: 1px solid #ff5555;
  color: #ff9999;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  
  svg {
    color: #ff5555;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
`;

const ConfirmButton = styled.button`
  background-color: #ff5555;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #ff3333;
  }
  
  &:disabled {
    background-color: #772727;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: #cccccc;
  border: 1px solid #555;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;


// Cell renderer for action buttons with improved event handling
const ActionCellRenderer = (props) => {
  // Create refs for each button
  const spamButtonRef = React.useRef(null);
  const skipButtonRef = React.useRef(null);
  const crmButtonRef = React.useRef(null);
  
  React.useEffect(() => {
    // Get buttons from refs
    const spamButton = spamButtonRef.current;
    const skipButton = skipButtonRef.current;
    const crmButton = crmButtonRef.current;
    
    if (!spamButton || !skipButton || !crmButton) return;
    
    // Function to handle spam button click
    const spamClickHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      
      setTimeout(() => {
        if (props.onSpam) {
          props.onSpam(props.data);
        }
      }, 10);
      
      return false;
    };
    
    // Function to handle skip button click
    const skipClickHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      
      setTimeout(() => {
        if (props.onSkip) {
          props.onSkip(props.data);
        }
      }, 10);
      
      return false;
    };
    
    // Function to handle Add to CRM button click
    const crmClickHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      
      setTimeout(() => {
        if (props.onAddToCRM) {
          props.onAddToCRM(props.data);
        }
      }, 10);
      
      return false;
    };
    
    // Add the click handlers
    spamButton.addEventListener('click', spamClickHandler, true);
    skipButton.addEventListener('click', skipClickHandler, true);
    crmButton.addEventListener('click', crmClickHandler, true);
    
    // Cleanup - remove the handlers when component unmounts
    return () => {
      spamButton.removeEventListener('click', spamClickHandler, true);
      skipButton.removeEventListener('click', skipClickHandler, true);
      crmButton.removeEventListener('click', crmClickHandler, true);
    };
  }, [props]);
  
  const buttonStyle = {
    backgroundColor: '#222',
    padding: '3px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    height: '18px',
    lineHeight: '1',
    boxSizing: 'border-box',
    margin: '0 3px'
  };
  
  return (
    <div
      className="action-buttons-container"
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        padding: '8px 0 0 0',
        margin: 0,
        boxSizing: 'border-box'
      }}
      onClick={(e) => { 
        e.stopPropagation(); 
        e.preventDefault();
      }}
    >
      <div 
        ref={spamButtonRef}
        style={{
          ...buttonStyle,
          color: '#ff5555',
          border: '1px solid #ff5555',
        }}
      >
        <FiTrash2 size={10} /> Spam
      </div>
      
      <div 
        ref={skipButtonRef}
        style={{
          ...buttonStyle,
          color: '#ff9900',
          border: '1px solid #ff9900',
        }}
      >
        <FiX size={10} /> Skip
      </div>
      
      <div 
        ref={crmButtonRef}
        style={{
          ...buttonStyle,
          color: '#55ff55',
          border: '1px solid #55ff55',
        }}
      >
        <FiCheckCircle size={10} /> Add to CRM
      </div>
    </div>
  );
};

// Configure Modal for React
Modal.setAppElement('#root');

const ContactsInbox = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true); // Can be true/false or a string message
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false); // Flag to prevent multiple data loads
  const [showGrid, setShowGrid] = useState(false); // Flag to control grid visibility with delay
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [confirmSkip, setConfirmSkip] = useState(null);
  const [associatedData, setAssociatedData] = useState({
    chatCount: 0,
    contactChatsCount: 0,
    interactionsCount: 0,
    emailsCount: 0,
    emailParticipantsCount: 0,
    emailThreadsCount: 0,
    tagsCount: 0,
    citiesCount: 0,
    companiesCount: 0,
    notesCount: 0,
    attachmentsCount: 0,
    contactEmailsCount: 0,
    contactMobilesCount: 0,
    dealsCount: 0,
    meetingsCount: 0,
    investmentsCount: 0,
    kitCount: 0,
    lastInteraction: null
  });
  const [selectedItems, setSelectedItems] = useState({
    deleteChat: true,
    deleteContactChats: true,
    deleteInteractions: true,
    deleteEmails: true,
    deleteEmailParticipants: true,
    deleteEmailThreads: true,
    deleteTags: true,
    deleteCities: true, 
    deleteCompanies: true,
    deleteNotes: true,
    deleteAttachments: true,
    deleteContactEmails: true,
    deleteContactMobiles: true,
    deleteDeals: true,
    deleteMeetings: true,
    deleteInvestments: true,
    deleteKit: true,
    addToSpam: true,
    addMobileToSpam: true
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const navigate = useNavigate();
  
  // Handler function to open the modal
  const handleOpenDeleteModal = async (contactData) => {
    setContactToDelete(contactData);
    
    try {
      // Get counts of associated records and last interaction details
      const [
        chatResult,
        contactChatsResult,
        interactionsResult, 
        emailsResult,
        emailParticipantsResult,
        emailThreadsResult,
        tagsResult,
        citiesResult,
        companiesResult,
        notesResult,
        attachmentsResult,
        contactEmailsResult,
        contactMobilesResult,
        dealsResult,
        meetingsResult,
        investmentsResult,
        kitResult,
        lastInteractionResult
      ] = await Promise.all([
        // Get chat count
        supabase
          .from('chat')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get contact_chats count
        supabase
          .from('contact_chats')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get interactions count
        supabase
          .from('interactions')
          .select('interaction_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get emails count (where contact is sender)
        supabase
          .from('emails')
          .select('email_id', { count: 'exact', head: true })
          .eq('sender_contact_id', contactData.contact_id),
        
        // Get email_participants count
        supabase
          .from('email_participants')
          .select('participant_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get contact_email_threads count
        supabase
          .from('contact_email_threads')
          .select('email_thread_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get tags count
        supabase
          .from('contact_tags')
          .select('entry_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get cities count
        supabase
          .from('contact_cities')
          .select('entry_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
        
        // Get companies count
        supabase
          .from('contact_companies')
          .select('contact_companies_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get notes count
        supabase
          .from('notes_contacts')
          .select('note_contact_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get attachments count
        supabase
          .from('attachments')
          .select('attachment_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get contact emails count
        supabase
          .from('contact_emails')
          .select('email_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get contact mobiles count
        supabase
          .from('contact_mobiles')
          .select('mobile_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get deals count
        supabase
          .from('deals_contacts')
          .select('deals_contacts_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get meetings count
        supabase
          .from('meeting_contacts')
          .select('meeting_contact_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get investments count
        supabase
          .from('investments_contacts')
          .select('investments_contacts_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get keep in touch count
        supabase
          .from('keep_in_touch')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),
          
        // Get the last interaction for this contact
        supabase
          .from('interactions')
          .select('interaction_id, interaction_type, direction, interaction_date, summary')
          .eq('contact_id', contactData.contact_id)
          .order('interaction_date', { ascending: false })
          .limit(1)
      ]);
      
      // Update the counts and last interaction
      setAssociatedData({
        chatCount: chatResult.count || 0,
        contactChatsCount: contactChatsResult.count || 0,
        interactionsCount: interactionsResult.count || 0,
        emailsCount: emailsResult.count || 0,
        emailParticipantsCount: emailParticipantsResult.count || 0,
        emailThreadsCount: emailThreadsResult.count || 0,
        tagsCount: tagsResult.count || 0,
        citiesCount: citiesResult.count || 0,
        companiesCount: companiesResult.count || 0,
        notesCount: notesResult.count || 0,
        attachmentsCount: attachmentsResult.count || 0,
        contactEmailsCount: contactEmailsResult.count || 0,
        contactMobilesCount: contactMobilesResult.count || 0,
        dealsCount: dealsResult.count || 0,
        meetingsCount: meetingsResult.count || 0,
        investmentsCount: investmentsResult.count || 0,
        kitCount: kitResult.count || 0,
        lastInteraction: lastInteractionResult.data && lastInteractionResult.data.length > 0 ? 
          lastInteractionResult.data[0] : null
      });
      
      // Open the modal
      setDeleteModalOpen(true);
    } catch (err) {
      console.error('Error fetching associated data counts:', err);
      setError(`Failed to get related record counts: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Handler for checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handler function for spam button - shows deletion modal
  const handleSpamContact = (contactData) => {
    handleOpenDeleteModal(contactData);
  };
  
  // Handler function for skip button - shows confirmation dialog
  const handleSkipContact = (contactData) => {
    setConfirmSkip(contactData);
  };
  
  // Handler for confirming skip action
  const handleConfirmSkip = async () => {
    if (!confirmSkip) return;
    
    const contactData = confirmSkip;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contactData.contact_id);
        
      if (error) throw error;
      
      // Remove the contact from the list
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.contact_id !== contactData.contact_id)
      );
      
      // Close the confirmation dialog
      setConfirmSkip(null);
      
      setLoading(false);
      console.log('Contact marked as Skip:', contactData.contact_id);
    } catch (err) {
      console.error('Error marking contact as Skip:', err);
      setError(`Failed to mark contact as Skip: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handler function for Add to CRM button - redirect to the workflow page
  const handleAddToCRM = (contactData) => {
    // Navigate to the workflow page for this contact through the inbox page
    navigate(`/inbox?source=category`);
    // Store the contact_id to process in session storage
    sessionStorage.setItem('workflow_contact_id', contactData.contact_id);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Add email to emails_spam table if selected and email exists
      if (selectedItems.addToSpam && contactToDelete.email) {
        const { error: spamError } = await supabase
          .from('emails_spam')
          .insert([{ 
            email: contactToDelete.email,
            counter: 1
          }]);
        
        if (spamError) {
          console.error('Error adding to spam list:', spamError);
        }
      }
      
      // Add mobile to whatsapp_spam table if selected and mobile exists
      if (selectedItems.addMobileToSpam && contactToDelete.mobile) {
        const { error: whatsappSpamError } = await supabase
          .from('whatsapp_spam')
          .insert([{ 
            mobile_number: contactToDelete.mobile,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          }]);
        
        if (whatsappSpamError) {
          console.error('Error adding to WhatsApp spam list:', whatsappSpamError);
        }
      }
      
      // Delete associated records based on selections
      const promises = [];
      
      // 1. Delete chat records if selected
      if (selectedItems.deleteChat && associatedData.chatCount > 0) {
        promises.push(
          supabase
            .from('chat')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 2. Delete interaction records if selected
      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(
          supabase
            .from('interactions')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 3. Delete emails and associated records if selected
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        // First get all email IDs
        const { data: emailsData } = await supabase
          .from('emails')
          .select('email_id')
          .eq('sender_contact_id', contactToDelete.contact_id);
        
        if (emailsData && emailsData.length > 0) {
          const emailIds = emailsData.map(e => e.email_id);
          
          // Delete email participants
          promises.push(
            supabase
              .from('email_participants')
              .delete()
              .in('email_id', emailIds)
          );
          
          // Delete emails
          promises.push(
            supabase
              .from('emails')
              .delete()
              .eq('sender_contact_id', contactToDelete.contact_id)
          );
        }
      }

      // 4. Delete email threads if selected
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(
          supabase
            .from('contact_email_threads')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 5. Delete contact emails if selected
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(
          supabase
            .from('contact_emails')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 6. Delete contact mobiles if selected
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(
          supabase
            .from('contact_mobiles')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 7. Delete note relationships if selected
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(
          supabase
            .from('notes_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 8. Delete attachments if selected
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(
          supabase
            .from('attachments')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 9. Delete tags if selected
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(
          supabase
            .from('contact_tags')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 10. Delete cities if selected
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(
          supabase
            .from('contact_cities')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 11. Delete companies if selected
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(
          supabase
            .from('contact_companies')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 12. Delete contact chats if selected
      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        promises.push(
          supabase
            .from('contact_chats')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 13. Delete WhatsApp data if selected and present
      if (selectedItems.deleteWhatsapp && contactToDelete.mobile && associatedData.whatsappCount > 0) {
        promises.push(
          supabase
            .from('whatsapp_inbox')
            .delete()
            .eq('contact_number', contactToDelete.mobile)
        );
      }
      
      // 14. Delete deals if selected
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(
          supabase
            .from('deals_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 15. Delete meetings if selected
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(
          supabase
            .from('meeting_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 16. Delete investments if selected
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(
          supabase
            .from('investments_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 17. Delete keep in touch if selected
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(
          supabase
            .from('keep_in_touch')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // Execute all delete operations in parallel
      await Promise.all(promises);
      
      // Finally, delete the contact
      const { error: contactError } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);
      
      if (contactError) throw contactError;
      
      // Remove the contact from the list
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.contact_id !== contactToDelete.contact_id)
      );
      
      // Reset and close modal
      setDeleteModalOpen(false);
      setContactToDelete(null);
      setIsDeleting(false);
      
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(`Failed to delete contact: ${err.message || 'Unknown error'}`);
      setIsDeleting(false);
    }
  };
  
  // Simpler name formatter function
  const formatName = (params) => {
    if (!params.data) return '';
    const firstName = params.data.first_name || '';
    const lastName = params.data.last_name || '';
    return `${firstName} ${lastName}`.trim() || '(No name)';
  };

  // Column definitions with improved display of related data
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Name', 
      field: 'name',
      valueGetter: formatName,
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: false,
      sortable: true,
      pinned: 'left'
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 110,
      width: 110,
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
      minWidth: 120,
      width: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: false,
      sortable: true,
      cellRenderer: (params) => {
        const value = params.value || '-';
        if (value === '-') return value;
        return <span style={{ color: '#cccccc' }}>{value}</span>;
      }
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
      cellRenderer: (params) => {
        const value = params.value || '-';
        if (value === '-') return value;
        return <span style={{ color: '#cccccc' }}>{value}</span>;
      }
    },
    {
      headerName: 'Actions',
      width: 260,
      minWidth: 260,
      field: 'actions',
      cellRenderer: ActionCellRenderer,
      cellRendererParams: {
        onSpam: handleSpamContact,
        onSkip: handleSkipContact,
        onAddToCRM: handleAddToCRM
      },
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
      cellClass: 'action-cell-no-click'
    }
  ], [handleSpamContact, handleSkipContact, handleAddToCRM]);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    cellClass: 'clickable-cell'
  }), []);

  // Grid ready event handler - wrapped in React.useCallback to prevent recreation
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    // Wait for a tick to ensure grid is properly initialized
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Row clicked handler - wrapped in React.useCallback to prevent recreation
  const handleRowClicked = React.useCallback((params) => {
    // Always check if this is coming from the actions column
    if (params.column && params.column.colId === 'actions') {
      console.log('Ignoring click on actions cell');
      return;
    }
    
    console.log('Row clicked, navigating to workflow page', params.data);
    
    // Navigate to the workflow page for this contact
    if (params.data && params.data.contact_id) {
      // Use the same approach as the Add to CRM button
      navigate(`/inbox?source=category`);
      // Store the contact_id to process in session storage
      sessionStorage.setItem('workflow_contact_id', params.data.contact_id);
    }
  }, [navigate]);

  // Fetch only basic contact data - we'll load related data separately 
  // to improve initial load performance
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
      
      // Calculate date 60 days ago
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const formattedDate = sixtyDaysAgo.toISOString();
      
      // Get all contacts count first with retry
      const { count, error: countError } = await retrySupabaseRequest(async () => {
        return supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'Inbox')
          .gte('last_interaction_at', formattedDate);
      });
        
      if (countError) throw countError;
      console.log(`Total Inbox contacts: ${count}`);
      
      // If count is 0, set empty array and finish loading
      if (count === 0) {
        setContacts([]);
        setLoading(false);
        setDataLoaded(true);
        setShowGrid(true);
        return;
      }
      
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
              score, 
              last_interaction_at,
              created_at
            `)
            .eq('category', 'Inbox')
            .gte('last_interaction_at', formattedDate)
            .order('last_interaction_at', { ascending: false })
            .range(from, to);
        });
      };
      
      // Fetch all contacts in batches of 500 (smaller batches for faster response)
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
      
      // Get the contact data - now let's fetch the related data
      const contactsData = allContacts;
      
      // Guard against empty results
      if (!contactsData || contactsData.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }
      
      // Get all contact IDs to fetch related data
      const contactIds = contactsData.map(contact => contact.contact_id).filter(Boolean);
      
      // Guard against empty contact IDs
      if (contactIds.length === 0) {
        setContacts(contactsData);
        setLoading(false);
        return;
      }
      
      setLoading('Loading related data (companies, tags, cities)...');
      
      // Function to fetch related data in batches with optimal batch size
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
      
      // Function to fetch details in smaller batches 
      const fetchDetailsBatch = async (entityName, table, idField, ids, fields, batchSize = 100) => {
        console.log(`Fetching ${entityName} details for ${ids.length} entities in batches of ${batchSize}`);
        let allData = [];
        
        for (let i = 0; i < ids.length; i += batchSize) {
          const batchIds = ids.slice(i, i + batchSize);
          
          try {
            const { data, error } = await supabase
              .from(table)
              .select(fields)
              .in(idField, batchIds);
            
            if (error) throw error;
            allData = [...allData, ...(data || [])];
            
            // Update progress
            setLoading(`Loading ${entityName} details... ${Math.min(i + batchSize, ids.length)}/${ids.length}`);
          } catch (err) {
            console.error(`Error fetching batch of ${entityName} details:`, err);
            // Continue with next batch instead of failing completely
          }
        }
        
        return { data: allData };
      };
      
      try {
        // Fetch all related data in batches
        const [
          companyRelationships,
          tagRelationships,
          cityRelationships,
          emailsData,
          mobilesData
        ] = await Promise.all([
          // 1. Fetch company relationships
          fetchRelatedDataBatch('companies', 
            supabase.from('contact_companies').select('contact_id, company_id'), 
            contactIds
          ),
          
          // 2. Fetch tag relationships
          fetchRelatedDataBatch('tags', 
            supabase.from('contact_tags').select('contact_id, tag_id'), 
            contactIds
          ),
          
          // 3. Fetch city relationships
          fetchRelatedDataBatch('cities', 
            supabase.from('contact_cities').select('contact_id, city_id'), 
            contactIds
          ),
            
          // 4. Fetch emails (with primary flag)
          fetchRelatedDataBatch('emails', 
            supabase.from('contact_emails').select('contact_id, email, is_primary'), 
            contactIds
          ),
            
          // 5. Fetch mobile numbers (with primary flag)
          fetchRelatedDataBatch('mobiles', 
            supabase.from('contact_mobiles').select('contact_id, mobile, is_primary'), 
            contactIds
          )
        ]);
        
        // Extract the unique related IDs for each type
        const companyIds = [...new Set(
          (companyRelationships.data || [])
            .map(rel => rel.company_id)
            .filter(Boolean)
        )];
        
        const tagIds = [...new Set(
          (tagRelationships.data || [])
            .map(rel => rel.tag_id)
            .filter(Boolean)
        )];
        
        const cityIds = [...new Set(
          (cityRelationships.data || [])
            .map(rel => rel.city_id)
            .filter(Boolean)
        )];
        
        setLoading('Loading details for related data...');
        
        // Fetch the details for each type of relationship in parallel
        const [
          companiesData,
          tagsData,
          citiesData
        ] = await Promise.all([
          // Only fetch if we have IDs
          companyIds.length > 0 
            ? fetchDetailsBatch('companies', 'companies', 'company_id', companyIds, 'company_id, name, website')
            : { data: [] },
          
          tagIds.length > 0
            ? fetchDetailsBatch('tags', 'tags', 'tag_id', tagIds, 'tag_id, name')
            : { data: [] },
          
          cityIds.length > 0
            ? fetchDetailsBatch('cities', 'cities', 'city_id', cityIds, 'city_id, name')
            : { data: [] }
        ]);
        
        setLoading('Processing data and preparing contacts...');
        
        // Map all the related data to each contact
        const contactsWithRelations = contactsData.map((contact, index) => {
          if (!contact || !contact.contact_id) {
            console.warn('Skipping invalid contact:', contact);
            return null;
          }
          
          // Update progress for very large data sets
          if (index > 0 && index % 1000 === 0) {
            setLoading(`Processing contacts... ${index}/${contactsData.length}`);
          }
          
          // Find all relationships for this contact
          const contactCompanyRelationships = (companyRelationships.data || [])
            .filter(rel => rel?.contact_id === contact.contact_id);
          
          const contactTagRelationships = (tagRelationships.data || [])
            .filter(rel => rel?.contact_id === contact.contact_id);
            
          const contactCityRelationships = (cityRelationships.data || [])
            .filter(rel => rel?.contact_id === contact.contact_id);
            
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
          
          // Map relationships to actual entity objects
          const companies = contactCompanyRelationships.map(rel => {
            if (!rel?.company_id) return null;
            const company = companiesData.data?.find(c => c?.company_id === rel.company_id);
            return company ? {
              id: company.company_id,
              name: company.name || 'Unknown',
              website: company.website
            } : null;
          }).filter(Boolean);
          
          const tags = contactTagRelationships.map(rel => {
            if (!rel?.tag_id) return null;
            const tag = tagsData.data?.find(t => t?.tag_id === rel.tag_id);
            return tag ? {
              id: tag.tag_id,
              name: tag.name || 'Unknown Tag'
            } : null;
          }).filter(Boolean);
          
          const cities = contactCityRelationships.map(rel => {
            if (!rel?.city_id) return null;
            const city = citiesData.data?.find(c => c?.city_id === rel.city_id);
            return city ? {
              id: city.city_id,
              name: city.name || 'Unknown Location'
            } : null;
          }).filter(Boolean);
          
          return {
            ...contact,
            id: contact.contact_id, // Add id as alias for contact_id for compatibility
            email: email || null,
            mobile: mobile || null,
            companies: companies || [],
            tags: tags || [],
            cities: cities || []
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
          id: contact.contact_id,
          companies: [],
          tags: [],
          cities: []
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

  // Fetch data ONLY on component mount (empty dependency array)
  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!dataLoaded) {
      console.log('Initiating data fetch');
      fetchContacts();
    }
  }, [dataLoaded]);
  
  // Separate effect for window resize
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
      {error && <ErrorText>Error: {error}</ErrorText>}
      
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
          />
        </div>
      )}
      
      {/* Skip confirmation modal */}
      <Modal
        isOpen={confirmSkip !== null}
        onRequestClose={() => setConfirmSkip(null)}
        shouldCloseOnOverlayClick={false}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px',
            maxWidth: '400px',
            width: '90%',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            color: '#e0e0e0',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        {confirmSkip && (
          <>
            <ModalHeader>
              <h2 style={{ color: '#ff9900' }}>Confirm Skip</h2>
              <CloseButton onClick={() => setConfirmSkip(null)} disabled={loading}>
                <FiX />
              </CloseButton>
            </ModalHeader>
            
            <div style={{ margin: '15px 0' }}>
              <p style={{ marginBottom: '20px' }}>
                Are you sure you want to mark this contact as "Skip"?
              </p>
              
              <ContactDetail>
                <DetailItem>
                  <DetailValue>
                    {confirmSkip.first_name} {confirmSkip.last_name}
                    {confirmSkip.email ? ` (${confirmSkip.email})` : 
                     confirmSkip.mobile ? ` (${confirmSkip.mobile})` : ''}
                  </DetailValue>
                </DetailItem>
              </ContactDetail>
            </div>
            
            <ButtonGroup>
              <CancelButton onClick={() => setConfirmSkip(null)} disabled={loading}>
                Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmSkip}
                disabled={loading}
                style={{ backgroundColor: '#ff9900' }}
              >
                {loading ? 'Processing...' : 'Mark as Skip'}
              </ConfirmButton>
            </ButtonGroup>
          </>
        )}
      </Modal>
      
      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        shouldCloseOnOverlayClick={false}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px',
            maxWidth: '600px',
            width: '90%',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            color: '#e0e0e0',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <ModalHeader>
          <h2>Delete Contact and Associated Data</h2>
          <CloseButton onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        {contactToDelete && (
          <>
            <ContactDetail>
              <DetailItem>
                <DetailValue>
                  {contactToDelete.first_name} {contactToDelete.last_name}
                  {contactToDelete.email ? ` (${contactToDelete.email})` : 
                   contactToDelete.mobile ? ` (${contactToDelete.mobile})` : ''}
                </DetailValue>
              </DetailItem>
            </ContactDetail>
            
            
            <DetailItem style={{ marginTop: '15px', marginBottom: '15px' }}>
              <DetailLabel>Last Interaction:</DetailLabel>
              <DetailValue>
                {associatedData.lastInteraction ? 
                  associatedData.lastInteraction.summary : 
                  'None'}
              </DetailValue>
            </DetailItem>
            
            <ModalContent>
              Select which items to delete:
            </ModalContent>
            
            <CheckboxContainer>
              <CheckboxGroup>
                {/* Only show checkboxes for items that exist */}
                {associatedData.interactionsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteInteractions" 
                      name="deleteInteractions"
                      checked={selectedItems.deleteInteractions}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteInteractions">Interactions ({associatedData.interactionsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.emailsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteEmails" 
                      name="deleteEmails"
                      checked={selectedItems.deleteEmails}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmails">Emails ({associatedData.emailsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.emailParticipantsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteEmailParticipants" 
                      name="deleteEmailParticipants"
                      checked={selectedItems.deleteEmailParticipants}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmailParticipants">Email Participants ({associatedData.emailParticipantsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.emailThreadsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteEmailThreads" 
                      name="deleteEmailThreads"
                      checked={selectedItems.deleteEmailThreads}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmailThreads">Email Threads ({associatedData.emailThreadsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.contactEmailsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteContactEmails" 
                      name="deleteContactEmails"
                      checked={selectedItems.deleteContactEmails}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactEmails">Email Addresses ({associatedData.contactEmailsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.contactMobilesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteContactMobiles" 
                      name="deleteContactMobiles"
                      checked={selectedItems.deleteContactMobiles}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactMobiles">Mobile Numbers ({associatedData.contactMobilesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.chatCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteChat" 
                      name="deleteChat"
                      checked={selectedItems.deleteChat}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteChat">Chat messages ({associatedData.chatCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.contactChatsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteContactChats" 
                      name="deleteContactChats"
                      checked={selectedItems.deleteContactChats}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactChats">Chat Links ({associatedData.contactChatsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.notesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteNotes" 
                      name="deleteNotes"
                      checked={selectedItems.deleteNotes}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteNotes">Notes ({associatedData.notesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.attachmentsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteAttachments" 
                      name="deleteAttachments"
                      checked={selectedItems.deleteAttachments}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteAttachments">Attachments ({associatedData.attachmentsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.tagsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteTags" 
                      name="deleteTags"
                      checked={selectedItems.deleteTags}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteTags">Tags ({associatedData.tagsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.citiesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteCities" 
                      name="deleteCities"
                      checked={selectedItems.deleteCities}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteCities">Cities ({associatedData.citiesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.companiesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteCompanies" 
                      name="deleteCompanies"
                      checked={selectedItems.deleteCompanies}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteCompanies">Companies ({associatedData.companiesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.dealsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteDeals" 
                      name="deleteDeals"
                      checked={selectedItems.deleteDeals}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteDeals">Deals ({associatedData.dealsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.meetingsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteMeetings" 
                      name="deleteMeetings"
                      checked={selectedItems.deleteMeetings}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteMeetings">Meetings ({associatedData.meetingsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.investmentsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteInvestments" 
                      name="deleteInvestments"
                      checked={selectedItems.deleteInvestments}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteInvestments">Investments ({associatedData.investmentsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.kitCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteKit" 
                      name="deleteKit"
                      checked={selectedItems.deleteKit}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteKit">Keep In Touch ({associatedData.kitCount})</label>
                  </CheckboxItem>
                )}
                
                {contactToDelete.mobile && associatedData.whatsappCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteWhatsapp" 
                      name="deleteWhatsapp"
                      checked={selectedItems.deleteWhatsapp}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteWhatsapp">WhatsApp Data ({associatedData.whatsappCount})</label>
                  </CheckboxItem>
                )}
                
                {contactToDelete.email && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="addToSpam" 
                      name="addToSpam"
                      checked={selectedItems.addToSpam}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="addToSpam">Add email to spam list</label>
                  </CheckboxItem>
                )}
                
                {contactToDelete.mobile && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="addMobileToSpam" 
                      name="addMobileToSpam"
                      checked={selectedItems.addMobileToSpam}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="addMobileToSpam">Add mobile to WhatsApp spam list</label>
                  </CheckboxItem>
                )}
              </CheckboxGroup>
            </CheckboxContainer>
            
            <ButtonGroup>
              <CancelButton 
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <FiX /> Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : (
                  <>
                    <FiTrash2 /> Delete Contact
                  </>
                )}
              </ConfirmButton>
            </ButtonGroup>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default ContactsInbox;
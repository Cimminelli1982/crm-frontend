import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { 
  FiTrash2, 
  FiX, 
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Setup Modal for React
Modal.setAppElement('#root');

// Styled components
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

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
  min-height: 42px;
`;

const Tab = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  color: ${props => props.$isActive ? '#00ff00' : '#ccc'};
  border-bottom: 2px solid ${props => props.$isActive ? '#00ff00' : 'transparent'};
  font-weight: ${props => props.$isActive ? 'bold' : 'normal'};
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
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

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  position: absolute;
  bottom: 25px;
  right: 25px;
  width: calc(100% - 50px);
`;

const ConfirmButton = styled.button`
  background-color: ${props => props.bgColor || '#ff5555'};
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
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const WarningMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 85, 85, 0.2);
  border: 1px solid #ff5555;
  color: #ff9999;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 70px;
  
  svg {
    color: #ff5555;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
`;

const LoadingMessage = styled.div`
  color: #00ff00;
  text-align: center;
  margin: 20px 0;
`;

const DeleteOrSkipModal = ({ 
  isOpen, 
  onClose, 
  contactData, 
  onDeleteComplete, 
  onSkipComplete
}) => {
  const [activeTab, setActiveTab] = useState('delete');
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Fetch associated data when a contact is selected
  useEffect(() => {
    if (activeTab === 'delete' && contactData && isOpen) {
      fetchAssociatedData();
    }
  }, [contactData, isOpen, activeTab]);

  // Reset the active tab when the modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('delete');
    }
  }, [isOpen]);
  
  // Handler for checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Fetch associated data for a contact
  const fetchAssociatedData = async () => {
    if (!contactData) return;
    
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
    } catch (err) {
      console.error('Error fetching associated data counts:', err);
      toast.error(`Failed to get related record counts: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle the delete confirmation
  const handleConfirmDelete = async () => {
    if (!contactData) return;
    
    try {
      setIsProcessing(true);
      
      // Add email to emails_spam table if selected and email exists
      if (selectedItems.addToSpam && contactData.email) {
        const { error: spamError } = await supabase
          .from('emails_spam')
          .insert([{ 
            email: contactData.email,
            counter: 1
          }]);
        
        if (spamError) {
          console.error('Error adding to spam list:', spamError);
        }
      }
      
      // Add mobile to whatsapp_spam table if selected and mobile exists
      if (selectedItems.addMobileToSpam && contactData.mobile) {
        const { error: whatsappSpamError } = await supabase
          .from('whatsapp_spam')
          .insert([{ 
            mobile_number: contactData.mobile,
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
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 2. Delete interaction records if selected
      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(
          supabase
            .from('interactions')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 3. Delete emails and associated records if selected
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        // First get all email IDs
        const { data: emailsData } = await supabase
          .from('emails')
          .select('email_id')
          .eq('sender_contact_id', contactData.contact_id);
        
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
              .eq('sender_contact_id', contactData.contact_id)
          );
        }
      }

      // 4. Delete email threads if selected
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(
          supabase
            .from('contact_email_threads')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 5. Delete contact emails if selected
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(
          supabase
            .from('contact_emails')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 6. Delete contact mobiles if selected
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(
          supabase
            .from('contact_mobiles')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 7. Delete note relationships if selected
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(
          supabase
            .from('notes_contacts')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 8. Delete attachments if selected
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(
          supabase
            .from('attachments')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 9. Delete tags if selected
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(
          supabase
            .from('contact_tags')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 10. Delete cities if selected
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(
          supabase
            .from('contact_cities')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 11. Delete companies if selected
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(
          supabase
            .from('contact_companies')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 12. Delete contact chats if selected
      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        promises.push(
          supabase
            .from('contact_chats')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 13. Delete WhatsApp data if selected and present
      if (selectedItems.deleteWhatsapp && contactData.mobile && associatedData.whatsappCount > 0) {
        promises.push(
          supabase
            .from('whatsapp_inbox')
            .delete()
            .eq('contact_number', contactData.mobile)
        );
      }
      
      // 14. Delete deals if selected
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(
          supabase
            .from('deals_contacts')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 15. Delete meetings if selected
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(
          supabase
            .from('meeting_contacts')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 16. Delete investments if selected
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(
          supabase
            .from('investments_contacts')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // 17. Delete keep in touch if selected
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(
          supabase
            .from('keep_in_touch')
            .delete()
            .eq('contact_id', contactData.contact_id)
        );
      }
      
      // Execute all delete operations in parallel
      await Promise.all(promises);
      
      // Finally, delete the contact
      const { error: contactError } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactData.contact_id);
      
      if (contactError) throw contactError;
      
      // Reset and close modal
      setIsProcessing(false);
      onClose();
      
      // Call the callback to notify parent component
      if (onDeleteComplete) {
        onDeleteComplete(contactData.contact_id);
      }
      
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error(`Failed to delete contact: ${err.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  // Handle the skip confirmation
  const handleConfirmSkip = async () => {
    if (!contactData) return;
    
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contactData.contact_id);
        
      if (error) throw error;
      
      // Reset and close modal
      setIsProcessing(false);
      onClose();
      
      // Call the callback to notify parent component
      if (onSkipComplete) {
        onSkipComplete(contactData.contact_id);
      }
      
    } catch (err) {
      console.error('Error marking contact as Skip:', err);
      toast.error(`Failed to mark contact as Skip: ${err.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  // Render the delete tab content
  const renderDeleteTab = () => {
    return (
      <>
        {contactData && (
          <>
            <ContactDetail>
              <DetailItem>
                <DetailValue>
                  {contactData.first_name} {contactData.last_name}
                  {contactData.email ? ` (${contactData.email})` : 
                   contactData.mobile ? ` (${contactData.mobile})` : ''}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
                    />
                    <label htmlFor="deleteKit">Keep In Touch ({associatedData.kitCount})</label>
                  </CheckboxItem>
                )}
                
                {contactData.mobile && associatedData.whatsappCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteWhatsapp" 
                      name="deleteWhatsapp"
                      checked={selectedItems.deleteWhatsapp}
                      onChange={handleCheckboxChange}
                      disabled={isProcessing}
                    />
                    <label htmlFor="deleteWhatsapp">WhatsApp Data ({associatedData.whatsappCount})</label>
                  </CheckboxItem>
                )}
                
                {contactData.email && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="addToSpam" 
                      name="addToSpam"
                      checked={selectedItems.addToSpam}
                      onChange={handleCheckboxChange}
                      disabled={isProcessing}
                    />
                    <label htmlFor="addToSpam">Add email to spam list</label>
                  </CheckboxItem>
                )}
                
                {contactData.mobile && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="addMobileToSpam" 
                      name="addMobileToSpam"
                      checked={selectedItems.addMobileToSpam}
                      onChange={handleCheckboxChange}
                      disabled={isProcessing}
                    />
                    <label htmlFor="addMobileToSpam">Add mobile to WhatsApp spam list</label>
                  </CheckboxItem>
                )}
              </CheckboxGroup>
            </CheckboxContainer>
            
            <WarningMessage>
              <FiAlertTriangle />
              <div>Warning: This action will permanently delete the contact and all selected associated data.</div>
            </WarningMessage>
                        
            <ButtonGroup>
              <CancelButton 
                onClick={onClose}
                disabled={isProcessing}
              >
                <FiX /> Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                bgColor="#ff5555"
              >
                {isProcessing ? 'Deleting...' : (
                  <>
                    <FiTrash2 /> Delete Contact
                  </>
                )}
              </ConfirmButton>
            </ButtonGroup>
          </>
        )}
      </>
    );
  };
  
  // Render the skip tab content
  const renderSkipTab = () => {
    return (
      <>
        {contactData && (
          <>
            <ContactDetail>
              <DetailItem>
                <DetailValue>
                  {contactData.first_name} {contactData.last_name}
                  {contactData.email ? ` (${contactData.email})` : 
                   contactData.mobile ? ` (${contactData.mobile})` : ''}
                </DetailValue>
              </DetailItem>
            </ContactDetail>
            
            <ModalContent>
              <p style={{ marginBottom: '20px' }}>
                Are you sure you want to mark this contact as "Skip"?
              </p>
              <p style={{ marginBottom: '70px' }}>
                This will move the contact to the "Skip" category, and it will no longer appear in the main inbox.
              </p>
            </ModalContent>
            
            <ButtonGroup>
              <CancelButton 
                onClick={onClose}
                disabled={isProcessing}
              >
                <FiX /> Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmSkip}
                disabled={isProcessing}
                bgColor="#ff9900"
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <FiCheckCircle /> Mark as Skip
                  </>
                )}
              </ConfirmButton>
            </ButtonGroup>
          </>
        )}
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={!isProcessing}
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
          height: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#121212',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          color: '#e0e0e0',
          zIndex: 1001,
          position: 'relative',
          paddingBottom: '80px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <ModalHeader>
        <h2>{activeTab === 'delete' ? 'Delete Contact' : 'Skip Contact'}</h2>
        <CloseButton onClick={onClose} disabled={isProcessing}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <TabContainer>
        <Tab 
          $isActive={activeTab === 'delete'} 
          onClick={() => !isProcessing && setActiveTab('delete')}
        >
          Delete (Spam)
        </Tab>
        <Tab 
          $isActive={activeTab === 'skip'} 
          onClick={() => !isProcessing && setActiveTab('skip')}
        >
          Skip
        </Tab>
      </TabContainer>
      
      {isProcessing && <LoadingMessage>Processing... Please wait</LoadingMessage>}
      
      {activeTab === 'delete' && renderDeleteTab()}
      {activeTab === 'skip' && renderSkipTab()}
    </Modal>
  );
};

export default DeleteOrSkipModal;
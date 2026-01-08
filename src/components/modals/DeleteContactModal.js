import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const DeleteContactModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onContactDeleted
}) => {
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({
    deleteInteractions: false,
    deleteEmails: false,
    deleteTags: false,
    deleteCompanies: false,
    deleteNotes: false,
    deleteKit: false,
    addToSpam: false
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (contact && isOpen) {
      loadAssociatedData();
    }
  }, [contact, isOpen]);

  const loadAssociatedData = async () => {
    if (!contact) return;

    try {
      // Load counts for all associated data
      const [interactions, emails, tags, companies, notes, kit] = await Promise.all([
        supabase.from('interactions').select('id, summary', { count: 'exact' })
          .eq('contact_id', contact.contact_id || contact.id)
          .order('interaction_date', { ascending: false })
          .limit(1),
        supabase.from('contact_emails').select('email_id', { count: 'exact' })
          .eq('contact_id', contact.contact_id || contact.id),
        supabase.from('contact_tags').select('entry_id', { count: 'exact' })
          .eq('contact_id', contact.contact_id || contact.id),
        supabase.from('contact_companies').select('contact_companies_id', { count: 'exact' })
          .eq('contact_id', contact.contact_id || contact.id),
        supabase.from('notes').select('note_id', { count: 'exact' })
          .eq('contact_id', contact.contact_id || contact.id),
        supabase.from('keep_in_touch').select('id', { count: 'exact' })
          .eq('contact_id', contact.contact_id || contact.id)
      ]);

      setAssociatedData({
        interactionsCount: interactions.count || 0,
        emailsCount: emails.count || 0,
        tagsCount: tags.count || 0,
        companiesCount: companies.count || 0,
        notesCount: notes.count || 0,
        kitCount: kit.count || 0,
        lastInteraction: interactions.data?.[0] || null
      });
    } catch (error) {
      console.error('Error loading associated data:', error);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedItems(prev => ({ ...prev, [name]: checked }));
  };

  const handleSkip = async () => {
    if (!contact) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contact.contact_id || contact.id);

      if (error) throw error;

      toast.success('Contact moved to Skip category');
      if (onContactDeleted) onContactDeleted();
      onClose();
    } catch (error) {
      console.error('Error skipping contact:', error);
      toast.error('Failed to skip contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;

    setIsDeleting(true);
    const contactId = contact.contact_id || contact.id;

    try {
      // Delete selected associated data
      const promises = [];

      if (selectedItems.deleteInteractions) {
        promises.push(supabase.from('interactions').delete().eq('contact_id', contactId));
      }
      if (selectedItems.deleteEmails) {
        promises.push(supabase.from('contact_emails').delete().eq('contact_id', contactId));
      }
      if (selectedItems.deleteTags) {
        promises.push(supabase.from('contact_tags').delete().eq('contact_id', contactId));
      }
      if (selectedItems.deleteCompanies) {
        promises.push(supabase.from('contact_companies').delete().eq('contact_id', contactId));
      }
      if (selectedItems.deleteNotes) {
        promises.push(supabase.from('notes').delete().eq('contact_id', contactId));
      }
      if (selectedItems.deleteKit) {
        promises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactId));
      }

      // Add to spam if selected
      if (selectedItems.addToSpam && contact.email) {
        promises.push(
          supabase.from('spam_emails').insert({
            email_address: contact.email,
            reason: 'User marked as spam during contact deletion'
          })
        );
      }

      // Execute all deletions
      await Promise.all(promises);

      // Delete the contact itself
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactId);

      if (error) throw error;

      toast.success('Contact deleted successfully');
      if (onContactDeleted) onContactDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!contact) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
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
          maxHeight: '80vh',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
          borderRadius: '12px',
          color: theme === 'light' ? '#111827' : '#F9FAFB',
          overflow: 'auto',
          zIndex: 9999
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998
        }
      }}
    >
      <ModalHeader>
        <h2>Delete Contact</h2>
        <CloseButton
          theme={theme}
          onClick={onClose}
          disabled={isDeleting}
        >
          <FiX />
        </CloseButton>
      </ModalHeader>

      <ModalContent theme={theme}>
        <ContactSummary>
          <strong>{contact.first_name} {contact.last_name}</strong>
          {contact.email && <div>Email: {contact.email}</div>}
          {contact.mobile && <div>Mobile: {contact.mobile}</div>}
          {associatedData.lastInteraction && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              Last interaction: {associatedData.lastInteraction.summary}
            </div>
          )}
        </ContactSummary>

        <WarningText>
          ⚠️ This action cannot be undone. Select which associated data to delete:
        </WarningText>

        <CheckboxContainer>
          <CheckboxGroup>
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

            {contact.email && (
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
          </CheckboxGroup>
        </CheckboxContainer>

        <ModalActions>
          <ActionButton
            onClick={handleSkip}
            disabled={isDeleting}
            theme={theme}
            variant="skip"
          >
            Skip Contact
          </ActionButton>
          <ActionButton
            onClick={handleDelete}
            disabled={isDeleting}
            theme={theme}
            variant="delete"
          >
            {isDeleting ? 'Deleting...' : 'Delete Contact'}
          </ActionButton>
        </ModalActions>
      </ModalContent>
    </Modal>
  );
};

// Styled Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ContactSummary = styled.div`
  padding: 15px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border-radius: 8px;
  margin-bottom: 20px;

  strong {
    display: block;
    font-size: 18px;
    margin-bottom: 8px;
  }

  div {
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    margin: 4px 0;
  }
`;

const WarningText = styled.div`
  color: #EF4444;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px;
  background: #FEE2E2;
  border-radius: 6px;
  border: 1px solid #FECACA;
`;

const CheckboxContainer = styled.div`
  margin-bottom: 24px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 14px;
    cursor: pointer;
    color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.variant === 'delete' && `
    background: #EF4444;
    color: white;

    &:hover:not(:disabled) {
      background: #DC2626;
    }
  `}

  ${props => props.variant === 'skip' && `
    background: ${props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props.theme === 'light' ? '#111827' : '#F9FAFB'};
    border: 1px solid ${props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

    &:hover:not(:disabled) {
      background: ${props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default DeleteContactModal;
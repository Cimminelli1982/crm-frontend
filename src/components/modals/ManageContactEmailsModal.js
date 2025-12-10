import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { FaEnvelope, FaPlus, FaTrash } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Styled Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
`;

const AddItemRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EmailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
`;

const EmailIcon = styled.div`
  color: #3B82F6;
  display: flex;
  align-items: center;
`;

const EmailContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmailText = styled.span`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
`;

const PrimaryBadge = styled.span`
  background: #10B981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
`;

const PrimaryRadio = styled.input`
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #10B981;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    background: #FEE2E2;
    color: #DC2626;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const DoneButton = styled.button`
  padding: 10px 20px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563EB;
  }
`;

const ManageContactEmailsModal = ({
  isOpen,
  onClose,
  contact,
  theme = 'light',
  onEmailsUpdated
}) => {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailType, setNewEmailType] = useState('personal');
  const [loading, setLoading] = useState(false);

  // Load emails when modal opens
  useEffect(() => {
    if (isOpen && contact?.contact_id) {
      loadEmails();
    }
  }, [isOpen, contact?.contact_id]);

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error loading emails:', error);
      toast.error('Failed to load emails');
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check for duplicate
    if (emails.some(e => e.email.toLowerCase() === newEmail.toLowerCase())) {
      toast.error('This email already exists');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: contact.contact_id,
          email: newEmail.trim(),
          type: newEmailType,
          is_primary: emails.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setEmails([...emails, data]);
      setNewEmail('');
      toast.success('Email added');
      onEmailsUpdated?.();
    } catch (error) {
      console.error('Error adding email:', error);
      toast.error('Failed to add email');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmail = async (emailId) => {
    const emailToRemove = emails.find(e => e.email_id === emailId);

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('email_id', emailId);

      if (error) throw error;

      const updatedEmails = emails.filter(e => e.email_id !== emailId);

      // If we removed the primary email, set the first remaining one as primary
      if (emailToRemove?.is_primary && updatedEmails.length > 0) {
        await handleSetPrimary(updatedEmails[0].email_id);
      } else {
        setEmails(updatedEmails);
      }

      toast.success('Email removed');
      onEmailsUpdated?.();
    } catch (error) {
      console.error('Error removing email:', error);
      toast.error('Failed to remove email');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (emailId) => {
    setLoading(true);
    try {
      // First, set all emails to non-primary
      await supabase
        .from('contact_emails')
        .update({ is_primary: false })
        .eq('contact_id', contact.contact_id);

      // Then set the selected one as primary
      const { error } = await supabase
        .from('contact_emails')
        .update({ is_primary: true })
        .eq('email_id', emailId);

      if (error) throw error;

      setEmails(emails.map(e => ({
        ...e,
        is_primary: e.email_id === emailId
      })));

      toast.success('Primary email updated');
      onEmailsUpdated?.();
    } catch (error) {
      console.error('Error setting primary email:', error);
      toast.error('Failed to update primary email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateType = async (emailId, newType) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_emails')
        .update({ type: newType })
        .eq('email_id', emailId);

      if (error) throw error;

      setEmails(emails.map(e =>
        e.email_id === emailId ? { ...e, type: newType } : e
      ));
      onEmailsUpdated?.();
    } catch (error) {
      console.error('Error updating email type:', error);
      toast.error('Failed to update email type');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddEmail();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: 0,
          border: 'none',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'hidden',
          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100
        }
      }}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>Manage Email Addresses</ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>
          <FiX size={20} />
        </CloseButton>
      </ModalHeader>

      <ModalBody theme={theme}>
        {/* Add New Email */}
        <AddItemRow>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add email address..."
            theme={theme}
            disabled={loading}
          />
          <Select
            value={newEmailType}
            onChange={(e) => setNewEmailType(e.target.value)}
            theme={theme}
            disabled={loading}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </Select>
          <AddButton onClick={handleAddEmail} disabled={loading || !newEmail.trim()}>
            <FaPlus size={12} />
            Add
          </AddButton>
        </AddItemRow>

        {/* Email List */}
        <EmailList>
          {emails.length > 0 ? (
            emails.map((emailData) => (
              <EmailItem key={emailData.email_id} theme={theme}>
                <EmailIcon>
                  <FaEnvelope size={14} />
                </EmailIcon>
                <EmailContent>
                  <EmailText theme={theme}>{emailData.email}</EmailText>
                  {emailData.is_primary && <PrimaryBadge>PRIMARY</PrimaryBadge>}
                </EmailContent>
                <Select
                  value={emailData.type || 'personal'}
                  onChange={(e) => handleUpdateType(emailData.email_id, e.target.value)}
                  theme={theme}
                  style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
                  disabled={loading}
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </Select>
                <PrimaryRadio
                  type="radio"
                  name="primaryEmail"
                  checked={emailData.is_primary}
                  onChange={() => handleSetPrimary(emailData.email_id)}
                  title="Set as primary"
                  disabled={loading}
                />
                <DeleteButton
                  theme={theme}
                  onClick={() => handleRemoveEmail(emailData.email_id)}
                  disabled={loading}
                  title="Remove email"
                >
                  <FaTrash size={14} />
                </DeleteButton>
              </EmailItem>
            ))
          ) : (
            <EmptyState theme={theme}>
              <FaEnvelope size={24} />
              <span>No email addresses added yet</span>
            </EmptyState>
          )}
        </EmailList>
      </ModalBody>

      <ModalFooter theme={theme}>
        <DoneButton onClick={onClose}>Done</DoneButton>
      </ModalFooter>
    </Modal>
  );
};

export default ManageContactEmailsModal;

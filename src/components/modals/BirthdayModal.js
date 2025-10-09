import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const BirthdayModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onContactUpdate
}) => {
  const [selectedBirthday, setSelectedBirthday] = useState('');

  // Initialize birthday when modal opens
  useEffect(() => {
    if (contact && isOpen) {
      setSelectedBirthday(contact.birthday || '');
    }
  }, [contact, isOpen]);

  const handleUpdateBirthday = async () => {
    if (!contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: selectedBirthday || null })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success(selectedBirthday ? 'Birthday updated' : 'Birthday removed');

      // Call the update callback if provided
      if (onContactUpdate) {
        onContactUpdate({
          ...contact,
          birthday: selectedBirthday || null
        });
      }

      onClose();
      setSelectedBirthday('');
    } catch (error) {
      console.error('Error updating birthday:', error);
      toast.error('Failed to update birthday');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          border: 'none',
          borderRadius: '12px',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          maxWidth: '400px',
          width: '90%'
        }
      }}
    >
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <h3>Edit Birthday</h3>
          <CloseButton
            theme={theme}
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <ContactNameDisplay theme={theme}>
            {contact?.first_name} {contact?.last_name}
          </ContactNameDisplay>

          <BirthdayInputContainer>
            <BirthdayLabel theme={theme}>Birthday</BirthdayLabel>
            <BirthdayInput
              type="date"
              theme={theme}
              value={selectedBirthday}
              onChange={(e) => setSelectedBirthday(e.target.value)}
            />
          </BirthdayInputContainer>

          <ButtonGroup>
            <CancelButton
              theme={theme}
              onClick={onClose}
            >
              Cancel
            </CancelButton>
            <UpdateButton
              theme={theme}
              onClick={handleUpdateBirthday}
            >
              Update Birthday
            </UpdateButton>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Styled Components
const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ContactNameDisplay = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  text-align: center;
`;

const BirthdayInputContainer = styled.div`
  margin-bottom: 20px;
`;

const BirthdayLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const BirthdayInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#10B981' : '#065F46'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const UpdateButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.theme === 'light' ? '#10B981' : '#065F46'};
  border: none;
  color: #FFFFFF;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#059669' : '#064E3B'};
  }
`;

export default BirthdayModal;
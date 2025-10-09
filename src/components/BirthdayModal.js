import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import {
  FrequencyModalContent,
  FrequencyModalHeader,
  FrequencyModalCloseButton,
  FrequencyModalBody,
  ContactNameDisplay,
  BirthdayInputContainer,
  BirthdayLabel,
  BirthdayInput,
  ButtonGroup,
  CancelButton,
  UpdateFrequencyButton
} from './ContactsListDRY.styles';

const BirthdayModal = ({ isOpen, onClose, contact, theme, onContactUpdate }) => {
  const [selectedBirthday, setSelectedBirthday] = useState('');

  useEffect(() => {
    if (contact) {
      setSelectedBirthday(contact.birthday || '');
    }
  }, [contact]);

  const handleUpdateBirthday = async () => {
    if (!contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: selectedBirthday || null })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Birthday updated successfully');
      onClose();
      setSelectedBirthday('');
      if (onContactUpdate) onContactUpdate();
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
      <FrequencyModalContent theme={theme}>
        <FrequencyModalHeader theme={theme}>
          <h3>Edit Birthday</h3>
          <FrequencyModalCloseButton
            theme={theme}
            onClick={onClose}
          >
            <FiX />
          </FrequencyModalCloseButton>
        </FrequencyModalHeader>

        <FrequencyModalBody>
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
            <UpdateFrequencyButton
              theme={theme}
              onClick={handleUpdateBirthday}
            >
              Update Birthday
            </UpdateFrequencyButton>
          </ButtonGroup>
        </FrequencyModalBody>
      </FrequencyModalContent>
    </Modal>
  );
};

export default BirthdayModal;
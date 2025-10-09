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
  FrequencyOptionsContainer,
  FrequencyOption,
  ButtonGroup,
  CancelButton,
  UpdateFrequencyButton
} from './ContactsListDRY.styles';

const FrequencyModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onContactUpdate
}) => {
  const [selectedFrequency, setSelectedFrequency] = useState('');

  const frequencyOptions = [
    'Weekly',
    'Monthly',
    'Quarterly',
    'Twice per Year',
    'Once per Year'
  ];

  // Set initial frequency when modal opens or contact changes
  useEffect(() => {
    if (isOpen && contact) {
      setSelectedFrequency(contact.keep_in_touch_frequency || 'Monthly');
    }
  }, [isOpen, contact]);

  const handleUpdateFrequency = async () => {
    if (!contact || !selectedFrequency) return;

    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({ frequency: selectedFrequency })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success(`Keep in touch frequency updated to ${selectedFrequency}`);

      // Clean up and close
      setSelectedFrequency('');
      onClose();

      // Trigger refresh if callback provided
      if (onContactUpdate) {
        onContactUpdate();
      }
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
    }
  };

  const handleClose = () => {
    setSelectedFrequency('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
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
          <h3>Change Keep in Touch Frequency</h3>
          <FrequencyModalCloseButton
            theme={theme}
            onClick={handleClose}
          >
            <FiX />
          </FrequencyModalCloseButton>
        </FrequencyModalHeader>

        <FrequencyModalBody>
          <ContactNameDisplay theme={theme}>
            {contact?.first_name} {contact?.last_name}
          </ContactNameDisplay>

          <FrequencyOptionsContainer>
            {frequencyOptions.map(frequency => (
              <FrequencyOption
                key={frequency}
                theme={theme}
                $selected={selectedFrequency === frequency}
                onClick={() => setSelectedFrequency(frequency)}
              >
                {frequency}
              </FrequencyOption>
            ))}
          </FrequencyOptionsContainer>

          <ButtonGroup>
            <CancelButton
              theme={theme}
              onClick={handleClose}
            >
              Cancel
            </CancelButton>
            <UpdateFrequencyButton
              theme={theme}
              onClick={handleUpdateFrequency}
              disabled={!selectedFrequency}
            >
              Update Frequency
            </UpdateFrequencyButton>
          </ButtonGroup>
        </FrequencyModalBody>
      </FrequencyModalContent>
    </Modal>
  );
};

export default FrequencyModal;
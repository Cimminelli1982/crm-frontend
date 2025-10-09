import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

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
    'Bi-Weekly',
    'Monthly',
    'Quarterly',
    'Semi-Annually',
    'Annually',
    'As Needed'
  ];

  // Initialize frequency when modal opens
  useEffect(() => {
    if (contact && isOpen) {
      setSelectedFrequency(contact.keep_in_touch_frequency || 'Monthly');
    }
  }, [contact, isOpen]);

  const handleUpdateFrequency = async () => {
    if (!contact || !selectedFrequency) return;

    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .upsert({
          contact_id: contact.contact_id,
          frequency: selectedFrequency
        });

      if (error) throw error;

      toast.success(`Keep in touch frequency updated to ${selectedFrequency}`);

      // Call the update callback if provided
      if (onContactUpdate) {
        onContactUpdate({
          ...contact,
          keep_in_touch_frequency: selectedFrequency
        });
      }

      onClose();
      setSelectedFrequency('Monthly');
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
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
          <h3>Change Keep in Touch Frequency</h3>
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
              onClick={onClose}
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

// Styled Components
const FrequencyModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const FrequencyModalHeader = styled.div`
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

const FrequencyModalCloseButton = styled.button`
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

const FrequencyModalBody = styled.div`
  padding: 20px;
`;

const ContactNameDisplay = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  text-align: center;
`;

const FrequencyOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`;

const FrequencyOption = styled.button`
  padding: 12px 16px;
  border: 2px solid ${props =>
    props.$selected
      ? props.theme === 'light' ? '#10B981' : '#065F46'
      : props.theme === 'light' ? '#E5E7EB' : '#374151'
  };
  background: ${props =>
    props.$selected
      ? props.theme === 'light' ? '#10B981' : '#065F46'
      : props.theme === 'light' ? '#FFFFFF' : '#1F2937'
  };
  color: ${props =>
    props.$selected
      ? '#FFFFFF'
      : props.theme === 'light' ? '#374151' : '#D1D5DB'
  };
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#10B981' : '#065F46'};
    background: ${props =>
      props.$selected
        ? props.theme === 'light' ? '#059669' : '#064E3B'
        : props.theme === 'light' ? '#F9FAFB' : '#374151'
    };
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

const UpdateFrequencyButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.theme === 'light' ? '#10B981' : '#065F46'};
  border: none;
  color: #FFFFFF;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#059669' : '#064E3B'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default FrequencyModal;
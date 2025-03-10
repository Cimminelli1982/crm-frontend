import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// Styled components for the modal
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #1f2937;
      background-color: #f3f4f6;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
`;

const CurrentCategory = styled.div`
  padding: 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  margin-bottom: 16px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #9ca3af;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background-color: #3b82f6;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
`;

const SkipButton = styled(Button)`
  background-color: #ef4444;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background-color: #dc2626;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;

  &:hover:not(:disabled) {
    background-color: #f3f4f6;
  }
`;

const Message = styled.div`
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-top: 12px;
  
  &.success {
    background-color: #ecfdf5;
    color: #059669;
  }
  
  &.error {
    background-color: #fef2f2;
    color: #dc2626;
  }
`;

const CategoryModal = ({ isOpen, onRequestClose, contact }) => {
  const [category, setCategory] = useState(contact?.contact_category || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setCategory(contact?.contact_category || '');
  }, [contact]);

  const handleSave = async () => {
    if (!category) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_category: category })
        .eq('id', contact.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Category updated successfully!' });
      setTimeout(() => {
        onRequestClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating category:', error);
      setMessage({ type: 'error', text: 'Failed to update category' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_category: 'Skip' })
        .eq('id', contact.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Contact marked as Skip!' });
      setTimeout(() => {
        onRequestClose();
      }, 1500);
    } catch (error) {
      console.error('Error marking contact as Skip:', error);
      setMessage({ type: 'error', text: 'Failed to mark contact as Skip' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '24px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          maxWidth: '500px',
          width: '90%'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <ModalHeader>
        <h2>Edit Category</h2>
        <button onClick={onRequestClose} aria-label="Close modal">
          <FiX size={20} />
        </button>
      </ModalHeader>

      <FormGroup>
        <label>Actual Category:</label>
        <CurrentCategory>
          {contact?.contact_category || 'Not set'}
        </CurrentCategory>
      </FormGroup>

      <FormGroup>
        <label htmlFor="category">Select New Category:</label>
        <Select
          id="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setMessage({ type: '', text: '' });
          }}
        >
          <option value="">Select a category...</option>
          <option value="Founder">Founder</option>
          <option value="Professional Investor">Professional Investor</option>
          <option value="Advisor">Advisor</option>
          <option value="Team">Team</option>
          <option value="Friend and Family">Friend and Family</option>
          <option value="Manager">Manager</option>
          <option value="Institution">Institution</option>
          <option value="Media">Media</option>
          <option value="Student">Student</option>
          <option value="Supplier">Supplier</option>
          <option value="Skip">Skip</option>
        </Select>
      </FormGroup>

      <ButtonGroup>
        <CancelButton onClick={onRequestClose} disabled={loading}>
          Cancel
        </CancelButton>
        <SaveButton onClick={handleSave} disabled={loading}>
          Save Changes
        </SaveButton>
        <SkipButton onClick={handleSkip} disabled={loading}>
          Skip
        </SkipButton>
      </ButtonGroup>

      {message.text && (
        <Message className={message.type}>
          {message.text}
        </Message>
      )}
    </Modal>
  );
};

export default CategoryModal; 
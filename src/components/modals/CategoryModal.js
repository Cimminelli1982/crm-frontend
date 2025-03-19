import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import toast from 'react-hot-toast';

// Styled components for the modal
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
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

const TabsContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
`;

const CurrentCategory = styled.div`
  background-color: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  line-height: 24px;
  
  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
  }
`;

const CategoryOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #000000;
  color: white;
  border: none;
  
  &:hover {
    background-color: #333333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SkipButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #ef4444;
  color: white;
  border: none;
  
  &:hover {
    background-color: #dc2626;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 8px;
`;

const SuccessMessage = styled.p`
  color: #10b981;
  font-size: 0.875rem;
  margin-top: 8px;
`;

// Function to get emoji for category
const getCategoryEmoji = (category) => {
  switch (category) {
    case 'Professional Investor': return '💰 Investor';
    case 'Friend and Family': return '❤️ Loved one';
    case 'Client': return '🤝 Client';
    case 'Colleague': return '👥 Colleague';
    case 'Prospect': return '🎯 Prospect';
    case 'Advisor': return '🧠 Advisor';
    case 'Team': return '⚽ Team';
    case 'Manager': return '💼 Manager';
    case 'Founder': return '💻 Founder';
    case 'Supplier': return '📦 Supplier';
    case 'Skip': return '❌ Skip';
    case 'Inbox': return '📬 Inbox';
    case 'Other': return '📌 Other';
    case 'Institution': return '🏛️ Institution';
    case 'Media': return '📰 Media';
    case 'Student': return '🎓 Student';
    default: return `⚪ ${category}`;
  }
};

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

      toast.success('Category updated successfully!');
      setTimeout(() => {
        onRequestClose();
      }, 1000);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
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

      toast.success('Contact marked as Skip!');
      setTimeout(() => {
        onRequestClose();
      }, 1000);
    } catch (error) {
      console.error('Error marking contact as Skip:', error);
      toast.error('Failed to mark contact as Skip');
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
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '90%',
          minHeight: '450px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Contact Category</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <FormGroup>
          <Label>Current Category</Label>
          <CurrentCategory>
            {contact?.contact_category ? getCategoryEmoji(contact.contact_category) : 'Not set'}
          </CurrentCategory>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="category">Select New Category</Label>
          <Select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setMessage({ type: '', text: '' });
            }}
          >
            <option value="">Select a category...</option>
            <option value="Founder">💻 Founder</option>
            <option value="Professional Investor">💰 Investor</option>
            <option value="Advisor">🧠 Advisor</option>
            <option value="Team">⚽ Team</option>
            <option value="Friend and Family">❤️ Loved one</option>
            <option value="Manager">💼 Manager</option>
            <option value="Institution">🏛️ Institution</option>
            <option value="Media">📰 Media</option>
            <option value="Student">🎓 Student</option>
            <option value="Supplier">📦 Supplier</option>
            <option value="Inbox">📬 Inbox</option>
          </Select>
        </FormGroup>

        <ButtonContainer>
          <SkipButton onClick={handleSkip} disabled={loading}>
            Skip
          </SkipButton>
          <SaveButton onClick={handleSave} disabled={loading}>
            Save Changes
          </SaveButton>
        </ButtonContainer>

        {message.text && message.type === 'error' && (
          <ErrorMessage>{message.text}</ErrorMessage>
        )}
        
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div className="spinner" style={{ 
              width: '20px', 
              height: '20px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #000000', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CategoryModal; 

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
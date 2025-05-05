import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiPhone, FiEdit } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// Styled components
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

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 12px;
`;

const MobilesList = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const MobileTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: ${props => props.color || '#dcfce7'};
  color: ${props => props.textColor || '#166534'};
  border-radius: 8px;
  font-size: 0.875rem;
  gap: 6px;
  width: 100%;

  .mobile-content {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    flex-grow: 1;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions {
    display: flex;
    gap: 6px;
  }

  button {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

const InputContainer = styled.div`
  margin-bottom: 16px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  background-color: #f9fafb;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;

  &.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.error {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  &.info {
    background-color: #e0f2fe;
    color: #0369a1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: #3b82f6;
    color: white;
    border: none;

    &:hover {
      background-color: #2563eb;
    }
  }

  &.secondary {
    background-color: white;
    color: #4b5563;
    border: 1px solid #d1d5db;

    &:hover {
      background-color: #f9fafb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #3b82f6;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const getMobileColor = (isPrimary = false) => {
  return isPrimary 
    ? { bg: '#dcfce7', text: '#166534' } // Green for primary
    : { bg: '#f3f4f6', text: '#4b5563' }; // Gray for others
};

const ManageContactMobiles = ({ isOpen, onRequestClose, contact, onUpdateMobiles }) => {
  const [mobiles, setMobiles] = useState([]);
  const [newMobile, setNewMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize mobiles from contact
  useEffect(() => {
    if (isOpen && contact && contact.mobiles) {
      setMobiles(Array.isArray(contact.mobiles) ? [...contact.mobiles] : []);
    }
  }, [isOpen, contact]);

  const validateMobileNumber = (mobile) => {
    // This is a simple validation, adjust based on your specific phone number format requirements
    return mobile.trim().length >= 6;
  };

  const handleAddMobile = () => {
    try {
      // Validate mobile format
      if (!validateMobileNumber(newMobile)) {
        setMessage({ type: 'error', text: 'Please enter a valid phone number' });
        return;
      }

      // Check if mobile already exists
      if (mobiles.some(m => m.mobile === newMobile)) {
        setMessage({ type: 'info', text: 'This phone number already exists for this contact' });
        return;
      }

      // Create a new mobile object
      const newMobileObj = {
        mobile: newMobile,
        is_primary: mobiles.length === 0, // First mobile added becomes primary
      };

      // Add to local state
      const updatedMobiles = [...mobiles, newMobileObj];
      setMobiles(updatedMobiles);
      setNewMobile(''); // Clear input
      setMessage({ type: 'success', text: 'Phone number added successfully' });

      // If there's an update callback, call it
      if (onUpdateMobiles) {
        onUpdateMobiles(updatedMobiles);
      }
    } catch (error) {
      console.error('Error adding phone number:', error);
      setMessage({ type: 'error', text: 'Failed to add phone number' });
    }
  };

  const handleRemoveMobile = (mobileToRemove) => {
    try {
      const updatedMobiles = mobiles.filter(m => m.mobile !== mobileToRemove.mobile);
      
      // If we removed the primary mobile and there are still mobiles, set the first one as primary
      if (mobileToRemove.is_primary && updatedMobiles.length > 0) {
        updatedMobiles[0].is_primary = true;
      }
      
      setMobiles(updatedMobiles);
      setMessage({ type: 'success', text: 'Phone number removed successfully' });

      // If there's an update callback, call it
      if (onUpdateMobiles) {
        onUpdateMobiles(updatedMobiles);
      }
    } catch (error) {
      console.error('Error removing phone number:', error);
      setMessage({ type: 'error', text: 'Failed to remove phone number' });
    }
  };

  const handleSetPrimary = (mobileToSetPrimary) => {
    try {
      if (mobileToSetPrimary.is_primary) {
        return; // Already primary
      }

      const updatedMobiles = mobiles.map(m => ({
        ...m,
        is_primary: m.mobile === mobileToSetPrimary.mobile
      }));
      
      setMobiles(updatedMobiles);
      setMessage({ type: 'success', text: 'Primary phone number updated successfully' });

      // If there's an update callback, call it
      if (onUpdateMobiles) {
        onUpdateMobiles(updatedMobiles);
      }
    } catch (error) {
      console.error('Error setting primary phone number:', error);
      setMessage({ type: 'error', text: 'Failed to set primary phone number' });
    }
  };

  const clearMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

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
          minHeight: '360px',
          backgroundColor: '#ffffff'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Manage Phone Numbers</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <Section>
          <SectionTitle>Contact Phone Numbers</SectionTitle>
          <MobilesList>
            {mobiles.map((mobileObj, index) => {
              const color = getMobileColor(mobileObj.is_primary);
              return (
                <MobileTag 
                  key={index} 
                  color={color.bg}
                  textColor={color.text}
                >
                  <div className="mobile-content">
                    <FiPhone size={16} />
                    <span title={mobileObj.mobile}>{mobileObj.mobile}</span>
                    {mobileObj.is_primary && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#dcfce7', 
                        color: '#166534',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginLeft: '6px'
                      }}>
                        Primary
                      </span>
                    )}
                  </div>
                  
                  <div className="actions">
                    {!mobileObj.is_primary && (
                      <button 
                        onClick={() => handleSetPrimary(mobileObj)}
                        disabled={loading}
                        title="Set as primary"
                        style={{ color: '#166534' }}
                      >
                        <FiEdit size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveMobile(mobileObj)}
                      disabled={loading}
                      title="Remove phone number"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </MobileTag>
              );
            })}
            {mobiles.length === 0 && (
              <div style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                No phone numbers linked to this contact
              </div>
            )}
          </MobilesList>
        </Section>

        <Section>
          <SectionTitle>Add New Phone Number</SectionTitle>
          <InputContainer>
            <FormInput
              type="tel"
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value)}
              placeholder="+1 (123) 456-7890"
              aria-label="New phone number"
            />
          </InputContainer>
          <AddButton 
            onClick={handleAddMobile}
            disabled={!newMobile.trim() || loading}
          >
            <FiPlus size={16} />
            Add Phone Number
          </AddButton>
        </Section>

        {message.text && (
          <Message className={message.type}>
            {message.text}
          </Message>
        )}

        <ButtonGroup>
          <Button className="primary" onClick={onRequestClose}>
            Done
          </Button>
        </ButtonGroup>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div className="spinner" style={{ 
              width: '20px', 
              height: '20px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ManageContactMobiles;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
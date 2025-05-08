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
  border-bottom: 1px solid #00ff00;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #00ff00;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #00ff00;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #fff;
      background-color: rgba(0, 255, 0, 0.2);
    }
  }
`;

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
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
  background-color: ${props => props.color || '#222'};
  color: ${props => props.textColor || '#00ff00'};
  border-radius: 8px;
  font-size: 0.875rem;
  gap: 6px;
  width: 100%;
  border: 1px solid #333;
  margin-bottom: 5px;

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
  border: 1px solid #333;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  background-color: #222;
  color: #fff;

  &:focus {
    border-color: #00ff00;
    box-shadow: 0 0 0 3px rgba(0, 255, 0, 0.1);
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;
  border: 1px solid;

  &.success {
    background-color: rgba(0, 255, 0, 0.1);
    color: #00ff00;
    border-color: #00ff00;
  }

  &.error {
    background-color: rgba(255, 0, 0, 0.1);
    color: #ff5555;
    border-color: #ff5555;
  }

  &.info {
    background-color: rgba(0, 170, 255, 0.1);
    color: #00aaff;
    border-color: #00aaff;
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
    background-color: #121212;
    color: #00ff00;
    border: 1px solid #00ff00;

    &:hover {
      background-color: rgba(0, 255, 0, 0.2);
    }
  }

  &.secondary {
    background-color: #121212;
    color: #aaa;
    border: 1px solid #333;

    &:hover {
      background-color: #222;
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
  background-color: #121212;
  color: #00ff00;
  padding: 8px 12px;
  border: 1px solid #00ff00;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const getMobileColor = (isPrimary = false) => {
  return isPrimary 
    ? { bg: 'rgba(0, 255, 0, 0.15)', text: '#00ff00' } // Green fluorescent for primary
    : { bg: '#222', text: '#00ff00' }; // Dark with green text for others
};

const ManageContactMobiles = ({ isOpen, onRequestClose, contact, onUpdateMobiles }) => {
  const [mobiles, setMobiles] = useState([]);
  const [newMobile, setNewMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize mobiles from contact
  useEffect(() => {
    if (isOpen && contact) {
      console.log('Contact data for mobiles:', contact);
      
      if (contact.mobiles) {
        console.log('Mobiles data:', contact.mobiles);
        setMobiles(Array.isArray(contact.mobiles) ? [...contact.mobiles] : []);
      } else {
        // If contact.mobiles doesn't exist, try to fetch them directly
        const fetchMobiles = async () => {
          try {
            const { data: mobilesData, error } = await supabase
              .from('contact_mobiles')
              .select('*')
              .eq('contact_id', contact.contact_id);
              
            if (error) {
              console.error('Error fetching mobiles:', error);
              return;
            }
            
            console.log('Fetched mobiles:', mobilesData);
            if (mobilesData && mobilesData.length > 0) {
              setMobiles(mobilesData);
            }
          } catch (err) {
            console.error('Exception fetching mobiles:', err);
          }
        };
        
        fetchMobiles();
      }
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
          border: '1px solid #00ff00',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 255, 0, 0.2)',
          maxWidth: '500px',
          width: '90%',
          minHeight: '360px',
          backgroundColor: '#121212',
          color: '#ffffff'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                        backgroundColor: 'rgba(0, 255, 0, 0.2)', 
                        color: '#00ff00',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginLeft: '6px',
                        border: '1px solid #00ff00'
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
              <div style={{ color: '#aaa', fontStyle: 'italic', padding: '4px' }}>
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
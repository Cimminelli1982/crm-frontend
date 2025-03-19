import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import toast from 'react-hot-toast';

// Styled Components
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
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const TabButton = styled.button`
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#000000' : 'transparent'};
  color: ${props => props.active ? '#000000' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 0.938rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.active ? '#000000' : '#1f2937'};
  }
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

const CurrentValue = styled.div`
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

const Input = styled.input`
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
  }
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

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 8px;
`;

const FollowUpText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
`;

const KeepInTouchModal = ({ isOpen, onRequestClose, contact }) => {
  const [activeTab, setActiveTab] = useState('Frequency');
  const [frequency, setFrequency] = useState(contact.keep_in_touch_frequency || '');
  const [birthdayDate, setBirthdayDate] = useState(contact.birthday_date || '');
  const [birthdayWishes, setBirthdayWishes] = useState(contact.birthday_wishes || 'No wishes');
  const [christmasWishes, setChristmasWishes] = useState(contact.christmas_wishes || 'No wishes');
  const [easterWishes, setEasterWishes] = useState(contact.easter_wishes || 'No wishes');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('N/A');

  useEffect(() => {
    setFrequency(contact.keep_in_touch_frequency || '');
    setBirthdayDate(contact.birthday_date || '');
    setBirthdayWishes(contact.birthday_wishes || 'No wishes');
    setChristmasWishes(contact.christmas_wishes || 'No wishes');
    setEasterWishes(contact.easter_wishes || 'No wishes');
    calculateNextFollowUp(contact.keep_in_touch_frequency);
  }, [contact]);

  const calculateNextFollowUp = (selectedFrequency) => {
    const today = new Date();
    let nextDate = 'N/A';
    switch (selectedFrequency) {
      case 'Weekly':
        nextDate = new Date(today.setDate(today.getDate() + 7));
        break;
      case 'Monthly':
        nextDate = new Date(today.setMonth(today.getMonth() + 1));
        break;
      case 'Quarterly':
        nextDate = new Date(today.setMonth(today.getMonth() + 3));
        break;
      case 'Twice per Year':
        nextDate = new Date(today.setMonth(today.getMonth() + 6));
        break;
      case 'Once per Year':
        nextDate = new Date(today.setFullYear(today.getFullYear() + 1));
        break;
      default:
        nextDate = 'N/A';
    }
    setNextFollowUp(nextDate !== 'N/A' ? nextDate.toLocaleDateString() : 'N/A');
  };

  const handleSave = async () => {
    if (!frequency && christmasWishes === 'No wishes' && easterWishes === 'No wishes' && (birthdayWishes === 'No wishes' || !birthdayWishes)) {
      setErrorMessage('Please enter at least one wish or frequency');
      return;
    }
    if (birthdayWishes !== 'No wishes' && !birthdayDate) {
      setErrorMessage('Please enter a birthday date if you select birthday wishes');
      return;
    }
    setLoading(true);
    try {
      const updateData = {
        keep_in_touch_frequency: frequency,
        birthday_wishes: birthdayWishes,
        christmas_wishes: christmasWishes,
        easter_wishes: easterWishes
      };
      if (birthdayWishes !== 'No wishes' && birthdayDate) {
        updateData.birthday = birthdayDate;
      }
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);
      if (error) throw error;
      
      // Show success toast and close modal
      toast.success('Keep in touch settings updated!');
      setTimeout(() => {
        onRequestClose(); // Close the modal after a short delay
      }, 800);
    } catch (error) {
      console.error('Supabase update error:', error);
      setErrorMessage('Error updating data');
      toast.error('Failed to update settings');
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
          <h2>Keep In Touch Settings</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>
        
        <TabsContainer>
          <TabButton 
            active={activeTab === 'Frequency'} 
            onClick={() => setActiveTab('Frequency')}
          >
            Frequency
          </TabButton>
          <TabButton 
            active={activeTab === 'Wishes'} 
            onClick={() => setActiveTab('Wishes')}
          >
            Wishes
          </TabButton>
        </TabsContainer>
        
        {activeTab === 'Frequency' && (
          <div>
            <FormGroup>
              <Label>Current Keep in Touch Frequency</Label>
              <CurrentValue>
                {contact.keep_in_touch_frequency || 'Not set'}
              </CurrentValue>
            </FormGroup>
            
            <FormGroup>
              <Label>Select New Keep in Touch Frequency</Label>
              <Select
                aria-label="Keep in Touch frequency dropdown"
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value);
                  setErrorMessage('');
                  calculateNextFollowUp(e.target.value);
                }}
              >
                <option value="">Choose a frequency</option>
                <option value="Do not keep in touch">Do not keep in touch</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Twice per Year">Twice per Year</option>
                <option value="Once per Year">Once per Year</option>
              </Select>
            </FormGroup>
            
            <FollowUpText>Next follow-up: {nextFollowUp}</FollowUpText>
          </div>
        )}
        
        {activeTab === 'Wishes' && (
          <div>
            <FormGroup>
              <Label>
                Birthday date: {contact.birthday || '-'}
                {contact.birthday && (
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase
                        .from('contacts')
                        .update({ birthday: null })
                        .eq('id', contact.id);
                      if (error) {
                        setErrorMessage('Error resetting birthday date');
                      } else {
                        const { data, error: fetchError } = await supabase
                          .from('contacts')
                          .select('birthday')
                          .eq('id', contact.id)
                          .single();
                        if (fetchError) {
                          setErrorMessage('Error fetching updated birthday');
                        } else {
                          setBirthdayDate(data.birthday);
                          toast.success('Birthday date reset successfully');
                        }
                      }
                      setLoading(false);
                    }}
                    style={{
                      marginLeft: '10px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Birthday
                  </button>
                )}
              </Label>
              <Input
                type="text"
                aria-label="Birthday date input"
                value={birthdayDate || ''}
                onChange={(e) => setBirthdayDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Birthday Wishes</Label>
              <Select
                aria-label="Birthday wishes dropdown"
                value={birthdayWishes}
                onChange={(e) => setBirthdayWishes(e.target.value)}
              >
                <option value="No wishes">No wishes</option>
                <option value="LinkedIn message">LinkedIn message</option>
                <option value="Email message">Email message</option>
                <option value="WhatsApp message">WhatsApp message</option>
                <option value="Call">Call</option>
                <option value="Send a present/card">Send a present/card</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Christmas Wishes</Label>
              <Select
                aria-label="Christmas wishes dropdown"
                value={christmasWishes}
                onChange={(e) => setChristmasWishes(e.target.value)}
              >
                <option value="No wishes">No wishes</option>
                <option value="LinkedIn message">LinkedIn message</option>
                <option value="Email message">Email message</option>
                <option value="WhatsApp message">WhatsApp message</option>
                <option value="Call">Call</option>
                <option value="Send a present/card">Send a present/card</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Easter Wishes</Label>
              <Select
                aria-label="Easter wishes dropdown"
                value={easterWishes}
                onChange={(e) => setEasterWishes(e.target.value)}
              >
                <option value="No wishes">No wishes</option>
                <option value="LinkedIn message">LinkedIn message</option>
                <option value="Email message">Email message</option>
                <option value="WhatsApp message">WhatsApp message</option>
                <option value="Call">Call</option>
                <option value="Send a present/card">Send a present/card</option>
              </Select>
            </FormGroup>
          </div>
        )}
        
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        
        <ButtonContainer>
          <SaveButton onClick={handleSave} disabled={loading}>
            Save
          </SaveButton>
        </ButtonContainer>
        
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

export default KeepInTouchModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 
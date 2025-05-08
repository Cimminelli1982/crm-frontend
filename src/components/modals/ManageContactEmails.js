import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiSearch, FiEdit, FiMail } from 'react-icons/fi';
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

const EmailsList = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const EmailTag = styled.div`
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

  .email-content {
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

const getEmailColor = (isPrimary = false) => {
  return isPrimary 
    ? { bg: 'rgba(0, 255, 0, 0.15)', text: '#00ff00' } // Green fluorescent for primary
    : { bg: '#222', text: '#00ff00' }; // Dark with green text for others
};

const ManageContactEmails = ({ isOpen, onRequestClose, contact, onUpdateEmails }) => {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize emails from contact
  useEffect(() => {
    console.log('Modal open:', isOpen);
    console.log('Contact received:', contact);
    
    if (isOpen && contact) {
      console.log('Contact ID:', contact.contact_id);
      
      // Always fetch the latest emails directly from the database when the modal opens
      const fetchEmails = async () => {
        try {
          if (!contact.contact_id) {
            console.error('No contact_id available');
            return;
          }
          
          // Log the query we're about to make
          console.log(`About to query contact_emails for contact_id: ${contact.contact_id}`);
          
          // Execute the query with detailed logging
          const { data: emailsData, error } = await supabase
            .from('contact_emails')
            .select('*')
            .eq('contact_id', contact.contact_id);
            
          if (error) {
            console.error('Error fetching emails:', error);
            return;
          }
          
          console.log('Raw Supabase response:', emailsData);
          
          if (!emailsData) {
            console.log('No email data returned');
          } else {
            console.log(`Found ${emailsData.length} emails`);
          }
          
          // Create sample email for testing if none found
          if (!emailsData || emailsData.length === 0) {
            console.log('No emails found, using sample data for testing');
            const sampleEmails = [
              { 
                email_id: 'sample-1', 
                contact_id: contact.contact_id, 
                email: 'test@example.com', 
                is_primary: true, 
                type: 'personal' 
              }
            ];
            setEmails(sampleEmails);
          } else {
            setEmails(emailsData);
          }
        } catch (err) {
          console.error('Exception fetching emails:', err);
          console.error('Error details:', err.message, err.stack);
        }
      };
      
      fetchEmails();
    }
  }, [isOpen, contact]);

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleAddEmail = () => {
    try {
      // Validate email format
      if (!validateEmail(newEmail)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
        return;
      }

      // Check if email already exists
      if (emails.some(e => e.email.toLowerCase() === newEmail.toLowerCase())) {
        setMessage({ type: 'info', text: 'This email already exists for this contact' });
        return;
      }

      // Create a new email object
      const newEmailObj = {
        email: newEmail,
        is_primary: emails.length === 0, // First email added becomes primary
      };

      // Add to local state
      const updatedEmails = [...emails, newEmailObj];
      setEmails(updatedEmails);
      setNewEmail(''); // Clear input
      setMessage({ type: 'success', text: 'Email added successfully' });

      // If there's an update callback, call it
      if (onUpdateEmails) {
        onUpdateEmails(updatedEmails);
      }
    } catch (error) {
      console.error('Error adding email:', error);
      setMessage({ type: 'error', text: 'Failed to add email' });
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    try {
      const updatedEmails = emails.filter(e => e.email !== emailToRemove.email);
      
      // If we removed the primary email and there are still emails, set the first one as primary
      if (emailToRemove.is_primary && updatedEmails.length > 0) {
        updatedEmails[0].is_primary = true;
      }
      
      setEmails(updatedEmails);
      setMessage({ type: 'success', text: 'Email removed successfully' });

      // If there's an update callback, call it
      if (onUpdateEmails) {
        onUpdateEmails(updatedEmails);
      }
    } catch (error) {
      console.error('Error removing email:', error);
      setMessage({ type: 'error', text: 'Failed to remove email' });
    }
  };

  const handleSetPrimary = (emailToSetPrimary) => {
    try {
      if (emailToSetPrimary.is_primary) {
        return; // Already primary
      }

      const updatedEmails = emails.map(e => ({
        ...e,
        is_primary: e.email === emailToSetPrimary.email
      }));
      
      setEmails(updatedEmails);
      setMessage({ type: 'success', text: 'Primary email updated successfully' });

      // If there's an update callback, call it
      if (onUpdateEmails) {
        onUpdateEmails(updatedEmails);
      }
    } catch (error) {
      console.error('Error setting primary email:', error);
      setMessage({ type: 'error', text: 'Failed to set primary email' });
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
          <h2>Manage Email Addresses</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <Section>
          <SectionTitle>Contact Emails</SectionTitle>
          <EmailsList>
            {emails.map((emailObj, index) => {
              const color = getEmailColor(emailObj.is_primary);
              return (
                <EmailTag 
                  key={index} 
                  color={color.bg}
                  textColor={color.text}
                >
                  <div className="email-content">
                    <FiMail size={16} />
                    <span title={emailObj.email}>{emailObj.email}</span>
                    {emailObj.is_primary && (
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
                    {!emailObj.is_primary && (
                      <button 
                        onClick={() => handleSetPrimary(emailObj)}
                        disabled={loading}
                        title="Set as primary"
                        style={{ color: '#3b82f6' }}
                      >
                        <FiEdit size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveEmail(emailObj)}
                      disabled={loading}
                      title="Remove email"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </EmailTag>
              );
            })}
            {emails.length === 0 && (
              <div style={{ color: '#aaa', fontStyle: 'italic', padding: '4px' }}>
                No emails linked to this contact
              </div>
            )}
          </EmailsList>
        </Section>

        <Section>
          <SectionTitle>Add New Email</SectionTitle>
          <InputContainer>
            <FormInput
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="example@domain.com"
              aria-label="New email address"
            />
          </InputContainer>
          <AddButton 
            onClick={handleAddEmail}
            disabled={!newEmail.trim() || loading}
          >
            <FiPlus size={16} />
            Add Email
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

export default ManageContactEmails;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
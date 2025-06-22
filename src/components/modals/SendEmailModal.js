import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiSend, FiMail } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #000;
  border: 2px solid #00ff00;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
  background-color: #111;
`;

const ModalTitle = styled.h2`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ffffff;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  background-color: #111;
  border: 2px solid #333;
  color: #ffffff;
  padding: 12px 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: #00ff00;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const ListInfo = styled.div`
  background-color: #111;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
`;

const ListInfoItem = styled.div`
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  strong {
    color: #00ff00;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #333;
  background-color: #111;
`;

const Button = styled.button`
  background-color: #000;
  border: 2px solid #333;
  color: #ffffff;
  padding: 10px 20px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      border-color: #333;
      color: #ffffff;
    }
  }
  
  &.primary {
    border-color: #00ff00;
    color: #00ff00;
    
    &:hover {
      background-color: #00ff00;
      color: #000;
    }
    
    &:disabled:hover {
      background-color: #000;
      color: #00ff00;
    }
  }
`;

const LoadingText = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  text-align: center;
  padding: 20px;
`;

const ErrorText = styled.div`
  color: #ff0000;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: #1a0000;
  border: 1px solid #ff0000;
  border-radius: 4px;
`;

const SuccessText = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: #001a00;
  border: 1px solid #00ff00;
  border-radius: 4px;
`;

const SendEmailModal = ({ isOpen, onClose, emailList }) => {
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleClose = () => {
    if (!loading) {
      setSubject('');
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      setError('Please enter an email subject');
      return;
    }

    if (!emailList || !emailList.total_contacts || emailList.total_contacts === 0) {
      setError('This mailing list has no contacts to send to');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the list ID using the same logic as other components
      const listId = emailList.list_id || emailList.email_list_id || emailList.uuid || emailList.id;
      
      const { data, error: functionError } = await supabase.functions.invoke('send-email-campaign', {
        body: {
          listId: listId,
          subject: subject.trim(),
          fromName: 'CRM System',
          fromEmail: 'onboarding@resend.dev',
          htmlContent: `<h1>Hello {{first_name}}!</h1><p>This is an email from our CRM system.</p><p>Subject: ${subject.trim()}</p>`
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email campaign');
      }

      setSuccess(`Email campaign sent successfully to ${data.results.sent} recipients!`);
      
      // Auto-close modal after 3 seconds on success
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (err) {
      console.error('Error sending email campaign:', err);
      setError(err.message || 'Failed to send email campaign');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiMail />
            Send Email Campaign
          </ModalTitle>
          <CloseButton onClick={handleClose} disabled={loading}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {emailList && (
            <ListInfo>
              <ListInfoItem><strong>List:</strong> {emailList.name || 'Unnamed List'}</ListInfoItem>
              <ListInfoItem><strong>Description:</strong> {emailList.description || 'No description'}</ListInfoItem>
              <ListInfoItem><strong>Type:</strong> {emailList.list_type === 'static' ? 'Static' : 'Dynamic'}</ListInfoItem>
              <ListInfoItem><strong>Recipients:</strong> {emailList.total_contacts || 0} contacts</ListInfoItem>
            </ListInfo>
          )}

          <FormGroup>
            <Label>Email Subject *</Label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={loading}
              maxLength={200}
            />
          </FormGroup>

          {loading && (
            <LoadingText>Sending email campaign...</LoadingText>
          )}

          {error && (
            <ErrorText>{error}</ErrorText>
          )}

          {success && (
            <SuccessText>{success}</SuccessText>
          )}
        </ModalBody>

        <ButtonGroup>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            className="primary" 
            onClick={handleSendEmail}
            disabled={loading || !subject.trim()}
          >
            <FiSend size={14} />
            {loading ? 'Sending...' : 'Send Campaign'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SendEmailModal; 
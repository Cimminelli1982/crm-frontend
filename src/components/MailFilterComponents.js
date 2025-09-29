import React from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';

// Email List Component for Mail Filter
export const MailFilterEmailList = ({ contacts, loading, theme, onSpamClick, onAddToCRM, onViewEmail }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
      }}>
        Loading emails...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          No mail filter emails!
        </div>
        <div>No emails pending approval.</div>
      </div>
    );
  }

  return (
    <EmailListContainer theme={theme}>
      {contacts.map(contact => (
        <EmailItem key={contact.id} theme={theme} onClick={() => onViewEmail(contact)}>
          <EmailInfo>
            <EmailDirection theme={theme}>
              {contact.direction?.toLowerCase() === 'sent' ? (
                <FiArrowLeft color="#60A5FA" size={16} />
              ) : (
                <FiArrowRight color="#10B981" size={16} />
              )}
            </EmailDirection>
            <EmailContact theme={theme}>
              {contact.first_name} {contact.last_name}
            </EmailContact>
            <EmailSubject theme={theme}>
              {contact.mobile || '(No Subject)'}
            </EmailSubject>
            <EmailDate theme={theme}>
              {new Date(contact.last_interaction_at).toLocaleDateString()}
            </EmailDate>
          </EmailInfo>
          <EmailActions>
            <EmailActionButton
              onClick={(e) => { e.stopPropagation(); onSpamClick(contact); }}
              theme={theme}
              $variant="danger"
            >
              <FiXCircle /> <span>Spam</span>
            </EmailActionButton>
            <EmailActionButton
              onClick={(e) => { e.stopPropagation(); onAddToCRM(contact); }}
              theme={theme}
              $variant="success"
            >
              <FiCheckCircle /> <span>Add to CRM</span>
            </EmailActionButton>
          </EmailActions>
        </EmailItem>
      ))}
    </EmailListContainer>
  );
};

const EmailListContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
`;

const EmailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 2px 8px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;
  }
`;

const EmailInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    width: 100%;
    gap: 8px;
  }
`;

const EmailDirection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
`;

const EmailContact = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  min-width: 120px;

  @media (max-width: 768px) {
    min-width: auto;
    font-size: 14px;
  }
`;

const EmailSubject = styled.div`
  flex: 1;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    flex: 1 1 100%;
    margin-top: 4px;
    font-size: 13px;
  }
`;

const EmailDate = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  min-width: 80px;

  @media (max-width: 768px) {
    min-width: auto;
    font-size: 0.75rem;
  }
`;

const EmailActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
    gap: 6px;
  }
`;

const EmailActionButton = styled.button`
  background-color: ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    if (props.$variant === 'success') return '#059669';
    return '#3B82F6';
  }};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 11px;

    span {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 10px;
  }
`;

// Email Modal Component
export const EmailModal = ({ email, onClose, onSpam, onAddToCRM, theme }) => {
  if (!email) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSent = email.direction?.toLowerCase() === 'sent';
  const contactName = isSent ? email.to_name : email.from_name;
  const contactEmail = isSent ? email.to_email : email.from_email;
  const myEmail = 'simone@cimminelli.com';

  const searchEmail = encodeURIComponent(contactEmail);
  const superhuman_url = `https://mail.superhuman.com/search/${searchEmail}`;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            <FiMail style={{ marginRight: '10px' }} /> Email Details
          </ModalTitle>

          <OriginalEmailLink href={superhuman_url} target="_blank" rel="noopener noreferrer" theme={theme}>
            <FiExternalLink /> Original
          </OriginalEmailLink>

          <ModalCloseButton onClick={onClose} theme={theme} style={{ marginLeft: '15px' }}>×</ModalCloseButton>
        </ModalHeader>

        <ModalBody theme={theme}>
          <EmailDetails theme={theme}>
            <EmailInfoItem theme={theme}>
              <EmailInfoLabel theme={theme}>
                <FiUser /> {isSent ? 'To:' : 'From:'}
              </EmailInfoLabel>
              <EmailInfoValue theme={theme}>
                {contactName} &lt;{contactEmail}&gt;
              </EmailInfoValue>
            </EmailInfoItem>

            <EmailInfoItem theme={theme}>
              <EmailInfoLabel theme={theme}>
                <FiUser /> {isSent ? 'From:' : 'To:'}
              </EmailInfoLabel>
              <EmailInfoValue theme={theme}>
                Simone Cimminelli &lt;{myEmail}&gt;
              </EmailInfoValue>
            </EmailInfoItem>

            <EmailInfoItem theme={theme}>
              <EmailInfoLabel theme={theme}>
                <FiCalendar /> Date:
              </EmailInfoLabel>
              <EmailInfoValue theme={theme}>
                {formatDate(email.message_timestamp)}
              </EmailInfoValue>
            </EmailInfoItem>
          </EmailDetails>

          <EmailSubjectModal theme={theme}>
            {email.subject || '(No Subject)'}
          </EmailSubjectModal>

          <EmailMessageContainer theme={theme}>
            <FiMessageSquare style={{ marginRight: '10px', opacity: 0.6 }} />
            {email.message_text || '(No message content)'}
          </EmailMessageContainer>
        </ModalBody>

        <ModalFooter theme={theme}>
          <ActionButton
            onClick={() => {
              const emailData = {
                id: `email-${email.id}`,
                first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
                last_name: contactEmail ? `(@${contactEmail.split('@')[1]})` : '',
                email_data: email
              };
              onSpam(emailData);
              onClose();
            }}
            theme={theme}
            $variant="danger"
          >
            <FiXCircle /> Spam
          </ActionButton>
          <ActionButton
            onClick={() => {
              const emailData = {
                id: `email-${email.id}`,
                first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
                last_name: contactEmail ? `(@${contactEmail.split('@')[1]})` : '',
                email_data: email
              };
              onAddToCRM(emailData);
              onClose();
            }}
            theme={theme}
          >
            <FiCheckCircle /> Add to CRM
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
`;

const ActionButton = styled.button`
  background-color: ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    if (props.$variant === 'secondary') return 'transparent';
    return '#3B82F6';
  }};
  color: ${props => {
    if (props.$variant === 'secondary') return props.theme === 'light' ? '#6B7280' : '#9CA3AF';
    return 'white';
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    if (props.$variant === 'secondary') return props.theme === 'light' ? '#D1D5DB' : '#4B5563';
    return '#3B82F6';
  }};
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const OriginalEmailLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  text-decoration: none;
  margin-left: auto;
  font-size: 0.9rem;
  gap: 5px;
  border: 1px solid ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 4px;
  padding: 6px 10px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
    text-decoration: none;
  }
`;

const EmailDetails = styled.div`
  margin-bottom: 20px;
`;

const EmailInfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const EmailInfoLabel = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmailInfoValue = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  flex: 1;
`;

const EmailMessageContainer = styled.div`
  background-color: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  max-height: 400px;
  overflow-y: auto;
`;

const EmailSubjectModal = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  margin-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding-bottom: 10px;
`;
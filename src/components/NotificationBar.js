import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const NotificationContainer = styled.div`
  width: 100%;
  background: ${props => {
    switch (props.$type) {
      case 'success': return props.theme === 'light' ? '#10B981' : '#059669';
      case 'warning': return props.theme === 'light' ? '#F59E0B' : '#D97706';
      case 'error': return props.theme === 'light' ? '#EF4444' : '#DC2626';
      default: return props.theme === 'light' ? '#3B82F6' : '#2563EB';
    }
  }};
  color: white;
  padding: 8px 16px;
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 40px;
  position: relative;

  @media (max-width: 767px) {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 36px;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const NotificationText = styled.span`
  line-height: 1.4;
`;

const ContactLink = styled.button`
  background: none;
  border: none;
  color: white;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  padding: 0;
  margin: 0 4px;

  &:hover {
    text-decoration: none;
    opacity: 0.8;
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
`;

const NotificationBar = ({
  message,
  type = 'info',
  visible = false,
  onClose,
  theme = 'light',
  contacts = [],
  onContactClick,
  notificationType = 'general'
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  // Update isVisible when visible prop changes
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleContactClick = (contactId) => {
    if (onContactClick) {
      onContactClick(contactId);
    }
  };

  const handleActionClick = (interaction) => {
    if (interaction.interaction_type === 'email' && interaction.email_thread_id) {
      // Open in Superhuman
      const superhumanUrl = `https://mail.superhuman.com/thread/${interaction.email_thread_id}`;
      window.open(superhumanUrl, '_blank');
    } else if (interaction.interaction_type === 'whatsapp' && interaction.chat_id) {
      // Open WhatsApp chat (you'll need to implement this based on your WhatsApp integration)
      // For now, we'll just log it - you can customize this based on your WhatsApp web setup
      console.log('Opening WhatsApp chat:', interaction.chat_id);
      // Example: window.open(`https://web.whatsapp.com/...`, '_blank');
    }
  };

  if (!message && (!contacts || contacts.length === 0)) return null;

  const renderContent = () => {
    if (notificationType === 'birthday' && contacts && contacts.length > 0) {
      return (
        <NotificationContent>
          <NotificationText>Today birthdays 🎉 </NotificationText>
          {contacts.map((contact, index) => (
            <span key={contact.contact_id}>
              <ContactLink
                onClick={() => handleContactClick(contact.contact_id)}
                title={`View ${contact.first_name}'s contact details`}
              >
                {contact.first_name}{contact.last_name ? ` ${contact.last_name}` : ''}
              </ContactLink>
              {index < contacts.length - 1 && ', '}
            </span>
          ))}
        </NotificationContent>
      );
    }

    if (notificationType === 'messages' && contacts && contacts.length > 0) {
      const latestInteraction = contacts[0];
      return (
        <NotificationContent>
          <NotificationText>{message}</NotificationText>
          {contacts.length > 1 && (
            <span>
              {contacts.slice(1, 4).map((interaction, index) => (
                <span key={interaction.interaction_id}>
                  {', '}
                  <ContactLink
                    onClick={() => handleContactClick(interaction.contact_id)}
                    title={`View message from ${interaction.contacts.first_name}`}
                  >
                    {interaction.contacts.first_name}
                  </ContactLink>
                </span>
              ))}
              {contacts.length > 4 && <NotificationText> and {contacts.length - 4} more</NotificationText>}
            </span>
          )}
          {latestInteraction && (
            <ActionButton
              onClick={() => handleActionClick(latestInteraction)}
              title={
                latestInteraction.interaction_type === 'email'
                  ? 'Open in Superhuman'
                  : latestInteraction.interaction_type === 'whatsapp'
                  ? 'Open WhatsApp chat'
                  : 'Open'
              }
            >
              {latestInteraction.interaction_type === 'email'
                ? '→ Superhuman'
                : latestInteraction.interaction_type === 'whatsapp'
                ? '→ WhatsApp'
                : '→ Open'
              }
            </ActionButton>
          )}
        </NotificationContent>
      );
    }

    return (
      <NotificationContent>
        <NotificationText>{message}</NotificationText>
      </NotificationContent>
    );
  };

  return (
    <NotificationContainer
      $visible={isVisible && visible}
      $type={type}
      theme={theme}
    >
      {renderContent()}
      <CloseButton onClick={handleClose} aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </CloseButton>
    </NotificationContainer>
  );
};

export default NotificationBar;
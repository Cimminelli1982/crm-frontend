import React from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { FaPhone, FaEnvelope, FaBuilding } from 'react-icons/fa';

const CommunicationModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onWhatsApp,
  onEmail,
  onLinkedIn
}) => {
  const handleWhatsAppClick = (mobile) => {
    if (onWhatsApp) {
      onWhatsApp(mobile);
    }
    onClose();
  };

  const handleEmailClick = (email) => {
    if (onEmail) {
      onEmail(email);
    }
    onClose();
  };

  const handleLinkedInClick = (linkedinUrl) => {
    if (onLinkedIn) {
      onLinkedIn(linkedinUrl);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      style={{
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
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          background: 'transparent'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle>
            Contact {contact?.first_name} {contact?.last_name}
          </ModalTitle>
          <CloseButton onClick={onClose} theme={theme}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Mobile Numbers */}
          {contact?.contact_mobiles?.length > 0 && (
            <Section>
              <SectionTitle theme={theme}>
                📱 Mobile Numbers
              </SectionTitle>
              {contact.contact_mobiles.map((mobileObj, index) => (
                <ContactOption
                  key={index}
                  theme={theme}
                  onClick={() => handleWhatsAppClick(mobileObj.mobile)}
                >
                  <FaPhone style={{ marginRight: '8px' }} />
                  {mobileObj.mobile}
                  {mobileObj.is_primary && (
                    <PrimaryBadge>(Primary)</PrimaryBadge>
                  )}
                </ContactOption>
              ))}
            </Section>
          )}

          {/* Email Addresses */}
          {contact?.contact_emails?.length > 0 && (
            <Section>
              <SectionTitle theme={theme}>
                📧 Email Addresses
              </SectionTitle>
              {contact.contact_emails.map((emailObj, index) => (
                <ContactOption
                  key={index}
                  theme={theme}
                  onClick={() => handleEmailClick(emailObj.email)}
                >
                  <FaEnvelope style={{ marginRight: '8px' }} />
                  {emailObj.email}
                  {emailObj.is_primary && (
                    <PrimaryBadge>(Primary)</PrimaryBadge>
                  )}
                </ContactOption>
              ))}
            </Section>
          )}

          {/* LinkedIn */}
          {contact?.linkedin && (
            <Section>
              <SectionTitle theme={theme}>
                🔗 LinkedIn
              </SectionTitle>
              <ContactOption
                theme={theme}
                onClick={() => handleLinkedInClick(contact.linkedin)}
              >
                <FaBuilding style={{ marginRight: '8px' }} />
                View LinkedIn Profile
              </ContactOption>
            </Section>
          )}

          {/* No contact info available */}
          {(!contact?.contact_mobiles?.length &&
            !contact?.contact_emails?.length &&
            !contact?.linkedin) && (
            <EmptyState theme={theme}>
              No contact information available for this contact.
            </EmptyState>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Styled Components
const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    transform: rotate(90deg);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ContactOption = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
    transform: translateX(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const PrimaryBadge = styled.span`
  font-size: 12px;
  margin-left: 8px;
  opacity: 0.7;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
`;

export default CommunicationModal;
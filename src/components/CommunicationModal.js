import React from 'react';
import Modal from 'react-modal';
import { FaPhone, FaEnvelope, FaBuilding } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import {
  FrequencyModalContent,
  FrequencyModalHeader,
  FrequencyModalCloseButton,
  FrequencyModalBody,
  FrequencyOption
} from './ContactsListDRY.styles';

const CommunicationModal = ({ isOpen, onClose, contact, theme }) => {
  const handleWhatsAppClick = (mobile) => {
    const cleanMobile = mobile.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${cleanMobile}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = (email) => {
    const mailtoUrl = `mailto:${email}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleLinkedInClick = (linkedinUrl) => {
    window.open(linkedinUrl, '_blank');
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
      <FrequencyModalContent theme={theme}>
        <FrequencyModalHeader theme={theme}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            Contact {contact?.first_name} {contact?.last_name}
          </h3>
          <FrequencyModalCloseButton
            onClick={onClose}
            theme={theme}
          >
            <FiX />
          </FrequencyModalCloseButton>
        </FrequencyModalHeader>
        <FrequencyModalBody>
          {/* Mobile Numbers */}
          {contact?.contact_mobiles?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                📱 Mobile Numbers
              </h4>
              {contact.contact_mobiles.map((mobileObj, index) => (
                <FrequencyOption
                  key={index}
                  theme={theme}
                  onClick={() => handleWhatsAppClick(mobileObj.mobile)}
                  style={{ cursor: 'pointer', marginBottom: '8px' }}
                >
                  <FaPhone style={{ marginRight: '8px' }} />
                  {mobileObj.mobile}
                  {mobileObj.is_primary && (
                    <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>
                      (Primary)
                    </span>
                  )}
                </FrequencyOption>
              ))}
            </div>
          )}

          {/* Email Addresses */}
          {contact?.contact_emails?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                📧 Email Addresses
              </h4>
              {contact.contact_emails.map((emailObj, index) => (
                <FrequencyOption
                  key={index}
                  theme={theme}
                  onClick={() => handleEmailClick(emailObj.email)}
                  style={{ cursor: 'pointer', marginBottom: '8px' }}
                >
                  <FaEnvelope style={{ marginRight: '8px' }} />
                  {emailObj.email}
                  {emailObj.is_primary && (
                    <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>
                      (Primary)
                    </span>
                  )}
                </FrequencyOption>
              ))}
            </div>
          )}

          {/* LinkedIn */}
          {contact?.linkedin && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                🔗 LinkedIn
              </h4>
              <FrequencyOption
                theme={theme}
                onClick={() => handleLinkedInClick(contact.linkedin)}
                style={{ cursor: 'pointer', marginBottom: '8px' }}
              >
                <FaBuilding style={{ marginRight: '8px' }} />
                View LinkedIn Profile
              </FrequencyOption>
            </div>
          )}

          {/* No contact info available */}
          {(!contact?.contact_mobiles?.length &&
            !contact?.contact_emails?.length &&
            !contact?.linkedin) && (
            <div style={{ textAlign: 'center', padding: '20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              No contact information available for this contact.
            </div>
          )}
        </FrequencyModalBody>
      </FrequencyModalContent>
    </Modal>
  );
};

export default CommunicationModal;
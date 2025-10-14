import React, { useState } from 'react';
import Modal from 'react-modal';
import { FiX, FiClock, FiTrash, FiSkipForward } from 'react-icons/fi';
import { FaInfoCircle } from 'react-icons/fa';
import LastInteraction from './LastInteraction';
import DeleteTab from './DeleteTab';

// Styled Components (reusing from QuickEditModal)
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  CloseButton,
  TabsContainer,
  TabButton,
  TabContent,
  ActionButtons
} from './quickEditModal/StyledComponents';

const DeleteSkipSpamModal = ({
  isOpen,
  onClose,
  contact,
  theme
}) => {
  const [activeTab, setActiveTab] = useState('Last Interaction');

  if (!contact) return null;

  const tabs = [
    { id: 'Last Interaction', label: 'Last Interaction', icon: <FiClock /> },
    { id: 'Delete', label: 'Delete', icon: <FiTrash /> },
    { id: 'Skip or Spam', label: 'Skip or Spam', icon: <FiSkipForward /> }
  ];

  const renderTabContent = () => {
    // Show LastInteraction component for the Last Interaction tab
    if (activeTab === 'Last Interaction') {
      return <LastInteraction contactId={contact?.contact_id} theme={theme} />;
    }

    // Show DeleteTab component for the Delete tab
    if (activeTab === 'Delete') {
      return <DeleteTab contactId={contact?.contact_id} theme={theme} onClose={onClose} />;
    }

    // Show Coming Soon for Skip or Spam tab
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          opacity: 0.3
        }}>
          🚧
        </div>
        <p>Coming Soon</p>
        <p style={{
          fontSize: '14px',
          marginTop: '8px',
          opacity: 0.7
        }}>
          This feature is under development
        </p>
      </div>
    );
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
          maxWidth: activeTab === 'Delete' ? '700px' : '500px',
          width: '90%',
          maxHeight: activeTab === 'Delete' ? '80vh' : 'auto',
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>
              {contact?.first_name} {contact?.last_name}
            </h3>
          </div>
          <CloseButton
            onClick={onClose}
            theme={theme}
            title="Close"
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Tab Navigation */}
          <TabsContainer theme={theme}>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                theme={theme}
                $active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                {tab.icon}
              </TabButton>
            ))}
          </TabsContainer>

          {/* Tab Content */}
          <TabContent theme={theme}>
            {renderTabContent()}
          </TabContent>

          {/* Action Buttons - only show for non-Delete tabs */}
          {activeTab !== 'Delete' && (
            <ActionButtons theme={theme}>
              <div style={{
                display: 'flex',
                gap: '12px',
                width: '100%'
              }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '11px 24px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '8px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme === 'light' ? '#F9FAFB' : '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = theme === 'light' ? '#FFFFFF' : '#1F2937';
                  }}
                >
                  Close
                </button>
              </div>
            </ActionButtons>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DeleteSkipSpamModal;
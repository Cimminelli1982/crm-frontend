import React from 'react';
import Modal from 'react-modal';
import { FaEdit, FaBriefcase } from 'react-icons/fa';
import { FiX, FiSearch } from 'react-icons/fi';
import {
  PowerupsMenuContainer,
  PowerupsMenuHeader,
  PowerupsMenuTitle,
  PowerupsMenuCloseButton,
  PowerupsMenuContent,
  PowerupsMenuItem,
  PowerupsMenuIcon,
  PowerupsMenuText,
  PowerupsMenuItemTitle,
  PowerupsMenuItemSubtitle
} from './ContactsListDRY.styles';

const PowerupsMenuModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onEditContact,
  onFindDuplicates,
  onEnrichContact
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
          border: theme === 'light' ? '1px solid #E5E7EB' : '1px solid #374151',
          borderRadius: '12px',
          padding: '0',
          width: '320px',
          maxWidth: '90%'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
      contentLabel="Contact Power-ups"
    >
      <PowerupsMenuContainer theme={theme}>
        <PowerupsMenuHeader theme={theme}>
          <PowerupsMenuTitle theme={theme}>
            ⚡ Contact Power-ups
          </PowerupsMenuTitle>
          <PowerupsMenuCloseButton
            theme={theme}
            onClick={onClose}
          >
            <FiX />
          </PowerupsMenuCloseButton>
        </PowerupsMenuHeader>

        <PowerupsMenuContent>
          <PowerupsMenuItem
            theme={theme}
            onClick={() => {
              onClose();
              onEditContact(contact);
            }}
          >
            <PowerupsMenuIcon>
              <FaEdit />
            </PowerupsMenuIcon>
            <PowerupsMenuText theme={theme}>
              <PowerupsMenuItemTitle theme={theme}>Edit Contact</PowerupsMenuItemTitle>
              <PowerupsMenuItemSubtitle theme={theme}>Quick edit contact details</PowerupsMenuItemSubtitle>
            </PowerupsMenuText>
          </PowerupsMenuItem>

          <PowerupsMenuItem
            theme={theme}
            onClick={() => {
              onFindDuplicates(contact);
            }}
          >
            <PowerupsMenuIcon>
              <FiSearch />
            </PowerupsMenuIcon>
            <PowerupsMenuText theme={theme}>
              <PowerupsMenuItemTitle theme={theme}>Merge Contacts</PowerupsMenuItemTitle>
              <PowerupsMenuItemSubtitle theme={theme}>Search & merge duplicate contacts</PowerupsMenuItemSubtitle>
            </PowerupsMenuText>
          </PowerupsMenuItem>

          <PowerupsMenuItem
            theme={theme}
            onClick={() => {
              onEnrichContact(contact);
            }}
          >
            <PowerupsMenuIcon>
              <FaBriefcase />
            </PowerupsMenuIcon>
            <PowerupsMenuText theme={theme}>
              <PowerupsMenuItemTitle theme={theme}>Enrich Contact</PowerupsMenuItemTitle>
              <PowerupsMenuItemSubtitle theme={theme}>Add LinkedIn & company data</PowerupsMenuItemSubtitle>
            </PowerupsMenuText>
          </PowerupsMenuItem>
        </PowerupsMenuContent>
      </PowerupsMenuContainer>
    </Modal>
  );
};

export default PowerupsMenuModal;
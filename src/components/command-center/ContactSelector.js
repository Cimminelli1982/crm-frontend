import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaChevronDown } from 'react-icons/fa';

/**
 * ContactSelector - Dropdown per selezionare un contatto dalla lista disponibile
 *
 * Props:
 * - contacts: Array di { contact_id, first_name, last_name, email, role, completeness_score, show_missing, profile_image_url }
 * - selectedContactId: UUID del contatto selezionato
 * - onSelect: (contactId) => void
 * - onAddNew: () => void - apre modal creazione contatto
 * - onMarkComplete: (contactId) => void - marca contatto come completo
 * - theme: 'dark' | 'light'
 * - disabled: boolean
 */

const Container = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 8px;
`;

const DropdownButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${props => props.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#333' : '#eee'};
    border-color: ${props => props.theme === 'dark' ? '#555' : '#ccc'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SelectedContact = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const Avatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : (props.theme === 'dark' ? '#444' : '#ddd')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const ContactName = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContactRole = styled.span`
  font-size: 11px;
  color: ${props => props.theme === 'dark' ? '#888' : '#666'};
`;

const CompletenessContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const CompletenessScore = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${props => {
    const score = props.$score || 0;
    const markedComplete = props.$markedComplete;
    // Se marked complete ma non 100% reale → arancione
    if (markedComplete && score < 100) return '#f59e0b';
    // Se 100% reale → verde
    if (score === 100) return '#22c55e';
    // Altrimenti colori normali basati su score
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }};
`;

const ChevronIcon = styled(FaChevronDown)`
  transition: transform 0.2s;
  transform: ${props => props.$open ? 'rotate(180deg)' : 'rotate(0)'};
  color: ${props => props.theme === 'dark' ? '#888' : '#666'};
  flex-shrink: 0;
  margin-left: 8px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#fff'};
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  background: ${props => props.$selected ? (props.theme === 'dark' ? '#333' : '#e3f2fd') : 'transparent'};
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  }

  &:first-child {
    border-radius: 7px 7px 0 0;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${props => props.theme === 'dark' ? '#333' : '#eee'};
  margin: 4px 0;
`;

const AddNewButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  border-radius: 0 0 7px 7px;
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  }
`;

const NoContacts = styled.div`
  padding: 16px 12px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#888' : '#666'};
  font-size: 13px;
`;

const ContactSelector = ({
  contacts = [],
  selectedContactId,
  onSelect,
  onAddNew,
  theme = 'dark',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedContact = contacts.find(c => c.contact_id === selectedContactId);

  const getInitials = (contact) => {
    if (!contact) return '?';
    const first = contact.first_name?.[0] || '';
    const last = contact.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const getFullName = (contact) => {
    if (!contact) return 'Select contact...';
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';
  };

  const handleSelect = (contactId) => {
    onSelect(contactId);
    setIsOpen(false);
  };

  return (
    <Container ref={containerRef}>
      <DropdownButton
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        theme={theme}
      >
        <SelectedContact>
          <Avatar theme={theme} $hasImage={!!selectedContact?.profile_image_url}>
            {selectedContact?.profile_image_url ? (
              <img src={selectedContact.profile_image_url} alt="" />
            ) : (
              getInitials(selectedContact)
            )}
          </Avatar>
          <ContactInfo>
            <ContactName>{getFullName(selectedContact)}</ContactName>
            {selectedContact?.role && (
              <ContactRole theme={theme}>{selectedContact.role}</ContactRole>
            )}
          </ContactInfo>
          {selectedContact && (
            <CompletenessContainer>
              <CompletenessScore
                $score={selectedContact.completeness_score}
                $markedComplete={selectedContact.show_missing === false}
              >
                {selectedContact.show_missing === false ? '100' : (selectedContact.completeness_score || 0)}%
              </CompletenessScore>
            </CompletenessContainer>
          )}
        </SelectedContact>
        <ChevronIcon $open={isOpen} theme={theme} />
      </DropdownButton>

      {isOpen && (
        <DropdownMenu theme={theme}>
          {contacts.length === 0 ? (
            <NoContacts theme={theme}>No contacts available</NoContacts>
          ) : (
            contacts.map((contact) => (
              <ContactItem
                key={contact.contact_id}
                $selected={contact.contact_id === selectedContactId}
                theme={theme}
                onClick={() => handleSelect(contact.contact_id)}
              >
                <SelectedContact>
                  <Avatar theme={theme} $hasImage={!!contact.profile_image_url}>
                    {contact.profile_image_url ? (
                      <img src={contact.profile_image_url} alt="" />
                    ) : (
                      getInitials(contact)
                    )}
                  </Avatar>
                  <ContactInfo>
                    <ContactName>{getFullName(contact)}</ContactName>
                    {contact.role && (
                      <ContactRole theme={theme}>{contact.role}</ContactRole>
                    )}
                  </ContactInfo>
                  <CompletenessContainer>
                    <CompletenessScore
                      $score={contact.completeness_score}
                      $markedComplete={contact.show_missing === false}
                    >
                      {contact.show_missing === false ? '100' : (contact.completeness_score || 0)}%
                    </CompletenessScore>
                  </CompletenessContainer>
                </SelectedContact>
              </ContactItem>
            ))
          )}
          <Divider theme={theme} />
          <AddNewButton theme={theme} onClick={() => { setIsOpen(false); onAddNew?.(); }}>
            <FaPlus />
            Add new contact
          </AddNewButton>
        </DropdownMenu>
      )}
    </Container>
  );
};

export default ContactSelector;

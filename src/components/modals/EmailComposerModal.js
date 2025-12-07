import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const EMAIL_SIGNATURE = `
--
SIMONE CIMMINELLI
Newsletter: https://www.angelinvesting.it/
Website: https://www.cimminelli.com/
LinkedIn: https://www.linkedin.com/in/cimminelli/

Build / Buy / Invest in
internet businesses.`;

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
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
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#9CA3AF'};
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3B82F6;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3B82F6;
  }
`;

const EmailBubbleContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  min-height: 42px;
  align-items: center;
  cursor: text;
  position: relative;

  &:focus-within {
    border-color: #3B82F6;
  }
`;

const EmailBubble = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A5F'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  border-radius: 6px;
  font-size: 13px;
`;

const EmailBubbleRemove = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

const EmailBubbleInput = styled.input`
  flex: 1;
  min-width: 150px;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const AutocompleteItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const AutocompleteAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  overflow: hidden;
`;

const AutocompleteInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AutocompleteName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const AutocompleteEmail = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #3B82F6;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmailComposerModal = ({
  isOpen,
  onClose,
  theme = 'light',
  initialTo = [],
  initialSubject = '',
  mode = 'compose' // 'compose', 'reply', 'replyAll', 'forward'
}) => {
  const [composeTo, setComposeTo] = useState([]);
  const [composeCc, setComposeCc] = useState([]);
  const [composeToInput, setComposeToInput] = useState('');
  const [composeCcInput, setComposeCcInput] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [sending, setSending] = useState(false);

  // Initialize with provided values
  useEffect(() => {
    if (isOpen) {
      // Convert initialTo to array of { email, name } objects
      const toRecipients = initialTo.map(item => {
        if (typeof item === 'string') {
          return { email: item, name: '' };
        }
        return { email: item.email, name: item.name || '' };
      });
      setComposeTo(toRecipients);
      setComposeSubject(initialSubject);
      setComposeBody('\n\n' + EMAIL_SIGNATURE);
      setComposeCc([]);
      setComposeToInput('');
      setComposeCcInput('');
    }
  }, [isOpen, initialTo, initialSubject]);

  const searchContacts = async (query) => {
    if (!query || query.length < 2) {
      setContactSuggestions([]);
      return;
    }

    try {
      // Search by email directly in contact_emails table
      const { data: emailMatches, error: emailError } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contacts (
            contact_id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .ilike('email', `%${query}%`)
        .limit(8);

      if (emailError) throw emailError;

      // Also search by name in contacts and get their emails
      const { data: nameMatches, error: nameError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          profile_image_url,
          contact_emails (email)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(8);

      if (nameError) throw nameError;

      // Transform email matches to flat structure
      const emailSuggestions = (emailMatches || [])
        .filter(item => item.contacts)
        .map(item => ({
          id: item.contacts.contact_id,
          first_name: item.contacts.first_name,
          last_name: item.contacts.last_name,
          email: item.email,
          profile_image_url: item.contacts.profile_image_url
        }));

      // Transform name matches - expand to one entry per email
      const nameSuggestions = (nameMatches || []).flatMap(contact => {
        const emails = contact.contact_emails || [];
        if (emails.length === 0) return [];
        return emails.map(e => ({
          id: contact.contact_id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: e.email,
          profile_image_url: contact.profile_image_url
        }));
      });

      // Combine and deduplicate by email
      const allSuggestions = [...emailSuggestions, ...nameSuggestions];
      const uniqueByEmail = allSuggestions.filter((item, index, self) =>
        index === self.findIndex(t => t.email === item.email)
      );

      setContactSuggestions(uniqueByEmail.slice(0, 8));
    } catch (error) {
      console.error('Error searching contacts:', error);
      setContactSuggestions([]);
    }
  };

  const addEmailToField = (field, contact) => {
    const email = typeof contact === 'string' ? contact : contact.email;
    const name = typeof contact === 'string' ? '' : `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

    if (field === 'to') {
      if (!composeTo.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeTo([...composeTo, { email, name }]);
      }
      setComposeToInput('');
    } else {
      if (!composeCc.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeCc([...composeCc, { email, name }]);
      }
      setComposeCcInput('');
    }
    setContactSuggestions([]);
  };

  const removeEmailFromField = (field, email) => {
    if (field === 'to') {
      setComposeTo(composeTo.filter(r => r.email !== email));
    } else {
      setComposeCc(composeCc.filter(r => r.email !== email));
    }
  };

  const handleEmailInputKeyDown = (e, field) => {
    const input = field === 'to' ? composeToInput : composeCcInput;

    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, '');
      if (trimmed && trimmed.includes('@')) {
        addEmailToField(field, trimmed);
      }
    } else if (e.key === 'Backspace' && !input) {
      if (field === 'to' && composeTo.length > 0) {
        setComposeTo(composeTo.slice(0, -1));
      } else if (field === 'cc' && composeCc.length > 0) {
        setComposeCc(composeCc.slice(0, -1));
      }
    }
  };

  const handleSend = async () => {
    if (composeTo.length === 0 || !composeBody.trim()) {
      toast.error('Please fill in recipient and message');
      return;
    }

    setSending(true);

    try {
      // Get just the body text (before the signature separator if any)
      const bodyText = composeBody.split('─'.repeat(40))[0].trim();

      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc.length > 0 ? composeCc : undefined,
          subject: composeSubject,
          textBody: bodyText,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Email sent!');
      handleClose();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject('');
    setComposeBody('');
    setContactSuggestions([]);
    setActiveField(null);
    onClose();
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'reply': return 'Reply';
      case 'replyAll': return 'Reply All';
      case 'forward': return 'Forward';
      default: return 'New Email';
    }
  };

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent theme={theme} onClick={e => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>{getTitle()}</ModalTitle>
          <CloseButton theme={theme} onClick={handleClose}>
            <FaTimes size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody theme={theme}>
          <FormField>
            <FormLabel theme={theme}>To</FormLabel>
            <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('composer-to-input')?.focus()}>
              {composeTo.map((recipient, idx) => (
                <EmailBubble key={idx} theme={theme}>
                  {recipient.name || recipient.email}
                  <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('to', recipient.email); }}>
                    <FaTimes size={10} />
                  </EmailBubbleRemove>
                </EmailBubble>
              ))}
              <EmailBubbleInput
                id="composer-to-input"
                theme={theme}
                value={composeToInput}
                onChange={(e) => {
                  setComposeToInput(e.target.value);
                  setActiveField('to');
                  searchContacts(e.target.value);
                }}
                onKeyDown={(e) => handleEmailInputKeyDown(e, 'to')}
                onFocus={() => setActiveField('to')}
                onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                placeholder={composeTo.length === 0 ? "Type name or email..." : ""}
              />
              {activeField === 'to' && contactSuggestions.length > 0 && (
                <AutocompleteDropdown theme={theme}>
                  {contactSuggestions.map((contact) => (
                    <AutocompleteItem
                      key={`${contact.id}-${contact.email}`}
                      theme={theme}
                      onMouseDown={() => addEmailToField('to', contact)}
                    >
                      <AutocompleteAvatar theme={theme}>
                        {contact.profile_image_url ? (
                          <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        ) : (
                          `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`
                        )}
                      </AutocompleteAvatar>
                      <AutocompleteInfo>
                        <AutocompleteName theme={theme}>{contact.first_name} {contact.last_name}</AutocompleteName>
                        <AutocompleteEmail theme={theme}>{contact.email}</AutocompleteEmail>
                      </AutocompleteInfo>
                    </AutocompleteItem>
                  ))}
                </AutocompleteDropdown>
              )}
            </EmailBubbleContainer>
          </FormField>

          <FormField>
            <FormLabel theme={theme}>CC</FormLabel>
            <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('composer-cc-input')?.focus()}>
              {composeCc.map((recipient, idx) => (
                <EmailBubble key={idx} theme={theme}>
                  {recipient.name || recipient.email}
                  <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('cc', recipient.email); }}>
                    <FaTimes size={10} />
                  </EmailBubbleRemove>
                </EmailBubble>
              ))}
              <EmailBubbleInput
                id="composer-cc-input"
                theme={theme}
                value={composeCcInput}
                onChange={(e) => {
                  setComposeCcInput(e.target.value);
                  setActiveField('cc');
                  searchContacts(e.target.value);
                }}
                onKeyDown={(e) => handleEmailInputKeyDown(e, 'cc')}
                onFocus={() => setActiveField('cc')}
                onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                placeholder={composeCc.length === 0 ? "Add CC (optional)..." : ""}
              />
              {activeField === 'cc' && contactSuggestions.length > 0 && (
                <AutocompleteDropdown theme={theme}>
                  {contactSuggestions.map((contact) => (
                    <AutocompleteItem
                      key={`${contact.id}-${contact.email}`}
                      theme={theme}
                      onMouseDown={() => addEmailToField('cc', contact)}
                    >
                      <AutocompleteAvatar theme={theme}>
                        {contact.profile_image_url ? (
                          <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        ) : (
                          `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`
                        )}
                      </AutocompleteAvatar>
                      <AutocompleteInfo>
                        <AutocompleteName theme={theme}>{contact.first_name} {contact.last_name}</AutocompleteName>
                        <AutocompleteEmail theme={theme}>{contact.email}</AutocompleteEmail>
                      </AutocompleteInfo>
                    </AutocompleteItem>
                  ))}
                </AutocompleteDropdown>
              )}
            </EmailBubbleContainer>
          </FormField>

          <FormField>
            <FormLabel theme={theme}>Subject</FormLabel>
            <FormInput
              theme={theme}
              type="text"
              value={composeSubject}
              onChange={e => setComposeSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </FormField>

          <FormField>
            <FormLabel theme={theme}>Message</FormLabel>
            <FormTextarea
              theme={theme}
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              placeholder="Write your message..."
            />
          </FormField>
        </ModalBody>

        <ModalFooter theme={theme}>
          <CancelButton theme={theme} onClick={handleClose}>
            Cancel
          </CancelButton>
          <SendButton onClick={handleSend} disabled={sending || composeTo.length === 0}>
            <FaPaperPlane />
            {sending ? 'Sending...' : 'Send'}
          </SendButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EmailComposerModal;

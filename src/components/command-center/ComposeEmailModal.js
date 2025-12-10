import React from 'react';
import { FaTimes, FaPaperPlane, FaPaperclip } from 'react-icons/fa';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalBody,
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  ModalFooter,
  SendButton,
  CancelButton,
  EmailBubbleContainer,
  EmailBubble,
  EmailBubbleRemove,
  EmailBubbleInput,
  AutocompleteDropdown,
  AutocompleteItem,
  AutocompleteAvatar,
  AutocompleteInfo,
  AutocompleteName,
  AutocompleteEmail,
} from '../../pages/CommandCenterPage.styles';

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const ComposeEmailModal = ({
  theme,
  composeModal,
  closeCompose,
  // To field
  composeTo,
  composeToInput,
  setComposeToInput,
  // Cc field
  composeCc,
  composeCcInput,
  setComposeCcInput,
  // Subject and Body
  composeSubject,
  setComposeSubject,
  composeBody,
  setComposeBody,
  // Autocomplete
  contactSuggestions,
  activeField,
  setActiveField,
  searchContacts,
  addEmailToField,
  removeEmailFromField,
  handleEmailInputKeyDown,
  // Attachments
  composeAttachments,
  composeFileInputRef,
  handleComposeFileSelect,
  removeComposeAttachment,
  // Send
  sending,
  handleSend,
}) => {
  if (!composeModal.open) return null;

  return (
    <ModalOverlay onClick={closeCompose}>
      <ModalContent theme={theme} onClick={e => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            {composeModal.mode === 'forward' ? 'Forward' : composeModal.mode === 'replyAll' ? 'Reply All' : 'Reply'}
          </ModalTitle>
          <CloseButton theme={theme} onClick={closeCompose}>
            <FaTimes size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody theme={theme}>
          <FormField>
            <FormLabel theme={theme}>To</FormLabel>
            <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('to-input')?.focus()}>
              {composeTo.map((recipient, idx) => (
                <EmailBubble key={idx} theme={theme}>
                  {recipient.name || recipient.email}
                  <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('to', recipient.email); }}>
                    <FaTimes size={10} />
                  </EmailBubbleRemove>
                </EmailBubble>
              ))}
              <EmailBubbleInput
                id="to-input"
                theme={theme}
                value={composeToInput}
                onChange={(e) => {
                  setComposeToInput(e.target.value);
                  setActiveField('to');
                  searchContacts(e.target.value);
                }}
                onKeyDown={(e) => handleEmailInputKeyDown(e, 'to')}
                onFocus={() => setActiveField('to')}
                onBlur={() => setTimeout(() => { setActiveField(null); }, 200)}
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
            <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('cc-input')?.focus()}>
              {composeCc.map((recipient, idx) => (
                <EmailBubble key={idx} theme={theme}>
                  {recipient.name || recipient.email}
                  <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('cc', recipient.email); }}>
                    <FaTimes size={10} />
                  </EmailBubbleRemove>
                </EmailBubble>
              ))}
              <EmailBubbleInput
                id="cc-input"
                theme={theme}
                value={composeCcInput}
                onChange={(e) => {
                  setComposeCcInput(e.target.value);
                  setActiveField('cc');
                  searchContacts(e.target.value);
                }}
                onKeyDown={(e) => handleEmailInputKeyDown(e, 'cc')}
                onFocus={() => setActiveField('cc')}
                onBlur={() => setTimeout(() => { setActiveField(null); }, 200)}
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

          {/* Attachments Section */}
          <FormField>
            <input
              type="file"
              multiple
              ref={composeFileInputRef}
              onChange={handleComposeFileSelect}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: composeAttachments.length > 0 ? '8px' : 0 }}>
              <button
                type="button"
                onClick={() => composeFileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: theme === 'light' ? '#F3F4F6' : '#374151',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <FaPaperclip size={12} />
                Attach Files
              </button>
              {composeAttachments.length > 0 && (
                <span style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  {composeAttachments.length} file{composeAttachments.length > 1 ? 's' : ''} attached
                </span>
              )}
            </div>
            {composeAttachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {composeAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      background: theme === 'light' ? '#EFF6FF' : '#1E3A5F',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <FaPaperclip size={10} style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }} />
                    <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.name}
                    </span>
                    <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      ({formatFileSize(att.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeComposeAttachment(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>
        </ModalBody>

        <ModalFooter theme={theme}>
          <CancelButton theme={theme} onClick={closeCompose}>
            Cancel
          </CancelButton>
          <SendButton onClick={handleSend} disabled={sending}>
            <FaPaperPlane />
            {sending ? 'Sending...' : 'Send'}
          </SendButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ComposeEmailModal;

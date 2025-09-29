import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiLink, FiCheck, FiEdit2, FiUser, FiLoader, FiSave, FiExternalLink, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';

// Styled components
const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  }
`;

const ModalContent = styled.div`
  padding: 20px 24px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  position: relative;
  box-sizing: border-box;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const SuggestionSection = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#2d2d2d'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#444'};
`;

const SuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: ${props => props.theme === 'light' ? '#2563EB' : '#0077b5'};
  font-weight: 600;
  font-size: 14px;
`;

const ContactPreview = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1a1a1a'};
  border-radius: 6px;
  padding: 12px;
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : 'transparent'};
`;

const ContactImage = styled.div`
  width: 50px;
  height: 50px;
  background: ${props => props.theme === 'light' ? '#2563EB' : '#0077b5'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex: 1;
`;

const ContactName = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.theme === 'light' ? '#111827' : 'white'};
`;

const ContactDetails = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#bbb'};
`;

const CompanyInfo = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#999'};
`;

const AcceptButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${props => props.theme === 'light' ? '#10B981' : '#00c851'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#059669' : '#00a043'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionSection = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#2a2a2a'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#444'};
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${props => props.theme === 'light' ? '#374151' : '#ddd'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${props => props.theme === 'light' ? '#2563EB' : '#0077b5'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#1D4ED8' : '#006097'};
  }
`;

const InputGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#bbb'};
  font-size: 12px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1e1e1e'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#444'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#111827' : 'white'};
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#2563EB' : '#0077b5'};
    box-shadow: 0 0 0 1px ${props => props.theme === 'light' ? '#2563EB' : '#0077b5'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#666'};
  }
`;

const SaveUrlButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${props => props.theme === 'light' ? '#10B981' : '#28a745'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#059669' : '#218838'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EnrichButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${props => {
    if (!props.enabled) return props.theme === 'light' ? '#E5E7EB' : '#666';
    return props.theme === 'light' ? '#DC2626' : '#ff6b35';
  }};
  color: ${props => {
    if (!props.enabled) return props.theme === 'light' ? '#9CA3AF' : 'white';
    return 'white';
  }};
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.enabled ? 'pointer' : 'not-allowed'};

  &:hover {
    background: ${props => {
      if (!props.enabled) return props.theme === 'light' ? '#E5E7EB' : '#666';
      return props.theme === 'light' ? '#B91C1C' : '#e55a2b';
    }};
  }
`;

// Modal styles - dynamic based on theme, same width as Power-ups modal
const getModalStyles = (theme) => ({
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
    width: '400px', // Slightly wider for the richer content
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1050
  }
});

// Set the app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const ContactEnrichModal = ({
  isOpen,
  onClose,
  contact,
  onEnrichComplete,
  theme = 'light'
}) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [apolloSuggestion, setApolloSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (isOpen && contact) {
      setLinkedinUrl(contact.linkedin || '');
      setUrlSaved(!!contact.linkedin);
      // Load Apollo suggestion when modal opens
      loadApolloSuggestion();
    }
  }, [isOpen, contact]);

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || '?';
  };

  const loadApolloSuggestion = async () => {
    if (!contact) return;

    setLoadingSuggestion(true);
    try {
      // Call our optimized LinkedIn finder Edge Function
      const response = await supabase.functions.invoke('linkedin-finder', {
        body: { contactId: contact.contact_id }
      });

      if (response.error) {
        console.error('LinkedIn finder error:', response.error);
        throw new Error(response.error.message || 'Failed to find LinkedIn suggestions');
      }

      const data = response.data;

      if (data.success && data.matches && data.matches.length > 0) {
        // Use the best match (highest confidence)
        const bestMatch = data.matches[0];

        setApolloSuggestion({
          name: bestMatch.person_data.name,
          jobTitle: bestMatch.person_data.title || contact.job_role || 'Professional',
          company: bestMatch.person_data.company || 'Company',
          location: bestMatch.person_data.location || 'Location',
          linkedinUrl: bestMatch.linkedin_url,
          confidence: bestMatch.confidence,
          matchReason: bestMatch.match_reason
        });
      } else {
        // No matches found
        setApolloSuggestion(null);
      }
    } catch (error) {
      console.error('Error loading LinkedIn suggestions:', error);
      // Show a fallback suggestion based on contact data
      setApolloSuggestion({
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        jobTitle: contact.job_role || contact.job_title || 'Professional',
        company: 'Company not found',
        location: 'Location unknown',
        linkedinUrl: null,
        confidence: 0,
        matchReason: 'Manual search required',
        isError: true
      });
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const acceptSuggestion = async () => {
    if (!apolloSuggestion || !apolloSuggestion.linkedinUrl) {
      toast.warning('No LinkedIn URL available to accept');
      return;
    }

    setLinkedinUrl(apolloSuggestion.linkedinUrl);

    // Auto-save the suggested LinkedIn URL
    await saveLinkedInUrl(apolloSuggestion.linkedinUrl);
  };

  const saveLinkedInUrl = async (urlToSave = linkedinUrl) => {
    if (!urlToSave || !contact) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ linkedin: urlToSave })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      setUrlSaved(true);
      toast.success('LinkedIn URL saved successfully!');

      // Update the URL state if we used the parameter
      if (urlToSave !== linkedinUrl) {
        setLinkedinUrl(urlToSave);
      }

    } catch (error) {
      console.error('Error saving LinkedIn URL:', error);
      toast.error('Failed to save LinkedIn URL');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkedInSearch = () => {
    const searchQuery = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  const handleEnrichWithApollo = () => {
    if (!urlSaved) {
      toast.warning('Please save the LinkedIn URL first');
      return;
    }

    // TODO: Open Apollo enrichment modal
    toast.info('Apollo enrichment modal will be implemented next');

    if (onEnrichComplete) {
      onEnrichComplete();
    }
  };

  if (!contact) return null;

  const contactName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={getModalStyles(theme)}
      contentLabel={`Enrich Contact: ${contactName}`}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>
          💼 Enrich Contact: {contactName}
        </ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>

      <ModalContent theme={theme}>
        {/* Apollo Matching Suggestion */}
        <SuggestionSection theme={theme}>
          <SuggestionHeader theme={theme}>
            <FiUser size={16} />
            Apollo Matching Suggestion
          </SuggestionHeader>

          {loadingSuggestion ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: theme === 'light' ? '#6B7280' : '#999'
            }}>
              <FiLoader size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              Loading suggestion...
            </div>
          ) : apolloSuggestion ? (
            <>
              <ContactPreview theme={theme}>
                <ContactImage theme={theme}>
                  {getInitials(contact.first_name, contact.last_name)}
                </ContactImage>
                <ContactInfo>
                  <ContactName theme={theme}>{apolloSuggestion.name}</ContactName>
                  <ContactDetails theme={theme}>{apolloSuggestion.jobTitle}</ContactDetails>
                  <CompanyInfo theme={theme}>{apolloSuggestion.company} • {apolloSuggestion.location}</CompanyInfo>
                  {apolloSuggestion.matchReason && (
                    <div style={{
                      fontSize: '11px',
                      color: theme === 'light' ? '#10B981' : '#00c851',
                      marginTop: '4px',
                      fontWeight: '500'
                    }}>
                      ✓ {apolloSuggestion.matchReason}
                    </div>
                  )}
                </ContactInfo>
              </ContactPreview>
              <AcceptButton
                theme={theme}
                onClick={acceptSuggestion}
                disabled={saving || !apolloSuggestion.linkedinUrl || apolloSuggestion.isError}
              >
                {saving ? (
                  <>
                    <FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Accepting...
                  </>
                ) : apolloSuggestion.linkedinUrl ? (
                  <>
                    <FiCheck size={14} />
                    Accept Suggestion ({apolloSuggestion.confidence}% match)
                  </>
                ) : (
                  <>
                    <FiSearch size={14} />
                    No LinkedIn URL Found - Search Manually
                  </>
                )}
              </AcceptButton>
            </>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: theme === 'light' ? '#6B7280' : '#999',
              fontStyle: 'italic'
            }}>
              No suggestions found for this contact
            </div>
          )}
        </SuggestionSection>

        {/* LinkedIn Search */}
        <ActionSection theme={theme}>
          <SectionTitle theme={theme}>
            <FiSearch size={14} />
            Manual Search
          </SectionTitle>

          <ActionButton theme={theme} onClick={handleLinkedInSearch}>
            <FiExternalLink size={14} />
            Search on LinkedIn
          </ActionButton>
        </ActionSection>

        {/* LinkedIn URL Input */}
        <ActionSection theme={theme}>
          <SectionTitle theme={theme}>
            <FiLink size={14} />
            LinkedIn URL
          </SectionTitle>

          <InputGroup>
            <Label theme={theme}>LinkedIn Profile URL</Label>
            <Input
              theme={theme}
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </InputGroup>

          <SaveUrlButton
            theme={theme}
            onClick={() => saveLinkedInUrl()}
            disabled={saving || !linkedinUrl}
          >
            {saving ? (
              <>
                <FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <FiSave size={14} />
                {urlSaved ? 'Update URL' : 'Save URL'}
              </>
            )}
          </SaveUrlButton>
        </ActionSection>

        {/* Apollo Enrich Button */}
        <EnrichButton
          theme={theme}
          enabled={urlSaved}
          onClick={handleEnrichWithApollo}
          disabled={!urlSaved}
        >
          <FiUser size={16} />
          Enrich via Apollo
          {!urlSaved && ' (Save URL first)'}
        </EnrichButton>
      </ModalContent>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
};

export default ContactEnrichModal;
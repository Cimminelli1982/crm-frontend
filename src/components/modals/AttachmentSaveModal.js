import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';
import { FaPaperclip, FaBuilding, FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const Title = styled.h2`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const Section = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AttachmentsList = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
`;

const AttachmentItem = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#FFFFFF' : '#1F2937')};

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
      : (props.theme === 'light' ? '#F9FAFB' : '#374151')};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Checkbox = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid ${props => props.$checked ? '#3B82F6' : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$checked ? '#3B82F6' : 'transparent'};
  color: white;
  flex-shrink: 0;
`;

const AttachmentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttachmentName = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AttachmentMeta = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const FileIcon = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-shrink: 0;
`;

const SuggestedCompanies = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  overflow: hidden;
  max-height: 180px;
  overflow-y: auto;
`;

const CompanyItem = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#DCFCE7' : '#14532D')
    : (props.theme === 'light' ? '#FFFFFF' : '#1F2937')};

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#DCFCE7' : '#14532D')
      : (props.theme === 'light' ? '#F9FAFB' : '#374151')};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CompanyInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CompanyName = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CompanyDomain = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const DomainBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A5F'};
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#93C5FD'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 10px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 10px 8px 32px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const EmptyState = styled.div`
  padding: 16px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: #10B981;
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #059669;
    }

    &:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: transparent;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

    &:hover {
      background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    }
  }

  &.skip {
    background: transparent;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    border: none;
    padding: 10px 12px;

    &:hover {
      color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    }
  }
`;

const SkipNote = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  margin-top: 8px;
  text-align: center;
`;

const getFileIcon = (type, name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (type?.includes('pdf') || ext === 'pdf') return FaFilePdf;
  if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FaFileImage;
  if (type?.includes('word') || ['doc', 'docx'].includes(ext)) return FaFileWord;
  if (type?.includes('excel') || type?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return FaFileExcel;
  return FaFile;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentSaveModal = ({
  isOpen,
  onRequestClose,
  attachments = [],
  emailParticipants = [],
  theme = 'light',
  onSave,
  onSkip,
  backendUrl = 'https://command-center-backend-production.up.railway.app'
}) => {
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [suggestedCompanies, setSuggestedCompanies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get contacts from email participants (excluding me)
  const MY_EMAIL = 'simone@cimminelli.com';
  const participantContacts = emailParticipants
    .filter(p => p.email?.toLowerCase() !== MY_EMAIL && p.contact?.contact_id)
    .map(p => ({
      contactId: p.contact.contact_id,
      contactName: `${p.contact.first_name || ''} ${p.contact.last_name || ''}`.trim() || p.email,
      email: p.email
    }));

  // Initialize selected attachments
  useEffect(() => {
    if (isOpen) {
      setSelectedAttachments(attachments.map((_, idx) => idx));
      setSelectedCompany(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen, attachments]);

  // Fetch suggested companies based on contacts in the email
  useEffect(() => {
    if (!isOpen || participantContacts.length === 0) {
      setSuggestedCompanies([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const contactIds = participantContacts.map(p => p.contactId);

        // Get companies linked to these contacts via contact_companies
        const { data, error } = await supabase
          .from('contact_companies')
          .select(`
            company_id,
            contact_id,
            companies:company_id (
              company_id,
              name,
              website
            )
          `)
          .in('contact_id', contactIds);

        if (error) {
          console.error('Error fetching companies from contacts:', error);
        } else {
          // Deduplicate and enrich with contact info
          const companyMap = new Map();
          (data || []).forEach(row => {
            if (row.companies) {
              const company = row.companies;
              const contact = participantContacts.find(p => p.contactId === row.contact_id);
              if (!companyMap.has(company.company_id)) {
                companyMap.set(company.company_id, {
                  ...company,
                  linkedContacts: [contact?.contactName].filter(Boolean)
                });
              } else {
                const existing = companyMap.get(company.company_id);
                if (contact?.contactName && !existing.linkedContacts.includes(contact.contactName)) {
                  existing.linkedContacts.push(contact.contactName);
                }
              }
            }
          });

          const companiesWithContacts = Array.from(companyMap.values());
          setSuggestedCompanies(companiesWithContacts);

          // Auto-select first suggested company
          if (companiesWithContacts.length > 0 && !selectedCompany) {
            setSelectedCompany(companiesWithContacts[0]);
          }
        }
      } catch (err) {
        console.error('Error in fetchSuggestions:', err);
      }
      setLoading(false);
    };

    fetchSuggestions();
  }, [isOpen, participantContacts.map(p => p.contactId).join(',')]);

  // Search companies
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, website')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (!error) {
        setSearchResults(data || []);
      }
    };

    const debounce = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const toggleAttachment = (idx) => {
    setSelectedAttachments(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const handleSave = async () => {
    if (selectedAttachments.length === 0) {
      toast.error('Select at least one attachment');
      return;
    }

    setSaving(true);
    try {
      const attachmentsToSave = selectedAttachments.map(idx => attachments[idx]);

      for (const att of attachmentsToSave) {
        // 1. Download attachment from Fastmail
        toast.loading(`Downloading ${att.name}...`, { id: 'att-save' });

        const downloadUrl = `${backendUrl}/attachment/${encodeURIComponent(att.blobId)}?name=${encodeURIComponent(att.name || 'attachment')}&type=${encodeURIComponent(att.type || 'application/octet-stream')}`;
        const response = await fetch(downloadUrl);

        if (!response.ok) {
          throw new Error(`Failed to download ${att.name}`);
        }

        const blob = await response.blob();

        // 2. Upload to Supabase Storage
        toast.loading(`Uploading ${att.name}...`, { id: 'att-save' });

        // Sanitize filename for Supabase storage (remove special chars, spaces)
        const sanitizedName = att.name
          .replace(/[£€$¥]/g, '') // Remove currency symbols
          .replace(/[^\w\s.-]/g, '_') // Replace special chars with underscore
          .replace(/\s+/g, '_') // Replace spaces with underscore
          .replace(/_+/g, '_'); // Collapse multiple underscores
        const fileName = `${Date.now()}_${sanitizedName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, blob, {
            contentType: att.type || 'application/octet-stream'
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${att.name}: ${uploadError.message}`);
        }

        // 3. Get public URL
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);

        // 4. Create attachment record
        const { data: attachmentRecord, error: insertError } = await supabase
          .from('attachments')
          .insert({
            file_name: att.name,
            file_url: uploadData.path,
            file_type: att.type,
            file_size: att.size,
            permanent_url: urlData.publicUrl,
            created_by: 'User'
          })
          .select('attachment_id')
          .single();

        if (insertError) {
          throw new Error(`Failed to save ${att.name}: ${insertError.message}`);
        }

        // 5. Link to company if selected
        if (selectedCompany) {
          const { error: linkError } = await supabase
            .from('company_attachments')
            .insert({
              company_id: selectedCompany.company_id,
              attachment_id: attachmentRecord.attachment_id
            });

          if (linkError) {
            console.error('Error linking attachment to company:', linkError);
          }
        }
      }

      toast.success(`${attachmentsToSave.length} attachment${attachmentsToSave.length > 1 ? 's' : ''} saved!`, { id: 'att-save' });

      if (onSave) {
        onSave(attachmentsToSave, selectedCompany);
      }
      onRequestClose();
    } catch (error) {
      console.error('Error saving attachments:', error);
      toast.error(error.message || 'Failed to save attachments', { id: 'att-save' });
    }
    setSaving(false);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onRequestClose();
  };

  const displayCompanies = searchTerm.trim() ? searchResults : suggestedCompanies;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        content: {
          position: 'relative',
          inset: 'auto',
          width: '480px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflow: 'auto',
          borderRadius: '12px',
          padding: '20px',
          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
        }
      }}
    >
      <Header theme={theme}>
        <Title theme={theme}>
          <FaPaperclip /> Save Attachments
        </Title>
        <CloseButton theme={theme} onClick={onRequestClose}>
          <FiX size={18} />
        </CloseButton>
      </Header>

      <Section>
        <SectionTitle theme={theme}>
          <FaPaperclip size={11} />
          Select Attachments ({selectedAttachments.length}/{attachments.length})
        </SectionTitle>
        <AttachmentsList theme={theme}>
          {attachments.map((att, idx) => {
            const Icon = getFileIcon(att.type, att.name);
            const isSelected = selectedAttachments.includes(idx);
            return (
              <AttachmentItem
                key={idx}
                theme={theme}
                $selected={isSelected}
                onClick={() => toggleAttachment(idx)}
              >
                <Checkbox theme={theme} $checked={isSelected}>
                  {isSelected && <FiCheck size={12} />}
                </Checkbox>
                <FileIcon theme={theme}>
                  <Icon size={20} />
                </FileIcon>
                <AttachmentInfo>
                  <AttachmentName theme={theme}>{att.name || 'Unnamed file'}</AttachmentName>
                  <AttachmentMeta theme={theme}>
                    {formatSize(att.size)}
                    {att.emailSubject && ` • ${att.emailSubject.substring(0, 30)}${att.emailSubject.length > 30 ? '...' : ''}`}
                  </AttachmentMeta>
                </AttachmentInfo>
              </AttachmentItem>
            );
          })}
        </AttachmentsList>
      </Section>

      <Section>
        <SectionTitle theme={theme}>
          <FaBuilding size={11} />
          Associate with Company (optional)
        </SectionTitle>

        <SearchContainer>
          <SearchIcon theme={theme}>
            <FiSearch size={14} />
          </SearchIcon>
          <SearchInput
            theme={theme}
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        {loading ? (
          <EmptyState theme={theme}>Loading suggestions...</EmptyState>
        ) : displayCompanies.length > 0 ? (
          <SuggestedCompanies theme={theme}>
            {displayCompanies.map(company => (
              <CompanyItem
                key={company.company_id}
                theme={theme}
                $selected={selectedCompany?.company_id === company.company_id}
                onClick={() => setSelectedCompany(
                  selectedCompany?.company_id === company.company_id ? null : company
                )}
              >
                <CompanyInfo>
                  <CompanyName theme={theme}>
                    <FaBuilding size={12} />
                    {company.name}
                  </CompanyName>
                  {company.linkedContacts && company.linkedContacts.length > 0 && (
                    <CompanyDomain theme={theme}>
                      via {company.linkedContacts.join(', ')}
                    </CompanyDomain>
                  )}
                </CompanyInfo>
                {selectedCompany?.company_id === company.company_id && (
                  <FiCheck size={16} color="#10B981" />
                )}
              </CompanyItem>
            ))}
          </SuggestedCompanies>
        ) : (
          <EmptyState theme={theme}>
            {searchTerm ? 'No companies found' : participantContacts.length > 0 ? 'No companies linked to contacts in this email' : 'No contacts with linked companies in this email'}
          </EmptyState>
        )}
      </Section>

      <ButtonGroup theme={theme}>
        <Button className="skip" theme={theme} onClick={handleSkip}>
          Skip
        </Button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button className="secondary" theme={theme} onClick={onRequestClose}>
            Cancel
          </Button>
          <Button
            className="primary"
            theme={theme}
            onClick={handleSave}
            disabled={saving || selectedAttachments.length === 0}
          >
            {saving ? 'Saving...' : `Save ${selectedAttachments.length} file${selectedAttachments.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </ButtonGroup>

      <SkipNote theme={theme}>
        Skip will continue without saving attachments to CRM
      </SkipNote>
    </Modal>
  );
};

export default AttachmentSaveModal;

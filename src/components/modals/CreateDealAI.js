import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FaTimes, FaRobot, FaBuilding, FaUser, FaDollarSign, FaSave, FaSpinner, FaCheck, FaLink, FaPaperclip, FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app';

// Styled Components
const ModalContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  max-width: 800px;
  width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 4px;
  &:hover { color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'}; }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const Section = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const SectionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${props => props.color || '#3B82F6'};
  color: white;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormGroupFull = styled(FormGroup)`
  grid-column: 1 / -1;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  &:focus { outline: none; border-color: #3B82F6; }
  &:disabled { opacity: 0.7; background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'}; }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  &:focus { outline: none; border-color: #3B82F6; }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  min-height: 80px;
  resize: vertical;
  &:focus { outline: none; border-color: #3B82F6; }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const PrimaryButton = styled(Button)`
  background: #10B981;
  color: white;
  border: none;
  &:hover:not(:disabled) { background: #059669; }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  &:hover:not(:disabled) { background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(17,24,39,0.95)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SpinIcon = styled.div`
  animation: spin 1s linear infinite;
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
`;

const ExistingBadge = styled(Badge)`
  background: #10B981;
  color: white;
`;

const NewBadge = styled(Badge)`
  background: #F59E0B;
  color: white;
`;

const AssociationBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A5F'};
  border-radius: 6px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#93C5FD'};
  margin-top: 12px;
`;

// Attachment styled components
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

const AttCheckbox = styled.div`
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

const EmptyAttachments = styled.div`
  padding: 16px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
`;

// Helper functions for attachments
const getFileIcon = (type, name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (type?.includes('pdf') || ext === 'pdf') return FaFilePdf;
  if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FaFileImage;
  if (type?.includes('word') || ['doc', 'docx'].includes(ext)) return FaFileWord;
  if (type?.includes('excel') || type?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return FaFileExcel;
  return FaFile;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const modalStyles = (theme) => ({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    inset: 'auto',
    padding: 0,
    border: 'none',
    background: 'transparent',
    overflow: 'visible',
  }
});

// Enums
const DEAL_CATEGORIES = ['Startup', 'Fund', 'Real Estate', 'Private Debt', 'Private Equity', 'Other'];
const DEAL_STAGES = ['Lead', 'Evaluating', 'Closing', 'Invested', 'Monitoring', 'Passed'];
const DEAL_SOURCE_CATEGORIES = ['Cold Contacting', 'Introduction'];
const DEAL_CURRENCIES = ['EUR', 'USD', 'GBP', 'PLN'];
const CONTACT_CATEGORIES = ['Founder', 'Professional Investor', 'Manager', 'Advisor', 'Other'];
const COMPANY_CATEGORIES = ['Startup', 'Professional Investor', 'Corporation', 'SME', 'Advisory', 'Other'];

const CreateDealAI = ({ isOpen, onClose, email, whatsappChat, sourceType = 'email', theme = 'light', onSuccess }) => {
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracted, setExtracted] = useState(null);

  // Form state
  const [contactData, setContactData] = useState({
    use_existing: false,
    existing_contact_id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_role: '',
    linkedin: '',
    category: 'Founder'
  });

  const [companyData, setCompanyData] = useState({
    use_existing: false,
    existing_company_id: null,
    name: '',
    website: '',
    domain: '',
    category: 'Startup',
    description: ''
  });

  const [dealData, setDealData] = useState({
    opportunity: '',
    total_investment: '',
    deal_currency: 'EUR',
    category: 'Startup',
    stage: 'Lead',
    source_category: 'Cold Contacting',
    description: '',
    proposed_at: ''
  });

  const [associations, setAssociations] = useState({
    contact_is_proposer: true,
    link_contact_to_company: true,
    contact_company_relationship: 'founder'
  });

  // Attachments state
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const emailAttachments = email?.attachments || [];
  const hasAttachments = sourceType === 'email' && emailAttachments.length > 0;

  // Initialize selected attachments when modal opens
  useEffect(() => {
    if (isOpen && hasAttachments) {
      setSelectedAttachments(emailAttachments.map((_, idx) => idx));
    }
  }, [isOpen, hasAttachments, emailAttachments.length]);

  const toggleAttachment = (idx) => {
    setSelectedAttachments(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  // Extract deal info from email or WhatsApp
  const extractDealInfo = useCallback(async () => {
    // Check if we have valid source data
    if (sourceType === 'email' && !email) return;
    if (sourceType === 'whatsapp' && !whatsappChat) return;

    setExtracting(true);

    try {
      let payload;

      if (sourceType === 'whatsapp') {
        // WhatsApp: combine all messages into conversation text
        const messages = whatsappChat.messages || [];
        const conversationText = messages.map(msg => {
          const sender = msg.is_from_me ? 'Me' : (whatsappChat.chat_name || whatsappChat.contact_number);
          return `[${sender}]: ${msg.body || ''}`;
        }).join('\n');

        payload = {
          source_type: 'whatsapp',
          contact_phone: whatsappChat.contact_number,
          contact_name: whatsappChat.chat_name || '',
          conversation_text: conversationText,
          date: messages[messages.length - 1]?.timestamp || ''
        };
      } else {
        // Email
        payload = {
          source_type: 'email',
          from_email: email.from_email,
          from_name: email.from_name || '',
          subject: email.subject || '',
          body_text: email.body_text || email.snippet || '',
          date: email.date || ''
        };
      }

      const response = await fetch(`${AGENT_SERVICE_URL}/extract-deal-from-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to extract deal info');
      }

      const result = await response.json();

      if (result.success && result.extracted) {
        setExtracted(result);

        // Populate contact form
        const c = result.extracted.contact || {};
        setContactData({
          use_existing: c.use_existing || false,
          existing_contact_id: c.existing_contact_id || null,
          first_name: c.first_name || '',
          last_name: c.last_name || '',
          email: c.email || (sourceType === 'email' ? email?.from_email : '') || '',
          phone: c.phone || (sourceType === 'whatsapp' ? whatsappChat?.contact_number : '') || '',
          job_role: c.job_role || '',
          linkedin: c.linkedin || '',
          category: c.category || 'Founder'
        });

        // Populate company form
        const co = result.extracted.company || {};
        setCompanyData({
          use_existing: co.use_existing || false,
          existing_company_id: co.existing_company_id || null,
          name: co.name || '',
          website: co.website || '',
          domain: co.domain || '',
          category: co.category || 'Startup',
          description: co.description || ''
        });

        // Populate deal form
        const d = result.extracted.deal || {};
        // Get date from email or last WhatsApp message
        let proposedDate;
        if (sourceType === 'email' && email?.date) {
          proposedDate = new Date(email.date).toISOString().split('T')[0];
        } else if (sourceType === 'whatsapp' && whatsappChat?.messages?.length) {
          const lastMsg = whatsappChat.messages[whatsappChat.messages.length - 1];
          proposedDate = lastMsg?.timestamp ? new Date(lastMsg.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        } else {
          proposedDate = new Date().toISOString().split('T')[0];
        }
        setDealData({
          opportunity: d.opportunity || '',
          total_investment: d.total_investment ? String(d.total_investment) : '',
          deal_currency: d.deal_currency || 'EUR',
          category: d.category || 'Startup',
          stage: d.stage || 'Lead',
          source_category: d.source_category || 'Cold Contacting',
          description: d.description || '',
          proposed_at: proposedDate
        });

        // Populate associations
        const a = result.extracted.associations || {};
        setAssociations({
          contact_is_proposer: a.contact_is_proposer !== false,
          link_contact_to_company: a.link_contact_to_company !== false,
          contact_company_relationship: a.contact_company_relationship || 'founder'
        });
      }

    } catch (error) {
      console.error('Error extracting deal info:', error);
      toast.error('Failed to extract deal information');
    } finally {
      setExtracting(false);
    }
  }, [email, whatsappChat, sourceType]);

  // Save everything
  const handleSave = async () => {
    if (!dealData.opportunity.trim()) {
      toast.error('Deal name is required');
      return;
    }

    setSaving(true);

    try {
      let contactId = contactData.use_existing ? contactData.existing_contact_id : null;
      let companyId = companyData.use_existing ? companyData.existing_company_id : null;

      // 1. Create contact if needed
      if (!contactId && (contactData.first_name || contactData.last_name)) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: contactData.first_name,
            last_name: contactData.last_name,
            job_role: contactData.job_role || null,
            linkedin: contactData.linkedin || null,
            category: contactData.category,
            created_by: 'User'
          })
          .select()
          .single();

        if (contactError) throw contactError;
        contactId = newContact.contact_id;

        // Add email
        if (contactData.email) {
          await supabase.from('contact_emails').insert({
            contact_id: contactId,
            email: contactData.email,
            is_primary: true
          });
        }

        // Add phone (for WhatsApp contacts)
        if (contactData.phone) {
          await supabase.from('contact_mobiles').insert({
            contact_id: contactId,
            mobile_number: contactData.phone,
            is_primary: true
          });
        }

        toast.success(`Contact "${contactData.first_name} ${contactData.last_name}" created`);
      }

      // 2. Create company if needed
      if (!companyId && companyData.name) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyData.name,
            website: companyData.website || null,
            category: companyData.category,
            description: companyData.description || null,
            created_by: 'User'
          })
          .select()
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.company_id;

        // Add domain
        if (companyData.domain) {
          await supabase.from('company_domains').insert({
            company_id: companyId,
            domain: companyData.domain,
            is_primary: true
          });
        }

        toast.success(`Company "${companyData.name}" created`);
      }

      // 3. Link contact to company if both exist and association is enabled
      if (contactId && companyId && associations.link_contact_to_company) {
        const { data: existingLink } = await supabase
          .from('contact_companies')
          .select('contact_companies_id')
          .eq('contact_id', contactId)
          .eq('company_id', companyId)
          .limit(1);

        if (!existingLink?.length) {
          await supabase.from('contact_companies').insert({
            contact_id: contactId,
            company_id: companyId,
            relationship: associations.contact_company_relationship,
            is_primary: true
          });
        }
      }

      // 4. Create deal
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert({
          opportunity: dealData.opportunity,
          description: dealData.description || null,
          category: dealData.category,
          stage: dealData.stage,
          source_category: dealData.source_category,
          total_investment: dealData.total_investment ? parseFloat(dealData.total_investment) : null,
          deal_currency: dealData.deal_currency,
          proposed_at: dealData.proposed_at || null,
          created_by: 'User'
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // 5. Link deal to company
      if (companyId) {
        await supabase.from('deal_companies').insert({
          deal_id: newDeal.deal_id,
          company_id: companyId,
          is_primary: true
        });
      }

      // 6. Link deal to contact as proposer
      if (contactId && associations.contact_is_proposer) {
        await supabase.from('deals_contacts').insert({
          deal_id: newDeal.deal_id,
          contact_id: contactId,
          relationship: 'proposer'
        });
      }

      // 7. Save attachments and link to deal
      if (hasAttachments && selectedAttachments.length > 0) {
        const attachmentsToSave = selectedAttachments.map(idx => emailAttachments[idx]);
        let savedCount = 0;

        for (const att of attachmentsToSave) {
          try {
            // Download attachment from Fastmail
            const downloadUrl = `${BACKEND_URL}/attachment/${encodeURIComponent(att.blobId)}?name=${encodeURIComponent(att.name || 'attachment')}&type=${encodeURIComponent(att.type || 'application/octet-stream')}`;
            const response = await fetch(downloadUrl);

            if (!response.ok) {
              console.error(`Failed to download ${att.name}`);
              continue;
            }

            const blob = await response.blob();

            // Sanitize filename for Supabase storage
            const sanitizedName = (att.name || 'file')
              .replace(/[£€$¥]/g, '')
              .replace(/[^\w\s.-]/g, '_')
              .replace(/\s+/g, '_')
              .replace(/_+/g, '_');
            const fileName = `${Date.now()}_${sanitizedName}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('attachments')
              .upload(fileName, blob, {
                contentType: att.type || 'application/octet-stream'
              });

            if (uploadError) {
              console.error(`Failed to upload ${att.name}:`, uploadError);
              continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(fileName);

            // Create attachment record
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
              console.error(`Failed to save ${att.name}:`, insertError);
              continue;
            }

            // Link attachment to deal
            await supabase.from('deal_attachments').insert({
              deal_id: newDeal.deal_id,
              attachment_id: attachmentRecord.attachment_id
            });

            // Also link to company if we have one
            if (companyId) {
              await supabase.from('company_attachments').insert({
                company_id: companyId,
                attachment_id: attachmentRecord.attachment_id
              }).catch(() => {}); // Ignore duplicates
            }

            savedCount++;
          } catch (attError) {
            console.error(`Error saving attachment ${att.name}:`, attError);
          }
        }

        if (savedCount > 0) {
          toast.success(`${savedCount} attachment${savedCount > 1 ? 's' : ''} saved to deal`);
        }
      }

      toast.success(`Deal "${dealData.opportunity}" created!`);

      if (onSuccess) onSuccess(newDeal);
      onClose();

    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Failed to create deal: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Extract on open - handles both email and whatsapp
  useEffect(() => {
    const hasSource = (sourceType === 'email' && email) || (sourceType === 'whatsapp' && whatsappChat);
    if (isOpen && hasSource && !extracted) {
      extractDealInfo();
    }
  }, [isOpen, email, whatsappChat, sourceType, extracted, extractDealInfo]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setExtracted(null);
      setContactData({ use_existing: false, existing_contact_id: null, first_name: '', last_name: '', email: '', phone: '', job_role: '', linkedin: '', category: 'Founder' });
      setCompanyData({ use_existing: false, existing_company_id: null, name: '', website: '', domain: '', category: 'Startup', description: '' });
      setDealData({ opportunity: '', total_investment: '', deal_currency: 'EUR', category: 'Startup', stage: 'Lead', source_category: 'Cold Contacting', description: '', proposed_at: '' });
      setAssociations({ contact_is_proposer: true, link_contact_to_company: true, contact_company_relationship: 'founder' });
      setSelectedAttachments([]);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={modalStyles(theme)} contentLabel="Create Deal">
      <ModalContainer theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            <FaRobot style={{ color: '#8B5CF6' }} />
            New Deal from {sourceType === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </ModalTitle>
          <CloseButton theme={theme} onClick={onClose}><FaTimes size={18} /></CloseButton>
        </ModalHeader>

        <ModalBody theme={theme} style={{ position: 'relative' }}>
          {extracting && (
            <LoadingOverlay theme={theme}>
              <SpinIcon><FaSpinner size={32} color="#8B5CF6" /></SpinIcon>
              <LoadingText theme={theme}>Extracting deal info with AI...</LoadingText>
            </LoadingOverlay>
          )}

          {/* Contact Section */}
          <Section theme={theme}>
            <SectionHeader theme={theme}>
              <SectionIcon color="#3B82F6"><FaUser size={14} /></SectionIcon>
              Contact (Proposer)
              {contactData.use_existing ? <ExistingBadge><FaCheck size={10} /> Existing</ExistingBadge> : <NewBadge>New</NewBadge>}
            </SectionHeader>
            <FormGrid>
              <FormGroup>
                <Label theme={theme}>First Name</Label>
                <Input theme={theme} value={contactData.first_name} onChange={(e) => setContactData(p => ({ ...p, first_name: e.target.value }))} disabled={contactData.use_existing} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Last Name</Label>
                <Input theme={theme} value={contactData.last_name} onChange={(e) => setContactData(p => ({ ...p, last_name: e.target.value }))} disabled={contactData.use_existing} />
              </FormGroup>
              {sourceType === 'email' ? (
                <FormGroup>
                  <Label theme={theme}>Email</Label>
                  <Input theme={theme} value={contactData.email} onChange={(e) => setContactData(p => ({ ...p, email: e.target.value }))} disabled={contactData.use_existing} />
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label theme={theme}>Phone</Label>
                  <Input theme={theme} value={contactData.phone} onChange={(e) => setContactData(p => ({ ...p, phone: e.target.value }))} disabled={contactData.use_existing} />
                </FormGroup>
              )}
              <FormGroup>
                <Label theme={theme}>Job Role</Label>
                <Input theme={theme} value={contactData.job_role} onChange={(e) => setContactData(p => ({ ...p, job_role: e.target.value }))} disabled={contactData.use_existing} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>LinkedIn</Label>
                <Input theme={theme} value={contactData.linkedin} onChange={(e) => setContactData(p => ({ ...p, linkedin: e.target.value }))} disabled={contactData.use_existing} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Category</Label>
                <Select theme={theme} value={contactData.category} onChange={(e) => setContactData(p => ({ ...p, category: e.target.value }))} disabled={contactData.use_existing}>
                  {CONTACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormGroup>
            </FormGrid>
          </Section>

          {/* Company Section */}
          <Section theme={theme}>
            <SectionHeader theme={theme}>
              <SectionIcon color="#10B981"><FaBuilding size={14} /></SectionIcon>
              Company
              {companyData.use_existing ? <ExistingBadge><FaCheck size={10} /> Existing</ExistingBadge> : <NewBadge>New</NewBadge>}
            </SectionHeader>
            <FormGrid>
              <FormGroup>
                <Label theme={theme}>Company Name</Label>
                <Input theme={theme} value={companyData.name} onChange={(e) => setCompanyData(p => ({ ...p, name: e.target.value }))} disabled={companyData.use_existing} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Website</Label>
                <Input theme={theme} value={companyData.website} onChange={(e) => setCompanyData(p => ({ ...p, website: e.target.value }))} disabled={companyData.use_existing} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Domain</Label>
                <Input theme={theme} value={companyData.domain} onChange={(e) => setCompanyData(p => ({ ...p, domain: e.target.value }))} disabled={companyData.use_existing} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Category</Label>
                <Select theme={theme} value={companyData.category} onChange={(e) => setCompanyData(p => ({ ...p, category: e.target.value }))} disabled={companyData.use_existing}>
                  {COMPANY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormGroup>
              <FormGroupFull>
                <Label theme={theme}>Description</Label>
                <TextArea theme={theme} value={companyData.description} onChange={(e) => setCompanyData(p => ({ ...p, description: e.target.value }))} disabled={companyData.use_existing} />
              </FormGroupFull>
            </FormGrid>
            {associations.link_contact_to_company && (
              <AssociationBox theme={theme}>
                <FaLink size={12} />
                Contact linked as {associations.contact_company_relationship}
              </AssociationBox>
            )}
          </Section>

          {/* Deal Section */}
          <Section theme={theme}>
            <SectionHeader theme={theme}>
              <SectionIcon color="#F59E0B"><FaDollarSign size={14} /></SectionIcon>
              Deal
            </SectionHeader>
            <FormGrid>
              <FormGroupFull>
                <Label theme={theme}>Deal Name *</Label>
                <Input theme={theme} value={dealData.opportunity} onChange={(e) => setDealData(p => ({ ...p, opportunity: e.target.value }))} />
              </FormGroupFull>
              <FormGroup>
                <Label theme={theme}>Category</Label>
                <Select theme={theme} value={dealData.category} onChange={(e) => setDealData(p => ({ ...p, category: e.target.value }))}>
                  {DEAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Stage</Label>
                <Select theme={theme} value={dealData.stage} onChange={(e) => setDealData(p => ({ ...p, stage: e.target.value }))}>
                  {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Source</Label>
                <Select theme={theme} value={dealData.source_category} onChange={(e) => setDealData(p => ({ ...p, source_category: e.target.value }))}>
                  {DEAL_SOURCE_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Proposed Date</Label>
                <Input theme={theme} type="date" value={dealData.proposed_at} onChange={(e) => setDealData(p => ({ ...p, proposed_at: e.target.value }))} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Investment Amount</Label>
                <Input theme={theme} type="number" value={dealData.total_investment} onChange={(e) => setDealData(p => ({ ...p, total_investment: e.target.value }))} />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>Currency</Label>
                <Select theme={theme} value={dealData.deal_currency} onChange={(e) => setDealData(p => ({ ...p, deal_currency: e.target.value }))}>
                  {DEAL_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormGroup>
              <FormGroupFull>
                <Label theme={theme}>Description</Label>
                <TextArea theme={theme} value={dealData.description} onChange={(e) => setDealData(p => ({ ...p, description: e.target.value }))} />
              </FormGroupFull>
            </FormGrid>
          </Section>

          {/* Attachments Section - only shown when email has attachments */}
          {hasAttachments && (
            <Section theme={theme}>
              <SectionHeader theme={theme}>
                <SectionIcon color="#6366F1"><FaPaperclip size={14} /></SectionIcon>
                Attachments ({selectedAttachments.length}/{emailAttachments.length})
              </SectionHeader>
              <AttachmentsList theme={theme}>
                {emailAttachments.map((att, idx) => {
                  const Icon = getFileIcon(att.type, att.name);
                  const isSelected = selectedAttachments.includes(idx);
                  return (
                    <AttachmentItem
                      key={idx}
                      theme={theme}
                      $selected={isSelected}
                      onClick={() => toggleAttachment(idx)}
                    >
                      <AttCheckbox theme={theme} $checked={isSelected}>
                        {isSelected && <FaCheck size={10} />}
                      </AttCheckbox>
                      <FileIcon theme={theme}>
                        <Icon size={18} />
                      </FileIcon>
                      <AttachmentInfo>
                        <AttachmentName theme={theme}>{att.name || 'Unnamed file'}</AttachmentName>
                        <AttachmentMeta theme={theme}>{formatFileSize(att.size)}</AttachmentMeta>
                      </AttachmentInfo>
                    </AttachmentItem>
                  );
                })}
              </AttachmentsList>
            </Section>
          )}
        </ModalBody>

        <ModalFooter theme={theme}>
          <SecondaryButton theme={theme} onClick={onClose} disabled={saving}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving || extracting}>
            {saving ? <><SpinIcon><FaSpinner size={14} /></SpinIcon>Saving...</> : <><FaSave size={14} />Create Deal</>}
          </PrimaryButton>
        </ModalFooter>
      </ModalContainer>
    </Modal>
  );
};

export default CreateDealAI;

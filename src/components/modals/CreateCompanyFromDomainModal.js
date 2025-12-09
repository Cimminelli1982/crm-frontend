import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiCheck, FiLoader, FiSave, FiRefreshCw, FiSearch, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { FaBuilding, FaLinkedin, FaTags, FaFileAlt, FaUsers, FaGlobe } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

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

const DomainBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  margin-left: 8px;
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
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  max-height: 70vh;
  overflow-y: auto;
`;

const SectionCard = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#2D3748'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#4A5568'};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#E2E8F0'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RequiredBadge = styled.span`
  color: #EF4444;
  font-weight: 600;
`;

const InputGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 1px ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }

  &:disabled {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.$error
    ? '#EF4444'
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  box-sizing: border-box;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 1px ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }
`;

const DescriptionBox = styled.div`
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 6px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
`;

const LogoPreview = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  padding: 4px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
`;

const LogoPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const RefreshButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 6px;
  margin-bottom: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3B82F6;
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ContactEmail = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const CategoryBadge = styled.span`
  padding: 2px 8px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  border-radius: 4px;
  font-size: 11px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

const WarningBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  border: 1px solid ${props => props.theme === 'light' ? '#FCD34D' : '#B45309'};
  border-radius: 6px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#92400E' : '#FCD34D'};
  margin-top: 8px;
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${props => props.$primary
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : props.$success
    ? (props.theme === 'light' ? '#10B981' : '#059669')
    : (props.theme === 'light' ? '#FFFFFF' : '#374151')
  };
  color: ${props => props.$primary || props.$success
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#374151' : '#F3F4F6')
  };
  border: 1px solid ${props => props.$primary || props.$success
    ? 'transparent'
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.$primary
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : props.$success
      ? (props.theme === 'light' ? '#059669' : '#047857')
      : (props.theme === 'light' ? '#F9FAFB' : '#4B5563')
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

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
    width: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1050
  }
});

const COMPANY_CATEGORY_OPTIONS = [
  'Startup',
  'Professional Investor',
  'SME',
  'Advisory',
  'Corporation',
  'Corporate',
  'Institution',
  'Media',
  'Skip',
  'Hold'
];

if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const CreateCompanyFromDomainModal = ({
  isOpen,
  onClose,
  domainData,
  theme = 'light',
  onSuccess
}) => {
  // Apollo enrichment state
  const [loadingApollo, setLoadingApollo] = useState(false);
  const [apolloData, setApolloData] = useState(null);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [category, setCategory] = useState('');

  // Tags state
  const [selectedTags, setSelectedTags] = useState([]);
  const [matchedTags, setMatchedTags] = useState([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState([]);
  const [searchingTags, setSearchingTags] = useState(false);

  // Contacts state
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsInCrm, setContactsInCrm] = useState([]);
  const [emailsNotInCrm, setEmailsNotInCrm] = useState([]);

  // Additional domains state
  const [additionalDomains, setAdditionalDomains] = useState([]);
  const [newDomainInput, setNewDomainInput] = useState('');

  // Creation state
  const [saving, setSaving] = useState(false);
  const [domainExists, setDomainExists] = useState(false);

  // Fetch Apollo data
  const fetchApolloData = async () => {
    if (!domainData?.domain) return;

    setLoadingApollo(true);
    try {
      const response = await supabase.functions.invoke('company-enrichment', {
        body: {
          website: domainData.domain,
          companyName: domainData.domain
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data.success && data.data) {
        const apolloResult = data.data;
        setApolloData(apolloResult);
        setCompanyName(apolloResult.name || domainData.domain);
        setLinkedinUrl(apolloResult.linkedin || '');

        // Fetch matching tags if Apollo returned tags
        if (apolloResult.tags && apolloResult.tags.length > 0) {
          await fetchMatchingTags(apolloResult.tags);
        }
      } else {
        // Fallback to domain as company name
        setCompanyName(domainData.domain);
        toast('Could not enrich from Apollo - enter details manually', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error fetching Apollo data:', error);
      setCompanyName(domainData.domain);
      toast('Could not enrich from Apollo - enter details manually', { icon: '⚠️' });
    } finally {
      setLoadingApollo(false);
    }
  };

  // Fetch matching tags from Supabase
  const fetchMatchingTags = async (apolloTags) => {
    try {
      const { data: allTags, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .order('name');

      if (error) throw error;

      const apolloTagsLower = apolloTags.map(t => t.toLowerCase());
      const scoredTags = allTags.map(tag => {
        const tagNameLower = tag.name.toLowerCase();
        let score = 0;

        if (apolloTagsLower.includes(tagNameLower)) {
          score += 100;
        }

        for (const apolloTag of apolloTagsLower) {
          if (apolloTag.includes(tagNameLower) || tagNameLower.includes(apolloTag)) {
            score += 50;
          }
          const apolloWords = apolloTag.split(/[\s,&-]+/).filter(w => w.length > 2);
          const tagWords = tagNameLower.split(/[\s,&-]+/).filter(w => w.length > 2);
          for (const word of tagWords) {
            if (apolloWords.some(aw => aw.includes(word) || word.includes(aw))) {
              score += 20;
            }
          }
        }

        return { ...tag, score };
      })
        .filter(tag => tag.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);

      setMatchedTags(scoredTags);
    } catch (error) {
      console.error('Error fetching matching tags:', error);
    }
  };

  // Search tags by query
  const searchTags = async (query) => {
    if (!query || query.length < 2) {
      setTagSearchResults([]);
      return;
    }

    setSearchingTags(true);
    try {
      const { data: tags, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (error) throw error;

      const filteredTags = tags.filter(
        tag => !selectedTags.some(t => t.tag_id === tag.tag_id)
      );
      setTagSearchResults(filteredTags);
    } catch (error) {
      console.error('Error searching tags:', error);
    } finally {
      setSearchingTags(false);
    }
  };

  // Debounced tag search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTags(tagSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tagSearchQuery, selectedTags]);

  // Fetch contacts with this domain
  const fetchContacts = async () => {
    if (!domainData?.domain) return;

    setLoadingContacts(true);
    try {
      // Get all contacts with emails matching this domain
      const { data: emailMatches, error } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contact_id,
          contacts (
            contact_id,
            full_name,
            category
          )
        `)
        .ilike('email', `%@${domainData.domain}`);

      if (error) throw error;

      // Process contacts found in CRM
      const foundContacts = [];
      const seenContactIds = new Set();

      if (emailMatches) {
        for (const match of emailMatches) {
          if (match.contacts && !seenContactIds.has(match.contacts.contact_id)) {
            seenContactIds.add(match.contacts.contact_id);
            foundContacts.push({
              contact_id: match.contacts.contact_id,
              full_name: match.contacts.full_name,
              email: match.email,
              category: match.contacts.category,
              selected: true
            });
          }
        }
      }

      setContactsInCrm(foundContacts);

      // Check which sample emails are NOT in CRM
      const foundEmails = emailMatches?.map(m => m.email.toLowerCase()) || [];
      const notInCrm = (domainData.sampleEmails || [])
        .filter(email => !foundEmails.includes(email.toLowerCase()))
        .map(email => ({ email, selected: false }));

      setEmailsNotInCrm(notInCrm);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Check if domain already exists
  const checkDomainExists = async () => {
    if (!domainData?.domain) return;

    try {
      const { data, error } = await supabase
        .from('company_domains')
        .select('id')
        .eq('domain', domainData.domain)
        .single();

      if (data && !error) {
        setDomainExists(true);
      }
    } catch (error) {
      // Domain doesn't exist, which is expected
      setDomainExists(false);
    }
  };

  // On modal open
  useEffect(() => {
    if (isOpen && domainData) {
      // Reset state
      setApolloData(null);
      setCompanyName('');
      setLinkedinUrl('');
      setCategory('');
      setSelectedTags([]);
      setMatchedTags([]);
      setTagSearchQuery('');
      setTagSearchResults([]);
      setContactsInCrm([]);
      setEmailsNotInCrm([]);
      setAdditionalDomains([]);
      setNewDomainInput('');
      setDomainExists(false);

      // Fetch data in parallel
      fetchApolloData();
      fetchContacts();
      checkDomainExists();
    }
  }, [isOpen, domainData]);

  // Toggle contact selection
  const toggleContactSelection = (contactId) => {
    setContactsInCrm(prev => prev.map(c =>
      c.contact_id === contactId ? { ...c, selected: !c.selected } : c
    ));
  };

  // Add additional domain
  const handleAddDomain = () => {
    const domain = newDomainInput.trim().toLowerCase();
    if (domain && !additionalDomains.includes(domain) && domain !== domainData?.domain) {
      setAdditionalDomains(prev => [...prev, domain]);
      setNewDomainInput('');
    }
  };

  // Remove additional domain
  const handleRemoveDomain = (domain) => {
    setAdditionalDomains(prev => prev.filter(d => d !== domain));
  };

  // Create company
  const handleCreateCompany = async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setSaving(true);
    try {
      // Check again if domain exists (race condition check)
      const { data: existingDomain } = await supabase
        .from('company_domains')
        .select('id, company_id')
        .eq('domain', domainData.domain)
        .single();

      if (existingDomain) {
        toast.error('This domain was already added to a company');
        setSaving(false);
        return;
      }

      // 1. Create company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          category: category,
          linkedin: linkedinUrl || null,
          description: apolloData?.description || null
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Add primary domain
      await supabase
        .from('company_domains')
        .insert({
          company_id: newCompany.company_id,
          domain: domainData.domain,
          is_primary: true
        });

      // 3. Add additional domains
      for (const domain of additionalDomains) {
        await supabase
          .from('company_domains')
          .insert({
            company_id: newCompany.company_id,
            domain: domain,
            is_primary: false
          });
      }

      // 4. Link selected contacts
      for (const contact of contactsInCrm.filter(c => c.selected)) {
        // Check if already linked
        const { data: existingLink } = await supabase
          .from('contact_companies')
          .select('entry_id')
          .eq('contact_id', contact.contact_id)
          .eq('company_id', newCompany.company_id)
          .single();

        if (!existingLink) {
          // Check if contact has a primary company
          const { data: hasPrimary } = await supabase
            .from('contact_companies')
            .select('entry_id')
            .eq('contact_id', contact.contact_id)
            .eq('is_primary', true)
            .single();

          await supabase
            .from('contact_companies')
            .insert({
              contact_id: contact.contact_id,
              company_id: newCompany.company_id,
              is_primary: !hasPrimary,
              relationship: 'not_set'
            });
        }
      }

      // 5. Save selected tags
      for (const tag of selectedTags) {
        const { data: existingTag } = await supabase
          .from('company_tags')
          .select('entry_id')
          .eq('company_id', newCompany.company_id)
          .eq('tag_id', tag.tag_id)
          .single();

        if (!existingTag) {
          await supabase
            .from('company_tags')
            .insert({
              company_id: newCompany.company_id,
              tag_id: tag.tag_id
            });
        }
      }

      // 6. Handle logo
      if (apolloData?.logo_url) {
        try {
          const { data: attachment, error: attachmentError } = await supabase
            .from('attachments')
            .insert({
              file_name: `${companyName}_logo`,
              file_url: apolloData.logo_url,
              permanent_url: apolloData.logo_url,
              file_type: 'image',
              description: `Company logo for ${companyName}`,
              processed: true,
              processing_status: 'completed'
            })
            .select()
            .single();

          if (!attachmentError && attachment) {
            await supabase
              .from('company_attachments')
              .insert({
                company_id: newCompany.company_id,
                attachment_id: attachment.attachment_id,
                is_logo: true
              });
          }
        } catch (logoError) {
          console.error('Error saving logo:', logoError);
        }
      }

      toast.success('Company created successfully!');

      if (onSuccess) {
        onSuccess(newCompany.company_id);
      }

      onClose();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setSaving(false);
    }
  };

  if (!domainData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={getModalStyles(theme)}
      contentLabel="Create Company from Domain"
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>
          <FaBuilding /> Create Company from Domain
          <DomainBadge theme={theme}>
            <FaGlobe size={12} />
            {domainData.domain}
            {domainData.count && ` (${domainData.count} emails)`}
          </DomainBadge>
        </ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>

      <ModalContent theme={theme}>
        {domainExists && (
          <WarningBox theme={theme}>
            <FiAlertCircle />
            This domain already exists in the CRM. You may want to link it to an existing company instead.
          </WarningBox>
        )}

        {/* Company Information Section */}
        <SectionCard theme={theme}>
          <SectionHeader>
            <SectionTitle theme={theme}>
              <FaBuilding /> Company Information
            </SectionTitle>
            <RefreshButton
              theme={theme}
              onClick={fetchApolloData}
              disabled={loadingApollo}
            >
              {loadingApollo ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
              Refresh
            </RefreshButton>
          </SectionHeader>

          {loadingApollo ? (
            <LoadingState theme={theme}>
              <FiLoader className="animate-spin" />
              Fetching company data from Apollo...
            </LoadingState>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {apolloData?.logo_url ? (
                  <LogoPreview theme={theme} src={apolloData.logo_url} alt="Company logo" />
                ) : (
                  <LogoPlaceholder theme={theme}>
                    <FaBuilding />
                  </LogoPlaceholder>
                )}
                <div style={{ flex: 1 }}>
                  <InputGroup>
                    <Label theme={theme}>Company Name <RequiredBadge>*</RequiredBadge></Label>
                    <Input
                      theme={theme}
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                    />
                  </InputGroup>
                </div>
              </div>

              <InputGroup>
                <Label theme={theme}>LinkedIn URL</Label>
                <Input
                  theme={theme}
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
              </InputGroup>

              {apolloData?.description && (
                <InputGroup>
                  <Label theme={theme}>Description (from Apollo)</Label>
                  <DescriptionBox theme={theme}>
                    {apolloData.description}
                  </DescriptionBox>
                </InputGroup>
              )}
            </>
          )}
        </SectionCard>

        {/* Category Section */}
        <SectionCard theme={theme}>
          <SectionTitle theme={theme}>
            <FaTags /> Category <RequiredBadge>*</RequiredBadge>
          </SectionTitle>
          <Select
            theme={theme}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            $error={!category}
          >
            <option value="">Select category...</option>
            {COMPANY_CATEGORY_OPTIONS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
          {!category && (
            <WarningBox theme={theme} style={{ marginTop: 8 }}>
              <FiAlertCircle />
              Category is required to create company
            </WarningBox>
          )}
        </SectionCard>

        {/* Tags Section */}
        <SectionCard theme={theme}>
          <SectionTitle theme={theme}>
            <FaTags /> Tags
          </SectionTitle>

          {/* Matched tags from Apollo */}
          {matchedTags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Label theme={theme}>Suggested from Apollo (click to select)</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {matchedTags.map(tag => {
                  const isSelected = selectedTags.some(t => t.tag_id === tag.tag_id);
                  return (
                    <button
                      key={tag.tag_id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(prev => prev.filter(t => t.tag_id !== tag.tag_id));
                        } else {
                          setSelectedTags(prev => [...prev, tag]);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 16,
                        border: isSelected
                          ? `2px solid ${theme === 'light' ? '#10B981' : '#059669'}`
                          : `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: isSelected
                          ? (theme === 'light' ? '#D1FAE5' : '#064E3B')
                          : (theme === 'light' ? '#F9FAFB' : '#374151'),
                        color: isSelected
                          ? (theme === 'light' ? '#065F46' : '#6EE7B7')
                          : (theme === 'light' ? '#374151' : '#D1D5DB'),
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontWeight: isSelected ? 600 : 400
                      }}
                    >
                      {isSelected && '✓ '}{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inline tag search */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiSearch style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }} />
              <Input
                theme={theme}
                type="text"
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                placeholder="Search and add more tags..."
                style={{ flex: 1 }}
              />
            </div>
            {tagSearchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 24,
                right: 0,
                marginTop: 4,
                background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {tagSearchResults.map(tag => (
                  <button
                    key={tag.tag_id}
                    onClick={() => {
                      setSelectedTags(prev => [...prev, tag]);
                      setTagSearchQuery('');
                      setTagSearchResults([]);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      fontSize: 13,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme === 'light' ? '#F3F4F6' : '#374151'}`
                    }}
                    onMouseEnter={(e) => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTags.length > 0 && (
            <div style={{
              marginTop: 8,
              fontSize: 12,
              color: theme === 'light' ? '#059669' : '#6EE7B7'
            }}>
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </SectionCard>

        {/* Additional Domains Section */}
        <SectionCard theme={theme}>
          <SectionTitle theme={theme}>
            <FaGlobe /> Domains
          </SectionTitle>
          <div style={{ marginBottom: 8 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: theme === 'light' ? '#DBEAFE' : '#1E3A8A',
              color: theme === 'light' ? '#1D4ED8' : '#93C5FD',
              borderRadius: 16,
              fontSize: 13,
              fontWeight: 500,
              marginRight: 8,
              marginBottom: 8
            }}>
              {domainData.domain} (primary)
            </div>
            {additionalDomains.map(domain => (
              <div
                key={domain}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                  borderRadius: 16,
                  fontSize: 13,
                  marginRight: 8,
                  marginBottom: 8
                }}
              >
                {domain}
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              theme={theme}
              type="text"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              placeholder="Add another domain (e.g., acme.co.uk)"
              onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
              style={{ flex: 1 }}
            />
            <ActionButton
              theme={theme}
              onClick={handleAddDomain}
              disabled={!newDomainInput.trim()}
            >
              <FiPlus /> Add
            </ActionButton>
          </div>
        </SectionCard>

        {/* Contacts Section */}
        <SectionCard theme={theme}>
          <SectionTitle theme={theme}>
            <FaUsers /> Contacts to Link
            {!loadingContacts && ` (${contactsInCrm.length} found)`}
          </SectionTitle>

          {loadingContacts ? (
            <LoadingState theme={theme}>
              <FiLoader className="animate-spin" />
              Finding contacts with @{domainData.domain}...
            </LoadingState>
          ) : (
            <>
              {contactsInCrm.length === 0 && emailsNotInCrm.length === 0 ? (
                <EmptyState theme={theme}>
                  No contacts with @{domainData.domain} found in CRM
                </EmptyState>
              ) : (
                <>
                  {contactsInCrm.length > 0 && (
                    <>
                      <Label theme={theme}>Found in CRM:</Label>
                      {contactsInCrm.map(contact => (
                        <ContactItem key={contact.contact_id} theme={theme}>
                          <Checkbox
                            type="checkbox"
                            checked={contact.selected}
                            onChange={() => toggleContactSelection(contact.contact_id)}
                          />
                          <ContactInfo>
                            <ContactName theme={theme}>{contact.full_name}</ContactName>
                            <ContactEmail theme={theme}>{contact.email}</ContactEmail>
                          </ContactInfo>
                          {contact.category && (
                            <CategoryBadge theme={theme}>{contact.category}</CategoryBadge>
                          )}
                        </ContactItem>
                      ))}
                    </>
                  )}

                  {emailsNotInCrm.length > 0 && (
                    <>
                      <Label theme={theme} style={{ marginTop: 12 }}>Not in CRM:</Label>
                      {emailsNotInCrm.map(item => (
                        <ContactItem key={item.email} theme={theme}>
                          <ContactInfo>
                            <ContactEmail theme={theme}>{item.email}</ContactEmail>
                          </ContactInfo>
                          <CategoryBadge theme={theme} style={{
                            background: theme === 'light' ? '#FEF3C7' : '#78350F',
                            color: theme === 'light' ? '#92400E' : '#FCD34D'
                          }}>
                            Not in CRM
                          </CategoryBadge>
                        </ContactItem>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </SectionCard>
      </ModalContent>

      <FooterButtons theme={theme}>
        <ActionButton theme={theme} onClick={onClose}>
          Cancel
        </ActionButton>
        <ActionButton
          theme={theme}
          $success
          onClick={handleCreateCompany}
          disabled={saving || !category || !companyName.trim() || domainExists}
        >
          {saving ? (
            <>
              <FiLoader className="animate-spin" /> Creating...
            </>
          ) : (
            <>
              <FiSave /> Create Company & Link
            </>
          )}
        </ActionButton>
      </FooterButtons>
    </Modal>
  );
};

CreateCompanyFromDomainModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  domainData: PropTypes.shape({
    domain: PropTypes.string.isRequired,
    count: PropTypes.number,
    sampleEmails: PropTypes.arrayOf(PropTypes.string)
  }),
  theme: PropTypes.oneOf(['light', 'dark']),
  onSuccess: PropTypes.func
};

export default CreateCompanyFromDomainModal;

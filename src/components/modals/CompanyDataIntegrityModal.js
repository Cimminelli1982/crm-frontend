import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { findCompanyDuplicates } from '../../utils/duplicateDetection';
import toast from 'react-hot-toast';
import {
  FaTimes, FaLinkedin, FaBuilding, FaMapMarkerAlt, FaTag,
  FaCheck, FaExclamationTriangle, FaCrown, FaUsers, FaSave,
  FaGlobe, FaFileAlt, FaImage, FaTags, FaEdit, FaSearch,
  FaExternalLinkAlt, FaMagic, FaTrash
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import CompanyEnrichmentModal from './CompanyEnrichmentModal';

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 100%;
  max-width: 750px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  overflow: hidden;
`;

const HeaderText = styled.div``;

const CompanyName = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CompanySubtitle = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScoreCircle = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
`;

const ScoreText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const MissingFieldsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MissingFieldChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#FEF2F2' : '#7F1D1D'};
  border: 1px solid ${props => props.theme === 'light' ? '#FECACA' : '#DC2626'};
  border-radius: 20px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#DC2626' : '#FCA5A5'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#991B1B'};
  }
`;

const CompleteFieldChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  border: 1px solid ${props => props.theme === 'light' ? '#BBF7D0' : '#10B981'};
  border-radius: 20px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#16A34A' : '#6EE7B7'};
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const ToggleSwitch = styled.button`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${props => props.$isOn
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  cursor: pointer;
  position: relative;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$isOn ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
  }
`;

const ToggleLabel = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const EditFieldButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    border-color: #3B82F6;
    color: #3B82F6;
    background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  }
`;

const DuplicateCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFBEB' : '#78350F'};
  border: 1px solid ${props => props.theme === 'light' ? '#FDE68A' : '#F59E0B'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DuplicateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const DuplicateName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#92400E' : '#FDE68A'};
`;

const DuplicateMatch = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#B45309' : '#FCD34D'};
`;

const MatchTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 6px;
  background: ${props => {
    switch(props.$type) {
      case 'linkedin': return props.theme === 'light' ? '#E0E7FF' : '#3730A3';
      case 'domain': return props.theme === 'light' ? '#DBEAFE' : '#1E40AF';
      case 'website': return props.theme === 'light' ? '#D1FAE5' : '#065F46';
      case 'name': return props.theme === 'light' ? '#FEF3C7' : '#78350F';
      default: return props.theme === 'light' ? '#F3F4F6' : '#374151';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'linkedin': return props.theme === 'light' ? '#4338CA' : '#C7D2FE';
      case 'domain': return props.theme === 'light' ? '#1D4ED8' : '#BFDBFE';
      case 'website': return props.theme === 'light' ? '#047857' : '#A7F3D0';
      case 'name': return props.theme === 'light' ? '#92400E' : '#FDE68A';
      default: return props.theme === 'light' ? '#374151' : '#D1D5DB';
    }
  }};
`;

const MergeButton = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background: #F59E0B;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #D97706;
  }
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background: #3B82F6;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #2563EB;
  }
`;

const CancelButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const EnrichButton = styled(Button)`
  background: ${props => props.theme === 'light' ? '#8B5CF6' : '#7C3AED'};
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#7C3AED' : '#6D28D9'};
  }
`;

const InputWithButton = styled.div`
  display: flex;
  gap: 8px;
`;

const SmallButton = styled.button`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }
`;

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

const CompanyDataIntegrityModal = ({
  isOpen,
  onClose,
  companyId,
  theme = 'light',
  onRefresh
}) => {
  // Company data state
  const [company, setCompany] = useState(null);
  const [completenessData, setCompletenessData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [description, setDescription] = useState('');

  // Related data
  const [domains, setDomains] = useState([]);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);

  // UI state
  const [showAllFields, setShowAllFields] = useState(false);

  // Track initially missing fields (so they don't disappear when user starts typing)
  const [initialMissingFieldKeys, setInitialMissingFieldKeys] = useState(new Set());

  // Inline domain editing
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [suggestedDomains, setSuggestedDomains] = useState([]);

  // Inline tag editing
  const [newTag, setNewTag] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [addingTag, setAddingTag] = useState(false);

  // Smart tag suggestions
  const [smartTagSuggestions, setSmartTagSuggestions] = useState([]);
  const [loadingSmartTags, setLoadingSmartTags] = useState(false);

  // Inline city editing
  const [newCity, setNewCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [addingCity, setAddingCity] = useState(false);

  // Enrichment modal
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);

  // Duplicates
  const [duplicates, setDuplicates] = useState([]);
  const [searchingDuplicates, setSearchingDuplicates] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Logo upload
  const logoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Helper to extract domain from URL
  const extractDomainFromUrl = (url) => {
    if (!url) return null;
    try {
      // Add protocol if missing
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const urlObj = new URL(cleanUrl);
      // Remove www. prefix
      return urlObj.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      // If URL parsing fails, try simple extraction
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  };

  // Helper to extract domain from email
  const extractDomainFromEmail = (email) => {
    if (!email) return null;
    const parts = email.split('@');
    if (parts.length === 2) {
      return parts[1].toLowerCase();
    }
    return null;
  };

  // Load suggested domains from website and contact emails
  const loadSuggestedDomains = async (companyWebsite, companyDomains, companyId) => {
    const suggestions = new Set();
    const existingDomains = new Set(companyDomains.map(d => d.domain.toLowerCase()));

    // 1. Extract domain from website
    if (companyWebsite) {
      const websiteDomain = extractDomainFromUrl(companyWebsite);
      if (websiteDomain && !existingDomains.has(websiteDomain)) {
        suggestions.add(websiteDomain);
      }
    }

    // 2. Get emails from contacts associated with this company
    try {
      const { data: contactCompanies } = await supabase
        .from('contact_companies')
        .select('contact_id')
        .eq('company_id', companyId);

      if (contactCompanies?.length > 0) {
        const contactIds = contactCompanies.map(cc => cc.contact_id);

        const { data: contactEmails } = await supabase
          .from('contact_emails')
          .select('email')
          .in('contact_id', contactIds);

        if (contactEmails?.length > 0) {
          contactEmails.forEach(ce => {
            const emailDomain = extractDomainFromEmail(ce.email);
            if (emailDomain && !existingDomains.has(emailDomain)) {
              // Filter out common personal email domains
              const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'aol.com', 'live.com', 'msn.com', 'protonmail.com', 'mail.com'];
              if (!personalDomains.includes(emailDomain)) {
                suggestions.add(emailDomain);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading contact emails for domain suggestions:', error);
    }

    setSuggestedDomains(Array.from(suggestions));
  };

  // Load company data
  const loadCompanyData = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Load completeness data
      const { data: completeness, error: completenessError } = await supabase
        .from('company_completeness')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (completenessError) throw completenessError;
      setCompletenessData(completeness);

      // Load full company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Set editable fields
      setName(companyData.name || '');
      setCategory(companyData.category || '');
      setWebsite(companyData.website || '');
      setLinkedin(companyData.linkedin || '');
      setDescription(companyData.description || '');

      // Load related data in parallel
      const [domainsRes, tagsRes, citiesRes, logoRes] = await Promise.all([
        supabase.from('company_domains').select('*').eq('company_id', companyId),
        supabase.from('company_tags').select('*, tags(tag_id, name)').eq('company_id', companyId),
        supabase.from('company_cities').select('*, cities(city_id, name, country)').eq('company_id', companyId),
        supabase.from('company_attachments')
          .select('attachment_id, attachments(permanent_url)')
          .eq('company_id', companyId)
          .eq('is_logo', true)
          .maybeSingle()
      ]);

      const loadedDomains = domainsRes.data || [];
      setDomains(loadedDomains);
      setTags(tagsRes.data || []);
      setCities(citiesRes.data || []);

      if (logoRes.data?.attachments?.permanent_url) {
        setLogoUrl(logoRes.data.attachments.permanent_url);
      } else {
        setLogoUrl(null);
      }

      // Load suggested domains from website and contact emails
      await loadSuggestedDomains(companyData.website, loadedDomains, companyId);

      // Find duplicates
      await findDuplicatesForCompany(companyData, companyId, loadedDomains);

    } catch (error) {
      console.error('Error loading company data:', error);
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Find duplicates using shared helper
  const findDuplicatesForCompany = async (companyData, currentCompanyId, companyDomains) => {
    setSearchingDuplicates(true);
    try {
      const foundDuplicates = await findCompanyDuplicates(currentCompanyId, companyData, companyDomains);
      setDuplicates(foundDuplicates);
    } catch (error) {
      console.error('Error finding duplicates:', error);
    } finally {
      setSearchingDuplicates(false);
    }
  };

  useEffect(() => {
    if (isOpen && companyId) {
      loadCompanyData();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setInitialMissingFieldKeys(new Set());
      setSuggestedDomains([]);
    }
  }, [isOpen, companyId, loadCompanyData]);

  // Capture initially missing fields after data loads (so fields don't disappear when typing)
  useEffect(() => {
    if (isOpen && completenessData && !loading && initialMissingFieldKeys.size === 0) {
      const missing = getMissingFields();
      setInitialMissingFieldKeys(new Set(missing.map(f => f.key)));
    }
  }, [isOpen, completenessData, loading]);

  // Calculate missing fields
  const getMissingFields = () => {
    const missing = [];
    if (!completenessData) return missing;

    // Name - required
    if (!name?.trim()) missing.push({ key: 'name', label: 'Name', icon: FaBuilding });

    // Category - check for default enum values
    if (!completenessData.category || completenessData.category === 'Not Set' || completenessData.category === 'Inbox') {
      missing.push({ key: 'category', label: 'Category', icon: FaTag });
    }

    // Description
    if (!completenessData.description) missing.push({ key: 'description', label: 'Description', icon: FaFileAlt });

    // LinkedIn
    if (!completenessData.linkedin) missing.push({ key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin });

    // Domains (from count)
    if (Number(completenessData.domain_count) === 0) missing.push({ key: 'domains', label: 'Domains', icon: FaGlobe });

    // Tags (from count)
    if (Number(completenessData.tag_count) === 0) missing.push({ key: 'tags', label: 'Tags', icon: FaTags });

    // Cities (from count or local state)
    if (cities.length === 0) missing.push({ key: 'cities', label: 'Cities', icon: FaMapMarkerAlt });

    // Contacts (from count) - info only
    if (Number(completenessData.contact_count) === 0) missing.push({ key: 'contacts', label: 'Contacts', icon: FaUsers });

    // Logo
    if (!logoUrl) missing.push({ key: 'logo', label: 'Logo', icon: FaImage });

    return missing;
  };

  // Handle merge duplicate
  const handleMergeDuplicate = async (duplicateCompanyId) => {
    try {
      // Fetch duplicate company data
      const { data: dupCompany, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', duplicateCompanyId)
        .single();

      if (error) throw error;

      const pickBetter = (currentVal, dupVal, type = 'string') => {
        if (type === 'category') {
          const badCategories = ['Inbox', 'Not Set', null, undefined, ''];
          if (badCategories.includes(currentVal) && !badCategories.includes(dupVal)) return 'duplicate';
          return 'current';
        }
        // For strings: prefer non-empty, then longer
        if (!currentVal && dupVal) return 'duplicate';
        if (currentVal && !dupVal) return 'current';
        if (currentVal && dupVal && dupVal.length > currentVal.length) return 'duplicate';
        return 'current';
      };

      const mergeSelections = {
        name: pickBetter(company?.name, dupCompany?.name),
        website: pickBetter(company?.website, dupCompany?.website),
        category: pickBetter(company?.category, dupCompany?.category, 'category'),
        description: pickBetter(company?.description, dupCompany?.description),
        linkedin: pickBetter(company?.linkedin, dupCompany?.linkedin),
        domains: 'combine',
        tags: 'combine',
        cities: 'combine',
        contacts: 'combine'
      };

      const { error: insertError } = await supabase.from('company_duplicates').insert({
        primary_company_id: companyId,
        duplicate_company_id: duplicateCompanyId,
        status: 'pending',
        merge_selections: mergeSelections,
        start_trigger: true,
        notes: 'Merged from Company Data Integrity Modal'
      });

      if (insertError) throw insertError;

      toast.success('Merge initiated! Processing...');
      setDuplicates(duplicates.filter(d => d.company_id !== duplicateCompanyId));
    } catch (error) {
      console.error('Error merging duplicate:', error);
      toast.error('Failed to merge duplicate');
    }
  };

  // Open enrichment modal
  const handleEnrichWithApollo = () => {
    setEnrichmentModalOpen(true);
  };

  // Handle enrichment complete
  const handleEnrichmentComplete = () => {
    setEnrichmentModalOpen(false);
    loadCompanyData();
  };

  // Search LinkedIn
  const handleSearchLinkedIn = async () => {
    try {
      const response = await supabase.functions.invoke('company-linkedin-finder', {
        body: {
          companyId: companyId,
          website: website || domains[0]?.domain,
          companyName: name
        }
      });

      if (response.data?.linkedin) {
        setLinkedin(response.data.linkedin);
        toast.success('LinkedIn URL found!');
      } else if (response.data?.suggestion) {
        setLinkedin(response.data.suggestion);
        toast.success('LinkedIn suggestion found');
      } else {
        // Open LinkedIn search
        const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`;
        window.open(searchUrl, '_blank');
      }
    } catch (error) {
      // Fallback to manual search
      const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`;
      window.open(searchUrl, '_blank');
    }
  };

  // Save changes
  const handleSave = async (markComplete = false) => {
    // Validate category is selected
    if (!category || category === 'Inbox' || category === 'Not Set') {
      toast.error('Please select a valid category before saving');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        category: category,
        website: website.trim() || null,
        linkedin: linkedin.trim() || null,
        description: description.trim() || null,
        last_modified_at: new Date().toISOString()
      };

      if (markComplete) {
        updates.show_missing = false;
      }

      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success(markComplete ? 'Company marked as complete!' : 'Changes saved!');

      if (onRefresh) onRefresh();
      onClose();

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Delete company and all related records
  const handleDeleteCompany = async () => {
    setDeleting(true);
    try {
      // Delete from all joint tables in order (foreign key constraints)
      const deleteOperations = [
        // Joint tables
        supabase.from('company_domains').delete().eq('company_id', companyId),
        supabase.from('company_tags').delete().eq('company_id', companyId),
        supabase.from('company_cities').delete().eq('company_id', companyId),
        supabase.from('company_attachments').delete().eq('company_id', companyId),
        supabase.from('contact_companies').delete().eq('company_id', companyId),
        supabase.from('notes_companies').delete().eq('company_id', companyId),
        supabase.from('note_companies').delete().eq('company_id', companyId),
        // Duplicates tables
        supabase.from('company_duplicates').delete().eq('primary_company_id', companyId),
        supabase.from('company_duplicates').delete().eq('duplicate_company_id', companyId),
        supabase.from('duplicates_inbox').delete().eq('entity_type', 'company').eq('source_id', companyId),
        supabase.from('duplicates_inbox').delete().eq('entity_type', 'company').eq('duplicate_id', companyId),
      ];

      // Execute all delete operations
      const results = await Promise.all(deleteOperations);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Some delete operations failed:', errors);
      }

      // Finally delete the company itself
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('company_id', companyId);

      if (companyError) throw companyError;

      toast.success('Company deleted successfully');
      setShowDeleteConfirm(false);
      if (onRefresh) onRefresh();
      onClose();

    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete company: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logos/${companyId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      const permanentUrl = urlData?.publicUrl;

      // Create attachment record
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('attachments')
        .insert({
          file_name: file.name,
          file_url: permanentUrl,
          file_type: file.type,
          file_size: file.size,
          permanent_url: permanentUrl,
          processing_status: 'completed'
        })
        .select()
        .single();

      if (attachmentError) throw attachmentError;

      // Remove any existing logo links for this company
      await supabase
        .from('company_attachments')
        .delete()
        .eq('company_id', companyId)
        .eq('is_logo', true);

      // Link attachment to company as logo
      const { error: linkError } = await supabase
        .from('company_attachments')
        .insert({
          company_id: companyId,
          attachment_id: attachmentData.attachment_id,
          is_logo: true
        });

      if (linkError) throw linkError;

      // Update local state
      setLogoUrl(permanentUrl);
      toast.success('Logo uploaded successfully');

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  // Trigger logo file input
  const handleLogoClick = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  // Inline domain management
  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    setAddingDomain(true);
    try {
      const domainValue = newDomain.toLowerCase().trim();

      // Check if domain already exists locally
      if (domains.some(d => d.domain === domainValue)) {
        toast.error('This domain is already linked');
        return;
      }

      const { data: newDomainData, error } = await supabase
        .from('company_domains')
        .insert({
          company_id: companyId,
          domain: domainValue,
          is_primary: domains.length === 0  // First domain is primary
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state instead of reloading
      setDomains(prev => [...prev, newDomainData]);
      // Remove from suggestions if it was there
      setSuggestedDomains(prev => prev.filter(d => d !== domainValue));
      toast.success('Domain added');
      setNewDomain('');
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  // Add suggested domain with one click
  const handleAddSuggestedDomain = async (domainToAdd) => {
    setAddingDomain(true);
    try {
      const domainValue = domainToAdd.toLowerCase().trim();

      // Check if domain already exists locally
      if (domains.some(d => d.domain === domainValue)) {
        toast.error('This domain is already linked');
        setSuggestedDomains(prev => prev.filter(d => d !== domainToAdd));
        return;
      }

      const { data: newDomainData, error } = await supabase
        .from('company_domains')
        .insert({
          company_id: companyId,
          domain: domainValue,
          is_primary: domains.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setDomains(prev => [...prev, newDomainData]);
      setSuggestedDomains(prev => prev.filter(d => d !== domainToAdd));
      toast.success(`Domain "${domainValue}" added`);
    } catch (error) {
      console.error('Error adding suggested domain:', error);
      toast.error('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainId) => {
    try {
      const { error } = await supabase
        .from('company_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      // Update local state instead of reloading
      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success('Domain removed');
    } catch (error) {
      console.error('Error removing domain:', error);
      toast.error('Failed to remove domain');
    }
  };

  // Inline tag management
  const fetchTagSuggestions = async (search) => {
    if (search.length < 2) {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already linked tags
      const linkedTagIds = tags.map(t => t.tags?.tag_id || t.tag_id);
      const filtered = data.filter(t => !linkedTagIds.includes(t.tag_id));
      setTagSuggestions(filtered);
      setShowTagSuggestions(true);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  };

  const handleAddTag = async (tagToAdd) => {
    setAddingTag(true);
    try {
      const tagId = tagToAdd.tag_id;

      // Check if already linked locally
      const linkedTagIds = tags.map(t => t.tags?.tag_id || t.tag_id);
      if (linkedTagIds.includes(tagId)) {
        toast.error('Tag already linked');
        return;
      }

      const { error } = await supabase
        .from('company_tags')
        .insert({ company_id: companyId, tag_id: tagId });

      if (error) throw error;

      // Update local state instead of reloading
      setTags(prev => [...prev, { tag_id: tagId, tags: { tag_id: tagId, name: tagToAdd.name } }]);
      toast.success('Tag added');
      setNewTag('');
      setShowTagSuggestions(false);
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    } finally {
      setAddingTag(false);
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!newTag.trim()) return;

    setAddingTag(true);
    try {
      // Create the tag
      const { data: newTagData, error: createError } = await supabase
        .from('tags')
        .insert({ name: newTag.trim() })
        .select()
        .single();

      if (createError) throw createError;

      // Link to company
      const { error: linkError } = await supabase
        .from('company_tags')
        .insert({ company_id: companyId, tag_id: newTagData.tag_id });

      if (linkError) throw linkError;

      // Update local state instead of reloading
      setTags(prev => [...prev, { tag_id: newTagData.tag_id, tags: { tag_id: newTagData.tag_id, name: newTagData.name } }]);
      toast.success('Tag created and added');
      setNewTag('');
      setShowTagSuggestions(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('company_id', companyId)
        .eq('tag_id', tagId);

      if (error) throw error;

      // Update local state instead of reloading
      setTags(prev => prev.filter(t => (t.tags?.tag_id || t.tag_id) !== tagId));
      toast.success('Tag removed');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  // Smart tag suggestions based on description
  const generateSmartTagSuggestions = async () => {
    const descriptionText = description?.trim();
    if (!descriptionText || descriptionText.length < 20) {
      toast.error('Please add a description first (at least 20 characters)');
      return;
    }

    setLoadingSmartTags(true);
    setSmartTagSuggestions([]);

    try {
      // Fetch all tags
      const { data: allTags, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .order('name');

      if (error) throw error;

      // Get already linked tag IDs
      const linkedTagIds = tags.map(t => t.tags?.tag_id || t.tag_id);

      // Convert description to lowercase for matching
      const descLower = descriptionText.toLowerCase();

      // Define keyword mappings for common business/finance terms
      const keywordMappings = {
        'investment banking': ['investment', 'banking', 'underwriting', 'securities', 'ipo', 'm&a', 'mergers', 'acquisitions'],
        'asset management': ['asset management', 'assets under management', 'aum', 'portfolio', 'fund management'],
        'private equity': ['private equity', 'buyout', 'leveraged', 'lbo'],
        'venture capital': ['venture capital', 'vc', 'seed', 'series a', 'series b', 'startup funding'],
        'fintech': ['fintech', 'financial technology', 'digital banking', 'neobank', 'payment'],
        'wealth management': ['wealth management', 'private banking', 'high net worth', 'hnwi', 'family office'],
        'hedge fund': ['hedge fund', 'alternative investment', 'long short', 'macro'],
        'real estate': ['real estate', 'property', 'reit', 'commercial real estate', 'residential'],
        'insurance': ['insurance', 'underwriting', 'reinsurance', 'insurtech'],
        'consulting': ['consulting', 'advisory', 'strategy', 'management consulting'],
        'technology': ['technology', 'software', 'saas', 'cloud', 'ai', 'artificial intelligence', 'machine learning'],
        'healthcare': ['healthcare', 'health', 'medical', 'biotech', 'pharma', 'pharmaceutical'],
        'consumer': ['consumer', 'retail', 'e-commerce', 'ecommerce', 'cpg', 'fmcg'],
        'sustainability': ['sustainability', 'esg', 'green', 'climate', 'renewable', 'impact investing'],
        'crypto': ['crypto', 'blockchain', 'bitcoin', 'ethereum', 'web3', 'defi'],
      };

      // Score each tag
      const scoredTags = allTags
        .filter(tag => !linkedTagIds.includes(tag.tag_id))
        .map(tag => {
          let score = 0;
          const tagNameLower = tag.name.toLowerCase();

          // Direct match in description (highest score)
          if (descLower.includes(tagNameLower)) {
            score += 10;
          }

          // Check keyword mappings
          for (const [category, keywords] of Object.entries(keywordMappings)) {
            if (tagNameLower.includes(category.toLowerCase()) || category.toLowerCase().includes(tagNameLower)) {
              // Tag matches a category - check if any keywords are in description
              const matchedKeywords = keywords.filter(kw => descLower.includes(kw.toLowerCase()));
              if (matchedKeywords.length > 0) {
                score += matchedKeywords.length * 3;
              }
            }
          }

          // Partial word matching (tag words appear in description)
          const tagWords = tagNameLower.split(/\s+/).filter(w => w.length > 3);
          const matchedWords = tagWords.filter(word => descLower.includes(word));
          score += matchedWords.length * 2;

          return { ...tag, score };
        })
        .filter(tag => tag.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Top 8 suggestions

      setSmartTagSuggestions(scoredTags);

      if (scoredTags.length === 0) {
        toast('No matching tags found. Try adding tags manually.', { icon: '🏷️' });
      } else {
        toast.success(`Found ${scoredTags.length} tag suggestions`);
      }
    } catch (error) {
      console.error('Error generating smart tags:', error);
      toast.error('Failed to generate tag suggestions');
    } finally {
      setLoadingSmartTags(false);
    }
  };

  const handleAddSmartTag = async (tagToAdd) => {
    await handleAddTag(tagToAdd);
    // Remove from suggestions after adding
    setSmartTagSuggestions(prev => prev.filter(t => t.tag_id !== tagToAdd.tag_id));
  };

  // Inline city management
  const fetchCitySuggestions = async (search) => {
    if (search.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already linked cities
      const linkedCityIds = cities.map(c => c.cities?.city_id || c.city_id);
      const filtered = data.filter(c => !linkedCityIds.includes(c.city_id));
      setCitySuggestions(filtered);
      setShowCitySuggestions(true);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
    }
  };

  const handleAddCity = async (cityToAdd) => {
    setAddingCity(true);
    try {
      const cityId = cityToAdd.city_id;

      // Check if already linked locally
      const linkedCityIds = cities.map(c => c.cities?.city_id || c.city_id);
      if (linkedCityIds.includes(cityId)) {
        toast.error('City already linked');
        return;
      }

      const { error } = await supabase
        .from('company_cities')
        .insert({ company_id: companyId, city_id: cityId });

      if (error) throw error;

      // Update local state instead of reloading
      setCities(prev => [...prev, { city_id: cityId, cities: { city_id: cityId, name: cityToAdd.name, country: cityToAdd.country } }]);
      toast.success('City added');
      setNewCity('');
      setShowCitySuggestions(false);
    } catch (error) {
      console.error('Error adding city:', error);
      toast.error('Failed to add city');
    } finally {
      setAddingCity(false);
    }
  };

  const handleCreateAndAddCity = async () => {
    if (!newCity.trim()) return;

    setAddingCity(true);
    try {
      // Create the city
      const { data: newCityData, error: createError } = await supabase
        .from('cities')
        .insert({ name: newCity.trim() })
        .select()
        .single();

      if (createError) throw createError;

      // Link to company
      const { error: linkError } = await supabase
        .from('company_cities')
        .insert({ company_id: companyId, city_id: newCityData.city_id });

      if (linkError) throw linkError;

      // Update local state instead of reloading
      setCities(prev => [...prev, { city_id: newCityData.city_id, cities: { city_id: newCityData.city_id, name: newCityData.name } }]);
      toast.success('City created and added');
      setNewCity('');
      setShowCitySuggestions(false);
    } catch (error) {
      console.error('Error creating city:', error);
      toast.error('Failed to create city');
    } finally {
      setAddingCity(false);
    }
  };

  const handleRemoveCity = async (cityId) => {
    try {
      const { error } = await supabase
        .from('company_cities')
        .delete()
        .eq('company_id', companyId)
        .eq('city_id', cityId);

      if (error) throw error;

      // Update local state instead of reloading
      setCities(prev => prev.filter(c => (c.cities?.city_id || c.city_id) !== cityId));
      toast.success('City removed');
    } catch (error) {
      console.error('Error removing city:', error);
      toast.error('Failed to remove city');
    }
  };

  if (!isOpen) return null;

  const missingFields = getMissingFields();
  const score = completenessData?.completeness_score || 0;
  const isMarkedComplete = company?.show_missing === false;
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = isMarkedComplete ? 0 : circumference - (score / 100) * circumference;
  const scoreColor = isMarkedComplete ? '#F59E0B' : (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444');

  const getInitials = (companyName) => {
    if (!companyName) return '?';
    return companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <>
      <Overlay onClick={onClose}>
        <Modal theme={theme} onClick={e => e.stopPropagation()}>
          <Header theme={theme}>
            <HeaderInfo>
              <Avatar
                theme={theme}
                onClick={handleLogoClick}
                style={{ cursor: uploadingLogo ? 'wait' : 'pointer', position: 'relative' }}
                title={logoUrl ? 'Click to change logo' : 'Click to upload logo'}
              >
                {uploadingLogo ? (
                  <FiRefreshCw className="spin" size={20} />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  getInitials(name)
                )}
                {!uploadingLogo && (
                  <div style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: theme === 'light' ? '#3B82F6' : '#60A5FA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${theme === 'light' ? '#FFFFFF' : '#1F2937'}`
                  }}>
                    <FaImage size={8} color="white" />
                  </div>
                )}
              </Avatar>
              <HeaderText>
                <CompanyName theme={theme}>
                  {name || 'Company'}
                  {isMarkedComplete && <FaCrown style={{ color: '#F59E0B' }} />}
                </CompanyName>
                <CompanySubtitle theme={theme}>
                  {category && category !== 'Inbox' && category !== 'Not Set' ? category : 'No category'}
                  {domains.length > 0 && ` • ${domains[0].domain}`}
                </CompanySubtitle>
              </HeaderText>
            </HeaderInfo>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ScoreCircle>
                <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="30" cy="30" r="24" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="6" />
                  <circle cx="30" cy="30" r="24" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                </svg>
                <ScoreText theme={theme}>
                  {isMarkedComplete ? <FaCrown color="#F59E0B" /> : `${Math.round(score)}%`}
                </ScoreText>
              </ScoreCircle>
              <CloseButton theme={theme} onClick={onClose}>
                <FaTimes size={20} />
              </CloseButton>
            </div>
          </Header>

          <Content>
            {/* Hidden file input for logo upload */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                <FiRefreshCw className="spin" size={24} />
                <div style={{ marginTop: 12 }}>Loading company data...</div>
              </div>
            ) : (
              <>
                {/* Missing Fields Section */}
                <Section>
                  <SectionTitle theme={theme}>
                    {missingFields.length > 0 ? (
                      <>
                        <FaExclamationTriangle color="#F59E0B" />
                        Missing Fields ({missingFields.length})
                      </>
                    ) : (
                      <>
                        <FaCheck color="#10B981" />
                        All Fields Complete
                      </>
                    )}
                  </SectionTitle>
                  <MissingFieldsContainer>
                    {missingFields.map(field => (
                      <MissingFieldChip
                        key={field.key}
                        theme={theme}
                        onClick={field.key === 'logo' ? handleLogoClick : undefined}
                        style={field.key === 'logo' ? { cursor: uploadingLogo ? 'wait' : 'pointer' } : {}}
                      >
                        {field.key === 'logo' && uploadingLogo ? (
                          <FiRefreshCw className="spin" size={12} />
                        ) : (
                          <field.icon size={12} />
                        )}
                        {field.key === 'logo' && uploadingLogo ? 'Uploading...' : field.label}
                      </MissingFieldChip>
                    ))}
                    {missingFields.length === 0 && (
                      <CompleteFieldChip theme={theme}>
                        <FaCheck size={12} />
                        All required fields are filled
                      </CompleteFieldChip>
                    )}
                  </MissingFieldsContainer>
                </Section>

                {/* Enrich with Apollo */}
                <Section>
                  <EnrichButton
                    theme={theme}
                    onClick={handleEnrichWithApollo}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <FaMagic />
                    Enrich with Apollo
                  </EnrichButton>
                </Section>

                {/* Toggle to show all fields */}
                <ToggleContainer>
                  <ToggleSwitch
                    theme={theme}
                    $isOn={showAllFields}
                    onClick={() => setShowAllFields(!showAllFields)}
                  />
                  <ToggleLabel theme={theme}>Show all fields</ToggleLabel>
                </ToggleContainer>

                {/* Edit Fields Section */}
                <Section>
                  <SectionTitle theme={theme}>
                    <FaEdit />
                    {showAllFields ? 'Edit All Fields' : 'Fill Missing Fields'}
                  </SectionTitle>

                  {/* Name */}
                  {(showAllFields || initialMissingFieldKeys.has('name')) && (
                    <FormGroup>
                      <Label theme={theme}>Company Name</Label>
                      <Input
                        theme={theme}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Company name"
                      />
                    </FormGroup>
                  )}

                  {/* Category */}
                  {(showAllFields || initialMissingFieldKeys.has('category')) && (
                    <FormGroup>
                      <Label theme={theme}>Category</Label>
                      <Select theme={theme} value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Select category...</option>
                        {COMPANY_CATEGORY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </Select>
                    </FormGroup>
                  )}

                  {/* Description */}
                  {(showAllFields || initialMissingFieldKeys.has('description')) && (
                    <FormGroup>
                      <Label theme={theme}>Description</Label>
                      <TextArea
                        theme={theme}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Brief description of this company..."
                      />
                    </FormGroup>
                  )}

                  {/* LinkedIn */}
                  {(showAllFields || initialMissingFieldKeys.has('linkedin')) && (
                    <FormGroup>
                      <Label theme={theme}>LinkedIn</Label>
                      <InputWithButton>
                        <Input
                          theme={theme}
                          value={linkedin}
                          onChange={e => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/company/..."
                          style={{ flex: 1 }}
                        />
                        <SmallButton theme={theme} onClick={handleSearchLinkedIn}>
                          <FaSearch size={12} /> Find
                        </SmallButton>
                      </InputWithButton>
                    </FormGroup>
                  )}

                  {/* Domains - inline editing */}
                  {(showAllFields || initialMissingFieldKeys.has('domains')) && (
                    <FormGroup>
                      <Label theme={theme}>Domains</Label>
                      {domains.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {domains.map(d => (
                            <div
                              key={d.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                background: theme === 'light' ? '#EFF6FF' : '#1E3A8A',
                                border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#3B82F6'}`,
                                borderRadius: 16,
                                fontSize: 12,
                                color: theme === 'light' ? '#1D4ED8' : '#93C5FD'
                              }}
                            >
                              <FaGlobe size={10} />
                              {d.domain}
                              {d.is_primary && <span style={{ fontSize: 10, opacity: 0.7 }}>(primary)</span>}
                              <button
                                onClick={() => handleRemoveDomain(d.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  color: 'inherit',
                                  display: 'flex',
                                  opacity: 0.7
                                }}
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Suggested domains from website and contact emails */}
                      {suggestedDomains.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: 6 }}>
                            Suggested domains (click to add):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {suggestedDomains.map(domain => (
                              <button
                                key={domain}
                                onClick={() => handleAddSuggestedDomain(domain)}
                                disabled={addingDomain}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 10px',
                                  background: theme === 'light' ? '#DBEAFE' : '#1E3A8A',
                                  border: `1px dashed ${theme === 'light' ? '#60A5FA' : '#3B82F6'}`,
                                  borderRadius: 16,
                                  fontSize: 12,
                                  color: theme === 'light' ? '#1D4ED8' : '#93C5FD',
                                  cursor: addingDomain ? 'wait' : 'pointer',
                                  transition: 'all 0.15s',
                                  opacity: addingDomain ? 0.7 : 1
                                }}
                                onMouseEnter={e => {
                                  if (!addingDomain) {
                                    e.target.style.background = theme === 'light' ? '#BFDBFE' : '#1E40AF';
                                    e.target.style.borderStyle = 'solid';
                                  }
                                }}
                                onMouseLeave={e => {
                                  e.target.style.background = theme === 'light' ? '#DBEAFE' : '#1E3A8A';
                                  e.target.style.borderStyle = 'dashed';
                                }}
                              >
                                <FaGlobe size={10} />
                                {domain}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <InputWithButton>
                        <Input
                          theme={theme}
                          value={newDomain}
                          onChange={e => setNewDomain(e.target.value)}
                          placeholder="example.com"
                          style={{ flex: 1 }}
                          onKeyPress={e => e.key === 'Enter' && handleAddDomain()}
                        />
                        <SmallButton theme={theme} onClick={handleAddDomain} disabled={addingDomain}>
                          {addingDomain ? <FiRefreshCw className="spin" size={12} /> : <FaGlobe size={12} />}
                          Add
                        </SmallButton>
                      </InputWithButton>
                    </FormGroup>
                  )}

                  {/* Tags - inline editing with bubbles */}
                  {(showAllFields || initialMissingFieldKeys.has('tags')) && (
                    <FormGroup>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Label theme={theme} style={{ margin: 0 }}>Tags</Label>
                        <button
                          onClick={generateSmartTagSuggestions}
                          disabled={loadingSmartTags}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            background: theme === 'light' ? '#8B5CF6' : '#7C3AED',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: loadingSmartTags ? 'wait' : 'pointer',
                            opacity: loadingSmartTags ? 0.7 : 1
                          }}
                        >
                          {loadingSmartTags ? <FiRefreshCw className="spin" size={10} /> : <FaMagic size={10} />}
                          Smart Tags
                        </button>
                      </div>

                      {/* Smart tag suggestions */}
                      {smartTagSuggestions.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: 6 }}>
                            Suggested tags (click to add):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {smartTagSuggestions.map(tag => (
                              <button
                                key={tag.tag_id}
                                onClick={() => handleAddSmartTag(tag)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 10px',
                                  background: theme === 'light' ? '#EDE9FE' : '#5B21B6',
                                  border: `1px dashed ${theme === 'light' ? '#A78BFA' : '#8B5CF6'}`,
                                  borderRadius: 16,
                                  fontSize: 12,
                                  color: theme === 'light' ? '#7C3AED' : '#C4B5FD',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => {
                                  e.target.style.background = theme === 'light' ? '#DDD6FE' : '#6D28D9';
                                  e.target.style.borderStyle = 'solid';
                                }}
                                onMouseLeave={e => {
                                  e.target.style.background = theme === 'light' ? '#EDE9FE' : '#5B21B6';
                                  e.target.style.borderStyle = 'dashed';
                                }}
                              >
                                <FaTags size={10} />
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {tags.map(t => {
                            const tagData = t.tags || t;
                            const tagId = tagData.tag_id;
                            const tagName = tagData.name || 'Unknown';
                            return (
                              <div
                                key={tagId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  background: theme === 'light' ? '#F0FDF4' : '#064E3B',
                                  border: `1px solid ${theme === 'light' ? '#BBF7D0' : '#10B981'}`,
                                  borderRadius: 16,
                                  fontSize: 12,
                                  color: theme === 'light' ? '#16A34A' : '#6EE7B7'
                                }}
                              >
                                <FaTags size={10} />
                                {tagName}
                                <button
                                  onClick={() => handleRemoveTag(tagId)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: 'inherit',
                                    display: 'flex',
                                    opacity: 0.7
                                  }}
                                >
                                  <FaTimes size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ position: 'relative' }}>
                        <InputWithButton>
                          <Input
                            theme={theme}
                            value={newTag}
                            onChange={e => {
                              setNewTag(e.target.value);
                              fetchTagSuggestions(e.target.value);
                            }}
                            onFocus={() => newTag.length >= 2 && setShowTagSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                            placeholder="Search or create tag..."
                            style={{ flex: 1 }}
                          />
                          <SmallButton theme={theme} onClick={handleCreateAndAddTag} disabled={addingTag || !newTag.trim()}>
                            {addingTag ? <FiRefreshCw className="spin" size={12} /> : <FaTags size={12} />}
                            Add
                          </SmallButton>
                        </InputWithButton>
                        {showTagSuggestions && tagSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 60,
                            background: theme === 'light' ? '#FFFFFF' : '#374151',
                            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                            borderRadius: 6,
                            marginTop: 4,
                            maxHeight: 150,
                            overflowY: 'auto',
                            zIndex: 10,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}>
                            {tagSuggestions.map(suggestion => (
                              <div
                                key={suggestion.tag_id}
                                onClick={() => handleAddTag(suggestion)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                                  borderBottom: `1px solid ${theme === 'light' ? '#F3F4F6' : '#4B5563'}`
                                }}
                                onMouseEnter={e => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#4B5563'}
                                onMouseLeave={e => e.target.style.background = 'transparent'}
                              >
                                {suggestion.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormGroup>
                  )}

                  {/* Cities - inline editing with bubbles */}
                  {(showAllFields || initialMissingFieldKeys.has('cities')) && (
                    <FormGroup>
                      <Label theme={theme}>Cities</Label>
                      {cities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {cities.map(c => {
                            const cityData = c.cities || c;
                            const cityId = cityData.city_id;
                            const cityName = cityData.name || 'Unknown';
                            return (
                              <div
                                key={cityId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  background: theme === 'light' ? '#FEF3C7' : '#78350F',
                                  border: `1px solid ${theme === 'light' ? '#FDE68A' : '#F59E0B'}`,
                                  borderRadius: 16,
                                  fontSize: 12,
                                  color: theme === 'light' ? '#92400E' : '#FDE68A'
                                }}
                              >
                                <FaMapMarkerAlt size={10} />
                                {cityName}
                                <button
                                  onClick={() => handleRemoveCity(cityId)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: 'inherit',
                                    display: 'flex',
                                    opacity: 0.7
                                  }}
                                >
                                  <FaTimes size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ position: 'relative' }}>
                        <InputWithButton>
                          <Input
                            theme={theme}
                            value={newCity}
                            onChange={e => {
                              setNewCity(e.target.value);
                              fetchCitySuggestions(e.target.value);
                            }}
                            onFocus={() => newCity.length >= 2 && setShowCitySuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                            placeholder="Search or create city..."
                            style={{ flex: 1 }}
                          />
                          <SmallButton theme={theme} onClick={handleCreateAndAddCity} disabled={addingCity || !newCity.trim()}>
                            {addingCity ? <FiRefreshCw className="spin" size={12} /> : <FaMapMarkerAlt size={12} />}
                            Add
                          </SmallButton>
                        </InputWithButton>
                        {showCitySuggestions && citySuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 60,
                            background: theme === 'light' ? '#FFFFFF' : '#374151',
                            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                            borderRadius: 6,
                            marginTop: 4,
                            maxHeight: 150,
                            overflowY: 'auto',
                            zIndex: 10,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}>
                            {citySuggestions.map(suggestion => (
                              <div
                                key={suggestion.city_id}
                                onClick={() => handleAddCity(suggestion)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                                  borderBottom: `1px solid ${theme === 'light' ? '#F3F4F6' : '#4B5563'}`
                                }}
                                onMouseEnter={e => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#4B5563'}
                                onMouseLeave={e => e.target.style.background = 'transparent'}
                              >
                                {suggestion.name}{suggestion.country && ` (${suggestion.country})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormGroup>
                  )}

                  {/* Logo upload section */}
                  {(showAllFields || initialMissingFieldKeys.has('logo')) && (
                    <FormGroup>
                      <Label theme={theme}>Logo</Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {logoUrl ? (
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                            background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img
                              src={logoUrl}
                              alt="Company logo"
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            border: `2px dashed ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                            background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme === 'light' ? '#9CA3AF' : '#6B7280'
                          }}>
                            <FaImage size={24} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <SmallButton
                            theme={theme}
                            onClick={handleLogoClick}
                            disabled={uploadingLogo}
                            style={{ marginBottom: 8 }}
                          >
                            {uploadingLogo ? (
                              <>
                                <FiRefreshCw className="spin" size={12} />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FaImage size={12} />
                                {logoUrl ? 'Change Logo' : 'Upload Logo'}
                              </>
                            )}
                          </SmallButton>
                          <div style={{ fontSize: 11, color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                            Accepts: JPEG, PNG, GIF, WebP, SVG (max 5MB)
                          </div>
                        </div>
                      </div>
                    </FormGroup>
                  )}

                  {/* Contacts info */}
                  {initialMissingFieldKeys.has('contacts') && (
                    <FormGroup>
                      <Label theme={theme}>Contacts (info only)</Label>
                      <div style={{ fontSize: 13, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        <FaUsers style={{ marginRight: 6 }} />
                        No contacts linked. Link contacts from the Contacts page.
                      </div>
                    </FormGroup>
                  )}
                </Section>

                {/* Duplicates Section */}
                {duplicates.length > 0 && (
                  <Section>
                    <SectionTitle theme={theme}>
                      <FaExclamationTriangle color="#F59E0B" />
                      Potential Duplicates ({duplicates.length})
                    </SectionTitle>

                    {duplicates.map(dup => (
                      <DuplicateCard key={dup.company_id} theme={theme}>
                        <DuplicateInfo>
                          <FaBuilding color={theme === 'light' ? '#92400E' : '#FDE68A'} />
                          <div>
                            <DuplicateName theme={theme}>
                              {dup.name}
                              <MatchTypeBadge theme={theme} $type={dup.match_type}>
                                {dup.match_type}
                              </MatchTypeBadge>
                            </DuplicateName>
                            <DuplicateMatch theme={theme}>
                              Match: {dup.match_value}
                            </DuplicateMatch>
                          </div>
                        </DuplicateInfo>
                        <MergeButton onClick={() => handleMergeDuplicate(dup.company_id)}>
                          <FaCheck size={10} /> Merge
                        </MergeButton>
                      </DuplicateCard>
                    ))}
                  </Section>
                )}
              </>
            )}
          </Content>

          <Footer theme={theme}>
            <FooterLeft>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={isMarkedComplete}
                  onChange={async (e) => {
                    const newValue = e.target.checked;
                    try {
                      await supabase
                        .from('companies')
                        .update({ show_missing: !newValue, last_modified_at: new Date().toISOString() })
                        .eq('company_id', companyId);
                      loadCompanyData();
                      toast.success(newValue ? 'Marked as complete' : 'Marked as incomplete');
                      if (onRefresh) onRefresh();
                    } catch (error) {
                      toast.error('Failed to update');
                    }
                  }}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ color: theme === 'light' ? '#374151' : '#D1D5DB', fontWeight: 500 }}>
                  <FaCrown style={{ marginRight: 6, color: isMarkedComplete ? '#F59E0B' : '#9CA3AF' }} />
                  Mark Complete
                </span>
              </label>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: 'transparent',
                    border: `1px solid ${theme === 'light' ? '#FCA5A5' : '#7F1D1D'}`,
                    borderRadius: 6,
                    color: '#EF4444',
                    fontSize: 13,
                    cursor: 'pointer',
                    marginLeft: 12
                  }}
                >
                  <FaTrash size={12} />
                  Delete
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                  <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 500 }}>Confirm?</span>
                  <button
                    onClick={handleDeleteCompany}
                    disabled={deleting}
                    style={{
                      padding: '6px 12px',
                      background: '#EF4444',
                      border: 'none',
                      borderRadius: 4,
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: deleting ? 'wait' : 'pointer',
                      opacity: deleting ? 0.7 : 1
                    }}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '6px 12px',
                      background: theme === 'light' ? '#E5E7EB' : '#374151',
                      border: 'none',
                      borderRadius: 4,
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </FooterLeft>
            <FooterRight>
              <CancelButton theme={theme} onClick={onClose}>
                Cancel
              </CancelButton>
              <SaveButton onClick={() => handleSave(false)} disabled={saving}>
                {saving ? <FiRefreshCw className="spin" /> : <FaSave />}
                Save
              </SaveButton>
            </FooterRight>
          </Footer>
        </Modal>
      </Overlay>

      {/* Enrichment modal */}
      <CompanyEnrichmentModal
        isOpen={enrichmentModalOpen}
        onClose={() => setEnrichmentModalOpen(false)}
        company={company ? { ...company, company_id: companyId } : null}
        companyDomains={domains}
        onEnrichComplete={handleEnrichmentComplete}
        theme={theme}
      />
    </>
  );
};

export default CompanyDataIntegrityModal;

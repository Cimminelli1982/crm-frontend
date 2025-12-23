import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBuilding, FaTimes, FaSearch, FaPlus, FaTrash, FaStar, FaMapMarkerAlt, FaTag, FaPhone, FaCheck, FaRobot, FaUser, FaEnvelope, FaExclamationTriangle, FaLinkedin } from 'react-icons/fa';
import { FiGitMerge } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Styled Components
const SuggestionCard = styled.div`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  margin-bottom: 12px;
`;

const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SuggestionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const ConfidenceBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  background: ${props => {
    if (props.level === 'high') return '#10B981';
    if (props.level === 'medium') return '#F59E0B';
    return '#EF4444';
  }};
  color: white;
`;

const SuggestionValue = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
`;

const SuggestionActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const AcceptButton = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover { background: #059669; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EditButton = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};

  &:hover { background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

const AcceptedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  background: #10B981;
  color: white;
  border-radius: 12px;
  font-weight: 600;
`;

const CompaniesContainer = styled.div`
  padding: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
`;

// Duplicate Check Styled Components
const DuplicateWarningContainer = styled.div`
  padding: 16px 20px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#FCD34D' : '#B45309'};
`;

const DuplicateWarningHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: ${props => props.theme === 'light' ? '#92400E' : '#FCD34D'};
  font-weight: 600;
  font-size: 14px;
`;

const DuplicateCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DuplicateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const DuplicateAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DuplicateDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const DuplicateName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
`;

const DuplicateMatchReason = styled.div`
  font-size: 11px;
  color: #10B981;
  font-weight: 500;
  margin-top: 2px;
`;

const ConfidenceIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
  background: ${props => {
    if (props.level === 'exact') return '#10B981';
    if (props.level === 'high') return '#22C55E';
    if (props.level === 'medium') return '#F59E0B';
    return '#9CA3AF';
  }};
  color: white;
`;

const ManualSearchContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }

  &:focus {
    outline: none;
    border-color: #F59E0B;
  }
`;

const SearchButton = styled.button`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #F59E0B;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover { background: #D97706; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DuplicateMeta = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const DuplicateActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const MergeButton = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover { background: #059669; }
`;

const DismissButton = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const ProceedAnywayButton = styled.button`
  margin-top: 12px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  width: 100%;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

// Enum values
const CATEGORY_OPTIONS = [
  'Professional Investor', 'Founder', 'Manager', 'Advisor', 'Friend and Family',
  'Team', 'Supplier', 'Media', 'Student', 'Institution', 'Other'
];

const KEEP_IN_TOUCH_OPTIONS = [
  'Not Set', 'Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch'
];

const WISHES_OPTIONS = [
  'no wishes set', 'whatsapp standard', 'email standard', 'email custom',
  'whatsapp custom', 'call', 'present', 'no wishes'
];

const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app';

const extractDomain = (email) => {
  if (!email) return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};

const CreateContactModalAI = ({
  isOpen,
  onClose,
  emailData,
  theme = 'dark',
  onSuccess
}) => {
  // Tab state - AI Suggestions is now first
  const [activeTab, setActiveTab] = useState(0);

  // AI Suggestions state
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [acceptedFields, setAcceptedFields] = useState({});

  // Form fields (populated from AI or manual)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [markComplete, setMarkComplete] = useState(true);

  // Professional
  const [companies, setCompanies] = useState([]);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [modalCompanySearch, setModalCompanySearch] = useState('');
  const [modalCompanyResults, setModalCompanyResults] = useState([]);
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  const [existingDomainCompany, setExistingDomainCompany] = useState(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Contact Details
  const [mobiles, setMobiles] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [birthday, setBirthday] = useState('');

  // Preferences
  const [keepInTouchFrequency, setKeepInTouchFrequency] = useState('Not Set');
  const [score, setScore] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState([]);
  const [christmas, setChristmas] = useState('no wishes set');
  const [easter, setEaster] = useState('no wishes set');

  // Mobile modal
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [newMobile, setNewMobile] = useState('');

  // Loading states
  const [saving, setSaving] = useState(false);
  const [holdId, setHoldId] = useState(null);

  // Duplicate checking state
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [duplicatesHidden, setDuplicatesHidden] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [duplicatesCollapsed, setDuplicatesCollapsed] = useState(false);

  // Fetch AI suggestions - now returns all fields
  // manualNames: optional { firstName, lastName } from form for re-analyze with manual input
  const fetchAiSuggestions = async (data, manualNames = null) => {
    // Email is optional - can still analyze without it if we have name or body
    if (!data.email && !data.name && !data.body_text) {
      toast.error('Need email, name, or message to analyze');
      return;
    }

    setLoadingAiSuggestion(true);
    try {
      const requestBody = {
        from_email: data.email,
        from_name: data.name || '',
        subject: data.subject || '',
        body_text: data.body_text || ''
      };

      // Add manual names if provided (for re-analyze with user input)
      if (manualNames?.firstName) {
        requestBody.manual_first_name = manualNames.firstName;
      }
      if (manualNames?.lastName) {
        requestBody.manual_last_name = manualNames.lastName;
      }

      const response = await fetch(`${AGENT_SERVICE_URL}/suggest-contact-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.suggestions) {
          setAiSuggestions(result.suggestions);
          setAcceptedFields({});
          // Show appropriate message based on data available
          if (manualNames?.firstName || manualNames?.lastName) {
            toast.success('Apollo enrichment with your input complete!');
          } else if (data.body_text || data.subject) {
            toast.success('AI analysis complete!');
          } else {
            toast.success('Apollo enrichment complete!');
          }
        } else {
          toast.error('Could not analyze contact');
        }
      } else {
        toast.error('Failed to contact AI service');
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast.error('Error: ' + error.message);
    }
    setLoadingAiSuggestion(false);
  };

  // Accept individual suggestion
  const acceptSuggestion = (field, value) => {
    setAcceptedFields(prev => ({ ...prev, [field]: true }));

    switch (field) {
      case 'first_name':
        setFirstName(value);
        break;
      case 'last_name':
        setLastName(value);
        break;
      case 'job_title':
        setJobRole(value);
        // Auto-set category to Founder if job title is Founder
        if (value.toLowerCase().includes('founder')) {
          setCategory('Founder');
        }
        break;
      case 'category':
        setCategory(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'linkedin':
        setLinkedin(value);
        break;
      case 'linkedin_url':
        setLinkedin(value);
        break;
      case 'photo_url':
        setPhotoUrl(value);
        break;
      case 'city':
        handleAcceptCity(value);
        break;
      default:
        break;
    }
    toast.success(`${field.replace('_', ' ')} accepted`);
  };

  // Accept suggested tags
  const acceptSuggestedTags = (suggestedTags) => {
    if (!suggestedTags || suggestedTags.length === 0) return;
    setTags(suggestedTags);
    setAcceptedFields(prev => ({ ...prev, suggested_tags: true }));
    toast.success(`${suggestedTags.length} tag(s) accepted`);
  };

  // Accept phones suggestion
  const acceptPhones = (phones) => {
    if (!phones || phones.length === 0) return;

    const newMobiles = phones.map((p, i) => ({
      id: `temp_${Date.now()}_${i}`,
      number: p.value,
      is_primary: i === 0
    }));
    setMobiles(newMobiles);
    setAcceptedFields(prev => ({ ...prev, phones: true }));
    toast.success(`${phones.length} phone(s) accepted`);
  };

  // Accept company suggestion
  const acceptCompany = async (companySuggestion) => {
    if (!companySuggestion) return;

    const { name, domain } = companySuggestion;

    // First check if company exists by domain
    if (domain) {
      try {
        const { data: domainMatch } = await supabase
          .from('company_domains')
          .select('company_id, companies(company_id, name, category)')
          .ilike('domain', domain)
          .limit(1)
          .single();

        if (domainMatch?.companies) {
          const newAssoc = {
            contact_companies_id: `temp_${Date.now()}`,
            company_id: domainMatch.companies.company_id,
            companies: domainMatch.companies,
            is_primary: true,
            relationship: 'not_set'
          };
          setCompanies([newAssoc]);
          setAcceptedFields(prev => ({ ...prev, company: true }));
          toast.success(`Found existing company: ${domainMatch.companies.name}`);
          return;
        }
      } catch (e) {
        // No domain match, continue
      }
    }

    // Check by name
    try {
      const { data: nameMatch } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .ilike('name', name)
        .limit(1)
        .single();

      if (nameMatch) {
        const newAssoc = {
          contact_companies_id: `temp_${Date.now()}`,
          company_id: nameMatch.company_id,
          companies: nameMatch,
          is_primary: true,
          relationship: 'not_set'
        };
        setCompanies([newAssoc]);
        setAcceptedFields(prev => ({ ...prev, company: true }));
        toast.success(`Found existing company: ${nameMatch.name}`);
        return;
      }
    } catch (e) {
      // No name match, will create new
    }

    // Create new company
    try {
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({ name, category: 'Inbox' })
        .select()
        .single();

      if (error) throw error;

      // Add domain if provided
      if (domain && newCompany) {
        await supabase
          .from('company_domains')
          .insert({
            company_id: newCompany.company_id,
            domain: domain.toLowerCase(),
            is_primary: true
          });
      }

      const newAssoc = {
        contact_companies_id: `temp_${Date.now()}`,
        company_id: newCompany.company_id,
        companies: newCompany,
        is_primary: true,
        relationship: 'not_set'
      };
      setCompanies([newAssoc]);
      setAcceptedFields(prev => ({ ...prev, company: true }));
      toast.success(`Created new company: ${name}`);
    } catch (e) {
      console.error('Error creating company:', e);
      toast.error('Failed to create company');
    }
  };

  // Handle accept city
  const handleAcceptCity = async (cityName) => {
    if (!cityName) return;

    try {
      // Search for existing city
      const { data: existingCity } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .ilike('name', `%${cityName}%`)
        .limit(1)
        .single();

      if (existingCity) {
        setCities([existingCity]);
        toast.success(`City found: ${existingCity.name}`);
      } else {
        // Create new city
        const { data: newCity, error } = await supabase
          .from('cities')
          .insert({ name: cityName, country: 'Unknown' })
          .select()
          .single();

        if (!error && newCity) {
          setCities([newCity]);
          toast.success(`Created new city: ${cityName}`);
        }
      }
    } catch (e) {
      console.error('Error handling city:', e);
    }
  };

  // Accept ALL suggestions at once
  const acceptAllSuggestions = async () => {
    if (!aiSuggestions) return;

    const s = aiSuggestions;

    // Names
    if (s.first_name?.value) {
      setFirstName(s.first_name.value);
      setAcceptedFields(prev => ({ ...prev, first_name: true }));
    }
    if (s.last_name?.value) {
      setLastName(s.last_name.value);
      setAcceptedFields(prev => ({ ...prev, last_name: true }));
    }

    // Job & description
    if (s.job_title?.value) {
      setJobRole(s.job_title.value);
      setAcceptedFields(prev => ({ ...prev, job_title: true }));
      // Auto-set category to Founder if job title is Founder
      if (s.job_title.value.toLowerCase().includes('founder')) {
        setCategory('Founder');
      }
    } else if (s.apollo_job_title?.value) {
      // Fallback to Apollo job title if no email signature job title
      setJobRole(s.apollo_job_title.value);
      setAcceptedFields(prev => ({ ...prev, apollo_job_title: true }));
      // Auto-set category to Founder if job title is Founder
      if (s.apollo_job_title.value.toLowerCase().includes('founder')) {
        setCategory('Founder');
      }
    }
    if (s.description?.value) {
      setDescription(s.description.value);
      setAcceptedFields(prev => ({ ...prev, description: true }));
    }
    if (s.category?.value) {
      setCategory(s.category.value);
      setAcceptedFields(prev => ({ ...prev, category: true }));
    }
    if (s.linkedin?.value) {
      setLinkedin(s.linkedin.value);
      setAcceptedFields(prev => ({ ...prev, linkedin: true }));
    }

    // LinkedIn URL from Apollo
    if (s.linkedin_url?.value) {
      setLinkedin(s.linkedin_url.value);
      setAcceptedFields(prev => ({ ...prev, linkedin_url: true }));
    }

    // Photo URL from Apollo
    if (s.photo_url?.value) {
      setPhotoUrl(s.photo_url.value);
      setAcceptedFields(prev => ({ ...prev, photo_url: true }));
    }

    // Suggested Tags
    if (s.suggested_tags && s.suggested_tags.length > 0) {
      setTags(s.suggested_tags);
      setAcceptedFields(prev => ({ ...prev, suggested_tags: true }));
    }

    // Phones
    if (s.phones && s.phones.length > 0) {
      acceptPhones(s.phones);
    }

    // Company - prefer Apollo company if available
    if (s.apollo_company?.name && !acceptedFields.company) {
      if (s.apollo_company.exists_in_db) {
        // Link to existing company
        const newAssoc = {
          contact_companies_id: `temp_${Date.now()}`,
          company_id: s.apollo_company.company_id,
          companies: {
            company_id: s.apollo_company.company_id,
            name: s.apollo_company.name,
            category: s.apollo_company.category
          },
          is_primary: true,
          relationship: 'not_set'
        };
        setCompanies([newAssoc]);
        setAcceptedFields(prev => ({ ...prev, apollo_company: true, company: true }));
      } else {
        // Create new company from Apollo data
        try {
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              name: s.apollo_company.name,
              category: 'Inbox',
              website: s.apollo_company.website
            })
            .select()
            .single();

          if (!error && newCompany) {
            // Add domain if available
            if (s.apollo_company.domain) {
              await supabase
                .from('company_domains')
                .insert({
                  company_id: newCompany.company_id,
                  domain: s.apollo_company.domain.toLowerCase(),
                  is_primary: true
                });
            }

            const newAssoc = {
              contact_companies_id: `temp_${Date.now()}`,
              company_id: newCompany.company_id,
              companies: newCompany,
              is_primary: true,
              relationship: 'not_set'
            };
            setCompanies([newAssoc]);
            setAcceptedFields(prev => ({ ...prev, apollo_company: true, company: true }));
          }
        } catch (e) {
          console.error('Error creating company from Apollo:', e);
        }
      }
    } else if (s.company?.name) {
      await acceptCompany(s.company);
    }

    // City
    if (s.city?.value) {
      await handleAcceptCity(s.city.value);
      setAcceptedFields(prev => ({ ...prev, city: true }));
    }

    toast.success('All suggestions accepted!');
  };

  // Common email providers to exclude from domain matching
  const COMMON_EMAIL_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'me.com', 'live.com', 'msn.com', 'aol.com', 'mail.com', 'protonmail.com',
    'libero.it', 'virgilio.it', 'alice.it', 'tin.it', 'fastwebnet.it'
  ];

  // Helper to capitalize name
  const capitalizeName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Helper to get confidence label
  const getConfidenceLabel = (score) => {
    if (score >= 95) return 'exact';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  // Search for potential duplicates with confidence scoring
  const searchForDuplicates = async (emailAddress, fromName) => {
    if (!emailAddress) return [];

    setDuplicatesLoading(true);
    const matchesMap = new Map(); // Use Map to deduplicate and track best scores

    try {
      // === PARSE NAMES ===
      // Strategy: Try multiple name parsing approaches

      const nameCandidates = []; // Array of { firstName, lastName, source }

      // 1. Parse from display name (if real name, not email)
      const isFromNameAnEmail = fromName && fromName.includes('@');
      if (fromName && !isFromNameAnEmail) {
        const nameParts = fromName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          nameCandidates.push({
            firstName: capitalizeName(nameParts[0]),
            lastName: capitalizeName(nameParts[nameParts.length - 1]),
            source: 'displayName'
          });
        } else if (nameParts.length === 1) {
          nameCandidates.push({
            firstName: '',
            lastName: capitalizeName(nameParts[0]),
            source: 'displayName'
          });
        }
      }

      // 2. Parse from email local part - TRY BOTH ORDERINGS
      const localPart = emailAddress.split('@')[0]?.toLowerCase();
      if (localPart) {
        const dotParts = localPart.split('.');
        if (dotParts.length >= 2) {
          // Ordering 1: firstname.lastname (common in US/UK)
          nameCandidates.push({
            firstName: capitalizeName(dotParts[0]),
            lastName: capitalizeName(dotParts[dotParts.length - 1]),
            source: 'emailFirstLast'
          });
          // Ordering 2: lastname.firstname (common in Italy/Europe)
          nameCandidates.push({
            firstName: capitalizeName(dotParts[dotParts.length - 1]),
            lastName: capitalizeName(dotParts[0]),
            source: 'emailLastFirst'
          });
        }
      }

      // === 1. EXACT EMAIL MATCH (100% confidence) ===
      const { data: emailMatches, error: emailError } = await supabase
        .from('contacts')
        .select(`
          contact_id, first_name, last_name, category, profile_image_url, created_at,
          contact_emails!inner (email, is_primary),
          contact_mobiles (mobile, is_primary)
        `)
        .ilike('contact_emails.email', emailAddress.toLowerCase());

      if (!emailError && emailMatches) {
        emailMatches.forEach(contact => {
          matchesMap.set(contact.contact_id, {
            ...contact,
            matchReasons: [`Exact email: ${emailAddress}`],
            matchType: 'email',
            confidenceScore: 100,
            confidenceLabel: 'exact'
          });
        });
      }

      // === 2. FULL NAME MATCHES (90% confidence) ===
      for (const candidate of nameCandidates) {
        if (candidate.firstName && candidate.lastName && candidate.firstName.length >= 2 && candidate.lastName.length >= 2) {
          const { data: fullNameMatches } = await supabase
            .from('contacts')
            .select(`
              contact_id, first_name, last_name, category, profile_image_url, created_at,
              contact_emails (email, is_primary),
              contact_mobiles (mobile, is_primary)
            `)
            .ilike('first_name', candidate.firstName)
            .ilike('last_name', candidate.lastName);

          fullNameMatches?.forEach(contact => {
            if (!matchesMap.has(contact.contact_id)) {
              matchesMap.set(contact.contact_id, {
                ...contact,
                matchReasons: [`Full name: ${candidate.firstName} ${candidate.lastName}`],
                matchType: 'fullName',
                confidenceScore: 90,
                confidenceLabel: 'high'
              });
            }
          });
        }
      }

      // === 3. SURNAME + FIRST INITIAL (85% confidence) ===
      for (const candidate of nameCandidates) {
        if (candidate.lastName && candidate.lastName.length >= 2 && candidate.firstName) {
          const firstInitial = candidate.firstName.charAt(0);
          const { data: initialMatches } = await supabase
            .from('contacts')
            .select(`
              contact_id, first_name, last_name, category, profile_image_url, created_at,
              contact_emails (email, is_primary),
              contact_mobiles (mobile, is_primary)
            `)
            .ilike('last_name', candidate.lastName)
            .ilike('first_name', `${firstInitial}%`);

          initialMatches?.forEach(contact => {
            if (!matchesMap.has(contact.contact_id)) {
              matchesMap.set(contact.contact_id, {
                ...contact,
                matchReasons: [`${firstInitial}. ${candidate.lastName}`],
                matchType: 'surnameInitial',
                confidenceScore: 85,
                confidenceLabel: 'high'
              });
            }
          });
        }
      }

      // === 4. SURNAME ONLY (60% confidence) ===
      for (const candidate of nameCandidates) {
        if (candidate.lastName && candidate.lastName.length >= 3) {
          const { data: surnameMatches } = await supabase
            .from('contacts')
            .select(`
              contact_id, first_name, last_name, category, profile_image_url, created_at,
              contact_emails (email, is_primary),
              contact_mobiles (mobile, is_primary)
            `)
            .ilike('last_name', candidate.lastName);

          surnameMatches?.forEach(contact => {
            if (!matchesMap.has(contact.contact_id)) {
              matchesMap.set(contact.contact_id, {
                ...contact,
                matchReasons: [`Same surname: ${candidate.lastName}`],
                matchType: 'surname',
                confidenceScore: 60,
                confidenceLabel: 'medium'
              });
            }
          });
        }
      }

      // === 5. FIRST NAME + COMPANY DOMAIN (50% confidence) ===
      const emailDomain = emailAddress.split('@')[1]?.toLowerCase();
      if (emailDomain && !COMMON_EMAIL_PROVIDERS.includes(emailDomain)) {
        for (const candidate of nameCandidates) {
          if (candidate.firstName && candidate.firstName.length >= 3) {
            const { data: firstNameDomainMatches } = await supabase
              .from('contacts')
              .select(`
                contact_id, first_name, last_name, category, profile_image_url, created_at,
                contact_emails!inner (email, is_primary),
                contact_mobiles (mobile, is_primary)
              `)
              .ilike('first_name', candidate.firstName)
              .ilike('contact_emails.email', `%@${emailDomain}`);

            firstNameDomainMatches?.forEach(contact => {
              if (!matchesMap.has(contact.contact_id)) {
                matchesMap.set(contact.contact_id, {
                  ...contact,
                  matchReasons: [`${candidate.firstName} at @${emailDomain}`],
                  matchType: 'firstNameDomain',
                  confidenceScore: 50,
                  confidenceLabel: 'medium'
                });
              }
            });
          }
        }
      }

      // === 6. COMPANY DOMAIN ONLY (30% confidence) ===
      if (emailDomain && !COMMON_EMAIL_PROVIDERS.includes(emailDomain)) {
        const { data: domainMatches } = await supabase
          .from('contacts')
          .select(`
            contact_id, first_name, last_name, category, profile_image_url, created_at,
            contact_emails!inner (email, is_primary),
            contact_mobiles (mobile, is_primary)
          `)
          .ilike('contact_emails.email', `%@${emailDomain}`)
          .limit(10);

        domainMatches?.forEach(contact => {
          if (!matchesMap.has(contact.contact_id)) {
            matchesMap.set(contact.contact_id, {
              ...contact,
              matchReasons: [`Same domain: @${emailDomain}`],
              matchType: 'domain',
              confidenceScore: 30,
              confidenceLabel: 'low'
            });
          }
        });
      }

      // Convert Map to array, sort by confidence, take top 3
      const sortedMatches = Array.from(matchesMap.values())
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 3);

      setPotentialDuplicates(sortedMatches);
      setDuplicatesChecked(true);
      return sortedMatches;

    } catch (error) {
      console.error('Error searching for duplicates:', error);
      setDuplicatesChecked(true);
      return [];
    } finally {
      setDuplicatesLoading(false);
    }
  };

  // Manual search for duplicates
  const handleManualSearch = async () => {
    if (!manualSearchQuery.trim()) return;

    setManualSearchLoading(true);
    try {
      const searchTerm = manualSearchQuery.trim();
      const nameWords = searchTerm.split(/\s+/);
      let nameQuery = '';

      if (nameWords.length === 1) {
        nameQuery = `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`;
      } else if (nameWords.length === 2) {
        const [word1, word2] = nameWords;
        nameQuery = `and(first_name.ilike.%${word1}%,last_name.ilike.%${word2}%),and(first_name.ilike.%${word2}%,last_name.ilike.%${word1}%),first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`;
      } else {
        const wordQueries = nameWords.map(word => `first_name.ilike.%${word}%,last_name.ilike.%${word}%`).join(',');
        nameQuery = `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,${wordQueries}`;
      }

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select(`
          contact_id, first_name, last_name, category, profile_image_url, created_at,
          contact_emails (email, is_primary),
          contact_mobiles (mobile, is_primary)
        `)
        .or(nameQuery)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Add search results with "manual" confidence
      const manualResults = (contacts || []).map(contact => ({
        ...contact,
        matchReasons: [`Search: "${searchTerm}"`],
        matchType: 'manual',
        confidenceScore: 70,
        confidenceLabel: 'medium'
      }));

      // Merge with existing, avoiding duplicates
      const existingIds = new Set(potentialDuplicates.map(d => d.contact_id));
      const newResults = manualResults.filter(r => !existingIds.has(r.contact_id));

      setPotentialDuplicates(prev => [...newResults, ...prev].slice(0, 5));

    } catch (error) {
      console.error('Error in manual search:', error);
      toast.error('Search failed');
    } finally {
      setManualSearchLoading(false);
    }
  };

  // Handle merge with duplicate - adds the new email to existing contact
  const handleMergeWithDuplicate = async (duplicate) => {
    // Quick merge: add the new email to the existing contact
    try {
      // Check if email already exists on this contact
      const existingEmail = duplicate.contact_emails?.find(
        e => e.email?.toLowerCase() === email?.toLowerCase()
      );

      if (existingEmail) {
        toast.success(`${duplicate.first_name} ${duplicate.last_name} already has this email`);
      } else if (email) {
        // Add the new email to the existing contact
        const { error } = await supabase
          .from('contact_emails')
          .insert({
            contact_id: duplicate.contact_id,
            email: email.toLowerCase().trim(),
            is_primary: duplicate.contact_emails?.length === 0 // Primary if no other emails
          });

        if (error) {
          console.error('Error adding email:', error);
          toast.error('Failed to add email to contact');
          return;
        }

        toast.success(`Added email to ${duplicate.first_name} ${duplicate.last_name}`);
      }

      // Delete from contacts_hold if holdId exists
      if (holdId) {
        await supabase
          .from('contacts_hold')
          .delete()
          .eq('hold_id', holdId);
      }

      // Return the merged contact
      if (onSuccess) onSuccess(duplicate);
      onClose();

    } catch (error) {
      console.error('Error merging:', error);
      toast.error('Failed to merge contacts');
    }
  };

  // Dismiss a single duplicate
  const handleDismissDuplicate = (contactId) => {
    setDismissedDuplicates(prev => [...prev, contactId]);
  };

  // Get visible duplicates (excluding dismissed ones)
  const visibleDuplicates = potentialDuplicates.filter(
    d => !dismissedDuplicates.includes(d.contact_id)
  );

  // Format contact email for display
  const formatDuplicateEmail = (emails) => {
    if (!emails || emails.length === 0) return null;
    const primary = emails.find(e => e.is_primary);
    return primary?.email || emails[0]?.email;
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && emailData) {
      // Reset everything
      setActiveTab(0);
      setAiSuggestions(null);
      setAcceptedFields({});

      // Reset duplicate checking state
      setDuplicatesLoading(false);
      setDuplicatesChecked(false);
      setPotentialDuplicates([]);
      setDuplicatesHidden(false);
      setDismissedDuplicates([]);
      setDuplicatesCollapsed(false);

      // Set email and mobile
      setEmail(emailData.email || '');
      setFirstName(emailData.first_name || '');
      setLastName(emailData.last_name || '');
      setCategory('');
      setMarkComplete(false);
      setJobRole(emailData.job_role || '');
      setLinkedin('');
      setDescription('');
      setPhotoUrl('');
      setCompanies([]);
      // Pre-populate mobile if provided (e.g., from WhatsApp)
      if (emailData.mobile) {
        setMobiles([{
          id: `temp_${Date.now()}`,
          number: emailData.mobile,
          is_primary: true
        }]);
      } else {
        setMobiles([]);
      }
      setCities([]);
      setBirthday('');
      setKeepInTouchFrequency('Not Set');
      setScore(3);
      setTags([]);
      setChristmas('no wishes set');
      setEaster('no wishes set');
      setHoldId(emailData.hold_id || null);

      // Auto-trigger duplicate check (runs in parallel with AI analysis)
      // For WhatsApp contacts, search by name instead of email
      if (emailData.email) {
        searchForDuplicates(emailData.email, emailData.name);
      } else if (emailData.first_name || emailData.name) {
        // For WhatsApp contacts without email, search by name
        const searchName = emailData.name || `${emailData.first_name} ${emailData.last_name || ''}`.trim();
        setManualSearchQuery(searchName);
        handleManualSearch();
      }

      // Auto-trigger AI analysis (only if we have email or content to analyze)
      if ((emailData.email || emailData.name) && (emailData.body_text || emailData.subject)) {
        fetchAiSuggestions(emailData);
      }
    }
  }, [isOpen, emailData]);

  // Search companies for modal
  const searchModalCompanies = async (query) => {
    if (!query || query.length < 2) {
      setModalCompanyResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .ilike('name', `%${query}%`)
        .limit(10);
      if (!error) {
        setModalCompanyResults(data || []);
      }
    } catch (e) {
      console.error('Error searching companies:', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (modalCompanySearch) {
        searchModalCompanies(modalCompanySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [modalCompanySearch]);

  // Search cities
  const searchCities = async (query) => {
    if (!query || query.length < 2) {
      setCityResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .ilike('name', `%${query}%`)
        .limit(10);
      if (!error) {
        setCityResults(data || []);
      }
    } catch (e) {
      console.error('Error searching cities:', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearch && cityModalOpen) {
        searchCities(citySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [citySearch, cityModalOpen]);

  // Search tags
  const searchTags = async (query) => {
    if (!query || query.length < 1) {
      setTagResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .limit(10);
      if (!error) {
        const selectedIds = tags.map(t => t.tag_id);
        setTagResults((data || []).filter(t => !selectedIds.includes(t.tag_id)));
      }
    } catch (e) {
      console.error('Error searching tags:', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tagSearch && tagModalOpen) {
        searchTags(tagSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tagSearch, tagModalOpen]);

  // Handlers
  const handleAddCompany = (company) => {
    if (companies.find(c => c.companies?.company_id === company.company_id)) {
      toast.error('Company already added');
      return;
    }
    const newAssociation = {
      contact_companies_id: `temp_${Date.now()}`,
      company_id: company.company_id,
      companies: company,
      relationship: 'not_set',
      is_primary: companies.length === 0
    };
    setCompanies([...companies, newAssociation]);
    setModalCompanySearch('');
    setModalCompanyResults([]);
    toast.success(`Added ${company.name}`);
  };

  const handleRemoveCompany = (companyAssociationId) => {
    const toRemove = companies.find(c => c.contact_companies_id === companyAssociationId);
    const updated = companies.filter(c => c.contact_companies_id !== companyAssociationId);
    if (toRemove?.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    setCompanies(updated);
    toast.success('Company removed');
  };

  const handleAddCity = (city) => {
    if (cities.find(c => c.city_id === city.city_id)) {
      toast.error('City already added');
      return;
    }
    setCities([...cities, city]);
    setCitySearch('');
    setCityResults([]);
    toast.success(`Added ${city.name}`);
  };

  const handleRemoveCity = (cityId) => {
    setCities(cities.filter(c => c.city_id !== cityId));
    toast.success('City removed');
  };

  const handleAddMobile = (mobileNumber) => {
    if (!mobileNumber.trim()) return;
    if (mobiles.find(m => m.number === mobileNumber)) {
      toast.error('Mobile already added');
      return;
    }
    const newMobileObj = {
      id: `temp_${Date.now()}`,
      number: mobileNumber.trim(),
      is_primary: mobiles.length === 0
    };
    setMobiles([...mobiles, newMobileObj]);
    setNewMobile('');
    toast.success('Mobile added');
  };

  const handleRemoveMobile = (mobileId) => {
    const updated = mobiles.filter(m => m.id !== mobileId);
    if (updated.length > 0 && !updated.some(m => m.is_primary)) {
      updated[0].is_primary = true;
    }
    setMobiles(updated);
    toast.success('Mobile removed');
  };

  const handleAddTag = (tag) => {
    if (tags.find(t => t.tag_id === tag.tag_id)) {
      toast.error('Tag already added');
      return;
    }
    setTags([...tags, tag]);
    setTagSearch('');
    setTagResults([]);
    toast.success(`Added ${tag.name}`);
  };

  const handleRemoveTag = (tagId) => {
    setTags(tags.filter(t => t.tag_id !== tagId));
    toast.success('Tag removed');
  };

  // Save handler
  const handleSave = async () => {
    // Basic info fields are always visible at the top - no need to switch tabs
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    // Email is optional - but require at least email OR mobile
    if (!email.trim() && mobiles.length === 0) {
      toast.error('Either email or mobile is required');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }

    setSaving(true);
    try {
      // Create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          job_role: jobRole.trim() || null,
          linkedin: linkedin.trim() || null,
          category: category,
          description: description.trim() || null,
          score: score,
          birthday: birthday || null,
          show_missing: !markComplete,
          created_by: 'User',
          profile_image_url: photoUrl || null
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Create contact_emails (only if email provided)
      if (email.trim()) {
        await supabase
          .from('contact_emails')
          .insert({
            contact_id: contact.contact_id,
            email: email.toLowerCase().trim(),
            is_primary: true
          });
      }

      // Create contact_mobiles
      for (const mobileItem of mobiles) {
        await supabase
          .from('contact_mobiles')
          .insert({
            contact_id: contact.contact_id,
            mobile: mobileItem.number,
            is_primary: mobileItem.is_primary || false
          });
      }

      // Create contact_companies
      for (const companyAssoc of companies) {
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contact.contact_id,
            company_id: companyAssoc.company_id,
            is_primary: companyAssoc.is_primary || false,
            relationship: companyAssoc.relationship || null
          });
      }

      // Create contact_cities
      for (const city of cities) {
        await supabase
          .from('contact_cities')
          .insert({
            contact_id: contact.contact_id,
            city_id: city.city_id
          });
      }

      // Create contact_tags
      for (const tag of tags) {
        await supabase
          .from('contact_tags')
          .insert({
            contact_id: contact.contact_id,
            tag_id: tag.tag_id
          });
      }

      // Create keep_in_touch
      await supabase
        .from('keep_in_touch')
        .insert({
          contact_id: contact.contact_id,
          frequency: keepInTouchFrequency,
          christmas: christmas,
          easter: easter
        });

      // Delete from contacts_hold if holdId exists
      if (holdId) {
        await supabase
          .from('contacts_hold')
          .delete()
          .eq('hold_id', holdId);
      }

      toast.success(`${firstName} ${lastName} added to CRM`);
      if (onSuccess) onSuccess(contact);
      onClose();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact: ' + error.message);
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  // Theme colors
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#111827' : '#F9FAFB';
  const tabActiveBg = isDark ? '#374151' : '#E5E7EB';

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: inputBg,
    color: textColor,
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: mutedColor,
    marginBottom: '4px'
  };

  const tabStyle = (isActive) => ({
    padding: '10px 16px',
    border: 'none',
    background: isActive ? tabActiveBg : 'transparent',
    color: isActive ? textColor : mutedColor,
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s'
  });

  // Tab structure - Basic Info fields are now above tabs
  const tabs = ['AI Suggestions', 'Professional', 'Contact Details', 'Preferences', 'Review'];

  // Render suggestion row helper
  const renderSuggestion = (field, label, suggestion) => {
    if (!suggestion || suggestion.value === null) return null;

    const isAccepted = acceptedFields[field];

    return (
      <SuggestionCard theme={theme}>
        <SuggestionHeader>
          <SuggestionLabel theme={theme}>{label}</SuggestionLabel>
          {suggestion.confidence && (
            <ConfidenceBadge level={suggestion.confidence}>
              {suggestion.confidence}
            </ConfidenceBadge>
          )}
        </SuggestionHeader>
        <SuggestionValue theme={theme}>{suggestion.value}</SuggestionValue>
        {suggestion.alternatives && suggestion.alternatives.length > 0 && (
          <div style={{ fontSize: '11px', color: mutedColor, marginTop: '4px' }}>
            Alternatives: {suggestion.alternatives.join(', ')}
          </div>
        )}
        <SuggestionActions>
          {isAccepted ? (
            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
          ) : (
            <AcceptButton onClick={() => acceptSuggestion(field, suggestion.value)}>
              <FaCheck size={10} /> Accept
            </AcceptButton>
          )}
        </SuggestionActions>
      </SuggestionCard>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        height: '85vh',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '0'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaRobot style={{ color: '#8B5CF6' }} /> Add New Contact
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: mutedColor,
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>

        {/* Core Identity Fields - Always visible */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${borderColor}`,
          background: isDark ? '#1F2937' : '#FFFFFF',
          flexShrink: 0
        }}>
          {/* Email and Mobile row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px' }}
                placeholder="email@example.com"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>
                Mobile {mobiles.length > 0 && <span style={{ color: '#10B981' }}>({mobiles.length})</span>}
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="tel"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMobile.trim()) {
                      handleAddMobile(newMobile);
                    }
                  }}
                  style={{ ...inputStyle, padding: '8px 12px', flex: 1 }}
                  placeholder="+39 333 1234567"
                />
                <button
                  onClick={() => {
                    if (newMobile.trim()) {
                      handleAddMobile(newMobile);
                    }
                  }}
                  disabled={!newMobile.trim()}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: newMobile.trim() ? '#10B981' : (isDark ? '#374151' : '#E5E7EB'),
                    color: newMobile.trim() ? 'white' : mutedColor,
                    cursor: newMobile.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              {/* Show added mobiles */}
              {mobiles.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {mobiles.map((m) => (
                    <span
                      key={m.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        background: isDark ? '#374151' : '#E5E7EB',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: textColor
                      }}
                    >
                      <FaPhone size={8} /> {m.number}
                      <button
                        onClick={() => handleRemoveMobile(m.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 2px',
                          color: mutedColor,
                          fontSize: '10px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '12px', marginTop: '-8px' }}>
            At least email or mobile is required
          </div>

          {/* Name row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px' }}
                placeholder="First name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px' }}
                placeholder="Last name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', cursor: 'pointer' }}
              >
                <option value="">Select...</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Duplicate Warning Section - Only show in AI Suggestions tab */}
        {activeTab === 0 && !duplicatesHidden && (duplicatesLoading || visibleDuplicates.length > 0 || duplicatesChecked) && (
          <DuplicateWarningContainer theme={theme} style={{ padding: duplicatesCollapsed ? '12px 20px' : '16px 20px' }}>
            <DuplicateWarningHeader
              theme={theme}
              style={{ marginBottom: duplicatesCollapsed ? 0 : 12, cursor: 'pointer' }}
              onClick={() => setDuplicatesCollapsed(!duplicatesCollapsed)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <FaExclamationTriangle />
                {duplicatesLoading ? (
                  'Checking for duplicates...'
                ) : visibleDuplicates.length > 0 ? (
                  `Potential Duplicates (${visibleDuplicates.length})`
                ) : (
                  'No duplicates found'
                )}
              </div>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>
                {duplicatesCollapsed ? '▼ Expand' : '▲ Collapse'}
              </span>
            </DuplicateWarningHeader>

            {!duplicatesCollapsed && (
              <>
                {/* Manual Search Input */}
                <ManualSearchContainer theme={theme}>
                  <SearchInput
                    theme={theme}
                    type="text"
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                  />
                  <SearchButton
                    onClick={handleManualSearch}
                    disabled={manualSearchLoading || !manualSearchQuery.trim()}
                  >
                    {manualSearchLoading ? '...' : <><FaSearch size={12} /> Search</>}
                  </SearchButton>
                </ManualSearchContainer>

                {duplicatesLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    color: isDark ? '#FCD34D' : '#92400E',
                    fontSize: '13px'
                  }}>
                    Searching your contacts...
                  </div>
                ) : visibleDuplicates.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    color: isDark ? '#FCD34D' : '#92400E',
                    fontSize: '13px'
                  }}>
                    Use search above to find contacts manually
                  </div>
                ) : (
                  <>
                    {/* Sort by confidence score - highest first */}
                    {visibleDuplicates
                      .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
                      .slice(0, 3) // Show max 3 duplicates
                      .map((duplicate) => (
                        <DuplicateCard key={duplicate.contact_id} theme={theme}>
                          <DuplicateInfo>
                            <DuplicateAvatar theme={theme}>
                              {duplicate.profile_image_url ? (
                                <img src={duplicate.profile_image_url} alt="Profile" />
                              ) : (
                                <FaUser size={16} />
                              )}
                            </DuplicateAvatar>
                            <DuplicateDetails>
                              <DuplicateName theme={theme}>
                                {duplicate.first_name} {duplicate.last_name}
                                <ConfidenceIndicator level={duplicate.confidenceLabel || 'low'}>
                                  {duplicate.confidenceLabel === 'exact' ? 'EXACT' :
                                   duplicate.confidenceLabel === 'high' ? 'HIGH' :
                                   duplicate.confidenceLabel === 'medium' ? 'MEDIUM' : 'LOW'}
                                  {duplicate.confidenceScore ? ` ${duplicate.confidenceScore}%` : ''}
                                </ConfidenceIndicator>
                              </DuplicateName>
                              <DuplicateMatchReason>
                                {duplicate.matchReasons?.join(' • ')}
                              </DuplicateMatchReason>
                              <DuplicateMeta theme={theme}>
                                {formatDuplicateEmail(duplicate.contact_emails) && (
                                  <span>
                                    <FaEnvelope size={10} style={{ marginRight: '4px' }} />
                                    {formatDuplicateEmail(duplicate.contact_emails)}
                                  </span>
                                )}
                                {duplicate.category && (
                                  <span style={{
                                    padding: '1px 6px',
                                    background: isDark ? '#374151' : '#E5E7EB',
                                    borderRadius: '4px',
                                    fontSize: '10px'
                                  }}>
                                    {duplicate.category}
                                  </span>
                                )}
                              </DuplicateMeta>
                            </DuplicateDetails>
                          </DuplicateInfo>
                          <DuplicateActions>
                            <MergeButton onClick={() => handleMergeWithDuplicate(duplicate)}>
                              <FiGitMerge size={12} /> Merge
                            </MergeButton>
                            <DismissButton
                              theme={theme}
                              onClick={() => handleDismissDuplicate(duplicate.contact_id)}
                            >
                              Not this
                            </DismissButton>
                          </DuplicateActions>
                        </DuplicateCard>
                      ))}

                    {visibleDuplicates.length > 3 && (
                      <div style={{
                        textAlign: 'center',
                        fontSize: '12px',
                        color: isDark ? '#FCD34D' : '#92400E',
                        marginTop: '8px'
                      }}>
                        + {visibleDuplicates.length - 3} more potential duplicates
                      </div>
                    )}

                    <ProceedAnywayButton
                      theme={theme}
                      onClick={() => setDuplicatesHidden(true)}
                    >
                      This is a new person - Create anyway →
                    </ProceedAnywayButton>
                  </>
                )}
              </>
            )}
          </DuplicateWarningContainer>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 20px',
          borderBottom: `1px solid ${borderColor}`,
          background: isDark ? '#111827' : '#F3F4F6',
          flexShrink: 0,
          overflowX: 'auto'
        }}>
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              style={tabStyle(activeTab === idx)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>

          {/* Tab 0 - AI Suggestions */}
          {activeTab === 0 && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>AI Analysis</h3>
                    <p style={{ margin: '4px 0 0', color: mutedColor, fontSize: '12px' }}>
                      Claude has analyzed the email and suggests the following data
                    </p>
                  </div>
                  <button
                    onClick={() => fetchAiSuggestions(emailData, { firstName, lastName })}
                    disabled={loadingAiSuggestion}
                    title={firstName || lastName ? `Will search Apollo for: ${firstName} ${lastName}` : 'Re-analyze email'}
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loadingAiSuggestion ? 'wait' : 'pointer',
                      background: loadingAiSuggestion ? '#6B7280' : '#8B5CF6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {loadingAiSuggestion ? '⏳ Analyzing...' : '🔄 Re-analyze'}
                  </button>
                </div>
              </div>

              {loadingAiSuggestion && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: mutedColor
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
                  <div>Analyzing email with Claude...</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>This may take a few seconds</div>
                </div>
              )}

              {!loadingAiSuggestion && !aiSuggestions && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: mutedColor,
                  border: `1px dashed ${borderColor}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📧</div>
                  <div>No suggestions yet</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>Click "Re-analyze" to scan the email</div>
                </div>
              )}

              {!loadingAiSuggestion && aiSuggestions && (
                <>
                  {/* Accept All button */}
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={acceptAllSuggestions}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: '#10B981',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <FaCheck /> Accept All Suggestions
                    </button>
                  </div>

                  {/* Signature found indicator */}
                  {aiSuggestions.signature_found && (
                    <div style={{
                      padding: '8px 12px',
                      background: isDark ? '#064E3B' : '#D1FAE5',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      color: isDark ? '#6EE7B7' : '#065F46'
                    }}>
                      ✓ Email signature detected and parsed
                    </div>
                  )}

                  {/* Name suggestions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {renderSuggestion('first_name', 'First Name', aiSuggestions.first_name)}
                    {renderSuggestion('last_name', 'Last Name', aiSuggestions.last_name)}
                  </div>

                  {/* Job title from email signature */}
                  {renderSuggestion('job_title', 'Job Title', aiSuggestions.job_title)}

                  {/* Job title from Apollo */}
                  {aiSuggestions.apollo_job_title?.value && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>
                          Job Title
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: '#8B5CF6',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 600
                          }}>
                            APOLLO
                          </span>
                        </SuggestionLabel>
                        {aiSuggestions.apollo_job_title.confidence && (
                          <ConfidenceBadge level={aiSuggestions.apollo_job_title.confidence}>
                            {aiSuggestions.apollo_job_title.confidence}
                          </ConfidenceBadge>
                        )}
                      </SuggestionHeader>
                      <SuggestionValue theme={theme}>{aiSuggestions.apollo_job_title.value}</SuggestionValue>
                      <SuggestionActions>
                        {acceptedFields.apollo_job_title ? (
                          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                        ) : (
                          <AcceptButton onClick={() => {
                            setJobRole(aiSuggestions.apollo_job_title.value);
                            setAcceptedFields(prev => ({ ...prev, apollo_job_title: true }));
                            // Auto-set category to Founder if job title is Founder
                            if (aiSuggestions.apollo_job_title.value.toLowerCase().includes('founder')) {
                              setCategory('Founder');
                            }
                            toast.success('Job title (Apollo) accepted');
                          }}>
                            <FaCheck size={10} /> Accept
                          </AcceptButton>
                        )}
                      </SuggestionActions>
                    </SuggestionCard>
                  )}

                  {/* Company from Apollo */}
                  {aiSuggestions.apollo_company && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>
                          Company
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: '#8B5CF6',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 600
                          }}>
                            APOLLO
                          </span>
                          {aiSuggestions.apollo_company.exists_in_db && (
                            <span style={{
                              marginLeft: '6px',
                              padding: '2px 6px',
                              background: '#10B981',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: 600
                            }}>
                              IN CRM
                            </span>
                          )}
                        </SuggestionLabel>
                        {aiSuggestions.apollo_company.confidence && (
                          <ConfidenceBadge level={aiSuggestions.apollo_company.confidence}>
                            {aiSuggestions.apollo_company.confidence}
                          </ConfidenceBadge>
                        )}
                      </SuggestionHeader>
                      <SuggestionValue theme={theme}>
                        {aiSuggestions.apollo_company.name}
                        {aiSuggestions.apollo_company.domain && (
                          <span style={{ fontSize: '12px', color: mutedColor, marginLeft: '8px' }}>
                            ({aiSuggestions.apollo_company.domain})
                          </span>
                        )}
                        {aiSuggestions.apollo_company.matched_by && (
                          <span style={{ fontSize: '10px', color: mutedColor, display: 'block', marginTop: '4px' }}>
                            Matched by: {aiSuggestions.apollo_company.matched_by.replace('_', ' ')}
                          </span>
                        )}
                      </SuggestionValue>
                      <SuggestionActions>
                        {acceptedFields.apollo_company ? (
                          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                        ) : (
                          <AcceptButton onClick={async () => {
                            if (aiSuggestions.apollo_company.exists_in_db) {
                              // Link to existing company
                              const newAssoc = {
                                contact_companies_id: `temp_${Date.now()}`,
                                company_id: aiSuggestions.apollo_company.company_id,
                                companies: {
                                  company_id: aiSuggestions.apollo_company.company_id,
                                  name: aiSuggestions.apollo_company.name,
                                  category: aiSuggestions.apollo_company.category
                                },
                                is_primary: true,
                                relationship: 'not_set'
                              };
                              setCompanies([newAssoc]);
                              setAcceptedFields(prev => ({ ...prev, apollo_company: true, company: true }));
                              toast.success(`Linked to ${aiSuggestions.apollo_company.name}`);
                            } else {
                              // Create new company
                              try {
                                const { data: newCompany, error } = await supabase
                                  .from('companies')
                                  .insert({
                                    name: aiSuggestions.apollo_company.name,
                                    category: 'Inbox',
                                    website: aiSuggestions.apollo_company.website
                                  })
                                  .select()
                                  .single();

                                if (error) throw error;

                                // Add domain if available
                                if (aiSuggestions.apollo_company.domain && newCompany) {
                                  await supabase
                                    .from('company_domains')
                                    .insert({
                                      company_id: newCompany.company_id,
                                      domain: aiSuggestions.apollo_company.domain.toLowerCase(),
                                      is_primary: true
                                    });
                                }

                                const newAssoc = {
                                  contact_companies_id: `temp_${Date.now()}`,
                                  company_id: newCompany.company_id,
                                  companies: newCompany,
                                  is_primary: true,
                                  relationship: 'not_set'
                                };
                                setCompanies([newAssoc]);
                                setAcceptedFields(prev => ({ ...prev, apollo_company: true, company: true }));
                                toast.success(`Created ${aiSuggestions.apollo_company.name}`);
                              } catch (e) {
                                console.error('Error creating company:', e);
                                toast.error('Failed to create company');
                              }
                            }
                          }}>
                            <FaCheck size={10} /> {aiSuggestions.apollo_company.exists_in_db ? 'Link Company' : 'Create Company'}
                          </AcceptButton>
                        )}
                      </SuggestionActions>
                    </SuggestionCard>
                  )}

                  {/* Company */}
                  {aiSuggestions.company && aiSuggestions.company.name && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>Company</SuggestionLabel>
                        {aiSuggestions.company.confidence && (
                          <ConfidenceBadge level={aiSuggestions.company.confidence}>
                            {aiSuggestions.company.confidence}
                          </ConfidenceBadge>
                        )}
                      </SuggestionHeader>
                      <SuggestionValue theme={theme}>
                        {aiSuggestions.company.name}
                        {aiSuggestions.company.domain && (
                          <span style={{ fontSize: '12px', color: mutedColor, marginLeft: '8px' }}>
                            ({aiSuggestions.company.domain})
                          </span>
                        )}
                      </SuggestionValue>
                      <SuggestionActions>
                        {acceptedFields.company ? (
                          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                        ) : (
                          <AcceptButton onClick={() => acceptCompany(aiSuggestions.company)}>
                            <FaCheck size={10} /> Accept
                          </AcceptButton>
                        )}
                      </SuggestionActions>
                    </SuggestionCard>
                  )}

                  {/* Phones */}
                  {aiSuggestions.phones && aiSuggestions.phones.length > 0 && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>Phone Numbers ({aiSuggestions.phones.length})</SuggestionLabel>
                      </SuggestionHeader>
                      {aiSuggestions.phones.map((phone, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <SuggestionValue theme={theme}>{phone.value}</SuggestionValue>
                          {phone.type && (
                            <span style={{ fontSize: '10px', padding: '2px 6px', background: borderColor, borderRadius: '4px', color: mutedColor }}>
                              {phone.type}
                            </span>
                          )}
                          {phone.confidence && (
                            <ConfidenceBadge level={phone.confidence}>{phone.confidence}</ConfidenceBadge>
                          )}
                        </div>
                      ))}
                      <SuggestionActions>
                        {acceptedFields.phones ? (
                          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                        ) : (
                          <AcceptButton onClick={() => acceptPhones(aiSuggestions.phones)}>
                            <FaCheck size={10} /> Accept All Phones
                          </AcceptButton>
                        )}
                      </SuggestionActions>
                    </SuggestionCard>
                  )}

                  {/* City */}
                  {renderSuggestion('city', 'City', aiSuggestions.city)}

                  {/* Category */}
                  {renderSuggestion('category', 'Category', aiSuggestions.category)}

                  {/* Description */}
                  {renderSuggestion('description', 'Description', aiSuggestions.description)}

                  {/* LinkedIn from signature */}
                  {renderSuggestion('linkedin', 'LinkedIn', aiSuggestions.linkedin)}

                  {/* LinkedIn URL from Apollo */}
                  {aiSuggestions.linkedin_url?.value && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>
                          LinkedIn
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: '#8B5CF6',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 600
                          }}>
                            APOLLO
                          </span>
                        </SuggestionLabel>
                        {aiSuggestions.linkedin_url.confidence && (
                          <ConfidenceBadge level={aiSuggestions.linkedin_url.confidence}>
                            {aiSuggestions.linkedin_url.confidence}
                          </ConfidenceBadge>
                        )}
                      </SuggestionHeader>
                      <SuggestionValue theme={theme}>
                        <a
                          href={aiSuggestions.linkedin_url.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3B82F6', textDecoration: 'none' }}
                        >
                          {aiSuggestions.linkedin_url.value}
                        </a>
                      </SuggestionValue>
                      <SuggestionActions>
                        {acceptedFields.linkedin_url ? (
                          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                        ) : (
                          <AcceptButton onClick={() => acceptSuggestion('linkedin_url', aiSuggestions.linkedin_url.value)}>
                            <FaCheck size={10} /> Accept
                          </AcceptButton>
                        )}
                      </SuggestionActions>
                    </SuggestionCard>
                  )}

                  {/* Photo from Apollo */}
                  {aiSuggestions.photo_url?.value && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>
                          Profile Photo
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: '#8B5CF6',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 600
                          }}>
                            APOLLO
                          </span>
                        </SuggestionLabel>
                        {aiSuggestions.photo_url.confidence && (
                          <ConfidenceBadge level={aiSuggestions.photo_url.confidence}>
                            {aiSuggestions.photo_url.confidence}
                          </ConfidenceBadge>
                        )}
                      </SuggestionHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img
                          src={aiSuggestions.photo_url.value}
                          alt="Profile"
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `2px solid ${borderColor}`
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <SuggestionActions>
                          {acceptedFields.photo_url ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => acceptSuggestion('photo_url', aiSuggestions.photo_url.value)}>
                              <FaCheck size={10} /> Use This Photo
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </div>
                    </SuggestionCard>
                  )}

                  {/* Suggested Tags */}
                  {aiSuggestions.suggested_tags && aiSuggestions.suggested_tags.length > 0 && (
                    <SuggestionCard theme={theme}>
                      <SuggestionHeader>
                        <SuggestionLabel theme={theme}>
                          Suggested Tags ({aiSuggestions.suggested_tags.length})
                        </SuggestionLabel>
                      </SuggestionHeader>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        {aiSuggestions.suggested_tags.map((tag, idx) => (
                          <span key={idx} style={{
                            padding: '4px 12px',
                            background: '#10B981',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <SuggestionActions>
                        {acceptedFields.suggested_tags ? (
                          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                        ) : (
                          <AcceptButton onClick={() => acceptSuggestedTags(aiSuggestions.suggested_tags)}>
                            <FaCheck size={10} /> Accept All Tags
                          </AcceptButton>
                        )}
                      </SuggestionActions>
                    </SuggestionCard>
                  )}
                </>
              )}
            </>
          )}

          {/* Tab 1 - Professional */}
          {activeTab === 1 && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Job Title</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. CEO, Founder, Partner"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>LinkedIn</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="linkedin.com/in/username"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (linkedin) {
                        // Open LinkedIn profile
                        const url = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
                        window.open(url, '_blank');
                      } else {
                        // Search LinkedIn for the contact
                        const name = `${firstName || ''} ${lastName || ''}`.trim();
                        if (name) {
                          const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
                          window.open(searchUrl, '_blank');
                        } else {
                          toast.error('Enter a name first to search LinkedIn');
                        }
                      }
                    }}
                    title={linkedin ? 'Open LinkedIn profile' : 'Search on LinkedIn'}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: linkedin
                        ? '#0A66C2'
                        : (theme === 'light' ? '#FFFFFF' : '#374151'),
                      color: linkedin
                        ? '#FFFFFF'
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {linkedin ? <FaLinkedin size={16} /> : <FaSearch size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
                  <button
                    type="button"
                    onClick={() => setDescription('Cold contacted me to pitch his startup')}
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: theme === 'light' ? '#FEF3C7' : '#78350F',
                      color: theme === 'light' ? '#92400E' : '#FDE68A',
                      fontWeight: 500,
                    }}
                  >
                    Founder cold contact
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Brief professional description..."
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={labelStyle}>Companies ({companies.length})</label>
                  <button
                    onClick={() => setCompanyModalOpen(true)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: '#3B82F6',
                      color: 'white'
                    }}
                  >
                    + Add Company
                  </button>
                </div>
                <CompaniesContainer theme={theme}>
                  {companies.length === 0 ? (
                    <div style={{ textAlign: 'center', color: mutedColor, padding: '20px' }}>
                      No companies added yet
                    </div>
                  ) : (
                    companies.map((c, idx) => (
                      <div key={c.contact_companies_id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: isDark ? '#1F2937' : '#FFFFFF',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        border: `1px solid ${borderColor}`
                      }}>
                        <div>
                          <span style={{ color: textColor, fontWeight: 500 }}>
                            {c.companies?.name || 'Unknown'}
                          </span>
                          {c.is_primary && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', background: '#10B981', color: 'white', borderRadius: '10px' }}>
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCompany(c.contact_companies_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#EF4444',
                            padding: '4px'
                          }}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </CompaniesContainer>
              </div>
            </>
          )}

          {/* Tab 2 - Contact Details */}
          {activeTab === 2 && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={labelStyle}>Phone Numbers ({mobiles.length})</label>
                  <button
                    onClick={() => setMobileModalOpen(true)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: '#3B82F6',
                      color: 'white'
                    }}
                  >
                    + Add Phone
                  </button>
                </div>
                <div style={{
                  padding: '12px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  background: inputBg,
                  minHeight: '60px'
                }}>
                  {mobiles.length === 0 ? (
                    <div style={{ textAlign: 'center', color: mutedColor }}>No phones added</div>
                  ) : (
                    mobiles.map((m, idx) => (
                      <div key={m.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: idx < mobiles.length - 1 ? `1px solid ${borderColor}` : 'none'
                      }}>
                        <span style={{ color: textColor }}>{m.number}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {m.is_primary && (
                            <span style={{ fontSize: '10px', padding: '2px 6px', background: '#10B981', color: 'white', borderRadius: '10px' }}>
                              PRIMARY
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveMobile(m.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={labelStyle}>Cities ({cities.length})</label>
                  <button
                    onClick={() => setCityModalOpen(true)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: '#3B82F6',
                      color: 'white'
                    }}
                  >
                    + Add City
                  </button>
                </div>
                <div style={{
                  padding: '12px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  background: inputBg,
                  minHeight: '60px'
                }}>
                  {cities.length === 0 ? (
                    <div style={{ textAlign: 'center', color: mutedColor }}>No cities added</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {cities.map((c) => (
                        <span key={c.city_id} style={{
                          padding: '4px 10px',
                          background: '#3B82F6',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {c.name}
                          <button
                            onClick={() => handleRemoveCity(c.city_id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 0 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Tab 3 - Preferences */}
          {activeTab === 3 && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Keep in Touch</label>
                  <button
                    type="button"
                    onClick={() => {
                      setKeepInTouchFrequency('Do not keep in touch');
                      setChristmas('no wishes');
                      setEaster('no wishes');
                    }}
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                      color: theme === 'light' ? '#991B1B' : '#FECACA',
                      fontWeight: 500,
                    }}
                  >
                    Don't keep in touch
                  </button>
                </div>
                <select
                  value={keepInTouchFrequency}
                  onChange={(e) => setKeepInTouchFrequency(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {KEEP_IN_TOUCH_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Score (1-5)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setScore(score === s ? null : s)}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: `2px solid ${score === s ? '#3B82F6' : borderColor}`,
                        borderRadius: '8px',
                        background: score === s ? '#3B82F6' : 'transparent',
                        color: score === s ? 'white' : textColor,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={labelStyle}>Tags ({tags.length})</label>
                  <button
                    onClick={() => setTagModalOpen(true)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: '#3B82F6',
                      color: 'white'
                    }}
                  >
                    + Add Tag
                  </button>
                </div>
                <div style={{
                  padding: '12px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  background: inputBg,
                  minHeight: '40px'
                }}>
                  {tags.length === 0 ? (
                    <div style={{ textAlign: 'center', color: mutedColor, fontSize: '12px' }}>No tags added</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {tags.map((t) => (
                        <span key={t.tag_id} style={{
                          padding: '4px 10px',
                          background: '#10B981',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {t.name}
                          <button
                            onClick={() => handleRemoveTag(t.tag_id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 0 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Christmas</label>
                  <select
                    value={christmas}
                    onChange={(e) => setChristmas(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {WISHES_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Easter</label>
                  <select
                    value={easter}
                    onChange={(e) => setEaster(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {WISHES_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Tab 4 - Review */}
          {activeTab === 4 && (
            <>
              {/* Missing Fields Warning */}
              {(() => {
                const missingFields = [];
                if (!firstName.trim()) missingFields.push('First Name');
                if (!lastName.trim()) missingFields.push('Last Name');
                if (!email.trim()) missingFields.push('Email');
                if (companies.length === 0) missingFields.push('Company');
                if (!category || category === 'Inbox') missingFields.push('Category');
                if (mobiles.length === 0) missingFields.push('Mobile');
                if (cities.length === 0) missingFields.push('City');

                return missingFields.length > 0 ? (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: isDark ? '#7F1D1D' : '#FEF2F2',
                    border: `1px solid ${isDark ? '#DC2626' : '#FECACA'}`,
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontWeight: 600,
                      color: isDark ? '#FCA5A5' : '#DC2626',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      Missing Fields ({missingFields.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {missingFields.map(field => (
                        <span key={field} style={{
                          padding: '4px 10px',
                          background: isDark ? '#991B1B' : '#FEE2E2',
                          color: isDark ? '#FCA5A5' : '#B91C1C',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: isDark ? '#064E3B' : '#F0FDF4',
                    border: `1px solid ${isDark ? '#10B981' : '#BBF7D0'}`,
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontWeight: 600,
                      color: isDark ? '#6EE7B7' : '#16A34A',
                      fontSize: '14px'
                    }}>
                      All required fields complete!
                    </div>
                  </div>
                );
              })()}

              {/* Recap */}
              <div style={{
                marginBottom: '16px',
                padding: '16px',
                background: isDark ? '#111827' : '#F9FAFB',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px'
              }}>
                <div style={{
                  fontWeight: 600,
                  color: textColor,
                  marginBottom: '12px',
                  fontSize: '14px',
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: '8px'
                }}>
                  Contact Summary
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Name</div>
                  <div style={{ fontSize: '14px', color: textColor }}>
                    <strong>{firstName} {lastName}</strong>
                    {category && <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#3B82F6', color: 'white', borderRadius: '10px', fontSize: '11px' }}>{category}</span>}
                  </div>
                </div>

                {email && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Email</div>
                    <div style={{ fontSize: '13px', color: textColor }}>{email}</div>
                  </div>
                )}

                {jobRole && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Job Title</div>
                    <div style={{ fontSize: '13px', color: textColor }}>{jobRole}</div>
                  </div>
                )}

                {companies.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Companies</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {companies.map((c, i) => c.companies?.name || 'Unknown').join(', ')}
                    </div>
                  </div>
                )}

                {mobiles.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Phones</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {mobiles.map(m => m.number).join(', ')}
                    </div>
                  </div>
                )}

                {cities.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Cities</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {cities.map(c => c.name).join(', ')}
                    </div>
                  </div>
                )}

                {description && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Description</div>
                    <div style={{ fontSize: '13px', color: textColor }}>{description}</div>
                  </div>
                )}
              </div>

              {/* Mark as complete */}
              <div style={{
                padding: '16px',
                background: isDark ? '#1E3A8A' : '#EFF6FF',
                border: `1px solid ${isDark ? '#3B82F6' : '#BFDBFE'}`,
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="markComplete"
                    checked={markComplete}
                    onChange={(e) => setMarkComplete(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3B82F6' }}
                  />
                  <label htmlFor="markComplete" style={{
                    color: textColor,
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}>
                    Mark as complete
                  </label>
                </div>
                <div style={{
                  marginTop: '8px',
                  marginLeft: '32px',
                  fontSize: '12px',
                  color: mutedColor
                }}>
                  Contact won't appear in "missing info" list
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderTop: `1px solid ${borderColor}`,
          background: isDark ? '#111827' : '#F3F4F6',
          flexShrink: 0
        }}>
          <div>
            {activeTab > 0 && (
              <button
                onClick={() => setActiveTab(prev => prev - 1)}
                style={{
                  padding: '10px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  background: 'transparent',
                  color: textColor,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                background: 'transparent',
                color: textColor,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            {activeTab < 4 ? (
              <button
                onClick={() => setActiveTab(prev => prev + 1)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#3B82F6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#10B981',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Add Contact'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Modal */}
      {companyModalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div style={{
            background: bgColor,
            borderRadius: '12px',
            width: '400px',
            maxHeight: '60vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add Company</h3>
              <button
                onClick={() => { setCompanyModalOpen(false); setModalCompanySearch(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: '20px' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <input
                type="text"
                value={modalCompanySearch}
                onChange={(e) => setModalCompanySearch(e.target.value)}
                style={inputStyle}
                placeholder="Search companies..."
                autoFocus
              />
              <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {modalCompanyResults.map(company => (
                  <div
                    key={company.company_id}
                    onClick={() => { handleAddCompany(company); setCompanyModalOpen(false); }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      background: isDark ? '#1F2937' : '#F3F4F6',
                      color: textColor
                    }}
                  >
                    {company.name}
                    {company.category && (
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: mutedColor }}>
                        ({company.category})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Modal */}
      {cityModalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div style={{
            background: bgColor,
            borderRadius: '12px',
            width: '400px',
            maxHeight: '60vh',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add City</h3>
              <button
                onClick={() => { setCityModalOpen(false); setCitySearch(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: '20px' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                style={inputStyle}
                placeholder="Search cities..."
                autoFocus
              />
              <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {cityResults.map(city => (
                  <div
                    key={city.city_id}
                    onClick={() => { handleAddCity(city); setCityModalOpen(false); }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      background: isDark ? '#1F2937' : '#F3F4F6',
                      color: textColor
                    }}
                  >
                    {city.name}
                    {city.country && <span style={{ marginLeft: '8px', fontSize: '11px', color: mutedColor }}>({city.country})</span>}
                  </div>
                ))}
                {citySearch.length >= 2 && !cityResults.find(c => c.name.toLowerCase() === citySearch.toLowerCase()) && (
                  <div
                    onClick={async () => {
                      const { data: newCity, error } = await supabase
                        .from('cities')
                        .insert({ name: citySearch, country: 'Unknown' })
                        .select()
                        .single();
                      if (!error && newCity) {
                        handleAddCity(newCity);
                        setCityModalOpen(false);
                      }
                    }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: '#10B981',
                      color: 'white',
                      textAlign: 'center'
                    }}
                  >
                    + Create "{citySearch}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Modal */}
      {mobileModalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div style={{
            background: bgColor,
            borderRadius: '12px',
            width: '400px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add Phone</h3>
              <button
                onClick={() => { setMobileModalOpen(false); setNewMobile(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: '20px' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <input
                type="tel"
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                style={inputStyle}
                placeholder="+1 234 567 8900"
                autoFocus
              />
              <button
                onClick={() => {
                  if (newMobile.trim()) {
                    handleAddMobile(newMobile);
                    setMobileModalOpen(false);
                  }
                }}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#10B981',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Add Phone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {tagModalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div style={{
            background: bgColor,
            borderRadius: '12px',
            width: '400px',
            maxHeight: '60vh',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add Tag</h3>
              <button
                onClick={() => { setTagModalOpen(false); setTagSearch(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: '20px' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                style={inputStyle}
                placeholder="Search tags..."
                autoFocus
              />
              <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {tagResults.map(tag => (
                  <div
                    key={tag.tag_id}
                    onClick={() => { handleAddTag(tag); setTagModalOpen(false); }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      background: isDark ? '#1F2937' : '#F3F4F6',
                      color: textColor
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
                {tagSearch.length >= 1 && !tagResults.find(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                  <div
                    onClick={async () => {
                      const { data: newTag, error } = await supabase
                        .from('tags')
                        .insert({ name: tagSearch })
                        .select()
                        .single();
                      if (!error && newTag) {
                        handleAddTag(newTag);
                        setTagModalOpen(false);
                      }
                    }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: '#10B981',
                      color: 'white',
                      textAlign: 'center'
                    }}
                  >
                    + Create "{tagSearch}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateContactModalAI;

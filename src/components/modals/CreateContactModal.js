import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBuilding, FaTimes, FaSearch, FaPlus, FaTrash, FaStar, FaMapMarkerAlt, FaTag, FaPhone } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Styled Components for Company Associations
const ManageButton = styled.button`
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #2563EB;
  }
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

const CompanyItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 4px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const CompanyName = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PrimaryBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background-color: #10B981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
`;

const CompanyFieldGroup = styled.div`
  margin-top: 8px;
  margin-bottom: 4px;
`;

const CompanyFieldLabel = styled.label`
  font-size: 10px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 2px;
  display: block;
`;

const CompanySelect = styled.select`
  width: 100%;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 4px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-family: inherit;
  cursor: pointer;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-align: center;
  gap: 8px;
`;

// Enum values from database (excluding Inbox - that's for unclassified contacts)
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

const FREQUENT_JOB_TITLES = [
  'CEO & Co-Founder',
  'VC',
  'Family Office',
  'Founder',
  'Investor',
  'Partner'
];

const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app';

// Parse name from email address
const parseNameFromEmail = (email, existingName, existingFirst, existingLast) => {
  // If we have explicit first/last names, use them
  if (existingFirst || existingLast) {
    return {
      firstName: existingFirst || '',
      lastName: existingLast || ''
    };
  }

  if (existingName && existingName.trim()) {
    const parts = existingName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      };
    }
    return { firstName: parts[0] || '', lastName: '' };
  }

  if (!email) return { firstName: '', lastName: '' };

  const localPart = email.split('@')[0];
  if (!localPart) return { firstName: '', lastName: '' };

  const cleaned = localPart
    .replace(/[0-9]/g, '')
    .replace(/[._-]/g, ' ')
    .trim();

  const parts = cleaned.split(/\s+/).filter(p => p.length > 0);

  if (parts.length >= 2) {
    return {
      firstName: capitalize(parts[0]),
      lastName: parts.slice(1).map(capitalize).join(' ')
    };
  } else if (parts.length === 1) {
    return { firstName: capitalize(parts[0]), lastName: '' };
  }

  return { firstName: '', lastName: '' };
};

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const extractDomain = (email) => {
  if (!email) return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};

const CreateContactModal = ({
  isOpen,
  onClose,
  emailData,
  theme = 'dark',
  onSuccess
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Tab 1 - Basic Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [markComplete, setMarkComplete] = useState(true); // Default ON in Review tab

  // Tab 2 - Professional (Company Associations)
  const [companies, setCompanies] = useState([]); // Array of company associations
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [modalCompanySearch, setModalCompanySearch] = useState('');
  const [modalCompanyResults, setModalCompanyResults] = useState([]);
  const [pendingNameUpdate, setPendingNameUpdate] = useState(null); // For debounced company name save
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  const [existingDomainCompany, setExistingDomainCompany] = useState(null); // {company_id, name}
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [description, setDescription] = useState('');

  // Tab 3 - Contact Details
  const [mobiles, setMobiles] = useState([]); // Changed from single mobile
  const [cities, setCities] = useState([]); // Changed from selectedCity
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [birthday, setBirthday] = useState('');

  // Tab 4 - Preferences
  const [keepInTouchFrequency, setKeepInTouchFrequency] = useState('Not Set');
  const [score, setScore] = useState(null); // Optional - can be null
  const [tags, setTags] = useState([]); // Changed from selectedTags
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

  // Store hold_id for deletion after save
  const [holdId, setHoldId] = useState(null);

  // AI Suggestion states
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null); // { description, category }
  const [suggestedMobiles, setSuggestedMobiles] = useState([]); // Phone numbers extracted from email body
  const [extractedJobTitles, setExtractedJobTitles] = useState([]); // Job titles from email signature

  // Extract phone numbers from text using regex
  const extractPhoneNumbers = (text) => {
    if (!text) return [];
    // Match various phone formats: +39 123 456 7890, (123) 456-7890, 123.456.7890, etc.
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{0,4}/g;
    const matches = text.match(phoneRegex) || [];
    // Filter to only keep valid-looking phone numbers (at least 8 digits)
    const validPhones = matches
      .map(p => p.trim())
      .filter(p => p.replace(/\D/g, '').length >= 8 && p.replace(/\D/g, '').length <= 15)
      .filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates
    return validPhones;
  };

  // Extract job titles from email signature - looks for titles near the contact's name
  const extractJobTitles = (text, senderName) => {
    if (!text || !senderName) return [];
    const titles = [];

    // Get first name and last name separately
    const nameParts = senderName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    // Common job title keywords
    const titleKeywords = [
      'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CIO', 'CPO',
      'Chief Executive Officer', 'Chief Technology Officer', 'Chief Financial Officer',
      'Chief Operating Officer', 'Chief Marketing Officer',
      'President', 'Vice President', 'VP',
      'Director', 'Managing Director', 'Executive Director',
      'Partner', 'Managing Partner', 'General Partner',
      'Founder', 'Co-Founder', 'Co-founder',
      'Manager', 'General Manager', 'Senior Manager',
      'Head', 'Head of',
      'Analyst', 'Investment Analyst', 'Senior Analyst',
      'Associate', 'Senior Associate',
      'Advisor', 'Senior Advisor',
      'Principal', 'Consultant',
      'VC', 'Venture Capital', 'Angel Investor', 'Family Office'
    ];

    // Look for the sender's name in the text and extract nearby job title
    // Pattern: Name followed by title on next line or same line
    const patterns = [
      // Name on one line, title on next: "Giacomo Mergoni\nChief Executive Officer"
      new RegExp(`${firstName}[\\s]+(?:${lastName})?[\\s]*[\\n\\r]+([A-Z][a-zA-Z\\s&]+(?:Officer|Director|Partner|Manager|Founder|President|Analyst|Associate|Advisor|Principal|Head|VP|CEO|CTO|CFO|COO))`, 'gi'),
      // Name with title after pipe/dash: "Giacomo Mergoni | CEO"
      new RegExp(`${firstName}[\\s]+(?:${lastName})?[\\s]*[|\\-–—][\\s]*([A-Z][a-zA-Z\\s&]+(?:Officer|Director|Partner|Manager|Founder|President|Analyst|Associate|Advisor|Principal|Head|VP|CEO|CTO|CFO|COO))`, 'gi'),
      // Standard signature block with name then title
      new RegExp(`${firstName}[\\s]+${lastName}[\\s]*[\\u200B\\u00A0\\s]*[\\n\\r]+([A-Z][a-zA-Z\\s&]{3,40})(?:[\\n\\r]|M\\.|T\\.|Cell|Tel|Email|Phone)`, 'gi'),
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let title = match[1]?.trim();
        if (title) {
          // Clean up
          title = title.replace(/^\s*[-–—|]\s*/, '').replace(/\s*[-–—|]\s*$/, '').trim();
          title = title.replace(/\s+/g, ' '); // Normalize spaces

          // Validate it looks like a real title
          const looksLikeTitle = titleKeywords.some(kw =>
            title.toLowerCase().includes(kw.toLowerCase())
          );

          if (looksLikeTitle && title.length >= 2 && title.length <= 50 && !titles.includes(title)) {
            titles.push(title);
          }
        }
      }
    }

    // If no titles found with name patterns, try to find any title block near the name
    if (titles.length === 0) {
      // Find all occurrences of the name and look for titles within 100 chars after
      const nameRegex = new RegExp(`${firstName}[\\s]+(?:${lastName})?`, 'gi');
      let nameMatch;
      while ((nameMatch = nameRegex.exec(text)) !== null) {
        const afterName = text.slice(nameMatch.index, nameMatch.index + 200);
        for (const keyword of titleKeywords) {
          if (afterName.includes(keyword) && !titles.includes(keyword)) {
            // Extract the full title line
            const keywordIndex = afterName.indexOf(keyword);
            const lineStart = afterName.lastIndexOf('\n', keywordIndex) + 1;
            const lineEnd = afterName.indexOf('\n', keywordIndex);
            const titleLine = afterName.slice(lineStart, lineEnd > 0 ? lineEnd : undefined).trim();
            if (titleLine.length >= 2 && titleLine.length <= 50 && !titles.includes(titleLine)) {
              titles.push(titleLine);
              break;
            }
          }
        }
      }
    }

    return titles.slice(0, 3); // Max 3 titles
  };

  // Fetch AI suggestion for contact profile
  const fetchAiSuggestion = async (data) => {
    if (!data.body_text && !data.subject) return;

    setLoadingAiSuggestion(true);
    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/suggest-contact-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email: data.email,
          from_name: data.name || '',
          subject: data.subject || '',
          body_text: data.body_text || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAiSuggestion({
            description: result.suggested_description,
            category: result.suggested_category
          });
          // Pre-populate description field
          if (result.suggested_description) {
            setDescription(result.suggested_description);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
      // Non-blocking - user can still fill manually
    }
    setLoadingAiSuggestion(false);
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && emailData) {
      const parsed = parseNameFromEmail(
        emailData.email,
        emailData.name,
        emailData.first_name,
        emailData.last_name
      );

      // Tab 1
      setFirstName(parsed.firstName);
      setLastName(parsed.lastName);
      setEmail(emailData.email || '');
      setCategory('');
      setMarkComplete(false);

      // Tab 2
      setJobRole(emailData.job_role || '');
      setLinkedin('');
      setDescription('');
      setCompanies([]); // Reset companies array

      // Tab 3
      setMobiles([]);
      setCities([]);
      setCitySearch('');
      setBirthday('');

      // Tab 4
      setKeepInTouchFrequency('Not Set');
      setScore(3);
      setTags([]);
      setTagSearch('');
      setChristmas('no wishes set');
      setEaster('no wishes set');

      // Reset tab
      setActiveTab(0);

      // Store hold_id
      setHoldId(emailData.hold_id || null);

      // Reset AI suggestion
      setAiSuggestion(null);

      // Domain matching for company suggestion
      const domain = extractDomain(emailData.email);
      if (domain) {
        findCompanyByDomain(domain);
      }

      // AI suggestion is now triggered manually via button
      // (removed automatic trigger)

      // Extract phone numbers from email body
      if (emailData.body_text) {
        const phones = extractPhoneNumbers(emailData.body_text);
        setSuggestedMobiles(phones);
        // Extract job titles from email signature - use parsed name
        const parsedName = `${parsed.firstName} ${parsed.lastName}`.trim();
        const titles = extractJobTitles(emailData.body_text, parsedName || emailData.name);
        setExtractedJobTitles(titles);
      } else {
        setSuggestedMobiles([]);
        setExtractedJobTitles([]);
      }
    }
  }, [isOpen, emailData]);

  // Company domain matching - adds company to the companies array
  const findCompanyByDomain = async (domain) => {
    try {
      const { data, error } = await supabase
        .from('company_domains')
        .select('company_id, domain, companies(company_id, name, category)')
        .ilike('domain', domain)
        .limit(1)
        .single();

      if (!error && data?.companies) {
        // Add to companies array as primary with correct nested structure
        const newCompanyAssoc = {
          contact_companies_id: `temp_${Date.now()}`,
          company_id: data.companies.company_id,
          companies: data.companies,  // Nested structure matching render expectations
          is_primary: true,
          relationship: 'not_set'
        };
        setCompanies([newCompanyAssoc]);
      }
    } catch (e) {
      // No company found
    }
  };

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

  // Pre-populate domain when showing create option
  useEffect(() => {
    const isShowingCreateOption = modalCompanySearch.trim() &&
      !modalCompanyResults.some(c => c.name.toLowerCase() === modalCompanySearch.toLowerCase());

    if (isShowingCreateOption && companyModalOpen) {
      const domain = extractDomain(email);
      if (domain && !newCompanyDomain) {
        setNewCompanyDomain(domain);
        checkDomainExists(domain);
      }
    }
  }, [modalCompanySearch, modalCompanyResults, companyModalOpen, email, newCompanyDomain]);

  // Check domain when user edits it
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newCompanyDomain) {
        checkDomainExists(newCompanyDomain);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newCompanyDomain]);

  // Reset when modal closes
  useEffect(() => {
    if (!companyModalOpen) {
      setNewCompanyDomain('');
      setExistingDomainCompany(null);
    }
  }, [companyModalOpen]);

  // Add company to associations
  const handleAddCompany = (company) => {
    // Check if already added
    if (companies.find(c => c.companies?.company_id === company.company_id)) {
      toast.error('Company already added');
      return;
    }
    const newAssociation = {
      contact_companies_id: `temp_${Date.now()}`, // Temporary ID for new contact
      company_id: company.company_id,
      companies: company,
      relationship: 'not_set',
      is_primary: companies.length === 0 // First company is primary
    };
    setCompanies([...companies, newAssociation]);
    setModalCompanySearch('');
    setModalCompanyResults([]);
    toast.success(`Added ${company.name}`);
  };

  // Remove company from associations
  const handleRemoveCompany = (companyAssociationId) => {
    const toRemove = companies.find(c => c.contact_companies_id === companyAssociationId);
    const updated = companies.filter(c => c.contact_companies_id !== companyAssociationId);
    // If we removed the primary, make the first remaining one primary
    if (toRemove?.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    setCompanies(updated);
    toast.success('Company removed');
  };

  // Set company as primary
  const handleSetPrimary = (companyAssociationId) => {
    setCompanies(companies.map(c => ({
      ...c,
      is_primary: c.contact_companies_id === companyAssociationId
    })));
  };

  // Update company relationship
  const handleUpdateCompanyRelationship = (companyAssociationId, relationship) => {
    setCompanies(companies.map(c =>
      c.contact_companies_id === companyAssociationId
        ? { ...c, relationship }
        : c
    ));
  };

  // Update company category - SAVE IMMEDIATELY TO DB
  const handleUpdateCompanyCategory = async (companyId, newCategory) => {
    // Update local state
    setCompanies(companies.map(c =>
      c.companies?.company_id === companyId
        ? { ...c, companies: { ...c.companies, category: newCategory } }
        : c
    ));

    // Save to DB immediately
    if (companyId) {
      try {
        const { error } = await supabase
          .from('companies')
          .update({ category: newCategory })
          .eq('company_id', companyId);

        if (error) throw error;
        toast.success('Company category updated');
      } catch (err) {
        console.error('Error updating company category:', err);
        toast.error('Failed to update category');
      }
    }
  };

  // === CITIES HANDLERS ===
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

  const handleCreateCity = async (cityName) => {
    try {
      const { data: city, error } = await supabase
        .from('cities')
        .insert({ name: cityName, country: 'Unknown' })
        .select()
        .single();
      if (error) throw error;
      handleAddCity(city);
      return city;
    } catch (e) {
      console.error('Error creating city:', e);
      toast.error('Failed to create city');
    }
  };

  // === MOBILES HANDLERS ===
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
    // Make first one primary if we removed the primary
    if (updated.length > 0 && !updated.some(m => m.is_primary)) {
      updated[0].is_primary = true;
    }
    setMobiles(updated);
    toast.success('Mobile removed');
  };

  const handleSetMobilePrimary = (mobileId) => {
    setMobiles(mobiles.map(m => ({
      ...m,
      is_primary: m.id === mobileId
    })));
  };

  // === TAGS HANDLERS ===
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

  const handleCreateTag = async (tagName) => {
    try {
      const { data: tag, error } = await supabase
        .from('tags')
        .insert({ name: tagName })
        .select()
        .single();
      if (error) throw error;
      handleAddTag(tag);
      return tag;
    } catch (e) {
      console.error('Error creating tag:', e);
      toast.error('Failed to create tag');
    }
  };

  // Update company name - updates local state, queues debounced DB save
  const handleUpdateCompanyName = (companyId, associationId, newName) => {
    // Update local state immediately
    setCompanies(companies.map(c =>
      c.contact_companies_id === associationId
        ? { ...c, companies: { ...c.companies, name: newName } }
        : c
    ));

    // Queue debounced DB update
    setPendingNameUpdate({ companyId, name: newName });
  };

  // Debounced save for company name updates
  useEffect(() => {
    if (!pendingNameUpdate) return;

    const timer = setTimeout(async () => {
      const { companyId, name } = pendingNameUpdate;
      if (companyId && name.trim()) {
        try {
          const { error } = await supabase
            .from('companies')
            .update({ name: name.trim() })
            .eq('company_id', companyId);

          if (!error) {
            toast.success('Company name updated');
          }
        } catch (err) {
          console.error('Error updating company name:', err);
        }
      }
      setPendingNameUpdate(null);
    }, 500);

    return () => clearTimeout(timer);
  }, [pendingNameUpdate]);

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
        // Filter out already selected tags
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

  // Check if domain already exists and get associated company
  const checkDomainExists = async (domain) => {
    if (!domain || !domain.trim()) {
      setExistingDomainCompany(null);
      return;
    }

    setCheckingDomain(true);
    try {
      const { data, error } = await supabase
        .from('company_domains')
        .select('domain, company_id, companies(company_id, name, category)')
        .ilike('domain', domain.trim())
        .limit(1)
        .single();

      if (!error && data?.companies) {
        setExistingDomainCompany(data.companies);
      } else {
        setExistingDomainCompany(null);
      }
    } catch (e) {
      setExistingDomainCompany(null);
    }
    setCheckingDomain(false);
  };

  // Create new company with explicit domain (or no domain)
  const createNewCompanyWithDomain = async (name, domain) => {
    try {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name, category: 'Inbox' })
        .select()
        .single();

      if (companyError) throw companyError;

      if (domain && domain.trim() && company) {
        await supabase
          .from('company_domains')
          .insert({
            company_id: company.company_id,
            domain: domain.toLowerCase().trim(),
            is_primary: true
          });
      }

      return company;
    } catch (e) {
      console.error('Error creating company:', e);
      throw e;
    }
  };

  // Save handler
  const handleSave = async () => {
    // Validation
    if (!firstName.trim()) {
      toast.error('First name is required');
      setActiveTab(0);
      return;
    }

    if (!lastName.trim()) {
      toast.error('Last name is required');
      setActiveTab(0);
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      setActiveTab(0);
      return;
    }

    if (!category) {
      toast.error('Category is required');
      setActiveTab(0);
      return;
    }

    setSaving(true);
    try {
      // Step 3: Create contact
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
          show_missing: !markComplete, // show_missing = false means completed
          created_by: 'User'
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Step 4: Create contact_emails
      await supabase
        .from('contact_emails')
        .insert({
          contact_id: contact.contact_id,
          email: email.toLowerCase().trim(),
          is_primary: true
        });

      // Step 5: Create contact_mobiles for each mobile
      for (const mobileItem of mobiles) {
        await supabase
          .from('contact_mobiles')
          .insert({
            contact_id: contact.contact_id,
            mobile: mobileItem.number,
            is_primary: mobileItem.is_primary || false
          });
      }

      // Step 6: Create contact_companies for each company in the array
      for (const companyAssoc of companies) {
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contact.contact_id,
            company_id: companyAssoc.company_id,
            is_primary: companyAssoc.is_primary || false,
            relationship: companyAssoc.relationship || null
          });

        // Update company name and category if changed
        if (companyAssoc.companies?.company_id) {
          await supabase
            .from('companies')
            .update({
              name: companyAssoc.companies.name,
              category: companyAssoc.companies.category
            })
            .eq('company_id', companyAssoc.companies.company_id);
        }
      }

      // Step 7: Create contact_cities for each city
      for (const city of cities) {
        await supabase
          .from('contact_cities')
          .insert({
            contact_id: contact.contact_id,
            city_id: city.city_id
          });
      }

      // Step 8: Create contact_tags for each tag
      for (const tag of tags) {
        await supabase
          .from('contact_tags')
          .insert({
            contact_id: contact.contact_id,
            tag_id: tag.tag_id
          });
      }

      // Step 9: Create keep_in_touch record
      await supabase
        .from('keep_in_touch')
        .insert({
          contact_id: contact.contact_id,
          frequency: keepInTouchFrequency,
          christmas: christmas,
          easter: easter
        });

      // Step 10: Delete from contacts_hold if holdId exists
      if (holdId) {
        await supabase
          .from('contacts_hold')
          .delete()
          .eq('hold_id', holdId);
      }

      toast.success(`${firstName} ${lastName} added to CRM`);

      if (onSuccess) {
        onSuccess(contact);
      }

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
  const selectedBg = isDark ? '#374151' : '#E5E7EB';

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

  const tabs = ['Basic Info', 'Professional', 'Contact Details', 'Preferences', 'Review'];

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
        maxWidth: '650px',
        height: '85vh',
        maxHeight: '750px',
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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: textColor }}>
            Add New Contact
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 20px',
          borderBottom: `1px solid ${borderColor}`,
          background: isDark ? '#111827' : '#F3F4F6',
          flexShrink: 0
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
          {/* Tab 0 - Basic Info */}
          {activeTab === 0 && (
            <>
              {/* Action buttons row */}
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (email) {
                      const localPart = email.split('@')[0];
                      if (localPart) {
                        const cleaned = localPart
                          .replace(/[0-9]/g, '')
                          .replace(/[._-]/g, ' ')
                          .trim();
                        const parts = cleaned.split(/\s+/).filter(p => p.length > 0);
                        if (parts.length >= 2) {
                          setFirstName(parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase());
                          setLastName(parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' '));
                        } else if (parts.length === 1) {
                          setFirstName(parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase());
                          setLastName('');
                        }
                        toast.success('Name parsed from email');
                      }
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#3B82F6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ✨ Parse Name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (emailData) {
                      fetchAiSuggestion(emailData);
                      toast('Asking Claude for suggestions...', { icon: '🤖' });
                    }
                  }}
                  disabled={loadingAiSuggestion}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loadingAiSuggestion ? 'wait' : 'pointer',
                    background: loadingAiSuggestion ? '#6B7280' : '#8B5CF6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: loadingAiSuggestion ? 0.7 : 1
                  }}
                >
                  {loadingAiSuggestion ? '⏳ Loading...' : '🤖 Ask Claude'}
                </button>
              </div>

              {/* Name Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  style={{ ...inputStyle, backgroundColor: isDark ? '#1F2937' : '#E5E7EB', cursor: 'not-allowed' }}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', color: category ? textColor : mutedColor }}
                >
                  <option value="" disabled>Select a category...</option>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* AI Category Suggestion */}
                {loadingAiSuggestion && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: mutedColor }}>
                    Analyzing email...
                  </div>
                )}
                {!loadingAiSuggestion && aiSuggestion?.category && category !== aiSuggestion.category && (
                  <div
                    onClick={() => setCategory(aiSuggestion.category)}
                    style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#10B981',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    AI Suggested:
                    <span style={{
                      background: '#10B981',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {aiSuggestion.category}
                    </span>
                    <span style={{ color: mutedColor }}>(click to apply)</span>
                  </div>
                )}
              </div>

              {/* Description - moved here from Tab 2 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>
                  Description
                  {loadingAiSuggestion && <span style={{ marginLeft: '8px', color: mutedColor }}>(AI generating...)</span>}
                  {!loadingAiSuggestion && aiSuggestion?.description && (
                    <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '11px' }}>
                      AI draft - feel free to edit
                    </span>
                  )}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={loadingAiSuggestion ? "Generating AI suggestion..." : "Brief description of this contact..."}
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                  disabled={loadingAiSuggestion}
                />
              </div>

            </>
          )}

          {/* Tab 1 - Professional */}
          {activeTab === 1 && (
            <>
              {/* Company Associations */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Company Associations</label>
                  <ManageButton onClick={() => setCompanyModalOpen(true)}>
                    + Manage Companies
                  </ManageButton>
                </div>

                <CompaniesContainer theme={theme}>
                  {companies?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {companies.map((companyRelation) => (
                        <CompanyItem key={companyRelation.contact_companies_id} theme={theme}>
                          <FaBuilding style={{ fontSize: '14px', color: '#3B82F6' }} />
                          <div style={{ flex: 1 }}>
                            <CompanyName theme={theme}>
                              <input
                                type="text"
                                value={companyRelation.companies?.name || ''}
                                onChange={(e) => handleUpdateCompanyName(
                                  companyRelation.companies?.company_id,
                                  companyRelation.contact_companies_id,
                                  e.target.value
                                )}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: `1px solid ${borderColor}`,
                                  color: textColor,
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  padding: '2px 0',
                                  width: '200px',
                                  outline: 'none'
                                }}
                                placeholder="Company name"
                              />
                              {companyRelation.is_primary && (
                                <PrimaryBadge>PRIMARY</PrimaryBadge>
                              )}
                            </CompanyName>

                            {/* Relationship Type */}
                            <CompanyFieldGroup>
                              <CompanyFieldLabel theme={theme}>Relationship</CompanyFieldLabel>
                              <CompanySelect
                                value={companyRelation.relationship || 'not_set'}
                                onChange={(e) => handleUpdateCompanyRelationship(companyRelation.contact_companies_id, e.target.value)}
                                theme={theme}
                              >
                                <option value="not_set">Not Set</option>
                                <option value="employee">Employee</option>
                                <option value="founder">Founder</option>
                                <option value="advisor">Advisor</option>
                                <option value="manager">Manager</option>
                                <option value="investor">Investor</option>
                                <option value="other">Other</option>
                              </CompanySelect>
                            </CompanyFieldGroup>

                            {/* Company Category */}
                            <CompanyFieldGroup>
                              <CompanyFieldLabel theme={theme}>Company Category</CompanyFieldLabel>
                              <CompanySelect
                                value={companyRelation.companies?.category || 'Not Set'}
                                onChange={(e) => handleUpdateCompanyCategory(
                                  companyRelation.companies?.company_id,
                                  e.target.value
                                )}
                                theme={theme}
                              >
                                <option value="Not Set">Not Set</option>
                                <option value="Advisory">Advisory</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Corporation">Corporation</option>
                                <option value="Institution">Institution</option>
                                <option value="Media">Media</option>
                                <option value="Professional Investor">Professional Investor</option>
                                <option value="SME">SME</option>
                                <option value="Startup">Startup</option>
                              </CompanySelect>
                            </CompanyFieldGroup>
                          </div>
                        </CompanyItem>
                      ))}
                    </div>
                  ) : (
                    <EmptyState theme={theme}>
                      <FaBuilding style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }} />
                      <span>No companies associated</span>
                    </EmptyState>
                  )}
                </CompaniesContainer>
              </div>

              {/* Job Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Job Title</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Enter job title..."
                  style={inputStyle}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '12px', color: mutedColor }}>Frequently used:</span>
                  {FREQUENT_JOB_TITLES.map(title => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setJobRole(title)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '4px',
                        backgroundColor: jobRole === title ? '#3B82F6' : inputBg,
                        color: jobRole === title ? 'white' : textColor,
                        cursor: 'pointer'
                      }}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                {extractedJobTitles.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '12px', color: '#8B5CF6' }}>📧 From email signature:</span>
                    {extractedJobTitles.map(title => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setJobRole(title)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          border: `1px solid #8B5CF6`,
                          borderRadius: '4px',
                          backgroundColor: jobRole === title ? '#8B5CF6' : inputBg,
                          color: jobRole === title ? 'white' : '#8B5CF6',
                          cursor: 'pointer'
                        }}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LinkedIn */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <label style={{ ...labelStyle, margin: 0 }}>LinkedIn Profile</label>
                  <button
                    type="button"
                    onClick={() => {
                      const searchQuery = `${firstName} ${lastName}`.trim();
                      if (!searchQuery) {
                        toast.error('Enter first and last name first');
                        return;
                      }
                      window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`, '_blank');
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Search on LinkedIn
                  </button>
                </div>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Tab 2 - Contact Details */}
          {activeTab === 2 && (
            <>
              {/* Mobiles Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaPhone style={{ color: '#3B82F6' }} /> Mobile Numbers
                  </label>
                  <button
                    type="button"
                    onClick={() => setMobileModalOpen(true)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    + Add Mobile
                  </button>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  backgroundColor: inputBg,
                  minHeight: '80px'
                }}>
                  {mobiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {mobiles.map((mobile) => (
                        <div
                          key={mobile.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: bgColor,
                            borderRadius: '6px',
                            border: `1px solid ${borderColor}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaPhone style={{ color: '#3B82F6', fontSize: '12px' }} />
                            <span style={{ color: textColor }}>{mobile.number}</span>
                            {mobile.is_primary && <PrimaryBadge>PRIMARY</PrimaryBadge>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!mobile.is_primary && mobiles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleSetMobilePrimary(mobile.id)}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  background: 'transparent',
                                  color: '#10B981',
                                  border: '1px solid #10B981',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMobile(mobile.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '60px',
                      color: mutedColor
                    }}>
                      <FaPhone style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }} />
                      <span>No mobile numbers added</span>
                    </div>
                  )}
                </div>

                {/* Suggested Mobiles from Email */}
                {suggestedMobiles.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{
                      fontSize: '12px',
                      color: mutedColor,
                      marginBottom: '6px',
                      display: 'block'
                    }}>
                      📱 Suggested from email:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {suggestedMobiles
                        .filter(phone => !mobiles.some(m => m.number === phone))
                        .map((phone, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const newMobile = {
                                id: `new-${Date.now()}-${idx}`,
                                number: phone,
                                is_primary: mobiles.length === 0
                              };
                              setMobiles([...mobiles, newMobile]);
                              toast.success(`Added ${phone}`);
                            }}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              background: theme === 'light' ? '#EEF2FF' : '#312E81',
                              color: theme === 'light' ? '#4338CA' : '#A5B4FC',
                              border: `1px solid ${theme === 'light' ? '#C7D2FE' : '#4338CA'}`,
                              borderRadius: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = theme === 'light' ? '#C7D2FE' : '#4338CA';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = theme === 'light' ? '#EEF2FF' : '#312E81';
                            }}
                          >
                            <FaPlus size={10} /> {phone}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cities Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMapMarkerAlt style={{ color: '#3B82F6' }} /> Cities
                  </label>
                  <button
                    type="button"
                    onClick={() => setCityModalOpen(true)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    + Add Cities
                  </button>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  backgroundColor: inputBg,
                  minHeight: '80px'
                }}>
                  {cities.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {cities.map((city) => (
                        <div
                          key={city.city_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            background: bgColor,
                            borderRadius: '16px',
                            border: `1px solid ${borderColor}`
                          }}
                        >
                          <FaMapMarkerAlt style={{ color: '#3B82F6', fontSize: '12px' }} />
                          <span style={{ color: textColor, fontSize: '13px' }}>
                            {city.name}{city.country ? `, ${city.country}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCity(city.city_id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex'
                            }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '60px',
                      color: mutedColor
                    }}>
                      <FaMapMarkerAlt style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }} />
                      <span>No cities associated</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Birthday */}
              <div style={{ marginBottom: '16px' }}>
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
              {/* Keep in Touch Frequency */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Keep in Touch Frequency</label>
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

              {/* Score */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Score (1-5) <span style={{ fontWeight: 400, color: mutedColor }}>(optional - click again to deselect)</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setScore(score === num ? null : num)}
                      style={{
                        width: '44px',
                        height: '44px',
                        border: `2px solid ${score === num ? '#10B981' : borderColor}`,
                        borderRadius: '8px',
                        background: score === num ? '#10B981' : 'transparent',
                        color: score === num ? 'white' : textColor,
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaTag style={{ color: '#3B82F6' }} /> Tags
                  </label>
                  <button
                    type="button"
                    onClick={() => setTagModalOpen(true)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    + Add Tags
                  </button>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  backgroundColor: inputBg,
                  minHeight: '80px'
                }}>
                  {tags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {tags.map((tag) => (
                        <div
                          key={tag.tag_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            background: '#10B981',
                            color: 'white',
                            borderRadius: '16px'
                          }}
                        >
                          <span style={{ fontSize: '13px' }}>{tag.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.tag_id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex'
                            }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '60px',
                      color: mutedColor
                    }}>
                      <FaTag style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }} />
                      <span>No tags associated</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Christmas & Easter row */}
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
                if (tags.length === 0) missingFields.push('Tags');
                if (!jobRole.trim()) missingFields.push('Job Title');
                if (!linkedin.trim()) missingFields.push('LinkedIn');

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
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
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
                      All fields complete!
                    </div>
                  </div>
                );
              })()}

              {/* Recap Section */}
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

                {/* Basic Info */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Basic Info</div>
                  <div style={{ fontSize: '14px', color: textColor }}>
                    <strong>{firstName} {lastName}</strong>
                    {category && category !== 'Inbox' && <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#3B82F6', color: 'white', borderRadius: '10px', fontSize: '11px' }}>{category}</span>}
                  </div>
                </div>

                {/* Email */}
                {email && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Email</div>
                    <div style={{ fontSize: '13px', color: textColor }}>{email}</div>
                  </div>
                )}

                {/* Companies */}
                {companies.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Companies ({companies.length})</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {companies.map((c, i) => (
                        <div key={i}>
                          {c.company?.name || c.companies?.name || c.name || 'Unknown'}
                          {c.is_primary && <span style={{ color: '#10B981', fontSize: '10px', marginLeft: '6px' }}>PRIMARY</span>}
                          {c.relationship && c.relationship !== 'not_set' && <span style={{ color: mutedColor, fontSize: '11px', marginLeft: '6px' }}>({c.relationship})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job & LinkedIn */}
                {(jobRole || linkedin) && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Professional</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {jobRole && <div>Job: {jobRole}</div>}
                      {linkedin && <div>LinkedIn: {linkedin.length > 40 ? linkedin.substring(0, 40) + '...' : linkedin}</div>}
                    </div>
                  </div>
                )}

                {/* Mobiles */}
                {mobiles.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Mobiles ({mobiles.length})</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {mobiles.map((m, i) => (
                        <div key={i}>{m.number} {m.is_primary && <span style={{ color: '#10B981', fontSize: '10px' }}>PRIMARY</span>}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cities */}
                {cities.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Cities ({cities.length})</div>
                    <div style={{ fontSize: '13px', color: textColor }}>
                      {cities.map((c, i) => (
                        <span key={i}>{c.name}{i < cities.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Tags ({tags.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {tags.map((t, i) => (
                        <span key={i} style={{ padding: '2px 8px', background: '#10B981', color: 'white', borderRadius: '10px', fontSize: '11px' }}>{t.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferences */}
                <div style={{ marginBottom: '0' }}>
                  <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', textTransform: 'uppercase' }}>Preferences</div>
                  <div style={{ fontSize: '13px', color: textColor }}>
                    Score: {score !== null ? `${score}/5` : 'Not set'} | Keep in Touch: {keepInTouchFrequency}
                    {birthday && <span> | Birthday: {birthday}</span>}
                  </div>
                </div>
              </div>

              {/* Mark as complete */}
              <div style={{
                padding: '16px',
                background: isDark ? '#1E3A8A' : '#EFF6FF',
                border: `1px solid ${isDark ? '#3B82F6' : '#BFDBFE'}`,
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
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

        {/* Footer Actions */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                onClick={() => {
                  // Validate category on Tab 0 (Basic Info)
                  if (activeTab === 0 && !category) {
                    toast.error('Please select a category before proceeding');
                    return;
                  }
                  // Validate Keep in Touch on Tab 3 (Preferences)
                  if (activeTab === 3 && keepInTouchFrequency === 'Not Set') {
                    toast.error('Please set Keep in Touch frequency before proceeding');
                    return;
                  }
                  setActiveTab(prev => prev + 1);
                }}
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

      {/* Manage Company Associations Modal */}
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
            width: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px', fontWeight: 600 }}>
                Manage Company Associations
              </h3>
              <button
                onClick={() => {
                  setCompanyModalOpen(false);
                  setModalCompanySearch('');
                  setModalCompanyResults([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: mutedColor,
                  fontSize: '20px',
                  padding: '4px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Search Input */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: mutedColor,
                    fontSize: '14px'
                  }} />
                  <input
                    type="text"
                    value={modalCompanySearch}
                    onChange={(e) => setModalCompanySearch(e.target.value)}
                    placeholder="Search companies to add..."
                    style={{
                      ...inputStyle,
                      paddingLeft: '36px'
                    }}
                  />
                </div>

                {/* Search Results */}
                {modalCompanyResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {modalCompanyResults.map(company => (
                      <div
                        key={company.company_id}
                        onClick={() => handleAddCompany(company)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${borderColor}`,
                          color: textColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <FaPlus style={{ color: '#10B981', fontSize: '12px' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{company.name}</div>
                          <div style={{ fontSize: '11px', color: mutedColor }}>{company.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create New Company Section */}
                {modalCompanySearch.trim() && !modalCompanyResults.some(c =>
                  c.name.toLowerCase() === modalCompanySearch.toLowerCase()
                ) && (
                  <div style={{ marginTop: '12px' }}>

                    {/* Suggestion based on email domain */}
                    {existingDomainCompany && (
                      <>
                        <div style={{
                          padding: '12px 16px',
                          background: theme === 'light' ? '#EEF2FF' : '#1e1b4b',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'light' ? '#C7D2FE' : '#3730a3'}`,
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            color: theme === 'light' ? '#6366F1' : '#A5B4FC',
                            marginBottom: '8px',
                            fontWeight: 500
                          }}>
                            Suggested (based on email domain):
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaBuilding style={{ color: '#6366F1', fontSize: '14px' }} />
                              <span style={{ color: textColor, fontWeight: 500 }}>
                                {existingDomainCompany.name}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                color: mutedColor,
                                background: theme === 'light' ? '#E5E7EB' : '#374151',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {newCompanyDomain}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                handleAddCompany(existingDomainCompany);
                                setNewCompanyDomain('');
                                setExistingDomainCompany(null);
                                setModalCompanySearch('');
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#6366F1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <FaPlus size={10} /> Add
                            </button>
                          </div>
                        </div>

                        {/* OR separator */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          margin: '16px 0',
                          color: mutedColor,
                          fontSize: '12px'
                        }}>
                          <div style={{ flex: 1, height: '1px', background: borderColor }} />
                          <span>OR</span>
                          <div style={{ flex: 1, height: '1px', background: borderColor }} />
                        </div>
                      </>
                    )}

                    {/* Create new company */}
                    <div style={{
                      padding: '16px',
                      background: theme === 'light' ? '#F0FDF4' : '#052e16',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#86EFAC' : '#166534'}`
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#10B981',
                        marginBottom: '12px'
                      }}>
                        Create new company: "{modalCompanySearch}"
                      </div>

                      {/* Domain field - optional */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{
                          fontSize: '12px',
                          color: mutedColor,
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Company Domain <span style={{ color: mutedColor }}>(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={newCompanyDomain}
                          onChange={(e) => setNewCompanyDomain(e.target.value)}
                          placeholder="e.g. acme.com"
                          style={{
                            ...inputStyle,
                            borderColor: existingDomainCompany ? '#F59E0B' : borderColor
                          }}
                        />
                        {existingDomainCompany && (
                          <div style={{
                            fontSize: '11px',
                            color: '#F59E0B',
                            marginTop: '4px'
                          }}>
                            Domain "{newCompanyDomain}" is already used by "{existingDomainCompany.name}". Clear and enter a different domain, or leave empty.
                          </div>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            // If domain exists for another company, create without domain
                            const domainToUse = existingDomainCompany ? null : (newCompanyDomain.trim() || null);

                            const newCompany = await createNewCompanyWithDomain(
                              modalCompanySearch.trim(),
                              domainToUse
                            );
                            handleAddCompany(newCompany);
                            setNewCompanyDomain('');
                            setExistingDomainCompany(null);
                            toast.success(`Created "${modalCompanySearch}"${domainToUse ? ` with domain ${domainToUse}` : ''}`);
                          } catch (error) {
                            toast.error('Failed to create company: ' + error.message);
                          }
                        }}
                        disabled={checkingDomain}
                        style={{
                          padding: '8px 16px',
                          background: checkingDomain ? '#9CA3AF' : '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: checkingDomain ? 'wait' : 'pointer',
                          fontWeight: 500,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaPlus size={12} />
                        {checkingDomain ? 'Checking...' : 'Create Company'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Companies List */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: textColor, fontSize: '14px', fontWeight: 500 }}>
                  Associated Companies ({companies.length})
                </h4>

                {companies.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {companies.map((comp) => (
                      <div
                        key={comp.contact_companies_id}
                        style={{
                          padding: '12px',
                          background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                          borderRadius: '8px',
                          border: `1px solid ${borderColor}`
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaBuilding style={{ color: '#3B82F6', fontSize: '14px' }} />
                            <span style={{ color: textColor, fontWeight: 500 }}>
                              {comp.companies?.name || 'Unknown'}
                            </span>
                            {comp.is_primary && (
                              <PrimaryBadge>PRIMARY</PrimaryBadge>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!comp.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(comp.contact_companies_id)}
                                style={{
                                  padding: '4px 8px',
                                  background: 'transparent',
                                  border: `1px solid #10B981`,
                                  borderRadius: '4px',
                                  color: '#10B981',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FaStar style={{ marginRight: '4px' }} />
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveCompany(comp.contact_companies_id)}
                              style={{
                                padding: '4px 8px',
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: mutedColor
                  }}>
                    No companies associated yet. Search above to add.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setCompanyModalOpen(false);
                  setModalCompanySearch('');
                  setModalCompanyResults([]);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Done
              </button>
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
            top: 0, left: 0, right: 0, bottom: 0,
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
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add Mobile Number</h3>
              <button onClick={() => setMobileModalOpen(false)} style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', fontSize: '20px' }}>
                <FaTimes />
              </button>
            </div>
            <input
              type="tel"
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value)}
              placeholder="+1 234 567 8900"
              style={{ ...inputStyle, marginBottom: '16px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMobileModalOpen(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '6px', color: textColor, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAddMobile(newMobile);
                  setMobileModalOpen(false);
                }}
                disabled={!newMobile.trim()}
                style={{ padding: '8px 16px', background: '#10B981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', opacity: newMobile.trim() ? 1 : 0.5 }}
              >
                Add Mobile
              </button>
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
            top: 0, left: 0, right: 0, bottom: 0,
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
            width: '450px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add City</h3>
              <button onClick={() => { setCityModalOpen(false); setCitySearch(''); setCityResults([]); }} style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', fontSize: '20px' }}>
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search cities..."
                  style={{ ...inputStyle, paddingLeft: '36px' }}
                  autoFocus
                />
              </div>

              {cityResults.length > 0 && (
                <div style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '12px' }}>
                  {cityResults.map(city => (
                    <div
                      key={city.city_id}
                      onClick={() => { handleAddCity(city); setCityModalOpen(false); }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${borderColor}`,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaPlus style={{ color: '#10B981', fontSize: '12px' }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{city.name}</div>
                        {city.country && <div style={{ fontSize: '11px', color: mutedColor }}>{city.country}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {citySearch.trim() && !cityResults.some(c => c.name.toLowerCase() === citySearch.toLowerCase()) && (
                <button
                  onClick={async () => {
                    await handleCreateCity(citySearch.trim());
                    setCityModalOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FaPlus size={12} /> Create "{citySearch}"
                </button>
              )}
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
            top: 0, left: 0, right: 0, bottom: 0,
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
            width: '450px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Add Tag</h3>
              <button onClick={() => { setTagModalOpen(false); setTagSearch(''); setTagResults([]); }} style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', fontSize: '20px' }}>
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags..."
                  style={{ ...inputStyle, paddingLeft: '36px' }}
                  autoFocus
                />
              </div>

              {tagResults.length > 0 && (
                <div style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '12px' }}>
                  {tagResults.map(tag => (
                    <div
                      key={tag.tag_id}
                      onClick={() => { handleAddTag(tag); setTagModalOpen(false); }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${borderColor}`,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaPlus style={{ color: '#10B981', fontSize: '12px' }} />
                      <span>{tag.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {tagSearch.trim() && !tagResults.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                <button
                  onClick={async () => {
                    await handleCreateTag(tagSearch.trim());
                    setTagModalOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FaPlus size={12} /> Create "{tagSearch}"
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateContactModal;

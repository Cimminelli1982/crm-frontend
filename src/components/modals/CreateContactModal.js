import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBuilding, FaTimes, FaSearch, FaPlus, FaTrash, FaStar } from 'react-icons/fa';
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
  const [markComplete, setMarkComplete] = useState(false);

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
  const [mobile, setMobile] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [birthday, setBirthday] = useState('');

  // Tab 4 - Preferences
  const [keepInTouchFrequency, setKeepInTouchFrequency] = useState('Not Set');
  const [score, setScore] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [christmas, setChristmas] = useState('no wishes set');
  const [easter, setEaster] = useState('no wishes set');

  // Loading states
  const [saving, setSaving] = useState(false);
  const [searchingCity, setSearchingCity] = useState(false);
  const [searchingTags, setSearchingTags] = useState(false);

  // Store hold_id for deletion after save
  const [holdId, setHoldId] = useState(null);

  // AI Suggestion states
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null); // { description, category }

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
      setMobile('');
      setSelectedCity(null);
      setCitySearch('');
      setBirthday('');

      // Tab 4
      setKeepInTouchFrequency('Not Set');
      setScore(3);
      setSelectedTags([]);
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

      // Fetch AI suggestion if we have email content
      if (emailData.body_text || emailData.subject) {
        fetchAiSuggestion(emailData);
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

    setSearchingCity(true);
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
    setSearchingCity(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearch && !selectedCity) {
        searchCities(citySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [citySearch, selectedCity]);

  // Search tags
  const searchTags = async (query) => {
    if (!query || query.length < 1) {
      setTagResults([]);
      return;
    }

    setSearchingTags(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (!error) {
        // Filter out already selected tags
        const selectedIds = selectedTags.map(t => t.tag_id);
        setTagResults((data || []).filter(t => !selectedIds.includes(t.tag_id)));
      }
    } catch (e) {
      console.error('Error searching tags:', e);
    }
    setSearchingTags(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tagSearch) {
        searchTags(tagSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tagSearch]);

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

  // Create new city if needed
  const createNewCity = async (cityName) => {
    try {
      const { data: city, error: cityError } = await supabase
        .from('cities')
        .insert({ name: cityName })
        .select()
        .single();

      if (cityError) throw cityError;
      return city;
    } catch (e) {
      console.error('Error creating city:', e);
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
      // Step 1: Handle city creation if needed
      let cityToLink = selectedCity;
      if (!selectedCity && citySearch.trim()) {
        cityToLink = await createNewCity(citySearch.trim());
      }

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

      // Step 5: Create contact_mobiles if mobile provided
      if (mobile.trim()) {
        await supabase
          .from('contact_mobiles')
          .insert({
            contact_id: contact.contact_id,
            mobile: mobile.trim(),
            is_primary: true
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

      // Step 7: Create contact_cities if city selected
      if (cityToLink) {
        await supabase
          .from('contact_cities')
          .insert({
            contact_id: contact.contact_id,
            city_id: cityToLink.city_id
          });
      }

      // Step 8: Create contact_tags for each selected tag
      for (const tag of selectedTags) {
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

  const tabs = ['Basic Info', 'Professional', 'Contact Details', 'Preferences'];

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
        maxHeight: '90vh',
        overflow: 'auto',
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
          borderBottom: `1px solid ${borderColor}`
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
          background: isDark ? '#111827' : '#F3F4F6'
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
        <div style={{ padding: '20px', minHeight: '320px' }}>
          {/* Tab 0 - Basic Info */}
          {activeTab === 0 && (
            <>
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
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
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

              {/* Job Role */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Job Role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="CEO, Developer, etc."
                  style={inputStyle}
                />
              </div>

              {/* LinkedIn */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>LinkedIn URL</label>
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
              {/* Mobile */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Mobile Phone</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 234 567 8900"
                  style={inputStyle}
                />
              </div>

              {/* City */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={labelStyle}>City</label>

                {selectedCity ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: selectedBg,
                    borderRadius: '6px'
                  }}>
                    <span style={{ color: textColor, fontWeight: 500 }}>
                      {selectedCity.name}{selectedCity.country ? `, ${selectedCity.country}` : ''}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCity(null);
                        setCitySearch('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: mutedColor,
                        padding: '2px',
                        fontSize: '16px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      placeholder="Search or create city..."
                      style={inputStyle}
                    />

                    {showCityDropdown && (cityResults.length > 0 || citySearch.trim()) && (
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
                        {cityResults.map(city => (
                          <div
                            key={city.city_id}
                            onClick={() => {
                              setSelectedCity(city);
                              setCitySearch('');
                              setShowCityDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${borderColor}`,
                              color: textColor
                            }}
                          >
                            <div style={{ fontWeight: 500 }}>{city.name}</div>
                            {city.country && (
                              <div style={{ fontSize: '11px', color: mutedColor }}>{city.country}</div>
                            )}
                          </div>
                        ))}

                        {citySearch.trim() && !cityResults.some(c =>
                          c.name.toLowerCase() === citySearch.toLowerCase()
                        ) && (
                          <div
                            onClick={() => {
                              setShowCityDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              color: '#10B981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            + Create "{citySearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
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
                <label style={labelStyle}>Score (1-5)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setScore(num)}
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

              {/* Tags */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={labelStyle}>Tags</label>

                {/* Selected tags */}
                {selectedTags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    {selectedTags.map(tag => (
                      <span
                        key={tag.tag_id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: '#10B981',
                          color: 'white',
                          borderRadius: '16px',
                          fontSize: '12px'
                        }}
                      >
                        {tag.name}
                        <button
                          onClick={() => setSelectedTags(prev => prev.filter(t => t.tag_id !== tag.tag_id))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => {
                    setTagSearch(e.target.value);
                    setShowTagDropdown(true);
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  placeholder="Search tags..."
                  style={inputStyle}
                />

                {showTagDropdown && tagResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    marginTop: '4px',
                    maxHeight: '150px',
                    overflow: 'auto',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {tagResults.map(tag => (
                      <div
                        key={tag.tag_id}
                        onClick={() => {
                          setSelectedTags(prev => [...prev, tag]);
                          setTagSearch('');
                          setShowTagDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${borderColor}`,
                          color: textColor
                        }}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
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

              {/* Mark as complete - in fondo al Tab 4 */}
              <div style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: `1px solid ${borderColor}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: isDark ? '#111827' : '#F3F4F6',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="markComplete"
                    checked={markComplete}
                    onChange={(e) => setMarkComplete(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="markComplete" style={{
                    color: textColor,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    Mark as complete (won't appear in "missing info" list)
                  </label>
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
          background: isDark ? '#111827' : '#F3F4F6'
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
            {activeTab < 3 ? (
              <button
                onClick={() => {
                  // Validate category on Tab 0 (Basic Info)
                  if (activeTab === 0 && !category) {
                    toast.error('Please select a category before proceeding');
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
    </div>
  );
};

export default CreateContactModal;

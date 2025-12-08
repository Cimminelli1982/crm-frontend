import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

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

  // Tab 2 - Professional
  const [companySearch, setCompanySearch] = useState('');
  const [companyResults, setCompanyResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [suggestedCompany, setSuggestedCompany] = useState(null);
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
  const [searchingCompany, setSearchingCompany] = useState(false);
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
      setSelectedCompany(null);
      setCompanySearch(emailData.company_name || '');
      setSuggestedCompany(null);

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

  // Company domain matching
  const findCompanyByDomain = async (domain) => {
    try {
      const { data, error } = await supabase
        .from('company_domains')
        .select('company_id, domain, companies(company_id, name, category)')
        .eq('domain', domain)
        .limit(1)
        .single();

      if (!error && data?.companies) {
        setSuggestedCompany(data.companies);
        setSelectedCompany(data.companies);
        setCompanySearch('');
      }
    } catch (e) {
      // No company found
    }
  };

  // Search companies
  const searchCompanies = async (query) => {
    if (!query || query.length < 2) {
      setCompanyResults([]);
      return;
    }

    setSearchingCompany(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (!error) {
        setCompanyResults(data || []);
      }
    } catch (e) {
      console.error('Error searching companies:', e);
    }
    setSearchingCompany(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (companySearch && !selectedCompany) {
        searchCompanies(companySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch, selectedCompany]);

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

  // Create new company if needed
  const createNewCompany = async (name) => {
    try {
      const domain = extractDomain(email);

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name, category: 'Inbox' })
        .select()
        .single();

      if (companyError) throw companyError;

      if (domain && company) {
        await supabase
          .from('company_domains')
          .insert({
            company_id: company.company_id,
            domain: domain,
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
      // Step 1: Handle company creation if needed
      let companyToLink = selectedCompany;
      if (!selectedCompany && companySearch.trim()) {
        companyToLink = await createNewCompany(companySearch.trim());
      }

      // Step 2: Handle city creation if needed
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

      // Step 6: Create contact_companies if company selected
      if (companyToLink) {
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contact.contact_id,
            company_id: companyToLink.company_id,
            is_primary: true
          });
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
              {/* Company */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={labelStyle}>
                  Company
                  {suggestedCompany && selectedCompany?.company_id === suggestedCompany.company_id && (
                    <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '11px' }}>
                      (matched from email domain)
                    </span>
                  )}
                </label>

                {selectedCompany ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: selectedBg,
                    borderRadius: '6px'
                  }}>
                    <span style={{ color: textColor, fontWeight: 500 }}>
                      {selectedCompany.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCompany(null);
                        setCompanySearch('');
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
                      value={companySearch}
                      onChange={(e) => {
                        setCompanySearch(e.target.value);
                        setShowCompanyDropdown(true);
                      }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      placeholder="Search or create company..."
                      style={inputStyle}
                    />

                    {showCompanyDropdown && (companyResults.length > 0 || companySearch.trim()) && (
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
                        {companyResults.map(company => (
                          <div
                            key={company.company_id}
                            onClick={() => {
                              setSelectedCompany(company);
                              setCompanySearch('');
                              setShowCompanyDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${borderColor}`,
                              color: textColor
                            }}
                          >
                            <div style={{ fontWeight: 500 }}>{company.name}</div>
                            <div style={{ fontSize: '11px', color: mutedColor }}>{company.category}</div>
                          </div>
                        ))}

                        {companySearch.trim() && !companyResults.some(c =>
                          c.name.toLowerCase() === companySearch.toLowerCase()
                        ) && (
                          <div
                            onClick={() => {
                              setShowCompanyDropdown(false);
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
                            + Create "{companySearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
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
    </div>
  );
};

export default CreateContactModal;

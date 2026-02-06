import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const KEEP_IN_TOUCH_FREQUENCIES = ['Not Set', 'Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch'];
const WISHES_TYPES = ['no wishes set', 'whatsapp standard', 'email standard', 'email custom', 'whatsapp custom', 'call', 'present', 'no wishes'];

// Email signature for Keep in Touch emails
const KIT_EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter: https://www.angelinvesting.it/
Website: https://www.cimminelli.com/
LinkedIn: https://www.linkedin.com/in/cimminelli/

Build / Buy / Invest in
internet businesses.`;

const useKeepInTouchData = (activeTab) => {
  // Keep in Touch search state
  const [keepInTouchSearchQuery, setKeepInTouchSearchQuery] = useState('');
  const [keepInTouchSearchResults, setKeepInTouchSearchResults] = useState([]);
  const [keepInTouchSearchLoading, setKeepInTouchSearchLoading] = useState(false);
  const [isSearchingKeepInTouch, setIsSearchingKeepInTouch] = useState(false);

  // Keep in Touch state
  const [keepInTouchContacts, setKeepInTouchContacts] = useState([]);
  const [keepInTouchLoading, setKeepInTouchLoading] = useState(false);
  const [keepInTouchRefreshTrigger, setKeepInTouchRefreshTrigger] = useState(0);

  const [selectedKeepInTouchContact, setSelectedKeepInTouchContact] = useState(null);
  const [keepInTouchSections, setKeepInTouchSections] = useState({
    due: true,
    dueSoon: true,
    notDue: false
  });

  const [keepInTouchContactDetails, setKeepInTouchContactDetails] = useState(null);
  const [keepInTouchInteractions, setKeepInTouchInteractions] = useState([]);
  const [keepInTouchEmails, setKeepInTouchEmails] = useState([]);
  const [keepInTouchMobiles, setKeepInTouchMobiles] = useState([]);
  const [keepInTouchCompanies, setKeepInTouchCompanies] = useState([]);
  const [keepInTouchTags, setKeepInTouchTags] = useState([]);
  const [keepInTouchCities, setKeepInTouchCities] = useState([]);
  const [keepInTouchFullContext, setKeepInTouchFullContext] = useState(null);

  // Keep in Touch modal states
  const [kitManageEmailsOpen, setKitManageEmailsOpen] = useState(false);
  const [kitManageMobilesOpen, setKitManageMobilesOpen] = useState(false);
  const [kitTagsModalOpen, setKitTagsModalOpen] = useState(false);
  const [kitCityModalOpen, setKitCityModalOpen] = useState(false);

  const [kitCompanyModalContact, setKitCompanyModalContact] = useState(null);
  const [kitEnrichmentModalOpen, setKitEnrichmentModalOpen] = useState(false);

  // Keep in Touch - Company Details state
  const [selectedKitCompanyId, setSelectedKitCompanyId] = useState(null);
  const [kitCompanyDetails, setKitCompanyDetails] = useState(null);
  const [kitCompanyDomains, setKitCompanyDomains] = useState([]);
  const [kitCompanyTags, setKitCompanyTags] = useState([]);
  const [kitCompanyCities, setKitCompanyCities] = useState([]);
  const [kitCompanyContacts, setKitCompanyContacts] = useState([]); // Contacts working at this company
  const [kitCompanyLogo, setKitCompanyLogo] = useState(null);
  const [kitCompanyEnrichmentModalOpen, setKitCompanyEnrichmentModalOpen] = useState(false);

  // Keep in Touch Email state
  const [kitEmailSubject, setKitEmailSubject] = useState('');
  const [kitEmailBody, setKitEmailBody] = useState('');
  const [kitEmailSending, setKitEmailSending] = useState(false);
  const [kitSelectedEmail, setKitSelectedEmail] = useState(null); // Selected email address for sending

  // Template state for KIT email
  const [kitTemplateDropdownOpen, setKitTemplateDropdownOpen] = useState(false);
  const [kitTemplateSearch, setKitTemplateSearch] = useState('');
  const [kitTemplates, setKitTemplates] = useState([]);
  const [kitTemplatesLoading, setKitTemplatesLoading] = useState(false);
  const kitTemplateDropdownRef = useRef(null);

  // For Keep in Touch Link Company
  const [kitContactToLinkCompany, setKitContactToLinkCompany] = useState(null);

  // Update Keep in Touch field
  const handleUpdateKeepInTouchField = async (field, value) => {
    if (!selectedKeepInTouchContact) return;

    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('contact_id', selectedKeepInTouchContact.contact_id);

      if (error) throw error;

      // Update local state
      const updatedContact = { ...selectedKeepInTouchContact, [field]: value };
      setSelectedKeepInTouchContact(updatedContact);
      setKeepInTouchContacts(prev => prev.map(c =>
        c.contact_id === selectedKeepInTouchContact.contact_id ? updatedContact : c
      ));

      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);

      // Refresh the list when frequency changes (affects days_until_next calculation)
      if (field === 'frequency') {
        setSelectedKeepInTouchContact(null);
        setKeepInTouchRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      toast.error(`Failed to update ${field}`);
    }
  };

  // Update contact field directly on contacts table
  const handleUpdateContactField = async (field, value) => {
    if (!selectedKeepInTouchContact) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ [field]: value, last_modified_at: new Date().toISOString() })
        .eq('contact_id', selectedKeepInTouchContact.contact_id);
      if (error) throw error;
      setKeepInTouchContactDetails(prev => ({ ...prev, [field]: value }));
      toast.success(`${field.replace(/_/g, ' ')} updated`);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      toast.error(`Failed to update ${field}`);
    }
  };

  // Handle snooze change for Keep in Touch
  const handleKeepInTouchSnooze = async (snoozeDays) => {
    if (!selectedKeepInTouchContact) return;
    try {
      // Calculate snoozed_until date (now + snoozeDays)
      let snoozedUntil = null;
      if (snoozeDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + snoozeDays);
        snoozedUntil = date.toISOString();
      }

      const { error } = await supabase
        .from('keep_in_touch')
        .update({ snoozed_until: snoozedUntil })
        .eq('contact_id', selectedKeepInTouchContact.contact_id);

      if (error) throw error;

      if (snoozeDays === 0) {
        toast.success('Snooze reset');
      } else {
        toast.success(`Snoozed for ${snoozeDays} days`);
      }

      // Refresh the list
      setSelectedKeepInTouchContact(null);
      setKeepInTouchRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error updating snooze:', err);
      toast.error('Failed to update snooze');
    }
  };

  // Fetch Keep in Touch contacts from mv_keep_in_touch view
  useEffect(() => {
    const fetchKeepInTouch = async () => {
      setKeepInTouchLoading(true);

      const { data, error } = await supabase
        .from('mv_keep_in_touch')
        .select('*')
        .order('days_until_next', { ascending: true });

      if (error) {
        console.error('Error fetching keep in touch contacts:', error);
      } else {
        setKeepInTouchContacts(data || []);
        // Only auto-select on initial load, not on refresh
        if (data && data.length > 0 && !selectedKeepInTouchContact) {
          const dueContacts = data.filter(c => parseInt(c.days_until_next) <= 0);
          const contactToSelect = dueContacts.length > 0 ? dueContacts[0] : data[0];
          setSelectedKeepInTouchContact(contactToSelect);
        }
      }
      setKeepInTouchLoading(false);
    };

    if (activeTab === 'keepintouch') {
      fetchKeepInTouch();
    }
  }, [activeTab, keepInTouchRefreshTrigger]);

  // Filter Keep in Touch contacts by status
  const filterKeepInTouchByStatus = (contacts, status) => {
    return contacts.filter(contact => {
      const daysUntil = parseInt(contact.days_until_next);
      if (status === 'due') return daysUntil <= 0;
      if (status === 'dueSoon') return daysUntil > 0 && daysUntil <= 14;
      if (status === 'notDue') return daysUntil > 14;
      return true;
    });
  };

  // Fetch contact details and interactions for Keep in Touch
  useEffect(() => {
    const fetchContactDetailsAndInteractions = async () => {
      if (!selectedKeepInTouchContact) {
        setKeepInTouchContactDetails(null);
        setKeepInTouchInteractions([]);
        setKeepInTouchEmails([]);
        setKeepInTouchMobiles([]);
        setKeepInTouchCompanies([]);
        setKeepInTouchTags([]);
        setKeepInTouchCities([]);
        return;
      }

      const contactId = selectedKeepInTouchContact.contact_id;

      // Fetch contact details with all editable fields
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, category, job_role, show_missing, profile_image_url, linkedin, score, birthday, description')
        .eq('contact_id', contactId)
        .single();

      let completenessScore = 0;
      if (!contactError && contactData) {
        // Fetch completeness score from dedicated table
        const { data: completenessData } = await supabase
          .from('contact_completeness')
          .select('completeness_score')
          .eq('contact_id', contactId)
          .maybeSingle();

        if (completenessData) {
          completenessScore = completenessData.completeness_score;
        }

        setKeepInTouchContactDetails({
          ...contactData,
          completeness_score: completenessScore
        });
      }

      // Fetch emails
      const { data: emailsData } = await supabase
        .from('contact_emails')
        .select('email_id, email, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false });
      setKeepInTouchEmails(emailsData || []);
      setKitSelectedEmail(null); // Reset selected email when contact changes

      // Fetch mobiles
      const { data: mobilesData } = await supabase
        .from('contact_mobiles')
        .select('mobile_id, mobile, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false });
      setKeepInTouchMobiles(mobilesData || []);

      // Fetch companies with details
      const { data: companiesData } = await supabase
        .from('contact_companies')
        .select('contact_companies_id, company_id, is_primary, relationship')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false });

      if (companiesData && companiesData.length > 0) {
        const companyIds = companiesData.map(c => c.company_id);
        const { data: companyDetails } = await supabase
          .from('companies')
          .select('company_id, name')
          .in('company_id', companyIds);

        const companiesWithDetails = companiesData.map(cc => ({
          ...cc,
          company: companyDetails?.find(c => c.company_id === cc.company_id)
        }));
        setKeepInTouchCompanies(companiesWithDetails);
      } else {
        setKeepInTouchCompanies([]);
      }

      // Fetch tags with tag details
      const { data: tagsData } = await supabase
        .from('contact_tags')
        .select('entry_id, tag_id')
        .eq('contact_id', contactId);

      if (tagsData && tagsData.length > 0) {
        const tagIds = tagsData.map(t => t.tag_id);
        const { data: tagDetails } = await supabase
          .from('tags')
          .select('tag_id, name')
          .in('tag_id', tagIds);

        const tagsWithDetails = tagsData.map(ct => ({
          ...ct,
          tags: tagDetails?.find(t => t.tag_id === ct.tag_id)
        }));
        setKeepInTouchTags(tagsWithDetails);
      } else {
        setKeepInTouchTags([]);
      }

      // Fetch cities with city details
      const { data: citiesData } = await supabase
        .from('contact_cities')
        .select('entry_id, city_id')
        .eq('contact_id', contactId);

      if (citiesData && citiesData.length > 0) {
        const cityIds = citiesData.map(c => c.city_id);
        const { data: cityDetails } = await supabase
          .from('cities')
          .select('city_id, name, country')
          .in('city_id', cityIds);

        const citiesWithDetails = citiesData.map(cc => ({
          ...cc,
          cities: cityDetails?.find(c => c.city_id === cc.city_id)
        }));
        setKeepInTouchCities(citiesWithDetails);
      } else {
        setKeepInTouchCities([]);
      }

      // Fetch last 10 interactions
      const { data: interactionsData } = await supabase
        .from('interactions')
        .select('interaction_id, interaction_type, direction, interaction_date, summary')
        .eq('contact_id', contactId)
        .order('interaction_date', { ascending: false })
        .limit(10);
      setKeepInTouchInteractions(interactionsData || []);

      // === FULL CONTEXT FOR CLAUDE CHAT ===
      // Fetch notes linked to this contact
      const { data: notesData } = await supabase
        .from('notes_contacts')
        .select('notes(note_id, title, text, created_at)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch deals linked to this contact
      const { data: dealsData } = await supabase
        .from('deals_contacts')
        .select('relationship, deals(deal_id, opportunity, stage, category, total_investment, deal_currency, description)')
        .eq('contact_id', contactId);

      // Fetch introductions involving this contact (via join table)
      const { data: introductionsData } = await supabase
        .from('introduction_contacts')
        .select('role, introductions(introduction_id, status, text, category, introduction_date, created_at)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent emails (from command_center_inbox)
      const primaryEmail = emailsData?.find(e => e.is_primary)?.email || emailsData?.[0]?.email;
      let recentEmails = [];
      if (primaryEmail) {
        const { data: emailThreads } = await supabase
          .from('command_center_inbox')
          .select('subject, from_name, from_email, date, snippet')
          .or(`from_email.eq.${primaryEmail},to_recipients.cs.${JSON.stringify([{ email: primaryEmail }])}`)
          .order('date', { ascending: false })
          .limit(5);
        recentEmails = emailThreads || [];
      }

      // Set full context for Claude
      setKeepInTouchFullContext({
        notes: (notesData || []).map(n => n.notes).filter(Boolean),
        deals: (dealsData || []).map(d => ({ ...d.deals, relationship: d.relationship })).filter(d => d.deal_id),
        introductions: (introductionsData || []).map(i => ({ ...i.introductions, role: i.role })).filter(i => i.introduction_id),
        recentEmails
      });
    };

    fetchContactDetailsAndInteractions();
  }, [selectedKeepInTouchContact?.contact_id]);

  // Auto-select first company when keepInTouchCompanies changes
  useEffect(() => {
    if (keepInTouchCompanies.length > 0) {
      setSelectedKitCompanyId(keepInTouchCompanies[0].company_id);
    } else {
      setSelectedKitCompanyId(null);
      setKitCompanyDetails(null);
      setKitCompanyDomains([]);
      setKitCompanyTags([]);
      setKitCompanyCities([]);
    }
  }, [keepInTouchCompanies]);

  // Load company details when selectedKitCompanyId changes
  useEffect(() => {
    const fetchKitCompanyDetails = async () => {
      if (!selectedKitCompanyId) {
        setKitCompanyDetails(null);
        setKitCompanyDomains([]);
        setKitCompanyTags([]);
        setKitCompanyCities([]);
        setKitCompanyContacts([]);
        setKitCompanyLogo(null);
        return;
      }

      // Fetch company details
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', selectedKitCompanyId)
        .single();

      if (companyData) {
        // Get completeness score
        const { data: completenessData } = await supabase
          .from('company_completeness')
          .select('completeness_score')
          .eq('company_id', selectedKitCompanyId)
          .maybeSingle();

        setKitCompanyDetails({
          ...companyData,
          completeness_score: completenessData?.completeness_score || 0
        });
      }

      // Fetch domains
      const { data: domainsData } = await supabase
        .from('company_domains')
        .select('*')
        .eq('company_id', selectedKitCompanyId)
        .order('is_primary', { ascending: false });
      setKitCompanyDomains(domainsData || []);

      // Fetch logo - first get attachment_id, then get the permanent_url
      const { data: logoLinkData } = await supabase
        .from('company_attachments')
        .select('attachment_id')
        .eq('company_id', selectedKitCompanyId)
        .eq('is_logo', true)
        .maybeSingle();

      if (logoLinkData?.attachment_id) {
        const { data: attachmentData } = await supabase
          .from('attachments')
          .select('permanent_url')
          .eq('attachment_id', logoLinkData.attachment_id)
          .single();
        setKitCompanyLogo(attachmentData?.permanent_url || null);
      } else {
        setKitCompanyLogo(null);
      }

      // Fetch tags with tag details
      const { data: tagsData } = await supabase
        .from('company_tags')
        .select('entry_id, tag_id')
        .eq('company_id', selectedKitCompanyId);

      if (tagsData && tagsData.length > 0) {
        const tagIds = tagsData.map(t => t.tag_id);
        const { data: tagDetails } = await supabase
          .from('tags')
          .select('tag_id, name')
          .in('tag_id', tagIds);

        const tagsWithDetails = tagsData.map(ct => ({
          ...ct,
          tags: tagDetails?.find(t => t.tag_id === ct.tag_id)
        }));
        setKitCompanyTags(tagsWithDetails);
      } else {
        setKitCompanyTags([]);
      }

      // Fetch cities with city details
      const { data: citiesData } = await supabase
        .from('company_cities')
        .select('entry_id, city_id')
        .eq('company_id', selectedKitCompanyId);

      if (citiesData && citiesData.length > 0) {
        const cityIds = citiesData.map(c => c.city_id);
        const { data: cityDetails } = await supabase
          .from('cities')
          .select('city_id, name, country')
          .in('city_id', cityIds);

        const citiesWithDetails = citiesData.map(cc => ({
          ...cc,
          cities: cityDetails?.find(c => c.city_id === cc.city_id)
        }));
        setKitCompanyCities(citiesWithDetails);
      } else {
        setKitCompanyCities([]);
      }

      // Fetch contacts working at this company
      const { data: companyContactsData } = await supabase
        .from('contact_companies')
        .select('contact_id, is_primary, relationship')
        .eq('company_id', selectedKitCompanyId);

      if (companyContactsData && companyContactsData.length > 0) {
        const contactIds = companyContactsData.map(cc => cc.contact_id);
        const { data: contactDetails } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, job_role, profile_image_url')
          .in('contact_id', contactIds);

        const contactsWithDetails = companyContactsData.map(cc => ({
          ...cc,
          contact: contactDetails?.find(c => c.contact_id === cc.contact_id)
        }));
        setKitCompanyContacts(contactsWithDetails);
      } else {
        setKitCompanyContacts([]);
      }
    };

    fetchKitCompanyDetails();
  }, [selectedKitCompanyId]);

  // Update company field handler
  const handleUpdateKitCompanyField = async (field, value) => {
    if (!selectedKitCompanyId) return;

    // Optimistic update
    setKitCompanyDetails(prev => ({ ...prev, [field]: value }));

    // Save to database
    const { error } = await supabase
      .from('companies')
      .update({ [field]: value })
      .eq('company_id', selectedKitCompanyId);

    if (error) {
      toast.error('Failed to update company');
      // Revert on error - refetch
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', selectedKitCompanyId)
        .single();
      if (data) setKitCompanyDetails(prev => ({ ...prev, ...data }));
    }
  };

  // Send Email for Keep in Touch contact
  const handleKitSendEmail = async () => {
    if (!kitEmailSubject.trim() || !kitEmailBody.trim() || kitEmailSending) return;
    if (keepInTouchEmails.length === 0) {
      toast.error('No email address available for this contact');
      return;
    }

    const toEmail = kitSelectedEmail || keepInTouchEmails[0].email; // Use selected or primary email
    const fullBody = kitEmailBody.trim() + KIT_EMAIL_SIGNATURE;

    setKitEmailSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [toEmail],
          subject: kitEmailSubject.trim(),
          textBody: fullBody,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Update last_interaction_at immediately when email is sent
      const now = new Date();
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          last_interaction_at: now.toISOString()
        })
        .eq('contact_id', selectedKeepInTouchContact.contact_id);

      if (updateError) {
        console.error('Failed to update last_interaction_at:', updateError);
      } else {
        // Update local state
        setSelectedKeepInTouchContact(prev => ({
          ...prev,
          last_interaction_at: now.toISOString()
        }));
        // Refresh the keep in touch list
        setKeepInTouchRefreshTrigger(prev => prev + 1);
      }

      // Clear the form
      setKitEmailSubject('');
      setKitEmailBody('');
      toast.success('Email sent!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setKitEmailSending(false);
    }
  };

  // Fetch templates for KIT email
  const fetchKitTemplates = useCallback(async (searchTerm = '') => {
    setKitTemplatesLoading(true);
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setKitTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setKitTemplatesLoading(false);
  }, []);

  // Search templates with debounce for KIT email
  useEffect(() => {
    if (kitTemplateDropdownOpen) {
      const debounce = setTimeout(() => {
        fetchKitTemplates(kitTemplateSearch);
      }, 200);
      return () => clearTimeout(debounce);
    }
  }, [kitTemplateSearch, kitTemplateDropdownOpen, fetchKitTemplates]);

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (kitTemplateDropdownRef.current && !kitTemplateDropdownRef.current.contains(event.target)) {
        setKitTemplateDropdownOpen(false);
      }
    };

    if (kitTemplateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [kitTemplateDropdownOpen]);

  // Apply template to KIT email body
  const applyKitTemplate = (template) => {
    setKitEmailBody(template.template_text);
    setKitTemplateDropdownOpen(false);
    setKitTemplateSearch('');
    toast.success(`Template "${template.name}" applied`);
  };

  // Search Keep in Touch contacts
  const searchKeepInTouch = useCallback(async (query) => {
    if (!query.trim()) {
      setKeepInTouchSearchResults([]);
      setIsSearchingKeepInTouch(false);
      return;
    }
    setKeepInTouchSearchLoading(true);
    setIsSearchingKeepInTouch(true);
    try {
      const { data, error } = await supabase.rpc('search_keep_in_touch', {
        search_query: query.trim(),
        result_limit: 100
      });
      if (error) throw error;
      setKeepInTouchSearchResults(data || []);
    } catch (error) {
      console.error('Error searching Keep in Touch:', error);
      toast.error('Search failed');
      setKeepInTouchSearchResults([]);
    } finally {
      setKeepInTouchSearchLoading(false);
    }
  }, []);

  // Debounced Keep in Touch search effect
  useEffect(() => {
    if (activeTab === 'keepintouch' && keepInTouchSearchQuery.trim()) {
      const debounce = setTimeout(() => {
        searchKeepInTouch(keepInTouchSearchQuery);
      }, 300);
      return () => clearTimeout(debounce);
    } else if (!keepInTouchSearchQuery.trim()) {
      setKeepInTouchSearchResults([]);
      setIsSearchingKeepInTouch(false);
    }
  }, [keepInTouchSearchQuery, activeTab, searchKeepInTouch]);

  // Clear Keep in Touch search when switching tabs
  useEffect(() => {
    if (activeTab !== 'keepintouch') {
      setKeepInTouchSearchQuery('');
      setKeepInTouchSearchResults([]);
      setIsSearchingKeepInTouch(false);
    }
  }, [activeTab]);

  // Open Keep in Touch modal (needs handleOpenQuickEditModal and setQuickEditActiveTab from parent)
  const handleOpenKeepInTouchModal = async (contact, handleOpenQuickEditModal, setQuickEditActiveTab) => {
    try {
      const { data: fullContact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .single();

      if (error) throw error;

      handleOpenQuickEditModal(fullContact, true);
      // Set tab to Keep in touch after modal opens
      setTimeout(() => setQuickEditActiveTab('Keep in touch'), 100);
    } catch (error) {
      console.error('Error fetching contact for edit:', error);
      toast.error('Failed to load contact');
    }
  };

  // Handle setting "Do not keep in touch" for a contact (needs setKeepInTouchMissingContacts from parent)
  const handleDoNotKeepInTouch = async (contact, setKeepInTouchMissingContacts) => {
    try {
      // Update contacts table keep_in_touch_frequency
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ keep_in_touch_frequency: 'Do not keep in touch' })
        .eq('contact_id', contact.contact_id);

      if (contactError) throw contactError;

      // Also update/insert keep_in_touch table
      const { data: existing } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contact.contact_id);

      if (existing && existing.length > 0) {
        await supabase
          .from('keep_in_touch')
          .update({ frequency: 'Do not keep in touch' })
          .eq('contact_id', contact.contact_id);
      } else {
        await supabase
          .from('keep_in_touch')
          .insert({ contact_id: contact.contact_id, frequency: 'Do not keep in touch' });
      }

      setKeepInTouchMissingContacts(prev => prev.filter(c => c.contact_id !== contact.contact_id));
      toast.success(`${contact.first_name} ${contact.last_name} set to "Do not keep in touch"`);
    } catch (error) {
      console.error('Error setting do not keep in touch:', error);
      toast.error('Failed to update contact');
    }
  };

  // Get company link data from current KIT contact's email domain
  const getCompanyLinkData = useCallback(() => {
    const primaryEmail = keepInTouchEmails?.find(e => e.is_primary)?.email || keepInTouchEmails?.[0]?.email;
    if (primaryEmail && primaryEmail.includes('@')) {
      const emailDomain = primaryEmail.split('@')[1]?.toLowerCase();
      if (emailDomain) {
        return {
          contact: keepInTouchContactDetails,
          domain: emailDomain,
          sampleEmails: keepInTouchEmails?.map(e => e.email) || []
        };
      } else {
        toast.error('No valid email domain found');
        return null;
      }
    } else {
      toast.error('Contact has no email to extract domain from');
      return null;
    }
  }, [keepInTouchEmails, keepInTouchContactDetails]);

  return {
    // Constants
    KEEP_IN_TOUCH_FREQUENCIES,
    WISHES_TYPES,
    KIT_EMAIL_SIGNATURE,

    // Search state
    keepInTouchSearchQuery,
    setKeepInTouchSearchQuery,
    keepInTouchSearchResults,
    setKeepInTouchSearchResults,
    keepInTouchSearchLoading,
    setKeepInTouchSearchLoading,
    isSearchingKeepInTouch,
    setIsSearchingKeepInTouch,

    // Main state
    keepInTouchContacts,
    setKeepInTouchContacts,
    keepInTouchLoading,
    setKeepInTouchLoading,
    keepInTouchRefreshTrigger,
    setKeepInTouchRefreshTrigger,

    selectedKeepInTouchContact,
    setSelectedKeepInTouchContact,
    keepInTouchSections,
    setKeepInTouchSections,

    keepInTouchContactDetails,
    setKeepInTouchContactDetails,
    keepInTouchInteractions,
    setKeepInTouchInteractions,
    keepInTouchEmails,
    setKeepInTouchEmails,
    keepInTouchMobiles,
    setKeepInTouchMobiles,
    keepInTouchCompanies,
    setKeepInTouchCompanies,
    keepInTouchTags,
    setKeepInTouchTags,
    keepInTouchCities,
    setKeepInTouchCities,
    keepInTouchFullContext,
    setKeepInTouchFullContext,

    // Modal states
    kitManageEmailsOpen,
    setKitManageEmailsOpen,
    kitManageMobilesOpen,
    setKitManageMobilesOpen,
    kitTagsModalOpen,
    setKitTagsModalOpen,
    kitCityModalOpen,
    setKitCityModalOpen,

    kitCompanyModalContact,
    setKitCompanyModalContact,
    kitEnrichmentModalOpen,
    setKitEnrichmentModalOpen,

    // Company Details state
    selectedKitCompanyId,
    setSelectedKitCompanyId,
    kitCompanyDetails,
    setKitCompanyDetails,
    kitCompanyDomains,
    setKitCompanyDomains,
    kitCompanyTags,
    setKitCompanyTags,
    kitCompanyCities,
    setKitCompanyCities,
    kitCompanyContacts,
    setKitCompanyContacts,
    kitCompanyLogo,
    setKitCompanyLogo,
    kitCompanyEnrichmentModalOpen,
    setKitCompanyEnrichmentModalOpen,

    // Email state
    kitEmailSubject,
    setKitEmailSubject,
    kitEmailBody,
    setKitEmailBody,
    kitEmailSending,
    setKitEmailSending,
    kitSelectedEmail,
    setKitSelectedEmail,

    // Template state
    kitTemplateDropdownOpen,
    setKitTemplateDropdownOpen,
    kitTemplateSearch,
    setKitTemplateSearch,
    kitTemplates,
    setKitTemplates,
    kitTemplatesLoading,
    setKitTemplatesLoading,
    kitTemplateDropdownRef,

    // Link Company state
    kitContactToLinkCompany,
    setKitContactToLinkCompany,

    // Link Company helper
    getCompanyLinkData,

    // Handlers
    handleUpdateKeepInTouchField,
    handleUpdateContactField,
    handleKeepInTouchSnooze,
    filterKeepInTouchByStatus,
    handleUpdateKitCompanyField,
    handleKitSendEmail,
    fetchKitTemplates,
    applyKitTemplate,
    searchKeepInTouch,
    handleOpenKeepInTouchModal,
    handleDoNotKeepInTouch,
  };
};

export default useKeepInTouchData;

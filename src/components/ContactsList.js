import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaEdit, FaClock, FaTimes, FaCalendarAlt, FaHeart, FaCog, FaInfoCircle, FaStar } from 'react-icons/fa';
import { FiSkipForward, FiAlertTriangle, FiX, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
// Remove CompanyMainModal import - we'll handle this inline

const ContactsList = ({
  contacts = [],
  loading = false,
  theme,
  emptyStateConfig = {
    icon: '📥',
    title: 'No contacts found',
    text: 'There are no contacts to display.'
  },
  onContactUpdate,
  showActions = true,
  onContactClick,
  badgeType = 'time', // 'time' or 'category'
  pageContext = null, // 'keepInTouch' or null
  keepInTouchConfig = null, // { showDaysCounter: boolean, showFrequencyBadge: boolean }
  filterCategory = null // 'Birthday' or other category
}) => {
  const navigate = useNavigate();


  // Keep in Touch helper functions
  const formatDaysUntilNext = (daysUntilNext, contact = null) => {
    if (daysUntilNext === null || daysUntilNext === undefined) {
      // Check if this is a birthday contact
      if (contact?.days_until_birthday !== undefined) {
        return formatBirthdayCountdown(contact.days_until_birthday, contact);
      }
      return '';
    }

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else {
      return `Due in ${days} days`;
    }
  };

  const formatBirthdayCountdown = (daysUntilBirthday, contact = null) => {
    const days = parseInt(daysUntilBirthday);
    const ageInfo = contact?.turning_age ? ` (turning ${contact.turning_age})` : '';

    if (days === 0) {
      return `🎉 Birthday today${ageInfo}!`;
    } else if (days === 1) {
      return `🎂 Birthday tomorrow${ageInfo}!`;
    } else if (days <= 7) {
      return `🎈 Birthday in ${days} days${ageInfo}`;
    } else if (days <= 30) {
      return `🎁 Birthday in ${days} days${ageInfo}`;
    } else {
      return `🎂 Birthday in ${days} days${ageInfo}`;
    }
  };

  const getUrgencyColor = (daysUntilNext, theme, contact = null) => {
    // Handle birthday coloring
    if (contact?.days_until_birthday !== undefined) {
      const days = parseInt(contact.days_until_birthday);
      if (days === 0) {
        return '#EF4444'; // Red for birthday today
      } else if (days <= 7) {
        return '#F59E0B'; // Amber for birthday this week
      } else {
        return '#10B981'; // Green for birthday coming up
      }
    }

    if (daysUntilNext === null || daysUntilNext === undefined) return theme === 'light' ? '#6B7280' : '#9CA3AF';

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return '#EF4444'; // Red for overdue
    } else if (days <= 7) {
      return '#F59E0B'; // Amber for due soon
    } else {
      return '#10B981'; // Green for coming up
    }
  };

  const formatFrequency = (frequency) => {
    if (!frequency) return '';
    return frequency.replace(/([A-Z])/g, ' $1').trim();
  };

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({
    deleteInteractions: true,
    deleteEmails: true,
    deleteEmailParticipants: true,
    deleteEmailThreads: true,
    deleteTags: true,
    deleteCities: true,
    deleteCompanies: true,
    deleteNotes: true,
    deleteAttachments: true,
    deleteContactEmails: true,
    deleteContactMobiles: true,
    deleteChat: true,
    deleteContactChats: true,
    deleteDeals: true,
    deleteMeetings: true,
    deleteInvestments: true,
    deleteKit: true,
    addToSpam: true,
    addMobileToSpam: true
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep in Touch frequency modal state
  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [contactForFrequency, setContactForFrequency] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState('');

  // Birthday edit modal state
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [contactForBirthday, setContactForBirthday] = useState(null);
  const [selectedBirthday, setSelectedBirthday] = useState('');

  // Communication modal state (for interactions page)
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [contactForCommunication, setContactForCommunication] = useState(null);

  // Keep in touch data input modal state (for interactions page)
  const [keepInTouchModalOpen, setKeepInTouchModalOpen] = useState(false);
  const [contactForKeepInTouch, setContactForKeepInTouch] = useState(null);
  const [keepInTouchData, setKeepInTouchData] = useState({}); // Store loaded keep_in_touch data for status checks
  const [keepInTouchFormData, setKeepInTouchFormData] = useState({
    frequency: '',
    birthday: '',
    christmasWishes: '',
    easterWishes: ''
  });

  // Description modal state
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [contactForDescription, setContactForDescription] = useState(null);
  const [descriptionText, setDescriptionText] = useState('');
  const [jobRoleText, setJobRoleText] = useState('');
  const [contactCategory, setContactCategory] = useState('');
  const [contactScore, setContactScore] = useState(0);

  // Company association modal state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedContactForCompany, setSelectedContactForCompany] = useState(null);
  // Smart company suggestions state
  const [companySuggestions, setCompanySuggestions] = useState({});

  const frequencyOptions = [
    'Weekly',
    'Monthly',
    'Quarterly',
    'Twice per Year',
    'Once per Year'
  ];

  const categoryOptions = [
    'Inbox',
    'Skip',
    'Professional Investor',
    'Team',
    'WhatsApp Group Contact',
    'Advisor',
    'Supplier',
    'Founder',
    'Manager',
    'Friend and Family',
    'Other',
    'Student',
    'Media',
    'Not Set',
    'Institution',
    'SUBSCRIBER NEWSLETTER',
    'System'
  ];

  const renderScoreStars = (score, size = 'small') => {
    const starSize = size === 'small' ? '12px' : '16px';
    const gap = size === 'small' ? '2px' : '4px';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap }}>
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            style={{
              fontSize: starSize,
              color: star <= score ? '#F59E0B' : '#D1D5DB'
            }}
          />
        ))}
      </div>
    )
  };

  const handleEditContact = (contactId, e) => {
    if (e) e.stopPropagation();

    // Navigate to the new contact edit page
    navigate(`/contact/${contactId}/edit`);
  };

  const handleSkipContact = async (contact, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Contact moved to Skip');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error skipping contact:', error);
      toast.error('Failed to skip contact');
    }
  };

  // Keep in Touch specific handlers
  const handleRemoveFromKeepInTouch = async (contact, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .delete()
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Contact removed from keep in touch');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error removing from keep in touch:', error);
      toast.error('Failed to remove from keep in touch');
    }
  };

  const handleOpenFrequencyModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForFrequency(contact);
    setSelectedFrequency(contact.keep_in_touch_frequency || 'Monthly');
    setFrequencyModalOpen(true);
  };

  const handleUpdateFrequency = async () => {
    if (!contactForFrequency || !selectedFrequency) return;

    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({ frequency: selectedFrequency })
        .eq('contact_id', contactForFrequency.contact_id);

      if (error) throw error;

      toast.success(`Keep in touch frequency updated to ${selectedFrequency}`);
      setFrequencyModalOpen(false);
      setContactForFrequency(null);
      setSelectedFrequency('');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
    }
  };

  // Handle opening birthday modal
  const handleOpenBirthdayModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForBirthday(contact);
    setSelectedBirthday(contact.birthday || '');
    setBirthdayModalOpen(true);
  };

  // Handle updating birthday
  const handleUpdateBirthday = async () => {
    if (!contactForBirthday) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: selectedBirthday || null })
        .eq('contact_id', contactForBirthday.contact_id);

      if (error) throw error;

      toast.success('Birthday updated successfully');
      setBirthdayModalOpen(false);
      setContactForBirthday(null);
      setSelectedBirthday('');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating birthday:', error);
      toast.error('Failed to update birthday');
    }
  };

  // Handle opening communication modal (for interactions page)
  const handleOpenCommunicationModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForCommunication(contact);
    setCommunicationModalOpen(true);
  };

  // Handle opening keep in touch data input modal (for interactions page)
  const handleOpenKeepInTouchModal = async (contact, e) => {
    if (e) e.stopPropagation();
    setContactForKeepInTouch(contact);

    // Load existing keep in touch data from keep_in_touch table
    try {
      const { data: existingKeepInTouchData, error } = await supabase
        .from('keep_in_touch')
        .select('frequency, christmas, easter')
        .eq('contact_id', contact.contact_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading keep in touch data:', error);
      }

      // Pre-populate form with existing data
      setKeepInTouchFormData({
        frequency: existingKeepInTouchData?.frequency || '',
        birthday: contact.birthday || '',
        christmasWishes: existingKeepInTouchData?.christmas || '',
        easterWishes: existingKeepInTouchData?.easter || ''
      });
    } catch (error) {
      console.error('Error loading keep in touch data:', error);
      // Set default values if loading fails
      setKeepInTouchFormData({
        frequency: '',
        birthday: contact.birthday || '',
        christmasWishes: '',
        easterWishes: ''
      });
    }

    setKeepInTouchModalOpen(true);
  };

  // Handle form field changes
  const handleKeepInTouchFormChange = (field, value) => {
    setKeepInTouchFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle saving keep in touch data
  const handleSaveKeepInTouchData = async () => {
    if (!contactForKeepInTouch) return;

    try {
      // Update birthday in contacts table - handle empty strings properly
      const birthdayValue = keepInTouchFormData.birthday && keepInTouchFormData.birthday.trim() !== ''
                           ? keepInTouchFormData.birthday
                           : null;

      if (birthdayValue !== contactForKeepInTouch.birthday) {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ birthday: birthdayValue })
          .eq('contact_id', contactForKeepInTouch.contact_id);

        if (contactError) throw contactError;
      }

      // Check if keep_in_touch record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactForKeepInTouch.contact_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Prepare keep in touch data - handle NULL and empty values properly
      const keepInTouchUpdateData = {
        contact_id: contactForKeepInTouch.contact_id,
        frequency: keepInTouchFormData.frequency && keepInTouchFormData.frequency.trim() !== ''
                  ? keepInTouchFormData.frequency
                  : 'Not Set',
        christmas: keepInTouchFormData.christmasWishes && keepInTouchFormData.christmasWishes.trim() !== ''
                  ? keepInTouchFormData.christmasWishes
                  : 'no wishes set',
        easter: keepInTouchFormData.easterWishes && keepInTouchFormData.easterWishes.trim() !== ''
                ? keepInTouchFormData.easterWishes
                : 'no wishes set'
      };

      let keepInTouchError;
      if (existingRecord) {
        // Update existing record
        ({ error: keepInTouchError } = await supabase
          .from('keep_in_touch')
          .update(keepInTouchUpdateData)
          .eq('contact_id', contactForKeepInTouch.contact_id));
      } else {
        // Insert new record
        ({ error: keepInTouchError } = await supabase
          .from('keep_in_touch')
          .insert(keepInTouchUpdateData));
      }

      if (keepInTouchError) throw keepInTouchError;

      toast.success('Keep in Touch data updated successfully!');
      setKeepInTouchModalOpen(false);
      setContactForKeepInTouch(null);

      // Refresh data if callback provided
      if (onContactUpdate) {
        onContactUpdate();
      }
    } catch (error) {
      console.error('Error updating keep in touch data:', error);
      toast.error('Failed to update keep in touch data: ' + (error.message || 'Unknown error'));
    }
  };

  // Check keep in touch data completeness status using 4 fields
  const getKeepInTouchStatus = (contact) => {
    // Check 4 fields: birthday (contacts), frequency, christmas, easter (keep_in_touch)
    const hasBirthday = !!(contact.birthday && contact.birthday !== null);
    const hasFrequency = !!(contact.keep_in_touch_frequency &&
                        contact.keep_in_touch_frequency !== 'Not Set');
    const hasChristmas = !!(contact.christmas &&
                        contact.christmas !== 'no wishes set');
    const hasEaster = !!(contact.easter &&
                     contact.easter !== 'no wishes set');

    // Debug logging for Pierdavide Fiore
    if (contact.first_name === 'Pierdavide' && contact.last_name === 'Fiore') {
      console.log('Pierdavide Fiore Debug:', {
        birthday: contact.birthday,
        keep_in_touch_frequency: contact.keep_in_touch_frequency,
        christmas: contact.christmas,
        easter: contact.easter,
        hasBirthday,
        hasFrequency,
        hasChristmas,
        hasEaster,
        filledFieldsCount: [hasBirthday, hasFrequency, hasChristmas, hasEaster].filter(Boolean).length
      });
    }

    const filledFields = [hasBirthday, hasFrequency, hasChristmas, hasEaster].filter(Boolean).length;

    // All 4 fields filled = heart
    if (filledFields === 4) {
      return 'complete';
    }
    // All filled except birthday = cake
    else if (filledFields === 3 && !hasBirthday && hasFrequency && hasChristmas && hasEaster) {
      return 'missing_birthday';
    }
    // Missing 2+ fields = sad face
    else {
      return 'incomplete';
    }
  };

  // Enhanced status check that considers christmas/easter wishes
  // This properly checks all fields including wishes from keep_in_touch table
  const getEnhancedKeepInTouchStatus = (contact, keepInTouchRecord = null) => {
    // Frequency complete: NOT NULL AND NOT "Not Set"
    const hasFrequency = contact.keep_in_touch_frequency &&
                        contact.keep_in_touch_frequency !== 'Not Set';

    // Birthday complete: NOT NULL AND NOT empty
    const hasBirthday = contact.birthday && contact.birthday.trim() !== '';

    // Christmas wishes complete: NOT NULL AND NOT "no wishes set"
    const hasChristmasWishes = keepInTouchRecord?.christmas &&
                              keepInTouchRecord.christmas !== 'no wishes set';

    // Easter wishes complete: NOT NULL AND NOT "no wishes set"
    const hasEasterWishes = keepInTouchRecord?.easter &&
                           keepInTouchRecord.easter !== 'no wishes set';

    if (!hasFrequency) {
      return 'incomplete'; // Frequency not set - sad face
    } else if (hasFrequency && !hasBirthday) {
      return 'missing_birthday'; // Frequency set but birthday missing - cake
    } else if (hasFrequency && hasBirthday && hasChristmasWishes && hasEasterWishes) {
      return 'complete'; // Everything properly filled - thumbs up
    } else {
      return 'incomplete'; // Missing wishes data - sad face
    }
  };

  // Get icon and styling based on status
  const getKeepInTouchDisplay = (contact) => {
    // Use basic status for now - could be enhanced to load keep_in_touch data for each contact
    // but that would be expensive. For now, we'll be conservative:
    // Only show 'complete' (thumbs up) if we're certain all data is present
    const status = getKeepInTouchStatus(contact);

    switch (status) {
      case 'complete':
        return {
          icon: '👍',
          backgroundColor: '#10B981',
          title: 'Keep in touch - Basic info complete (check wishes in modal)'
        };
      case 'missing_birthday':
        return {
          icon: '🎂',
          backgroundColor: '#A7F3D0',
          title: 'Keep in touch - Birthday missing'
        };
      case 'incomplete':
      default:
        return {
          icon: '😕',
          backgroundColor: '#F87171',
          title: 'Keep in touch - Incomplete'
        };
    }
  };

  // Handle communication actions
  const handleWhatsAppClick = (mobile) => {
    const cleanMobile = mobile.replace(/[^\d]/g, ''); // Remove non-digit characters
    const whatsappUrl = `https://wa.me/${cleanMobile}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = (email) => {
    const mailtoUrl = `mailto:${email}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleLinkedInClick = (linkedinUrl) => {
    window.open(linkedinUrl, '_blank');
  };

  // Handle removing birthday
  const handleRemoveBirthday = async (contact, e) => {
    if (e) e.stopPropagation();

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: null })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Birthday removed');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error removing birthday:', error);
      toast.error('Failed to remove birthday');
    }
  };

  // Handle opening description modal
  const handleOpenDescriptionModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForDescription(contact);
    setDescriptionText(contact.description || '');
    setJobRoleText(contact.job_role || '');
    setContactCategory(contact.category || 'Not Set');
    setContactScore(contact.score || 0);
    setDescriptionModalOpen(true);
  };

  // Handle saving all contact details
  const handleSaveDescription = async () => {
    if (!contactForDescription) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          description: descriptionText.trim() || null,
          job_role: jobRoleText.trim() || null,
          category: contactCategory || 'Not Set',
          score: contactScore
        })
        .eq('contact_id', contactForDescription.contact_id);

      if (error) throw error;

      toast.success('Contact details updated successfully');
      setDescriptionModalOpen(false);
      setContactForDescription(null);
      setDescriptionText('');
      setJobRoleText('');
      setContactCategory('');
      setContactScore(0);
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating contact details:', error);
      toast.error('Failed to update contact details');
    }
  };

  // Handle company click
  const handleCompanyClick = (companyId, e) => {
    if (e) e.stopPropagation();
    navigate(`/company/${companyId}`);
  };

  // Extract domain from email (skip generic providers)
  const extractBusinessDomain = (email) => {
    if (!email) return null;
    const domain = email.split('@')[1]?.toLowerCase();
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com'];
    return genericDomains.includes(domain) ? null : domain;
  };

  // Fetch company suggestion based on email domain
  const fetchCompanySuggestion = async (contact) => {
    try {
      // First get the contact's email from contact_emails table
      const { data: emailData, error: emailError } = await supabase
        .from('contact_emails')
        .select('email')
        .eq('contact_id', contact.contact_id)
        .limit(1);

      if (emailError || !emailData?.length) return null;

      const email = emailData[0].email;
      const domain = extractBusinessDomain(email);

      if (!domain) return null;

      // Search for domain in website field only (domain field doesn't exist)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('website', `%${domain}%`)
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Error fetching company suggestion:', err);
      return null;
    }
  };

  // Load company suggestions for contacts without companies
  useEffect(() => {
    const loadSuggestions = async () => {
      const suggestions = {};
      const contactsWithoutCompanies = contacts.filter(contact => !contact.companies?.[0]);

      for (const contact of contactsWithoutCompanies) {
        const suggestion = await fetchCompanySuggestion(contact);
        if (suggestion) {
          suggestions[contact.contact_id] = suggestion;
        }
      }

      setCompanySuggestions(suggestions);
    };

    if (contacts.length > 0) {
      loadSuggestions();
    }
  }, [contacts]);

  // Handle accepting company suggestion
  const handleAcceptSuggestion = async (contact, company, e) => {
    if (e) e.stopPropagation();

    try {
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id,
          is_primary: true
        });

      if (error) throw error;
      toast.success(`Associated ${contact.first_name} with ${company.name}`);

      // Remove from suggestions and refresh contacts
      setCompanySuggestions(prev => {
        const updated = { ...prev };
        delete updated[contact.contact_id];
        return updated;
      });

      if (onContactUpdate) onContactUpdate();
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      toast.error('Failed to associate company');
    }
  };

  // Handle rejecting company suggestion (opens manual modal)
  const handleRejectSuggestion = (contact, e) => {
    if (e) e.stopPropagation();
    setSelectedContactForCompany(contact);
    setCompanyModalOpen(true);
  };

  // Handle add company click (manual)
  const handleAddCompanyClick = (contact, e) => {
    if (e) e.stopPropagation();
    setSelectedContactForCompany(contact);
    setCompanyModalOpen(true);
  };

  // Handle opening delete modal with spam functionality
  const handleOpenDeleteModal = async (contact, e) => {
    if (e) e.stopPropagation();

    const contactData = {
      ...contact,
      email: contact.emails?.[0]?.email || null,
      mobile: contact.mobiles?.[0]?.mobile || null
    };

    setContactToDelete(contactData);

    try {
      // Get counts of associated records
      const [
        chatResult,
        contactChatsResult,
        interactionsResult,
        emailsResult,
        emailParticipantsResult,
        emailThreadsResult,
        tagsResult,
        citiesResult,
        companiesResult,
        notesResult,
        attachmentsResult,
        contactEmailsResult,
        contactMobilesResult,
        dealsResult,
        meetingsResult,
        investmentsResult,
        kitResult,
        lastInteractionResult
      ] = await Promise.all([
        Promise.resolve({ count: 0 }),
        Promise.resolve({ count: 0 }),
        supabase.from('interactions').select('interaction_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('emails').select('email_id', { count: 'exact', head: true }).eq('sender_contact_id', contactData.contact_id),
        supabase.from('email_participants').select('participant_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_email_threads').select('email_thread_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_tags').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_cities').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_companies').select('contact_companies_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('notes_contacts').select('note_contact_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('attachments').select('attachment_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_emails').select('email_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_mobiles').select('mobile_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('deals_contacts').select('deals_contacts_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('meeting_contacts').select('meeting_contact_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('investments_contacts').select('investments_contacts_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('keep_in_touch').select('id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('interactions').select('interaction_id, interaction_type, direction, interaction_date, summary').eq('contact_id', contactData.contact_id).order('interaction_date', { ascending: false }).limit(1)
      ]);

      // Format last interaction
      let lastInteraction = null;
      if (lastInteractionResult.data && lastInteractionResult.data.length > 0) {
        const interaction = lastInteractionResult.data[0];
        const date = new Date(interaction.interaction_date).toLocaleDateString();
        lastInteraction = {
          summary: `${interaction.interaction_type} - ${interaction.summary || 'No notes'} (${date})`
        };
      }

      const data = {
        chatCount: chatResult.count || 0,
        contactChatsCount: contactChatsResult.count || 0,
        interactionsCount: interactionsResult.count || 0,
        emailsCount: emailsResult.count || 0,
        emailParticipantsCount: emailParticipantsResult.count || 0,
        emailThreadsCount: emailThreadsResult.count || 0,
        tagsCount: tagsResult.count || 0,
        citiesCount: citiesResult.count || 0,
        companiesCount: companiesResult.count || 0,
        notesCount: notesResult.count || 0,
        attachmentsCount: attachmentsResult.count || 0,
        contactEmailsCount: contactEmailsResult.count || 0,
        contactMobilesCount: contactMobilesResult.count || 0,
        dealsCount: dealsResult.count || 0,
        meetingsCount: meetingsResult.count || 0,
        investmentsCount: investmentsResult.count || 0,
        kitCount: kitResult.count || 0,
        lastInteraction
      };

      setAssociatedData(data);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching associated data:', error);
      toast.error('Failed to load contact details');
    }
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      setIsDeleting(true);

      // Add email to spam list if selected
      if (selectedItems.addToSpam && contactToDelete.email) {
        const { error: spamError } = await supabase
          .from('emails_spam')
          .insert([{
            email: contactToDelete.email,
            counter: 1
          }]);

        if (spamError) {
          console.error('Error adding to spam list:', spamError);
        }
      }

      // Add mobile to WhatsApp spam list if selected
      if (selectedItems.addMobileToSpam && contactToDelete.mobile) {
        const { error: whatsappSpamError } = await supabase
          .from('whatsapp_spam')
          .insert([{
            mobile_number: contactToDelete.mobile,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          }]);

        if (whatsappSpamError) {
          console.error('Error adding to WhatsApp spam list:', whatsappSpamError);
        }
      }

      // Delete associated records
      const promises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(supabase.from('interactions').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        promises.push(supabase.from('emails').delete().eq('sender_contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmailParticipants && associatedData.emailParticipantsCount > 0) {
        promises.push(supabase.from('email_participants').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(supabase.from('contact_email_threads').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(supabase.from('contact_tags').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(supabase.from('contact_cities').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(supabase.from('contact_companies').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(supabase.from('notes_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(supabase.from('attachments').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(supabase.from('contact_emails').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(supabase.from('contact_mobiles').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(supabase.from('deals_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(supabase.from('meeting_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(supabase.from('investments_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactToDelete.contact_id));
      }

      await Promise.all(promises);

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      if (onContactUpdate) onContactUpdate();

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContactClick = (contact) => {
    if (onContactClick) {
      onContactClick(contact);
    } else {
      navigate(`/contact/${contact.contact_id}`);
    }
  };

  const getContactPriorityScore = (contact) => {
    // Use last_interaction_at if available, otherwise fall back to created_at
    const interactionDate = contact.last_interaction_at || contact.created_at;
    if (!interactionDate) return 9999; // Very high number for contacts with no date

    const lastInteraction = new Date(interactionDate);
    const now = new Date();

    // Reset time to start of day for accurate day calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const interactionDay = new Date(lastInteraction.getFullYear(), lastInteraction.getMonth(), lastInteraction.getDate());

    const daysDiff = Math.floor((today - interactionDay) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff); // Ensure non-negative
  };

  const getContactPriorityLabel = (contact) => {
    // For spam contacts, show the spam counter instead of other labels
    if (contact.spam_counter !== undefined) {
      return `${contact.spam_counter}x`;
    }

    // If in Birthday filter, always show the contact category
    if (filterCategory === 'Birthday') {
      return contact.category || 'No Category';
    }

    // If badgeType is 'category', show the contact category
    if (badgeType === 'category') {
      return contact.category || 'No Category';
    }

    // Default to time-based labels
    const daysDiff = getContactPriorityScore(contact);

    if (daysDiff === 0) return 'today';
    if (daysDiff === 1) return 'yesterday';
    if (daysDiff <= 7) return 'this week';
    if (daysDiff <= 30) return 'this month';
    if (daysDiff <= 90) return 'this quarter';
    if (daysDiff <= 365) return 'this year';
    return 'ages ago';
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText theme={theme}>Loading contacts...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <ContactsListContainer>
      {contacts.map(contact => (
        <ContactCard key={contact.contact_id} theme={theme}>
          <ContactCardContent onClick={() => handleContactClick(contact)}>
            <ContactCardHeader>
              <ContactAvatar>
                {contact.profile_image_url ? (
                  <img src={contact.profile_image_url} alt="Profile" />
                ) : (
                  <InfoIconButton
                    onClick={(e) => handleOpenDescriptionModal(contact, e)}
                    theme={theme}
                    title="View/Edit contact description"
                  >
                    <FaInfoCircle />
                  </InfoIconButton>
                )}
              </ContactAvatar>
              <ContactInfo>
                <ContactName theme={theme}>
                  {contact.first_name} {contact.last_name}
                  {pageContext === 'keepInTouch' && keepInTouchConfig?.showFrequencyBadge && (
                    <KeepInTouchFrequencyBadge theme={theme}>
                      {filterCategory === 'Birthday' && contact.birthday
                        ? (() => {
                            const birthDate = new Date(contact.birthday);
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const month = monthNames[birthDate.getMonth()];
                            const day = birthDate.getDate();
                            return `${month} ${day}`;
                          })()
                        : contact.keep_in_touch_frequency
                          ? formatFrequency(contact.keep_in_touch_frequency)
                          : null
                      }
                    </KeepInTouchFrequencyBadge>
                  )}
                  {pageContext !== 'keepInTouch' && (
                    <PriorityIndicator $score={getContactPriorityScore(contact)}>
                      {getContactPriorityLabel(contact)}
                    </PriorityIndicator>
                  )}
                </ContactName>
                {pageContext === 'keepInTouch' && keepInTouchConfig?.showDaysCounter && (
                  <KeepInTouchStatus
                    theme={theme}
                    $urgencyColor={getUrgencyColor(contact.days_until_next, theme, contact)}
                  >
                    {formatDaysUntilNext(contact.days_until_next, contact)}
                  </KeepInTouchStatus>
                )}
                {contact.job_role && (
                  <ContactRoleContainer>
                    <ContactRole theme={theme}>{contact.job_role}</ContactRole>
                    {contact.score && contact.score > 0 && (
                      <ContactScoreStars>
                        {renderScoreStars(contact.score, 'small')}
                      </ContactScoreStars>
                    )}
                  </ContactRoleContainer>
                )}
                {contact.companies?.[0] ? (
                  <ContactCompany
                    theme={theme}
                    onClick={(e) => handleCompanyClick(contact.companies[0].company_id, e)}
                    $clickable={true}
                  >
                    <FaBuilding style={{ marginRight: '6px' }} />
                    {contact.companies[0].name}
                  </ContactCompany>
                ) : companySuggestions[contact.contact_id] ? (
                  <SmartSuggestion theme={theme}>
                    <FaBuilding style={{ marginRight: '6px', color: 'currentColor' }} />
                    <SuggestionText>
                      Associate with {companySuggestions[contact.contact_id].name}?
                    </SuggestionText>
                    <SuggestionActions>
                      <SuggestionButton
                        variant="accept"
                        theme={theme}
                        onClick={(e) => handleAcceptSuggestion(contact, companySuggestions[contact.contact_id], e)}
                        title="Accept suggestion"
                      >
                        ✓
                      </SuggestionButton>
                      <SuggestionButton
                        variant="reject"
                        theme={theme}
                        onClick={(e) => handleRejectSuggestion(contact, e)}
                        title="Choose different company"
                      >
                        ✕
                      </SuggestionButton>
                    </SuggestionActions>
                  </SmartSuggestion>
                ) : (
                  <AddCompanyButton
                    theme={theme}
                    onClick={(e) => handleAddCompanyClick(contact, e)}
                    title="Add company association"
                  >
                    <FaBuilding style={{ marginRight: '6px' }} />
                    + Add Related Company
                  </AddCompanyButton>
                )}
              </ContactInfo>
            </ContactCardHeader>

            <ContactCardDetails>
              {pageContext !== 'keepInTouch' && contact.emails?.length > 0 && contact.emails[0]?.email && (
                <ContactDetail theme={theme}>
                  <FaEnvelope />
                  <span>{contact.emails[0].email}</span>
                </ContactDetail>
              )}
              {pageContext !== 'keepInTouch' && contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
                <ContactDetail theme={theme}>
                  <FaPhone />
                  <span>{contact.mobiles[0].mobile}</span>
                </ContactDetail>
              )}
            </ContactCardDetails>
          </ContactCardContent>

          {showActions && (
            <ContactCardActions>
              {pageContext === 'interactions' ? (
                <>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleOpenCommunicationModal(contact, e)}
                    $communication
                    title="Contact via WhatsApp, Email, or LinkedIn"
                  >
                    <FiMessageCircle />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleOpenKeepInTouchModal(contact, e)}
                    $keepInTouch
                    title={getKeepInTouchDisplay(contact).title}
                    style={{
                      backgroundColor: getKeepInTouchDisplay(contact).backgroundColor,
                      color: 'white'
                    }}
                  >
                    {getKeepInTouchDisplay(contact).icon}
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleEditContact(contact.contact_id, e)}
                    $settings
                    title="Edit contact"
                  >
                    <FaCog />
                  </CardActionButton>
                </>
              ) : pageContext === 'keepInTouch' ? (
                <>
                  {filterCategory === 'Birthday' ? (
                    <>
                      <CardActionButton
                        theme={theme}
                        onClick={(e) => handleOpenCommunicationModal(contact, e)}
                        $communication
                        title="Contact via WhatsApp, Email, or LinkedIn"
                      >
                        <FiMessageCircle />
                      </CardActionButton>

                      <CardActionButton
                        theme={theme}
                        onClick={(e) => handleOpenBirthdayModal(contact, e)}
                        $frequency
                        title="Edit birthday date"
                      >
                        <FaCalendarAlt />
                      </CardActionButton>

                      <CardActionButton
                        theme={theme}
                        onClick={(e) => handleRemoveBirthday(contact, e)}
                        $removeKeepInTouch
                        title="Remove birthday"
                      >
                        <FaTimes />
                      </CardActionButton>
                    </>
                  ) : (
                    <>
                      <CardActionButton
                        theme={theme}
                        onClick={(e) => handleOpenCommunicationModal(contact, e)}
                        $communication
                        title="Contact via WhatsApp, Email, or LinkedIn"
                      >
                        <FiMessageCircle />
                      </CardActionButton>

                      <CardActionButton
                        theme={theme}
                        onClick={(e) => handleOpenFrequencyModal(contact, e)}
                        $frequency
                        title="Change keep in touch frequency"
                      >
                        <FaClock />
                      </CardActionButton>

                      <CardActionButton
                        theme={theme}
                        onClick={(e) => handleRemoveFromKeepInTouch(contact, e)}
                        $removeKeepInTouch
                        title="Don't keep in touch"
                      >
                        <FaTimes />
                      </CardActionButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleEditContact(contact.contact_id, e)}
                    $edit
                    title="Edit contact"
                  >
                    <FaEdit />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleSkipContact(contact, e)}
                    $skip
                    title="Skip contact"
                  >
                    <FiSkipForward />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleOpenDeleteModal(contact, e)}
                    $delete
                    title="Delete contact"
                  >
                    <FiAlertTriangle />
                  </CardActionButton>
                </>
              )}
            </ContactCardActions>
          )}
        </ContactCard>
      ))}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        shouldCloseOnOverlayClick={false}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            overflow: 'auto',
            zIndex: 9999
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9998
          }
        }}
      >
        {contactToDelete && (
          <>
            <ModalHeader>
              <h2>Delete Contact</h2>
              <CloseButton
                theme={theme}
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <FiX />
              </CloseButton>
            </ModalHeader>

            <ModalContent theme={theme}>
              <ContactSummary>
                <strong>{contactToDelete.first_name} {contactToDelete.last_name}</strong>
                {contactToDelete.email && <div>Email: {contactToDelete.email}</div>}
                {contactToDelete.mobile && <div>Mobile: {contactToDelete.mobile}</div>}
                {associatedData.lastInteraction && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    Last interaction: {associatedData.lastInteraction.summary}
                  </div>
                )}
              </ContactSummary>

              <WarningText>
                ⚠️ This action cannot be undone. Select which associated data to delete:
              </WarningText>

              <CheckboxContainer>
                <CheckboxGroup>
                  {associatedData.interactionsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteInteractions"
                        name="deleteInteractions"
                        checked={selectedItems.deleteInteractions}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteInteractions">Interactions ({associatedData.interactionsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.emailsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteEmails"
                        name="deleteEmails"
                        checked={selectedItems.deleteEmails}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteEmails">Emails ({associatedData.emailsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.tagsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteTags"
                        name="deleteTags"
                        checked={selectedItems.deleteTags}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteTags">Tags ({associatedData.tagsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.companiesCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteCompanies"
                        name="deleteCompanies"
                        checked={selectedItems.deleteCompanies}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteCompanies">Companies ({associatedData.companiesCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.notesCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteNotes"
                        name="deleteNotes"
                        checked={selectedItems.deleteNotes}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteNotes">Notes ({associatedData.notesCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.kitCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteKit"
                        name="deleteKit"
                        checked={selectedItems.deleteKit}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteKit">Keep In Touch ({associatedData.kitCount})</label>
                    </CheckboxItem>
                  )}

                  {contactToDelete.email && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="addToSpam"
                        name="addToSpam"
                        checked={selectedItems.addToSpam}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="addToSpam">Add email to spam list</label>
                    </CheckboxItem>
                  )}

                  {contactToDelete.mobile && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="addMobileToSpam"
                        name="addMobileToSpam"
                        checked={selectedItems.addMobileToSpam}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="addMobileToSpam">Add mobile to WhatsApp spam list</label>
                    </CheckboxItem>
                  )}
                </CheckboxGroup>
              </CheckboxContainer>

              <ButtonGroup>
                <CancelButton
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </CancelButton>
                <DeleteButton
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Contact'}
                </DeleteButton>
              </ButtonGroup>
            </ModalContent>
          </>
        )}
      </Modal>

      {/* Frequency Modal */}
      <Modal
        isOpen={frequencyModalOpen}
        onRequestClose={() => setFrequencyModalOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '400px',
            width: '90%'
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3>Change Keep in Touch Frequency</h3>
            <FrequencyModalCloseButton
              theme={theme}
              onClick={() => setFrequencyModalOpen(false)}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>

          <FrequencyModalBody>
            <ContactNameDisplay theme={theme}>
              {contactForFrequency?.first_name} {contactForFrequency?.last_name}
            </ContactNameDisplay>

            <FrequencyOptionsContainer>
              {frequencyOptions.map(frequency => (
                <FrequencyOption
                  key={frequency}
                  theme={theme}
                  $selected={selectedFrequency === frequency}
                  onClick={() => setSelectedFrequency(frequency)}
                >
                  {frequency}
                </FrequencyOption>
              ))}
            </FrequencyOptionsContainer>

            <ButtonGroup>
              <CancelButton
                theme={theme}
                onClick={() => setFrequencyModalOpen(false)}
              >
                Cancel
              </CancelButton>
              <UpdateFrequencyButton
                theme={theme}
                onClick={handleUpdateFrequency}
                disabled={!selectedFrequency}
              >
                Update Frequency
              </UpdateFrequencyButton>
            </ButtonGroup>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Birthday Modal */}
      <Modal
        isOpen={birthdayModalOpen}
        onRequestClose={() => setBirthdayModalOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '400px',
            width: '90%'
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3>Edit Birthday</h3>
            <FrequencyModalCloseButton
              theme={theme}
              onClick={() => setBirthdayModalOpen(false)}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>

          <FrequencyModalBody>
            <ContactNameDisplay theme={theme}>
              {contactForBirthday?.first_name} {contactForBirthday?.last_name}
            </ContactNameDisplay>

            <BirthdayInputContainer>
              <BirthdayLabel theme={theme}>Birthday</BirthdayLabel>
              <BirthdayInput
                type="date"
                theme={theme}
                value={selectedBirthday}
                onChange={(e) => setSelectedBirthday(e.target.value)}
              />
            </BirthdayInputContainer>

            <ButtonGroup>
              <CancelButton
                theme={theme}
                onClick={() => setBirthdayModalOpen(false)}
              >
                Cancel
              </CancelButton>
              <UpdateFrequencyButton
                theme={theme}
                onClick={handleUpdateBirthday}
              >
                Update Birthday
              </UpdateFrequencyButton>
            </ButtonGroup>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Communication Modal (for interactions page) */}
      <Modal
        isOpen={communicationModalOpen}
        onRequestClose={() => setCommunicationModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            background: 'transparent'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Contact {contactForCommunication?.first_name} {contactForCommunication?.last_name}</h3>
            <FrequencyModalCloseButton
              onClick={() => setCommunicationModalOpen(false)}
              theme={theme}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>
          <FrequencyModalBody>
            {/* Mobile Numbers */}
            {contactForCommunication?.contact_mobiles?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>📱 Mobile Numbers</h4>
                {contactForCommunication.contact_mobiles.map((mobileObj, index) => (
                  <FrequencyOption
                    key={index}
                    theme={theme}
                    onClick={() => handleWhatsAppClick(mobileObj.mobile)}
                    style={{ cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <FaPhone style={{ marginRight: '8px' }} />
                    {mobileObj.mobile}
                    {mobileObj.is_primary && <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(Primary)</span>}
                  </FrequencyOption>
                ))}
              </div>
            )}

            {/* Email Addresses */}
            {contactForCommunication?.contact_emails?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>📧 Email Addresses</h4>
                {contactForCommunication.contact_emails.map((emailObj, index) => (
                  <FrequencyOption
                    key={index}
                    theme={theme}
                    onClick={() => handleEmailClick(emailObj.email)}
                    style={{ cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <FaEnvelope style={{ marginRight: '8px' }} />
                    {emailObj.email}
                    {emailObj.is_primary && <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(Primary)</span>}
                  </FrequencyOption>
                ))}
              </div>
            )}

            {/* LinkedIn */}
            {contactForCommunication?.linkedin && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>🔗 LinkedIn</h4>
                <FrequencyOption
                  theme={theme}
                  onClick={() => handleLinkedInClick(contactForCommunication.linkedin)}
                  style={{ cursor: 'pointer', marginBottom: '8px' }}
                >
                  <FaBuilding style={{ marginRight: '8px' }} />
                  View LinkedIn Profile
                </FrequencyOption>
              </div>
            )}

            {/* No contact info available */}
            {(!contactForCommunication?.contact_mobiles?.length &&
              !contactForCommunication?.contact_emails?.length &&
              !contactForCommunication?.linkedin) && (
              <div style={{ textAlign: 'center', padding: '20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                No contact information available for this contact.
              </div>
            )}
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Keep in Touch Data Input Modal (for interactions page) */}
      <Modal
        isOpen={keepInTouchModalOpen}
        onRequestClose={() => setKeepInTouchModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            background: 'transparent'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Keep in Touch Settings</h3>
            <FrequencyModalCloseButton
              onClick={() => setKeepInTouchModalOpen(false)}
              theme={theme}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>
          <FrequencyModalBody>
            <div style={{ padding: '20px' }}>
              {contactForKeepInTouch && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  borderRadius: '8px'
                }}>
                  <h4 style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>
                    {contactForKeepInTouch.first_name} {contactForKeepInTouch.last_name}
                  </h4>
                  <div style={{
                    fontSize: '12px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                  }}>
                    Complete all fields to enable full Keep in Touch features
                  </div>
                </div>
              )}

              {/* Keep in Touch Frequency */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  <FaHeart style={{ marginRight: '6px' }} />
                  Keep in Touch Frequency
                </label>
                <select
                  value={keepInTouchFormData.frequency}
                  onChange={(e) => handleKeepInTouchFormChange('frequency', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select frequency...</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Twice per Year">Twice per Year</option>
                  <option value="Once per Year">Once per Year</option>
                  <option value="Do not keep in touch">Do not keep in touch</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  <FaCalendarAlt style={{ marginRight: '6px' }} />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={keepInTouchFormData.birthday}
                  onChange={(e) => handleKeepInTouchFormChange('birthday', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Christmas Wishes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  🎄 Christmas Wishes
                </label>
                <select
                  value={keepInTouchFormData.christmasWishes}
                  onChange={(e) => handleKeepInTouchFormChange('christmasWishes', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Christmas wishes...</option>
                  <option value="no wishes set">Not set</option>
                  <option value="no wishes">No wishes</option>
                  <option value="whatsapp standard">WhatsApp standard</option>
                  <option value="email standard">Email standard</option>
                  <option value="email custom">Email custom</option>
                  <option value="whatsapp custom">WhatsApp custom</option>
                  <option value="call">Call</option>
                  <option value="present">Present</option>
                </select>
              </div>

              {/* Easter Wishes */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  🐰 Easter Wishes
                </label>
                <select
                  value={keepInTouchFormData.easterWishes}
                  onChange={(e) => handleKeepInTouchFormChange('easterWishes', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Easter wishes...</option>
                  <option value="no wishes set">Not set</option>
                  <option value="no wishes">No wishes</option>
                  <option value="whatsapp standard">WhatsApp standard</option>
                  <option value="email standard">Email standard</option>
                  <option value="email custom">Email custom</option>
                  <option value="whatsapp custom">WhatsApp custom</option>
                  <option value="call">Call</option>
                  <option value="present">Present</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setKeepInTouchModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKeepInTouchData}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Description Modal */}
      <Modal
        isOpen={descriptionModalOpen}
        onRequestClose={() => {
          setDescriptionModalOpen(false);
          setDescriptionText('');
          setJobRoleText('');
          setContactCategory('Not Set');
          setContactScore(0);
          setContactForDescription(null);
        }}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            background: 'transparent'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              Edit Contact Details - {contactForDescription?.first_name} {contactForDescription?.last_name}
            </h3>
            <FrequencyModalCloseButton
              onClick={() => {
                setDescriptionModalOpen(false);
                setDescriptionText('');
                setJobRoleText('');
                setContactForDescription(null);
              }}
              theme={theme}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>
          <FrequencyModalBody>
            <div style={{ padding: '20px' }}>
              {/* Job Role Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  Job Role / Title
                </label>
                <input
                  type="text"
                  value={jobRoleText}
                  onChange={(e) => setJobRoleText(e.target.value)}
                  placeholder="Enter job role or title..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Category Dropdown */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  Category
                </label>
                <select
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Score Rating */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  Score Rating
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
                }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar
                      key={star}
                      onClick={() => setContactScore(star)}
                      style={{
                        fontSize: '20px',
                        color: star <= contactScore ? '#F59E0B' : '#D1D5DB',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  ))}
                  <span style={{
                    marginLeft: '12px',
                    fontSize: '14px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                  }}>
                    {contactScore > 0 ? `${contactScore}/5` : 'Not rated'}
                  </span>
                </div>
              </div>

              {/* Description Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  Description / Notes
                </label>
                <textarea
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  placeholder="Enter description or notes..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setDescriptionModalOpen(false);
                    setDescriptionText('');
                    setJobRoleText('');
                    setContactForDescription(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDescription}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Save Details
                </button>
              </div>
            </div>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {!loading && contacts.length === 0 && (
        <EmptyState>
          <EmptyIcon>{emptyStateConfig.icon}</EmptyIcon>
          <EmptyTitle theme={theme}>{emptyStateConfig.title}</EmptyTitle>
          <EmptyText theme={theme}>{emptyStateConfig.text}</EmptyText>
        </EmptyState>
      )}

      {/* Company Association Modal */}
      <Modal
        isOpen={companyModalOpen}
        onRequestClose={() => {
          setCompanyModalOpen(false);
          setSelectedContactForCompany(null);
        }}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            width: '600px',
            maxWidth: '90vw',
            height: '500px',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        {selectedContactForCompany && (
          <CompanyAssociationModal
            theme={theme}
            contact={selectedContactForCompany}
            onClose={() => {
              setCompanyModalOpen(false);
              setSelectedContactForCompany(null);
            }}
            onCompanyAdded={() => {
              if (onContactUpdate) onContactUpdate();
              setCompanyModalOpen(false);
              setSelectedContactForCompany(null);
            }}
          />
        )}
      </Modal>
    </ContactsListContainer>
  );
};

// Company Association Modal Component
const CompanyAssociationModal = ({ theme, contact, onClose, onCompanyAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching company suggestions:', err);
      toast.error('Failed to search companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchCompanySuggestions(searchTerm);
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleAddCompany = async (company) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id,
          is_primary: true
        });

      if (error) throw error;
      toast.success(`Added ${company.name} to ${contact.first_name} ${contact.last_name}`);
      onCompanyAdded();
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to associate company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      color: theme === 'light' ? '#111827' : '#F9FAFB',
      height: '500px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '500' }}>
          Add Company for {contact.first_name} {contact.last_name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Search Companies
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type company name..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `2px solid ${theme === 'light' ? '#10B981' : '#065F46'}`,
            borderRadius: '8px',
            fontSize: '16px',
            background: theme === 'light' ? '#FFFFFF' : '#374151',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        background: theme === 'light' ? '#F9FAFB' : '#374151',
        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
        borderRadius: '8px',
        height: '250px',
        overflowY: 'auto',
        flex: 1
        }}>
        {!showSuggestions ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            {searchTerm.length === 0 ? 'Start typing to search companies...' : 'Type at least 2 characters...'}
          </div>
        ) : loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Searching...
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((company) => (
            <button
              key={company.company_id || company.id}
              onClick={() => handleAddCompany(company)}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                color: theme === 'light' ? '#111827' : '#F9FAFB',
                fontSize: '14px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = theme === 'light' ? '#F3F4F6' : '#4B5563';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {company.name}
              </div>
              {company.category && (
                <div style={{
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
                  {company.category}
                </div>
              )}
            </button>
          ))
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            No companies found. Try a different search term.
          </div>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
        textAlign: 'center'
      }}>
        <p style={{
          margin: '0 0 16px 0',
          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
          fontSize: '14px'
        }}>
          Can't find the company? You can create a new one from the contact detail page.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            background: theme === 'light' ? '#F3F4F6' : '#374151',
            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            color: theme === 'light' ? '#374151' : '#D1D5DB',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ContactsListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const ContactCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: center;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ContactCardContent = styled.div`
  flex: 1;
  cursor: pointer;
  min-width: 0;
`;

const ContactCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ContactAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  border: 2px solid #E5E7EB;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9CA3AF;
    font-size: 20px;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 18px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PriorityIndicator = styled.div`
  background: ${props => {
    const label = props.children;

    // Spam counter badges
    if (label && label.toString().includes('x')) {
      return '#EF4444'; // Red for spam
    }

    // Category badges
    if (label === 'Founder') return '#7C3AED';           // Purple for Founder
    if (label === 'Professional Investor') return '#059669';  // Green for Professional Investor
    if (label === 'Team') return '#0284C7';             // Blue for Team
    if (label === 'Advisor') return '#DC2626';          // Red for Advisor
    if (label === 'Supplier') return '#EA580C';         // Orange for Supplier
    if (label === 'Manager') return '#7C2D12';          // Brown for Manager
    if (label === 'Institution') return '#1F2937';      // Gray for Institution
    if (label === 'Media') return '#BE185D';            // Pink for Media
    if (label === 'Friend and Family') return '#16A34A'; // Light green for Friend and Family
    if (label === 'No Category' || label === 'Not Set') return '#6B7280'; // Gray for No Category

    // Time-based badges (original colors)
    if (label === 'today') return '#10B981';          // Bright green for today
    if (label === 'yesterday') return '#34D399';      // Light green for yesterday
    if (label === 'this week') return '#F59E0B';      // Yellow for this week
    if (label === 'this month') return '#F97316';     // Orange for this month
    if (label === 'this quarter') return '#EF4444';   // Red for this quarter
    if (label === 'this year') return '#DC2626';      // Dark red for this year
    if (label === 'ages ago') return '#7F1D1D';       // Very dark red for ages ago

    return '#6B7280'; // Default gray
  }};
  color: white;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 6px;
  min-width: fit-content;
  text-align: center;
  white-space: nowrap;
`;

const ContactRole = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  margin-bottom: 4px;
`;

const ContactRoleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const ContactScoreStars = styled.div`
  display: flex;
  align-items: center;
`;

const ContactCompany = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  ${props => props.$clickable && `
    &:hover {
      color: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
      transform: translateX(2px);
    }
  `}

  svg {
    font-size: 12px;
  }
`;

const AddCompanyButton = styled.div`
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    transform: translateX(2px);
  }

  svg {
    font-size: 12px;
    color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  }
`;

const SmartSuggestion = styled.div`
  color: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  max-width: fit-content;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 5px;
    gap: 3px;
  }
`;

const SuggestionText = styled.div`
  flex: 1;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const SuggestionActions = styled.div`
  display: flex;
  gap: 3px;

  @media (max-width: 768px) {
    gap: 2px;
  }
`;

const SuggestionButton = styled.button`
  padding: 3px 6px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 20px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => props.variant === 'accept' ? `
    background: ${props.theme === 'light' ? '#10B981' : '#059669'};
    color: white;
    &:hover {
      background: ${props.theme === 'light' ? '#059669' : '#047857'};
    }
  ` : `
    background: ${props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    color: white;
    &:hover {
      background: ${props.theme === 'light' ? '#6B7280' : '#4B5563'};
    }
  `}

  @media (max-width: 768px) {
    padding: 2px 4px;
    font-size: 10px;
    min-width: 18px;
    height: 20px;
  }
`;

const ContactCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContactDetail = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 12px;
    flex-shrink: 0;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ContactCardActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
`;

const CardActionButton = styled.button`
  background: ${props =>
    props.$edit ? '#10B981' :                    // Green for edit
    props.$skip ? '#F59E0B' :                    // Yellow for skip
    props.$delete ? '#EF4444' :                  // Red for delete
    props.$frequency ? '#3B82F6' :               // Blue for frequency
    props.$removeKeepInTouch ? '#EF4444' :       // Red for remove keep in touch
    props.$communication ? '#10B981' :           // Green for communication (interactions page)
    props.$keepInTouch ? '#EF4444' :            // Red/Pink for keep in touch (interactions page)
    props.$settings ? '#6B7280' :               // Gray for settings (interactions page)
    '#6B7280'                                    // Default gray
  };
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    transform: scale(1.1);
    background: ${props =>
      props.$edit ? '#059669' :                  // Darker green for edit
      props.$skip ? '#D97706' :                  // Darker yellow for skip
      props.$delete ? '#DC2626' :                // Darker red for delete
      props.$frequency ? '#2563EB' :             // Darker blue for frequency
      props.$removeKeepInTouch ? '#DC2626' :     // Darker red for remove keep in touch
      '#4B5563'                                  // Darker gray for default
    };
  }

  &:active {
    transform: scale(0.95);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
`;

// Modal Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const ContactSummary = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#E2E8F0'};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  div {
    margin: 4px 0;
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#1F2937' : '#1F2937'};
  }
`;

const WarningText = styled.div`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#F59E0B'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#F59E0B' : '#D97706'};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  margin: 20px 0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#FFFFFF'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#E5E7EB'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#F3F4F6'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#D1D5DB'};
  }

  label {
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#374151' : '#374151'};
    cursor: pointer;
    flex: 1;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Keep in Touch specific styled components
const KeepInTouchFrequencyBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#EBF4FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
  text-transform: uppercase;
`;

const KeepInTouchStatus = styled.div`
  color: ${props => props.$urgencyColor};
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Keep in Touch specific styled components for actions and modal
const FrequencyModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

const FrequencyModalHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    font-size: 18px;
    font-weight: 600;
  }
`;

const FrequencyModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  }
`;

const FrequencyModalBody = styled.div`
  padding: 20px;
`;

const ContactNameDisplay = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
`;

const FrequencyOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

const FrequencyOption = styled.button`
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F9FAFB' : '#374151')
  };
  color: ${props => props.$selected
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#111827' : '#F9FAFB')
  };
  border: 1px solid ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  text-align: left;

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#F3F4F6' : '#4B5563')
    };
  }
`;

const UpdateFrequencyButton = styled.button`
  background: #10B981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BirthdayInputContainer = styled.div`
  margin-bottom: 20px;
`;

const BirthdayLabel = styled.label`
  display: block;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const BirthdayInput = styled.input`
  width: 100%;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    ring: 2px solid ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  &::-webkit-calendar-picker-indicator {
    filter: ${props => props.theme === 'light' ? 'none' : 'invert(1)'};
  }
`;

const InfoIconButton = styled.button`
  width: 100%;
  height: 100%;
  background: #F3F4F6;
  border: none;
  border-radius: 50%;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: #E5E7EB;
    color: #374151;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default ContactsList;
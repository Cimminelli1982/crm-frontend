import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaEdit, FaClock, FaTimes, FaCalendarAlt, FaHeart, FaCog, FaInfoCircle, FaStar, FaPlus, FaBriefcase, FaLink, FaHandshake, FaBolt, FaTrash, FaMapMarkerAlt, FaTag, FaExternalLinkAlt, FaSkull } from 'react-icons/fa';
import { FiSkipForward, FiAlertTriangle, FiX, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
import { CityManagementModal, TagManagementModal } from './RelatedSection';
import FindDuplicatesModal from './FindDuplicatesModal';
import ContactEnrichModal from './modals/ContactEnrichModal';
import CreateCompanyModal from './modals/CreateCompanyModal';
import ContactCard from './ContactCard';
import DeleteContactModal from './DeleteContactModal';
import KeepInTouchModal from './KeepInTouchModal';
import FrequencyModal from './FrequencyModal';
import CommunicationModal from './CommunicationModal';
import BirthdayModal from './BirthdayModal';
import PowerupsMenuModal from './PowerupsMenuModal';
import QuickEditModal from './QuickEditModal';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
import { useContactsData } from '../hooks/useContactsData';
// Import all styled components
import {
  LoadingContainer,
  LoadingText,
  ContactsListContainer,
  EmptyState,
  EmptyIcon,
  EmptyTitle,
  EmptyText,
  ModalHeader,
  CloseButton,
  ModalContent,
  ButtonGroup,
  CancelButton,
  FrequencyModalContent,
  FrequencyModalHeader,
  FrequencyModalCloseButton,
  FrequencyModalBody,
  ContactNameDisplay,
  FrequencyOptionsContainer,
  FrequencyOption,
  UpdateFrequencyButton,
  BirthdayInputContainer,
  BirthdayLabel,
  BirthdayInput,
  InfoIconButton,
  QuickEditAssociateCompanyModal,
  QuickEditTabMenu,
  QuickEditTab,
  QuickEditCompanyModalContainer,
  QuickEditCompanyModalHeader,
  QuickEditCompanyModalTitle,
  QuickEditCompanyModalCloseButton,
  QuickEditCompanyModalContent,
  QuickEditCompanyModalSection,
  QuickEditCompanyModalSectionTitle,
  QuickEditCompanyEmptyMessage,
  QuickEditCompanyList,
  QuickEditCompanyTag,
  QuickEditCompanyTagContent,
  QuickEditCompanyTagName,
  QuickEditPrimaryBadge,
  QuickEditCompanyTagDetails,
  QuickEditCompanyRemoveButton,
  QuickEditCompanySearchContainer,
  QuickEditCompanySearchInput,
  QuickEditCompanySuggestionsContainer,
  QuickEditCompanySuggestionItem,
  PowerupsMenuContainer,
  PowerupsMenuHeader,
  PowerupsMenuTitle,
  PowerupsMenuCloseButton,
  PowerupsMenuContent,
  PowerupsMenuItem,
  PowerupsMenuIcon,
  PowerupsMenuText,
  PowerupsMenuItemTitle,
  PowerupsMenuItemSubtitle
} from './ContactsListDRY.styles';

const ContactsListDRY = ({
  dataSource = null, // { type: 'interactions', timeFilter: 'Today' } or { type: 'spam', subCategory: 'Email' } etc.
  refreshTrigger = 0, // External trigger to refresh data
  onDataLoad = null, // Callback when data is loaded
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

  // Use the new data fetching hook
  const { contacts, loading, refetch } = useContactsData(dataSource, refreshTrigger, onDataLoad);

  // Update data when external onContactUpdate is called
  const handleContactUpdate = async () => {
    await refetch();
    if (onContactUpdate) onContactUpdate();
  };

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

  // Keep in Touch frequency modal state
  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [contactForFrequency, setContactForFrequency] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState('');

  // Birthday edit modal state
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [contactForBirthday, setContactForBirthday] = useState(null);

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
    birthdayDay: '',
    birthdayMonth: '',
    ageEstimate: '',
    christmasWishes: '',
    easterWishes: ''
  });

  // Quick Edit Modal - use the custom hook
  const quickEditModal = useQuickEditModal(handleContactUpdate);

  // Destructure for backward compatibility
  const {
    quickEditContactModalOpen,
    contactForQuickEdit,
    showMissingFieldsOnly,
    quickEditActiveTab,
    setQuickEditActiveTab,
    quickEditDescriptionText,
    setQuickEditDescriptionText,
    quickEditJobRoleText,
    setQuickEditJobRoleText,
    quickEditContactCategory,
    setQuickEditContactCategory,
    quickEditContactScore,
    setQuickEditContactScore,
    quickEditFirstName,
    setQuickEditFirstName,
    quickEditLastName,
    setQuickEditLastName,
    quickEditLinkedin,
    setQuickEditLinkedin,
    quickEditKeepInTouchFrequency,
    setQuickEditKeepInTouchFrequency,
    quickEditBirthdayDay,
    setQuickEditBirthdayDay,
    quickEditBirthdayMonth,
    setQuickEditBirthdayMonth,
    quickEditAgeEstimate,
    setQuickEditAgeEstimate,
    quickEditChristmasWishes,
    setQuickEditChristmasWishes,
    quickEditEasterWishes,
    setQuickEditEasterWishes,
    quickEditShowMissing,
    setQuickEditShowMissing,
    quickEditContactEmails,
    setQuickEditContactEmails,
    quickEditContactMobiles,
    setQuickEditContactMobiles,
    newEmailText,
    setNewEmailText,
    newEmailType,
    setNewEmailType,
    newMobileText,
    setNewMobileText,
    newMobileType,
    setNewMobileType,
    quickEditContactCities,
    setQuickEditContactCities,
    quickEditContactTags,
    setQuickEditContactTags,
    quickEditCityModalOpen,
    setQuickEditCityModalOpen,
    quickEditTagModalOpen,
    setQuickEditTagModalOpen,
    quickEditAssociateCompanyModalOpen,
    setQuickEditAssociateCompanyModalOpen,
    quickEditContactCompanies,
    setQuickEditContactCompanies,
    // Handlers
    openModal: handleOpenQuickEditContactModal,
    closeModal,
    handleSaveQuickEditContact,
    handleAddEmail,
    handleRemoveEmail,
    handleUpdateEmailType,
    handleSetEmailPrimary,
    handleAddMobile,
    handleRemoveMobile,
    handleUpdateMobileType,
    handleSetMobilePrimary,
    handleRemoveCity,
    handleRemoveTag,
    handleUpdateCompanyRelationship,
    handleUpdateCompanyCategory,
    handleSaveQuickEditFrequency,
    handleSaveQuickEditBirthday,
    handleSaveQuickEditChristmasWishes,
    handleSaveQuickEditEasterWishes,
    handleAutomation,
    handleQuickEditCompanyAdded,
    handleQuickEditCityAdded,
    handleQuickEditTagAdded,
  } = quickEditModal;

  // Additional state for Create Company Modal (not in hook)
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [createCompanyInitialName, setCreateCompanyInitialName] = useState('');

  // Company association modal state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedContactForCompany, setSelectedContactForCompany] = useState(null);
  // Smart company suggestions state
  const [companySuggestions, setCompanySuggestions] = useState({});

  // Powerups menu modal state
  const [powerupsMenuOpen, setPowerupsMenuOpen] = useState(false);
  const [contactForPowerups, setContactForPowerups] = useState(null);

  // Find Duplicates modal state
  const [findDuplicatesModalOpen, setFindDuplicatesModalOpen] = useState(false);
  const [contactForDuplicates, setContactForDuplicates] = useState(null);

  // Contact Enrich modal state
  const [contactEnrichModalOpen, setContactEnrichModalOpen] = useState(false);
  const [contactForEnrich, setContactForEnrich] = useState(null);


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

  const handleOpenPowerupsMenu = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForPowerups(contact);
    setPowerupsMenuOpen(true);
  };

  const handleOpenFindDuplicatesModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForDuplicates(contact);
    setFindDuplicatesModalOpen(true);
    setPowerupsMenuOpen(false); // Close powerups menu
  };

  const handleOpenContactEnrichModal = (contact, e) => {
    if (e) e.stopPropagation();
    // Check if LinkedIn URL is missing
    if (contact.linkedin) {
      toast.error('Contact already has a LinkedIn URL. Use the existing LinkedIn enrichment feature.');
      return;
    }
    setContactForEnrich(contact);
    setContactEnrichModalOpen(true);
    setPowerupsMenuOpen(false); // Close powerups menu
  };

  const handleMergeContact = (sourceContact, targetContact) => {
    // TODO: Implement contacts merging modal
    console.log('Open contacts merging modal:', sourceContact?.first_name, sourceContact?.last_name, 'with', targetContact?.first_name, targetContact?.last_name);
    toast.success('Merging functionality will be implemented in the next step');
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
      if (handleContactUpdate) handleContactUpdate();
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
      if (handleContactUpdate) handleContactUpdate();
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


  // Handle opening birthday modal
  const handleOpenBirthdayModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForBirthday(contact);
    setBirthdayModalOpen(true);
  };


  // Handle opening communication modal (for interactions page)
  const handleOpenCommunicationModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForCommunication(contact);
    setCommunicationModalOpen(true);
  };

  // Handle opening missing fields modal (completeness-focused Quick Edit)
  const handleOpenMissingFieldsModal = async (contact, e) => {
    if (e) e.stopPropagation();
    // Reuse the existing Quick Edit modal but in "missing fields" mode
    await handleOpenQuickEditContactModal(contact, e, true);
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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading keep in touch data:', error);
      }

      // Pre-populate form with existing data
      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);
      setKeepInTouchFormData({
        frequency: existingKeepInTouchData?.frequency || '',
        birthday: contact.birthday || '',
        birthdayDay: birthdayComponents.day,
        birthdayMonth: birthdayComponents.month,
        ageEstimate: birthdayComponents.ageEstimate,
        christmasWishes: existingKeepInTouchData?.christmas || '',
        easterWishes: existingKeepInTouchData?.easter || ''
      });
    } catch (error) {
      console.error('Error loading keep in touch data:', error);
      // Set default values if loading fails
      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);
      setKeepInTouchFormData({
        frequency: '',
        birthday: contact.birthday || '',
        birthdayDay: birthdayComponents.day,
        birthdayMonth: birthdayComponents.month,
        ageEstimate: birthdayComponents.ageEstimate,
        christmasWishes: '',
        easterWishes: ''
      });
    }

    setKeepInTouchModalOpen(true);
  };

  // Calculate birthday from day, month and age estimate
  const calculateBirthdayFromComponents = (day, month, ageEstimate) => {
    if (!day || !month || !ageEstimate) return '';

    const currentYear = new Date().getFullYear();
    let birthYear;

    if (ageEstimate === '80+') {
      birthYear = currentYear - 85; // Use 85 as average for 80+
    } else {
      birthYear = currentYear - parseInt(ageEstimate);
    }

    // Format as YYYY-MM-DD for database storage
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${birthYear}-${paddedMonth}-${paddedDay}`;
  };

  // Parse existing birthday into components
  const parseBirthdayIntoComponents = (birthday) => {
    if (!birthday) return { day: '', month: '', ageEstimate: '' };

    try {
      const date = new Date(birthday);
      const currentYear = new Date().getFullYear();
      const birthYear = date.getFullYear();
      const age = currentYear - birthYear;

      // Find closest age estimate
      const ageOptions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      let closestAge = '80+';

      if (age <= 82) {
        closestAge = ageOptions.reduce((prev, curr) =>
          Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
        ).toString();
      }

      return {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        ageEstimate: closestAge
      };
    } catch (error) {
      console.error('Error parsing birthday:', error);
      return { day: '', month: '', ageEstimate: '' };
    }
  };

  // Get contact completeness score from database view
  const getContactCompleteness = (contact) => {
    // The completeness_score should come from the contact_completeness view
    // If it's not available, fallback to a basic calculation
    if (contact.completeness_score !== undefined) {
      return parseInt(contact.completeness_score);
    }

    // Fallback for cases where view data isn't loaded
    return 50; // Default neutral score
  };

  // Helper functions for missing fields modal - simplified approach
  const getMissingFields = (contact) => {
    if (!contact) return {
      info: [],
      contacts: [],
      work: [],
      related: [],
      keepInTouch: []
    };

    const missing = {
      info: [],
      contacts: [],
      work: [],
      related: [],
      keepInTouch: []
    };

    // Info tab missing fields - exactly match the scoring logic
    if (!contact.first_name || !contact.first_name.trim()) missing.info.push('first_name');
    if (!contact.last_name || !contact.last_name.trim()) missing.info.push('last_name');
    if (!contact.category) missing.info.push('category');
    if (!contact.score || contact.score <= 0) missing.info.push('score');
    if (!contact.description || !contact.description.trim()) missing.info.push('description');

    // Work tab fields
    if (!contact.job_role || !contact.job_role.trim()) missing.work.push('job_role');
    if (!contact.linkedin || !contact.linkedin.trim()) missing.work.push('linkedin');

    // Contacts tab - check if contact has emails/mobiles arrays
    if (!contact.contact_emails || contact.contact_emails.length === 0) missing.contacts.push('email');
    if (!contact.contact_mobiles || contact.contact_mobiles.length === 0) missing.contacts.push('mobile');

    // Work tab - check if contact has companies
    if (!contact.companies || contact.companies.length === 0) missing.work.push('company');

    // Related tab - only check if arrays are explicitly empty (not undefined/not loaded)
    // We can't assume undefined means missing since it might just not be loaded
    if (contact.contact_cities !== undefined && (!contact.contact_cities || contact.contact_cities.length === 0)) missing.related.push('cities');
    if (contact.contact_tags !== undefined && (!contact.contact_tags || contact.contact_tags.length === 0)) missing.related.push('tags');

    // Keep in Touch tab - check actual values (including birthday which is in this tab)
    if (!contact.birthday) missing.keepInTouch.push('birthday');
    if (!contact.keep_in_touch_frequency && !contact.kit_frequency) missing.keepInTouch.push('frequency');
    if (!contact.christmas) missing.keepInTouch.push('christmas');
    if (!contact.easter) missing.keepInTouch.push('easter');

    console.log('Simplified missing analysis for:', contact.first_name, contact.last_name);
    console.log('Contact arrays check:', {
      contact_emails: contact.contact_emails,
      contact_mobiles: contact.contact_mobiles,
      companies: contact.companies,
      contact_cities: contact.contact_cities,
      contact_tags: contact.contact_tags,
      birthday: contact.birthday,
      christmas: contact.christmas,
      easter: contact.easter
    });
    console.log('Missing:', missing);

    return missing;
  };

  const getVisibleTabs = (contact, forceShowMissing = null) => {
    if (!contact) return [];

    const showMissing = forceShowMissing !== null ? forceShowMissing : showMissingFieldsOnly;

    if (!showMissing) {
      // Show all tabs in normal mode
      return [
        { id: 'Info', label: 'Info', icon: FaInfoCircle },
        { id: 'Contacts', label: 'Contacts', icon: FaEnvelope },
        { id: 'Work', label: 'Work', icon: FaBriefcase },
        { id: 'Related', label: 'Related', icon: FaLink },
        { id: 'Keep in touch', label: 'Keep in touch', icon: FaHandshake }
      ];
    }

    // In missing fields mode, only show tabs that have missing fields
    const allTabs = [
      { id: 'Info', label: 'Info', icon: FaInfoCircle },
      { id: 'Contacts', label: 'Contacts', icon: FaEnvelope },
      { id: 'Work', label: 'Work', icon: FaBriefcase },
      { id: 'Related', label: 'Related', icon: FaLink },
      { id: 'Keep in touch', label: 'Keep in touch', icon: FaHandshake }
    ];

    return allTabs.filter(tab => shouldShowTab(contact, tab.id));
  };

  const shouldShowField = (contact, fieldName) => {
    if (!contact || !showMissingFieldsOnly) return true;


    // Direct field checking - show field if it's missing/empty
    switch (fieldName) {
      case 'first_name': return !contact.first_name || !contact.first_name.trim();
      case 'last_name': return !contact.last_name || !contact.last_name.trim();
      case 'category': return !contact.category || contact.category === 'Not Set';
      case 'score': return !contact.score || contact.score <= 0;
      case 'description': return !contact.description || !contact.description.trim();
      case 'job_role': return !contact.job_role || !contact.job_role.trim();
      case 'linkedin': return !contact.linkedin || !contact.linkedin.trim();
      case 'email': return contact.contact_emails !== undefined && (!contact.contact_emails || contact.contact_emails.length === 0);
      case 'mobile': return contact.contact_mobiles !== undefined && (!contact.contact_mobiles || contact.contact_mobiles.length === 0);
      case 'company': return !contact.companies || contact.companies.length === 0;
      case 'cities': return contact.contact_cities !== undefined && (!contact.contact_cities || contact.contact_cities.length === 0);
      case 'tags': return contact.contact_tags !== undefined && (!contact.contact_tags || contact.contact_tags.length === 0);
      case 'birthday': return !contact.birthday || contact.birthday === null || contact.birthday === '' || (typeof contact.birthday === 'string' && contact.birthday.trim() === '');
      case 'frequency': return !contact.keep_in_touch_frequency;
      case 'christmas': return !contact.christmas || contact.christmas === 'no wishes set';
      case 'easter': return !contact.easter || contact.easter === 'no wishes set';
      default: return false;
    }
  };

  // Check if a tab should be shown (show tab if at least one field in it should be shown)
  const shouldShowTab = (contact, tabName) => {
    if (!contact || !showMissingFieldsOnly) return true;

    const tabFields = {
      'Info': ['first_name', 'last_name', 'category', 'score', 'description'],
      'Contacts': ['email', 'mobile'],
      'Work': ['job_role', 'linkedin', 'company'],
      'Related': ['cities', 'tags'],
      'Keep in touch': ['birthday', 'frequency', 'christmas', 'easter']
    };

    const fieldsForTab = tabFields[tabName] || [];
    const showTab = fieldsForTab.some(field => shouldShowField(contact, field));


    return showTab;
  };

  // Get completeness display info (icon, color, text)
  const getCompletenessDisplay = (completenessScore) => {
    if (completenessScore >= 100) {
      return {
        icon: '⭐',
        color: '#10B981', // Green
        backgroundColor: '#10B981',
        text: 'Perfect',
        title: `${completenessScore}% Complete - Perfect!`
      };
    } else if (completenessScore > 80) {
      return {
        icon: '🟢',
        color: '#34D399', // Lighter green
        backgroundColor: '#34D399',
        text: 'Complete',
        title: `${completenessScore}% Complete - Excellent!`
      };
    } else if (completenessScore >= 60) {
      return {
        icon: '🟡',
        color: '#F59E0B', // Yellow
        backgroundColor: '#F59E0B',
        text: 'Good',
        title: `${completenessScore}% Complete - Almost there!`
      };
    } else {
      return {
        icon: '🔴',
        color: '#EF4444', // Red
        backgroundColor: '#EF4444',
        text: 'Incomplete',
        title: `${completenessScore}% Complete - Missing fields`
      };
    }
  };

  // Handle form field changes
  const handleKeepInTouchFormChange = (field, value) => {
    setKeepInTouchFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate birthday when any component changes
      if (['birthdayDay', 'birthdayMonth', 'ageEstimate'].includes(field)) {
        const day = field === 'birthdayDay' ? value : prev.birthdayDay;
        const month = field === 'birthdayMonth' ? value : prev.birthdayMonth;
        const age = field === 'ageEstimate' ? value : prev.ageEstimate;

        updated.birthday = calculateBirthdayFromComponents(day, month, age);
      }

      return updated;
    });
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
        .maybeSingle();

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
      if (handleContactUpdate) {
        handleContactUpdate();
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
      if (handleContactUpdate) handleContactUpdate();
    } catch (error) {
      console.error('Error removing birthday:', error);
      toast.error('Failed to remove birthday');
    }
  };

  // Quick Edit handlers are now coming from the useQuickEditModal hook

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

  // Fetch company suggestion based on email domain with sophisticated matching
  const fetchCompanySuggestion = async (contact) => {
    try {
      // Use email from contact object if available (already loaded), otherwise fetch it
      let email;

      if (contact.contact_emails && contact.contact_emails.length > 0) {
        // Email already loaded with the contact
        email = contact.contact_emails[0].email;
        console.log(`Using loaded email for ${contact.first_name}: ${email}`);
      } else {
        console.log(`No contact_emails for ${contact.first_name}, fetching from DB`);
        // Fallback: fetch from database (for cases where emails weren't included in query)
        const { data: emailData, error: emailError } = await supabase
          .from('contact_emails')
          .select('email')
          .eq('contact_id', contact.contact_id)
          .limit(1);

        if (emailError || !emailData?.length) {
          return null;
        }
        email = emailData[0].email;
      }
      const domain = extractBusinessDomain(email);

      if (!domain) return null;

      // Step 1: Try exact domain match first
      const { data: exactMatches, error: exactError } = await supabase
        .from('company_domains')
        .select(`
          domain,
          is_primary,
          companies (
            company_id,
            name,
            category,
            description,
            linkedin,
            created_at
          )
        `)
        .or(`domain.eq.${domain},domain.eq.https://${domain}/,domain.eq.http://${domain}/,domain.eq.${domain}/`);

      if (exactError) throw exactError;

      // Step 2: If multiple companies share the domain, find best match
      if (exactMatches && exactMatches.length > 0) {
        if (exactMatches.length === 1) {
          // Single match - easy case
          const companyData = exactMatches[0].companies;
          return {
            ...companyData,
            domain: exactMatches[0].domain,
            is_primary_domain: exactMatches[0].is_primary,
            suggestionType: 'existing'
          };
        } else {
          // Multiple companies share this domain - need intelligent selection
          console.log(`🤔 Found ${exactMatches.length} companies sharing domain: ${domain}`);

          // Get contact's name for similarity matching
          const contactName = `${contact.first_name} ${contact.last_name}`.toLowerCase();

          // Score each company based on various factors
          let bestMatch = null;
          let bestScore = -1;

          for (const match of exactMatches) {
            const companyData = match.companies;
            let score = 0;

            // Factor 1: Primary domain gets bonus
            if (match.is_primary) score += 10;

            // Factor 2: Company name similarity to contact name
            const companyName = companyData.name.toLowerCase();
            if (contactName.includes(companyName.split(' ')[0]) ||
                companyName.includes(contactName.split(' ')[0])) {
              score += 20;
            }

            // Factor 3: Prefer more specific/longer company names (less generic)
            score += Math.min(companyData.name.length / 5, 10);

            // Factor 4: Recent activity bonus (newer companies might be more relevant)
            const daysSinceCreation = (new Date() - new Date(companyData.created_at)) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 365) score += 5; // Bonus for companies created in last year

            console.log(`📊 ${companyData.name}: score ${score}`);

            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                ...companyData,
                domain: match.domain,
                is_primary_domain: match.is_primary,
                suggestionType: 'existing',
                matchReason: `Best match among ${exactMatches.length} companies sharing ${domain}`
              };
            }
          }

          if (bestMatch) {
            return bestMatch;
          }
        }
      }

      // Step 3: Intelligent domain variant matching for corporate groups

      // Extract the core company name from the domain (before first dot)
      const domainParts = domain.split('.');
      const coreCompanyName = domainParts[0];

      // Only proceed if we have a meaningful company name (not generic)
      if (coreCompanyName.length > 3 && !['www', 'mail', 'email', 'app'].includes(coreCompanyName.toLowerCase())) {

        // Search for domain variants with the same core company name but different TLDs/suffixes
        const { data: variantMatches, error: variantError } = await supabase
          .from('company_domains')
          .select(`
            domain,
            is_primary,
            companies (
              company_id,
              name,
              category,
              description,
              linkedin,
              created_at
            )
          `)
          .or(`domain.ilike.${coreCompanyName}.%,domain.ilike.www.${coreCompanyName}.%,domain.ilike.%.${coreCompanyName}.%`)
          .neq('domain', domain) // Exclude exact match we already checked
          .limit(5);

        if (!variantError && variantMatches && variantMatches.length > 0) {

          // Score the matches based on domain similarity and company relevance
          let bestMatch = null;
          let bestScore = 0;

          for (const variant of variantMatches) {
            const variantCompany = variant.companies;
            let score = 0;

            // Factor 1: Exact core name match in domain gets high score
            const variantCore = variant.domain.split('.')[0].replace(/^www\./, '');
            if (variantCore.toLowerCase() === coreCompanyName.toLowerCase()) {
              score += 50;
            }

            // Factor 2: Core name appears in company name
            const companyNameLower = variantCompany.name.toLowerCase();
            if (companyNameLower.includes(coreCompanyName.toLowerCase())) {
              score += 30;
            }

            // Factor 3: Primary domain bonus
            if (variant.is_primary) {
              score += 10;
            }

            // Factor 4: Shorter, cleaner company names are preferred (less likely to be auto-generated)
            if (variantCompany.name.length < 50 && !variantCompany.name.includes('.')) {
              score += 15;
            }

            // Factor 5: Recent companies get slight bonus (more likely to be actively managed)
            const daysSinceCreation = (new Date() - new Date(variantCompany.created_at)) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 365) {
              score += 5;
            }


            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                ...variantCompany,
                domain: variant.domain,
                is_primary_domain: variant.is_primary,
                suggestionType: 'existing',
                matchReason: `Domain variant of ${coreCompanyName} group (${variant.domain})`
              };
            }
          }

          if (bestMatch && bestScore >= 30) { // Minimum threshold for confidence
            return bestMatch;
          }
        }
      }

      // Step 4: If no match found, suggest creating new company
      const companyName = domain.split('.')[0];
      const capitalizedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

      return {
        suggestionType: 'create',
        name: capitalizedName,
        website: domain,
        domain: domain,
        category: 'Corporate'
      };
    } catch (err) {
      console.error('Error fetching company suggestion:', err);
      return null;
    }
  };

  // Load company suggestions for contacts without companies (batched)
  useEffect(() => {
    console.log('[SUGGESTIONS] useEffect triggered, contacts length:', contacts.length);
    console.log('[SUGGESTIONS] pageContext:', pageContext);

    const loadSuggestions = async () => {
      const suggestions = {};
      const contactsWithoutCompanies = contacts.filter(contact => !contact.companies?.[0]);
      console.log('[SUGGESTIONS] Contacts without companies:', contactsWithoutCompanies.length);
      if (contactsWithoutCompanies.length > 0) {
        console.log('[SUGGESTIONS] First contact without company:', contactsWithoutCompanies[0]);
      }

      // Process suggestions for contacts without companies
      if (contactsWithoutCompanies.length > 0) {

        // Process in batches of 10 to avoid overwhelming the database
        const batchSize = 10;

        for (let i = 0; i < contactsWithoutCompanies.length; i += batchSize) {
          const batch = contactsWithoutCompanies.slice(i, i + batchSize);

          // Process batch in parallel
          const batchPromises = batch.map(async (contact) => {
            const suggestion = await fetchCompanySuggestion(contact);
            return { contactId: contact.contact_id, suggestion };
          });

          const batchResults = await Promise.all(batchPromises);

          // Add suggestions from this batch
          batchResults.forEach(({ contactId, suggestion }) => {
            if (suggestion) {
              suggestions[contactId] = suggestion;
            }
          });

          // Small delay between batches to be nice to the database
          if (i + batchSize < contactsWithoutCompanies.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        setCompanySuggestions(suggestions);
      }
    };

    if (contacts.length > 0) {
      loadSuggestions();
    }
  }, [contacts, pageContext]);

  // Handle accepting company suggestion
  const handleAcceptSuggestion = async (contact, company, e) => {
    if (e) e.stopPropagation();

    try {
      let companyIdToUse;

      if (company.suggestionType === 'create') {
        // Create new company first
        console.log(`🏢 Creating new company: ${company.name}`);
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            category: company.category || 'Corporate'
          })
          .select()
          .single();

        if (createError) throw createError;
        companyIdToUse = newCompany.company_id;

        // Create domain entry in company_domains table
        const { error: domainError } = await supabase
          .from('company_domains')
          .insert({
            company_id: companyIdToUse,
            domain: company.domain || company.website,
            is_primary: true
          });

        if (domainError) throw domainError;

        console.log(`✅ Created domain entry: ${company.domain || company.website} for company: ${company.name}`);
        toast.success(`Created ${company.name} company and associated with ${contact.first_name}`);
      } else {
        // Use existing company - handle different data structures
        companyIdToUse = company.company_id || company.id || company.companies?.company_id;
        toast.success(`Associated ${contact.first_name} with ${company.name}`);
      }

      // Associate contact with company
      const { error: associateError } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: companyIdToUse,
          is_primary: true
        });

      if (associateError) throw associateError;

      // Remove from suggestions and refresh contacts
      setCompanySuggestions(prev => {
        const updated = { ...prev };
        delete updated[contact.contact_id];
        return updated;
      });

      if (handleContactUpdate) handleContactUpdate();
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      toast.error(company.suggestionType === 'create' ? 'Failed to create company' : 'Failed to associate company');
    }
  };

  // Handle rejecting company suggestion (opens manual modal)
  const handleRejectSuggestion = async (contact, e) => {
    if (e) e.stopPropagation();
    setContactForQuickEdit(contact);

    // Load company associations for the contact
    try {
      const { data: companiesData, error } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          relationship,
          is_primary,
          companies (
            company_id,
            name,
            category,
            description
          )
        `)
        .eq('contact_id', contact.contact_id);

      if (error) throw error;
      setQuickEditContactCompanies(companiesData || []);
    } catch (error) {
      console.error('Error loading company associations:', error);
      setQuickEditContactCompanies([]);
    }

    setQuickEditAssociateCompanyModalOpen(true);
  };

  // Handle add company click (manual)
  const handleAddCompanyClick = (contact, e) => {
    if (e) e.stopPropagation();
    setSelectedContactForCompany(contact);
    setCompanyModalOpen(true);
  };

  // Handle delete from Quick Edit modal
  const handleDeleteFromQuickEdit = (contact) => {
    closeModal(); // Use closeModal from the hook
    handleOpenDeleteModal(contact);
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
        <ContactCard
          key={contact.contact_id}
          contact={contact}
          theme={theme}
          showActions={showActions}
          pageContext={pageContext}
          keepInTouchConfig={keepInTouchConfig}
          filterCategory={filterCategory}
          companySuggestions={companySuggestions}
          onContactClick={handleContactClick}
          onOpenQuickEditContactModal={handleOpenQuickEditContactModal}
          onOpenCommunicationModal={handleOpenCommunicationModal}
          onOpenMissingFieldsModal={handleOpenMissingFieldsModal}
          onOpenPowerupsMenu={handleOpenPowerupsMenu}
          onOpenFrequencyModal={handleOpenFrequencyModal}
          onOpenBirthdayModal={handleOpenBirthdayModal}
          onRemoveFromKeepInTouch={handleRemoveFromKeepInTouch}
          onRemoveBirthday={handleRemoveBirthday}
          onCompanyClick={handleCompanyClick}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onAddCompanyClick={handleAddCompanyClick}
          getContactPriorityScore={getContactPriorityScore}
          getContactPriorityLabel={getContactPriorityLabel}
          getContactCompleteness={getContactCompleteness}
          getCompletenessDisplay={getCompletenessDisplay}
          formatFrequency={formatFrequency}
          formatDaysUntilNext={formatDaysUntilNext}
          getUrgencyColor={getUrgencyColor}
          renderScoreStars={renderScoreStars}
        />
      ))}

      {/* Delete Modal */}
      <DeleteContactModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setContactToDelete(null);
          setAssociatedData({});
        }}
        contactToDelete={contactToDelete}
        associatedData={associatedData}
        theme={theme}
        onContactUpdate={handleContactUpdate}
      />

      {/* Frequency Modal */}
      <FrequencyModal
        isOpen={frequencyModalOpen}
        onClose={() => {
          setFrequencyModalOpen(false);
          setContactForFrequency(null);
          setSelectedFrequency('');
        }}
        contact={contactForFrequency}
        theme={theme}
        onContactUpdate={handleContactUpdate}
      />

      {/* Birthday Modal */}
      <BirthdayModal
        isOpen={birthdayModalOpen}
        onClose={() => {
          setBirthdayModalOpen(false);
          setContactForBirthday(null);
        }}
        contact={contactForBirthday}
        theme={theme}
        onContactUpdate={handleContactUpdate}
      />

      {/* Communication Modal (for interactions page) */}
      <CommunicationModal
        isOpen={communicationModalOpen}
        onClose={() => setCommunicationModalOpen(false)}
        contact={contactForCommunication}
        theme={theme}
      />

      {/* Keep in Touch Data Input Modal (for interactions page) */}
      <KeepInTouchModal
        isOpen={keepInTouchModalOpen}
        onClose={() => {
          setKeepInTouchModalOpen(false);
          setContactForKeepInTouch(null);
        }}
        contact={contactForKeepInTouch}
        theme={theme}
        onContactUpdate={handleContactUpdate}
      />

      {/* Quick Edit Contact Modal */}
      <QuickEditModal
        isOpen={quickEditContactModalOpen}
        onClose={closeModal}
        contact={contactForQuickEdit}
        theme={theme}
        showMissingFieldsOnly={showMissingFieldsOnly}
        // State props
        quickEditActiveTab={quickEditActiveTab}
        setQuickEditActiveTab={setQuickEditActiveTab}
        quickEditDescriptionText={quickEditDescriptionText}
        setQuickEditDescriptionText={setQuickEditDescriptionText}
        quickEditJobRoleText={quickEditJobRoleText}
        setQuickEditJobRoleText={setQuickEditJobRoleText}
        quickEditContactCategory={quickEditContactCategory}
        setQuickEditContactCategory={setQuickEditContactCategory}
        quickEditContactScore={quickEditContactScore}
        setQuickEditContactScore={setQuickEditContactScore}
        quickEditFirstName={quickEditFirstName}
        setQuickEditFirstName={setQuickEditFirstName}
        quickEditLastName={quickEditLastName}
        setQuickEditLastName={setQuickEditLastName}
        quickEditLinkedin={quickEditLinkedin}
        setQuickEditLinkedin={setQuickEditLinkedin}
        quickEditKeepInTouchFrequency={quickEditKeepInTouchFrequency}
        setQuickEditKeepInTouchFrequency={setQuickEditKeepInTouchFrequency}
        quickEditBirthdayDay={quickEditBirthdayDay}
        setQuickEditBirthdayDay={setQuickEditBirthdayDay}
        quickEditBirthdayMonth={quickEditBirthdayMonth}
        setQuickEditBirthdayMonth={setQuickEditBirthdayMonth}
        quickEditAgeEstimate={quickEditAgeEstimate}
        setQuickEditAgeEstimate={setQuickEditAgeEstimate}
        quickEditChristmasWishes={quickEditChristmasWishes}
        setQuickEditChristmasWishes={setQuickEditChristmasWishes}
        quickEditEasterWishes={quickEditEasterWishes}
        setQuickEditEasterWishes={setQuickEditEasterWishes}
        quickEditShowMissing={quickEditShowMissing}
        setQuickEditShowMissing={setQuickEditShowMissing}
        quickEditContactEmails={quickEditContactEmails}
        setQuickEditContactEmails={setQuickEditContactEmails}
        quickEditContactMobiles={quickEditContactMobiles}
        setQuickEditContactMobiles={setQuickEditContactMobiles}
        quickEditContactCities={quickEditContactCities}
        setQuickEditContactCities={setQuickEditContactCities}
        quickEditContactTags={quickEditContactTags}
        setQuickEditContactTags={setQuickEditContactTags}
        quickEditContactCompanies={quickEditContactCompanies}
        setQuickEditContactCompanies={setQuickEditContactCompanies}
        newEmailText={newEmailText}
        setNewEmailText={setNewEmailText}
        newEmailType={newEmailType}
        setNewEmailType={setNewEmailType}
        newMobileText={newMobileText}
        setNewMobileText={setNewMobileText}
        newMobileType={newMobileType}
        setNewMobileType={setNewMobileType}
        // Modal controls
        quickEditCityModalOpen={quickEditCityModalOpen}
        setQuickEditCityModalOpen={setQuickEditCityModalOpen}
        quickEditTagModalOpen={quickEditTagModalOpen}
        setQuickEditTagModalOpen={setQuickEditTagModalOpen}
        quickEditAssociateCompanyModalOpen={quickEditAssociateCompanyModalOpen}
        setQuickEditAssociateCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
        // Handler functions
        onSave={handleSaveQuickEditContact}
        onDelete={handleDeleteFromQuickEdit}
        handleAddEmail={handleAddEmail}
        handleRemoveEmail={handleRemoveEmail}
        handleUpdateEmailType={handleUpdateEmailType}
        handleSetEmailPrimary={handleSetEmailPrimary}
        handleAddMobile={handleAddMobile}
        handleRemoveMobile={handleRemoveMobile}
        handleUpdateMobileType={handleUpdateMobileType}
        handleSetMobilePrimary={handleSetMobilePrimary}
        handleRemoveCity={handleRemoveCity}
        handleRemoveTag={handleRemoveTag}
        handleUpdateCompanyRelationship={handleUpdateCompanyRelationship}
        handleUpdateCompanyCategory={handleUpdateCompanyCategory}
        handleSaveQuickEditFrequency={handleSaveQuickEditFrequency}
        handleSaveQuickEditBirthday={handleSaveQuickEditBirthday}
        handleSaveQuickEditChristmasWishes={handleSaveQuickEditChristmasWishes}
        handleSaveQuickEditEasterWishes={handleSaveQuickEditEasterWishes}
        handleAutomation={handleAutomation}
        // Helper functions
        getVisibleTabs={getVisibleTabs}
        shouldShowField={shouldShowField}
        categoryOptions={categoryOptions}
      />

      {/* Quick Edit Associate Company Modal */}
      <Modal
        isOpen={quickEditAssociateCompanyModalOpen}
        onRequestClose={() => setQuickEditAssociateCompanyModalOpen(false)}
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
            zIndex: 1100
          }
        }}
      >
        <QuickEditAssociateCompanyModal
          theme={theme}
          contact={contactForQuickEdit}
          contactCompanies={quickEditContactCompanies}
          onCompanyAdded={handleQuickEditCompanyAdded}
          onCompanyRemoved={handleQuickEditCompanyAdded}
          onClose={() => setQuickEditAssociateCompanyModalOpen(false)}
          onCreateCompany={(companyName) => {
            setCreateCompanyInitialName(companyName);
            setShowCreateCompanyModal(true);
            setQuickEditAssociateCompanyModalOpen(false);
          }}
        />
      </Modal>

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <CreateCompanyModal
          isOpen={showCreateCompanyModal}
          onRequestClose={() => {
            setShowCreateCompanyModal(false);
            setCreateCompanyInitialName('');
          }}
          initialName={createCompanyInitialName}
          contactId={contactForQuickEdit?.contact_id}
          contactEmail={contactForQuickEdit?.emails?.[0]?.email || contactForQuickEdit?.email}
          theme={theme}
          isNewCrm={true}
          onCompanyCreated={(companyData) => {
            // Refresh the company list by calling the same handler
            handleQuickEditCompanyAdded();
            setShowCreateCompanyModal(false);
            setCreateCompanyInitialName('');
            toast.success(`Company "${companyData.company.name}" created and associated successfully`);
          }}
        />
      )}

      {/* Quick Edit City Modal */}
      <Modal
        isOpen={quickEditCityModalOpen}
        onRequestClose={() => setQuickEditCityModalOpen(false)}
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
            maxHeight: '80vh',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <CityManagementModal
          theme={theme}
          contact={contactForQuickEdit}
          contactCities={quickEditContactCities}
          onCityAdded={handleQuickEditCityAdded}
          onCityRemoved={handleQuickEditCityAdded}
          onClose={() => setQuickEditCityModalOpen(false)}
        />
      </Modal>

      {/* Quick Edit Tag Modal */}
      <Modal
        isOpen={quickEditTagModalOpen}
        onRequestClose={() => setQuickEditTagModalOpen(false)}
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
            maxHeight: '80vh',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <TagManagementModal
          theme={theme}
          contact={contactForQuickEdit}
          contactTags={quickEditContactTags}
          onTagAdded={handleQuickEditTagAdded}
          onTagRemoved={handleQuickEditTagAdded}
          onClose={() => setQuickEditTagModalOpen(false)}
        />
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
              if (handleContactUpdate) handleContactUpdate();
              setCompanyModalOpen(false);
              setSelectedContactForCompany(null);
            }}
          />
        )}
      </Modal>

      {/* Contacts Powerups Menu Modal */}
      <PowerupsMenuModal
        isOpen={powerupsMenuOpen}
        onClose={() => {
          setPowerupsMenuOpen(false);
          setContactForPowerups(null);
        }}
        contact={contactForPowerups}
        theme={theme}
        onEditContact={handleOpenQuickEditContactModal}
        onFindDuplicates={handleOpenFindDuplicatesModal}
        onEnrichContact={handleOpenContactEnrichModal}
      />

      {/* Find Duplicates Modal */}
      <FindDuplicatesModal
        isOpen={findDuplicatesModalOpen}
        onClose={() => {
          setFindDuplicatesModalOpen(false);
          setContactForDuplicates(null);
        }}
        contact={contactForDuplicates}
        theme={theme}
        onMergeContact={handleMergeContact}
      />

      {/* Contact Enrich Modal */}
      <ContactEnrichModal
        isOpen={contactEnrichModalOpen}
        onClose={() => {
          setContactEnrichModalOpen(false);
          setContactForEnrich(null);
        }}
        contact={contactForEnrich}
        theme={theme}
        onEnrichComplete={() => {
          setContactEnrichModalOpen(false);
          setContactForEnrich(null);
          // Refresh data if needed
          if (handleContactUpdate) {
            handleContactUpdate();
          }
        }}
      />
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
export default ContactsListDRY;

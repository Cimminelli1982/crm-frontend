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
import CompanyAssociationModal from './modals/CompanyAssociationModal';
import ContactCard from './ContactCard';
import DeleteContactModal from './DeleteContactModal';
import KeepInTouchModal from './KeepInTouchModal';
import FrequencyModal from './FrequencyModal';
import CommunicationModal from './CommunicationModal';
import BirthdayModal from './BirthdayModal';
import PowerupsMenuModal from './PowerupsMenuModal';
import QuickEditModal from './QuickEditModalRefactored';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
import { useContactsData } from '../hooks/useContactsData';
import { useKeepInTouch } from '../hooks/useKeepInTouch';
import { useCompanySuggestions } from '../hooks/useCompanySuggestions';
import {
  handleAcceptSuggestion as acceptSuggestion,
  handleRejectSuggestion as rejectSuggestion
} from '../helpers/companySuggestionHandlers';
import {
  renderScoreStars,
  getContactCompleteness,
  getCompletenessDisplay,
  getContactPriorityScore,
  getContactPriorityLabel,
  getVisibleTabs,
  shouldShowField,
  getMissingFields
} from '../helpers/contactListHelpers';
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

  // Use the Keep in Touch hook
  const {
    formatDaysUntilNext,
    formatBirthdayCountdown,
    getUrgencyColor,
    formatFrequency,
    getKeepInTouchStatus,
    getEnhancedKeepInTouchStatus,
    getKeepInTouchDisplay
  } = useKeepInTouch();

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

  // Use the company suggestions hook
  const { companySuggestions, setCompanySuggestions } = useCompanySuggestions(contacts, pageContext);

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

  // Helper wrapper functions for imported helpers
  const getVisibleTabsWithContext = (contact, forceShowMissing = null) => {
    const showMissing = forceShowMissing !== null ? forceShowMissing : showMissingFieldsOnly;
    return getVisibleTabs(contact, showMissing);
  };

  const shouldShowFieldWithContext = (contact, fieldName) => {
    return shouldShowField(contact, fieldName, showMissingFieldsOnly);
  };

  // Create a bound version for the modal that has the contact already provided
  const shouldShowFieldForModal = (fieldName) => {
    return shouldShowField(contactForQuickEdit, fieldName, showMissingFieldsOnly);
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
    const showTab = fieldsForTab.some(field => shouldShowFieldWithContext(contact, field));


    return showTab;
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

  // Handle accepting company suggestion
  const handleAcceptSuggestion = async (contact, company, e) => {
    if (e) e.stopPropagation();
    await acceptSuggestion(contact, company, setCompanySuggestions, handleContactUpdate);
  };

  // Handle rejecting company suggestion (opens manual modal)
  const handleRejectSuggestion = async (contact, e) => {
    if (e) e.stopPropagation();
    await rejectSuggestion(
      contact,
      setContactForQuickEdit,
      setQuickEditContactCompanies,
      setQuickEditAssociateCompanyModalOpen
    );
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

  // Helper functions that use imported helpers with context
  const getContactPriorityLabelWithContext = (contact) => {
    return getContactPriorityLabel(contact, filterCategory, badgeType);
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
          getContactPriorityLabel={getContactPriorityLabelWithContext}
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
        onRefresh={refetch}
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
        getVisibleTabs={getVisibleTabsWithContext}
        shouldShowField={shouldShowFieldForModal}
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
            zIndex: 1200
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
            zIndex: 1200
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
            zIndex: 1200
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

export default ContactsListDRY;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageContainer,
  Header,
  HeaderTitle,
  TabsContainer,
  Tab,
  Badge,
  UnreadDot,
  MainContent,
  EmailListPanel,
  ListHeader,
  CollapseButton,
  EmailList,
  EmailItem,
  EmailSender,
  EmailUnreadDot,
  EmailSubject,
  EmailSnippet,
  SearchContainer,
  SearchInputWrapper,
  SearchInput,
  ClearSearchButton,
  SearchResultsHeader,
  SearchResultDate,
  EmailContentPanel,
  EmailHeader,
  EmailFrom,
  EmailSubjectFull,
  EmailDate,
  EmailTo,
  EmailCc,
  EmailBody,
  EmailActions,
  AttachmentsSection,
  AttachmentsHeader,
  AttachmentsList,
  AttachmentChip,
  AttachmentSize,
  ActionBtn,
  ActionsPanel,
  ActionsPanelTabs,
  ActionTabIcon,
  ActionsPanelHeader,
  RightPanelVerticalNav,
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  ActionCardButtons,
  SmallBtn,
  ConfirmAllButton,
  EmptyState,
  PendingCount,
  ChatContainer,
  ChatMessages,
  ChatMessage,
  ChatInputContainer,
  ChatInput,
  ChatSendButton,
  TypingIndicator,
  ChatImagePreviewContainer,
  ChatImagePreview,
  ChatImageRemoveButton,
  ChatAttachButton,
  ChatMessageImages,
  QuickActionChip,
  QuickActionsContainer,
  AcceptDraftButton,
  EmailBubbleContainer,
  EmailBubble,
  EmailBubbleRemove,
  EmailBubbleInput,
  AutocompleteDropdown,
  AutocompleteItem,
  AutocompleteAvatar,
  AutocompleteInfo,
  AutocompleteName,
  AutocompleteEmail,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalBody,
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  ModalFooter,
  SendButton,
  CancelButton
} from './CommandCenterPage.styles';
import { FaEnvelope, FaWhatsapp, FaCalendar, FaCalendarAlt, FaCalendarPlus, FaChevronLeft, FaChevronRight, FaChevronDown, FaUser, FaBuilding, FaDollarSign, FaStickyNote, FaTimes, FaPaperPlane, FaTrash, FaLightbulb, FaHandshake, FaTasks, FaSave, FaArchive, FaCrown, FaPaperclip, FaRobot, FaCheck, FaCheckCircle, FaCheckDouble, FaImage, FaEdit, FaPlus, FaExternalLinkAlt, FaDownload, FaCopy, FaDatabase, FaExclamationTriangle, FaUserSlash, FaClone, FaUserCheck, FaTag, FaClock, FaBolt, FaUpload, FaFileAlt, FaLinkedin, FaSearch, FaRocket, FaGlobe, FaMapMarkerAlt, FaUsers, FaVideo, FaLink, FaList, FaSyncAlt, FaSpinner } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import QuickEditModal from '../components/QuickEditModalRefactored';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
import { getVisibleTabs, shouldShowField } from '../helpers/contactListHelpers';
import ProfileImageModal from '../components/modals/ProfileImageModal';
import { useProfileImageModal } from '../hooks/useProfileImageModal';
import useEmailThreads from '../hooks/useEmailThreads';
import useEmailCompose from '../hooks/useEmailCompose';
import useTodoistTasks from '../hooks/useTodoistTasks';
import useChatWithClaude from '../hooks/useChatWithClaude';
import useContextContacts from '../hooks/useContextContacts';
import CreateContactModalAI from '../components/modals/CreateContactModalAI';
import DomainLinkModal from '../components/modals/DomainLinkModal';
import CreateCompanyModal from '../components/modals/CreateCompanyModal';
import DeleteSkipSpamModal from '../components/DeleteSkipSpamModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import AttachmentSaveModal from '../components/modals/AttachmentSaveModal';
import DataIntegrityModal from '../components/modals/DataIntegrityModal';
import ContactEnrichmentModal from '../components/modals/ContactEnrichmentModal';
import CompanyEnrichmentModal from '../components/modals/CompanyEnrichmentModal';
import CompanyDataIntegrityModal from '../components/modals/CompanyDataIntegrityModal';
import SearchOrCreateCompanyModal from '../components/modals/SearchOrCreateCompanyModal';
import CreateCompanyFromDomainModal from '../components/modals/CreateCompanyFromDomainModal';
import LinkToExistingModal from '../components/modals/LinkToExistingModal';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import ManageContactEmailsModal from '../components/modals/ManageContactEmailsModal';
import ManageContactMobilesModal from '../components/modals/ManageContactMobilesModal';
import ManageContactTagsModal from '../components/modals/ManageContactTagsModal';
import ManageContactCitiesModal from '../components/modals/ManageContactCitiesModal';
import ManageContactCompaniesModal from '../components/modals/ManageContactCompaniesModal';
import ManageContactListsModal from '../components/modals/ManageContactListsModal';
import MergeCompanyModal from '../components/modals/MergeCompanyModal';
import CompanyTagsModal from '../components/modals/CompanyTagsModal';
import CompanyCityModal from '../components/modals/CompanyCityModal';
import CompanyMainModal from '../components/modals/CompanyMainModal';
import CreateDealAI from '../components/modals/CreateDealAI';
import { findContactDuplicatesForThread, findCompanyDuplicatesForThread } from '../utils/duplicateDetection';
import DataIntegrityTab from '../components/command-center/DataIntegrityTab';
import ChatTab from '../components/command-center/ChatTab';
import SendEmailTab from '../components/command-center/SendEmailTab';
import WhatsAppChatTab from '../components/command-center/WhatsAppChatTab';
import AITab from '../components/command-center/AITab';
import CRMTab from '../components/command-center/CRMTab';
import DealsTab from '../components/command-center/DealsTab';
import IntroductionsTab from '../components/command-center/IntroductionsTab';
import IntroductionsPanelTab from '../components/command-center/IntroductionsPanelTab';
import TasksTab from '../components/command-center/TasksTab';
import NotesTab from '../components/command-center/NotesTab';
import NotesFullTab from '../components/command-center/NotesFullTab';
import ListsTab from '../components/command-center/ListsTab';
import TasksFullTab from '../components/command-center/TasksFullTab';
import ComposeEmailModal from '../components/command-center/ComposeEmailModal';
import WhatsAppTab, { WhatsAppChatList } from '../components/command-center/WhatsAppTab';
import ContactSelector from '../components/command-center/ContactSelector';
import DataIntegrityWarningBar from '../components/command-center/DataIntegrityWarningBar';
import ContactDetailsTab from '../components/command-center/ContactDetailsTab';
import CompanyDetailsTab from '../components/command-center/CompanyDetailsTab';
import RightPanelWhatsAppTab from '../components/command-center/RightPanelWhatsAppTab';
import RightPanelEmailTab from '../components/command-center/RightPanelEmailTab';
import RelatedTab from '../components/command-center/RelatedTab';
import FilesTab from '../components/command-center/FilesTab';
import CalendarPanelTab from '../components/command-center/CalendarPanelTab';
import { useViewport } from '../hooks/useViewport';
import useDealsData from '../hooks/command-center/useDealsData';
import useIntroductionsData from '../hooks/command-center/useIntroductionsData';
import useKeepInTouchData from '../hooks/command-center/useKeepInTouchData';
import useCalendarData from '../hooks/command-center/useCalendarData';
import useWhatsAppData from '../hooks/command-center/useWhatsAppData';
import useDataIntegrity from '../hooks/command-center/useDataIntegrity';
import useEmailActions from '../hooks/command-center/useEmailActions';
import useRightPanelState from '../hooks/command-center/useRightPanelState';
import { CommandCenterMobile } from '../components/mobile/command-center';
import DesktopLayout from '../components/command-center/DesktopLayout';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app'; // CRM Agent Service


/// Helper to sanitize email HTML - removes cid: image references and opens links in new tab
const sanitizeEmailHtml = (html) => {
  if (!html) return html;
  return html
    .replace(/<img[^>]*src=["']cid:[^"']*["'][^>]*>/gi, '')
    .replace(/src=["']cid:[^"']*["']/gi, 'src=""')
    .replace(/<a\s+(?![^>]*target=)/gi, '<a target="_blank" rel="noopener noreferrer" ');
};

// Parse date from selected text (Italian and English formats)
const parseDateFromText = (text) => {
  if (!text || text.length > 100) return null;

  const monthsIT = {
    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
    'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
    'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
  };

  const monthsEN = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'may': 4, 'june': 5, 'july': 6, 'august': 7,
    'september': 8, 'october': 9, 'november': 10, 'december': 11
  };

  const monthsShortEN = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
    'jun': 5, 'jul': 6, 'aug': 7,
    'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };

  const normalizedText = text.toLowerCase().trim();
  const currentYear = new Date().getFullYear();
  let match, day, month, year;

  // Pattern 1: "25 febbraio 2026" or "25 February 2026" (day month year)
  match = normalizedText.match(/(\d{1,2})\s+([a-zàèéìòù]+)\s+(\d{4})/i);
  if (match) {
    day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    year = parseInt(match[3], 10);
    month = monthsIT[monthName] ?? monthsEN[monthName] ?? monthsShortEN[monthName];
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      return new Date(year, month, day);
    }
  }

  // Pattern 2: "February 25, 2026" or "Feb 25, 2026" (month day year - US format)
  match = normalizedText.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const monthName = match[1].toLowerCase();
    day = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
    month = monthsEN[monthName] ?? monthsShortEN[monthName];
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      return new Date(year, month, day);
    }
  }

  // Pattern 3: "25/02/2026" or "25-02-2026" (European DD/MM/YYYY)
  match = normalizedText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    year = parseInt(match[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      return new Date(year, month, day);
    }
  }

  // Pattern 4: "Feb 26" or "February 26" or "March 5th" (month day, NO year - assume current year)
  match = normalizedText.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\.?$/i);
  if (match) {
    const monthName = match[1].toLowerCase();
    day = parseInt(match[2], 10);
    month = monthsEN[monthName] ?? monthsShortEN[monthName] ?? monthsIT[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      return new Date(currentYear, month, day);
    }
  }

  // Pattern 5: "26 Feb" or "26 febbraio" or "5th March" (day month, NO year - assume current year)
  match = normalizedText.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zàèéìòù]+)\.?$/i);
  if (match) {
    day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    month = monthsIT[monthName] ?? monthsEN[monthName] ?? monthsShortEN[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      return new Date(currentYear, month, day);
    }
  }

  return null;
};

// Main Component
const CommandCenterPage = ({ theme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');

  // Viewport detection for responsive layout
  const viewport = useViewport();

  // Mobile detection for default collapsed state
  const isMobile = window.innerWidth <= 768;
  const [listCollapsed, setListCollapsed] = useState(isMobile);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(isMobile);

  // Email threads hook
  const {
    emails,
    threads,
    selectedThread,
    loading: threadsLoading,
    setEmails,
    setThreads,
    setSelectedThread,
    refreshThreads,
    removeEmailsBySender
  } = useEmailThreads(activeTab);

  // Deals pipeline hook
  const dealsHook = useDealsData(activeTab);
  const {
    DEAL_STAGES, DEAL_CATEGORIES, DEAL_CURRENCIES, DEAL_SOURCES, DEAL_RELATIONSHIP_TYPES,
    getDealCategoryColor,
    pipelineDeals, setPipelineDeals, selectedPipelineDeal, setSelectedPipelineDeal,
    dealsLoading, dealsSections,
    stageDropdownOpen, setStageDropdownOpen,
    categoryDropdownOpen, setCategoryDropdownOpen,
    sourceDropdownOpen, setSourceDropdownOpen,
    investmentEditOpen, setInvestmentEditOpen,
    investmentEditValue, setInvestmentEditValue,
    currencyEditValue, setCurrencyEditValue,
    titleEditOpen, setTitleEditOpen,
    titleEditValue, setTitleEditValue,
    descriptionEditOpen, setDescriptionEditOpen,
    descriptionEditValue, setDescriptionEditValue,
    addContactModalOpen, setAddContactModalOpen,
    contactSearchQuery, setContactSearchQuery,
    contactSearchResults, contactSearchLoading,
    selectedContactRelationship, setSelectedContactRelationship,
    addDealCompanyModalOpen, setAddDealCompanyModalOpen,
    dealCompanySearchQuery, dealCompanySearchResults, dealCompanySearchLoading,
    addDealAttachmentModalOpen, setAddDealAttachmentModalOpen,
    dealAttachmentSearchQuery, dealAttachmentSearchResults,
    dealAttachmentSearchLoading, dealAttachmentUploading,
    dealAttachmentFileInputRef,
    createDealModalOpen, setCreateDealModalOpen,
    createDealAIOpen, setCreateDealAIOpen,
    newDealForm, setNewDealForm,
    handlePipelineDealStageChange, handleUpdateDealCategory,
    handleUpdateDealSource, handleUpdateDealInvestment,
    handleUpdateDealTitle, handleUpdateDealDescription,
    handleRemoveDealContact, handleRemoveDealCompany,
    handleSearchContacts, handleAddDealContact,
    handleSearchDealCompanies, handleAddDealCompany,
    handleSearchDealAttachments, handleAddDealAttachment,
    handleRemoveDealAttachment, handleUploadDealAttachment,
    handleDeleteDeal, handleCreateDeal,
    toggleDealsSection, filterDealsByStatus,
  } = dealsHook;

  // Introductions hook
  const introductionsHook = useIntroductionsData(activeTab);
  const {
    introductionsList, setIntroductionsList,
    introductionsLoading, selectedIntroductionItem, setSelectedIntroductionItem,
    introductionsSections, setIntroductionsSections,
    introductionsActionTab, setIntroductionsActionTab,
    introContactEmails, setIntroContactEmails,
    introContactMobiles, setIntroContactMobiles,
    selectedIntroEmails, setSelectedIntroEmails,
    selectedIntroMobile, setSelectedIntroMobile,
    creatingIntroGroup, linkChatModalOpen, setLinkChatModalOpen,
    availableChatsToLink, linkingChat,
    linkEmailModalOpen, setLinkEmailModalOpen,
    availableEmailThreadsToLink,
    introEmailThread, introEmailMessages, introEmailLoading,
    introGroupMessages, introGroupLoading,
    introGroupInput, setIntroGroupInput, introGroupSending,
    introContactCompanies, introContactTags,
    introductionModalOpen, setIntroductionModalOpen,
    introductionSearchQuery, setIntroductionSearchQuery,
    introductionSearchResults, setIntroductionSearchResults,
    searchingIntroductions, setSearchingIntroductions,
    selectedIntroducer, setSelectedIntroducer,
    selectedIntroducee, setSelectedIntroducee,
    introductionStatus, setIntroductionStatus,
    introductionTool, setIntroductionTool,
    introductionCategory, setIntroductionCategory,
    introductionText, setIntroductionText,
    creatingIntroduction, setCreatingIntroduction,
    introducerSearchQuery, setIntroducerSearchQuery,
    introducerSearchResults, searchingIntroducer, setSearchingIntroducer,
    introduceeSearchQuery, setIntroduceeSearchQuery,
    introduceeSearchResults, searchingIntroducee, setSearchingIntroducee,
    selectedIntroducee2, setSelectedIntroducee2,
    introducee2SearchQuery, setIntroducee2SearchQuery,
    introducee2SearchResults, searchingIntroducee2, setSearchingIntroducee2,
    editingIntroduction, setEditingIntroduction,
    filterIntroductionsBySection, sendIntroGroupMessage,
    handleEditIntroduction, handleDeleteIntroduction,
    handleCreateIntroWhatsAppGroup, handleOpenLinkChatModal,
    handleLinkChatToIntro, handleOpenLinkEmailModal, handleLinkEmailToIntro,
  } = introductionsHook;

  // Keep in Touch hook
  const kitHook = useKeepInTouchData(activeTab);
  const {
    KEEP_IN_TOUCH_FREQUENCIES, WISHES_TYPES, KIT_EMAIL_SIGNATURE,
    keepInTouchSearchQuery, setKeepInTouchSearchQuery,
    keepInTouchSearchResults, setKeepInTouchSearchResults,
    keepInTouchSearchLoading, setKeepInTouchSearchLoading,
    isSearchingKeepInTouch, setIsSearchingKeepInTouch,
    keepInTouchContacts, setKeepInTouchContacts,
    keepInTouchLoading, setKeepInTouchLoading,
    keepInTouchRefreshTrigger, setKeepInTouchRefreshTrigger,
    selectedKeepInTouchContact, setSelectedKeepInTouchContact,
    keepInTouchSections, setKeepInTouchSections,
    keepInTouchContactDetails, setKeepInTouchContactDetails,
    keepInTouchInteractions, setKeepInTouchInteractions,
    keepInTouchEmails, setKeepInTouchEmails,
    keepInTouchMobiles, setKeepInTouchMobiles,
    keepInTouchCompanies, setKeepInTouchCompanies,
    keepInTouchTags, setKeepInTouchTags,
    keepInTouchCities, setKeepInTouchCities,
    keepInTouchFullContext, setKeepInTouchFullContext,
    kitManageEmailsOpen, setKitManageEmailsOpen,
    kitManageMobilesOpen, setKitManageMobilesOpen,
    kitTagsModalOpen, setKitTagsModalOpen,
    kitCityModalOpen, setKitCityModalOpen,
    kitCompanyModalContact, setKitCompanyModalContact,
    kitEnrichmentModalOpen, setKitEnrichmentModalOpen,
    selectedKitCompanyId, setSelectedKitCompanyId,
    kitCompanyDetails, setKitCompanyDetails,
    kitCompanyDomains, setKitCompanyDomains,
    kitCompanyTags, setKitCompanyTags,
    kitCompanyCities, setKitCompanyCities,
    kitCompanyContacts, setKitCompanyContacts,
    kitCompanyLogo, setKitCompanyLogo,
    kitCompanyEnrichmentModalOpen, setKitCompanyEnrichmentModalOpen,
    kitEmailSubject, setKitEmailSubject,
    kitEmailBody, setKitEmailBody,
    kitEmailSending, setKitEmailSending,
    kitSelectedEmail, setKitSelectedEmail,
    kitTemplateDropdownOpen, setKitTemplateDropdownOpen,
    kitTemplateSearch, setKitTemplateSearch,
    kitTemplates, setKitTemplates,
    kitTemplatesLoading, setKitTemplatesLoading,
    kitTemplateDropdownRef,
    kitContactToLinkCompany, setKitContactToLinkCompany,
    handleUpdateKeepInTouchField, handleUpdateContactField,
    handleKeepInTouchSnooze, filterKeepInTouchByStatus,
    handleUpdateKitCompanyField, handleKitSendEmail,
    fetchKitTemplates, applyKitTemplate, searchKeepInTouch,
    handleOpenKeepInTouchModal, handleDoNotKeepInTouch,
  } = kitHook;

  // Calendar hook
  const calendarHook = useCalendarData(activeTab);
  const {
    calendarEvents, setCalendarEvents,
    selectedCalendarEvent, setSelectedCalendarEvent,
    editingCalendarTitle, setEditingCalendarTitle,
    calendarTitleInput, setCalendarTitleInput,
    calendarViewMode, setCalendarViewMode,
    processedMeetings, setProcessedMeetings,
    calendarEventScore, setCalendarEventScore,
    calendarEventNotes, setCalendarEventNotes,
    calendarEventDescription, setCalendarEventDescription,
    selectedContactsForMeeting, setSelectedContactsForMeeting,
    calendarSearchQuery, setCalendarSearchQuery,
    calendarSearchResults, setCalendarSearchResults,
    calendarSearchLoading, setCalendarSearchLoading,
    isSearchingCalendar, setIsSearchingCalendar,
    calendarSections, setCalendarSections,
    pendingCalendarEvent, setPendingCalendarEvent,
    calendarLoading, setCalendarLoading,
    calendarEventEdits, setCalendarEventEdits,
    calendarTargetDate, setCalendarTargetDate,
    importingCalendar, setImportingCalendar,
    addMeetingContactModalOpen, setAddMeetingContactModalOpen,
    meetingContactSearchQuery, setMeetingContactSearchQuery,
    meetingContactSearchResults, setMeetingContactSearchResults,
    meetingContactSearchLoading, setMeetingContactSearchLoading,
    handleCalendarExtract, handleDeleteCalendarEvent,
    handleUpdateCalendarTitle, handleProcessCalendarEvent,
    handleDeleteProcessedMeeting, handleCreateCalendarEvent,
    toggleCalendarSection, filterCalendarEvents,
    handleSearchMeetingContacts, handleAddMeetingContact,
    handleRemoveMeetingContact, updateCalendarEventField,
    formatDate,
  } = calendarHook;

  // WhatsApp hook
  const whatsAppHook = useWhatsAppData(activeTab);
  const {
    whatsappMessages, setWhatsappMessages,
    whatsappChats, setWhatsappChats,
    selectedWhatsappChat, setSelectedWhatsappChat,
    whatsappLoading,
    whatsappRefreshTrigger, setWhatsappRefreshTrigger,
    baileysStatus, setBaileysStatus,
    showBaileysQRModal, setShowBaileysQRModal,
    whatsappSearchQuery, setWhatsappSearchQuery,
    whatsappSearchResults, setWhatsappSearchResults,
    whatsappSearchLoading,
    isSearchingWhatsapp, setIsSearchingWhatsapp,
    archivedWhatsappContact, setArchivedWhatsappContact,
    newWhatsAppModalOpen, setNewWhatsAppModalOpen,
    newWhatsAppContact, setNewWhatsAppContact,
    newWhatsAppMessage, setNewWhatsAppMessage,
    newWhatsAppSearchQuery, setNewWhatsAppSearchQuery,
    newWhatsAppSearchResults, setNewWhatsAppSearchResults,
    newWhatsAppSending, setNewWhatsAppSending,
    groupWhatsAppByChat,
    handleWhatsAppDone, handleWhatsAppDoneAsync,
    handleNewWhatsAppSearch, handleSendNewWhatsApp,
    handleWhatsAppSpam, searchSavedWhatsapp,
    handleSelectWhatsappSearchResult,
  } = whatsAppHook;


  // Expanded sections state for left panel (inbox, need_actions, waiting_input, archiving)
  const [statusSections, setStatusSections] = useState({
    inbox: true,
    need_actions: false,
    waiting_input: false,
    archiving: false
  });

  // Toggle section expansion
  const toggleStatusSection = (section) => {
    setStatusSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter threads/chats by status
  const filterByStatus = (items, status) => {
    if (status === 'inbox') return items.filter(item => !item.status);
    return items.filter(item => item.status === status);
  };

  // Email search state (for searching saved/archived emails)
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [emailSearchResults, setEmailSearchResults] = useState([]);
  const [emailSearchLoading, setEmailSearchLoading] = useState(false);
  const [isSearchingEmails, setIsSearchingEmails] = useState(false);


  // Email compose hook - handleSendWithAttachmentCheck handles post-send logic, so no callback needed
  const emailCompose = useEmailCompose(selectedThread, null);
  const {
    composeModal,
    composeTo,
    setComposeTo,
    composeCc,
    setComposeCc,
    composeToInput,
    setComposeToInput,
    composeCcInput,
    setComposeCcInput,
    composeSubject,
    setComposeSubject,
    composeBody,
    setComposeBody,
    contactSuggestions,
    setContactSuggestions,
    activeField,
    setActiveField,
    searchContacts,
    sending,
    composeAttachments,
    composeFileInputRef,
    handleComposeFileSelect,
    removeComposeAttachment,
    openReply,
    openReplyWithDraft,
    openForward,
    openAssign,
    openNewCompose,
    closeCompose,
    handleSend,
    addEmailToField,
    removeEmailFromField,
    handleEmailInputKeyDown,
    extractDraftFromMessage,
    swapToCc,
    hasDraftReply,
    getLatestEmail,
    formatRecipients,
  } = emailCompose;


  // Context contacts hook - handles Email, WhatsApp, and Calendar sources
  // (emailContacts and emailCompanies are aliases for backwards compatibility)

  // Deals from contacts and companies (for Deals tab)
  const [contactDeals, setContactDeals] = useState([]); // Deals linked to email contacts
  const [companyDeals, setCompanyDeals] = useState([]); // Deals linked to companies of email contacts
  const [refreshDealsCounter, setRefreshDealsCounter] = useState(0); // Trigger to refresh deals

  // Introductions from contacts (for right panel)
  const [contactIntroductions, setContactIntroductions] = useState([]);

  // Tasks from contacts (for compose modal)
  const [contactTasks, setContactTasks] = useState([]); // Tasks linked to email contacts
  const [dealModalOpen, setDealModalOpen] = useState(false);


  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [dealSearchResults, setDealSearchResults] = useState([]);
  const [searchingDeals, setSearchingDeals] = useState(false);
  const [newDealName, setNewDealName] = useState('');
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [selectedDealContact, setSelectedDealContact] = useState(null); // Contact to associate with deal
  const [dealRelationship, setDealRelationship] = useState('introducer'); // Relationship type


  // Todoist Tasks hook
  const todoistHook = useTodoistTasks(activeActionTab, selectedThread);
  const {
    todoistTasks,
    todoistProjects,
    loadingTasks,
    taskModalOpen,
    setTaskModalOpen,
    newTaskContent,
    setNewTaskContent,
    newTaskDueString,
    setNewTaskDueString,
    newTaskProjectId,
    setNewTaskProjectId,
    newTaskSectionId,
    setNewTaskSectionId,
    newTaskPriority,
    setNewTaskPriority,
    newTaskDescription,
    setNewTaskDescription,
    creatingTask,
    editingTask,
    expandedProjects,
    setExpandedProjects,
    expandedSections,
    setExpandedSections,
    handleSaveTask,
    handleCompleteTask,
    handleDeleteTask,
    resetTaskForm,
    openEditTask,
    getProjectColor,
  } = todoistHook;

  // Direct email/mobile management modals
  const [manageEmailsModalOpen, setManageEmailsModalOpen] = useState(false);
  const [manageMobilesModalOpen, setManageMobilesModalOpen] = useState(false);
  const [contactForManageModal, setContactForManageModal] = useState(null);

  // Context Contacts hook - handles Email, WhatsApp, Calendar, Deals sources
  const contextContactsHook = useContextContacts(activeTab, selectedThread, selectedWhatsappChat, selectedCalendarEvent, selectedPipelineDeal);
  const {
    emailContacts,
    setEmailContacts,
    emailCompanies,
    setEmailCompanies,
    loadingContacts,
    loadingCompanies,
    refetchContacts
  } = contextContactsHook;

  // Callback for syncing KIT state when right panel updates keep-in-touch
  const onKeepInTouchUpdated = useCallback(({ contactId, updates }) => {
    if (activeTab === 'keepintouch' && selectedKeepInTouchContact?.contact_id === contactId) {
      setSelectedKeepInTouchContact(prev => ({ ...prev, ...updates }));
      setKeepInTouchContacts(prev => prev.map(c =>
        c.contact_id === contactId ? { ...c, ...updates } : c
      ));
      if (updates.frequency) {
        setKeepInTouchRefreshTrigger(prev => prev + 1);
      }
    }
  }, [activeTab, selectedKeepInTouchContact?.contact_id]);

  // Right panel state hook (must be after useContextContacts so emailContacts is available)
  const rightPanelHook = useRightPanelState({
    activeTab, emailContacts,
    selectedIntroductionItem, selectedKeepInTouchContact,
    keepInTouchContactDetails, archivedWhatsappContact,
    onKeepInTouchUpdated,
  });
  const {
    activeActionTab, setActiveActionTab,
    selectedRightPanelContactId, setSelectedRightPanelContactId,
    selectedListMember, setSelectedListMember,
    tasksLinkedContacts, setTasksLinkedContacts,
    tasksLinkedChats, setTasksLinkedChats,
    tasksLinkedCompanies, setTasksLinkedCompanies,
    tasksLinkedDeals, setTasksLinkedDeals,
    tasksChatContacts, tasksCompanyContacts, tasksDealsContacts,
    notesLinkedContacts, setNotesLinkedContacts,
    notesLinkedCompanies, setNotesLinkedCompanies,
    notesLinkedDeals, setNotesLinkedDeals,
    selectedRightPanelCompanyId, setSelectedRightPanelCompanyId,
    rightPanelCompanyDetails, setRightPanelCompanyDetails,
    loadingRightPanelCompany, setLoadingRightPanelCompany,
    rightPanelCompanyRefreshKey, setRightPanelCompanyRefreshKey,
    rightPanelCompanyEnrichModalOpen, setRightPanelCompanyEnrichModalOpen,
    rightPanelAssociateCompanyModalOpen, setRightPanelAssociateCompanyModalOpen,
    companyMergeModalOpen, setCompanyMergeModalOpen,
    companyMergeCompany, setCompanyMergeCompany,
    companyMainModalOpen, setCompanyMainModalOpen,
    companyMainModalId, setCompanyMainModalId,
    initialSelectedEmail, setInitialSelectedEmail,
    initialSelectedMobile, setInitialSelectedMobile,
    initialSelectedTagId, setInitialSelectedTagId,
    rightPanelContactDetails,
    availableRightPanelContacts,
    enrichedRightPanelContacts,
  } = rightPanelHook;

  // Data Integrity hook
  const dataIntegrityHook = useDataIntegrity(
    activeTab, selectedThread, selectedWhatsappChat, selectedCalendarEvent, emailContacts,
    {
      threads, setThreads, setEmails, setSelectedThread,
      whatsappChats, setWhatsappChats, whatsappMessages, setWhatsappMessages,
      setSelectedWhatsappChat, removeEmailsBySender, refreshThreads,
    }
  );
  const {
    notInCrmEmails, setNotInCrmEmails, notInCrmDomains, setNotInCrmDomains,
    crmEmailSet, setCrmEmailSet, notInCrmTab, setNotInCrmTab,
    holdContacts, setHoldContacts, holdCompanies, setHoldCompanies, holdTab, setHoldTab,
    incompleteContacts, setIncompleteContacts, incompleteCompanies, setIncompleteCompanies,
    completenessTab, setCompletenessTab,
    duplicateContacts, setDuplicateContacts, duplicateCompanies, setDuplicateCompanies,
    duplicatesTab, setDuplicatesTab,
    categoryMissingContacts, setCategoryMissingContacts,
    categoryMissingCompanies, setCategoryMissingCompanies,
    categoryMissingTab, setCategoryMissingTab,
    keepInTouchMissingContacts, setKeepInTouchMissingContacts,
    missingCompanyLinks, setMissingCompanyLinks,
    contactsMissingCompany, setContactsMissingCompany,
    potentialCompanyMatches, setPotentialCompanyMatches,
    deleteModalOpen, setDeleteModalOpen, deleteModalContact, setDeleteModalContact,
    editCompanyModalOpen, setEditCompanyModalOpen,
    editCompanyModalCompany, setEditCompanyModalCompany,
    loadingDataIntegrity, setLoadingDataIntegrity,
    expandedDataIntegrity, setExpandedDataIntegrity,
    dataIntegrityModalOpen, setDataIntegrityModalOpen,
    dataIntegrityContactId, setDataIntegrityContactId,
    companyDataIntegrityModalOpen, setCompanyDataIntegrityModalOpen,
    companyDataIntegrityCompanyId, setCompanyDataIntegrityCompanyId,
    createCompanyFromDomainModalOpen, setCreateCompanyFromDomainModalOpen,
    createCompanyFromDomainData, setCreateCompanyFromDomainData,
    linkToExistingModalOpen, setLinkToExistingModalOpen,
    linkToExistingEntityType, setLinkToExistingEntityType,
    linkToExistingItemData, setLinkToExistingItemData,
    linkCompanyModalContact, setLinkCompanyModalContact,
    aiSuggestions, setAiSuggestions, loadingAiSuggestions,
    selectedSuggestion, setSelectedSuggestion, processingAction,
    auditResult, setAuditResult, auditActions, setAuditActions,
    selectedActions, setSelectedActions, loadingAudit, executingActions,
    suggestionsFromMessage,
    getThreadParticipants, normalizeDomain, extractDomainFromEmail, getThreadDomains,
    fetchDataIntegrity, handleAddToSpam, handlePutOnHold,
    handleEditCategoryMissingContact, handleHoldCategoryMissingContact,
    handleDeleteCategoryMissingContact, handleCloseDeleteModal,
    handleOpenAddToListModal,
    handleEditCategoryMissingCompany, handleCloseEditCompanyModal,
    handleHoldCategoryMissingCompany, handleDeleteCategoryMissingCompany,
    handleAddFromHold, handleSpamFromHold, handleOpenCreateContact,
    handleAddCompanyFromDomain, handleAddContactFromNotInCrm,
    handleCreateNewFromLinkModal, handleLinkSuccess,
    handleCreateCompanyFromDomainSuccess, handleDomainAction,
    handleAddCompanyFromHold, handleDeleteCompanyFromHold,
    handleLinkContactToCompany, handleLinkDomainToCompany,
    handleDismissPotentialMatch, handleLinkContactToCompanyByDomain,
    fetchAiSuggestions, handleSuggestionAction, triggerDuplicateScan,
    handleDismissDuplicate, handleConfirmMergeDuplicate,
    runContactAudit, executeSelectedActions, toggleActionSelection,
  } = dataIntegrityHook;

  // Email Actions hook
  const emailActionsHook = useEmailActions({
    selectedThread, emailContacts, emailCompanies,
    threads, setThreads, setEmails, setSelectedThread,
    refreshThreads, activeTab,
    handleSend, getLatestEmail,
    selectedWhatsappChat, setWhatsappChats,
    importingCalendar, setImportingCalendar,
  });
  const {
    saving, setSaving,
    pendingInboxStatusRef,
    attachmentModalOpen, setAttachmentModalOpen,
    pendingAttachments, setPendingAttachments,
    saveAndArchiveCallback, setSaveAndArchiveCallback,
    spamMenuOpen, setSpamMenuOpen,
    archiveInFastmail, shouldSkipAttachment,
    handleDoneClick, handleAttachmentModalClose,
    handleImportCalendarInvitation, isCalendarInvitation,
    handleSendWithAttachmentCheck, saveAndArchive, saveAndArchiveAsync,
    updateItemStatus, markAsSpam, deleteEmail,
  } = emailActionsHook;

  // AI Chat hook - uses keepInTouchContactDetails (from contacts table) for Claude context
  const chatHook = useChatWithClaude(selectedThread, emailContacts, activeTab, selectedWhatsappChat, emailContacts, selectedPipelineDeal, keepInTouchContactDetails, keepInTouchCompanies, keepInTouchEmails, keepInTouchMobiles, keepInTouchFullContext, keepInTouchTags, keepInTouchCities, keepInTouchInteractions);
  const {
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    setChatLoading,
    chatImages,
    setChatImages,
    chatMessagesRef,
    chatFileInputRef,
    sendMessageToClaude,
    handleQuickAction,
    handleChatImageSelect,
    removeChatImage,
    sendDuplicateMCPInstruction,
    addChatMessage,
  } = chatHook;


  // Notes state
  const [contactNotes, setContactNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState('meeting');
  const [newNoteSummary, setNewNoteSummary] = useState('');
  const [newNoteObsidianPath, setNewNoteObsidianPath] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const OBSIDIAN_VAULT = 'Living with Intention';


  // Company Tags and Cities modals (for Company Details tab)
  const [companyTagsModalOpen, setCompanyTagsModalOpen] = useState(false);
  const [companyCityModalOpen, setCompanyCityModalOpen] = useState(false);
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState(null);
  // Manage Lists modal state
  const [addToListModalOpen, setAddToListModalOpen] = useState(false);
  const [addToListContact, setAddToListContact] = useState(null);
  // Domain Link Modal state
  const [domainLinkModalOpen, setDomainLinkModalOpen] = useState(false);
  const [selectedDomainForLink, setSelectedDomainForLink] = useState(null);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [createCompanyInitialDomain, setCreateCompanyInitialDomain] = useState('');

  // Quick Edit Modal - use the custom hook
  const quickEditModal = useQuickEditModal(() => {});
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
    openModal: handleOpenQuickEditModal,
    closeModal: handleCloseQuickEditModal,
    handleSaveQuickEditContact,
    handleSilentSave,
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
    handleMarkCompleteWithCategory,
    handleAutomation,
  } = quickEditModal;

  // Profile Image Modal - use the custom hook
  const handleProfileImageUpdate = (contactId, newImageUrl) => {
    // Update the emailContacts state with the new image URL
    setEmailContacts(prevContacts =>
      prevContacts.map(p =>
        p.contact?.contact_id === contactId
          ? { ...p, contact: { ...p.contact, profile_image_url: newImageUrl } }
          : p
      )
    );

    // Update keepInTouchContactDetails if it's the same contact
    setKeepInTouchContactDetails(prev => {
      if (prev && prev.contact_id === contactId) {
        return { ...prev, profile_image_url: newImageUrl };
      }
      return prev;
    });

    // Update keepInTouchContacts list
    setKeepInTouchContacts(prevContacts =>
      prevContacts.map(c =>
        c.contact_id === contactId
          ? { ...c, profile_image_url: newImageUrl }
          : c
      )
    );

    // Refresh the right panel contact details if it's the same contact
    if (selectedRightPanelContactId === contactId && rightPanelContactDetails?.refetch) {
      rightPanelContactDetails.refetch();
    }
  };

  const profileImageModal = useProfileImageModal(handleProfileImageUpdate);

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

  // State for Create Contact Modal
  const [createContactModalOpen, setCreateContactModalOpen] = useState(false);
  const [createContactEmail, setCreateContactEmail] = useState(null);

  // State for Add Company Modal
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);

  // State for Search/Create Company Modal (CRM Tab)
  const [searchOrCreateCompanyModalOpen, setSearchOrCreateCompanyModalOpen] = useState(false);


  // Fetch AI suggestions when action tab is active
  useEffect(() => {
    if (activeActionTab === 'ai') {
      fetchAiSuggestions();
    }
  }, [activeActionTab]);

  // ===== Notes Functions =====

  // Fetch notes for the current thread's contacts
  const fetchContactNotes = async () => {
    if (!emailContacts || emailContacts.length === 0) {
      setContactNotes([]);
      return;
    }

    setLoadingNotes(true);
    try {
      // Get all contact IDs from the thread
      const contactIds = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => p.contact.contact_id);

      if (contactIds.length === 0) {
        setContactNotes([]);
        setLoadingNotes(false);
        return;
      }

      // Fetch notes linked to these contacts
      const { data: noteContacts, error: ncError } = await supabase
        .from('notes_contacts')
        .select('note_id, contact_id')
        .in('contact_id', contactIds);

      if (ncError) throw ncError;

      if (!noteContacts || noteContacts.length === 0) {
        setContactNotes([]);
        setLoadingNotes(false);
        return;
      }

      // Get unique note IDs
      const noteIds = [...new Set(noteContacts.map(nc => nc.note_id))];

      // Fetch the actual notes
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .in('note_id', noteIds)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Attach contact info to each note
      const notesWithContacts = (notes || []).map(note => {
        const linkedContactIds = noteContacts
          .filter(nc => nc.note_id === note.note_id)
          .map(nc => nc.contact_id);
        const linkedContacts = emailContacts
          .filter(p => linkedContactIds.includes(p.contact?.contact_id))
          .map(p => p.contact);
        return { ...note, linkedContacts };
      });

      setContactNotes(notesWithContacts);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch notes');
    }
    setLoadingNotes(false);
  };

  // Load notes when notes tab is active and contacts are loaded
  useEffect(() => {
    if (activeActionTab === 'notes' && emailContacts.length > 0) {
      fetchContactNotes();
    }
  }, [activeActionTab, emailContacts]);

  // Generate default Obsidian path based on note type
  const generateObsidianPath = (noteType, title) => {
    const today = new Date().toISOString().split('T')[0];
    const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '-');
    const typeFolder = {
      'meeting': 'CRM/Meetings',
      'call': 'CRM/Calls',
      'research': 'CRM/Research',
      'idea': 'CRM/Ideas',
      'follow-up': 'CRM/Follow-ups',
      'general': 'CRM/Notes'
    }[noteType] || 'CRM/Notes';
    return `${typeFolder}/${today} ${sanitizedTitle}`;
  };

  // Save a note (create or update)
  const handleSaveNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('Note title is required');
      return;
    }

    setCreatingNote(true);
    try {
      const obsidianPath = newNoteObsidianPath || generateObsidianPath(newNoteType, newNoteTitle);

      // Get linked contacts info
      const linkedContacts = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => ({
          contact_id: p.contact.contact_id,
          first_name: p.contact.first_name,
          last_name: p.contact.last_name
        }));

      if (editingNote) {
        // Update existing note in Supabase
        const { error } = await supabase
          .from('notes')
          .update({
            title: newNoteTitle,
            note_type: newNoteType,
            summary: newNoteSummary,
            obsidian_path: obsidianPath,
            last_modified_at: new Date().toISOString()
          })
          .eq('note_id', editingNote.note_id);

        if (error) throw error;
        toast.success('Note updated');
      } else {
        // Create note in Obsidian vault via backend (GitHub)
        const obsidianResponse = await fetch(`${BACKEND_URL}/obsidian/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newNoteTitle,
            noteType: newNoteType,
            summary: newNoteSummary,
            obsidianPath: obsidianPath,
            linkedContacts: linkedContacts
          })
        });

        const obsidianResult = await obsidianResponse.json();
        if (!obsidianResult.success) {
          throw new Error(obsidianResult.error || 'Failed to create note in Obsidian');
        }

        // Create note record in Supabase
        const { data: newNote, error: noteError } = await supabase
          .from('notes')
          .insert({
            title: newNoteTitle,
            note_type: newNoteType,
            summary: newNoteSummary,
            obsidian_path: obsidianPath
          })
          .select()
          .single();

        if (noteError) throw noteError;

        // Link to all contacts in the current thread
        const contactIds = linkedContacts.map(c => c.contact_id);

        if (contactIds.length > 0) {
          const noteContacts = contactIds.map(contactId => ({
            note_id: newNote.note_id,
            contact_id: contactId
          }));

          const { error: linkError } = await supabase
            .from('notes_contacts')
            .insert(noteContacts);

          if (linkError) throw linkError;
        }

        toast.success('Note created in Obsidian vault!');
      }

      resetNoteForm();
      setNoteModalOpen(false);
      fetchContactNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error.message || 'Failed to save note');
    }
    setCreatingNote(false);
  };

  // Reset note form
  const resetNoteForm = () => {
    setNewNoteTitle('');
    setNewNoteType('meeting');
    setNewNoteSummary('');
    setNewNoteObsidianPath('');
    setEditingNote(null);
  };

  // Open a note in Obsidian
  const openInObsidian = (obsidianPath) => {
    // Use the obsidian:// URL scheme to open the note
    // Format: obsidian://open?vault=VaultName&file=path/to/note
    const encodedVault = encodeURIComponent(OBSIDIAN_VAULT);
    const encodedPath = encodeURIComponent(obsidianPath);
    const obsidianUrl = `obsidian://open?vault=${encodedVault}&file=${encodedPath}`;
    // Use location.href for custom protocol - window.open may be blocked
    window.location.href = obsidianUrl;
  };

  // Create a new note in Obsidian (opens the new note dialog)
  const createInObsidian = (obsidianPath) => {
    // Use obsidian://new to create a new note
    const encodedVault = encodeURIComponent(OBSIDIAN_VAULT);
    const encodedPath = encodeURIComponent(obsidianPath);
    const obsidianUrl = `obsidian://new?vault=${encodedVault}&file=${encodedPath}`;
    window.open(obsidianUrl, '_blank');
  };

  // Open edit mode for a note
  const openEditNote = (note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteType(note.note_type || 'general');
    setNewNoteSummary(note.summary || '');
    setNewNoteObsidianPath(note.obsidian_path || '');
    setNoteModalOpen(true);
  };


  // Get note type icon
  const getNoteTypeIcon = (noteType) => {
    const icons = {
      'meeting': '📅',
      'call': '📞',
      'research': '🔬',
      'idea': '💡',
      'follow-up': '📋',
      'general': '📝'
    };
    return icons[noteType] || '📝';
  };

  // Handler for deleting deal-contact association (used by DealsTab)
  const handleDeleteDealContact = async (dealId, contactId) => {
    const { error } = await supabase
      .from('deals_contacts')
      .delete()
      .eq('deal_id', dealId)
      .eq('contact_id', contactId);
    if (!error) {
      // Refresh deals
      const contactIds = emailContacts.filter(p => p.contact?.contact_id).map(p => p.contact.contact_id);
      if (contactIds.length === 0) {
        setContactDeals([]);
        return;
      }
      const { data: refreshed } = await supabase
        .from('deals_contacts')
        .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at, deal_attachments(attachment_id, attachments(attachment_id, file_name, file_type, file_size, permanent_url)))')
        .in('contact_id', contactIds);
      if (refreshed) {
        const dealsMap = new Map();
        refreshed.forEach(dc => {
          if (!dc.deals) return;
          const dealId = dc.deals.deal_id;
          if (!dealsMap.has(dealId)) {
            dealsMap.set(dealId, { ...dc.deals, contacts: [] });
          }
          const contact = emailContacts.find(p => p.contact?.contact_id === dc.contact_id);
          if (contact) {
            dealsMap.get(dealId).contacts.push({
              contact_id: dc.contact_id,
              name: contact.contact ? `${contact.contact.first_name} ${contact.contact.last_name}` : contact.name,
              relationship: dc.relationship
            });
          }
        });
        setContactDeals(Array.from(dealsMap.values()));
      } else {
        setContactDeals([]);
      }
    }
  };

  // Handler for updating deal stage (used by ComposeEmailModal)
  const handleUpdateDealStage = async (dealId, newStage) => {
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage })
      .eq('deal_id', dealId);

    if (error) {
      toast.error('Failed to update deal stage');
      return;
    }

    toast.success(`Deal marked as ${newStage}`);

    // Update local state to remove the deal from active deals list
    setContactDeals(prev => prev.filter(deal => deal.deal_id !== dealId));
  };

  // Handler for completing a contact task (used by ComposeEmailModal)
  const handleCompleteContactTask = async (taskId, todoistId) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('task_id', taskId);

      if (error) throw error;

      // Sync to Todoist if has todoist_id
      if (todoistId) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${todoistId}/close`, {
            method: 'POST'
          });
        } catch (syncError) {
          console.warn('Failed to sync completion to Todoist:', syncError);
        }
      }

      toast.success('Task completed!');

      // Update local state to remove the task from list
      setContactTasks(prev => prev.filter(task => task.task_id !== taskId));
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  // Fetch deals linked to contacts and companies
  useEffect(() => {
    const fetchDeals = async () => {
      // Reset deals when no contacts
      if (emailContacts.length === 0) {
        setContactDeals([]);
        setCompanyDeals([]);
        return;
      }

      // Get contact IDs
      const contactIds = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => p.contact.contact_id);

      if (contactIds.length === 0) {
        setContactDeals([]);
        setCompanyDeals([]);
        return;
      }

      // Fetch deals linked to contacts via deals_contacts
      const { data: dealsContactsData, error: dcError } = await supabase
        .from('deals_contacts')
        .select(`
          deal_id,
          contact_id,
          relationship,
          deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at, deal_attachments(attachment_id, attachments(attachment_id, file_name, file_type, file_size, permanent_url)))
        `)
        .in('contact_id', contactIds);

      if (dcError) {
        console.error('Error fetching deals_contacts:', dcError);
      }

      // Build contact deals with contact info
      const contactDealsMap = new Map();
      if (dealsContactsData) {
        dealsContactsData.forEach(dc => {
          if (!dc.deals) return;
          const dealId = dc.deals.deal_id;
          if (!contactDealsMap.has(dealId)) {
            contactDealsMap.set(dealId, {
              ...dc.deals,
              contacts: []
            });
          }
          const contact = emailContacts.find(p => p.contact?.contact_id === dc.contact_id);
          if (contact) {
            contactDealsMap.get(dealId).contacts.push({
              contact_id: dc.contact_id,
              name: contact.contact ? `${contact.contact.first_name} ${contact.contact.last_name}` : contact.name,
              relationship: dc.relationship
            });
          }
        });
      }
      setContactDeals(Array.from(contactDealsMap.values()));

      // For company deals, we need to:
      // 1. Get companies linked to our contacts via contact_companies
      // 2. Then get deals linked to those companies via deals_contacts (where contacts work at those companies)
      // Since there's no direct deals_companies table, we'll derive from contact_companies
      const companyIds = emailCompanies.map(c => c.company_id).filter(Boolean);

      if (companyIds.length > 0) {
        // Get all contacts working at these companies
        const { data: companyContactsData } = await supabase
          .from('contact_companies')
          .select('contact_id, company_id')
          .in('company_id', companyIds);

        if (companyContactsData && companyContactsData.length > 0) {
          const companyContactIds = companyContactsData.map(cc => cc.contact_id);

          // Get deals for these contacts (but exclude deals we already have from direct contacts)
          const { data: companyDealsData } = await supabase
            .from('deals_contacts')
            .select(`
              deal_id,
              contact_id,
              relationship,
              deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at, deal_attachments(attachment_id, attachments(attachment_id, file_name, file_type, file_size, permanent_url)))
            `)
            .in('contact_id', companyContactIds);

          const companyDealsMap = new Map();
          if (companyDealsData) {
            companyDealsData.forEach(dc => {
              if (!dc.deals) return;
              // Skip deals already in contactDeals
              if (contactDealsMap.has(dc.deals.deal_id)) return;

              const dealId = dc.deals.deal_id;
              if (!companyDealsMap.has(dealId)) {
                // Find which company this contact belongs to
                const companyContact = companyContactsData.find(cc => cc.contact_id === dc.contact_id);
                const company = emailCompanies.find(c => c.company_id === companyContact?.company_id);

                companyDealsMap.set(dealId, {
                  ...dc.deals,
                  company: company ? { company_id: company.company_id, name: company.name } : null
                });
              }
            });
          }
          setCompanyDeals(Array.from(companyDealsMap.values()));
        } else {
          setCompanyDeals([]);
        }
      } else {
        setCompanyDeals([]);
      }
    };

    fetchDeals();
  }, [emailContacts, emailCompanies, refreshDealsCounter]);

  // Fetch tasks linked to contacts (for compose modal)
  useEffect(() => {
    const fetchTasks = async () => {
      // Reset tasks when no contacts
      if (emailContacts.length === 0) {
        setContactTasks([]);
        return;
      }

      // Get contact IDs
      const contactIds = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => p.contact.contact_id);

      if (contactIds.length === 0) {
        setContactTasks([]);
        return;
      }

      // Fetch tasks linked to contacts via task_contacts
      const { data: taskContactsData, error: tcError } = await supabase
        .from('task_contacts')
        .select(`
          task_id,
          contact_id,
          tasks(
            task_id,
            content,
            description,
            status,
            priority,
            due_date,
            due_string,
            todoist_id,
            todoist_url,
            todoist_project_name
          )
        `)
        .in('contact_id', contactIds);

      if (tcError) {
        console.error('Error fetching task_contacts:', tcError);
        return;
      }

      // Build contact tasks - only open tasks, excluding Birthdays project
      const contactTasksMap = new Map();
      if (taskContactsData) {
        taskContactsData.forEach(tc => {
          if (!tc.tasks || tc.tasks.status !== 'open') return;
          // Skip Birthdays tasks (project name may include emoji)
          if (tc.tasks.todoist_project_name?.includes('Birthdays')) return;
          const taskId = tc.tasks.task_id;
          if (!contactTasksMap.has(taskId)) {
            contactTasksMap.set(taskId, {
              ...tc.tasks,
              contacts: []
            });
          }
          const contact = emailContacts.find(p => p.contact?.contact_id === tc.contact_id);
          if (contact) {
            contactTasksMap.get(taskId).contacts.push({
              contact_id: tc.contact_id,
              name: contact.contact ? `${contact.contact.first_name} ${contact.contact.last_name}` : contact.name
            });
          }
        });
      }
      setContactTasks(Array.from(contactTasksMap.values()));
    };

    fetchTasks();
  }, [emailContacts]);

  // Fetch introductions linked to contacts
  useEffect(() => {
    const fetchIntroductions = async () => {
      // Reset introductions when no contacts
      if (emailContacts.length === 0) {
        setContactIntroductions([]);
        return;
      }

      // Get contact IDs
      const contactIds = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => p.contact.contact_id);

      if (contactIds.length === 0) {
        setContactIntroductions([]);
        return;
      }

      // Fetch introductions linked to contacts via introduction_contacts
      const { data: introContactsData, error: icError } = await supabase
        .from('introduction_contacts')
        .select(`
          introduction_contact_id,
          introduction_id,
          contact_id,
          role,
          introductions(introduction_id, introduction_date, introduction_tool, category, text, status, created_at)
        `)
        .in('contact_id', contactIds);

      if (icError) {
        console.error('Error fetching introduction_contacts:', icError);
      }

      // Get all unique introduction IDs to fetch all contacts for each introduction
      const introductionIds = [...new Set(introContactsData?.map(ic => ic.introduction_id) || [])];

      // Fetch ALL contacts for these introductions (not just the ones in the email thread)
      let allIntroContacts = [];
      if (introductionIds.length > 0) {
        const { data: allContactsData, error: allContactsError } = await supabase
          .from('introduction_contacts')
          .select(`
            introduction_contact_id,
            introduction_id,
            contact_id,
            role,
            contacts(contact_id, first_name, last_name),
            introductions(introduction_id, introduction_date, introduction_tool, category, text, status, created_at)
          `)
          .in('introduction_id', introductionIds);

        if (allContactsError) {
          console.error('Error fetching all introduction contacts:', allContactsError);
        } else {
          allIntroContacts = allContactsData || [];
        }
      }

      // Build introductions with contact info grouped by introduction_id
      const introductionsMap = new Map();
      allIntroContacts.forEach(ic => {
        if (!ic.introductions) return;
        const introId = ic.introductions.introduction_id;
        if (!introductionsMap.has(introId)) {
          introductionsMap.set(introId, {
            ...ic.introductions,
            contacts: []
          });
        }
        const contactName = ic.contacts
          ? `${ic.contacts.first_name || ''} ${ic.contacts.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown';
        introductionsMap.get(introId).contacts.push({
          contact_id: ic.contact_id,
          name: contactName,
          role: ic.role
        });
      });
      setContactIntroductions(Array.from(introductionsMap.values()));
    };

    fetchIntroductions();
  }, [emailContacts]);

  // Find contact by email in emailContacts
  const findContactByEmail = (emailAddress) => {
    if (!emailAddress || !emailContacts) return null;
    const participant = emailContacts.find(p => p.email?.toLowerCase() === emailAddress.toLowerCase());
    return participant?.contact || null;
  };

  // Handle click on email address in email header
  const handleEmailAddressClick = async (emailAddress, name, emailDate) => {
    const contact = findContactByEmail(emailAddress);
    if (contact) {
      // Contact exists - navigate to their page (basename is /new-crm)
      navigate(`/contact/${contact.contact_id}`);
    } else {
      // Contact doesn't exist - create new contact with full setup
      // Parse name into first and last name
      let firstName = '';
      let lastName = '';
      if (name && name !== emailAddress) {
        const nameParts = name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // If no name, use email prefix
      if (!firstName) {
        firstName = emailAddress.split('@')[0];
      }

      // Extract domain for company lookup
      const emailDomain = emailAddress.split('@')[1]?.toLowerCase();
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'aol.com'];
      const isPersonalEmail = commonDomains.includes(emailDomain);

      // Use the email date for last_interaction
      const interactionDate = emailDate ? new Date(emailDate).toISOString() : new Date().toISOString();

      try {
        toast.loading('Creating contact...', { id: 'create-contact' });

        // 1. Create the contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName || null,
            category: 'Inbox',
            last_interaction_at: interactionDate
          })
          .select()
          .single();

        if (contactError) throw contactError;

        // 2. Add the email to contact_emails
        const { error: emailError } = await supabase
          .from('contact_emails')
          .insert({
            contact_id: newContact.contact_id,
            email: emailAddress.toLowerCase(),
            is_primary: true,
            type: isPersonalEmail ? 'personal' : 'work'
          });

        if (emailError) console.error('Email insert error:', emailError);

        // 3. Find or create company based on domain (if not personal email)
        if (!isPersonalEmail && emailDomain) {
          // Check if company exists via domain
          const { data: existingDomain } = await supabase
            .from('company_domains')
            .select('company_id, companies(company_id, name)')
            .eq('domain', emailDomain)
            .single();

          let companyId = existingDomain?.company_id;

          if (!companyId) {
            // Create new company from domain
            const companyName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: companyName,
                website: `https://${emailDomain}`,
                category: 'Inbox'
              })
              .select()
              .single();

            if (!companyError && newCompany) {
              companyId = newCompany.company_id;

              // Add domain to company_domains
              await supabase
                .from('company_domains')
                .insert({
                  company_id: companyId,
                  domain: emailDomain
                });
            }
          }

          // 4. Link contact to company via contact_companies
          if (companyId) {
            await supabase
              .from('contact_companies')
              .insert({
                contact_id: newContact.contact_id,
                company_id: companyId,
                is_primary: true
              });
          }
        }

        toast.success(`Created: ${firstName} ${lastName || ''}`.trim(), { id: 'create-contact' });

        // Navigate to the new contact
        navigate(`/contact/${newContact.contact_id}`);
      } catch (error) {
        console.error('Error creating contact:', error);
        toast.error('Failed to create contact', { id: 'create-contact' });
      }
    }
  };

  // Check if email has a linked contact
  const emailHasContact = (emailAddress) => {
    return !!findContactByEmail(emailAddress);
  };

  // Get the relevant person for email list (not me)
  const MY_EMAIL = 'simone@cimminelli.com';
  const getRelevantPerson = (email) => {
    const fromEmail = email.from_email?.toLowerCase();

    // If I sent it, show the first recipient
    if (fromEmail === MY_EMAIL) {
      const to = email.to_recipients;
      if (to && Array.isArray(to) && to.length > 0) {
        return to[0].name || to[0].email;
      }
      return email.from_email;
    }

    // If someone sent it to me, show the sender
    return email.from_name || email.from_email;
  };


  // Global keyboard shortcuts for Email/WhatsApp - right panel tabs
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Only for email or whatsapp tabs
      if (activeTab !== 'email' && activeTab !== 'whatsapp') return;

      // Ignore if typing in an input/textarea/contenteditable
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      if (!e.altKey) return;

      // Option+P: Contact Details
      if (e.code === 'KeyP') { e.preventDefault(); setActiveActionTab('crm'); return; }
      // Option+O: Company Details
      if (e.code === 'KeyO') { e.preventDefault(); setActiveActionTab('company'); return; }
      // Option+E: Send Email
      if (e.code === 'KeyE') { e.preventDefault(); setActiveActionTab('email'); return; }
      // Option+W: WhatsApp
      if (e.code === 'KeyW') { e.preventDefault(); setActiveActionTab('whatsapp'); return; }
      // Option+C: Calendar
      if (e.code === 'KeyC') { e.preventDefault(); setActiveActionTab('calendarPanel'); return; }
      // Option+T: Tasks
      if (e.code === 'KeyT') { e.preventDefault(); setActiveActionTab('tasks'); return; }
      // Option+D: Deals
      if (e.code === 'KeyD') { e.preventDefault(); setActiveActionTab('deals'); return; }
      // Option+I: Introductions
      if (e.code === 'KeyI') { e.preventDefault(); setActiveActionTab('introductions'); return; }
      // Option+N: Notes
      if (e.code === 'KeyN') { e.preventDefault(); setActiveActionTab('notes'); return; }
      // Option+A: AI Chat
      if (e.code === 'KeyA') { e.preventDefault(); setActiveActionTab('chat'); return; }
      // Option+F: Files
      if (e.code === 'KeyF') { e.preventDefault(); setActiveActionTab('files'); return; }
      // Option+R: Related by Tag
      if (e.code === 'KeyR') { e.preventDefault(); setActiveActionTab('related'); return; }
    };

    // Use capture phase to catch event before any component can stop it
    document.addEventListener('keydown', handleGlobalKeyDown, true);

    // Listen for custom events from email iframe
    const handleIframeShortcut = (e) => {
      const { code } = e.detail;
      if (code === 'KeyP') setActiveActionTab('crm');
      else if (code === 'KeyO') setActiveActionTab('company');
      else if (code === 'KeyE') setActiveActionTab('email');
      else if (code === 'KeyW') setActiveActionTab('whatsapp');
      else if (code === 'KeyC') setActiveActionTab('calendarPanel');
      else if (code === 'KeyT') setActiveActionTab('tasks');
      else if (code === 'KeyD') setActiveActionTab('deals');
      else if (code === 'KeyI') setActiveActionTab('introductions');
      else if (code === 'KeyN') setActiveActionTab('notes');
      else if (code === 'KeyA') setActiveActionTab('chat');
      else if (code === 'KeyF') setActiveActionTab('files');
      else if (code === 'KeyR') setActiveActionTab('related');
      else if (code === 'Digit1') updateItemStatus('need_actions');
      else if (code === 'Digit2') updateItemStatus('waiting_input');
      else if (code === 'Digit3') handleDoneClick();
    };
    window.addEventListener('emailIframeShortcut', handleIframeShortcut);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
      window.removeEventListener('emailIframeShortcut', handleIframeShortcut);
    };
  }, [activeTab, setActiveActionTab, updateItemStatus, handleDoneClick]);


  // Handle selecting a thread - marks unread emails as read
  const handleSelectThread = async (threadEmails) => {
    setSelectedThread(threadEmails);

    // Find unread emails in the thread
    const unreadEmails = threadEmails.filter(e => e.is_read === false);
    if (unreadEmails.length === 0) return;

    // Get Fastmail IDs and Supabase IDs
    const fastmailIds = unreadEmails.map(e => e.fastmail_id).filter(Boolean);
    const supabaseIds = unreadEmails.map(e => e.id).filter(Boolean);

    if (fastmailIds.length === 0) return;

    try {
      // Call backend to mark as read in Fastmail and Supabase
      const response = await fetch(`${BACKEND_URL}/mark-as-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fastmailIds, supabaseIds }),
      });

      if (response.ok) {
        // Update local state to reflect read status
        setEmails(prev => prev.map(e =>
          supabaseIds.includes(e.id) ? { ...e, is_read: true } : e
        ));
        setThreads(prev => prev.map(t => ({
          ...t,
          emails: t.emails.map(e =>
            supabaseIds.includes(e.id) ? { ...e, is_read: true } : e
          )
        })));
        // Also update selectedThread
        setSelectedThread(prev => prev?.map(e =>
          supabaseIds.includes(e.id) ? { ...e, is_read: true } : e
        ));
      }
    } catch (error) {
      console.error('Error marking emails as read:', error);
    }
  };

  // Search saved/archived emails (not inbox) using RPC function
  const searchSavedEmails = useCallback(async (query) => {
    if (!query.trim()) {
      setEmailSearchResults([]);
      setIsSearchingEmails(false);
      return;
    }

    setEmailSearchLoading(true);
    setIsSearchingEmails(true);

    try {
      // Use the PostgreSQL RPC function for sophisticated search
      const { data, error } = await supabase
        .rpc('search_emails', {
          search_query: query.trim(),
          result_limit: 100
        });

      if (error) throw error;

      // Transform results to match expected format
      const results = (data || []).map(row => ({
        email_thread_id: row.email_thread_id,
        thread_id: row.thread_id,
        subject: row.subject,
        last_message_timestamp: row.last_message_timestamp,
        emails: Array(Number(row.email_count)).fill({}), // Placeholder for count
        latestEmail: {
          email_id: row.latest_email_id,
          from_name: row.latest_sender_name,
          body_plain: row.latest_body_preview
        },
        matchType: row.match_source
      }));

      setEmailSearchResults(results);
    } catch (error) {
      console.error('Error searching emails:', error);
      toast.error('Search failed');
      setEmailSearchResults([]);
    } finally {
      setEmailSearchLoading(false);
    }
  }, []);

  // Handle selecting a search result - loads the full thread and displays it
  const handleSelectSearchResult = async (searchResult) => {
    try {
      // Fetch all emails in this thread
      const { data: threadEmails, error } = await supabase
        .from('emails')
        .select('*')
        .eq('email_thread_id', searchResult.email_thread_id)
        .order('message_timestamp', { ascending: false });

      if (error) throw error;

      if (!threadEmails || threadEmails.length === 0) {
        toast.error('Could not load email thread');
        return;
      }

      // Fetch participants for each email to get to/cc recipients with their emails
      const emailIds = threadEmails.map(e => e.email_id);
      const { data: participants } = await supabase
        .from('email_participants')
        .select(`
          email_id,
          participant_type,
          contact_id,
          contact:contacts(contact_id, first_name, last_name)
        `)
        .in('email_id', emailIds);

      // Collect all contact IDs (participants + senders)
      const senderContactIds = threadEmails.map(e => e.sender_contact_id).filter(Boolean);
      const participantContactIds = (participants || []).map(p => p.contact_id).filter(Boolean);
      const allContactIds = [...new Set([...senderContactIds, ...participantContactIds])];

      // Get contact emails for all contacts
      let contactEmailMap = {};
      let contactNameMap = {};
      if (allContactIds.length > 0) {
        // Get names
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name')
          .in('contact_id', allContactIds);
        (contacts || []).forEach(c => {
          contactNameMap[c.contact_id] = `${c.first_name || ''} ${c.last_name || ''}`.trim();
        });

        // Get emails
        const { data: contactEmails } = await supabase
          .from('contact_emails')
          .select('contact_id, email, is_primary')
          .in('contact_id', allContactIds)
          .order('is_primary', { ascending: false });
        (contactEmails || []).forEach(ce => {
          if (!contactEmailMap[ce.contact_id]) {
            contactEmailMap[ce.contact_id] = ce.email;
          }
        });
      }

      // Group participants by email_id
      const participantsByEmail = {};
      (participants || []).forEach(p => {
        if (!participantsByEmail[p.email_id]) {
          participantsByEmail[p.email_id] = { sender: [], to: [], cc: [], bcc: [] };
        }
        const contact = p.contact;
        const name = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : '';
        const email = contactEmailMap[p.contact_id] || '';

        if (p.participant_type === 'sender') {
          participantsByEmail[p.email_id].sender.push({ name, email });
        } else if (p.participant_type === 'to') {
          participantsByEmail[p.email_id].to.push({ name, email });
        } else if (p.participant_type === 'cc') {
          participantsByEmail[p.email_id].cc.push({ name, email });
        } else if (p.participant_type === 'bcc') {
          participantsByEmail[p.email_id].bcc.push({ name, email });
        }
      });

      // Transform to match the format expected by the central column
      const formattedEmails = threadEmails.map(email => {
        const emailParticipants = participantsByEmail[email.email_id] || { sender: [], to: [], cc: [] };

        // Get sender info from participants (includes me when I'm the sender)
        const sender = emailParticipants.sender[0] || {};
        // Fallback to contact tables if not in participants
        const senderName = sender.name || contactNameMap[email.sender_contact_id] || '';
        const senderEmail = sender.email || contactEmailMap[email.sender_contact_id] || '';

        return {
          id: email.email_id,
          thread_id: email.thread_id,
          fastmail_id: email.gmail_id,
          from_email: senderEmail,
          from_name: senderName,
          to_recipients: emailParticipants.to,
          cc_recipients: emailParticipants.cc,
          subject: email.subject,
          body_text: email.body_plain,
          body_html: email.body_html,
          date: email.message_timestamp,
          has_attachments: email.has_attachments,
          attachments: [],
          is_read: email.is_read ?? true,
          // Mark as "archived" email so UI can adapt
          _isArchivedEmail: true,
          _email_thread_id: email.email_thread_id
        };
      });

      setSelectedThread(formattedEmails);

      // Collapse mobile panels
      if (window.innerWidth <= 768) {
        setListCollapsed(true);
      }
    } catch (err) {
      console.error('Error loading search result thread:', err);
      toast.error('Failed to load email thread');
    }
  };

  // Debounced email search effect
  useEffect(() => {
    if (activeTab === 'email' && emailSearchQuery.trim()) {
      const debounce = setTimeout(() => {
        searchSavedEmails(emailSearchQuery);
      }, 300);
      return () => clearTimeout(debounce);
    } else if (!emailSearchQuery.trim()) {
      setEmailSearchResults([]);
      setIsSearchingEmails(false);
    }
  }, [emailSearchQuery, activeTab, searchSavedEmails]);

  // Clear search when switching tabs
  useEffect(() => {
    if (activeTab !== 'email') {
      setEmailSearchQuery('');
      setEmailSearchResults([]);
      setIsSearchingEmails(false);
    }
  }, [activeTab]);

  // Clear WhatsApp search when switching tabs
  useEffect(() => {
    if (activeTab !== 'whatsapp') {
      setWhatsappSearchQuery('');
      setWhatsappSearchResults([]);
      setIsSearchingWhatsapp(false);
      setArchivedWhatsappContact(null);
    }
  }, [activeTab]);

  // Clear archivedWhatsappContact when selecting a normal (non-archived) chat
  useEffect(() => {
    if (selectedWhatsappChat && !selectedWhatsappChat._isArchivedChat) {
      setArchivedWhatsappContact(null);
    }
  }, [selectedWhatsappChat]);

  // Handle selecting a calendar search result
  const handleSelectCalendarSearchResult = async (searchResult) => {
    try {
      if (searchResult.result_type === 'inbox') {
        // Raw event from command_center_inbox - fetch full event data
        const { data: eventData, error } = await supabase
          .from('command_center_inbox')
          .select('*')
          .eq('id', searchResult.result_id)
          .single();

        if (error) throw error;

        setSelectedCalendarEvent(eventData);

        // Clear contact selection for raw events (no attendees linked yet)
        setSelectedRightPanelContactId(null);
      } else if (searchResult.result_type === 'meeting') {
        // Processed meeting - fetch with contacts
        const { data: meetingData, error } = await supabase
          .from('meetings')
          .select(`
            *,
            meeting_contacts (
              contact_id,
              contacts:contact_id (
                contact_id,
                first_name,
                last_name,
                profile_image_url
              )
            )
          `)
          .eq('meeting_id', searchResult.result_id)
          .single();

        if (error) throw error;

        // Set as selectedCalendarEvent with source: 'meetings' to match existing pattern
        setSelectedCalendarEvent({ ...meetingData, source: 'meetings' });
        setCalendarEventScore(meetingData.score ? parseInt(meetingData.score) : null);
        setCalendarEventNotes(meetingData.notes || '');
        setCalendarEventDescription(meetingData.description || '');

        // Set the first attendee as the selected contact in right panel
        const firstContact = meetingData?.meeting_contacts?.[0]?.contacts;
        if (firstContact?.contact_id) {
          setSelectedRightPanelContactId(firstContact.contact_id);
        } else {
          setSelectedRightPanelContactId(null);
        }
      }

      // Collapse mobile panels
      if (window.innerWidth <= 768) {
        setListCollapsed(true);
      }
    } catch (err) {
      console.error('Error loading calendar search result:', err);
      toast.error('Failed to load event');
    }
  };

  // Clear calendar search when switching tabs
  useEffect(() => {
    if (activeTab !== 'calendar') {
      setCalendarSearchQuery('');
      setCalendarSearchResults([]);
      setIsSearchingCalendar(false);
    }
  }, [activeTab]);

  // Clear Keep in Touch search when switching tabs
  useEffect(() => {
    if (activeTab !== 'keepintouch') {
      setKeepInTouchSearchQuery('');
      setKeepInTouchSearchResults([]);
      setIsSearchingKeepInTouch(false);
    }
  }, [activeTab]);


  // Blue dot shows if inbox section has items (not based on is_read)
  const hasInboxEmails = filterByStatus(threads, 'inbox').length > 0;
  const hasInboxWhatsapp = filterByStatus(whatsappChats, 'inbox').length > 0;
  const hasInboxCalendar = filterCalendarEvents(calendarEvents, 'needReview').length > 0;


  // === useMemo bundles for DesktopLayout ===

  const emailThreadsBundle = useMemo(() => ({
    emails, threads, selectedThread, threadsLoading,
    setEmails, setThreads, setSelectedThread, refreshThreads, removeEmailsBySender,
  }), [emails, threads, selectedThread, threadsLoading, refreshThreads, removeEmailsBySender]);

  const localStateBundle = useMemo(() => ({
    activeTab, setActiveTab, viewport, isMobile,
    listCollapsed, setListCollapsed, rightPanelCollapsed, setRightPanelCollapsed,
    statusSections, setStatusSections, toggleStatusSection, filterByStatus,
    emailSearchQuery, setEmailSearchQuery, emailSearchResults, setEmailSearchResults,
    emailSearchLoading, isSearchingEmails, setIsSearchingEmails,
    contactDeals, companyDeals, contactIntroductions, contactTasks,
    contactNotes, loadingNotes,
    navigate,
  }), [
    activeTab, viewport, isMobile,
    listCollapsed, rightPanelCollapsed,
    statusSections,
    emailSearchQuery, emailSearchResults, emailSearchLoading, isSearchingEmails,
    contactDeals, companyDeals, contactIntroductions, contactTasks,
    contactNotes, loadingNotes,
    navigate,
  ]);

  const localHandlersBundle = useMemo(() => ({
    searchSavedEmails, handleSelectSearchResult, handleSelectThread,
    handleEmailAddressClick, emailHasContact, getRelevantPerson,
    handleSelectCalendarSearchResult,
    handleDeleteDealContact, handleUpdateDealStage,
    handleCompleteContactTask,
    sanitizeEmailHtml, parseDateFromText,
    openInObsidian, getNoteTypeIcon,
    fetchContactNotes, handleSaveNote, openEditNote, resetNoteForm,
    findContactByEmail,
    setRefreshDealsCounter,
  }), [
    searchSavedEmails, handleSelectSearchResult, handleSelectThread,
    handleEmailAddressClick, emailHasContact, getRelevantPerson,
    handleSelectCalendarSearchResult,
    handleDeleteDealContact, handleUpdateDealStage,
    handleCompleteContactTask,
    openInObsidian, getNoteTypeIcon,
    fetchContactNotes, handleSaveNote, openEditNote, resetNoteForm,
    findContactByEmail, setRefreshDealsCounter,
    sanitizeEmailHtml, parseDateFromText,
  ]);

  const modalStateBundle = useMemo(() => ({
    BACKEND_URL, AGENT_SERVICE_URL, OBSIDIAN_VAULT, MY_EMAIL,
    noteModalOpen, setNoteModalOpen,
    newNoteTitle, setNewNoteTitle,
    newNoteType, setNewNoteType,
    newNoteSummary, setNewNoteSummary,
    newNoteObsidianPath, setNewNoteObsidianPath,
    creatingNote, editingNote,
    companyTagsModalOpen, setCompanyTagsModalOpen,
    companyCityModalOpen, setCompanyCityModalOpen,
    selectedCompanyForModal, setSelectedCompanyForModal,
    addToListModalOpen, setAddToListModalOpen,
    addToListContact, setAddToListContact,
    domainLinkModalOpen, setDomainLinkModalOpen,
    selectedDomainForLink, setSelectedDomainForLink,
    createCompanyModalOpen, setCreateCompanyModalOpen,
    createCompanyInitialDomain, setCreateCompanyInitialDomain,
    createContactModalOpen, setCreateContactModalOpen,
    createContactEmail, setCreateContactEmail,
    addCompanyModalOpen, setAddCompanyModalOpen,
    searchOrCreateCompanyModalOpen, setSearchOrCreateCompanyModalOpen,
    manageEmailsModalOpen, setManageEmailsModalOpen,
    manageMobilesModalOpen, setManageMobilesModalOpen,
    contactForManageModal, setContactForManageModal,
    dealModalOpen, setDealModalOpen,
    dealSearchQuery, setDealSearchQuery,
    dealSearchResults, setDealSearchResults,
    searchingDeals, setSearchingDeals,
    newDealName, setNewDealName,
    creatingDeal, setCreatingDeal,
    selectedDealContact, setSelectedDealContact,
    dealRelationship, setDealRelationship,
  }), [
    noteModalOpen, newNoteTitle, newNoteType, newNoteSummary, newNoteObsidianPath,
    creatingNote, editingNote,
    companyTagsModalOpen, companyCityModalOpen, selectedCompanyForModal,
    addToListModalOpen, addToListContact,
    domainLinkModalOpen, selectedDomainForLink,
    createCompanyModalOpen, createCompanyInitialDomain,
    createContactModalOpen, createContactEmail,
    addCompanyModalOpen, searchOrCreateCompanyModalOpen,
    manageEmailsModalOpen, manageMobilesModalOpen, contactForManageModal,
    dealModalOpen, dealSearchQuery, dealSearchResults, searchingDeals,
    newDealName, creatingDeal, selectedDealContact, dealRelationship,
  ]);


  const tabs = [
    { id: 'email', label: 'Email', icon: FaEnvelope, count: filterByStatus(threads, 'inbox').length + filterByStatus(threads, 'need_actions').length, hasUnread: hasInboxEmails },
    { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, count: filterByStatus(whatsappChats, 'inbox').length + filterByStatus(whatsappChats, 'need_actions').length, hasUnread: hasInboxWhatsapp },
    { id: 'calendar', label: 'Calendar', icon: FaCalendar, count: filterCalendarEvents(calendarEvents, 'needReview').length, hasUnread: hasInboxCalendar },
    { id: 'tasks', label: 'Tasks', icon: FaTasks, count: 0, hasUnread: false },
    { id: 'deals', label: 'Deals', icon: FaDollarSign, count: filterDealsByStatus(pipelineDeals, 'open').length, hasUnread: false },
    { id: 'keepintouch', label: 'Keep in Touch', icon: FaUserCheck, count: filterKeepInTouchByStatus(keepInTouchContacts, 'due').length, hasUnread: filterKeepInTouchByStatus(keepInTouchContacts, 'due').length > 0 },
    { id: 'introductions', label: 'Introductions', icon: FaHandshake, count: filterIntroductionsBySection(introductionsList, 'inbox').length, hasUnread: filterIntroductionsBySection(introductionsList, 'inbox').length > 0 },
    { id: 'notes', label: 'Notes', icon: FaStickyNote, count: 0, hasUnread: false },
    { id: 'lists', label: 'Lists', icon: FaList, count: 0, hasUnread: false },
  ];

  // Mobile: Render mobile-optimized version (but continue to render modals below)
  const mobileContent = viewport.isMobile ? (
      <CommandCenterMobile
        theme={theme}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        // Email data
        emailThreads={threads}
        selectedThread={selectedThread}
        onSelectThread={setSelectedThread}
        // WhatsApp data
        whatsappChats={whatsappChats}
        selectedChat={selectedWhatsappChat}
        onSelectChat={setSelectedWhatsappChat}
        // Tasks data
        tasks={todoistTasks}
        // Calendar data
        calendarEvents={calendarEvents}
        selectedEvent={selectedCalendarEvent}
        onSelectEvent={setSelectedCalendarEvent}
        // Keep in Touch
        keepInTouchContacts={keepInTouchContacts}
        // Deals
        deals={pipelineDeals}
        // Context data for right panel actions
        emailContacts={emailContacts}
        emailCompanies={emailCompanies}
        // Contact selector (same as web right panel)
        availableContacts={enrichedRightPanelContacts}
        selectedContactId={selectedRightPanelContactId}
        onSelectContact={setSelectedRightPanelContactId}
        // Data integrity for warning bar
        dataIntegrityCount={
          notInCrmEmails.length +
          notInCrmDomains.length +
          holdContacts.length +
          holdCompanies.length +
          incompleteContacts.length +
          incompleteCompanies.length +
          duplicateContacts.length +
          duplicateCompanies.length +
          missingCompanyLinks.length +
          contactsMissingCompany.length
        }
        // Contact/Company view actions
        onViewContact={(contactId) => {
          if (contactId) {
            setSelectedRightPanelContactId(contactId);
            // Find contact in emailContacts to populate quick edit
            const contactData = emailContacts?.find(c => c.contact?.contact_id === contactId)?.contact;
            if (contactData) {
              handleOpenQuickEditModal(contactData);
            }
          }
        }}
        onViewCompany={(companyId) => {
          if (companyId) {
            setSelectedRightPanelCompanyId(companyId);
            setCompanyMainModalId(companyId);
            setCompanyMainModalOpen(true);
          }
        }}
        // Email actions
        onComposeEmail={(contact) => {
          if (contact?.email) {
            setComposeTo([{ email: contact.email, name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() }]);
          }
          openNewCompose();
        }}
        onArchiveEmail={async (thread) => {
          try {
            const emails = thread.emails || [thread.latestEmail || thread];
            for (const email of emails) {
              if (email.fastmail_id) {
                await archiveInFastmail(email.fastmail_id);
              }
            }
            const emailIds = emails.map(e => e.id).filter(Boolean);
            if (emailIds.length > 0) {
              await supabase
                .from('command_center_inbox')
                .delete()
                .in('id', emailIds);
            }
            setThreads(prev => prev.filter(t => t.threadId !== thread.threadId));
            toast.success(`Archived: ${thread.latestEmail?.subject || 'Email'}`);
          } catch (error) {
            console.error('Archive error:', error);
            toast.error('Failed to archive email');
          }
        }}
        onReplyEmail={(thread) => {
          setSelectedThread(thread.emails || [thread.latestEmail || thread]);
          setTimeout(() => openReply(), 50);
        }}
        onRefreshEmails={refreshThreads}
        // WhatsApp actions
        onSendWhatsApp={(contact) => {
          if (contact) {
            setNewWhatsAppContact(contact);
            setNewWhatsAppModalOpen(true);
          }
        }}
        // Task actions
        onCreateTask={(contactId) => {
          // Pre-fill task with contact if provided
          setTaskModalOpen(true);
        }}
        onCompleteTask={handleCompleteTask}
        // Note actions
        onCreateNote={(contactId) => {
          setNoteModalOpen(true);
        }}
        // Deal actions
        onCreateDeal={() => {
          setCreateDealAIOpen(true);
        }}
        // View actions (navigate to tabs)
        onViewDeals={() => {
          setActiveTab('deals');
        }}
        onViewIntroductions={() => {
          setActiveTab('introductions');
        }}
        onViewFiles={() => {
          setActiveTab('files');
        }}
      />
  ) : null;

  // Desktop: Render full 3-panel layout
  const desktopContent = !viewport.isMobile ? (
    <DesktopLayout
      theme={theme}
      tabs={tabs}
      dealsHook={dealsHook}
      introductionsHook={introductionsHook}
      kitHook={kitHook}
      calendarHook={calendarHook}
      whatsAppHook={whatsAppHook}
      dataIntegrityHook={dataIntegrityHook}
      emailActionsHook={emailActionsHook}
      rightPanelHook={rightPanelHook}
      contextContactsHook={contextContactsHook}
      todoistHook={todoistHook}
      chatHook={chatHook}
      emailCompose={emailCompose}
      quickEditModal={quickEditModal}
      profileImageModal={profileImageModal}
      emailThreads={emailThreadsBundle}
      localState={localStateBundle}
      localHandlers={localHandlersBundle}
      modalState={modalStateBundle}
    />
  ) : null;

  // Return either mobile or desktop content, plus all modals (needed for both)
  return (
    <>
      {mobileContent}
      {desktopContent}

      {/* Compose Modal - needed for both mobile and desktop */}
      <ComposeEmailModal
        theme={theme}
        composeModal={composeModal}
        closeCompose={closeCompose}
        composeTo={composeTo}
        composeToInput={composeToInput}
        setComposeToInput={setComposeToInput}
        composeCc={composeCc}
        composeCcInput={composeCcInput}
        setComposeCcInput={setComposeCcInput}
        composeSubject={composeSubject}
        setComposeSubject={setComposeSubject}
        composeBody={composeBody}
        setComposeBody={setComposeBody}
        contactSuggestions={contactSuggestions}
        activeField={activeField}
        setActiveField={setActiveField}
        searchContacts={searchContacts}
        addEmailToField={addEmailToField}
        removeEmailFromField={removeEmailFromField}
        handleEmailInputKeyDown={handleEmailInputKeyDown}
        composeAttachments={composeAttachments}
        composeFileInputRef={composeFileInputRef}
        handleComposeFileSelect={handleComposeFileSelect}
        removeComposeAttachment={removeComposeAttachment}
        sending={sending}
        handleSend={handleSendWithAttachmentCheck}
        swapToCc={swapToCc}
        // Chat props for AI assistant
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        sendMessageToClaude={sendMessageToClaude}
        extractDraftFromMessage={extractDraftFromMessage}
        // Deals props
        contactDeals={contactDeals}
        onUpdateDealStage={handleUpdateDealStage}
        // Tasks props
        contactTasks={contactTasks}
        onCompleteTask={handleCompleteContactTask}
        // Task: switch to tasks tab
        setTaskModalOpen={() => setActiveActionTab('tasks')}
        // Create Deal AI modal
        setCreateDealAIOpen={setCreateDealAIOpen}
        // Create Deal manual modal
        setCreateDealModalOpen={setCreateDealModalOpen}
        // Calendar props
        onExtractCalendarEvent={handleCalendarExtract}
        pendingCalendarEvent={pendingCalendarEvent}
        setPendingCalendarEvent={setPendingCalendarEvent}
        calendarEventEdits={calendarEventEdits}
        setCalendarEventEdits={setCalendarEventEdits}
        updateCalendarEventField={updateCalendarEventField}
        calendarLoading={calendarLoading}
        handleCreateCalendarEvent={handleCreateCalendarEvent}
      />

      {/* Quick Edit Modal */}
      <QuickEditModal
        isOpen={quickEditContactModalOpen}
        onClose={handleCloseQuickEditModal}
        contact={contactForQuickEdit}
        theme={theme}
        showMissingFieldsOnly={showMissingFieldsOnly}
        onRefresh={() => {}}
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
        quickEditCityModalOpen={quickEditCityModalOpen}
        setQuickEditCityModalOpen={setQuickEditCityModalOpen}
        quickEditTagModalOpen={quickEditTagModalOpen}
        setQuickEditTagModalOpen={setQuickEditTagModalOpen}
        quickEditAssociateCompanyModalOpen={quickEditAssociateCompanyModalOpen}
        setQuickEditAssociateCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
        onSave={handleSaveQuickEditContact}
        onDelete={() => {}}
        handleSilentSave={handleSilentSave}
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
        handleMarkCompleteWithCategory={handleMarkCompleteWithCategory}
        getVisibleTabs={getVisibleTabs}
        shouldShowField={shouldShowField}
      />

      {/* Deal Modal */}
      {dealModalOpen && (
        <ModalOverlay onClick={() => { setDealModalOpen(false); setSelectedDealContact(null); setDealRelationship('introducer'); setDealSearchQuery(''); setDealSearchResults([]); setNewDealName(''); }}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaDollarSign style={{ marginRight: '8px', color: '#10B981' }} />
                Add Deal
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => { setDealModalOpen(false); setSelectedDealContact(null); setDealRelationship('introducer'); setDealSearchQuery(''); setDealSearchResults([]); setNewDealName(''); }}>
                <FaTimes size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody theme={theme}>
              {/* Step 1: Select Contact */}
              <FormField>
                <FormLabel theme={theme}>Select Contact</FormLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {emailContacts.filter(p => p.contact?.contact_id).map(p => {
                    const contactName = p.contact ? `${p.contact.first_name || ''} ${p.contact.last_name || ''}`.trim() : p.name;
                    const isSelected = selectedDealContact?.contact_id === p.contact.contact_id;
                    return (
                      <div
                        key={p.contact.contact_id}
                        onClick={() => setSelectedDealContact(p.contact)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          border: `2px solid ${isSelected ? '#10B981' : (theme === 'light' ? '#E5E7EB' : '#374151')}`,
                          background: isSelected ? (theme === 'light' ? '#D1FAE5' : '#065F46') : (theme === 'light' ? '#F9FAFB' : '#1F2937'),
                          color: isSelected ? (theme === 'light' ? '#065F46' : '#D1FAE5') : (theme === 'light' ? '#374151' : '#D1D5DB'),
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {contactName || p.email}
                      </div>
                    );
                  })}
                  {emailContacts.filter(p => p.contact?.contact_id).length === 0 && (
                    <div style={{ fontSize: '13px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontStyle: 'italic' }}>
                      No contacts found in this thread
                    </div>
                  )}
                </div>
              </FormField>

              {/* Step 2: Select Relationship */}
              {selectedDealContact && (
                <FormField style={{ marginTop: '16px' }}>
                  <FormLabel theme={theme}>Relationship</FormLabel>
                  <select
                    value={dealRelationship}
                    onChange={(e) => setDealRelationship(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: theme === 'light' ? '#fff' : '#1F2937',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="introducer">Introducer</option>
                    <option value="co-investor">Co-investor</option>
                    <option value="advisor">Advisor</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
              )}

              {/* Step 3: Search or Create Deal */}
              {selectedDealContact && (
                <>
                  <FormField style={{ marginTop: '16px' }}>
                    <FormLabel theme={theme}>Search Existing Deals</FormLabel>
                    <FormInput
                      theme={theme}
                      value={dealSearchQuery}
                      onChange={async (e) => {
                        const query = e.target.value;
                        setDealSearchQuery(query);
                        if (query.length >= 2) {
                          setSearchingDeals(true);
                          const { data } = await supabase
                            .from('deals')
                            .select('deal_id, opportunity, stage, category')
                            .ilike('opportunity', `%${query}%`)
                            .limit(10);
                          setDealSearchResults(data || []);
                          setSearchingDeals(false);
                        } else {
                          setDealSearchResults([]);
                        }
                      }}
                      placeholder="Search by deal name..."
                    />
                    {searchingDeals && <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '4px' }}>Searching...</div>}
                    {dealSearchResults.length > 0 && (
                      <div style={{ marginTop: '8px', border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`, borderRadius: '8px', overflow: 'hidden' }}>
                        {dealSearchResults.map(deal => (
                          <div
                            key={deal.deal_id}
                            onClick={async () => {
                              // Associate this deal with selected contact
                              const { error } = await supabase
                                .from('deals_contacts')
                                .insert({
                                  deal_id: deal.deal_id,
                                  contact_id: selectedDealContact.contact_id,
                                  relationship: dealRelationship
                                });
                              if (!error) {
                                // Refresh deals
                                const contactIds = emailContacts.filter(p => p.contact?.contact_id).map(p => p.contact.contact_id);
                                const { data: refreshed } = await supabase
                                  .from('deals_contacts')
                                  .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at, deal_attachments(attachment_id, attachments(attachment_id, file_name, file_type, file_size, permanent_url)))')
                                  .in('contact_id', contactIds);
                                if (refreshed) {
                                  const dealsMap = new Map();
                                  refreshed.forEach(dc => {
                                    if (!dc.deals) return;
                                    const dealId = dc.deals.deal_id;
                                    if (!dealsMap.has(dealId)) {
                                      dealsMap.set(dealId, { ...dc.deals, contacts: [] });
                                    }
                                    const contact = emailContacts.find(p => p.contact?.contact_id === dc.contact_id);
                                    if (contact) {
                                      dealsMap.get(dealId).contacts.push({
                                        contact_id: dc.contact_id,
                                        name: contact.contact ? `${contact.contact.first_name} ${contact.contact.last_name}` : contact.name,
                                        relationship: dc.relationship
                                      });
                                    }
                                  });
                                  setContactDeals(Array.from(dealsMap.values()));
                                }
                                // Close modal and reset
                                setDealModalOpen(false);
                                setSelectedDealContact(null);
                                setDealRelationship('introducer');
                                setDealSearchQuery('');
                                setDealSearchResults([]);
                              }
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                              background: theme === 'light' ? '#fff' : '#1F2937',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                            onMouseLeave={e => e.currentTarget.style.background = theme === 'light' ? '#fff' : '#1F2937'}
                          >
                            <div style={{ fontWeight: 500 }}>{deal.opportunity}</div>
                            <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                              {deal.stage} {deal.category ? `• ${deal.category}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormField>

                  <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                    <div style={{ flex: 1, height: '1px', background: theme === 'light' ? '#E5E7EB' : '#374151' }} />
                    <span style={{ padding: '0 12px', fontSize: '12px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: theme === 'light' ? '#E5E7EB' : '#374151' }} />
                  </div>

                  {/* Create new deal */}
                  <FormField>
                    <FormLabel theme={theme}>Create New Deal</FormLabel>
                    <FormInput
                      theme={theme}
                      value={newDealName}
                      onChange={(e) => setNewDealName(e.target.value)}
                      placeholder="Enter deal name..."
                    />
                  </FormField>
                </>
              )}
            </ModalBody>

            <ModalFooter theme={theme}>
              <SendButton
                theme={theme}
                disabled={!selectedDealContact || !newDealName.trim() || creatingDeal}
                onClick={async () => {
                  if (!selectedDealContact || !newDealName.trim()) return;
                  setCreatingDeal(true);

                  // Create the deal
                  const { data: newDeal, error: createError } = await supabase
                    .from('deals')
                    .insert({ opportunity: newDealName.trim() })
                    .select()
                    .single();

                  if (createError || !newDeal) {
                    console.error('Failed to create deal:', createError);
                    setCreatingDeal(false);
                    return;
                  }

                  // Associate with selected contact
                  await supabase
                    .from('deals_contacts')
                    .insert({
                      deal_id: newDeal.deal_id,
                      contact_id: selectedDealContact.contact_id,
                      relationship: dealRelationship
                    });

                  // Refresh deals list
                  const contactIds = emailContacts.filter(p => p.contact?.contact_id).map(p => p.contact.contact_id);
                  const { data: refreshed } = await supabase
                    .from('deals_contacts')
                    .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at, deal_attachments(attachment_id, attachments(attachment_id, file_name, file_type, file_size, permanent_url)))')
                    .in('contact_id', contactIds);

                  if (refreshed) {
                    const dealsMap = new Map();
                    refreshed.forEach(dc => {
                      if (!dc.deals) return;
                      const dealId = dc.deals.deal_id;
                      if (!dealsMap.has(dealId)) {
                        dealsMap.set(dealId, { ...dc.deals, contacts: [] });
                      }
                      const contact = emailContacts.find(p => p.contact?.contact_id === dc.contact_id);
                      if (contact) {
                        dealsMap.get(dealId).contacts.push({
                          contact_id: dc.contact_id,
                          name: contact.contact ? `${contact.contact.first_name} ${contact.contact.last_name}` : contact.name,
                          relationship: dc.relationship
                        });
                      }
                    });
                    setContactDeals(Array.from(dealsMap.values()));
                  }

                  setCreatingDeal(false);
                  setDealModalOpen(false);
                  setSelectedDealContact(null);
                  setDealRelationship('introducer');
                  setNewDealName('');
                }}
              >
                {creatingDeal ? 'Creating...' : 'Create Deal'}
              </SendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Introduction Modal */}
      {introductionModalOpen && (
        <ModalOverlay onClick={() => { setIntroductionModalOpen(false); setEditingIntroduction(null); setSelectedIntroducee(null); setSelectedIntroducee2(null); setIntroductionStatus('Requested'); setIntroductionTool('email'); setIntroductionCategory('Karma Points'); setIntroductionText(''); setIntroduceeSearchQuery(''); setIntroduceeSearchResults([]); setIntroducee2SearchQuery(''); setIntroducee2SearchResults([]); }}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaHandshake style={{ marginRight: '8px', color: '#F59E0B' }} />
                {editingIntroduction ? 'Edit Introduction' : 'Add Introduction'}
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => { setIntroductionModalOpen(false); setEditingIntroduction(null); setSelectedIntroducee(null); setSelectedIntroducee2(null); setIntroductionStatus('Requested'); setIntroductionTool('email'); setIntroductionCategory('Karma Points'); setIntroductionText(''); setIntroduceeSearchQuery(''); setIntroduceeSearchResults([]); setIntroducee2SearchQuery(''); setIntroducee2SearchResults([]); }}>
                <FaTimes size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody theme={theme}>
              {/* Person 1 */}
              <FormField>
                <FormLabel theme={theme}>Person 1</FormLabel>
                  {/* Selected introducee display */}
                  {selectedIntroducee && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                      <div style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        background: theme === 'light' ? '#FEF3C7' : '#78350F',
                        color: theme === 'light' ? '#92400E' : '#FDE68A',
                        border: `2px solid #F59E0B`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {selectedIntroducee.name || `${selectedIntroducee.first_name} ${selectedIntroducee.last_name}`}
                        <FaTimes
                          size={12}
                          style={{ cursor: 'pointer', opacity: 0.7 }}
                          onClick={() => setSelectedIntroducee(null)}
                        />
                      </div>
                    </div>
                  )}
                  {/* Thread contacts suggestions */}
                  {!selectedIntroducee && emailContacts.filter(p => p.contact?.contact_id).length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        From this thread
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {emailContacts.filter(p => p.contact?.contact_id).map(p => {
                          const contactName = p.contact ? `${p.contact.first_name || ''} ${p.contact.last_name || ''}`.trim() : p.name;
                          const isDisabled = selectedIntroducee2?.contact_id === p.contact.contact_id;
                          return (
                            <div
                              key={p.contact.contact_id}
                              onClick={() => !isDisabled && setSelectedIntroducee(p.contact)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '13px',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.4 : 1,
                                border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                                background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                                color: theme === 'light' ? '#374151' : '#D1D5DB',
                              }}
                            >
                              {contactName || p.email}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {/* Search for other contacts */}
                  {!selectedIntroducee && (
                    <>
                      <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Or search all contacts
                      </div>
                      <FormInput
                        theme={theme}
                        value={introduceeSearchQuery}
                        onChange={async (e) => {
                          const query = e.target.value;
                          setIntroduceeSearchQuery(query);
                          if (query.length >= 2) {
                            setSearchingIntroducee(true);
                            const parts = query.trim().split(/\s+/).filter(p => p.length > 0);
                            let supabaseQuery = supabase
                              .from('contacts')
                              .select('contact_id, first_name, last_name');

                            if (parts.length >= 2) {
                              // Multi-word search: match first + last name in either order
                              const [first, ...rest] = parts;
                              const last = rest.join(' ');
                              supabaseQuery = supabaseQuery.or(
                                `and(first_name.ilike.%${first}%,last_name.ilike.%${last}%),and(first_name.ilike.%${last}%,last_name.ilike.%${first}%)`
                              );
                            } else {
                              // Single word: search in either field
                              supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
                            }

                            const { data } = await supabaseQuery.limit(8);
                            setIntroduceeSearchResults(data || []);
                            setSearchingIntroducee(false);
                          } else {
                            setIntroduceeSearchResults([]);
                          }
                        }}
                        placeholder="Search by name..."
                        style={{ marginTop: '4px' }}
                      />
                      {searchingIntroducee && <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '4px' }}>Searching...</div>}
                      {introduceeSearchResults.length > 0 && (
                        <div style={{ marginTop: '8px', border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`, borderRadius: '8px', overflow: 'hidden', maxHeight: '150px', overflowY: 'auto' }}>
                          {introduceeSearchResults.map(contact => {
                            const isDisabled = selectedIntroducee2?.contact_id === contact.contact_id;
                            return (
                              <div
                                key={contact.contact_id}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setSelectedIntroducee(contact);
                                    setIntroduceeSearchQuery('');
                                    setIntroduceeSearchResults([]);
                                  }
                                }}
                                style={{
                                  padding: '10px 12px',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.4 : 1,
                                  borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                                  background: theme === 'light' ? '#fff' : '#1F2937',
                                }}
                                onMouseEnter={e => !isDisabled && (e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151')}
                                onMouseLeave={e => e.currentTarget.style.background = theme === 'light' ? '#fff' : '#1F2937'}
                              >
                                <div style={{ fontWeight: 500 }}>{contact.first_name} {contact.last_name}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </FormField>

              {/* Person 2 */}
              <FormField style={{ marginTop: '16px' }}>
                <FormLabel theme={theme}>Person 2</FormLabel>
                {/* Selected person 2 display */}
                {selectedIntroducee2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: theme === 'light' ? '#FEF3C7' : '#78350F',
                      color: theme === 'light' ? '#92400E' : '#FDE68A',
                      border: `2px solid #F59E0B`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {selectedIntroducee2.name || `${selectedIntroducee2.first_name} ${selectedIntroducee2.last_name}`}
                      <FaTimes
                        size={12}
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => setSelectedIntroducee2(null)}
                      />
                    </div>
                  </div>
                )}
                {/* Thread contacts suggestions */}
                {!selectedIntroducee2 && emailContacts.filter(p => p.contact?.contact_id).length > 0 && (
                  <>
                    <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      From this thread
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {emailContacts.filter(p => p.contact?.contact_id).map(p => {
                        const contactName = p.contact ? `${p.contact.first_name || ''} ${p.contact.last_name || ''}`.trim() : p.name;
                        const isDisabled = selectedIntroducee?.contact_id === p.contact.contact_id;
                        return (
                          <div
                            key={p.contact.contact_id}
                            onClick={() => !isDisabled && setSelectedIntroducee2(p.contact)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '16px',
                              fontSize: '13px',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.4 : 1,
                              border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                              background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                              color: theme === 'light' ? '#374151' : '#D1D5DB',
                            }}
                          >
                            {contactName || p.email}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {/* Search for other contacts */}
                {!selectedIntroducee2 && (
                  <>
                    <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Or search all contacts
                    </div>
                    <FormInput
                      theme={theme}
                      value={introducee2SearchQuery}
                      onChange={async (e) => {
                        const query = e.target.value;
                        setIntroducee2SearchQuery(query);
                        if (query.length >= 2) {
                          setSearchingIntroducee2(true);
                          const parts = query.trim().split(/\s+/).filter(p => p.length > 0);
                          let supabaseQuery = supabase
                            .from('contacts')
                            .select('contact_id, first_name, last_name');

                          if (parts.length >= 2) {
                            // Multi-word search: match first + last name in either order
                            const [first, ...rest] = parts;
                            const last = rest.join(' ');
                            supabaseQuery = supabaseQuery.or(
                              `and(first_name.ilike.%${first}%,last_name.ilike.%${last}%),and(first_name.ilike.%${last}%,last_name.ilike.%${first}%)`
                            );
                          } else {
                            // Single word: search in either field
                            supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
                          }

                          const { data } = await supabaseQuery.limit(8);
                          setIntroducee2SearchResults(data || []);
                          setSearchingIntroducee2(false);
                        } else {
                          setIntroducee2SearchResults([]);
                        }
                      }}
                      placeholder="Search by name..."
                      style={{ marginTop: '4px' }}
                    />
                    {searchingIntroducee2 && <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '4px' }}>Searching...</div>}
                    {introducee2SearchResults.length > 0 && (
                      <div style={{ marginTop: '8px', border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`, borderRadius: '8px', overflow: 'hidden', maxHeight: '150px', overflowY: 'auto' }}>
                        {introducee2SearchResults.map(contact => {
                          const isDisabled = selectedIntroducee?.contact_id === contact.contact_id;
                          return (
                            <div
                              key={contact.contact_id}
                              onClick={() => {
                                if (!isDisabled) {
                                  setSelectedIntroducee2(contact);
                                  setIntroducee2SearchQuery('');
                                  setIntroducee2SearchResults([]);
                                }
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.4 : 1,
                                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                                background: theme === 'light' ? '#fff' : '#1F2937',
                              }}
                              onMouseEnter={e => !isDisabled && (e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151')}
                              onMouseLeave={e => e.currentTarget.style.background = theme === 'light' ? '#fff' : '#1F2937'}
                            >
                              <div style={{ fontWeight: 500 }}>{contact.first_name} {contact.last_name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </FormField>

              {/* Status, Tool, Category */}
              {selectedIntroducee && selectedIntroducee2 && (
                <>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <FormField style={{ flex: 1 }}>
                      <FormLabel theme={theme}>Status</FormLabel>
                      <select
                        value={introductionStatus}
                        onChange={(e) => setIntroductionStatus(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          background: theme === 'light' ? '#fff' : '#1F2937',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Requested">Requested</option>
                        <option value="Promised">Promised</option>
                        <option value="Done & Dust">Done & Dust</option>
                        <option value="Done, but need to monitor">Done, but need to monitor</option>
                        <option value="Aborted">Aborted</option>
                      </select>
                    </FormField>
                    <FormField style={{ flex: 1 }}>
                      <FormLabel theme={theme}>Tool</FormLabel>
                      <select
                        value={introductionTool}
                        onChange={(e) => setIntroductionTool(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          background: theme === 'light' ? '#fff' : '#1F2937',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="in person">In Person</option>
                        <option value="other">Other</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField style={{ marginTop: '12px' }}>
                    <FormLabel theme={theme}>Category</FormLabel>
                    <select
                      value={introductionCategory}
                      onChange={(e) => setIntroductionCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Karma Points">Karma Points</option>
                      <option value="Dealflow">Dealflow</option>
                      <option value="Portfolio Company">Portfolio Company</option>
                    </select>
                  </FormField>

                  <FormField style={{ marginTop: '12px' }}>
                    <FormLabel theme={theme}>Notes (optional)</FormLabel>
                    <textarea
                      value={introductionText}
                      onChange={(e) => setIntroductionText(e.target.value)}
                      placeholder="Add any notes about this introduction..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical',
                      }}
                    />
                  </FormField>
                </>
              )}
            </ModalBody>

            <ModalFooter theme={theme}>
              <SendButton
                theme={theme}
                disabled={!selectedIntroducee || !selectedIntroducee2 || creatingIntroduction}
                onClick={async () => {
                  if (!selectedIntroducee || !selectedIntroducee2) return;
                  setCreatingIntroduction(true);

                  if (editingIntroduction) {
                    // Update existing introduction
                    const { error: updateError } = await supabase
                      .from('introductions')
                      .update({
                        introduction_tool: introductionTool,
                        status: introductionStatus,
                        text: introductionText || null,
                        category: introductionCategory
                      })
                      .eq('introduction_id', editingIntroduction.introduction_id);

                    if (updateError) {
                      console.error('Failed to update introduction:', updateError);
                      setCreatingIntroduction(false);
                      return;
                    }

                    // Update contacts if changed - delete old and insert new
                    await supabase
                      .from('introduction_contacts')
                      .delete()
                      .eq('introduction_id', editingIntroduction.introduction_id);

                    await supabase
                      .from('introduction_contacts')
                      .insert([
                        {
                          introduction_id: editingIntroduction.introduction_id,
                          contact_id: selectedIntroducee.contact_id,
                          role: 'introducee'
                        },
                        {
                          introduction_id: editingIntroduction.introduction_id,
                          contact_id: selectedIntroducee2.contact_id,
                          role: 'introducee'
                        }
                      ]);
                  } else {
                    // Create the introduction
                    const { data: newIntro, error: createError } = await supabase
                      .from('introductions')
                      .insert({
                        introduction_date: new Date().toISOString().split('T')[0],
                        introduction_tool: introductionTool,
                        status: introductionStatus,
                        text: introductionText || null,
                        category: introductionCategory
                      })
                      .select()
                      .single();

                    if (createError || !newIntro) {
                      console.error('Failed to create introduction:', createError);
                      setCreatingIntroduction(false);
                      return;
                    }

                    // Associate both contacts as introducees
                    await supabase
                      .from('introduction_contacts')
                      .insert([
                        {
                          introduction_id: newIntro.introduction_id,
                          contact_id: selectedIntroducee.contact_id,
                          role: 'introducee'
                        },
                        {
                          introduction_id: newIntro.introduction_id,
                          contact_id: selectedIntroducee2.contact_id,
                          role: 'introducee'
                        }
                      ]);
                  }

                  // Refresh introductions list
                  const contactIds = emailContacts.filter(p => p.contact?.contact_id).map(p => p.contact.contact_id);
                  const { data: introContactsData } = await supabase
                    .from('introduction_contacts')
                    .select('introduction_id, contact_id, role, introductions(introduction_id, introduction_date, introduction_tool, category, text, status, created_at)')
                    .in('contact_id', contactIds);

                  const introductionIds = [...new Set(introContactsData?.map(ic => ic.introduction_id) || [])];
                  let allIntroContacts = [];
                  if (introductionIds.length > 0) {
                    const { data: allContactsData } = await supabase
                      .from('introduction_contacts')
                      .select('introduction_id, contact_id, role, contacts(contact_id, first_name, last_name), introductions(introduction_id, introduction_date, introduction_tool, category, text, status, created_at)')
                      .in('introduction_id', introductionIds);
                    allIntroContacts = allContactsData || [];
                  }

                  const introMap = new Map();
                  allIntroContacts.forEach(ic => {
                    if (!ic.introductions) return;
                    const introId = ic.introductions.introduction_id;
                    if (!introMap.has(introId)) {
                      introMap.set(introId, { ...ic.introductions, contacts: [] });
                    }
                    const contactName = ic.contacts
                      ? `${ic.contacts.first_name || ''} ${ic.contacts.last_name || ''}`.trim() || 'Unknown'
                      : 'Unknown';
                    introMap.get(introId).contacts.push({
                      contact_id: ic.contact_id,
                      name: contactName,
                      role: ic.role
                    });
                  });
                  setContactIntroductions(Array.from(introMap.values()));

                  // Also refresh the right panel if showing introductions for the same contact
                  if (rightPanelContactDetails?.refetch) {
                    rightPanelContactDetails.refetch();
                  }

                  setCreatingIntroduction(false);
                  setIntroductionModalOpen(false);
                  setEditingIntroduction(null);
                  setSelectedIntroducee(null);
                  setSelectedIntroducee2(null);
                  setIntroductionStatus('Requested');
                  setIntroductionTool('email');
                  setIntroductionCategory('Karma Points');
                  setIntroductionText('');
                  setIntroduceeSearchQuery('');
                  setIntroduceeSearchResults([]);
                  setIntroducee2SearchQuery('');
                  setIntroducee2SearchResults([]);
                }}
              >
                {creatingIntroduction ? (editingIntroduction ? 'Saving...' : 'Creating...') : (editingIntroduction ? 'Save Changes' : 'Create Introduction')}
              </SendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Task Modal */}
      {taskModalOpen && (
        <ModalOverlay onClick={() => { setTaskModalOpen(false); resetTaskForm(); }}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaTasks style={{ marginRight: '8px', color: '#3B82F6' }} />
                {editingTask ? 'Edit Task' : 'Add Task'}
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => { setTaskModalOpen(false); resetTaskForm(); }}>
                <FaTimes size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody theme={theme}>
              {/* Task Content */}
              <FormField>
                <FormLabel theme={theme}>Task *</FormLabel>
                <FormInput
                  theme={theme}
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </FormField>

              {/* Description */}
              <FormField style={{ marginTop: '16px' }}>
                <FormLabel theme={theme}>Description</FormLabel>
                <FormTextarea
                  theme={theme}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                />
              </FormField>

              {/* Project and Section */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <FormField style={{ flex: 1 }}>
                  <FormLabel theme={theme}>Project</FormLabel>
                  <FormSelect
                    theme={theme}
                    value={newTaskProjectId}
                    onChange={(e) => {
                      setNewTaskProjectId(e.target.value);
                      setNewTaskSectionId('');
                    }}
                  >
                    {todoistProjects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField style={{ flex: 1 }}>
                  <FormLabel theme={theme}>Section</FormLabel>
                  <FormSelect
                    theme={theme}
                    value={newTaskSectionId}
                    onChange={(e) => setNewTaskSectionId(e.target.value)}
                  >
                    <option value="">None</option>
                    {todoistProjects
                      .find(p => p.id === newTaskProjectId)
                      ?.sections?.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))
                    }
                  </FormSelect>
                </FormField>
              </div>

              {/* Due Date and Priority */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <FormField style={{ flex: 1 }}>
                  <FormLabel theme={theme}>Due Date</FormLabel>
                  <FormInput
                    theme={theme}
                    value={newTaskDueString}
                    onChange={(e) => setNewTaskDueString(e.target.value)}
                    placeholder="tomorrow, next week, Dec 15..."
                  />
                </FormField>

                <FormField style={{ flex: 1 }}>
                  <FormLabel theme={theme}>Priority</FormLabel>
                  <FormSelect
                    theme={theme}
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(Number(e.target.value))}
                  >
                    <option value={1}>Normal</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                    <option value={4}>Urgent</option>
                  </FormSelect>
                </FormField>
              </div>

              {/* Link to email thread contacts - quick suggestions */}
              {emailContacts.filter(p => p.contact?.contact_id).length > 0 && (
                <FormField style={{ marginTop: '16px' }}>
                  <FormLabel theme={theme}>Link to contact from this thread</FormLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {emailContacts.filter(p => p.contact?.contact_id).slice(0, 5).map(p => (
                      <div
                        key={p.contact.contact_id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '13px',
                          background: theme === 'light' ? '#EBF5FF' : '#1E3A5F',
                          color: theme === 'light' ? '#2563EB' : '#93C5FD',
                          cursor: 'pointer',
                          border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#3B82F6'}`,
                        }}
                        onClick={() => {
                          const contactName = p.contact.first_name + (p.contact.last_name ? ` ${p.contact.last_name}` : '');
                          const crmLink = `https://crm-editor-frontend.netlify.app/contacts/${p.contact.contact_id}`;
                          setNewTaskDescription(prev =>
                            prev ? `${prev}\n\nContact: ${contactName}\nCRM: ${crmLink}` : `Contact: ${contactName}\nCRM: ${crmLink}`
                          );
                          toast.success(`Linked to ${contactName}`);
                        }}
                      >
                        {p.contact.first_name} {p.contact.last_name}
                      </div>
                    ))}
                  </div>
                </FormField>
              )}
            </ModalBody>

            <ModalFooter theme={theme}>
              <SendButton
                theme={theme}
                disabled={creatingTask || !newTaskContent.trim()}
                onClick={handleSaveTask}
              >
                {creatingTask ? 'Saving...' : (editingTask ? 'Save Changes' : 'Create Task')}
              </SendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <ModalOverlay onClick={() => { setNoteModalOpen(false); resetNoteForm(); }}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaStickyNote style={{ marginRight: '8px', color: '#8B5CF6' }} />
                {editingNote ? 'Edit Note' : 'Add Note'}
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => { setNoteModalOpen(false); resetNoteForm(); }}>
                <FaTimes size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody theme={theme}>
              {/* Note Title */}
              <FormField>
                <FormLabel theme={theme}>Title *</FormLabel>
                <FormInput
                  theme={theme}
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Meeting with John about project..."
                  autoFocus
                />
              </FormField>

              {/* Note Type */}
              <FormField style={{ marginTop: '16px' }}>
                <FormLabel theme={theme}>Type</FormLabel>
                <FormSelect
                  theme={theme}
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                >
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="research">Research</option>
                  <option value="idea">Idea</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="general">General</option>
                </FormSelect>
              </FormField>

              {/* Summary */}
              <FormField style={{ marginTop: '16px' }}>
                <FormLabel theme={theme}>Summary (optional)</FormLabel>
                <FormTextarea
                  theme={theme}
                  value={newNoteSummary}
                  onChange={(e) => setNewNoteSummary(e.target.value)}
                  placeholder="Brief description of the note..."
                  rows={3}
                />
              </FormField>

              {/* Obsidian Path (auto-generated but editable) */}
              <FormField style={{ marginTop: '16px' }}>
                <FormLabel theme={theme}>Obsidian Path</FormLabel>
                <FormInput
                  theme={theme}
                  value={newNoteObsidianPath || generateObsidianPath(newNoteType, newNoteTitle || 'Untitled')}
                  onChange={(e) => setNewNoteObsidianPath(e.target.value)}
                  placeholder="CRM/Meetings/2024-12-07 Meeting"
                />
                <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '4px' }}>
                  Vault: {OBSIDIAN_VAULT}
                </div>
              </FormField>

              {/* Linked Contacts Preview */}
              {emailContacts.filter(p => p.contact?.contact_id).length > 0 && (
                <FormField style={{ marginTop: '16px' }}>
                  <FormLabel theme={theme}>Will be linked to contacts</FormLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {emailContacts.filter(p => p.contact?.contact_id).slice(0, 5).map(p => (
                      <div
                        key={p.contact.contact_id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '13px',
                          background: theme === 'light' ? '#F3E8FF' : '#4C1D95',
                          color: theme === 'light' ? '#7C3AED' : '#C4B5FD',
                          border: `1px solid ${theme === 'light' ? '#DDD6FE' : '#7C3AED'}`,
                        }}
                      >
                        {p.contact.first_name} {p.contact.last_name}
                      </div>
                    ))}
                  </div>
                </FormField>
              )}
            </ModalBody>

            <ModalFooter theme={theme}>
              <SendButton
                theme={theme}
                disabled={creatingNote || !newNoteTitle.trim()}
                onClick={handleSaveNote}
              >
                {creatingNote ? 'Saving...' : (editingNote ? 'Save Changes' : 'Create & Open in Obsidian')}
              </SendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={profileImageModal.isOpen}
        onClose={profileImageModal.closeModal}
        contact={profileImageModal.contact}
        uploading={profileImageModal.uploading}
        fetchingFromLinkedIn={profileImageModal.fetchingFromLinkedIn}
        fetchingFromWhatsApp={profileImageModal.fetchingFromWhatsApp}
        imagePreview={profileImageModal.imagePreview}
        selectedFile={profileImageModal.selectedFile}
        onFileSelect={profileImageModal.handleFileSelect}
        onSave={profileImageModal.saveProfileImage}
        onFetchFromLinkedIn={profileImageModal.fetchFromLinkedIn}
        onFetchFromWhatsApp={profileImageModal.fetchFromWhatsApp}
        onRemoveImage={profileImageModal.removeProfileImage}
        theme={theme}
      />

      {/* Manage Contact Lists Modal */}
      <ManageContactListsModal
        isOpen={addToListModalOpen}
        onClose={() => {
          setAddToListModalOpen(false);
          setAddToListContact(null);
          // Refresh right panel contact details if same contact
          if (addToListContact && selectedRightPanelContactId === addToListContact.contact_id && rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
        contact={addToListContact}
        theme={theme}
        onListsUpdated={() => {
          // Refresh right panel contact details if same contact
          if (addToListContact && selectedRightPanelContactId === addToListContact.contact_id && rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
      />

      {/* Create Contact Modal (AI-First) */}
      <CreateContactModalAI
        isOpen={createContactModalOpen}
        onClose={() => {
          setCreateContactModalOpen(false);
          setCreateContactEmail(null);
        }}
        emailData={createContactEmail}
        theme={theme}
        onSuccess={async (newContact) => {
          // Remove from not in CRM list and hold list
          if (createContactEmail?.email) {
            setNotInCrmEmails(prev => prev.filter(item =>
              item.email.toLowerCase() !== createContactEmail.email.toLowerCase()
            ));
            // Also remove from hold list if present (by email)
            setHoldContacts(prev => prev.filter(c =>
              c.email?.toLowerCase() !== createContactEmail.email.toLowerCase()
            ));
            // Remove from contacts_hold table if it was there
            await supabase
              .from('contacts_hold')
              .delete()
              .eq('email', createContactEmail.email.toLowerCase());

            // Mark data_integrity_inbox issues as resolved for this email
            await supabase
              .from('data_integrity_inbox')
              .update({ status: 'resolved', resolved_at: new Date().toISOString() })
              .eq('email', createContactEmail.email.toLowerCase())
              .eq('issue_type', 'not_in_crm')
              .eq('entity_type', 'contact')
              .eq('status', 'pending');
          }

          // Handle WhatsApp contacts (by mobile)
          if (createContactEmail?.mobile) {
            // Remove from hold list by mobile
            setHoldContacts(prev => prev.filter(c =>
              c.mobile !== createContactEmail.mobile
            ));
            // Remove from contacts_hold table by mobile
            await supabase
              .from('contacts_hold')
              .delete()
              .eq('mobile', createContactEmail.mobile);
          }

          // Refresh data integrity stats and CRM contacts
          fetchDataIntegrity();
          refetchContacts();
          toast.success(`Contact ${newContact.first_name} ${newContact.last_name} created successfully!`);
        }}
      />

      {/* Add Company Modal (for CRM tab button) */}
      <AddCompanyModal
        isOpen={addCompanyModalOpen}
        onRequestClose={() => setAddCompanyModalOpen(false)}
        onSuccess={(company) => {
          toast.success(`Company ${company.name} created successfully!`);
          fetchDataIntegrity();
        }}
      />

      {/* Search/Create Company Modal (for CRM tab Add Company button and Keep in Touch Link Company) */}
      <SearchOrCreateCompanyModal
        isOpen={searchOrCreateCompanyModalOpen}
        onClose={() => {
          setSearchOrCreateCompanyModalOpen(false);
          setKitContactToLinkCompany(null);
        }}
        theme={theme}
        contactToLink={kitContactToLinkCompany || emailContacts?.find(c => c.contact?.contact_id)?.contact}
        contactEmails={kitContactToLinkCompany ? keepInTouchEmails : []}
        onCompanySelected={async (companyId) => {
          // Close search modal
          setSearchOrCreateCompanyModalOpen(false);

          // If linking from Keep in Touch, refresh companies list
          if (kitContactToLinkCompany) {
            const { data: companiesData } = await supabase
              .from('contact_companies')
              .select('contact_companies_id, company_id, is_primary, relationship')
              .eq('contact_id', kitContactToLinkCompany.contact_id)
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
              // Update keepInTouchContactDetails with the primary company
              const primaryCompany = companiesWithDetails.find(c => c.is_primary) || companiesWithDetails[0];
              if (primaryCompany?.company) {
                setKeepInTouchContactDetails(prev => ({
                  ...prev,
                  company: primaryCompany.company
                }));
              }
            }
            toast.success(`Company linked to ${kitContactToLinkCompany.first_name || 'contact'}`);
            setKitContactToLinkCompany(null);
          } else {
            // Open Company Data Integrity Modal for CRM tab
            setCompanyDataIntegrityCompanyId(companyId);
            setCompanyDataIntegrityModalOpen(true);
            // Refresh context contacts to update company info
            if (contextContactsHook?.refetchContacts) {
              setTimeout(() => contextContactsHook.refetchContacts(), 500);
            }
          }
        }}
      />

      {/* Domain Link Modal */}
      <DomainLinkModal
        isOpen={domainLinkModalOpen}
        onRequestClose={() => {
          setDomainLinkModalOpen(false);
          setSelectedDomainForLink(null);
          setKitContactToLinkCompany(null);
        }}
        domain={selectedDomainForLink?.domain || ''}
        sampleEmails={selectedDomainForLink?.sampleEmails || []}
        theme={theme}
        onDomainLinked={async ({ company, domain }) => {
          // If from Keep in Touch, link company to contact and refresh
          if (kitContactToLinkCompany) {
            try {
              // Check if link already exists
              const { data: existingLink } = await supabase
                .from('contact_companies')
                .select('contact_companies_id')
                .eq('contact_id', kitContactToLinkCompany.contact_id)
                .eq('company_id', company.company_id)
                .maybeSingle();

              if (!existingLink) {
                // Check if contact has any companies linked (for is_primary)
                const { data: existingCompanies } = await supabase
                  .from('contact_companies')
                  .select('contact_companies_id')
                  .eq('contact_id', kitContactToLinkCompany.contact_id)
                  .limit(1);

                const isPrimary = !existingCompanies || existingCompanies.length === 0;

                // Create the link
                await supabase
                  .from('contact_companies')
                  .insert({
                    contact_id: kitContactToLinkCompany.contact_id,
                    company_id: company.company_id,
                    is_primary: isPrimary
                  });
              }

              // Refresh keepInTouchCompanies
              const { data: companiesData } = await supabase
                .from('contact_companies')
                .select('contact_companies_id, company_id, is_primary, relationship')
                .eq('contact_id', kitContactToLinkCompany.contact_id)
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
                // Update keepInTouchContactDetails with the primary company
                const primaryCompany = companiesWithDetails.find(c => c.is_primary) || companiesWithDetails[0];
                if (primaryCompany?.company) {
                  setKeepInTouchContactDetails(prev => ({
                    ...prev,
                    company: primaryCompany.company
                  }));
                }
              }

              toast.success(`Company ${company.name} linked to ${kitContactToLinkCompany.first_name || 'contact'}`);
            } catch (error) {
              console.error('Error linking company to contact:', error);
              toast.error('Failed to link company to contact');
            }
            setKitContactToLinkCompany(null);
            return;
          }

          // Remove from not in CRM list
          setNotInCrmDomains(prev => prev.filter(item => item.domain !== domain));

          // Mark data_integrity_inbox issues as resolved for this domain
          await supabase
            .from('data_integrity_inbox')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('domain', domain)
            .eq('issue_type', 'not_in_crm')
            .eq('entity_type', 'company')
            .eq('status', 'pending');

          toast.success(`Domain ${domain} linked to ${company.name}`);
          // Refresh data
          fetchDataIntegrity();
        }}
        onCreateCompany={({ domain, sampleEmails }) => {
          setCreateCompanyInitialDomain(domain);
          setCreateCompanyModalOpen(true);
        }}
      />

      {/* Create Company Modal (for new companies from domain link) */}
      <CreateCompanyModal
        isOpen={createCompanyModalOpen}
        onRequestClose={() => {
          setCreateCompanyModalOpen(false);
          setCreateCompanyInitialDomain('');
        }}
        initialName=""
        contactEmail={`@${createCompanyInitialDomain}`}
        theme={theme}
        isNewCrm={true}
        onCompanyCreated={async ({ company }) => {
          // Add domain to company_domains
          if (createCompanyInitialDomain) {
            try {
              await supabase
                .from('company_domains')
                .insert({
                  company_id: company.company_id,
                  domain: createCompanyInitialDomain.toLowerCase(),
                  is_primary: true
                });

              // Remove from not in CRM list
              setNotInCrmDomains(prev => prev.filter(item => item.domain !== createCompanyInitialDomain));
              toast.success(`Company ${company.name} created with domain ${createCompanyInitialDomain}`);
            } catch (error) {
              console.error('Error adding domain to company:', error);
            }
          }
          // Refresh data
          fetchDataIntegrity();
        }}
      />

      {/* Delete/Skip/Spam Modal for Category Missing contacts */}
      <DeleteSkipSpamModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        contact={deleteModalContact}
        theme={theme}
      />

      {/* Edit Company Modal for Category Missing companies */}
      <EditCompanyModal
        isOpen={editCompanyModalOpen}
        onRequestClose={handleCloseEditCompanyModal}
        company={editCompanyModalCompany}
      />

      {/* Attachment Save Modal */}
      <AttachmentSaveModal
        isOpen={attachmentModalOpen}
        onRequestClose={() => setAttachmentModalOpen(false)}
        attachments={pendingAttachments}
        emailParticipants={emailContacts}
        theme={theme}
        onSave={handleAttachmentModalClose}
        onSkip={handleAttachmentModalClose}
        backendUrl={BACKEND_URL}
      />

      {/* Data Integrity Modal (Contacts) */}
      <DataIntegrityModal
        isOpen={dataIntegrityModalOpen}
        onClose={async () => {
          setDataIntegrityModalOpen(false);
          setDataIntegrityContactId(null);
          // Refresh right panel contact details if same contact
          if (dataIntegrityContactId && selectedRightPanelContactId === dataIntegrityContactId && rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
          // Refresh Keep in Touch contact data on close
          if (keepInTouchContactDetails?.contact_id) {
            // Fetch updated contact data
            const { data: contactData } = await supabase
              .from('contacts')
              .select('job_role, first_name, last_name')
              .eq('contact_id', keepInTouchContactDetails.contact_id)
              .maybeSingle();
            // Fetch christmas/easter from keep_in_touch
            const { data: kitData } = await supabase
              .from('keep_in_touch')
              .select('christmas, easter')
              .eq('contact_id', keepInTouchContactDetails.contact_id)
              .maybeSingle();
            // Fetch completeness score
            const { data: completenessData } = await supabase
              .from('contact_completeness')
              .select('completeness_score')
              .eq('contact_id', keepInTouchContactDetails.contact_id)
              .maybeSingle();
            // Update keepInTouchContactDetails
            if (contactData || completenessData || kitData) {
              setKeepInTouchContactDetails(prev => ({
                ...prev,
                ...(contactData || {}),
                ...(kitData || {}),
                completeness_score: completenessData ? Math.round(completenessData.completeness_score) : prev?.completeness_score
              }));
            }
            // Also update selectedKeepInTouchContact for the dropdowns
            if (kitData) {
              setSelectedKeepInTouchContact(prev => ({
                ...prev,
                christmas: kitData.christmas,
                easter: kitData.easter
              }));
            }
          }
        }}
        contactId={dataIntegrityContactId}
        theme={theme}
        onRefresh={async () => {
          // Refresh emailContacts to update completeness scores
          if (selectedThread && selectedThread.length > 0) {
            // Trigger re-fetch by updating a dependency
            setSelectedThread([...selectedThread]);
          }
          // Refresh Keep in Touch contact completeness score
          if (keepInTouchContactDetails?.contact_id) {
            const { data: completenessData } = await supabase
              .from('contact_completeness')
              .select('completeness_score')
              .eq('contact_id', keepInTouchContactDetails.contact_id)
              .maybeSingle();
            if (completenessData) {
              setKeepInTouchContactDetails(prev => ({
                ...prev,
                completeness_score: Math.round(completenessData.completeness_score)
              }));
            }
          }
        }}
      />

      {/* Company Data Integrity Modal */}
      <CompanyDataIntegrityModal
        isOpen={companyDataIntegrityModalOpen}
        onClose={() => { setCompanyDataIntegrityModalOpen(false); setCompanyDataIntegrityCompanyId(null); fetchDataIntegrity(); }}
        companyId={companyDataIntegrityCompanyId}
        theme={theme}
        onRefresh={() => {
          // Refresh email companies to update completeness scores
          if (selectedThread && selectedThread.length > 0) {
            setSelectedThread([...selectedThread]);
          }
          // Also refresh data integrity lists
          fetchDataIntegrity();
          // Refresh right panel company details if this company is currently displayed
          if (companyDataIntegrityCompanyId && companyDataIntegrityCompanyId === selectedRightPanelCompanyId) {
            setRightPanelCompanyRefreshKey(k => k + 1);
          }
          // Also refresh contact details to update company info
          if (rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
      />

      {/* Keep in Touch - Contact Enrichment Modal */}
      <ContactEnrichmentModal
        isOpen={kitEnrichmentModalOpen}
        onClose={() => setKitEnrichmentModalOpen(false)}
        contact={keepInTouchContactDetails}
        contactEmails={keepInTouchEmails}
        onEnrichComplete={async () => {
          setKitEnrichmentModalOpen(false);
          // Refresh right panel contact details if same contact
          if (selectedKeepInTouchContact?.contact_id && selectedRightPanelContactId === selectedKeepInTouchContact.contact_id && rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
          // Refresh contact data
          if (selectedKeepInTouchContact?.contact_id) {
            const { data: contactData } = await supabase
              .from('contacts')
              .select('*')
              .eq('contact_id', selectedKeepInTouchContact.contact_id)
              .maybeSingle();
            const { data: completenessData } = await supabase
              .from('contact_completeness')
              .select('completeness_score')
              .eq('contact_id', selectedKeepInTouchContact.contact_id)
              .maybeSingle();
            if (contactData || completenessData) {
              setKeepInTouchContactDetails(prev => ({
                ...prev,
                ...(contactData || {}),
                completeness_score: completenessData ? Math.round(completenessData.completeness_score) : prev?.completeness_score
              }));
            }
          }
        }}
        theme={theme}
      />

      {/* Keep in Touch - Company Enrichment Modal */}
      <CompanyEnrichmentModal
        isOpen={kitCompanyEnrichmentModalOpen}
        onClose={() => setKitCompanyEnrichmentModalOpen(false)}
        company={kitCompanyDetails ? { ...kitCompanyDetails, company_id: selectedKitCompanyId } : null}
        companyDomains={kitCompanyDomains}
        onEnrichComplete={async () => {
          setKitCompanyEnrichmentModalOpen(false);
          // Refresh company data
          if (selectedKitCompanyId) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('company_id', selectedKitCompanyId)
              .maybeSingle();
            const { data: completenessData } = await supabase
              .from('company_completeness')
              .select('completeness_score')
              .eq('company_id', selectedKitCompanyId)
              .maybeSingle();
            if (companyData) {
              setKitCompanyDetails({
                ...companyData,
                completeness_score: completenessData?.completeness_score || 0
              });
            }
            // Refresh domains
            const { data: domainsData } = await supabase
              .from('company_domains')
              .select('*')
              .eq('company_id', selectedKitCompanyId)
              .order('is_primary', { ascending: false });
            setKitCompanyDomains(domainsData || []);
            // Refresh tags
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
              setKitCompanyTags(tagsData.map(ct => ({
                ...ct,
                tags: tagDetails?.find(t => t.tag_id === ct.tag_id)
              })));
            }
            // Refresh logo
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
          }
        }}
        theme={theme}
      />

      {/* Right Panel - Company Enrichment Modal */}
      <CompanyEnrichmentModal
        isOpen={rightPanelCompanyEnrichModalOpen}
        onClose={() => setRightPanelCompanyEnrichModalOpen(false)}
        company={rightPanelCompanyDetails?.company ? { ...rightPanelCompanyDetails.company, company_id: selectedRightPanelCompanyId } : null}
        companyDomains={rightPanelCompanyDetails?.domains || []}
        onEnrichComplete={async () => {
          setRightPanelCompanyEnrichModalOpen(false);
          // Refresh right panel company data
          if (selectedRightPanelCompanyId) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('company_id', selectedRightPanelCompanyId)
              .maybeSingle();
            if (companyData) {
              setRightPanelCompanyDetails(prev => ({
                ...prev,
                company: companyData
              }));
            }
          }
        }}
        theme={theme}
      />

      {/* Company Merge/Duplicate Modal */}
      <MergeCompanyModal
        isOpen={companyMergeModalOpen}
        onRequestClose={() => {
          setCompanyMergeModalOpen(false);
          setCompanyMergeCompany(null);
          // Refresh right panel after merge
          if (rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
        company={companyMergeCompany}
      />

      {/* Company Main Modal (for mobile) */}
      {companyMainModalOpen && companyMainModalId && (
        <CompanyMainModal
          isOpen={companyMainModalOpen}
          onClose={() => {
            setCompanyMainModalOpen(false);
            setCompanyMainModalId(null);
          }}
          companyId={companyMainModalId}
        />
      )}

      {/* Company Tags Modal */}
      <CompanyTagsModal
        isOpen={companyTagsModalOpen}
        onRequestClose={() => {
          setCompanyTagsModalOpen(false);
          // Refresh company details to show updated tags
          setRightPanelCompanyRefreshKey(k => k + 1);
        }}
        company={selectedCompanyForModal}
        theme={theme}
      />

      {/* Company City Modal */}
      <CompanyCityModal
        isOpen={companyCityModalOpen}
        onRequestClose={() => {
          setCompanyCityModalOpen(false);
          // Refresh company details to show updated cities
          setRightPanelCompanyRefreshKey(k => k + 1);
        }}
        company={selectedCompanyForModal}
        theme={theme}
      />

      {/* Create Company from Domain Modal */}
      <CreateCompanyFromDomainModal
        isOpen={createCompanyFromDomainModalOpen}
        onClose={() => {
          setCreateCompanyFromDomainModalOpen(false);
          setCreateCompanyFromDomainData(null);
        }}
        domainData={createCompanyFromDomainData}
        theme={theme}
        onSuccess={handleCreateCompanyFromDomainSuccess}
      />

      {/* Link to Existing Modal */}
      <LinkToExistingModal
        isOpen={linkToExistingModalOpen}
        onClose={() => {
          setLinkToExistingModalOpen(false);
          setLinkToExistingItemData(null);
        }}
        entityType={linkToExistingEntityType}
        itemData={linkToExistingItemData}
        theme={theme}
        onLink={handleLinkSuccess}
        onCreateNew={handleCreateNewFromLinkModal}
      />

      {/* Link Chat to Introduction Modal */}
      {linkChatModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
              }}>
                Link to Existing Chat
              </h3>
              <button
                onClick={() => setLinkChatModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  padding: '4px',
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '16px',
            }}>
              {availableChatsToLink.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  <FaWhatsapp size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div>No group chats available</div>
                </div>
              ) : (
                availableChatsToLink.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => handleLinkChatToIntro(chat)}
                    disabled={linkingChat}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                      backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      cursor: linkingChat ? 'not-allowed' : 'pointer',
                      opacity: linkingChat ? 0.6 : 1,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <FaWhatsapp size={18} style={{ color: '#25D366', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 500,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {chat.chat_name}
                      </div>
                      {chat.external_chat_id && (
                        <div style={{
                          fontSize: '11px',
                          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                          marginTop: '2px',
                        }}>
                          TimelinesAI linked
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setLinkChatModalOpen(false)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#D1D5DB' : '#374151',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link Email Thread to Introduction Modal */}
      {linkEmailModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
              }}>
                Link to Email Thread
              </h3>
              <button
                onClick={() => setLinkEmailModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  padding: '4px',
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '16px',
            }}>
              {availableEmailThreadsToLink.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  <FaEnvelope size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div>No email threads found</div>
                </div>
              ) : (
                availableEmailThreadsToLink.map(thread => (
                  <button
                    key={thread.email_thread_id}
                    onClick={() => handleLinkEmailToIntro(thread)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                      backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <FaEnvelope size={16} style={{ color: '#3B82F6', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 500,
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {thread.subject || '(No subject)'}
                      </div>
                      {thread.last_message_timestamp && (
                        <div style={{
                          fontSize: '11px',
                          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                          marginTop: '2px',
                        }}>
                          {new Date(thread.last_message_timestamp).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setLinkEmailModalOpen(false)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#D1D5DB' : '#374151',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Deal AI Modal */}
      <CreateDealAI
        isOpen={createDealAIOpen}
        onClose={() => setCreateDealAIOpen(false)}
        email={selectedThread?.[0] || null}
        whatsappChat={selectedWhatsappChat}
        sourceType={activeTab}
        theme={theme}
        onSuccess={(newDeal) => {
          // Refresh deals list
          const fetchDeals = async () => {
            const contactIds = emailContacts?.filter(p => p.contact?.contact_id).map(p => p.contact.contact_id) || [];
            if (contactIds.length === 0) return;

            const { data: dealsContactsData } = await supabase
              .from('deals_contacts')
              .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at, deal_attachments(attachment_id, attachments(attachment_id, file_name, file_type, file_size, permanent_url)))')
              .in('contact_id', contactIds);

            const dealsMap = new Map();
            if (dealsContactsData) {
              dealsContactsData.forEach(dc => {
                if (!dc.deals) return;
                const dealId = dc.deals.deal_id;
                if (!dealsMap.has(dealId)) {
                  dealsMap.set(dealId, { ...dc.deals, contacts: [] });
                }
                const contact = emailContacts.find(p => p.contact?.contact_id === dc.contact_id)?.contact;
                if (contact) {
                  dealsMap.get(dealId).contacts.push({
                    ...contact,
                    relationship: dc.relationship
                  });
                }
              });
              setContactDeals(Array.from(dealsMap.values()));
            }
          };
          fetchDeals();
        }}
      />

      {/* Keep in Touch - Manage Emails Modal */}
      <ManageContactEmailsModal
        isOpen={kitManageEmailsOpen}
        onClose={() => setKitManageEmailsOpen(false)}
        contact={selectedKeepInTouchContact}
        theme={theme}
        onEmailsUpdated={() => {
          // Refresh emails for the selected contact
          if (selectedKeepInTouchContact?.contact_id) {
            supabase
              .from('contact_emails')
              .select('email_id, email, is_primary')
              .eq('contact_id', selectedKeepInTouchContact.contact_id)
              .order('is_primary', { ascending: false })
              .then(({ data }) => setKeepInTouchEmails(data || []));
          }
        }}
      />

      {/* Keep in Touch - Manage Mobiles Modal */}
      <ManageContactMobilesModal
        isOpen={kitManageMobilesOpen}
        onClose={() => setKitManageMobilesOpen(false)}
        contact={selectedKeepInTouchContact}
        theme={theme}
        onMobilesUpdated={() => {
          // Refresh mobiles for the selected contact
          if (selectedKeepInTouchContact?.contact_id) {
            supabase
              .from('contact_mobiles')
              .select('mobile_id, mobile, is_primary')
              .eq('contact_id', selectedKeepInTouchContact.contact_id)
              .order('is_primary', { ascending: false })
              .then(({ data }) => setKeepInTouchMobiles(data || []));
          }
        }}
      />

      {/* Right Panel - Manage Emails Modal */}
      <ManageContactEmailsModal
        isOpen={manageEmailsModalOpen}
        onClose={() => setManageEmailsModalOpen(false)}
        contact={contactForManageModal}
        theme={theme}
        onEmailsUpdated={() => {
          rightPanelContactDetails?.refetch?.();
        }}
      />

      {/* Right Panel - Manage Mobiles Modal */}
      <ManageContactMobilesModal
        isOpen={manageMobilesModalOpen}
        onClose={() => setManageMobilesModalOpen(false)}
        contact={contactForManageModal}
        theme={theme}
        onMobilesUpdated={() => {
          rightPanelContactDetails?.refetch?.();
        }}
      />

      {/* Keep in Touch - Tags Modal */}
      <ManageContactTagsModal
        isOpen={kitTagsModalOpen}
        onClose={() => {
          setKitTagsModalOpen(false);
          // Refresh right panel if same contact
          if (selectedKeepInTouchContact?.contact_id === selectedRightPanelContactId && rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
        contact={selectedKeepInTouchContact}
        theme={theme}
        onTagsUpdated={async () => {
          // Refresh tags for the selected contact
          if (selectedKeepInTouchContact?.contact_id) {
            const { data: tagsData } = await supabase
              .from('contact_tags')
              .select('entry_id, tag_id')
              .eq('contact_id', selectedKeepInTouchContact.contact_id);
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
            // Also refresh right panel if same contact
            if (selectedKeepInTouchContact.contact_id === selectedRightPanelContactId && rightPanelContactDetails?.refetch) {
              rightPanelContactDetails.refetch();
            }
          }
        }}
      />

      {/* Keep in Touch - City Modal */}
      <ManageContactCitiesModal
        isOpen={kitCityModalOpen}
        onClose={() => {
          setKitCityModalOpen(false);
          // Refresh right panel if same contact
          if (selectedKeepInTouchContact?.contact_id === selectedRightPanelContactId && rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
        contact={selectedKeepInTouchContact}
        theme={theme}
        onCitiesUpdated={async () => {
          // Refresh cities for the selected contact
          if (selectedKeepInTouchContact?.contact_id) {
            const { data: citiesData } = await supabase
              .from('contact_cities')
              .select('entry_id, city_id')
              .eq('contact_id', selectedKeepInTouchContact.contact_id);
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
            // Also refresh right panel if same contact
            if (selectedKeepInTouchContact.contact_id === selectedRightPanelContactId && rightPanelContactDetails?.refetch) {
              rightPanelContactDetails.refetch();
            }
          }
        }}
      />

      {/* Keep in Touch - Company Management Modal */}
      <ManageContactCompaniesModal
        isOpen={!!kitCompanyModalContact}
        onClose={() => setKitCompanyModalContact(null)}
        contact={kitCompanyModalContact || selectedKeepInTouchContact}
        theme={theme}
        onCompaniesUpdated={async () => {
          // Refresh companies for the selected contact
          if (selectedKeepInTouchContact?.contact_id) {
            const { data: companiesData } = await supabase
              .from('contact_companies')
              .select('contact_companies_id, company_id, is_primary, relationship')
              .eq('contact_id', selectedKeepInTouchContact.contact_id)
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
          }
        }}
      />

      {/* Data Integrity - Link Company Modal (for contacts without email) */}
      <ManageContactCompaniesModal
        isOpen={!!linkCompanyModalContact}
        onClose={async () => {
          // When closing, check if contact now has a company linked and resolve the issue
          if (linkCompanyModalContact?.contact_id) {
            const { data: linkedCompanies } = await supabase
              .from('contact_companies')
              .select('company_id')
              .eq('contact_id', linkCompanyModalContact.contact_id)
              .limit(1);

            if (linkedCompanies && linkedCompanies.length > 0) {
              // Contact has a company linked - mark issues as resolved
              const issueIds = linkCompanyModalContact.issue_ids || (linkCompanyModalContact.issue_id ? [linkCompanyModalContact.issue_id] : []);
              if (issueIds.length > 0) {
                await supabase
                  .from('data_integrity_inbox')
                  .update({ status: 'resolved', resolved_at: new Date().toISOString() })
                  .in('id', issueIds);
              }
              // Remove from the list
              setContactsMissingCompany(prev =>
                prev.filter(c => c.contact_id !== linkCompanyModalContact.contact_id)
              );
            }
          }
          setLinkCompanyModalContact(null);
        }}
        contact={linkCompanyModalContact}
        theme={theme}
        onCompaniesUpdated={async () => {
          // Remove from contactsMissingCompany list and mark issue as resolved
          if (linkCompanyModalContact?.contact_id) {
            // Mark all data_integrity_inbox issues as resolved
            const issueIds = linkCompanyModalContact.issue_ids || (linkCompanyModalContact.issue_id ? [linkCompanyModalContact.issue_id] : []);
            if (issueIds.length > 0) {
              await supabase
                .from('data_integrity_inbox')
                .update({ status: 'resolved', resolved_at: new Date().toISOString() })
                .in('id', issueIds);
            }
            // Remove from the list
            setContactsMissingCompany(prev =>
              prev.filter(c => c.contact_id !== linkCompanyModalContact.contact_id)
            );

            // If this is the selected Keep in Touch contact, refresh companies
            if (selectedKeepInTouchContact?.contact_id === linkCompanyModalContact.contact_id) {
              const { data: companiesData } = await supabase
                .from('contact_companies')
                .select('contact_companies_id, company_id, is_primary, relationship')
                .eq('contact_id', linkCompanyModalContact.contact_id)
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
                // Also update the company in keepInTouchContactDetails
                const primaryCompany = companiesWithDetails.find(c => c.is_primary) || companiesWithDetails[0];
                if (primaryCompany?.company) {
                  setKeepInTouchContactDetails(prev => ({
                    ...prev,
                    company: primaryCompany.company
                  }));
                }
              }
            }

            toast.success(`Company linked to ${linkCompanyModalContact.first_name || 'contact'}`);
          }
        }}
      />

      {/* Right Panel - Associate Company Modal */}
      <ManageContactCompaniesModal
        isOpen={rightPanelAssociateCompanyModalOpen}
        onClose={() => setRightPanelAssociateCompanyModalOpen(false)}
        contact={rightPanelContactDetails?.contact}
        theme={theme}
        onCompaniesUpdated={() => {
          // Refresh right panel contact details
          if (rightPanelContactDetails?.refetch) {
            rightPanelContactDetails.refetch();
          }
        }}
      />

      {/* Baileys QR Code Modal */}
      {showBaileysQRModal && (
        <ModalOverlay onClick={() => setShowBaileysQRModal(false)}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaWhatsapp style={{ marginRight: '8px', color: '#25D366' }} />
                Connect WhatsApp (Baileys)
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => setShowBaileysQRModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody theme={theme}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {baileysStatus.status === 'connected' ? (
                  <div>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: theme === 'light' ? '#D1FAE5' : '#065F46',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <FaCheck size={28} style={{ color: theme === 'light' ? '#059669' : '#6EE7B7' }} />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Connected!</p>
                    <p style={{ fontSize: '13px', opacity: 0.7 }}>WhatsApp Baileys is connected and ready to send messages.</p>
                  </div>
                ) : baileysStatus.hasQR || baileysStatus.status === 'qr_ready' ? (
                  <div>
                    <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                      Scan this QR code with WhatsApp on your phone:
                    </p>
                    <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>
                      WhatsApp → Settings → Linked Devices → Link a Device
                    </p>
                    <img
                      src={`${BACKEND_URL}/whatsapp/qr-image?t=${Date.now()}`}
                      alt="WhatsApp QR Code"
                      style={{
                        maxWidth: '280px',
                        width: '100%',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '12px' }}>
                      QR codes expire after ~60 seconds. Refresh if needed.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`${BACKEND_URL}/whatsapp/connect`, { method: 'POST' });
                          // Force re-fetch status
                          const res = await fetch(`${BACKEND_URL}/whatsapp/status`);
                          const data = await res.json();
                          setBaileysStatus(data);
                        } catch (e) {
                          console.error('Reconnect error:', e);
                        }
                      }}
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: theme === 'light' ? '#F3F4F6' : '#374151',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Refresh QR
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <FaTimes size={28} style={{ color: theme === 'light' ? '#DC2626' : '#FCA5A5' }} />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Disconnected</p>
                    <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                      {baileysStatus.error || 'WhatsApp Baileys is not connected.'}
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`${BACKEND_URL}/whatsapp/connect`, { method: 'POST' });
                          // Wait a bit then re-fetch status
                          setTimeout(async () => {
                            const res = await fetch(`${BACKEND_URL}/whatsapp/status`);
                            const data = await res.json();
                            setBaileysStatus(data);
                          }, 2000);
                        } catch (e) {
                          console.error('Connect error:', e);
                          toast.error('Failed to connect to Baileys');
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#25D366',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      Connect Baileys
                    </button>
                  </div>
                )}
              </div>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* New WhatsApp Message Modal */}
      {newWhatsAppModalOpen && (
        <ModalOverlay onClick={() => {
          setNewWhatsAppModalOpen(false);
          setNewWhatsAppContact(null);
          setNewWhatsAppMessage('');
          setNewWhatsAppSearchQuery('');
          setNewWhatsAppSearchResults([]);
        }}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaWhatsapp style={{ marginRight: '8px', color: '#25D366' }} />
                New WhatsApp Message
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => {
                setNewWhatsAppModalOpen(false);
                setNewWhatsAppContact(null);
                setNewWhatsAppMessage('');
                setNewWhatsAppSearchQuery('');
                setNewWhatsAppSearchResults([]);
              }}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Contact Search */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                    To *
                  </label>
                  {newWhatsAppContact ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: theme === 'light' ? '#D1FAE5' : '#064E3B',
                      color: theme === 'light' ? '#065F46' : '#6EE7B7'
                    }}>
                      {newWhatsAppContact.profile_image_url ? (
                        <img src={newWhatsAppContact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      ) : (
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: theme === 'light' ? '#10B981' : '#065F46',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {(newWhatsAppContact.first_name?.[0] || '') + (newWhatsAppContact.last_name?.[0] || '')}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {newWhatsAppContact.first_name} {newWhatsAppContact.last_name}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{newWhatsAppContact.phone}</div>
                      </div>
                      <button
                        onClick={() => setNewWhatsAppContact(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={newWhatsAppSearchQuery}
                        onChange={(e) => handleNewWhatsAppSearch(e.target.value)}
                        placeholder="Search contact by name..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          background: theme === 'light' ? '#FFFFFF' : '#374151',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: '14px'
                        }}
                        autoFocus
                      />
                      {newWhatsAppSearchResults.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          borderRadius: '8px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 10,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          {newWhatsAppSearchResults.map(contact => (
                            <div
                              key={contact.contact_id}
                              onClick={() => {
                                setNewWhatsAppContact(contact);
                                setNewWhatsAppSearchQuery('');
                                setNewWhatsAppSearchResults([]);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${theme === 'light' ? '#F3F4F6' : '#374151'}`
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = theme === 'light' ? '#F9FAFB' : '#374151'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {contact.profile_image_url ? (
                                <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                              ) : (
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: '#25D366',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}>
                                  {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                  {contact.first_name} {contact.last_name}
                                </div>
                                <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                  {contact.phone}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                    Message *
                  </label>
                  <textarea
                    value={newWhatsAppMessage}
                    onChange={(e) => setNewWhatsAppMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: theme === 'light' ? '#FFFFFF' : '#374151',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      setNewWhatsAppModalOpen(false);
                      setNewWhatsAppContact(null);
                      setNewWhatsAppMessage('');
                      setNewWhatsAppSearchQuery('');
                      setNewWhatsAppSearchResults([]);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: 'transparent',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNewWhatsApp}
                    disabled={!newWhatsAppContact || !newWhatsAppMessage.trim() || newWhatsAppSending}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: newWhatsAppContact && newWhatsAppMessage.trim() && !newWhatsAppSending ? '#25D366' : '#9CA3AF',
                      color: 'white',
                      cursor: newWhatsAppContact && newWhatsAppMessage.trim() && !newWhatsAppSending ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaPaperPlane size={14} />
                    {newWhatsAppSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Create Deal Modal */}
      {createDealModalOpen && (
        <ModalOverlay onClick={() => setCreateDealModalOpen(false)}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaDollarSign style={{ marginRight: '8px', color: '#10B981' }} />
                New Deal
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => setCreateDealModalOpen(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Deal Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    value={newDealForm.opportunity}
                    onChange={(e) => setNewDealForm(prev => ({ ...prev, opportunity: e.target.value }))}
                    placeholder="Enter deal name..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: theme === 'light' ? '#FFFFFF' : '#374151',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                    Category
                  </label>
                  <select
                    value={newDealForm.category}
                    onChange={(e) => setNewDealForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: theme === 'light' ? '#FFFFFF' : '#374151',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px'
                    }}
                  >
                    {DEAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Investment Amount */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                      Investment Amount
                    </label>
                    <input
                      type="number"
                      value={newDealForm.total_investment}
                      onChange={(e) => setNewDealForm(prev => ({ ...prev, total_investment: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#FFFFFF' : '#374151',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                      Currency
                    </label>
                    <select
                      value={newDealForm.deal_currency}
                      onChange={(e) => setNewDealForm(prev => ({ ...prev, deal_currency: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#FFFFFF' : '#374151',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px'
                      }}
                    >
                      {DEAL_CURRENCIES.map(cur => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                    Description
                  </label>
                  <textarea
                    value={newDealForm.description}
                    onChange={(e) => setNewDealForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter deal description..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: theme === 'light' ? '#FFFFFF' : '#374151',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      setCreateDealModalOpen(false);
                      setCreateDealAIOpen(true);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#8B5CF6' : '#8B5CF6'}`,
                      background: 'transparent',
                      color: '#8B5CF6',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaRobot size={14} />
                    Crea con AI
                  </button>
                  <button
                    onClick={() => setCreateDealModalOpen(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      background: 'transparent',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDeal}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#10B981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Create Deal
                  </button>
                </div>
              </div>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default CommandCenterPage;

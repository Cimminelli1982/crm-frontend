import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { FaEnvelope, FaWhatsapp, FaCalendar, FaChevronLeft, FaChevronRight, FaChevronDown, FaUser, FaBuilding, FaDollarSign, FaStickyNote, FaTimes, FaPaperPlane, FaTrash, FaLightbulb, FaHandshake, FaTasks, FaSave, FaArchive, FaCrown, FaPaperclip, FaRobot, FaCheck, FaCheckCircle, FaCheckDouble, FaImage, FaEdit, FaPlus, FaExternalLinkAlt, FaDownload, FaCopy, FaDatabase, FaExclamationTriangle, FaUserSlash, FaClone, FaUserCheck, FaTag, FaClock, FaBolt, FaUpload, FaFileAlt } from 'react-icons/fa';
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
import CreateDealAI from '../components/modals/CreateDealAI';
import { findContactDuplicatesForThread, findCompanyDuplicatesForThread } from '../utils/duplicateDetection';
import DataIntegrityTab from '../components/command-center/DataIntegrityTab';
import ChatTab from '../components/command-center/ChatTab';
import AITab from '../components/command-center/AITab';
import CRMTab from '../components/command-center/CRMTab';
import DealsTab from '../components/command-center/DealsTab';
import IntroductionsTab from '../components/command-center/IntroductionsTab';
import TasksTab from '../components/command-center/TasksTab';
import NotesTab from '../components/command-center/NotesTab';
import ComposeEmailModal from '../components/command-center/ComposeEmailModal';
import WhatsAppTab, { WhatsAppChatList } from '../components/command-center/WhatsAppTab';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app'; // CRM Agent Service


// Helper to sanitize email HTML - removes cid: image references that can't be displayed
const sanitizeEmailHtml = (html) => {
  if (!html) return html;
  // Remove img tags with cid: src (embedded images we can't display)
  // Replace with a placeholder or remove entirely
  return html
    .replace(/<img[^>]*src=["']cid:[^"']*["'][^>]*>/gi, '')
    .replace(/src=["']cid:[^"']*["']/gi, 'src=""');
};

// Main Component
const CommandCenterPage = ({ theme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');

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

  // WhatsApp state
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappChats, setWhatsappChats] = useState([]); // Grouped by chat_id
  const [selectedWhatsappChat, setSelectedWhatsappChat] = useState(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Baileys WhatsApp connection status
  const [baileysStatus, setBaileysStatus] = useState({ status: 'unknown', hasQR: false });
  const [showBaileysQRModal, setShowBaileysQRModal] = useState(false);

  // Expanded sections state for left panel (inbox, need_actions, waiting_input)
  const [statusSections, setStatusSections] = useState({
    inbox: true,
    need_actions: false,
    waiting_input: false
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

  // Calendar sections state (needReview, thisWeek, upcoming)
  const [calendarSections, setCalendarSections] = useState({
    needReview: true,
    thisWeek: true,
    upcoming: true
  });

  const toggleCalendarSection = (section) => {
    setCalendarSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter calendar events by needReview/thisWeek/upcoming (time-aware)
  const filterCalendarEvents = (events, type) => {
    const now = new Date(); // Current time (not midnight)

    // Get start of today for week calculation
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Get end of this week (Sunday)
    const endOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endOfWeek.setDate(startOfToday.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    if (type === 'thisWeek') {
      // Events that haven't started yet and are within this week
      return events
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now && eventDate <= endOfWeek;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (type === 'upcoming') {
      // Events after this week
      return events
        .filter(event => new Date(event.date) > endOfWeek)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (type === 'needReview' || type === 'past') {
      // Past events (start time has passed), sorted most recent first
      return events
        .filter(event => new Date(event.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return [];
  };

  // Get color for deal category
  const getDealCategoryColor = (category) => {
    const colors = {
      'Real Estate': '#3B82F6',  // Blue
      'Fund': '#8B5CF6',         // Purple
      'Startup': '#10B981',      // Green
      'Infrastructure': '#F59E0B', // Amber
      'Private Equity': '#EC4899', // Pink
      'Venture Capital': '#06B6D4', // Cyan
      'Debt': '#EF4444',         // Red
      'Other': '#6B7280',        // Gray
    };
    return colors[category] || '#6B7280';
  };

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
    openNewCompose,
    closeCompose,
    handleSend,
    addEmailToField,
    removeEmailFromField,
    handleEmailInputKeyDown,
    extractDraftFromMessage,
    hasDraftReply,
    getLatestEmail,
    formatRecipients,
  } = emailCompose;

  const [saving, setSaving] = useState(false);

  // Pending status for keeping email in inbox after send (used by handleSendWithAttachmentCheck -> saveAndArchive)
  const pendingInboxStatusRef = useRef(null);

  // Attachment save modal state
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [saveAndArchiveCallback, setSaveAndArchiveCallback] = useState(null);

  // Spam menu state
  const [spamMenuOpen, setSpamMenuOpen] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState('crm');
  const [crmSubTab, setCrmSubTab] = useState('contacts'); // 'contacts' or 'companies' - sub-menu inside CRM tab

  // When switching to deals tab, if dataIntegrity is selected, switch to chat
  useEffect(() => {
    if (activeTab === 'deals' && activeActionTab === 'dataIntegrity') {
      setActiveActionTab('chat');
    }
    // When switching to calendar tab, if chat or dataIntegrity is selected, switch to crm
    if (activeTab === 'calendar' && (activeActionTab === 'chat' || activeActionTab === 'dataIntegrity')) {
      setActiveActionTab('crm');
    }
  }, [activeTab]);

  // Context contacts hook - handles Email, WhatsApp, and Calendar sources
  // (emailContacts and emailCompanies are aliases for backwards compatibility)

  // Deals from contacts and companies (for Deals tab)
  const [contactDeals, setContactDeals] = useState([]); // Deals linked to email contacts
  const [companyDeals, setCompanyDeals] = useState([]); // Deals linked to companies of email contacts
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [createDealAIOpen, setCreateDealAIOpen] = useState(false); // AI Deal creation modal
  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [dealSearchResults, setDealSearchResults] = useState([]);
  const [searchingDeals, setSearchingDeals] = useState(false);
  const [newDealName, setNewDealName] = useState('');
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [selectedDealContact, setSelectedDealContact] = useState(null); // Contact to associate with deal
  const [dealRelationship, setDealRelationship] = useState('introducer'); // Relationship type

  // Introductions from contacts (for Introductions tab)
  const [contactIntroductions, setContactIntroductions] = useState([]); // Introductions linked to email contacts
  const [introductionModalOpen, setIntroductionModalOpen] = useState(false);
  const [introductionSearchQuery, setIntroductionSearchQuery] = useState('');
  const [introductionSearchResults, setIntroductionSearchResults] = useState([]);
  const [searchingIntroductions, setSearchingIntroductions] = useState(false);
  const [selectedIntroducer, setSelectedIntroducer] = useState(null); // Contact who introduces
  const [selectedIntroducee, setSelectedIntroducee] = useState(null); // Contact being introduced
  const [introductionStatus, setIntroductionStatus] = useState('Requested'); // Status
  const [introductionTool, setIntroductionTool] = useState('email'); // Tool used (lowercase enum)
  const [introductionCategory, setIntroductionCategory] = useState('Karma Points'); // Category
  const [introductionText, setIntroductionText] = useState(''); // Introduction text/notes
  const [creatingIntroduction, setCreatingIntroduction] = useState(false);
  const [introducerSearchQuery, setIntroducerSearchQuery] = useState('');
  const [introducerSearchResults, setIntroducerSearchResults] = useState([]);
  const [searchingIntroducer, setSearchingIntroducer] = useState(false);
  const [introduceeSearchQuery, setIntroduceeSearchQuery] = useState('');
  const [introduceeSearchResults, setIntroduceeSearchResults] = useState([]);
  const [searchingIntroducee, setSearchingIntroducee] = useState(false);
  const [selectedIntroducee2, setSelectedIntroducee2] = useState(null);
  const [introducee2SearchQuery, setIntroducee2SearchQuery] = useState('');
  const [introducee2SearchResults, setIntroducee2SearchResults] = useState([]);
  const [searchingIntroducee2, setSearchingIntroducee2] = useState(false);
  const [editingIntroduction, setEditingIntroduction] = useState(null); // intro being edited

  // Contact Audit state
  const [auditResult, setAuditResult] = useState(null);
  const [auditActions, setAuditActions] = useState([]); // Actions from audit
  const [selectedActions, setSelectedActions] = useState(new Set()); // Selected action indices
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [executingActions, setExecutingActions] = useState(false);

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

  // Calendar events from DB (staging) - must be before useContextContacts
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);
  const [editingCalendarTitle, setEditingCalendarTitle] = useState(false);
  const [calendarTitleInput, setCalendarTitleInput] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState('toProcess'); // 'toProcess' | 'processed'
  const [processedMeetings, setProcessedMeetings] = useState([]);
  const [calendarEventScore, setCalendarEventScore] = useState(null);
  const [calendarEventNotes, setCalendarEventNotes] = useState('');
  const [selectedContactsForMeeting, setSelectedContactsForMeeting] = useState([]);

  // Deals Pipeline state - must be before useContextContacts
  const [pipelineDeals, setPipelineDeals] = useState([]);
  const [selectedPipelineDeal, setSelectedPipelineDeal] = useState(null);

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

  // AI Chat hook - supports both Email and WhatsApp context
  const chatHook = useChatWithClaude(selectedThread, emailContacts, activeTab, selectedWhatsappChat, emailContacts, selectedPipelineDeal);
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

  // Data Integrity state
  const [notInCrmEmails, setNotInCrmEmails] = useState([]);
  const [notInCrmDomains, setNotInCrmDomains] = useState([]); // Domains not in company_domains
  const [crmEmailSet, setCrmEmailSet] = useState(new Set()); // All emails in CRM for filtering
  const [notInCrmTab, setNotInCrmTab] = useState('contacts'); // 'contacts' or 'companies'
  const [holdContacts, setHoldContacts] = useState([]);
  const [holdCompanies, setHoldCompanies] = useState([]);
  const [holdTab, setHoldTab] = useState('contacts'); // 'contacts' or 'companies'
  const [incompleteContacts, setIncompleteContacts] = useState([]);
  const [incompleteCompanies, setIncompleteCompanies] = useState([]);
  const [completenessTab, setCompletenessTab] = useState('contacts'); // 'contacts' or 'companies'
  const [duplicateContacts, setDuplicateContacts] = useState([]);
  const [duplicateCompanies, setDuplicateCompanies] = useState([]);
  const [duplicatesTab, setDuplicatesTab] = useState('contacts'); // 'contacts' or 'companies'
  const [categoryMissingContacts, setCategoryMissingContacts] = useState([]);
  const [categoryMissingCompanies, setCategoryMissingCompanies] = useState([]);
  const [categoryMissingTab, setCategoryMissingTab] = useState('contacts'); // 'contacts' or 'companies'
  const [keepInTouchMissingContacts, setKeepInTouchMissingContacts] = useState([]);
  const [missingCompanyLinks, setMissingCompanyLinks] = useState([]); // Contacts with email domain matching company but not linked
  const [contactsMissingCompany, setContactsMissingCompany] = useState([]); // Contacts with no company linked at all
  const [potentialCompanyMatches, setPotentialCompanyMatches] = useState([]); // Domains that might match existing companies by name
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalContact, setDeleteModalContact] = useState(null);
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [editCompanyModalCompany, setEditCompanyModalCompany] = useState(null);
  const [loadingDataIntegrity, setLoadingDataIntegrity] = useState(false);
  const [expandedDataIntegrity, setExpandedDataIntegrity] = useState({ notInCrm: true }); // Collapsible sections

  // Parse emails from current email body - suggestions for adding new contacts
  const suggestionsFromMessage = useMemo(() => {
    if (!selectedThread || selectedThread.length === 0 || crmEmailSet.size === 0) return [];

    // Regex to match "Name <email>" or just "email@domain.com" patterns
    const emailWithNameRegex = /([A-Za-zÀ-ÿ\s]+)\s*<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g;
    const plainEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const foundEmails = new Map(); // email -> { email, name }

    // Parse all emails in the thread
    selectedThread.forEach(email => {
      const bodyText = email.body_text || '';
      const bodyHtml = email.body_html || '';
      const combined = bodyText + ' ' + bodyHtml;

      // First, try to match "Name <email>" pattern
      let match;
      while ((match = emailWithNameRegex.exec(combined)) !== null) {
        const name = match[1].trim();
        const emailAddr = match[2].toLowerCase().trim();
        if (!foundEmails.has(emailAddr)) {
          foundEmails.set(emailAddr, { email: emailAddr, name });
        }
      }

      // Then, find any remaining plain emails
      const allPlainEmails = combined.match(plainEmailRegex) || [];
      allPlainEmails.forEach(emailAddr => {
        const normalized = emailAddr.toLowerCase().trim();
        if (!foundEmails.has(normalized)) {
          foundEmails.set(normalized, { email: normalized, name: '' });
        }
      });
    });

    // Filter out:
    // 1. Emails already in CRM
    // 2. Our own email (simone@cimminelli.com)
    // 3. Common no-reply/system emails
    const excludePatterns = ['noreply', 'no-reply', 'mailer-daemon', 'postmaster', 'newsletter'];
    const myEmails = ['simone@cimminelli.com', 'simone.cimminelli@gmail.com'];

    const suggestions = [];
    foundEmails.forEach((value, emailAddr) => {
      // Skip if in CRM
      if (crmEmailSet.has(emailAddr)) return;
      // Skip my own emails
      if (myEmails.includes(emailAddr)) return;
      // Skip system/noreply emails
      if (excludePatterns.some(p => emailAddr.includes(p))) return;

      // Try to parse first/last name from the name field
      let firstName = '';
      let lastName = '';
      if (value.name) {
        const nameParts = value.name.split(/\s+/).filter(Boolean);
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
        }
      }

      suggestions.push({
        email: emailAddr,
        name: value.name,
        firstName,
        lastName
      });
    });

    return suggestions;
  }, [selectedThread, crmEmailSet]);

  // Domain Link Modal state
  const [domainLinkModalOpen, setDomainLinkModalOpen] = useState(false);
  const [selectedDomainForLink, setSelectedDomainForLink] = useState(null);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [createCompanyInitialDomain, setCreateCompanyInitialDomain] = useState('');

  // Create Company from Domain Modal state
  const [createCompanyFromDomainModalOpen, setCreateCompanyFromDomainModalOpen] = useState(false);
  const [createCompanyFromDomainData, setCreateCompanyFromDomainData] = useState(null);

  // Link to Existing Modal state
  const [linkToExistingModalOpen, setLinkToExistingModalOpen] = useState(false);
  const [linkToExistingEntityType, setLinkToExistingEntityType] = useState('company'); // 'company' or 'contact'
  const [linkToExistingItemData, setLinkToExistingItemData] = useState(null);

  // Calendar state
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEventEdits, setCalendarEventEdits] = useState({});

  // Deals Pipeline additional state
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsSections, setDealsSections] = useState({
    open: true,
    invested: false,
    monitoring: false,
    closed: false
  });
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [investmentEditOpen, setInvestmentEditOpen] = useState(false);
  const [investmentEditValue, setInvestmentEditValue] = useState('');
  const [currencyEditValue, setCurrencyEditValue] = useState('EUR');
  const [titleEditOpen, setTitleEditOpen] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [descriptionEditOpen, setDescriptionEditOpen] = useState(false);
  const [descriptionEditValue, setDescriptionEditValue] = useState('');
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [contactSearchLoading, setContactSearchLoading] = useState(false);
  const [selectedContactRelationship, setSelectedContactRelationship] = useState('other');
  const DEAL_RELATIONSHIP_TYPES = ['proposer', 'introducer', 'co-investor', 'advisor', 'other'];
  const [addMeetingContactModalOpen, setAddMeetingContactModalOpen] = useState(false);
  const [meetingContactSearchQuery, setMeetingContactSearchQuery] = useState('');
  const [meetingContactSearchResults, setMeetingContactSearchResults] = useState([]);
  const [meetingContactSearchLoading, setMeetingContactSearchLoading] = useState(false);
  const [addDealCompanyModalOpen, setAddDealCompanyModalOpen] = useState(false);
  const [dealCompanySearchQuery, setDealCompanySearchQuery] = useState('');
  const [dealCompanySearchResults, setDealCompanySearchResults] = useState([]);
  const [dealCompanySearchLoading, setDealCompanySearchLoading] = useState(false);
  const [addDealAttachmentModalOpen, setAddDealAttachmentModalOpen] = useState(false);
  const [dealAttachmentSearchQuery, setDealAttachmentSearchQuery] = useState('');
  const [dealAttachmentSearchResults, setDealAttachmentSearchResults] = useState([]);
  const [dealAttachmentSearchLoading, setDealAttachmentSearchLoading] = useState(false);
  const [dealAttachmentUploading, setDealAttachmentUploading] = useState(false);
  const dealAttachmentFileInputRef = useRef(null);
  const [createDealModalOpen, setCreateDealModalOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    opportunity: '',
    category: 'Inbox',
    total_investment: '',
    deal_currency: 'EUR',
    description: ''
  });

  const DEAL_STAGES = ['Lead', 'Monitoring', 'Invested', 'Closed'];
  const DEAL_CATEGORIES = ['Inbox', 'Startup', 'Fund', 'Real Estate', 'Private Debt', 'Private Equity', 'Other'];
  const DEAL_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
  const DEAL_SOURCES = ['Not Set', 'Cold Contacting', 'Introduction'];

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

  // Keep in Touch modal states
  const [kitManageEmailsOpen, setKitManageEmailsOpen] = useState(false);
  const [kitManageMobilesOpen, setKitManageMobilesOpen] = useState(false);
  const [kitTagsModalOpen, setKitTagsModalOpen] = useState(false);
  const [kitCityModalOpen, setKitCityModalOpen] = useState(false);
  const [kitCompanyModalContact, setKitCompanyModalContact] = useState(null);
  // Data Integrity - Link Company modal state (for contacts without email)
  const [linkCompanyModalContact, setLinkCompanyModalContact] = useState(null);
  const [kitWhatsappMessages, setKitWhatsappMessages] = useState([]);
  const [kitWhatsappLoading, setKitWhatsappLoading] = useState(false);
  const [kitWhatsappInput, setKitWhatsappInput] = useState('');
  const [kitWhatsappSending, setKitWhatsappSending] = useState(false);
  const [kitWhatsappBestPhone, setKitWhatsappBestPhone] = useState(null); // Phone number with most messages
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

  // Email signature for Keep in Touch emails
  const KIT_EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter: https://www.angelinvesting.it/
Website: https://www.cimminelli.com/
LinkedIn: https://www.linkedin.com/in/cimminelli/

Build / Buy / Invest in
internet businesses.`;

  // Keep in Touch enum values
  const KEEP_IN_TOUCH_FREQUENCIES = ['Not Set', 'Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch'];
  const WISHES_TYPES = ['no wishes set', 'whatsapp standard', 'email standard', 'email custom', 'whatsapp custom', 'call', 'present', 'no wishes'];

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

  const handlePipelineDealStageChange = async (newStage) => {
    if (!selectedPipelineDeal) return;

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);

      if (error) throw error;

      // Update local state
      const updatedDeal = { ...selectedPipelineDeal, stage: newStage };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setStageDropdownOpen(false);
      toast.success(`Stage updated to ${newStage}`);
    } catch (err) {
      console.error('Error updating deal stage:', err);
      toast.error('Failed to update stage');
    }
  };

  const handleUpdateDealCategory = async (newCategory) => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ category: newCategory, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, category: newCategory };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setCategoryDropdownOpen(false);
      toast.success(`Category updated to ${newCategory}`);
    } catch (err) {
      console.error('Error updating deal category:', err);
      toast.error('Failed to update category');
    }
  };

  const handleUpdateDealSource = async (newSource) => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ source_category: newSource, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, source_category: newSource };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setSourceDropdownOpen(false);
      toast.success(`Source updated to ${newSource}`);
    } catch (err) {
      console.error('Error updating deal source:', err);
      toast.error('Failed to update source');
    }
  };

  const handleUpdateDealInvestment = async () => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          total_investment: investmentEditValue ? parseFloat(investmentEditValue) : null,
          deal_currency: currencyEditValue,
          last_modified_at: new Date().toISOString()
        })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = {
        ...selectedPipelineDeal,
        total_investment: investmentEditValue ? parseFloat(investmentEditValue) : null,
        deal_currency: currencyEditValue
      };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setInvestmentEditOpen(false);
      toast.success('Investment updated');
    } catch (err) {
      console.error('Error updating deal investment:', err);
      toast.error('Failed to update investment');
    }
  };

  const handleUpdateDealTitle = async () => {
    if (!selectedPipelineDeal || !titleEditValue.trim()) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ opportunity: titleEditValue.trim(), last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, opportunity: titleEditValue.trim() };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setTitleEditOpen(false);
      toast.success('Title updated');
    } catch (err) {
      console.error('Error updating deal title:', err);
      toast.error('Failed to update title');
    }
  };

  const handleUpdateDealDescription = async () => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ description: descriptionEditValue.trim() || null, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, description: descriptionEditValue.trim() || null };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setDescriptionEditOpen(false);
      toast.success('Description updated');
    } catch (err) {
      console.error('Error updating deal description:', err);
      toast.error('Failed to update description');
    }
  };

  // Remove a contact from a deal
  const handleRemoveDealContact = async (contactId) => {
    if (!selectedPipelineDeal || !contactId) return;
    try {
      const { error } = await supabase
        .from('deals_contacts')
        .delete()
        .eq('deal_id', selectedPipelineDeal.deal_id)
        .eq('contact_id', contactId);
      if (error) throw error;

      // Update local state
      const updatedContacts = selectedPipelineDeal.deals_contacts.filter(dc => dc.contact_id !== contactId);
      const updatedDeal = { ...selectedPipelineDeal, deals_contacts: updatedContacts };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      toast.success('Contact removed from deal');
    } catch (err) {
      console.error('Error removing contact from deal:', err);
      toast.error('Failed to remove contact');
    }
  };

  // Remove a company from a deal
  const handleRemoveDealCompany = async (companyId) => {
    if (!selectedPipelineDeal || !companyId) return;
    try {
      const { error } = await supabase
        .from('deal_companies')
        .delete()
        .eq('deal_id', selectedPipelineDeal.deal_id)
        .eq('company_id', companyId);
      if (error) throw error;

      // Update local state
      const updatedCompanies = selectedPipelineDeal.deal_companies.filter(dc => dc.company_id !== companyId);
      const updatedDeal = { ...selectedPipelineDeal, deal_companies: updatedCompanies };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      toast.success('Company removed from deal');
    } catch (err) {
      console.error('Error removing company from deal:', err);
      toast.error('Failed to remove company');
    }
  };

  // Search for contacts to add to a deal
  const handleSearchContacts = async (query) => {
    setContactSearchQuery(query);
    if (!query.trim()) {
      setContactSearchResults([]);
      return;
    }
    setContactSearchLoading(true);
    try {
      const searchTerms = query.trim().split(/\s+/);

      // Build name search query - search each term in first_name or last_name
      let nameSearchQuery = supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url, contact_emails(email)');

      // For each search term, add a filter that matches first_name OR last_name
      searchTerms.forEach(term => {
        nameSearchQuery = nameSearchQuery.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
      });

      const nameSearch = nameSearchQuery.limit(10);

      // Search by email (use first term or full query)
      const emailSearch = supabase
        .from('contact_emails')
        .select('contact_id, email, contacts(contact_id, first_name, last_name, profile_image_url)')
        .ilike('email', `%${searchTerms[0]}%`)
        .limit(10);

      const [nameResult, emailResult] = await Promise.all([nameSearch, emailSearch]);

      if (nameResult.error) throw nameResult.error;
      if (emailResult.error) throw emailResult.error;

      // Merge results, avoiding duplicates
      const contactMap = new Map();

      // Add name search results
      (nameResult.data || []).forEach(c => {
        contactMap.set(c.contact_id, {
          ...c,
          email: c.contact_emails?.[0]?.email || null
        });
      });

      // Add email search results
      (emailResult.data || []).forEach(e => {
        if (e.contacts && !contactMap.has(e.contact_id)) {
          contactMap.set(e.contact_id, {
            ...e.contacts,
            email: e.email
          });
        }
      });

      // Filter out contacts already linked to this deal
      const linkedContactIds = (selectedPipelineDeal?.deals_contacts || []).map(dc => dc.contact_id);
      const filteredResults = Array.from(contactMap.values()).filter(c => !linkedContactIds.includes(c.contact_id));

      setContactSearchResults(filteredResults.slice(0, 10));
    } catch (err) {
      console.error('Error searching contacts:', err);
      toast.error('Failed to search contacts');
    } finally {
      setContactSearchLoading(false);
    }
  };

  // Add a contact to a deal
  const handleAddDealContact = async (contact) => {
    if (!selectedPipelineDeal || !contact) return;
    try {
      const { error } = await supabase
        .from('deals_contacts')
        .insert({
          deal_id: selectedPipelineDeal.deal_id,
          contact_id: contact.contact_id,
          relationship: selectedContactRelationship
        });
      if (error) throw error;

      // Update local state
      const newContactLink = {
        deal_id: selectedPipelineDeal.deal_id,
        contact_id: contact.contact_id,
        relationship: selectedContactRelationship,
        contacts: contact
      };
      const updatedContacts = [...(selectedPipelineDeal.deals_contacts || []), newContactLink];
      const updatedDeal = { ...selectedPipelineDeal, deals_contacts: updatedContacts };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));

      // Clear search and close modal
      setContactSearchQuery('');
      setContactSearchResults([]);
      setAddContactModalOpen(false);
      toast.success('Contact added to deal');
    } catch (err) {
      console.error('Error adding contact to deal:', err);
      toast.error('Failed to add contact');
    }
  };

  // Search contacts for meeting
  const handleSearchMeetingContacts = async (query) => {
    setMeetingContactSearchQuery(query);
    if (!query.trim()) {
      setMeetingContactSearchResults([]);
      return;
    }
    setMeetingContactSearchLoading(true);
    try {
      const searchTerms = query.trim().split(/\s+/);

      // Build name search query
      let nameSearchQuery = supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url, contact_emails(email)');

      searchTerms.forEach(term => {
        nameSearchQuery = nameSearchQuery.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
      });

      const nameSearch = nameSearchQuery.limit(10);

      // Search by email
      const emailSearch = supabase
        .from('contact_emails')
        .select('contact_id, email, contacts(contact_id, first_name, last_name, profile_image_url)')
        .ilike('email', `%${searchTerms[0]}%`)
        .limit(10);

      const [nameResult, emailResult] = await Promise.all([nameSearch, emailSearch]);

      if (nameResult.error) throw nameResult.error;
      if (emailResult.error) throw emailResult.error;

      // Merge results
      const contactMap = new Map();

      (nameResult.data || []).forEach(c => {
        contactMap.set(c.contact_id, {
          ...c,
          email: c.contact_emails?.[0]?.email || null
        });
      });

      (emailResult.data || []).forEach(e => {
        if (e.contacts && !contactMap.has(e.contact_id)) {
          contactMap.set(e.contact_id, {
            ...e.contacts,
            email: e.email
          });
        }
      });

      // Filter out contacts already linked to this meeting
      const linkedContactIds = selectedCalendarEvent?.meeting_id
        ? (selectedCalendarEvent.meeting_contacts || []).map(mc => mc.contact_id)
        : [...emailContacts.filter(c => c.contact?.contact_id).map(c => c.contact.contact_id), ...selectedContactsForMeeting.map(c => c.contact?.contact_id || c.contact_id)];

      const filteredResults = Array.from(contactMap.values()).filter(c => !linkedContactIds.includes(c.contact_id));

      setMeetingContactSearchResults(filteredResults.slice(0, 10));
    } catch (err) {
      console.error('Error searching contacts:', err);
    } finally {
      setMeetingContactSearchLoading(false);
    }
  };

  // Add contact to meeting
  const handleAddMeetingContact = async (contact) => {
    if (!selectedCalendarEvent || !contact) return;

    if (selectedCalendarEvent.meeting_id) {
      try {
        const { error } = await supabase
          .from('meeting_contacts')
          .insert({
            meeting_id: selectedCalendarEvent.meeting_id,
            contact_id: contact.contact_id
          });
        if (error) throw error;

        const newContactLink = {
          meeting_id: selectedCalendarEvent.meeting_id,
          contact_id: contact.contact_id,
          contacts: contact
        };
        const updatedContacts = [...(selectedCalendarEvent.meeting_contacts || []), newContactLink];
        const updatedEvent = { ...selectedCalendarEvent, meeting_contacts: updatedContacts };
        setSelectedCalendarEvent(updatedEvent);
        setProcessedMeetings(prev => prev.map(m => m.meeting_id === selectedCalendarEvent.meeting_id ? updatedEvent : m));
        toast.success('Contact added to meeting');
      } catch (err) {
        console.error('Error adding contact to meeting:', err);
        toast.error('Failed to add contact');
      }
    } else {
      const alreadyAdded = selectedContactsForMeeting.some(c => c.contact_id === contact.contact_id);
      if (!alreadyAdded) {
        setSelectedContactsForMeeting(prev => [...prev, { contact: contact, contact_id: contact.contact_id }]);
        toast.success('Contact will be linked when processed');
      }
    }
    setMeetingContactSearchQuery('');
    setMeetingContactSearchResults([]);
    setAddMeetingContactModalOpen(false);
  };

  // Remove contact from meeting
  const handleRemoveMeetingContact = async (contactId) => {
    if (!selectedCalendarEvent || !contactId) return;

    if (selectedCalendarEvent.meeting_id) {
      try {
        const { error } = await supabase
          .from('meeting_contacts')
          .delete()
          .eq('meeting_id', selectedCalendarEvent.meeting_id)
          .eq('contact_id', contactId);
        if (error) throw error;

        const updatedContacts = selectedCalendarEvent.meeting_contacts.filter(mc => mc.contact_id !== contactId);
        const updatedEvent = { ...selectedCalendarEvent, meeting_contacts: updatedContacts };
        setSelectedCalendarEvent(updatedEvent);
        setProcessedMeetings(prev => prev.map(m => m.meeting_id === selectedCalendarEvent.meeting_id ? updatedEvent : m));
        toast.success('Contact removed from meeting');
      } catch (err) {
        console.error('Error removing contact from meeting:', err);
        toast.error('Failed to remove contact');
      }
    } else {
      setSelectedContactsForMeeting(prev => prev.filter(c => (c.contact?.contact_id || c.contact_id) !== contactId));
      toast.success('Contact removed');
    }
  };

  // Search for companies to add to a deal
  const handleSearchDealCompanies = async (query) => {
    setDealCompanySearchQuery(query);
    if (!query.trim()) {
      setDealCompanySearchResults([]);
      return;
    }
    setDealCompanySearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, company_domains(domain)')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter out companies already linked to this deal
      const linkedCompanyIds = (selectedPipelineDeal?.deal_companies || []).map(dc => dc.company_id);
      const filteredResults = (data || []).filter(c => !linkedCompanyIds.includes(c.company_id));

      // Extract primary domain for display
      const resultsWithDomain = filteredResults.map(c => ({
        ...c,
        domain: c.company_domains?.[0]?.domain || null
      }));

      setDealCompanySearchResults(resultsWithDomain);
    } catch (err) {
      console.error('Error searching companies:', err);
      toast.error('Failed to search companies');
    } finally {
      setDealCompanySearchLoading(false);
    }
  };

  // Add a company to a deal
  const handleAddDealCompany = async (company) => {
    if (!selectedPipelineDeal || !company) return;
    try {
      const { error } = await supabase
        .from('deal_companies')
        .insert({
          deal_id: selectedPipelineDeal.deal_id,
          company_id: company.company_id,
          is_primary: false
        });
      if (error) throw error;

      // Update local state
      const newCompanyLink = {
        deal_id: selectedPipelineDeal.deal_id,
        company_id: company.company_id,
        is_primary: false,
        companies: company
      };
      const updatedCompanies = [...(selectedPipelineDeal.deal_companies || []), newCompanyLink];
      const updatedDeal = { ...selectedPipelineDeal, deal_companies: updatedCompanies };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));

      // Clear search and close modal
      setDealCompanySearchQuery('');
      setDealCompanySearchResults([]);
      setAddDealCompanyModalOpen(false);
      toast.success('Company added to deal');
    } catch (err) {
      console.error('Error adding company to deal:', err);
      toast.error('Failed to add company');
    }
  };

  // Search for attachments to add to a deal
  const handleSearchDealAttachments = async (query) => {
    setDealAttachmentSearchQuery(query);
    if (!query.trim()) {
      setDealAttachmentSearchResults([]);
      return;
    }
    setDealAttachmentSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('attachment_id, file_name, file_url, permanent_url, file_type, file_size, created_at')
        .ilike('file_name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter out attachments already linked to this deal
      const linkedAttachmentIds = (selectedPipelineDeal?.deal_attachments || []).map(da => da.attachment_id);
      const filteredResults = (data || []).filter(a => !linkedAttachmentIds.includes(a.attachment_id));

      setDealAttachmentSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching attachments:', err);
      toast.error('Failed to search attachments');
    } finally {
      setDealAttachmentSearchLoading(false);
    }
  };

  // Add an attachment to a deal
  const handleAddDealAttachment = async (attachment) => {
    if (!selectedPipelineDeal || !attachment) return;
    try {
      const { error } = await supabase
        .from('deal_attachments')
        .insert({
          deal_id: selectedPipelineDeal.deal_id,
          attachment_id: attachment.attachment_id,
          created_by: 'User'
        });
      if (error) throw error;

      // Update local state
      const newAttachmentLink = {
        deal_id: selectedPipelineDeal.deal_id,
        attachment_id: attachment.attachment_id,
        attachments: attachment
      };
      const updatedAttachments = [...(selectedPipelineDeal.deal_attachments || []), newAttachmentLink];
      const updatedDeal = { ...selectedPipelineDeal, deal_attachments: updatedAttachments };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));

      // Clear search and close modal
      setDealAttachmentSearchQuery('');
      setDealAttachmentSearchResults([]);
      setAddDealAttachmentModalOpen(false);
      toast.success('Attachment added to deal');
    } catch (err) {
      console.error('Error adding attachment to deal:', err);
      toast.error('Failed to add attachment');
    }
  };

  // Remove an attachment from a deal
  const handleRemoveDealAttachment = async (attachmentId) => {
    if (!selectedPipelineDeal || !attachmentId) return;
    try {
      const { error } = await supabase
        .from('deal_attachments')
        .delete()
        .eq('deal_id', selectedPipelineDeal.deal_id)
        .eq('attachment_id', attachmentId);
      if (error) throw error;

      // Update local state
      const updatedAttachments = selectedPipelineDeal.deal_attachments.filter(da => da.attachment_id !== attachmentId);
      const updatedDeal = { ...selectedPipelineDeal, deal_attachments: updatedAttachments };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      toast.success('Attachment removed from deal');
    } catch (err) {
      console.error('Error removing attachment from deal:', err);
      toast.error('Failed to remove attachment');
    }
  };

  // Upload a new attachment and link it to the deal
  const handleUploadDealAttachment = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedPipelineDeal) return;

    setDealAttachmentUploading(true);
    try {
      for (const file of files) {
        // Sanitize filename
        const sanitizedName = file.name
          .replace(/[^\w\s.-]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_');
        const fileName = `${Date.now()}_${sanitizedName}`;
        const filePath = `deals/${selectedPipelineDeal.deal_id}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, {
            contentType: file.type || 'application/octet-stream'
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        // Create attachment record
        const { data: attachmentRecord, error: insertError } = await supabase
          .from('attachments')
          .insert({
            file_name: file.name,
            file_url: uploadData.path,
            file_type: file.type,
            file_size: file.size,
            permanent_url: urlData.publicUrl,
            created_by: 'User'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Link to deal
        const { error: linkError } = await supabase
          .from('deal_attachments')
          .insert({
            deal_id: selectedPipelineDeal.deal_id,
            attachment_id: attachmentRecord.attachment_id,
            created_by: 'User'
          });

        if (linkError) throw linkError;

        // Update local state
        const newAttachmentLink = {
          deal_id: selectedPipelineDeal.deal_id,
          attachment_id: attachmentRecord.attachment_id,
          attachments: attachmentRecord
        };
        const updatedAttachments = [...(selectedPipelineDeal.deal_attachments || []), newAttachmentLink];
        const updatedDeal = { ...selectedPipelineDeal, deal_attachments: updatedAttachments };
        setSelectedPipelineDeal(updatedDeal);
        setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      }

      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`);
      setAddDealAttachmentModalOpen(false);
    } catch (err) {
      console.error('Error uploading attachment:', err);
      toast.error('Failed to upload file: ' + err.message);
    } finally {
      setDealAttachmentUploading(false);
      // Clear the file input
      if (dealAttachmentFileInputRef.current) {
        dealAttachmentFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDeal = async () => {
    if (!selectedPipelineDeal) return;

    if (!window.confirm(`Are you sure you want to delete "${selectedPipelineDeal.deal_name || selectedPipelineDeal.opportunity}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: 'DELETE', last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);

      if (error) throw error;

      // Remove from local state and select next deal
      const remainingDeals = pipelineDeals.filter(d => d.deal_id !== selectedPipelineDeal.deal_id);
      setPipelineDeals(remainingDeals);

      if (remainingDeals.length > 0) {
        const openDeals = remainingDeals.filter(d => ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'].includes(d.stage));
        setSelectedPipelineDeal(openDeals.length > 0 ? openDeals[0] : remainingDeals[0]);
      } else {
        setSelectedPipelineDeal(null);
      }

      toast.success('Deal deleted');
    } catch (err) {
      console.error('Error deleting deal:', err);
      toast.error('Failed to delete deal');
    }
  };

  const handleCreateDeal = async () => {
    if (!newDealForm.opportunity.trim()) {
      toast.error('Please enter a deal name');
      return;
    }

    try {
      const insertData = {
        opportunity: newDealForm.opportunity.trim(),
        stage: 'Lead',
        category: newDealForm.category,
        total_investment: newDealForm.total_investment ? parseFloat(newDealForm.total_investment) : null,
        deal_currency: newDealForm.deal_currency,
        description: newDealForm.description || null,
        source_category: 'Not Set',
        created_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString()
      };

      const { data: newDeal, error } = await supabase
        .from('deals')
        .insert([insertData])
        .select('*')
        .single();

      if (error) throw error;

      // Add to local state and select the new deal
      setPipelineDeals(prev => [newDeal, ...prev]);
      setSelectedPipelineDeal(newDeal);

      // Reset form and close modal
      setNewDealForm({
        opportunity: '',
        category: 'Inbox',
        total_investment: '',
        deal_currency: 'EUR',
        description: ''
      });
      setCreateDealModalOpen(false);

      // Make sure Open section is expanded
      setDealsSections(prev => ({ ...prev, open: true }));

      toast.success('Deal created');
    } catch (err) {
      console.error('Error creating deal:', err);
      toast.error('Failed to create deal');
    }
  };

  const toggleDealsSection = (section) => {
    setDealsSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter deals by status category
  const filterDealsByStatus = (deals, statusCategory) => {
    const openStages = ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'];
    const investedStages = ['Closed Won', 'Invested'];
    const monitoringStages = ['Monitoring'];
    const closedStages = ['Passed', 'Closed Lost'];

    let filtered;
    switch (statusCategory) {
      case 'open':
        filtered = deals.filter(d => openStages.includes(d.stage));
        break;
      case 'invested':
        filtered = deals.filter(d => investedStages.includes(d.stage));
        break;
      case 'monitoring':
        filtered = deals.filter(d => monitoringStages.includes(d.stage));
        break;
      case 'closed':
        filtered = deals.filter(d => closedStages.includes(d.stage));
        break;
      default:
        filtered = deals;
    }
    // Sort by created_at descending (newest first)
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

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
  };

  const profileImageModal = useProfileImageModal(handleProfileImageUpdate);

  // Fetch WhatsApp messages from Supabase
  useEffect(() => {
    const fetchWhatsApp = async () => {
      setWhatsappLoading(true);
      const { data, error } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('type', 'whatsapp')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching WhatsApp messages:', error);
      } else {
        setWhatsappMessages(data || []);
        // Group by chat_id
        let grouped = groupWhatsAppByChat(data || []);

        // Fetch contact profile images by matching phone numbers
        const phoneNumbers = [...new Set(grouped.map(c => c.contact_number).filter(Boolean))];
        if (phoneNumbers.length > 0) {
          // Normalize phone numbers for matching (remove non-digits except leading +)
          const normalizePhone = (p) => p ? p.replace(/[^\d+]/g, '').replace(/^00/, '+') : '';

          // Fetch contacts with their mobiles (increase limit to cover all records)
          const { data: contactMobiles } = await supabase
            .from('contact_mobiles')
            .select('contact_id, mobile')
            .limit(5000);

          const { data: contacts } = await supabase
            .from('contacts')
            .select('contact_id, profile_image_url')
            .not('profile_image_url', 'is', null)
            .limit(5000);

          if (contactMobiles && contacts) {
            // Create lookup: normalized phone -> profile_image_url
            const phoneToImage = {};
            contactMobiles.forEach(cm => {
              const contact = contacts.find(c => c.contact_id === cm.contact_id);
              if (contact?.profile_image_url) {
                phoneToImage[normalizePhone(cm.mobile)] = contact.profile_image_url;
              }
            });

            // Add profile_image_url to each chat
            grouped = grouped.map(chat => ({
              ...chat,
              profile_image_url: phoneToImage[normalizePhone(chat.contact_number)] || null
            }));
          }
        }

        setWhatsappChats(grouped);
        if (grouped.length > 0) {
          setSelectedWhatsappChat(grouped[0]);
        }
      }
      setWhatsappLoading(false);
    };

    if (activeTab === 'whatsapp') {
      fetchWhatsApp();
    }
  }, [activeTab]);

  // Check Baileys connection status periodically (when WhatsApp tab is active)
  useEffect(() => {
    const checkBaileysStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/whatsapp/status`);
        const data = await res.json();
        setBaileysStatus(data);
      } catch (e) {
        setBaileysStatus({ status: 'error', error: e.message });
      }
    };

    if (activeTab === 'whatsapp') {
      checkBaileysStatus();
      const interval = setInterval(checkBaileysStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Group WhatsApp messages by chat_id
  const groupWhatsAppByChat = (messages) => {
    const chatMap = {};
    messages.forEach(msg => {
      const chatId = msg.chat_id || msg.id;
      if (!chatMap[chatId]) {
        chatMap[chatId] = {
          chat_id: chatId,
          chat_name: msg.chat_name || msg.from_name,
          contact_number: msg.contact_number,
          is_group_chat: msg.is_group_chat,
          messages: [],
          latestMessage: msg,
          status: msg.status || null
        };
      }
      chatMap[chatId].messages.push(msg);
      // Update latest message if this one is newer
      if (new Date(msg.date) > new Date(chatMap[chatId].latestMessage.date)) {
        chatMap[chatId].latestMessage = msg;
        chatMap[chatId].status = msg.status || null;
      }
    });
    // Convert to array and sort by latest message date
    return Object.values(chatMap).sort((a, b) =>
      new Date(b.latestMessage.date) - new Date(a.latestMessage.date)
    );
  };

  // Fetch Calendar events from Supabase (all events - upcoming and past)
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setCalendarLoading(true);

      const { data, error } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('type', 'calendar')
        .order('date', { ascending: true }); // Order by date for processing

      if (error) {
        console.error('Error fetching calendar events:', error);
      } else {
        setCalendarEvents(data || []);
        if (calendarViewMode === 'toProcess' && data && data.length > 0) {
          setSelectedCalendarEvent({ ...data[0], source: 'inbox' });
        }
      }
      setCalendarLoading(false);
    };

    const fetchProcessedMeetings = async () => {
      setCalendarLoading(true);

      const { data, error } = await supabase
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
        .order('meeting_date', { ascending: false });

      if (error) {
        console.error('Error fetching processed meetings:', error);
      } else {
        setProcessedMeetings(data || []);
        if (calendarViewMode === 'processed' && data && data.length > 0) {
          setSelectedCalendarEvent({ ...data[0], source: 'meetings' });
          setCalendarEventScore(data[0].score ? parseInt(data[0].score) : null);
          setCalendarEventNotes(data[0].notes || '');
        }
      }
      setCalendarLoading(false);
    };

    if (activeTab === 'calendar') {
      if (calendarViewMode === 'toProcess') {
        fetchCalendarEvents();
      } else {
        fetchProcessedMeetings();
      }
    }
  }, [activeTab, calendarViewMode]);

  // Fetch Deals from Supabase (all deals)
  useEffect(() => {
    const fetchDeals = async () => {
      setDealsLoading(true);

      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          deals_contacts (
            contact_id,
            relationship,
            contacts (
              contact_id,
              first_name,
              last_name,
              profile_image_url
            )
          ),
          deal_companies (
            company_id,
            is_primary,
            companies (
              company_id,
              name
            )
          ),
          deal_attachments (
            deal_attachment_id,
            attachment_id,
            created_at,
            attachments (
              attachment_id,
              file_name,
              file_url,
              permanent_url,
              file_type,
              file_size
            )
          )
        `)
        .neq('stage', 'DELETE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
      } else {
        setPipelineDeals(data || []);
        if (data && data.length > 0) {
          // Select first open deal, or first deal if no open deals
          const openDeals = data.filter(d => ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'].includes(d.stage));
          setSelectedPipelineDeal(openDeals.length > 0 ? openDeals[0] : data[0]);
        }
      }
      setDealsLoading(false);
    };

    if (activeTab === 'deals') {
      fetchDeals();
    }
  }, [activeTab]);

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
          setSelectedKeepInTouchContact(dueContacts.length > 0 ? dueContacts[0] : data[0]);
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
    };

    fetchContactDetailsAndInteractions();
  }, [selectedKeepInTouchContact?.contact_id]);

  // Fetch WhatsApp messages for Keep in Touch contact
  useEffect(() => {
    const fetchKitWhatsappMessages = async () => {
      if (!selectedKeepInTouchContact || keepInTouchMobiles.length === 0) {
        setKitWhatsappMessages([]);
        return;
      }

      setKitWhatsappLoading(true);
      try {
        // Normalize phone numbers for matching
        const normalizePhone = (p) => p ? p.replace(/[^\d+]/g, '').replace(/^00/, '+') : '';
        const contactPhones = keepInTouchMobiles.map(m => normalizePhone(m.mobile));

        // Fetch messages from command_center_inbox matching any of the contact's phone numbers
        const { data: inboxMessages, error: inboxError } = await supabase
          .from('command_center_inbox')
          .select('*')
          .eq('type', 'whatsapp')
          .order('date', { ascending: false });

        if (inboxError) {
          console.error('Error fetching inbox messages:', inboxError);
        }

        // Filter messages by matching phone numbers (compare last 9 digits for accuracy)
        const getLast9Digits = (phone) => phone.replace(/\D/g, '').slice(-9);

        // Count messages per phone number to find the best one
        const phoneMessageCount = {};
        keepInTouchMobiles.forEach(m => {
          phoneMessageCount[m.mobile] = 0;
        });

        const matchingMessages = (inboxMessages || []).filter(msg => {
          const msgPhoneSuffix = getLast9Digits(msg.contact_number || '');
          if (msgPhoneSuffix.length < 9) return false;

          // Find which contact phone matches
          const matchingMobile = keepInTouchMobiles.find(m =>
            getLast9Digits(m.mobile) === msgPhoneSuffix
          );

          if (matchingMobile) {
            // Only count RECEIVED messages to determine the best phone
            // (you can send to any number, but only receive from real WhatsApp numbers)
            if (msg.direction === 'received') {
              phoneMessageCount[matchingMobile.mobile]++;
            }
            return true;
          }
          return false;
        });

        // Find phone with most RECEIVED messages (if any)
        let bestPhone = null;
        let maxMessages = 0;
        Object.entries(phoneMessageCount).forEach(([phone, count]) => {
          if (count > maxMessages) {
            maxMessages = count;
            bestPhone = phone;
          }
        });
        setKitWhatsappBestPhone(bestPhone);

        // Also fetch archived messages from interactions
        const { data: archivedData } = await supabase
          .from('interactions')
          .select('interaction_id, interaction_type, direction, interaction_date, summary, external_interaction_id')
          .eq('contact_id', selectedKeepInTouchContact.contact_id)
          .eq('interaction_type', 'whatsapp')
          .order('interaction_date', { ascending: false });

        // Combine and format messages
        const inboxFormatted = matchingMessages.map(m => ({
          id: m.id || m.message_uid,
          text: m.body_text || m.snippet || '',
          direction: m.direction,
          date: m.date,
          source: 'inbox'
        }));

        const archivedFormatted = (archivedData || []).map(m => ({
          id: m.interaction_id,
          text: m.summary || '',
          direction: m.direction,
          date: m.interaction_date,
          source: 'archived'
        }));

        // Combine, deduplicate by date proximity, and sort by date descending
        const allMessages = [...inboxFormatted, ...archivedFormatted];
        allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

        setKitWhatsappMessages(allMessages);
      } catch (err) {
        console.error('Error fetching KIT WhatsApp messages:', err);
        setKitWhatsappMessages([]);
      }
      setKitWhatsappLoading(false);
    };

    if (activeActionTab === 'kitWhatsapp') {
      fetchKitWhatsappMessages();
    }
  }, [selectedKeepInTouchContact?.contact_id, keepInTouchMobiles, activeActionTab]);

  // Send WhatsApp message for Keep in Touch contact
  const handleKitSendWhatsapp = async () => {
    if (!kitWhatsappInput.trim() || kitWhatsappSending) return;
    if (keepInTouchMobiles.length === 0) {
      toast.error('No phone number available for this contact');
      return;
    }

    // Use the phone with received messages if available
    // Otherwise prefer mobile numbers (Italian mobiles start with +393)
    // Fall back to first number as last resort
    let phoneNumber = kitWhatsappBestPhone;
    if (!phoneNumber) {
      // Try to find a mobile number (not a landline)
      const mobileNumber = keepInTouchMobiles.find(m =>
        m.mobile.startsWith('+393') || // Italian mobile
        m.mobile.startsWith('+44') ||  // UK
        m.mobile.startsWith('+1') ||   // US/Canada
        !m.mobile.match(/^\+39\s?0/)   // Not Italian landline (06, 02, etc.)
      );
      phoneNumber = mobileNumber?.mobile || keepInTouchMobiles[0].mobile;
    }
    const messageText = kitWhatsappInput.trim();

    setKitWhatsappSending(true);
    try {
      // Try Baileys first
      const baileysRes = await fetch(`${BACKEND_URL}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          message: messageText
        })
      });

      const baileysData = await baileysRes.json();

      if (!baileysRes.ok || !baileysData.success) {
        throw new Error(baileysData.error || 'Failed to send via Baileys');
      }

      // Update last_interaction_at immediately when message is queued
      // This way the contact moves out of overdue even before staging approval
      const now = new Date();
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          last_interaction_at: now.toISOString(),
          last_whatsapp_sent: now.toISOString().split('T')[0] // date only
        })
        .eq('contact_id', selectedKeepInTouchContact.contact_id);

      if (updateError) {
        console.error('Failed to update last_interaction_at:', updateError);
      } else {
        // Update local state to reflect the change
        setSelectedKeepInTouchContact(prev => ({
          ...prev,
          last_interaction_at: now.toISOString()
        }));
        // Refresh the keep in touch list to show updated status
        fetchKeepInTouchContacts();
      }

      // Add optimistic message
      const newMessage = {
        id: `sent_${Date.now()}`,
        text: messageText,
        direction: 'sent',
        date: new Date().toISOString(),
        source: 'local'
      };
      setKitWhatsappMessages(prev => [newMessage, ...prev]);
      setKitWhatsappInput('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setKitWhatsappSending(false);
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
          last_interaction_at: now.toISOString(),
          last_email_sent: now.toISOString().split('T')[0] // date only
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
        fetchKeepInTouchContacts();
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

  // State for Create Contact Modal
  const [createContactModalOpen, setCreateContactModalOpen] = useState(false);
  const [createContactEmail, setCreateContactEmail] = useState(null);

  // State for Add Company Modal
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);

  // State for Search/Create Company Modal (CRM Tab)
  const [searchOrCreateCompanyModalOpen, setSearchOrCreateCompanyModalOpen] = useState(false);

  // State for Data Integrity Modal (contacts)
  const [dataIntegrityModalOpen, setDataIntegrityModalOpen] = useState(false);
  const [dataIntegrityContactId, setDataIntegrityContactId] = useState(null);

  // State for Company Data Integrity Modal
  const [companyDataIntegrityModalOpen, setCompanyDataIntegrityModalOpen] = useState(false);
  const [companyDataIntegrityCompanyId, setCompanyDataIntegrityCompanyId] = useState(null);

  // Handle adding email or mobile to spam list
  const handleAddToSpam = async (emailOrMobile, item = null) => {
    try {
      // Simple logic: if item has mobile field, it's WhatsApp. If it has email field, it's email.
      // data_integrity_inbox has separate columns: email (for email) and mobile (for WhatsApp)
      const isWhatsApp = Boolean(item?.mobile);
      const isEmailContact = Boolean(item?.email) && !item?.mobile;

      console.log('handleAddToSpam:', { emailOrMobile, item, isWhatsApp, isEmailContact });

      // Guard: must have either mobile or email
      if (!item?.mobile && !item?.email && !emailOrMobile) {
        toast.error('No email or mobile to add to spam');
        return;
      }

      if (isWhatsApp) {
        // WhatsApp contact - add to whatsapp_spam
        const mobile = item.mobile;
        const { error } = await supabase
          .from('whatsapp_spam')
          .upsert({
            mobile_number: mobile,
            counter: 1,
          }, {
            onConflict: 'mobile_number',
          });

        if (error) throw error;

        // First get message_uids before deleting (needed for attachments)
        const { data: messagesToDelete } = await supabase
          .from('command_center_inbox')
          .select('id, message_uid')
          .eq('contact_number', mobile)
          .eq('type', 'whatsapp');

        const messageUids = (messagesToDelete || [])
          .map(m => m.message_uid)
          .filter(Boolean);

        // Delete attachments linked to these messages
        let deletedAttachmentsCount = 0;
        if (messageUids.length > 0) {
          const { data: deletedAttachments, error: attachError } = await supabase
            .from('attachments')
            .delete()
            .in('external_reference', messageUids)
            .select('attachment_id');

          if (attachError) {
            console.error('Error deleting attachments:', attachError);
          } else {
            deletedAttachmentsCount = deletedAttachments?.length || 0;
          }
        }

        // Delete WhatsApp messages from this contact
        const { data: deletedMessages, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .eq('contact_number', mobile)
          .eq('type', 'whatsapp')
          .select('id');

        if (deleteError) {
          console.error('Error deleting WhatsApp messages:', deleteError);
        }

        const deletedCount = deletedMessages?.length || 0;

        // Mark all data_integrity issues for this mobile as dismissed
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('mobile', mobile)
          .eq('status', 'pending');

        // Remove from notInCrmEmails list
        setNotInCrmEmails(prev => prev.filter(i => i.mobile !== mobile));

        // Update local WhatsApp state - remove chats/messages with this contact
        setWhatsappChats(prev => prev.filter(c => c.contact_number !== mobile));
        setWhatsappMessages(prev => prev.filter(m => m.contact_number !== mobile));

        // Select first remaining chat
        const remainingChats = whatsappChats.filter(c => c.contact_number !== mobile);
        if (remainingChats.length > 0) {
          setSelectedWhatsappChat(remainingChats[0]);
        } else {
          setSelectedWhatsappChat(null);
        }

        const attachmentMsg = deletedAttachmentsCount > 0 ? `, ${deletedAttachmentsCount} attachments` : '';
        toast.success(`${mobile} added to WhatsApp spam${deletedCount > 0 ? ` - deleted ${deletedCount} messages${attachmentMsg}` : ''}`);
      } else {
        // Email contact - add to emails_spam
        const emailLower = emailOrMobile.toLowerCase();

        const { error } = await supabase
          .from('emails_spam')
          .upsert({
            email: emailLower,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          }, {
            onConflict: 'email',
          });

        if (error) throw error;

        // Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToArchive, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailLower);

        if (fetchError) {
          console.error('Error fetching emails to archive:', fetchError);
        }

        // Archive each email in Fastmail
        for (const emailRecord of emailsToArchive || []) {
          if (emailRecord.fastmail_id) {
            try {
              await archiveInFastmail(emailRecord.fastmail_id);
            } catch (archiveErr) {
              console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
            }
          }
        }

        // Delete all emails from this sender from command_center_inbox
        const { data: deletedEmails, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailLower)
          .select('id');

        if (deleteError) {
          console.error('Error deleting from inbox:', deleteError);
        }

        const deletedCount = deletedEmails?.length || 0;

        // Mark all data_integrity issues for this email as dismissed
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .ilike('email', emailLower)
          .eq('status', 'pending');

        // Update threads state - remove emails from this sender
        removeEmailsBySender(emailOrMobile);

        // Remove from notInCrmEmails list
        setNotInCrmEmails(prev => prev.filter(i => i.email?.toLowerCase() !== emailLower));

        // Refresh threads and select first one
        await refreshThreads();

        toast.success(`${emailOrMobile} added to spam list${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
      }
    } catch (error) {
      console.error('Error adding to spam:', error);
      toast.error('Failed to add to spam list');
    }
  };

  // Handle putting contact on hold (supports both email and WhatsApp contacts)
  const handlePutOnHold = async (item) => {
    try {
      const isWhatsApp = item.mobile && !item.email;
      const identifier = isWhatsApp ? item.mobile : item.email?.toLowerCase();

      if (!identifier) {
        toast.error('No email or mobile to put on hold');
        return;
      }

      // Build upsert data based on contact type
      const upsertData = {
        full_name: item.name || null,
        status: 'pending',
        email_count: 1,
        created_at: new Date().toISOString(),
        source_type: isWhatsApp ? 'whatsapp' : 'email',
      };

      if (isWhatsApp) {
        // For WhatsApp contacts, we need a placeholder email since email is NOT NULL
        // Use a pattern that identifies it as a WhatsApp-only contact
        upsertData.mobile = item.mobile;
        upsertData.email = `whatsapp_${item.mobile.replace(/[^0-9]/g, '')}@placeholder.hold`;
      } else {
        upsertData.email = item.email.toLowerCase();
      }

      const { error } = await supabase
        .from('contacts_hold')
        .upsert(upsertData, {
          onConflict: 'email',
        });

      if (error) throw error;

      // Mark data_integrity_inbox issue as dismissed
      if (item.id) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('id', item.id);
      } else {
        // If no issue ID, try to find and dismiss by email/mobile
        const matchField = isWhatsApp ? 'mobile' : 'email';
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq(matchField, identifier)
          .eq('issue_type', 'not_in_crm')
          .eq('entity_type', 'contact')
          .eq('status', 'pending');
      }

      // Remove from notInCrmEmails list
      setNotInCrmEmails(prev => prev.filter(i => {
        if (isWhatsApp) {
          return i.mobile !== item.mobile;
        }
        return i.email?.toLowerCase() !== item.email?.toLowerCase();
      }));

      // Add to hold list
      setHoldContacts(prev => [...prev, {
        email: upsertData.email,
        mobile: isWhatsApp ? item.mobile : null,
        full_name: item.name,
        status: 'pending',
        email_count: 1,
        source_type: isWhatsApp ? 'whatsapp' : 'email'
      }]);

      toast.success(`${item.name || item.email || item.mobile} put on hold`);
    } catch (error) {
      console.error('Error putting on hold:', error);
      toast.error('Failed to put on hold');
    }
  };

  // Handle editing a category missing contact - fetch full data and open QuickEditModal
  const handleEditCategoryMissingContact = async (contact) => {
    try {
      // Fetch full contact data
      const { data: fullContact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .single();

      if (error) throw error;

      handleOpenQuickEditModal(fullContact, true);
    } catch (error) {
      console.error('Error fetching contact for edit:', error);
      toast.error('Failed to load contact');
    }
  };

  // Handle putting a category missing contact on hold - sets category to 'Hold'
  const handleHoldCategoryMissingContact = async (contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Hold' })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      // Remove from list
      setCategoryMissingContacts(prev => prev.filter(c => c.contact_id !== contact.contact_id));
      toast.success(`${contact.first_name} ${contact.last_name} moved to Hold`);
    } catch (error) {
      console.error('Error setting hold category:', error);
      toast.error('Failed to set Hold category');
    }
  };

  // Handle opening delete modal for a category missing contact
  const handleDeleteCategoryMissingContact = async (contact) => {
    // Fetch full contact data for the modal
    try {
      const { data: fullContact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .single();

      if (error) throw error;

      setDeleteModalContact(fullContact);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching contact for delete:', error);
      toast.error('Failed to load contact');
    }
  };

  // Handle opening keep in touch modal for a kit missing contact - opens to Keep in touch tab
  const handleOpenKeepInTouchModal = async (contact) => {
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

  // Handle setting "Do not keep in touch" for a contact
  const handleDoNotKeepInTouch = async (contact) => {
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

  // Handle closing delete modal and refreshing list
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteModalContact(null);
    // Refresh the category missing list in case contact was deleted
    fetchDataIntegrity();
  };

  // Handle editing a category missing company - open CompanyDataIntegrityModal
  const handleEditCategoryMissingCompany = async (company) => {
    setCompanyDataIntegrityCompanyId(company.company_id);
    setCompanyDataIntegrityModalOpen(true);
  };

  // Handle closing edit company modal
  const handleCloseEditCompanyModal = () => {
    setEditCompanyModalOpen(false);
    setEditCompanyModalCompany(null);
    // Refresh the category missing list in case company was updated
    fetchDataIntegrity();
  };

  // Handle putting a category missing company on hold - sets category to 'Hold'
  const handleHoldCategoryMissingCompany = async (company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ category: 'Hold' })
        .eq('company_id', company.company_id);

      if (error) throw error;

      // Remove from list
      setCategoryMissingCompanies(prev => prev.filter(c => c.company_id !== company.company_id));
      toast.success(`${company.name} moved to Hold`);
    } catch (error) {
      console.error('Error setting hold category:', error);
      toast.error('Failed to set Hold category');
    }
  };

  // Handle deleting a category missing company
  const handleDeleteCategoryMissingCompany = async (company) => {
    if (!window.confirm(`Delete ${company.name}? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('company_id', company.company_id);

      if (error) throw error;

      // Remove from list
      setCategoryMissingCompanies(prev => prev.filter(c => c.company_id !== company.company_id));
      toast.success(`${company.name} deleted`);
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Handle adding contact from hold to CRM (supports both email and WhatsApp contacts)
  const handleAddFromHold = async (contact) => {
    // Check if this is a WhatsApp contact
    const isWhatsApp = contact.mobile || contact.source_type === 'whatsapp' ||
                       contact.email?.startsWith('whatsapp_');

    let contextContent = null;

    if (isWhatsApp && contact.mobile) {
      // For WhatsApp contacts, search WhatsApp messages for context
      for (const thread of threads) {
        if (thread.type === 'whatsapp' && thread.contact_number === contact.mobile) {
          contextContent = {
            chat_name: thread.chat_name,
            body_text: thread.snippet || thread.body_text
          };
          break;
        }
      }
    } else {
      // For email contacts, find an email involving this contact
      for (const thread of threads) {
        const found = thread.emails?.find(e => {
          const emailLower = contact.email?.toLowerCase();
          if (!emailLower) return false;
          // Check if contact is sender
          if (e.from_email?.toLowerCase() === emailLower) return true;
          // Check if contact is in TO recipients
          if (e.to_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          // Check if contact is in CC recipients
          if (e.cc_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          return false;
        });
        if (found) {
          contextContent = found;
          break;
        }
      }
    }

    // Open the create contact modal with complete contact data from hold
    setCreateContactEmail({
      email: isWhatsApp ? '' : contact.email,
      mobile: contact.mobile || null,
      name: contact.full_name || contact.first_name,
      hold_id: contact.hold_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      company_name: contact.company_name,
      job_role: contact.job_role,
      subject: contextContent?.subject || contextContent?.chat_name || '',
      body_text: contextContent?.body_text || contextContent?.snippet || '',
      source_type: isWhatsApp ? 'whatsapp' : 'email'
    });
    setCreateContactModalOpen(true);
  };

  // Handle marking contact from hold as spam (supports both email and WhatsApp contacts)
  const handleSpamFromHold = async (contact) => {
    try {
      // Check if this is a WhatsApp contact
      const isWhatsApp = contact.mobile || contact.source_type === 'whatsapp' ||
                         contact.email?.startsWith('whatsapp_');
      const identifier = isWhatsApp ? contact.mobile : contact.email?.toLowerCase();

      if (!identifier) {
        toast.error('No email or mobile to mark as spam');
        return;
      }

      if (isWhatsApp) {
        // 1. Add to WhatsApp spam list
        const { error: spamError } = await supabase
          .from('whatsapp_spam')
          .upsert({
            mobile_number: contact.mobile,
            counter: 1,
          }, {
            onConflict: 'mobile_number',
          });

        if (spamError) throw spamError;

        // 2. Remove from contacts_hold (match by mobile or placeholder email)
        if (contact.email) {
          await supabase.from('contacts_hold').delete().eq('email', contact.email);
        }
        if (contact.mobile) {
          await supabase.from('contacts_hold').delete().eq('mobile', contact.mobile);
        }

        // 3. Delete WhatsApp messages from this contact
        const { data: deletedMessages, error: inboxDeleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .eq('contact_number', contact.mobile)
          .eq('type', 'whatsapp')
          .select('id');

        if (inboxDeleteError) {
          console.error('Error deleting WhatsApp messages:', inboxDeleteError);
        }

        const deletedCount = deletedMessages?.length || 0;

        // 4. Update threads state - remove WhatsApp messages from this contact
        setThreads(prev => prev.filter(t => !(t.type === 'whatsapp' && t.contact_number === contact.mobile)));

        // 5. Update local hold contacts state
        setHoldContacts(prev => prev.filter(c => c.mobile !== contact.mobile));

        toast.success(`${contact.mobile} marked as spam${deletedCount > 0 ? ` - deleted ${deletedCount} messages` : ''}`);
      } else {
        // Original email spam logic
        const emailLower = contact.email.toLowerCase();

        // 1. Add to email spam list
        const { error: spamError } = await supabase
          .from('emails_spam')
          .upsert({
            email: emailLower,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          }, {
            onConflict: 'email',
          });

        if (spamError) throw spamError;

        // 2. Remove from contacts_hold
        const { error: deleteError } = await supabase
          .from('contacts_hold')
          .delete()
          .eq('email', emailLower);

        if (deleteError) throw deleteError;

        // 3. Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToArchive, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailLower);

        if (fetchError) {
          console.error('Error fetching emails to archive:', fetchError);
        }

        // 4. Archive each email in Fastmail
        for (const emailRecord of emailsToArchive || []) {
          if (emailRecord.fastmail_id) {
            try {
              await archiveInFastmail(emailRecord.fastmail_id);
            } catch (archiveErr) {
              console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
            }
          }
        }

        // 5. Delete all emails from this sender from command_center_inbox
        const { data: deletedEmails, error: inboxDeleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailLower)
          .select('id');

        if (inboxDeleteError) {
          console.error('Error deleting from inbox:', inboxDeleteError);
        }

        const deletedCount = deletedEmails?.length || 0;

        // 6. Update threads state - remove emails from this sender
        removeEmailsBySender(contact.email);

        // 7. Update local hold contacts state
        setHoldContacts(prev => prev.filter(c => c.email?.toLowerCase() !== emailLower));

        toast.success(`${contact.email} marked as spam${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
      }
    } catch (error) {
      console.error('Error marking as spam from hold:', error);
      toast.error('Failed to mark as spam');
    }
  };

  // Handle opening create contact modal (supports both email and WhatsApp contacts)
  const handleOpenCreateContact = (item) => {
    // Check if this is a WhatsApp contact
    const isWhatsApp = item.mobile && !item.email;

    let contextContent = null;

    if (isWhatsApp) {
      // For WhatsApp contacts, search WhatsApp messages for context
      for (const thread of threads) {
        if (thread.type === 'whatsapp' && thread.contact_number === item.mobile) {
          contextContent = {
            chat_name: thread.chat_name,
            body_text: thread.snippet || thread.body_text
          };
          break;
        }
      }
    } else {
      // For email contacts, find an email involving this contact
      for (const thread of threads) {
        const found = thread.emails?.find(e => {
          const emailLower = item.email?.toLowerCase();
          if (!emailLower) return false;
          // Check if contact is sender
          if (e.from_email?.toLowerCase() === emailLower) return true;
          // Check if contact is in TO recipients
          if (e.to_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          // Check if contact is in CC recipients
          if (e.cc_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          return false;
        });
        if (found) {
          contextContent = found;
          break;
        }
      }
    }

    setCreateContactEmail({
      ...item,
      subject: contextContent?.subject || contextContent?.chat_name || '',
      body_text: contextContent?.body_text || contextContent?.snippet || '',
      source_type: isWhatsApp ? 'whatsapp' : 'email'
    });
    setCreateContactModalOpen(true);
  };

  // Extract unique participants from a thread (from/to/cc)
  const getThreadParticipants = (thread) => {
    const participants = new Map(); // email -> { email, name }
    const myEmail = 'simone@cimminelli.com'.toLowerCase();

    (thread || []).forEach(email => {
      // From
      if (email.from_email && email.from_email.toLowerCase() !== myEmail) {
        const key = email.from_email.toLowerCase();
        if (!participants.has(key)) {
          participants.set(key, { email: email.from_email, name: email.from_name });
        }
      }
      // To
      (email.to_recipients || []).forEach(r => {
        const addr = typeof r === 'string' ? r : r.email;
        if (addr && addr.toLowerCase() !== myEmail) {
          const key = addr.toLowerCase();
          if (!participants.has(key)) {
            participants.set(key, { email: addr, name: typeof r === 'object' ? r.name : null });
          }
        }
      });
      // CC
      (email.cc_recipients || []).forEach(r => {
        const addr = typeof r === 'string' ? r : r.email;
        if (addr && addr.toLowerCase() !== myEmail) {
          const key = addr.toLowerCase();
          if (!participants.has(key)) {
            participants.set(key, { email: addr, name: typeof r === 'object' ? r.name : null });
          }
        }
      });
    });

    return participants;
  };

  // Helper: normalize domain (remove www., http://, https://, trailing paths)
  const normalizeDomain = (domain) => {
    if (!domain) return null;
    let normalized = domain.toLowerCase().trim();
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.replace(/^www\./, '');
    normalized = normalized.split('/')[0];
    normalized = normalized.split(':')[0];
    return normalized || null;
  };

  // Helper: extract domain from email address
  const extractDomainFromEmail = (email) => {
    if (!email) return null;
    const parts = email.split('@');
    if (parts.length !== 2) return null;
    return normalizeDomain(parts[1]);
  };

  // Extract unique domains from thread participants
  const getThreadDomains = (thread) => {
    const participants = getThreadParticipants(thread);
    const domains = new Set();
    participants.forEach((value, email) => {
      const domain = extractDomainFromEmail(email);
      if (domain) domains.add(domain);
    });
    return domains;
  };

  // Fetch Data Integrity data - NOW READS FROM BACKEND TABLES
  const fetchDataIntegrity = async () => {
    setLoadingDataIntegrity(true);

    try {
      // Get inbox_ids from selected thread, whatsapp chat, or calendar event
      let inboxIds = [];

      if (activeTab === 'email' && selectedThread) {
        inboxIds = selectedThread.map(email => email.id).filter(Boolean);
      } else if (activeTab === 'whatsapp' && selectedWhatsappChat?.messages) {
        inboxIds = selectedWhatsappChat.messages.map(msg => msg.id).filter(Boolean);
      } else if (activeTab === 'calendar' && selectedCalendarEvent) {
        inboxIds = [selectedCalendarEvent.id].filter(Boolean);
      }

      // Skip if no selection
      if (inboxIds.length === 0) {
        setNotInCrmEmails([]);
        setNotInCrmDomains([]);
        setHoldContacts([]);
        setHoldCompanies([]);
        setIncompleteContacts([]);
        setIncompleteCompanies([]);
        setDuplicateContacts([]);
        setDuplicateCompanies([]);
        setCategoryMissingContacts([]);
        setCategoryMissingCompanies([]);
        setKeepInTouchMissingContacts([]);
        setMissingCompanyLinks([]);
        setContactsMissingCompany([]);
        setLoadingDataIntegrity(false);
        return;
      }

      // ============================================
      // 1. FETCH FROM data_integrity_inbox (backend)
      // ============================================
      const { data: integrityIssues, error: integrityError } = await supabase
        .from('data_integrity_inbox')
        .select('*')
        .in('inbox_id', inboxIds)
        .eq('status', 'pending');

      if (integrityError) {
        console.error('Error fetching data integrity issues:', integrityError);
      }

      // Group issues by type
      const issues = integrityIssues || [];

      // NOT IN CRM - Contacts (deduplicate by email or mobile)
      const notInCrmContactIssues = issues.filter(i => i.issue_type === 'not_in_crm' && i.entity_type === 'contact');
      const seenContacts = new Set();
      const uniqueNotInCrmContacts = notInCrmContactIssues.filter(i => {
        const key = i.email?.toLowerCase() || i.mobile;
        if (!key || seenContacts.has(key)) return false;
        seenContacts.add(key);
        return true;
      });
      setNotInCrmEmails(uniqueNotInCrmContacts.map(i => ({
        id: i.id,  // issue ID for updating status later
        issueId: i.id,  // same as id, for LinkToExisting modal
        email: i.email,
        mobile: i.mobile,  // WhatsApp contacts have mobile instead of email
        name: i.name,
        firstName: i.name?.split(' ')[0] || '',
        lastName: i.name?.split(' ').slice(1).join(' ') || ''
      })));

      // NOT IN CRM - Companies (domains) - deduplicate by domain
      const notInCrmCompanyIssues = issues.filter(i => i.issue_type === 'not_in_crm' && i.entity_type === 'company');
      const domainMap = new Map();
      notInCrmCompanyIssues.forEach(i => {
        if (!i.domain) return;
        if (domainMap.has(i.domain)) {
          const existing = domainMap.get(i.domain);
          if (i.email && !existing.sampleEmails.includes(i.email)) {
            existing.sampleEmails.push(i.email);
          }
          existing.count++;
          // Collect all issue IDs for this domain
          if (!existing.issueIds.includes(i.id)) {
            existing.issueIds.push(i.id);
          }
        } else {
          domainMap.set(i.domain, {
            domain: i.domain,
            issueId: i.id, // First issue ID (for backwards compatibility)
            issueIds: [i.id], // All issue IDs for this domain
            count: 1,
            sampleEmails: i.email ? [i.email] : []
          });
        }
      });
      setNotInCrmDomains([...domainMap.values()]);

      // HOLD - Contacts
      const holdContactIssues = issues.filter(i => i.issue_type === 'hold' && i.entity_type === 'contact');
      setHoldContacts(holdContactIssues.map(i => ({
        email: i.email,
        mobile: i.mobile,
        full_name: i.name,
        first_name: i.name?.split(' ')[0] || '',
        last_name: i.name?.split(' ').slice(1).join(' ') || '',
        email_count: 1,
        status: 'pending'
      })));

      // HOLD - Companies
      const holdCompanyIssues = issues.filter(i => i.issue_type === 'hold' && i.entity_type === 'company');
      setHoldCompanies(holdCompanyIssues.map(i => ({
        domain: i.domain,
        name: i.name || i.domain,
        status: 'pending'
      })));

      // INCOMPLETE - Contacts (deduplicate by contact_id, fetch real-time scores)
      const incompleteContactIssues = issues.filter(i => i.issue_type === 'incomplete' && i.entity_type === 'contact');
      const incompleteByContact = new Map();
      incompleteContactIssues.forEach(i => {
        const contactId = i.entity_id;
        if (!incompleteByContact.has(contactId)) {
          incompleteByContact.set(contactId, {
            contact_id: contactId,
            first_name: i.name?.split(' ')[0] || '',
            last_name: i.name?.split(' ').slice(1).join(' ') || '',
            completeness_score: i.details?.completeness_score || 0 // fallback
          });
        }
      });

      // Fetch real-time completeness scores AND current names for contacts
      const contactIds = Array.from(incompleteByContact.keys()).filter(Boolean);
      if (contactIds.length > 0) {
        const { data: realTimeData } = await supabase
          .from('contact_completeness')
          .select('contact_id, completeness_score, first_name, last_name')
          .in('contact_id', contactIds);

        if (realTimeData) {
          realTimeData.forEach(data => {
            const contact = incompleteByContact.get(data.contact_id);
            if (contact) {
              contact.completeness_score = Math.round(data.completeness_score);
              contact.first_name = data.first_name || contact.first_name;
              contact.last_name = data.last_name || contact.last_name;
            }
          });
        }
      }
      setIncompleteContacts(Array.from(incompleteByContact.values()));

      // INCOMPLETE - Companies (fetch real-time scores)
      const incompleteCompanyIssues = issues.filter(i => i.issue_type === 'incomplete' && i.entity_type === 'company');
      const incompleteCompaniesData = incompleteCompanyIssues.map(i => ({
        company_id: i.entity_id,
        name: i.name,
        completeness_score: i.details?.completeness_score || 0 // fallback
      }));

      // Fetch real-time completeness scores AND current names for companies
      const companyIds = incompleteCompaniesData.map(c => c.company_id).filter(Boolean);
      if (companyIds.length > 0) {
        const { data: realTimeCompanyData } = await supabase
          .from('company_completeness')
          .select('company_id, completeness_score, name')
          .in('company_id', companyIds);

        if (realTimeCompanyData) {
          const dataMap = new Map(realTimeCompanyData.map(s => [s.company_id, s]));
          incompleteCompaniesData.forEach(company => {
            const data = dataMap.get(company.company_id);
            if (data) {
              company.completeness_score = Math.round(data.completeness_score);
              company.name = data.name || company.name;
            }
          });
        }
      }
      setIncompleteCompanies(incompleteCompaniesData);

      // MISSING COMPANY LINK
      const missingLinkIssues = issues.filter(i => i.issue_type === 'missing_company_link');
      setMissingCompanyLinks(missingLinkIssues.map(i => ({
        id: i.id, // Include issue ID for marking as resolved
        contact_id: i.entity_id,
        contact_name: i.name,
        email: i.email,
        company_id: i.details?.company_id || i.duplicate_entity_id,
        company_name: i.details?.company_name,
        domain: i.domain
      })));

      // MISSING COMPANY - deduplicate by contact_id
      const missingCompanyIssues = issues.filter(i => i.issue_type === 'missing_company');
      const missingCompanyByContact = new Map();
      missingCompanyIssues.forEach(i => {
        const contactId = i.entity_id;
        if (!missingCompanyByContact.has(contactId)) {
          missingCompanyByContact.set(contactId, {
            issue_ids: [i.id],
            contact_id: contactId,
            first_name: i.name?.split(' ')[0] || '',
            last_name: i.name?.split(' ').slice(1).join(' ') || '',
            emails: i.email ? [i.email] : [],
            category: i.details?.category
          });
        } else {
          // Same contact, collect all issue_ids to mark them all resolved later
          missingCompanyByContact.get(contactId).issue_ids.push(i.id);
        }
      });
      setContactsMissingCompany(Array.from(missingCompanyByContact.values()));

      // POTENTIAL COMPANY MATCHES - domains that might match existing companies by name
      const potentialMatchIssues = issues.filter(i => i.issue_type === 'potential_company_match');
      setPotentialCompanyMatches(potentialMatchIssues.map(i => ({
        id: i.id,
        domain: i.domain,
        email: i.email,
        matched_company_id: i.entity_id,
        matched_company_name: i.name,
        details: i.details
      })));

      // ============================================
      // 2. FETCH FROM duplicates_inbox (backend)
      // ============================================
      const { data: duplicatesRaw, error: duplicatesError } = await supabase
        .from('duplicates_inbox')
        .select('*')
        .in('inbox_id', inboxIds)
        .eq('status', 'pending');

      if (duplicatesError) {
        console.error('Error fetching duplicates:', duplicatesError);
      }

      const duplicates = duplicatesRaw || [];

      // Contact Duplicates - enrich with contact details
      const contactDups = duplicates.filter(d => d.entity_type === 'contact');
      if (contactDups.length > 0) {
        const contactIds = [...new Set(contactDups.flatMap(d => [d.source_id, d.duplicate_id]))];
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name')
          .in('contact_id', contactIds);

        const contactMap = Object.fromEntries((contacts || []).map(c => [c.contact_id, c]));

        setDuplicateContacts(contactDups.map(d => ({
          id: d.id,
          entity_type: 'contact',
          source_id: d.source_id,
          duplicate_id: d.duplicate_id,
          match_type: d.match_type,
          source: contactMap[d.source_id],
          duplicate: contactMap[d.duplicate_id],
          match_details: d.match_details
        })));
      } else {
        setDuplicateContacts([]);
      }

      // Company Duplicates - enrich with company details
      const companyDups = duplicates.filter(d => d.entity_type === 'company');
      if (companyDups.length > 0) {
        const companyIds = [...new Set(companyDups.flatMap(d => [d.source_id, d.duplicate_id]))];
        const { data: companies } = await supabase
          .from('companies')
          .select('company_id, name, category')
          .in('company_id', companyIds);

        const companyMap = Object.fromEntries((companies || []).map(c => [c.company_id, c]));

        setDuplicateCompanies(companyDups.map(d => ({
          id: d.id,
          entity_type: 'company',
          source_id: d.source_id,
          duplicate_id: d.duplicate_id,
          match_type: d.match_type,
          source: companyMap[d.source_id],
          duplicate: companyMap[d.duplicate_id],
          match_details: d.match_details
        })));
      } else {
        setDuplicateCompanies([]);
      }

      // Category missing and keep in touch - these are not in data_integrity_inbox yet
      // TODO: Add these to backend trigger if needed
      setCategoryMissingContacts([]);
      setCategoryMissingCompanies([]);
      setKeepInTouchMissingContacts([]);

      // Keep crmEmailSet for other uses (backward compatibility)
      const allInboxEmails = getThreadParticipants(selectedThread);
      const crmEmailSetLocal = new Set(); // Will be populated if needed
      setCrmEmailSet(crmEmailSetLocal);

    } catch (error) {
      console.error('Error fetching data integrity:', error);
    }
    setLoadingDataIntegrity(false);
  };

  // Reload data integrity when tab becomes active or selection changes
  useEffect(() => {
    if (activeActionTab === 'dataIntegrity') {
      fetchDataIntegrity();
    }
  }, [activeActionTab, selectedThread, selectedWhatsappChat, selectedCalendarEvent]);


  // Handler for Add button on company - opens LinkToExisting modal first
  const handleAddCompanyFromDomain = (domainData) => {
    setLinkToExistingEntityType('company');
    setLinkToExistingItemData({
      domain: domainData.domain,
      issueId: domainData.issueId,
      issueIds: domainData.issueIds || [domainData.issueId], // All issue IDs for this domain
      count: domainData.count,
      sampleEmails: domainData.sampleEmails
    });
    setLinkToExistingModalOpen(true);
  };

  // Handler for Add button on contact - opens LinkToExisting modal first
  const handleAddContactFromNotInCrm = (contactData) => {
    setLinkToExistingEntityType('contact');
    setLinkToExistingItemData({
      email: contactData.email,
      mobile: contactData.mobile,
      name: contactData.name,
      issueId: contactData.issueId
    });
    setLinkToExistingModalOpen(true);
  };

  // Called when "Create New" is clicked in LinkToExisting modal
  const handleCreateNewFromLinkModal = (itemData) => {
    if (linkToExistingEntityType === 'company') {
      // Open the CreateCompanyFromDomainModal
      setCreateCompanyFromDomainData({
        domain: itemData.domain,
        count: itemData.count,
        sampleEmails: itemData.sampleEmails
      });
      setCreateCompanyFromDomainModalOpen(true);
    } else {
      // Open the CreateContact modal
      setCreateContactEmail({
        email: itemData.email || '',
        mobile: itemData.mobile || null,
        name: itemData.name || '',
        first_name: itemData.name?.split(' ')[0] || '',
        last_name: itemData.name?.split(' ').slice(1).join(' ') || '',
        subject: '',
        body_text: ''
      });
      setCreateContactModalOpen(true);
    }
  };

  // Called when link is successful in LinkToExisting modal
  const handleLinkSuccess = async () => {
    // Mark data_integrity_inbox issue as resolved
    if (linkToExistingEntityType === 'company' && linkToExistingItemData?.domain) {
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('domain', linkToExistingItemData.domain)
        .eq('issue_type', 'not_in_crm')
        .eq('entity_type', 'company')
        .eq('status', 'pending');
    } else if (linkToExistingItemData?.email || linkToExistingItemData?.mobile) {
      // For contacts, mark by email or mobile
      let query = supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('issue_type', 'not_in_crm')
        .eq('entity_type', 'contact')
        .eq('status', 'pending');

      if (linkToExistingItemData.email) {
        query = query.eq('email', linkToExistingItemData.email);
      } else if (linkToExistingItemData.mobile) {
        query = query.eq('mobile', linkToExistingItemData.mobile);
      }
      await query;
    }

    fetchDataIntegrity();
    // Remove item from local state
    if (linkToExistingEntityType === 'company') {
      setNotInCrmDomains(prev => prev.filter(c => c.domain !== linkToExistingItemData?.domain));
    } else {
      setNotInCrmEmails(prev => prev.filter(c =>
        c.email !== linkToExistingItemData?.email && c.mobile !== linkToExistingItemData?.mobile
      ));
    }
  };

  const handleCreateCompanyFromDomainSuccess = async (newCompanyId) => {
    // Mark data_integrity_inbox issues as resolved for this domain
    if (createCompanyFromDomainData?.domain) {
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('domain', createCompanyFromDomainData.domain)
        .eq('issue_type', 'not_in_crm')
        .eq('entity_type', 'company')
        .eq('status', 'pending');
    }

    // Refresh data integrity list
    fetchDataIntegrity();

    // Open CompanyDataIntegrityModal for further enrichment
    setCompanyDataIntegrityCompanyId(newCompanyId);
    setCompanyDataIntegrityModalOpen(true);

    toast.success('Company created! Complete the details below.');
  };

  // Handler for domain Hold/Delete actions
  const handleDomainAction = async (domainItem, action) => {
    const domain = typeof domainItem === 'string' ? domainItem : domainItem.domain;

    try {
      if (action === 'hold') {
        // Check if domain already exists in companies_hold
        const { data: existing } = await supabase
          .from('companies_hold')
          .select('company_id')
          .eq('domain', domain)
          .single();

        if (existing) {
          // Update existing record
          await supabase
            .from('companies_hold')
            .update({
              email_count: domainItem.count || 1,
              last_seen_at: new Date().toISOString()
            })
            .eq('domain', domain);
        } else {
          // Insert new record
          const { error } = await supabase
            .from('companies_hold')
            .insert({
              company_id: crypto.randomUUID(),
              domain: domain,
              name: domain,
              email_count: domainItem.count || 1,
              status: 'pending',
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        }

        // Add to holdCompanies state
        setHoldCompanies(prev => [...prev, {
          domain,
          name: domain,
          email_count: domainItem.count || 1,
          status: 'pending'
        }]);

        toast.success(`${domain} put on hold`);
      } else if (action === 'spam') {
        // Add domain to domains_spam
        const { error: spamError } = await supabase
          .from('domains_spam')
          .upsert({
            domain: domain,
            counter: 1
          }, {
            onConflict: 'domain'
          });

        if (spamError) throw spamError;

        // Get all emails from this domain (need fastmail_id for archiving)
        const { data: emailsToArchive } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', `%@${domain}`);

        // Archive each email in Fastmail
        for (const emailRecord of emailsToArchive || []) {
          if (emailRecord.fastmail_id) {
            try {
              await archiveInFastmail(emailRecord.fastmail_id);
            } catch (archiveErr) {
              console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
            }
          }
        }

        // Delete all emails from this domain from command_center_inbox
        const { data: deletedEmails } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', `%@${domain}`)
          .select('id');

        const deletedCount = deletedEmails?.length || 0;

        // Mark all data_integrity issues for this domain as dismissed
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('domain', domain)
          .eq('status', 'pending');

        // Refresh threads and select first one
        await refreshThreads();

        toast.success(`${domain} added to spam${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
      } else if (action === 'delete') {
        // Just remove from list, no DB action
        toast.success(`${domain} dismissed`);
      }

      // Remove from not in CRM list
      setNotInCrmDomains(prev => prev.filter(d => d.domain !== domain));
    } catch (error) {
      console.error('Error handling domain action:', error);
      toast.error(`Failed to ${action} domain`);
    }
  };

  // Handle adding company from hold to CRM
  const handleAddCompanyFromHold = async (company) => {
    try {
      // Create the company
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: company.name || company.domain,
          website: company.domain,
          category: 'Inbox'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add domain to company_domains
      await supabase
        .from('company_domains')
        .insert({
          company_id: newCompany.company_id,
          domain: company.domain
        });

      // Remove from companies_hold
      await supabase
        .from('companies_hold')
        .delete()
        .eq('domain', company.domain);

      // Update local state
      setHoldCompanies(prev => prev.filter(c => c.domain !== company.domain));

      // Open modal for further editing
      setCompanyDataIntegrityCompanyId(newCompany.company_id);
      setCompanyDataIntegrityModalOpen(true);

      toast.success('Company created! Complete the details below.');
    } catch (error) {
      console.error('Error adding company from hold:', error);
      toast.error('Failed to add company');
    }
  };

  // Handle deleting company from hold
  const handleDeleteCompanyFromHold = async (company) => {
    try {
      // Remove from companies_hold table
      const { error } = await supabase
        .from('companies_hold')
        .delete()
        .eq('domain', company.domain);

      if (error) throw error;

      // Update local state
      setHoldCompanies(prev => prev.filter(c => c.domain !== company.domain));

      toast.success(`${company.domain} removed from hold`);
    } catch (error) {
      console.error('Error deleting company from hold:', error);
      toast.error('Failed to remove from hold');
    }
  };

  // Handler to link contact to company (for missing company links)
  const handleLinkContactToCompany = async (item) => {
    try {
      // First, lookup the current company by domain (in case original was merged)
      let companyId = item.company_id;
      let companyName = item.company_name;

      if (item.domain) {
        const { data: domainLookup } = await supabase
          .from('company_domains')
          .select('company_id, companies(name)')
          .eq('domain', item.domain.toLowerCase())
          .single();

        if (domainLookup) {
          companyId = domainLookup.company_id;
          companyName = domainLookup.companies?.name || companyName;
        }
      }

      // Check if already linked to this company
      const { data: existingLink } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', item.contact_id)
        .eq('company_id', companyId)
        .single();

      if (existingLink) {
        // Mark as resolved since it's already linked
        if (item.id) {
          await supabase
            .from('data_integrity_inbox')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', item.id);
        }
        toast.success(`${item.contact_name} is already linked to ${companyName}`);
        // Remove from list since it's resolved
        setMissingCompanyLinks(prev =>
          prev.filter(link => link.contact_id !== item.contact_id || link.domain !== item.domain)
        );
        return;
      }

      // Check if contact already has a primary company
      const { data: existingPrimary } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', item.contact_id)
        .eq('is_primary', true)
        .single();

      // Insert the link
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: item.contact_id,
          company_id: companyId,
          is_primary: !existingPrimary, // Primary if no existing primary
          relationship: 'not_set'
        });

      if (error) throw error;

      // Mark the data_integrity_inbox issue as resolved
      if (item.id) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      // Remove from the list
      setMissingCompanyLinks(prev =>
        prev.filter(link => link.contact_id !== item.contact_id || link.domain !== item.domain)
      );

      toast.success(`${item.contact_name} linked to ${companyName}`);
    } catch (error) {
      console.error('Error linking contact to company:', error);
      toast.error('Failed to link contact to company');
    }
  };

  // Handle linking a domain to an existing company (potential_company_match)
  const handleLinkDomainToCompany = async (item) => {
    try {
      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('company_domains')
        .select('company_id, companies(name)')
        .eq('domain', item.domain.toLowerCase())
        .single();

      if (existingDomain) {
        // Domain already linked - just resolve the issues
        toast.success(`Domain ${item.domain} already linked to ${existingDomain.companies?.name || 'company'}`);
      } else {
        // Insert the domain into company_domains
        const { error } = await supabase
          .from('company_domains')
          .insert({
            company_id: item.matched_company_id,
            domain: item.domain.toLowerCase()
          });

        if (error) throw error;
        toast.success(`Domain ${item.domain} linked to ${item.matched_company_name}`);
      }

      // Mark ALL potential_company_match issues with this domain as resolved (not just clicked one)
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('issue_type', 'potential_company_match')
        .eq('domain', item.domain.toLowerCase())
        .eq('status', 'pending');

      // Remove ALL matches with this domain from local state
      setPotentialCompanyMatches(prev =>
        prev.filter(match => match.domain?.toLowerCase() !== item.domain?.toLowerCase())
      );
    } catch (error) {
      console.error('Error linking domain to company:', error);
      toast.error('Failed to link domain to company');
    }
  };

  // Handle dismissing a potential company match
  const handleDismissPotentialMatch = async (item) => {
    try {
      // Mark ALL potential_company_match issues with this domain as dismissed
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('issue_type', 'potential_company_match')
        .eq('domain', item.domain.toLowerCase())
        .eq('status', 'pending');

      // Remove ALL matches with this domain from local state
      setPotentialCompanyMatches(prev =>
        prev.filter(match => match.domain?.toLowerCase() !== item.domain?.toLowerCase())
      );

      toast.success('Match dismissed');
    } catch (error) {
      console.error('Error dismissing potential match:', error);
      toast.error('Failed to dismiss match');
    }
  };

  // Handle linking a contact to company by email domain (for missing_company issues)
  const handleLinkContactToCompanyByDomain = async (contact) => {
    try {
      const email = contact.emails?.[0];

      // If no email, open the modal for manual company selection
      if (!email) {
        setLinkCompanyModalContact(contact);
        return;
      }

      // Extract domain from email
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) {
        // Invalid email format, open modal for manual selection
        setLinkCompanyModalContact(contact);
        return;
      }

      // Find company by domain in company_domains
      const { data: domainData, error: domainError } = await supabase
        .from('company_domains')
        .select('company_id, companies(company_id, name)')
        .eq('domain', domain)
        .single();

      if (domainError || !domainData) {
        // No company found for domain, open modal for manual selection
        setLinkCompanyModalContact(contact);
        toast.info(`No company found for domain ${domain}. Select one manually.`);
        return;
      }

      const companyId = domainData.company_id;
      const companyName = domainData.companies?.name || domain;

      // Insert into contact_companies
      const { error: linkError } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: companyId,
          is_primary: true
        });

      if (linkError) throw linkError;

      // Mark all data_integrity_inbox issues as resolved (may have multiple per contact)
      const issueIds = contact.issue_ids || (contact.issue_id ? [contact.issue_id] : []);
      if (issueIds.length > 0) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .in('id', issueIds);
      }

      // Remove from the list
      setContactsMissingCompany(prev =>
        prev.filter(c => c.contact_id !== contact.contact_id)
      );

      toast.success(`${contact.first_name} linked to ${companyName}`);
    } catch (error) {
      console.error('Error linking contact to company:', error);
      toast.error('Failed to link contact to company');
    }
  };

  // Fetch AI suggestions from Supabase
  const fetchAiSuggestions = async () => {
    setLoadingAiSuggestions(true);
    try {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching AI suggestions:', error);
      } else {
        setAiSuggestions(data || []);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
    setLoadingAiSuggestions(false);
  };

  // Handle AI suggestion action (accept/reject)
  const handleSuggestionAction = async (suggestionId, action, notes = null) => {
    setProcessingAction(true);
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      const { error } = await supabase
        .from('agent_suggestions')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'user',
          user_notes: notes,
        })
        .eq('id', suggestionId);

      if (error) {
        console.error('Error updating suggestion:', error);
        toast.error('Failed to update suggestion');
      } else {
        toast.success(`Suggestion ${action}ed`);
        // Refresh suggestions
        fetchAiSuggestions();
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error('Error handling suggestion action:', error);
      toast.error('Failed to process action');
    }
    setProcessingAction(false);
  };

  // Trigger duplicate scan
  const triggerDuplicateScan = async () => {
    try {
      toast.loading('Running duplicate scan...');
      const response = await fetch(`${BACKEND_URL}/agent/run-cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: 'contact', limit: 100 }),
      });
      toast.dismiss();
      if (response.ok) {
        const result = await response.json();
        toast.success(`Scan complete: ${result.suggestions_created} suggestions created`);
        fetchAiSuggestions();
      } else {
        toast.error('Scan failed');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Could not connect to agent service');
    }
  };

  // Dismiss a duplicate - move from inbox to main table with ignored status
  const handleDismissDuplicate = async (item) => {
    try {
      if (item.entity_type === 'contact') {
        // Upsert into contact_duplicates with status='ignored' and false_positive=true
        const { error: insertError } = await supabase
          .from('contact_duplicates')
          .upsert({
            primary_contact_id: item.source_id,
            duplicate_contact_id: item.duplicate_id,
            status: 'ignored',
            false_positive: true,
            notes: `Dismissed from duplicates_inbox: ${item.match_type || 'manual'} match`
          }, { onConflict: 'primary_contact_id,duplicate_contact_id' });

        if (insertError) {
          console.error('Error upserting dismissed contact duplicate:', insertError);
          throw insertError;
        }
      } else {
        // Upsert into company_duplicates with status='ignored'
        const { error: insertError } = await supabase
          .from('company_duplicates')
          .upsert({
            primary_company_id: item.source_id,
            duplicate_company_id: item.duplicate_id,
            status: 'ignored',
            notes: `Dismissed from duplicates_inbox: ${item.match_type || 'manual'} match`
          }, { onConflict: 'primary_company_id,duplicate_company_id' });

        if (insertError) {
          console.error('Error upserting dismissed company duplicate:', insertError);
          throw insertError;
        }
      }

      // Delete from duplicates_inbox (both directions of the pair)
      await supabase
        .from('duplicates_inbox')
        .delete()
        .eq('entity_type', item.entity_type)
        .or(`and(source_id.eq.${item.source_id},duplicate_id.eq.${item.duplicate_id}),and(source_id.eq.${item.duplicate_id},duplicate_id.eq.${item.source_id})`);

      // Update data_integrity_inbox to mark as dismissed
      if (item.id) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      // Remove from local state
      if (item.entity_type === 'contact') {
        setDuplicateContacts(prev => prev.filter(d =>
          !(d.source_id === item.source_id && d.duplicate_id === item.duplicate_id)
        ));
      } else {
        setDuplicateCompanies(prev => prev.filter(d =>
          !(d.source_id === item.source_id && d.duplicate_id === item.duplicate_id)
        ));
      }

      toast.success('Duplicate dismissed');
    } catch (error) {
      console.error('Error dismissing duplicate:', error);
      toast.error('Failed to dismiss duplicate');
    }
  };

  // Confirm merge for a duplicate from duplicates_inbox
  const handleConfirmMergeDuplicate = async (item) => {
    try {
      if (item.entity_type === 'contact') {
        // CONTACT MERGE: Use contact_duplicates table + trigger
        // Use upsert to handle case where pair already exists
        const { error: insertError } = await supabase
          .from('contact_duplicates')
          .upsert({
            primary_contact_id: item.source_id,
            duplicate_contact_id: item.duplicate_id,
            start_trigger: true,
            status: 'pending',
            merge_selections: {
              emails: 'combine',
              mobiles: 'combine',
              companies: 'combine',
              tags: 'combine',
              cities: 'combine'
            },
            notes: `From duplicates_inbox: ${item.match_type} match`
          }, {
            onConflict: 'primary_contact_id,duplicate_contact_id'
          });

        if (insertError) {
          console.error('Failed to create merge record:', insertError);
          toast.error('Merge failed: ' + insertError.message);
          return;
        }

        toast.success('Contacts merged successfully');
      } else if (item.entity_type === 'company') {
        // COMPANY MERGE: Use company_duplicates table + trigger
        // Use upsert to handle case where pair already exists
        const { error: insertError } = await supabase
          .from('company_duplicates')
          .upsert({
            primary_company_id: item.source_id,
            duplicate_company_id: item.duplicate_id,
            start_trigger: true,
            status: 'pending',
            merge_selections: {
              contacts: 'combine',
              domains: 'combine',
              tags: 'combine',
              cities: 'combine'
            },
            notes: `From duplicates_inbox: ${item.match_type} match`
          }, {
            onConflict: 'primary_company_id,duplicate_company_id'
          });

        if (insertError) {
          console.error('Failed to create company merge record:', insertError);
          toast.error('Company merge failed: ' + insertError.message);
          return;
        }

        toast.success('Companies merged successfully');
      } else {
        toast.error('Unknown entity type');
        return;
      }

      // Delete from duplicates_inbox (both directions of the pair)
      await supabase
        .from('duplicates_inbox')
        .delete()
        .eq('entity_type', item.entity_type)
        .or(`and(source_id.eq.${item.source_id},duplicate_id.eq.${item.duplicate_id}),and(source_id.eq.${item.duplicate_id},duplicate_id.eq.${item.source_id})`);

      fetchDataIntegrity(); // Refresh the list

    } catch (err) {
      console.error('Merge error:', err);
      toast.error('An error occurred during merge');
    }
  };

  // Run contact audit for selected email
  const runContactAudit = async () => {
    if (!selectedThread || selectedThread.length === 0) {
      toast.error('No email selected');
      return;
    }

    const email = selectedThread[0]; // First email in thread
    setLoadingAudit(true);
    setAuditResult(null);
    setAuditActions([]);
    setSelectedActions(new Set());

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/audit-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: {
            id: email.id,
            fastmail_id: email.fastmail_id || '',
            from_email: email.from_email,
            from_name: email.from_name,
            to_recipients: email.to_recipients || [],
            cc_recipients: email.cc_recipients || [],
            subject: email.subject,
            body_text: email.body_text,
            snippet: email.snippet,
            date: email.date,
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAuditResult(result.audit);
        setAuditActions(result.actions || []);
        // Pre-select all recommended actions
        const allIndices = new Set(result.actions?.map((_, i) => i) || []);
        setSelectedActions(allIndices);
        toast.success(`Audit complete: ${result.action_count} actions found`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Audit failed');
      }
    } catch (error) {
      console.error('Error running audit:', error);
      toast.error('Could not connect to agent service');
    }
    setLoadingAudit(false);
  };

  // Execute selected actions
  const executeSelectedActions = async () => {
    if (selectedActions.size === 0) {
      toast.error('No actions selected');
      return;
    }

    const actionsToExecute = auditActions.filter((_, i) => selectedActions.has(i));
    setExecutingActions(true);

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/execute-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionsToExecute),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`All ${result.successful} actions executed successfully`);
        } else {
          toast.success(`${result.successful}/${result.total} actions executed`);
          if (result.failed > 0) {
            result.results.filter(r => !r.success).forEach(r => {
              toast.error(`Failed: ${r.action} - ${r.message}`);
            });
          }
        }
        // Clear audit after execution
        setAuditResult(null);
        setAuditActions([]);
        setSelectedActions(new Set());
        // Trigger refresh of email contacts by briefly clearing and re-setting selectedThread
        if (selectedThread) {
          const thread = selectedThread;
          setSelectedThread(null);
          setTimeout(() => setSelectedThread(thread), 100);
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Execution failed');
      }
    } catch (error) {
      console.error('Error executing actions:', error);
      toast.error('Could not connect to agent service');
    }
    setExecutingActions(false);
  };

  // Toggle action selection
  const toggleActionSelection = (index) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedActions(newSelected);
  };

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
        .from('note_contacts')
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
            .from('note_contacts')
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

  // Delete a note
  const handleDeleteNote = async (noteId, obsidianPath) => {
    if (!window.confirm('Delete this note? This will remove both the CRM record and the Obsidian file.')) return;

    try {
      // Delete from GitHub/Obsidian first (if path exists)
      if (obsidianPath) {
        const obsidianResponse = await fetch(`${BACKEND_URL}/obsidian/notes`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ obsidianPath })
        });
        const obsidianResult = await obsidianResponse.json();
        if (!obsidianResult.success) {
          console.warn('Could not delete from Obsidian:', obsidianResult.error);
          // Continue with Supabase deletion anyway
        }
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('note_id', noteId);

      if (error) throw error;
      toast.success('Note deleted');
      fetchContactNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
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
        .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at)')
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

  // Handler for editing introduction (used by IntroductionsTab)
  const handleEditIntroduction = (intro) => {
    setEditingIntroduction(intro);
    setIntroductionStatus(intro.status || 'Requested');
    setIntroductionTool(intro.introduction_tool || 'email');
    setIntroductionCategory(intro.category || 'Karma Points');
    setIntroductionText(intro.text || '');
    const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
    setSelectedIntroducee(introducees[0] || null);
    setSelectedIntroducee2(introducees[1] || null);
    setIntroductionModalOpen(true);
  };

  // Handler for deleting introduction (used by IntroductionsTab)
  const handleDeleteIntroduction = async (introductionId) => {
    if (!window.confirm('Delete this introduction?')) return;
    const { error } = await supabase
      .from('introductions')
      .delete()
      .eq('introduction_id', introductionId);
    if (!error) {
      setContactIntroductions(prev => prev.filter(i => i.introduction_id !== introductionId));
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
          deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at)
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
              deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at)
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
  }, [emailContacts, emailCompanies]);

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

  // Handle calendar extraction from email or WhatsApp
  const handleCalendarExtract = async () => {
    // Context-aware: check which tab is active
    const isWhatsApp = activeTab === 'whatsapp';

    if (isWhatsApp) {
      if (!selectedWhatsappChat || !selectedWhatsappChat.messages?.length) {
        toast.error('No WhatsApp chat selected');
        return;
      }
    } else {
      if (!selectedThread || selectedThread.length === 0) {
        toast.error('No email selected');
        return;
      }
    }

    setCalendarLoading(true);
    setPendingCalendarEvent(null);
    setCalendarEventEdits({});

    // Add a user message to chat
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: isWhatsApp ? '📅 Extract meeting from this WhatsApp chat' : '📅 Extract meeting from this email'
    }]);

    try {
      // Build request body based on source
      let requestBody;
      if (isWhatsApp) {
        requestBody = {
          whatsapp: {
            contact_name: selectedWhatsappChat.chat_name || selectedWhatsappChat.contact_number,
            contact_number: selectedWhatsappChat.contact_number,
            is_group_chat: selectedWhatsappChat.is_group_chat || false,
            messages: selectedWhatsappChat.messages.map(m => ({
              content: m.body_text,
              is_from_me: m.direction === 'sent',
              timestamp: m.date,
              sender_name: m.first_name || m.sender || null,
              sender_number: m.contact_number || null,
            })),
          }
        };
      } else {
        const email = selectedThread[0];
        requestBody = {
          email: {
            from_email: email.from_email,
            from_name: email.from_name,
            to_recipients: email.to_recipients || [],
            cc_recipients: email.cc_recipients || [],
            subject: email.subject,
            body_text: email.body_text,
            snippet: email.snippet,
            date: email.date,
          }
        };
      }

      const response = await fetch(`${BACKEND_URL}/calendar/extract-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to extract event');
      }

      const data = await response.json();

      if (data.success && data.event?.found_event) {
        const event = data.event;
        setPendingCalendarEvent(event);

        // Build response message
        let responseMsg = `📅 **Found a meeting!**\n\n`;
        responseMsg += `**${event.title}**\n`;
        if (event.datetime) {
          const dt = new Date(event.datetime);
          responseMsg += `📆 ${dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} at ${dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n`;
        } else if (event.date_text) {
          responseMsg += `📆 "${event.date_text}" (needs confirmation)\n`;
        }
        if (event.location) {
          responseMsg += `📍 ${event.location}`;
          if (event.location_needs_clarification) {
            responseMsg += ` ⚠️ *needs clarification*`;
          }
          responseMsg += `\n`;
        }
        if (event.attendees?.length > 0) {
          responseMsg += `👥 ${event.attendees.map(a => a.name || a.email).join(', ')}\n`;
        }
        if (event.clarification_needed?.length > 0) {
          responseMsg += `\n⚠️ **Please clarify:** ${event.clarification_needed.join(', ')}`;
        }

        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: responseMsg,
          calendarEvent: event
        }]);
      } else {
        const sourceText = isWhatsApp ? 'this chat' : 'this email';
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `🤔 No meeting found in ${sourceText}. Is there something specific you'd like to schedule?`
        }]);
      }
    } catch (error) {
      console.error('Calendar extract error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error extracting event: ${error.message}`
      }]);
      toast.error('Failed to extract calendar event');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Dismiss calendar event from inbox (won't be re-synced)
  const handleDeleteCalendarEvent = async (eventId) => {
    if (!eventId) {
      toast.error('No event selected');
      return;
    }

    if (!window.confirm('Dismiss this calendar event? It won\'t appear again on future syncs.')) {
      return;
    }

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/calendar/delete-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: eventId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dismiss event');
      }

      // Remove from local state
      const currentIndex = calendarEvents.findIndex(e => e.id === eventId);
      setCalendarEvents(prev => prev.filter(e => e.id !== eventId));

      // Select next event or clear selection
      if (calendarEvents.length > 1) {
        const nextIndex = currentIndex >= calendarEvents.length - 1 ? currentIndex - 1 : currentIndex;
        const nextEvent = calendarEvents.filter(e => e.id !== eventId)[nextIndex];
        setSelectedCalendarEvent(nextEvent || null);
      } else {
        setSelectedCalendarEvent(null);
      }

      toast.success('Calendar event dismissed');
    } catch (error) {
      console.error('Error dismissing calendar event:', error);
      toast.error('Failed to dismiss calendar event');
    }
  };

  // Update calendar event title
  const handleUpdateCalendarTitle = async (newTitle) => {
    if (!selectedCalendarEvent || !newTitle.trim()) {
      setEditingCalendarTitle(false);
      return;
    }

    try {
      if (selectedCalendarEvent.source === 'meetings') {
        // Update processed meeting in meetings table
        const { error } = await supabase
          .from('meetings')
          .update({ meeting_name: newTitle.trim() })
          .eq('meeting_id', selectedCalendarEvent.meeting_id);

        if (error) throw error;

        // Update local state
        setProcessedMeetings(prev => prev.map(m =>
          m.meeting_id === selectedCalendarEvent.meeting_id ? { ...m, meeting_name: newTitle.trim() } : m
        ));
        setSelectedCalendarEvent(prev => ({ ...prev, meeting_name: newTitle.trim() }));
      } else {
        // Update inbox event in command_center_inbox table
        const { error } = await supabase
          .from('command_center_inbox')
          .update({ subject: newTitle.trim() })
          .eq('id', selectedCalendarEvent.id);

        if (error) throw error;

        // Update local state
        setCalendarEvents(prev => prev.map(e =>
          e.id === selectedCalendarEvent.id ? { ...e, subject: newTitle.trim() } : e
        ));
        setSelectedCalendarEvent(prev => ({ ...prev, subject: newTitle.trim() }));
      }

      setEditingCalendarTitle(false);
      toast.success('Title updated');
    } catch (error) {
      console.error('Error updating calendar title:', error);
      toast.error('Failed to update title');
    }
  };

  // Process calendar event (Done button) - creates meeting record
  const handleProcessCalendarEvent = async () => {
    if (!selectedCalendarEvent) {
      toast.error('No event selected');
      return;
    }

    try {
      // 1. Create meeting record
      const scoreValue = calendarEventScore ? String(calendarEventScore) : null;
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          meeting_name: selectedCalendarEvent.subject || 'Meeting',
          meeting_date: selectedCalendarEvent.date,
          meeting_status: 'Completed',
          notes: calendarEventNotes || null,
          score: scoreValue,
          description: selectedCalendarEvent.body_text || null,
          event_uid: selectedCalendarEvent.event_uid || null
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // 2. Link contacts - query directly from to_recipients emails (more reliable than state)
      let contactIdsToLink = [];

      // Get emails from to_recipients
      let recipients = selectedCalendarEvent.to_recipients;
      if (typeof recipients === 'string') {
        try { recipients = JSON.parse(recipients); } catch (e) { recipients = []; }
      }
      if (recipients && Array.isArray(recipients)) {
        const emails = recipients
          .map(r => (typeof r === 'string' ? r : r.email || '').replace(/^MAILTO:/i, '').toLowerCase())
          .filter(e => e && e !== 'simone@cimminelli.com' && !e.includes('@group.calendar.google.com'));

        if (emails.length > 0) {
          // Query contact_emails to find matching contact_ids
          const { data: emailMatches } = await supabase
            .from('contact_emails')
            .select('contact_id')
            .in('email', emails);

          if (emailMatches) {
            contactIdsToLink = [...new Set(emailMatches.map(m => m.contact_id))];
          }
        }
      }

      // Also add manually selected contacts
      selectedContactsForMeeting.forEach(c => {
        const cid = c.contact?.contact_id || c.contact_id;
        if (cid && !contactIdsToLink.includes(cid)) {
          contactIdsToLink.push(cid);
        }
      });

      if (contactIdsToLink.length > 0) {
        const meetingContactsData = contactIdsToLink.map(contact_id => ({
          meeting_id: meetingData.meeting_id,
          contact_id
        }));

        const { error: linkError } = await supabase
          .from('meeting_contacts')
          .insert(meetingContactsData);

        if (linkError) console.error('Error linking contacts:', linkError);

        // 3. Update last_interaction_at for linked contacts (use meeting datetime)
        const meetingDateTime = selectedCalendarEvent.date || new Date().toISOString();
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ last_interaction_at: meetingDateTime })
          .in('contact_id', contactIdsToLink);

        if (updateError) console.error('Error updating last_interaction_at:', updateError);
      }

      // 4. Delete from command_center_inbox
      const { error: deleteError } = await supabase
        .from('command_center_inbox')
        .delete()
        .eq('id', selectedCalendarEvent.id);

      if (deleteError) throw deleteError;

      // 5. Update local state
      setCalendarEvents(prev => prev.filter(e => e.id !== selectedCalendarEvent.id));

      // Select next event or clear
      const currentIndex = calendarEvents.findIndex(e => e.id === selectedCalendarEvent.id);
      if (calendarEvents.length > 1) {
        const nextIndex = currentIndex >= calendarEvents.length - 1 ? currentIndex - 1 : currentIndex;
        const nextEvent = calendarEvents.filter(e => e.id !== selectedCalendarEvent.id)[nextIndex];
        setSelectedCalendarEvent(nextEvent ? { ...nextEvent, source: 'inbox' } : null);
      } else {
        setSelectedCalendarEvent(null);
      }

      // Reset form state
      setCalendarEventScore(null);
      setCalendarEventNotes('');
      setSelectedContactsForMeeting([]);

      toast.success('Meeting salvato! ✅');
    } catch (error) {
      console.error('Error processing calendar event:', error);
      toast.error('Errore nel salvare il meeting');
    }
  };

  // Delete processed meeting
  const handleDeleteProcessedMeeting = async (meetingId) => {
    if (!meetingId) {
      toast.error('No meeting selected');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      // 1. Delete from meeting_contacts junction table
      const { error: deleteContactsError } = await supabase
        .from('meeting_contacts')
        .delete()
        .eq('meeting_id', meetingId);

      if (deleteContactsError) {
        console.error('Error deleting meeting contacts:', deleteContactsError);
      }

      // 2. Delete the meeting record
      const { error: deleteMeetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('meeting_id', meetingId);

      if (deleteMeetingError) throw deleteMeetingError;

      // 3. Update local state
      setProcessedMeetings(prev => prev.filter(m => m.meeting_id !== meetingId));

      // Select next meeting or clear
      const currentIndex = processedMeetings.findIndex(m => m.meeting_id === meetingId);
      if (processedMeetings.length > 1) {
        const nextIndex = currentIndex >= processedMeetings.length - 1 ? currentIndex - 1 : currentIndex;
        const nextMeeting = processedMeetings.filter(m => m.meeting_id !== meetingId)[nextIndex];
        setSelectedCalendarEvent(nextMeeting ? { ...nextMeeting, source: 'meetings' } : null);
      } else {
        setSelectedCalendarEvent(null);
      }

      toast.success('Meeting deleted');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  // Create calendar event
  const handleCreateCalendarEvent = async () => {
    if (!pendingCalendarEvent) {
      toast.error('No event to create');
      return;
    }

    setCalendarLoading(true);

    try {
      // Merge any user edits with the extracted event
      const eventData = {
        title: calendarEventEdits.title || pendingCalendarEvent.title,
        description: calendarEventEdits.description || pendingCalendarEvent.description || '',
        location: calendarEventEdits.useGoogleMeet ? '' : (calendarEventEdits.location || pendingCalendarEvent.location || ''),
        startDate: calendarEventEdits.datetime || pendingCalendarEvent.datetime,
        attendees: calendarEventEdits.attendees || pendingCalendarEvent.attendees || [],
        timezone: calendarEventEdits.timezone || 'Europe/Rome',
        reminders: [15], // 15 min before
        useGoogleMeet: calendarEventEdits.useGoogleMeet || false,
      };

      if (!eventData.startDate) {
        toast.error('Please specify a date and time');
        setCalendarLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/google-calendar/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create event');
      }

      const data = await response.json();

      if (data.success) {
        // invitesSent can be boolean (Google) or array (legacy)
        const invitesSent = data.invitesSent;
        const hasInvites = invitesSent === true || (Array.isArray(invitesSent) && invitesSent.length > 0);
        const attendeeNames = eventData.attendees?.map(a => a.name || a.email).join(', ');
        const inviteMsg = hasInvites && attendeeNames
          ? `\n📧 Invites sent to: ${attendeeNames}`
          : (eventData.attendees?.length > 0 && !hasInvites ? '\n⚠️ Attendees added but invites not sent' : '');

        toast.success(hasInvites ? '📅 Event created and invites sent!' : '📅 Event created!');
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Event created!**\n\n**${eventData.title}**\n📆 ${new Date(eventData.startDate).toLocaleString('it-IT')}\n${eventData.location ? `📍 ${eventData.location}\n` : ''}${inviteMsg}`
        }]);
        setPendingCalendarEvent(null);
        setCalendarEventEdits({});
      }
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(`Failed to create event: ${error.message}`);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Failed to create event: ${error.message}`
      }]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Update pending calendar event field
  const updateCalendarEventField = (field, value) => {
    setCalendarEventEdits(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Archive email in Fastmail
  const archiveInFastmail = async (fastmailId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fastmailId }),
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Archive failed:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('Archive error:', error);
      return false;
    }
  };

  // Helper function to check if attachment should be auto-skipped (images, ICS files)
  const shouldSkipAttachment = (att) => {
    const skipTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/ico', 'text/calendar'];
    const skipExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'ics'];
    const ext = att.name?.split('.').pop()?.toLowerCase();
    return skipTypes.includes(att.type?.toLowerCase()) || skipExtensions.includes(ext);
  };

  // Check for attachments and show modal before saving
  const handleDoneClick = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    // Collect all attachments from all emails in thread
    const allAttachments = selectedThread.flatMap(email =>
      (email.attachments || []).map(att => ({
        ...att,
        emailSubject: email.subject,
        emailDate: email.date,
        fastmailId: email.fastmail_id
      }))
    );

    if (allAttachments.length > 0) {
      // Filter out images and ICS files for the modal
      const relevantAttachments = allAttachments.filter(att => !shouldSkipAttachment(att));

      if (relevantAttachments.length > 0) {
        // Show attachment modal only for relevant attachments
        setPendingAttachments(relevantAttachments);
        setAttachmentModalOpen(true);
      } else {
        // All attachments are images or ICS, skip modal
        saveAndArchive();
      }
    } else {
      // No attachments, proceed directly
      saveAndArchive();
    }
  };

  // Called when attachment modal is closed (save or skip)
  const handleAttachmentModalClose = () => {
    setAttachmentModalOpen(false);
    setPendingAttachments([]);
    // Continue with save and archive
    saveAndArchive();
  };

  // Wrapper for handleSend that checks attachments after sending
  const handleSendWithAttachmentCheck = async (bodyOverride = null, keepInInboxWithStatus = null) => {
    // Store the status for later use in saveAndArchive
    pendingInboxStatusRef.current = keepInInboxWithStatus;

    // First, send the email
    await handleSend(bodyOverride, keepInInboxWithStatus);

    // After sending, check for attachments in thread (same logic as Done button)
    if (!selectedThread || selectedThread.length === 0) return;

    const allAttachments = selectedThread.flatMap(email =>
      (email.attachments || []).map(att => ({
        ...att,
        emailSubject: email.subject,
        emailDate: email.date,
        fastmailId: email.fastmail_id
      }))
    );

    if (allAttachments.length > 0) {
      // Filter out images and ICS files for the modal
      const relevantAttachments = allAttachments.filter(att => !shouldSkipAttachment(att));

      if (relevantAttachments.length > 0) {
        // Show attachment modal only for relevant attachments
        setPendingAttachments(relevantAttachments);
        setAttachmentModalOpen(true);
      } else {
        // All attachments are images or ICS, skip modal
        saveAndArchive();
      }
    } else {
      // No attachments, proceed directly with saveAndArchive
      saveAndArchive();
    }
  };

  // Save & Archive - save email to CRM tables and archive in Fastmail
  const saveAndArchive = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    setSaving(true);
    const errors = [];
    const logs = [];

    const log = (step, message, data = null) => {
      const entry = { step, message, data, timestamp: new Date().toISOString() };
      logs.push(entry);
    };

    try {
      log('START', 'Beginning Save & Archive process');

      // Get all contacts from the email thread (excluding me)
      const contactsInThread = emailContacts.filter(p =>
        p.contact?.contact_id && p.email?.toLowerCase() !== MY_EMAIL
      );
      log('CONTACTS', `Found ${contactsInThread.length} contacts (excluding me)`,
        contactsInThread.map(c => ({ email: c.email, name: c.contact?.first_name })));

      // Track successfully saved emails for archive/cleanup
      const successfullySavedEmails = [];

      // Process each email in the thread
      for (const email of selectedThread) {
        log('EMAIL', `Processing email: ${email.subject}`, { id: email.id, fastmail_id: email.fastmail_id });

        // Track if CRM save was successful for this email
        let crmSaveSuccess = true;

        // 1. Create or get email_thread
        let emailThreadId = null;
        try {
          // Check if thread already exists
          const { data: existingThread, error: checkError } = await supabase
            .from('email_threads')
            .select('email_thread_id')
            .eq('thread_id', email.thread_id)
            .maybeSingle();

          if (checkError) {
            log('ERROR', 'Failed to check existing thread', checkError);
            errors.push({ step: 'check_thread', error: checkError });
            crmSaveSuccess = false;
          }

          if (existingThread) {
            emailThreadId = existingThread.email_thread_id;
            log('THREAD', 'Using existing thread', { emailThreadId });

            // Update last_message_timestamp if newer
            const { error: updateError } = await supabase
              .from('email_threads')
              .update({
                last_message_timestamp: email.date,
                updated_at: new Date().toISOString()
              })
              .eq('email_thread_id', emailThreadId)
              .lt('last_message_timestamp', email.date);

            if (updateError) {
              log('WARNING', 'Failed to update thread timestamp', updateError);
            }
          } else {
            // Create new thread
            const { data: newThread, error: insertError } = await supabase
              .from('email_threads')
              .insert({
                thread_id: email.thread_id,
                subject: email.subject?.replace(/^(Re: |Fwd: )+/i, ''),
                last_message_timestamp: email.date,
              })
              .select('email_thread_id')
              .single();

            if (insertError) {
              log('ERROR', 'Failed to create thread', insertError);
              errors.push({ step: 'create_thread', error: insertError });
              crmSaveSuccess = false;
            } else {
              emailThreadId = newThread.email_thread_id;
              log('THREAD', 'Created new thread', { emailThreadId });
            }
          }
        } catch (threadError) {
          log('ERROR', 'Thread operation failed', threadError.message);
          errors.push({ step: 'thread', error: threadError.message });
          crmSaveSuccess = false;
        }

        // 2. Get sender contact_id (if in CRM)
        const senderEmail = email.from_email?.toLowerCase();
        let senderContactId = null;

        // First check emailContacts (already loaded)
        const senderContact = emailContacts.find(p => p.email?.toLowerCase() === senderEmail);
        if (senderContact?.contact?.contact_id) {
          senderContactId = senderContact.contact.contact_id;
        } else {
          // If not found (e.g., I'm the sender), look up directly in DB
          try {
            const { data: contactEmail } = await supabase
              .from('contact_emails')
              .select('contact_id')
              .eq('email', senderEmail)
              .maybeSingle();
            senderContactId = contactEmail?.contact_id || null;
          } catch (e) {
            log('WARNING', 'Failed to look up sender contact_id', e.message);
          }
        }
        log('SENDER', `Sender: ${senderEmail}`, { contactId: senderContactId, inCRM: !!senderContactId });

        // 3. Create email record if not exists
        let emailId = null;
        try {
          // Check if email already exists
          const { data: existingEmail, error: checkEmailError } = await supabase
            .from('emails')
            .select('email_id')
            .eq('gmail_id', email.fastmail_id)
            .maybeSingle();

          if (checkEmailError) {
            log('ERROR', 'Failed to check existing email', checkEmailError);
            errors.push({ step: 'check_email', error: checkEmailError });
            crmSaveSuccess = false;
          }

          if (existingEmail) {
            emailId = existingEmail.email_id;
            log('EMAIL_RECORD', 'Email already exists', { emailId });
          } else {
            // Determine direction
            const isSentByMe = senderEmail === MY_EMAIL;
            const direction = isSentByMe ? 'sent' : 'received';

            // Build email record - only include sender_contact_id if we have one
            const emailRecord = {
              gmail_id: email.fastmail_id,
              thread_id: email.thread_id,
              email_thread_id: emailThreadId,
              subject: email.subject,
              body_plain: email.body_text,
              body_html: email.body_html,
              message_timestamp: email.date,
              direction: direction,
              has_attachments: email.has_attachments || false,
              attachment_count: email.attachments?.length || 0,
              is_read: email.is_read || false,
              is_starred: email.is_starred || false,
              created_by: 'Edge Function',
            };

            // Only add sender_contact_id if we have a contact for the sender
            if (senderContactId) {
              emailRecord.sender_contact_id = senderContactId;
            }

            const { data: newEmail, error: insertEmailError } = await supabase
              .from('emails')
              .insert(emailRecord)
              .select('email_id')
              .single();

            if (insertEmailError) {
              log('ERROR', 'Failed to create email record', insertEmailError);
              errors.push({ step: 'create_email', error: insertEmailError });
              crmSaveSuccess = false;
            } else {
              emailId = newEmail.email_id;
              log('EMAIL_RECORD', 'Created email record', { emailId, direction });
            }
          }
        } catch (emailError) {
          log('ERROR', 'Email operation failed', emailError.message);
          errors.push({ step: 'email', error: emailError.message });
          crmSaveSuccess = false;
        }

        // 4. Create email_participants for contacts in CRM
        if (emailId) {
          try {
            // Collect all participants with their roles
            const participants = [];

            // From (sender)
            if (senderContactId) {
              participants.push({ contact_id: senderContactId, participant_type: 'sender' });
            }

            // To recipients
            const toRecipients = email.to_recipients || [];
            for (const recipient of toRecipients) {
              const recipientContact = emailContacts.find(p =>
                p.email?.toLowerCase() === recipient.email?.toLowerCase()
              );
              if (recipientContact?.contact?.contact_id) {
                participants.push({
                  contact_id: recipientContact.contact.contact_id,
                  participant_type: 'to'
                });
              }
            }

            // CC recipients
            const ccRecipients = email.cc_recipients || [];
            for (const recipient of ccRecipients) {
              const recipientContact = emailContacts.find(p =>
                p.email?.toLowerCase() === recipient.email?.toLowerCase()
              );
              if (recipientContact?.contact?.contact_id) {
                participants.push({
                  contact_id: recipientContact.contact.contact_id,
                  participant_type: 'cc'
                });
              }
            }

            log('PARTICIPANTS', `Found ${participants.length} participants in CRM`, participants);

            // Insert participants (skip if already exists)
            for (const participant of participants) {
              const { data: existing } = await supabase
                .from('email_participants')
                .select('participant_id')
                .eq('email_id', emailId)
                .eq('contact_id', participant.contact_id)
                .maybeSingle();

              if (!existing) {
                const { error: insertParticipantError } = await supabase
                  .from('email_participants')
                  .insert({
                    email_id: emailId,
                    contact_id: participant.contact_id,
                    participant_type: participant.participant_type,
                  });

                if (insertParticipantError) {
                  log('WARNING', 'Failed to insert participant', { ...participant, error: insertParticipantError });
                }
              }
            }
            log('PARTICIPANTS', 'Participants processed');
          } catch (participantError) {
            log('ERROR', 'Participant operation failed', participantError.message);
            errors.push({ step: 'participants', error: participantError.message });
          }
        }

        // 5. Create interactions for contacts (not me)
        if (emailThreadId) {
          try {
            const isSentByMe = senderEmail === MY_EMAIL;

            for (const contactEntry of contactsInThread) {
              const contactId = contactEntry.contact?.contact_id;
              if (!contactId) continue;

              // Check if interaction already exists for this thread and contact
              const { data: existingInteraction } = await supabase
                .from('interactions')
                .select('interaction_id')
                .eq('contact_id', contactId)
                .eq('email_thread_id', emailThreadId)
                .maybeSingle();

              if (existingInteraction) {
                log('INTERACTION', `Interaction already exists for contact ${contactEntry.email}`,
                  { interactionId: existingInteraction.interaction_id });
                continue;
              }

              // Determine direction from contact's perspective
              // If I sent it → contact received it → direction is 'sent' (from me)
              // If contact sent it → I received it → direction is 'received' (from them)
              const direction = isSentByMe ? 'sent' : 'received';

              const { data: newInteraction, error: interactionError } = await supabase
                .from('interactions')
                .insert({
                  contact_id: contactId,
                  interaction_type: 'email',
                  direction: direction,
                  interaction_date: email.date,
                  email_thread_id: emailThreadId,
                  summary: email.subject || email.snippet?.substring(0, 100),
                })
                .select('interaction_id')
                .single();

              if (interactionError) {
                log('WARNING', `Failed to create interaction for ${contactEntry.email}`, interactionError);
              } else {
                log('INTERACTION', `Created interaction for ${contactEntry.email}`,
                  { interactionId: newInteraction.interaction_id, direction });
              }
            }
          } catch (interactionError) {
            log('ERROR', 'Interaction operation failed', interactionError.message);
            errors.push({ step: 'interactions', error: interactionError.message });
          }
        }

        // 6. Link thread to contacts via contact_email_threads
        if (emailThreadId) {
          try {
            for (const contactEntry of contactsInThread) {
              const contactId = contactEntry.contact?.contact_id;
              if (!contactId) continue;

              const { data: existing } = await supabase
                .from('contact_email_threads')
                .select('contact_id')
                .eq('contact_id', contactId)
                .eq('email_thread_id', emailThreadId)
                .maybeSingle();

              if (!existing) {
                const { error: linkError } = await supabase
                  .from('contact_email_threads')
                  .insert({ contact_id: contactId, email_thread_id: emailThreadId });

                if (linkError) {
                  log('WARNING', `Failed to link thread to contact ${contactEntry.email}`, linkError);
                }
              }
            }
            log('THREAD_LINKS', 'Thread linked to contacts');
          } catch (linkError) {
            log('ERROR', 'Thread link operation failed', linkError.message);
            errors.push({ step: 'thread_links', error: linkError.message });
          }
        }

        // 7. Update last_interaction_at on contacts
        try {
          for (const contactEntry of contactsInThread) {
            const contactId = contactEntry.contact?.contact_id;
            if (!contactId) continue;

            // Only update if this email is newer than current last_interaction_at
            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                last_interaction_at: email.date,
                last_modified_at: new Date().toISOString(),
                last_modified_by: 'Edge Function'
              })
              .eq('contact_id', contactId)
              .or(`last_interaction_at.is.null,last_interaction_at.lt.${email.date}`);

            if (updateError) {
              log('WARNING', `Failed to update last_interaction_at for ${contactEntry.email}`, updateError);
            }
          }
          log('CONTACTS_UPDATE', 'Updated last_interaction_at for contacts');
        } catch (updateError) {
          log('ERROR', 'Contact update operation failed', updateError.message);
          errors.push({ step: 'contacts_update', error: updateError.message });
        }

        // Only proceed with archive and cleanup if CRM save was successful
        if (crmSaveSuccess) {
          // 8. Archive in Fastmail
          try {
            const archiveSuccess = await archiveInFastmail(email.fastmail_id);
            if (archiveSuccess) {
              log('FASTMAIL', 'Archived in Fastmail', { fastmail_id: email.fastmail_id });
            } else {
              log('WARNING', 'Failed to archive in Fastmail', { fastmail_id: email.fastmail_id });
            }
          } catch (archiveError) {
            log('ERROR', 'Fastmail archive failed', archiveError.message);
            errors.push({ step: 'fastmail_archive', error: archiveError.message });
          }

          // 9. Remove from command_center_inbox OR update status if keeping in inbox
          const keepStatus = pendingInboxStatusRef.current;
          try {
            if (keepStatus) {
              // Keep in inbox but update status
              const { error: updateError } = await supabase
                .from('command_center_inbox')
                .update({ status: keepStatus })
                .eq('id', email.id);

              if (updateError) {
                log('ERROR', 'Failed to update status in command_center_inbox', updateError);
                errors.push({ step: 'update_inbox_status', error: updateError });
              } else {
                log('STATUS_UPDATE', `Updated status to '${keepStatus}' in command_center_inbox`, { id: email.id });
              }
            } else {
              // Normal flow - delete from inbox
              const { error: deleteError } = await supabase
                .from('command_center_inbox')
                .delete()
                .eq('id', email.id);

              if (deleteError) {
                log('ERROR', 'Failed to delete from command_center_inbox', deleteError);
                errors.push({ step: 'delete_inbox', error: deleteError });
              } else {
                log('CLEANUP', 'Removed from command_center_inbox', { id: email.id });
              }
            }
          } catch (opError) {
            log('ERROR', 'Inbox operation failed', opError.message);
            errors.push({ step: 'inbox_operation', error: opError.message });
          }

          // Track this email as successfully saved
          successfullySavedEmails.push(email.id);
        } else {
          log('SKIP_ARCHIVE', 'Skipping archive/cleanup due to CRM save failure', { emailId: email.id });
        }
      }

      // Update local state based on whether we're keeping with status or removing
      const keepStatus = pendingInboxStatusRef.current;
      if (successfullySavedEmails.length > 0) {
        const processedIds = new Set(successfullySavedEmails);

        if (keepStatus) {
          // Update status in local state instead of removing
          setEmails(prev => prev.map(e =>
            processedIds.has(e.id) ? { ...e, status: keepStatus } : e
          ));
          setThreads(prev => prev.map(t => ({
            ...t,
            emails: t.emails.map(e =>
              processedIds.has(e.id) ? { ...e, status: keepStatus } : e
            ),
            status: t.emails.some(e => processedIds.has(e.id)) ? keepStatus : t.status
          })));
          setSelectedThread(null);
          log('STATE_UPDATE', `Updated status to '${keepStatus}' for ${successfullySavedEmails.length} emails in local state`);
        } else {
          // Normal flow - remove from local state
          setEmails(prev => prev.filter(e => !processedIds.has(e.id)));
          setThreads(prev => {
            const updated = prev.map(t => ({
              ...t,
              emails: t.emails.filter(e => !processedIds.has(e.id)),
              count: t.emails.filter(e => !processedIds.has(e.id)).length
            })).filter(t => t.emails.length > 0);
            return updated.map(t => ({
              ...t,
              latestEmail: t.emails[0]
            }));
          });
          setSelectedThread(null);
          log('STATE_UPDATE', `Removed ${successfullySavedEmails.length} emails from local state`);
        }
      } else {
        log('STATE_UPDATE', 'No emails were successfully saved - keeping all in local state');
      }

      // Clear the pending status ref
      pendingInboxStatusRef.current = null;

      log('COMPLETE', `Finished with ${errors.length} errors, ${successfullySavedEmails.length} saved`);

      if (successfullySavedEmails.length === 0) {
        toast.error('Failed to save - emails not archived');
      } else if (errors.length > 0) {
        const action = keepStatus ? `moved to '${keepStatus}'` : 'archived';
        toast.success(`Saved & ${action} ${successfullySavedEmails.length} emails (${errors.length} warnings)`);
      } else {
        const action = keepStatus ? `Saved & moved to '${keepStatus}'` : 'Saved & Archived';
        toast.success(`${action} successfully`);
      }

    } catch (error) {
      log('FATAL', 'Unexpected error', error.message);
      errors.push({ step: 'fatal', error: error.message });
      toast.error('Failed to Save & Archive');
    } finally {
      setSaving(false);
    }
  };

  // Update status of selected thread/chat (for Need Actions / Waiting Input)
  const updateItemStatus = async (newStatus) => {
    if (activeTab === 'email' && selectedThread?.length > 0) {
      const ids = selectedThread.map(e => e.id);
      const { error } = await supabase
        .from('command_center_inbox')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) {
        toast.error('Failed to update status');
        console.error('Error updating status:', error);
      } else {
        toast.success(`Moved to ${newStatus === 'need_actions' ? 'Need Actions' : 'Waiting Input'}`);
        // Refresh threads to reflect new status
        refreshThreads();
      }
    } else if (activeTab === 'whatsapp' && selectedWhatsappChat) {
      const ids = selectedWhatsappChat.messages.map(m => m.id);
      const { error } = await supabase
        .from('command_center_inbox')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) {
        toast.error('Failed to update status');
        console.error('Error updating status:', error);
      } else {
        toast.success(`Moved to ${newStatus === 'need_actions' ? 'Need Actions' : 'Waiting Input'}`);
        // Refresh WhatsApp chats
        setWhatsappChats(prev => prev.map(chat =>
          chat.chat_id === selectedWhatsappChat.chat_id
            ? { ...chat, status: newStatus }
            : chat
        ));
      }
    }
  };

  // Handle WhatsApp Done - save messages to CRM and remove from staging
  const handleWhatsAppDone = async () => {
    if (!selectedWhatsappChat) return;

    setSaving(true);
    try {
      const chatId = selectedWhatsappChat.chat_id;
      const messages = selectedWhatsappChat.messages || [];
      const contactPhone = selectedWhatsappChat.contact_number;

      // 1. Find or create the chat in chats table
      let crmChatId = null;
      const { data: existingChat, error: chatFindError } = await supabase
        .from('chats')
        .select('id')
        .eq('external_chat_id', chatId)
        .maybeSingle();

      if (chatFindError) {
        console.error('Error finding chat:', chatFindError);
      }

      if (existingChat) {
        crmChatId = existingChat.id;
      } else {
        // Create new chat
        const { data: newChat, error: chatCreateError } = await supabase
          .from('chats')
          .insert({
            chat_name: selectedWhatsappChat.chat_name || selectedWhatsappChat.contact_number,
            is_group_chat: selectedWhatsappChat.is_group_chat || false,
            category: selectedWhatsappChat.is_group_chat ? 'group' : 'individual',
            external_chat_id: chatId,
            created_by: 'Edge Function'
          })
          .select('id')
          .single();

        if (chatCreateError) {
          console.error('Error creating chat:', chatCreateError);
          toast.error('Failed to create chat record');
          setSaving(false);
          return;
        }
        crmChatId = newChat.id;
      }

      // 2. Find contact by phone number (consistent with email flow)
      let contactId = null;
      if (contactPhone && !selectedWhatsappChat.is_group_chat) {
        // Normalize phone: remove spaces, dashes, parentheses
        const normalizedPhone = contactPhone.replace(/[\s\-\(\)]/g, '');
        // Also try without leading +
        const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');

        const { data: contactMobile, error: mobileError } = await supabase
          .from('contact_mobiles')
          .select('contact_id')
          .or(`mobile.ilike.%${normalizedPhone}%,mobile.ilike.%${phoneWithoutPlus}%`)
          .limit(1)
          .maybeSingle();

        if (mobileError) {
          console.error('Error finding contact by phone:', mobileError);
        } else if (contactMobile) {
          contactId = contactMobile.contact_id;
          console.log('Found contact for phone:', contactPhone, '-> contact_id:', contactId);
        }
      }

      // 3. Link chat to contact (like contact_email_threads for email)
      if (crmChatId && contactId) {
        const { error: linkError } = await supabase
          .from('contact_chats')
          .upsert({
            contact_id: contactId,
            chat_id: crmChatId
          }, { onConflict: 'contact_id,chat_id' });

        if (linkError) {
          console.error('Error linking chat to contact:', linkError);
        } else {
          console.log('Linked chat to contact:', crmChatId, '->', contactId);
        }
      }

      // 4. Save each message as an interaction (now with contact_id)
      for (const msg of messages) {
        const messageUid = msg.message_uid || msg.id;
        let interactionId = null;

        // Check if interaction already exists
        const { data: existingInteraction } = await supabase
          .from('interactions')
          .select('interaction_id')
          .eq('external_interaction_id', messageUid)
          .maybeSingle();

        if (!existingInteraction) {
          const interactionData = {
            interaction_type: 'whatsapp',
            direction: msg.direction || 'received',
            interaction_date: msg.date,
            chat_id: crmChatId,
            summary: msg.body_text || msg.snippet,
            external_interaction_id: messageUid,
            created_at: new Date().toISOString()
          };

          // Add contact_id if we found one (consistent with email flow)
          if (contactId) {
            interactionData.contact_id = contactId;
          }

          const { data: newInteraction } = await supabase
            .from('interactions')
            .insert(interactionData)
            .select('interaction_id')
            .single();

          interactionId = newInteraction?.interaction_id;
        } else {
          interactionId = existingInteraction.interaction_id;
        }

        // 4.5 Link attachments to contact, chat, and interaction
        if (messageUid) {
          const attachmentUpdate = {
            chat_id: crmChatId
          };
          if (contactId) attachmentUpdate.contact_id = contactId;
          if (interactionId) attachmentUpdate.interaction_id = interactionId;

          const { error: attachmentLinkError } = await supabase
            .from('attachments')
            .update(attachmentUpdate)
            .eq('external_reference', messageUid);

          if (attachmentLinkError) {
            console.error('Error linking attachments:', attachmentLinkError);
          }
        }
      }

      // 5. Update contact's last_interaction_at (consistent with email flow)
      if (contactId && messages.length > 0) {
        // Find the latest message date
        const latestMessageDate = messages.reduce((latest, msg) => {
          const msgDate = new Date(msg.date);
          return msgDate > latest ? msgDate : latest;
        }, new Date(0));

        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            last_interaction_at: latestMessageDate.toISOString(),
            last_modified_at: new Date().toISOString(),
            last_modified_by: 'User'
          })
          .eq('contact_id', contactId)
          .or(`last_interaction_at.is.null,last_interaction_at.lt.${latestMessageDate.toISOString()}`);

        if (updateError) {
          console.error('Failed to update last_interaction_at:', updateError);
        } else {
          console.log('Updated last_interaction_at for contact:', contactId);
        }
      }

      // 6. Delete messages from staging (command_center_inbox)
      const messageIds = messages.map(m => m.id).filter(Boolean);
      if (messageIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .in('id', messageIds);

        if (deleteError) {
          console.error('Error deleting from staging:', deleteError);
        }
      }

      // 7. Update local state - remove processed chat
      setWhatsappChats(prev => prev.filter(c => c.chat_id !== chatId));
      setWhatsappMessages(prev => prev.filter(m => m.chat_id !== chatId));

      // 8. Select next chat if available
      const remainingChats = whatsappChats.filter(c => c.chat_id !== chatId);
      if (remainingChats.length > 0) {
        setSelectedWhatsappChat(remainingChats[0]);
      } else {
        setSelectedWhatsappChat(null);
      }

      toast.success('WhatsApp messages archived');
    } catch (error) {
      console.error('Error archiving WhatsApp:', error);
      toast.error('Failed to archive WhatsApp messages');
    } finally {
      setSaving(false);
    }
  };

  // Handle WhatsApp Spam - add to spam list and delete messages + attachments
  const handleWhatsAppSpam = async () => {
    if (!selectedWhatsappChat) return;

    setSaving(true);
    try {
      const phone = selectedWhatsappChat.contact_number;
      const chatId = selectedWhatsappChat.chat_id;
      const messages = selectedWhatsappChat.messages || [];
      const messageUids = messages.map(m => m.message_uid || m.id).filter(Boolean);

      // 1. Add to whatsapp_spam list
      const { data: existing } = await supabase
        .from('whatsapp_spam')
        .select('counter')
        .eq('mobile_number', phone)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('whatsapp_spam')
          .update({ counter: existing.counter + 1 })
          .eq('mobile_number', phone);
      } else {
        await supabase
          .from('whatsapp_spam')
          .insert({ mobile_number: phone, counter: 1 });
      }

      // 2. Get attachments to delete
      if (messageUids.length > 0) {
        const { data: attachments } = await supabase
          .from('attachments')
          .select('attachment_id, permanent_url')
          .in('external_reference', messageUids);

        // 3. Delete from Storage bucket
        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            if (att.permanent_url) {
              // Extract path from URL: .../whatsapp-attachments/path/to/file
              const urlParts = att.permanent_url.split('/whatsapp-attachments/');
              if (urlParts[1]) {
                const storagePath = decodeURIComponent(urlParts[1].split('?')[0]);
                await supabase.storage
                  .from('whatsapp-attachments')
                  .remove([storagePath]);
              }
            }
          }

          // 4. Delete from attachments table
          const attIds = attachments.map(a => a.attachment_id);
          await supabase
            .from('attachments')
            .delete()
            .in('attachment_id', attIds);
        }
      }

      // 5. Delete from command_center_inbox
      const messageIds = messages.map(m => m.id).filter(Boolean);
      if (messageIds.length > 0) {
        await supabase
          .from('command_center_inbox')
          .delete()
          .in('id', messageIds);
      }

      // 6. Update local state
      setWhatsappChats(prev => prev.filter(c => c.chat_id !== chatId));
      setWhatsappMessages(prev => prev.filter(m => m.chat_id !== chatId));

      // 7. Select next chat
      const remainingChats = whatsappChats.filter(c => c.chat_id !== chatId);
      if (remainingChats.length > 0) {
        setSelectedWhatsappChat(remainingChats[0]);
      } else {
        setSelectedWhatsappChat(null);
      }

      toast.success(`${phone} marked as spam`);
    } catch (error) {
      console.error('Error marking WhatsApp as spam:', error);
      toast.error('Failed to mark as spam');
    } finally {
      setSaving(false);
    }
  };

  // Mark as spam - block email or domain, archive in Fastmail, and delete from Supabase
  const markAsSpam = async (type) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const emailAddr = latestEmail.from_email?.toLowerCase();
    const domain = emailAddr?.split('@')[1];

    try {
      let deletedCount = 0;

      if (type === 'email') {
        // Check if email already in spam list
        const { data: existingArr } = await supabase
          .from('emails_spam')
          .select('counter')
          .eq('email', emailAddr);

        const existing = existingArr?.[0];
        if (existing) {
          // Increment counter
          const { error: spamError } = await supabase
            .from('emails_spam')
            .update({
              counter: existing.counter + 1,
              last_modified_at: new Date().toISOString()
            })
            .eq('email', emailAddr);

          if (spamError) {
            console.error('Spam update error:', spamError);
            throw spamError;
          }
        } else {
          // Insert new
          const { error: spamError } = await supabase.from('emails_spam').insert({
            email: emailAddr,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          });

          if (spamError) {
            console.error('Spam insert error:', spamError);
            throw spamError;
          }
        }

        // Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToDelete, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailAddr);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        // Archive each email in Fastmail
        for (const email of emailsToDelete || []) {
          if (email.fastmail_id) {
            await archiveInFastmail(email.fastmail_id);
          }
        }

        // Delete ALL emails from this sender in Supabase
        const { data: deleted, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailAddr)
          .select('id');

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        deletedCount = deleted?.length || 0;
        console.log('Deleted emails:', deleted);

        // Update local state - remove all emails from this sender
        const idsToRemove = new Set(deleted?.map(e => e.id) || []);
        setEmails(prev => prev.filter(e => !idsToRemove.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !idsToRemove.has(e.id)),
            count: t.emails.filter(e => !idsToRemove.has(e.id)).length
          })).filter(t => t.emails.length > 0);

          // Update latestEmail for remaining threads
          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[0]
          }));
        });

        toast.success(`Blocked ${emailAddr} - archived & deleted ${deletedCount} emails`);
      } else {
        // Check if domain already in spam list
        const { data: existingDomainArr } = await supabase
          .from('domains_spam')
          .select('counter')
          .eq('domain', domain);

        const existing = existingDomainArr?.[0];
        if (existing) {
          // Increment counter
          const { error: spamError } = await supabase
            .from('domains_spam')
            .update({
              counter: existing.counter + 1,
              last_modified_at: new Date().toISOString()
            })
            .eq('domain', domain);

          if (spamError) {
            console.error('Domain spam update error:', spamError);
            throw spamError;
          }
        } else {
          // Insert new
          const { error: spamError } = await supabase.from('domains_spam').insert({
            domain: domain,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          });

          if (spamError) {
            console.error('Domain spam insert error:', spamError);
            throw spamError;
          }
        }

        // Get all emails from this domain (need fastmail_id for archiving)
        const { data: emailsToDelete, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', `%@${domain}`);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        // Archive each email in Fastmail
        for (const email of emailsToDelete || []) {
          if (email.fastmail_id) {
            await archiveInFastmail(email.fastmail_id);
          }
        }

        // Delete ALL emails from this domain in Supabase
        const { data: deleted, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', `%@${domain}`)
          .select('id');

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        deletedCount = deleted?.length || 0;
        console.log('Deleted emails:', deleted);

        // Update local state - remove all emails from this domain
        const idsToRemove = new Set(deleted?.map(e => e.id) || []);
        setEmails(prev => prev.filter(e => !idsToRemove.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !idsToRemove.has(e.id)),
            count: t.emails.filter(e => !idsToRemove.has(e.id)).length
          })).filter(t => t.emails.length > 0);

          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[0]
          }));
        });

        toast.success(`Blocked @${domain} - archived & deleted ${deletedCount} emails`);
      }

      // Clear selection if current thread was deleted
      setSelectedThread(prev => {
        if (!prev) return null;
        const remaining = prev.filter(e =>
          type === 'email'
            ? e.from_email?.toLowerCase() !== emailAddr
            : !e.from_email?.toLowerCase().endsWith(`@${domain}`)
        );
        return remaining.length > 0 ? remaining : null;
      });

      setSpamMenuOpen(false);
    } catch (error) {
      console.error('Spam error:', error);
      toast.error('Failed to mark as spam');
    }
  };

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

  // Delete single email (without blocking)
  const deleteEmail = async () => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    try {
      const { error } = await supabase
        .from('command_center_inbox')
        .delete()
        .eq('id', latestEmail.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete email: ' + error.message);
        return;
      }

      // Update local state
      if (selectedThread.length === 1) {
        setThreads(prev => prev.filter(t => t.threadId !== (latestEmail.thread_id || latestEmail.id)));
        setSelectedThread(null);
      } else {
        const newThread = selectedThread.filter(e => e.id !== latestEmail.id);
        setSelectedThread(newThread);
        setThreads(prev => prev.map(t =>
          t.threadId === (latestEmail.thread_id || latestEmail.id)
            ? { ...t, emails: newThread, latestEmail: newThread[0], count: newThread.length }
            : t
        ));
      }

      setEmails(prev => prev.filter(e => e.id !== latestEmail.id));
      toast.success('Email deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete email');
    }
  };

  // Check for unread emails
  const hasUnreadEmails = emails.some(email => email.is_read === false);
  const hasUnreadWhatsapp = whatsappMessages.some(msg => msg.is_read === false);

  const hasUnreadCalendar = calendarEvents.some(event => event.is_read === false);
  const tabs = [
    { id: 'email', label: 'Email', icon: FaEnvelope, count: filterByStatus(threads, 'inbox').length + filterByStatus(threads, 'need_actions').length, hasUnread: hasUnreadEmails },
    { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, count: filterByStatus(whatsappChats, 'inbox').length + filterByStatus(whatsappChats, 'need_actions').length, hasUnread: hasUnreadWhatsapp },
    { id: 'calendar', label: 'Calendar', icon: FaCalendar, count: filterCalendarEvents(calendarEvents, 'needReview').length, hasUnread: hasUnreadCalendar },
    { id: 'deals', label: 'Deals', icon: FaDollarSign, count: filterDealsByStatus(pipelineDeals, 'open').length, hasUnread: false },
    { id: 'keepintouch', label: 'Keep in Touch', icon: FaUserCheck, count: filterKeepInTouchByStatus(keepInTouchContacts, 'due').length, hasUnread: filterKeepInTouchByStatus(keepInTouchContacts, 'due').length > 0 },
  ];

  return (
    <PageContainer theme={theme}>
      {/* Header with Tabs */}
      <Header theme={theme}>
        <HeaderTitle theme={theme}>Command Center</HeaderTitle>
        <TabsContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              theme={theme}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              {tab.label}
              {tab.count > 0 && (
                <Badge theme={theme} $active={activeTab === tab.id}>
                  {tab.count}
                </Badge>
              )}
              {tab.hasUnread && <UnreadDot $active={activeTab === tab.id} />}
            </Tab>
          ))}
        </TabsContainer>
      </Header>

      {/* Main 3-panel layout */}
      <MainContent>
        {/* Left: Email List */}
        <EmailListPanel theme={theme} $collapsed={listCollapsed}>
          <ListHeader theme={theme}>
            {!listCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Messages</span>
                {activeTab === 'whatsapp' && (
                  <div
                    onClick={() => baileysStatus.status !== 'connected' && setShowBaileysQRModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: baileysStatus.status !== 'connected' ? 'pointer' : 'default',
                      background: baileysStatus.status === 'connected'
                        ? (theme === 'light' ? '#D1FAE5' : '#065F46')
                        : baileysStatus.status === 'qr_ready'
                        ? (theme === 'light' ? '#FEF3C7' : '#78350F')
                        : (theme === 'light' ? '#FEE2E2' : '#7F1D1D'),
                      color: baileysStatus.status === 'connected'
                        ? (theme === 'light' ? '#059669' : '#6EE7B7')
                        : baileysStatus.status === 'qr_ready'
                        ? (theme === 'light' ? '#D97706' : '#FCD34D')
                        : (theme === 'light' ? '#DC2626' : '#FCA5A5'),
                    }}
                    title={baileysStatus.status === 'connected' ? 'Baileys connected' : 'Click to reconnect Baileys'}
                  >
                    <FaBolt size={10} />
                    {baileysStatus.status === 'connected' ? 'On' : baileysStatus.status === 'qr_ready' ? 'QR' : 'Off'}
                  </div>
                )}
              </div>
            )}
            <CollapseButton theme={theme} onClick={() => setListCollapsed(!listCollapsed)}>
              {listCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </CollapseButton>
          </ListHeader>

          {!listCollapsed && (activeTab === 'email' || activeTab === 'whatsapp') && (
            <EmailList style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {threadsLoading || whatsappLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : (
                <>
                  {/* Inbox Section (null status) */}
                  <div
                    onClick={() => toggleStatusSection('inbox')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: statusSections.inbox ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Inbox</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {activeTab === 'email' ? filterByStatus(threads, 'inbox').length : filterByStatus(whatsappChats, 'inbox').length}
                    </span>
                  </div>
                  {statusSections.inbox && (
                    activeTab === 'email' ? (
                      filterByStatus(threads, 'inbox').map(thread => (
                        <EmailItem
                          key={thread.threadId}
                          theme={theme}
                          $selected={selectedThread?.[0]?.thread_id === thread.threadId || selectedThread?.[0]?.id === thread.threadId}
                          onClick={() => handleSelectThread(thread.emails)}
                        >
                          <EmailSender theme={theme}>
                            {thread.emails.some(e => e.is_read === false) && <EmailUnreadDot />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getRelevantPerson(thread.latestEmail)}
                            </span>
                            {thread.count > 1 && <span style={{ opacity: 0.6, flexShrink: 0 }}>({thread.count})</span>}
                          </EmailSender>
                          <EmailSubject theme={theme}>{thread.latestEmail.subject}</EmailSubject>
                          <EmailSnippet theme={theme}>{thread.latestEmail.snippet}</EmailSnippet>
                        </EmailItem>
                      ))
                    ) : (
                      <WhatsAppChatList
                        theme={theme}
                        chats={filterByStatus(whatsappChats, 'inbox')}
                        selectedChat={selectedWhatsappChat}
                        onSelectChat={setSelectedWhatsappChat}
                        loading={false}
                        contacts={emailContacts}
                      />
                    )
                  )}

                  {/* Need Actions Section */}
                  <div
                    onClick={() => toggleStatusSection('need_actions')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: statusSections.need_actions ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Need Actions</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {activeTab === 'email' ? filterByStatus(threads, 'need_actions').length : filterByStatus(whatsappChats, 'need_actions').length}
                    </span>
                  </div>
                  {statusSections.need_actions && (
                    activeTab === 'email' ? (
                      filterByStatus(threads, 'need_actions').map(thread => (
                        <EmailItem
                          key={thread.threadId}
                          theme={theme}
                          $selected={selectedThread?.[0]?.thread_id === thread.threadId || selectedThread?.[0]?.id === thread.threadId}
                          onClick={() => handleSelectThread(thread.emails)}
                        >
                          <EmailSender theme={theme}>
                            {thread.emails.some(e => e.is_read === false) && <EmailUnreadDot />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getRelevantPerson(thread.latestEmail)}
                            </span>
                            {thread.count > 1 && <span style={{ opacity: 0.6, flexShrink: 0 }}>({thread.count})</span>}
                          </EmailSender>
                          <EmailSubject theme={theme}>{thread.latestEmail.subject}</EmailSubject>
                          <EmailSnippet theme={theme}>{thread.latestEmail.snippet}</EmailSnippet>
                        </EmailItem>
                      ))
                    ) : (
                      <WhatsAppChatList
                        theme={theme}
                        chats={filterByStatus(whatsappChats, 'need_actions')}
                        selectedChat={selectedWhatsappChat}
                        onSelectChat={setSelectedWhatsappChat}
                        loading={false}
                        contacts={emailContacts}
                      />
                    )
                  )}

                  {/* Waiting Input Section */}
                  <div
                    onClick={() => toggleStatusSection('waiting_input')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: statusSections.waiting_input ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Waiting Input</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {activeTab === 'email' ? filterByStatus(threads, 'waiting_input').length : filterByStatus(whatsappChats, 'waiting_input').length}
                    </span>
                  </div>
                  {statusSections.waiting_input && (
                    activeTab === 'email' ? (
                      filterByStatus(threads, 'waiting_input').map(thread => (
                        <EmailItem
                          key={thread.threadId}
                          theme={theme}
                          $selected={selectedThread?.[0]?.thread_id === thread.threadId || selectedThread?.[0]?.id === thread.threadId}
                          onClick={() => handleSelectThread(thread.emails)}
                        >
                          <EmailSender theme={theme}>
                            {thread.emails.some(e => e.is_read === false) && <EmailUnreadDot />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getRelevantPerson(thread.latestEmail)}
                            </span>
                            {thread.count > 1 && <span style={{ opacity: 0.6, flexShrink: 0 }}>({thread.count})</span>}
                          </EmailSender>
                          <EmailSubject theme={theme}>{thread.latestEmail.subject}</EmailSubject>
                          <EmailSnippet theme={theme}>{thread.latestEmail.snippet}</EmailSnippet>
                        </EmailItem>
                      ))
                    ) : (
                      <WhatsAppChatList
                        theme={theme}
                        chats={filterByStatus(whatsappChats, 'waiting_input')}
                        selectedChat={selectedWhatsappChat}
                        onSelectChat={setSelectedWhatsappChat}
                        loading={false}
                        contacts={emailContacts}
                      />
                    )
                  )}
                </>
              )}
            </EmailList>
          )}

          {!listCollapsed && activeTab === 'email' && threads.length > 0 && (
            <PendingCount theme={theme}>
              {threads.length} threads ({emails.length} emails)
            </PendingCount>
          )}

          {!listCollapsed && activeTab === 'whatsapp' && whatsappChats.length > 0 && (
            <PendingCount theme={theme}>
              {whatsappChats.length} chats ({whatsappMessages.length} messages)
            </PendingCount>
          )}

          {/* Calendar Events List */}
          {!listCollapsed && activeTab === 'calendar' && (
            <EmailList>
              {/* Toggle: To Process / Processed */}
              <div style={{
                display: 'flex',
                padding: '8px 12px',
                gap: '4px',
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                backgroundColor: theme === 'dark' ? '#111827' : '#fff'
              }}>
                <button
                  onClick={() => setCalendarViewMode('toProcess')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: calendarViewMode === 'toProcess'
                      ? (theme === 'dark' ? '#3B82F6' : '#3B82F6')
                      : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                    color: calendarViewMode === 'toProcess' ? '#fff' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')
                  }}
                >
                  To Process
                </button>
                <button
                  onClick={() => setCalendarViewMode('processed')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: calendarViewMode === 'processed'
                      ? (theme === 'dark' ? '#10B981' : '#10B981')
                      : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                    color: calendarViewMode === 'processed' ? '#fff' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')
                  }}
                >
                  Processed
                </button>
              </div>
              {calendarLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : calendarViewMode === 'toProcess' && calendarEvents.length === 0 ? (
                <EmptyState theme={theme}>
                  <img src="/inbox-zero.png" alt="Inbox Zero" style={{ width: '150px', marginBottom: '16px' }} />
                  <span style={{ color: '#10B981', fontWeight: 600 }}>Inbox Zero!</span>
                </EmptyState>
              ) : calendarViewMode === 'processed' && processedMeetings.length === 0 ? (
                <EmptyState theme={theme}>
                  <FaCalendar size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <span>Nessun meeting processato</span>
                </EmptyState>
              ) : calendarViewMode === 'processed' ? (
                <>
                  {/* Processed Meetings List */}
                  {processedMeetings.map(meeting => {
                    const meetingDate = new Date(meeting.meeting_date);
                    const dayName = meetingDate.toLocaleDateString('en-GB', { weekday: 'short' });
                    const dateStr = `${dayName} ${String(meetingDate.getDate()).padStart(2, '0')}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${meetingDate.getFullYear()}`;
                    const linkedContacts = meeting.meeting_contacts?.map(mc => mc.contacts).filter(Boolean) || [];

                    return (
                      <EmailItem
                        key={meeting.meeting_id}
                        theme={theme}
                        $selected={selectedCalendarEvent?.meeting_id === meeting.meeting_id}
                        onClick={() => {
                          setSelectedCalendarEvent({ ...meeting, source: 'meetings' });
                          setCalendarEventScore(meeting.score ? parseInt(meeting.score) : null);
                          setCalendarEventNotes(meeting.notes || '');
                        }}
                      >
                        <EmailSender theme={theme}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meeting.meeting_name}
                          </span>
                          {meeting.score && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: '#F59E0B'
                            }}>
                              {'★'.repeat(parseInt(meeting.score) || 0)}
                            </span>
                          )}
                        </EmailSender>
                        <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                          {dateStr}
                        </EmailSubject>
                        <EmailSnippet theme={theme}>
                          {linkedContacts.length > 0
                            ? linkedContacts.map(c => c.full_name || `${c.first_name} ${c.last_name}`).join(', ')
                            : 'No contacts linked'}
                        </EmailSnippet>
                      </EmailItem>
                    );
                  })}
                </>
              ) : (
                <>
                  {/* Need Review Section (Past Events) */}
                  <div
                    onClick={() => toggleCalendarSection('needReview')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: calendarSections.needReview ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Need Review</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterCalendarEvents(calendarEvents, 'needReview').length}
                    </span>
                  </div>
                  {calendarSections.needReview && (
                    filterCalendarEvents(calendarEvents, 'needReview').map(event => {
                      let cleanSubject = (event.subject || 'No title')
                        .replace(/^\[(CONFIRMED|TENTATIVE|CANCELLED|CANCELED)\]\s*/i, '');
                      // Extract person name from "Quick call - S. Cimminelli (Person Name)" format
                      const quickCallMatch = cleanSubject.match(/^Quick call - S\. Cimminelli \(([^)]+)\)$/i);
                      if (quickCallMatch) {
                        cleanSubject = quickCallMatch[1];
                      } else {
                        cleanSubject = cleanSubject
                          .replace(/Simone Cimminelli/gi, '')
                          .replace(/<>/g, '')
                          .replace(/\s+/g, ' ')
                          .trim() || 'Meeting';
                      }

                      const location = (event.event_location || '').toLowerCase();
                      const isRemote = location.includes('zoom') || location.includes('meet') ||
                        location.includes('teams') || location.includes('webex') ||
                        location.includes('http') || location.includes('skype');

                      const eventDate = new Date(event.date);
                      const dayName = eventDate.toLocaleDateString('en-GB', { weekday: 'short' });
                      const dateStr = `${dayName} ${String(eventDate.getDate()).padStart(2, '0')}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${eventDate.getFullYear()}`;

                      return (
                        <EmailItem
                          key={event.id}
                          theme={theme}
                          $selected={selectedCalendarEvent?.id === event.id}
                          $unread={!event.is_read}
                          onClick={() => setSelectedCalendarEvent(event)}
                        >
                          <EmailSender theme={theme}>
                            {!event.is_read && <EmailUnreadDot />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cleanSubject}
                            </span>
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              flexShrink: 0,
                              backgroundColor: isRemote ? '#3B82F6' : '#10B981',
                              color: 'white'
                            }}>
                              {isRemote ? 'Remote' : 'In Person'}
                            </span>
                          </EmailSender>
                          <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                            {dateStr}
                          </EmailSubject>
                          <EmailSnippet theme={theme}>
                            {event.event_location || 'No location'}
                          </EmailSnippet>
                        </EmailItem>
                      );
                    })
                  )}

                  {/* This Week Events Section */}
                  <div
                    onClick={() => toggleCalendarSection('thisWeek')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: calendarSections.thisWeek ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>This Week</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterCalendarEvents(calendarEvents, 'thisWeek').length}
                    </span>
                  </div>
                  {calendarSections.thisWeek && (
                    filterCalendarEvents(calendarEvents, 'thisWeek').map(event => {
                      let cleanSubject = (event.subject || 'No title')
                        .replace(/^\[(CONFIRMED|TENTATIVE|CANCELLED|CANCELED)\]\s*/i, '');
                      // Extract person name from "Quick call - S. Cimminelli (Person Name)" format
                      const quickCallMatch = cleanSubject.match(/^Quick call - S\. Cimminelli \(([^)]+)\)$/i);
                      if (quickCallMatch) {
                        cleanSubject = quickCallMatch[1];
                      } else {
                        cleanSubject = cleanSubject
                          .replace(/Simone Cimminelli/gi, '')
                          .replace(/<>/g, '')
                          .replace(/\s+/g, ' ')
                          .trim() || 'Meeting';
                      }

                      const location = (event.event_location || '').toLowerCase();
                      const isRemote = location.includes('zoom') || location.includes('meet') ||
                        location.includes('teams') || location.includes('webex') ||
                        location.includes('http') || location.includes('skype');

                      const eventDate = new Date(event.date);
                      const dayName = eventDate.toLocaleDateString('en-GB', { weekday: 'short' });
                      const dateStr = `${dayName} ${String(eventDate.getDate()).padStart(2, '0')}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${eventDate.getFullYear()}`;

                      return (
                        <EmailItem
                          key={event.id}
                          theme={theme}
                          $selected={selectedCalendarEvent?.id === event.id}
                          $unread={!event.is_read}
                          onClick={() => setSelectedCalendarEvent(event)}
                        >
                          <EmailSender theme={theme}>
                            {!event.is_read && <EmailUnreadDot />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cleanSubject}
                            </span>
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              flexShrink: 0,
                              backgroundColor: isRemote ? '#3B82F6' : '#10B981',
                              color: 'white'
                            }}>
                              {isRemote ? 'Remote' : 'In Person'}
                            </span>
                          </EmailSender>
                          <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                            {dateStr}
                          </EmailSubject>
                          <EmailSnippet theme={theme}>
                            {event.event_location || 'No location'}
                          </EmailSnippet>
                        </EmailItem>
                      );
                    })
                  )}

                  {/* Upcoming Events Section */}
                  <div
                    onClick={() => toggleCalendarSection('upcoming')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: calendarSections.upcoming ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Upcoming</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterCalendarEvents(calendarEvents, 'upcoming').length}
                    </span>
                  </div>
                  {calendarSections.upcoming && (
                    filterCalendarEvents(calendarEvents, 'upcoming').map(event => {
                      let cleanSubject = (event.subject || 'No title')
                        .replace(/^\[(CONFIRMED|TENTATIVE|CANCELLED|CANCELED)\]\s*/i, '');
                      // Extract person name from "Quick call - S. Cimminelli (Person Name)" format
                      const quickCallMatch = cleanSubject.match(/^Quick call - S\. Cimminelli \(([^)]+)\)$/i);
                      if (quickCallMatch) {
                        cleanSubject = quickCallMatch[1];
                      } else {
                        cleanSubject = cleanSubject
                          .replace(/Simone Cimminelli/gi, '')
                          .replace(/<>/g, '')
                          .replace(/\s+/g, ' ')
                          .trim() || 'Meeting';
                      }

                      const location = (event.event_location || '').toLowerCase();
                      const isRemote = location.includes('zoom') || location.includes('meet') ||
                        location.includes('teams') || location.includes('webex') ||
                        location.includes('http') || location.includes('skype');

                      const eventDate = new Date(event.date);
                      const dayName = eventDate.toLocaleDateString('en-GB', { weekday: 'short' });
                      const dateStr = `${dayName} ${String(eventDate.getDate()).padStart(2, '0')}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${eventDate.getFullYear()}`;

                      return (
                        <EmailItem
                          key={event.id}
                          theme={theme}
                          $selected={selectedCalendarEvent?.id === event.id}
                          $unread={!event.is_read}
                          onClick={() => setSelectedCalendarEvent(event)}
                        >
                          <EmailSender theme={theme}>
                            {!event.is_read && <EmailUnreadDot />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cleanSubject}
                            </span>
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              flexShrink: 0,
                              backgroundColor: isRemote ? '#3B82F6' : '#10B981',
                              color: 'white'
                            }}>
                              {isRemote ? 'Remote' : 'In Person'}
                            </span>
                          </EmailSender>
                          <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                            {dateStr}
                          </EmailSubject>
                          <EmailSnippet theme={theme}>
                            {event.event_location || 'No location'}
                          </EmailSnippet>
                        </EmailItem>
                      );
                    })
                  )}
                </>
              )}
            </EmailList>
          )}

          {!listCollapsed && activeTab === 'calendar' && (
            <PendingCount theme={theme}>
              {calendarViewMode === 'toProcess'
                ? `${filterCalendarEvents(calendarEvents, 'needReview').length} need review, ${filterCalendarEvents(calendarEvents, 'thisWeek').length} this week, ${filterCalendarEvents(calendarEvents, 'upcoming').length} upcoming`
                : `${processedMeetings.length} meetings processed`
              }
            </PendingCount>
          )}

          {/* Deals List */}
          {!listCollapsed && activeTab === 'deals' && (
            <EmailList>
              {dealsLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : pipelineDeals.length === 0 ? (
                <EmptyState theme={theme}>
                  <FaDollarSign size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <span>No deals found</span>
                </EmptyState>
              ) : (
                <>
                  {/* Open Deals Section */}
                  <div
                    onClick={() => toggleDealsSection('open')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: dealsSections.open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Open</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterDealsByStatus(pipelineDeals, 'open').length}
                    </span>
                  </div>
                  {dealsSections.open && filterDealsByStatus(pipelineDeals, 'open').map(deal => (
                    <EmailItem
                      key={deal.deal_id}
                      theme={theme}
                      $selected={selectedPipelineDeal?.deal_id === deal.deal_id}
                      onClick={() => setSelectedPipelineDeal(deal)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {deal.deal_name || deal.opportunity}
                        </span>
                        {deal.category && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            flexShrink: 0,
                            backgroundColor: getDealCategoryColor(deal.category),
                            color: 'white'
                          }}>
                            {deal.category}
                          </span>
                        )}
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                        {deal.stage} {deal.total_investment ? `• ${deal.deal_currency || ''} ${Number(deal.total_investment).toLocaleString()}` : ''}
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {new Date(deal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </EmailSnippet>
                    </EmailItem>
                  ))}

                  {/* Monitoring Section */}
                  <div
                    onClick={() => toggleDealsSection('monitoring')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: dealsSections.monitoring ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Monitoring</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterDealsByStatus(pipelineDeals, 'monitoring').length}
                    </span>
                  </div>
                  {dealsSections.monitoring && filterDealsByStatus(pipelineDeals, 'monitoring').map(deal => (
                    <EmailItem
                      key={deal.deal_id}
                      theme={theme}
                      $selected={selectedPipelineDeal?.deal_id === deal.deal_id}
                      onClick={() => setSelectedPipelineDeal(deal)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {deal.deal_name || deal.opportunity}
                        </span>
                        {deal.category && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            flexShrink: 0,
                            backgroundColor: '#F59E0B',
                            color: 'white'
                          }}>
                            {deal.category}
                          </span>
                        )}
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                        {deal.stage} {deal.total_investment ? `• ${deal.deal_currency || ''} ${Number(deal.total_investment).toLocaleString()}` : ''}
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {new Date(deal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </EmailSnippet>
                    </EmailItem>
                  ))}

                  {/* Invested Section */}
                  <div
                    onClick={() => toggleDealsSection('invested')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: dealsSections.invested ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Invested</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterDealsByStatus(pipelineDeals, 'invested').length}
                    </span>
                  </div>
                  {dealsSections.invested && filterDealsByStatus(pipelineDeals, 'invested').map(deal => (
                    <EmailItem
                      key={deal.deal_id}
                      theme={theme}
                      $selected={selectedPipelineDeal?.deal_id === deal.deal_id}
                      onClick={() => setSelectedPipelineDeal(deal)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {deal.deal_name || deal.opportunity}
                        </span>
                        {deal.category && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            flexShrink: 0,
                            backgroundColor: '#10B981',
                            color: 'white'
                          }}>
                            {deal.category}
                          </span>
                        )}
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                        {deal.stage} {deal.total_investment ? `• ${deal.deal_currency || ''} ${Number(deal.total_investment).toLocaleString()}` : ''}
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {new Date(deal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </EmailSnippet>
                    </EmailItem>
                  ))}

                  {/* Closed Section */}
                  <div
                    onClick={() => toggleDealsSection('closed')}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: dealsSections.closed ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Closed</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterDealsByStatus(pipelineDeals, 'closed').length}
                    </span>
                  </div>
                  {dealsSections.closed && filterDealsByStatus(pipelineDeals, 'closed').map(deal => (
                    <EmailItem
                      key={deal.deal_id}
                      theme={theme}
                      $selected={selectedPipelineDeal?.deal_id === deal.deal_id}
                      onClick={() => setSelectedPipelineDeal(deal)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {deal.deal_name || deal.opportunity}
                        </span>
                        {deal.category && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            flexShrink: 0,
                            backgroundColor: '#6B7280',
                            color: 'white'
                          }}>
                            {deal.category}
                          </span>
                        )}
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                        {deal.stage} {deal.total_investment ? `• ${deal.deal_currency || ''} ${Number(deal.total_investment).toLocaleString()}` : ''}
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {new Date(deal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </EmailSnippet>
                    </EmailItem>
                  ))}
                </>
              )}
            </EmailList>
          )}

          {!listCollapsed && activeTab === 'deals' && pipelineDeals.length > 0 && (
            <PendingCount theme={theme}>
              {filterDealsByStatus(pipelineDeals, 'open').length} open, {filterDealsByStatus(pipelineDeals, 'invested').length} invested
            </PendingCount>
          )}

          {/* Keep in Touch List */}
          {!listCollapsed && activeTab === 'keepintouch' && (
            <EmailList>
              {keepInTouchLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : keepInTouchContacts.length === 0 ? (
                <EmptyState theme={theme}>
                  <FaUserCheck size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <span>No contacts to keep in touch with</span>
                </EmptyState>
              ) : (
                <>
                  {/* Due Section */}
                  <div
                    onClick={() => setKeepInTouchSections(prev => ({ ...prev, due: !prev.due }))}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      color: theme === 'dark' ? '#fca5a5' : '#b91c1c'
                    }}
                  >
                    <FaChevronDown style={{ transform: keepInTouchSections.due ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Due</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.8, fontSize: '12px' }}>
                      {filterKeepInTouchByStatus(keepInTouchContacts, 'due').length}
                    </span>
                  </div>
                  {keepInTouchSections.due && filterKeepInTouchByStatus(keepInTouchContacts, 'due').map(contact => (
                    <EmailItem
                      key={contact.contact_id}
                      theme={theme}
                      $selected={selectedKeepInTouchContact?.contact_id === contact.contact_id}
                      onClick={() => setSelectedKeepInTouchContact(contact)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.full_name}
                        </span>
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600, color: '#ef4444' }}>
                        {Math.abs(parseInt(contact.days_until_next))} days overdue
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {contact.frequency} • Last: {contact.last_interaction_at ? new Date(contact.last_interaction_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Never'}
                      </EmailSnippet>
                    </EmailItem>
                  ))}

                  {/* Due Soon Section */}
                  <div
                    onClick={() => setKeepInTouchSections(prev => ({ ...prev, dueSoon: !prev.dueSoon }))}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#78350f' : '#fffbeb',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      color: theme === 'dark' ? '#fcd34d' : '#b45309'
                    }}
                  >
                    <FaChevronDown style={{ transform: keepInTouchSections.dueSoon ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Due Soon</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.8, fontSize: '12px' }}>
                      {filterKeepInTouchByStatus(keepInTouchContacts, 'dueSoon').length}
                    </span>
                  </div>
                  {keepInTouchSections.dueSoon && filterKeepInTouchByStatus(keepInTouchContacts, 'dueSoon').map(contact => (
                    <EmailItem
                      key={contact.contact_id}
                      theme={theme}
                      $selected={selectedKeepInTouchContact?.contact_id === contact.contact_id}
                      onClick={() => setSelectedKeepInTouchContact(contact)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.full_name}
                        </span>
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600, color: '#f59e0b' }}>
                        {contact.days_until_next} days left
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {contact.frequency} • Last: {contact.last_interaction_at ? new Date(contact.last_interaction_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Never'}
                      </EmailSnippet>
                    </EmailItem>
                  ))}

                  {/* Not Due Section */}
                  <div
                    onClick={() => setKeepInTouchSections(prev => ({ ...prev, notDue: !prev.notDue }))}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <FaChevronDown style={{ transform: keepInTouchSections.notDue ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Not Due</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterKeepInTouchByStatus(keepInTouchContacts, 'notDue').length}
                    </span>
                  </div>
                  {keepInTouchSections.notDue && filterKeepInTouchByStatus(keepInTouchContacts, 'notDue').map(contact => (
                    <EmailItem
                      key={contact.contact_id}
                      theme={theme}
                      $selected={selectedKeepInTouchContact?.contact_id === contact.contact_id}
                      onClick={() => setSelectedKeepInTouchContact(contact)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.full_name}
                        </span>
                      </EmailSender>
                      <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                        {contact.days_until_next} days left
                      </EmailSubject>
                      <EmailSnippet theme={theme}>
                        {contact.frequency} • Last: {contact.last_interaction_at ? new Date(contact.last_interaction_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Never'}
                      </EmailSnippet>
                    </EmailItem>
                  ))}
                </>
              )}
            </EmailList>
          )}

          {!listCollapsed && activeTab === 'keepintouch' && keepInTouchContacts.length > 0 && (
            <PendingCount theme={theme}>
              {filterKeepInTouchByStatus(keepInTouchContacts, 'due').length} due, {filterKeepInTouchByStatus(keepInTouchContacts, 'dueSoon').length} due soon
            </PendingCount>
          )}
        </EmailListPanel>

        {/* Center: Content Panel - Email or WhatsApp */}
        <EmailContentPanel theme={theme}>
          {activeTab === 'whatsapp' ? (
            <WhatsAppTab
              theme={theme}
              selectedChat={selectedWhatsappChat}
              onDone={handleWhatsAppDone}
              onStatusChange={updateItemStatus}
              saving={saving}
              contacts={emailContacts}
            />
          ) : activeTab === 'calendar' ? (
            selectedCalendarEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Calendar Event Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 24px',
                  height: '56px',
                  minHeight: '56px',
                  borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                }}>
                  {editingCalendarTitle ? (
                    <input
                      type="text"
                      value={calendarTitleInput}
                      onChange={(e) => setCalendarTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateCalendarTitle(calendarTitleInput);
                        } else if (e.key === 'Escape') {
                          setEditingCalendarTitle(false);
                        }
                      }}
                      onBlur={() => handleUpdateCalendarTitle(calendarTitleInput)}
                      autoFocus
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${theme === 'light' ? '#3B82F6' : '#60A5FA'}`,
                        outline: 'none',
                        padding: '4px 0',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  ) : (
                    <EmailSubjectFull
                      theme={theme}
                      style={{ margin: 0, cursor: 'pointer' }}
                      onClick={() => {
                        const title = selectedCalendarEvent?.source === 'meetings'
                          ? (selectedCalendarEvent.meeting_name || 'Meeting')
                          : (selectedCalendarEvent.subject || 'Meeting');
                        setCalendarTitleInput(title);
                        setEditingCalendarTitle(true);
                      }}
                      title="Click to edit title"
                    >
                      {selectedCalendarEvent?.source === 'meetings'
                        ? (selectedCalendarEvent.meeting_name || 'Meeting')
                        : ((selectedCalendarEvent.subject || 'Meeting')
                            .replace(/^\[(CONFIRMED|TENTATIVE|CANCELLED|CANCELED)\]\s*/i, '')
                            .replace(/Simone Cimminelli/gi, '')
                            .replace(/<>/g, '')
                            .replace(/\s+/g, ' ')
                            .trim() || 'Meeting')}
                    </EmailSubjectFull>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedCalendarEvent?.source !== 'meetings' && (
                      <button
                        onClick={() => handleDeleteCalendarEvent(selectedCalendarEvent.id)}
                        title="Dismiss event (won't sync again)"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme === 'light' ? '#EF4444' : '#DC2626',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '14px',
                        }}
                      >
                        <FaTrash size={14} />
                        Dismiss
                      </button>
                    )}
                    {selectedCalendarEvent?.source !== 'meetings' && (
                      <button
                        onClick={handleProcessCalendarEvent}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme === 'light' ? '#10B981' : '#059669',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '14px',
                        }}
                      >
                        <FaArchive size={14} />
                        Done
                      </button>
                    )}
                    {selectedCalendarEvent?.source === 'meetings' && (
                      <button
                        onClick={() => handleDeleteProcessedMeeting(selectedCalendarEvent.meeting_id)}
                        title="Delete this meeting"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme === 'light' ? '#EF4444' : '#DC2626',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '14px',
                        }}
                      >
                        <FaTrash size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Calendar Event Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {/* Date & Time */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F0FDF4' : '#064E3B',
                    borderRadius: '12px'
                  }}>
                    <FaCalendar size={24} style={{ color: '#10B981' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '18px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                        {new Date(selectedCalendarEvent.date || selectedCalendarEvent.meeting_date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '4px' }}>
                        {new Date(selectedCalendarEvent.date || selectedCalendarEvent.meeting_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {selectedCalendarEvent.event_end && ` - ${new Date(selectedCalendarEvent.event_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedCalendarEvent.event_location && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '20px',
                      padding: '16px',
                      background: theme === 'light' ? '#F3F4F6' : '#374151',
                      borderRadius: '12px'
                    }}>
                      <FaBuilding size={20} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }} />
                      <div style={{ color: theme === 'light' ? '#374151' : '#D1D5DB', wordBreak: 'break-word' }}>
                        {selectedCalendarEvent.event_location.startsWith('http') ? (
                          <a href={selectedCalendarEvent.event_location} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>
                            {selectedCalendarEvent.event_location}
                          </a>
                        ) : (
                          selectedCalendarEvent.event_location
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attendees - Editable */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FaUser size={14} style={{ marginRight: '8px' }} />
                        Attendees {(() => {
                          const count = selectedCalendarEvent.meeting_id
                            ? (selectedCalendarEvent.meeting_contacts?.length || 0)
                            : ([...emailContacts.filter(c => c.contact?.contact_id), ...selectedContactsForMeeting.filter(c => !emailContacts.some(ec => ec.contact?.contact_id === (c.contact?.contact_id || c.contact_id)))].length);
                          return count > 0 ? `(${count})` : '';
                        })()}
                      </div>
                      <button
                        onClick={() => setAddMeetingContactModalOpen(true)}
                        style={{
                          background: theme === 'light' ? '#E5E7EB' : '#4B5563',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          fontSize: '12px'
                        }}
                      >
                        <FaPlus size={10} /> Add
                      </button>
                    </div>

                    {/* Add Meeting Contact Modal */}
                    {addMeetingContactModalOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '50px',
                        left: '16px',
                        right: '16px',
                        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Add Contact to Meeting</span>
                          <button
                            onClick={() => {
                              setAddMeetingContactModalOpen(false);
                              setMeetingContactSearchQuery('');
                              setMeetingContactSearchResults([]);
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#6B7280' : '#9CA3AF', padding: '4px' }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={meetingContactSearchQuery}
                          onChange={(e) => handleSearchMeetingContacts(e.target.value)}
                          placeholder="Search contacts by name or email..."
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: theme === 'light' ? '#F9FAFB' : '#111827',
                            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                            borderRadius: '6px',
                            color: theme === 'light' ? '#111827' : '#F9FAFB',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        {meetingContactSearchLoading && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            Searching...
                          </div>
                        )}
                        {!meetingContactSearchLoading && meetingContactSearchResults.length > 0 && (
                          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {meetingContactSearchResults.map((contact) => (
                              <div
                                key={contact.contact_id}
                                onClick={() => handleAddMeetingContact(contact)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                {contact.profile_image_url ? (
                                  <img src={contact.profile_image_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <FaUser size={12} style={{ color: '#9CA3AF' }} />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                    {contact.first_name} {contact.last_name}
                                  </div>
                                  {contact.email && (
                                    <div style={{ fontSize: '11px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                      {contact.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!meetingContactSearchLoading && meetingContactSearchQuery && meetingContactSearchResults.length === 0 && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            No contacts found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact List */}
                    {(() => {
                      // For processed meetings, show meeting_contacts
                      if (selectedCalendarEvent.meeting_id) {
                        return selectedCalendarEvent.meeting_contacts && selectedCalendarEvent.meeting_contacts.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedCalendarEvent.meeting_contacts.map((mc, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 12px',
                                background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                                borderRadius: '8px'
                              }}>
                                <div
                                  onClick={() => mc.contacts && navigate(`/contact/${mc.contacts.contact_id}`)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flex: 1,
                                    cursor: mc.contacts ? 'pointer' : 'default'
                                  }}
                                >
                                  {mc.contacts?.profile_image_url ? (
                                    <img src={mc.contacts.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      <FaUser size={14} style={{ color: '#9CA3AF' }} />
                                    </div>
                                  )}
                                  <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                    {mc.contacts?.first_name} {mc.contacts?.last_name}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveMeetingContact(mc.contact_id);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => e.target.style.color = '#EF4444'}
                                  onMouseLeave={(e) => e.target.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                                  title="Remove contact from meeting"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                            No contacts linked yet
                          </div>
                        );
                      }

                      // For inbox items, show emailContacts + selectedContactsForMeeting
                      const allContacts = [
                        ...emailContacts.filter(c => c.contact?.contact_id).map(c => ({ ...c.contact, source: 'email' })),
                        ...selectedContactsForMeeting.filter(c => !emailContacts.some(ec => ec.contact?.contact_id === (c.contact?.contact_id || c.contact_id))).map(c => ({ ...(c.contact || c), source: 'manual' }))
                      ];

                      return allContacts.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {allContacts.map((contact, idx) => (
                            <div key={contact.contact_id || idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                              borderRadius: '8px'
                            }}>
                              <div
                                onClick={() => contact.contact_id && navigate(`/contact/${contact.contact_id}`)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  flex: 1,
                                  cursor: contact.contact_id ? 'pointer' : 'default'
                                }}
                              >
                                {contact.profile_image_url ? (
                                  <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <FaUser size={14} style={{ color: '#9CA3AF' }} />
                                  </div>
                                )}
                                <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                  {contact.first_name} {contact.last_name}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMeetingContact(contact.contact_id);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  borderRadius: '4px',
                                  color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#EF4444'}
                                onMouseLeave={(e) => e.target.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                                title="Remove contact"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                          No contacts linked yet
                        </div>
                      );
                    })()}
                  </div>

                  {/* Score Selector */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                      ⭐ Score
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => {
                            setCalendarEventScore(score);
                            // If processed meeting, save immediately
                            if (selectedCalendarEvent?.source === 'meetings') {
                              supabase
                                .from('meetings')
                                .update({ score: String(score) })
                                .eq('meeting_id', selectedCalendarEvent.meeting_id)
                                .then(({ error }) => {
                                  if (error) console.error('Error updating score:', error);
                                  else {
                                    setProcessedMeetings(prev => prev.map(m =>
                                      m.meeting_id === selectedCalendarEvent.meeting_id
                                        ? { ...m, score: String(score) }
                                        : m
                                    ));
                                  }
                                });
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            backgroundColor: calendarEventScore === score
                              ? '#F59E0B'
                              : (theme === 'light' ? '#E5E7EB' : '#1F2937'),
                            color: calendarEventScore === score ? '#fff' : (theme === 'light' ? '#374151' : '#9CA3AF')
                          }}
                        >
                          {'★'.repeat(score)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px',
                    minHeight: '200px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                      📝 Notes
                    </div>
                    <textarea
                      value={calendarEventNotes}
                      onChange={(e) => setCalendarEventNotes(e.target.value)}
                      onBlur={() => {
                        // If processed meeting, save on blur
                        if (selectedCalendarEvent?.source === 'meetings') {
                          supabase
                            .from('meetings')
                            .update({ notes: calendarEventNotes || null })
                            .eq('meeting_id', selectedCalendarEvent.meeting_id)
                            .then(({ error }) => {
                              if (error) console.error('Error updating notes:', error);
                              else {
                                setProcessedMeetings(prev => prev.map(m =>
                                  m.meeting_id === selectedCalendarEvent.meeting_id
                                    ? { ...m, notes: calendarEventNotes || null }
                                    : m
                                ));
                              }
                            });
                        }
                      }}
                      placeholder="Aggiungi note sul meeting..."
                      style={{
                        width: '100%',
                        flex: 1,
                        minHeight: '150px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        backgroundColor: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Description/Body - only show for inbox events (not processed meetings which use Notes) */}
                  {selectedCalendarEvent?.source !== 'meetings' && (selectedCalendarEvent.body_text || selectedCalendarEvent.description) && (
                    <div style={{
                      padding: '16px',
                      background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                      border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                      borderRadius: '12px'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                        Description
                      </div>
                      <div style={{
                        color: theme === 'light' ? '#374151' : '#D1D5DB',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6
                      }}>
                        {selectedCalendarEvent.body_text || selectedCalendarEvent.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState theme={theme}>Select an event to view details</EmptyState>
            )
          ) : activeTab === 'deals' ? (
            selectedPipelineDeal ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Deal Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 24px',
                  height: '56px',
                  minHeight: '56px',
                  borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                }}>
                  {titleEditOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginRight: '16px' }}>
                      <input
                        type="text"
                        value={titleEditValue}
                        onChange={(e) => setTitleEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateDealTitle();
                          if (e.key === 'Escape') setTitleEditOpen(false);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `2px solid #3B82F6`,
                          background: theme === 'light' ? '#FFFFFF' : '#374151',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: '16px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleUpdateDealTitle}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#10B981',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setTitleEditOpen(false)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          background: 'transparent',
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <EmailSubjectFull
                      theme={theme}
                      style={{ margin: 0, cursor: 'pointer' }}
                      onClick={() => {
                        setTitleEditValue(selectedPipelineDeal.opportunity || '');
                        setTitleEditOpen(true);
                      }}
                      title="Click to edit"
                    >
                      {selectedPipelineDeal.deal_name || selectedPipelineDeal.opportunity}
                      <FaEdit size={12} style={{ marginLeft: '8px', opacity: 0.5 }} />
                    </EmailSubjectFull>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                    <button
                      onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor:
                          ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'].includes(selectedPipelineDeal.stage) ? '#3B82F6' :
                          ['Closed Won', 'Invested'].includes(selectedPipelineDeal.stage) ? '#10B981' :
                          selectedPipelineDeal.stage === 'Monitoring' ? '#F59E0B' : '#6B7280',
                        color: 'white'
                      }}
                    >
                      {selectedPipelineDeal.stage}
                      <FaChevronDown size={10} />
                    </button>
                    {stageDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        minWidth: '150px',
                        overflow: 'hidden'
                      }}>
                        {DEAL_STAGES.map(stage => (
                          <div
                            key={stage}
                            onClick={() => handlePipelineDealStageChange(stage)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: selectedPipelineDeal.stage === stage
                                ? (theme === 'light' ? '#F3F4F6' : '#374151')
                                : 'transparent',
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'light' ? '#F3F4F6' : '#374151'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = selectedPipelineDeal.stage === stage ? (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent'}
                          >
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor:
                                stage === 'Lead' ? '#3B82F6' :
                                stage === 'Invested' ? '#10B981' :
                                stage === 'Monitoring' ? '#F59E0B' : '#6B7280'
                            }} />
                            {stage}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {/* Category & Investment */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Category Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setSourceDropdownOpen(false); setInvestmentEditOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: theme === 'light' ? '#F3F4F6' : '#374151',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <FaTag size={16} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          {selectedPipelineDeal.category || 'Set Category'}
                        </span>
                        <FaChevronDown size={10} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
                      </button>
                      {categoryDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '4px',
                          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 100,
                          minWidth: '150px',
                          overflow: 'hidden'
                        }}>
                          {DEAL_CATEGORIES.map(cat => (
                            <div
                              key={cat}
                              onClick={() => handleUpdateDealCategory(cat)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                backgroundColor: selectedPipelineDeal.category === cat ? (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                                color: theme === 'light' ? '#111827' : '#F9FAFB'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'light' ? '#F3F4F6' : '#374151'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = selectedPipelineDeal.category === cat ? (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent'}
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Investment Edit */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => {
                          setInvestmentEditOpen(!investmentEditOpen);
                          setInvestmentEditValue(selectedPipelineDeal.total_investment ? String(selectedPipelineDeal.total_investment) : '');
                          setCurrencyEditValue(selectedPipelineDeal.deal_currency || 'EUR');
                          setCategoryDropdownOpen(false);
                          setSourceDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: theme === 'light' ? '#F0FDF4' : '#064E3B',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <FaDollarSign size={16} style={{ color: '#10B981' }} />
                        <span style={{ fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          {selectedPipelineDeal.total_investment
                            ? `${selectedPipelineDeal.deal_currency || 'EUR'} ${Number(selectedPipelineDeal.total_investment).toLocaleString()}`
                            : 'Set Amount'}
                        </span>
                        <FaEdit size={10} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
                      </button>
                      {investmentEditOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '4px',
                          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 100,
                          padding: '12px',
                          minWidth: '200px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <select
                              value={currencyEditValue}
                              onChange={(e) => setCurrencyEditValue(e.target.value)}
                              style={{
                                padding: '8px',
                                borderRadius: '6px',
                                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                                background: theme === 'light' ? '#FFFFFF' : '#374151',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontSize: '13px',
                                width: '70px'
                              }}
                            >
                              {DEAL_CURRENCIES.map(cur => (
                                <option key={cur} value={cur}>{cur}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={investmentEditValue}
                              onChange={(e) => setInvestmentEditValue(e.target.value)}
                              placeholder="Amount"
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                                background: theme === 'light' ? '#FFFFFF' : '#374151',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontSize: '13px'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setInvestmentEditOpen(false)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                                background: 'transparent',
                                color: theme === 'light' ? '#374151' : '#D1D5DB',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateDealInvestment}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10B981',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Source Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => { setSourceDropdownOpen(!sourceDropdownOpen); setCategoryDropdownOpen(false); setInvestmentEditOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: theme === 'light' ? '#FEF3C7' : '#78350F',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <FaLightbulb size={16} style={{ color: '#F59E0B' }} />
                        <span style={{ fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          {selectedPipelineDeal.source_category || 'Set Source'}
                        </span>
                        <FaChevronDown size={10} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
                      </button>
                      {sourceDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '4px',
                          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 100,
                          minWidth: '150px',
                          overflow: 'hidden'
                        }}>
                          {DEAL_SOURCES.map(src => (
                            <div
                              key={src}
                              onClick={() => handleUpdateDealSource(src)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                backgroundColor: selectedPipelineDeal.source_category === src ? (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                                color: theme === 'light' ? '#111827' : '#F9FAFB'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'light' ? '#F3F4F6' : '#374151'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = selectedPipelineDeal.source_category === src ? (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent'}
                            >
                              {src}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Description</span>
                      {!descriptionEditOpen && (
                        <FaEdit
                          size={12}
                          style={{ cursor: 'pointer', opacity: 0.6 }}
                          onClick={() => {
                            setDescriptionEditValue(selectedPipelineDeal.description || '');
                            setDescriptionEditOpen(true);
                          }}
                        />
                      )}
                    </div>
                    {descriptionEditOpen ? (
                      <div>
                        <textarea
                          value={descriptionEditValue}
                          onChange={(e) => setDescriptionEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setDescriptionEditOpen(false);
                            }
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleUpdateDealDescription();
                            }
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '10px',
                            background: theme === 'light' ? '#F9FAFB' : '#111827',
                            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                            borderRadius: '6px',
                            color: theme === 'light' ? '#111827' : '#F9FAFB',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none'
                          }}
                          placeholder="Add a description..."
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setDescriptionEditOpen(false)}
                            style={{
                              padding: '6px 12px',
                              background: theme === 'light' ? '#E5E7EB' : '#374151',
                              border: 'none',
                              borderRadius: '6px',
                              color: theme === 'light' ? '#374151' : '#D1D5DB',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateDealDescription}
                            style={{
                              padding: '6px 12px',
                              background: '#10B981',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Save
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '6px' }}>
                          Press Cmd/Ctrl+Enter to save, Escape to cancel
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setDescriptionEditValue(selectedPipelineDeal.description || '');
                          setDescriptionEditOpen(true);
                        }}
                        style={{
                          color: selectedPipelineDeal.description ? (theme === 'light' ? '#374151' : '#D1D5DB') : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          cursor: 'pointer',
                          fontStyle: selectedPipelineDeal.description ? 'normal' : 'italic'
                        }}
                      >
                        {selectedPipelineDeal.description || 'Click to add a description...'}
                      </div>
                    )}
                  </div>

                  {/* Linked Contacts */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FaUser size={14} style={{ marginRight: '8px' }} />
                        Linked Contacts {selectedPipelineDeal.deals_contacts?.length > 0 && `(${selectedPipelineDeal.deals_contacts.length})`}
                      </div>
                      <button
                        onClick={() => setAddContactModalOpen(true)}
                        style={{
                          background: theme === 'light' ? '#E5E7EB' : '#4B5563',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          fontSize: '12px'
                        }}
                      >
                        <FaPlus size={10} /> Add
                      </button>
                    </div>

                    {/* Add Contact Modal */}
                    {addContactModalOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '50px',
                        left: '16px',
                        right: '16px',
                        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Add Contact to Deal</span>
                          <button
                            onClick={() => {
                              setAddContactModalOpen(false);
                              setContactSearchQuery('');
                              setContactSearchResults([]);
                              setSelectedContactRelationship('other');
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#6B7280' : '#9CA3AF', padding: '4px' }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', display: 'block', marginBottom: '4px' }}>
                            Relationship
                          </label>
                          <select
                            value={selectedContactRelationship}
                            onChange={(e) => setSelectedContactRelationship(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: theme === 'light' ? '#F9FAFB' : '#111827',
                              border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                              borderRadius: '6px',
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              fontSize: '13px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {DEAL_RELATIONSHIP_TYPES.map(rel => (
                              <option key={rel} value={rel} style={{ textTransform: 'capitalize' }}>
                                {rel.charAt(0).toUpperCase() + rel.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={contactSearchQuery}
                          onChange={(e) => handleSearchContacts(e.target.value)}
                          placeholder="Search contacts by name or email..."
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: theme === 'light' ? '#F9FAFB' : '#111827',
                            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                            borderRadius: '6px',
                            color: theme === 'light' ? '#111827' : '#F9FAFB',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        {contactSearchLoading && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            Searching...
                          </div>
                        )}
                        {!contactSearchLoading && contactSearchResults.length > 0 && (
                          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {contactSearchResults.map((contact) => (
                              <div
                                key={contact.contact_id}
                                onClick={() => handleAddDealContact(contact)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                {contact.profile_image_url ? (
                                  <img src={contact.profile_image_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <FaUser size={12} style={{ color: '#9CA3AF' }} />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                    {contact.first_name} {contact.last_name}
                                  </div>
                                  {contact.email && (
                                    <div style={{ fontSize: '11px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                      {contact.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!contactSearchLoading && contactSearchQuery && contactSearchResults.length === 0 && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            No contacts found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact List */}
                    {selectedPipelineDeal.deals_contacts && selectedPipelineDeal.deals_contacts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedPipelineDeal.deals_contacts.map((dc, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                              borderRadius: '8px'
                            }}
                          >
                            <div
                              onClick={() => dc.contacts && navigate(`/contact/${dc.contacts.contact_id}`)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flex: 1,
                                cursor: dc.contacts ? 'pointer' : 'default'
                              }}
                            >
                              {dc.contacts?.profile_image_url ? (
                                <img
                                  src={dc.contacts.profile_image_url}
                                  alt=""
                                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <FaUser size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#9CA3AF' }} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                  {dc.contacts?.first_name} {dc.contacts?.last_name}
                                </div>
                                {dc.relationship && (
                                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    {dc.relationship}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDealContact(dc.contact_id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '4px',
                                color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#EF4444'}
                              onMouseLeave={(e) => e.target.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                              title="Remove contact from deal"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                        No contacts linked yet
                      </div>
                    )}
                  </div>

                  {/* Linked Companies */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FaBuilding size={14} style={{ marginRight: '8px' }} />
                        Linked Companies {selectedPipelineDeal.deal_companies?.length > 0 && `(${selectedPipelineDeal.deal_companies.length})`}
                      </div>
                      <button
                        onClick={() => setAddDealCompanyModalOpen(true)}
                        style={{
                          background: theme === 'light' ? '#E5E7EB' : '#4B5563',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          fontSize: '12px'
                        }}
                      >
                        <FaPlus size={10} /> Add
                      </button>
                    </div>

                    {/* Add Company Modal */}
                    {addDealCompanyModalOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '50px',
                        left: '16px',
                        right: '16px',
                        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Add Company to Deal</span>
                          <button
                            onClick={() => {
                              setAddDealCompanyModalOpen(false);
                              setDealCompanySearchQuery('');
                              setDealCompanySearchResults([]);
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#6B7280' : '#9CA3AF', padding: '4px' }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={dealCompanySearchQuery}
                          onChange={(e) => handleSearchDealCompanies(e.target.value)}
                          placeholder="Search companies by name..."
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: theme === 'light' ? '#F9FAFB' : '#111827',
                            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                            borderRadius: '6px',
                            color: theme === 'light' ? '#111827' : '#F9FAFB',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        {dealCompanySearchLoading && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            Searching...
                          </div>
                        )}
                        {!dealCompanySearchLoading && dealCompanySearchResults.length > 0 && (
                          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {dealCompanySearchResults.map((company) => (
                              <div
                                key={company.company_id}
                                onClick={() => handleAddDealCompany(company)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '6px',
                                backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FaBuilding size={12} style={{ color: '#9CA3AF' }} />
                              </div>
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                    {company.name}
                                  </div>
                                  {company.domain && (
                                    <div style={{ fontSize: '11px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                      {company.domain}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!dealCompanySearchLoading && dealCompanySearchQuery && dealCompanySearchResults.length === 0 && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            No companies found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Company List */}
                    {selectedPipelineDeal.deal_companies && selectedPipelineDeal.deal_companies.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedPipelineDeal.deal_companies.map((dco, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                              borderRadius: '8px'
                            }}
                          >
                            <div
                              onClick={() => dco.companies && navigate(`/company/${dco.companies.company_id}`)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flex: 1,
                                cursor: dco.companies ? 'pointer' : 'default'
                              }}
                            >
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FaBuilding size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#9CA3AF' }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                  {dco.companies?.name}
                                </div>
                                {dco.is_primary && (
                                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    Primary
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDealCompany(dco.company_id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '4px',
                                color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#EF4444'}
                              onMouseLeave={(e) => e.target.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                              title="Remove company from deal"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                        No companies linked yet
                      </div>
                    )}
                  </div>

                  {/* Linked Attachments */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FaPaperclip size={14} style={{ marginRight: '8px' }} />
                        Attachments {selectedPipelineDeal.deal_attachments?.length > 0 && `(${selectedPipelineDeal.deal_attachments.length})`}
                      </div>
                      <button
                        onClick={() => setAddDealAttachmentModalOpen(true)}
                        style={{
                          background: theme === 'light' ? '#E5E7EB' : '#4B5563',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          fontSize: '12px'
                        }}
                      >
                        <FaPlus size={10} /> Add
                      </button>
                    </div>

                    {/* Add Attachment Modal */}
                    {addDealAttachmentModalOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '50px',
                        left: '16px',
                        right: '16px',
                        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Add Attachment to Deal</span>
                          <button
                            onClick={() => {
                              setAddDealAttachmentModalOpen(false);
                              setDealAttachmentSearchQuery('');
                              setDealAttachmentSearchResults([]);
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#6B7280' : '#9CA3AF', padding: '4px' }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={dealAttachmentSearchQuery}
                          onChange={(e) => handleSearchDealAttachments(e.target.value)}
                          placeholder="Search attachments by file name..."
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: theme === 'light' ? '#F9FAFB' : '#111827',
                            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                            borderRadius: '6px',
                            color: theme === 'light' ? '#111827' : '#F9FAFB',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        {dealAttachmentSearchLoading && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            Searching...
                          </div>
                        )}
                        {!dealAttachmentSearchLoading && dealAttachmentSearchResults.length > 0 && (
                          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {dealAttachmentSearchResults.map((attachment) => (
                              <div
                                key={attachment.attachment_id}
                                onClick={() => handleAddDealAttachment(attachment)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '6px',
                                  backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <FaPaperclip size={12} style={{ color: '#9CA3AF' }} />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'light' ? '#111827' : '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {attachment.file_name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    {attachment.file_type} • {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!dealAttachmentSearchLoading && dealAttachmentSearchQuery && dealAttachmentSearchResults.length === 0 && (
                          <div style={{ padding: '10px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                            No attachments found
                          </div>
                        )}

                        {/* Upload new file section */}
                        <div style={{
                          borderTop: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          marginTop: '12px',
                          paddingTop: '12px'
                        }}>
                          <input
                            type="file"
                            ref={dealAttachmentFileInputRef}
                            onChange={handleUploadDealAttachment}
                            style={{ display: 'none' }}
                            multiple
                          />
                          <button
                            onClick={() => dealAttachmentFileInputRef.current?.click()}
                            disabled={dealAttachmentUploading}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: theme === 'light' ? '#3B82F6' : '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: dealAttachmentUploading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              fontWeight: 500,
                              opacity: dealAttachmentUploading ? 0.6 : 1
                            }}
                          >
                            <FaUpload size={12} />
                            {dealAttachmentUploading ? 'Uploading...' : 'Upload New File'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attachment List */}
                    {selectedPipelineDeal.deal_attachments && selectedPipelineDeal.deal_attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedPipelineDeal.deal_attachments.map((da, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                              borderRadius: '8px'
                            }}
                          >
                            <div
                              onClick={() => {
                                const url = da.attachments?.permanent_url || da.attachments?.file_url;
                                if (url) window.open(url, '_blank');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flex: 1,
                                cursor: 'pointer',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <FaPaperclip size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#9CA3AF' }} />
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {da.attachments?.file_name || 'Unknown file'}
                                </div>
                                <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                  {da.attachments?.file_type || 'Unknown type'} {da.attachments?.file_size ? `• ${(da.attachments.file_size / 1024).toFixed(1)} KB` : ''}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDealAttachment(da.attachment_id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '4px',
                                color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#EF4444'}
                              onMouseLeave={(e) => e.target.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                              title="Remove attachment from deal"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                        No attachments linked yet
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      background: theme === 'light' ? '#F3F4F6' : '#374151',
                      borderRadius: '12px',
                      flex: 1,
                      minWidth: '150px'
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                        Created
                      </div>
                      <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                        {new Date(selectedPipelineDeal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    {selectedPipelineDeal.proposed_at && (
                      <div style={{
                        padding: '12px 16px',
                        background: theme === 'light' ? '#F3F4F6' : '#374151',
                        borderRadius: '12px',
                        flex: 1,
                        minWidth: '150px'
                      }}>
                        <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                          Proposed
                        </div>
                        <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          {new Date(selectedPipelineDeal.proposed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    )}
                    {selectedPipelineDeal.last_modified_at && (
                      <div style={{
                        padding: '12px 16px',
                        background: theme === 'light' ? '#F3F4F6' : '#374151',
                        borderRadius: '12px',
                        flex: 1,
                        minWidth: '150px'
                      }}>
                        <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                          Last Modified
                        </div>
                        <div style={{ fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          {new Date(selectedPipelineDeal.last_modified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal Actions Bar */}
                <EmailActions theme={theme}>
                  <ActionBtn
                    theme={theme}
                    onClick={() => setCreateDealModalOpen(true)}
                  >
                    <FaPlus size={12} style={{ marginRight: '6px' }} />
                    New Deal
                  </ActionBtn>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <ActionBtn
                      theme={theme}
                      onClick={handleDeleteDeal}
                      style={{
                        background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                        color: theme === 'light' ? '#DC2626' : '#FCA5A5'
                      }}
                    >
                      <FaTrash size={12} style={{ marginRight: '6px' }} />
                      Delete Deal
                    </ActionBtn>
                  </div>
                </EmailActions>
              </div>
            ) : (
              <EmptyState theme={theme}>Select a deal to view details</EmptyState>
            )
          ) : activeTab === 'keepintouch' ? (
            selectedKeepInTouchContact ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Contact Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 24px',
                  minHeight: '70px',
                  borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Profile Image */}
                    <div
                      onClick={() => profileImageModal.openModal(keepInTouchContactDetails)}
                      style={{ cursor: 'pointer' }}
                      title={keepInTouchContactDetails?.profile_image_url ? 'Change profile image' : 'Add profile image'}
                    >
                      {keepInTouchContactDetails?.profile_image_url ? (
                        <img
                          src={keepInTouchContactDetails.profile_image_url}
                          alt=""
                          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: theme === 'light' ? '#E5E7EB' : '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                        }}>
                          {selectedKeepInTouchContact.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    {/* Name and details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EmailSubjectFull theme={theme} style={{ margin: 0 }}>
                          {selectedKeepInTouchContact.full_name}
                        </EmailSubjectFull>
                        {/* Link Company button when no company is linked */}
                        {!keepInTouchCompanies || keepInTouchCompanies.length === 0 ? (
                          <button
                            onClick={() => setLinkCompanyModalContact(keepInTouchContactDetails)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: theme === 'dark' ? '#374151' : '#F3F4F6',
                              border: `1px dashed ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                              borderRadius: '4px',
                              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                              cursor: 'pointer'
                            }}
                            title="Link a company to this contact"
                          >
                            <FaBuilding size={10} />
                            Link Company
                          </button>
                        ) : null}
                      </div>
                      {(keepInTouchContactDetails?.category || keepInTouchContactDetails?.job_role || keepInTouchContactDetails?.company) && (
                        <div style={{ fontSize: '13px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: '4px' }}>
                          {keepInTouchContactDetails?.category && (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: theme === 'dark' ? '#374151' : '#E5E7EB',
                              marginRight: '8px',
                              fontSize: '12px'
                            }}>
                              {keepInTouchContactDetails.category}
                            </span>
                          )}
                          {keepInTouchContactDetails?.job_role}
                          {keepInTouchContactDetails?.job_role && keepInTouchContactDetails?.company && ' at '}
                          {keepInTouchContactDetails?.company && (
                            <span style={{ fontWeight: 500 }}>{keepInTouchContactDetails.company.name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => navigate(`/contacts/${selectedKeepInTouchContact.contact_id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: theme === 'light' ? '#3B82F6' : '#2563EB',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      <FaExternalLinkAlt size={11} /> View Profile
                    </button>
                  </div>
                </div>

                {/* Contact Details */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                  {/* Status Card - Split in two */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    {/* Left: Overdue Status */}
                    <div style={{
                      padding: '20px',
                      background: parseInt(selectedKeepInTouchContact.days_until_next) <= 0
                        ? (theme === 'dark' ? '#7f1d1d' : '#fef2f2')
                        : parseInt(selectedKeepInTouchContact.days_until_next) <= 14
                          ? (theme === 'dark' ? '#78350f' : '#fffbeb')
                          : (theme === 'dark' ? '#1F2937' : '#F9FAFB'),
                      borderRadius: '12px',
                      border: parseInt(selectedKeepInTouchContact.days_until_next) <= 0
                        ? '1px solid #ef4444'
                        : parseInt(selectedKeepInTouchContact.days_until_next) <= 14
                          ? '1px solid #f59e0b'
                          : `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        color: parseInt(selectedKeepInTouchContact.days_until_next) <= 0
                          ? '#ef4444'
                          : parseInt(selectedKeepInTouchContact.days_until_next) <= 14
                            ? '#f59e0b'
                            : (theme === 'dark' ? '#10B981' : '#059669')
                      }}>
                        {parseInt(selectedKeepInTouchContact.days_until_next) <= 0
                          ? `${Math.abs(parseInt(selectedKeepInTouchContact.days_until_next))} days overdue`
                          : `${selectedKeepInTouchContact.days_until_next} days until next`}
                      </div>
                      <div style={{ fontSize: '14px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Frequency:
                        <select
                          value={selectedKeepInTouchContact.frequency || 'Not Set'}
                          onChange={(e) => handleUpdateKeepInTouchField('frequency', e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                            background: theme === 'dark' ? '#374151' : '#FFFFFF',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {KEEP_IN_TOUCH_FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right: Completeness Score */}
                    {(() => {
                      const score = keepInTouchContactDetails?.completeness_score || 0;
                      const isMarkedComplete = keepInTouchContactDetails?.show_missing === false;
                      const circumference = 2 * Math.PI * 36;
                      const strokeDashoffset = isMarkedComplete ? 0 : circumference - (score / 100) * circumference;
                      const scoreColor = isMarkedComplete ? '#F59E0B' : (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444');
                      return (
                        <div style={{
                          padding: '20px',
                          background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                          borderRadius: '12px',
                          border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                            Profile Completeness
                          </div>
                          <div
                            style={{ position: 'relative', width: 80, height: 80, cursor: 'pointer' }}
                            title={isMarkedComplete ? 'Marked complete' : `${score}% complete`}
                            onClick={() => {
                              setDataIntegrityContactId(selectedKeepInTouchContact.contact_id);
                              setDataIntegrityModalOpen(true);
                            }}
                          >
                            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="40" cy="40" r="36" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="6" />
                              <circle cx="40" cy="40" r="36" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', fontWeight: 700, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                              {(isMarkedComplete || score === 100) ? <FaCrown size={24} color="#F59E0B" /> : `${score}%`}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                      padding: '16px',
                      background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '4px' }}>
                        Last Interaction
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                        {selectedKeepInTouchContact.last_interaction_at
                          ? new Date(selectedKeepInTouchContact.last_interaction_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Never'}
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '4px' }}>
                        Next Interaction Due
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                        {selectedKeepInTouchContact.next_interaction_date
                          ? new Date(selectedKeepInTouchContact.next_interaction_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Not set'}
                      </div>
                    </div>
                  </div>

                  {/* Why Keeping in Touch */}
                  {selectedKeepInTouchContact.why_keeping_in_touch && (
                    <div style={{
                      padding: '16px',
                      background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '8px' }}>
                        Why Keeping in Touch
                      </div>
                      <div style={{ fontSize: '14px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                        {selectedKeepInTouchContact.why_keeping_in_touch}
                      </div>
                    </div>
                  )}

                  {/* Next Follow-up Notes */}
                  {selectedKeepInTouchContact.next_follow_up_notes && (
                    <div style={{
                      padding: '16px',
                      background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '8px' }}>
                        Next Follow-up Notes
                      </div>
                      <div style={{ fontSize: '14px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                        {selectedKeepInTouchContact.next_follow_up_notes}
                      </div>
                    </div>
                  )}

                  {/* Holiday Wishes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      background: (!selectedKeepInTouchContact.christmas || selectedKeepInTouchContact.christmas === 'no wishes set')
                        ? (theme === 'dark' ? '#7f1d1d' : '#fef2f2')
                        : (theme === 'dark' ? '#1F2937' : '#F9FAFB'),
                      borderRadius: '12px',
                      border: (!selectedKeepInTouchContact.christmas || selectedKeepInTouchContact.christmas === 'no wishes set')
                        ? '1px solid #ef4444'
                        : `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '8px' }}>
                        Christmas
                      </div>
                      <select
                        value={selectedKeepInTouchContact.christmas || 'no wishes set'}
                        onChange={(e) => handleUpdateKeepInTouchField('christmas', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                          background: theme === 'dark' ? '#374151' : '#FFFFFF',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {WISHES_TYPES.map(wish => (
                          <option key={wish} value={wish}>{wish}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: (!selectedKeepInTouchContact.easter || selectedKeepInTouchContact.easter === 'no wishes set')
                        ? (theme === 'dark' ? '#7f1d1d' : '#fef2f2')
                        : (theme === 'dark' ? '#1F2937' : '#F9FAFB'),
                      borderRadius: '12px',
                      border: (!selectedKeepInTouchContact.easter || selectedKeepInTouchContact.easter === 'no wishes set')
                        ? '1px solid #ef4444'
                        : `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                    }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '8px' }}>
                        Easter
                      </div>
                      <select
                        value={selectedKeepInTouchContact.easter || 'no wishes set'}
                        onChange={(e) => handleUpdateKeepInTouchField('easter', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                          background: theme === 'dark' ? '#374151' : '#FFFFFF',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {WISHES_TYPES.map(wish => (
                          <option key={wish} value={wish}>{wish}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Last 3 Interactions */}
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                    borderRadius: '12px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                  }}>
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Last Interactions
                    </div>
                    {keepInTouchInteractions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {keepInTouchInteractions.map((interaction) => (
                          <div
                            key={interaction.interaction_id}
                            style={{
                              padding: '12px',
                              background: theme === 'dark' ? '#111827' : '#FFFFFF',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: interaction.interaction_type === 'email' ? '#3B82F6' :
                                  interaction.interaction_type === 'whatsapp' ? '#22C55E' :
                                  interaction.interaction_type === 'call' ? '#F59E0B' : '#6B7280',
                                color: 'white'
                              }}>
                                {interaction.interaction_type}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                              }}>
                                {interaction.direction === 'sent' ? '→ Sent' : '← Received'}
                              </span>
                              <span style={{
                                marginLeft: 'auto',
                                fontSize: '11px',
                                color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                              }}>
                                {new Date(interaction.interaction_date).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            {interaction.summary && (
                              <div style={{
                                fontSize: '13px',
                                color: theme === 'dark' ? '#D1D5DB' : '#374151',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {interaction.summary}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', textAlign: 'center', padding: '12px' }}>
                        No interactions recorded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState theme={theme}>Select a contact to view details</EmptyState>
            )
          ) : selectedThread && selectedThread.length > 0 ? (
            <>
              {/* Thread subject */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 24px',
                height: '56px',
                minHeight: '56px',
                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
              }}>
                <EmailSubjectFull theme={theme} style={{ margin: 0 }}>
                  {selectedThread[0].subject?.replace(/^(Re: |Fwd: )+/i, '')}
                  {selectedThread.length > 1 && <span style={{ opacity: 0.6, marginLeft: '8px' }}>({selectedThread.length} messages)</span>}
                </EmailSubjectFull>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* New Email */}
                  <button
                    onClick={openNewCompose}
                    title="New Email"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '0 12px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: theme === 'light' ? '#10B981' : '#059669',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    <FaEnvelope size={12} />
                    New
                  </button>

                  {/* Need Actions */}
                  <button
                    onClick={() => updateItemStatus('need_actions')}
                    disabled={saving}
                    title="Need Actions"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: theme === 'light' ? '#FEF3C7' : '#78350F',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: saving ? 0.5 : 1,
                      fontSize: '16px',
                    }}
                  >
                    ❗
                  </button>

                  {/* Waiting Input */}
                  <button
                    onClick={() => updateItemStatus('waiting_input')}
                    disabled={saving}
                    title="Waiting Input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: theme === 'light' ? '#DBEAFE' : '#1E3A8A',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: saving ? 0.5 : 1,
                      fontSize: '16px',
                    }}
                  >
                    👀
                  </button>

                  {/* Done */}
                  <button
                    onClick={handleDoneClick}
                    disabled={saving}
                    title="Done"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: saving
                        ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
                        : (theme === 'light' ? '#D1FAE5' : '#065F46'),
                      color: saving
                        ? 'white'
                        : (theme === 'light' ? '#059669' : '#6EE7B7'),
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? (
                      <span style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : (
                      <FaCheck size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* All messages in thread */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedThread.map((email, index) => (
                  <div key={email.id} style={{
                    padding: '16px 24px',
                    borderBottom: index < selectedThread.length - 1 ? `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}` : 'none',
                    background: email.from_email?.toLowerCase() === MY_EMAIL
                      ? (theme === 'light' ? '#F0F9FF' : '#1E3A5F')
                      : 'transparent'
                  }}>
                    {/* Email Header - proper client style */}
                    <div style={{
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                    }}>
                      {/* Date aligned right */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div style={{ flex: 1 }}>
                          {/* From */}
                          <div style={{ marginBottom: '4px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                              display: 'inline-block',
                              width: '45px'
                            }}>From:</span>
                            <span
                              onClick={() => email.from_email?.toLowerCase() !== MY_EMAIL && handleEmailAddressClick(email.from_email, email.from_name, email.date)}
                              style={{
                                fontSize: '14px',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontWeight: 500,
                                cursor: email.from_email?.toLowerCase() !== MY_EMAIL ? 'pointer' : 'default',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title={email.from_email?.toLowerCase() !== MY_EMAIL
                                ? (emailHasContact(email.from_email) ? 'View contact' : 'Add as contact')
                                : ''}
                            >
                              {email.from_name && email.from_name !== email.from_email
                                ? `${email.from_name} `
                                : ''}
                              <span style={{
                                color: theme === 'light' ? '#3B82F6' : '#60A5FA',
                                fontWeight: 400
                              }}>
                                {email.from_name && email.from_name !== email.from_email
                                  ? `<${email.from_email}>`
                                  : email.from_email}
                              </span>
                              {email.from_email?.toLowerCase() !== MY_EMAIL && (
                                emailHasContact(email.from_email) ? (
                                  <FaUser size={10} style={{ color: theme === 'light' ? '#10B981' : '#34D399' }} title="Contact exists" />
                                ) : (
                                  <FaPlus size={10} style={{ color: theme === 'light' ? '#F59E0B' : '#FBBF24' }} title="Add contact" />
                                )
                              )}
                            </span>
                          </div>

                          {/* To */}
                          {email.to_recipients && email.to_recipients.length > 0 && (
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                display: 'inline-block',
                                width: '45px',
                                verticalAlign: 'top'
                              }}>To:</span>
                              <span style={{ fontSize: '13px', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                {email.to_recipients.map((r, i) => (
                                  <span
                                    key={i}
                                    onClick={() => r.email?.toLowerCase() !== MY_EMAIL && handleEmailAddressClick(r.email, r.name, email.date)}
                                    style={{
                                      cursor: r.email?.toLowerCase() !== MY_EMAIL ? 'pointer' : 'default',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={r.email?.toLowerCase() !== MY_EMAIL
                                      ? (emailHasContact(r.email) ? 'View contact' : 'Add as contact')
                                      : ''}
                                  >
                                    {i > 0 && <span style={{ marginRight: '4px' }}>, </span>}
                                    {r.name && r.name !== r.email ? (
                                      <>
                                        {r.name} <span style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }}>&lt;{r.email}&gt;</span>
                                      </>
                                    ) : (
                                      <span style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }}>{r.email}</span>
                                    )}
                                    {r.email?.toLowerCase() !== MY_EMAIL && (
                                      emailHasContact(r.email) ? (
                                        <FaUser size={9} style={{ color: theme === 'light' ? '#10B981' : '#34D399' }} />
                                      ) : (
                                        <FaPlus size={9} style={{ color: theme === 'light' ? '#F59E0B' : '#FBBF24' }} />
                                      )
                                    )}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}

                          {/* CC */}
                          {email.cc_recipients && email.cc_recipients.length > 0 && (
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                display: 'inline-block',
                                width: '45px',
                                verticalAlign: 'top'
                              }}>Cc:</span>
                              <span style={{ fontSize: '13px', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                {email.cc_recipients.map((r, i) => (
                                  <span
                                    key={i}
                                    onClick={() => r.email?.toLowerCase() !== MY_EMAIL && handleEmailAddressClick(r.email, r.name, email.date)}
                                    style={{
                                      cursor: r.email?.toLowerCase() !== MY_EMAIL ? 'pointer' : 'default',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={r.email?.toLowerCase() !== MY_EMAIL
                                      ? (emailHasContact(r.email) ? 'View contact' : 'Add as contact')
                                      : ''}
                                  >
                                    {i > 0 && <span style={{ marginRight: '4px' }}>, </span>}
                                    {r.name && r.name !== r.email ? (
                                      <>
                                        {r.name} <span style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }}>&lt;{r.email}&gt;</span>
                                      </>
                                    ) : (
                                      <span style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }}>{r.email}</span>
                                    )}
                                    {r.email?.toLowerCase() !== MY_EMAIL && (
                                      emailHasContact(r.email) ? (
                                        <FaUser size={9} style={{ color: theme === 'light' ? '#10B981' : '#34D399' }} />
                                      ) : (
                                        <FaPlus size={9} style={{ color: theme === 'light' ? '#F59E0B' : '#FBBF24' }} />
                                      )
                                    )}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <span style={{
                          fontSize: '12px',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                          whiteSpace: 'nowrap',
                          marginLeft: '16px'
                        }}>
                          {new Date(email.date).toLocaleString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    {email.body_html ? (
                      <div
                        style={{
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.body_html) }}
                      />
                    ) : (
                      <div style={{
                        color: theme === 'light' ? '#374151' : '#D1D5DB',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {email.body_text || email.snippet || 'No content'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Attachments section - above reply actions */}
              {(() => {
                // Collect all attachments from all emails in thread
                const allAttachments = selectedThread.flatMap(email =>
                  (email.attachments || []).map(att => ({
                    ...att,
                    emailSubject: email.subject,
                    emailDate: email.date,
                    fastmailId: email.fastmail_id
                  }))
                );

                if (allAttachments.length === 0) return null;

                const handleDownload = async (att) => {
                  try {
                    toast.loading('Downloading...', { id: 'download' });
                    const url = `${BACKEND_URL}/attachment/${encodeURIComponent(att.blobId)}?name=${encodeURIComponent(att.name || 'attachment')}&type=${encodeURIComponent(att.type || 'application/octet-stream')}`;

                    // Fetch the file
                    const response = await fetch(url);
                    if (!response.ok) {
                      throw new Error('Download failed');
                    }

                    // Create blob and download
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = att.name || 'attachment';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);

                    toast.success('Downloaded!', { id: 'download' });
                  } catch (error) {
                    console.error('Download error:', error);
                    toast.error('Failed to download', { id: 'download' });
                  }
                };

                const formatSize = (bytes) => {
                  if (!bytes) return '';
                  if (bytes < 1024) return `${bytes} B`;
                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                };

                return (
                  <AttachmentsSection theme={theme}>
                    <AttachmentsHeader theme={theme}>
                      <FaPaperclip size={12} />
                      {allAttachments.length} attachment{allAttachments.length !== 1 ? 's' : ''}
                    </AttachmentsHeader>
                    <AttachmentsList>
                      {allAttachments.map((att, idx) => (
                        <AttachmentChip
                          key={idx}
                          theme={theme}
                          onClick={() => handleDownload(att)}
                          title={`Download ${att.name || 'attachment'}`}
                        >
                          <FaDownload size={12} />
                          <span>{att.name || 'Unnamed file'}</span>
                          {att.size && <AttachmentSize>({formatSize(att.size)})</AttachmentSize>}
                        </AttachmentChip>
                      ))}
                    </AttachmentsList>
                  </AttachmentsSection>
                );
              })()}

              {/* Reply actions - based on latest email */}
              {(() => {
                const latestEmail = selectedThread[0];
                const isSentByMe = latestEmail.from_email?.toLowerCase() === MY_EMAIL;
                const toCount = latestEmail.to_recipients?.length || 0;
                const ccCount = latestEmail.cc_recipients?.length || 0;
                const showReplyAll = isSentByMe ? (toCount + ccCount > 1) : (toCount > 1 || ccCount > 0);

                return (
                  <EmailActions theme={theme}>
                    <ActionBtn theme={theme} onClick={() => openReply(false)}>Reply</ActionBtn>
                    {showReplyAll && (
                      <ActionBtn theme={theme} onClick={() => openReply(true)}>Reply All</ActionBtn>
                    )}
                    <ActionBtn theme={theme} onClick={openForward}>Forward</ActionBtn>

                    {/* Spam and Delete buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      {/* Spam button with dropdown */}
                      {!isSentByMe && (
                        <div style={{ position: 'relative' }}>
                        <ActionBtn
                          theme={theme}
                          onClick={() => setSpamMenuOpen(!spamMenuOpen)}
                          style={{
                            background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                            color: theme === 'light' ? '#DC2626' : '#FCA5A5'
                          }}
                        >
                          Spam
                        </ActionBtn>
                        {spamMenuOpen && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            marginBottom: '4px',
                            background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            zIndex: 100
                          }}>
                            <button
                              onClick={() => markAsSpam('email')}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                background: 'transparent',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                              onMouseOver={(e) => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                              onMouseOut={(e) => e.target.style.background = 'transparent'}
                            >
                              Block Email: {latestEmail.from_email}
                            </button>
                            <button
                              onClick={() => markAsSpam('domain')}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                background: 'transparent',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                              onMouseOver={(e) => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                              onMouseOut={(e) => e.target.style.background = 'transparent'}
                            >
                              Block Domain: {latestEmail.from_email?.split('@')[1]}
                            </button>
                          </div>
                        )}
                        </div>
                      )}

                      <ActionBtn
                        theme={theme}
                        onClick={deleteEmail}
                        style={{
                          background: theme === 'light' ? '#F3F4F6' : '#374151',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                          padding: '8px 12px'
                        }}
                        title="Delete email"
                      >
                        <FaTrash />
                      </ActionBtn>
                    </div>
                  </EmailActions>
                );
              })()}
            </>
          ) : threads.length === 0 ? (
            <EmptyState theme={theme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <img
                src={`${process.env.PUBLIC_URL}/inbox-zero.png`}
                alt="Inbox Zero!"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>Inbox Zero!</div>
            </EmptyState>
          ) : (
            <EmptyState theme={theme}>Select a thread to view</EmptyState>
          )}
        </EmailContentPanel>

        {/* Right: Actions Panel */}
        <ActionsPanel theme={theme} $collapsed={rightPanelCollapsed}>
          <ActionsPanelTabs theme={theme} style={{ justifyContent: rightPanelCollapsed ? 'center' : 'center' }}>
            <CollapseButton theme={theme} onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} style={{ marginRight: rightPanelCollapsed ? 0 : '8px' }}>
              {rightPanelCollapsed ? <FaChevronLeft /> : <FaChevronRight />}
            </CollapseButton>
            {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && (
              <>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'crm'} onClick={() => setActiveActionTab('crm')} title="Contact Details">
                  <FaUser />
                </ActionTabIcon>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'kitWhatsapp'} onClick={() => setActiveActionTab('kitWhatsapp')} title="WhatsApp Chat" style={activeActionTab === 'kitWhatsapp' ? { background: '#22C55E', color: 'white' } : {}}>
                  <FaWhatsapp />
                </ActionTabIcon>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'kitEmail'} onClick={() => setActiveActionTab('kitEmail')} title="Send Email" style={activeActionTab === 'kitEmail' ? { background: '#3B82F6', color: 'white' } : {}}>
                  <FaEnvelope />
                </ActionTabIcon>
              </>
            )}
            {!rightPanelCollapsed && activeTab !== 'keepintouch' && (
              <>
                {activeTab !== 'calendar' && (
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'chat'} onClick={() => setActiveActionTab('chat')} title="Chat with Claude">
                    <FaRobot />
                  </ActionTabIcon>
                )}
                {activeTab !== 'deals' && activeTab !== 'calendar' && (
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'dataIntegrity'} onClick={() => setActiveActionTab('dataIntegrity')} title="Data Integrity">
                    <FaDatabase />
                  </ActionTabIcon>
                )}
                <ActionTabIcon theme={theme} $active={activeActionTab === 'crm'} onClick={() => setActiveActionTab('crm')} title="CRM">
                  <FaUser />
                </ActionTabIcon>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'deals'} onClick={() => setActiveActionTab('deals')} title="Deals">
                  <FaDollarSign />
                </ActionTabIcon>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'introductions'} onClick={() => setActiveActionTab('introductions')} title="Introductions">
                  <FaHandshake />
                </ActionTabIcon>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'tasks'} onClick={() => setActiveActionTab('tasks')} title="Tasks">
                  <FaTasks />
                </ActionTabIcon>
                <ActionTabIcon theme={theme} $active={activeActionTab === 'notes'} onClick={() => setActiveActionTab('notes')} title="Notes">
                  <FaStickyNote />
                </ActionTabIcon>
              </>
            )}
          </ActionsPanelTabs>

          {/* Keep in Touch - Contact Details Panel */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && keepInTouchContactDetails && activeActionTab === 'crm' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {/* Section 1: Info Base */}
              <div style={{
                background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Basic Info
                </div>

                {/* Name Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>First Name</label>
                    <input
                      type="text"
                      value={keepInTouchContactDetails.first_name || ''}
                      onChange={(e) => handleUpdateContactField('first_name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Last Name</label>
                    <input
                      type="text"
                      value={keepInTouchContactDetails.last_name || ''}
                      onChange={(e) => handleUpdateContactField('last_name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Job Role */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Job Role</label>
                  <input
                    type="text"
                    value={keepInTouchContactDetails.job_role || ''}
                    onChange={(e) => handleUpdateContactField('job_role', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#FFFFFF',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* Category & Score */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Category</label>
                    <select
                      value={keepInTouchContactDetails.category || 'Not Set'}
                      onChange={(e) => handleUpdateContactField('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {['Not Set', 'Inbox', 'Skip', 'Professional Investor', 'Team', 'Advisor', 'Supplier', 'Founder', 'Manager', 'Friend and Family', 'Other', 'Student', 'Media', 'Institution'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={keepInTouchContactDetails.score || ''}
                      onChange={(e) => handleUpdateContactField('score', parseInt(e.target.value) || null)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Birthday & LinkedIn */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Birthday</label>
                    <input
                      type="date"
                      value={keepInTouchContactDetails.birthday || ''}
                      onChange={(e) => handleUpdateContactField('birthday', e.target.value || null)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>LinkedIn</label>
                    <input
                      type="text"
                      value={keepInTouchContactDetails.linkedin || ''}
                      onChange={(e) => handleUpdateContactField('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/..."
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div style={{
                background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Contact Details
                </div>

                {/* Emails */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <FaEnvelope size={12} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>Emails</span>
                    <FaEdit
                      size={11}
                      style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                      onClick={() => setKitManageEmailsOpen(true)}
                      title="Manage emails"
                    />
                  </div>
                  {keepInTouchEmails.length > 0 ? (
                    keepInTouchEmails.map((e, idx) => (
                      <div key={e.email_id || idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        background: theme === 'dark' ? '#374151' : '#E5E7EB',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        fontSize: '12px'
                      }}>
                        <span style={{ flex: 1, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{e.email}</span>
                        {e.is_primary && <span style={{ fontSize: '10px', padding: '1px 4px', background: '#10B981', color: 'white', borderRadius: '3px' }}>Primary</span>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No emails</div>
                  )}
                </div>

                {/* Mobiles */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <FaWhatsapp size={12} style={{ color: '#22C55E' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>Phone Numbers</span>
                    <FaEdit
                      size={11}
                      style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                      onClick={() => setKitManageMobilesOpen(true)}
                      title="Manage phone numbers"
                    />
                  </div>
                  {keepInTouchMobiles.length > 0 ? (
                    keepInTouchMobiles.map((m, idx) => (
                      <div key={m.mobile_id || idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        background: theme === 'dark' ? '#374151' : '#E5E7EB',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        fontSize: '12px'
                      }}>
                        <span style={{ flex: 1, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{m.mobile}</span>
                        {m.is_primary && <span style={{ fontSize: '10px', padding: '1px 4px', background: '#10B981', color: 'white', borderRadius: '3px' }}>Primary</span>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No phone numbers</div>
                  )}
                </div>

                {/* Companies */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <FaBuilding size={12} style={{ color: '#8B5CF6' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>Companies</span>
                    <FaEdit
                      size={11}
                      style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                      onClick={() => setKitCompanyModalContact(selectedKeepInTouchContact)}
                      title="Add company"
                    />
                  </div>
                  {keepInTouchCompanies.length > 0 ? (
                    keepInTouchCompanies.map((cc, idx) => (
                      <div
                        key={cc.contact_companies_id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          background: theme === 'dark' ? '#374151' : '#E5E7EB',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          fontSize: '12px',
                          cursor: cc.company?.company_id ? 'pointer' : 'default'
                        }}
                        onClick={() => cc.company?.company_id && navigate(`/companies/${cc.company.company_id}`)}
                      >
                        <span style={{ flex: 1, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{cc.company?.name || 'Unknown'}</span>
                        {cc.is_primary && <span style={{ fontSize: '10px', padding: '1px 4px', background: '#8B5CF6', color: 'white', borderRadius: '3px' }}>Primary</span>}
                        {cc.relationship && <span style={{ fontSize: '10px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>{cc.relationship}</span>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No companies linked</div>
                  )}
                </div>
              </div>

              {/* Section 3: Tags & Cities */}
              <div style={{
                background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                borderRadius: '8px',
                padding: '12px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tags & Locations
                </div>

                {/* Tags */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <FaTag size={11} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>Tags</span>
                    <FaEdit
                      size={11}
                      style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                      onClick={() => setKitTagsModalOpen(true)}
                      title="Manage tags"
                    />
                  </div>
                  {keepInTouchTags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {keepInTouchTags.map((t, idx) => (
                        <span
                          key={t.entry_id || idx}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: theme === 'dark' ? '#374151' : '#E5E7EB',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827'
                          }}
                        >
                          {t.tags?.name || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No tags</div>
                  )}
                </div>

                {/* Cities */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <FaBuilding size={11} style={{ color: '#EC4899' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>Cities</span>
                    <FaEdit
                      size={11}
                      style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                      onClick={() => setKitCityModalOpen(true)}
                      title="Manage cities"
                    />
                  </div>
                  {keepInTouchCities.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {keepInTouchCities.map((c, idx) => (
                        <span
                          key={c.entry_id || idx}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: theme === 'dark' ? '#374151' : '#E5E7EB',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827'
                          }}
                        >
                          {c.cities?.name}{c.cities?.country ? `, ${c.cities.country}` : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No cities</div>
                  )}
                </div>
              </div>

              {/* Description Section */}
              <div style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Description
                </div>
                <textarea
                  value={keepInTouchContactDetails?.description || ''}
                  onChange={async (e) => {
                    const newValue = e.target.value;
                    setKeepInTouchContactDetails(prev => ({ ...prev, description: newValue }));
                  }}
                  onBlur={async (e) => {
                    const newValue = e.target.value;
                    if (selectedKeepInTouchContact?.contact_id) {
                      const { error } = await supabase
                        .from('contacts')
                        .update({ description: newValue })
                        .eq('contact_id', selectedKeepInTouchContact.contact_id);
                      if (error) {
                        console.error('Error updating description:', error);
                      }
                    }
                  }}
                  placeholder="Add notes about this contact..."
                  style={{
                    flex: 1,
                    minHeight: '200px',
                    padding: '10px',
                    fontSize: '13px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    background: theme === 'dark' ? '#111827' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>
          )}

          {/* Keep in Touch - WhatsApp Chat Panel */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && activeActionTab === 'kitWhatsapp' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Messages Container */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '8px',
                background: theme === 'dark' ? '#111827' : '#F3F4F6'
              }}>
                {kitWhatsappLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                    Loading messages...
                  </div>
                ) : kitWhatsappMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                    {keepInTouchMobiles.length === 0 ? (
                      <div>
                        <FaWhatsapp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <div>No phone number available</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>Add a phone number to view WhatsApp messages</div>
                      </div>
                    ) : (
                      <div>
                        <FaWhatsapp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <div>No messages yet</div>
                      </div>
                    )}
                  </div>
                ) : (
                  kitWhatsappMessages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      style={{
                        maxWidth: '85%',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        alignSelf: msg.direction === 'sent' ? 'flex-end' : 'flex-start',
                        background: msg.direction === 'sent'
                          ? (theme === 'dark' ? '#054640' : '#DCF8C6')
                          : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        border: msg.direction === 'sent'
                          ? 'none'
                          : `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}
                    >
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      <div style={{
                        fontSize: '10px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        marginTop: '4px',
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px'
                      }}>
                        {new Date(msg.date).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {msg.direction === 'sent' && (
                          <FaCheckDouble size={10} style={{ color: '#34D399' }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              {keepInTouchMobiles.length > 0 && (
                <div style={{
                  padding: '12px',
                  borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-end'
                }}>
                  <textarea
                    value={kitWhatsappInput}
                    onChange={(e) => setKitWhatsappInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleKitSendWhatsapp();
                      }
                    }}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '20px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '13px',
                      resize: 'none',
                      outline: 'none',
                      maxHeight: '100px',
                      minHeight: '40px',
                      fontFamily: 'inherit'
                    }}
                    rows={1}
                  />
                  <button
                    onClick={handleKitSendWhatsapp}
                    disabled={!kitWhatsappInput.trim() || kitWhatsappSending}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      background: kitWhatsappInput.trim() && !kitWhatsappSending ? '#22C55E' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                      color: kitWhatsappInput.trim() && !kitWhatsappSending ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF'),
                      cursor: kitWhatsappInput.trim() && !kitWhatsappSending ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {kitWhatsappSending ? (
                      <FaClock size={16} />
                    ) : (
                      <FaPaperPlane size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Keep in Touch - Email Panel */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && activeActionTab === 'kitEmail' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px' }}>
              {/* To Field - dropdown if multiple emails */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>To</label>
                {keepInTouchEmails.length === 0 ? (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontSize: '13px',
                    fontStyle: 'italic'
                  }}>
                    No email address
                  </div>
                ) : keepInTouchEmails.length === 1 ? (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '13px'
                  }}>
                    {keepInTouchEmails[0].email}
                  </div>
                ) : (
                  <select
                    value={kitSelectedEmail || keepInTouchEmails[0].email}
                    onChange={(e) => setKitSelectedEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#FFFFFF',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {keepInTouchEmails.map((e, idx) => (
                      <option key={e.email_id || idx} value={e.email}>
                        {e.email}{e.is_primary ? ' (primary)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject Field */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Subject</label>
                <input
                  type="text"
                  value={kitEmailSubject}
                  onChange={(e) => setKitEmailSubject(e.target.value)}
                  placeholder="Enter subject..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Template Button */}
              <div style={{ marginBottom: '12px', position: 'relative' }} ref={kitTemplateDropdownRef}>
                <button
                  type="button"
                  onClick={() => setKitTemplateDropdownOpen(!kitTemplateDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: theme === 'dark' ? '#374151' : '#F3F4F6',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    color: theme === 'dark' ? '#D1D5DB' : '#374151',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <FaFileAlt size={12} />
                  Templates
                </button>

                {kitTemplateDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: '300px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Search Input */}
                    <div style={{ padding: '8px', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}` }}>
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={kitTemplateSearch}
                        onChange={(e) => setKitTemplateSearch(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                          borderRadius: '6px',
                          background: theme === 'dark' ? '#374151' : '#F9FAFB',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Template List */}
                    <div style={{ overflow: 'auto', maxHeight: '200px' }}>
                      {kitTemplatesLoading ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '13px' }}>
                          Loading...
                        </div>
                      ) : kitTemplates.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '13px' }}>
                          {kitTemplateSearch ? 'No templates found' : 'No templates yet'}
                        </div>
                      ) : (
                        kitTemplates.map((template) => (
                          <div
                            key={template.template_id}
                            onClick={() => applyKitTemplate(template)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#F3F4F6'}`,
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                              {template.name}
                            </div>
                            {template.short_description && (
                              <div style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: '2px' }}>
                                {template.short_description}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '12px', minHeight: 0 }}>
                <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Message</label>
                <textarea
                  value={kitEmailBody}
                  onChange={(e) => setKitEmailBody(e.target.value)}
                  placeholder="Write your message..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    minHeight: '150px'
                  }}
                />
              </div>

              {/* Signature Preview */}
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                marginBottom: '12px',
                fontSize: '11px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.4'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Signature:</div>
                --{'\n'}SIMONE CIMMINELLI{'\n'}Newsletter | Website | LinkedIn
              </div>

              {/* Send Button */}
              <button
                onClick={handleKitSendEmail}
                disabled={!kitEmailSubject.trim() || !kitEmailBody.trim() || kitEmailSending || keepInTouchEmails.length === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (kitEmailSubject.trim() && kitEmailBody.trim() && !kitEmailSending && keepInTouchEmails.length > 0)
                    ? '#3B82F6'
                    : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                  color: (kitEmailSubject.trim() && kitEmailBody.trim() && !kitEmailSending && keepInTouchEmails.length > 0)
                    ? 'white'
                    : (theme === 'dark' ? '#6B7280' : '#9CA3AF'),
                  cursor: (kitEmailSubject.trim() && kitEmailBody.trim() && !kitEmailSending && keepInTouchEmails.length > 0)
                    ? 'pointer'
                    : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {kitEmailSending ? (
                  <>
                    <FaClock size={14} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={14} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          )}

          {!rightPanelCollapsed && activeTab !== 'keepintouch' && ((selectedThread && selectedThread.length > 0) || selectedWhatsappChat || selectedCalendarEvent || selectedPipelineDeal) && (
            <>
              {activeActionTab === 'chat' && (
                <ChatTab
                  theme={theme}
                  activeTab={activeTab}
                  chatMessagesRef={chatMessagesRef}
                  chatFileInputRef={chatFileInputRef}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatLoading={chatLoading}
                  chatImages={chatImages}
                  pendingCalendarEvent={pendingCalendarEvent}
                  setPendingCalendarEvent={setPendingCalendarEvent}
                  calendarEventEdits={calendarEventEdits}
                  setCalendarEventEdits={setCalendarEventEdits}
                  updateCalendarEventField={updateCalendarEventField}
                  calendarLoading={calendarLoading}
                  handleQuickAction={handleQuickAction}
                  handleCalendarExtract={handleCalendarExtract}
                  handleCreateCalendarEvent={handleCreateCalendarEvent}
                  sendMessageToClaude={sendMessageToClaude}
                  handleChatImageSelect={handleChatImageSelect}
                  removeChatImage={removeChatImage}
                  openReplyWithDraft={openReplyWithDraft}
                  extractDraftFromMessage={extractDraftFromMessage}
                />
              )}

              {activeActionTab === 'ai' && (
                <AITab
                  theme={theme}
                  selectedThread={selectedThread}
                  auditResult={auditResult}
                  setAuditResult={setAuditResult}
                  loadingAudit={loadingAudit}
                  auditActions={auditActions}
                  setAuditActions={setAuditActions}
                  selectedActions={selectedActions}
                  setSelectedActions={setSelectedActions}
                  executingActions={executingActions}
                  runContactAudit={runContactAudit}
                  toggleActionSelection={toggleActionSelection}
                  executeSelectedActions={executeSelectedActions}
                />
              )}
              {activeActionTab === 'dataIntegrity' && (
                <DataIntegrityTab
                  theme={theme}
                  navigate={navigate}
                  loadingDataIntegrity={loadingDataIntegrity}
                  notInCrmEmails={notInCrmEmails}
                  notInCrmDomains={notInCrmDomains}
                  notInCrmTab={notInCrmTab}
                  setNotInCrmTab={setNotInCrmTab}
                  holdContacts={holdContacts}
                  holdCompanies={holdCompanies}
                  holdTab={holdTab}
                  setHoldTab={setHoldTab}
                  incompleteContacts={incompleteContacts}
                  incompleteCompanies={incompleteCompanies}
                  completenessTab={completenessTab}
                  setCompletenessTab={setCompletenessTab}
                  duplicateContacts={duplicateContacts}
                  duplicateCompanies={duplicateCompanies}
                  duplicatesTab={duplicatesTab}
                  setDuplicatesTab={setDuplicatesTab}
                  categoryMissingContacts={categoryMissingContacts}
                  categoryMissingCompanies={categoryMissingCompanies}
                  categoryMissingTab={categoryMissingTab}
                  setCategoryMissingTab={setCategoryMissingTab}
                  keepInTouchMissingContacts={keepInTouchMissingContacts}
                  missingCompanyLinks={missingCompanyLinks}
                  contactsMissingCompany={contactsMissingCompany}
                  expandedDataIntegrity={expandedDataIntegrity}
                  setExpandedDataIntegrity={setExpandedDataIntegrity}
                  handleOpenCreateContact={handleOpenCreateContact}
                  handleAddContactFromNotInCrm={handleAddContactFromNotInCrm}
                  handlePutOnHold={handlePutOnHold}
                  handleAddToSpam={handleAddToSpam}
                  handleAddCompanyFromDomain={handleAddCompanyFromDomain}
                  handleDomainAction={handleDomainAction}
                  handleAddFromHold={handleAddFromHold}
                  handleSpamFromHold={handleSpamFromHold}
                  handleAddCompanyFromHold={handleAddCompanyFromHold}
                  handleDeleteCompanyFromHold={handleDeleteCompanyFromHold}
                  handleConfirmMergeDuplicate={handleConfirmMergeDuplicate}
                  handleDismissDuplicate={handleDismissDuplicate}
                  handleEditCategoryMissingContact={handleEditCategoryMissingContact}
                  handleHoldCategoryMissingContact={handleHoldCategoryMissingContact}
                  handleDeleteCategoryMissingContact={handleDeleteCategoryMissingContact}
                  handleEditCategoryMissingCompany={handleEditCategoryMissingCompany}
                  handleHoldCategoryMissingCompany={handleHoldCategoryMissingCompany}
                  handleDeleteCategoryMissingCompany={handleDeleteCategoryMissingCompany}
                  handleOpenKeepInTouchModal={handleOpenKeepInTouchModal}
                  handleDoNotKeepInTouch={handleDoNotKeepInTouch}
                  handleLinkContactToCompany={handleLinkContactToCompany}
                  potentialCompanyMatches={potentialCompanyMatches}
                  handleLinkDomainToCompany={handleLinkDomainToCompany}
                  handleDismissPotentialMatch={handleDismissPotentialMatch}
                  handleLinkContactToCompanyByDomain={handleLinkContactToCompanyByDomain}
                  setDataIntegrityContactId={setDataIntegrityContactId}
                  setDataIntegrityModalOpen={setDataIntegrityModalOpen}
                  setCompanyDataIntegrityCompanyId={setCompanyDataIntegrityCompanyId}
                  setCompanyDataIntegrityModalOpen={setCompanyDataIntegrityModalOpen}
                  suggestionsFromMessage={suggestionsFromMessage}
                />
              )}

              {activeActionTab === 'crm' && (
                <CRMTab
                  theme={theme}
                  navigate={navigate}
                  activeTab={activeTab}
                  crmSubTab={crmSubTab}
                  setCrmSubTab={setCrmSubTab}
                  emailContacts={emailContacts}
                  emailCompanies={emailCompanies}
                  holdContacts={holdContacts}
                  profileImageModal={profileImageModal}
                  setDataIntegrityContactId={setDataIntegrityContactId}
                  setDataIntegrityModalOpen={setDataIntegrityModalOpen}
                  handleOpenCreateContact={handleOpenCreateContact}
                  handleAddContactFromNotInCrm={handleAddContactFromNotInCrm}
                  handlePutOnHold={handlePutOnHold}
                  handleAddToSpam={handleAddToSpam}
                  setCompanyDataIntegrityCompanyId={setCompanyDataIntegrityCompanyId}
                  setCompanyDataIntegrityModalOpen={setCompanyDataIntegrityModalOpen}
                  onAddNewContact={() => {
                    setCreateContactEmail({ email: '', name: '', subject: '', body_text: '' });
                    setCreateContactModalOpen(true);
                  }}
                  onAddNewCompany={() => setSearchOrCreateCompanyModalOpen(true)}
                />
              )}
              {activeActionTab === 'deals' && (
                <DealsTab
                  theme={theme}
                  selectedThread={selectedThread}
                  contactDeals={contactDeals}
                  companyDeals={companyDeals}
                  setCreateDealAIOpen={setCreateDealAIOpen}
                  onDeleteDealContact={handleDeleteDealContact}
                  onUpdateDealStage={handleUpdateDealStage}
                />
              )}
              {activeActionTab === 'introductions' && (
                <IntroductionsTab
                  theme={theme}
                  selectedThread={selectedThread}
                  contactIntroductions={contactIntroductions}
                  setIntroductionModalOpen={setIntroductionModalOpen}
                  onEditIntroduction={handleEditIntroduction}
                  onDeleteIntroduction={handleDeleteIntroduction}
                />
              )}
              {activeActionTab === 'tasks' && (
                <TasksTab
                  theme={theme}
                  todoistTasks={todoistTasks}
                  todoistProjects={todoistProjects}
                  loadingTasks={loadingTasks}
                  expandedProjects={expandedProjects}
                  setExpandedProjects={setExpandedProjects}
                  expandedSections={expandedSections}
                  setExpandedSections={setExpandedSections}
                  getProjectColor={getProjectColor}
                  resetTaskForm={resetTaskForm}
                  setTaskModalOpen={setTaskModalOpen}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                  openEditTask={openEditTask}
                />
              )}

              {activeActionTab === 'notes' && (
                <NotesTab
                  theme={theme}
                  contactNotes={contactNotes}
                  loadingNotes={loadingNotes}
                  getNoteTypeIcon={getNoteTypeIcon}
                  resetNoteForm={resetNoteForm}
                  setNoteModalOpen={setNoteModalOpen}
                  openInObsidian={openInObsidian}
                  openEditNote={openEditNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}

            </>
          )}
        </ActionsPanel>
      </MainContent>

      {/* Compose Modal */}
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
        // Task modal
        setTaskModalOpen={setTaskModalOpen}
        // Create Deal AI modal
        setCreateDealAIOpen={setCreateDealAIOpen}
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
                                  .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at)')
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
                    .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at)')
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
                            const { data } = await supabase
                              .from('contacts')
                              .select('contact_id, first_name, last_name')
                              .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                              .limit(8);
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
                          const { data } = await supabase
                            .from('contacts')
                            .select('contact_id, first_name, last_name')
                            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                            .limit(8);
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

      {/* Search/Create Company Modal (for CRM tab Add Company button) */}
      <SearchOrCreateCompanyModal
        isOpen={searchOrCreateCompanyModalOpen}
        onClose={() => setSearchOrCreateCompanyModalOpen(false)}
        theme={theme}
        contactToLink={emailContacts?.find(c => c.contact?.contact_id)?.contact}
        onCompanySelected={(companyId) => {
          // Close search modal and open Company Data Integrity Modal
          setSearchOrCreateCompanyModalOpen(false);
          setCompanyDataIntegrityCompanyId(companyId);
          setCompanyDataIntegrityModalOpen(true);
          // Refresh context contacts to update company info
          if (contextContactsHook?.refetchContacts) {
            setTimeout(() => contextContactsHook.refetchContacts(), 500);
          }
        }}
      />

      {/* Domain Link Modal */}
      <DomainLinkModal
        isOpen={domainLinkModalOpen}
        onRequestClose={() => {
          setDomainLinkModalOpen(false);
          setSelectedDomainForLink(null);
        }}
        domain={selectedDomainForLink?.domain || ''}
        sampleEmails={selectedDomainForLink?.sampleEmails || []}
        theme={theme}
        onDomainLinked={async ({ company, domain }) => {
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
        onClose={() => { setDataIntegrityModalOpen(false); setDataIntegrityContactId(null); }}
        contactId={dataIntegrityContactId}
        theme={theme}
        onRefresh={() => {
          // Refresh emailContacts to update completeness scores
          if (selectedThread && selectedThread.length > 0) {
            // Trigger re-fetch by updating a dependency
            setSelectedThread([...selectedThread]);
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
        }}
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
              .select('deal_id, contact_id, relationship, deals(deal_id, opportunity, stage, category, source_category, description, total_investment, deal_currency, proposed_at, created_at)')
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

      {/* Keep in Touch - Tags Modal */}
      <ManageContactTagsModal
        isOpen={kitTagsModalOpen}
        onClose={() => setKitTagsModalOpen(false)}
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
          }
        }}
      />

      {/* Keep in Touch - City Modal */}
      <ManageContactCitiesModal
        isOpen={kitCityModalOpen}
        onClose={() => setKitCityModalOpen(false)}
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
    </PageContainer>
  );
};

export default CommandCenterPage;

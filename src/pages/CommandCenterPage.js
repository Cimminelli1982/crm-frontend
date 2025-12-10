import React, { useState, useEffect, useRef } from 'react';
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
import { FaEnvelope, FaWhatsapp, FaCalendar, FaChevronLeft, FaChevronRight, FaChevronDown, FaUser, FaBuilding, FaDollarSign, FaStickyNote, FaTimes, FaPaperPlane, FaTrash, FaLightbulb, FaHandshake, FaTasks, FaSave, FaArchive, FaCrown, FaPaperclip, FaRobot, FaCheck, FaCheckCircle, FaImage, FaEdit, FaPlus, FaExternalLinkAlt, FaDownload, FaCopy, FaDatabase, FaExclamationTriangle, FaUserSlash, FaClone, FaUserCheck, FaTag } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import QuickEditModal from '../components/QuickEditModalRefactored';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
import { getVisibleTabs, shouldShowField } from '../helpers/contactListHelpers';
import ProfileImageModal from '../components/modals/ProfileImageModal';
import { useProfileImageModal } from '../hooks/useProfileImageModal';
import CreateContactModalAI from '../components/modals/CreateContactModalAI';
import DomainLinkModal from '../components/modals/DomainLinkModal';
import CreateCompanyModal from '../components/modals/CreateCompanyModal';
import DeleteSkipSpamModal from '../components/DeleteSkipSpamModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import AttachmentSaveModal from '../components/modals/AttachmentSaveModal';
import DataIntegrityModal from '../components/modals/DataIntegrityModal';
import CompanyDataIntegrityModal from '../components/modals/CompanyDataIntegrityModal';
import CreateCompanyFromDomainModal from '../components/modals/CreateCompanyFromDomainModal';
import CreateDealAI from '../components/modals/CreateDealAI';
import { findContactDuplicatesForThread, findCompanyDuplicatesForThread } from '../utils/duplicateDetection';
import DataIntegrityTab from '../components/command-center/DataIntegrityTab';
import ChatTab from '../components/command-center/ChatTab';

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
  const [emails, setEmails] = useState([]);
  const [threads, setThreads] = useState([]); // Grouped by thread_id
  const [selectedThread, setSelectedThread] = useState(null); // Array of emails in thread
  const [listCollapsed, setListCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compose modal state
  const [composeModal, setComposeModal] = useState({ open: false, mode: null }); // mode: 'reply', 'replyAll', 'forward'
  const [composeTo, setComposeTo] = useState([]); // Array of { email, name }
  const [composeCc, setComposeCc] = useState([]); // Array of { email, name }
  const [composeToInput, setComposeToInput] = useState('');
  const [composeCcInput, setComposeCcInput] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'to' or 'cc'
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState([]); // Array of { name, type, size, data (base64), preview }
  const composeFileInputRef = useRef(null);

  // Attachment save modal state
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [saveAndArchiveCallback, setSaveAndArchiveCallback] = useState(null);

  // Spam menu state
  const [spamMenuOpen, setSpamMenuOpen] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState('crm');
  const [crmSubTab, setCrmSubTab] = useState('contacts'); // 'contacts' or 'companies' - sub-menu inside CRM tab

  // Contacts from email (for Contacts tab)
  const [emailContacts, setEmailContacts] = useState([]);

  // Companies from email domains (for Companies tab)
  const [emailCompanies, setEmailCompanies] = useState([]);

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

  // Todoist Tasks state
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [todoistProjects, setTodoistProjects] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDueString, setNewTaskDueString] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('2335921711'); // Inbox
  const [newTaskSectionId, setNewTaskSectionId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({ '2335921711': true }); // Only Inbox expanded by default
  const [expandedSections, setExpandedSections] = useState({}); // { sectionId: true/false }

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalContact, setDeleteModalContact] = useState(null);
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [editCompanyModalCompany, setEditCompanyModalCompany] = useState(null);
  const [loadingDataIntegrity, setLoadingDataIntegrity] = useState(false);
  const [expandedDataIntegrity, setExpandedDataIntegrity] = useState({ notInCrm: true }); // Collapsible sections

  // Domain Link Modal state
  const [domainLinkModalOpen, setDomainLinkModalOpen] = useState(false);
  const [selectedDomainForLink, setSelectedDomainForLink] = useState(null);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [createCompanyInitialDomain, setCreateCompanyInitialDomain] = useState('');

  // Create Company from Domain Modal state
  const [createCompanyFromDomainModalOpen, setCreateCompanyFromDomainModalOpen] = useState(false);
  const [createCompanyFromDomainData, setCreateCompanyFromDomainData] = useState(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImages, setChatImages] = useState([]); // Array of { file, preview, base64 }
  const chatMessagesRef = React.useRef(null);
  const chatFileInputRef = React.useRef(null);

  // Calendar state
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEventEdits, setCalendarEventEdits] = useState({});

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
  };

  const profileImageModal = useProfileImageModal(handleProfileImageUpdate);

  // Group emails by thread_id
  const groupByThread = (emailList) => {
    const threadMap = new Map();

    for (const email of emailList) {
      const threadId = email.thread_id || email.id; // fallback to id if no thread_id
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId).push(email);
    }

    // Sort each thread by date descending (newest first)
    const result = [];
    for (const [threadId, threadEmails] of threadMap) {
      threadEmails.sort((a, b) => new Date(b.date) - new Date(a.date));
      result.push({
        threadId,
        emails: threadEmails,
        latestEmail: threadEmails[0],
        count: threadEmails.length
      });
    }

    // Sort threads by latest email date descending
    result.sort((a, b) => new Date(b.latestEmail.date) - new Date(a.latestEmail.date));
    return result;
  };

  // Fetch emails from Supabase
  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('command_center_inbox')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching emails:', error);
      } else {
        setEmails(data || []);
        const grouped = groupByThread(data || []);
        setThreads(grouped);
        if (grouped.length > 0) {
          setSelectedThread(grouped[0].emails);
        }
      }
      setLoading(false);
    };

    if (activeTab === 'email') {
      fetchEmails();
    }
  }, [activeTab]);

  // State for Create Contact Modal
  const [createContactModalOpen, setCreateContactModalOpen] = useState(false);
  const [createContactEmail, setCreateContactEmail] = useState(null);

  // State for Data Integrity Modal (contacts)
  const [dataIntegrityModalOpen, setDataIntegrityModalOpen] = useState(false);
  const [dataIntegrityContactId, setDataIntegrityContactId] = useState(null);

  // State for Company Data Integrity Modal
  const [companyDataIntegrityModalOpen, setCompanyDataIntegrityModalOpen] = useState(false);
  const [companyDataIntegrityCompanyId, setCompanyDataIntegrityCompanyId] = useState(null);

  // Handle adding email to spam list
  const handleAddToSpam = async (email) => {
    try {
      const emailLower = email.toLowerCase();

      // 1. Add to emails_spam
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

      // 2. Get all emails from this sender (need fastmail_id for archiving)
      const { data: emailsToArchive, error: fetchError } = await supabase
        .from('command_center_inbox')
        .select('id, fastmail_id')
        .ilike('from_email', emailLower);

      if (fetchError) {
        console.error('Error fetching emails to archive:', fetchError);
      }

      // 3. Archive each email in Fastmail
      let archivedCount = 0;
      for (const emailRecord of emailsToArchive || []) {
        if (emailRecord.fastmail_id) {
          try {
            await archiveInFastmail(emailRecord.fastmail_id);
            archivedCount++;
          } catch (archiveErr) {
            console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
          }
        }
      }

      // 4. Delete all emails from this sender from command_center_inbox
      const { data: deletedEmails, error: deleteError } = await supabase
        .from('command_center_inbox')
        .delete()
        .ilike('from_email', emailLower)
        .select('id');

      if (deleteError) {
        console.error('Error deleting from inbox:', deleteError);
      }

      const deletedCount = deletedEmails?.length || 0;

      // 3. Update threads state - remove emails from this sender
      setThreads(prev => {
        const updated = prev.map(thread => ({
          ...thread,
          emails: thread.emails.filter(e => e.from_email?.toLowerCase() !== emailLower)
        })).filter(thread => thread.emails.length > 0);

        return updated.map(t => ({
          ...t,
          latestEmail: t.emails[0]
        }));
      });

      // 4. Clear selected thread if it was from this sender
      setSelectedThread(prev => {
        if (!prev) return null;
        const remaining = prev.filter(e => e.from_email?.toLowerCase() !== emailLower);
        return remaining.length > 0 ? remaining : null;
      });

      // 5. Remove from notInCrmEmails list
      setNotInCrmEmails(prev => prev.filter(item => item.email.toLowerCase() !== emailLower));

      toast.success(`${email} added to spam list${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
    } catch (error) {
      console.error('Error adding to spam:', error);
      toast.error('Failed to add to spam list');
    }
  };

  // Handle putting contact on hold
  const handlePutOnHold = async (item) => {
    try {
      const { error } = await supabase
        .from('contacts_hold')
        .upsert({
          email: item.email.toLowerCase(),
          full_name: item.name || null,
          status: 'pending',
          email_count: 1,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'email',
        });

      if (error) throw error;

      // Remove from list and add to hold list
      setNotInCrmEmails(prev => prev.filter(i => i.email.toLowerCase() !== item.email.toLowerCase()));
      setHoldContacts(prev => [...prev, { email: item.email, full_name: item.name, status: 'pending', email_count: 1 }]);
      toast.success(`${item.name || item.email} put on hold`);
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

  // Handle adding contact from hold to CRM
  const handleAddFromHold = async (contact) => {
    // Find an email involving this contact (from, to, or cc) to get subject/body for AI suggestions
    let emailContent = null;
    for (const thread of threads) {
      const found = thread.emails.find(e => {
        const emailLower = contact.email.toLowerCase();
        // Check if contact is sender
        if (e.from_email?.toLowerCase() === emailLower) return true;
        // Check if contact is in TO recipients
        if (e.to_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
        // Check if contact is in CC recipients
        if (e.cc_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
        return false;
      });
      if (found) {
        emailContent = found;
        break;
      }
    }

    // Open the create contact modal with complete contact data from hold
    setCreateContactEmail({
      email: contact.email,
      name: contact.full_name || contact.first_name,
      hold_id: contact.hold_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      company_name: contact.company_name,
      job_role: contact.job_role,
      subject: emailContent?.subject || '',
      body_text: emailContent?.body_text || emailContent?.snippet || ''
    });
    setCreateContactModalOpen(true);
  };

  // Handle marking contact from hold as spam
  const handleSpamFromHold = async (email) => {
    try {
      const emailLower = email.toLowerCase();

      // 1. Add to spam list
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
      let archivedCount = 0;
      for (const emailRecord of emailsToArchive || []) {
        if (emailRecord.fastmail_id) {
          try {
            await archiveInFastmail(emailRecord.fastmail_id);
            archivedCount++;
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

      // 4. Update threads state - remove emails from this sender
      setThreads(prev => {
        const updated = prev.map(thread => ({
          ...thread,
          emails: thread.emails.filter(e => e.from_email?.toLowerCase() !== emailLower)
        })).filter(thread => thread.emails.length > 0);

        return updated.map(t => ({
          ...t,
          latestEmail: t.emails[0]
        }));
      });

      // 5. Clear selected thread if it was from this sender
      setSelectedThread(prev => {
        if (!prev) return null;
        const remaining = prev.filter(e => e.from_email?.toLowerCase() !== emailLower);
        return remaining.length > 0 ? remaining : null;
      });

      // 6. Update local hold contacts state
      setHoldContacts(prev => prev.filter(c => c.email.toLowerCase() !== emailLower));

      toast.success(`${email} marked as spam${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
    } catch (error) {
      console.error('Error marking as spam from hold:', error);
      toast.error('Failed to mark as spam');
    }
  };

  // Handle opening create contact modal
  const handleOpenCreateContact = (item) => {
    // Find an email involving this contact (from, to, or cc) to get subject/body for AI suggestions
    let emailContent = null;
    for (const thread of threads) {
      const found = thread.emails.find(e => {
        const emailLower = item.email.toLowerCase();
        // Check if contact is sender
        if (e.from_email?.toLowerCase() === emailLower) return true;
        // Check if contact is in TO recipients
        if (e.to_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
        // Check if contact is in CC recipients
        if (e.cc_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
        return false;
      });
      if (found) {
        emailContent = found;
        break;
      }
    }

    setCreateContactEmail({
      ...item,
      subject: emailContent?.subject || '',
      body_text: emailContent?.body_text || emailContent?.snippet || ''
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

  // Fetch Data Integrity data
  const fetchDataIntegrity = async () => {
    setLoadingDataIntegrity(true);

    try {
      // 1. Get participants from selected thread (thread-aware)
      const allInboxEmails = getThreadParticipants(selectedThread);

      // Skip if no thread selected
      if (allInboxEmails.size === 0) {
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
        setLoadingDataIntegrity(false);
        return;
      }

      // Get ALL emails from contact_emails table (Supabase default limit is 1000)
        // We need to paginate to get all ~3000+ emails
        let allCrmEmails = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: crmEmailsBatch, error: crmError } = await supabase
            .from('contact_emails')
            .select('email')
            .range(from, from + pageSize - 1);

          if (crmError) {
            console.error('Error fetching CRM emails:', crmError);
            break;
          }

          if (crmEmailsBatch && crmEmailsBatch.length > 0) {
            allCrmEmails = allCrmEmails.concat(crmEmailsBatch);
            from += pageSize;
            hasMore = crmEmailsBatch.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        // Create a set of normalized emails (lowercase, trimmed)
        const crmEmailSet = new Set(
          allCrmEmails
            .map(e => e.email?.toLowerCase().trim())
            .filter(Boolean)
        );

        // Get emails on hold to exclude from "not in CRM" list
        const { data: holdEmailData } = await supabase
          .from('contacts_hold')
          .select('email')
          .eq('status', 'pending');

        const holdEmailSet = new Set(
          (holdEmailData || [])
            .map(h => h.email?.toLowerCase().trim())
            .filter(Boolean)
        );

        // Find emails not in CRM (and not on hold)
        const notInCrm = [];
        allInboxEmails.forEach((value, key) => {
          const normalizedKey = key.toLowerCase().trim();
          if (!crmEmailSet.has(normalizedKey) && !holdEmailSet.has(normalizedKey)) {
            notInCrm.push(value);
          }
        });

        setNotInCrmEmails(notInCrm);

        // Extract domains from all emails for company check
        // Collect all unique domains from emails (with count)
        const allDomains = new Map(); // domain -> { domain, count, sampleEmails }
        const myDomain = 'cimminelli.com';

        // Common email providers to exclude
        const excludeDomains = new Set([
          'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
          'me.com', 'mac.com', 'aol.com', 'live.com', 'msn.com', 'protonmail.com',
          'proton.me', 'fastmail.com', 'fastmail.fm', 'zoho.com', 'ymail.com',
          'googlemail.com', 'mail.com', 'email.com', 'gmx.com', 'gmx.net',
          myDomain
        ]);

        allInboxEmails.forEach((value, key) => {
          const domain = extractDomainFromEmail(key);
          if (domain && !excludeDomains.has(domain)) {
            if (allDomains.has(domain)) {
              const existing = allDomains.get(domain);
              existing.count++;
              if (existing.sampleEmails.length < 3) {
                existing.sampleEmails.push(value.email);
              }
            } else {
              allDomains.set(domain, {
                domain,
                count: 1,
                sampleEmails: [value.email]
              });
            }
          }
        });

        // Get ALL domains from company_domains table (paginated like contact_emails)
        let allCrmDomains = [];
        let domainFrom = 0;
        let domainHasMore = true;

        while (domainHasMore) {
          const { data: crmDomainsBatch, error: crmDomainError } = await supabase
            .from('company_domains')
            .select('domain')
            .range(domainFrom, domainFrom + pageSize - 1);

          if (crmDomainError) {
            console.error('Error fetching CRM domains:', crmDomainError);
            break;
          }

          if (crmDomainsBatch && crmDomainsBatch.length > 0) {
            allCrmDomains = allCrmDomains.concat(crmDomainsBatch);
            domainFrom += pageSize;
            domainHasMore = crmDomainsBatch.length === pageSize;
          } else {
            domainHasMore = false;
          }
        }

        // Create a set of normalized CRM domains
        const crmDomainSet = new Set(
          allCrmDomains
            .map(d => normalizeDomain(d.domain))
            .filter(Boolean)
        );

        // Get domains on hold to exclude from "not in CRM" list
        const { data: holdDomainsData } = await supabase
          .from('companies_hold')
          .select('domain')
          .eq('status', 'pending');

        const holdDomainSet = new Set(
          (holdDomainsData || [])
            .map(h => normalizeDomain(h.domain))
            .filter(Boolean)
        );

        // Find domains not in CRM (and not on hold)
        const domainsNotInCrm = [];
        allDomains.forEach((value, key) => {
          if (!crmDomainSet.has(key) && !holdDomainSet.has(key)) {
            domainsNotInCrm.push(value);
          }
        });

        // Sort by count (most frequent first)
        domainsNotInCrm.sort((a, b) => b.count - a.count);

        setNotInCrmDomains(domainsNotInCrm);

      // 2. Get contacts on hold - only those that are in the inbox emails
      const { data: holdData, error: holdError } = await supabase
        .from('contacts_hold')
        .select('*')
        .eq('status', 'pending')
        .order('email_count', { ascending: false });

      if (holdError) {
        console.error('Error fetching hold contacts:', holdError);
      } else {
        // Filter to only show hold contacts that exist in inbox emails (from, to, cc)
        const filteredHoldContacts = (holdData || []).filter(contact =>
          contact.email && allInboxEmails.has(contact.email.toLowerCase().trim())
        );
        setHoldContacts(filteredHoldContacts);
      }

      // 2b. Get companies/domains on hold - only those that match thread domains
      const { data: holdCompaniesData, error: holdCompaniesError } = await supabase
        .from('companies_hold')
        .select('*')
        .eq('status', 'pending')
        .order('email_count', { ascending: false });

      if (holdCompaniesError) {
        console.error('Error fetching hold companies:', holdCompaniesError);
      } else {
        // Get thread domains from inbox emails
        const threadDomainsSet = new Set();
        allInboxEmails.forEach((value, key) => {
          const domain = extractDomainFromEmail(key);
          if (domain) threadDomainsSet.add(domain);
        });

        // Filter to only show hold companies whose domain is in thread
        const filteredHoldCompanies = (holdCompaniesData || []).filter(company =>
          company.domain && threadDomainsSet.has(normalizeDomain(company.domain))
        );
        setHoldCompanies(filteredHoldCompanies);
      }

      // 3. Duplicates - HYBRID APPROACH: backend trigger + frontend real-time search
      // A) Read from duplicates_inbox table (backend detected)
      const { data: contactDupsRaw } = await supabase
        .from('duplicates_inbox')
        .select('*')
        .eq('entity_type', 'contact')
        .eq('status', 'pending');

      // B) Get ignored contact duplicates to filter out
      const { data: ignoredContactDups } = await supabase
        .from('contact_duplicates')
        .select('primary_contact_id, duplicate_contact_id')
        .eq('status', 'ignored');

      const ignoredContactPairs = new Set(
        (ignoredContactDups || []).flatMap(d => [
          `${d.primary_contact_id}:${d.duplicate_contact_id}`,
          `${d.duplicate_contact_id}:${d.primary_contact_id}`
        ])
      );

      // C) Frontend real-time search for contact duplicates
      const frontendContactDups = await findContactDuplicatesForThread(allInboxEmails);

      // Merge backend and frontend duplicates
      let allContactDups = [];

      // Process backend duplicates
      if (contactDupsRaw && contactDupsRaw.length > 0) {
        const contactIds = [...new Set(contactDupsRaw.flatMap(d => [d.source_id, d.duplicate_id]))];
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, contact_emails(email)')
          .in('contact_id', contactIds);

        const contactMap = Object.fromEntries((contacts || []).map(c => [c.contact_id, c]));

        const enrichedContactDups = contactDupsRaw.map(d => ({
          ...d,
          source: contactMap[d.source_id],
          duplicate: contactMap[d.duplicate_id],
          detection_source: 'backend'
        }));

        // Filter by thread participants
        const filteredBackendDups = enrichedContactDups.filter(d => {
          const sourceEmails = d.source?.contact_emails?.map(e => e.email?.toLowerCase().trim()) || [];
          const dupEmails = d.duplicate?.contact_emails?.map(e => e.email?.toLowerCase().trim()) || [];
          const allEmails = [...sourceEmails, ...dupEmails];
          return allEmails.some(email => email && allInboxEmails.has(email));
        });

        allContactDups = [...filteredBackendDups];
      }

      // Add frontend duplicates (avoiding duplicates already detected by backend OR already ignored)
      frontendContactDups.forEach(fd => {
        const pairKey1 = `${fd.source_id}:${fd.duplicate_id}`;
        const pairKey2 = `${fd.duplicate_id}:${fd.source_id}`;

        // Skip if already ignored
        if (ignoredContactPairs.has(pairKey1) || ignoredContactPairs.has(pairKey2)) {
          return;
        }

        const alreadyExists = allContactDups.some(bd =>
          (bd.source_id === fd.source_id && bd.duplicate_id === fd.duplicate_id) ||
          (bd.source_id === fd.duplicate_id && bd.duplicate_id === fd.source_id)
        );
        if (!alreadyExists) {
          allContactDups.push({ ...fd, detection_source: 'frontend' });
        }
      });

      setDuplicateContacts(allContactDups);

      // Company duplicates - HYBRID APPROACH
      const { data: companyDupsRaw } = await supabase
        .from('duplicates_inbox')
        .select('*')
        .eq('entity_type', 'company')
        .eq('status', 'pending');

      // Get ignored company duplicates to filter out
      const { data: ignoredCompanyDups } = await supabase
        .from('company_duplicates')
        .select('primary_company_id, duplicate_company_id')
        .eq('status', 'ignored');

      const ignoredCompanyPairs = new Set(
        (ignoredCompanyDups || []).flatMap(d => [
          `${d.primary_company_id}:${d.duplicate_company_id}`,
          `${d.duplicate_company_id}:${d.primary_company_id}`
        ])
      );

      // Get thread domains for filtering
      const threadDomains = getThreadDomains(selectedThread);

      // Frontend real-time search for company duplicates
      const frontendCompanyDups = await findCompanyDuplicatesForThread(threadDomains);

      // Merge backend and frontend duplicates
      let allCompanyDups = [];

      if (companyDupsRaw && companyDupsRaw.length > 0) {
        const companyIds = [...new Set(companyDupsRaw.flatMap(d => [d.source_id, d.duplicate_id]))];
        const { data: companies } = await supabase
          .from('companies')
          .select('company_id, name, category, website, company_domains(domain)')
          .in('company_id', companyIds);

        const companyMap = Object.fromEntries((companies || []).map(c => [c.company_id, c]));

        const enrichedCompanyDups = companyDupsRaw.map(d => ({
          ...d,
          source: companyMap[d.source_id],
          duplicate: companyMap[d.duplicate_id],
          detection_source: 'backend'
        }));

        // Filter by thread domains
        const filteredBackendDups = enrichedCompanyDups.filter(d => {
          const getCompanyDomains = (company) => {
            const domains = [];
            if (company?.website) domains.push(normalizeDomain(company.website));
            (company?.company_domains || []).forEach(cd => {
              if (cd.domain) domains.push(normalizeDomain(cd.domain));
            });
            return domains.filter(Boolean);
          };
          const sourceDomains = getCompanyDomains(d.source);
          const dupDomains = getCompanyDomains(d.duplicate);
          const allDomains = [...sourceDomains, ...dupDomains];
          return allDomains.some(domain => threadDomains.has(domain));
        });

        allCompanyDups = [...filteredBackendDups];
      }

      // Add frontend duplicates (avoiding duplicates already detected by backend OR already ignored)
      frontendCompanyDups.forEach(fd => {
        const pairKey1 = `${fd.source_id}:${fd.duplicate_id}`;
        const pairKey2 = `${fd.duplicate_id}:${fd.source_id}`;

        // Skip if already ignored
        if (ignoredCompanyPairs.has(pairKey1) || ignoredCompanyPairs.has(pairKey2)) {
          return;
        }

        const alreadyExists = allCompanyDups.some(bd =>
          (bd.source_id === fd.source_id && bd.company_id === fd.company_id) ||
          (bd.source_id === fd.company_id && bd.company_id === fd.source_id)
        );
        if (!alreadyExists) {
          allCompanyDups.push({ ...fd, detection_source: 'frontend' });
        }
      });

      setDuplicateCompanies(allCompanyDups);

      // 4. Fetch Incomplete Contacts - completeness_score < 100 AND show_missing != false
      // Optimized approach: Start with thread emails (limited set), find their contacts, then check completeness
      const threadEmailsList = Array.from(allInboxEmails.keys()).slice(0, 500);

      if (threadEmailsList.length > 0) {
        // Get contacts that have emails in the thread
        const { data: contactsInThread, error: contactsInThreadError } = await supabase
          .from('contact_emails')
          .select('contact_id, email, contacts(contact_id, first_name, last_name, show_missing)')
          .in('email', threadEmailsList);

        if (contactsInThreadError) {
          console.error('Error fetching contacts in thread:', contactsInThreadError);
          setIncompleteContacts([]);
        } else {
          // Get unique contacts with show_missing != false
          const validContactsMap = new Map();
          (contactsInThread || []).forEach(ce => {
            if (ce.contacts && ce.contacts.show_missing !== false) {
              if (!validContactsMap.has(ce.contact_id)) {
                validContactsMap.set(ce.contact_id, {
                  contact_id: ce.contact_id,
                  first_name: ce.contacts.first_name,
                  last_name: ce.contacts.last_name,
                  emails: []
                });
              }
              validContactsMap.get(ce.contact_id).emails.push({ email: ce.email });
            }
          });

          if (validContactsMap.size > 0) {
            // Get completeness for these contacts (limited set now)
            const validContactIds = Array.from(validContactsMap.keys());
            const { data: completenessData } = await supabase
              .from('contact_completeness')
              .select('contact_id, completeness_score')
              .in('contact_id', validContactIds)
              .lt('completeness_score', 100);

            // Merge completeness with contact data
            const incompleteList = (completenessData || []).map(c => ({
              ...validContactsMap.get(c.contact_id),
              completeness_score: c.completeness_score
            })).filter(c => c && (c.first_name || c.last_name));

            setIncompleteContacts(incompleteList);
          } else {
            setIncompleteContacts([]);
          }
        }
      } else {
        setIncompleteContacts([]);
      }

      // 4b. Fetch Incomplete Companies - completeness_score < 100 AND show_missing != false
      // Optimized approach: Start with thread domains (limited set), find their companies, then check completeness
      const threadDomainsForCompleteness = new Set();
      allInboxEmails.forEach((value, key) => {
        const domain = extractDomainFromEmail(key);
        if (domain) threadDomainsForCompleteness.add(domain);
      });
      const threadDomainsList = Array.from(threadDomainsForCompleteness).slice(0, 200);

      if (threadDomainsList.length > 0) {
        // Get companies that have domains in the thread
        const { data: companiesInThread, error: companiesInThreadError } = await supabase
          .from('company_domains')
          .select('company_id, domain, companies(company_id, name, show_missing)')
          .in('domain', threadDomainsList);

        if (companiesInThreadError) {
          console.error('Error fetching companies in thread:', companiesInThreadError);
          setIncompleteCompanies([]);
        } else {
          // Get unique companies with show_missing != false
          const validCompaniesMap = new Map();
          (companiesInThread || []).forEach(cd => {
            if (cd.companies && cd.companies.show_missing !== false) {
              if (!validCompaniesMap.has(cd.company_id)) {
                validCompaniesMap.set(cd.company_id, {
                  company_id: cd.company_id,
                  name: cd.companies.name,
                  domains: []
                });
              }
              validCompaniesMap.get(cd.company_id).domains.push({ domain: cd.domain });
            }
          });

          if (validCompaniesMap.size > 0) {
            // Get completeness for these companies (limited set now)
            const validCompanyIds = Array.from(validCompaniesMap.keys());
            const { data: completenessData } = await supabase
              .from('company_completeness')
              .select('company_id, completeness_score')
              .in('company_id', validCompanyIds)
              .lt('completeness_score', 100);

            // Merge completeness with company data
            const incompleteList = (completenessData || []).map(c => ({
              ...validCompaniesMap.get(c.company_id),
              completeness_score: c.completeness_score
            })).filter(c => c && c.name);

            setIncompleteCompanies(incompleteList);
          } else {
            setIncompleteCompanies([]);
          }
        }
      } else {
        setIncompleteCompanies([]);
      }

      // 5. Fetch Category Missing - contacts with category 'Inbox' or 'Not Set' and last_interaction_at after Dec 5
      const { data: catMissingContacts, error: catMissingContactsError } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, category, last_interaction_at, contact_emails(email)')
        .in('category', ['Inbox', 'Not Set'])
        .gt('last_interaction_at', '2025-12-05')
        .order('last_interaction_at', { ascending: false });

      if (catMissingContactsError) {
        console.error('Error fetching category missing contacts:', catMissingContactsError);
        setCategoryMissingContacts([]);
      } else {
        // Filter to only show contacts that have an email in the inbox
        const filteredCatMissing = (catMissingContacts || []).filter(contact =>
          contact.contact_emails?.some(e => e.email && allInboxEmails.has(e.email.toLowerCase().trim()))
        );
        setCategoryMissingContacts(filteredCatMissing);
      }

      // 6. Fetch Category Missing - companies with category 'Inbox' or 'Not Set' AND connected contacts with last_interaction_at after Dec 5
      const { data: catMissingCompaniesRaw, error: catMissingCompaniesError } = await supabase
        .from('companies')
        .select(`
          company_id,
          name,
          category,
          contact_companies!inner(
            contacts!inner(
              last_interaction_at,
              contact_emails(email)
            )
          )
        `)
        .in('category', ['Inbox', 'Not Set'])
        .gt('contact_companies.contacts.last_interaction_at', '2025-12-05');

      if (catMissingCompaniesError) {
        console.error('Error fetching category missing companies:', catMissingCompaniesError);
        setCategoryMissingCompanies([]);
      } else {
        // Filter to only show companies that have at least one contact with an email in the inbox
        const filteredCatMissingCompanies = (catMissingCompaniesRaw || []).filter(company => {
          // Check if any connected contact has an email in the inbox
          return company.contact_companies?.some(cc =>
            cc.contacts?.contact_emails?.some(e =>
              e.email && allInboxEmails.has(e.email.toLowerCase().trim())
            )
          );
        });
        // Deduplicate companies (may appear multiple times if multiple qualifying contacts)
        const catMissingCompanies = filteredCatMissingCompanies.length > 0
          ? [...new Map(filteredCatMissingCompanies.map(c => [c.company_id, { company_id: c.company_id, name: c.name, category: c.category }])).values()]
              .sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setCategoryMissingCompanies(catMissingCompanies);
      }

      // 7. Fetch Keep in Touch Missing - contacts NOT in Hold/Not Set/WhatsApp Group Chat, with keep_in_touch_frequency null or 'Not Set', recent interaction
      const { data: kitMissingContacts, error: kitMissingContactsError } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, category, last_interaction_at, keep_in_touch_frequency, contact_emails(email)')
        .not('category', 'in', '("Inbox","Hold","Skip","Not Set","WhatsApp Group Contact")')
        .or('keep_in_touch_frequency.is.null,keep_in_touch_frequency.eq.Not Set')
        .gt('last_interaction_at', '2025-12-05')
        .order('last_interaction_at', { ascending: false });

      if (kitMissingContactsError) {
        console.error('Error fetching keep in touch missing contacts:', kitMissingContactsError);
        setKeepInTouchMissingContacts([]);
      } else {
        // Filter to only show contacts that have an email in the inbox
        const filteredKitMissing = (kitMissingContacts || []).filter(contact =>
          contact.contact_emails?.some(e => e.email && allInboxEmails.has(e.email.toLowerCase().trim()))
        );
        setKeepInTouchMissingContacts(filteredKitMissing);
      }

      // 8. Find contacts with email domains matching company_domains but not linked via contact_companies
      try {
        // Get all contact emails with contact info
        const { data: contactEmailsData, error: ceError } = await supabase
          .from('contact_emails')
          .select('email, contact_id, contacts(contact_id, first_name, last_name, category)');

        // Get all company domains with company info
        const { data: companyDomainsData, error: cdError } = await supabase
          .from('company_domains')
          .select('domain, company_id, companies(company_id, name)');

        // Get all existing contact_companies links
        const { data: existingLinks, error: elError } = await supabase
          .from('contact_companies')
          .select('contact_id, company_id');

        if (!ceError && !cdError && !elError && contactEmailsData && companyDomainsData) {
          // Create a map of normalized domain -> company info
          const domainToCompany = new Map();
          (companyDomainsData || []).forEach(cd => {
            if (cd.domain && cd.companies) {
              const normalized = normalizeDomain(cd.domain);
              if (normalized) {
                domainToCompany.set(normalized, {
                  company_id: cd.company_id,
                  company_name: cd.companies.name
                });
              }
            }
          });

          // Create a set of existing links for quick lookup
          const existingLinkSet = new Set(
            (existingLinks || []).map(el => `${el.contact_id}:${el.company_id}`)
          );

          // Find contacts whose email domain matches a company but not linked
          const missingLinks = [];
          const seenPairs = new Set(); // Avoid duplicates

          (contactEmailsData || []).forEach(ce => {
            if (!ce.email || !ce.contacts) return;

            const emailDomain = extractDomainFromEmail(ce.email);
            if (!emailDomain) return;

            const matchingCompany = domainToCompany.get(emailDomain);
            if (!matchingCompany) return;

            const pairKey = `${ce.contact_id}:${matchingCompany.company_id}`;

            // Check if this link already exists
            if (!existingLinkSet.has(pairKey) && !seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              missingLinks.push({
                contact_id: ce.contact_id,
                contact_name: `${ce.contacts.first_name || ''} ${ce.contacts.last_name || ''}`.trim(),
                contact_category: ce.contacts.category,
                email: ce.email,
                company_id: matchingCompany.company_id,
                company_name: matchingCompany.company_name,
                domain: emailDomain
              });
            }
          });

          // Filter to only include contacts whose email appears in inbox
          const filteredMissingLinks = missingLinks.filter(item =>
            allInboxEmails.has(item.email.toLowerCase())
          );

          setMissingCompanyLinks(filteredMissingLinks);
        }
      } catch (linkError) {
        console.error('Error finding missing company links:', linkError);
        setMissingCompanyLinks([]);
      }

      // 9. Fetch Contacts Missing Company - contacts in thread with no company linked at all
      try {
        // Get contacts that have emails in the thread
        const threadEmailsForMissingCompany = Array.from(allInboxEmails.keys()).slice(0, 500);

        if (threadEmailsForMissingCompany.length > 0) {
          const { data: contactsWithEmails, error: cwError } = await supabase
            .from('contact_emails')
            .select('contact_id, email, contacts(contact_id, first_name, last_name, category)')
            .in('email', threadEmailsForMissingCompany);

          if (!cwError && contactsWithEmails) {
            // Get unique contacts from thread
            const threadContactsMap = new Map();
            (contactsWithEmails || []).forEach(ce => {
              if (ce.contacts && ce.contact_id) {
                if (!threadContactsMap.has(ce.contact_id)) {
                  threadContactsMap.set(ce.contact_id, {
                    contact_id: ce.contact_id,
                    first_name: ce.contacts.first_name,
                    last_name: ce.contacts.last_name,
                    category: ce.contacts.category,
                    emails: []
                  });
                }
                threadContactsMap.get(ce.contact_id).emails.push(ce.email);
              }
            });

            if (threadContactsMap.size > 0) {
              // Get all contact_companies links for these contacts
              const threadContactIds = Array.from(threadContactsMap.keys());
              const { data: existingCompanyLinks } = await supabase
                .from('contact_companies')
                .select('contact_id')
                .in('contact_id', threadContactIds);

              // Create set of contacts that have company links
              const contactsWithCompany = new Set((existingCompanyLinks || []).map(el => el.contact_id));

              // Filter to contacts that don't have any company linked
              const missingCompanyContacts = Array.from(threadContactsMap.values())
                .filter(c => !contactsWithCompany.has(c.contact_id))
                .sort((a, b) => {
                  const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
                  const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
                  return nameA.localeCompare(nameB);
                });

              setContactsMissingCompany(missingCompanyContacts);
            } else {
              setContactsMissingCompany([]);
            }
          } else {
            setContactsMissingCompany([]);
          }
        } else {
          setContactsMissingCompany([]);
        }
      } catch (missingCompanyError) {
        console.error('Error finding contacts missing company:', missingCompanyError);
        setContactsMissingCompany([]);
      }

    } catch (error) {
      console.error('Error fetching data integrity:', error);
    }
    setLoadingDataIntegrity(false);
  };

  // Reload data integrity when tab becomes active or thread changes
  useEffect(() => {
    if (activeActionTab === 'dataIntegrity') {
      fetchDataIntegrity();
    }
  }, [activeActionTab, selectedThread]);


  // Handler for creating company from domain
  const handleAddCompanyFromDomain = (domainData) => {
    setCreateCompanyFromDomainData(domainData);
    setCreateCompanyFromDomainModalOpen(true);
  };

  const handleCreateCompanyFromDomainSuccess = (newCompanyId) => {
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
          company_id: item.company_id,
          is_primary: !existingPrimary, // Primary if no existing primary
          relationship: 'not_set'
        });

      if (error) throw error;

      // Remove from the list
      setMissingCompanyLinks(prev =>
        prev.filter(link =>
          !(link.contact_id === item.contact_id && link.company_id === item.company_id)
        )
      );

      toast.success(`${item.contact_name} linked to ${item.company_name}`);
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
        // Insert into contact_duplicates with status='ignored' and false_positive=true
        const { error: insertError } = await supabase
          .from('contact_duplicates')
          .insert({
            primary_contact_id: item.source_id,
            duplicate_contact_id: item.duplicate_id,
            status: 'ignored',
            false_positive: true,
            notes: `Dismissed from duplicates_inbox: ${item.match_type || 'manual'} match`
          });

        if (insertError) {
          console.error('Error inserting dismissed contact duplicate:', insertError);
          throw insertError;
        }
      } else {
        // Insert into company_duplicates with status='ignored'
        const { error: insertError } = await supabase
          .from('company_duplicates')
          .insert({
            primary_company_id: item.source_id,
            duplicate_company_id: item.duplicate_id,
            status: 'ignored',
            notes: `Dismissed from duplicates_inbox: ${item.match_type || 'manual'} match`
          });

        if (insertError) {
          console.error('Error inserting dismissed company duplicate:', insertError);
          throw insertError;
        }
      }

      // Delete from duplicates_inbox if it was backend-detected (has real UUID id)
      if (item.detection_source === 'backend' && item.id) {
        await supabase
          .from('duplicates_inbox')
          .delete()
          .eq('id', item.id);

        // Also delete inverse pair
        await supabase
          .from('duplicates_inbox')
          .delete()
          .eq('entity_type', item.entity_type)
          .eq('source_id', item.duplicate_id)
          .eq('duplicate_id', item.source_id);
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
        const { error: insertError } = await supabase
          .from('contact_duplicates')
          .insert({
            primary_contact_id: item.source_id,
            duplicate_contact_id: item.duplicate_id,
            start_trigger: true,
            merge_selections: {
              emails: 'combine',
              mobiles: 'combine',
              companies: 'combine',
              tags: 'combine',
              cities: 'combine'
            },
            notes: `From duplicates_inbox: ${item.match_type} match`
          });

        if (insertError) {
          console.error('Failed to create merge record:', insertError);
          toast.error('Merge failed: ' + insertError.message);
          return;
        }

        toast.success('Contacts merged successfully');
      } else if (item.entity_type === 'company') {
        // COMPANY MERGE: Use company_duplicates table + trigger
        const { error: insertError } = await supabase
          .from('company_duplicates')
          .insert({
            primary_company_id: item.source_id,
            duplicate_company_id: item.duplicate_id,
            start_trigger: true,
            merge_selections: {
              contacts: 'combine',
              domains: 'combine',
              tags: 'combine',
              cities: 'combine'
            },
            notes: `From duplicates_inbox: ${item.match_type} match`
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

      // Delete from decision queue (no longer needs review)
      // Only if it came from duplicates_inbox (has id), not from frontend detection
      if (item.id) {
        const { error: deleteError } = await supabase
          .from('duplicates_inbox')
          .delete()
          .eq('id', item.id);

        if (deleteError) {
          console.error('Failed to delete from inbox:', deleteError);
          // Don't return - merge was initiated, just log the error
        }
      }

      fetchDataIntegrity(); // Refresh the list

    } catch (err) {
      console.error('Merge error:', err);
      toast.error('An error occurred during merge');
    }
  };

  // Run contact audit for a specific contact by ID
  const runContactAuditById = async (contactId, contactName) => {
    if (!contactId) {
      toast.error('No contact to audit');
      return;
    }

    setLoadingAudit(true);
    setAuditResult(null);
    setAuditActions([]);
    setSelectedActions(new Set());
    setActiveActionTab('ai'); // Switch to AI tab to show results

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/audit-contact/${contactId}`);

      if (response.ok) {
        const result = await response.json();
        setAuditResult(result.audit);
        setAuditActions(result.actions || []);
        // Pre-select all recommended actions
        const allIndices = new Set(result.actions?.map((_, i) => i) || []);
        setSelectedActions(allIndices);
        toast.success(`Audit complete for ${contactName}: ${result.action_count} actions found`);
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

  // Fetch Todoist tasks and projects
  const fetchTodoistData = async () => {
    setLoadingTasks(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/todoist/tasks`),
        fetch(`${BACKEND_URL}/todoist/projects`),
      ]);

      if (tasksRes.ok) {
        const { tasks } = await tasksRes.json();
        setTodoistTasks(tasks || []);
      }

      if (projectsRes.ok) {
        const { projects } = await projectsRes.json();
        setTodoistProjects(projects || []);
      }
    } catch (error) {
      console.error('Error fetching Todoist data:', error);
    }
    setLoadingTasks(false);
  };

  // Load Todoist data when tasks tab is active
  useEffect(() => {
    if (activeActionTab === 'tasks' && selectedThread) {
      fetchTodoistData();
    }
  }, [activeActionTab, selectedThread]);

  // Create or update a task
  const handleSaveTask = async () => {
    if (!newTaskContent.trim()) {
      toast.error('Task content is required');
      return;
    }

    setCreatingTask(true);
    try {
      const taskData = {
        content: newTaskContent.trim(),
        description: newTaskDescription.trim(),
        project_id: newTaskProjectId,
        section_id: newTaskSectionId || undefined,
        due_string: newTaskDueString || undefined,
        priority: newTaskPriority,
      };

      let response;
      if (editingTask) {
        response = await fetch(`${BACKEND_URL}/todoist/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
      } else {
        response = await fetch(`${BACKEND_URL}/todoist/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
      }

      if (response.ok) {
        toast.success(editingTask ? 'Task updated!' : 'Task created!');
        setTaskModalOpen(false);
        resetTaskForm();
        // Small delay to let Todoist sync complete before refreshing
        setTimeout(() => fetchTodoistData(), 500);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
    setCreatingTask(false);
  };

  // Complete a task
  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}/close`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Task completed!');
        fetchTodoistData();
      } else {
        toast.error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Task deleted');
        fetchTodoistData();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Reset task form
  const resetTaskForm = () => {
    setNewTaskContent('');
    setNewTaskDescription('');
    setNewTaskDueString('');
    setNewTaskProjectId('2335921711');
    setNewTaskSectionId('');
    setNewTaskPriority(1);
    setEditingTask(null);
  };

  // Open edit mode for a task
  const openEditTask = (task) => {
    setEditingTask(task);
    setNewTaskContent(task.content);
    setNewTaskDescription(task.description || '');
    setNewTaskDueString(task.due?.string || '');
    setNewTaskProjectId(task.project_id);
    setNewTaskSectionId(task.section_id || '');
    setNewTaskPriority(task.priority);
    setTaskModalOpen(true);
  };

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = todoistProjects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  // Get section name by ID
  const getSectionName = (sectionId) => {
    for (const project of todoistProjects) {
      const section = project.sections?.find(s => s.id === sectionId);
      if (section) return section.name;
    }
    return null;
  };

  // Get project color
  const getProjectColor = (projectId) => {
    const project = todoistProjects.find(p => p.id === projectId);
    const colors = {
      'berry_red': '#b8255f',
      'red': '#db4035',
      'orange': '#ff9933',
      'yellow': '#fad000',
      'olive_green': '#afb83b',
      'lime_green': '#7ecc49',
      'green': '#299438',
      'mint_green': '#6accbc',
      'teal': '#158fad',
      'sky_blue': '#14aaf5',
      'light_blue': '#96c3eb',
      'blue': '#4073ff',
      'grape': '#884dff',
      'violet': '#af38eb',
      'lavender': '#eb96eb',
      'magenta': '#e05194',
      'salmon': '#ff8d85',
      'charcoal': '#808080',
      'grey': '#b8b8b8',
      'taupe': '#ccac93',
    };
    return colors[project?.color] || '#808080';
  };

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

  // Fetch contacts when selected thread changes
  useEffect(() => {
    const fetchEmailContacts = async () => {
      if (!selectedThread || selectedThread.length === 0) {
        setEmailContacts([]);
        return;
      }

      // Collect all participants from the thread (from, to, cc) with their role
      const participantsMap = new Map(); // email -> { email, name, roles: Set }

      for (const email of selectedThread) {
        // From
        if (email.from_email) {
          const key = email.from_email.toLowerCase();
          if (!participantsMap.has(key)) {
            participantsMap.set(key, {
              email: email.from_email,
              name: email.from_name || email.from_email,
              roles: new Set()
            });
          }
          participantsMap.get(key).roles.add('from');
        }

        // To
        if (email.to_recipients) {
          email.to_recipients.forEach(r => {
            if (r.email) {
              const key = r.email.toLowerCase();
              if (!participantsMap.has(key)) {
                participantsMap.set(key, {
                  email: r.email,
                  name: r.name || r.email,
                  roles: new Set()
                });
              }
              participantsMap.get(key).roles.add('to');
            }
          });
        }

        // CC
        if (email.cc_recipients) {
          email.cc_recipients.forEach(r => {
            if (r.email) {
              const key = r.email.toLowerCase();
              if (!participantsMap.has(key)) {
                participantsMap.set(key, {
                  email: r.email,
                  name: r.name || r.email,
                  roles: new Set()
                });
              }
              participantsMap.get(key).roles.add('cc');
            }
          });
        }
      }

      const allEmails = Array.from(participantsMap.keys());

      if (allEmails.length === 0) {
        setEmailContacts([]);
        return;
      }

      // Query contact_emails to find matching contacts
      const { data: emailMatches } = await supabase
        .from('contact_emails')
        .select('email, contact_id')
        .in('email', allEmails);

      // Get contact details if we have matches
      let contactsById = {};
      if (emailMatches && emailMatches.length > 0) {
        const contactIds = [...new Set(emailMatches.map(e => e.contact_id))];
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, category, job_role, profile_image_url, description, linkedin, score, birthday, show_missing')
          .in('contact_id', contactIds);

        // Fetch completeness scores for these contacts
        const { data: completenessData } = await supabase
          .from('contact_completeness')
          .select('contact_id, completeness_score')
          .in('contact_id', contactIds);

        const completenessById = {};
        if (completenessData) {
          completenessData.forEach(c => {
            completenessById[c.contact_id] = c.completeness_score;
          });
        }

        // Get companies for these contacts (with domains)
        const { data: contactCompanies } = await supabase
          .from('contact_companies')
          .select('contact_id, company_id, is_primary, companies(company_id, name)')
          .in('contact_id', contactIds);

        // Get company IDs to fetch their domains
        const companyIds = [...new Set((contactCompanies || []).map(cc => cc.company_id).filter(Boolean))];

        // Fetch domains for these companies
        let companyDomains = {};
        if (companyIds.length > 0) {
          const { data: domainsData } = await supabase
            .from('company_domains')
            .select('company_id, domain')
            .in('company_id', companyIds);

          if (domainsData) {
            domainsData.forEach(d => {
              if (!companyDomains[d.company_id]) {
                companyDomains[d.company_id] = [];
              }
              companyDomains[d.company_id].push(d.domain);
            });
          }
        }

        // Map contact to primary company with domains
        const contactToCompany = {};
        if (contactCompanies) {
          contactCompanies.forEach(cc => {
            // Prefer primary, otherwise take first
            if (!contactToCompany[cc.contact_id] || cc.is_primary) {
              contactToCompany[cc.contact_id] = {
                name: cc.companies?.name,
                domains: companyDomains[cc.company_id] || []
              };
            }
          });
        }

        if (contacts) {
          contacts.forEach(c => {
            const companyData = contactToCompany[c.contact_id];
            contactsById[c.contact_id] = {
              ...c,
              company_name: companyData?.name || null,
              company_domains: companyData?.domains || [],
              completeness_score: completenessById[c.contact_id] || 0
            };
          });
        }
      }

      // Build email to contact mapping
      const emailToContact = {};
      if (emailMatches) {
        emailMatches.forEach(em => {
          emailToContact[em.email.toLowerCase()] = contactsById[em.contact_id];
        });
      }

      // Build final list of all participants with contact data if available
      // Exclude my own email
      const myEmail = 'simone@cimminelli.com';
      const allParticipantsRaw = Array.from(participantsMap.values())
        .filter(p => p.email.toLowerCase() !== myEmail.toLowerCase())
        .map(p => {
          const contact = emailToContact[p.email.toLowerCase()];
          return {
            email: p.email,
            name: p.name,
            roles: Array.from(p.roles),
            // Contact data if found
            contact: contact || null,
            hasContact: !!contact
          };
        });

      // Deduplicate by contact_id - merge emails and roles for same contact
      const contactIdMap = new Map(); // contact_id -> merged participant
      const noContactList = []; // participants without a linked contact

      allParticipantsRaw.forEach(p => {
        if (p.contact?.contact_id) {
          const cid = p.contact.contact_id;
          if (contactIdMap.has(cid)) {
            // Merge: add email and roles to existing entry
            const existing = contactIdMap.get(cid);
            existing.allEmails.push(p.email);
            p.roles.forEach(r => {
              if (!existing.roles.includes(r)) existing.roles.push(r);
            });
          } else {
            // First occurrence of this contact
            contactIdMap.set(cid, { ...p, allEmails: [p.email] });
          }
        } else {
          noContactList.push(p);
        }
      });

      const allParticipants = [...contactIdMap.values(), ...noContactList];

      setEmailContacts(allParticipants);
    };

    fetchEmailContacts();
  }, [selectedThread]);

  // Fetch companies from email domains
  useEffect(() => {
    const fetchEmailCompanies = async () => {
      if (!selectedThread || selectedThread.length === 0) {
        setEmailCompanies([]);
        return;
      }

      // Collect all unique domains from emails (excluding my domain)
      const myDomain = 'cimminelli.com';
      const domainsSet = new Set();

      for (const email of selectedThread) {
        // From domain
        if (email.from_email) {
          const domain = email.from_email.split('@')[1]?.toLowerCase();
          if (domain && domain !== myDomain) {
            domainsSet.add(domain);
          }
        }
        // To domains
        if (email.to_recipients) {
          email.to_recipients.forEach(r => {
            if (r.email) {
              const domain = r.email.split('@')[1]?.toLowerCase();
              if (domain && domain !== myDomain) {
                domainsSet.add(domain);
              }
            }
          });
        }
        // CC domains
        if (email.cc_recipients) {
          email.cc_recipients.forEach(r => {
            if (r.email) {
              const domain = r.email.split('@')[1]?.toLowerCase();
              if (domain && domain !== myDomain) {
                domainsSet.add(domain);
              }
            }
          });
        }
      }

      const allDomains = Array.from(domainsSet);
      if (allDomains.length === 0) {
        setEmailCompanies([]);
        return;
      }

      // Query company_domains to find matching companies
      const { data: domainMatches, error: domainError } = await supabase
        .from('company_domains')
        .select('domain, company_id, companies(company_id, name, website, category)')
        .in('domain', allDomains);

      if (domainError) console.error('domainMatches error:', domainError);

      // Build domain to company mapping
      const domainToCompany = {};
      if (domainMatches) {
        domainMatches.forEach(dm => {
          if (dm.companies) {
            domainToCompany[dm.domain.toLowerCase()] = dm.companies;
          }
        });
      }

      // Get contact IDs from email thread
      const contactIds = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => p.contact.contact_id);

      // Get all contact_companies associations for contacts in this thread
      let companyToContacts = {};
      let contactCompaniesData = [];
      if (contactIds.length > 0) {
        const { data, error: ccError } = await supabase
          .from('contact_companies')
          .select('contact_id, company_id, companies(company_id, name, website, category)')
          .in('contact_id', contactIds);
        if (ccError) console.error('contact_companies error:', ccError);
        contactCompaniesData = data || [];

        // Build company to contacts mapping
        contactCompaniesData.forEach(cc => {
          if (!companyToContacts[cc.company_id]) {
            companyToContacts[cc.company_id] = [];
          }
          const contact = emailContacts.find(p => p.contact?.contact_id === cc.contact_id);
          if (contact) {
            companyToContacts[cc.company_id].push({
              name: contact.contact?.first_name + ' ' + contact.contact?.last_name,
              email: contact.email
            });
          }
        });
      }

      // Get all company IDs (from domains + from contact associations)
      const companyIdsFromDomains = Object.values(domainToCompany).map(c => c.company_id).filter(Boolean);
      const companyIdsFromContacts = contactCompaniesData.map(cc => cc.company_id).filter(Boolean);
      const allCompanyIds = [...new Set([...companyIdsFromDomains, ...companyIdsFromContacts])];

      // Get domains for all companies
      let companyDomainsMap = {};
      let companyCompletenessMap = {};
      let companyLogosMap = {};
      if (allCompanyIds.length > 0) {
        const { data: domainsData } = await supabase
          .from('company_domains')
          .select('company_id, domain')
          .in('company_id', allCompanyIds);

        if (domainsData) {
          domainsData.forEach(d => {
            if (!companyDomainsMap[d.company_id]) {
              companyDomainsMap[d.company_id] = [];
            }
            companyDomainsMap[d.company_id].push(d.domain);
          });
        }

        // Fetch completeness scores for companies
        const { data: completenessData } = await supabase
          .from('company_completeness')
          .select('company_id, completeness_score')
          .in('company_id', allCompanyIds);

        if (completenessData) {
          completenessData.forEach(c => {
            companyCompletenessMap[c.company_id] = c.completeness_score;
          });
        }

        // Fetch company logos
        const { data: logosData } = await supabase
          .from('company_attachments')
          .select(`
            company_id,
            attachments (
              file_url,
              permanent_url
            )
          `)
          .in('company_id', allCompanyIds)
          .eq('is_logo', true);

        if (logosData) {
          logosData.forEach(logo => {
            if (logo.attachments) {
              companyLogosMap[logo.company_id] = logo.attachments.permanent_url || logo.attachments.file_url;
            }
          });
        }
      }

      // Build final companies list
      const seenCompanyIds = new Set();
      const companiesResult = [];

      // First add companies from domains
      // Collect all domains that belong to known companies
      const domainsWithCompanies = new Set();
      Object.values(companyDomainsMap).forEach(domainsList => {
        domainsList.forEach(d => domainsWithCompanies.add(d));
      });

      // Common email providers to hide
      const hiddenDomains = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com']);

      allDomains.forEach(domain => {
        // Skip common email providers
        if (hiddenDomains.has(domain.toLowerCase())) return;

        const company = domainToCompany[domain];
        if (company && !seenCompanyIds.has(company.company_id)) {
          seenCompanyIds.add(company.company_id);
          companiesResult.push({
            domain,
            domains: companyDomainsMap[company.company_id] || [domain],
            company,
            hasCompany: true,
            contacts: companyToContacts[company.company_id] || [],
            completeness_score: companyCompletenessMap[company.company_id] || 0,
            logo_url: companyLogosMap[company.company_id] || null
          });
        } else if (!company && !domainsWithCompanies.has(domain)) {
          // Domain not in CRM and not belonging to any known company - skip showing "+ Add"
          // Only show if we want to suggest creating a new company for unknown domains
          // For now, skip these to avoid showing domains that belong to already-shown companies
        }
      });

      // Then add companies from contact associations (not already added)
      contactCompaniesData.forEach(cc => {
        if (cc.companies && !seenCompanyIds.has(cc.companies.company_id)) {
          seenCompanyIds.add(cc.companies.company_id);
          companiesResult.push({
            domain: companyDomainsMap[cc.company_id]?.[0] || null,
            domains: companyDomainsMap[cc.company_id] || [],
            company: cc.companies,
            hasCompany: true,
            contacts: companyToContacts[cc.company_id] || [],
            completeness_score: companyCompletenessMap[cc.company_id] || 0,
            logo_url: companyLogosMap[cc.company_id] || null
          });
        }
      });

      setEmailCompanies(companiesResult);
    };

    fetchEmailCompanies();
  }, [selectedThread, emailContacts]);

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

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clear chat when thread changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [selectedThread]);

  // Build email context for Claude
  const buildEmailContext = () => {
    if (!selectedThread || selectedThread.length === 0) return '';

    const threadSubject = selectedThread[0].subject?.replace(/^(Re: |Fwd: )+/i, '');
    const participants = emailContacts.map(p => {
      const name = p.contact ? `${p.contact.first_name} ${p.contact.last_name}` : p.name;
      const role = p.contact?.job_role ? ` (${p.contact.job_role})` : '';
      const company = p.contact?.company_name ? ` at ${p.contact.company_name}` : '';
      return `- ${name}${role}${company}: ${p.email}`;
    }).join('\n');

    const emailsText = selectedThread.map(email => {
      const sender = email.from_email?.toLowerCase() === MY_EMAIL ? 'Me' : (email.from_name || email.from_email);
      const date = new Date(email.date).toLocaleString();
      const body = email.body_text || email.snippet || '';
      return `[${date}] From ${sender}:\n${body}`;
    }).join('\n\n---\n\n');

    return `
EMAIL THREAD CONTEXT:
Subject: ${threadSubject}

Participants:
${participants}

Email Thread (${selectedThread.length} messages):
${emailsText}
`;
  };

  // Build instruction for duplicate processing
  const buildDuplicateMCPInstruction = () => {
    const instruction = `Help me clean up duplicate contacts using your CRM tools.

1. First, use crm_find_duplicate_contacts with method="pending_queue" to see pending duplicates
2. For each pair, use crm_compare_contacts to show me a side-by-side comparison
3. I'll tell you which one to keep as primary
4. Use crm_merge_contacts with dry_run=true first to preview changes
5. If I approve, run crm_merge_contacts with dry_run=false to execute
6. If not duplicates, use crm_mark_not_duplicate

Let's start - show me the pending duplicates queue.`;

    return instruction;
  };

  // Send MCP duplicate instruction to chat
  const sendDuplicateMCPInstruction = () => {
    const instruction = buildDuplicateMCPInstruction();
    sendMessageToClaude(instruction);
  };

  // Handle image file selection for chat
  const handleChatImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error('Please select image files');
      return;
    }

    // Convert to base64
    const newImages = await Promise.all(imageFiles.map(async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
          resolve({
            file,
            preview: URL.createObjectURL(file),
            base64,
            mediaType: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setChatImages(prev => [...prev, ...newImages]);
    e.target.value = ''; // Reset input
  };

  // Remove image from chat attachments
  const removeChatImage = (index) => {
    setChatImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Send message to Claude
  const sendMessageToClaude = async (message, { hideUserMessage = false } = {}) => {
    if (!message.trim() && chatImages.length === 0) return;

    // Build message content (text + images for Claude API)
    let userContent;
    const hasImages = chatImages.length > 0;

    if (hasImages) {
      // Multi-part content with images
      userContent = [];

      // Add images first
      chatImages.forEach(img => {
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.base64
          }
        });
      });

      // Add text
      if (message.trim()) {
        userContent.push({
          type: 'text',
          text: message
        });
      }
    } else {
      userContent = message;
    }

    // Add user message to chat (for display) - skip if hideUserMessage is true
    if (!hideUserMessage) {
      const userMessageDisplay = {
        role: 'user',
        content: message,
        images: chatImages.map(img => img.preview) // Store previews for display
      };
      setChatMessages(prev => [...prev, userMessageDisplay]);
    }
    setChatInput('');
    setChatImages([]); // Clear images
    setChatLoading(true);

    try {
      const emailContext = buildEmailContext();
      const systemPrompt = `You are Simone Cimminelli's AI assistant for email management.

TONE & STYLE:
- Be direct and concise. No fluff, no corporate speak.
- Friendly but professional. Like talking to a smart colleague.
- Use short sentences. Get to the point fast.
- When drafting replies: warm, personal, efficient. Never robotic.
- Italian-style warmth when appropriate (natural, not forced).

RESPONSE FORMAT:
- Summaries: Max 2-3 bullet points. Just the essentials.
- Actions: One clear recommendation. Maybe a second option.
- Drafts: Keep them short. Real humans don't write essays in emails.
- Key points: List format, 3-5 items max.
- IMPORTANT: When writing draft emails, ALWAYS wrap the draft text between --- markers like this:
---
Your draft email text here
---
This format is required so the user can click "Accept & Edit" to use the draft.

CONTEXT - Simone runs a newsletter business and is an investor. He values:
- Building genuine relationships
- Clear communication
- Getting things done efficiently
- Personal touch over corporate formality

${emailContext}`;

      // Build messages for API
      const apiMessages = [...chatMessages, { role: 'user', content: userContent }].map(m => {
        // If message has images array (from previous messages), reconstruct content
        if (m.images && m.images.length > 0) {
          // Previous messages with images - just send text for now (images already processed)
          return { role: m.role, content: m.content };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Claude');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle quick action clicks - hide the prompt, show only the response
  const handleQuickAction = (action) => {
    sendMessageToClaude(action, { hideUserMessage: true });
  };

  // Handle calendar extraction from email
  const handleCalendarExtract = async () => {
    if (!selectedThread || selectedThread.length === 0) {
      toast.error('No email selected');
      return;
    }

    const email = selectedThread[0];
    setCalendarLoading(true);
    setPendingCalendarEvent(null);
    setCalendarEventEdits({});

    // Add a user message to chat
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: '📅 Extract meeting from this email'
    }]);

    try {
      const response = await fetch(`${BACKEND_URL}/calendar/extract-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
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
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: '🤔 No meeting found in this email. Is there something specific you\'d like to schedule?'
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
        location: calendarEventEdits.location || pendingCalendarEvent.location || '',
        startDate: calendarEventEdits.datetime || pendingCalendarEvent.datetime,
        attendees: pendingCalendarEvent.attendees || [],
        reminders: [15], // 15 min before
      };

      if (!eventData.startDate) {
        toast.error('Please specify a date and time');
        setCalendarLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/calendar/create-event`, {
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
        toast.success('📅 Event created and invites sent!');
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Event created!**\n\n**${eventData.title}**\n📆 ${new Date(eventData.startDate).toLocaleString('it-IT')}\n${eventData.location ? `📍 ${eventData.location}\n` : ''}${eventData.attendees?.length > 0 ? `\n📧 Invites sent to: ${eventData.attendees.map(a => a.email).join(', ')}` : ''}`
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

  // Format recipients array to string
  const formatRecipients = (recipients) => {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return null;
    return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', ');
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
            last_interaction: interactionDate
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

  // Get the latest email in selected thread
  const getLatestEmail = () => {
    if (!selectedThread || selectedThread.length === 0) return null;
    return selectedThread[0];
  };

  // Email signature
  const EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter: https://www.angelinvesting.it/
Website: https://www.cimminelli.com/
LinkedIn: https://www.linkedin.com/in/cimminelli/

Build / Buy / Invest in
internet businesses.`;

  // Open compose modal for reply
  const openReply = (replyAll = false) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const mode = replyAll ? 'replyAll' : 'reply';
    const myEmail = 'simone@cimminelli.com';
    const isSentByMe = latestEmail.from_email?.toLowerCase() === myEmail.toLowerCase();

    // Determine To recipients as array
    let toRecipients = [];
    if (isSentByMe && latestEmail.to_recipients?.length > 0) {
      // If I sent it, reply to original recipients
      toRecipients = latestEmail.to_recipients.map(r => ({ email: r.email, name: r.name || '' }));
    } else {
      toRecipients = [{ email: latestEmail.from_email, name: latestEmail.from_name || '' }];
    }

    // Get CC recipients for Reply All (excluding myself)
    let ccRecipients = [];
    if (replyAll) {
      // Add other TO recipients (excluding myself and the sender who goes in TO)
      if (!isSentByMe && latestEmail.to_recipients?.length > 0) {
        const otherToRecipients = latestEmail.to_recipients
          .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
          .map(r => ({ email: r.email, name: r.name || '' }));
        ccRecipients = [...ccRecipients, ...otherToRecipients];
      }
      // Add original CC recipients
      if (latestEmail.cc_recipients?.length > 0) {
        const originalCcRecipients = latestEmail.cc_recipients
          .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
          .map(r => ({ email: r.email, name: r.name || '' }));
        ccRecipients = [...ccRecipients, ...originalCcRecipients];
      }
    }

    const subject = latestEmail.subject?.startsWith('Re:')
      ? latestEmail.subject
      : `Re: ${latestEmail.subject}`;

    setComposeTo(toRecipients);
    setComposeCc(ccRecipients);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody('\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `On ${new Date(latestEmail.date).toLocaleString()}, ${latestEmail.from_name || latestEmail.from_email} wrote:\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode });
  };

  // Open reply modal with AI-drafted text
  const openReplyWithDraft = (draftText) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const myEmail = 'simone@cimminelli.com';
    const isSentByMe = latestEmail.from_email?.toLowerCase() === myEmail.toLowerCase();

    // Determine To recipients as array
    let toRecipients = [];
    if (isSentByMe && latestEmail.to_recipients?.length > 0) {
      toRecipients = latestEmail.to_recipients.map(r => ({ email: r.email, name: r.name || '' }));
    } else {
      toRecipients = [{ email: latestEmail.from_email, name: latestEmail.from_name || '' }];
    }

    // Get CC recipients (including other TO recipients and original CC, excluding myself)
    let ccRecipients = [];
    // Add other TO recipients (excluding myself and the sender who goes in TO)
    if (!isSentByMe && latestEmail.to_recipients?.length > 0) {
      const otherToRecipients = latestEmail.to_recipients
        .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
        .map(r => ({ email: r.email, name: r.name || '' }));
      ccRecipients = [...ccRecipients, ...otherToRecipients];
    }
    // Add original CC recipients
    if (latestEmail.cc_recipients?.length > 0) {
      const originalCcRecipients = latestEmail.cc_recipients
        .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
        .map(r => ({ email: r.email, name: r.name || '' }));
      ccRecipients = [...ccRecipients, ...originalCcRecipients];
    }

    const subject = latestEmail.subject?.startsWith('Re:')
      ? latestEmail.subject
      : `Re: ${latestEmail.subject}`;

    setComposeTo(toRecipients);
    setComposeCc(ccRecipients);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody(draftText + '\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `On ${new Date(latestEmail.date).toLocaleString()}, ${latestEmail.from_name || latestEmail.from_email} wrote:\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode: 'reply' });
  };

  // Extract draft text from Claude's response
  const extractDraftFromMessage = (content) => {
    // Look for text between --- markers (common draft format)
    const draftMatch = content.match(/---\n([\s\S]*?)\n---/);
    if (draftMatch) {
      return draftMatch[1].trim();
    }

    // Look for Subject: followed by content
    const subjectMatch = content.match(/\*\*Subject:\*\*.*?\n\n---\n([\s\S]*?)\n---/);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }

    return null;
  };

  // Check if message contains a draft reply
  const hasDraftReply = (content) => {
    return content.includes('---\n') &&
           (content.toLowerCase().includes('ciao') ||
            content.toLowerCase().includes('simone') ||
            content.toLowerCase().includes('thanks') ||
            content.toLowerCase().includes('send it?') ||
            content.toLowerCase().includes('draft'));
  };

  // Open compose modal for forward
  const openForward = () => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const subject = latestEmail.subject?.startsWith('Fwd:')
      ? latestEmail.subject
      : `Fwd: ${latestEmail.subject}`;

    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody('\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `---------- Forwarded message ----------\n` +
      `From: ${latestEmail.from_name || ''} <${latestEmail.from_email}>\n` +
      `Date: ${new Date(latestEmail.date).toLocaleString()}\n` +
      `Subject: ${latestEmail.subject}\n` +
      `To: ${formatRecipients(latestEmail.to_recipients) || ''}\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode: 'forward' });
  };

  // Close compose modal
  const closeCompose = () => {
    setComposeModal({ open: false, mode: null });
    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject('');
    setComposeBody('');
    setContactSuggestions([]);
    setActiveField(null);
    setComposeAttachments([]);
  };

  // Handle file selection for attachments
  const handleComposeFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newAttachments = await Promise.all(files.map(async (file) => {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove data:xxx;base64, prefix
        reader.readAsDataURL(file);
      });
      return {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: base64,
      };
    }));

    setComposeAttachments(prev => [...prev, ...newAttachments]);
    // Reset input so same file can be selected again
    if (composeFileInputRef.current) {
      composeFileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeComposeAttachment = (index) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Search contacts in Supabase for autocomplete
  const searchContacts = async (query) => {
    if (!query || query.length < 2) {
      setContactSuggestions([]);
      return;
    }

    try {
      // Search by email directly in contact_emails table
      const { data: emailMatches, error: emailError } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contacts (
            contact_id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .ilike('email', `%${query}%`)
        .limit(8);

      if (emailError) throw emailError;

      // Also search by name in contacts and get their emails
      const { data: nameMatches, error: nameError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          profile_image_url,
          contact_emails (email)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(8);

      if (nameError) throw nameError;

      // Transform email matches to flat structure
      const emailSuggestions = (emailMatches || [])
        .filter(item => item.contacts)
        .map(item => ({
          id: item.contacts.contact_id,
          first_name: item.contacts.first_name,
          last_name: item.contacts.last_name,
          email: item.email,
          profile_image_url: item.contacts.profile_image_url
        }));

      // Transform name matches - expand to one entry per email
      const nameSuggestions = (nameMatches || []).flatMap(contact => {
        const emails = contact.contact_emails || [];
        if (emails.length === 0) return [];
        return emails.map(e => ({
          id: contact.contact_id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: e.email,
          profile_image_url: contact.profile_image_url
        }));
      });

      // Combine and deduplicate by email
      const allSuggestions = [...emailSuggestions, ...nameSuggestions];
      const uniqueByEmail = allSuggestions.filter((item, index, self) =>
        index === self.findIndex(t => t.email === item.email)
      );

      setContactSuggestions(uniqueByEmail.slice(0, 8));
    } catch (error) {
      console.error('Error searching contacts:', error);
      setContactSuggestions([]);
    }
  };

  // Add email to To or CC
  const addEmailToField = (field, contact) => {
    const email = typeof contact === 'string' ? contact : contact.email;
    const name = typeof contact === 'string' ? '' : `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

    if (field === 'to') {
      if (!composeTo.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeTo([...composeTo, { email, name }]);
      }
      setComposeToInput('');
    } else {
      if (!composeCc.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeCc([...composeCc, { email, name }]);
      }
      setComposeCcInput('');
    }
    setContactSuggestions([]);
  };

  // Remove email from To or CC
  const removeEmailFromField = (field, email) => {
    if (field === 'to') {
      setComposeTo(composeTo.filter(r => r.email !== email));
    } else {
      setComposeCc(composeCc.filter(r => r.email !== email));
    }
  };

  // Handle input keydown for adding emails
  const handleEmailInputKeyDown = (e, field) => {
    const input = field === 'to' ? composeToInput : composeCcInput;

    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, '');
      if (trimmed && trimmed.includes('@')) {
        addEmailToField(field, trimmed);
      }
    } else if (e.key === 'Backspace' && !input) {
      // Remove last email if backspace on empty input
      if (field === 'to' && composeTo.length > 0) {
        setComposeTo(composeTo.slice(0, -1));
      } else if (field === 'cc' && composeCc.length > 0) {
        setComposeCc(composeCc.slice(0, -1));
      }
    }
  };

  // Send email
  const handleSend = async () => {
    if (composeTo.length === 0 || !composeBody.trim()) {
      toast.error('Please fill in recipient and message');
      return;
    }

    const latestEmail = getLatestEmail();
    if (!latestEmail) {
      toast.error('No email selected');
      return;
    }

    setSending(true);

    try {
      // Get just the body text (before the quote separator)
      const bodyText = composeBody.split('─'.repeat(40))[0].trim();

      // Use /send endpoint directly for full control
      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc.length > 0 ? composeCc : undefined,
          subject: composeSubject,
          textBody: bodyText,
          inReplyTo: composeModal.mode !== 'forward' ? latestEmail.fastmail_id : undefined,
          references: composeModal.mode !== 'forward' ? latestEmail.fastmail_id : undefined,
          attachments: composeAttachments.length > 0 ? composeAttachments.map(a => ({
            name: a.name,
            type: a.type,
            data: a.data,
          })) : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Email sent! Saving to CRM and archiving...');
      closeCompose();

      // Auto-save to CRM and archive after sending reply
      await saveAndArchive();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
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

  // Check for attachments and show modal before saving
  const handleDoneClick = () => {
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
      // Show attachment modal
      setPendingAttachments(allAttachments);
      setAttachmentModalOpen(true);
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

  // Save & Archive - save email to CRM tables and archive in Fastmail
  const saveAndArchive = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    setSaving(true);
    const errors = [];
    const logs = [];

    const log = (step, message, data = null) => {
      const entry = { step, message, data, timestamp: new Date().toISOString() };
      logs.push(entry);
      console.log(`[SaveArchive] ${step}: ${message}`, data || '');
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

          // 9. Remove from command_center_inbox
          try {
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
          } catch (deleteError) {
            log('ERROR', 'Delete operation failed', deleteError.message);
            errors.push({ step: 'delete', error: deleteError.message });
          }

          // Track this email as successfully saved
          successfullySavedEmails.push(email.id);
        } else {
          log('SKIP_ARCHIVE', 'Skipping archive/cleanup due to CRM save failure', { emailId: email.id });
        }
      }

      // Update local state - only remove successfully saved emails
      if (successfullySavedEmails.length > 0) {
        const processedIds = new Set(successfullySavedEmails);
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
      } else {
        log('STATE_UPDATE', 'No emails were successfully saved - keeping all in local state');
      }

      log('COMPLETE', `Finished with ${errors.length} errors, ${successfullySavedEmails.length} saved`);

      if (successfullySavedEmails.length === 0) {
        console.error('[SaveArchive] All saves failed:', errors);
        toast.error('Failed to save - emails not archived');
      } else if (errors.length > 0) {
        console.error('[SaveArchive] Errors:', errors);
        toast.success(`Saved & Archived ${successfullySavedEmails.length} emails (${errors.length} warnings)`);
      } else {
        toast.success('Saved & Archived successfully');
      }

    } catch (error) {
      log('FATAL', 'Unexpected error', error.message);
      errors.push({ step: 'fatal', error: error.message });
      console.error('[SaveArchive] Fatal error:', error);
      console.error('[SaveArchive] Logs:', logs);
      toast.error('Failed to Save & Archive');
    } finally {
      setSaving(false);
      // Log summary to console for debugging
      console.log('[SaveArchive] Complete log:', logs);
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

  const tabs = [
    { id: 'email', label: 'Email', icon: FaEnvelope, count: emails.length, hasUnread: hasUnreadEmails },
    { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, count: 0, hasUnread: false },
    { id: 'calendar', label: 'Calendar', icon: FaCalendar, count: 0, hasUnread: false },
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
            {!listCollapsed && <span>Inbox</span>}
            <CollapseButton theme={theme} onClick={() => setListCollapsed(!listCollapsed)}>
              {listCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </CollapseButton>
          </ListHeader>

          {!listCollapsed && (
            <EmailList>
              {loading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : threads.length === 0 ? (
                <EmptyState theme={theme}></EmptyState>
              ) : (
                threads.map(thread => (
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
              )}
            </EmailList>
          )}

          {!listCollapsed && threads.length > 0 && (
            <PendingCount theme={theme}>
              {threads.length} threads ({emails.length} emails)
            </PendingCount>
          )}
        </EmailListPanel>

        {/* Center: Email Content */}
        <EmailContentPanel theme={theme}>
          {selectedThread && selectedThread.length > 0 ? (
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
                <button
                  onClick={handleDoneClick}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: saving
                      ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
                      : (theme === 'light' ? '#10B981' : '#059669'),
                    color: 'white',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    opacity: saving ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.background = theme === 'light' ? '#059669' : '#047857';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.background = theme === 'light' ? '#10B981' : '#059669';
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaArchive size={14} />
                      Done
                    </>
                  )}
                </button>
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
                const showReplyAll = isSentByMe ? (toCount + ccCount > 1) : (ccCount > 0);

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
        <ActionsPanel theme={theme}>
          <ActionsPanelTabs theme={theme}>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'chat'} onClick={() => setActiveActionTab('chat')} title="Chat with Claude">
              <FaRobot />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'dataIntegrity'} onClick={() => setActiveActionTab('dataIntegrity')} title="Data Integrity">
              <FaDatabase />
            </ActionTabIcon>
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
          </ActionsPanelTabs>

          {selectedThread && selectedThread.length > 0 && (
            <>
              {activeActionTab === 'chat' && (
                <ChatTab
                  theme={theme}
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
                <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Audit Button */}
                  {!auditResult && !loadingAudit && (
                    <div style={{ marginBottom: '12px' }}>
                      <button
                        onClick={runContactAudit}
                        disabled={!selectedThread || selectedThread.length === 0}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: selectedThread ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#374151'),
                          color: selectedThread ? 'white' : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
                          border: 'none',
                          borderRadius: '8px',
                          cursor: selectedThread ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <FaRobot /> Run Contact Audit
                      </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingAudit && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      <FaRobot size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Running audit...</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>Checking contact, duplicates, company...</div>
                    </div>
                  )}

                  {/* Audit Results */}
                  {auditResult && !loadingAudit && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Contact Header */}
                      <div style={{
                        padding: '12px',
                        background: theme === 'light' ? '#F9FAFB' : '#111827',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                            {auditResult.contact?.name || 'Unknown Contact'}
                          </div>
                          <button
                            onClick={() => { setAuditResult(null); setAuditActions([]); setSelectedActions(new Set()); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#6B7280' : '#9CA3AF', padding: '4px' }}
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                        {/* Completeness Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>Completeness:</div>
                          <div style={{ flex: 1, height: '8px', background: theme === 'light' ? '#E5E7EB' : '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${auditResult.contact?.completeness_score || 0}%`,
                              height: '100%',
                              background: (auditResult.contact?.completeness_score || 0) >= 70 ? '#10B981' : (auditResult.contact?.completeness_score || 0) >= 40 ? '#F59E0B' : '#EF4444',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                            {auditResult.contact?.completeness_score || 0}%
                          </div>
                        </div>
                        {/* Missing Fields */}
                        {auditResult.contact?.missing_fields?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {auditResult.contact.missing_fields.map((field, i) => (
                              <span key={i} style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                                color: theme === 'light' ? '#B91C1C' : '#FCA5A5',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}>
                                missing: {field}
                              </span>
                            ))}
                          </div>
                        )}
                        {auditResult.contact?.found === false && (
                          <div style={{ marginTop: '8px', padding: '6px 10px', background: '#FEF3C7', borderRadius: '4px', fontSize: '12px', color: '#92400E' }}>
                            ⚠️ Contact not found in CRM - will create new
                          </div>
                        )}
                      </div>

                      {/* Email Action */}
                      {auditResult.email_action?.action !== 'none' && (
                        <div style={{
                          padding: '10px 12px',
                          background: theme === 'light' ? '#DBEAFE' : '#1E3A5F',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          fontSize: '13px',
                          color: theme === 'light' ? '#1E40AF' : '#93C5FD'
                        }}>
                          <strong>Email:</strong> {auditResult.email_action?.action === 'add' ? `Add ${auditResult.email_action?.email}` : auditResult.email_action?.reason}
                        </div>
                      )}

                      {/* Duplicates */}
                      {auditResult.contact_duplicates?.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Duplicates ({auditResult.contact_duplicates.length})
                          </div>
                          {auditResult.contact_duplicates.map((dup, i) => (
                            <div key={i} style={{
                              padding: '8px 10px',
                              background: theme === 'light' ? '#FEF2F2' : '#1C1917',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              fontSize: '12px',
                              border: `1px solid ${theme === 'light' ? '#FECACA' : '#7F1D1D'}`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: theme === 'light' ? '#111827' : '#F9FAFB', fontWeight: 500 }}>{dup.name}</span>
                                <span style={{ color: '#EF4444', fontSize: '11px', textTransform: 'uppercase' }}>{dup.action}</span>
                              </div>
                              <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }}>
                                {dup.reason} {dup.data_to_preserve?.length > 0 && `(preserve: ${dup.data_to_preserve.join(', ')})`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mobiles Section */}
                      {auditResult.mobiles && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Mobiles ({auditResult.mobiles.current?.length || 0}) {auditResult.mobiles.issues?.length > 0 && <span style={{ color: '#F59E0B' }}>• {auditResult.mobiles.issues.length} issue{auditResult.mobiles.issues.length > 1 ? 's' : ''}</span>}
                          </div>
                          {/* Current Mobiles */}
                          {auditResult.mobiles.current?.map((mobile, i) => (
                            <div key={i} style={{
                              padding: '6px 10px',
                              background: theme === 'light' ? '#F9FAFB' : '#111827',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              fontSize: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{mobile.number}</span>
                              <span style={{
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                background: theme === 'light' ? '#E5E7EB' : '#374151',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {mobile.type} {mobile.is_primary && '• PRIMARY'}
                              </span>
                            </div>
                          ))}
                          {/* Mobile Issues */}
                          {auditResult.mobiles.issues?.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              {auditResult.mobiles.issues.map((issue, i) => (
                                <div key={i} style={{
                                  padding: '8px 10px',
                                  background: theme === 'light' ? '#FFFBEB' : '#1C1917',
                                  borderRadius: '6px',
                                  marginBottom: '4px',
                                  fontSize: '12px',
                                  border: `1px solid ${theme === 'light' ? '#FCD34D' : '#92400E'}`
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: theme === 'light' ? '#111827' : '#F9FAFB', fontWeight: 500 }}>{issue.number}</span>
                                    <span style={{ color: '#F59E0B', fontSize: '11px', textTransform: 'uppercase' }}>{issue.action}</span>
                                  </div>
                                  <div style={{ color: theme === 'light' ? '#92400E' : '#FCD34D', marginTop: '2px' }}>
                                    {issue.reason}
                                    {issue.suggested_type && (
                                      <span style={{ fontWeight: 600 }}> → {issue.suggested_type}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Company */}
                      {auditResult.company && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Company {auditResult.company.issues?.length > 0 && <span style={{ color: '#F59E0B' }}>• {auditResult.company.issues.length} issue{auditResult.company.issues.length > 1 ? 's' : ''}</span>}
                          </div>
                          <div style={{
                            padding: '10px 12px',
                            background: auditResult.company.action === 'link'
                              ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                              : auditResult.company.action === 'skip'
                                ? (theme === 'light' ? '#F3F4F6' : '#1F2937')
                                : (theme === 'light' ? '#F0FDF4' : '#14532D'),
                            borderRadius: '6px',
                            fontSize: '12px',
                            border: `1px solid ${auditResult.company.action === 'link'
                              ? '#3B82F6'
                              : auditResult.company.action === 'skip'
                                ? (theme === 'light' ? '#E5E7EB' : '#374151')
                                : (theme === 'light' ? '#86EFAC' : '#166534')}`
                          }}>
                            {auditResult.company.action === 'link' ? (
                              <div>
                                <div style={{ color: theme === 'light' ? '#1E40AF' : '#93C5FD', fontWeight: 600, marginBottom: '4px' }}>
                                  <FaBuilding style={{ marginRight: '6px' }} />
                                  Suggest Link: {auditResult.company.name}
                                </div>
                                <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '11px' }}>
                                  Company found by email domain but not yet linked
                                </div>
                              </div>
                            ) : auditResult.company.action === 'skip' ? (
                              <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                <FaBuilding style={{ marginRight: '6px', opacity: 0.5 }} />
                                {auditResult.company.reason || 'No company suggestion'}
                              </div>
                            ) : auditResult.company.linked ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ color: theme === 'light' ? '#166534' : '#86EFAC', fontWeight: 600 }}>
                                    <FaBuilding style={{ marginRight: '6px' }} />
                                    {auditResult.company.name}
                                  </span>
                                  <span style={{ color: '#10B981', fontSize: '10px', textTransform: 'uppercase', background: theme === 'light' ? '#D1FAE5' : '#064E3B', padding: '2px 6px', borderRadius: '4px' }}>
                                    ✓ Linked
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                <FaBuilding style={{ marginRight: '6px', opacity: 0.5 }} />
                                No company linked
                              </div>
                            )}
                            {/* Company Issues */}
                            {auditResult.company.issues?.length > 0 && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}` }}>
                                {auditResult.company.issues.map((issue, i) => (
                                  <div key={i} style={{
                                    color: '#F59E0B',
                                    padding: '4px 8px',
                                    background: theme === 'light' ? '#FFFBEB' : '#1C1917',
                                    borderRadius: '4px',
                                    marginTop: '4px',
                                    fontSize: '11px'
                                  }}>
                                    ⚠️ {issue.field}: <code style={{ background: theme === 'light' ? '#FEF3C7' : '#78350F', padding: '1px 4px', borderRadius: '2px' }}>{issue.current}</code> → <code style={{ background: theme === 'light' ? '#D1FAE5' : '#064E3B', padding: '1px 4px', borderRadius: '2px' }}>{issue.fix}</code>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Company Duplicates */}
                      {auditResult.company_duplicates?.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Company Duplicates
                          </div>
                          {auditResult.company_duplicates.map((dup, i) => (
                            <div key={i} style={{
                              padding: '8px 10px',
                              background: theme === 'light' ? '#FEF2F2' : '#1C1917',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              fontSize: '12px'
                            }}>
                              Merge "{dup.name}" into {dup.into}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Deals */}
                      {auditResult.deals?.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            <FaDollarSign style={{ marginRight: '4px' }} /> Deals ({auditResult.deals.length})
                          </div>
                          {auditResult.deals.map((deal, i) => (
                            <div key={i} style={{
                              padding: '6px 10px',
                              background: theme === 'light' ? '#EDE9FE' : '#4C1D95',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              fontSize: '12px',
                              color: theme === 'light' ? '#5B21B6' : '#DDD6FE'
                            }}>
                              {deal.name || 'Unnamed deal'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Introductions */}
                      {auditResult.introductions?.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            <FaHandshake style={{ marginRight: '4px' }} /> Introductions ({auditResult.introductions.length})
                          </div>
                          {auditResult.introductions.map((intro, i) => (
                            <div key={i} style={{
                              padding: '6px 10px',
                              background: theme === 'light' ? '#FEF3C7' : '#78350F',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              fontSize: '12px',
                              color: theme === 'light' ? '#92400E' : '#FDE68A'
                            }}>
                              {intro.text || 'Introduction record'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Communication Analysis */}
                      {auditResult.communication && (
                        <div style={{
                          padding: '10px 12px',
                          background: theme === 'light' ? '#F3F4F6' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Email Analysis
                          </div>
                          <div style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              marginRight: '8px',
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              background: auditResult.communication.type === 'business'
                                ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                                : auditResult.communication.type === 'transactional'
                                  ? (theme === 'light' ? '#F3F4F6' : '#374151')
                                  : (theme === 'light' ? '#FCE7F3' : '#831843'),
                              color: auditResult.communication.type === 'business'
                                ? (theme === 'light' ? '#1E40AF' : '#93C5FD')
                                : auditResult.communication.type === 'transactional'
                                  ? (theme === 'light' ? '#6B7280' : '#9CA3AF')
                                  : (theme === 'light' ? '#9D174D' : '#F9A8D4')
                            }}>
                              {auditResult.communication.type}
                            </span>
                            {auditResult.communication.involves_deal && (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', marginRight: '8px', fontSize: '11px', background: '#10B981', color: 'white' }}>
                                💰 Deal
                              </span>
                            )}
                            {auditResult.communication.involves_intro && (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#F59E0B', color: 'white' }}>
                                🤝 Intro
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: '6px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '11px' }}>
                            {auditResult.communication.summary}
                          </div>
                        </div>
                      )}

                      {/* Actions List */}
                      {auditActions.length > 0 && (
                        <div style={{ marginTop: 'auto' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Actions ({selectedActions.size}/{auditActions.length} selected)
                          </div>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                            {auditActions.map((action, i) => (
                              <div
                                key={i}
                                onClick={() => toggleActionSelection(i)}
                                style={{
                                  padding: '8px 10px',
                                  background: selectedActions.has(i)
                                    ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                                    : (theme === 'light' ? '#FFFFFF' : '#1F2937'),
                                  border: `1px solid ${selectedActions.has(i) ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#374151')}`,
                                  borderRadius: '6px',
                                  marginBottom: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '4px',
                                  border: `2px solid ${selectedActions.has(i) ? '#3B82F6' : (theme === 'light' ? '#D1D5DB' : '#4B5563')}`,
                                  background: selectedActions.has(i) ? '#3B82F6' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {selectedActions.has(i) && <FaCheck size={10} color="white" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                                    {action.description}
                                  </div>
                                  <div style={{ fontSize: '10px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase' }}>
                                    {action.type}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Execute Button */}
                          <button
                            onClick={executeSelectedActions}
                            disabled={executingActions || selectedActions.size === 0}
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: selectedActions.size > 0 ? '#10B981' : (theme === 'light' ? '#E5E7EB' : '#374151'),
                              color: selectedActions.size > 0 ? 'white' : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
                              border: 'none',
                              borderRadius: '8px',
                              cursor: selectedActions.size > 0 ? 'pointer' : 'not-allowed',
                              fontSize: '14px',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            {executingActions ? 'Executing...' : `Execute ${selectedActions.size} Action${selectedActions.size !== 1 ? 's' : ''}`}
                          </button>
                        </div>
                      )}

                      {/* No Actions */}
                      {auditActions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          <FaCheck size={20} style={{ marginBottom: '8px', color: '#10B981' }} />
                          <div style={{ fontSize: '12px' }}>No actions needed</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No email selected */}
                  {!selectedThread && !loadingAudit && !auditResult && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      <FaRobot size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <div style={{ fontSize: '12px' }}>Select an email to run audit</div>
                    </div>
                  )}
                </div>
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
                  setDataIntegrityContactId={setDataIntegrityContactId}
                  setDataIntegrityModalOpen={setDataIntegrityModalOpen}
                  setCompanyDataIntegrityCompanyId={setCompanyDataIntegrityCompanyId}
                  setCompanyDataIntegrityModalOpen={setCompanyDataIntegrityModalOpen}
                />
              )}

              {activeActionTab === 'crm' && (
                <>
                  {/* Sub-menu tabs for Contacts / Companies */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    margin: '8px',
                    background: theme === 'light' ? '#E5E7EB' : '#1F2937',
                    borderRadius: '6px',
                    padding: '2px'
                  }}>
                    <button
                      onClick={() => setCrmSubTab('contacts')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: crmSubTab === 'contacts'
                          ? (theme === 'light' ? '#FFFFFF' : '#374151')
                          : 'transparent',
                        color: crmSubTab === 'contacts'
                          ? (theme === 'light' ? '#111827' : '#F9FAFB')
                          : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                        boxShadow: crmSubTab === 'contacts' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <FaUser size={12} /> Contacts ({emailContacts.length})
                    </button>
                    <button
                      onClick={() => setCrmSubTab('companies')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: crmSubTab === 'companies'
                          ? (theme === 'light' ? '#FFFFFF' : '#374151')
                          : 'transparent',
                        color: crmSubTab === 'companies'
                          ? (theme === 'light' ? '#111827' : '#F9FAFB')
                          : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                        boxShadow: crmSubTab === 'companies' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <FaBuilding size={12} /> Companies ({emailCompanies.length})
                    </button>
                  </div>

                  {/* Contacts Sub-Tab Content */}
                  {crmSubTab === 'contacts' && (
                    <>
                      {emailContacts.length > 0 ? (
                        <>
                          {/* All contacts in single list with role inline */}
                          {emailContacts.map((participant, idx) => {
                            const score = participant.contact?.completeness_score || 0;
                            const isMarkedComplete = participant.contact?.show_missing === false;
                            const circumference = 2 * Math.PI * 16;
                            const strokeDashoffset = isMarkedComplete ? 0 : circumference - (score / 100) * circumference;
                            const scoreColor = isMarkedComplete ? '#F59E0B' : (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444');
                            // Get the primary role to display (from > to > cc)
                            const primaryRole = participant.roles?.includes('from') ? 'From' : participant.roles?.includes('to') ? 'To' : participant.roles?.includes('cc') ? 'CC' : '';
                            // Check if contact is on hold
                            const isOnHold = holdContacts.some(h => h.email?.toLowerCase() === participant.email?.toLowerCase());
                            return (
                            <ActionCard key={participant.email + idx} theme={theme} style={isOnHold ? { borderLeft: '3px solid #F59E0B' } : {}}>
                              <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{ cursor: participant.contact ? 'pointer' : 'default' }}
                                  onClick={() => participant.contact && profileImageModal.openModal(participant.contact)}
                                  title={participant.contact ? 'Edit profile image' : ''}
                                >
                                  {participant.contact?.profile_image_url ? (
                                    <img src={participant.contact.profile_image_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                      {participant.contact ? `${participant.contact.first_name?.[0] || ''}${participant.contact.last_name?.[0] || ''}` : participant.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                                <div
                                  style={{ flex: 1, cursor: participant.contact ? 'pointer' : 'default' }}
                                  onClick={() => participant.contact && navigate(`/contact/${participant.contact.contact_id}`)}
                                >
                                  <div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {participant.contact ? `${participant.contact.first_name} ${participant.contact.last_name}` : participant.name}
                                    {isOnHold && (
                                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 600, textTransform: 'uppercase' }}>Hold</span>
                                    )}
                                  </div>
                                  {(participant.contact?.job_role || participant.contact?.company_name) && (
                                    <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                                      {participant.contact.job_role}{participant.contact.job_role && participant.contact.company_name && ' @ '}{participant.contact.company_name}
                                    </div>
                                  )}
                                </div>
                                {participant.contact && (
                                  <div style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }} title={isMarkedComplete ? 'Marked complete' : `${score}% complete`} onClick={() => { setDataIntegrityContactId(participant.contact.contact_id); setDataIntegrityModalOpen(true); }}>
                                    <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={scoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                                    </svg>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                      {(isMarkedComplete || score === 100) ? <FaCrown size={14} color="#F59E0B" /> : `${score}%`}
                                    </div>
                                  </div>
                                )}
                              </ActionCardHeader>
                              <ActionCardContent theme={theme}>
                                <div style={{ fontSize: '13px', marginBottom: '8px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                  <span style={{ fontWeight: 700 }}>{primaryRole}:</span> <span style={{ fontWeight: 400 }}>{participant.email}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {participant.contact?.category && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{participant.contact.category}</span>
                                  )}
                                  {!participant.hasContact && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenCreateContact({ email: participant.email, name: participant.name }); }}
                                        title="Add to CRM"
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '11px',
                                          fontWeight: 500,
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          background: '#10B981',
                                          color: 'white'
                                        }}
                                      >
                                        Add
                                      </button>
                                      {!isOnHold && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handlePutOnHold({ email: participant.email, name: participant.name }); }}
                                          title="Put on Hold"
                                          style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            background: '#F59E0B',
                                            color: 'white'
                                          }}
                                        >
                                          Hold
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleAddToSpam(participant.email); }}
                                        title="Mark as Spam"
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '11px',
                                          fontWeight: 500,
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          background: '#EF4444',
                                          color: 'white'
                                        }}
                                      >
                                        Spam
                                      </button>
                                    </>
                                  )}
                                  {participant.contact && (
                                    <span
                                      onClick={(e) => { e.stopPropagation(); runContactAuditById(participant.contact.contact_id, `${participant.contact.first_name} ${participant.contact.last_name}`); }}
                                      style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#DBEAFE' : '#1E3A5F', color: theme === 'light' ? '#1D4ED8' : '#93C5FD', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <FaRobot size={10} /> Audit
                                    </span>
                                  )}
                                </div>
                              </ActionCardContent>
                            </ActionCard>
                          )})}
                        </>
                      ) : (
                        <ActionCard theme={theme}>
                          <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                            Select a thread to see participants
                          </ActionCardContent>
                        </ActionCard>
                      )}
                    </>
                  )}

                  {/* Companies Sub-Tab Content */}
                  {crmSubTab === 'companies' && (
                    <>
                      {emailCompanies.length > 0 ? (
                        <>
                          {emailCompanies.map((item, idx) => {
                            const companyScore = item.completeness_score || 0;
                            const companyCircumference = 2 * Math.PI * 16;
                            const companyStrokeDashoffset = companyCircumference - (companyScore / 100) * companyCircumference;
                            const companyScoreColor = companyScore >= 70 ? '#10B981' : companyScore >= 40 ? '#F59E0B' : '#EF4444';
                            return (
                          <ActionCard
                            key={item.domain + idx}
                            theme={theme}
                            style={{ cursor: item.company?.company_id ? 'pointer' : 'default' }}
                            onClick={() => item.company?.company_id && navigate(`/company/${item.company.company_id}`)}
                          >
                            <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', overflow: 'hidden' }}>
                                {item.logo_url ? (
                                  <img src={item.logo_url} alt={item.company?.name || 'Company'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  item.company?.name ? item.company.name.substring(0, 2).toUpperCase() : item.domain?.substring(0, 2).toUpperCase() || '?'
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                  {item.company?.name || item.domain}
                                </div>
                                {item.contacts?.length > 0 && (
                                  <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                                    {item.contacts.map(c => c.name).join(', ')}
                                  </div>
                                )}
                              </div>
                              {item.hasCompany && (
                                <div
                                  style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }}
                                  title={`${companyScore}% complete - Click to edit`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCompanyDataIntegrityCompanyId(item.company.company_id);
                                    setCompanyDataIntegrityModalOpen(true);
                                  }}
                                >
                                  <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                                    <circle cx="20" cy="20" r="16" fill="none" stroke={companyScoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={companyCircumference} strokeDashoffset={companyStrokeDashoffset} />
                                  </svg>
                                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                    {companyScore === 100 ? <FaCrown size={14} color="#F59E0B" /> : `${companyScore}%`}
                                  </div>
                                </div>
                              )}
                            </ActionCardHeader>
                            <ActionCardContent theme={theme}>
                              <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                                {item.domains?.length > 0 ? item.domains.join(', ') : item.domain || 'No domain'}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {item.company?.category && (
                                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{item.company.category}</span>
                                )}
                                {!item.hasCompany && (
                                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#FEF3C7' : '#78350F', color: theme === 'light' ? '#92400E' : '#FDE68A', cursor: 'pointer' }}>+ Add</span>
                                )}
                              </div>
                            </ActionCardContent>
                          </ActionCard>
                          )})}
                        </>
                      ) : (
                        <ActionCard theme={theme}>
                          <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                            Select a thread to see companies
                          </ActionCardContent>
                        </ActionCard>
                      )}
                    </>
                  )}
                </>
              )}

              {activeActionTab === 'deals' && (
                <>
                  {/* Add New Deal Button - AI Assisted */}
                  <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => setCreateDealAIOpen(true)}>
                    <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                      <FaRobot style={{ color: '#8B5CF6' }} />
                      <span style={{ fontWeight: 600 }}>New Deal from Email</span>
                    </ActionCardContent>
                  </ActionCard>

                  {/* From Contacts Section */}
                  {contactDeals.length > 0 && (
                    <>
                      <div style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        From Contacts
                      </div>
                      {contactDeals.map(deal => (
                        <ActionCard key={deal.deal_id} theme={theme}>
                          <ActionCardHeader theme={theme} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FaDollarSign style={{ color: '#10B981' }} /> {deal.opportunity || 'Untitled Deal'}
                            </span>
                            <span style={{ display: 'flex', gap: '4px' }}>
                              {deal.category && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: theme === 'light' ? '#F3F4F6' : '#374151',
                                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                                  fontWeight: 500
                                }}>
                                  {deal.category}
                                </span>
                              )}
                              {deal.source_category && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: deal.source_category === 'Introduction' ? '#FEE2E2' : '#DBEAFE',
                                  color: deal.source_category === 'Introduction' ? '#DC2626' : '#1D4ED8',
                                  fontWeight: 500
                                }}>
                                  {deal.source_category === 'Introduction' ? 'Intro' : 'Cold'}
                                </span>
                              )}
                            </span>
                          </ActionCardHeader>
                          <ActionCardContent theme={theme}>
                            <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                              {deal.stage || 'No stage'} {(deal.proposed_at || deal.created_at) && `• ${new Date(deal.proposed_at || deal.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                            </div>
                            {deal.total_investment && (
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>
                                {deal.deal_currency === 'EUR' ? '€' : deal.deal_currency === 'GBP' ? '£' : deal.deal_currency === 'PLN' ? 'zł' : '$'}{deal.total_investment.toLocaleString()}
                              </div>
                            )}
                            {deal.description && (
                              <div style={{ fontSize: '12px', color: theme === 'light' ? '#4B5563' : '#D1D5DB', marginTop: '6px', lineHeight: '1.4' }}>
                                {deal.description.length > 360 ? deal.description.substring(0, 360) + '...' : deal.description}
                              </div>
                            )}
                            {deal.contacts && deal.contacts.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {deal.contacts.map(c => (
                                  <div key={c.contact_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    <span>{c.name} <span style={{ opacity: 0.7 }}>({c.relationship})</span></span>
                                    <FaTrash
                                      size={10}
                                      style={{ cursor: 'pointer', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginLeft: '8px' }}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        // Delete the association
                                        const { error } = await supabase
                                          .from('deals_contacts')
                                          .delete()
                                          .eq('deal_id', deal.deal_id)
                                          .eq('contact_id', c.contact_id);
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
                                          } else {
                                            setContactDeals([]);
                                          }
                                        }
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                      onMouseLeave={e => e.currentTarget.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </ActionCardContent>
                        </ActionCard>
                      ))}
                    </>
                  )}

                  {/* From Companies Section */}
                  {companyDeals.length > 0 && (
                    <>
                      <div style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        From Companies
                      </div>
                      {companyDeals.map(deal => (
                        <ActionCard key={deal.deal_id} theme={theme}>
                          <ActionCardHeader theme={theme} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FaDollarSign style={{ color: '#8B5CF6' }} /> {deal.opportunity || 'Untitled Deal'}
                            </span>
                            <span style={{ display: 'flex', gap: '4px' }}>
                              {deal.category && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: theme === 'light' ? '#F3F4F6' : '#374151',
                                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                                  fontWeight: 500
                                }}>
                                  {deal.category}
                                </span>
                              )}
                              {deal.source_category && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: deal.source_category === 'Introduction' ? '#FEE2E2' : '#DBEAFE',
                                  color: deal.source_category === 'Introduction' ? '#DC2626' : '#1D4ED8',
                                  fontWeight: 500
                                }}>
                                  {deal.source_category === 'Introduction' ? 'Intro' : 'Cold'}
                                </span>
                              )}
                            </span>
                          </ActionCardHeader>
                          <ActionCardContent theme={theme}>
                            <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                              {deal.stage || 'No stage'} {(deal.proposed_at || deal.created_at) && `• ${new Date(deal.proposed_at || deal.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                            </div>
                            {deal.total_investment && (
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#8B5CF6' }}>
                                {deal.deal_currency === 'EUR' ? '€' : deal.deal_currency === 'GBP' ? '£' : deal.deal_currency === 'PLN' ? 'zł' : '$'}{deal.total_investment.toLocaleString()}
                              </div>
                            )}
                            {deal.description && (
                              <div style={{ fontSize: '12px', color: theme === 'light' ? '#4B5563' : '#D1D5DB', marginTop: '6px', lineHeight: '1.4' }}>
                                {deal.description.length > 360 ? deal.description.substring(0, 360) + '...' : deal.description}
                              </div>
                            )}
                            {deal.companyName && (
                              <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '4px' }}>
                                via {deal.companyName}
                              </div>
                            )}
                          </ActionCardContent>
                        </ActionCard>
                      ))}
                    </>
                  )}

                  {/* Empty State - only show when no deals at all */}
                  {contactDeals.length === 0 && companyDeals.length === 0 && selectedThread && (
                    <ActionCard theme={theme}>
                      <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
                        No deals linked to these contacts
                      </ActionCardContent>
                    </ActionCard>
                  )}
                </>
              )}

              {activeActionTab === 'introductions' && (
                <>
                  {/* Add New Introduction Button - Always visible */}
                  <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => setIntroductionModalOpen(true)}>
                    <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                      <FaHandshake style={{ color: '#F59E0B' }} />
                      <span style={{ fontWeight: 600 }}>Add New Introduction</span>
                    </ActionCardContent>
                  </ActionCard>

                  {/* Related Introductions Section */}
                  {contactIntroductions.length > 0 && (
                    <>
                      <div style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Related
                      </div>
                      {contactIntroductions.map(intro => {
                        const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
                        const person1 = introducees[0]?.name || 'Unknown';
                        const person2 = introducees[1]?.name || 'Unknown';
                        return (
                        <ActionCard key={intro.introduction_id} theme={theme}>
                          <ActionCardHeader theme={theme}>
                            <FaHandshake style={{ color: '#F59E0B' }} />
                            {person1} ↔ {person2}
                          </ActionCardHeader>
                          <ActionCardContent theme={theme}>
                            <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                              {intro.status || 'No status'} {intro.introduction_tool ? `• ${intro.introduction_tool}` : ''}
                            </div>
                            {intro.introduction_date && (
                              <div style={{ fontSize: '12px', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                                {new Date(intro.introduction_date).toLocaleDateString()}
                              </div>
                            )}
                            {intro.text && (
                              <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '4px', fontStyle: 'italic' }}>
                                "{intro.text.substring(0, 80)}{intro.text.length > 80 ? '...' : ''}"
                              </div>
                            )}
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setEditingIntroduction(intro);
                                  setIntroductionStatus(intro.status || 'Requested');
                                  setIntroductionTool(intro.introduction_tool || 'email');
                                  setIntroductionCategory(intro.category || 'Karma Points');
                                  setIntroductionText(intro.text || '');
                                  const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
                                  setSelectedIntroducee(introducees[0] || null);
                                  setSelectedIntroducee2(introducees[1] || null);
                                  setIntroductionModalOpen(true);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  background: theme === 'light' ? '#E5E7EB' : '#374151',
                                  color: theme === 'light' ? '#374151' : '#D1D5DB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <FaEdit size={10} /> Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Delete this introduction?')) return;
                                  const { error } = await supabase
                                    .from('introductions')
                                    .delete()
                                    .eq('introduction_id', intro.introduction_id);
                                  if (!error) {
                                    setContactIntroductions(prev => prev.filter(i => i.introduction_id !== intro.introduction_id));
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                                  color: theme === 'light' ? '#DC2626' : '#FCA5A5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <FaTrash size={10} /> Delete
                              </button>
                            </div>
                          </ActionCardContent>
                        </ActionCard>
                      );
                      })}
                    </>
                  )}

                  {/* Empty State - only show when no introductions at all */}
                  {contactIntroductions.length === 0 && selectedThread && (
                    <ActionCard theme={theme}>
                      <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
                        No introductions linked to these contacts
                      </ActionCardContent>
                    </ActionCard>
                  )}
                </>
              )}

              {activeActionTab === 'tasks' && (
                <>
                  {/* Add New Task Button - matches Introduction style */}
                  <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => {
                    resetTaskForm();
                    setTaskModalOpen(true);
                  }}>
                    <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                      <FaTasks style={{ color: '#10B981' }} />
                      <span style={{ fontWeight: 600 }}>Add New Task</span>
                    </ActionCardContent>
                  </ActionCard>

                  {/* Loading State */}
                  {loadingTasks && (
                    <ActionCard theme={theme}>
                      <ActionCardContent theme={theme} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading tasks...
                      </ActionCardContent>
                    </ActionCard>
                  )}

                  {/* Tasks List */}
                  {!loadingTasks && todoistTasks.length === 0 && (
                    <ActionCard theme={theme}>
                      <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                        No tasks yet
                      </ActionCardContent>
                    </ActionCard>
                  )}

                  {/* Grouped Tasks by Project > Section */}
                  {!loadingTasks && todoistProjects.map(project => {
                    const projectTasks = todoistTasks.filter(t => t.project_id === project.id);
                    if (projectTasks.length === 0) return null;

                    const isProjectExpanded = expandedProjects[project.id] === true; // default collapsed
                    const projectColor = getProjectColor(project.id);

                    // Group tasks by section
                    const tasksBySection = {};
                    const noSectionTasks = [];
                    projectTasks.forEach(task => {
                      if (task.section_id) {
                        if (!tasksBySection[task.section_id]) tasksBySection[task.section_id] = [];
                        tasksBySection[task.section_id].push(task);
                      } else {
                        noSectionTasks.push(task);
                      }
                    });

                    return (
                      <div key={project.id} style={{ marginBottom: '8px' }}>
                        {/* Project Header */}
                        <div
                          onClick={() => setExpandedProjects(prev => ({ ...prev, [project.id]: !isProjectExpanded }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: theme === 'light' ? '#F3F4F6' : '#374151',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            marginBottom: isProjectExpanded ? '4px' : '0',
                          }}
                        >
                          <FaChevronDown
                            style={{
                              transform: isProjectExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                              transition: 'transform 0.2s',
                              fontSize: '10px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}
                          />
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: projectColor,
                            flexShrink: 0
                          }} />
                          <span style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: theme === 'light' ? '#111827' : '#F9FAFB'
                          }}>
                            {project.name}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                            marginLeft: 'auto'
                          }}>
                            {projectTasks.length}
                          </span>
                        </div>

                        {/* Project Content */}
                        {isProjectExpanded && (
                          <div style={{ paddingLeft: '8px' }}>
                            {/* No-section tasks */}
                            {noSectionTasks.map(task => (
                              <ActionCard key={task.id} theme={theme} style={{ marginLeft: '8px' }}>
                                <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      border: `2px solid ${task.priority === 4 ? '#dc3545' : task.priority === 3 ? '#fd7e14' : task.priority === 2 ? '#ffc107' : '#6c757d'}`,
                                      flexShrink: 0,
                                      marginTop: '2px',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => handleCompleteTask(task.id)}
                                    title="Complete task"
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{task.content}</div>
                                    {task.description && (
                                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                                        {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                                      </div>
                                    )}
                                  </div>
                                </ActionCardHeader>
                                <ActionCardContent theme={theme} style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {task.due && (
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      background: new Date(task.due.date) < new Date() ? '#dc354520' : '#6c757d20',
                                      color: new Date(task.due.date) < new Date() ? '#dc3545' : (theme === 'light' ? '#6c757d' : '#9CA3AF'),
                                    }}>
                                      {task.due.string || task.due.date}
                                    </span>
                                  )}
                                </ActionCardContent>
                                <ActionCardButtons>
                                  <SmallBtn theme={theme} onClick={() => openEditTask(task)}><FaEdit /></SmallBtn>
                                  <SmallBtn theme={theme} onClick={() => window.open(task.url, '_blank')} title="Open in Todoist"><FaExternalLinkAlt /></SmallBtn>
                                  <SmallBtn theme={theme} $variant="success" onClick={() => handleCompleteTask(task.id)} title="Complete"><FaCheck /></SmallBtn>
                                  <SmallBtn theme={theme} $variant="danger" onClick={() => handleDeleteTask(task.id)} title="Delete"><FaTrash /></SmallBtn>
                                </ActionCardButtons>
                              </ActionCard>
                            ))}

                            {/* Sections - sorted with Recurring always last */}
                            {project.sections && [...project.sections].sort((a, b) => {
                              if (a.name === 'Recurring') return 1;
                              if (b.name === 'Recurring') return -1;
                              return a.order - b.order;
                            }).map(section => {
                              const sectionTasks = tasksBySection[section.id] || [];
                              if (sectionTasks.length === 0) return null;

                              const isSectionExpanded = expandedSections[section.id] === true; // default collapsed

                              return (
                                <div key={section.id} style={{ marginTop: '4px' }}>
                                  {/* Section Header */}
                                  <div
                                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isSectionExpanded }))}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 16px',
                                      marginLeft: '8px',
                                      background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                                      cursor: 'pointer',
                                      borderRadius: '4px',
                                      borderLeft: `3px solid ${projectColor}40`,
                                    }}
                                  >
                                    <FaChevronDown
                                      style={{
                                        transform: isSectionExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                        transition: 'transform 0.2s',
                                        fontSize: '9px',
                                        color: theme === 'light' ? '#9CA3AF' : '#6B7280'
                                      }}
                                    />
                                    <span style={{
                                      fontWeight: 500,
                                      fontSize: '13px',
                                      color: theme === 'light' ? '#374151' : '#D1D5DB'
                                    }}>
                                      {section.name}
                                    </span>
                                    <span style={{
                                      fontSize: '11px',
                                      color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                                      marginLeft: 'auto'
                                    }}>
                                      {sectionTasks.length}
                                    </span>
                                  </div>

                                  {/* Section Tasks */}
                                  {isSectionExpanded && sectionTasks.map(task => (
                                    <ActionCard key={task.id} theme={theme} style={{ marginLeft: '16px' }}>
                                      <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <div
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            border: `2px solid ${task.priority === 4 ? '#dc3545' : task.priority === 3 ? '#fd7e14' : task.priority === 2 ? '#ffc107' : '#6c757d'}`,
                                            flexShrink: 0,
                                            marginTop: '2px',
                                            cursor: 'pointer',
                                          }}
                                          onClick={() => handleCompleteTask(task.id)}
                                          title="Complete task"
                                        />
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: 500 }}>{task.content}</div>
                                          {task.description && (
                                            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                                              {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                                            </div>
                                          )}
                                        </div>
                                      </ActionCardHeader>
                                      <ActionCardContent theme={theme} style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {task.due && (
                                          <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            background: new Date(task.due.date) < new Date() ? '#dc354520' : '#6c757d20',
                                            color: new Date(task.due.date) < new Date() ? '#dc3545' : (theme === 'light' ? '#6c757d' : '#9CA3AF'),
                                          }}>
                                            {task.due.string || task.due.date}
                                          </span>
                                        )}
                                      </ActionCardContent>
                                      <ActionCardButtons>
                                        <SmallBtn theme={theme} onClick={() => openEditTask(task)}><FaEdit /></SmallBtn>
                                        <SmallBtn theme={theme} onClick={() => window.open(task.url, '_blank')} title="Open in Todoist"><FaExternalLinkAlt /></SmallBtn>
                                        <SmallBtn theme={theme} $variant="success" onClick={() => handleCompleteTask(task.id)} title="Complete"><FaCheck /></SmallBtn>
                                        <SmallBtn theme={theme} $variant="danger" onClick={() => handleDeleteTask(task.id)} title="Delete"><FaTrash /></SmallBtn>
                                      </ActionCardButtons>
                                    </ActionCard>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {activeActionTab === 'notes' && (
                <>
                  {/* Add New Note Button */}
                  <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => { resetNoteForm(); setNoteModalOpen(true); }}>
                    <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                      <FaStickyNote style={{ color: '#8B5CF6' }} />
                      <span style={{ fontWeight: 600 }}>Add New Note</span>
                    </ActionCardContent>
                  </ActionCard>

                  {/* Loading state */}
                  {loadingNotes && (
                    <div style={{ padding: '20px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      Loading notes...
                    </div>
                  )}

                  {/* Existing Notes Section */}
                  {!loadingNotes && contactNotes.length > 0 && (
                    <>
                      <div style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Related Notes ({contactNotes.length})
                      </div>
                      {contactNotes.map(note => (
                        <ActionCard key={note.note_id} theme={theme}>
                          <ActionCardHeader theme={theme}>
                            <span style={{ fontWeight: '600' }}>{getNoteTypeIcon(note.note_type)} {note.title}</span>
                          </ActionCardHeader>
                          <ActionCardContent theme={theme}>
                            {note.summary && (
                              <div style={{
                                fontSize: '12px',
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                marginBottom: '4px',
                                lineHeight: '1.4'
                              }}>
                                {note.summary}
                              </div>
                            )}
                            <div style={{ fontSize: '10px', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                              {note.note_type} • {new Date(note.created_at).toLocaleDateString()}
                            </div>
                          </ActionCardContent>
                          <ActionCardButtons>
                            <SmallBtn theme={theme} onClick={() => note.obsidian_path && openInObsidian(note.obsidian_path)} title="Open in Obsidian">
                              <FaExternalLinkAlt />
                            </SmallBtn>
                            <SmallBtn theme={theme} onClick={() => openEditNote(note)} title="Edit">
                              <FaEdit />
                            </SmallBtn>
                            <SmallBtn theme={theme} $variant="danger" onClick={() => handleDeleteNote(note.note_id, note.obsidian_path)} title="Delete">
                              <FaTrash />
                            </SmallBtn>
                          </ActionCardButtons>
                        </ActionCard>
                      ))}
                    </>
                  )}

                  {/* Empty state */}
                  {!loadingNotes && contactNotes.length === 0 && (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                      fontSize: '13px'
                    }}>
                      No notes yet for contacts in this thread
                    </div>
                  )}
                </>
              )}

            </>
          )}
        </ActionsPanel>
      </MainContent>

      {/* Compose Modal */}
      {composeModal.open && (
        <ModalOverlay onClick={closeCompose}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                {composeModal.mode === 'forward' ? 'Forward' : composeModal.mode === 'replyAll' ? 'Reply All' : 'Reply'}
              </ModalTitle>
              <CloseButton theme={theme} onClick={closeCompose}>
                <FaTimes size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody theme={theme}>
              <FormField>
                <FormLabel theme={theme}>To</FormLabel>
                <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('to-input')?.focus()}>
                  {composeTo.map((recipient, idx) => (
                    <EmailBubble key={idx} theme={theme}>
                      {recipient.name || recipient.email}
                      <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('to', recipient.email); }}>
                        <FaTimes size={10} />
                      </EmailBubbleRemove>
                    </EmailBubble>
                  ))}
                  <EmailBubbleInput
                    id="to-input"
                    theme={theme}
                    value={composeToInput}
                    onChange={(e) => {
                      setComposeToInput(e.target.value);
                      setActiveField('to');
                      searchContacts(e.target.value);
                    }}
                    onKeyDown={(e) => handleEmailInputKeyDown(e, 'to')}
                    onFocus={() => setActiveField('to')}
                    onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                    placeholder={composeTo.length === 0 ? "Type name or email..." : ""}
                  />
                  {activeField === 'to' && contactSuggestions.length > 0 && (
                    <AutocompleteDropdown theme={theme}>
                      {contactSuggestions.map((contact) => (
                        <AutocompleteItem
                          key={`${contact.id}-${contact.email}`}
                          theme={theme}
                          onMouseDown={() => addEmailToField('to', contact)}
                        >
                          <AutocompleteAvatar theme={theme}>
                            {contact.profile_image_url ? (
                              <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            ) : (
                              `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`
                            )}
                          </AutocompleteAvatar>
                          <AutocompleteInfo>
                            <AutocompleteName theme={theme}>{contact.first_name} {contact.last_name}</AutocompleteName>
                            <AutocompleteEmail theme={theme}>{contact.email}</AutocompleteEmail>
                          </AutocompleteInfo>
                        </AutocompleteItem>
                      ))}
                    </AutocompleteDropdown>
                  )}
                </EmailBubbleContainer>
              </FormField>

              <FormField>
                <FormLabel theme={theme}>CC</FormLabel>
                <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('cc-input')?.focus()}>
                  {composeCc.map((recipient, idx) => (
                    <EmailBubble key={idx} theme={theme}>
                      {recipient.name || recipient.email}
                      <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('cc', recipient.email); }}>
                        <FaTimes size={10} />
                      </EmailBubbleRemove>
                    </EmailBubble>
                  ))}
                  <EmailBubbleInput
                    id="cc-input"
                    theme={theme}
                    value={composeCcInput}
                    onChange={(e) => {
                      setComposeCcInput(e.target.value);
                      setActiveField('cc');
                      searchContacts(e.target.value);
                    }}
                    onKeyDown={(e) => handleEmailInputKeyDown(e, 'cc')}
                    onFocus={() => setActiveField('cc')}
                    onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                    placeholder={composeCc.length === 0 ? "Add CC (optional)..." : ""}
                  />
                  {activeField === 'cc' && contactSuggestions.length > 0 && (
                    <AutocompleteDropdown theme={theme}>
                      {contactSuggestions.map((contact) => (
                        <AutocompleteItem
                          key={`${contact.id}-${contact.email}`}
                          theme={theme}
                          onMouseDown={() => addEmailToField('cc', contact)}
                        >
                          <AutocompleteAvatar theme={theme}>
                            {contact.profile_image_url ? (
                              <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            ) : (
                              `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`
                            )}
                          </AutocompleteAvatar>
                          <AutocompleteInfo>
                            <AutocompleteName theme={theme}>{contact.first_name} {contact.last_name}</AutocompleteName>
                            <AutocompleteEmail theme={theme}>{contact.email}</AutocompleteEmail>
                          </AutocompleteInfo>
                        </AutocompleteItem>
                      ))}
                    </AutocompleteDropdown>
                  )}
                </EmailBubbleContainer>
              </FormField>

              <FormField>
                <FormLabel theme={theme}>Subject</FormLabel>
                <FormInput
                  theme={theme}
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                />
              </FormField>

              <FormField>
                <FormLabel theme={theme}>Message</FormLabel>
                <FormTextarea
                  theme={theme}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                />
              </FormField>

              {/* Attachments Section */}
              <FormField>
                <input
                  type="file"
                  multiple
                  ref={composeFileInputRef}
                  onChange={handleComposeFileSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: composeAttachments.length > 0 ? '8px' : 0 }}>
                  <button
                    type="button"
                    onClick={() => composeFileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: theme === 'light' ? '#F3F4F6' : '#374151',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      borderRadius: '6px',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <FaPaperclip size={12} />
                    Attach Files
                  </button>
                  {composeAttachments.length > 0 && (
                    <span style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      {composeAttachments.length} file{composeAttachments.length > 1 ? 's' : ''} attached
                    </span>
                  )}
                </div>
                {composeAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {composeAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          background: theme === 'light' ? '#EFF6FF' : '#1E3A5F',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <FaPaperclip size={10} style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }} />
                        <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.name}
                        </span>
                        <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          ({formatFileSize(att.size)})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeComposeAttachment(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                          }}
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </ModalBody>

            <ModalFooter theme={theme}>
              <CancelButton theme={theme} onClick={closeCompose}>
                Cancel
              </CancelButton>
              <SendButton onClick={handleSend} disabled={sending}>
                <FaPaperPlane />
                {sending ? 'Sending...' : 'Send'}
              </SendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

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
          // Remove from not in CRM list
          if (createContactEmail?.email) {
            setNotInCrmEmails(prev => prev.filter(item =>
              item.email.toLowerCase() !== createContactEmail.email.toLowerCase()
            ));
            // Also remove from hold list if present
            setHoldContacts(prev => prev.filter(c =>
              c.email.toLowerCase() !== createContactEmail.email.toLowerCase()
            ));
            // Remove from contacts_hold table if it was there
            await supabase
              .from('contacts_hold')
              .delete()
              .eq('email', createContactEmail.email.toLowerCase());
          }
          // Refresh data integrity stats
          fetchDataIntegrity();
          toast.success(`Contact ${newContact.first_name} ${newContact.last_name} created successfully!`);
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
        onDomainLinked={({ company, domain }) => {
          // Remove from not in CRM list
          setNotInCrmDomains(prev => prev.filter(item => item.domain !== domain));
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

      {/* Create Deal AI Modal */}
      <CreateDealAI
        isOpen={createDealAIOpen}
        onClose={() => setCreateDealAIOpen(false)}
        email={selectedThread?.[0] || null}
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
    </PageContainer>
  );
};

export default CommandCenterPage;

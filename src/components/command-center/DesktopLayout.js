import React from 'react';
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
} from '../../pages/CommandCenterPage.styles';
import { FaEnvelope, FaWhatsapp, FaCalendar, FaCalendarAlt, FaCalendarPlus, FaChevronLeft, FaChevronRight, FaChevronDown, FaUser, FaBuilding, FaDollarSign, FaStickyNote, FaTimes, FaPaperPlane, FaTrash, FaLightbulb, FaHandshake, FaTasks, FaSave, FaArchive, FaCrown, FaPaperclip, FaRobot, FaCheck, FaCheckCircle, FaCheckDouble, FaImage, FaEdit, FaPlus, FaExternalLinkAlt, FaDownload, FaCopy, FaDatabase, FaExclamationTriangle, FaUserSlash, FaClone, FaUserCheck, FaTag, FaClock, FaBolt, FaUpload, FaFileAlt, FaLinkedin, FaSearch, FaRocket, FaGlobe, FaMapMarkerAlt, FaUsers, FaVideo, FaLink, FaList, FaSyncAlt, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import DataIntegrityTab from './DataIntegrityTab';
import ChatTab from './ChatTab';
import SendEmailTab from './SendEmailTab';
import WhatsAppChatTab from './WhatsAppChatTab';
import AITab from './AITab';
import CRMTab from './CRMTab';
import DealsTab from './DealsTab';
import IntroductionsTab from './IntroductionsTab';
import IntroductionsPanelTab from './IntroductionsPanelTab';
import TasksTab from './TasksTab';
import NotesTab from './NotesTab';
import NotesFullTab from './NotesFullTab';
import ListsTab from './ListsTab';
import TasksFullTab from './TasksFullTab';
import WhatsAppTab, { WhatsAppChatList } from './WhatsAppTab';
import ContactSelector from './ContactSelector';
import DataIntegrityWarningBar from './DataIntegrityWarningBar';
import ContactDetailsTab from './ContactDetailsTab';
import CompanyDetailsTab from './CompanyDetailsTab';
import RightPanelWhatsAppTab from './RightPanelWhatsAppTab';
import RightPanelEmailTab from './RightPanelEmailTab';
import RelatedTab from './RelatedTab';
import FilesTab from './FilesTab';
import CalendarPanelTab from './CalendarPanelTab';

const DesktopLayout = ({
  theme,
  tabs,
  // Hook objects (identity-stable)
  dealsHook,
  introductionsHook,
  kitHook,
  calendarHook,
  whatsAppHook,
  dataIntegrityHook,
  emailActionsHook,
  rightPanelHook,
  contextContactsHook,
  todoistHook,
  chatHook,
  emailCompose,
  quickEditModal,
  profileImageModal,
  // Bundles
  emailThreads,
  localState,
  localHandlers,
  modalState,
}) => {
  // Destructure hook objects
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
    updateIntroductionField,
    handleUnlinkIntroductionEmailThread,
    handleIntroductionStatusUpdated,
    handleEditIntroductionWithContacts,
  } = introductionsHook;

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
    getCompanyLinkData,
    handleUpdateKeepInTouchField, handleUpdateContactField,
    handleKeepInTouchSnooze, filterKeepInTouchByStatus,
    handleUpdateKitCompanyField, handleKitSendEmail,
    fetchKitTemplates, applyKitTemplate, searchKeepInTouch,
    handleOpenKeepInTouchModal, handleDoNotKeepInTouch,
  } = kitHook;

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
    handleUpdateMeetingDescription,
    handleUpdateMeetingScore,
    handleUpdateMeetingNotes,
  } = calendarHook;

  const {
    whatsappMessages, setWhatsappMessages,
    whatsappChats, setWhatsappChats,
    selectedWhatsappChat, setSelectedWhatsappChat,
    whatsappLoading,
    whatsappRefreshTrigger, setWhatsappRefreshTrigger,
    baileysStatus, setBaileysStatus,
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
    handleRunContactChecks,
  } = dataIntegrityHook;

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
    handleDownloadAttachment,
  } = emailActionsHook;

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
    handleRightPanelUpdateContactField,
    handleUpdateKeepInTouch,
    handleMarkContactComplete,
    handleMarkCompanyComplete,
    handleRemoveCompanyAssociation,
  } = rightPanelHook;

  const {
    emailContacts, setEmailContacts,
    emailCompanies, setEmailCompanies,
    loadingContacts, loadingCompanies,
    refetchContacts,
  } = contextContactsHook;

  const {
    todoistTasks,
    todoistProjects,
    loadingTasks,
    taskModalOpen, setTaskModalOpen,
    newTaskContent, setNewTaskContent,
    newTaskDueString, setNewTaskDueString,
    newTaskProjectId, setNewTaskProjectId,
    newTaskSectionId, setNewTaskSectionId,
    newTaskPriority, setNewTaskPriority,
    newTaskDescription, setNewTaskDescription,
    creatingTask,
    editingTask,
    expandedProjects, setExpandedProjects,
    expandedSections, setExpandedSections,
    handleSaveTask,
    handleCompleteTask,
    handleDeleteTask,
    resetTaskForm,
    openEditTask,
    getProjectColor,
  } = todoistHook;

  const {
    chatMessages, setChatMessages,
    chatInput, setChatInput,
    chatLoading, setChatLoading,
    chatImages, setChatImages,
    chatMessagesRef,
    chatFileInputRef,
    sendMessageToClaude,
    handleQuickAction,
    handleChatImageSelect,
    removeChatImage,
    sendDuplicateMCPInstruction,
    addChatMessage,
  } = chatHook;

  const {
    openReply,
    openReplyWithDraft,
    openForward,
    openAssign,
    openNewCompose,
    sending,
    extractDraftFromMessage,
    hasDraftReply,
    getLatestEmail,
    formatRecipients,
  } = emailCompose;

  const {
    openModal: handleOpenQuickEditModal,
  } = quickEditModal;

  // Destructure bundles
  const {
    emails, threads, selectedThread, threadsLoading,
    setEmails, setThreads, setSelectedThread, refreshThreads, removeEmailsBySender,
  } = emailThreads;

  const {
    activeTab, setActiveTab, viewport, isMobile,
    listCollapsed, setListCollapsed, rightPanelCollapsed, setRightPanelCollapsed,
    statusSections, toggleStatusSection, filterByStatus,
    emailSearchQuery, setEmailSearchQuery, emailSearchResults, setEmailSearchResults,
    emailSearchLoading, isSearchingEmails, setIsSearchingEmails,
    contactDeals, companyDeals, contactIntroductions, contactTasks,
    contactNotes, loadingNotes,
    navigate,
  } = localState;

  const {
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
  } = localHandlers;

  const {
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
  } = modalState;

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
        {/* Left: Email List - Hidden for Notes, Lists, and Tasks tabs */}
        {activeTab !== 'notes' && activeTab !== 'lists' && activeTab !== 'tasks' && (
        <EmailListPanel theme={theme} $collapsed={listCollapsed}>
          <ListHeader theme={theme}>
            {!listCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Messages</span>
                {activeTab === 'email' && (
                  <FaSyncAlt
                    size={12}
                    onClick={() => refreshThreads()}
                    style={{
                      cursor: 'pointer',
                      opacity: threadsLoading ? 0.5 : 0.6,
                      animation: threadsLoading ? 'spin 1s linear infinite' : 'none',
                      transition: 'opacity 0.2s',
                    }}
                    title="Refresh Emails"
                  />
                )}
                {activeTab === 'whatsapp' && (
                  <FaSyncAlt
                    size={12}
                    onClick={() => setWhatsappRefreshTrigger(prev => prev + 1)}
                    style={{
                      cursor: 'pointer',
                      opacity: whatsappLoading ? 0.5 : 0.6,
                      animation: whatsappLoading ? 'spin 1s linear infinite' : 'none',
                      transition: 'opacity 0.2s',
                    }}
                    title="Refresh WhatsApp"
                  />
                )}
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

          {/* Email Search Bar - only for email tab */}
          {!listCollapsed && activeTab === 'email' && (
            <SearchContainer theme={theme}>
              <SearchInputWrapper theme={theme}>
                <FaSearch size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
                <SearchInput
                  theme={theme}
                  type="text"
                  placeholder="Search saved emails..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                />
                {emailSearchQuery && (
                  <ClearSearchButton
                    theme={theme}
                    onClick={() => {
                      setEmailSearchQuery('');
                      setEmailSearchResults([]);
                      setIsSearchingEmails(false);
                    }}
                  >
                    <FaTimes size={12} />
                  </ClearSearchButton>
                )}
              </SearchInputWrapper>
            </SearchContainer>
          )}

          {/* WhatsApp Search Bar - only for whatsapp tab */}
          {!listCollapsed && activeTab === 'whatsapp' && (
            <SearchContainer theme={theme}>
              <SearchInputWrapper theme={theme}>
                <FaSearch size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
                <SearchInput
                  theme={theme}
                  type="text"
                  placeholder="Search saved chats..."
                  value={whatsappSearchQuery}
                  onChange={(e) => setWhatsappSearchQuery(e.target.value)}
                />
                {whatsappSearchQuery && (
                  <ClearSearchButton
                    theme={theme}
                    onClick={() => {
                      setWhatsappSearchQuery('');
                      setWhatsappSearchResults([]);
                      setIsSearchingWhatsapp(false);
                      setArchivedWhatsappContact(null);
                    }}
                  >
                    <FaTimes size={12} />
                  </ClearSearchButton>
                )}
              </SearchInputWrapper>
            </SearchContainer>
          )}

          {/* Calendar Search Bar - only for calendar tab */}
          {!listCollapsed && activeTab === 'calendar' && (
            <SearchContainer theme={theme}>
              <SearchInputWrapper theme={theme}>
                <FaSearch size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
                <SearchInput
                  theme={theme}
                  type="text"
                  placeholder="Search events..."
                  value={calendarSearchQuery}
                  onChange={(e) => setCalendarSearchQuery(e.target.value)}
                />
                {calendarSearchQuery && (
                  <ClearSearchButton
                    theme={theme}
                    onClick={() => {
                      setCalendarSearchQuery('');
                      setCalendarSearchResults([]);
                      setIsSearchingCalendar(false);
                    }}
                  >
                    <FaTimes size={12} />
                  </ClearSearchButton>
                )}
              </SearchInputWrapper>
            </SearchContainer>
          )}

          {!listCollapsed && (activeTab === 'email' || activeTab === 'whatsapp') && (
            <EmailList style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {threadsLoading || whatsappLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : isSearchingEmails && activeTab === 'email' ? (
                /* Search Results Mode */
                <>
                  <SearchResultsHeader theme={theme}>
                    {emailSearchLoading ? 'Searching...' : `${emailSearchResults.length} threads found`}
                  </SearchResultsHeader>
                  {emailSearchResults.map(result => (
                    <EmailItem
                      key={result.email_thread_id}
                      theme={theme}
                      $selected={selectedThread?.[0]?._email_thread_id === result.email_thread_id}
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      <EmailSender theme={theme}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {result.latestEmail?.from_name || result.latestEmail?.from_email || 'Unknown'}
                        </span>
                        {result.emails?.length > 1 && (
                          <span style={{ opacity: 0.6, flexShrink: 0 }}>({result.emails.length})</span>
                        )}
                      </EmailSender>
                      <EmailSubject theme={theme}>{result.subject || 'No Subject'}</EmailSubject>
                      <EmailSnippet theme={theme}>
                        {result.latestEmail?.body_plain?.substring(0, 100) || ''}
                      </EmailSnippet>
                      <SearchResultDate theme={theme}>
                        {result.last_message_timestamp ? new Date(result.last_message_timestamp).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : ''}
                      </SearchResultDate>
                    </EmailItem>
                  ))}
                  {!emailSearchLoading && emailSearchResults.length === 0 && (
                    <EmptyState theme={theme}>No emails found matching "{emailSearchQuery}"</EmptyState>
                  )}
                </>
              ) : isSearchingWhatsapp && activeTab === 'whatsapp' ? (
                /* WhatsApp Search Results Mode */
                <>
                  <SearchResultsHeader theme={theme}>
                    {whatsappSearchLoading ? 'Searching...' : `${whatsappSearchResults.length} chats found`}
                  </SearchResultsHeader>
                  {whatsappSearchResults.map(result => {
                    // Match source badge config
                    const matchBadge = {
                      chat_name: { label: 'Name', color: '#10B981', bg: '#D1FAE5' },
                      contact: { label: 'Contact', color: '#3B82F6', bg: '#DBEAFE' },
                      phone: { label: 'Phone', color: '#8B5CF6', bg: '#EDE9FE' },
                      content: { label: 'Message', color: '#F59E0B', bg: '#FEF3C7' }
                    }[result.match_source] || { label: 'Match', color: '#6B7280', bg: '#F3F4F6' };

                    return (
                      <EmailItem
                        key={result.result_chat_id}
                        theme={theme}
                        $selected={selectedWhatsappChat?.chat_id === result.result_chat_id}
                        onClick={() => handleSelectWhatsappSearchResult(result)}
                      >
                        <EmailSender theme={theme}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {result.contact_name?.trim() || result.result_chat_name || 'Unknown'}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: theme === 'light' ? matchBadge.bg : `${matchBadge.color}20`,
                            color: matchBadge.color,
                            fontWeight: 500,
                            flexShrink: 0
                          }}>
                            {matchBadge.label}
                          </span>
                        </EmailSender>
                        <EmailSubject theme={theme}>{result.result_chat_name || 'Unknown Chat'}</EmailSubject>
                        <EmailSnippet theme={theme}>
                          {result.latest_message_preview?.substring(0, 100) || ''}
                        </EmailSnippet>
                        <SearchResultDate theme={theme}>
                          {result.last_message_timestamp ? new Date(result.last_message_timestamp).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : ''}
                        </SearchResultDate>
                      </EmailItem>
                    );
                  })}
                  {!whatsappSearchLoading && whatsappSearchResults.length === 0 && (
                    <EmptyState theme={theme}>No chats found matching "{whatsappSearchQuery}"</EmptyState>
                  )}
                </>
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

                  {/* Archiving Section - items being processed in background */}
                  {((activeTab === 'email' && filterByStatus(threads, 'archiving').length > 0) ||
                    (activeTab === 'whatsapp' && filterByStatus(whatsappChats, 'archiving').length > 0)) && (
                    <>
                      <div
                        onClick={() => toggleStatusSection('archiving')}
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
                        <FaChevronDown style={{ transform: statusSections.archiving ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                        <span style={{ color: '#10b981' }}>Archiving</span>
                        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                          {activeTab === 'email' ? filterByStatus(threads, 'archiving').length : filterByStatus(whatsappChats, 'archiving').length}
                        </span>
                      </div>
                      {statusSections.archiving && (
                        activeTab === 'email' ? (
                          filterByStatus(threads, 'archiving').map(thread => (
                            <EmailItem
                              key={thread.threadId}
                              theme={theme}
                              $selected={selectedThread?.[0]?.thread_id === thread.threadId || selectedThread?.[0]?.id === thread.threadId}
                              onClick={() => handleSelectThread(thread.emails)}
                              style={{ opacity: 0.6 }}
                            >
                              <EmailSender theme={theme}>
                                <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '4px' }} />
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
                            chats={filterByStatus(whatsappChats, 'archiving')}
                            selectedChat={selectedWhatsappChat}
                            onSelectChat={setSelectedWhatsappChat}
                            loading={false}
                            contacts={emailContacts}
                            archiving={true}
                          />
                        )
                      )}
                    </>
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
              {isSearchingCalendar ? (
                /* Calendar Search Results Mode */
                <>
                  <SearchResultsHeader theme={theme}>
                    {calendarSearchLoading ? 'Searching...' : `${calendarSearchResults.length} events found`}
                  </SearchResultsHeader>
                  {calendarSearchResults.map(result => {
                    // Match source badge config (same style as WhatsApp)
                    const matchBadge = {
                      name: { label: 'Name', color: '#10B981', bg: '#D1FAE5' },
                      description: { label: 'Description', color: '#F59E0B', bg: '#FEF3C7' },
                      attendee: { label: 'Attendee', color: '#3B82F6', bg: '#DBEAFE' },
                      location: { label: 'Location', color: '#8B5CF6', bg: '#EDE9FE' }
                    }[result.match_source] || { label: 'Match', color: '#6B7280', bg: '#F3F4F6' };

                    const eventDate = result.event_date ? new Date(result.event_date) : null;
                    const dateStr = eventDate ? eventDate.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '';
                    const timeStr = eventDate ? eventDate.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '';

                    return (
                      <EmailItem
                        key={result.result_id}
                        theme={theme}
                        $selected={
                          (result.result_type === 'inbox' && selectedCalendarEvent?.id === result.result_id) ||
                          (result.result_type === 'meeting' && selectedCalendarEvent?.meeting_id === result.result_id)
                        }
                        onClick={() => handleSelectCalendarSearchResult(result)}
                      >
                        <EmailSender theme={theme}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {result.event_name || 'Untitled Event'}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: theme === 'light' ? matchBadge.bg : `${matchBadge.color}20`,
                            color: matchBadge.color,
                            fontWeight: 500,
                            flexShrink: 0
                          }}>
                            {matchBadge.label}
                          </span>
                        </EmailSender>
                        <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
                          {dateStr} {timeStr && `at ${timeStr}`}
                        </EmailSubject>
                        <EmailSnippet theme={theme}>
                          {result.attendee_names || result.description_preview?.substring(0, 100) || result.event_location || ''}
                        </EmailSnippet>
                        <SearchResultDate theme={theme}>
                          {result.result_type === 'meeting' ? 'Processed' : 'To Process'}
                        </SearchResultDate>
                      </EmailItem>
                    );
                  })}
                  {!calendarSearchLoading && calendarSearchResults.length === 0 && (
                    <EmptyState theme={theme}>No events found matching "{calendarSearchQuery}"</EmptyState>
                  )}
                </>
              ) : calendarLoading ? (
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
                          setCalendarEventDescription(meeting.description || '');
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
                  {/* Inbox Section (Past Events) */}
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
                    <span>Inbox</span>
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
                          onClick={() => {
                            setSelectedCalendarEvent(event);
                            setCalendarEventDescription(event.body_text || event.description || '');
                          }}
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
                          onClick={() => {
                            setSelectedCalendarEvent(event);
                            setCalendarEventDescription(event.body_text || event.description || '');
                          }}
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

                  {/* This Month Events Section */}
                  <div
                    onClick={() => toggleCalendarSection('thisMonth')}
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
                    <FaChevronDown style={{ transform: calendarSections.thisMonth ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>This Month</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterCalendarEvents(calendarEvents, 'thisMonth').length}
                    </span>
                  </div>
                  {calendarSections.thisMonth && (
                    filterCalendarEvents(calendarEvents, 'thisMonth').map(event => {
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
                          onClick={() => {
                            setSelectedCalendarEvent(event);
                            setCalendarEventDescription(event.body_text || event.description || '');
                          }}
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
                          onClick={() => {
                            setSelectedCalendarEvent(event);
                            setCalendarEventDescription(event.body_text || event.description || '');
                          }}
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
                ? `${filterCalendarEvents(calendarEvents, 'needReview').length} inbox, ${filterCalendarEvents(calendarEvents, 'thisWeek').length} this week, ${filterCalendarEvents(calendarEvents, 'thisMonth').length} this month, ${filterCalendarEvents(calendarEvents, 'upcoming').length} upcoming`
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
              {/* Search Input */}
              <SearchContainer theme={theme}>
                <SearchInputWrapper theme={theme}>
                  <FaSearch size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
                  <SearchInput
                    theme={theme}
                    type="text"
                    placeholder="Search contacts..."
                    value={keepInTouchSearchQuery}
                    onChange={(e) => setKeepInTouchSearchQuery(e.target.value)}
                  />
                  {keepInTouchSearchQuery && (
                    <ClearSearchButton
                      theme={theme}
                      onClick={() => {
                        setKeepInTouchSearchQuery('');
                        setKeepInTouchSearchResults([]);
                        setIsSearchingKeepInTouch(false);
                      }}
                    >
                      <FaTimes size={12} />
                    </ClearSearchButton>
                  )}
                </SearchInputWrapper>
              </SearchContainer>

              {keepInTouchLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : isSearchingKeepInTouch ? (
                // Search Results
                keepInTouchSearchLoading ? (
                  <EmptyState theme={theme}>Searching...</EmptyState>
                ) : keepInTouchSearchResults.length === 0 ? (
                  <EmptyState theme={theme}>
                    <FaSearch size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <span>No results found</span>
                  </EmptyState>
                ) : (
                  keepInTouchSearchResults.map(contact => {
                    const matchBadge = {
                      name: { label: 'Name', color: '#10B981', bg: '#D1FAE5' },
                      email: { label: 'Email', color: '#3B82F6', bg: '#DBEAFE' },
                      company: { label: 'Company', color: '#8B5CF6', bg: '#EDE9FE' }
                    }[contact.match_source] || { label: 'Match', color: '#6B7280', bg: '#F3F4F6' };

                    return (
                      <EmailItem
                        key={contact.contact_id}
                        theme={theme}
                        $selected={selectedKeepInTouchContact?.contact_id === contact.contact_id}
                        onClick={() => setSelectedKeepInTouchContact(contact)}
                        style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}>
                          {contact.profile_image_url ? (
                            <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            contact.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <EmailSender theme={theme}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {contact.full_name}
                            </span>
                          </EmailSender>
                          <EmailSubject theme={theme} style={{
                            fontWeight: 600,
                            color: contact.days_until_next < 0 ? '#ef4444' : contact.days_until_next <= 14 ? '#f59e0b' : (theme === 'dark' ? '#D1D5DB' : '#374151')
                          }}>
                            {contact.days_until_next < 0 ? `${Math.abs(contact.days_until_next)} days overdue` : `${contact.days_until_next} days left`}
                          </EmailSubject>
                          <EmailSnippet theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {contact.frequency}
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: matchBadge.bg,
                              color: matchBadge.color
                            }}>
                              {matchBadge.label}: {contact.match_value?.length > 30 ? contact.match_value.slice(0, 30) + '...' : contact.match_value}
                            </span>
                          </EmailSnippet>
                        </div>
                      </EmailItem>
                    );
                  })
                )
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
                      style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {contact.profile_image_url ? (
                          <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          contact.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                      </div>
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
                      style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {contact.profile_image_url ? (
                          <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          contact.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                      </div>
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
                      style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {contact.profile_image_url ? (
                          <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          contact.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                      </div>
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

          {/* Introductions List */}
          {!listCollapsed && activeTab === 'introductions' && (
            <EmailList>
              {introductionsLoading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : introductionsList.length === 0 ? (
                <EmptyState theme={theme}>
                  <FaHandshake size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <span>No introductions yet</span>
                </EmptyState>
              ) : (
                <>
                  {/* Inbox Section - Requested & Promised */}
                  <div
                    onClick={() => setIntroductionsSections(prev => ({ ...prev, inbox: !prev.inbox }))}
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
                    <FaChevronDown style={{ transform: introductionsSections.inbox ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Inbox</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.8, fontSize: '12px' }}>
                      {filterIntroductionsBySection(introductionsList, 'inbox').length}
                    </span>
                  </div>
                  {introductionsSections.inbox && filterIntroductionsBySection(introductionsList, 'inbox').map(intro => {
                    const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
                    const person1 = introducees[0]?.name || 'Unknown';
                    const person2 = introducees[1]?.name || 'Unknown';
                    return (
                      <EmailItem
                        key={intro.introduction_id}
                        theme={theme}
                        $selected={selectedIntroductionItem?.introduction_id === intro.introduction_id}
                        onClick={() => setSelectedIntroductionItem(intro)}
                      >
                        <EmailSender theme={theme}>
                          <FaHandshake style={{ color: '#F59E0B', marginRight: '6px' }} size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person1} ↔ {person2}
                          </span>
                        </EmailSender>
                        <EmailSubject theme={theme}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 500,
                            background: '#FEE2E2',
                            color: '#DC2626'
                          }}>
                            {intro.status}
                          </span>
                        </EmailSubject>
                        <EmailSnippet theme={theme}>
                          {intro.introduction_tool} • {intro.created_at ? new Date(intro.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                        </EmailSnippet>
                      </EmailItem>
                    );
                  })}

                  {/* Monitoring Section */}
                  <div
                    onClick={() => setIntroductionsSections(prev => ({ ...prev, monitoring: !prev.monitoring }))}
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
                    <FaChevronDown style={{ transform: introductionsSections.monitoring ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Monitoring</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.8, fontSize: '12px' }}>
                      {filterIntroductionsBySection(introductionsList, 'monitoring').length}
                    </span>
                  </div>
                  {introductionsSections.monitoring && filterIntroductionsBySection(introductionsList, 'monitoring').map(intro => {
                    const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
                    const person1 = introducees[0]?.name || 'Unknown';
                    const person2 = introducees[1]?.name || 'Unknown';
                    return (
                      <EmailItem
                        key={intro.introduction_id}
                        theme={theme}
                        $selected={selectedIntroductionItem?.introduction_id === intro.introduction_id}
                        onClick={() => setSelectedIntroductionItem(intro)}
                      >
                        <EmailSender theme={theme}>
                          <FaHandshake style={{ color: '#F59E0B', marginRight: '6px' }} size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person1} ↔ {person2}
                          </span>
                        </EmailSender>
                        <EmailSubject theme={theme}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 500,
                            background: '#FEF3C7',
                            color: '#92400E'
                          }}>
                            {intro.status}
                          </span>
                        </EmailSubject>
                        <EmailSnippet theme={theme}>
                          {intro.introduction_tool} • {intro.created_at ? new Date(intro.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                        </EmailSnippet>
                      </EmailItem>
                    );
                  })}

                  {/* Closed Section */}
                  <div
                    onClick={() => setIntroductionsSections(prev => ({ ...prev, closed: !prev.closed }))}
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
                    <FaChevronDown style={{ transform: introductionsSections.closed ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
                    <span>Closed</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
                      {filterIntroductionsBySection(introductionsList, 'closed').length}
                    </span>
                  </div>
                  {introductionsSections.closed && filterIntroductionsBySection(introductionsList, 'closed').map(intro => {
                    const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
                    const person1 = introducees[0]?.name || 'Unknown';
                    const person2 = introducees[1]?.name || 'Unknown';
                    return (
                      <EmailItem
                        key={intro.introduction_id}
                        theme={theme}
                        $selected={selectedIntroductionItem?.introduction_id === intro.introduction_id}
                        onClick={() => setSelectedIntroductionItem(intro)}
                      >
                        <EmailSender theme={theme}>
                          <FaHandshake style={{ color: '#F59E0B', marginRight: '6px' }} size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person1} ↔ {person2}
                          </span>
                        </EmailSender>
                        <EmailSubject theme={theme}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 500,
                            background: intro.status === 'Done & Dust' ? '#D1FAE5' : '#7F1D1D',
                            color: intro.status === 'Done & Dust' ? '#065F46' : '#FCA5A5'
                          }}>
                            {intro.status}
                          </span>
                        </EmailSubject>
                        <EmailSnippet theme={theme}>
                          {intro.introduction_tool} • {intro.created_at ? new Date(intro.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                        </EmailSnippet>
                      </EmailItem>
                    );
                  })}
                </>
              )}
            </EmailList>
          )}

          {!listCollapsed && activeTab === 'introductions' && introductionsList.length > 0 && (
            <PendingCount theme={theme}>
              {filterIntroductionsBySection(introductionsList, 'inbox').length} pending, {filterIntroductionsBySection(introductionsList, 'monitoring').length} monitoring
            </PendingCount>
          )}
        </EmailListPanel>
        )}

        {/* Center: Content Panel - Email or WhatsApp */}
        <EmailContentPanel theme={theme}>
          {activeTab === 'whatsapp' ? (
            <WhatsAppTab
              theme={theme}
              selectedChat={selectedWhatsappChat}
              onDone={handleWhatsAppDoneAsync}
              onSpam={handleWhatsAppSpam}
              onStatusChange={updateItemStatus}
              saving={saving}
              contacts={emailContacts}
              onNewWhatsApp={() => setNewWhatsAppModalOpen(true)}
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

                  {/* Location / Meeting Link */}
                  {(() => {
                    const location = selectedCalendarEvent.event_location || '';
                    const isLink = location.startsWith('http');
                    const isRemote = location.toLowerCase().includes('zoom') ||
                                     location.toLowerCase().includes('meet.google') ||
                                     location.toLowerCase().includes('teams') ||
                                     location.toLowerCase().includes('webex') ||
                                     isLink;

                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '16px',
                        background: isRemote && location
                          ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                          : (theme === 'light' ? '#F3F4F6' : '#374151'),
                        borderRadius: '12px'
                      }}>
                        {isRemote && location ? (
                          <FaVideo size={20} style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA', marginTop: '2px' }} />
                        ) : (
                          <FaMapMarkerAlt size={20} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }} />
                        )}
                        <div style={{ color: theme === 'light' ? '#374151' : '#D1D5DB', wordBreak: 'break-word', flex: 1 }}>
                          {location ? (
                            isLink ? (
                              <a
                                href={location}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#3B82F6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontWeight: 500
                                }}
                              >
                                {location.includes('zoom') ? '🎥 Join Zoom Meeting' :
                                 location.includes('meet.google') ? '🎥 Join Google Meet' :
                                 location.includes('teams') ? '🎥 Join Teams Meeting' :
                                 '🔗 Open Link'}
                                <FaExternalLinkAlt size={12} />
                              </a>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{location}</span>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in Google Maps"
                                  style={{
                                    color: '#3B82F6',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    background: theme === 'light' ? '#EFF6FF' : '#1E3A5F',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    textDecoration: 'none'
                                  }}
                                >
                                  <FaMapMarkerAlt size={10} style={{ marginRight: '4px' }} />
                                  Maps
                                </a>
                              </div>
                            )
                          ) : (
                            <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No location</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Description - Editable */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB', display: 'flex', alignItems: 'center' }}>
                      <FaFileAlt size={14} style={{ marginRight: '8px' }} />
                      Description
                    </div>
                    <textarea
                      value={calendarEventDescription}
                      onChange={(e) => setCalendarEventDescription(e.target.value)}
                      onBlur={handleUpdateMeetingDescription}
                      placeholder="Add a description..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        backgroundColor: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px',
                        resize: 'vertical',
                        outline: 'none',
                        lineHeight: 1.6
                      }}
                    />
                  </div>

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
                          onClick={() => handleUpdateMeetingScore(score)}
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
                      onBlur={handleUpdateMeetingNotes}
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
                            onClick={() => {
                              const linkData = getCompanyLinkData();
                              if (linkData) {
                                setKitContactToLinkCompany(linkData.contact);
                                setSelectedDomainForLink({
                                  domain: linkData.domain,
                                  sampleEmails: linkData.sampleEmails
                                });
                                setDomainLinkModalOpen(true);
                              }
                            }}
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
                          {keepInTouchContactDetails?.job_role && (keepInTouchContactDetails?.company || keepInTouchCompanies?.[0]?.company) && ' at '}
                          {(keepInTouchContactDetails?.company || keepInTouchCompanies?.[0]?.company) && (
                            <span style={{ fontWeight: 500 }}>{keepInTouchContactDetails?.company?.name || keepInTouchCompanies?.[0]?.company?.name}</span>
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
                      {/* Snooze Controls */}
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                      }}>
                        Snooze:
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleKeepInTouchSnooze(parseInt(e.target.value));
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                            background: theme === 'dark' ? '#374151' : '#FFFFFF',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Add snooze...</option>
                          <option value="7">+7 days</option>
                          <option value="14">+14 days</option>
                          <option value="30">+30 days</option>
                          <option value="60">+60 days</option>
                          <option value="90">+90 days</option>
                        </select>
                        {selectedKeepInTouchContact.snoozed_until && new Date(selectedKeepInTouchContact.snoozed_until) > new Date() && (
                          <>
                            <span style={{
                              padding: '2px 8px',
                              background: theme === 'dark' ? '#374151' : '#E5E7EB',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              Snoozed until {new Date(selectedKeepInTouchContact.snoozed_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <button
                              onClick={() => handleKeepInTouchSnooze(0)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Reset
                            </button>
                          </>
                        )}
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
          ) : activeTab === 'introductions' ? (
            selectedIntroductionItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Introduction Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 24px',
                  minHeight: '70px',
                  borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaHandshake size={24} style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                      <EmailSubjectFull theme={theme} style={{ margin: 0 }}>
                        {(() => {
                          const introducees = selectedIntroductionItem.contacts?.filter(c => c.role === 'introducee') || [];
                          return `${introducees[0]?.name || 'Unknown'} ↔ ${introducees[1]?.name || 'Unknown'}`;
                        })()}
                      </EmailSubjectFull>
                      <div style={{ fontSize: '13px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: '4px' }}>
                        {selectedIntroductionItem.category} • {selectedIntroductionItem.introduction_date ? new Date(selectedIntroductionItem.introduction_date).toLocaleDateString() : 'No date'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteIntroduction(selectedIntroductionItem.introduction_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: theme === 'dark' ? '#7F1D1D' : '#FEE2E2',
                      color: theme === 'dark' ? '#FCA5A5' : '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    <FaTrash size={12} /> Delete
                  </button>
                </div>

                {/* Introduction Details - Editable */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                  {/* Status */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Status
                    </label>
                    <select
                      value={selectedIntroductionItem.status || ''}
                      onChange={(e) => updateIntroductionField('status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Requested">Requested</option>
                      <option value="Promised">Promised</option>
                      <option value="Done & Dust">Done & Dust</option>
                      <option value="Done, but need to monitor">Done, but need to monitor</option>
                      <option value="Aborted">Aborted</option>
                    </select>
                  </div>

                  {/* Tool & Category Row */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Tool
                      </label>
                      <select
                        value={selectedIntroductionItem.introduction_tool || ''}
                        onChange={(e) => updateIntroductionField('introduction_tool', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          background: theme === 'light' ? '#fff' : '#1F2937',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: '14px'
                        }}
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="in person">In Person</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Category
                      </label>
                      <select
                        value={selectedIntroductionItem.category || ''}
                        onChange={(e) => updateIntroductionField('category', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          background: theme === 'light' ? '#fff' : '#1F2937',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: '14px'
                        }}
                      >
                        <option value="Karma Points">Karma Points</option>
                        <option value="Dealflow">Dealflow</option>
                        <option value="Portfolio Company">Portfolio Company</option>
                      </select>
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedIntroductionItem.introduction_date || ''}
                      onChange={(e) => updateIntroductionField('introduction_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Notes
                    </label>
                    <textarea
                      value={selectedIntroductionItem.text || ''}
                      onChange={(e) => setSelectedIntroductionItem(prev => ({ ...prev, text: e.target.value }))}
                      onBlur={(e) => updateIntroductionField('text', e.target.value)}
                      placeholder="Add notes about this introduction..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        background: theme === 'light' ? '#fff' : '#1F2937',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        fontSize: '14px',
                        minHeight: '100px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Contacts Involved */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                      People Involved
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedIntroductionItem.contacts?.map(contact => {
                        const companies = introContactCompanies[contact.contact_id] || [];
                        const tags = introContactTags[contact.contact_id] || [];
                        return (
                          <div
                            key={contact.contact_id}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                            }}
                          >
                            {/* Header row with avatar, name, role */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: contact.description || companies.length > 0 || tags.length > 0 ? '10px' : '0' }}>
                              {contact.profile_image_url ? (
                                <img
                                  src={contact.profile_image_url}
                                  alt=""
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  background: theme === 'light' ? '#E5E7EB' : '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  flexShrink: 0
                                }}>
                                  {contact.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                </div>
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>{contact.name}</div>
                                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                                  {contact.role}
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            {contact.description && (
                              <div style={{
                                fontSize: '12px',
                                color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                                marginBottom: companies.length > 0 || tags.length > 0 ? '10px' : '0',
                                lineHeight: '1.4',
                                paddingLeft: '48px'
                              }}>
                                {contact.description}
                              </div>
                            )}

                            {/* Companies */}
                            {companies.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: tags.length > 0 ? '8px' : '0', paddingLeft: '48px' }}>
                                {companies.map(company => (
                                  <span
                                    key={company.company_id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      background: theme === 'dark' ? '#1E3A5F' : '#DBEAFE',
                                      color: theme === 'dark' ? '#93C5FD' : '#1E40AF'
                                    }}
                                  >
                                    <FaBuilding size={9} />
                                    {company.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Tags */}
                            {tags.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '48px' }}>
                                {tags.map(tag => (
                                  <span
                                    key={tag.tag_id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                                      color: theme === 'dark' ? '#D1D5DB' : '#4B5563'
                                    }}
                                  >
                                    <FaTag size={9} />
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Linked Email Thread */}
                  {selectedIntroductionItem?.email_thread_id && (
                    <div style={{ marginTop: '24px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                        Linked Email Thread
                      </label>
                      {introEmailLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                          Loading...
                        </div>
                      ) : introEmailMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '13px' }}>
                          No emails found in this thread
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {introEmailMessages.map((email, idx) => (
                            <div
                              key={email.email_id || idx}
                              style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                              }}
                            >
                              {/* Email header */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FaEnvelope size={12} style={{ color: email.direction === 'sent' ? '#10B981' : '#3B82F6' }} />
                                <span style={{ fontWeight: 500, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                                  {email.sender ? `${email.sender.first_name || ''} ${email.sender.last_name || ''}`.trim() : (email.direction === 'sent' ? 'Me' : 'Unknown')}
                                </span>
                                <span style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginLeft: 'auto' }}>
                                  {email.message_timestamp ? new Date(email.message_timestamp).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              {/* Email body */}
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                                  lineHeight: '1.5',
                                  whiteSpace: 'pre-wrap',
                                  maxHeight: '200px',
                                  overflow: 'auto'
                                }}
                              >
                                {email.body_plain || (email.body_html ? email.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) : '(No content)')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState theme={theme}>Select an introduction to view details</EmptyState>
            )
          ) : activeTab === 'notes' ? (
            <NotesFullTab
              theme={theme}
              onLinkedContactsChange={setNotesLinkedContacts}
              onLinkedCompaniesChange={setNotesLinkedCompanies}
              onLinkedDealsChange={setNotesLinkedDeals}
            />
          ) : activeTab === 'lists' ? (
            <ListsTab
              theme={theme}
              profileImageModal={profileImageModal}
              onMemberSelect={setSelectedListMember}
              onSetRightPanelContactId={(contactId) => {
                setSelectedRightPanelContactId(contactId);
                if (contactId) setActiveActionTab('crm');
              }}
            />
          ) : activeTab === 'tasks' ? (
            <TasksFullTab theme={theme} onLinkedContactsChange={setTasksLinkedContacts} onLinkedChatsChange={setTasksLinkedChats} onLinkedCompaniesChange={setTasksLinkedCompanies} onLinkedDealsChange={setTasksLinkedDeals} />
          ) : selectedThread && selectedThread.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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

                  {/* Add to Calendar - only for invitation emails */}
                  {isCalendarInvitation() && (
                    <button
                      onClick={handleImportCalendarInvitation}
                      disabled={importingCalendar}
                      title="Add to Living with Intention calendar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: theme === 'light' ? '#8B5CF6' : '#7C3AED',
                        color: 'white',
                        cursor: importingCalendar ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: importingCalendar ? 0.7 : 1,
                      }}
                    >
                      {importingCalendar ? (
                        <span style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid currentColor',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      ) : (
                        <FaCalendarPlus size={16} />
                      )}
                    </button>
                  )}

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
                    <iframe
                      title="email-content"
                      srcDoc={(() => {
                        const hasRealHtml = email.body_html && /<(html|body|div|p|br|span|table|tr|td|a href|img|ul|ol|li|h[1-6]|strong|em|b|i)[>\s/]/i.test(email.body_html);
                        const content = hasRealHtml
                          ? sanitizeEmailHtml(email.body_html)
                          : (email.body_text || email.body_html || email.snippet || 'No content').replace(/\n/g, '<br>');
                        return `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <base target="_blank">
                            <style>
                              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: ${theme === 'light' ? '#374151' : '#D1D5DB'}; background: transparent; }
                              img { max-width: 100%; height: auto; }
                              a { color: #3B82F6; }
                            </style>
                          </head>
                          <body>${content}</body>
                          </html>
                        `;
                      })()}
                      style={{
                        width: '100%',
                        border: 'none',
                        minHeight: '200px',
                        background: 'transparent',
                      }}
                      onLoad={(e) => {
                        const iframe = e.target;
                        if (iframe.contentDocument?.body) {
                          iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';

                          // Add keyboard shortcuts listener inside iframe - dispatch to parent
                          iframe.contentDocument.addEventListener('keydown', (ev) => {
                            if (!ev.altKey) return;
                            const validCodes = ['KeyP', 'KeyO', 'KeyE', 'KeyW', 'KeyC', 'KeyT', 'KeyD', 'KeyI', 'KeyN', 'KeyA', 'KeyF', 'KeyR', 'Digit1', 'Digit2', 'Digit3'];
                            if (validCodes.includes(ev.code)) {
                              ev.preventDefault();
                              // Dispatch custom event to parent document
                              window.dispatchEvent(new CustomEvent('emailIframeShortcut', { detail: { code: ev.code } }));
                            }
                          }, true);

                          // Add selection listener for date detection
                          iframe.contentDocument.addEventListener('mouseup', () => {
                            const selection = iframe.contentWindow.getSelection();
                            const selectedText = selection?.toString()?.trim();
                            if (selectedText && selectedText.length > 3 && selectedText.length < 100) {
                              const parsedDate = parseDateFromText(selectedText);
                              if (parsedDate) {
                                setCalendarTargetDate(parsedDate);
                                // Auto-switch to calendar panel if not already active
                                if (activeActionTab !== 'calendarPanel') {
                                  setActiveActionTab('calendarPanel');
                                }
                              }
                            }
                          });
                        }
                      }}
                    />
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
                          onClick={() => handleDownloadAttachment(att)}
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
                    <ActionBtn theme={theme} onClick={openAssign} style={{ background: theme === 'light' ? '#DBEAFE' : '#1E3A5F', color: theme === 'light' ? '#1D4ED8' : '#93C5FD' }}>
                      <FaUserCheck style={{ marginRight: '6px' }} />
                      Assign
                    </ActionBtn>

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
            </div>
          ) : threads.length === 0 ? (
            <EmptyState theme={theme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <img
                src={`${process.env.PUBLIC_URL}/inbox-zero.png`}
                alt="Inbox Zero!"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>Inbox Zero!</div>
              <button
                onClick={openNewCompose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: theme === 'light' ? '#10B981' : '#059669',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaEnvelope size={14} />
                New Email
              </button>
            </EmptyState>
          ) : (
            <EmptyState theme={theme}>Select a thread to view</EmptyState>
          )}
        </EmailContentPanel>

        {/* Right: Actions Panel */}
        <ActionsPanel theme={theme} $collapsed={rightPanelCollapsed}>
          {/* Data Integrity Warning Bar - show only for email/whatsapp/calendar when not collapsed */}
          {!rightPanelCollapsed && ['email', 'whatsapp', 'calendar'].includes(activeTab) && (
            <DataIntegrityWarningBar
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
          {/* Contact Selector Dropdown - show only when not collapsed and has contacts */}
          {!rightPanelCollapsed && enrichedRightPanelContacts.length > 0 && (
            <div style={{ padding: '8px 12px 0 12px' }}>
              <ContactSelector
                contacts={enrichedRightPanelContacts}
                selectedContactId={selectedRightPanelContactId}
                onSelect={setSelectedRightPanelContactId}
                onAddNew={() => setCreateContactModalOpen(true)}
                theme={theme}
              />
            </div>
          )}
          {/* Right Panel Content with Vertical Navigation */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Vertical Navigation Sidebar */}
            <RightPanelVerticalNav theme={theme}>
              <CollapseButton theme={theme} onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}>
                {rightPanelCollapsed ? <FaChevronLeft /> : <FaChevronRight />}
              </CollapseButton>
              {!rightPanelCollapsed && (
                <>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'crm'} onClick={() => setActiveActionTab('crm')} title="Contact Details (⌥P)">
                    <FaUser /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>P</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'company'} onClick={() => setActiveActionTab('company')} title="Company Details (⌥O)">
                    <FaBuilding /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>O</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'email'} onClick={() => setActiveActionTab('email')} title="Send Email (⌥E)" style={{ color: activeActionTab === 'email' ? '#3B82F6' : undefined }}>
                    <FaEnvelope /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>E</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'whatsapp'} onClick={() => setActiveActionTab('whatsapp')} title="WhatsApp Chat (⌥W)" style={{ color: activeActionTab === 'whatsapp' ? '#22C55E' : undefined }}>
                    <FaWhatsapp /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>W</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'calendarPanel'} onClick={() => setActiveActionTab('calendarPanel')} title="Calendar View (⌥C)" style={{ color: activeActionTab === 'calendarPanel' ? '#F59E0B' : undefined }}>
                    <FaCalendarAlt /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>C</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'tasks'} onClick={() => setActiveActionTab('tasks')} title="Tasks (⌥T)" style={{ color: activeActionTab === 'tasks' ? '#10B981' : undefined }}>
                    <FaTasks /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>T</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'deals'} onClick={() => setActiveActionTab('deals')} title="Deals (⌥D)" style={{ color: activeActionTab === 'deals' ? '#10B981' : undefined }}>
                    <FaDollarSign /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>D</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'introductions'} onClick={() => setActiveActionTab('introductions')} title="Introductions (⌥I)" style={{ color: activeActionTab === 'introductions' ? '#EC4899' : undefined }}>
                    <FaHandshake /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>I</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'notes'} onClick={() => setActiveActionTab('notes')} title="Notes (⌥N)" style={{ color: activeActionTab === 'notes' ? '#F59E0B' : undefined }}>
                    <FaStickyNote /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>N</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'chat'} onClick={() => setActiveActionTab('chat')} title="Chat with Claude (⌥A)" style={{ color: activeActionTab === 'chat' ? '#8B5CF6' : undefined }}>
                    <FaRobot /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>A</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'files'} onClick={() => setActiveActionTab('files')} title="Files (⌥F)" style={{ color: activeActionTab === 'files' ? '#3B82F6' : undefined }}>
                    <FaPaperclip /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>F</span>
                  </ActionTabIcon>
                  <ActionTabIcon theme={theme} $active={activeActionTab === 'related'} onClick={() => setActiveActionTab('related')} title="Related by Tag (⌥R)" style={{ color: activeActionTab === 'related' ? '#F59E0B' : undefined }}>
                    <FaTag /><span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, fontWeight: 600, opacity: 0.6 }}>R</span>
                  </ActionTabIcon>
                </>
              )}
            </RightPanelVerticalNav>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Keep in Touch uses the shared ContactDetailsTab below (DRY) */}

          {/* KEEPINTOUCH_CUSTOM_PANEL_REMOVED_MARKER */}
          {false && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {/* Enrich with Apollo Button */}
              <button
                onClick={() => setKitEnrichmentModalOpen(true)}
                title="Enrich contact data with Apollo"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  marginBottom: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaRocket size={14} />
                Enrich with Apollo
              </button>

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
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={keepInTouchContactDetails.linkedin || ''}
                        onChange={(e) => handleUpdateContactField('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/..."
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                          background: theme === 'dark' ? '#374151' : '#FFFFFF',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          fontSize: '13px'
                        }}
                      />
                      <button
                        onClick={() => {
                          const linkedin = keepInTouchContactDetails.linkedin;
                          if (linkedin) {
                            // Open LinkedIn profile
                            const url = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
                            window.open(url, '_blank');
                          } else {
                            // Search LinkedIn for the contact
                            const name = `${keepInTouchContactDetails.first_name || ''} ${keepInTouchContactDetails.last_name || ''}`.trim();
                            const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
                            window.open(searchUrl, '_blank');
                          }
                        }}
                        title={keepInTouchContactDetails.linkedin ? 'Open LinkedIn profile' : 'Search on LinkedIn'}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                          background: keepInTouchContactDetails.linkedin
                            ? '#0A66C2'
                            : (theme === 'dark' ? '#374151' : '#FFFFFF'),
                          color: keepInTouchContactDetails.linkedin
                            ? '#FFFFFF'
                            : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {keepInTouchContactDetails.linkedin ? <FaLinkedin size={14} /> : <FaSearch size={12} />}
                      </button>
                    </div>
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
                  onBlur={(e) => handleUpdateContactField('description', e.target.value)}
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

          {/* Keep in Touch - Company Details Panel */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && activeActionTab === 'kitCompany' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {keepInTouchCompanies.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <FaBuilding size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>No company linked</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Link a company from the Contact tab</div>
                </div>
              ) : (
                <>
                  {/* Company Selector (if multiple companies) */}
                  {keepInTouchCompanies.length > 1 && (
                    <div style={{ marginBottom: '12px' }}>
                      <select
                        value={selectedKitCompanyId || ''}
                        onChange={(e) => setSelectedKitCompanyId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                          background: theme === 'dark' ? '#374151' : '#FFFFFF',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        {keepInTouchCompanies.map(cc => (
                          <option key={cc.company_id} value={cc.company_id}>
                            {cc.company?.name || 'Unknown Company'} {cc.is_primary ? '(Primary)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Enrich with Apollo Button */}
                  <button
                    onClick={() => setKitCompanyEnrichmentModalOpen(true)}
                    title="Enrich company data with Apollo"
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      marginBottom: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaRocket size={14} />
                    Enrich with Apollo
                  </button>

                  {kitCompanyDetails && (
                    <>
                      {/* Company Header with Logo */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                        padding: '12px',
                        background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}>
                        {kitCompanyLogo ? (
                          <img
                            src={kitCompanyLogo}
                            alt={kitCompanyDetails.name}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '8px',
                              objectFit: 'contain',
                              background: '#FFFFFF',
                              padding: '4px'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '8px',
                            background: theme === 'dark' ? '#374151' : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FaBuilding size={24} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: theme === 'dark' ? '#F9FAFB' : '#111827'
                          }}>
                            {kitCompanyDetails.name}
                          </div>
                          {kitCompanyDetails.category && kitCompanyDetails.category !== 'Not Set' && (
                            <div style={{
                              fontSize: '12px',
                              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                              marginTop: '2px'
                            }}>
                              {kitCompanyDetails.category}
                            </div>
                          )}
                          {kitCompanyDomains.length > 0 && (
                            <div style={{
                              fontSize: '11px',
                              color: '#3B82F6',
                              marginTop: '2px'
                            }}>
                              {kitCompanyDomains[0].domain}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Basic Info */}
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

                        {/* Name */}
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Company Name</label>
                          <input
                            type="text"
                            value={kitCompanyDetails.name || ''}
                            onChange={(e) => handleUpdateKitCompanyField('name', e.target.value)}
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

                        {/* Category */}
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>Category</label>
                          <select
                            value={kitCompanyDetails.category || 'Not Set'}
                            onChange={(e) => handleUpdateKitCompanyField('category', e.target.value)}
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
                            {['Not Set', 'Professional Investor', 'Competitor', 'Customer', 'Partner', 'Supplier', 'Media', 'Government', 'NGO', 'University', 'Startup', 'Corporate', 'Other'].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* LinkedIn */}
                        <div>
                          <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px' }}>LinkedIn</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={kitCompanyDetails.linkedin || ''}
                              onChange={(e) => handleUpdateKitCompanyField('linkedin', e.target.value)}
                              placeholder="https://linkedin.com/company/..."
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                                background: theme === 'dark' ? '#374151' : '#FFFFFF',
                                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                                fontSize: '13px'
                              }}
                            />
                            {kitCompanyDetails.linkedin && (
                              <a
                                href={kitCompanyDetails.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  background: '#0A66C2',
                                  color: '#FFFFFF',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <FaLinkedin size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{
                        background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Description
                        </div>
                        <textarea
                          value={kitCompanyDetails.description || ''}
                          onChange={(e) => handleUpdateKitCompanyField('description', e.target.value)}
                          placeholder="Company description..."
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                            background: theme === 'dark' ? '#374151' : '#FFFFFF',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            fontSize: '13px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      {/* Domains */}
                      <div style={{
                        background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <FaGlobe style={{ marginRight: '6px' }} />
                          Domains ({kitCompanyDomains.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {kitCompanyDomains.length === 0 ? (
                            <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No domains</span>
                          ) : (
                            kitCompanyDomains.map(d => (
                              <span
                                key={d.id}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  background: theme === 'dark' ? '#374151' : '#E5E7EB',
                                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <FaGlobe size={10} />
                                {d.domain}
                                {d.is_primary && <span style={{ fontSize: '10px', opacity: 0.7 }}>(primary)</span>}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{
                        background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <FaTag style={{ marginRight: '6px' }} />
                          Tags ({kitCompanyTags.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {kitCompanyTags.length === 0 ? (
                            <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No tags</span>
                          ) : (
                            kitCompanyTags.map(t => (
                              <span
                                key={t.entry_id}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  background: theme === 'dark' ? '#4B5563' : '#DBEAFE',
                                  color: theme === 'dark' ? '#93C5FD' : '#1D4ED8',
                                  fontSize: '12px'
                                }}
                              >
                                {t.tags?.name || 'Unknown'}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Cities */}
                      <div style={{
                        background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                        borderRadius: '8px',
                        padding: '12px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <FaMapMarkerAlt style={{ marginRight: '6px' }} />
                          Cities ({kitCompanyCities.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {kitCompanyCities.length === 0 ? (
                            <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No cities</span>
                          ) : (
                            kitCompanyCities.map(c => (
                              <span
                                key={c.entry_id}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  background: theme === 'dark' ? '#374151' : '#FEF3C7',
                                  color: theme === 'dark' ? '#FCD34D' : '#92400E',
                                  fontSize: '12px'
                                }}
                              >
                                {c.cities?.name || 'Unknown'}{c.cities?.country ? `, ${c.cities.country}` : ''}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Working Here */}
                      <div style={{
                        background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '12px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <FaUsers style={{ marginRight: '6px' }} />
                          Working Here ({kitCompanyContacts.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {kitCompanyContacts.length === 0 ? (
                            <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>No contacts linked</span>
                          ) : (
                            kitCompanyContacts.map(cc => (
                              <div
                                key={cc.contact_id}
                                onClick={() => {
                                  // Navigate to this contact in Keep in Touch
                                  const contact = keepInTouchContacts.find(c => c.contact_id === cc.contact_id);
                                  if (contact) {
                                    setSelectedKeepInTouchContact(contact);
                                    setActiveActionTab('crm');
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease',
                                  border: cc.contact_id === selectedKeepInTouchContact?.contact_id
                                    ? `2px solid ${theme === 'dark' ? '#6366F1' : '#4F46E5'}`
                                    : `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`
                                }}
                              >
                                {cc.contact?.profile_image_url ? (
                                  <img
                                    src={cc.contact.profile_image_url}
                                    alt=""
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                                  }}>
                                    {(cc.contact?.first_name?.[0] || '') + (cc.contact?.last_name?.[0] || '')}
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {cc.contact?.first_name} {cc.contact?.last_name}
                                  </div>
                                  {cc.contact?.job_role && (
                                    <div style={{
                                      fontSize: '11px',
                                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {cc.contact.job_role}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Keep in Touch - WhatsApp Chat Panel */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && activeActionTab === 'kitWhatsapp' && (
            <WhatsAppChatTab
              theme={theme}
              contact={selectedKeepInTouchContact}
              mobiles={keepInTouchMobiles}
              onMessageSent={(contactId) => {
                // Update local state
                setSelectedKeepInTouchContact(prev => ({
                  ...prev,
                  last_interaction_at: new Date().toISOString()
                }));
                // Refresh the keep in touch list
                setKeepInTouchRefreshTrigger(prev => prev + 1);
              }}
            />
          )}

          {/* Keep in Touch - Email Panel */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && activeActionTab === 'kitEmail' && (
            <SendEmailTab
              theme={theme}
              contact={selectedKeepInTouchContact}
              emails={keepInTouchEmails}
              onEmailSent={(contactId) => {
                // Update local state
                setSelectedKeepInTouchContact(prev => ({
                  ...prev,
                  last_interaction_at: new Date().toISOString()
                }));
                // Refresh the keep in touch list
                setKeepInTouchRefreshTrigger(prev => prev + 1);
              }}
            />
          )}

          {/* Introductions - Email Panel */}
          {!rightPanelCollapsed && activeTab === 'introductions' && selectedIntroductionItem && introductionsActionTab === 'email' && activeActionTab === 'introductions' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px' }}>
              {/* To Field - Selectable chips grouped by contact */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '8px', fontWeight: 600 }}>To (click to select/deselect)</label>
                {introContactEmails.length === 0 ? (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontSize: '13px',
                    fontStyle: 'italic'
                  }}>
                    No email addresses found
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Group emails by contact */}
                    {[...new Set(introContactEmails.map(e => e.contactName))].map(contactName => (
                      <div key={contactName}>
                        <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginBottom: '4px', fontWeight: 500 }}>
                          {contactName}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {introContactEmails.filter(e => e.contactName === contactName).map((e, idx) => {
                            const isSelected = selectedIntroEmails.includes(e.email);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedIntroEmails(prev => prev.filter(email => email !== e.email));
                                  } else {
                                    setSelectedIntroEmails(prev => [...prev, e.email]);
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  background: isSelected ? '#3B82F6' : theme === 'light' ? '#E5E7EB' : '#374151',
                                  color: isSelected ? '#FFFFFF' : theme === 'light' ? '#374151' : '#D1D5DB',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {e.email}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Link to existing email thread button */}
              <button
                onClick={handleOpenLinkEmailModal}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  marginBottom: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: 'transparent',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <FaLink size={12} />
                Link to Existing Email Thread
              </button>

              {/* Show linked email thread if exists */}
              {selectedIntroductionItem?.email_thread_id && (
                <div style={{
                  padding: '10px 12px',
                  marginBottom: '12px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <FaEnvelope size={14} style={{ color: '#3B82F6' }} />
                  <span style={{
                    flex: 1,
                    fontSize: '12px',
                    color: theme === 'dark' ? '#D1D5DB' : '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedIntroductionItem.email_thread?.subject || 'Email thread linked'}
                  </span>
                  <button
                    onClick={handleUnlinkIntroductionEmailThread}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      padding: '4px',
                    }}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              )}

              {/* Email Component - pass selected emails */}
              {selectedIntroEmails.length > 0 && (
                <SendEmailTab
                  theme={theme}
                  contact={{}}
                  emails={selectedIntroEmails.map(email => ({ email }))}
                  onEmailSent={() => {
                    toast.success('Email sent!');
                  }}
                  hideToField={true}
                  multipleRecipients={selectedIntroEmails}
                  defaultSubject={(() => {
                    const contacts = selectedIntroductionItem?.contacts || [];
                    const names = contacts.map(c => c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()).filter(n => n);
                    return names.length >= 2 ? `${names[0]} <> ${names[1]}` : names[0] || '';
                  })()}
                  introductionMode={true}
                  introContacts={(selectedIntroductionItem?.contacts || []).map(c => ({
                    firstName: c.first_name || '',
                    fullName: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()
                  }))}
                  introNotes={selectedIntroductionItem?.text || ''}
                  introductionId={selectedIntroductionItem?.introduction_id}
                  onIntroductionStatusUpdate={handleIntroductionStatusUpdated}
                />
              )}
              {selectedIntroEmails.length === 0 && introContactEmails.length > 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'light' ? '#9CA3AF' : '#6B7280', fontSize: '13px' }}>
                  Select at least one email address
                </div>
              )}
            </div>
          )}

          {/* Introductions - WhatsApp Panel */}
          {!rightPanelCollapsed && activeTab === 'introductions' && selectedIntroductionItem && introductionsActionTab === 'whatsapp' && activeActionTab === 'introductions' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px' }}>
              {/* Show group chat if group exists (check chat_id FK or fallback to whatsapp_group_jid) */}
              {(selectedIntroductionItem.chat_id || selectedIntroductionItem.whatsapp_group_jid) ? (
                <>
                  {/* Group header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    borderRadius: '10px',
                    background: theme === 'dark' ? '#064E3B' : '#D1FAE5',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#25D366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <FaUsers size={16} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: theme === 'dark' ? '#34D399' : '#065F46',
                      }}>
                        {selectedIntroductionItem.whatsapp_group_name || 'Introduction Group'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: theme === 'dark' ? '#6EE7B7' : '#059669',
                      }}>
                        Group created
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: theme === 'dark' ? '#111827' : '#F3F4F6',
                  }}>
                    {introGroupLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                        Loading messages...
                      </div>
                    ) : introGroupMessages.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        fontSize: '13px',
                      }}>
                        <FaWhatsapp size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <div>No messages yet in this group</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>Messages will appear here once someone writes</div>
                      </div>
                    ) : (
                      introGroupMessages.map((msg, idx) => (
                        <div
                          key={msg.id || idx}
                          style={{
                            alignSelf: msg.direction === 'sent' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '8px 12px',
                            borderRadius: msg.direction === 'sent' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                            background: msg.direction === 'sent'
                              ? '#25D366'
                              : theme === 'dark' ? '#374151' : '#FFFFFF',
                            color: msg.direction === 'sent' ? 'white' : theme === 'dark' ? '#F9FAFB' : '#111827',
                          }}
                        >
                          {msg.direction !== 'sent' && msg.from_name && (
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              marginBottom: '2px',
                              color: msg.direction === 'sent' ? 'rgba(255,255,255,0.8)' : '#25D366',
                            }}>
                              {msg.from_name}
                            </div>
                          )}
                          <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                            {msg.body_text || msg.snippet || ''}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            textAlign: 'right',
                            marginTop: '4px',
                            opacity: 0.7,
                          }}>
                            {msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input area */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-end',
                  }}>
                    <textarea
                      value={introGroupInput}
                      onChange={(e) => setIntroGroupInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendIntroGroupMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px',
                        resize: 'none',
                        minHeight: '40px',
                        maxHeight: '100px',
                        outline: 'none',
                      }}
                      rows={1}
                    />
                    <button
                      onClick={sendIntroGroupMessage}
                      disabled={!introGroupInput.trim() || introGroupSending}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: 'none',
                        background: introGroupInput.trim() && !introGroupSending ? '#25D366' : theme === 'dark' ? '#374151' : '#E5E7EB',
                        color: introGroupInput.trim() && !introGroupSending ? 'white' : theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        cursor: introGroupInput.trim() && !introGroupSending ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FaPaperPlane size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Create WhatsApp Group Button - Only show if no group yet */}
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={handleCreateIntroWhatsAppGroup}
                      disabled={creatingIntroGroup || introContactMobiles.length < 2}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: creatingIntroGroup
                          ? (theme === 'dark' ? '#374151' : '#E5E7EB')
                          : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: creatingIntroGroup ? (theme === 'dark' ? '#9CA3AF' : '#6B7280') : 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: creatingIntroGroup || introContactMobiles.length < 2 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: creatingIntroGroup ? 'none' : '0 2px 8px rgba(37, 211, 102, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {creatingIntroGroup ? (
                        <>
                          <span style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid currentColor',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Creating Group...
                        </>
                      ) : (
                        <>
                          <FaUsers size={16} />
                          Create WhatsApp Group
                        </>
                      )}
                    </button>
                    {introContactMobiles.length >= 2 && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        textAlign: 'center',
                      }}>
                        Group: {(() => {
                          const introducees = selectedIntroductionItem.contacts?.filter(c => c.role === 'introducee') || [];
                          return introducees.map(c => c.first_name || c.name?.split(' ')[0] || 'Unknown').join(' <> ');
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Link to existing chat button */}
                  <button
                    onClick={handleOpenLinkChatModal}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      marginBottom: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: 'transparent',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaLink size={12} />
                    Link to Existing Chat
                  </button>

                  {/* Empty state when no group can be created */}
                  {introContactMobiles.length < 2 && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '20px',
                    }}>
                      <FaWhatsapp size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <div>Need phone numbers for both contacts to create a WhatsApp group</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Keep in Touch - Chat with Claude */}
          {!rightPanelCollapsed && activeTab === 'keepintouch' && selectedKeepInTouchContact && activeActionTab === 'kitChat' && (
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
              keepInTouchMode={true}
              onKitQuickAction={(action) => {
                // Handle Keep in Touch quick actions
                switch (action) {
                  case 'calendar':
                    // TODO: Open calendar event creation for this contact
                    toast.info('Calendar: Coming soon');
                    break;
                  case 'note':
                    // TODO: Open note creation for this contact
                    toast.info('Note: Coming soon');
                    break;
                  case 'task':
                    // TODO: Open task creation for this contact
                    toast.info('Task: Coming soon');
                    break;
                  case 'deal':
                    // TODO: Open deal creation for this contact
                    toast.info('Deal: Coming soon');
                    break;
                  case 'introduction':
                    // TODO: Open introduction creation for this contact
                    toast.info('Introduction: Coming soon');
                    break;
                  case 'whatsapp':
                    // Switch to WhatsApp tab
                    setActiveActionTab('kitWhatsapp');
                    break;
                  case 'email':
                    // Switch to Email tab
                    setActiveActionTab('kitEmail');
                    break;
                  default:
                    break;
                }
              }}
            />
          )}

          {!rightPanelCollapsed && ((selectedThread && selectedThread.length > 0) || selectedWhatsappChat || selectedCalendarEvent || selectedPipelineDeal || (activeTab === 'tasks' && (tasksLinkedContacts.length > 0 || tasksLinkedChats.length > 0)) || (activeTab === 'notes' && notesLinkedContacts.length > 0) || (activeTab === 'keepintouch' && selectedKeepInTouchContact) || (activeTab === 'introductions' && selectedIntroductionItem) || (activeTab === 'lists' && selectedRightPanelContactId)) && (
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
                  onAddCalendar={() => handleCalendarExtract()}
                  onAddDeal={() => setCreateDealAIOpen(true)}
                  onAddTask={() => setActiveActionTab('tasks')}
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

              {activeActionTab === 'crm' && selectedRightPanelContactId && (
                <ContactDetailsTab
                  theme={theme}
                  contact={rightPanelContactDetails?.contact}
                  emails={rightPanelContactDetails?.emails || []}
                  mobiles={rightPanelContactDetails?.mobiles || []}
                  companies={rightPanelContactDetails?.companies || []}
                  tags={rightPanelContactDetails?.tags || []}
                  cities={rightPanelContactDetails?.cities || []}
                  lists={rightPanelContactDetails?.lists || []}
                  completenessScore={rightPanelContactDetails?.completenessScore}
                  keepInTouch={rightPanelContactDetails?.keepInTouch}
                  loading={rightPanelContactDetails?.loading}
                  editable={false}
                  onUpdateField={handleRightPanelUpdateContactField}
                  onUpdateKeepInTouch={handleUpdateKeepInTouch}
                  onCompanyClick={(companyId) => {
                    setSelectedRightPanelCompanyId(companyId);
                    setActiveActionTab('company');
                  }}
                  onEmailClick={(email) => {
                    setInitialSelectedEmail(email);
                    setActiveActionTab('email');
                  }}
                  onMobileClick={(mobile) => {
                    setInitialSelectedMobile(mobile);
                    setActiveActionTab('whatsapp');
                  }}
                  onTagClick={(tagId) => {
                    setInitialSelectedTagId(tagId);
                    setActiveActionTab('related');
                  }}
                  onEdit={() => {
                    if (rightPanelContactDetails?.contact?.contact_id) {
                      setDataIntegrityContactId(rightPanelContactDetails.contact.contact_id);
                      setDataIntegrityModalOpen(true);
                    }
                  }}
                  onMarkComplete={handleMarkContactComplete}
                  onManageEmails={() => {
                    if (rightPanelContactDetails?.contact) {
                      setContactForManageModal(rightPanelContactDetails.contact);
                      setManageEmailsModalOpen(true);
                    }
                  }}
                  onManageMobiles={() => {
                    if (rightPanelContactDetails?.contact) {
                      setContactForManageModal(rightPanelContactDetails.contact);
                      setManageMobilesModalOpen(true);
                    }
                  }}
                  onEnrich={() => {
                    if (rightPanelContactDetails?.contact) {
                      setSelectedKeepInTouchContact(rightPanelContactDetails.contact);
                      setKitEnrichmentModalOpen(true);
                    }
                  }}
                  onCheck={() => {
                    const c = rightPanelContactDetails?.contact;
                    if (c?.contact_id) {
                      let inboxId = null;
                      if (activeTab === 'email' && selectedThread?.length > 0) {
                        inboxId = selectedThread[0].id;
                      } else if (activeTab === 'whatsapp' && selectedWhatsappChat?.messages?.length > 0) {
                        inboxId = selectedWhatsappChat.messages[0].id;
                      } else if (activeTab === 'calendar' && selectedCalendarEvent) {
                        inboxId = selectedCalendarEvent.id;
                      }
                      handleRunContactChecks(c.contact_id, `${c.first_name || ''} ${c.last_name || ''}`.trim(), inboxId);
                    }
                  }}
                  onOpenProfileImageModal={profileImageModal.openModal}
                  onAddToList={() => {
                    if (rightPanelContactDetails?.contact) {
                      handleOpenAddToListModal(rightPanelContactDetails.contact);
                    }
                  }}
                  onManageTags={() => {
                    if (rightPanelContactDetails?.contact) {
                      setSelectedKeepInTouchContact(rightPanelContactDetails.contact);
                      setKitTagsModalOpen(true);
                    }
                  }}
                  onManageCities={() => {
                    if (rightPanelContactDetails?.contact) {
                      setSelectedKeepInTouchContact(rightPanelContactDetails.contact);
                      setKitCityModalOpen(true);
                    }
                  }}
                  onRefresh={() => rightPanelContactDetails?.refetch?.()}
                />
              )}
              {activeActionTab === 'company' && selectedRightPanelContactId && (
                <CompanyDetailsTab
                  theme={theme}
                  companies={rightPanelContactDetails?.companies || []}
                  selectedCompanyId={selectedRightPanelCompanyId}
                  onSelectCompany={setSelectedRightPanelCompanyId}
                  companyDetails={rightPanelCompanyDetails?.company}
                  companyLogo={rightPanelCompanyDetails?.logoUrl}
                  companyDomains={rightPanelCompanyDetails?.domains || []}
                  companyTags={rightPanelCompanyDetails?.tags || []}
                  companyCities={rightPanelCompanyDetails?.cities || []}
                  companyContacts={rightPanelCompanyDetails?.contacts || []}
                  editable={false}
                  loading={loadingRightPanelCompany || rightPanelContactDetails?.loading}
                  onCompanyNavigate={(companyId) => navigate(`/companies/${companyId}`)}
                  onContactClick={(contactId) => {
                    setSelectedRightPanelContactId(contactId);
                    setActiveActionTab('crm');
                  }}
                  onEdit={() => {
                    if (selectedRightPanelCompanyId) {
                      setCompanyDataIntegrityCompanyId(selectedRightPanelCompanyId);
                      setCompanyDataIntegrityModalOpen(true);
                    }
                  }}
                  onEnrich={() => {
                    if (rightPanelCompanyDetails?.company && selectedRightPanelCompanyId) {
                      setRightPanelCompanyEnrichModalOpen(true);
                    }
                  }}
                  onAssociateCompany={() => {
                    setRightPanelAssociateCompanyModalOpen(true);
                  }}
                  onDuplicates={() => {
                    if (rightPanelCompanyDetails?.company && selectedRightPanelCompanyId) {
                      setCompanyMergeCompany({ ...rightPanelCompanyDetails.company, company_id: selectedRightPanelCompanyId });
                      setCompanyMergeModalOpen(true);
                    }
                  }}
                  onMarkComplete={handleMarkCompanyComplete}
                  onRemoveAssociation={handleRemoveCompanyAssociation}
                  onRefresh={() => {
                    rightPanelContactDetails?.refetch?.();
                    setRightPanelCompanyRefreshKey(k => k + 1);
                  }}
                  onManageTags={() => {
                    if (rightPanelCompanyDetails?.company && selectedRightPanelCompanyId) {
                      setSelectedCompanyForModal({
                        id: selectedRightPanelCompanyId,
                        name: rightPanelCompanyDetails.company.name
                      });
                      setCompanyTagsModalOpen(true);
                    }
                  }}
                  onManageCities={() => {
                    if (rightPanelCompanyDetails?.company && selectedRightPanelCompanyId) {
                      setSelectedCompanyForModal({
                        id: selectedRightPanelCompanyId,
                        name: rightPanelCompanyDetails.company.name
                      });
                      setCompanyCityModalOpen(true);
                    }
                  }}
                />
              )}
              {activeActionTab === 'whatsapp' && (
                <RightPanelWhatsAppTab
                  theme={theme}
                  contactId={selectedRightPanelContactId}
                  mobiles={rightPanelContactDetails?.mobiles || []}
                  initialSelectedMobile={initialSelectedMobile}
                  directChats={activeTab === 'tasks' ? tasksLinkedChats : undefined}
                  onMessageSent={(contactId) => {
                    // Refresh contact details after message sent
                    if (contactId) {
                      toast.success('Message sent!');
                    }
                    setInitialSelectedMobile(null); // Reset after sending
                  }}
                />
              )}
              {activeActionTab === 'email' && (
                <RightPanelEmailTab
                  theme={theme}
                  contactId={selectedRightPanelContactId}
                  contact={rightPanelContactDetails?.contact}
                  emails={rightPanelContactDetails?.emails || []}
                  initialSelectedEmail={initialSelectedEmail}
                  onEmailSent={(contactId) => {
                    // Refresh after email sent
                    toast.success('Email sent!');
                    setInitialSelectedEmail(null); // Reset after sending
                  }}
                />
              )}
              {activeActionTab === 'deals' && (
                <DealsTab
                  theme={theme}
                  selectedThread={selectedThread}
                  contactDeals={contactDeals}
                  companyDeals={companyDeals}
                  setCreateDealAIOpen={setCreateDealAIOpen}
                  setCreateDealModalOpen={setCreateDealModalOpen}
                  onDeleteDealContact={handleDeleteDealContact}
                  onUpdateDealStage={handleUpdateDealStage}
                  contactId={selectedRightPanelContactId}
                  onDealAssociated={() => setRefreshDealsCounter(c => c + 1)}
                />
              )}
              {activeActionTab === 'introductions' && !(activeTab === 'introductions' && selectedIntroductionItem && ['email', 'whatsapp'].includes(introductionsActionTab)) && (
                <IntroductionsPanelTab
                  theme={theme}
                  contactId={selectedRightPanelContactId}
                  contactName={rightPanelContactDetails?.contact ? `${rightPanelContactDetails.contact.first_name || ''} ${rightPanelContactDetails.contact.last_name || ''}`.trim() : ''}
                  contactIntroductions={rightPanelContactDetails?.introductions || []}
                  setIntroductionModalOpen={setIntroductionModalOpen}
                  onEditIntroduction={handleEditIntroductionWithContacts}
                  onDeleteIntroduction={async (introductionId) => {
                    await handleDeleteIntroduction(introductionId);
                    // Refetch contact details to update introductions list
                    rightPanelContactDetails?.refetch?.();
                  }}
                  onIntroductionSelect={(intro) => {
                    // When intro selected in panel, sync with parent state if needed
                    if (intro) {
                      setSelectedIntroductionItem(intro);
                    }
                  }}
                  onRefresh={() => rightPanelContactDetails?.refetch?.()}
                  currentChat={activeTab === 'whatsapp' ? selectedWhatsappChat : null}
                />
              )}
              {activeActionTab === 'tasks' && (
                <TasksTab
                  theme={theme}
                  contactId={selectedRightPanelContactId}
                  contactName={rightPanelContactDetails?.contact ? `${rightPanelContactDetails.contact.first_name || ''} ${rightPanelContactDetails.contact.last_name || ''}`.trim() : ''}
                  contactCompanies={rightPanelContactDetails?.companies || []}
                  contactDeals={rightPanelContactDetails?.deals || []}
                  onTaskCreated={() => rightPanelContactDetails?.refetch?.()}
                />
              )}

              {activeActionTab === 'notes' && (
                <NotesTab
                  theme={theme}
                  contactId={selectedRightPanelContactId}
                  contactCompanies={rightPanelContactDetails?.companies || []}
                  contactDeals={rightPanelContactDetails?.deals || []}
                  onNoteCreated={() => rightPanelContactDetails?.refetch?.()}
                  openInObsidian={openInObsidian}
                />
              )}

              {activeActionTab === 'related' && (
                <RelatedTab
                  theme={theme}
                  contactTags={rightPanelContactDetails?.tags || []}
                  currentContactId={selectedRightPanelContactId}
                  initialSelectedTagId={initialSelectedTagId}
                  onContactClick={(contactId) => {
                    setSelectedRightPanelContactId(contactId);
                    setActiveActionTab('crm');
                  }}
                />
              )}

              {activeActionTab === 'files' && (
                <FilesTab
                  theme={theme}
                  contactId={selectedRightPanelContactId}
                  contact={rightPanelContactDetails}
                />
              )}

              {activeActionTab === 'calendarPanel' && (
                <CalendarPanelTab
                  theme={theme}
                  targetDate={calendarTargetDate}
                  onTargetDateHandled={() => setCalendarTargetDate(null)}
                  emailContext={selectedThread?.[0]}
                  contactContext={rightPanelContactDetails}
                />
              )}

            </>
          )}
            </div>
          </div>
        </ActionsPanel>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default DesktopLayout;

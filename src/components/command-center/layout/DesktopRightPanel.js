import { useState } from 'react';
import {
  ActionsPanel,
  ActionTabIcon,
  RightPanelVerticalNav,
  CollapseButton,
} from '../../../pages/CommandCenterPage.styles';
import {
  FaEnvelope, FaWhatsapp, FaCalendarAlt, FaChevronLeft, FaChevronRight,
  FaUser, FaBuilding, FaDollarSign, FaStickyNote, FaTimes, FaPaperPlane,
  FaHandshake, FaTasks, FaPaperclip, FaRobot, FaTag, FaLinkedin, FaRocket,
  FaGlobe, FaMapMarkerAlt, FaUsers, FaLink,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import DataIntegrityWarningBar from '../DataIntegrityWarningBar';
import ContactSelector from '../ContactSelector';
import ChatTab from '../ChatTab';
import AITab from '../AITab';
import ContactDetailsTab from '../ContactDetailsTab';
import CompanyDetailsTab from '../CompanyDetailsTab';
import SendEmailTab from '../SendEmailTab';
import WhatsAppChatTab from '../WhatsAppChatTab';
import RightPanelWhatsAppTab from '../RightPanelWhatsAppTab';
import RightPanelEmailTab from '../RightPanelEmailTab';
import CalendarPanelTab from '../CalendarPanelTab';
import IntroductionsPanelTab from '../IntroductionsPanelTab';
import RelatedTab from '../RelatedTab';
import FilesTab from '../FilesTab';
import NotesTab from '../NotesTab';
import TasksTab from '../TasksTab';
import DealsTab from '../DealsTab';
import DataIntegrityTab from '../DataIntegrityTab';

const DesktopRightPanel = ({
  theme,
  emailThreads,
  localState,
  localHandlers,
  whatsAppHook,
  calendarHook,
  dealsHook,
  kitHook,
  introductionsHook,
  dataIntegrityHook,
  rightPanelHook,
  chatHook,
  emailCompose,
  quickEditModal,
  profileImageModal,
  modalState,
}) => {
  // Destructure emailThreads
  const { emails, selectedThread } = emailThreads;

  // Destructure localState
  const {
    activeTab, rightPanelCollapsed, setRightPanelCollapsed,
    contactDeals, companyDeals, contactIntroductions, navigate,
  } = localState;

  // Destructure localHandlers
  const {
    handleDeleteDealContact, openInObsidian,
    setRefreshDealsCounter, handleUpdateDealStage,
  } = localHandlers;

  // Destructure whatsAppHook
  const {
    selectedWhatsappChat,
    setNewWhatsAppModalOpen, setNewWhatsAppMode,
    setNewGroupContacts, setNewGroupName,
  } = whatsAppHook;

  // Destructure calendarHook
  const {
    selectedCalendarEvent, calendarTargetDate, setCalendarTargetDate,
    calendarEventEdits, setCalendarEventEdits, calendarLoading,
    pendingCalendarEvent, setPendingCalendarEvent,
    handleCalendarExtract, handleCreateCalendarEvent, updateCalendarEventField,
    addEventTrigger, weekViewTrigger,
  } = calendarHook;

  // Destructure dealsHook
  const { selectedPipelineDeal, setCreateDealModalOpen, setCreateDealAIOpen } = dealsHook;

  // Destructure kitHook
  const {
    selectedKeepInTouchContact, setSelectedKeepInTouchContact,
    keepInTouchEmails, keepInTouchMobiles, keepInTouchCompanies,
    setKeepInTouchRefreshTrigger,
    handleDoNotKeepInTouch, handleOpenKeepInTouchModal,
    setKitTagsModalOpen, setKitCityModalOpen, setKitEnrichmentModalOpen,
    selectedKitCompanyId, setSelectedKitCompanyId,
    kitCompanyDetails, kitCompanyDomains, kitCompanyTags,
    kitCompanyCities, kitCompanyContacts, kitCompanyLogo,
    setKitCompanyEnrichmentModalOpen, handleUpdateKitCompanyField,
  } = kitHook;

  // Destructure introductionsHook
  const {
    selectedIntroductionItem, setSelectedIntroductionItem, introductionsActionTab,
    introContactEmails, introContactMobiles,
    selectedIntroEmails, setSelectedIntroEmails,
    creatingIntroGroup, introGroupMessages, introGroupLoading,
    introGroupInput, setIntroGroupInput, introGroupSending,
    setIntroductionModalOpen, handleEditIntroduction, handleDeleteIntroduction,
    handleCreateIntroWhatsAppGroup, handleOpenLinkChatModal,
    handleOpenLinkEmailModal, handleUnlinkIntroductionEmailThread,
    handleIntroductionStatusUpdated, handleEditIntroductionWithContacts,
    sendIntroGroupMessage,
  } = introductionsHook;

  // Destructure dataIntegrityHook
  const {
    loadingDataIntegrity, notInCrmEmails, notInCrmDomains,
    notInCrmTab, setNotInCrmTab,
    holdContacts, holdCompanies, holdTab, setHoldTab,
    incompleteContacts, incompleteCompanies, completenessTab, setCompletenessTab,
    duplicateContacts, duplicateCompanies, duplicatesTab, setDuplicatesTab,
    categoryMissingContacts, categoryMissingCompanies, categoryMissingTab, setCategoryMissingTab,
    keepInTouchMissingContacts, missingCompanyLinks,
    contactsMissingCompany, potentialCompanyMatches,
    expandedDataIntegrity, setExpandedDataIntegrity,
    setDataIntegrityModalOpen, setDataIntegrityContactId,
    setCompanyDataIntegrityModalOpen, setCompanyDataIntegrityCompanyId,
    auditResult, setAuditResult, auditActions, setAuditActions,
    selectedActions, setSelectedActions, loadingAudit, executingActions,
    suggestionsFromMessage,
    handleRunContactChecks, handleAddToSpam, handlePutOnHold,
    handleEditCategoryMissingContact, handleHoldCategoryMissingContact,
    handleDeleteCategoryMissingContact, handleOpenAddToListModal,
    handleEditCategoryMissingCompany, handleHoldCategoryMissingCompany,
    handleDeleteCategoryMissingCompany,
    handleAddFromHold, handleSpamFromHold, handleOpenCreateContact,
    handleAddCompanyFromDomain, handleAddContactFromNotInCrm,
    handleDomainAction, handleAddCompanyFromHold, handleDeleteCompanyFromHold,
    handleLinkContactToCompany, handleLinkDomainToCompany,
    handleDismissPotentialMatch, handleLinkContactToCompanyByDomain,
    handleDismissDuplicate, handleConfirmMergeDuplicate,
    runContactAudit, executeSelectedActions, toggleActionSelection,
  } = dataIntegrityHook;

  // Destructure rightPanelHook
  const {
    activeActionTab, setActiveActionTab,
    selectedRightPanelContactId, setSelectedRightPanelContactId,
    tasksLinkedContacts, tasksLinkedChats,
    notesLinkedContacts,
    selectedRightPanelCompanyId, setSelectedRightPanelCompanyId,
    rightPanelCompanyDetails, loadingRightPanelCompany,
    setRightPanelCompanyRefreshKey,
    setRightPanelCompanyEnrichModalOpen,
    setRightPanelAssociateCompanyModalOpen,
    setCompanyMergeModalOpen, setCompanyMergeCompany,
    initialSelectedEmail, setInitialSelectedEmail,
    initialSelectedMobile, setInitialSelectedMobile,
    initialSelectedTagId, setInitialSelectedTagId,
    rightPanelContactDetails, enrichedRightPanelContacts,
    handleRightPanelUpdateContactField, handleUpdateKeepInTouch,
    handleMarkContactComplete, handleMarkCompanyComplete,
    handleRemoveCompanyAssociation,
  } = rightPanelHook;

  // Destructure chatHook
  const {
    chatMessages, chatInput, setChatInput, chatLoading,
    chatImages, chatMessagesRef, chatFileInputRef,
    sendMessageToClaude, handleQuickAction, handleChatImageSelect, removeChatImage,
  } = chatHook;

  // Destructure emailCompose
  const {
    openReply, openReplyWithDraft, sending, extractDraftFromMessage,
  } = emailCompose;

  // Destructure quickEditModal
  const { openModal: handleOpenQuickEditModal } = quickEditModal;

  // Destructure modalState
  const {
    setCompanyTagsModalOpen, setCompanyCityModalOpen, setSelectedCompanyForModal,
    setCreateContactModalOpen, setManageEmailsModalOpen,
    setManageMobilesModalOpen, setContactForManageModal,
  } = modalState;

  // Drag-and-drop state for deals icon
  const [dealsDragOver, setDealsDragOver] = useState(false);

  const handleDealsDrop = (e) => {
    e.preventDefault();
    setDealsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data?.type === 'attachment') {
        setActiveActionTab('deals');
        if (typeof localHandlers.onAttachmentDrop === 'function') {
          localHandlers.onAttachmentDrop(data);
        }
      }
    } catch (err) {
      console.error('Drop parse error:', err);
    }
  };

  const handleDealsDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDealsDragOver(true);
  };

  return (
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              height: '56px',
              minHeight: '56px',
              borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
              background: theme === 'light' ? '#FFFFFF' : '#1F2937',
            }}>
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
                  <ActionTabIcon
                    theme={theme}
                    $active={activeActionTab === 'deals'}
                    onClick={() => setActiveActionTab('deals')}
                    title="Deals (⌥D) — Drop attachment here"
                    style={{
                      color: dealsDragOver ? '#10B981' : (activeActionTab === 'deals' ? '#10B981' : undefined),
                      ...(dealsDragOver ? {
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                        transform: 'scale(1.2)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px',
                        transition: 'all 0.15s ease',
                      } : {}),
                    }}
                    onDragOver={handleDealsDragOver}
                    onDragLeave={() => setDealsDragOver(false)}
                    onDrop={handleDealsDrop}
                  >
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
                  contactName={rightPanelContactDetails?.contact ? `${rightPanelContactDetails.contact.first_name || ''} ${rightPanelContactDetails.contact.last_name || ''}`.trim() : ''}
                  contactImageUrl={rightPanelContactDetails?.contact?.profile_image_url}
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
                  onCreateGroup={() => {
                    const contact = rightPanelContactDetails?.contact;
                    const primaryMobile = (rightPanelContactDetails?.mobiles || []).find(m => m.is_primary) || (rightPanelContactDetails?.mobiles || [])[0];
                    // Pre-populate group with current contact
                    const preselected = [];
                    if (contact && primaryMobile) {
                      preselected.push({
                        contact_id: contact.contact_id,
                        first_name: contact.first_name,
                        last_name: contact.last_name,
                        phone: primaryMobile.mobile,
                        profile_image_url: contact.profile_image_url,
                      });
                    }
                    setNewGroupContacts(preselected);
                    setNewGroupName('');
                    setNewWhatsAppMode('group');
                    setNewWhatsAppModalOpen(true);
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
                  onAttachmentDrop={localHandlers.onAttachmentDrop}
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
                  addEventTrigger={addEventTrigger}
                  weekViewTrigger={weekViewTrigger}
                />
              )}

            </>
          )}
            </div>
          </div>
        </ActionsPanel>
  );
};

export default DesktopRightPanel;

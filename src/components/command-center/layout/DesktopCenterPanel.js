import React, { useState } from 'react';
import {
  EmailContentPanel,
  EmailSubjectFull,
  EmailActions,
  AttachmentsSection,
  AttachmentsHeader,
  AttachmentsList,
  AttachmentChip,
  AttachmentSize,
  ActionBtn,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import {
  FaEnvelope, FaCalendar, FaCalendarPlus, FaChevronDown, FaUser, FaBuilding,
  FaDollarSign, FaTimes, FaTrash, FaLightbulb, FaHandshake, FaArchive, FaCrown,
  FaPaperclip, FaCheck, FaEdit, FaPlus, FaExternalLinkAlt, FaDownload, FaUserCheck,
  FaTag, FaUpload, FaFileAlt, FaMapMarkerAlt, FaVideo,
} from 'react-icons/fa';
import { FiEye } from 'react-icons/fi';
import FilePreviewModal, { isPreviewable } from '../../modals/FilePreviewModal';
import WhatsAppTab from '../WhatsAppTab';
import NotesCenterContent from '../center-panel/NotesCenterContent';
import ListsTab from '../ListsTab';
import TasksFullTab from '../TasksFullTab';

const DesktopCenterPanel = ({
  theme,
  emailThreads,
  localState,
  localHandlers,
  whatsAppHook,
  calendarHook,
  dealsHook,
  kitHook,
  introductionsHook,
  emailActionsHook,
  emailCompose,
  rightPanelHook,
  contextContactsHook,
  dataIntegrityHook,
  profileImageModal,
  modalState,
  notesHook,
}) => {
  // Destructure emailThreads
  const { emails, threads, selectedThread } = emailThreads;

  // Destructure localState
  const { activeTab, navigate } = localState;

  // Destructure localHandlers
  const {
    handleEmailAddressClick, emailHasContact,
    sanitizeEmailHtml, parseDateFromText,
  } = localHandlers;

  // Destructure dealsHook
  const {
    DEAL_STAGES, DEAL_CATEGORIES, DEAL_CURRENCIES, DEAL_SOURCES, DEAL_RELATIONSHIP_TYPES,
    selectedPipelineDeal,
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
    dealCompanySearchQuery, setDealCompanySearchQuery, dealCompanySearchResults, setDealCompanySearchResults, dealCompanySearchLoading,
    addDealAttachmentModalOpen, setAddDealAttachmentModalOpen,
    dealAttachmentSearchQuery, setDealAttachmentSearchQuery, dealAttachmentSearchResults, setDealAttachmentSearchResults,
    dealAttachmentSearchLoading, dealAttachmentUploading, dealAttachmentFileInputRef,
    setCreateDealModalOpen,
    handlePipelineDealStageChange, handleUpdateDealCategory,
    handleUpdateDealSource, handleUpdateDealInvestment,
    handleUpdateDealTitle, handleUpdateDealDescription,
    handleRemoveDealContact, handleRemoveDealCompany,
    handleSearchContacts, handleAddDealContact,
    handleSearchDealCompanies, handleAddDealCompany,
    handleSearchDealAttachments, handleAddDealAttachment,
    handleRemoveDealAttachment, handleUploadDealAttachment,
    handleDeleteDeal,
  } = dealsHook;

  // Destructure introductionsHook
  const {
    selectedIntroductionItem, setSelectedIntroductionItem,
    introEmailMessages, introEmailLoading,
    introContactCompanies, introContactTags,
    handleDeleteIntroduction, updateIntroductionField,
  } = introductionsHook;

  // Destructure whatsAppHook
  const {
    selectedWhatsappChat,
    handleWhatsAppDoneAsync, handleWhatsAppSpam,
    setNewWhatsAppModalOpen,
  } = whatsAppHook;

  // Destructure calendarHook
  const {
    selectedCalendarEvent,
    calendarEventDescription, setCalendarEventDescription,
    calendarEventNotes, setCalendarEventNotes,
    meetingLinkedNotes,
    calendarEventScore,
    handleUpdateMeetingDescription, handleUpdateMeetingScore, handleUpdateMeetingNotes,
    handleDeleteProcessedMeeting, handleProcessCalendarEvent, handleDeleteCalendarEvent,
    selectedContactsForMeeting,
    addMeetingContactModalOpen, setAddMeetingContactModalOpen,
    meetingContactSearchQuery, setMeetingContactSearchQuery,
    meetingContactSearchResults, setMeetingContactSearchResults, meetingContactSearchLoading,
    handleSearchMeetingContacts, handleAddMeetingContact, handleRemoveMeetingContact,
    editingCalendarTitle, setEditingCalendarTitle,
    calendarTitleInput, setCalendarTitleInput,
    handleUpdateCalendarTitle, importingCalendar,
    setCalendarTargetDate,
  } = calendarHook;

  // Destructure kitHook
  const {
    selectedKeepInTouchContact,
    keepInTouchContactDetails, keepInTouchCompanies, keepInTouchInteractions,
    handleUpdateKeepInTouchField, getCompanyLinkData,
    handleKeepInTouchSnooze, KEEP_IN_TOUCH_FREQUENCIES, WISHES_TYPES,
    setKitContactToLinkCompany,
  } = kitHook;

  // Destructure emailActionsHook
  const {
    saving, handleDoneClick, markAsSpam, deleteEmail,
    handleDownloadAttachment, updateItemStatus,
    handleImportCalendarInvitation, isCalendarInvitation,
    spamMenuOpen, setSpamMenuOpen,
  } = emailActionsHook;

  // Destructure emailCompose
  const { openReply, openForward, openAssign, openNewCompose } = emailCompose;

  // Destructure rightPanelHook
  const {
    activeActionTab, setActiveActionTab, setSelectedRightPanelContactId,
    setSelectedListMember,
    setTasksLinkedContacts, setTasksLinkedChats,
    setTasksLinkedCompanies, setTasksLinkedDeals,
  } = rightPanelHook;

  // Destructure contextContactsHook
  const { emailContacts } = contextContactsHook;

  // Destructure dataIntegrityHook
  const {
    setDataIntegrityModalOpen, setDataIntegrityContactId,
  } = dataIntegrityHook;

  // Destructure modalState
  const { MY_EMAIL, setDomainLinkModalOpen, setSelectedDomainForLink } = modalState;

  // File preview state
  const [previewFile, setPreviewFile] = useState(null);

  return (
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

                    {/* Linked notes from note_meetings (e.g. Granola AI notes) */}
                    {meetingLinkedNotes && meetingLinkedNotes.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        {meetingLinkedNotes.map((note) => (
                          <div
                            key={note.note_id}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                              backgroundColor: theme === 'light' ? '#fff' : '#1F2937',
                              marginBottom: '8px'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {note.note_type === 'meeting' ? '🤖 AI Meeting Notes' : note.title}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                color: theme === 'light' ? '#9CA3AF' : '#6B7280'
                              }}>
                                {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '14px',
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.6'
                            }}>
                              {note.markdown_content || ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Manual notes textarea */}
                    <textarea
                      value={calendarEventNotes}
                      onChange={(e) => setCalendarEventNotes(e.target.value)}
                      onBlur={handleUpdateMeetingNotes}
                      placeholder="Aggiungi note sul meeting..."
                      style={{
                        width: '100%',
                        flex: 1,
                        minHeight: meetingLinkedNotes && meetingLinkedNotes.length > 0 ? '80px' : '150px',
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
            <NotesCenterContent
              theme={theme}
              notesHook={notesHook}
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
                  {/* Spam - only for received emails */}
                  {selectedThread[0]?.from_email?.toLowerCase() !== MY_EMAIL && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setSpamMenuOpen(!spamMenuOpen)}
                        disabled={saving}
                        title="Mark as spam"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                          color: theme === 'light' ? '#DC2626' : '#FCA5A5',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: saving ? 0.5 : 1,
                          fontSize: '16px',
                        }}
                      >
                        🚫
                      </button>
                      {spamMenuOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '4px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          overflow: 'hidden',
                          zIndex: 100,
                          whiteSpace: 'nowrap',
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
                            Block Email: {selectedThread[0]?.from_email}
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
                            Block Domain: {selectedThread[0]?.from_email?.split('@')[1]}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

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
                      {allAttachments.map((att, idx) => {
                        const previewType = isPreviewable(att.type, att.name);
                        return (
                        <AttachmentChip
                          key={idx}
                          theme={theme}
                          onClick={() => {
                            if (previewType) {
                              setPreviewFile({
                                fileName: att.name,
                                fileType: att.type,
                                fileSize: att.size,
                                blobId: att.blobId,
                              });
                            } else {
                              handleDownloadAttachment(att);
                            }
                          }}
                          title={previewType
                            ? `Click to preview ${att.name || 'attachment'}`
                            : `Drag to Deals or click to download ${att.name || 'attachment'}`
                          }
                          draggable="true"
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('application/json', JSON.stringify({
                              type: 'attachment',
                              source: 'email',
                              file_name: att.name,
                              file_type: att.type,
                              blobId: att.blobId,
                              size: att.size,
                              fastmailId: att.fastmailId,
                            }));
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                        >
                          {previewType ? <FiEye size={12} /> : <FaDownload size={12} />}
                          <span>{att.name || 'Unnamed file'}</span>
                          {att.size && <AttachmentSize>({formatSize(att.size)})</AttachmentSize>}
                        </AttachmentChip>
                        );
                      })}
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

                    {/* Delete button */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
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

          <FilePreviewModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            file={previewFile}
            theme={theme}
          />
        </EmailContentPanel>
  );
};

export default DesktopCenterPanel;

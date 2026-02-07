import { FaSyncAlt, FaBolt, FaEnvelope, FaWhatsapp, FaCalendarPlus, FaCalendarWeek, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import LeftPanelShell from '../left-panel/LeftPanelShell';
import LeftPanelSearch from '../left-panel/LeftPanelSearch';
import EmailLeftContent from '../left-panel/EmailLeftContent';
import CalendarLeftContent from '../left-panel/CalendarLeftContent';
import DealsLeftContent from '../left-panel/DealsLeftContent';
import KITLeftContent from '../left-panel/KITLeftContent';
import IntroductionsLeftContent from '../left-panel/IntroductionsLeftContent';

const DesktopLeftPanel = ({
  theme,
  emailThreads,
  localState,
  localHandlers,
  whatsAppHook,
  calendarHook,
  dealsHook,
  kitHook,
  introductionsHook,
  contextContactsHook,
  emailCompose,
  rightPanelHook,
}) => {
  const { emails, threads, selectedThread, threadsLoading, refreshThreads } = emailThreads;
  const {
    activeTab, listCollapsed, setListCollapsed,
    emailSearchQuery, setEmailSearchQuery, emailSearchResults, setEmailSearchResults,
    emailSearchLoading, isSearchingEmails, setIsSearchingEmails,
    statusSections, setStatusSections, toggleStatusSection, filterByStatus,
  } = localState;
  const { handleSelectSearchResult, handleSelectThread, handleSelectCalendarSearchResult, getRelevantPerson } = localHandlers;
  const {
    whatsappChats, whatsappMessages,
    selectedWhatsappChat, setSelectedWhatsappChat,
    whatsappLoading, whatsappSearchQuery, setWhatsappSearchQuery,
    whatsappSearchResults, setWhatsappSearchResults,
    whatsappSearchLoading, isSearchingWhatsapp, setIsSearchingWhatsapp,
    setWhatsappRefreshTrigger, baileysStatus,
    setArchivedWhatsappContact, handleSelectWhatsappSearchResult,
    setShowBaileysQRModal, setNewWhatsAppModalOpen,
  } = whatsAppHook;
  const {
    calendarEvents, selectedCalendarEvent, setSelectedCalendarEvent,
    calendarViewMode, setCalendarViewMode, processedMeetings,
    calendarSearchQuery, setCalendarSearchQuery, calendarSearchResults,
    setCalendarSearchResults, calendarSearchLoading,
    isSearchingCalendar, setIsSearchingCalendar,
    calendarSections, setCalendarSections, calendarLoading, toggleCalendarSection, filterCalendarEvents,
    setCalendarEventScore, setCalendarEventNotes, setCalendarEventDescription,
    setAddEventTrigger, setWeekViewTrigger,
  } = calendarHook;
  const {
    pipelineDeals, selectedPipelineDeal, setSelectedPipelineDeal,
    dealsLoading, dealsSections, toggleDealsSection, filterDealsByStatus,
    getDealCategoryColor,
  } = dealsHook;
  const {
    keepInTouchContacts, keepInTouchLoading,
    selectedKeepInTouchContact, setSelectedKeepInTouchContact,
    keepInTouchSections, setKeepInTouchSections,
    keepInTouchSearchQuery, setKeepInTouchSearchQuery,
    keepInTouchSearchResults, setKeepInTouchSearchResults,
    keepInTouchSearchLoading, isSearchingKeepInTouch, setIsSearchingKeepInTouch,
    filterKeepInTouchByStatus,
  } = kitHook;
  const {
    introductionsList, introductionsLoading,
    selectedIntroductionItem, setSelectedIntroductionItem,
    introductionsSections, setIntroductionsSections,
    filterIntroductionsBySection,
  } = introductionsHook;
  const { emailContacts } = contextContactsHook;
  const { openNewCompose } = emailCompose || {};
  const { setActiveActionTab } = rightPanelHook || {};

  if (['notes', 'lists', 'tasks'].includes(activeTab)) return null;

  // --- Header actions (inline in header row) ---
  const headerActions = (() => {
    if (activeTab === 'email') {
      const allCollapsed = !statusSections.inbox && !statusSections.need_actions && !statusSections.waiting_input && !statusSections.archiving;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={openNewCompose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#10B981',
              color: '#fff',
              transition: 'opacity 0.2s',
            }}
            title="New Email"
          >
            <FaEnvelope size={13} />
          </button>
          <button
            onClick={() => refreshThreads()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              opacity: threadsLoading ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
            title="Refresh Emails"
          >
            <FaSyncAlt
              size={13}
              style={{
                animation: threadsLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
          <button
            onClick={() => {
              const newVal = allCollapsed;
              setStatusSections({ inbox: newVal, need_actions: newVal, waiting_input: newVal, archiving: newVal });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              transition: 'opacity 0.2s',
            }}
            title={allCollapsed ? 'Expand all sections' : 'Collapse all sections'}
          >
            {allCollapsed ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
        </div>
      );
    }
    if (activeTab === 'whatsapp') {
      const allCollapsed = !statusSections.inbox && !statusSections.need_actions && !statusSections.waiting_input && !statusSections.archiving;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setNewWhatsAppModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#25D366',
              color: '#fff',
              transition: 'opacity 0.2s',
            }}
            title="New WhatsApp Message"
          >
            <FaWhatsapp size={15} />
          </button>
          <button
            onClick={() => baileysStatus.status !== 'connected' && setShowBaileysQRModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: baileysStatus.status !== 'connected' ? 'pointer' : 'default',
              backgroundColor: baileysStatus.status === 'connected'
                ? (theme === 'light' ? '#D1FAE5' : '#065F46')
                : baileysStatus.status === 'qr_ready'
                ? (theme === 'light' ? '#FEF3C7' : '#78350F')
                : (theme === 'light' ? '#FEE2E2' : '#7F1D1D'),
              color: baileysStatus.status === 'connected'
                ? (theme === 'light' ? '#059669' : '#6EE7B7')
                : baileysStatus.status === 'qr_ready'
                ? (theme === 'light' ? '#D97706' : '#FCD34D')
                : (theme === 'light' ? '#DC2626' : '#FCA5A5'),
              transition: 'opacity 0.2s',
            }}
            title={baileysStatus.status === 'connected' ? 'Baileys connected' : 'Click to reconnect Baileys'}
          >
            <FaBolt size={13} />
          </button>
          <button
            onClick={() => setWhatsappRefreshTrigger(prev => prev + 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              opacity: whatsappLoading ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
            title="Refresh WhatsApp"
          >
            <FaSyncAlt
              size={13}
              style={{
                animation: whatsappLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
          <button
            onClick={() => {
              const newVal = allCollapsed;
              setStatusSections({ inbox: newVal, need_actions: newVal, waiting_input: newVal, archiving: newVal });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              transition: 'opacity 0.2s',
            }}
            title={allCollapsed ? 'Expand all sections' : 'Collapse all sections'}
          >
            {allCollapsed ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
        </div>
      );
    }
    if (activeTab === 'calendar') {
      const calAllCollapsed = !calendarSections.needReview && !calendarSections.thisWeek && !calendarSections.thisMonth && !calendarSections.upcoming;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            height: '32px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
          }}>
            <button
              onClick={() => setCalendarViewMode('toProcess')}
              style={{
                padding: '0 10px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: calendarViewMode === 'toProcess'
                  ? '#3B82F6'
                  : 'transparent',
                color: calendarViewMode === 'toProcess' ? '#fff' : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                transition: 'all 0.2s',
              }}
            >
              Inbox
            </button>
            <button
              onClick={() => setCalendarViewMode('processed')}
              style={{
                padding: '0 10px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: calendarViewMode === 'processed'
                  ? '#10B981'
                  : 'transparent',
                color: calendarViewMode === 'processed' ? '#fff' : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                transition: 'all 0.2s',
              }}
            >
              Done
            </button>
          </div>
          <button
            onClick={() => {
              setActiveActionTab('calendarPanel');
              setAddEventTrigger(prev => prev + 1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#10B981',
              color: '#fff',
              transition: 'opacity 0.2s',
            }}
            title="Add Event"
          >
            <FaCalendarPlus size={14} />
          </button>
          <button
            onClick={() => {
              setActiveActionTab('calendarPanel');
              setWeekViewTrigger(prev => prev + 1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              transition: 'opacity 0.2s',
            }}
            title="Week View"
          >
            <FaCalendarWeek size={13} />
          </button>
          <button
            onClick={() => {
              const newVal = calAllCollapsed;
              setCalendarSections({ needReview: newVal, thisWeek: newVal, thisMonth: newVal, upcoming: newVal });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              transition: 'opacity 0.2s',
            }}
            title={calAllCollapsed ? 'Expand all sections' : 'Collapse all sections'}
          >
            {calAllCollapsed ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
        </div>
      );
    }
    return null;
  })();

  // --- Search bar ---
  const searchBar = (() => {
    if (activeTab === 'email') {
      return (
        <LeftPanelSearch
          theme={theme}
          placeholder="Search saved emails..."
          value={emailSearchQuery}
          onChange={setEmailSearchQuery}
          onClear={() => {
            setEmailSearchQuery('');
            setEmailSearchResults([]);
            setIsSearchingEmails(false);
          }}
        />
      );
    }
    if (activeTab === 'whatsapp') {
      return (
        <LeftPanelSearch
          theme={theme}
          placeholder="Search saved chats..."
          value={whatsappSearchQuery}
          onChange={setWhatsappSearchQuery}
          onClear={() => {
            setWhatsappSearchQuery('');
            setWhatsappSearchResults([]);
            setIsSearchingWhatsapp(false);
            setArchivedWhatsappContact(null);
          }}
        />
      );
    }
    if (activeTab === 'calendar') {
      return (
        <LeftPanelSearch
          theme={theme}
          placeholder="Search events..."
          value={calendarSearchQuery}
          onChange={setCalendarSearchQuery}
          onClear={() => {
            setCalendarSearchQuery('');
            setCalendarSearchResults([]);
            setIsSearchingCalendar(false);
          }}
        />
      );
    }
    return null;
  })();

  // --- Counter ---
  const counter = (() => {
    if (activeTab === 'email' && threads.length > 0) {
      return `${threads.length} threads (${emails.length} emails)`;
    }
    if (activeTab === 'whatsapp' && whatsappChats.length > 0) {
      return `${whatsappChats.length} chats (${whatsappMessages.length} messages)`;
    }
    if (activeTab === 'calendar') {
      return calendarViewMode === 'toProcess'
        ? `${filterCalendarEvents(calendarEvents, 'needReview').length} inbox, ${filterCalendarEvents(calendarEvents, 'thisWeek').length} this week, ${filterCalendarEvents(calendarEvents, 'thisMonth').length} this month, ${filterCalendarEvents(calendarEvents, 'upcoming').length} upcoming`
        : `${processedMeetings.length} meetings processed`;
    }
    if (activeTab === 'deals' && pipelineDeals.length > 0) {
      return `${filterDealsByStatus(pipelineDeals, 'open').length} open, ${filterDealsByStatus(pipelineDeals, 'invested').length} invested`;
    }
    if (activeTab === 'keepintouch' && keepInTouchContacts.length > 0) {
      return `${filterKeepInTouchByStatus(keepInTouchContacts, 'due').length} due, ${filterKeepInTouchByStatus(keepInTouchContacts, 'dueSoon').length} due soon`;
    }
    if (activeTab === 'introductions' && introductionsList.length > 0) {
      return `${filterIntroductionsBySection(introductionsList, 'inbox').length} pending, ${filterIntroductionsBySection(introductionsList, 'monitoring').length} monitoring`;
    }
    return null;
  })();

  // --- Content ---
  const content = (() => {
    if (activeTab === 'email' || activeTab === 'whatsapp') {
      return (
        <EmailLeftContent
          theme={theme}
          activeTab={activeTab}
          threads={threads}
          emails={emails}
          selectedThread={selectedThread}
          threadsLoading={threadsLoading}
          handleSelectThread={handleSelectThread}
          getRelevantPerson={getRelevantPerson}
          isSearchingEmails={isSearchingEmails}
          emailSearchLoading={emailSearchLoading}
          emailSearchResults={emailSearchResults}
          emailSearchQuery={emailSearchQuery}
          handleSelectSearchResult={handleSelectSearchResult}
          whatsappChats={whatsappChats}
          whatsappMessages={whatsappMessages}
          selectedWhatsappChat={selectedWhatsappChat}
          setSelectedWhatsappChat={setSelectedWhatsappChat}
          whatsappLoading={whatsappLoading}
          isSearchingWhatsapp={isSearchingWhatsapp}
          whatsappSearchLoading={whatsappSearchLoading}
          whatsappSearchResults={whatsappSearchResults}
          whatsappSearchQuery={whatsappSearchQuery}
          handleSelectWhatsappSearchResult={handleSelectWhatsappSearchResult}
          emailContacts={emailContacts}
          statusSections={statusSections}
          toggleStatusSection={toggleStatusSection}
          filterByStatus={filterByStatus}
        />
      );
    }
    if (activeTab === 'calendar') {
      return (
        <CalendarLeftContent
          theme={theme}
          calendarEvents={calendarEvents}
          selectedCalendarEvent={selectedCalendarEvent}
          setSelectedCalendarEvent={setSelectedCalendarEvent}
          calendarViewMode={calendarViewMode}
          processedMeetings={processedMeetings}
          calendarSections={calendarSections}
          calendarLoading={calendarLoading}
          toggleCalendarSection={toggleCalendarSection}
          filterCalendarEvents={filterCalendarEvents}
          isSearchingCalendar={isSearchingCalendar}
          calendarSearchLoading={calendarSearchLoading}
          calendarSearchResults={calendarSearchResults}
          calendarSearchQuery={calendarSearchQuery}
          handleSelectCalendarSearchResult={handleSelectCalendarSearchResult}
          setCalendarEventDescription={setCalendarEventDescription}
          setCalendarEventScore={setCalendarEventScore}
          setCalendarEventNotes={setCalendarEventNotes}
        />
      );
    }
    if (activeTab === 'deals') {
      return (
        <DealsLeftContent
          theme={theme}
          pipelineDeals={pipelineDeals}
          selectedPipelineDeal={selectedPipelineDeal}
          setSelectedPipelineDeal={setSelectedPipelineDeal}
          dealsLoading={dealsLoading}
          dealsSections={dealsSections}
          toggleDealsSection={toggleDealsSection}
          filterDealsByStatus={filterDealsByStatus}
          getDealCategoryColor={getDealCategoryColor}
        />
      );
    }
    if (activeTab === 'keepintouch') {
      return (
        <KITLeftContent
          theme={theme}
          keepInTouchContacts={keepInTouchContacts}
          keepInTouchLoading={keepInTouchLoading}
          selectedKeepInTouchContact={selectedKeepInTouchContact}
          setSelectedKeepInTouchContact={setSelectedKeepInTouchContact}
          keepInTouchSections={keepInTouchSections}
          setKeepInTouchSections={setKeepInTouchSections}
          keepInTouchSearchQuery={keepInTouchSearchQuery}
          setKeepInTouchSearchQuery={setKeepInTouchSearchQuery}
          keepInTouchSearchResults={keepInTouchSearchResults}
          setKeepInTouchSearchResults={setKeepInTouchSearchResults}
          keepInTouchSearchLoading={keepInTouchSearchLoading}
          isSearchingKeepInTouch={isSearchingKeepInTouch}
          setIsSearchingKeepInTouch={setIsSearchingKeepInTouch}
          filterKeepInTouchByStatus={filterKeepInTouchByStatus}
        />
      );
    }
    if (activeTab === 'introductions') {
      return (
        <IntroductionsLeftContent
          theme={theme}
          introductionsList={introductionsList}
          introductionsLoading={introductionsLoading}
          selectedIntroductionItem={selectedIntroductionItem}
          setSelectedIntroductionItem={setSelectedIntroductionItem}
          introductionsSections={introductionsSections}
          setIntroductionsSections={setIntroductionsSections}
          filterIntroductionsBySection={filterIntroductionsBySection}
        />
      );
    }
    return null;
  })();

  return (
    <LeftPanelShell
      theme={theme}
      collapsed={listCollapsed}
      setCollapsed={setListCollapsed}
      headerActions={headerActions}
      searchBar={searchBar}
      counter={counter}
    >
      {content}
    </LeftPanelShell>
  );
};

export default DesktopLeftPanel;

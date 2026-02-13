import {
  EmailList,
  EmailItem,
  EmailSender,
  EmailSubject,
  EmailSnippet,
  SearchResultsHeader,
  SearchResultDate,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaCalendar } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';
import CalendarEventItem from './items/CalendarEventItem';

const CalendarLeftContent = ({
  theme,
  calendarEvents,
  selectedCalendarEvent,
  setSelectedCalendarEvent,
  calendarViewMode,
  processedMeetings,
  calendarSections,
  calendarLoading,
  toggleCalendarSection,
  filterCalendarEvents,
  isSearchingCalendar,
  calendarSearchLoading,
  calendarSearchResults,
  calendarSearchQuery,
  handleSelectCalendarSearchResult,
  setCalendarEventDescription,
  setCalendarEventScore,
  setCalendarEventNotes,
  setMeetingLinkedNotes,
}) => {
  const renderSearchResults = () => (
    <>
      <SearchResultsHeader theme={theme}>
        {calendarSearchLoading ? 'Searching...' : `${calendarSearchResults.length} events found`}
      </SearchResultsHeader>
      {calendarSearchResults.map(result => {
        const matchBadge = {
          name: { label: 'Name', color: '#10B981', bg: '#D1FAE5' },
          description: { label: 'Description', color: '#F59E0B', bg: '#FEF3C7' },
          attendee: { label: 'Attendee', color: '#3B82F6', bg: '#DBEAFE' },
          location: { label: 'Location', color: '#8B5CF6', bg: '#EDE9FE' }
        }[result.match_source] || { label: 'Match', color: '#6B7280', bg: '#F3F4F6' };

        const eventDate = result.event_date ? new Date(result.event_date) : null;
        const dateStr = eventDate ? eventDate.toLocaleDateString('en-GB', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
        }) : '';
        const timeStr = eventDate ? eventDate.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit'
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
  );

  const renderProcessedMeetings = () => (
    <>
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
              setMeetingLinkedNotes((meeting.note_meetings || []).map(nm => nm.notes).filter(Boolean));
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
                  {'\u2605'.repeat(parseInt(meeting.score) || 0)}
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
  );

  const renderToProcessSections = () => {
    const sections = ['needReview', 'thisWeek', 'thisMonth', 'upcoming'];
    const titles = { needReview: 'Inbox', thisWeek: 'This Week', thisMonth: 'This Month', upcoming: 'Upcoming' };

    return sections.map(sectionKey => (
      <CollapsibleSection
        key={sectionKey}
        theme={theme}
        title={titles[sectionKey]}
        count={filterCalendarEvents(calendarEvents, sectionKey).length}
        isOpen={calendarSections[sectionKey]}
        onToggle={() => toggleCalendarSection(sectionKey)}
      >
        {filterCalendarEvents(calendarEvents, sectionKey).map(event => (
          <CalendarEventItem
            key={event.id}
            theme={theme}
            event={event}
            isSelected={selectedCalendarEvent?.id === event.id}
            onClick={() => {
              setSelectedCalendarEvent(event);
              setCalendarEventDescription(event.body_text || event.description || '');
              setMeetingLinkedNotes([]);
            }}
          />
        ))}
      </CollapsibleSection>
    ));
  };

  return (
    <EmailList>
      {isSearchingCalendar ? (
        renderSearchResults()
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
        renderProcessedMeetings()
      ) : (
        renderToProcessSections()
      )}
    </EmailList>
  );
};

export default CalendarLeftContent;

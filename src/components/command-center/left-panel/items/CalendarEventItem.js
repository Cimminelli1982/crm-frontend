import {
  EmailItem,
  EmailSender,
  EmailUnreadDot,
  EmailSubject,
  EmailSnippet,
} from '../../../../pages/CommandCenterPage.styles';

export const cleanCalendarSubject = (subject) => {
  let clean = (subject || 'No title')
    .replace(/^\[(CONFIRMED|TENTATIVE|CANCELLED|CANCELED)\]\s*/i, '');
  const quickCallMatch = clean.match(/^Quick call - S\. Cimminelli \(([^)]+)\)$/i);
  if (quickCallMatch) {
    clean = quickCallMatch[1];
  } else {
    clean = clean
      .replace(/Simone Cimminelli/gi, '')
      .replace(/<>/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Meeting';
  }
  return clean;
};

export const isRemoteEvent = (eventLocation) => {
  const location = (eventLocation || '').toLowerCase();
  return location.includes('zoom') || location.includes('meet') ||
    location.includes('teams') || location.includes('webex') ||
    location.includes('http') || location.includes('skype');
};

export const formatCalendarDate = (date) => {
  const d = new Date(date);
  const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
  return `${dayName} ${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const CalendarEventItem = ({ theme, event, isSelected, onClick }) => {
  const cleanSubject = cleanCalendarSubject(event.subject);
  const isRemote = isRemoteEvent(event.event_location);
  const dateStr = formatCalendarDate(event.date);

  return (
    <EmailItem
      key={event.id}
      theme={theme}
      $selected={isSelected}
      $unread={!event.is_read}
      onClick={onClick}
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
};

export default CalendarEventItem;

// CalDAV client for Fastmail Calendar
// Docs: https://www.fastmail.com/dev/

const CALDAV_BASE_URL = 'https://caldav.fastmail.com/dav/calendars/user';
const DEFAULT_CALENDAR_PATH = 'Default';

// Generate a UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Format date to iCalendar format (YYYYMMDDTHHMMSSZ for UTC)
function formatICalDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Format date for DTSTART/DTEND with timezone
function formatICalDateTime(date, allDay = false) {
  const d = new Date(date);
  if (allDay) {
    // For all-day events, use VALUE=DATE format: YYYYMMDD
    return d.toISOString().split('T')[0].replace(/-/g, '');
  }
  // For timed events, use UTC format
  return formatICalDate(d);
}

// Escape special characters in iCalendar text
function escapeICalText(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export class CalDAVClient {
  constructor(username, token) {
    this.username = username;
    this.token = token;
    this.baseUrl = `${CALDAV_BASE_URL}/${encodeURIComponent(username)}`;
  }

  // Make authenticated request to CalDAV server
  // Fastmail CalDAV uses Basic auth with username and API token as password
  async request(url, method = 'GET', body = null, contentType = 'application/xml') {
    const basicAuth = Buffer.from(`${this.username}:${this.token}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
    };

    if (body) {
      headers['Content-Type'] = contentType;
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    return response;
  }

  // Get list of calendars
  async getCalendars() {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <C:calendar-description/>
  </D:prop>
</D:propfind>`;

    const response = await this.request(
      `${this.baseUrl}/`,
      'PROPFIND',
      propfindBody,
      'application/xml'
    );

    if (!response.ok) {
      throw new Error(`Failed to get calendars: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log('[CalDAV] Calendars response:', text.substring(0, 500));

    // Parse the XML response to extract calendar URLs
    // Simple regex parsing for calendar hrefs
    const calendars = [];
    const hrefMatches = text.match(/<D:href>([^<]+)<\/D:href>/g) || [];
    const displayNameMatches = text.match(/<D:displayname>([^<]*)<\/D:displayname>/g) || [];

    for (let i = 0; i < hrefMatches.length; i++) {
      const href = hrefMatches[i].replace(/<\/?D:href>/g, '');
      // Skip the base path
      if (href.endsWith('/') && href !== `${this.baseUrl}/`) {
        const name = displayNameMatches[i]
          ? displayNameMatches[i].replace(/<\/?D:displayname>/g, '')
          : href.split('/').filter(Boolean).pop();
        calendars.push({ href, name });
      }
    }

    return calendars;
  }

  // Get the default calendar URL - use pre-configured calendar
  async getDefaultCalendarUrl() {
    // Use the specific calendar URL directly (no discovery needed)
    const calendarUrl = `${this.baseUrl}/${DEFAULT_CALENDAR_PATH}/`;
    console.log('[CalDAV] Using calendar URL:', calendarUrl);
    return calendarUrl;
  }

  // Create a calendar event
  async createEvent({
    title,
    description = '',
    location = '',
    startDate,
    endDate,
    allDay = false,
    attendees = [], // Array of { email, name }
    reminders = [15], // Minutes before event
    calendarUrl = null,
  }) {
    // Get default calendar if not specified
    if (!calendarUrl) {
      calendarUrl = await this.getDefaultCalendarUrl();
    }

    const uid = generateUUID();
    const now = new Date();
    const dtstamp = formatICalDate(now);

    // Calculate end date if not provided (1 hour after start for timed events)
    if (!endDate) {
      const start = new Date(startDate);
      if (allDay) {
        // All-day events: end is next day
        endDate = new Date(start);
        endDate.setDate(endDate.getDate() + 1);
      } else {
        // Timed events: 1 hour duration
        endDate = new Date(start.getTime() + 60 * 60 * 1000);
      }
    }

    // Format dates
    let dtstart, dtend;
    if (allDay) {
      dtstart = `DTSTART;VALUE=DATE:${formatICalDateTime(startDate, true)}`;
      dtend = `DTEND;VALUE=DATE:${formatICalDateTime(endDate, true)}`;
    } else {
      dtstart = `DTSTART:${formatICalDateTime(startDate)}`;
      dtend = `DTEND:${formatICalDateTime(endDate)}`;
    }

    // Build attendee lines
    const attendeeLines = attendees.map(att => {
      const name = att.name ? `;CN=${escapeICalText(att.name)}` : '';
      return `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE${name}:mailto:${att.email}`;
    }).join('\r\n');

    // Build alarm/reminder lines
    const alarmLines = reminders.map(mins => `
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT${mins}M
END:VALARM`).join('');

    // Build the iCalendar event
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CRM Command Center//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}@cimminelli.com
DTSTAMP:${dtstamp}
${dtstart}
${dtend}
SUMMARY:${escapeICalText(title)}
${description ? `DESCRIPTION:${escapeICalText(description)}` : ''}
${location ? `LOCATION:${escapeICalText(location)}` : ''}
${attendeeLines}
ORGANIZER;CN=Simone Cimminelli:mailto:${this.username}
STATUS:CONFIRMED
SEQUENCE:0${alarmLines}
END:VEVENT
END:VCALENDAR`.replace(/\n\n+/g, '\n').trim();

    console.log('[CalDAV] Creating event with ICS:', ics);

    // PUT the event to CalDAV
    const eventUrl = `${calendarUrl}${uid}.ics`;

    const response = await this.request(
      eventUrl,
      'PUT',
      ics,
      'text/calendar; charset=utf-8'
    );

    if (!response.ok && response.status !== 201 && response.status !== 204) {
      const errorText = await response.text();
      console.error('[CalDAV] Create event failed:', response.status, errorText);
      throw new Error(`Failed to create event: ${response.status} ${response.statusText}`);
    }

    console.log('[CalDAV] Event created successfully:', uid);

    return {
      success: true,
      uid,
      url: eventUrl,
      title,
      startDate,
      endDate,
      location,
      attendees,
    };
  }

  // Update an existing event
  async updateEvent(eventUrl, eventData) {
    // For updates, we need to GET the existing event first, modify it, and PUT back
    // For simplicity, we'll just create a new version with the same UID

    const response = await this.request(eventUrl, 'GET');
    if (!response.ok) {
      throw new Error(`Event not found: ${response.status}`);
    }

    // Extract UID from URL
    const uid = eventUrl.split('/').pop().replace('.ics', '');

    // Create updated event
    return this.createEvent({
      ...eventData,
      calendarUrl: eventUrl.substring(0, eventUrl.lastIndexOf('/') + 1),
    });
  }

  // Delete an event
  async deleteEvent(eventUrl) {
    const response = await this.request(eventUrl, 'DELETE');

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete event: ${response.status}`);
    }

    return { success: true };
  }

  // Get events in a date range
  async getEvents(startDate, endDate, calendarUrl = null) {
    if (!calendarUrl) {
      calendarUrl = await this.getDefaultCalendarUrl();
    }

    const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${formatICalDate(startDate)}" end="${formatICalDate(endDate)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

    const response = await this.request(
      calendarUrl,
      'REPORT',
      reportBody,
      'application/xml'
    );

    if (!response.ok) {
      throw new Error(`Failed to get events: ${response.status}`);
    }

    const text = await response.text();
    console.log('[CalDAV] Events response:', text.substring(0, 1000));

    // Parse events from response (simplified)
    const events = [];
    const calDataMatches = text.match(/<C:calendar-data>([^]*?)<\/C:calendar-data>/g) || [];

    for (const match of calDataMatches) {
      const icsData = match
        .replace(/<\/?C:calendar-data>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      // Simple ICS parsing
      const summaryMatch = icsData.match(/SUMMARY:(.+)/);
      const dtstartMatch = icsData.match(/DTSTART[^:]*:(\d+T?\d*Z?)/);
      const dtendMatch = icsData.match(/DTEND[^:]*:(\d+T?\d*Z?)/);
      const locationMatch = icsData.match(/LOCATION:(.+)/);
      const uidMatch = icsData.match(/UID:(.+)/);

      if (summaryMatch) {
        events.push({
          uid: uidMatch?.[1]?.trim(),
          title: summaryMatch[1].trim(),
          startDate: dtstartMatch?.[1],
          endDate: dtendMatch?.[1],
          location: locationMatch?.[1]?.trim(),
        });
      }
    }

    return events;
  }
}

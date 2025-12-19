// CalDAV client for Fastmail Calendar - Production Grade
// Supports: ctag change detection, etag tracking, sync-collection, attendees
// Docs: https://www.fastmail.com/dev/

const CALDAV_BASE_URL = 'https://caldav.fastmail.com/dav/calendars/user';
const DEFAULT_CALENDAR_PATH = '8c9da7c3-501d-4a38-a784-e515b201f9f3';

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
    return d.toISOString().split('T')[0].replace(/-/g, '');
  }
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

// Unescape iCalendar text
function unescapeICalText(text) {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export class CalDAVClient {
  constructor(username, token) {
    this.username = username;
    this.token = token;
    this.baseUrl = `${CALDAV_BASE_URL}/${encodeURIComponent(username)}`;
    this.calendarUrl = `${this.baseUrl}/${DEFAULT_CALENDAR_PATH}/`;
  }

  // Make authenticated request to CalDAV server
  async request(url, method = 'GET', body = null, contentType = 'application/xml', depth = null) {
    const basicAuth = Buffer.from(`${this.username}:${this.token}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
    };

    if (body) {
      headers['Content-Type'] = contentType;
    }

    if (depth !== null) {
      headers['Depth'] = depth.toString();
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    return response;
  }

  // ==================== CHANGE DETECTION ====================

  // Get calendar ctag (changes when ANY event is modified)
  // This is the key to efficient sync - only fetch events if ctag changed
  async getCalendarCtag() {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <CS:getctag/>
    <D:displayname/>
  </D:prop>
</D:propfind>`;

    const response = await this.request(
      this.calendarUrl,
      'PROPFIND',
      propfindBody,
      'application/xml',
      0
    );

    if (!response.ok) {
      throw new Error(`Failed to get calendar ctag: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    // Extract ctag
    const ctagMatch = text.match(/<CS:getctag>([^<]+)<\/CS:getctag>/);
    const ctag = ctagMatch ? ctagMatch[1].trim() : null;

    // Extract display name
    const nameMatch = text.match(/<D:displayname>([^<]*)<\/D:displayname>/);
    const displayName = nameMatch ? nameMatch[1].trim() : 'Calendar';

    return { ctag, displayName };
  }

  // Get all events with their etags (for change detection per event)
  async getEventEtags() {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <D:getlastmodified/>
  </D:prop>
</D:propfind>`;

    const response = await this.request(
      this.calendarUrl,
      'PROPFIND',
      propfindBody,
      'application/xml',
      1
    );

    if (!response.ok) {
      throw new Error(`Failed to get event etags: ${response.status}`);
    }

    const text = await response.text();
    const etags = new Map();

    // Parse each response element
    const responseMatches = text.matchAll(/<D:response>([\s\S]*?)<\/D:response>/g);
    for (const match of responseMatches) {
      const responseBlock = match[1];

      const hrefMatch = responseBlock.match(/<D:href>([^<]+)<\/D:href>/);
      const etagMatch = responseBlock.match(/<D:getetag>"?([^"<]+)"?<\/D:getetag>/);

      if (hrefMatch && etagMatch) {
        const href = hrefMatch[1].trim();
        // Only include .ics files (events), not the calendar itself
        if (href.endsWith('.ics')) {
          const uid = href.split('/').pop().replace('.ics', '');
          etags.set(uid, etagMatch[1].trim());
        }
      }
    }

    return etags;
  }

  // ==================== SYNC OPERATIONS ====================

  // Full sync - get all events (use sparingly, prefer delta sync)
  async fullSync(startDate = null, endDate = null) {
    // Default: 3 months back, 12 months forward
    if (!startDate) {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
    }
    if (!endDate) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);
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
      this.calendarUrl,
      'REPORT',
      reportBody,
      'application/xml',
      1
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CalDAV] Full sync failed:', response.status, errorText);
      throw new Error(`Failed to sync calendar: ${response.status}`);
    }

    const text = await response.text();
    return this.parseMultigetResponse(text);
  }

  // Get specific events by UID (for delta sync)
  async getEventsByUid(uids) {
    if (!uids || uids.length === 0) return [];

    const hrefElements = uids
      .map(uid => `<D:href>${this.calendarUrl}${uid}.ics</D:href>`)
      .join('\n');

    const multigetBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-multiget xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  ${hrefElements}
</C:calendar-multiget>`;

    const response = await this.request(
      this.calendarUrl,
      'REPORT',
      multigetBody,
      'application/xml',
      1
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }

    const text = await response.text();
    return this.parseMultigetResponse(text);
  }

  // Parse multiget/calendar-query response
  parseMultigetResponse(xmlText) {
    const events = [];

    // Match each response block
    const responseMatches = xmlText.matchAll(/<D:response>([\s\S]*?)<\/D:response>/g);

    for (const match of responseMatches) {
      const responseBlock = match[1];

      // Extract href
      const hrefMatch = responseBlock.match(/<D:href>([^<]+)<\/D:href>/);
      const href = hrefMatch ? hrefMatch[1].trim() : null;

      // Extract etag
      const etagMatch = responseBlock.match(/<D:getetag>"?([^"<]+)"?<\/D:getetag>/);
      const etag = etagMatch ? etagMatch[1].trim() : null;

      // Extract calendar data
      const calDataMatch = responseBlock.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/);
      if (!calDataMatch) continue;

      const icsData = calDataMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');

      const event = this.parseICS(icsData);
      if (event) {
        event.href = href;
        event.etag = etag;
        events.push(event);
      }
    }

    return events;
  }

  // ==================== ICS PARSING (Enhanced) ====================

  parseICS(icsData) {
    // Unfold iCalendar lines (lines starting with space/tab are continuations)
    icsData = icsData.replace(/\r?\n[ \t]/g, '');

    // Extract only the VEVENT section (ignore VTIMEZONE which has its own DTSTART)
    const veventMatch = icsData.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
    if (!veventMatch) return null;
    const veventData = veventMatch[0];

    // Skip cancelled events
    if (veventData.includes('STATUS:CANCELLED')) {
      return null;
    }

    // Extract UID
    const uidMatch = veventData.match(/^UID:(.+)$/m);
    if (!uidMatch) return null;
    let uid = uidMatch[1].trim();
    // Remove @domain suffix if present for cleaner UIDs
    if (uid.includes('@')) {
      uid = uid.split('@')[0];
    }

    // Extract SEQUENCE (version number - increments on changes)
    const sequenceMatch = veventData.match(/^SEQUENCE:(\d+)/m);
    const sequence = sequenceMatch ? parseInt(sequenceMatch[1], 10) : 0;

    // Extract SUMMARY (title) - handle LANGUAGE prefix and multiline
    let title = '';
    const summaryMatch = veventData.match(/^SUMMARY[^:]*:(.+?)(?=\r?\n[A-Z])/ms);
    if (summaryMatch) {
      title = summaryMatch[1].trim();
      // Strip LANGUAGE prefix (e.g., "LANGUAGE=en-gb:Title")
      if (title.startsWith('LANGUAGE=')) {
        const colonIdx = title.indexOf(':');
        if (colonIdx !== -1) {
          title = title.substring(colonIdx + 1);
        }
      }
      // Handle folded lines (lines starting with space are continuations)
      title = title.replace(/\r?\n\s/g, '');
      title = unescapeICalText(title);
    }

    // Extract dates - handle DATE, DATE-TIME, and TZID formats
    let startDate = null;
    let endDate = null;
    let allDay = false;

    const dtstartLine = veventData.match(/^DTSTART[^:]*:(.+)$/m);
    const dtendLine = veventData.match(/^DTEND[^:]*:(.+)$/m);
    const durationLine = veventData.match(/^DURATION:(.+)$/m);

    if (dtstartLine) {
      const dtstr = dtstartLine[1].trim();
      const isDateOnly = veventData.match(/DTSTART;VALUE=DATE:/);

      if (isDateOnly || dtstr.length === 8) {
        allDay = true;
        startDate = `${dtstr.substring(0,4)}-${dtstr.substring(4,6)}-${dtstr.substring(6,8)}T00:00:00Z`;
      } else {
        startDate = this.parseICalDateTime(dtstr);
      }
    }

    if (dtendLine) {
      const dtstr = dtendLine[1].trim();
      const isDateOnly = veventData.match(/DTEND;VALUE=DATE:/);

      if (isDateOnly || dtstr.length === 8) {
        endDate = `${dtstr.substring(0,4)}-${dtstr.substring(4,6)}-${dtstr.substring(6,8)}T23:59:59Z`;
      } else {
        endDate = this.parseICalDateTime(dtstr);
      }
    } else if (durationLine && startDate) {
      // Handle DURATION instead of DTEND (e.g., PT30M = 30 minutes)
      const duration = durationLine[1].trim();
      const minutesMatch = duration.match(/PT(\d+)M/);
      const hoursMatch = duration.match(/PT(\d+)H/);
      let minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
      if (hoursMatch) minutes += parseInt(hoursMatch[1], 10) * 60;
      if (minutes > 0) {
        const start = new Date(startDate);
        endDate = new Date(start.getTime() + minutes * 60 * 1000).toISOString();
      }
    }

    // Extract LOCATION - strip X-JMAP-ID and LANGUAGE prefixes
    const locationMatch = veventData.match(/^LOCATION[^:]*:(.+?)(?=\r?\n[A-Z])/ms);
    let location = null;
    if (locationMatch) {
      location = locationMatch[1].trim().replace(/\r?\n\s/g, '');
      // Strip LANGUAGE= or other prefixes (e.g., "LANGUAGE=en-US:value")
      if (location.includes(':') && (location.startsWith('LANGUAGE=') || location.match(/^[A-Z-]+=.+:/))) {
        location = location.substring(location.indexOf(':') + 1);
      }
      location = unescapeICalText(location);
    }

    // Extract DESCRIPTION (can be multiline)
    const descMatch = veventData.match(/^DESCRIPTION[^:]*:(.+?)(?=\r?\n[A-Z][A-Z])/ms);
    let description = null;
    if (descMatch) {
      description = descMatch[1].trim().replace(/\r?\n\s/g, '');
      description = unescapeICalText(description);
    }

    // Extract ORGANIZER
    let organizerEmail = null;
    let organizerName = null;
    const organizerMatch = veventData.match(/^ORGANIZER[^:]*:mailto:([^\r\n]+)/im);
    if (organizerMatch) {
      organizerEmail = organizerMatch[1].trim().toLowerCase();
    }
    const organizerCnMatch = veventData.match(/ORGANIZER[^:]*CN=([^;:\r\n]+)/i);
    if (organizerCnMatch) {
      organizerName = organizerCnMatch[1].trim().replace(/"/g, '');
    }

    // Extract ATTENDEES (critical for meeting tracking)
    const attendees = [];
    const attendeeLines = veventData.matchAll(/^ATTENDEE([^:]*):mailto:([^\r\n]+)/gim);
    for (const match of attendeeLines) {
      const params = match[1];
      let email = match[2].trim().toLowerCase();

      // Extract CN (common name)
      const cnMatch = params.match(/CN=([^;]+)/i);
      let name = cnMatch ? cnMatch[1].trim().replace(/"/g, '') : '';

      // Extract PARTSTAT (participation status: ACCEPTED, DECLINED, TENTATIVE, NEEDS-ACTION)
      const partstatMatch = params.match(/PARTSTAT=([^;]+)/i);
      const partstat = partstatMatch ? partstatMatch[1].trim().toUpperCase() : 'NEEDS-ACTION';

      // Extract ROLE (REQ-PARTICIPANT, OPT-PARTICIPANT, CHAIR, NON-PARTICIPANT)
      const roleMatch = params.match(/ROLE=([^;]+)/i);
      const role = roleMatch ? roleMatch[1].trim().toUpperCase() : 'REQ-PARTICIPANT';

      // Extract RSVP
      const rsvpMatch = params.match(/RSVP=([^;]+)/i);
      const rsvp = rsvpMatch ? rsvpMatch[1].trim().toUpperCase() === 'TRUE' : false;

      attendees.push({
        email,
        name,
        status: partstat,
        role,
        rsvp,
      });
    }

    // Extract STATUS (CONFIRMED, TENTATIVE, CANCELLED)
    const statusMatch = veventData.match(/^STATUS:(.+)$/m);
    const status = statusMatch ? statusMatch[1].trim().toUpperCase() : 'CONFIRMED';

    // Extract RRULE (recurring event rule)
    const rruleMatch = veventData.match(/^RRULE:(.+)$/m);
    const recurrenceRule = rruleMatch ? rruleMatch[1].trim() : null;

    // Extract RECURRENCE-ID (for exceptions to recurring events)
    const recurrenceIdMatch = veventData.match(/^RECURRENCE-ID[^:]*:(.+)$/m);
    const recurrenceId = recurrenceIdMatch ? recurrenceIdMatch[1].trim() : null;

    // Extract LAST-MODIFIED
    const lastModifiedMatch = veventData.match(/^LAST-MODIFIED:(.+)$/m);
    const lastModified = lastModifiedMatch ? this.parseICalDateTime(lastModifiedMatch[1].trim()) : null;

    // Extract CREATED
    const createdMatch = veventData.match(/^CREATED:(.+)$/m);
    const created = createdMatch ? this.parseICalDateTime(createdMatch[1].trim()) : null;

    // Extract CATEGORIES
    const categoriesMatch = veventData.match(/^CATEGORIES:(.+)$/m);
    const categories = categoriesMatch ? categoriesMatch[1].trim().split(',').map(c => c.trim()) : [];

    // Extract TRANSP (transparency: OPAQUE = busy, TRANSPARENT = free)
    const transpMatch = veventData.match(/^TRANSP:(.+)$/m);
    const transparency = transpMatch ? transpMatch[1].trim().toUpperCase() : 'OPAQUE';
    const showAsBusy = transparency === 'OPAQUE';

    return {
      uid,
      title,
      description,
      location,
      startDate,
      endDate,
      allDay,
      organizerEmail,
      organizerName,
      attendees,
      status,
      sequence,
      recurrenceRule,
      recurrenceId,
      lastModified,
      created,
      categories,
      showAsBusy,
    };
  }

  // Parse iCal datetime to ISO string
  parseICalDateTime(dtstr) {
    if (!dtstr) return null;

    // Remove any trailing newlines
    dtstr = dtstr.trim();

    // Handle TZID format (e.g., TZID=Europe/London:20231215T100000)
    if (dtstr.includes(':')) {
      dtstr = dtstr.split(':').pop();
    }

    // Handle all-day (YYYYMMDD)
    if (dtstr.length === 8) {
      return `${dtstr.substring(0,4)}-${dtstr.substring(4,6)}-${dtstr.substring(6,8)}T00:00:00Z`;
    }

    // Handle datetime (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
    if (dtstr.length >= 15) {
      const year = dtstr.substring(0, 4);
      const month = dtstr.substring(4, 6);
      const day = dtstr.substring(6, 8);
      const hour = dtstr.substring(9, 11);
      const min = dtstr.substring(11, 13);
      const sec = dtstr.substring(13, 15);
      const isUTC = dtstr.endsWith('Z');
      return `${year}-${month}-${day}T${hour}:${min}:${sec}${isUTC ? 'Z' : ''}`;
    }

    return null;
  }

  // ==================== WRITE OPERATIONS ====================

  // Create a calendar event
  async createEvent({
    title,
    description = '',
    location = '',
    startDate,
    endDate,
    allDay = false,
    attendees = [],
    reminders = [15],
    timezone = 'Europe/Rome',
  }) {
    const uid = generateUUID();
    const now = new Date();
    const dtstamp = formatICalDate(now);

    if (!endDate) {
      const start = new Date(startDate);
      if (allDay) {
        endDate = new Date(start);
        endDate.setDate(endDate.getDate() + 1);
      } else {
        endDate = new Date(start.getTime() + 60 * 60 * 1000);
      }
    }

    // Format date as local time string without timezone conversion (YYYYMMDDTHHMMSS)
    const formatLocalDateTime = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    let dtstart, dtend;
    if (allDay) {
      dtstart = `DTSTART;VALUE=DATE:${formatICalDateTime(startDate, true)}`;
      dtend = `DTEND;VALUE=DATE:${formatICalDateTime(endDate, true)}`;
    } else {
      // Use TZID for timezone-aware datetime
      dtstart = `DTSTART;TZID=${timezone}:${formatLocalDateTime(startDate)}`;
      dtend = `DTEND;TZID=${timezone}:${formatLocalDateTime(endDate)}`;
    }

    const attendeeLines = attendees.map(att => {
      const name = att.name ? `;CN=${escapeICalText(att.name)}` : '';
      return `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE${name}:mailto:${att.email}`;
    }).join('\r\n');

    const hasAttendees = attendees && attendees.length > 0;
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CRM Command Center//EN',
      'CALSCALE:GREGORIAN',
      hasAttendees ? 'METHOD:REQUEST' : 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}@cimminelli.com`,
      `DTSTAMP:${dtstamp}`,
      dtstart,
      dtend,
      `SUMMARY:${escapeICalText(title)}`,
    ];

    if (description) icsLines.push(`DESCRIPTION:${escapeICalText(description)}`);
    if (location) icsLines.push(`LOCATION:${escapeICalText(location)}`);
    if (attendeeLines) icsLines.push(attendeeLines);

    icsLines.push(
      `ORGANIZER;CN=Simone Cimminelli:mailto:${this.username}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0'
    );

    reminders.forEach(mins => {
      icsLines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        `TRIGGER:-PT${mins}M`,
        'END:VALARM'
      );
    });

    icsLines.push('END:VEVENT', 'END:VCALENDAR');
    const ics = icsLines.join('\r\n');

    const eventUrl = `${this.calendarUrl}${uid}.ics`;

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

    console.log('[CalDAV] Event created:', uid);

    return {
      success: true,
      uid,
      url: eventUrl,
      title,
      startDate,
      endDate,
      location,
      attendees,
      ics, // Return ICS for email invite
    };
  }

  // Delete an event
  async deleteEvent(eventUrlOrUid) {
    let eventUrl = eventUrlOrUid;
    if (!eventUrl.startsWith('http')) {
      eventUrl = `${this.calendarUrl}${eventUrlOrUid}.ics`;
    }

    const response = await this.request(eventUrl, 'DELETE');

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      throw new Error(`Failed to delete event: ${response.status}`);
    }

    return { success: true };
  }

  // ==================== UTILITY ====================

  // Get list of calendars (for configuration)
  async getCalendars() {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <CS:getctag/>
    <C:calendar-description/>
  </D:prop>
</D:propfind>`;

    const response = await this.request(
      `${this.baseUrl}/`,
      'PROPFIND',
      propfindBody,
      'application/xml',
      1
    );

    if (!response.ok) {
      throw new Error(`Failed to get calendars: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const calendars = [];

    const responseMatches = text.matchAll(/<D:response>([\s\S]*?)<\/D:response>/g);
    for (const match of responseMatches) {
      const block = match[1];

      // Only include actual calendars (have calendar resourcetype)
      if (!block.includes('<C:calendar/>') && !block.includes('calendar')) continue;

      const hrefMatch = block.match(/<D:href>([^<]+)<\/D:href>/);
      const nameMatch = block.match(/<D:displayname>([^<]*)<\/D:displayname>/);
      const ctagMatch = block.match(/<CS:getctag>([^<]*)<\/CS:getctag>/);

      if (hrefMatch) {
        const href = hrefMatch[1].trim();
        // Extract calendar ID from href
        const pathParts = href.split('/').filter(Boolean);
        const calendarId = pathParts[pathParts.length - 1];

        calendars.push({
          href,
          calendarId,
          name: nameMatch ? nameMatch[1].trim() : calendarId,
          ctag: ctagMatch ? ctagMatch[1].trim() : null,
        });
      }
    }

    return calendars;
  }
}

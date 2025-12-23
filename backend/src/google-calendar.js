// Google Calendar API Client for Railway Backend
// Handles bidirectional sync with Google Calendar

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarClient {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get a fresh access token using the refresh token
  async getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GoogleCalendar] Token refresh failed:', error);
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    console.log('[GoogleCalendar] Access token refreshed');
    return this.accessToken;
  }

  // Make authenticated API request
  async request(endpoint, method = 'GET', body = null) {
    const token = await this.getAccessToken();
    const url = endpoint.startsWith('http') ? endpoint : `${CALENDAR_API_BASE}${endpoint}`;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GoogleCalendar] API error ${response.status}:`, errorText);
      // Include actual error message from Google
      let errorMessage = `Google Calendar API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {}
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ==================== READ OPERATIONS ====================

  // Get events from calendar (for sync)
  async getEvents(options = {}) {
    const {
      timeMin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
      timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ahead
      maxResults = 250,
      singleEvents = true,
      orderBy = 'startTime',
      syncToken = null,
    } = options;

    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: singleEvents.toString(),
      conferenceDataVersion: '1', // Include Google Meet data
    });

    if (syncToken) {
      // Incremental sync - only get changes since last sync
      params.set('syncToken', syncToken);
    } else {
      // Full sync
      params.set('timeMin', timeMin);
      params.set('timeMax', timeMax);
      params.set('orderBy', orderBy);
    }

    const endpoint = `/calendars/${encodeURIComponent(this.calendarId)}/events?${params}`;
    const data = await this.request(endpoint);

    return {
      events: data.items || [],
      nextSyncToken: data.nextSyncToken,
      nextPageToken: data.nextPageToken,
    };
  }

  // Get a single event by ID
  async getEvent(eventId) {
    const endpoint = `/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}`;
    return this.request(endpoint);
  }

  // ==================== WRITE OPERATIONS ====================

  // Create a new event
  async createEvent({
    title,
    description = '',
    location = '',
    startDate,
    endDate,
    allDay = false,
    attendees = [],
    reminders = { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
    sendUpdates = 'all', // 'all' sends invite emails, 'none' doesn't
    timezone = 'Europe/Rome',
    useGoogleMeet = false,
  }) {
    // Normalize date format - ensure full ISO 8601 format with seconds
    const normalizeDateTime = (dateStr) => {
      if (!dateStr) return null;
      // If missing seconds (e.g., 2026-01-22T16:00), add :00
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
        return dateStr + ':00';
      }
      return dateStr;
    };

    const normalizedStart = normalizeDateTime(startDate);
    const normalizedEnd = endDate ? normalizeDateTime(endDate) : null;

    const event = {
      summary: title,
      description,
      location,
      start: allDay
        ? { date: startDate.split('T')[0] }
        : { dateTime: normalizedStart, timeZone: timezone },
      end: allDay
        ? { date: endDate ? endDate.split('T')[0] : startDate.split('T')[0] }
        : { dateTime: normalizedEnd || new Date(new Date(normalizedStart).getTime() + 3600000).toISOString(), timeZone: timezone },
      reminders,
    };

    // Add Google Meet conference if requested
    if (useGoogleMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    // Add attendees if provided
    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map(att => ({
        email: att.email,
        displayName: att.name || '',
        responseStatus: 'needsAction',
      }));
    }

    // Add conferenceDataVersion=1 if using Google Meet
    const conferenceParam = useGoogleMeet ? '&conferenceDataVersion=1' : '';
    const endpoint = `/calendars/${encodeURIComponent(this.calendarId)}/events?sendUpdates=${sendUpdates}${conferenceParam}`;
    const result = await this.request(endpoint, 'POST', event);

    console.log('[GoogleCalendar] Event created:', result.id);
    return {
      id: result.id,
      htmlLink: result.htmlLink,
      ...result,
    };
  }

  // Update an existing event
  async updateEvent(eventId, updates, sendUpdates = 'all') {
    const endpoint = `/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=${sendUpdates}`;

    // First get the existing event
    const existing = await this.getEvent(eventId);

    // Merge updates
    const updated = {
      ...existing,
      ...updates,
    };

    // Handle date updates
    if (updates.startDate) {
      updated.start = updates.allDay
        ? { date: updates.startDate.split('T')[0] }
        : { dateTime: updates.startDate, timeZone: 'Europe/Rome' };
    }
    if (updates.endDate) {
      updated.end = updates.allDay
        ? { date: updates.endDate.split('T')[0] }
        : { dateTime: updates.endDate, timeZone: 'Europe/Rome' };
    }
    if (updates.title) {
      updated.summary = updates.title;
    }
    if (updates.attendees) {
      updated.attendees = updates.attendees.map(att => ({
        email: att.email,
        displayName: att.name || '',
        responseStatus: att.status || 'needsAction',
      }));
    }

    const result = await this.request(endpoint, 'PUT', updated);
    console.log('[GoogleCalendar] Event updated:', eventId);
    return result;
  }

  // Delete an event
  async deleteEvent(eventId, sendUpdates = 'all') {
    const endpoint = `/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=${sendUpdates}`;

    const token = await this.getAccessToken();
    const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      throw new Error(`Failed to delete event: ${response.status}`);
    }

    console.log('[GoogleCalendar] Event deleted:', eventId);
    return { success: true, eventId };
  }

  // ==================== SYNC HELPERS ====================

  // Transform Google Calendar event to command_center_inbox format
  transformEventForInbox(event) {
    // Skip cancelled events
    if (event.status === 'cancelled') {
      return null;
    }

    const startDate = event.start?.dateTime || event.start?.date;
    const endDate = event.end?.dateTime || event.end?.date;
    const isAllDay = !event.start?.dateTime;

    // Extract attendees
    const attendees = (event.attendees || []).map(att => ({
      email: att.email,
      name: att.displayName || '',
      status: att.responseStatus?.toUpperCase() || 'NEEDS-ACTION',
      self: att.self || false,
    }));

    // Get organizer
    const organizer = event.organizer || {};

    // Extract conference URL (Google Meet, Zoom, etc.)
    let conferenceUrl = null;
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
      if (videoEntry?.uri) {
        conferenceUrl = videoEntry.uri;
      }
    }

    // Physical location wins over conference URL
    let eventLocation = event.location || conferenceUrl || null;

    return {
      type: 'calendar',
      event_uid: event.id,
      google_event_id: event.id,
      subject: event.summary || 'Untitled Event',
      body_text: event.description || '',
      date: startDate,
      event_end: endDate,
      event_location: eventLocation,
      from_name: organizer.displayName || organizer.email || '',
      from_email: organizer.email || '',
      to_recipients: attendees,
      all_day: isAllDay,
      etag: event.etag,
      html_link: event.htmlLink,
      status: event.status?.toUpperCase() || 'CONFIRMED',
      updated_at: event.updated,
      created_at: event.created,
    };
  }
}

// Export singleton instance
let googleCalendarInstance = null;

export function getGoogleCalendarClient() {
  if (!googleCalendarInstance) {
    googleCalendarInstance = new GoogleCalendarClient();
  }
  return googleCalendarInstance;
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app';

const useCalendarData = (activeTab) => {
  // Calendar events from DB (staging)
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);
  const [editingCalendarTitle, setEditingCalendarTitle] = useState(false);
  const [calendarTitleInput, setCalendarTitleInput] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState('toProcess'); // 'toProcess' | 'processed'
  const [processedMeetings, setProcessedMeetings] = useState([]);
  const [calendarEventScore, setCalendarEventScore] = useState(null);
  const [calendarEventNotes, setCalendarEventNotes] = useState('');
  const [calendarEventDescription, setCalendarEventDescription] = useState('');
  const [selectedContactsForMeeting, setSelectedContactsForMeeting] = useState([]);

  // Calendar search state (for searching events and meetings)
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [calendarSearchResults, setCalendarSearchResults] = useState([]);
  const [calendarSearchLoading, setCalendarSearchLoading] = useState(false);
  const [isSearchingCalendar, setIsSearchingCalendar] = useState(false);

  // Calendar sections state (needReview, thisWeek, thisMonth, upcoming)
  const [calendarSections, setCalendarSections] = useState({
    needReview: true,
    thisWeek: true,
    thisMonth: true,
    upcoming: true
  });

  // Calendar state
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEventEdits, setCalendarEventEdits] = useState({});

  // Calendar target date (for navigating calendar from email text selection)
  const [calendarTargetDate, setCalendarTargetDate] = useState(null);

  // Importing calendar state
  const [importingCalendar, setImportingCalendar] = useState(false);

  // Meeting contact search (calendar-related)
  const [addMeetingContactModalOpen, setAddMeetingContactModalOpen] = useState(false);
  const [meetingContactSearchQuery, setMeetingContactSearchQuery] = useState('');
  const [meetingContactSearchResults, setMeetingContactSearchResults] = useState([]);
  const [meetingContactSearchLoading, setMeetingContactSearchLoading] = useState(false);

  // Triggers for CalendarPanelTab (from left panel buttons)
  const [addEventTrigger, setAddEventTrigger] = useState(0);
  const [weekViewTrigger, setWeekViewTrigger] = useState(0);

  // Fetch Calendar events from Supabase (all events - upcoming and past)
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setCalendarLoading(true);

      const { data, error } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('type', 'calendar')
        .order('date', { ascending: true }); // Order by date for processing

      if (error) {
        console.error('Error fetching calendar events:', error);
      } else {
        setCalendarEvents(data || []);
        if (calendarViewMode === 'toProcess' && data && data.length > 0) {
          setSelectedCalendarEvent({ ...data[0], source: 'inbox' });
        }
      }
      setCalendarLoading(false);
    };

    const fetchProcessedMeetings = async () => {
      setCalendarLoading(true);

      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_contacts (
            contact_id,
            contacts:contact_id (
              contact_id,
              first_name,
              last_name,
              profile_image_url
            )
          )
        `)
        .order('meeting_date', { ascending: false });

      if (error) {
        console.error('Error fetching processed meetings:', error);
      } else {
        setProcessedMeetings(data || []);
        if (calendarViewMode === 'processed' && data && data.length > 0) {
          setSelectedCalendarEvent({ ...data[0], source: 'meetings' });
          setCalendarEventScore(data[0].score ? parseInt(data[0].score) : null);
          setCalendarEventNotes(data[0].notes || '');
          setCalendarEventDescription(data[0].description || '');
        }
      }
      setCalendarLoading(false);
    };

    if (activeTab === 'calendar') {
      if (calendarViewMode === 'toProcess') {
        fetchCalendarEvents();
      } else {
        fetchProcessedMeetings();
      }
    }
  }, [activeTab, calendarViewMode]);

  // --- Helpers ---

  const toggleCalendarSection = (section) => {
    setCalendarSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter calendar events by needReview/thisWeek/upcoming (time-aware)
  const filterCalendarEvents = (events, type) => {
    const now = new Date(); // Current time (not midnight)

    // Get start of today for week calculation
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Get end of this week (Sunday)
    const endOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endOfWeek.setDate(startOfToday.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get end of this month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (type === 'thisWeek') {
      // Events that haven't started yet and are within this week
      return events
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now && eventDate <= endOfWeek;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (type === 'thisMonth') {
      // Events after this week but within current month
      return events
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate > endOfWeek && eventDate <= endOfMonth;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (type === 'upcoming') {
      // Events after this month
      return events
        .filter(event => new Date(event.date) > endOfMonth)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (type === 'needReview' || type === 'past') {
      // Past events (start time has passed), sorted most recent first
      return events
        .filter(event => new Date(event.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return [];
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

  // --- Handlers ---

  // Handle calendar extraction from email or WhatsApp
  // NOTE: This handler requires external deps (setChatMessages, selectedThread, selectedWhatsappChat)
  // which must be passed via the `externalDeps` object.
  const handleCalendarExtract = async ({ setChatMessages, selectedThread, selectedWhatsappChat } = {}) => {
    // Context-aware: check which tab is active
    const isWhatsApp = activeTab === 'whatsapp';

    if (isWhatsApp) {
      if (!selectedWhatsappChat || !selectedWhatsappChat.messages?.length) {
        toast.error('No WhatsApp chat selected');
        return;
      }
    } else {
      if (!selectedThread || selectedThread.length === 0) {
        toast.error('No email selected');
        return;
      }
    }

    setCalendarLoading(true);
    setPendingCalendarEvent(null);
    setCalendarEventEdits({});

    // Add a user message to chat
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: isWhatsApp ? '📅 Extract meeting from this WhatsApp chat' : '📅 Extract meeting from this email'
    }]);

    try {
      // Build request body based on source
      let requestBody;
      if (isWhatsApp) {
        requestBody = {
          whatsapp: {
            contact_name: selectedWhatsappChat.chat_name || selectedWhatsappChat.contact_number,
            contact_number: selectedWhatsappChat.contact_number,
            is_group_chat: selectedWhatsappChat.is_group_chat || false,
            messages: selectedWhatsappChat.messages.map(m => ({
              content: m.body_text,
              is_from_me: m.direction === 'sent',
              timestamp: m.date,
              sender_name: m.first_name || m.sender || null,
              sender_number: m.contact_number || null,
            })),
          }
        };
      } else {
        // Send the entire thread for context, not just the first email
        const threadMessages = selectedThread.map(email => ({
          from_email: email.from_email,
          from_name: email.from_name,
          to_recipients: email.to_recipients || [],
          cc_recipients: email.cc_recipients || [],
          subject: email.subject,
          body_text: email.body_text,
          snippet: email.snippet,
          date: email.date,
        }));

        // Combine all body_text for full context
        const fullThreadText = selectedThread
          .map(e => `From: ${e.from_name || e.from_email}\nDate: ${e.date}\n\n${e.body_text || e.snippet || ''}`)
          .join('\n\n---\n\n');

        const latestEmail = selectedThread[0];
        requestBody = {
          email: {
            from_email: latestEmail.from_email,
            from_name: latestEmail.from_name,
            to_recipients: latestEmail.to_recipients || [],
            cc_recipients: latestEmail.cc_recipients || [],
            subject: latestEmail.subject,
            body_text: fullThreadText, // Full thread content
            snippet: latestEmail.snippet,
            date: latestEmail.date,
            thread_messages: threadMessages, // Include all messages
          }
        };
      }

      const response = await fetch(`${BACKEND_URL}/calendar/extract-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
        const sourceText = isWhatsApp ? 'this chat' : 'this email';
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `🤔 No meeting found in ${sourceText}. Is there something specific you'd like to schedule?`
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

  // Dismiss calendar event from inbox (won't be re-synced)
  const handleDeleteCalendarEvent = async (eventId) => {
    if (!eventId) {
      toast.error('No event selected');
      return;
    }

    if (!window.confirm('Dismiss this calendar event? It won\'t appear again on future syncs.')) {
      return;
    }

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/calendar/delete-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: eventId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dismiss event');
      }

      // Remove from local state
      const currentIndex = calendarEvents.findIndex(e => e.id === eventId);
      setCalendarEvents(prev => prev.filter(e => e.id !== eventId));

      // Select next event or clear selection
      if (calendarEvents.length > 1) {
        const nextIndex = currentIndex >= calendarEvents.length - 1 ? currentIndex - 1 : currentIndex;
        const nextEvent = calendarEvents.filter(e => e.id !== eventId)[nextIndex];
        setSelectedCalendarEvent(nextEvent || null);
      } else {
        setSelectedCalendarEvent(null);
      }

      toast.success('Calendar event dismissed');
    } catch (error) {
      console.error('Error dismissing calendar event:', error);
      toast.error('Failed to dismiss calendar event');
    }
  };

  // Update calendar event title
  const handleUpdateCalendarTitle = async (newTitle) => {
    if (!selectedCalendarEvent || !newTitle.trim()) {
      setEditingCalendarTitle(false);
      return;
    }

    try {
      if (selectedCalendarEvent.source === 'meetings') {
        // Update processed meeting in meetings table
        const { error } = await supabase
          .from('meetings')
          .update({ meeting_name: newTitle.trim() })
          .eq('meeting_id', selectedCalendarEvent.meeting_id);

        if (error) throw error;

        // Update local state
        setProcessedMeetings(prev => prev.map(m =>
          m.meeting_id === selectedCalendarEvent.meeting_id ? { ...m, meeting_name: newTitle.trim() } : m
        ));
        setSelectedCalendarEvent(prev => ({ ...prev, meeting_name: newTitle.trim() }));
      } else {
        // Update inbox event in command_center_inbox table
        const { error } = await supabase
          .from('command_center_inbox')
          .update({ subject: newTitle.trim() })
          .eq('id', selectedCalendarEvent.id);

        if (error) throw error;

        // Update local state
        setCalendarEvents(prev => prev.map(e =>
          e.id === selectedCalendarEvent.id ? { ...e, subject: newTitle.trim() } : e
        ));
        setSelectedCalendarEvent(prev => ({ ...prev, subject: newTitle.trim() }));
      }

      setEditingCalendarTitle(false);
      toast.success('Title updated');
    } catch (error) {
      console.error('Error updating calendar title:', error);
      toast.error('Failed to update title');
    }
  };

  // Process calendar event (Done button) - creates meeting record
  const handleProcessCalendarEvent = async () => {
    if (!selectedCalendarEvent) {
      toast.error('No event selected');
      return;
    }

    try {
      // 1. Create meeting record
      const scoreValue = calendarEventScore ? String(calendarEventScore) : null;
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          meeting_name: selectedCalendarEvent.subject || 'Meeting',
          meeting_date: selectedCalendarEvent.date,
          meeting_status: 'Completed',
          notes: calendarEventNotes || null,
          score: scoreValue,
          description: calendarEventDescription || null,
          event_uid: selectedCalendarEvent.event_uid || null
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // 2. Link contacts - query directly from to_recipients emails (more reliable than state)
      let contactIdsToLink = [];

      // Get emails from to_recipients
      let recipients = selectedCalendarEvent.to_recipients;
      if (typeof recipients === 'string') {
        try { recipients = JSON.parse(recipients); } catch (e) { recipients = []; }
      }
      if (recipients && Array.isArray(recipients)) {
        const emails = recipients
          .map(r => (typeof r === 'string' ? r : r.email || '').replace(/^MAILTO:/i, '').toLowerCase())
          .filter(e => e && e !== 'simone@cimminelli.com' && !e.includes('@group.calendar.google.com'));

        if (emails.length > 0) {
          // Query contact_emails to find matching contact_ids
          const { data: emailMatches } = await supabase
            .from('contact_emails')
            .select('contact_id')
            .in('email', emails);

          if (emailMatches) {
            contactIdsToLink = [...new Set(emailMatches.map(m => m.contact_id))];
          }
        }
      }

      // Also add manually selected contacts
      selectedContactsForMeeting.forEach(c => {
        const cid = c.contact?.contact_id || c.contact_id;
        if (cid && !contactIdsToLink.includes(cid)) {
          contactIdsToLink.push(cid);
        }
      });

      if (contactIdsToLink.length > 0) {
        const meetingContactsData = contactIdsToLink.map(contact_id => ({
          meeting_id: meetingData.meeting_id,
          contact_id
        }));

        const { error: linkError } = await supabase
          .from('meeting_contacts')
          .insert(meetingContactsData);

        if (linkError) console.error('Error linking contacts:', linkError);

        // 3. Update last_interaction_at for linked contacts (use meeting datetime)
        const meetingDateTime = selectedCalendarEvent.date || new Date().toISOString();
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ last_interaction_at: meetingDateTime })
          .in('contact_id', contactIdsToLink);

        if (updateError) console.error('Error updating last_interaction_at:', updateError);
      }

      // 4. Delete from command_center_inbox
      const { error: deleteError } = await supabase
        .from('command_center_inbox')
        .delete()
        .eq('id', selectedCalendarEvent.id);

      if (deleteError) throw deleteError;

      // 5. Update local state
      setCalendarEvents(prev => prev.filter(e => e.id !== selectedCalendarEvent.id));

      // Select next event or clear
      const currentIndex = calendarEvents.findIndex(e => e.id === selectedCalendarEvent.id);
      if (calendarEvents.length > 1) {
        const nextIndex = currentIndex >= calendarEvents.length - 1 ? currentIndex - 1 : currentIndex;
        const nextEvent = calendarEvents.filter(e => e.id !== selectedCalendarEvent.id)[nextIndex];
        setSelectedCalendarEvent(nextEvent ? { ...nextEvent, source: 'inbox' } : null);
      } else {
        setSelectedCalendarEvent(null);
      }

      // Reset form state
      setCalendarEventScore(null);
      setCalendarEventNotes('');
      setSelectedContactsForMeeting([]);

      toast.success('Meeting salvato! ✅');
    } catch (error) {
      console.error('Error processing calendar event:', error);
      toast.error('Errore nel salvare il meeting');
    }
  };

  // Delete processed meeting
  const handleDeleteProcessedMeeting = async (meetingId) => {
    if (!meetingId) {
      toast.error('No meeting selected');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      // 1. Delete from meeting_contacts junction table
      const { error: deleteContactsError } = await supabase
        .from('meeting_contacts')
        .delete()
        .eq('meeting_id', meetingId);

      if (deleteContactsError) {
        console.error('Error deleting meeting contacts:', deleteContactsError);
      }

      // 2. Delete the meeting record
      const { error: deleteMeetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('meeting_id', meetingId);

      if (deleteMeetingError) throw deleteMeetingError;

      // 3. Update local state
      setProcessedMeetings(prev => prev.filter(m => m.meeting_id !== meetingId));

      // Select next meeting or clear
      const currentIndex = processedMeetings.findIndex(m => m.meeting_id === meetingId);
      if (processedMeetings.length > 1) {
        const nextIndex = currentIndex >= processedMeetings.length - 1 ? currentIndex - 1 : currentIndex;
        const nextMeeting = processedMeetings.filter(m => m.meeting_id !== meetingId)[nextIndex];
        setSelectedCalendarEvent(nextMeeting ? { ...nextMeeting, source: 'meetings' } : null);
      } else {
        setSelectedCalendarEvent(null);
      }

      toast.success('Meeting deleted');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  // Create calendar event
  // NOTE: This handler requires external dep (setChatMessages) which must be passed.
  const handleCreateCalendarEvent = async ({ setChatMessages } = {}) => {
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
        location: calendarEventEdits.useGoogleMeet ? '' : (calendarEventEdits.location || pendingCalendarEvent.location || ''),
        startDate: calendarEventEdits.datetime || pendingCalendarEvent.datetime,
        attendees: calendarEventEdits.attendees || pendingCalendarEvent.attendees || [],
        timezone: calendarEventEdits.timezone || 'Europe/Rome',
        reminders: [15], // 15 min before
        useGoogleMeet: calendarEventEdits.useGoogleMeet || false,
      };

      if (!eventData.startDate) {
        toast.error('Please specify a date and time');
        setCalendarLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/google-calendar/create-event`, {
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
        // invitesSent can be boolean (Google) or array (legacy)
        const invitesSent = data.invitesSent;
        const hasInvites = invitesSent === true || (Array.isArray(invitesSent) && invitesSent.length > 0);
        const attendeeNames = eventData.attendees?.map(a => a.name || a.email).join(', ');
        const inviteMsg = hasInvites && attendeeNames
          ? `\n📧 Invites sent to: ${attendeeNames}`
          : (eventData.attendees?.length > 0 && !hasInvites ? '\n⚠️ Attendees added but invites not sent' : '');

        toast.success(hasInvites ? '📅 Event created and invites sent!' : '📅 Event created!');
        if (setChatMessages) {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ **Event created!**\n\n**${eventData.title}**\n📆 ${new Date(eventData.startDate).toLocaleString('it-IT')}\n${eventData.location ? `📍 ${eventData.location}\n` : ''}${inviteMsg}`
          }]);
        }
        setPendingCalendarEvent(null);
        setCalendarEventEdits({});
      }
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(`Failed to create event: ${error.message}`);
      if (setChatMessages) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Failed to create event: ${error.message}`
        }]);
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  // Search contacts for meeting
  // NOTE: Uses emailContacts from external context for filtering already-linked contacts
  const handleSearchMeetingContacts = async (query, emailContacts = []) => {
    setMeetingContactSearchQuery(query);
    if (!query.trim()) {
      setMeetingContactSearchResults([]);
      return;
    }
    setMeetingContactSearchLoading(true);
    try {
      const searchTerms = query.trim().split(/\s+/);

      // Build name search query
      let nameSearchQuery = supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url, contact_emails(email)');

      searchTerms.forEach(term => {
        nameSearchQuery = nameSearchQuery.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
      });

      const nameSearch = nameSearchQuery.limit(10);

      // Search by email
      const emailSearch = supabase
        .from('contact_emails')
        .select('contact_id, email, contacts(contact_id, first_name, last_name, profile_image_url)')
        .ilike('email', `%${searchTerms[0]}%`)
        .limit(10);

      const [nameResult, emailResult] = await Promise.all([nameSearch, emailSearch]);

      if (nameResult.error) throw nameResult.error;
      if (emailResult.error) throw emailResult.error;

      // Merge results
      const contactMap = new Map();

      (nameResult.data || []).forEach(c => {
        contactMap.set(c.contact_id, {
          ...c,
          email: c.contact_emails?.[0]?.email || null
        });
      });

      (emailResult.data || []).forEach(e => {
        if (e.contacts && !contactMap.has(e.contact_id)) {
          contactMap.set(e.contact_id, {
            ...e.contacts,
            email: e.email
          });
        }
      });

      // Filter out contacts already linked to this meeting
      const linkedContactIds = selectedCalendarEvent?.meeting_id
        ? (selectedCalendarEvent.meeting_contacts || []).map(mc => mc.contact_id)
        : [...emailContacts.filter(c => c.contact?.contact_id).map(c => c.contact.contact_id), ...selectedContactsForMeeting.map(c => c.contact?.contact_id || c.contact_id)];

      const filteredResults = Array.from(contactMap.values()).filter(c => !linkedContactIds.includes(c.contact_id));

      setMeetingContactSearchResults(filteredResults.slice(0, 10));
    } catch (err) {
      console.error('Error searching contacts:', err);
    } finally {
      setMeetingContactSearchLoading(false);
    }
  };

  // Add contact to meeting
  const handleAddMeetingContact = async (contact) => {
    if (!selectedCalendarEvent || !contact) return;

    if (selectedCalendarEvent.meeting_id) {
      try {
        const { error } = await supabase
          .from('meeting_contacts')
          .insert({
            meeting_id: selectedCalendarEvent.meeting_id,
            contact_id: contact.contact_id
          });
        if (error) throw error;

        const newContactLink = {
          meeting_id: selectedCalendarEvent.meeting_id,
          contact_id: contact.contact_id,
          contacts: contact
        };
        const updatedContacts = [...(selectedCalendarEvent.meeting_contacts || []), newContactLink];
        const updatedEvent = { ...selectedCalendarEvent, meeting_contacts: updatedContacts };
        setSelectedCalendarEvent(updatedEvent);
        setProcessedMeetings(prev => prev.map(m => m.meeting_id === selectedCalendarEvent.meeting_id ? updatedEvent : m));
        toast.success('Contact added to meeting');
      } catch (err) {
        console.error('Error adding contact to meeting:', err);
        toast.error('Failed to add contact');
      }
    } else {
      const alreadyAdded = selectedContactsForMeeting.some(c => c.contact_id === contact.contact_id);
      if (!alreadyAdded) {
        setSelectedContactsForMeeting(prev => [...prev, { contact: contact, contact_id: contact.contact_id }]);
        toast.success('Contact will be linked when processed');
      }
    }
    setMeetingContactSearchQuery('');
    setMeetingContactSearchResults([]);
    setAddMeetingContactModalOpen(false);
  };

  // Remove contact from meeting
  const handleRemoveMeetingContact = async (contactId) => {
    if (!selectedCalendarEvent || !contactId) return;

    if (selectedCalendarEvent.meeting_id) {
      try {
        const { error } = await supabase
          .from('meeting_contacts')
          .delete()
          .eq('meeting_id', selectedCalendarEvent.meeting_id)
          .eq('contact_id', contactId);
        if (error) throw error;

        const updatedContacts = selectedCalendarEvent.meeting_contacts.filter(mc => mc.contact_id !== contactId);
        const updatedEvent = { ...selectedCalendarEvent, meeting_contacts: updatedContacts };
        setSelectedCalendarEvent(updatedEvent);
        setProcessedMeetings(prev => prev.map(m => m.meeting_id === selectedCalendarEvent.meeting_id ? updatedEvent : m));
        toast.success('Contact removed from meeting');
      } catch (err) {
        console.error('Error removing contact from meeting:', err);
        toast.error('Failed to remove contact');
      }
    } else {
      setSelectedContactsForMeeting(prev => prev.filter(c => (c.contact?.contact_id || c.contact_id) !== contactId));
      toast.success('Contact removed');
    }
  };

  // Calendar search function - searches in events and meetings
  const searchCalendarEvents = useCallback(async (query) => {
    if (!query.trim()) {
      setCalendarSearchResults([]);
      setIsSearchingCalendar(false);
      return;
    }
    setCalendarSearchLoading(true);
    setIsSearchingCalendar(true);
    try {
      const { data, error } = await supabase.rpc('search_calendar', {
        search_query: query.trim(),
        result_limit: 100
      });
      if (error) throw error;
      setCalendarSearchResults(data || []);
    } catch (error) {
      console.error('Error searching calendar:', error);
      toast.error('Search failed');
      setCalendarSearchResults([]);
    } finally {
      setCalendarSearchLoading(false);
    }
  }, []);

  // Debounced calendar search effect
  useEffect(() => {
    if (activeTab === 'calendar' && calendarSearchQuery.trim()) {
      const debounce = setTimeout(() => {
        searchCalendarEvents(calendarSearchQuery);
      }, 300);
      return () => clearTimeout(debounce);
    } else if (!calendarSearchQuery.trim()) {
      setCalendarSearchResults([]);
      setIsSearchingCalendar(false);
    }
  }, [calendarSearchQuery, activeTab, searchCalendarEvents]);

  // --- Meeting field update handlers (extracted from DesktopLayout inline handlers) ---

  const handleUpdateMeetingDescription = useCallback(() => {
    if (selectedCalendarEvent?.source === 'meetings') {
      supabase
        .from('meetings')
        .update({ description: calendarEventDescription || null })
        .eq('meeting_id', selectedCalendarEvent.meeting_id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating description:', error);
            toast.error('Errore nel salvare la descrizione');
          } else {
            toast.success('Descrizione salvata');
            setProcessedMeetings(prev => prev.map(m =>
              m.meeting_id === selectedCalendarEvent.meeting_id
                ? { ...m, description: calendarEventDescription || null }
                : m
            ));
          }
        });
    }
  }, [selectedCalendarEvent, calendarEventDescription]);

  const handleUpdateMeetingScore = useCallback((score) => {
    setCalendarEventScore(score);
    if (selectedCalendarEvent?.source === 'meetings') {
      supabase
        .from('meetings')
        .update({ score: String(score) })
        .eq('meeting_id', selectedCalendarEvent.meeting_id)
        .then(({ error }) => {
          if (error) console.error('Error updating score:', error);
          else {
            setProcessedMeetings(prev => prev.map(m =>
              m.meeting_id === selectedCalendarEvent.meeting_id
                ? { ...m, score: String(score) }
                : m
            ));
          }
        });
    }
  }, [selectedCalendarEvent]);

  const handleUpdateMeetingNotes = useCallback(() => {
    if (selectedCalendarEvent?.source === 'meetings') {
      supabase
        .from('meetings')
        .update({ notes: calendarEventNotes || null })
        .eq('meeting_id', selectedCalendarEvent.meeting_id)
        .then(({ error }) => {
          if (error) console.error('Error updating notes:', error);
          else {
            setProcessedMeetings(prev => prev.map(m =>
              m.meeting_id === selectedCalendarEvent.meeting_id
                ? { ...m, notes: calendarEventNotes || null }
                : m
            ));
          }
        });
    }
  }, [selectedCalendarEvent, calendarEventNotes]);

  return {
    // State
    calendarEvents,
    setCalendarEvents,
    selectedCalendarEvent,
    setSelectedCalendarEvent,
    editingCalendarTitle,
    setEditingCalendarTitle,
    calendarTitleInput,
    setCalendarTitleInput,
    calendarViewMode,
    setCalendarViewMode,
    processedMeetings,
    setProcessedMeetings,
    calendarEventScore,
    setCalendarEventScore,
    calendarEventNotes,
    setCalendarEventNotes,
    calendarEventDescription,
    setCalendarEventDescription,
    selectedContactsForMeeting,
    setSelectedContactsForMeeting,
    calendarSearchQuery,
    setCalendarSearchQuery,
    calendarSearchResults,
    setCalendarSearchResults,
    calendarSearchLoading,
    setCalendarSearchLoading,
    isSearchingCalendar,
    setIsSearchingCalendar,
    calendarSections,
    setCalendarSections,
    pendingCalendarEvent,
    setPendingCalendarEvent,
    calendarLoading,
    setCalendarLoading,
    calendarEventEdits,
    setCalendarEventEdits,
    calendarTargetDate,
    setCalendarTargetDate,
    importingCalendar,
    setImportingCalendar,
    addMeetingContactModalOpen,
    setAddMeetingContactModalOpen,
    meetingContactSearchQuery,
    setMeetingContactSearchQuery,
    meetingContactSearchResults,
    setMeetingContactSearchResults,
    meetingContactSearchLoading,
    setMeetingContactSearchLoading,

    // Handlers
    handleCalendarExtract,
    handleDeleteCalendarEvent,
    handleUpdateCalendarTitle,
    handleProcessCalendarEvent,
    handleDeleteProcessedMeeting,
    handleCreateCalendarEvent,
    toggleCalendarSection,
    filterCalendarEvents,
    handleSearchMeetingContacts,
    handleAddMeetingContact,
    handleRemoveMeetingContact,
    updateCalendarEventField,
    formatDate,
    handleUpdateMeetingDescription,
    handleUpdateMeetingScore,
    handleUpdateMeetingNotes,
    addEventTrigger,
    setAddEventTrigger,
    weekViewTrigger,
    setWeekViewTrigger,
  };
};

export default useCalendarData;

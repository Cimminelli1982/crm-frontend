import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Spam name patterns to auto-filter
const SPAM_NAME_PATTERNS = [
  'The Spectator',
  'Hide My Email',
];

// Check if from_name matches spam patterns
function isSpamByName(fromName) {
  if (!fromName) return false;
  return SPAM_NAME_PATTERNS.some(pattern =>
    fromName.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Extract domain from email
function getDomain(email) {
  if (!email) return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

// Load spam lists from DB
async function loadSpamLists() {
  const [emailsResult, domainsResult] = await Promise.all([
    supabase.from('emails_spam').select('email'),
    supabase.from('domains_spam').select('domain'),
  ]);

  if (emailsResult.error) {
    console.error('Error loading emails_spam:', emailsResult.error.message);
  }
  if (domainsResult.error) {
    console.error('Error loading domains_spam:', domainsResult.error.message);
  }

  const spamEmails = new Set(
    (emailsResult.data || []).map(e => e.email?.toLowerCase()).filter(Boolean)
  );
  const spamDomains = new Set(
    (domainsResult.data || []).map(d => d.domain?.toLowerCase()).filter(Boolean)
  );

  return { spamEmails, spamDomains };
}

// Add email to spam list
async function addToEmailSpam(email) {
  const { error } = await supabase
    .from('emails_spam')
    .upsert({
      email: email.toLowerCase(),
      counter: 1,
      created_at: new Date().toISOString(),
      last_modified_at: new Date().toISOString(),
    }, {
      onConflict: 'email',
    });

  if (error) console.error('Error adding to emails_spam:', error);
}

// Increment email spam counter
async function incrementEmailSpamCounter(email) {
  const { data } = await supabase
    .from('emails_spam')
    .select('counter')
    .eq('email', email.toLowerCase())
    .single();

  const newCounter = (data?.counter || 0) + 1;

  await supabase
    .from('emails_spam')
    .update({
      counter: newCounter,
      last_modified_at: new Date().toISOString()
    })
    .eq('email', email.toLowerCase());
}

// Increment domain spam counter
async function incrementDomainSpamCounter(domain) {
  const { data } = await supabase
    .from('domains_spam')
    .select('counter')
    .eq('domain', domain.toLowerCase())
    .single();

  const newCounter = (data?.counter || 0) + 1;

  await supabase
    .from('domains_spam')
    .update({ counter: newCounter })
    .eq('domain', domain.toLowerCase());
}

// Filter and upsert emails with spam detection
// Returns { validEmails: [...], spamByEmail: [...], spamByDomain: [...] }
export async function upsertEmailsWithSpamFilter(emails) {
  const { spamEmails, spamDomains } = await loadSpamLists();

  const validEmails = [];
  const spamByEmail = []; // Fastmail IDs blocked by email address -> Skip_Email
  const spamByDomain = []; // Fastmail IDs blocked by domain -> Skip_Domain
  const myEmail = process.env.FASTMAIL_USERNAME?.toLowerCase();

  for (const email of emails) {
    const fromEmail = email.from_email?.toLowerCase();
    const fromName = email.from_name;
    const domain = getDomain(fromEmail);

    // Never filter my own sent emails
    if (fromEmail === myEmail) {
      validEmails.push(email);
      continue;
    }

    // Check 1: Spam name patterns (treat as email spam)
    if (isSpamByName(fromName)) {
      console.log(`  [SPAM] Name pattern: ${fromName} <${fromEmail}>`);
      await addToEmailSpam(fromEmail);
      spamByEmail.push(email.fastmail_id);
      continue;
    }

    // Check 2: Email in spam list
    if (fromEmail && spamEmails.has(fromEmail)) {
      console.log(`  [SPAM] Email blocked: ${fromEmail}`);
      await incrementEmailSpamCounter(fromEmail);
      spamByEmail.push(email.fastmail_id);
      continue;
    }

    // Check 3: Domain in spam list
    if (domain && spamDomains.has(domain)) {
      console.log(`  [SPAM] Domain blocked: ${domain}`);
      await incrementDomainSpamCounter(domain);
      spamByDomain.push(email.fastmail_id);
      continue;
    }

    // Passed all filters
    validEmails.push(email);
  }

  const totalSpam = spamByEmail.length + spamByDomain.length;
  if (totalSpam > 0) {
    console.log(`  Filtered ${totalSpam} spam emails (${spamByEmail.length} by email, ${spamByDomain.length} by domain)`);
  }

  let insertedData = [];
  if (validEmails.length > 0) {
    const { data, error } = await supabase
      .from('command_center_inbox')
      .upsert(validEmails, {
        onConflict: 'fastmail_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }
    insertedData = data;
  }

  return { validEmails: insertedData, spamByEmail, spamByDomain };
}

// Legacy function (without spam filter)
export async function upsertEmails(emails) {
  return upsertEmailsWithSpamFilter(emails);
}

export async function getLatestEmailDate(mailboxType = 'inbox') {
  // Get last sync date from sync_state table (not affected by deletions)
  // Use separate sync dates for inbox and sent to avoid missing sent emails
  const syncId = mailboxType === 'sent' ? 'email_sync_sent' : 'email_sync';

  const { data, error } = await supabase
    .from('sync_state')
    .select('last_sync_date')
    .eq('id', syncId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error(`Error fetching sync state for ${mailboxType}:`, error);
  }

  return data?.last_sync_date || null;
}

export async function updateSyncDate(date, mailboxType = 'inbox') {
  // Use separate sync dates for inbox and sent
  const syncId = mailboxType === 'sent' ? 'email_sync_sent' : 'email_sync';

  const { error } = await supabase
    .from('sync_state')
    .upsert({
      id: syncId,
      last_sync_date: date
    });

  if (error) {
    console.error(`Error updating sync state for ${mailboxType}:`, error);
  }
}

// ==================== CALENDAR FUNCTIONS ====================

// Get calendar sync state (ctag for change detection)
export async function getCalendarSyncState() {
  const { data, error } = await supabase
    .from('sync_state')
    .select('last_sync_date, ctag')
    .eq('id', 'calendar_sync')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching calendar sync state:', error);
  }

  return {
    lastSync: data?.last_sync_date || null,
    ctag: data?.ctag || null,
  };
}

// Update calendar sync state with ctag
export async function updateCalendarSyncState(ctag) {
  const { error } = await supabase
    .from('sync_state')
    .upsert({
      id: 'calendar_sync',
      last_sync_date: new Date().toISOString(),
      ctag: ctag,
    });

  if (error) {
    console.error('Error updating calendar sync state:', error);
  }
}

// Load dismissed calendar event UIDs
export async function loadDismissedCalendarEvents() {
  const { data, error } = await supabase
    .from('calendar_dismissed')
    .select('event_uid');

  if (error) {
    console.error('Error loading dismissed calendar events:', error);
    return new Set();
  }

  return new Set((data || []).map(d => d.event_uid));
}

// Get existing calendar events with their etags for change detection
export async function getExistingCalendarEvents() {
  const { data, error } = await supabase
    .from('command_center_inbox')
    .select('id, event_uid, etag, sequence')
    .eq('type', 'calendar')
    .not('event_uid', 'is', null);

  if (error) {
    console.error('Error loading existing calendar events:', error);
    return new Map();
  }

  // Return map of uid -> { id, etag, sequence }
  const eventMap = new Map();
  for (const e of data || []) {
    eventMap.set(e.event_uid, {
      id: e.id,
      etag: e.etag,
      sequence: e.sequence,
    });
  }
  return eventMap;
}

// Transform CalDAV event to command_center_inbox format (enhanced)
export function transformCalendarEvent(event) {
  return {
    type: 'calendar',
    event_uid: event.uid,
    subject: event.title || 'Untitled Event',
    body_text: event.description || null,
    date: event.startDate,
    event_end: event.endDate,
    event_location: event.location || null,
    from_name: event.organizerName || null,
    from_email: event.organizerEmail || null,
    // Store full attendee details with status, role, rsvp
    to_recipients: event.attendees || [],
    is_read: false,
    // Track etag and sequence for change detection
    etag: event.etag || null,
    sequence: event.sequence || 0,
    // Additional useful fields
    is_all_day: event.allDay || false,
    event_status: event.status || 'CONFIRMED',
    recurrence_rule: event.recurrenceRule || null,
  };
}

// Upsert calendar events to command_center_inbox (with etag change detection)
export async function upsertCalendarEvents(events, dismissedUids) {
  const results = { synced: 0, updated: 0, skipped: 0, unchanged: 0, errors: 0, alreadyProcessed: 0 };

  // Filter out dismissed events
  const validEvents = events.filter(e => {
    if (dismissedUids.has(e.uid)) {
      results.skipped++;
      return false;
    }
    return true;
  });

  if (validEvents.length === 0) {
    return results;
  }

  // Get existing events with etags for change detection
  const existingEvents = await getExistingCalendarEvents();

  // Get already processed meetings from meetings table (by event_uid) to avoid re-ingesting
  const { data: processedMeetings, error: meetingsQueryError } = await supabase
    .from('meetings')
    .select('event_uid')
    .not('event_uid', 'is', null);

  if (meetingsQueryError) {
    console.error('  [ERROR] Failed to query meetings for event_uid:', meetingsQueryError);
  }
  console.log(`  [DEBUG] processedMeetings query returned:`, processedMeetings?.length || 0, 'rows');

  // Create a Set of event_uids for quick lookup
  const processedEventUids = new Set();
  if (processedMeetings) {
    for (const m of processedMeetings) {
      if (m.event_uid) {
        processedEventUids.add(m.event_uid);
      }
    }
  }

  console.log(`  [DEBUG] Found ${processedEventUids.size} processed meetings with event_uid`);
  if (processedEventUids.size > 0) {
    console.log(`  [DEBUG] Processed event_uids:`, [...processedEventUids].slice(0, 5));
  }

  for (const event of validEvents) {
    const transformed = transformCalendarEvent(event);
    const existing = existingEvents.get(event.uid);

    // Check if this event has already been processed into meetings table (by event_uid)
    if (event.uid && processedEventUids.has(event.uid)) {
      console.log(`  [SKIP] Already processed: ${event.uid} - ${transformed.subject}`);
      results.alreadyProcessed++;
      continue; // Skip - already processed as a meeting
    }

    try {
      if (existing) {
        // Check if event actually changed (etag or sequence)
        const hasChanged = !existing.etag ||
                          existing.etag !== event.etag ||
                          (existing.sequence || 0) < (event.sequence || 0);

        if (!hasChanged) {
          results.unchanged++;
          continue;
        }

        // Update existing event
        const { error } = await supabase
          .from('command_center_inbox')
          .update({
            subject: transformed.subject,
            body_text: transformed.body_text,
            date: transformed.date,
            event_end: transformed.event_end,
            event_location: transformed.event_location,
            from_name: transformed.from_name,
            from_email: transformed.from_email,
            to_recipients: transformed.to_recipients,
            etag: transformed.etag,
            sequence: transformed.sequence,
            is_all_day: transformed.is_all_day,
            event_status: transformed.event_status,
            recurrence_rule: transformed.recurrence_rule,
          })
          .eq('event_uid', event.uid)
          .eq('type', 'calendar');

        if (error) {
          console.error(`Error updating calendar event ${event.uid}:`, error);
          results.errors++;
        } else {
          results.updated++;
        }
      } else {
        // Insert new event
        const { error } = await supabase
          .from('command_center_inbox')
          .insert(transformed);

        if (error) {
          console.error(`Error inserting calendar event ${event.uid}:`, error);
          results.errors++;
        } else {
          results.synced++;
        }
      }
    } catch (err) {
      console.error(`Error processing calendar event ${event.uid}:`, err);
      results.errors++;
    }
  }

  return results;
}

// Delete calendar events that no longer exist in CalDAV
// Only deletes FUTURE events that are missing (past events are kept)
export async function deleteRemovedCalendarEvents(currentUids, dismissedUids) {
  const now = new Date().toISOString();

  // Get only FUTURE calendar events in DB (don't touch past events)
  const { data, error } = await supabase
    .from('command_center_inbox')
    .select('id, event_uid, date')
    .eq('type', 'calendar')
    .not('event_uid', 'is', null)
    .gte('date', now); // Only future events

  if (error) {
    console.error('Error fetching calendar events for deletion:', error);
    return 0;
  }

  // Find events to delete (in DB but not in current CalDAV response and not dismissed)
  const toDelete = (data || []).filter(e =>
    !currentUids.has(e.event_uid) && !dismissedUids.has(e.event_uid)
  );

  if (toDelete.length === 0) {
    return 0;
  }

  const idsToDelete = toDelete.map(e => e.id);
  const { error: deleteError } = await supabase
    .from('command_center_inbox')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('Error deleting removed calendar events:', deleteError);
    return 0;
  }

  return toDelete.length;
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { JMAPClient, transformEmail } from './jmap.js';
import {
  upsertEmails,
  supabase,
  getLatestEmailDate,
  updateSyncDate,
  loadDismissedCalendarEvents,
  upsertCalendarEvents,
  deleteRemovedCalendarEvents,
  getCalendarSyncState,
  updateCalendarSyncState,
} from './supabase.js';
import { mcpManager } from './mcp-client.js';
import { CalDAVClient } from './caldav.js';
import { getGoogleCalendarClient } from './google-calendar.js';
import { generateAndSendBriefing, startBriefingScheduler } from './evening-briefing.js';
import { generateAndSendMorningBriefing, startMorningBriefingScheduler } from './morning-briefing.js';
import { registerTodayRoutes } from './today-page.js';
import {
  initBaileys,
  getStatus as getBaileysStatus,
  getQRCode,
  clearSession,
  sendMessage as baileysSendMessage,
  sendMessageToChat,
  sendMedia,
  fetchAllGroups,
  findGroupByName,
  verifyWhatsAppNumbers,
  createGroup,
} from './baileys.js';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize MCP on startup
let mcpReady = false;
mcpManager.init().then(() => {
  mcpReady = true;
  console.log('[MCP] Manager initialized');
}).catch(err => {
  console.error('[MCP] Failed to initialize:', err.message);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 3001;
const SYNC_INTERVAL = 60 * 1000; // 60 seconds
const CRM_AGENT_URL = process.env.CRM_AGENT_URL || 'http://localhost:8000';

let lastSyncTime = null;
let syncCount = 0;

// Classify new emails as potential spam using Claude Haiku
async function classifyPotentialSpam(emails, jmap) {
  if (!emails || emails.length === 0) return;

  // Only classify emails without a status (inbox emails, not already news/spam)
  // Skip own sent emails and whitelisted senders
  const myEmail = process.env.FASTMAIL_USERNAME?.toLowerCase();
  const { data: wlData } = await supabase.from('emails_whitelist').select('email');
  const whitelist = new Set((wlData || []).map(e => e.email?.toLowerCase()).filter(Boolean));
  const toClassify = emails.filter(e => !e.status && e.from_email && e.from_email.toLowerCase() !== myEmail && !whitelist.has(e.from_email.toLowerCase()));
  if (toClassify.length === 0) return;

  console.log(`[SpamClassifier] Classifying ${toClassify.length} emails...`);

  const batch = toClassify.map(e => ({
    id: e.id,
    from: `${e.from_name || ''} <${e.from_email}>`,
    subject: e.subject || '(no subject)',
    snippet: (e.snippet || e.body_text || '').substring(0, 200),
  }));

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a spam classifier for a personal CRM inbox. The user is a venture capital professional.

Classify each email as SPAM or OK.

SPAM means: unsolicited commercial, newsletters the user didn't sign up for, cold outreach from vendors/recruiters, automated notifications from services, promotional emails, mass marketing.

OK means: personal emails, business emails from known contacts, deal-related communications, introductions, meeting requests, replies to conversations.

When in doubt, mark as OK (false negatives are better than false positives).

Emails to classify:
${batch.map((e, i) => `${i + 1}. ID: ${e.id}\n   From: ${e.from}\n   Subject: ${e.subject}\n   Preview: ${e.snippet}`).join('\n\n')}

Reply with ONLY a JSON array of objects with "id" and "spam" (boolean) fields. No explanation.
Example: [{"id":"abc","spam":true},{"id":"def","spam":false}]`
      }]
    });

    const text = response.content[0]?.text?.trim();
    let results;
    try {
      results = JSON.parse(text);
    } catch {
      // Try to extract JSON from response
      const match = text.match(/\[[\s\S]*\]/);
      if (match) results = JSON.parse(match[0]);
      else {
        console.error('[SpamClassifier] Could not parse response:', text.substring(0, 200));
        return;
      }
    }

    const spamIds = results.filter(r => r.spam).map(r => r.id);
    if (spamIds.length === 0) {
      console.log('[SpamClassifier] No potential spam detected');
      return;
    }

    // Update status to 'potential_spam' for classified emails
    const { error } = await supabase
      .from('command_center_inbox')
      .update({ status: 'potential_spam' })
      .in('id', spamIds);

    if (error) {
      console.error('[SpamClassifier] Update error:', error.message);
    } else {
      const spamEmails = batch.filter(e => spamIds.includes(e.id));
      console.log(`[SpamClassifier] Marked ${spamIds.length} as potential spam:`);
      spamEmails.forEach(e => console.log(`  - ${e.from}: ${e.subject}`));

      // Move potential_spam emails to Potential_Spam folder in Fastmail
      if (jmap) {
        const spamFastmailIds = toClassify
          .filter(e => spamIds.includes(e.id))
          .map(e => e.fastmail_id)
          .filter(Boolean);

        if (spamFastmailIds.length > 0) {
          try {
            const potentialSpamFolderId = await jmap.getPotentialSpamFolderId();
            const moveResult = await jmap.moveMultipleToFolder(spamFastmailIds, potentialSpamFolderId, true);
            console.log(`[SpamClassifier] Moved ${moveResult.moved} to Potential_Spam folder`);
          } catch (moveError) {
            console.error('[SpamClassifier] Error moving to Potential_Spam:', moveError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SpamClassifier] Error:', error.message);
  }
}

// Send new emails to CRM Agent for analysis
async function notifyAgentOfNewEmails(emails) {
  if (!emails || emails.length === 0) return;

  console.log(`[Agent] Sending ${emails.length} emails for analysis...`);

  for (const email of emails) {
    try {
      const response = await fetch(`${CRM_AGENT_URL}/analyze-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: {
            id: email.id,
            fastmail_id: email.fastmail_id,
            from_email: email.from_email,
            from_name: email.from_name,
            to_recipients: email.to_recipients,
            cc_recipients: email.cc_recipients,
            subject: email.subject,
            body_text: email.body_text,
            snippet: email.snippet,
            date: email.date,
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Agent] Analyzed email from ${email.from_email}: ${result.suggestions_created} suggestions`);
      } else {
        console.error(`[Agent] Error analyzing email: ${response.status}`);
      }
    } catch (error) {
      // Don't let agent errors block email sync
      console.error(`[Agent] Failed to notify agent:`, error.message);
    }
  }
}

// Auto-sync function
async function autoSync() {
  let jmap = null;

  try {
    console.log(`[${new Date().toISOString()}] Starting auto-sync...`);

    jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    // Sync both Inbox and Sent with SEPARATE sync dates
    const mailboxes = await jmap.getMailboxIds(['inbox', 'sent']);
    let allEmails = [];
    const newestDates = {}; // Track newest date per mailbox type

    for (const { role, id } of mailboxes) {
      // Get separate sync date for each mailbox type
      const latestDate = await getLatestEmailDate(role);
      console.log(`  ${role}: syncing since ${latestDate || 'beginning'}`);

      const emails = await jmap.getEmails({
        mailboxId: id,
        limit: 50,
        sinceDate: latestDate,
      });
      console.log(`  - ${role}: ${emails.length} new emails`);

      // Track newest date for this mailbox type
      if (emails.length > 0) {
        const newestInBatch = emails.reduce((max, e) => {
          const d = new Date(e.receivedAt);
          return d > max ? d : max;
        }, new Date(0));
        newestDates[role] = newestInBatch;
      }

      // Tag emails with their mailbox role for direction detection
      emails.forEach(e => { e._mailboxRole = role; });
      allEmails = allEmails.concat(emails);
    }

    if (allEmails.length === 0) {
      console.log(`  No new emails to sync`);
      lastSyncTime = new Date().toISOString();
      syncCount++;
      return;
    }

    // Dedupe by id (in case same email in multiple folders)
    const uniqueEmails = [...new Map(allEmails.map(e => [e.id, e])).values()];

    const transformed = uniqueEmails.map(e => {
      const t = transformEmail(e);
      // Set direction based on mailbox: sent folder → 'sent', otherwise 'received'
      t.direction = e._mailboxRole === 'sent' ? 'sent' : 'received';
      return t;
    });
    const { validEmails, spamByEmail, spamByDomain, newsFastmailIds } = await upsertEmails(transformed);

    // Stamp all synced emails with $crm_done keyword to prevent re-sync
    const allFastmailIds = uniqueEmails.map(e => e.id).filter(Boolean);
    if (allFastmailIds.length > 0) {
      try {
        const stampResult = await jmap.addKeywordToMultiple(allFastmailIds, '$crm_done');
        console.log(`  Stamped ${stampResult.updated} emails with $crm_done keyword`);
      } catch (stampError) {
        console.error(`  Error stamping emails:`, stampError.message);
      }
    }

    // Move spam emails to Skip_Email and Skip_Domain folders in Fastmail
    const totalSpam = (spamByEmail?.length || 0) + (spamByDomain?.length || 0);
    if (totalSpam > 0) {
      console.log(`  Moving spam emails to Skip folders...`);
      try {
        const skipResult = await jmap.moveSpamEmails(spamByEmail, spamByDomain);
        console.log(`  Moved ${skipResult.emailMoved} to Skip_Email, ${skipResult.domainMoved} to Skip_Domain`);
      } catch (skipError) {
        console.error(`  Error moving emails to Skip:`, skipError.message);
      }
    }

    // Move news emails to News folder in Fastmail
    if (newsFastmailIds?.length > 0) {
      console.log(`  Moving ${newsFastmailIds.length} news emails to News folder...`);
      try {
        const newsFolderId = await jmap.getNewsFolderId();
        const newsResult = await jmap.moveMultipleToFolder(newsFastmailIds, newsFolderId, true);
        console.log(`  Moved ${newsResult.moved} emails to News`);
      } catch (newsError) {
        console.error(`  Error moving emails to News:`, newsError.message);
      }
    }

    // Update sync state separately for each mailbox type
    for (const [role, newestDate] of Object.entries(newestDates)) {
      if (newestDate > new Date(0)) {
        await updateSyncDate(newestDate.toISOString(), role);
      }
    }

    lastSyncTime = new Date().toISOString();
    syncCount++;

    console.log(`[${lastSyncTime}] Synced ${validEmails.length} emails (total syncs: ${syncCount})`);

    // Classify potential spam with LLM (async, don't block sync)
    if (validEmails.length > 0) {
      classifyPotentialSpam(validEmails, jmap).catch(err => {
        console.error('[SpamClassifier] Background error:', err.message);
      });

      // Notify CRM Agent of new emails (async, don't block)
      notifyAgentOfNewEmails(validEmails).catch(err => {
        console.error('[Agent] Background notification error:', err.message);
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Auto-sync error:`, error.message);
  }
}

// Process auto-archiving emails (sent replies flagged by Supabase trigger)
async function processAutoArchiving() {
  try {
    const { data: emails, error } = await supabase
      .from('command_center_inbox')
      .select('id, fastmail_id, thread_id, subject')
      .eq('status', 'auto_archiving');

    if (error || !emails || emails.length === 0) return;

    console.log(`[AutoArchive] Processing ${emails.length} auto-archiving emails`);

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    for (const email of emails) {
      try {
        // Archive in Fastmail
        if (email.fastmail_id) {
          await jmap.archiveEmail(email.fastmail_id);
        }
        // Remove from inbox
        await supabase
          .from('command_center_inbox')
          .delete()
          .eq('id', email.id);
        console.log(`[AutoArchive] Archived: ${email.subject}`);
      } catch (err) {
        console.error(`[AutoArchive] Failed for ${email.id}:`, err.message);
        // Mark as failed so we don't retry forever
        await supabase
          .from('command_center_inbox')
          .update({ status: 'auto_archive_failed' })
          .eq('id', email.id);
      }
    }

    // Cleanup expired entries from auto_archive_threads
    await supabase
      .from('auto_archive_threads')
      .delete()
      .lt('expires_at', new Date().toISOString());

  } catch (err) {
    console.error('[AutoArchive] Error:', err.message);
  }
}

// Calendar sync via CalDAV (with ctag change detection)
async function syncCalendar() {
  const username = process.env.FASTMAIL_USERNAME;
  const caldavPassword = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;

  if (!username || !caldavPassword) {
    console.log('[Calendar] CalDAV credentials not configured, skipping sync');
    return;
  }

  try {
    const caldav = new CalDAVClient(username, caldavPassword);

    // Step 1: Check if calendar changed (ctag)
    const { ctag: currentCtag } = await caldav.getCalendarCtag();
    const { ctag: savedCtag } = await getCalendarSyncState();

    if (currentCtag && savedCtag && currentCtag === savedCtag) {
      // No changes since last sync - skip
      return;
    }

    console.log(`[Calendar] Calendar changed (ctag: ${savedCtag?.substring(0, 8) || 'none'} → ${currentCtag?.substring(0, 8)}), syncing...`);

    // Step 2: Load dismissed events
    const dismissedUids = await loadDismissedCalendarEvents();

    // Step 3: Full sync from CalDAV (3 months back, 12 months forward)
    const events = await caldav.fullSync();
    console.log(`[Calendar] Fetched ${events.length} events from CalDAV`);

    // Step 4: Upsert events to DB (with etag change detection)
    const results = await upsertCalendarEvents(events, dismissedUids);

    // Step 5: Delete events no longer in CalDAV
    const currentUids = new Set(events.map(e => e.uid));
    const deleted = await deleteRemovedCalendarEvents(currentUids, dismissedUids);
    results.deleted = deleted;

    // Step 6: Update sync state with new ctag
    await updateCalendarSyncState(currentCtag);

    const total = results.synced + results.updated + results.deleted;
    if (total > 0 || results.errors > 0) {
      console.log(`[Calendar] Sync complete: ${results.synced} new, ${results.updated} updated, ${results.deleted} deleted, ${results.unchanged} unchanged, ${results.skipped} dismissed, ${results.errors} errors`);
    }
  } catch (error) {
    console.error(`[Calendar] Sync error:`, error.message);
  }
}

// Google Calendar sync - syncs from Google Calendar to command_center_inbox
let googleCalendarSyncToken = null;

async function syncGoogleCalendar() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN || !process.env.GOOGLE_CALENDAR_ID) {
    console.log('[GoogleCalendar] Credentials not configured, skipping sync');
    return;
  }

  try {
    const gcal = getGoogleCalendarClient();

    // Load dismissed events
    const dismissedUids = await loadDismissedCalendarEvents();

    // Get events from Google Calendar (always full sync for reliability)
    const { events } = await gcal.getEvents({
      // No syncToken = full sync every time (more reliable, catches all events)
    });

    console.log(`[GoogleCalendar] Fetched ${events.length} events from Google Calendar`);

    // Transform and filter events
    const transformedEvents = [];
    const EXCLUDED_COLOR_IDS = ['10', '11']; // colorId 10 = Basil (fitness), 11 = Tomato (family)
    let skippedFitness = 0, skippedCancelled = 0, skippedDismissed = 0;

    for (const event of events) {
      // Skip personal events (fitness, family) by color
      if (event.colorId && EXCLUDED_COLOR_IDS.includes(event.colorId)) {
        skippedFitness++; // counter name kept for simplicity
        continue;
      }

      const transformed = gcal.transformEventForInbox(event);
      if (!transformed) { skippedCancelled++; continue; } // Skip cancelled events
      if (dismissedUids.has(transformed.event_uid)) { skippedDismissed++; continue; } // Skip dismissed

      transformedEvents.push(transformed);
    }

    console.log(`[GoogleCalendar] After filtering: ${transformedEvents.length} events (skipped: ${skippedFitness} fitness, ${skippedCancelled} cancelled, ${skippedDismissed} dismissed)`);

    if (transformedEvents.length > 0) {
      // Upsert to command_center_inbox
      const results = await upsertGoogleCalendarEvents(transformedEvents);
      console.log(`[GoogleCalendar] Sync complete: ${results.synced} new, ${results.updated} updated, ${results.skippedProcessed} already processed, ${results.errors} errors`);
    }

    // Full sync mode - no sync token needed
  } catch (error) {
    console.error('[GoogleCalendar] Sync error:', error.message);
    // Reset sync token on error to force full sync next time
    if (error.message.includes('410') || error.message.includes('Sync token')) {
      googleCalendarSyncToken = null;
    }
  }
}

// Helper function to upsert Google Calendar events to command_center_inbox
async function upsertGoogleCalendarEvents(events) {
  const results = { synced: 0, updated: 0, errors: 0, skippedProcessed: 0 };

  for (const event of events) {
    try {
      // Check if event already exists in command_center_inbox
      const { data: existing } = await supabase
        .from('command_center_inbox')
        .select('id, etag')
        .eq('type', 'calendar')
        .eq('event_uid', event.event_uid)
        .single();

      // Check if event was already processed to meetings table (by event_uid)
      if (event.event_uid) {
        const { data: existingMeeting } = await supabase
          .from('meetings')
          .select('meeting_id')
          .eq('event_uid', event.event_uid)
          .single();

        if (existingMeeting) {
          // Event was already processed - skip
          console.log(`  [SKIP] Already processed: ${event.event_uid} - ${event.subject}`);
          results.skippedProcessed++;
          continue;
        }
      }

      if (existing) {
        // Update if etag changed
        if (existing.etag !== event.etag) {
          const { error } = await supabase
            .from('command_center_inbox')
            .update({
              subject: event.subject,
              body_text: event.body_text,
              date: event.date,
              event_end: event.event_end,
              event_location: event.event_location,
              from_name: event.from_name,
              from_email: event.from_email,
              to_recipients: event.to_recipients,
              etag: event.etag,
            })
            .eq('id', existing.id);

          if (error) throw error;
          results.updated++;
        }
      } else {
        // Insert new event
        const { error } = await supabase
          .from('command_center_inbox')
          .insert({
            type: 'calendar',
            event_uid: event.event_uid,
            subject: event.subject,
            body_text: event.body_text,
            date: event.date,
            event_end: event.event_end,
            event_location: event.event_location,
            from_name: event.from_name,
            from_email: event.from_email,
            to_recipients: event.to_recipients,
            etag: event.etag,
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        results.synced++;
      }
    } catch (error) {
      console.error(`[GoogleCalendar] Error upserting event ${event.event_uid}:`, error.message);
      results.errors++;
    }
  }

  return results;
}

// Start polling
const TODOIST_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

function startPolling() {
  console.log(`Starting email polling every ${SYNC_INTERVAL / 1000} seconds...`);
  console.log(`Starting Todoist sync every ${TODOIST_SYNC_INTERVAL / 1000} seconds...`);

  // Initial sync
  autoSync();
  // syncCalendar(); // DISABLED - using Google Calendar instead of CalDAV
  syncGoogleCalendar();
  syncTodoist(); // Initial Todoist sync

  // Then every 60 seconds for email/calendar
  setInterval(autoSync, SYNC_INTERVAL);
  setInterval(processAutoArchiving, SYNC_INTERVAL); // Process auto-archive flagged emails
  // setInterval(syncCalendar, SYNC_INTERVAL); // DISABLED - using Google Calendar instead of CalDAV
  setInterval(syncGoogleCalendar, SYNC_INTERVAL);

  // Todoist sync every 5 minutes
  setInterval(syncTodoist, TODOIST_SYNC_INTERVAL);
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'command-center-backend',
    lastSync: lastSyncTime,
    totalSyncs: syncCount
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    lastSync: lastSyncTime,
    totalSyncs: syncCount
  });
});

// Manual sync endpoint
app.post('/sync', async (req, res) => {
  try {
    console.log('Starting manual sync...');

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    const inboxId = await jmap.getInboxId();
    const emails = await jmap.getEmails({
      mailboxId: inboxId,
      limit: req.body?.limit || 50,
    });

    const transformed = emails.map(transformEmail);
    const { validEmails } = await upsertEmails(transformed);

    res.json({
      success: true,
      synced: validEmails.length,
      sample: validEmails.slice(0, 3).map(e => ({ subject: e.subject, from: e.from_email })),
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get emails from Supabase
app.get('/emails', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('command_center_inbox')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ emails: data, count: data.length });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single email
app.get('/emails/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('command_center_inbox')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get last sent emails from Fastmail Sent folder
app.get('/email/last-sent', async (req, res) => {
  try {
    // Source 1: DB (emails table) — sent emails that have been archived
    // Get recent sent emails with first "to" participant name
    const { data: dbSent } = await supabase
      .from('emails')
      .select('email_id, email_thread_id, thread_id, subject, body_plain, message_timestamp, email_participants(contact_id, participant_type, contacts(first_name, last_name, contact_emails(email)))')
      .eq('direction', 'sent')
      .order('message_timestamp', { ascending: false })
      .limit(30);

    // Source 2: command_center_inbox — sent emails not yet archived
    const { data: inboxSent } = await supabase
      .from('command_center_inbox')
      .select('id, thread_id, subject, snippet, body_text, date, to_recipients, direction')
      .eq('type', 'email')
      .eq('direction', 'sent')
      .order('date', { ascending: false })
      .limit(15);

    // Helper: get recipient name from email_participants join
    const getRecipientName = (e) => {
      const toParticipant = (e.email_participants || []).find(p => p.participant_type === 'to');
      if (toParticipant?.contacts) {
        const c = toParticipant.contacts;
        if (c.first_name || c.last_name) return `${c.first_name || ''} ${c.last_name || ''}`.trim();
        if (c.contact_emails?.[0]?.email) return c.contact_emails[0].email;
      }
      return '';
    };

    // Merge and deduplicate by email_thread_id or thread_id
    const seen = new Set();
    const unique = [];

    // DB emails first (already archived = have email_thread_id)
    for (const e of (dbSent || [])) {
      const key = e.email_thread_id || e.thread_id;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({
        email_thread_id: e.email_thread_id,
        thread_id: e.thread_id,
        subject: e.subject || 'No Subject',
        snippet: (e.body_plain || '').substring(0, 100),
        recipient_name: getRecipientName(e),
        last_sent_at: e.message_timestamp,
      });
      if (unique.length >= 10) break;
    }

    // Inbox sent emails (not yet archived)
    for (const e of (inboxSent || [])) {
      if (e.thread_id && seen.has(e.thread_id)) continue;
      if (e.thread_id) seen.add(e.thread_id);
      const toList = e.to_recipients || [];
      const firstTo = Array.isArray(toList) ? toList[0] : null;
      // Look up email_thread_id from DB if thread exists
      let emailThreadId = null;
      if (e.thread_id) {
        const match = (dbSent || []).find(d => d.thread_id === e.thread_id);
        if (match) emailThreadId = match.email_thread_id;
      }
      unique.push({
        email_thread_id: emailThreadId,
        thread_id: e.thread_id,
        subject: e.subject || 'No Subject',
        snippet: (e.snippet || e.body_text || '').substring(0, 100),
        recipient_name: firstTo?.name || firstTo?.email || '',
        last_sent_at: e.date,
      });
      if (unique.length >= 10) break;
    }

    // Sort by date descending
    unique.sort((a, b) => new Date(b.last_sent_at) - new Date(a.last_sent_at));

    res.json({ success: true, threads: unique.slice(0, 10) });
  } catch (error) {
    console.error('Last sent error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send email
app.post('/send', async (req, res) => {
  try {
    const { to, cc, subject, textBody, htmlBody, inReplyTo, references, attachments, skipCrmDoneStamp } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing "to" recipients' });
    }

    if (!subject) {
      return res.status(400).json({ success: false, error: 'Missing subject' });
    }

    if (!textBody) {
      return res.status(400).json({ success: false, error: 'Missing textBody' });
    }

    console.log(`Sending email to: ${to.map(r => r.email || r).join(', ')}`);
    console.log(`Subject: ${subject}`);
    if (attachments?.length) {
      console.log(`Attachments: ${attachments.length} files`);
    }

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    // Upload attachments if provided
    let uploadedAttachments = [];
    if (attachments && attachments.length > 0) {
      console.log(`Uploading ${attachments.length} attachments...`);
      for (const att of attachments) {
        // att = { name, type, data (base64) }
        const buffer = Buffer.from(att.data, 'base64');
        const uploaded = await jmap.uploadBlob(buffer, att.type);
        uploadedAttachments.push({
          blobId: uploaded.blobId,
          type: att.type,
          name: att.name,
          size: uploaded.size,
        });
        console.log(`  Uploaded: ${att.name} (${uploaded.size} bytes)`);
      }
    }

    // If replying, resolve the real Message-ID from the fastmail_id
    let realMessageId = null;
    let realReferences = null;
    if (inReplyTo) {
      console.log(`Resolving Message-ID for fastmail_id: ${inReplyTo}`);
      const originalEmail = await jmap.getEmailById(inReplyTo);
      if (originalEmail && originalEmail.messageId) {
        realMessageId = originalEmail.messageId[0]; // messageId is an array
        console.log(`Resolved Message-ID: ${realMessageId}`);
        // Build references chain: original references + original messageId
        realReferences = originalEmail.references
          ? [...originalEmail.references, realMessageId]
          : [realMessageId];
      }
    }

    const result = await jmap.sendEmail({
      to,
      cc,
      subject,
      textBody,
      htmlBody,
      inReplyTo: realMessageId,
      references: realReferences,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
    });

    console.log('Email sent successfully:', result);

    // For replies: insert sent email directly into command_center_inbox
    // so it's part of the thread when saveAndArchive runs.
    // (Same pattern as /reply endpoint)
    if (inReplyTo) {
      try {
        // Look up thread_id from the original email in command_center_inbox
        const { data: origEmail } = await supabase
          .from('command_center_inbox')
          .select('thread_id, status')
          .eq('fastmail_id', inReplyTo)
          .single();

        if (origEmail?.thread_id) {
          const myEmail = process.env.FASTMAIL_USERNAME?.toLowerCase();
          const { error: insertError } = await supabase
            .from('command_center_inbox')
            .insert({
              type: 'email',
              thread_id: origEmail.thread_id,
              subject,
              from_email: myEmail,
              from_name: 'Simone Cimminelli',
              to_recipients: to,
              cc_recipients: cc?.length > 0 ? cc : null,
              body_text: textBody,
              body_html: htmlBody || null,
              date: new Date().toISOString(),
              is_read: true,
              direction: 'sent',
              status: origEmail.status || null,
              fastmail_id: result.emailId || null,
            });
          if (insertError) {
            console.error('Failed to insert sent email into inbox:', insertError);
          } else {
            console.log('Sent email inserted into command_center_inbox');
          }
        }
      } catch (err) {
        console.error('Error inserting sent email:', err.message);
      }
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reply to email
app.post('/reply', async (req, res) => {
  try {
    const { emailId, textBody, htmlBody, replyAll } = req.body;

    if (!emailId) {
      return res.status(400).json({ success: false, error: 'Missing emailId' });
    }

    if (!textBody) {
      return res.status(400).json({ success: false, error: 'Missing textBody' });
    }

    // Get original email from Supabase (try by id first, then by fastmail_id)
    let originalEmail = null;
    const { data: byId } = await supabase
      .from('command_center_inbox')
      .select('*')
      .eq('id', emailId)
      .single();
    if (byId) {
      originalEmail = byId;
    } else {
      const { data: byFastmailId } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('fastmail_id', emailId)
        .single();
      originalEmail = byFastmailId;
    }

    if (!originalEmail) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    console.log(`Replying to: ${originalEmail.subject}`);

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    // Fetch the actual RFC5322 Message-ID from JMAP (fastmail_id is the JMAP internal ID, not the Message-ID header)
    let messageIdHeader = null;
    if (originalEmail.fastmail_id) {
      try {
        const emailGetResponse = await jmap.request([
          ['Email/get', { accountId: jmap.accountId, ids: [originalEmail.fastmail_id], properties: ['messageId', 'references'] }, 'getmid'],
        ]);
        const jmapEmail = emailGetResponse?.[0]?.[1]?.list?.[0];
        if (jmapEmail?.messageId?.[0]) {
          messageIdHeader = jmapEmail.messageId[0];
          console.log(`Original Message-ID: ${messageIdHeader}`);
        }
      } catch (err) {
        console.warn('Could not fetch messageId from JMAP:', err.message);
      }
    }

    // Build recipients - check if I sent the original email
    const myEmail = process.env.FASTMAIL_USERNAME?.toLowerCase();
    const isSentByMe = originalEmail.from_email?.toLowerCase() === myEmail;

    let to = [];
    let cc = [];

    if (isSentByMe) {
      // I sent this email, so reply to the original recipients
      if (originalEmail.to_recipients && originalEmail.to_recipients.length > 0) {
        to = originalEmail.to_recipients.map(r => ({ email: r.email, name: r.name }));
      }
      if (replyAll && originalEmail.cc_recipients) {
        cc = originalEmail.cc_recipients.filter(r =>
          r.email?.toLowerCase() !== myEmail
        );
      }
    } else {
      // Someone sent this to me, reply to them
      to = [{ email: originalEmail.from_email, name: originalEmail.from_name }];
      if (replyAll && originalEmail.cc_recipients) {
        cc = originalEmail.cc_recipients.filter(r =>
          r.email?.toLowerCase() !== myEmail
        );
      }
    }

    // Validate we have recipients
    if (to.length === 0) {
      console.error('No recipients found for reply. Original email:', {
        from: originalEmail.from_email,
        to: originalEmail.to_recipients,
        isSentByMe
      });
      return res.status(400).json({ success: false, error: 'No recipients found for reply' });
    }

    console.log('Reply recipients:', { to, cc, isSentByMe });

    // Build subject
    const subject = originalEmail.subject?.startsWith('Re:')
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`;

    const result = await jmap.sendEmail({
      to,
      cc,
      subject,
      textBody,
      htmlBody,
      inReplyTo: messageIdHeader || null,
      references: messageIdHeader || null,
    });

    console.log('Reply sent successfully:', result);

    // Insert sent reply directly into command_center_inbox so it appears in the thread immediately
    // Keep $crm_done stamp (default) so sync doesn't create a duplicate
    try {
      const { error: insertError } = await supabase
        .from('command_center_inbox')
        .insert({
          type: 'email',
          thread_id: originalEmail.thread_id,
          subject,
          from_email: myEmail,
          from_name: 'Simone Cimminelli',
          to_recipients: to,
          cc_recipients: cc.length > 0 ? cc : null,
          body_text: textBody,
          body_html: htmlBody || null,
          date: new Date().toISOString(),
          is_read: true,
          direction: 'sent',
          status: originalEmail.status || null,
          fastmail_id: result.emailId || null,
        });
      if (insertError) {
        console.error('Failed to insert sent reply into inbox:', insertError);
      } else {
        console.log('Sent reply inserted into command_center_inbox');
      }
    } catch (err) {
      console.error('Error inserting sent reply:', err.message);
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Forward email
app.post('/forward', async (req, res) => {
  try {
    const { emailId, to, cc, textBody } = req.body;

    if (!emailId) {
      return res.status(400).json({ success: false, error: 'Missing emailId' });
    }

    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing "to" recipients' });
    }

    // Get original email from Supabase (try by id first, then by fastmail_id)
    let originalEmail = null;
    const { data: byId } = await supabase
      .from('command_center_inbox')
      .select('*')
      .eq('id', emailId)
      .single();
    if (byId) {
      originalEmail = byId;
    } else {
      const { data: byFastmailId } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('fastmail_id', emailId)
        .single();
      originalEmail = byFastmailId;
    }

    if (!originalEmail) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    console.log(`Forwarding: ${originalEmail.subject}`);

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    // Build subject
    const subject = originalEmail.subject?.startsWith('Fwd:')
      ? originalEmail.subject
      : `Fwd: ${originalEmail.subject}`;

    // Build body with original message
    const originalHeader = `
---------- Forwarded message ---------
From: ${originalEmail.from_name} <${originalEmail.from_email}>
Date: ${new Date(originalEmail.date).toLocaleString()}
Subject: ${originalEmail.subject}
To: ${originalEmail.to_recipients?.map(r => r.email).join(', ') || ''}

`;
    const fullBody = (textBody || '') + originalHeader + (originalEmail.body_text || originalEmail.snippet || '');

    const result = await jmap.sendEmail({
      to,
      cc,
      subject,
      textBody: fullBody,
    });

    console.log('Forward sent successfully:', result);

    setTimeout(() => autoSync(), 2000);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Archive email in Fastmail
app.post('/archive', async (req, res) => {
  try {
    const { fastmailId } = req.body;

    if (!fastmailId) {
      return res.status(400).json({ success: false, error: 'Missing fastmailId' });
    }

    console.log(`Archiving email: ${fastmailId}`);

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    const result = await jmap.archiveEmail(fastmailId);

    // Stamp with $crm_done to prevent re-sync (in case it gets moved back to inbox)
    try {
      await jmap.addKeyword(fastmailId, '$crm_done');
      console.log(`Stamped archived email ${fastmailId} with $crm_done`);
    } catch (stampError) {
      console.error('Error stamping archived email:', stampError.message);
    }

    // Delete from command_center_inbox
    const { error: deleteError } = await supabase
      .from('command_center_inbox')
      .delete()
      .eq('fastmail_id', fastmailId);

    if (deleteError) {
      console.error('Error deleting from command_center_inbox:', deleteError);
    } else {
      console.log(`Deleted ${fastmailId} from command_center_inbox`);
    }

    console.log('Email archived successfully:', result);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save & Archive email - full CRM processing and Fastmail archive (called by frontend saveAndArchiveAsync)
app.post('/email/save-and-archive', async (req, res) => {
  const MY_EMAIL = 'simone@cimminelli.com';

  try {
    const { threadData, contactsData, keepStatus } = req.body;

    if (!threadData || threadData.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing threadData' });
    }

    console.log(`[SaveAndArchive] Processing ${threadData.length} emails with ${contactsData?.length || 0} contacts`);

    const errors = [];
    const successfullySavedEmails = [];

    // Process each email in the thread
    for (const email of threadData) {
      console.log(`[SaveAndArchive] Processing email: ${email.subject}`);
      let crmSaveSuccess = true;

      // 1. Create or get email_thread
      let emailThreadId = null;
      try {
        const { data: existingThread, error: checkError } = await supabase
          .from('email_threads')
          .select('email_thread_id')
          .eq('thread_id', email.thread_id)
          .maybeSingle();

        if (checkError) {
          console.error('[SaveAndArchive] Error checking thread:', checkError);
          errors.push({ step: 'check_thread', error: checkError.message });
          crmSaveSuccess = false;
        }

        if (existingThread) {
          emailThreadId = existingThread.email_thread_id;

          // Update last_message_timestamp if newer
          await supabase
            .from('email_threads')
            .update({
              last_message_timestamp: email.date,
              updated_at: new Date().toISOString()
            })
            .eq('email_thread_id', emailThreadId)
            .lt('last_message_timestamp', email.date);
        } else {
          // Create new thread
          const { data: newThread, error: insertError } = await supabase
            .from('email_threads')
            .insert({
              thread_id: email.thread_id,
              subject: email.subject?.replace(/^(Re: |Fwd: )+/i, ''),
              last_message_timestamp: email.date,
            })
            .select('email_thread_id')
            .single();

          if (insertError) {
            console.error('[SaveAndArchive] Error creating thread:', insertError);
            errors.push({ step: 'create_thread', error: insertError.message });
            crmSaveSuccess = false;
          } else {
            emailThreadId = newThread.email_thread_id;
          }
        }
      } catch (threadError) {
        console.error('[SaveAndArchive] Thread operation failed:', threadError);
        errors.push({ step: 'thread', error: threadError.message });
        crmSaveSuccess = false;
      }

      // 2. Get sender contact_id
      const senderEmail = email.from_email?.toLowerCase();
      let senderContactId = null;

      // First check provided contacts
      const senderContact = contactsData?.find(c => c.email?.toLowerCase() === senderEmail);
      if (senderContact?.contact_id) {
        senderContactId = senderContact.contact_id;
      } else {
        // Look up in DB
        try {
          const { data: contactEmail } = await supabase
            .from('contact_emails')
            .select('contact_id')
            .eq('email', senderEmail)
            .maybeSingle();
          senderContactId = contactEmail?.contact_id || null;
        } catch (e) {
          console.error('[SaveAndArchive] Failed to look up sender:', e.message);
        }
      }

      // 3. Create email record if not exists
      let emailId = null;
      try {
        const { data: existingEmail, error: checkEmailError } = await supabase
          .from('emails')
          .select('email_id')
          .eq('gmail_id', email.fastmail_id)
          .maybeSingle();

        if (checkEmailError) {
          console.error('[SaveAndArchive] Error checking email:', checkEmailError);
          errors.push({ step: 'check_email', error: checkEmailError.message });
          crmSaveSuccess = false;
        }

        if (existingEmail) {
          emailId = existingEmail.email_id;
        } else {
          const isSentByMe = senderEmail === MY_EMAIL;
          const direction = isSentByMe ? 'sent' : 'received';

          const emailRecord = {
            gmail_id: email.fastmail_id,
            thread_id: email.thread_id,
            email_thread_id: emailThreadId,
            subject: email.subject,
            body_plain: email.body_text,
            body_html: email.body_html,
            message_timestamp: email.date,
            direction: direction,
            has_attachments: email.has_attachments || false,
            attachment_count: email.attachments?.length || 0,
            is_read: email.is_read || false,
            is_starred: email.is_starred || false,
            created_by: 'Edge Function',
          };

          if (senderContactId) {
            emailRecord.sender_contact_id = senderContactId;
          }

          const { data: newEmail, error: insertEmailError } = await supabase
            .from('emails')
            .insert(emailRecord)
            .select('email_id')
            .single();

          if (insertEmailError) {
            console.error('[SaveAndArchive] Error creating email:', insertEmailError);
            errors.push({ step: 'create_email', error: insertEmailError.message });
            crmSaveSuccess = false;
          } else {
            emailId = newEmail.email_id;
          }
        }
      } catch (emailError) {
        console.error('[SaveAndArchive] Email operation failed:', emailError);
        errors.push({ step: 'email', error: emailError.message });
        crmSaveSuccess = false;
      }

      // 4. Create email_participants
      if (emailId) {
        try {
          const participants = [];

          // Sender
          if (senderContactId) {
            participants.push({ contact_id: senderContactId, participant_type: 'sender' });
          }

          // To recipients
          for (const recipient of (email.to_recipients || [])) {
            const recipientContact = contactsData?.find(c =>
              c.email?.toLowerCase() === recipient.email?.toLowerCase()
            );
            if (recipientContact?.contact_id) {
              participants.push({ contact_id: recipientContact.contact_id, participant_type: 'to' });
            }
          }

          // CC recipients
          for (const recipient of (email.cc_recipients || [])) {
            const recipientContact = contactsData?.find(c =>
              c.email?.toLowerCase() === recipient.email?.toLowerCase()
            );
            if (recipientContact?.contact_id) {
              participants.push({ contact_id: recipientContact.contact_id, participant_type: 'cc' });
            }
          }

          // Insert participants
          for (const participant of participants) {
            const { data: existing } = await supabase
              .from('email_participants')
              .select('participant_id')
              .eq('email_id', emailId)
              .eq('contact_id', participant.contact_id)
              .maybeSingle();

            if (!existing) {
              await supabase
                .from('email_participants')
                .insert({
                  email_id: emailId,
                  contact_id: participant.contact_id,
                  participant_type: participant.participant_type,
                });
            }
          }
        } catch (participantError) {
          console.error('[SaveAndArchive] Participant operation failed:', participantError);
          errors.push({ step: 'participants', error: participantError.message });
        }
      }

      // 5. Create interactions for contacts
      if (emailThreadId && contactsData?.length > 0) {
        try {
          const isSentByMe = senderEmail === MY_EMAIL;

          for (const contactEntry of contactsData) {
            const contactId = contactEntry.contact_id;
            if (!contactId) continue;

            // Check if interaction already exists
            const { data: existingInteraction } = await supabase
              .from('interactions')
              .select('interaction_id')
              .eq('contact_id', contactId)
              .eq('email_thread_id', emailThreadId)
              .maybeSingle();

            if (existingInteraction) continue;

            const direction = isSentByMe ? 'sent' : 'received';

            await supabase
              .from('interactions')
              .insert({
                contact_id: contactId,
                interaction_type: 'email',
                direction: direction,
                interaction_date: email.date,
                email_thread_id: emailThreadId,
                summary: email.subject || email.snippet?.substring(0, 100),
              });
          }
        } catch (interactionError) {
          console.error('[SaveAndArchive] Interaction operation failed:', interactionError);
          errors.push({ step: 'interactions', error: interactionError.message });
        }
      }

      // 6. Link thread to contacts via contact_email_threads
      if (emailThreadId && contactsData?.length > 0) {
        try {
          for (const contactEntry of contactsData) {
            const contactId = contactEntry.contact_id;
            if (!contactId) continue;

            const { data: existing } = await supabase
              .from('contact_email_threads')
              .select('contact_id')
              .eq('contact_id', contactId)
              .eq('email_thread_id', emailThreadId)
              .maybeSingle();

            if (!existing) {
              await supabase
                .from('contact_email_threads')
                .insert({ contact_id: contactId, email_thread_id: emailThreadId });
            }
          }
        } catch (linkError) {
          console.error('[SaveAndArchive] Thread link operation failed:', linkError);
          errors.push({ step: 'thread_links', error: linkError.message });
        }
      }

      // 7. Update last_interaction_at on contacts
      if (contactsData?.length > 0) {
        try {
          for (const contactEntry of contactsData) {
            const contactId = contactEntry.contact_id;
            if (!contactId) continue;

            await supabase
              .from('contacts')
              .update({
                last_interaction_at: email.date,
                last_modified_at: new Date().toISOString(),
                last_modified_by: 'Edge Function'
              })
              .eq('contact_id', contactId)
              .or(`last_interaction_at.is.null,last_interaction_at.lt.${email.date}`);
          }
        } catch (updateError) {
          console.error('[SaveAndArchive] Contact update operation failed:', updateError);
          errors.push({ step: 'contacts_update', error: updateError.message });
        }
      }

      // Only proceed with archive if CRM save was successful
      if (crmSaveSuccess) {
        // 8. Archive in Fastmail
        try {
          const jmap = new JMAPClient(
            process.env.FASTMAIL_USERNAME,
            process.env.FASTMAIL_API_TOKEN
          );
          await jmap.init();

          await jmap.archiveEmail(email.fastmail_id);

          // Stamp with $crm_done
          try {
            await jmap.addKeyword(email.fastmail_id, '$crm_done');
          } catch (stampError) {
            console.error('[SaveAndArchive] Error stamping email:', stampError.message);
          }

          console.log(`[SaveAndArchive] Archived in Fastmail: ${email.fastmail_id}`);
        } catch (archiveError) {
          console.error('[SaveAndArchive] Fastmail archive failed:', archiveError);
          errors.push({ step: 'fastmail_archive', error: archiveError.message });
        }

        // 9. Remove from command_center_inbox OR update status
        try {
          if (keepStatus) {
            await supabase
              .from('command_center_inbox')
              .update({ status: keepStatus })
              .eq('id', email.id);
            console.log(`[SaveAndArchive] Updated status to '${keepStatus}' for ${email.id}`);
          } else {
            await supabase
              .from('command_center_inbox')
              .delete()
              .eq('id', email.id);
            console.log(`[SaveAndArchive] Deleted from inbox: ${email.id}`);
          }
        } catch (opError) {
          console.error('[SaveAndArchive] Inbox operation failed:', opError);
          errors.push({ step: 'inbox_operation', error: opError.message });
        }

        successfullySavedEmails.push(email.id);
      } else {
        console.log(`[SaveAndArchive] Skipping archive due to CRM save failure for email ${email.id}`);
      }
    }

    console.log(`[SaveAndArchive] Complete: ${successfullySavedEmails.length} saved, ${errors.length} errors`);

    if (successfullySavedEmails.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No emails were saved successfully',
        errors: errors
      });
    }

    res.json({
      success: true,
      savedCount: successfullySavedEmails.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[SaveAndArchive] Fatal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save and archive WhatsApp messages - background processing
app.post('/whatsapp/save-and-archive', async (req, res) => {
  try {
    const { chatData, messages } = req.body;

    if (!chatData || !messages || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing chatData or messages' });
    }

    console.log(`[WhatsAppArchive] Processing ${messages.length} messages for chat: ${chatData.chat_name || chatData.contact_number}`);

    const errors = [];

    // 1. Find or create the chat in chats table
    let crmChatId = null;

    // First try to find by external_chat_id (TimelinesAI ID)
    const { data: existingChat, error: chatFindError } = await supabase
      .from('chats')
      .select('id')
      .eq('external_chat_id', chatData.chat_id)
      .maybeSingle();

    if (chatFindError) {
      console.error('[WhatsAppArchive] Error finding chat:', chatFindError);
      errors.push({ step: 'find_chat', error: chatFindError.message });
    }

    if (existingChat) {
      crmChatId = existingChat.id;
    } else if (chatData.is_group_chat && chatData.chat_name) {
      // For groups: also try to match by chat_name
      const { data: chatByName, error: nameError } = await supabase
        .from('chats')
        .select('id, external_chat_id')
        .eq('chat_name', chatData.chat_name)
        .eq('is_group_chat', true)
        .is('external_chat_id', null)
        .maybeSingle();

      if (nameError) {
        console.error('[WhatsAppArchive] Error finding chat by name:', nameError);
      }

      if (chatByName) {
        crmChatId = chatByName.id;
        // Link the external_chat_id
        await supabase
          .from('chats')
          .update({ external_chat_id: chatData.chat_id })
          .eq('id', chatByName.id);
        console.log(`[WhatsAppArchive] Linked TimelinesAI chat_id to existing chat ${chatByName.id}`);
      }
    }

    // If still no match, create new chat
    if (!crmChatId) {
      const { data: newChat, error: chatCreateError } = await supabase
        .from('chats')
        .insert({
          chat_name: chatData.chat_name || chatData.contact_number,
          is_group_chat: chatData.is_group_chat || false,
          category: chatData.is_group_chat ? 'group' : 'individual',
          external_chat_id: chatData.chat_id,
          created_by: 'Edge Function'
        })
        .select('id')
        .single();

      if (chatCreateError) {
        console.error('[WhatsAppArchive] Error creating chat:', chatCreateError);
        return res.status(500).json({ success: false, error: 'Failed to create chat record' });
      }
      crmChatId = newChat.id;
      console.log(`[WhatsAppArchive] Created new chat: ${crmChatId}`);
    }

    // 2. Find contact by phone number
    let contactId = null;
    if (chatData.contact_number && !chatData.is_group_chat) {
      // Normalize phone: remove spaces, dashes, parentheses
      const normalizedPhone = chatData.contact_number.replace(/[\s\-\(\)]/g, '');
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');

      const { data: contactMobile, error: mobileError } = await supabase
        .from('contact_mobiles')
        .select('contact_id')
        .or(`mobile.ilike.%${normalizedPhone}%,mobile.ilike.%${phoneWithoutPlus}%`)
        .limit(1)
        .maybeSingle();

      if (mobileError) {
        console.error('[WhatsAppArchive] Error finding contact by phone:', mobileError);
      } else if (contactMobile) {
        contactId = contactMobile.contact_id;
        console.log(`[WhatsAppArchive] Found contact for phone ${chatData.contact_number}: ${contactId}`);
      }
    }

    // 3. Link chat to contact
    if (crmChatId && contactId) {
      const { error: linkError } = await supabase
        .from('contact_chats')
        .upsert({
          contact_id: contactId,
          chat_id: crmChatId
        }, { onConflict: 'contact_id,chat_id' });

      if (linkError) {
        console.error('[WhatsAppArchive] Error linking chat to contact:', linkError);
      } else {
        console.log(`[WhatsAppArchive] Linked chat ${crmChatId} to contact ${contactId}`);
      }
    }

    // 4. Save each message as an interaction
    let latestMessageDate = new Date(0);
    for (const msg of messages) {
      const messageUid = msg.message_uid || msg.id;
      let interactionId = null;

      // Track latest message date
      const msgDate = new Date(msg.date);
      if (msgDate > latestMessageDate) {
        latestMessageDate = msgDate;
      }

      // Check if interaction already exists
      const { data: existingInteraction } = await supabase
        .from('interactions')
        .select('interaction_id')
        .eq('external_interaction_id', messageUid)
        .maybeSingle();

      if (!existingInteraction) {
        const interactionData = {
          interaction_type: 'whatsapp',
          direction: msg.direction || 'received',
          interaction_date: msg.date,
          chat_id: crmChatId,
          summary: msg.body_text || msg.snippet,
          external_interaction_id: messageUid,
          created_at: new Date().toISOString()
        };

        if (contactId) {
          interactionData.contact_id = contactId;
        }

        const { data: newInteraction, error: interactionError } = await supabase
          .from('interactions')
          .insert(interactionData)
          .select('interaction_id')
          .single();

        if (interactionError) {
          console.error('[WhatsAppArchive] Error creating interaction:', interactionError);
          errors.push({ step: 'create_interaction', error: interactionError.message, messageUid });
        } else {
          interactionId = newInteraction?.interaction_id;
        }
      } else {
        interactionId = existingInteraction.interaction_id;
      }

      // 4.5 Link attachments to contact, chat, and interaction
      if (messageUid) {
        const attachmentUpdate = {
          chat_id: crmChatId
        };
        if (contactId) attachmentUpdate.contact_id = contactId;
        if (interactionId) attachmentUpdate.interaction_id = interactionId;

        const { error: attachmentLinkError } = await supabase
          .from('attachments')
          .update(attachmentUpdate)
          .eq('external_reference', messageUid);

        if (attachmentLinkError) {
          console.error('[WhatsAppArchive] Error linking attachments:', attachmentLinkError);
        }
      }
    }

    // 5. Update contact's last_interaction_at
    if (contactId && latestMessageDate > new Date(0)) {
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          last_interaction_at: latestMessageDate.toISOString(),
          last_modified_at: new Date().toISOString(),
          last_modified_by: 'Edge Function'
        })
        .eq('contact_id', contactId)
        .or(`last_interaction_at.is.null,last_interaction_at.lt.${latestMessageDate.toISOString()}`);

      if (updateError) {
        console.error('[WhatsAppArchive] Error updating last_interaction_at:', updateError);
      } else {
        console.log(`[WhatsAppArchive] Updated last_interaction_at for contact ${contactId}`);
      }
    }

    // 6. Delete messages from staging (command_center_inbox)
    const messageIds = messages.map(m => m.id).filter(Boolean);
    if (messageIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('command_center_inbox')
        .delete()
        .in('id', messageIds);

      if (deleteError) {
        console.error('[WhatsAppArchive] Error deleting from staging:', deleteError);
        errors.push({ step: 'delete_staging', error: deleteError.message });
      } else {
        console.log(`[WhatsAppArchive] Deleted ${messageIds.length} messages from staging`);
      }
    }

    // 7. Track this chat as "done" to prevent sent messages from reappearing
    const sortedMessages = [...messages].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastMessageUid = sortedMessages[0]?.message_uid || null;

    const { error: doneError } = await supabase
      .from('whatsapp_chat_done')
      .upsert({
        chat_id: chatData.chat_id,
        done_at: new Date().toISOString(),
        last_message_uid: lastMessageUid
      }, { onConflict: 'chat_id' });

    if (doneError) {
      console.error('[WhatsAppArchive] Error saving chat done status:', doneError);
    } else {
      console.log(`[WhatsAppArchive] Marked chat as done: ${chatData.chat_id}`);
    }

    console.log(`[WhatsAppArchive] Complete: ${messages.length} messages processed, ${errors.length} errors`);

    res.json({
      success: true,
      processedCount: messages.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[WhatsAppArchive] Fatal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark emails as read in Fastmail and Supabase
app.post('/mark-as-read', async (req, res) => {
  try {
    const { fastmailIds, supabaseIds } = req.body;

    if (!fastmailIds || !Array.isArray(fastmailIds) || fastmailIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing fastmailIds array' });
    }

    console.log(`Marking ${fastmailIds.length} emails as read...`);

    // Mark as read in Fastmail
    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    const result = await jmap.markAsRead(fastmailIds);
    console.log(`Fastmail: marked ${result.updated} emails as read`);

    // Also update in Supabase if IDs provided
    if (supabaseIds && supabaseIds.length > 0) {
      const { error: updateError } = await supabase
        .from('command_center_inbox')
        .update({ is_read: true })
        .in('id', supabaseIds);

      if (updateError) {
        console.error('Supabase update error:', updateError);
      } else {
        console.log(`Supabase: marked ${supabaseIds.length} emails as read`);
      }
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download attachment from Fastmail
app.get('/attachment/:blobId', async (req, res) => {
  try {
    const { blobId } = req.params;
    const { name, type } = req.query;

    if (!blobId) {
      return res.status(400).json({ success: false, error: 'Missing blobId' });
    }

    console.log(`Downloading attachment: ${blobId} (${name || 'unknown'})`);

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    const { buffer, contentType, filename } = await jmap.downloadBlob(
      blobId,
      name || 'attachment',
      type || 'application/octet-stream'
    );

    // Set CORS headers explicitly for file downloads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.byteLength);

    // Send the file
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Attachment download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ TODOIST INTEGRATION ============

const TODOIST_API_URL = process.env.TODOIST_API_URL || 'https://api.todoist.com/api/v1';
const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;

// Project IDs to include (Work, Personal, Team, Inbox, Birthdays)
const INCLUDED_PROJECT_IDS = [
  '6VhG9MrQwJwqJJfW', // Inbox
  '6VmX2Jv6wGG8W8V5', // Personal
  '6VqRM39cGMjV8pP7', // Work
  '6fp9mp2F253X67f8', // Team
  '6crr237qxV93wV9q', // Birthdays
];

// Helper to make Todoist API requests
async function todoistRequest(endpoint, options = {}) {
  const url = new URL(`${TODOIST_API_URL}${endpoint}`);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Authorization': `Bearer ${TODOIST_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Todoist API error: ${response.status} - ${error}`);
  }

  // DELETE requests return 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  const data = await response.json();

  // Todoist API v1 returns { results: [...], next_cursor } for list endpoints
  // Handle pagination: fetch all pages automatically for GET requests
  if (data && Array.isArray(data.results) && options.method === undefined) {
    const allResults = [...data.results];
    let cursor = data.next_cursor;

    while (cursor) {
      const nextUrl = new URL(`${TODOIST_API_URL}${endpoint}`);
      nextUrl.searchParams.set('cursor', cursor);

      const nextResponse = await fetch(nextUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${TODOIST_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!nextResponse.ok) break;
      const nextData = await nextResponse.json();
      if (nextData && Array.isArray(nextData.results)) {
        allResults.push(...nextData.results);
        cursor = nextData.next_cursor;
      } else {
        break;
      }
    }

    return allResults;
  }

  return data;
}

// Sync Todoist tasks to Supabase (runs every 5 minutes)
async function syncTodoist() {
  console.log('[Todoist] Starting sync...');
  try {
    // 1. Fetch active tasks from Todoist
    const tasks = await todoistRequest('/tasks');
    const filteredTasks = tasks.filter(t => INCLUDED_PROJECT_IDS.includes(t.project_id));

    // 2. Fetch projects for name lookup
    const projects = await todoistRequest('/projects');
    const projectMap = {};
    projects.forEach(p => { projectMap[p.id] = p.name; });

    // 3. Fetch sections for name lookup
    const sections = await todoistRequest('/sections');
    const sectionMap = {};
    sections.forEach(s => { sectionMap[s.id] = s.name; });

    // 4. Upsert tasks into Supabase
    const todoistIds = filteredTasks.map(t => t.id);

    for (const tt of filteredTasks) {
      const { data: existing } = await supabase
        .from('tasks')
        .select('task_id')
        .eq('todoist_id', tt.id)
        .maybeSingle();

      const taskData = {
        todoist_id: tt.id,
        content: tt.content,
        description: tt.description || null,
        due_date: tt.due?.date || null,
        due_datetime: tt.due?.datetime || null,
        due_string: tt.due?.string || null,
        priority: tt.priority || 1,
        status: tt.is_completed ? 'completed' : 'open',
        todoist_project_id: tt.project_id,
        todoist_project_name: projectMap[tt.project_id] || null,
        todoist_section_id: tt.section_id || null,
        todoist_section_name: tt.section_id ? sectionMap[tt.section_id] : null,
        todoist_parent_id: tt.parent_id || null,
        task_order: tt.order || 0,
        todoist_url: tt.url,
        synced_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from('tasks')
          .update(taskData)
          .eq('task_id', existing.task_id);
      } else {
        await supabase.from('tasks').insert({
          ...taskData,
          created_at: new Date().toISOString(),
        });
      }
    }

    // 5. Orphan detection - delete tasks in Supabase that are not in Todoist active list
    const { data: orphanTasks } = await supabase
      .from('tasks')
      .select('task_id, todoist_id, content')
      .eq('status', 'open')
      .not('todoist_id', 'is', null)
      .in('todoist_project_id', INCLUDED_PROJECT_IDS);

    const orphans = (orphanTasks || []).filter(t => !todoistIds.includes(t.todoist_id));

    if (orphans.length > 0) {
      console.log(`[Todoist] Deleting ${orphans.length} orphan tasks not in Todoist`);

      for (const orphan of orphans) {
        console.log(`[Todoist] Deleting orphan: "${orphan.content}" (${orphan.todoist_id})`);
        await supabase
          .from('tasks')
          .delete()
          .eq('task_id', orphan.task_id);
      }
    }

    // 6. Safety net - push orphan tasks (no todoist_id) from Supabase to Todoist
    const { data: localOnlyTasks } = await supabase
      .from('tasks')
      .select('task_id, content, description, due_string, priority, todoist_project_name, todoist_section_id')
      .eq('status', 'open')
      .is('todoist_id', null);

    if (localOnlyTasks && localOnlyTasks.length > 0) {
      console.log(`[Todoist] Found ${localOnlyTasks.length} local-only tasks to push to Todoist`);

      for (const task of localOnlyTasks) {
        try {
          // Find project_id from project name
          let targetProjectId = null;
          if (task.todoist_project_name) {
            const proj = projects.find(p => p.name === task.todoist_project_name);
            if (proj) targetProjectId = proj.id;
          }

          const todoistPayload = {
            content: task.content,
            description: task.description || undefined,
            due_string: task.due_string || undefined,
            priority: task.priority || 1,
          };
          if (targetProjectId) {
            todoistPayload.project_id = targetProjectId;
          }
          if (task.todoist_section_id) {
            todoistPayload.section_id = task.todoist_section_id;
          }

          const response = await fetch(`${TODOIST_API_URL}/tasks`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TODOIST_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoistPayload),
          });

          if (response.ok) {
            const newTodoistTask = await response.json();
            // Update Supabase with todoist_id
            await supabase
              .from('tasks')
              .update({
                todoist_id: newTodoistTask.id,
                todoist_url: newTodoistTask.url,
                todoist_project_id: newTodoistTask.project_id,
                todoist_project_name: projectMap[newTodoistTask.project_id] || task.todoist_project_name,
                synced_at: new Date().toISOString(),
              })
              .eq('task_id', task.task_id);

            console.log(`[Todoist] Pushed to Todoist: "${task.content}" → ${newTodoistTask.id}`);
          } else {
            console.error(`[Todoist] Failed to push "${task.content}":`, await response.text());
          }
        } catch (pushErr) {
          console.error(`[Todoist] Error pushing "${task.content}":`, pushErr.message);
        }
      }
    }

    console.log(`[Todoist] Sync complete: ${filteredTasks.length} active tasks, ${orphans.length} orphans deleted, ${localOnlyTasks?.length || 0} pushed to Todoist`);
  } catch (error) {
    console.error('[Todoist] Sync error:', error.message);
  }
}

// ==================== CRM AGENT ENDPOINTS ====================

// Run duplicate scan via CRM Agent
app.post('/agent/run-cleanup', async (req, res) => {
  try {
    const { entity_type = 'contact', limit = 100 } = req.body;

    const response = await fetch(`${CRM_AGENT_URL}/run-cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type, limit }),
    });

    if (response.ok) {
      const result = await response.json();
      res.json(result);
    } else {
      const error = await response.text();
      res.status(response.status).json({ error });
    }
  } catch (error) {
    console.error('[Agent] Cleanup error:', error.message);
    res.status(500).json({ error: 'Failed to connect to agent service' });
  }
});

// ==================== TODOIST ENDPOINTS ====================

// Get all projects with sections
app.get('/todoist/projects', async (req, res) => {
  try {
    const [projects, sections] = await Promise.all([
      todoistRequest('/projects'),
      todoistRequest('/sections'),
    ]);

    // Filter to included projects and attach sections
    const filteredProjects = projects
      .filter(p => INCLUDED_PROJECT_IDS.includes(p.id))
      .map(p => ({
        ...p,
        sections: sections.filter(s => s.project_id === p.id),
      }));

    res.json({ projects: filteredProjects });
  } catch (error) {
    console.error('Todoist projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sections (for included projects)
app.get('/todoist/sections', async (req, res) => {
  try {
    const sections = await todoistRequest('/sections');
    // Filter to included projects only
    const filteredSections = sections.filter(s => INCLUDED_PROJECT_IDS.includes(s.project_id));
    res.json({ sections: filteredSections });
  } catch (error) {
    console.error('Todoist sections error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual sync from Todoist
app.post('/todoist/sync', async (req, res) => {
  try {
    console.log('[Todoist] Manual sync triggered');
    await syncTodoist();
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    console.error('Todoist manual sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks (filtered to included projects)
app.get('/todoist/tasks', async (req, res) => {
  try {
    const tasks = await todoistRequest('/tasks');

    // Filter to included projects only
    const filteredTasks = tasks.filter(t => INCLUDED_PROJECT_IDS.includes(t.project_id));

    // Sort by priority (4=highest) then by due date
    filteredTasks.sort((a, b) => {
      // Priority first (4 is highest, 1 is lowest)
      if (b.priority !== a.priority) return b.priority - a.priority;
      // Then by due date
      const aDate = a.due?.date ? new Date(a.due.date) : new Date('9999-12-31');
      const bDate = b.due?.date ? new Date(b.due.date) : new Date('9999-12-31');
      return aDate - bDate;
    });

    res.json({ tasks: filteredTasks });
  } catch (error) {
    console.error('Todoist tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
app.post('/todoist/tasks', async (req, res) => {
  try {
    const { content, description, project_id, section_id, due_string, priority, labels } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Task content is required' });
    }

    const task = await todoistRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        content,
        description: description || '',
        project_id: project_id || '6VhG9MrQwJwqJJfW', // Default to Inbox
        section_id: section_id || undefined,
        due_string: due_string || undefined,
        priority: priority || 1,
        labels: labels || [],
      }),
    });

    console.log(`[Todoist] Created task: ${content}`);
    res.json({ task });
  } catch (error) {
    console.error('Todoist create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single task by ID
app.get('/todoist/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await todoistRequest(`/tasks/${id}`);
    res.json({ task });
  } catch (error) {
    console.error('Todoist get task error:', error);
    // Return 404 if task not found (deleted or doesn't exist)
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return res.status(404).json({ error: 'Task not found', deleted: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update a task
app.patch('/todoist/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { section_id, project_id, ...updates } = req.body;
    console.log(`[Todoist] Update request - id: ${id}, section_id: ${section_id}, project_id: ${project_id}, updates:`, updates);

    let task = null;

    // Update basic task properties (content, description, priority, due_string, labels)
    if (Object.keys(updates).length > 0) {
      task = await todoistRequest(`/tasks/${id}`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });
    }

    // Move task to different project/section via Sync API
    if (section_id !== undefined || project_id !== undefined) {
      const moveUuid = `move-${id}-${Date.now()}`;
      const moveArgs = { id };
      if (section_id !== undefined && section_id) {
        moveArgs.section_id = section_id;
      } else if (project_id !== undefined) {
        moveArgs.project_id = project_id;
      }

      const syncResponse = await fetch(`${TODOIST_API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TODOIST_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          commands: JSON.stringify([{
            type: 'item_move',
            uuid: moveUuid,
            args: moveArgs
          }])
        }),
      });

      const syncText = await syncResponse.text();
      console.log(`[Todoist] Sync move response (${syncResponse.status}):`, syncText);

      if (!syncResponse.ok) {
        throw new Error(`Sync API error: ${syncResponse.status} - ${syncText}`);
      }

      const syncResult = JSON.parse(syncText);
      if (syncResult.sync_status?.[moveUuid] !== 'ok') {
        throw new Error(`Move failed: ${JSON.stringify(syncResult.sync_status?.[moveUuid])}`);
      }
      console.log(`[Todoist] Moved task ${id} successfully`);
    }

    console.log(`[Todoist] Updated task ${id}`);
    res.json({ task });
  } catch (error) {
    console.error('Todoist update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a task
app.post('/todoist/tasks/:id/close', async (req, res) => {
  try {
    const { id } = req.params;

    await todoistRequest(`/tasks/${id}/close`, {
      method: 'POST',
    });

    console.log(`[Todoist] Completed task ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Todoist complete task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reopen a task
app.post('/todoist/tasks/:id/reopen', async (req, res) => {
  try {
    const { id } = req.params;

    await todoistRequest(`/tasks/${id}/reopen`, {
      method: 'POST',
    });

    console.log(`[Todoist] Reopened task ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Todoist reopen task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
app.delete('/todoist/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await todoistRequest(`/tasks/${id}`, {
      method: 'DELETE',
    });

    console.log(`[Todoist] Deleted task ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Todoist delete task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ END TODOIST ============

// Chat with Claude + MCP Tools
app.post('/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Missing messages array' });
    }

    console.log(`[Chat] Request with ${messages.length} messages, MCP ready: ${mcpReady}`);

    // Get MCP tools if available
    const tools = mcpReady ? mcpManager.getAnthropicTools() : [];
    console.log(`[Chat] Available tools: ${tools.length}`);

    // Build the request
    const requestParams = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt || 'You are a helpful assistant for email management.',
      messages: [...messages],
    };

    // Add tools if available
    if (tools.length > 0) {
      requestParams.tools = tools;
    }

    // Agentic loop - keep going while Claude wants to use tools
    let response = await anthropic.messages.create(requestParams);
    let loopCount = 0;
    const maxLoops = 10; // Safety limit

    while (response.stop_reason === 'tool_use' && loopCount < maxLoops) {
      loopCount++;
      console.log(`[Chat] Tool use loop ${loopCount}`);

      // Get all tool use blocks
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');

      // Execute each tool
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        console.log(`[Chat] Executing tool: ${toolUse.name}`);
        try {
          const result = await mcpManager.executeTool(toolUse.name, toolUse.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.content || result),
          });
        } catch (toolError) {
          console.error(`[Chat] Tool error:`, toolError.message);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${toolError.message}`,
            is_error: true,
          });
        }
      }

      // Add assistant response and tool results to messages
      requestParams.messages.push({
        role: 'assistant',
        content: response.content,
      });
      requestParams.messages.push({
        role: 'user',
        content: toolResults,
      });

      // Continue the conversation
      response = await anthropic.messages.create(requestParams);
    }

    // Extract final text response
    const textBlocks = response.content.filter(block => block.type === 'text');
    const assistantResponse = textBlocks.map(b => b.text).join('\n') || '';

    console.log(`[Chat] Final response (${loopCount} tool loops): ${assistantResponse.substring(0, 100)}...`);

    res.json({
      success: true,
      response: assistantResponse,
      toolsUsed: loopCount,
    });
  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== KEEP IN TOUCH CHAT ENDPOINT ====================
// Server-side context building for Keep in Touch chat with Claude

app.post('/chat/keep-in-touch', async (req, res) => {
  try {
    const { contact_id, message, messages = [] } = req.body;

    if (!contact_id) {
      return res.status(400).json({ success: false, error: 'Missing contact_id' });
    }
    if (!message && messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing message' });
    }

    console.log(`[KIT Chat] Request for contact ${contact_id}`);

    // === FETCH ALL CONTACT DATA FROM SUPABASE ===

    // 1. Contact details
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('contact_id, first_name, last_name, category, job_role, linkedin, score, birthday, description')
      .eq('contact_id', contact_id)
      .single();

    if (contactError || !contactData) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    // 2. Completeness score
    const { data: completenessData } = await supabase
      .from('contact_completeness')
      .select('completeness_score')
      .eq('contact_id', contact_id)
      .maybeSingle();

    // 3. Emails
    const { data: emailsData } = await supabase
      .from('contact_emails')
      .select('email, is_primary')
      .eq('contact_id', contact_id)
      .order('is_primary', { ascending: false });

    // 4. Mobiles
    const { data: mobilesData } = await supabase
      .from('contact_mobiles')
      .select('mobile, is_primary')
      .eq('contact_id', contact_id)
      .order('is_primary', { ascending: false });

    // 5. Companies with details
    const { data: companiesData } = await supabase
      .from('contact_companies')
      .select('company_id, is_primary, relationship')
      .eq('contact_id', contact_id)
      .order('is_primary', { ascending: false });

    let companiesWithDetails = [];
    if (companiesData?.length > 0) {
      const companyIds = companiesData.map(c => c.company_id);
      const { data: companyDetails } = await supabase
        .from('companies')
        .select('company_id, name')
        .in('company_id', companyIds);

      companiesWithDetails = companiesData.map(cc => ({
        ...cc,
        name: companyDetails?.find(c => c.company_id === cc.company_id)?.name
      }));
    }

    // 6. Tags with details
    const { data: tagsData } = await supabase
      .from('contact_tags')
      .select('tag_id')
      .eq('contact_id', contact_id);

    let tagsWithDetails = [];
    if (tagsData?.length > 0) {
      const tagIds = tagsData.map(t => t.tag_id);
      const { data: tagDetails } = await supabase
        .from('tags')
        .select('tag_id, name')
        .in('tag_id', tagIds);
      tagsWithDetails = tagDetails || [];
    }

    // 7. Cities with details
    const { data: citiesData } = await supabase
      .from('contact_cities')
      .select('city_id')
      .eq('contact_id', contact_id);

    let citiesWithDetails = [];
    if (citiesData?.length > 0) {
      const cityIds = citiesData.map(c => c.city_id);
      const { data: cityDetails } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .in('city_id', cityIds);
      citiesWithDetails = cityDetails || [];
    }

    // 8. Last 10 interactions
    const { data: interactionsData } = await supabase
      .from('interactions')
      .select('interaction_type, direction, interaction_date, summary')
      .eq('contact_id', contact_id)
      .order('interaction_date', { ascending: false })
      .limit(10);

    // 9. Notes linked to contact
    const { data: notesData } = await supabase
      .from('notes_contacts')
      .select('notes(note_id, title, text, created_at)')
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 10. Deals linked to contact
    const { data: dealsData } = await supabase
      .from('deals_contacts')
      .select('relationship, deals(deal_id, opportunity, stage, category, total_investment, deal_currency, description)')
      .eq('contact_id', contact_id);

    // 11. Introductions involving this contact
    const { data: introductionsData } = await supabase
      .from('introduction_contacts')
      .select('role, introductions(introduction_id, status, text, category, introduction_date, created_at)')
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 12. Recent emails
    const primaryEmail = emailsData?.find(e => e.is_primary)?.email || emailsData?.[0]?.email;
    let recentEmails = [];
    if (primaryEmail) {
      const { data: emailThreads } = await supabase
        .from('command_center_inbox')
        .select('subject, from_name, from_email, date, snippet')
        .or(`from_email.eq.${primaryEmail},to_recipients.cs.${JSON.stringify([{ email: primaryEmail }])}`)
        .order('date', { ascending: false })
        .limit(5);
      recentEmails = emailThreads || [];
    }

    // === BUILD CONTEXT STRING ===
    const fullName = `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || 'Unknown';

    const emailsList = emailsData?.length > 0
      ? emailsData.map(e => `- ${e.email}${e.is_primary ? ' (primary)' : ''}`).join('\n')
      : 'None';

    const mobilesList = mobilesData?.length > 0
      ? mobilesData.map(m => `- ${m.mobile}${m.is_primary ? ' (primary)' : ''}`).join('\n')
      : 'None';

    const companiesList = companiesWithDetails.length > 0
      ? companiesWithDetails.map(c => `- ${c.name || 'Unknown'}${c.relationship ? ` (${c.relationship})` : ''}`).join('\n')
      : 'None';

    const tagsList = tagsWithDetails.length > 0
      ? tagsWithDetails.map(t => t.name).filter(Boolean).join(', ')
      : 'None';

    const citiesList = citiesWithDetails.length > 0
      ? citiesWithDetails.map(c => `${c.name}${c.country ? `, ${c.country}` : ''}`).filter(Boolean).join('; ')
      : 'None';

    const interactionsList = interactionsData?.length > 0
      ? interactionsData.map(i => `- ${new Date(i.interaction_date).toLocaleDateString()}: ${i.interaction_type} (${i.direction}) - ${i.summary || 'No summary'}`).join('\n')
      : 'None';

    const notes = (notesData || []).map(n => n.notes).filter(Boolean);
    const notesList = notes.length > 0
      ? notes.map(n => `- ${n.title || 'Untitled'} (${new Date(n.created_at).toLocaleDateString()}): ${(n.text || '').substring(0, 100)}${n.text?.length > 100 ? '...' : ''}`).join('\n')
      : 'None';

    const deals = (dealsData || []).map(d => ({ ...d.deals, relationship: d.relationship })).filter(d => d.deal_id);
    const dealsList = deals.length > 0
      ? deals.map(d => `- ${d.opportunity} [${d.stage}] ${d.category ? `(${d.category})` : ''} ${d.total_investment ? `- ${d.deal_currency || ''}${d.total_investment}` : ''}`).join('\n')
      : 'None';

    const introductions = (introductionsData || []).map(i => ({ ...i.introductions, role: i.role })).filter(i => i.introduction_id);
    const introductionsList = introductions.length > 0
      ? introductions.map(i => `- [${i.role}] ${i.category || 'Introduction'} (${new Date(i.introduction_date || i.created_at).toLocaleDateString()}): ${i.text?.substring(0, 100) || 'No details'}${i.text?.length > 100 ? '...' : ''}`).join('\n')
      : 'None';

    const recentEmailsList = recentEmails.length > 0
      ? recentEmails.map(e => `- ${new Date(e.date).toLocaleDateString()}: "${e.subject}" from ${e.from_name || e.from_email}`).join('\n')
      : 'None';

    const context = `
═══════════════════════════════════════════════════
CONTACT: ${fullName}
Contact ID: ${contactData.contact_id}
═══════════════════════════════════════════════════

BASIC INFO:
• Job Role: ${contactData.job_role || 'Not set'}
• Category: ${contactData.category || 'Not set'}
• LinkedIn: ${contactData.linkedin || 'Not set'}
• Birthday: ${contactData.birthday || 'Not set'}
• Score: ${contactData.score || 'Not set'}
• Profile Completeness: ${completenessData?.completeness_score || 0}%
• Tags: ${tagsList}
• Cities: ${citiesList}

CONTACT DETAILS:
Emails:
${emailsList}

Mobile Numbers:
${mobilesList}

COMPANIES:
${companiesList}

${contactData.description ? `PERSONAL NOTES/DESCRIPTION:\n${contactData.description}\n` : ''}

LINKED DEALS:
${dealsList}

INTRODUCTIONS:
${introductionsList}

RECENT NOTES:
${notesList}

RECENT INTERACTIONS:
${interactionsList}

RECENT EMAILS:
${recentEmailsList}

═══════════════════════════════════════════════════
`;

    // === BUILD SYSTEM PROMPT ===
    const systemPrompt = `You are Simone Cimminelli's AI assistant for relationship management (Keep in Touch).

TONE & STYLE:
- Be direct and concise. No fluff, no corporate speak.
- Friendly but professional. Like talking to a smart colleague.
- Use short sentences. Get to the point fast.
- Helpful for managing relationships and staying in touch with contacts.

YOUR ROLE:
- Help manage and maintain relationships with this contact
- Suggest actions: schedule calls, send messages, create notes, set up meetings
- Provide insights about the contact based on available information
- Help draft messages (WhatsApp, Email) that are warm and personal
- Remember context about the contact to provide relevant suggestions

RESPONSE FORMAT:
- Summaries: Max 2-3 bullet points. Just the essentials.
- Actions: One clear recommendation. Maybe a second option.
- Drafts: Keep them short. Real humans don't write essays.
- Key points: List format, 3-5 items max.
- IMPORTANT: When writing draft messages or emails, ALWAYS wrap the draft text between --- markers like this:
---
Your draft message/email text here
---
This format is required so the user can click "Accept & Edit" to use the draft.

${context}`;

    // === CALL CLAUDE ===
    const apiMessages = messages.length > 0
      ? [...messages, { role: 'user', content: message }]
      : [{ role: 'user', content: message }];

    console.log(`[KIT Chat] Calling Claude with ${apiMessages.length} messages`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages,
    });

    const textBlocks = response.content.filter(block => block.type === 'text');
    const assistantResponse = textBlocks.map(b => b.text).join('\n') || '';

    console.log(`[KIT Chat] Response: ${assistantResponse.substring(0, 100)}...`);

    res.json({
      success: true,
      response: assistantResponse,
    });
  } catch (error) {
    console.error('[KIT Chat] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== OBSIDIAN (GitHub) ENDPOINTS ====================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OBSIDIAN_REPO = process.env.OBSIDIAN_REPO || 'simonecimminelli/obsidian-vault'; // owner/repo format

// Helper to create/update a file in GitHub repo
async function createOrUpdateGitHubFile(filePath, content, commitMessage) {
  const [owner, repo] = OBSIDIAN_REPO.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // Check if file exists (to get SHA for update)
  let sha = null;
  try {
    const checkResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
    }
  } catch (e) {
    // File doesn't exist, that's fine
  }

  // Create or update the file
  const body = {
    message: commitMessage,
    content: Buffer.from(content).toString('base64'),
  };
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create file in GitHub');
  }

  return await response.json();
}

// Create a new note in Obsidian vault
app.post('/obsidian/notes', async (req, res) => {
  try {
    const { title, noteType, summary, obsidianPath, linkedContacts } = req.body;

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'GitHub token not configured' });
    }

    if (!title || !obsidianPath) {
      return res.status(400).json({ success: false, error: 'Title and obsidianPath are required' });
    }

    // Generate note content with frontmatter
    const now = new Date();
    const frontmatter = [
      '---',
      `title: "${title}"`,
      `type: ${noteType || 'general'}`,
      `created: ${now.toISOString()}`,
      linkedContacts?.length ? `contacts: [${linkedContacts.map(c => `"${c.first_name} ${c.last_name || ''}".trim()`).join(', ')}]` : null,
      summary ? `summary: "${summary}"` : null,
      'tags: [crm]',
      '---',
      '',
    ].filter(Boolean).join('\n');

    const content = frontmatter + `# ${title}\n\n${summary || ''}\n\n## Notes\n\n`;

    // Create the file in GitHub
    const filePath = obsidianPath.endsWith('.md') ? obsidianPath : `${obsidianPath}.md`;
    await createOrUpdateGitHubFile(
      filePath,
      content,
      `Create note: ${title}`
    );

    console.log(`[Obsidian] Created note: ${filePath}`);
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('[Obsidian] Error creating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an existing note
app.put('/obsidian/notes', async (req, res) => {
  try {
    const { obsidianPath, content } = req.body;

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'GitHub token not configured' });
    }

    const filePath = obsidianPath.endsWith('.md') ? obsidianPath : `${obsidianPath}.md`;
    await createOrUpdateGitHubFile(
      filePath,
      content,
      `Update note: ${obsidianPath}`
    );

    console.log(`[Obsidian] Updated note: ${filePath}`);
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('[Obsidian] Error updating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get note content from GitHub (using query param for path)
app.get('/obsidian/note', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'GitHub token not configured' });
    }

    const filePath = req.query.path;
    const [owner, repo] = OBSIDIAN_REPO.split('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const file = await response.json();
    const content = Buffer.from(file.content, 'base64').toString('utf-8');

    res.json({ success: true, content, sha: file.sha });
  } catch (error) {
    console.error('[Obsidian] Error fetching note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a note from GitHub
app.delete('/obsidian/notes', async (req, res) => {
  try {
    const { obsidianPath } = req.body;

    if (!obsidianPath) {
      return res.status(400).json({ success: false, error: 'obsidianPath is required' });
    }

    const filePath = obsidianPath.endsWith('.md') ? obsidianPath : `${obsidianPath}.md`;
    const [owner, repo] = OBSIDIAN_REPO.split('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // First get the file SHA (required for deletion)
    const getResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        // File doesn't exist in GitHub, that's okay
        return res.json({ success: true, message: 'File not found in GitHub (already deleted or never synced)' });
      }
      throw new Error('Failed to get file info from GitHub');
    }

    const fileInfo = await getResponse.json();

    // Delete the file
    const deleteResponse = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete note: ${obsidianPath}`,
        sha: fileInfo.sha,
      }),
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      throw new Error(error.message || 'Failed to delete file from GitHub');
    }

    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error deleting note from GitHub:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check Obsidian/GitHub connection status
app.get('/obsidian/status', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.json({ connected: false, error: 'GitHub token not configured' });
    }

    const [owner, repo] = OBSIDIAN_REPO.split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const repoInfo = await response.json();
      res.json({ connected: true, repo: repoInfo.full_name, private: repoInfo.private });
    } else {
      res.json({ connected: false, error: 'Cannot access repository' });
    }
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// ==================== CALENDAR ENDPOINTS ====================

// Extract meeting info from email using Claude
app.post('/calendar/extract-event', async (req, res) => {
  try {
    const { email, whatsapp } = req.body;

    if (!email && !whatsapp) {
      return res.status(400).json({ success: false, error: 'Email or WhatsApp data required' });
    }

    // Get current date in UK timezone
    const ukDate = new Date().toLocaleDateString('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const ukDateISO = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD format

    let prompt;

    if (whatsapp) {
      // WhatsApp extraction
      console.log('[Calendar] Extracting event from WhatsApp:', whatsapp.contact_name);

      // Format messages for context
      const messagesText = (whatsapp.messages || []).map(m => {
        const sender = m.is_from_me ? 'Simone' : (whatsapp.contact_name || whatsapp.contact_number);
        const time = m.timestamp ? new Date(m.timestamp).toLocaleString('it-IT') : '';
        return `[${time}] ${sender}: ${m.content || m.text || ''}`;
      }).join('\n');

      prompt = `Analyze this WhatsApp conversation and extract any meeting/event information.

IMPORTANT - TODAY'S DATE: ${ukDate} (${ukDateISO})
This is crucial for interpreting relative dates like "tomorrow", "next week", etc.

Chat with: ${whatsapp.contact_name || whatsapp.contact_number}
Phone: ${whatsapp.contact_number || 'unknown'}

Messages:
${messagesText}

`;
    } else {
      // Email extraction
      console.log('[Calendar] Extracting event from email:', email.subject);

      prompt = `Analyze this email and extract any meeting/event information.

IMPORTANT - TODAY'S DATE: ${ukDate} (${ukDateISO})
This is crucial for interpreting relative dates like "tomorrow", "next week", etc.

From: ${email.from_name || ''} <${email.from_email || ''}>
To: ${JSON.stringify(email.to_recipients || [])}
CC: ${JSON.stringify(email.cc_recipients || [])}
Subject: ${email.subject || ''}
Email Date: ${email.date || ''}

Email Body:
${email.body_text || email.snippet || ''}

`;
    }

    // Common JSON format and rules
    prompt += `Extract meeting details and respond with ONLY valid JSON in this exact format:
{
  "found_event": true/false,
  "title": "[Other Person Name] <> Simone Cimminelli",
  "datetime": "ISO 8601 format in UK time (Europe/London), null if not found",
  "date_text": "Original text that mentions the date/time (e.g., '10:30 ad High Street Ken')",
  "duration_minutes": 60,
  "location": "Location if mentioned, null otherwise",
  "location_needs_clarification": true/false,
  "location_options": ["Option 1", "Option 2"] or null,
  "attendees": [{"email": "email@example.com", "name": "Name"}],
  "description": "Brief context from the conversation",
  "confidence": "high/medium/low",
  "clarification_needed": ["list of things that need user confirmation"]
}

Rules:
- TITLE FORMAT: Always use "[Other Person's Full Name] <> Simone Cimminelli" (e.g., "Lorenzo De Angeli <> Simone Cimminelli")
- TIMEZONE: All times must be in UK time (Europe/London). If a time is mentioned, assume it's UK time.
- RELATIVE DATES: Today is ${ukDateISO}. "Tomorrow" means the day after today. "Next week" means the following week. Always calculate from TODAY'S DATE shown above.
- DATE INFERENCE: If only a TIME is mentioned without an explicit date, assume the meeting is for TOMORROW (the next day), NOT today.
- LOCATION SHORTCUTS - expand these to full addresses:
  * "notting hill", "in ufficio", "in my office", "my office", "office" → "Fora - United House, 9 Pembridge Rd, London W11 3JY"
  * "club", "high street kensington", "high street ken", "roof gardens", "kensington" → "The Roof Gardens, 99 Kensington High St, London W8 5SA"
- If location doesn't match shortcuts and is still unclear, set location_needs_clarification to true
- Set found_event to false if this doesn't appear to be about a meeting/event`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse Claude's response
    let responseText = response.content[0].text.trim();

    // Handle markdown code blocks
    if (responseText.startsWith('```')) {
      const lines = responseText.split('\n');
      const jsonLines = [];
      let inJson = false;
      for (const line of lines) {
        if (line.startsWith('```') && !inJson) {
          inJson = true;
          continue;
        } else if (line.startsWith('```') && inJson) {
          break;
        } else if (inJson) {
          jsonLines.push(line);
        }
      }
      responseText = jsonLines.join('\n');
    }

    const extracted = JSON.parse(responseText);
    console.log('[Calendar] Extracted event:', extracted);

    // For WhatsApp: look up contacts by phone number and get their emails
    if (whatsapp && extracted.found_event) {
      try {
        // Collect all phone numbers from the chat
        const phoneNumbers = new Set();

        // Add main chat contact number (for 1:1 chats)
        if (whatsapp.contact_number) {
          phoneNumbers.add(whatsapp.contact_number.replace(/[^\d+]/g, ''));
        }

        // For group chats: also collect sender numbers from messages
        if (whatsapp.is_group_chat && whatsapp.messages) {
          whatsapp.messages.forEach(m => {
            if (!m.is_from_me && m.sender_number) {
              phoneNumbers.add(m.sender_number.replace(/[^\d+]/g, ''));
            }
          });
        }

        console.log('[Calendar] Looking up phone numbers:', Array.from(phoneNumbers));

        if (phoneNumbers.size > 0) {
          // Build phone variants for all numbers
          const allPhoneVariants = [];
          phoneNumbers.forEach(phone => {
            if (phone) {
              allPhoneVariants.push(
                phone,
                phone.replace(/^\+/, ''),
                phone.replace(/^00/, ''),
                phone.slice(-10),
                phone.slice(-9)
              );
            }
          });
          const uniqueVariants = [...new Set(allPhoneVariants.filter(Boolean))];

          // Search contact_mobiles for matching phone numbers
          const { data: mobileMatches } = await supabase
            .from('contact_mobiles')
            .select('contact_id, mobile')
            .or(uniqueVariants.map(p => `mobile.ilike.%${p}%`).join(','));

          if (mobileMatches && mobileMatches.length > 0) {
            const contactIds = [...new Set(mobileMatches.map(m => m.contact_id))];

            // Fetch contacts with their emails
            const { data: contacts } = await supabase
              .from('contacts')
              .select(`
                contact_id,
                first_name,
                last_name,
                contact_emails (
                  email,
                  is_primary
                )
              `)
              .in('contact_id', contactIds);

            if (contacts && contacts.length > 0) {
              const matchedAttendees = [];
              contacts.forEach(contact => {
                const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

                // Add ALL emails for this contact as separate attendees
                if (contact.contact_emails && contact.contact_emails.length > 0) {
                  contact.contact_emails.forEach(emailObj => {
                    if (emailObj.email) {
                      matchedAttendees.push({ name: fullName, email: emailObj.email });
                    }
                  });
                }
              });

              // Merge with existing attendees (avoid duplicates)
              const existingEmails = new Set((extracted.attendees || []).map(a => a.email?.toLowerCase()));
              matchedAttendees.forEach(attendee => {
                if (!existingEmails.has(attendee.email?.toLowerCase())) {
                  extracted.attendees = extracted.attendees || [];
                  extracted.attendees.push(attendee);
                }
              });

              console.log('[Calendar] Added attendees from contact lookup:', matchedAttendees);
            }
          }
        }
      } catch (lookupError) {
        console.error('[Calendar] Contact lookup error:', lookupError);
        // Continue even if lookup fails
      }
    }

    res.json({
      success: true,
      event: extracted,
    });
  } catch (error) {
    console.error('[Calendar] Extract error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a calendar event via CalDAV
app.post('/calendar/create-event', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      allDay,
      attendees,
      reminders,
      timezone,
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ success: false, error: 'Title and startDate are required' });
    }

    // Check for Fastmail CalDAV credentials (requires separate app password)
    const username = process.env.FASTMAIL_USERNAME;
    const caldavPassword = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;

    if (!username || !caldavPassword) {
      return res.status(500).json({ success: false, error: 'Fastmail CalDAV credentials not configured' });
    }

    console.log('[Calendar] Creating event:', title, 'at', startDate, 'timezone:', timezone || 'Europe/Rome');

    const caldav = new CalDAVClient(username, caldavPassword);

    const result = await caldav.createEvent({
      title,
      description: description || '',
      location: location || '',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay || false,
      attendees: attendees || [],
      reminders: reminders || [15], // Default 15 min reminder
      timezone: timezone || 'Europe/Rome',
    });

    console.log('[Calendar] Event created:', result);

    // Send invite emails to attendees if there are any
    let invitesSent = [];
    if (attendees && attendees.length > 0 && result.ics) {
      console.log('[Calendar] Sending invite emails to', attendees.length, 'attendees');

      try {
        const jmap = new JMAPClient(username, process.env.FASTMAIL_API_TOKEN);
        await jmap.init();

        // Upload ICS as blob
        const icsBuffer = Buffer.from(result.ics, 'utf-8');
        const blob = await jmap.uploadBlob(icsBuffer, 'text/calendar');
        console.log('[Calendar] ICS blob uploaded:', blob.blobId);

        // Format date for email
        const eventDate = new Date(startDate);
        const dateStr = eventDate.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone || 'Europe/Rome',
        });

        // Send invite to each attendee
        for (const attendee of attendees) {
          try {
            const emailSubject = `Invitation: ${title}`;
            const emailBody = `You have been invited to:\n\n${title}\n\nWhen: ${dateStr}\n${location ? `Where: ${location}\n` : ''}\n\nPlease find the calendar invitation attached.\n\n--\nSimone Cimminelli`;
            const htmlBody = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h2 style="color: #1a73e8;">Calendar Invitation</h2>
                <p>You have been invited to:</p>
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <h3 style="margin: 0 0 8px 0;">${title}</h3>
                  <p style="margin: 4px 0;"><strong>When:</strong> ${dateStr}</p>
                  ${location ? `<p style="margin: 4px 0;"><strong>Where:</strong> ${location}</p>` : ''}
                </div>
                <p>Please find the calendar invitation attached.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
                <p style="color: #666;">Simone Cimminelli</p>
              </div>
            `;

            await jmap.sendEmail({
              to: [{ email: attendee.email, name: attendee.name || '' }],
              subject: emailSubject,
              textBody: emailBody,
              htmlBody: htmlBody,
              attachments: [{
                blobId: blob.blobId,
                type: 'text/calendar; method=REQUEST',
                name: 'invite.ics',
                size: blob.size,
              }],
            });

            console.log('[Calendar] Invite sent to:', attendee.email);
            invitesSent.push(attendee.email);
          } catch (emailError) {
            console.error('[Calendar] Failed to send invite to', attendee.email, ':', emailError.message);
          }
        }
      } catch (jmapError) {
        console.error('[Calendar] Failed to send invite emails:', jmapError.message);
      }
    }

    res.json({
      success: true,
      event: result,
      invitesSent,
    });
  } catch (error) {
    console.error('[Calendar] Create event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get calendars list
app.get('/calendar/calendars', async (req, res) => {
  try {
    const username = process.env.FASTMAIL_USERNAME;
    const caldavPassword = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;

    if (!username || !caldavPassword) {
      return res.status(500).json({ success: false, error: 'Fastmail CalDAV credentials not configured' });
    }

    const caldav = new CalDAVClient(username, caldavPassword);
    const calendars = await caldav.getCalendars();

    res.json({ success: true, calendars });
  } catch (error) {
    console.error('[Calendar] Get calendars error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get events in a date range
app.get('/calendar/events', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'start and end dates required' });
    }

    const username = process.env.FASTMAIL_USERNAME;
    const caldavPassword = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;

    if (!username || !caldavPassword) {
      return res.status(500).json({ success: false, error: 'Fastmail CalDAV credentials not configured' });
    }

    const caldav = new CalDAVClient(username, caldavPassword);
    const events = await caldav.getEvents(new Date(start), new Date(end));

    res.json({ success: true, events });
  } catch (error) {
    console.error('[Calendar] Get events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check calendar connection status
app.get('/calendar/status', async (req, res) => {
  try {
    const username = process.env.FASTMAIL_USERNAME;
    const caldavPassword = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;

    if (!username || !caldavPassword) {
      return res.json({ connected: false, error: 'Fastmail CalDAV credentials not configured' });
    }

    const caldav = new CalDAVClient(username, caldavPassword);
    const calendars = await caldav.getCalendars();

    res.json({
      connected: true,
      username,
      calendars: calendars.length,
    });
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// ==================== IMPORT CALENDAR INVITATION ====================

// Import a calendar invitation from email to "Living with Intention" calendar
// Parses the ICS attachment and creates the event on Google Calendar
app.post('/calendar/import-invitation', async (req, res) => {
  try {
    const { inbox_id } = req.body;

    if (!inbox_id) {
      return res.status(400).json({ success: false, error: 'inbox_id is required' });
    }

    // Check Google Calendar credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    // Check JMAP credentials
    if (!process.env.FASTMAIL_USERNAME || !process.env.FASTMAIL_API_TOKEN) {
      return res.status(500).json({ success: false, error: 'Fastmail JMAP credentials not configured' });
    }

    // Fetch the inbox record
    const { data: inboxRecord, error: fetchError } = await supabase
      .from('command_center_inbox')
      .select('id, subject, attachments, fastmail_id')
      .eq('id', inbox_id)
      .single();

    if (fetchError || !inboxRecord) {
      return res.status(404).json({ success: false, error: 'Inbox record not found' });
    }

    // Find the ICS attachment
    const attachments = inboxRecord.attachments || [];
    const icsAttachment = attachments.find(a =>
      a.type === 'text/calendar' ||
      a.type === 'application/ics' ||
      (a.name && a.name.endsWith('.ics'))
    );

    if (!icsAttachment || !icsAttachment.blobId) {
      return res.status(400).json({ success: false, error: 'No ICS attachment found in this email' });
    }

    console.log('[Calendar Import] Found ICS attachment:', icsAttachment.blobId);

    // Initialize JMAP client and download the blob
    const jmap = new JMAPClient(process.env.FASTMAIL_USERNAME, process.env.FASTMAIL_API_TOKEN);
    await jmap.init();

    const blobResult = await jmap.downloadBlob(
      icsAttachment.blobId,
      icsAttachment.name || 'invite.ics',
      icsAttachment.type || 'text/calendar'
    );

    // Convert buffer to string
    const icsContent = new TextDecoder().decode(blobResult.buffer);
    console.log('[Calendar Import] Downloaded ICS, size:', icsContent.length);

    // Parse ICS using CalDAV client's parseICS method
    const caldavUsername = process.env.FASTMAIL_USERNAME;
    const caldavPassword = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;
    const caldav = new CalDAVClient(caldavUsername, caldavPassword);

    const parsedEvent = caldav.parseICS(icsContent);

    if (!parsedEvent) {
      return res.status(400).json({ success: false, error: 'Failed to parse ICS content' });
    }

    console.log('[Calendar Import] Parsed event:', parsedEvent.title, 'at', parsedEvent.startDate);
    console.log('[Calendar Import] Attendees:', parsedEvent.attendees?.length || 0);
    console.log('[Calendar Import] Conference URL:', parsedEvent.conferenceUrl);

    // Create event on Google Calendar (Living with Intention)
    const gcal = getGoogleCalendarClient();

    // Build attendees list from parsed ICS
    const gcalAttendees = (parsedEvent.attendees || []).map(att => ({
      email: att.email,
      name: att.name || '',
    }));

    // Determine location - prefer conference URL if no physical location
    const eventLocation = parsedEvent.location || parsedEvent.conferenceUrl || '';

    const result = await gcal.createEvent({
      title: parsedEvent.title,
      description: parsedEvent.description || '',
      location: eventLocation,
      startDate: parsedEvent.startDate,
      endDate: parsedEvent.endDate,
      allDay: parsedEvent.allDay || false,
      attendees: gcalAttendees,
      sendUpdates: 'none', // Don't send invites - we're just adding to our calendar
      timezone: 'Europe/Rome',
      useGoogleMeet: false, // The event may already have a conference URL
    });

    console.log('[Calendar Import] Event created on Google Calendar:', result.id);

    // Add to command_center_inbox as type='calendar' so it appears in Calendar tab
    const transformed = gcal.transformEventForInbox(result);
    if (transformed) {
      await supabase
        .from('command_center_inbox')
        .upsert({
          type: 'calendar',
          event_uid: transformed.event_uid,
          subject: transformed.subject,
          body_text: transformed.body_text,
          date: transformed.date,
          event_end: transformed.event_end,
          event_location: transformed.event_location,
          from_name: parsedEvent.organizerName || transformed.from_name,
          from_email: parsedEvent.organizerEmail || transformed.from_email,
          to_recipients: transformed.to_recipients,
          etag: transformed.etag,
          is_read: false,
          created_at: new Date().toISOString(),
        }, { onConflict: 'event_uid' });
    }

    res.json({
      success: true,
      event: {
        id: result.id,
        htmlLink: result.htmlLink,
        title: parsedEvent.title,
        startDate: parsedEvent.startDate,
        endDate: parsedEvent.endDate,
        location: eventLocation,
        attendeesCount: gcalAttendees.length,
        organizer: parsedEvent.organizerEmail,
        conferenceUrl: parsedEvent.conferenceUrl,
      },
      message: 'Event imported to Living with Intention calendar',
    });
  } catch (error) {
    console.error('[Calendar Import] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GOOGLE CALENDAR API ====================

// Create event in Google Calendar (with invites)
app.post('/google-calendar/create-event', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      allDay,
      attendees,
      timezone,
      useGoogleMeet,
      colorId,
      calendarId,
      sendUpdates = 'all', // 'all' sends invite emails
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ success: false, error: 'Title and startDate are required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();

    console.log('[GoogleCalendar] Creating event:', title, 'at', startDate, 'timezone:', timezone, 'googleMeet:', useGoogleMeet, 'calendar:', calendarId || 'default');

    const result = await gcal.createEvent({
      title,
      description: description || '',
      location: location || '',
      startDate,
      endDate,
      allDay: allDay || false,
      attendees: attendees || [],
      sendUpdates,
      timezone: timezone || 'Europe/Rome',
      useGoogleMeet: useGoogleMeet || false,
      colorId: colorId || undefined,
      calendarId: calendarId || undefined,
    });

    console.log('[GoogleCalendar] Event created:', result.id);

    // Also add to command_center_inbox immediately
    const transformed = gcal.transformEventForInbox(result);
    if (transformed) {
      await supabase
        .from('command_center_inbox')
        .upsert({
          type: 'calendar',
          event_uid: transformed.event_uid,
          subject: transformed.subject,
          body_text: transformed.body_text,
          date: transformed.date,
          event_end: transformed.event_end,
          event_location: transformed.event_location,
          from_name: transformed.from_name,
          from_email: transformed.from_email,
          to_recipients: transformed.to_recipients,
          etag: transformed.etag,
          is_read: true, // Mark as read since we just created it
          created_at: new Date().toISOString(),
        }, { onConflict: 'event_uid' });
    }

    res.json({
      success: true,
      event: {
        id: result.id,
        htmlLink: result.htmlLink,
        title,
        startDate,
        endDate,
        location,
        attendees,
      },
      invitesSent: sendUpdates === 'all' && attendees?.length > 0,
    });
  } catch (error) {
    console.error('[GoogleCalendar] Create event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update event in Google Calendar
app.put('/google-calendar/update-event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId, sendUpdates = 'all', ...updates } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    const result = await gcal.updateEvent(eventId, updates, sendUpdates, calendarId || undefined);

    console.log('[GoogleCalendar] Event updated:', eventId);

    res.json({ success: true, event: result });
  } catch (error) {
    console.error('[GoogleCalendar] Update event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Respond to a Google Calendar event invitation (accept/decline/tentative)
app.post('/google-calendar/respond-to-event', async (req, res) => {
  try {
    const { eventId, calendarId, status = 'accepted' } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }

    if (!['accepted', 'declined', 'tentative'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status must be accepted, declined, or tentative' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    const userEmail = 'simone@cimminelli.com';

    let event = null;
    let foundCalendarId = calendarId || null;

    if (calendarId) {
      // Direct lookup on specified calendar
      event = await gcal.request(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`);
    } else {
      // Search across all owned calendars
      const calendars = await gcal.listCalendars();
      const ownedCalendars = calendars.filter(c => c.accessRole === 'owner');

      for (const cal of ownedCalendars) {
        try {
          event = await gcal.request(`/calendars/${encodeURIComponent(cal.id)}/events/${encodeURIComponent(eventId)}`);
          foundCalendarId = cal.id;
          break;
        } catch (err) {
          // Event not on this calendar, try next
          continue;
        }
      }
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found on any calendar' });
    }

    // Check if user is the organizer — no RSVP needed
    if (event.organizer?.email?.toLowerCase() === userEmail && !event.organizer?.self === false) {
      // If organizer and no attendees list or user not in attendees, just return success
      const isAttendee = (event.attendees || []).some(a => a.email?.toLowerCase() === userEmail);
      if (!isAttendee) {
        return res.json({
          success: true,
          event: { id: event.id, status: 'organizer', htmlLink: event.htmlLink, calendarId: foundCalendarId },
          message: 'You are the organizer — no RSVP needed',
        });
      }
    }

    // Find user in attendees
    const attendees = event.attendees || [];
    const userAttendee = attendees.find(a => a.email?.toLowerCase() === userEmail);

    if (!userAttendee) {
      return res.status(400).json({ success: false, error: 'User is not an attendee of this event' });
    }

    // Update response status
    userAttendee.responseStatus = status;

    // PATCH the event
    const updated = await gcal.request(
      `/calendars/${encodeURIComponent(foundCalendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      'PATCH',
      { attendees }
    );

    console.log(`[GoogleCalendar] Responded to event ${eventId}: ${status}`);

    res.json({
      success: true,
      event: {
        id: updated.id,
        status,
        htmlLink: updated.htmlLink,
        calendarId: foundCalendarId,
      },
    });
  } catch (error) {
    console.error('[GoogleCalendar] Respond to event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete event from Google Calendar
app.delete('/google-calendar/delete-event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sendUpdates = 'all', calendarId } = req.query;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    await gcal.deleteEvent(eventId, sendUpdates, calendarId || undefined);

    // Also remove from command_center_inbox
    await supabase
      .from('command_center_inbox')
      .delete()
      .eq('type', 'calendar')
      .eq('event_uid', eventId);

    console.log('[GoogleCalendar] Event deleted:', eventId);

    res.json({ success: true, eventId });
  } catch (error) {
    console.error('[GoogleCalendar] Delete event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Google Calendar events directly
app.get('/google-calendar/events', async (req, res) => {
  try {
    const { timeMin, timeMax, maxResults = 100, calendarId } = req.query;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    const { events } = await gcal.getEvents({
      timeMin,
      timeMax,
      maxResults: parseInt(maxResults),
      calendarId: calendarId || undefined,
    });

    res.json({ success: true, events });
  } catch (error) {
    console.error('[GoogleCalendar] Get events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all Google Calendars
app.get('/google-calendar/calendars', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    const calendars = await gcal.listCalendars();

    res.json({ success: true, calendars });
  } catch (error) {
    console.error('[GoogleCalendar] List calendars error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get events from multiple calendars
app.get('/google-calendar/events/all', async (req, res) => {
  try {
    const { timeMin, timeMax, calendarIds } = req.query;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    // Google Calendar event colorId → hex mapping
    const EVENT_COLORS = {
      '1': '#7986CB', // Lavender
      '2': '#33B679', // Sage
      '3': '#8E24AA', // Grape
      '4': '#E67C73', // Flamingo
      '5': '#F6BF26', // Banana
      '6': '#F4511E', // Tangerine
      '7': '#039BE5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3F51B5', // Blueberry
      '10': '#0B8043', // Basil
      '11': '#D50000', // Tomato
    };

    const gcal = getGoogleCalendarClient();

    // Get all calendars with their colors
    const calendars = await gcal.listCalendars();
    const calColorMap = {};
    calendars.forEach(c => {
      calColorMap[c.id] = c.backgroundColor || '#4285F4';
    });

    let ids;
    if (calendarIds) {
      ids = calendarIds.split(',');
    } else {
      ids = calendars
        .filter(c => c.accessRole === 'owner')
        .map(c => c.id);
    }

    const allEvents = await gcal.getEventsMultiCalendar(ids, { timeMin, timeMax });

    // Deduplicate by iCalUID + start time (same event can appear on multiple calendars,
    // but recurring instances share iCalUID so we must include start to keep all instances)
    const seen = new Set();
    const events = allEvents.filter(e => {
      const start = e.start?.dateTime || e.start?.date || '';
      const key = (e.iCalUID || e.id) + '|' + start;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enrich each event with resolved color
    events.forEach(e => {
      if (e.colorId && EVENT_COLORS[e.colorId]) {
        e._color = EVENT_COLORS[e.colorId];
      } else {
        // Use the calendar's background color
        const calId = e.organizer?.email || '';
        e._color = calColorMap[calId] || '#4285F4';
      }
    });

    // Sort by start time
    events.sort((a, b) => {
      const aTime = a.start?.dateTime || a.start?.date || '';
      const bTime = b.start?.dateTime || b.start?.date || '';
      return aTime.localeCompare(bTime);
    });

    res.json({ success: true, events });
  } catch (error) {
    console.error('[GoogleCalendar] Get all events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual sync trigger for Google Calendar
app.post('/google-calendar/sync', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    // Reset sync token to force full sync
    googleCalendarSyncToken = null;
    await syncGoogleCalendar();

    res.json({ success: true, message: 'Google Calendar sync triggered' });
  } catch (error) {
    console.error('[GoogleCalendar] Manual sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google Calendar status
app.get('/google-calendar/status', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN || !process.env.GOOGLE_CALENDAR_ID) {
      return res.json({
        connected: false,
        error: 'Google Calendar credentials not configured',
      });
    }

    const gcal = getGoogleCalendarClient();
    // Test connection by getting a token
    await gcal.getAccessToken();

    res.json({
      connected: true,
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    });
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// ============ END CALENDAR ============

// ==================== WHATSAPP (BAILEYS) ====================

// Initialize Baileys on startup (will wait for QR if no session)
let baileysInitPromise = null;

async function initBaileysOnStartup() {
  try {
    console.log('[WhatsApp] Initializing Baileys...');
    await initBaileys();
  } catch (error) {
    console.error('[WhatsApp] Startup init error:', error.message);
  }
}

// Get WhatsApp connection status
app.get('/whatsapp/status', (req, res) => {
  const status = getBaileysStatus();
  res.json(status);
});

// Get QR code for scanning (returns base64 data URL)
app.get('/whatsapp/qr', async (req, res) => {
  try {
    const status = getBaileysStatus();

    // If not connected and no QR, trigger connection
    if (status.status === 'disconnected' && !status.hasQR) {
      await initBaileys();
    }

    const qr = getQRCode();

    if (!qr) {
      const currentStatus = getBaileysStatus();
      if (currentStatus.status === 'connected') {
        return res.json({ success: true, connected: true, message: 'Already connected' });
      }
      return res.json({ success: false, error: 'QR code not available yet', status: currentStatus });
    }

    // Generate QR code as data URL
    const QRCode = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(qr);

    res.json({ success: true, qr: dataUrl });
  } catch (error) {
    console.error('[WhatsApp] QR error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get QR code as actual image (easier to scan)
app.get('/whatsapp/qr-image', async (req, res) => {
  try {
    const status = getBaileysStatus();

    if (status.status === 'connected') {
      return res.send('<h1>✅ Already connected!</h1>');
    }

    // If not connected and no QR, trigger connection
    if (status.status === 'disconnected' && !status.hasQR) {
      await initBaileys();
      // Wait a bit for QR to generate
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const qr = getQRCode();

    if (!qr) {
      return res.send('<h1>⏳ Waiting for QR... Refresh in a few seconds</h1><script>setTimeout(() => location.reload(), 3000)</script>');
    }

    // Generate QR code as PNG buffer
    const QRCode = await import('qrcode');
    const buffer = await QRCode.toBuffer(qr, { width: 400 });

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    console.error('[WhatsApp] QR image error:', error);
    res.status(500).send('Error generating QR');
  }
});

// Reconnect / reinitialize
app.post('/whatsapp/connect', async (req, res) => {
  try {
    await initBaileys();
    const status = getBaileysStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('[WhatsApp] Connect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout and clear session
app.post('/whatsapp/logout', async (req, res) => {
  const result = await clearSession();
  res.json(result);
});

// Send message (text)
app.post('/whatsapp/send', async (req, res) => {
  try {
    const { phone, chat_id, message, text } = req.body;
    const messageText = message || text;

    if (!messageText) {
      return res.status(400).json({ success: false, error: 'Message text required' });
    }

    if (!phone && !chat_id) {
      return res.status(400).json({ success: false, error: 'Phone or chat_id required' });
    }

    let result;

    if (chat_id) {
      // Send to group/chat by ID
      result = await sendMessageToChat(chat_id, messageText);
    } else {
      // Send to phone number
      result = await baileysSendMessage(phone, messageText);
    }

    res.json(result);
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send media (file upload)
app.post('/whatsapp/send-media', async (req, res) => {
  try {
    const { phone, chat_id, caption, file } = req.body;

    if (!file || !file.data) {
      return res.status(400).json({ success: false, error: 'File data required (base64)' });
    }

    if (!phone && !chat_id) {
      return res.status(400).json({ success: false, error: 'Phone or chat_id required' });
    }

    const buffer = Buffer.from(file.data, 'base64');
    const to = chat_id || phone;

    const result = await sendMedia(
      to,
      buffer,
      file.mimetype || 'application/octet-stream',
      file.filename || 'file',
      caption || ''
    );

    res.json(result);
  } catch (error) {
    console.error('[WhatsApp] Send media error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync WhatsApp groups - fetch from Baileys and update chats table with baileys_jid
app.post('/whatsapp/sync-groups', async (req, res) => {
  try {
    console.log('[WhatsApp] Syncing groups...');

    // Fetch all groups from Baileys
    const baileysGroups = await fetchAllGroups();

    if (!baileysGroups || baileysGroups.length === 0) {
      return res.json({ success: true, synced: 0, message: 'No groups found in Baileys' });
    }

    // Get all group chats from Supabase
    const { data: dbChats, error: fetchError } = await supabase
      .from('chats')
      .select('id, chat_name, baileys_jid')
      .eq('is_group_chat', true);

    if (fetchError) {
      throw new Error(`Failed to fetch chats: ${fetchError.message}`);
    }

    let syncedCount = 0;
    const results = [];

    // Match by name and update baileys_jid
    for (const dbChat of (dbChats || [])) {
      const chatName = dbChat.chat_name?.toLowerCase().trim();
      if (!chatName) continue;

      // Find matching Baileys group
      const match = baileysGroups.find(g => {
        const baileysName = g.name?.toLowerCase().trim();
        return baileysName === chatName ||
               baileysName?.includes(chatName) ||
               chatName?.includes(baileysName);
      });

      if (match && match.jid !== dbChat.baileys_jid) {
        // Update baileys_jid
        const { error: updateError } = await supabase
          .from('chats')
          .update({ baileys_jid: match.jid })
          .eq('id', dbChat.id);

        if (!updateError) {
          syncedCount++;
          results.push({ chat_name: dbChat.chat_name, baileys_jid: match.jid });
          console.log(`[WhatsApp] Synced: ${dbChat.chat_name} -> ${match.jid}`);
        }
      }
    }

    res.json({
      success: true,
      synced: syncedCount,
      total_baileys_groups: baileysGroups.length,
      total_db_groups: dbChats?.length || 0,
      results
    });
  } catch (error) {
    console.error('[WhatsApp] Sync groups error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find group JID by name (for on-demand lookup)
app.get('/whatsapp/find-group', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name required' });
    }

    // First check if we have it in DB
    const { data: dbChat } = await supabase
      .from('chats')
      .select('id, chat_name, baileys_jid')
      .eq('is_group_chat', true)
      .ilike('chat_name', `%${name}%`)
      .not('baileys_jid', 'is', null)
      .limit(1)
      .single();

    if (dbChat?.baileys_jid) {
      return res.json({ success: true, source: 'db', jid: dbChat.baileys_jid, chat_name: dbChat.chat_name });
    }

    // If not in DB, search Baileys directly
    const match = await findGroupByName(name);

    if (match) {
      // Save to DB for future use
      const { data: chatToUpdate } = await supabase
        .from('chats')
        .select('id')
        .eq('is_group_chat', true)
        .ilike('chat_name', `%${name}%`)
        .limit(1)
        .single();

      if (chatToUpdate) {
        await supabase
          .from('chats')
          .update({ baileys_jid: match.jid })
          .eq('id', chatToUpdate.id);
      }

      return res.json({ success: true, source: 'baileys', jid: match.jid, chat_name: match.name });
    }

    res.status(404).json({ success: false, error: 'Group not found' });
  } catch (error) {
    console.error('[WhatsApp] Find group error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify which phone numbers are registered on WhatsApp
app.post('/whatsapp/verify-numbers', async (req, res) => {
  try {
    const { phones } = req.body;

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of phone numbers required' });
    }

    const results = await verifyWhatsAppNumbers(phones);
    res.json({ success: true, results });
  } catch (error) {
    console.error('[WhatsApp] Verify numbers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new WhatsApp group for introductions
app.post('/whatsapp/create-group', async (req, res) => {
  try {
    const { name, phones, contactIds } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Group name required' });
    }

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of phone numbers required' });
    }

    console.log(`[WhatsApp] Creating intro group "${name}" with phones:`, phones);

    // First verify all numbers are on WhatsApp
    const verifyResults = await verifyWhatsAppNumbers(phones);
    const validJids = verifyResults
      .filter(r => r.registered && r.jid)
      .map(r => r.jid);

    const invalidPhones = verifyResults
      .filter(r => !r.registered)
      .map(r => r.phone);

    if (validJids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'None of the provided phone numbers are registered on WhatsApp',
        invalidPhones,
      });
    }

    if (invalidPhones.length > 0) {
      console.log(`[WhatsApp] Warning: ${invalidPhones.length} numbers not on WhatsApp:`, invalidPhones);
    }

    // Create the group in WhatsApp
    const groupResult = await createGroup(name, validJids);
    console.log(`[WhatsApp] Group created with JID: ${groupResult.groupJid}`);

    // Create chat record in Supabase for robust linking
    let chatId = null;
    try {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          chat_name: name.trim(),
          is_group_chat: true,
          chat_type: 'whatsapp',
          category: 'group',
          baileys_jid: groupResult.groupJid,
          created_by: 'Baileys'
        })
        .select('id')
        .single();

      if (chatError) {
        console.error('[WhatsApp] Error creating chat record:', chatError);
      } else {
        chatId = newChat.id;
        console.log(`[WhatsApp] Chat record created with ID: ${chatId}`);

        // Create contact_chats records for each introducee
        if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
          const contactChatsRecords = contactIds.map(contactId => ({
            contact_id: contactId,
            chat_id: chatId
          }));

          const { error: linkError } = await supabase
            .from('contact_chats')
            .upsert(contactChatsRecords, { onConflict: 'contact_id,chat_id' });

          if (linkError) {
            console.error('[WhatsApp] Error linking contacts to chat:', linkError);
          } else {
            console.log(`[WhatsApp] Linked ${contactIds.length} contacts to chat`);
          }
        }
      }
    } catch (dbError) {
      console.error('[WhatsApp] Database error:', dbError);
      // Don't fail the whole request - group was created successfully
    }

    res.json({
      success: true,
      groupJid: groupResult.groupJid,
      groupName: groupResult.groupName,
      chatId: chatId, // New: return the chat UUID for linking to introduction
      participants: validJids.length,
      invalidPhones: invalidPhones.length > 0 ? invalidPhones : undefined,
    });
  } catch (error) {
    console.error('[WhatsApp] Create group error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ END WHATSAPP ============

// ============ NOTES CRUD ENDPOINTS ============

// List notes with filters
app.get('/notes', async (req, res) => {
  try {
    const { folder, type, search, linked_contact, linked_company, linked_deal, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('notes')
      .select(`
        *,
        notes_contacts(contact_id, contacts(contact_id, first_name, last_name, profile_image_url)),
        note_companies(company_id, companies(company_id, name)),
        note_deals(deal_id, deals(deal_id, opportunity))
      `)
      .is('deleted_at', null)
      .order('last_modified_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (folder) {
      query = query.ilike('folder_path', `${folder}%`);
    }
    if (type) {
      query = query.eq('note_type', type);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,markdown_content.ilike.%${search}%`);
    }
    if (linked_contact) {
      const { data: noteIds } = await supabase
        .from('notes_contacts')
        .select('note_id')
        .eq('contact_id', linked_contact);
      if (noteIds?.length) {
        query = query.in('note_id', noteIds.map(n => n.note_id));
      } else {
        return res.json({ success: true, notes: [], total: 0 });
      }
    }
    if (linked_company) {
      const { data: noteIds } = await supabase
        .from('note_companies')
        .select('note_id')
        .eq('company_id', linked_company);
      if (noteIds?.length) {
        query = query.in('note_id', noteIds.map(n => n.note_id));
      } else {
        return res.json({ success: true, notes: [], total: 0 });
      }
    }
    if (linked_deal) {
      const { data: noteIds } = await supabase
        .from('note_deals')
        .select('note_id')
        .eq('deal_id', linked_deal);
      if (noteIds?.length) {
        query = query.in('note_id', noteIds.map(n => n.note_id));
      } else {
        return res.json({ success: true, notes: [], total: 0 });
      }
    }

    const { data: notes, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, notes, total: count || notes?.length || 0 });
  } catch (error) {
    console.error('[Notes] List error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single note by ID
app.get('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: note, error } = await supabase
      .from('notes')
      .select(`
        *,
        notes_contacts(contact_id, contacts(contact_id, first_name, last_name, profile_image_url)),
        note_companies(company_id, companies(company_id, name)),
        note_deals(deal_id, deals(deal_id, opportunity))
      `)
      .eq('note_id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }
      throw error;
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('[Notes] Get error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new note
app.post('/notes', async (req, res) => {
  try {
    const { title, markdown_content, folder_path, note_type, contacts, companies, deals } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const file_name = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
    const crypto = await import('crypto');
    const content_hash = crypto.createHash('sha256').update(markdown_content || '').digest('hex');

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        title,
        markdown_content: markdown_content || '',
        text: markdown_content || '',
        folder_path: folder_path || 'Inbox',
        file_name,
        obsidian_path: `${folder_path || 'Inbox'}/${file_name}`,
        note_type: note_type || 'general',
        content_hash,
        sync_source: 'crm',
        created_by: 'User',
        last_modified_by: 'User',
        last_modified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    if (contacts?.length) {
      const links = contacts.map(contactId => ({ note_id: note.note_id, contact_id: contactId }));
      await supabase.from('notes_contacts').upsert(links, { onConflict: 'note_id,contact_id' });
    }
    if (companies?.length) {
      const links = companies.map(companyId => ({ note_id: note.note_id, company_id: companyId }));
      await supabase.from('note_companies').upsert(links, { onConflict: 'note_id,company_id' });
    }
    if (deals?.length) {
      const links = deals.map(dealId => ({ note_id: note.note_id, deal_id: dealId }));
      await supabase.from('note_deals').upsert(links, { onConflict: 'note_id,deal_id' });
    }

    console.log(`[Notes] Created note: ${note.note_id} - ${title}`);
    res.json({ success: true, note });
  } catch (error) {
    console.error('[Notes] Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update note
app.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, markdown_content, folder_path, note_type } = req.body;

    const updates = {
      last_modified_by: 'User',
      last_modified_at: new Date().toISOString(),
      sync_source: 'crm',
    };

    if (title !== undefined) {
      updates.title = title;
      updates.file_name = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
    }
    if (markdown_content !== undefined) {
      updates.markdown_content = markdown_content;
      updates.text = markdown_content;
      const crypto = await import('crypto');
      updates.content_hash = crypto.createHash('sha256').update(markdown_content).digest('hex');
    }
    if (folder_path !== undefined) updates.folder_path = folder_path;
    if (note_type !== undefined) updates.note_type = note_type;

    if (updates.file_name || updates.folder_path) {
      const { data: current } = await supabase.from('notes').select('folder_path, file_name').eq('note_id', id).single();
      const newFolder = updates.folder_path || current?.folder_path || 'Inbox';
      const newFile = updates.file_name || current?.file_name;
      updates.obsidian_path = `${newFolder}/${newFile}`;
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('note_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ success: false, error: 'Note not found' });
      throw error;
    }

    console.log(`[Notes] Updated note: ${id}`);
    res.json({ success: true, note });
  } catch (error) {
    console.error('[Notes] Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Soft delete note
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: note, error } = await supabase
      .from('notes')
      .update({ deleted_at: new Date().toISOString(), last_modified_by: 'User', last_modified_at: new Date().toISOString() })
      .eq('note_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ success: false, error: 'Note not found' });
      throw error;
    }

    console.log(`[Notes] Soft deleted note: ${id}`);
    res.json({ success: true, note });
  } catch (error) {
    console.error('[Notes] Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Link note to entities
app.post('/notes/:id/link', async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts, companies, deals } = req.body;
    const results = { contacts: 0, companies: 0, deals: 0 };

    if (contacts?.length) {
      const links = contacts.map(contactId => ({ note_id: id, contact_id: contactId }));
      const { error } = await supabase.from('notes_contacts').upsert(links, { onConflict: 'note_id,contact_id' });
      if (!error) results.contacts = contacts.length;
    }
    if (companies?.length) {
      const links = companies.map(companyId => ({ note_id: id, company_id: companyId }));
      const { error } = await supabase.from('note_companies').upsert(links, { onConflict: 'note_id,company_id' });
      if (!error) results.companies = companies.length;
    }
    if (deals?.length) {
      const links = deals.map(dealId => ({ note_id: id, deal_id: dealId }));
      const { error } = await supabase.from('note_deals').upsert(links, { onConflict: 'note_id,deal_id' });
      if (!error) results.deals = deals.length;
    }

    await supabase.from('notes').update({ last_modified_at: new Date().toISOString(), sync_source: 'crm' }).eq('note_id', id);

    console.log(`[Notes] Linked note ${id}: ${JSON.stringify(results)}`);
    res.json({ success: true, linked: results });
  } catch (error) {
    console.error('[Notes] Link error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unlink note from entities
app.delete('/notes/:id/link', async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts, companies, deals } = req.body;
    const results = { contacts: 0, companies: 0, deals: 0 };

    if (contacts?.length) {
      const { error } = await supabase.from('notes_contacts').delete().eq('note_id', id).in('contact_id', contacts);
      if (!error) results.contacts = contacts.length;
    }
    if (companies?.length) {
      const { error } = await supabase.from('note_companies').delete().eq('note_id', id).in('company_id', companies);
      if (!error) results.companies = companies.length;
    }
    if (deals?.length) {
      const { error } = await supabase.from('note_deals').delete().eq('note_id', id).in('deal_id', deals);
      if (!error) results.deals = deals.length;
    }

    await supabase.from('notes').update({ last_modified_at: new Date().toISOString(), sync_source: 'crm' }).eq('note_id', id);

    console.log(`[Notes] Unlinked note ${id}: ${JSON.stringify(results)}`);
    res.json({ success: true, unlinked: results });
  } catch (error) {
    console.error('[Notes] Unlink error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sync status
app.get('/notes/sync/status', async (req, res) => {
  try {
    const { data: lastSync, error } = await supabase
      .from('obsidian_sync_state')
      .select('*')
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    let githubConnected = false;
    if (process.env.GITHUB_TOKEN && process.env.OBSIDIAN_REPO) {
      try {
        const [owner, repo] = process.env.OBSIDIAN_REPO.split('/');
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });
        githubConnected = response.ok;
      } catch (e) { githubConnected = false; }
    }

    res.json({ success: true, lastSync: lastSync || null, githubConnected, obsidianRepo: process.env.OBSIDIAN_REPO || null });
  } catch (error) {
    console.error('[Notes] Sync status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger manual sync
app.post('/notes/sync', async (req, res) => {
  try {
    const { direction } = req.body;

    if (!process.env.GITHUB_TOKEN) {
      return res.status(400).json({ success: false, error: 'GitHub token not configured' });
    }

    const [owner, repo] = (process.env.OBSIDIAN_REPO || '').split('/');
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'OBSIDIAN_REPO not configured' });
    }

    const workflowFile = direction === 'from_github' ? 'sync-from-supabase.yml' : 'sync-to-supabase.yml';
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    console.log(`[Notes] Triggered sync workflow: ${workflowFile}`);
    res.json({ success: true, message: `Sync triggered: ${direction || 'both'}` });
  } catch (error) {
    console.error('[Notes] Sync trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ END NOTES ============

// ============ EVENING BRIEFING ============

// ============ TODAY PAGE ============
registerTodayRoutes(app);

app.post('/briefing/morning', async (req, res) => {
  try {
    const { date } = req.body || {};
    const result = await generateAndSendMorningBriefing(date || null);
    res.json(result);
  } catch (error) {
    console.error('[MorningBriefing] Endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/briefing/evening', async (req, res) => {
  try {
    const { date } = req.body || {};
    const result = await generateAndSendBriefing(date || null);
    res.json(result);
  } catch (error) {
    console.error('[Briefing] Endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Smart Add Contact — AI Agent Endpoint =====
app.post('/contact/smart-create', async (req, res) => {
  try {
    const { first_name, last_name, email, category, score, keep_in_touch, christmas, easter } = req.body;

    if (!first_name || !email || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields: first_name, email, category' });
    }

    console.log(`[SmartCreate] Starting for ${first_name} ${last_name} <${email}>`);

    // Respond early — we'll do the work and the frontend shows a toast
    // Actually, we need to return the quality report, so we wait.

    const emailDomain = email.split('@')[1]?.toLowerCase();
    const isFreeDomain = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'me.com', 'protonmail.com', 'mail.com'].includes(emailDomain);

    // Define tools for the agent
    const agentTools = [
      {
        name: 'search_crm_communications',
        description: 'Search ALL existing communications with a given email address. Searches command_center_inbox (staging), emails + email_participants (history), and interactions. Returns everything found.',
        input_schema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email address to search for' }
          },
          required: ['email']
        }
      },
      {
        name: 'enrich_contact_apollo',
        description: 'Call Apollo enrichment API to get professional data about a person: job title, company, LinkedIn URL, photo, city, phone numbers, description. The primary source for professional enrichment.',
        input_schema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' }
          },
          required: ['email']
        }
      },
      {
        name: 'fetch_webpage',
        description: 'Fetch a webpage URL and return its text content. Useful for reading company websites to get description/about, checking LinkedIn public profiles, or finding logo URLs. Returns first 5000 chars of text.',
        input_schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Full URL to fetch' }
          },
          required: ['url']
        }
      },
      {
        name: 'create_contact_record',
        description: 'Create the contact in Supabase with all gathered fields. Call this ONCE with all fields you have collected.',
        input_schema: {
          type: 'object',
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            category: { type: 'string' },
            score: { type: 'number', description: '1-5 or null' },
            job_role: { type: 'string' },
            linkedin: { type: 'string' },
            description: { type: 'string' },
            birthday: { type: 'string', description: 'YYYY-MM-DD format' },
            keep_in_touch: { type: 'string' },
            christmas: { type: 'string' },
            easter: { type: 'string' },
          },
          required: ['first_name', 'email', 'category']
        }
      },
      {
        name: 'find_or_create_company',
        description: 'Search for a company by domain or name. If found, updates any empty fields (website, description, linkedin) with provided data. If not found, creates a new company. Also links it to the contact. ALWAYS pass website, description, and linkedin even if the company already exists — empty fields will be filled.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string', description: 'Contact ID to link to' },
            domain: { type: 'string', description: 'Company domain (e.g. acme.com)' },
            name: { type: 'string', description: 'Company name' },
            website: { type: 'string' },
            description: { type: 'string' },
            linkedin: { type: 'string' },
            relationship: { type: 'string', description: 'employee, founder, advisor, manager, investor, other' },
          },
          required: ['contact_id']
        }
      },
      {
        name: 'add_contact_details',
        description: 'Add phone numbers, cities, and tags to a contact. Call after contact is created.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            phones: { type: 'array', items: { type: 'string' }, description: 'Phone numbers to add' },
            city: { type: 'string', description: 'City name to search and link' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tag names to search and link' },
          },
          required: ['contact_id']
        }
      },
      {
        name: 'create_contact_note',
        description: 'Create a contextual note for the contact. The note MUST be >500 characters. Follow the EXACT format of existing notes in the CRM.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            text: { type: 'string', description: 'Note body in markdown. MUST be >500 chars. Follow this EXACT structure:\n# First Last — Contact Notes\n\n## Overview\nFirst Last. Job Title at Company. Category: X · Score: X · Keep-in-touch: X. LinkedIn: url.\n\nTags: tag1, tag2\n\nCompanies:\n- **Company** — description...\n\n## Character & Relationship Dynamics\n(insights from communications)\n\n## Communication History\n(summary of email exchanges, topics discussed)' },
          },
          required: ['contact_id', 'first_name', 'last_name', 'text']
        }
      },
      {
        name: 'upload_contact_photo',
        description: 'Download a photo from a URL and re-upload it to Supabase Storage so it persists. ALWAYS use this instead of saving external URLs directly (LinkedIn CDN URLs expire). Returns the permanent public URL.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            image_url: { type: 'string', description: 'URL of the image to download and re-host' },
          },
          required: ['contact_id', 'image_url']
        }
      },
      {
        name: 'upload_company_logo',
        description: 'Download a company logo and upload to Supabase Storage. Try Clearbit first: https://logo.clearbit.com/{domain} (free, reliable). Falls back to any URL you provide. Creates attachment record + company_attachments link with is_logo=true.',
        input_schema: {
          type: 'object',
          properties: {
            company_id: { type: 'string' },
            logo_url: { type: 'string', description: 'URL of the logo. Try https://logo.clearbit.com/{domain} first.' },
            domain: { type: 'string', description: 'Company domain — used for Clearbit fallback if logo_url fails' },
          },
          required: ['company_id']
        }
      },
      {
        name: 'run_quality_check',
        description: 'Run the 5-dimension quality check on a contact. Returns the quality report with missing dimensions and details. Call this as the LAST step.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' }
          },
          required: ['contact_id']
        }
      },
      {
        name: 'brave_web_search',
        description: 'Search the web using Brave Search API. Returns titles, URLs, and descriptions. Use for finding company info, team pages, LinkedIn profiles, or any information you cannot get from Apollo alone.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query, e.g. "Nic Newman Emerge VC" or "bikenergy company about"' },
            count: { type: 'number', description: 'Number of results (default 5, max 20)' }
          },
          required: ['query']
        }
      },
      {
        name: 'brave_image_search',
        description: 'Search for images using Brave Image Search API. Use for finding profile photos (e.g. "Nic Newman Emerge VC photo") or company logos (e.g. "Emerge VC logo"). Returns image URLs you can then pass to upload_contact_photo or upload_company_logo.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Image search query' },
            count: { type: 'number', description: 'Number of results (default 5)' }
          },
          required: ['query']
        }
      },
      {
        name: 'add_company_tags',
        description: 'Search existing tags by name and link them to a company. Only links tags that already exist in the tags table (case-insensitive match). Use relevant tags like industry, sector, geography, etc.',
        input_schema: {
          type: 'object',
          properties: {
            company_id: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tag names to search and link, e.g. ["VC", "Fintech", "London"]' }
          },
          required: ['company_id', 'tags']
        }
      },
      {
        name: 'update_company',
        description: 'Update any field on a company record directly. Use when you discover more info about a company after initial creation, or to fix/complete fields.',
        input_schema: {
          type: 'object',
          properties: {
            company_id: { type: 'string' },
            name: { type: 'string' },
            website: { type: 'string' },
            description: { type: 'string' },
            linkedin: { type: 'string' },
            category: { type: 'string', description: 'One of: Professional Investor, Startup, Corporation, SME, Corporate, Advisory, Institution, Media, Skip, Inbox, Not Set, Hold' }
          },
          required: ['company_id']
        }
      }
    ];

    // Tool handlers
    const handleTool = async (toolName, input) => {
      switch (toolName) {
        case 'search_crm_communications': {
          const emailLower = input.email.toLowerCase();
          // Search inbox staging
          const { data: inbox } = await supabase
            .from('command_center_inbox')
            .select('id, type, from_email, from_name, subject, snippet, body_text, date, direction')
            .or(`from_email.ilike.${emailLower},to_recipients.cs.[{"email":"${emailLower}"}],cc_recipients.cs.[{"email":"${emailLower}"}]`)
            .order('date', { ascending: false })
            .limit(20);

          // Search email history
          const { data: participants } = await supabase
            .from('email_participants')
            .select('email_id, participant_type, emails(email_id, subject, body_text, date, direction, email_threads(subject))')
            .ilike('email', emailLower)
            .limit(20);

          // Search interactions
          const { data: contactEmails } = await supabase
            .from('contact_emails')
            .select('contact_id')
            .ilike('email', emailLower)
            .limit(1);

          let interactions = [];
          if (contactEmails?.[0]?.contact_id) {
            const { data: ints } = await supabase
              .from('interactions')
              .select('interaction_type, direction, interaction_date, summary')
              .eq('contact_id', contactEmails[0].contact_id)
              .order('interaction_date', { ascending: false })
              .limit(20);
            interactions = ints || [];
          }

          return JSON.stringify({
            inbox_messages: inbox || [],
            email_history: (participants || []).map(p => ({
              subject: p.emails?.subject || p.emails?.email_threads?.subject,
              date: p.emails?.date,
              direction: p.emails?.direction,
              body_preview: (p.emails?.body_text || '').substring(0, 300),
              role: p.participant_type,
            })),
            interactions,
          });
        }

        case 'enrich_contact_apollo': {
          try {
            const apolloResponse = await fetch(
              `${CRM_AGENT_URL}/suggest-contact-profile`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from_email: input.email,
                  from_name: `${input.first_name || ''} ${input.last_name || ''}`.trim(),
                }),
              }
            );
            const apolloData = await apolloResponse.json();
            return JSON.stringify(apolloData);
          } catch (err) {
            return JSON.stringify({ error: err.message });
          }
        }

        case 'fetch_webpage': {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const resp = await fetch(input.url, {
              signal: controller.signal,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM-Agent/1.0)' },
            });
            clearTimeout(timeout);
            const html = await resp.text();
            // Strip HTML tags, return text only
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 5000);
            return JSON.stringify({ url: input.url, text });
          } catch (err) {
            return JSON.stringify({ error: err.message });
          }
        }

        case 'create_contact_record': {
          // Create contact
          const contactData = {
            first_name: input.first_name,
            last_name: input.last_name || null,
            category: input.category,
            score: input.score || null,
            job_role: input.job_role || null,
            linkedin: input.linkedin || null,
            description: input.description || null,
            birthday: input.birthday || null,
            show_missing: true,
            created_by: 'LLM',
          };

          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .insert(contactData)
            .select()
            .single();

          if (contactError) return JSON.stringify({ error: contactError.message });

          // Add email
          await supabase.from('contact_emails').insert({
            contact_id: contact.contact_id,
            email: input.email.toLowerCase(),
            is_primary: true,
          });

          // Add KIT
          await supabase.from('keep_in_touch').insert({
            contact_id: contact.contact_id,
            frequency: input.keep_in_touch || 'Not Set',
            christmas: input.christmas || 'no wishes set',
            easter: input.easter || 'no wishes set',
          });

          return JSON.stringify({ contact_id: contact.contact_id, ...contact });
        }

        case 'find_or_create_company': {
          let companyId = null;
          let companyName = null;

          // Search by domain first
          if (input.domain) {
            const { data: domainMatch } = await supabase
              .from('company_domains')
              .select('company_id, companies(company_id, name)')
              .ilike('domain', input.domain)
              .limit(1)
              .maybeSingle();

            if (domainMatch?.companies) {
              companyId = domainMatch.companies.company_id;
              companyName = domainMatch.companies.name;
            }
          }

          // Search by name if no domain match
          if (!companyId && input.name) {
            const { data: nameMatch } = await supabase
              .from('companies')
              .select('company_id, name')
              .ilike('name', input.name)
              .limit(1)
              .maybeSingle();

            if (nameMatch) {
              companyId = nameMatch.company_id;
              companyName = nameMatch.name;
            }
          }

          // Update existing company's empty fields with new data
          if (companyId) {
            const updates = {};
            if (input.website) updates.website = input.website;
            if (input.description) updates.description = input.description;
            if (input.linkedin) updates.linkedin = input.linkedin;
            if (Object.keys(updates).length > 0) {
              // Only update fields that are currently empty
              const { data: existing } = await supabase.from('companies').select('website, description, linkedin').eq('company_id', companyId).single();
              const finalUpdates = {};
              if (!existing?.website && updates.website) finalUpdates.website = updates.website;
              if (!existing?.description && updates.description) finalUpdates.description = updates.description;
              if (!existing?.linkedin && updates.linkedin) finalUpdates.linkedin = updates.linkedin;
              if (Object.keys(finalUpdates).length > 0) {
                await supabase.from('companies').update(finalUpdates).eq('company_id', companyId);
              }
            }
          }

          // Create company if not found
          if (!companyId && (input.name || input.domain)) {
            const newCompany = {
              name: input.name || input.domain,
              website: input.website || (input.domain ? `https://${input.domain}` : null),
              description: input.description || null,
              linkedin: input.linkedin || null,
              category: 'Inbox',
              created_by: 'LLM',
            };

            const { data: created, error: companyError } = await supabase
              .from('companies')
              .insert(newCompany)
              .select()
              .single();

            if (companyError) return JSON.stringify({ error: companyError.message });
            companyId = created.company_id;
            companyName = created.name;

            // Add domain
            if (input.domain) {
              await supabase.from('company_domains').insert({
                company_id: companyId,
                domain: input.domain.toLowerCase(),
                is_primary: true,
              });
            }
          }

          // Link to contact
          if (companyId && input.contact_id) {
            await supabase.from('contact_companies').insert({
              contact_id: input.contact_id,
              company_id: companyId,
              relationship: input.relationship || 'not_set',
              is_primary: true,
            });
          }

          return JSON.stringify({ company_id: companyId, name: companyName, created: !companyName });
        }

        case 'add_contact_details': {
          const results = { phones: 0, city: null, tags: 0 };

          // Phones
          if (input.phones?.length) {
            for (const phone of input.phones) {
              await supabase.from('contact_mobiles').insert({
                contact_id: input.contact_id,
                mobile: phone,
                is_primary: results.phones === 0,
              });
              results.phones++;
            }
          }

          // City
          if (input.city) {
            const { data: cityMatch } = await supabase
              .from('cities')
              .select('city_id, name')
              .ilike('name', `%${input.city}%`)
              .limit(1)
              .maybeSingle();

            let cityId = cityMatch?.city_id;
            if (!cityId) {
              const { data: newCity } = await supabase
                .from('cities')
                .insert({ name: input.city })
                .select()
                .single();
              cityId = newCity?.city_id;
            }
            if (cityId) {
              await supabase.from('contact_cities').insert({
                contact_id: input.contact_id,
                city_id: cityId,
              });
              results.city = input.city;
            }
          }

          // Tags
          if (input.tags?.length) {
            for (const tagName of input.tags) {
              const { data: tagMatch } = await supabase
                .from('tags')
                .select('tag_id, name')
                .ilike('name', tagName)
                .limit(1)
                .maybeSingle();

              if (tagMatch) {
                await supabase.from('contact_tags').insert({
                  contact_id: input.contact_id,
                  tag_id: tagMatch.tag_id,
                });
                results.tags++;
              }
            }
          }

          return JSON.stringify(results);
        }

        case 'create_contact_note': {
          if (!input.text || input.text.length < 500) {
            return JSON.stringify({ error: `Note must be >500 chars. Current: ${(input.text || '').length} chars. Please write a more detailed note.` });
          }

          const noteTitle = `${input.first_name} ${input.last_name || ''} — Contact Notes`.replace(/\s+/g, ' ').trim();
          const { data: note, error: noteError } = await supabase
            .from('notes')
            .insert({
              title: noteTitle,
              text: input.text,
              note_type: 'general',
              obsidian_path: `Inbox/${noteTitle}.md`,
              created_by: 'LLM',
            })
            .select()
            .single();

          if (noteError) return JSON.stringify({ error: noteError.message });

          await supabase.from('notes_contacts').insert({
            note_id: note.note_id,
            contact_id: input.contact_id,
          });

          return JSON.stringify({ note_id: note.note_id, chars: input.text.length });
        }

        case 'upload_contact_photo': {
          // Helper to download, upload to storage, and update contact
          const uploadPhoto = async (url, source) => {
            const ctrl = new AbortController();
            const tm = setTimeout(() => ctrl.abort(), 15000);
            const imgResp = await fetch(url, {
              signal: ctrl.signal,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM-Agent/1.0)' },
              redirect: 'follow',
            });
            clearTimeout(tm);
            if (!imgResp.ok) throw new Error(`${source}: HTTP ${imgResp.status}`);
            const ct = imgResp.headers.get('content-type') || 'image/jpeg';
            if (!ct.startsWith('image/')) throw new Error(`${source}: not an image (${ct})`);
            const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
            const buffer = Buffer.from(await imgResp.arrayBuffer());
            if (buffer.length < 1000) throw new Error(`${source}: image too small (${buffer.length} bytes)`);
            const filePath = `profile-images/${input.contact_id}_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, buffer, { contentType: ct, cacheControl: '3600', upsert: true });
            if (upErr) throw new Error(`Storage: ${upErr.message}`);
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await supabase.from('contacts').update({ profile_image_url: publicUrl }).eq('contact_id', input.contact_id);
            return { success: true, url: publicUrl, source };
          };

          // Try sources in order
          const errors = [];

          // 1. Provided URL
          if (input.image_url) {
            try { return JSON.stringify(await uploadPhoto(input.image_url, 'provided_url')); } catch (e) { errors.push(e.message); }
          }

          // 2. Gravatar (SHA256 of email)
          try {
            const { data: ce } = await supabase.from('contact_emails').select('email').eq('contact_id', input.contact_id).limit(1).maybeSingle();
            if (ce?.email) {
              const hash = createHash('sha256').update(ce.email.trim().toLowerCase()).digest('hex');
              const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=400`;
              try { return JSON.stringify(await uploadPhoto(gravatarUrl, 'gravatar')); } catch (e) { errors.push(e.message); }
            }
          } catch (e) { errors.push(`Gravatar lookup: ${e.message}`); }

          return JSON.stringify({ error: `All photo sources failed: ${errors.join('; ')}. Do NOT search the web for photos — you cannot verify identity. Leave photo empty.` });
        }

        case 'upload_company_logo': {
          // Helper to download logo, upload to storage, create attachment + link
          const saveLogo = async (url, source) => {
            const ctrl = new AbortController();
            const tm = setTimeout(() => ctrl.abort(), 15000);
            const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM-Agent/1.0)' }, redirect: 'follow' });
            clearTimeout(tm);
            if (!resp.ok) throw new Error(`${source}: HTTP ${resp.status}`);
            const ct = resp.headers.get('content-type') || 'image/png';
            if (!ct.startsWith('image/')) throw new Error(`${source}: not an image (${ct})`);
            const buffer = Buffer.from(await resp.arrayBuffer());
            if (buffer.length < 5000) throw new Error(`${source}: too small (${buffer.length} bytes, need >5KB for a real logo)`);
            const ext = ct.includes('svg') ? 'svg' : ct.includes('png') ? 'png' : 'jpg';
            const filePath = `company_logos/${input.company_id}_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('attachments').upload(filePath, buffer, { contentType: ct, upsert: false });
            if (upErr) throw new Error(`Storage: ${upErr.message}`);
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
            const { data: att } = await supabase.from('attachments').insert({
              file_name: `${input.company_id}_logo.${ext}`, file_url: filePath, file_type: ct, permanent_url: publicUrl,
            }).select().single();
            await supabase.from('company_attachments').delete().eq('company_id', input.company_id).eq('is_logo', true);
            await supabase.from('company_attachments').insert({ company_id: input.company_id, attachment_id: att.attachment_id, is_logo: true });
            return { success: true, url: publicUrl, source };
          };

          const errors = [];
          const domain = input.domain;

          // 1. Provided URL
          if (input.logo_url) {
            try { return JSON.stringify(await saveLogo(input.logo_url, 'provided_url')); } catch (e) { errors.push(e.message); }
          }

          // 2. Clearbit
          if (domain) {
            try { return JSON.stringify(await saveLogo(`https://logo.clearbit.com/${domain}`, 'clearbit')); } catch (e) { errors.push(e.message); }
          }

          // 3. Brandfetch
          if (domain) {
            try { return JSON.stringify(await saveLogo(`https://cdn.brandfetch.io/${domain}/w/400/h/400?c=1id_MlnKYTT`, 'brandfetch')); } catch (e) { errors.push(e.message); }
          }

          return JSON.stringify({ error: `All logo sources failed: ${errors.join('; ')}. Do NOT search the web for logos — results mix people's faces with logos. Leave logo empty.` });
        }

        case 'run_quality_check': {
          const contactId = input.contact_id;
          const missing = [];
          const details = {};

          // 1. Completeness
          const { data: cc } = await supabase
            .from('contact_completeness')
            .select('*')
            .eq('contact_id', contactId)
            .maybeSingle();

          if (!cc || cc.completeness_score < 100) {
            missing.push('completeness');
            const missingFields = [];
            if (!cc?.category || ['Not Set', 'Inbox'].includes(cc?.category)) missingFields.push('category');
            if (!cc?.score) missingFields.push('score');
            if (!cc?.description) missingFields.push('description');
            if (!cc?.job_role) missingFields.push('job_role');
            if (!cc?.linkedin) missingFields.push('linkedin');
            if (!cc?.birthday) missingFields.push('birthday');
            if (!cc?.keep_in_touch_frequency || cc?.keep_in_touch_frequency === 'Not Set') missingFields.push('keep_in_touch');
            if (cc?.email_count === 0) missingFields.push('email');
            if (cc?.mobile_count === 0) missingFields.push('mobile');
            if (cc?.city_count === 0) missingFields.push('city');
            if (cc?.tag_count === 0) missingFields.push('tags');
            details.completeness = { score: cc?.completeness_score || 0, missing_fields: missingFields };
          }

          // 2. Photo
          const { data: contactPhoto } = await supabase
            .from('contacts')
            .select('profile_image_url')
            .eq('contact_id', contactId)
            .maybeSingle();
          if (!contactPhoto?.profile_image_url) {
            missing.push('photo');
            details.photo = true;
          }

          // 3. Note (>500 chars)
          const { data: notes } = await supabase
            .from('notes_contacts')
            .select('notes(note_id, text, deleted_at)')
            .eq('contact_id', contactId);
          const hasGoodNote = (notes || []).some(n => n.notes && !n.notes.deleted_at && (n.notes.text || '').length > 500);
          if (!hasGoodNote) {
            missing.push('note');
            details.note = true;
          }

          // 4. Company linked
          const { data: companies } = await supabase
            .from('contact_companies')
            .select('company_id, relationship')
            .eq('contact_id', contactId)
            .neq('relationship', 'suggestion');
          if (!companies?.length) {
            missing.push('company');
            details.company = true;
            missing.push('company_complete');
            details.company_complete = true;
          } else {
            // 5. Company complete
            const companyId = companies[0].company_id;
            const { data: compComp } = await supabase
              .from('company_completeness')
              .select('*')
              .eq('company_id', companyId)
              .maybeSingle();
            if (!compComp || compComp.completeness_score < 100) {
              missing.push('company_complete');
              const compMissing = [];
              if (!compComp?.website) compMissing.push('website');
              if (!compComp?.description) compMissing.push('description');
              if (!compComp?.linkedin) compMissing.push('linkedin');
              if (compComp?.domain_count === 0) compMissing.push('domains');
              if (compComp?.tag_count === 0) compMissing.push('tags');
              if (!compComp?.has_logo) compMissing.push('logo');
              details.company_complete = {
                company_name: compComp?.name || 'Unknown',
                score: compComp?.completeness_score || 0,
                missing_fields: compMissing,
              };
            }
          }

          // Determine bucket
          let bucket = 'c';
          if (missing.includes('completeness')) {
            const mf = details.completeness?.missing_fields || [];
            if (mf.includes('category') || mf.includes('score') || mf.includes('keep_in_touch')) {
              bucket = 'b';
            }
          }

          // Upsert into contacts_clarissa_processing (if there are gaps)
          if (missing.length > 0) {
            await supabase
              .from('contacts_clarissa_processing')
              .upsert({
                contact_id: contactId,
                bucket,
                missing_dimensions: missing,
                missing_details: details,
                checked_at: new Date().toISOString(),
                resolved_at: null,
              }, { onConflict: 'contact_id' });
          }

          return JSON.stringify({
            dimensions_total: 5,
            dimensions_complete: 5 - missing.length,
            missing_dimensions: missing,
            missing_details: details,
            bucket: missing.length > 0 ? bucket : 'a',
          });
        }

        case 'brave_web_search': {
          const braveKey = process.env.BRAVE_SEARCH_API_KEY;
          if (!braveKey) return JSON.stringify({ error: 'BRAVE_SEARCH_API_KEY not configured' });
          try {
            const count = Math.min(input.count || 5, 20);
            const resp = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(input.query)}&count=${count}`, {
              headers: { 'X-Subscription-Token': braveKey, 'Accept': 'application/json' },
            });
            if (!resp.ok) return JSON.stringify({ error: `Brave search failed: ${resp.status}` });
            const data = await resp.json();
            const results = (data.web?.results || []).map(r => ({
              title: r.title, url: r.url, description: r.description,
            }));
            return JSON.stringify({ query: input.query, results });
          } catch (err) {
            return JSON.stringify({ error: err.message });
          }
        }

        case 'brave_image_search': {
          const braveKey = process.env.BRAVE_SEARCH_API_KEY;
          if (!braveKey) return JSON.stringify({ error: 'BRAVE_SEARCH_API_KEY not configured' });
          try {
            const count = Math.min(input.count || 5, 20);
            const resp = await fetch(`https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(input.query)}&count=${count}`, {
              headers: { 'X-Subscription-Token': braveKey, 'Accept': 'application/json' },
            });
            if (!resp.ok) return JSON.stringify({ error: `Brave image search failed: ${resp.status}` });
            const data = await resp.json();
            const results = (data.results || []).map(r => ({
              title: r.title, url: r.properties?.url || r.url, thumbnail: r.thumbnail?.src,
              width: r.properties?.width, height: r.properties?.height,
            }));
            return JSON.stringify({ query: input.query, results });
          } catch (err) {
            return JSON.stringify({ error: err.message });
          }
        }

        case 'add_company_tags': {
          let linked = 0;
          for (const tagName of input.tags) {
            const { data: tagMatch } = await supabase
              .from('tags')
              .select('tag_id, name')
              .ilike('name', tagName)
              .limit(1)
              .maybeSingle();
            if (tagMatch) {
              const { error } = await supabase.from('company_tags').insert({
                company_id: input.company_id,
                tag_id: tagMatch.tag_id,
              });
              if (!error) linked++;
            }
          }
          return JSON.stringify({ linked, total_requested: input.tags.length });
        }

        case 'update_company': {
          const updates = {};
          if (input.name) updates.name = input.name;
          if (input.website) updates.website = input.website;
          if (input.description) updates.description = input.description;
          if (input.linkedin) updates.linkedin = input.linkedin;
          if (input.category) updates.category = input.category;
          if (Object.keys(updates).length === 0) return JSON.stringify({ error: 'No fields to update' });
          const { error } = await supabase.from('companies').update(updates).eq('company_id', input.company_id);
          if (error) return JSON.stringify({ error: error.message });
          return JSON.stringify({ success: true, updated_fields: Object.keys(updates) });
        }

        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    };

    // System prompt for the agent
    const systemPrompt = `You are an autonomous CRM analyst agent. You receive minimal input from the user (category, score, KIT preferences) and an email address. Your job is to create a COMPLETE contact profile achieving 100% on all 5 quality dimensions:

1. COMPLETENESS — all contact fields filled (job_role, linkedin, description, birthday, city, tags, phones, etc.)
2. PHOTO — profile_image_url must be set (downloaded and re-uploaded to our storage)
3. NOTE — a contextual note >500 chars about who this person is and the relationship
4. COMPANY — a company must be linked (not suggestion relationship)
5. COMPANY_COMPLETE — the linked company must have website, description, linkedin, domains, tags, logo

You have 14 tools. USE THEM ALL as needed:
- search_crm_communications: search existing emails/communications with this person
- enrich_contact_apollo: get professional data from Apollo (job, company, LinkedIn, photo, city, phone)
- brave_web_search: search the web for ANY information (company pages, LinkedIn profiles, bios, team pages)
- brave_image_search: search for profile photos or company logos by name
- fetch_webpage: fetch and read any URL (company websites, team pages, about pages)
- create_contact_record: create the contact in the CRM
- upload_contact_photo: download a photo URL and re-upload to our storage. Tries Gravatar as fallback. ONLY use the photo URL from Apollo enrichment or Gravatar. Do NOT use brave_image_search for profile photos — you cannot verify the person's identity and will upload the wrong person.
- find_or_create_company: find or create company, link to contact. Always pass website, description, linkedin.
- upload_company_logo: download logo and store. Tries Clearbit → Brandfetch automatically. If all fail, leave empty — do NOT use brave_image_search for logos because you will upload a person's face instead of a logo.
- add_contact_details: add phones, city, tags to the contact
- add_company_tags: add tags to the company (searches existing tags by name)
- update_company: update any company field (description, website, linkedin, category, name)
- create_contact_note: create contextual note (>500 chars, auto-titled "First Last — Contact Notes")
- run_quality_check: check 5 dimensions, report gaps

WORKFLOW:
1. search_crm_communications — find all existing communications
2. enrich_contact_apollo — get professional data
3. brave_web_search — search for more info if Apollo is incomplete (e.g. "${first_name} ${last_name || ''} ${emailDomain}")
4. fetch_webpage — read the company website for description, team info
5. create_contact_record — create contact with ALL gathered fields
6. upload_contact_photo — ONLY use the photo URL from Apollo enrichment. If Apollo has no photo or it fails to download, skip. Do NOT search for photos on the web — you will get the wrong person.
7. find_or_create_company — pass website, description, linkedin. Use info from web/Apollo.
8. upload_company_logo — auto-tries Clearbit/Brandfetch. If both fail, skip. Do NOT use brave_image_search for logos — web image results mix people's faces with logos and you will upload the wrong image.
9. add_contact_details — phones, city, tags from Apollo/web
10. add_company_tags — add relevant tags to the company (industry, sector, etc.)
11. update_company — fill any remaining empty company fields
12. create_contact_note — detailed note with this EXACT markdown structure:
    # First Last — Contact Notes
    ## Overview
    First Last. Job Title at Company. Category: X · Score: X · Keep-in-touch: X. LinkedIn: url.
    Tags: tag1, tag2
    Companies:
    - **Company** — description...
    ## Character & Relationship Dynamics
    (insights from communications and web research)
    ## Communication History
    (summary of email exchanges, topics discussed)
13. run_quality_check — check dimensions. If ANY are missing, FIX THEM:
    - Missing photo? → ONLY retry with Apollo URL. Do NOT search the web for photos.
    - Missing logo? → ONLY retry Clearbit/Brandfetch. Do NOT search the web for logos.
    - Missing company tags? → add_company_tags
    - Missing company fields? → update_company / brave_web_search for info
    Then run_quality_check again.

CRITICAL RULES:
- Your goal is 5/5 dimensions. NEVER accept failures silently.
- If a tool fails for company info (tags, description, etc.), try brave_web_search.
- NEVER save external URLs directly as profile_image_url — always download and re-upload.
- brave_web_search is great for finding TEXT information (descriptions, job titles, company details).
- brave_image_search should ONLY be used for research, NEVER to get URLs for upload_contact_photo or upload_company_logo. You CANNOT verify identity from web image search and WILL upload the wrong person/image.
- It is BETTER to leave photo/logo empty than to upload the wrong person's face or a random image.
- The email domain "${emailDomain}" ${isFreeDomain ? 'is a free provider — company info may need to come from Apollo, web search, or communications context' : 'is a company domain — fetch the website for info'}.

User-provided inputs (use these exactly, do not override):
- first_name: ${first_name}
- last_name: ${last_name || '(not provided)'}
- email: ${email}
- category: ${category}
- score: ${score || '(not set)'}
- keep_in_touch: ${keep_in_touch || 'Not Set'}
- christmas: ${christmas || 'no wishes set'}
- easter: ${easter || 'no wishes set'}`;

    // Run agentic loop
    const messages = [{ role: 'user', content: `Create a complete profile for ${first_name} ${last_name || ''} <${email}>. Category: ${category}. Go.` }];

    const requestParams = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: agentTools,
    };

    let response = await anthropic.messages.create(requestParams);
    let loopCount = 0;
    const maxLoops = 25;
    let qualityReport = null;

    while (response.stop_reason === 'tool_use' && loopCount < maxLoops) {
      loopCount++;
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        console.log(`[SmartCreate] Tool ${loopCount}: ${toolUse.name}`);
        try {
          const result = await handleTool(toolUse.name, toolUse.input);
          // Capture quality report from final tool
          if (toolUse.name === 'run_quality_check') {
            try { qualityReport = JSON.parse(result); } catch {}
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
        } catch (toolError) {
          console.error(`[SmartCreate] Tool error (${toolUse.name}):`, toolError.message);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${toolError.message}`,
            is_error: true,
          });
        }
      }

      requestParams.messages.push({ role: 'assistant', content: response.content });
      requestParams.messages.push({ role: 'user', content: toolResults });
      response = await anthropic.messages.create(requestParams);
    }

    console.log(`[SmartCreate] Done in ${loopCount} tool loops. Quality: ${qualityReport?.dimensions_complete || '?'}/5`);

    res.json({
      success: true,
      quality_report: qualityReport || { missing_dimensions: [], dimensions_complete: 0 },
    });

  } catch (error) {
    console.error('[SmartCreate] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Smart Enrich Contact — Targeted AI Enrichment =====
// Reads what's missing from clarissa, then fixes ONLY those dimensions
import {
  runQualityCheck,
  enrichWithApollo,
  searchCrmCommunications,
  fetchWebpage,
  updateContactFields,
  findOrCreateCompany,
  addContactDetails,
  createContactNote,
  uploadContactPhoto,
  uploadCompanyLogo,
  addCompanyTags,
  updateCompany,
  braveWebSearch,
  loadContactData,
} from './enrichment-tools.js';

app.post('/contact/smart-enrich', async (req, res) => {
  try {
    const { contact_id, dimensions: requestedDimensions } = req.body;
    if (!contact_id) {
      return res.status(400).json({ success: false, error: 'Missing contact_id' });
    }

    console.log(`[SmartEnrich] Starting for ${contact_id}`);

    // 1. Load existing contact data
    const contactData = await loadContactData(contact_id);
    if (!contactData) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const { first_name, last_name, primaryEmail } = contactData;
    console.log(`[SmartEnrich] Contact: ${first_name} ${last_name || ''} <${primaryEmail || 'no email'}>`);

    // 2. Check clarissa — if not scanned yet, scan first
    let { data: clarissa } = await supabase
      .from('contacts_clarissa_processing')
      .select('*')
      .eq('contact_id', contact_id)
      .maybeSingle();

    if (!clarissa) {
      console.log(`[SmartEnrich] Not in clarissa, running quality scan...`);
      const scanResult = await runQualityCheck(contact_id);
      if (scanResult.dimensions_complete === 5) {
        return res.json({ success: true, quality_report: scanResult, message: 'Already complete (5/5)' });
      }
      // Re-read after scan
      const { data: freshClarissa } = await supabase
        .from('contacts_clarissa_processing')
        .select('*')
        .eq('contact_id', contact_id)
        .maybeSingle();
      clarissa = freshClarissa;
    }

    if (!clarissa || !clarissa.missing_dimensions?.length) {
      return res.json({ success: true, quality_report: { dimensions_complete: 5 }, message: 'Nothing to fix' });
    }

    // If caller requested specific dimensions, filter to those; otherwise use all from clarissa
    const allMissing = clarissa.missing_dimensions;
    const missingDimensions = requestedDimensions?.length
      ? allMissing.filter(d => requestedDimensions.includes(d))
      : allMissing;
    const missingDetails = clarissa.missing_details || {};
    console.log(`[SmartEnrich] Missing: ${missingDimensions.join(', ')}${requestedDimensions ? ` (requested: ${requestedDimensions.join(', ')})` : ''}`);

    // 3. Determine which tools the agent needs based on what's missing
    const needsCompleteness = missingDimensions.includes('completeness');
    const needsPhoto = missingDimensions.includes('photo');
    const needsNote = missingDimensions.includes('note');
    const needsCompany = missingDimensions.includes('company');
    const needsCompanyComplete = missingDimensions.includes('company_complete');
    const needsResearch = needsCompleteness || needsCompany || needsCompanyComplete;

    // 4. Build tool set — only what's needed
    const agentTools = [];
    const toolHandlers = {};

    // Always include quality check
    agentTools.push({
      name: 'run_quality_check',
      description: 'Run the 5-dimension quality check. Call as the LAST step to verify fixes.',
      input_schema: { type: 'object', properties: { contact_id: { type: 'string' } }, required: ['contact_id'] }
    });
    toolHandlers['run_quality_check'] = async (input) => JSON.stringify(await runQualityCheck(input.contact_id));

    // Research tools (if needed for completeness/company)
    if (needsResearch) {
      if (primaryEmail) {
        agentTools.push({
          name: 'search_crm_communications',
          description: 'Search existing communications with this email. Returns inbox messages, email history, interactions.',
          input_schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] }
        });
        toolHandlers['search_crm_communications'] = async (input) => JSON.stringify(await searchCrmCommunications(input.email));

        agentTools.push({
          name: 'enrich_contact_apollo',
          description: 'Call Apollo enrichment API for professional data: job title, company, LinkedIn, photo, city, phones, description.',
          input_schema: { type: 'object', properties: { email: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' } }, required: ['email'] }
        });
        toolHandlers['enrich_contact_apollo'] = async (input) => JSON.stringify(await enrichWithApollo(input.email, input.first_name, input.last_name));
      }

      agentTools.push({
        name: 'brave_web_search',
        description: 'Search the web. Use for finding company info, LinkedIn profiles, bios.',
        input_schema: { type: 'object', properties: { query: { type: 'string' }, count: { type: 'number' } }, required: ['query'] }
      });
      toolHandlers['brave_web_search'] = async (input) => JSON.stringify(await braveWebSearch(input.query, input.count));

      agentTools.push({
        name: 'fetch_webpage',
        description: 'Fetch a URL and return text content (first 5000 chars).',
        input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
      });
      toolHandlers['fetch_webpage'] = async (input) => JSON.stringify(await fetchWebpage(input.url));
    }

    // Completeness tools
    if (needsCompleteness) {
      agentTools.push({
        name: 'update_contact_fields',
        description: 'Update contact fields. ONLY updates fields that are currently NULL/empty — will NOT overwrite existing values. Safe to call with all gathered data.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            last_name: { type: 'string' },
            job_role: { type: 'string' },
            linkedin: { type: 'string' },
            description: { type: 'string' },
            birthday: { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['contact_id']
        }
      });
      toolHandlers['update_contact_fields'] = async (input) => {
        const { contact_id: cid, ...fields } = input;
        return JSON.stringify(await updateContactFields(cid, fields));
      };

      agentTools.push({
        name: 'add_contact_details',
        description: 'Add phones, city, tags. Skips duplicates automatically.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            phones: { type: 'array', items: { type: 'string' } },
            city: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['contact_id']
        }
      });
      toolHandlers['add_contact_details'] = async (input) => {
        const { contact_id: cid, ...details } = input;
        return JSON.stringify(await addContactDetails(cid, details));
      };
    }

    // Photo tool
    if (needsPhoto) {
      agentTools.push({
        name: 'upload_contact_photo',
        description: 'Download photo and re-upload to storage. Tries Gravatar as fallback. ONLY use Apollo photo URL or Gravatar.',
        input_schema: {
          type: 'object',
          properties: { contact_id: { type: 'string' }, image_url: { type: 'string' } },
          required: ['contact_id', 'image_url']
        }
      });
      toolHandlers['upload_contact_photo'] = async (input) => JSON.stringify(await uploadContactPhoto(input.contact_id, input.image_url));
    }

    // Note tool
    if (needsNote) {
      agentTools.push({
        name: 'create_contact_note',
        description: 'Create a contextual note (>500 chars). Auto-titled "First Last — Contact Notes".',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            text: { type: 'string', description: 'Markdown note >500 chars.' },
          },
          required: ['contact_id', 'first_name', 'last_name', 'text']
        }
      });
      toolHandlers['create_contact_note'] = async (input) => JSON.stringify(await createContactNote(input.contact_id, { firstName: input.first_name, lastName: input.last_name, text: input.text }));
    }

    // Company tools
    if (needsCompany) {
      agentTools.push({
        name: 'find_or_create_company',
        description: 'Find existing company by domain/name or create new one. Links to contact. Pass website, description, linkedin.',
        input_schema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string' },
            domain: { type: 'string' },
            name: { type: 'string' },
            website: { type: 'string' },
            description: { type: 'string' },
            linkedin: { type: 'string' },
            relationship: { type: 'string' },
          },
          required: ['contact_id']
        }
      });
      toolHandlers['find_or_create_company'] = async (input) => {
        const { contact_id: cid, ...rest } = input;
        return JSON.stringify(await findOrCreateCompany(cid, rest));
      };
    }

    // Company complete tools
    if (needsCompanyComplete) {
      if (!toolHandlers['find_or_create_company']) {
        // Also need company tools even if company exists (to update it)
        agentTools.push({
          name: 'find_or_create_company',
          description: 'Find company by domain/name. Updates empty fields on existing company.',
          input_schema: {
            type: 'object',
            properties: { contact_id: { type: 'string' }, domain: { type: 'string' }, name: { type: 'string' }, website: { type: 'string' }, description: { type: 'string' }, linkedin: { type: 'string' }, relationship: { type: 'string' } },
            required: ['contact_id']
          }
        });
        toolHandlers['find_or_create_company'] = async (input) => {
          const { contact_id: cid, ...rest } = input;
          return JSON.stringify(await findOrCreateCompany(cid, rest));
        };
      }

      agentTools.push({
        name: 'update_company',
        description: 'Update company fields (name, website, description, linkedin, category).',
        input_schema: {
          type: 'object',
          properties: { company_id: { type: 'string' }, name: { type: 'string' }, website: { type: 'string' }, description: { type: 'string' }, linkedin: { type: 'string' }, category: { type: 'string' } },
          required: ['company_id']
        }
      });
      toolHandlers['update_company'] = async (input) => {
        const { company_id: cid, ...fields } = input;
        return JSON.stringify(await updateCompany(cid, fields));
      };

      agentTools.push({
        name: 'add_company_tags',
        description: 'Link existing tags to company (case-insensitive match).',
        input_schema: {
          type: 'object',
          properties: { company_id: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
          required: ['company_id', 'tags']
        }
      });
      toolHandlers['add_company_tags'] = async (input) => JSON.stringify(await addCompanyTags(input.company_id, input.tags));

      agentTools.push({
        name: 'upload_company_logo',
        description: 'Upload company logo. Tries Clearbit → Brandfetch automatically.',
        input_schema: {
          type: 'object',
          properties: { company_id: { type: 'string' }, logo_url: { type: 'string' }, domain: { type: 'string' } },
          required: ['company_id']
        }
      });
      toolHandlers['upload_company_logo'] = async (input) => JSON.stringify(await uploadCompanyLogo(input.company_id, { logoUrl: input.logo_url, domain: input.domain }));
    }

    // 5. Build targeted system prompt
    const emailDomain = primaryEmail?.split('@')[1]?.toLowerCase();
    const isFreeDomain = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'me.com', 'protonmail.com', 'mail.com'].includes(emailDomain);

    // Build context about what already exists
    const existingContext = [];
    if (contactData.first_name) existingContext.push(`first_name: ${contactData.first_name}`);
    if (contactData.last_name) existingContext.push(`last_name: ${contactData.last_name}`);
    if (contactData.job_role) existingContext.push(`job_role: ${contactData.job_role}`);
    if (contactData.linkedin) existingContext.push(`linkedin: ${contactData.linkedin}`);
    if (contactData.description) existingContext.push(`description: (already set)`);
    if (contactData.category) existingContext.push(`category: ${contactData.category}`);
    if (contactData.score) existingContext.push(`score: ${contactData.score}`);
    if (contactData.cities.length) existingContext.push(`city: ${contactData.cities.join(', ')}`);
    if (contactData.tags.length) existingContext.push(`tags: ${contactData.tags.join(', ')}`);
    if (contactData.companies.length) existingContext.push(`company: ${contactData.companies.map(c => c.companies?.name).join(', ')}`);

    // Build instructions per missing dimension
    const fixInstructions = [];
    if (needsCompleteness) {
      const mf = missingDetails.completeness?.missing_fields || [];
      // Filter out fields that need user input (category, score, KIT)
      const agentFixable = mf.filter(f => !['category', 'score', 'keep_in_touch'].includes(f));
      if (agentFixable.length) {
        fixInstructions.push(`COMPLETENESS: Fill these empty fields: ${agentFixable.join(', ')}. Use Apollo + web search. Call update_contact_fields and/or add_contact_details.`);
      }
    }
    if (needsPhoto) fixInstructions.push(`PHOTO: Upload a profile photo. Use ONLY the Apollo photo URL. If no Apollo photo, try Gravatar. Do NOT search the web for photos.`);
    if (needsNote) fixInstructions.push(`NOTE: Create a note >500 chars with markdown structure: # Name — Contact Notes, ## Overview, ## Character & Relationship Dynamics, ## Communication History.`);
    if (needsCompany) fixInstructions.push(`COMPANY: Find or create the company and link it. Search Apollo/web for company info. Pass website, description, linkedin.`);
    if (needsCompanyComplete) {
      const cm = missingDetails.company_complete?.missing_fields || [];
      fixInstructions.push(`COMPANY_COMPLETE: Fix these company gaps: ${cm.join(', ')}. Use update_company, add_company_tags, upload_company_logo as needed.`);
    }

    const systemPrompt = `You are a CRM enrichment agent. An existing contact needs specific fixes. Do NOT touch fields that already have values.

CONTACT: ${first_name} ${last_name || ''} <${primaryEmail || 'no email'}>
CONTACT_ID: ${contact_id}
${emailDomain ? `EMAIL DOMAIN: ${emailDomain} ${isFreeDomain ? '(free provider)' : '(company domain)'}` : ''}

EXISTING DATA:
${existingContext.join('\n')}

FIX ONLY THESE DIMENSIONS:
${fixInstructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

WORKFLOW:
${needsResearch && primaryEmail ? '1. enrich_contact_apollo — get professional data\n2. brave_web_search — supplement if Apollo incomplete' : ''}
${needsResearch && primaryEmail ? '3. search_crm_communications — check existing comms for context' : ''}
${fixInstructions.map((_, idx) => `${needsResearch && primaryEmail ? idx + 4 : idx + 1}. Fix dimension as instructed above`).join('\n')}
LAST. run_quality_check — verify all fixes

CRITICAL RULES:
- Do NOT overwrite existing data. update_contact_fields protects against this at code level.
- Do NOT search the web for profile photos — you cannot verify identity.
- Do NOT use brave_image_search for logos — use Clearbit/Brandfetch via upload_company_logo.
- If a dimension cannot be fixed (no data found), skip it — do not fabricate data.
- Your goal: fix as many of the listed dimensions as possible with real data.`;

    // 6. Run targeted agentic loop
    const messages = [{ role: 'user', content: `Enrich contact ${first_name} ${last_name || ''} — fix dimensions: ${missingDimensions.join(', ')}. Go.` }];

    const requestParams = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: agentTools,
    };

    let response = await anthropic.messages.create(requestParams);
    let loopCount = 0;
    const maxLoops = 20;
    let qualityReport = null;

    while (response.stop_reason === 'tool_use' && loopCount < maxLoops) {
      loopCount++;
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        console.log(`[SmartEnrich] Tool ${loopCount}: ${toolUse.name}`);
        try {
          const handler = toolHandlers[toolUse.name];
          if (!handler) throw new Error(`Unknown tool: ${toolUse.name}`);
          const result = await handler(toolUse.input);
          if (toolUse.name === 'run_quality_check') {
            try { qualityReport = JSON.parse(result); } catch {}
          }
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
        } catch (toolError) {
          console.error(`[SmartEnrich] Tool error (${toolUse.name}):`, toolError.message);
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: `Error: ${toolError.message}`, is_error: true });
        }
      }

      requestParams.messages.push({ role: 'assistant', content: response.content });
      requestParams.messages.push({ role: 'user', content: toolResults });
      response = await anthropic.messages.create(requestParams);
    }

    console.log(`[SmartEnrich] Done in ${loopCount} loops. Quality: ${qualityReport?.dimensions_complete || '?'}/5`);

    res.json({
      success: true,
      quality_report: qualityReport || { missing_dimensions: missingDimensions, dimensions_complete: 0 },
    });

  } catch (error) {
    console.error('[SmartEnrich] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Command Center Backend running on port ${PORT}`);
  startPolling();

  // Start briefing schedulers
  startBriefingScheduler();        // 19:15 UK
  startMorningBriefingScheduler(); // 06:00 UK

  // Initialize Baileys after server starts
  setTimeout(() => {
    initBaileysOnStartup();
  }, 2000);
});

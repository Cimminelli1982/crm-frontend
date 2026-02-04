import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
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

    const transformed = uniqueEmails.map(transformEmail);
    const { validEmails, spamByEmail, spamByDomain } = await upsertEmails(transformed);

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

    // Update sync state separately for each mailbox type
    for (const [role, newestDate] of Object.entries(newestDates)) {
      if (newestDate > new Date(0)) {
        await updateSyncDate(newestDate.toISOString(), role);
      }
    }

    lastSyncTime = new Date().toISOString();
    syncCount++;

    console.log(`[${lastSyncTime}] Synced ${validEmails.length} emails (total syncs: ${syncCount})`);

    // Notify CRM Agent of new emails (async, don't block)
    if (validEmails.length > 0) {
      notifyAgentOfNewEmails(validEmails).catch(err => {
        console.error('[Agent] Background notification error:', err.message);
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Auto-sync error:`, error.message);
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
    if (skipCrmDoneStamp) {
      console.log(`Skip CRM Done stamp: true (email will appear in inbox via sync)`);
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
      skipCrmDoneStamp: !!skipCrmDoneStamp,
    });

    console.log('Email sent successfully:', result);

    // Trigger a sync to get the sent email into our database
    setTimeout(() => autoSync(), 2000);

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

    // Get original email from Supabase
    const { data: originalEmail, error } = await supabase
      .from('command_center_inbox')
      .select('*')
      .eq('id', emailId)
      .single();

    if (error || !originalEmail) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    console.log(`Replying to: ${originalEmail.subject}`);

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

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
      inReplyTo: originalEmail.fastmail_id,
      references: originalEmail.fastmail_id,
    });

    console.log('Reply sent successfully:', result);

    setTimeout(() => autoSync(), 2000);

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

    // Get original email from Supabase
    const { data: originalEmail, error } = await supabase
      .from('command_center_inbox')
      .select('*')
      .eq('id', emailId)
      .single();

    if (error || !originalEmail) {
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

const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';
const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;

// Project IDs to include (Work, Personal, Team, Inbox, Birthdays)
const INCLUDED_PROJECT_IDS = [
  '2335921711', // Inbox
  '2336453097', // Personal
  '2336882454', // Work
  '2365787050', // Team
  '2360053180', // Birthdays
];

// Helper to make Todoist API requests
async function todoistRequest(endpoint, options = {}) {
  const response = await fetch(`${TODOIST_API_URL}${endpoint}`, {
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

  return response.json();
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
        project_id: project_id || '2335921711', // Default to Inbox
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

    // Only update basic task properties if there are any (content, description, priority, due_string)
    if (Object.keys(updates).length > 0) {
      task = await todoistRequest(`/tasks/${id}`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });
    }

    // If section_id or project_id changed, we need to move the task
    // Todoist REST API requires a separate call for moving tasks
    if (section_id !== undefined || project_id !== undefined) {
      const movePayload = {};
      if (section_id !== undefined) movePayload.section_id = section_id || null;
      if (project_id !== undefined) movePayload.project_id = project_id;

      // Use the Sync API for moving tasks (REST API doesn't support it directly)
      // Important: Only ONE of section_id or project_id can be specified per move command
      const moveUuid = `move-${id}-${Date.now()}`;

      // Determine move args - prioritize section_id if provided, else project_id
      const moveArgs = { id: id };
      if (section_id !== undefined && section_id) {
        // Moving to a specific section (section_id implies the project)
        moveArgs.section_id = section_id;
      } else if (section_id === '' || section_id === null) {
        // Moving out of section to project root - need project_id
        moveArgs.project_id = project_id;
      } else if (project_id !== undefined) {
        // Moving to different project
        moveArgs.project_id = project_id;
      }

      const syncResponse = await fetch('https://api.todoist.com/sync/v9/sync', {
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

      const syncResult = await syncResponse.json();
      console.log(`[Todoist] Sync response:`, JSON.stringify(syncResult));

      if (syncResult.sync_status && syncResult.sync_status[moveUuid] === 'ok') {
        console.log(`[Todoist] Moved task ${id} to section ${section_id || 'none'}`);
      } else if (syncResult.sync_status) {
        console.error(`[Todoist] Move failed:`, syncResult.sync_status[moveUuid]);
      }
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
      sendUpdates = 'all', // 'all' sends invite emails
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ success: false, error: 'Title and startDate are required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();

    console.log('[GoogleCalendar] Creating event:', title, 'at', startDate, 'timezone:', timezone, 'googleMeet:', useGoogleMeet);

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
    const updates = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    const result = await gcal.updateEvent(eventId, updates);

    console.log('[GoogleCalendar] Event updated:', eventId);

    res.json({ success: true, event: result });
  } catch (error) {
    console.error('[GoogleCalendar] Update event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete event from Google Calendar
app.delete('/google-calendar/delete-event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sendUpdates = 'all' } = req.query;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    await gcal.deleteEvent(eventId, sendUpdates);

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
    const { timeMin, timeMax, maxResults = 100 } = req.query;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({ success: false, error: 'Google Calendar credentials not configured' });
    }

    const gcal = getGoogleCalendarClient();
    const { events } = await gcal.getEvents({
      timeMin,
      timeMax,
      maxResults: parseInt(maxResults),
    });

    res.json({ success: true, events });
  } catch (error) {
    console.error('[GoogleCalendar] Get events error:', error);
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

app.listen(PORT, () => {
  console.log(`Command Center Backend running on port ${PORT}`);
  startPolling();

  // Initialize Baileys after server starts
  setTimeout(() => {
    initBaileysOnStartup();
  }, 2000);
});

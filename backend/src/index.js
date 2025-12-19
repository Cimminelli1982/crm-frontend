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
import {
  initBaileys,
  getStatus as getBaileysStatus,
  getQRCode,
  clearSession,
  sendMessage as baileysSendMessage,
  sendMessageToChat,
  sendMedia,
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

// Start polling
function startPolling() {
  console.log(`Starting email polling every ${SYNC_INTERVAL / 1000} seconds...`);

  // Initial sync
  autoSync();
  syncCalendar();

  // Then every 60 seconds
  setInterval(autoSync, SYNC_INTERVAL);
  setInterval(syncCalendar, SYNC_INTERVAL);
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
    const { to, cc, subject, textBody, htmlBody, inReplyTo, references, attachments } = req.body;

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

// Project IDs to include (Work, Personal, Team, Inbox)
const INCLUDED_PROJECT_IDS = [
  '2335921711', // Inbox
  '2336453097', // Personal
  '2336882454', // Work
  '2344002643', // Team
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

// Update a task
app.patch('/todoist/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { section_id, project_id, ...updates } = req.body;
    console.log(`[Todoist] Update request - id: ${id}, section_id: ${section_id}, project_id: ${project_id}, updates:`, updates);

    // First, update basic task properties (content, description, priority, due_string)
    const task = await todoistRequest(`/tasks/${id}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });

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
app.post('/whatsapp/logout', (req, res) => {
  const result = clearSession();
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

// ============ END WHATSAPP ============

app.listen(PORT, () => {
  console.log(`Command Center Backend running on port ${PORT}`);
  startPolling();

  // Initialize Baileys after server starts
  setTimeout(() => {
    initBaileysOnStartup();
  }, 2000);
});

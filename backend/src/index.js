import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { JMAPClient, transformEmail } from './jmap.js';
import { upsertEmails, supabase, getLatestEmailDate, updateSyncDate } from './supabase.js';
import { mcpManager } from './mcp-client.js';

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
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SYNC_INTERVAL = 60 * 1000; // 60 seconds

let lastSyncTime = null;
let syncCount = 0;

// Auto-sync function
async function autoSync() {
  let jmap = null;

  try {
    console.log(`[${new Date().toISOString()}] Starting auto-sync...`);

    // Get the latest email date from DB to only sync newer emails
    const latestDate = await getLatestEmailDate();
    console.log(`  Latest email in DB: ${latestDate || 'none'}`);

    jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    // Sync both Inbox and Sent
    const mailboxes = await jmap.getMailboxIds(['inbox', 'sent']);
    let allEmails = [];

    for (const { role, id } of mailboxes) {
      const emails = await jmap.getEmails({
        mailboxId: id,
        limit: 50,
        sinceDate: latestDate,
      });
      console.log(`  - ${role}: ${emails.length} new emails`);
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

    // Update sync state with the newest email date
    const newestEmailDate = uniqueEmails.reduce((max, e) => {
      const d = new Date(e.receivedAt);
      return d > max ? d : max;
    }, new Date(0));

    if (newestEmailDate > new Date(0)) {
      await updateSyncDate(newestEmailDate.toISOString());
    }

    lastSyncTime = new Date().toISOString();
    syncCount++;

    console.log(`[${lastSyncTime}] Synced ${validEmails.length} emails (total syncs: ${syncCount})`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Auto-sync error:`, error.message);
  }
}

// Start polling
function startPolling() {
  console.log(`Starting email polling every ${SYNC_INTERVAL / 1000} seconds...`);

  // Initial sync
  autoSync();

  // Then every 60 seconds
  setInterval(autoSync, SYNC_INTERVAL);
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
    const { to, cc, subject, textBody, htmlBody, inReplyTo, references } = req.body;

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

    const jmap = new JMAPClient(
      process.env.FASTMAIL_USERNAME,
      process.env.FASTMAIL_API_TOKEN
    );
    await jmap.init();

    const result = await jmap.sendEmail({
      to,
      cc,
      subject,
      textBody,
      htmlBody,
      inReplyTo,
      references,
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

app.listen(PORT, () => {
  console.log(`Command Center Backend running on port ${PORT}`);
  startPolling();
});

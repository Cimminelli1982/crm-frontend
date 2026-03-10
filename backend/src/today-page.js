// Today Page - Interactive mobile page linked from evening briefing email
// Serves a self-contained HTML page with inline CSS + JS for quick daily actions

import { supabase } from './supabase.js';
import {
  fetchTodoistFilter,
  fetchEmailContactsFallback,
  fetchWhatsAppContacts,
  TODOIST_PROJECTS,
  PRIMARY_CALENDAR,
  LIVING_INTENTION_CALENDAR,
} from './evening-briefing.js';
import { getGoogleCalendarClient } from './google-calendar.js';

const TODAY_PAGE_TOKEN = process.env.TODAY_PAGE_TOKEN;
const BACKEND_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${process.env.PORT || 3001}`;

// ============ AUTH MIDDLEWARE ============

function authMiddleware(req, res, next) {
  const token = req.query.token || req.headers['x-token'];
  if (!TODAY_PAGE_TOKEN) {
    return res.status(500).json({ error: 'TODAY_PAGE_TOKEN not configured' });
  }
  if (token !== TODAY_PAGE_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
}

// ============ ENHANCED DATA FETCHERS ============

async function fetchCalendarEventsEnhanced(dateStr) {
  const gcal = getGoogleCalendarClient();
  const events = await gcal.getEventsMultiCalendar(
    [PRIMARY_CALENDAR, LIVING_INTENTION_CALENDAR],
    {
      timeMin: `${dateStr}T00:00:00Z`,
      timeMax: `${dateStr}T23:59:59Z`,
      orderBy: 'startTime',
    }
  );

  const seen = new Set();
  return events
    .filter(e => e.status !== 'cancelled')
    .map(e => {
      const calName = e.organizer?.displayName || 'Agenda management';
      const start = e.start?.dateTime || e.start?.date;
      const end = e.end?.dateTime || e.end?.date;
      return {
        id: e.id,
        summary: e.summary,
        start,
        end,
        location: e.location || null,
        calendar: calName,
        attendees: (e.attendees || []).map(a => ({ email: a.email, name: a.displayName, status: a.responseStatus })),
        htmlLink: e.htmlLink,
      };
    })
    .filter(e => {
      const key = `${e.summary}|${e.start}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

async function fetchPrioritiesEnhanced(dateStr) {
  const { data } = await supabase
    .from('priorities')
    .select('id, title, is_completed, notes, sort_order')
    .eq('scope_date', dateStr)
    .order('sort_order');
  return data || [];
}

async function fetchTodayTasks() {
  const tasks = await fetchTodoistFilter('today');
  return tasks.map(t => ({
    id: t.id,
    content: t.content,
    description: t.description || '',
    project_id: t.project_id,
    project: TODOIST_PROJECTS[t.project_id] || 'Other',
    priority: t.priority,
    due: t.due,
    labels: t.labels || [],
  }));
}

// ============ ROUTES ============

export function registerTodayRoutes(app) {
  // Redirect /today to /today/{uk-date}
  app.get('/today', authMiddleware, (req, res) => {
    const ukDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    res.redirect(`/today/${ukDate}?token=${req.query.token}`);
  });

  // Serve HTML page
  app.get('/today/:date', authMiddleware, (req, res) => {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildTodayHTML(date, req.query.token));
  });

  // Data endpoint
  app.get('/today/:date/data', authMiddleware, async (req, res) => {
    const { date } = req.params;
    try {
      const [calendar, tasks, emailContacts, whatsapp, priorities] = await Promise.all([
        fetchCalendarEventsEnhanced(date).catch(e => { console.error('[Today] Calendar error:', e.message); return []; }),
        fetchTodayTasks().catch(e => { console.error('[Today] Tasks error:', e.message); return []; }),
        fetchEmailContactsFallback(date).catch(e => { console.error('[Today] Email contacts error:', e.message); return []; }),
        fetchWhatsAppContacts(date).catch(e => { console.error('[Today] WhatsApp error:', e.message); return { contacts: [], groups: [] }; }),
        fetchPrioritiesEnhanced(date).catch(e => { console.error('[Today] Priorities error:', e.message); return []; }),
      ]);

      // Split email contacts
      const inCrmComplete = emailContacts.filter(c => c.in_crm && c.is_complete);
      const inCrmIncomplete = emailContacts.filter(c => c.in_crm && !c.is_complete);
      const notInCrm = emailContacts.filter(c => !c.in_crm);

      res.json({
        date,
        calendar,
        tasks,
        people: {
          email: { inCrmComplete, inCrmIncomplete, notInCrm },
          whatsapp,
        },
        priorities,
      });
    } catch (error) {
      console.error('[Today] Data error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle priority
  app.patch('/today/priorities/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { is_completed } = req.body;
      const { data, error } = await supabase
        .from('priorities')
        .update({ is_completed })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, priority: data });
    } catch (error) {
      console.error('[Today] Priority toggle error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add contact to CRM
  app.post('/today/contacts', authMiddleware, async (req, res) => {
    try {
      const { first_name, last_name, email } = req.body;
      if (!first_name || !last_name) {
        return res.status(400).json({ error: 'first_name and last_name are required' });
      }

      // Create contact
      const { data: contact, error: contactErr } = await supabase
        .from('contacts')
        .insert({ first_name, last_name, category: 'Inbox', created_by: 'User' })
        .select()
        .single();
      if (contactErr) throw contactErr;

      // Add email if provided
      if (email) {
        const { error: emailErr } = await supabase
          .from('contact_emails')
          .insert({ contact_id: contact.contact_id, email, is_primary: true, type: 'work' });
        if (emailErr) console.error('[Today] Email insert error:', emailErr);
      }

      // Try to link company from email domain
      if (email) {
        const domain = email.split('@')[1]?.toLowerCase();
        if (domain) {
          const { data: companyDomain } = await supabase
            .from('company_domains')
            .select('company_id')
            .eq('domain', domain)
            .limit(1);
          if (companyDomain && companyDomain.length > 0) {
            await supabase
              .from('contact_companies')
              .insert({ contact_id: contact.contact_id, company_id: companyDomain[0].company_id, is_primary: true, relationship: 'employee' })
              .catch(() => {});
          }
        }
      }

      console.log(`[Today] Created contact: ${first_name} ${last_name}`);
      res.json({ success: true, contact });
    } catch (error) {
      console.error('[Today] Create contact error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create note (matches /notes POST pattern)
  app.post('/today/notes', authMiddleware, async (req, res) => {
    try {
      const { title, content, contact_id } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'content is required' });
      }

      const noteTitle = title || `Note - ${new Date().toLocaleDateString('en-GB')}`;
      const file_name = noteTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
      const crypto = await import('crypto');
      const content_hash = crypto.createHash('sha256').update(content).digest('hex');

      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          title: noteTitle,
          markdown_content: content,
          text: content,
          folder_path: 'Inbox',
          file_name,
          obsidian_path: `Inbox/${file_name}`,
          note_type: 'general',
          content_hash,
          sync_source: 'crm',
          created_by: 'User',
          last_modified_by: 'User',
          last_modified_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      // Link to contact if provided
      if (contact_id) {
        await supabase
          .from('notes_contacts')
          .upsert({ note_id: note.note_id, contact_id }, { onConflict: 'note_id,contact_id' })
          .catch(e => console.error('[Today] Note link error:', e));
      }

      console.log(`[Today] Created note: ${note.note_id} - ${noteTitle}`);
      res.json({ success: true, note });
    } catch (error) {
      console.error('[Today] Create note error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Agent request (for complex operations)
  app.post('/today/agent-request', authMiddleware, async (req, res) => {
    try {
      const { request_type, description, context } = req.body;
      if (!request_type || !description) {
        return res.status(400).json({ error: 'request_type and description are required' });
      }

      const { data, error } = await supabase
        .from('agent_requests')
        .insert({
          request_type,
          description,
          context: context || {},
          assigned_to: 'barbara',
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      console.log(`[Today] Agent request created: ${request_type} - ${description}`);
      res.json({ success: true, request: data });
    } catch (error) {
      console.error('[Today] Agent request error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

// ============ HTML PAGE ============

function buildTodayHTML(dateStr, token) {
  const dateFormatted = new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Today — ${dateStr}</title>
<style>
  :root {
    --bg: #0f0f0f;
    --surface: #1a1a1a;
    --surface2: #242424;
    --border: #333;
    --text: #e5e5e5;
    --text2: #999;
    --accent: #5b9bf7;
    --green: #4caf50;
    --orange: #ff9800;
    --red: #e74c3c;
    --radius: 12px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding: 16px;
    padding-bottom: 80px;
    -webkit-font-smoothing: antialiased;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .date-sub {
    color: var(--text2);
    font-size: 14px;
    margin-bottom: 20px;
  }

  /* Sections */
  .section {
    margin-bottom: 20px;
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .section-header h2 {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-header .count {
    font-size: 13px;
    color: var(--text2);
    font-weight: 400;
  }
  .section-header .chevron {
    font-size: 12px;
    color: var(--text2);
    transition: transform 0.2s;
  }
  .section.collapsed .chevron { transform: rotate(-90deg); }
  .section.collapsed .section-body { display: none; }
  .section-body { padding: 0 16px 12px; }

  /* Items */
  .item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .item:last-child { border-bottom: none; }
  .item-content { flex: 1; min-width: 0; }
  .item-title {
    font-size: 15px;
    word-break: break-word;
  }
  .item-sub {
    font-size: 13px;
    color: var(--text2);
    margin-top: 2px;
  }
  .item-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    min-height: 36px;
    white-space: nowrap;
  }
  .btn:active { opacity: 0.7; }
  .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .btn-danger { background: var(--red); border-color: var(--red); color: #fff; }
  .btn-sm { padding: 4px 8px; font-size: 12px; min-height: 28px; }

  /* Checkbox */
  .checkbox {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--border);
    flex-shrink: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.15s;
  }
  .checkbox.checked {
    background: var(--green);
    border-color: var(--green);
  }
  .checkbox.checked::after {
    content: '✓';
    color: #fff;
    font-size: 14px;
    font-weight: 700;
  }

  /* Inline forms */
  .inline-form {
    display: none;
    padding: 10px 0;
    border-top: 1px solid var(--border);
    margin-top: 6px;
  }
  .inline-form.open { display: block; }
  .inline-form input, .inline-form textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    margin-bottom: 8px;
    outline: none;
  }
  .inline-form textarea { resize: vertical; min-height: 80px; }
  .inline-form input:focus, .inline-form textarea:focus {
    border-color: var(--accent);
  }
  .form-row { display: flex; gap: 8px; }
  .form-row input { flex: 1; }

  /* Subgroups */
  .subgroup {
    margin-top: 8px;
  }
  .subgroup-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 0 2px;
  }
  .subgroup-title.warning { color: var(--orange); }
  .subgroup-title.danger { color: var(--red); }

  /* Calendar event */
  .event-time {
    font-size: 13px;
    color: var(--accent);
    font-weight: 600;
    white-space: nowrap;
    min-width: 90px;
  }

  /* Task project badge */
  .project-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--surface2);
    color: var(--text2);
    border: 1px solid var(--border);
  }

  /* Bottom sheet */
  .sheet-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
  }
  .sheet-overlay.open { display: block; }
  .sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    border-radius: 16px 16px 0 0;
    padding: 20px 16px;
    padding-bottom: max(20px, env(safe-area-inset-bottom));
    z-index: 101;
    max-height: 60vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  .sheet-overlay.open .sheet { transform: translateY(0); }
  .sheet-handle {
    width: 36px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 0 auto 16px;
  }
  .sheet-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .sheet-option {
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    font-size: 15px;
    -webkit-tap-highlight-color: transparent;
  }
  .sheet-option:active { opacity: 0.7; }
  .sheet-option:last-child { border-bottom: none; }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: var(--surface2);
    color: var(--text);
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    z-index: 200;
    transition: transform 0.3s ease;
    border: 1px solid var(--border);
    max-width: 90%;
    text-align: center;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
  .toast.success { border-color: var(--green); }
  .toast.error { border-color: var(--red); }

  /* Loading */
  .loading {
    text-align: center;
    padding: 40px;
    color: var(--text2);
  }
  .spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Person status dot */
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 7px;
  }
  .status-dot.complete { background: var(--green); }
  .status-dot.incomplete { background: var(--orange); }
  .status-dot.missing { background: var(--red); }

  /* Done animation */
  .item.done {
    opacity: 0.4;
    text-decoration: line-through;
    transition: opacity 0.3s;
  }
  .item.removing {
    opacity: 0;
    height: 0;
    padding: 0;
    overflow: hidden;
    transition: all 0.3s;
  }
</style>
</head>
<body>

<h1>Today</h1>
<div class="date-sub">${dateFormatted}</div>

<div id="app">
  <div class="loading">
    <div class="spinner"></div>
    <p style="margin-top:12px;">Loading...</p>
  </div>
</div>

<!-- Bottom sheet for task move -->
<div class="sheet-overlay" id="moveSheet">
  <div class="sheet">
    <div class="sheet-handle"></div>
    <div class="sheet-title">Move to project</div>
    <div id="moveSheetOptions"></div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
const API = '${BACKEND_URL}';
const TOKEN = '${token}';
const DATE = '${dateStr}';
const PROJECTS = ${JSON.stringify(TODOIST_PROJECTS)};

let data = null;
let moveTaskId = null;

// ============ API HELPERS ============

async function api(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = API + path + sep + 'token=' + TOKEN;
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'X-Token': TOKEN, ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.className = 'toast', 2500);
}

// ============ DATA LOADING ============

async function loadData() {
  try {
    data = await api('/today/' + DATE + '/data');
    render();
  } catch (e) {
    document.getElementById('app').innerHTML = '<div class="loading" style="color:var(--red);">Error loading data: ' + e.message + '</div>';
  }
}

// ============ RENDER ============

function render() {
  const app = document.getElementById('app');
  app.innerHTML = renderPriorities() + renderCalendar() + renderTasks() + renderPeople();
}

function renderPriorities() {
  const p = data.priorities;
  const done = p.filter(x => x.is_completed).length;
  return section('priorities', '🎯 Priorities', p.length ? done + '/' + p.length : '0', p.length === 0
    ? '<p style="color:var(--text2);padding:8px 0;">No priorities set</p>'
    : p.map(item => \`
      <div class="item" id="priority-\${item.id}">
        <div class="checkbox \${item.is_completed ? 'checked' : ''}" onclick="togglePriority(\${item.id}, \${!item.is_completed})"></div>
        <div class="item-content">
          <div class="item-title \${item.is_completed ? 'done' : ''}">\${esc(item.title)}</div>
          \${item.notes ? '<div class="item-sub">' + esc(item.notes) + '</div>' : ''}
        </div>
      </div>
    \`).join('')
  );
}

function renderCalendar() {
  const ev = data.calendar;
  return section('calendar', '📅 Calendar', ev.length, ev.length === 0
    ? '<p style="color:var(--text2);padding:8px 0;">No events today</p>'
    : ev.map(e => \`
      <div class="item">
        <div class="event-time">\${fmtTime(e.start)} – \${fmtTime(e.end)}</div>
        <div class="item-content">
          <div class="item-title">\${esc(e.summary)}</div>
          \${e.location ? '<div class="item-sub">📍 ' + esc(e.location) + '</div>' : ''}
          <div class="item-sub">\${esc(e.calendar)}\${e.attendees.length ? ' · ' + e.attendees.length + ' attendees' : ''}</div>
          <div class="item-actions">
            <button class="btn btn-sm" onclick="toggleForm('note-cal-\${e.id}')">📝 Note</button>
          </div>
          <div class="inline-form" id="note-cal-\${e.id}">
            <textarea placeholder="Meeting notes..." id="note-cal-text-\${e.id}"></textarea>
            <button class="btn btn-primary" onclick="saveCalNote('\${e.id}', '\${esc(e.summary)}')">Save Note</button>
          </div>
        </div>
      </div>
    \`).join('')
  );
}

function renderTasks() {
  const tasks = data.tasks;
  // Group by project
  const groups = {};
  for (const t of tasks) {
    const proj = t.project || 'Other';
    if (!groups[proj]) groups[proj] = [];
    groups[proj].push(t);
  }
  const order = ['Inbox', 'Personal', 'Work', 'Team', 'Birthdays 🎂', 'Other'];
  let body = '';
  if (tasks.length === 0) {
    body = '<p style="color:var(--text2);padding:8px 0;">All clear!</p>';
  } else {
    for (const proj of order) {
      if (!groups[proj]) continue;
      body += '<div class="subgroup"><div class="subgroup-title">' + esc(proj) + '</div>';
      body += groups[proj].map(t => \`
        <div class="item" id="task-\${t.id}">
          <div class="checkbox" onclick="completeTask('\${t.id}')"></div>
          <div class="item-content">
            <div class="item-title">\${esc(t.content)}</div>
            \${t.description ? '<div class="item-sub">' + esc(t.description).substring(0, 100) + '</div>' : ''}
            <div class="item-actions">
              <button class="btn btn-sm" onclick="openMoveSheet('\${t.id}')">📁 Move</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTask('\${t.id}')">🗑</button>
            </div>
          </div>
        </div>
      \`).join('');
      body += '</div>';
    }
  }
  return section('tasks', '⏳ Tasks Due', tasks.length, body);
}

function renderPeople() {
  const { email, whatsapp } = data.people;
  const total = email.inCrmComplete.length + email.inCrmIncomplete.length + email.notInCrm.length + whatsapp.contacts.length + whatsapp.groups.length;
  let body = '';

  // Email: In CRM (complete)
  if (email.inCrmComplete.length > 0) {
    body += '<div class="subgroup"><div class="subgroup-title">✅ In CRM</div>';
    body += email.inCrmComplete.map(c => personItem(c, 'complete')).join('');
    body += '</div>';
  }

  // Email: In CRM (incomplete)
  if (email.inCrmIncomplete.length > 0) {
    body += '<div class="subgroup"><div class="subgroup-title warning">⚠️ In CRM (incomplete)</div>';
    body += email.inCrmIncomplete.map(c => personItem(c, 'incomplete')).join('');
    body += '</div>';
  }

  // Email: Not in CRM
  if (email.notInCrm.length > 0) {
    body += '<div class="subgroup"><div class="subgroup-title danger">❌ Not in CRM</div>';
    body += email.notInCrm.map(c => personItemNotInCrm(c)).join('');
    body += '</div>';
  }

  // WhatsApp 1-to-1
  if (whatsapp.contacts.length > 0) {
    body += '<div class="subgroup"><div class="subgroup-title">💬 WhatsApp</div>';
    body += whatsapp.contacts.map(c => \`
      <div class="item">
        <div class="status-dot complete"></div>
        <div class="item-content">
          <div class="item-title">\${esc(c.name)}</div>
          <div class="item-sub">\${esc(c.mobile)}</div>
        </div>
      </div>
    \`).join('');
    body += '</div>';
  }

  // WhatsApp groups
  if (whatsapp.groups.length > 0) {
    body += '<div class="subgroup"><div class="subgroup-title">💬 WhatsApp Groups</div>';
    body += whatsapp.groups.map(g => \`
      <div class="item">
        <div class="item-content">
          <div class="item-title">\${esc(g)}</div>
        </div>
      </div>
    \`).join('');
    body += '</div>';
  }

  if (total === 0) {
    body = '<p style="color:var(--text2);padding:8px 0;">No interactions today</p>';
  }

  return section('people', '👥 People', total, body);
}

function personItem(c, status) {
  const uid = btoa(c.email || c.name).replace(/[^a-zA-Z0-9]/g, '');
  return \`
    <div class="item">
      <div class="status-dot \${status}"></div>
      <div class="item-content">
        <div class="item-title">\${esc(c.name)}</div>
        <div class="item-sub">\${esc(c.email || '')}</div>
        <div class="item-actions">
          <button class="btn btn-sm" onclick="toggleForm('note-p-\${uid}')">📝 Note</button>
          \${status === 'incomplete' ? '<button class="btn btn-sm" onclick="agentRequest(\\'complete_profile\\', \\'Complete profile for ' + esc(c.name) + '\\', {name:\\''+esc(c.name)+'\\',email:\\''+esc(c.email||'')+'\\' })">🤖 Complete</button>' : ''}
        </div>
        <div class="inline-form" id="note-p-\${uid}">
          <textarea placeholder="Note about \${esc(c.name)}..." id="note-p-text-\${uid}"></textarea>
          <button class="btn btn-primary" onclick="savePersonNote('\${uid}', '\${esc(c.name)}')">Save Note</button>
        </div>
      </div>
    </div>
  \`;
}

function personItemNotInCrm(c) {
  const uid = btoa(c.email || c.name).replace(/[^a-zA-Z0-9]/g, '');
  const parts = (c.name || '').trim().split(/\\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return \`
    <div class="item" id="notcrm-\${uid}">
      <div class="status-dot missing"></div>
      <div class="item-content">
        <div class="item-title">\${esc(c.name)}</div>
        <div class="item-sub">\${esc(c.email || '')}</div>
        <div class="item-actions">
          <button class="btn btn-sm btn-primary" onclick="toggleForm('addcrm-\${uid}')">➕ Add to CRM</button>
        </div>
        <div class="inline-form" id="addcrm-\${uid}">
          <div class="form-row">
            <input placeholder="First name" id="addcrm-fn-\${uid}" value="\${esc(firstName)}">
            <input placeholder="Last name" id="addcrm-ln-\${uid}" value="\${esc(lastName)}">
          </div>
          <input placeholder="Email" id="addcrm-em-\${uid}" value="\${esc(c.email || '')}">
          <button class="btn btn-primary" onclick="addToCrm('\${uid}')">Save Contact</button>
        </div>
      </div>
    </div>
  \`;
}

function section(id, title, count, body) {
  return \`
    <div class="section" id="sec-\${id}">
      <div class="section-header" onclick="toggleSection('\${id}')">
        <h2>\${title} <span class="count">\${count}</span></h2>
        <span class="chevron">▼</span>
      </div>
      <div class="section-body">\${body}</div>
    </div>
  \`;
}

// ============ HELPERS ============

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function fmtTime(isoStr) {
  if (!isoStr || isoStr.length <= 10) return 'All day';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

function toggleSection(id) {
  document.getElementById('sec-' + id).classList.toggle('collapsed');
}

function toggleForm(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

// ============ ACTIONS ============

async function togglePriority(id, newState) {
  // Optimistic UI
  const el = document.getElementById('priority-' + id);
  const cb = el?.querySelector('.checkbox');
  const title = el?.querySelector('.item-title');
  if (cb) cb.classList.toggle('checked', newState);
  if (title) title.classList.toggle('done', newState);

  // Update count
  const p = data.priorities.find(x => x.id === id);
  if (p) p.is_completed = newState;
  const done = data.priorities.filter(x => x.is_completed).length;
  const countEl = document.querySelector('#sec-priorities .count');
  if (countEl) countEl.textContent = done + '/' + data.priorities.length;

  try {
    await api('/today/priorities/' + id, { method: 'PATCH', body: { is_completed: newState } });
  } catch (e) {
    // Revert
    if (cb) cb.classList.toggle('checked', !newState);
    if (title) title.classList.toggle('done', !newState);
    if (p) p.is_completed = !newState;
    toast('Failed to update priority', 'error');
  }
}

async function completeTask(id) {
  const el = document.getElementById('task-' + id);
  if (!el) return;
  const cb = el.querySelector('.checkbox');
  if (cb) cb.classList.add('checked');
  el.classList.add('done');
  setTimeout(() => el.classList.add('removing'), 400);

  try {
    await api('/todoist/tasks/' + id + '/close', { method: 'POST' });
    toast('Task completed');
    // Remove from data
    data.tasks = data.tasks.filter(t => t.id !== id);
    // Update count
    const countEl = document.querySelector('#sec-tasks .count');
    if (countEl) countEl.textContent = data.tasks.length;
  } catch (e) {
    el.classList.remove('done', 'removing');
    if (cb) cb.classList.remove('checked');
    toast('Failed to complete task', 'error');
  }
}

async function deleteTask(id) {
  const el = document.getElementById('task-' + id);
  if (!el) return;
  el.classList.add('removing');

  try {
    await api('/todoist/tasks/' + id, { method: 'DELETE' });
    toast('Task deleted');
    data.tasks = data.tasks.filter(t => t.id !== id);
    const countEl = document.querySelector('#sec-tasks .count');
    if (countEl) countEl.textContent = data.tasks.length;
  } catch (e) {
    el.classList.remove('removing');
    toast('Failed to delete task', 'error');
  }
}

function openMoveSheet(taskId) {
  moveTaskId = taskId;
  const opts = document.getElementById('moveSheetOptions');
  opts.innerHTML = Object.entries(PROJECTS).map(([pid, name]) =>
    '<div class="sheet-option" onclick="moveTask(\\'' + pid + '\\')">' + esc(name) + '</div>'
  ).join('');
  document.getElementById('moveSheet').classList.add('open');
}

function closeMoveSheet() {
  document.getElementById('moveSheet').classList.remove('open');
  moveTaskId = null;
}

async function moveTask(projectId) {
  closeMoveSheet();
  if (!moveTaskId) return;
  const id = moveTaskId;
  const projName = PROJECTS[projectId] || 'Other';

  try {
    await api('/todoist/tasks/' + id, { method: 'PATCH', body: { project_id: projectId } });
    toast('Moved to ' + projName);
    // Update in data
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      task.project_id = projectId;
      task.project = projName;
    }
    render();
  } catch (e) {
    toast('Failed to move task', 'error');
  }
}

async function addToCrm(uid) {
  const fn = document.getElementById('addcrm-fn-' + uid)?.value?.trim();
  const ln = document.getElementById('addcrm-ln-' + uid)?.value?.trim();
  const em = document.getElementById('addcrm-em-' + uid)?.value?.trim();

  if (!fn || !ln) {
    toast('First and last name required', 'error');
    return;
  }

  try {
    await api('/today/contacts', { method: 'POST', body: { first_name: fn, last_name: ln, email: em } });
    toast(fn + ' ' + ln + ' added to CRM');
    // Move from notInCrm to inCrmIncomplete
    const idx = data.people.email.notInCrm.findIndex(c => {
      const cuid = btoa(c.email || c.name).replace(/[^a-zA-Z0-9]/g, '');
      return cuid === uid;
    });
    if (idx >= 0) {
      const contact = data.people.email.notInCrm.splice(idx, 1)[0];
      contact.name = fn + ' ' + ln;
      contact.in_crm = true;
      data.people.email.inCrmIncomplete.push(contact);
    }
    render();
  } catch (e) {
    toast('Failed to add contact: ' + e.message, 'error');
  }
}

async function saveCalNote(eventId, eventSummary) {
  const textarea = document.getElementById('note-cal-text-' + eventId);
  const content = textarea?.value?.trim();
  if (!content) { toast('Note is empty', 'error'); return; }

  try {
    await api('/today/notes', { method: 'POST', body: { title: 'Meeting: ' + eventSummary, content, event_id: eventId } });
    toast('Note saved');
    textarea.value = '';
    toggleForm('note-cal-' + eventId);
  } catch (e) {
    toast('Failed to save note', 'error');
  }
}

async function savePersonNote(uid, name) {
  const textarea = document.getElementById('note-p-text-' + uid);
  const content = textarea?.value?.trim();
  if (!content) { toast('Note is empty', 'error'); return; }

  try {
    await api('/today/notes', { method: 'POST', body: { title: 'Note: ' + name, content } });
    toast('Note saved');
    textarea.value = '';
    toggleForm('note-p-' + uid);
  } catch (e) {
    toast('Failed to save note', 'error');
  }
}

async function agentRequest(type, desc, ctx) {
  try {
    await api('/today/agent-request', { method: 'POST', body: { request_type: type, description: desc, context: ctx } });
    toast('Sent to Barbara');
  } catch (e) {
    toast('Failed to send request', 'error');
  }
}

// Close sheet on overlay click
document.getElementById('moveSheet').addEventListener('click', function(e) {
  if (e.target === this) closeMoveSheet();
});

// ============ INIT ============
loadData();
</script>

</body>
</html>`;
}

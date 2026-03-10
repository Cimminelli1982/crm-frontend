// Evening Briefing - Generates and sends daily summary email at 19:00 UK time
// Data sources: Google Calendar, Todoist API v1, Supabase

import { supabase } from './supabase.js';
import { getGoogleCalendarClient } from './google-calendar.js';
import { JMAPClient } from './jmap.js';

const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;
const TODOIST_BASE = 'https://api.todoist.com/api/v1';
export const LIVING_INTENTION_CALENDAR = 'c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com';
export const PRIMARY_CALENDAR = 'simone@cimminelli.com';
const RECIPIENT_EMAIL = 'simone@cimminelli.com';
const RECIPIENT_NAME = 'Simone Cimminelli';

export const TODOIST_PROJECTS = {
  '6VhG9MrQwJwqJJfW': 'Inbox',
  '6VmX2Jv6wGG8W8V5': 'Personal',
  '6VqRM39cGMjV8pP7': 'Work',
  '6crr237qxV93wV9q': 'Birthdays 🎂',
  '6fp9mp2F253X67f8': 'Team',
};

// ============ DATA GATHERING ============

export async function fetchTodoistFilter(query) {
  const url = `${TODOIST_BASE}/tasks/filter?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TODOIST_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Todoist filter error: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function fetchTodoistCompleted(dateStr) {
  const url = `${TODOIST_BASE}/tasks/completed?since=${dateStr}T00:00:00Z&until=${dateStr}T23:59:59Z`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TODOIST_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Todoist completed error: ${res.status}`);
  const data = await res.json();
  return (data.items || []).map(t => ({
    content: t.content,
    project: (data.projects || {})[t.project_id]?.name || TODOIST_PROJECTS[t.project_id] || 'Unknown',
  }));
}

export async function fetchCalendarEvents(dateStr) {
  const gcal = getGoogleCalendarClient();
  const events = await gcal.getEventsMultiCalendar(
    [PRIMARY_CALENDAR, LIVING_INTENTION_CALENDAR],
    {
      timeMin: `${dateStr}T00:00:00Z`,
      timeMax: `${dateStr}T23:59:59Z`,
      orderBy: 'startTime',
    }
  );

  // Deduplicate by summary + start time, pick calendar name
  const seen = new Set();
  return events
    .filter(e => e.status !== 'cancelled')
    .map(e => {
      const calName = e.organizer?.displayName || 'Agenda management';
      const start = e.start?.dateTime || e.start?.date;
      const end = e.end?.dateTime || e.end?.date;
      return { summary: e.summary, start, end, calendar: calName };
    })
    .filter(e => {
      const key = `${e.summary}|${e.start}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

async function fetchEmailContacts(dateStr) {
  const { data, error } = await supabase.rpc('get_briefing_email_contacts', { target_date: dateStr });
  // Fallback to raw SQL if RPC doesn't exist
  if (error) {
    const { data: rawData } = await supabase.from('interactions').select('contact_id').limit(0);
    // Use raw SQL approach
    return await fetchEmailContactsSQL(dateStr);
  }
  return data;
}

async function fetchEmailContactsSQL(dateStr) {
  const query = `
    WITH all_emails AS (
      SELECT DISTINCT ce.email, c.first_name || ' ' || c.last_name AS name, c.contact_id
      FROM interactions i
      JOIN contacts c ON c.contact_id = i.contact_id
      LEFT JOIN contact_emails ce ON ce.contact_id = c.contact_id AND ce.is_primary = true
      WHERE i.interaction_type = 'email' AND i.interaction_date::date = '${dateStr}'
      UNION
      SELECT DISTINCT ci.from_email AS email, ci.from_name AS name,
        (SELECT ce2.contact_id FROM contact_emails ce2 WHERE lower(ce2.email) = lower(ci.from_email) LIMIT 1) AS contact_id
      FROM command_center_inbox ci
      WHERE ci.type = 'email' AND ci.date::date = '${dateStr}'
    )
    SELECT DISTINCT ON (ae.email)
      ae.name, ae.email,
      CASE WHEN c.contact_id IS NOT NULL THEN true ELSE false END AS in_crm,
      CASE WHEN c.contact_id IS NULL THEN false
        WHEN c.show_missing = false THEN true
        WHEN (
          c.first_name IS NOT NULL AND c.first_name != '' AND
          c.last_name IS NOT NULL AND c.last_name != '' AND
          c.category != 'Inbox' AND
          EXISTS(SELECT 1 FROM contact_emails ce3 WHERE ce3.contact_id = c.contact_id) AND
          EXISTS(SELECT 1 FROM contact_companies cc WHERE cc.contact_id = c.contact_id)
        ) THEN true
        ELSE false
      END AS is_complete
    FROM all_emails ae
    LEFT JOIN contacts c ON c.contact_id = ae.contact_id
    WHERE ae.name NOT IN ('Marketing', 'The New York Times', 'Simone Cimminelli')
      AND ae.email IS NOT NULL AND ae.name IS NOT NULL
    ORDER BY ae.email, in_crm DESC
  `;
  const { data, error } = await supabase.rpc('exec_sql', { query });
  // If RPC doesn't exist, fall back to direct postgrest
  if (error) {
    // Use supabase-js direct SQL via postgres
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      // Last resort: use individual queries
      return await fetchEmailContactsFallback(dateStr);
    }
    return await res.json();
  }
  return data;
}

export async function fetchEmailContactsFallback(dateStr) {
  // Query interactions for email contacts
  const { data: interactionEmails } = await supabase
    .from('interactions')
    .select('contact_id, contacts(first_name, last_name, show_missing, category, contact_id), contact_id')
    .eq('interaction_type', 'email')
    .gte('interaction_date', `${dateStr}T00:00:00`)
    .lte('interaction_date', `${dateStr}T23:59:59`);

  // Query inbox emails
  const { data: inboxEmails } = await supabase
    .from('command_center_inbox')
    .select('from_name, from_email')
    .eq('type', 'email')
    .gte('date', `${dateStr}T00:00:00`)
    .lte('date', `${dateStr}T23:59:59`);

  // Get contact IDs from interactions
  const contactIds = [...new Set((interactionEmails || []).map(i => i.contact_id))];

  // Get emails for those contacts
  const { data: contactEmails } = await supabase
    .from('contact_emails')
    .select('contact_id, email')
    .in('contact_id', contactIds)
    .eq('is_primary', true);

  // Get companies for completeness check
  const { data: contactCompanies } = await supabase
    .from('contact_companies')
    .select('contact_id')
    .in('contact_id', contactIds);

  const companySet = new Set((contactCompanies || []).map(cc => cc.contact_id));
  const emailMap = {};
  for (const ce of (contactEmails || [])) {
    emailMap[ce.contact_id] = ce.email;
  }

  const result = new Map();
  const EXCLUDE = ['marketing', 'the new york times', 'simone cimminelli'];

  // Process interaction contacts
  for (const i of (interactionEmails || [])) {
    const c = i.contacts;
    if (!c) continue;
    const email = emailMap[i.contact_id];
    if (!email) continue;
    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim();
    if (EXCLUDE.includes(name.toLowerCase())) continue;
    const isComplete = c.show_missing === false || (
      c.first_name && c.last_name && c.category !== 'Inbox' && companySet.has(c.contact_id)
    );
    result.set(email.toLowerCase(), { name, email, in_crm: true, is_complete: isComplete });
  }

  // Process inbox contacts
  for (const ie of (inboxEmails || [])) {
    if (!ie.from_email || !ie.from_name) continue;
    if (EXCLUDE.includes(ie.from_name.toLowerCase())) continue;
    const key = ie.from_email.toLowerCase();
    if (!result.has(key)) {
      // Check if in CRM
      const { data: found } = await supabase
        .from('contact_emails')
        .select('contact_id')
        .ilike('email', key)
        .limit(1);
      if (found && found.length > 0) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, show_missing, category, contact_id')
          .eq('contact_id', found[0].contact_id)
          .single();
        if (contact) {
          const hasCompany = companySet.has(contact.contact_id) ||
            (await supabase.from('contact_companies').select('contact_id').eq('contact_id', contact.contact_id).limit(1)).data?.length > 0;
          const isComplete = contact.show_missing === false || (
            contact.first_name && contact.last_name && contact.category !== 'Inbox' && hasCompany
          );
          result.set(key, {
            name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            email: ie.from_email, in_crm: true, is_complete: isComplete,
          });
          continue;
        }
      }
      result.set(key, { name: ie.from_name, email: ie.from_email, in_crm: false, is_complete: false });
    }
  }

  return [...result.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchWhatsAppContacts(dateStr) {
  // 1-to-1 from interactions
  const { data: waInteractions } = await supabase.rpc('exec_sql', {
    query: `SELECT DISTINCT c.first_name || ' ' || c.last_name AS name, cm.mobile
            FROM interactions i
            JOIN contacts c ON c.contact_id = i.contact_id
            LEFT JOIN contact_mobiles cm ON cm.contact_id = c.contact_id AND cm.is_primary = true
            WHERE i.interaction_type = 'whatsapp' AND i.interaction_date::date = '${dateStr}'
            ORDER BY name`
  }).catch(() => ({ data: null }));

  // 1-to-1 from inbox
  const { data: waInbox } = await supabase
    .from('command_center_inbox')
    .select('chat_name, contact_number')
    .eq('type', 'whatsapp')
    .eq('is_group_chat', false)
    .gte('date', `${dateStr}T00:00:00`)
    .lte('date', `${dateStr}T23:59:59`);

  // Groups from inbox
  const { data: waGroups } = await supabase
    .from('command_center_inbox')
    .select('chat_name')
    .eq('type', 'whatsapp')
    .eq('is_group_chat', true)
    .gte('date', `${dateStr}T00:00:00`)
    .lte('date', `${dateStr}T23:59:59`);

  // Merge 1-to-1 contacts
  const contactMap = new Map();
  if (waInteractions) {
    for (const c of waInteractions) {
      if (c.mobile) contactMap.set(c.mobile, { name: c.name, mobile: c.mobile });
    }
  }
  for (const c of (waInbox || [])) {
    if (c.contact_number && !contactMap.has(c.contact_number)) {
      contactMap.set(c.contact_number, { name: c.chat_name, mobile: c.contact_number });
    }
  }

  // Deduplicate groups
  const groupSet = new Set();
  for (const g of (waGroups || [])) {
    if (g.chat_name) groupSet.add(g.chat_name.trim());
  }

  return {
    contacts: [...contactMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    groups: [...groupSet].sort(),
  };
}

export async function fetchPriorities(dateStr) {
  const { data } = await supabase
    .from('priorities')
    .select('title, is_completed, notes')
    .eq('scope_date', dateStr)
    .order('sort_order');
  return data || [];
}

async function fetchWeight(dateStr) {
  const { data } = await supabase
    .from('body_metrics')
    .select('date, weight_kg, body_fat_pct')
    .gte('date', new Date(new Date(dateStr).getTime() - 3 * 86400000).toISOString().slice(0, 10))
    .lte('date', dateStr)
    .order('date', { ascending: false });

  if (!data || data.length === 0) return [];

  // Only keep consecutive days starting from today
  const consecutive = [data[0]];
  for (let i = 1; i < data.length; i++) {
    const prev = new Date(consecutive[consecutive.length - 1].date);
    const curr = new Date(data[i].date);
    const diffDays = (prev - curr) / 86400000;
    if (diffDays === 1) {
      consecutive.push(data[i]);
    } else {
      break;
    }
  }
  return consecutive;
}

// ============ HTML COMPOSITION ============

export function formatTime(isoStr) {
  if (!isoStr || isoStr.length <= 10) return 'All day';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

function formatWaLink(mobile) {
  const clean = mobile.replace(/[\s\-\+]/g, '');
  return `<a href="https://wa.me/${clean}">${mobile}</a>`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function buildHTML(dateStr, data) {
  const { events, completed, dueToday, createdToday, emailContacts, whatsapp, priorities, weight } = data;
  const dateFormatted = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">`;

  // === APPOINTMENTS ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">📅 APPOINTMENTS TODAY</h2>`;
  if (events.length === 0) {
    html += `<p style="color:#888;">No appointments today</p>`;
  } else {
    html += `<ul style="list-style: none; padding-left: 0;">`;
    for (const e of events) {
      html += `<li>${formatTime(e.start)} – ${formatTime(e.end)} &nbsp; ${e.summary} <span style="color:#888;">(${e.calendar})</span></li>`;
    }
    html += `</ul>`;
  }

  // === COMPLETED ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">✅ TASKS COMPLETED TODAY</h2>`;
  if (completed.length === 0) {
    html += `<p style="color:#888;">No tasks completed</p>`;
  } else {
    html += `<ul>`;
    for (const t of completed) {
      html += `<li>${t.content} <span style="color:#888;">(${t.project})</span></li>`;
    }
    html += `</ul>`;
  }

  // === DUE TODAY ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">⏳ TASKS DUE TODAY (still open)</h2>`;
  if (dueToday.length === 0) {
    html += `<p style="color:#888;">All clear!</p>`;
  } else {
    // Group by project
    const byProject = {};
    for (const t of dueToday) {
      const proj = TODOIST_PROJECTS[t.project_id] || 'Other';
      if (!byProject[proj]) byProject[proj] = [];
      byProject[proj].push(t);
    }
    const projectOrder = ['Inbox', 'Personal', 'Work', 'Team', 'Birthdays 🎂', 'Other'];
    for (const proj of projectOrder) {
      if (!byProject[proj]) continue;
      html += `<p><strong>${proj}</strong></p><ul>`;
      for (const t of byProject[proj]) {
        html += `<li>${t.content}</li>`;
      }
      html += `</ul>`;
    }
  }

  // === CREATED TODAY ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">➕ TASKS ADDED TODAY</h2>`;
  if (createdToday.length === 0) {
    html += `<p style="color:#888;">No new tasks added today</p>`;
  } else {
    html += `<ul>`;
    for (const t of createdToday) {
      const proj = TODOIST_PROJECTS[t.project_id] || 'Other';
      html += `<li>${t.content} <span style="color:#888;">(${proj})</span></li>`;
    }
    html += `</ul>`;
  }

  // === PEOPLE INTERACTED WITH ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">👥 PEOPLE I INTERACTED WITH</h2>`;

  // Email contacts
  html += `<p><strong>📧 Email</strong></p>`;
  const inCrmComplete = emailContacts.filter(c => c.in_crm && c.is_complete);
  const inCrmIncomplete = emailContacts.filter(c => c.in_crm && !c.is_complete);
  const notInCrm = emailContacts.filter(c => !c.in_crm);

  if (inCrmComplete.length > 0) {
    html += `<p style="margin-bottom:2px; color:#555; font-size:13px;">In CRM:</p>`;
    html += `<ul style="list-style: none; padding-left: 0; margin-top:2px;">`;
    for (const c of inCrmComplete) html += `<li>${c.name} — ${c.email}</li>`;
    html += `</ul>`;
  }
  if (inCrmIncomplete.length > 0) {
    html += `<p style="margin-bottom:2px; color:#e67e22; font-size:13px;">⚠️ In CRM (incomplete):</p>`;
    html += `<ul style="list-style: none; padding-left: 0; margin-top:2px;">`;
    for (const c of inCrmIncomplete) html += `<li>${c.name} — ${c.email}</li>`;
    html += `</ul>`;
  }
  if (notInCrm.length > 0) {
    html += `<p style="margin-bottom:2px; color:#e74c3c; font-size:13px;">❌ Not in CRM:</p>`;
    html += `<ul style="list-style: none; padding-left: 0; margin-top:2px;">`;
    for (const c of notInCrm) html += `<li>${c.name} — ${c.email}</li>`;
    html += `</ul>`;
  }

  // WhatsApp 1-to-1
  if (whatsapp.contacts.length > 0) {
    html += `<p><strong>💬 WhatsApp (1-to-1)</strong></p>`;
    html += `<ul style="list-style: none; padding-left: 0;">`;
    for (const c of whatsapp.contacts) {
      html += `<li>${c.name} — ${formatWaLink(c.mobile)}</li>`;
    }
    html += `</ul>`;
  }

  // WhatsApp groups
  if (whatsapp.groups.length > 0) {
    html += `<p><strong>💬 WhatsApp (Groups)</strong></p>`;
    html += `<ul style="list-style: none; padding-left: 0;">`;
    for (const g of whatsapp.groups) html += `<li>${g}</li>`;
    html += `</ul>`;
  }

  // === PRIORITIES ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">🎯 PRIORITIES</h2>`;
  if (priorities.length === 0) {
    html += `<p style="color:#888;">No priorities set for today</p>`;
  } else {
    html += `<ul style="list-style: none; padding-left: 0;">`;
    for (const p of priorities) {
      const check = p.is_completed ? '☑' : '☐';
      html += `<li>${check} ${p.title}</li>`;
    }
    html += `</ul>`;
  }

  // === WEIGHT ===
  if (weight.length >= 2) {
    html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">⚖️ WEIGHT TRACKER</h2>`;
    html += `<table style="border-collapse: collapse; width: 100%;">`;
    html += `<tr style="background: #f5f5f5;"><th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date</th><th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Weight</th><th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Body Fat %</th></tr>`;
    for (const w of weight) {
      html += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDateShort(w.date)}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${w.weight_kg} kg</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${w.body_fat_pct}%</td></tr>`;
    }
    html += `</table>`;
  }

  // === 7 COMANDAMENTI ===
  html += `<hr style="margin: 30px 0; border: none; border-top: 2px solid #333;">`;
  html += `<h2>🔥 I 7 COMANDAMENTI</h2>`;
  html += `<ul style="list-style: none; padding-left: 0;">
<li>• Libero da porno</li>
<li>• Mangio da atleta</li>
<li>• Famiglia la mia priorità</li>
<li>• Mi alleno da professionista</li>
<li>• Chiudo al 100% prima di aprire</li>
<li>• Trovo gioia nel tempo con Katherine</li>
<li>• Focus in. Vita sociale in moderazione</li>
</ul>`;

  // === OPEN TODAY BUTTON ===
  const todayBaseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${process.env.PORT || 3001}`;
  const todayToken = process.env.TODAY_PAGE_TOKEN;
  if (todayToken) {
    html += `<div style="text-align: center; margin: 30px 0;">
      <a href="${todayBaseUrl}/today/${dateStr}?token=${todayToken}" style="display: inline-block; padding: 14px 28px; background: #5b9bf7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Open Today →</a>
    </div>`;
  }

  html += `</body></html>`;
  return html;
}

// ============ MAIN FUNCTION ============

export async function generateAndSendBriefing(dateStr = null) {
  const now = new Date();
  if (!dateStr) {
    // Use UK date
    dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD
  }

  console.log(`[Briefing] Generating evening briefing for ${dateStr}...`);

  // Gather all data in parallel
  const [events, completed, dueToday, createdToday, emailContacts, whatsapp, priorities, weight] = await Promise.all([
    fetchCalendarEvents(dateStr).catch(e => { console.error('[Briefing] Calendar error:', e.message); return []; }),
    fetchTodoistCompleted(dateStr).catch(e => { console.error('[Briefing] Todoist completed error:', e.message); return []; }),
    fetchTodoistFilter('today').catch(e => { console.error('[Briefing] Todoist today error:', e.message); return []; }),
    fetchTodoistFilter('created: today').catch(e => { console.error('[Briefing] Todoist created error:', e.message); return []; }),
    fetchEmailContactsFallback(dateStr).catch(e => { console.error('[Briefing] Email contacts error:', e.message); return []; }),
    fetchWhatsAppContacts(dateStr).catch(e => { console.error('[Briefing] WhatsApp error:', e.message); return { contacts: [], groups: [] }; }),
    fetchPriorities(dateStr).catch(e => { console.error('[Briefing] Priorities error:', e.message); return []; }),
    fetchWeight(dateStr).catch(e => { console.error('[Briefing] Weight error:', e.message); return []; }),
  ]);

  const data = { events, completed, dueToday, createdToday, emailContacts, whatsapp, priorities, weight };
  const htmlBody = buildHTML(dateStr, data);
  const dateFormatted = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const subject = `Evening Briefing — ${dateFormatted}`;

  // Insert email directly into Inbox (no SMTP send = no duplicate Sent copy)
  const jmap = new JMAPClient(process.env.FASTMAIL_USERNAME, process.env.FASTMAIL_API_TOKEN);
  await jmap.init();
  const inboxId = await jmap.getInboxId();

  const email = {
    mailboxIds: { [inboxId]: true },
    from: [{ email: 'briefing@cimminelli.com', name: 'Evening Briefing' }],
    to: [{ email: RECIPIENT_EMAIL, name: RECIPIENT_NAME }],
    subject,
    receivedAt: new Date().toISOString(),
    bodyValues: {
      text: { value: `${subject} - View HTML version`, charset: 'utf-8' },
      html: { value: htmlBody, charset: 'utf-8' },
    },
    textBody: [{ partId: 'text', type: 'text/plain' }],
    htmlBody: [{ partId: 'html', type: 'text/html' }],
    keywords: { $seen: true, $crm_done: true }, // Mark as read + prevent CRM sync pickup
  };

  const responses = await jmap.request([
    ['Email/set', {
      accountId: jmap.accountId,
      create: { briefing: email },
    }, 'create'],
  ]);

  const emailResult = responses[0][1];
  if (emailResult.notCreated?.briefing) {
    throw new Error(`Failed to create briefing email: ${JSON.stringify(emailResult.notCreated.briefing)}`);
  }

  const emailId = emailResult.created?.briefing?.id;
  console.log(`[Briefing] Evening briefing inserted in Inbox: ${emailId}`);
  return { success: true, emailId, date: dateStr };
}

// ============ SCHEDULER ============

async function wasBriefingSentToday(ukDate) {
  const { data } = await supabase
    .from('sync_state')
    .select('ctag')
    .eq('id', 'evening_briefing')
    .single();
  return data?.ctag === ukDate;
}

async function markBriefingSent(ukDate) {
  await supabase
    .from('sync_state')
    .upsert({ id: 'evening_briefing', ctag: ukDate, last_sync_date: new Date().toISOString() }, { onConflict: 'id' });
}

export function startBriefingScheduler() {
  // Check every minute if it's 19:15 UK time
  setInterval(async () => {
    try {
      const ukTime = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });
      const match = ukTime.match(/(\d{2}):(\d{2})/);
      if (!match) return;
      const [, hour, minute] = match;
      const ukDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

      if (hour === '19' && minute === '15') {
        const alreadySent = await wasBriefingSentToday(ukDate);
        if (alreadySent) return;
        await markBriefingSent(ukDate); // Mark BEFORE sending to prevent race
        await generateAndSendBriefing(ukDate);
      }
    } catch (e) {
      console.error('[Briefing] Scheduler error:', e.message);
    }
  }, 60 * 1000);

  console.log('[Briefing] Scheduler started — will send at 19:00 UK time daily');
}

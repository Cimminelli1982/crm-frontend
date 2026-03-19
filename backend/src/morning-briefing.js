// Morning Briefing - Generates and sends daily morning summary at 06:00 UK time
// Forward-looking: what's ahead today

import { supabase } from './supabase.js';
import { fetchCalendarEvents, fetchTodoistFilter, formatTime, TODOIST_PROJECTS, LIVING_INTENTION_CALENDAR, PRIMARY_CALENDAR } from './evening-briefing.js';
import { JMAPClient } from './jmap.js';

const RECIPIENT_EMAIL = 'simone@cimminelli.com';
const RECIPIENT_NAME = 'Simone Cimminelli';

// ============ DATA GATHERING ============

async function fetchInboxCounts() {
  const { count: emailCount } = await supabase
    .from('command_center_inbox')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'email');

  const { count: whatsappCount } = await supabase
    .from('command_center_inbox')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'whatsapp');

  return { emailCount: emailCount || 0, whatsappCount: whatsappCount || 0 };
}

async function fetchKITDueCount() {
  const { count } = await supabase
    .from('mv_keep_in_touch')
    .select('contact_id', { count: 'exact', head: true })
    .lte('days_until_next', 0)
    .or('snoozed_until.is.null,snoozed_until.lte.' + new Date().toISOString());

  return count || 0;
}

async function fetchBirthdays(dateStr) {
  const mmdd = dateStr.slice(5); // "MM-DD"
  const { data } = await supabase
    .from('contacts')
    .select('first_name, last_name, birthday')
    .not('birthday', 'is', null);

  if (!data) return [];
  return data
    .filter(c => c.birthday && c.birthday.slice(5) === mmdd)
    .map(c => `${c.first_name || ''} ${c.last_name || ''}`.trim())
    .filter(Boolean);
}

// ============ HTML COMPOSITION ============

function buildMorningHTML(dateStr, data) {
  const { events, dueToday, overdue, inboxCounts, kitDueCount, birthdays } = data;
  const dateFormatted = new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">`;

  html += `<h1 style="margin-bottom: 4px;">Good Morning</h1>`;
  html += `<p style="color: #888; margin-top: 0;">${dateFormatted}</p>`;

  // === AGENDA ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">📅 AGENDA</h2>`;
  if (events.length === 0) {
    html += `<p style="color:#888;">No appointments today</p>`;
  } else {
    html += `<ul style="list-style: none; padding-left: 0;">`;
    for (const e of events) {
      html += `<li>${formatTime(e.start)} – ${formatTime(e.end)} &nbsp; ${e.summary}</li>`;
    }
    html += `</ul>`;
  }

  // === TASKS DUE TODAY + OVERDUE ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">⏳ TASKS</h2>`;

  if (overdue.length > 0) {
    html += `<p style="color: #e74c3c; font-weight: 600; margin-bottom: 4px;">Overdue (${overdue.length})</p>`;
    html += `<ul>`;
    for (const t of overdue) {
      const proj = TODOIST_PROJECTS[t.project_id] || 'Other';
      html += `<li>${t.content} <span style="color:#888;">(${proj})</span></li>`;
    }
    html += `</ul>`;
  }

  if (dueToday.length === 0) {
    html += `<p style="color:#888;">No tasks due today</p>`;
  } else {
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

  // === INBOX COUNTS ===
  html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">📥 INBOX</h2>`;
  html += `<ul style="list-style: none; padding-left: 0;">`;
  html += `<li>📧 ${inboxCounts.emailCount} email${inboxCounts.emailCount !== 1 ? 's' : ''} to process</li>`;
  html += `<li>💬 ${inboxCounts.whatsappCount} WhatsApp message${inboxCounts.whatsappCount !== 1 ? 's' : ''} to process</li>`;
  html += `<li>🤝 ${kitDueCount} contact${kitDueCount !== 1 ? 's' : ''} due for follow-up</li>`;
  html += `</ul>`;

  // === BIRTHDAYS ===
  if (birthdays.length > 0) {
    html += `<h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">🎂 BIRTHDAYS</h2>`;
    html += `<ul style="list-style: none; padding-left: 0;">`;
    for (const name of birthdays) {
      html += `<li>🎉 ${name}</li>`;
    }
    html += `</ul>`;
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

export async function generateAndSendMorningBriefing(dateStr = null) {
  const now = new Date();
  if (!dateStr) {
    dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  }

  console.log(`[MorningBriefing] Generating morning briefing for ${dateStr}...`);

  const [events, dueToday, overdue, inboxCounts, kitDueCount, birthdays] = await Promise.all([
    fetchCalendarEvents(dateStr).catch(e => { console.error('[MorningBriefing] Calendar error:', e.message); return []; }),
    fetchTodoistFilter('today').catch(e => { console.error('[MorningBriefing] Todoist today error:', e.message); return []; }),
    fetchTodoistFilter('overdue').catch(e => { console.error('[MorningBriefing] Todoist overdue error:', e.message); return []; }),
    fetchInboxCounts().catch(e => { console.error('[MorningBriefing] Inbox counts error:', e.message); return { emailCount: 0, whatsappCount: 0 }; }),
    fetchKITDueCount().catch(e => { console.error('[MorningBriefing] KIT error:', e.message); return 0; }),
    fetchBirthdays(dateStr).catch(e => { console.error('[MorningBriefing] Birthdays error:', e.message); return []; }),
  ]);

  const data = { events, dueToday, overdue, inboxCounts, kitDueCount, birthdays };
  const htmlBody = buildMorningHTML(dateStr, data);
  const dateFormatted = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const subject = `Morning Briefing — ${dateFormatted}`;

  const jmap = new JMAPClient(process.env.FASTMAIL_USERNAME, process.env.FASTMAIL_API_TOKEN);
  await jmap.init();
  const inboxId = await jmap.getInboxId();

  const email = {
    mailboxIds: { [inboxId]: true },
    from: [{ email: 'briefing@cimminelli.com', name: 'Morning Briefing' }],
    to: [{ email: RECIPIENT_EMAIL, name: RECIPIENT_NAME }],
    subject,
    receivedAt: new Date().toISOString(),
    bodyValues: {
      text: { value: `${subject} - View HTML version`, charset: 'utf-8' },
      html: { value: htmlBody, charset: 'utf-8' },
    },
    textBody: [{ partId: 'text', type: 'text/plain' }],
    htmlBody: [{ partId: 'html', type: 'text/html' }],
    keywords: { $seen: true, $crm_done: true },
  };

  const responses = await jmap.request([
    ['Email/set', {
      accountId: jmap.accountId,
      create: { briefing: email },
    }, 'create'],
  ]);

  const emailResult = responses[0][1];
  if (emailResult.notCreated?.briefing) {
    throw new Error(`Failed to create morning briefing: ${JSON.stringify(emailResult.notCreated.briefing)}`);
  }

  const emailId = emailResult.created?.briefing?.id;
  console.log(`[MorningBriefing] Morning briefing inserted in Inbox: ${emailId}`);
  return { success: true, emailId, date: dateStr };
}

// ============ SCHEDULER ============

async function wasMorningBriefingSentToday(ukDate) {
  const { data } = await supabase
    .from('sync_state')
    .select('ctag')
    .eq('id', 'morning_briefing')
    .single();
  return data?.ctag === ukDate;
}

async function markMorningBriefingSent(ukDate) {
  await supabase
    .from('sync_state')
    .upsert({ id: 'morning_briefing', ctag: ukDate, last_sync_date: new Date().toISOString() }, { onConflict: 'id' });
}

export function startMorningBriefingScheduler() {
  setInterval(async () => {
    try {
      const ukTime = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });
      const match = ukTime.match(/(\d{2}):(\d{2})/);
      if (!match) return;
      const [, hour, minute] = match;
      const ukDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

      if (hour === '06' && minute === '00') {
        const alreadySent = await wasMorningBriefingSentToday(ukDate);
        if (alreadySent) return;
        await markMorningBriefingSent(ukDate);
        await generateAndSendMorningBriefing(ukDate);
      }
    } catch (e) {
      console.error('[MorningBriefing] Scheduler error:', e.message);
    }
  }, 60 * 1000);

  console.log('[MorningBriefing] Scheduler started — will send at 06:00 UK time daily');
}

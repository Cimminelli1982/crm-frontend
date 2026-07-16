// Receptionist tool registry.
//
// Each tool = an Anthropic tool schema + a handler. Handlers reuse the backend's
// OWN existing REST endpoints via internal HTTP (127.0.0.1:PORT) so we don't
// duplicate logic, plus direct Supabase / helper functions for the rest.
//
// deps injected by receptionist.js: { supabase, braveWebSearch, apiBase }
//   apiBase = `http://127.0.0.1:${PORT}` (this same process)
//
// Add a new command by appending to TOOLS (schema) and HANDLERS (impl).

async function api(apiBase, path, { method = 'GET', body, query } = {}) {
  let url = `${apiBase}${path}`;
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(data?.error || data?.raw || `HTTP ${res.status} on ${path}`);
  }
  return data;
}

// UK day bounds (Simone is London-based) as ISO for calendar queries
function dayBoundsISO(dateStr) {
  // dateStr: YYYY-MM-DD (assumed local UK). Fallback: today.
  const base = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : null;
  const d = base ? new Date(`${base}T00:00:00Z`) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

// ---------------------------------------------------------------------------
// Tool schemas (Anthropic format)
// ---------------------------------------------------------------------------
export const TOOLS = [
  {
    name: 'search_web',
    description:
      'Search the web (Brave). Use for /search-web or when the user asks to look something up online. Returns titles, URLs and snippets. Cite the links in your answer.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
        count: { type: 'integer', description: 'Number of results (default 5, max 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_task',
    description:
      'Create a task in Todoist (/create-task). Provide a clear content title. Optionally a due date in natural language (e.g. "domani", "next Friday 3pm"), description and priority (1=low..4=urgent). After creating, confirm to the user with the task title and due date.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Optional longer description' },
        due_string: { type: 'string', description: 'Optional natural-language due date (Todoist syntax)' },
        priority: { type: 'integer', description: '1 (low) to 4 (urgent). Default 1.' },
      },
      required: ['content'],
    },
  },
  {
    name: 'list_tasks',
    description:
      'List current open Todoist tasks (/list-tasks). Optionally filter client-side by a keyword. Present them concisely with due dates.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Optional keyword to filter task titles' },
      },
    },
  },
  {
    name: 'complete_task',
    description:
      'Mark a Todoist task complete (/complete-task) by its task id. If you do not have the id, call list_tasks first to find it, then confirm with the user before completing.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The Todoist task id to close' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'whats_in_calendar',
    description:
      "Check the calendar for a given day and report events with times (/what-in-calendar). Use to assess availability for a proposed meeting. date is YYYY-MM-DD; if omitted, today.",
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Day to check, YYYY-MM-DD (UK time). Omit for today.' },
      },
    },
  },
  {
    name: 'create_event',
    description:
      'Create a Google Calendar event (/create-event or /create-event-invite). Provide title and ISO start/end datetimes. To invite guests, pass their emails in attendees (that is /create-event-invite). Timezone defaults to Europe/London. Confirm the created event back to the user.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startDate: { type: 'string', description: 'ISO 8601 start datetime, e.g. 2026-07-20T10:00:00' },
        endDate: { type: 'string', description: 'ISO 8601 end datetime' },
        description: { type: 'string' },
        location: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Guest emails to invite (optional)' },
        useGoogleMeet: { type: 'boolean', description: 'Add a Google Meet link' },
        timezone: { type: 'string', description: 'IANA tz, default Europe/London' },
      },
      required: ['title', 'startDate'],
    },
  },
  {
    name: 'create_contact',
    description:
      'Create a new contact in the CRM using the smart-create agent (/create-contact). REQUIRES first_name, category, and email OR mobile. The smart agent auto-enriches (Apollo/web) and de-duplicates, so you do NOT need company/city/tags. Ask the user for any missing required field before calling. Report the created contact and any duplicate warning.',
    input_schema: {
      type: 'object',
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string', description: 'Email (required if no mobile)' },
        mobile: { type: 'string', description: 'Phone/WhatsApp number (required if no email)' },
        category: {
          type: 'string',
          description:
            'One of: Friend and Family, Founder, Professional Investor, Manager, Advisor, Supplier, Media, Student, Institution, Other',
        },
        score: { type: 'integer', description: '1-5 (optional)' },
        keep_in_touch: {
          type: 'string',
          description: 'Not Set | Monthly | Quarterly | Twice per Year | Once per Year | Weekly (optional)',
        },
      },
      required: ['first_name', 'category'],
    },
  },
  {
    name: 'send_email_reply',
    description:
      'Send an email reply (/reply-to-send or /reply-all-send). Requires the Email Inbox ID (from the [CRM Context] "Email Inbox ID") and the reply body text. Set reply_all=true for reply-all, false for reply-to-sender. Only call this after the user explicitly asked to SEND (not just draft). Confirm sent.',
    input_schema: {
      type: 'object',
      properties: {
        email_id: { type: 'string', description: 'command_center_inbox id (Email Inbox ID from context)' },
        text_body: { type: 'string', description: 'The reply message body (plain text)' },
        reply_all: { type: 'boolean', description: 'true = reply all, false = reply to sender only' },
      },
      required: ['email_id', 'text_body'],
    },
  },
  {
    name: 'accept_invitation',
    description:
      'Accept a Google Calendar invitation (/accept-invitation). Requires the calendar event id. Optionally set status to declined or tentative. Confirm the response.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Google Calendar event id' },
        calendar_id: { type: 'string', description: 'Optional calendar id' },
        status: { type: 'string', description: "accepted | declined | tentative (default accepted)" },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'send_whatsapp',
    description:
      'Send a WhatsApp message (/comm-whatsapp). Provide the message text and either a phone number (E.164) or a chat_id (for groups, from the [CRM Context] WhatsApp field). Only send after the user is explicit. Confirm sent.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        phone: { type: 'string', description: 'Phone number in E.164 (e.g. +447...)' },
        chat_id: { type: 'string', description: 'WhatsApp chat/group id (alternative to phone)' },
      },
      required: ['message'],
    },
  },
  {
    name: 'create_deal',
    description:
      'Create a deal in the pipeline (/create-deal-from-message or /create-deal-from-input). Extract the details from the message/context. opportunity is the startup/deal name. Optionally link a contact with a relationship. Confirm the created deal.',
    input_schema: {
      type: 'object',
      properties: {
        opportunity: { type: 'string', description: 'Deal / startup name' },
        category: {
          type: 'string',
          description: 'Inbox | Startup | Investment | Fund | Partnership | Real Estate | Private Debt | Private Equity | Other',
        },
        stage: { type: 'string', description: 'Default Lead. One of: Lead, Evaluating, Qualified, Negotiation, Closing, Invested, Passed, Monitoring' },
        description: { type: 'string' },
        contact_id: { type: 'string', description: 'Optional contact to link (uuid)' },
        relationship: { type: 'string', description: 'introducer | co-investor | advisor | proposer | other (if contact_id given)' },
      },
      required: ['opportunity'],
    },
  },
  {
    name: 'change_deal_stage',
    description: 'Update the stage of an existing deal (/change-deal-stage). Requires deal_id and the new stage. Confirm the change.',
    input_schema: {
      type: 'object',
      properties: {
        deal_id: { type: 'string' },
        stage: { type: 'string', description: 'Lead | Evaluating | Qualified | Negotiation | Closing | Invested | Monitoring | Passed | Closed Won | Closed Lost' },
      },
      required: ['deal_id', 'stage'],
    },
  },
  {
    name: 'list_related_deals',
    description: 'List deals linked to a contact (/list-related-deals). Requires contact_id (from [CRM Context] Contact ID).',
    input_schema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string' },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'register_decision',
    description:
      'Log a decision (/register-decision). Provide the decision detail, a category and a confidence 1-5. Optionally link a contact. Confirm it was logged.',
    input_schema: {
      type: 'object',
      properties: {
        detail: { type: 'string', description: 'What was decided' },
        category: { type: 'string', description: 'Investment | Team | Time | Money | Family' },
        confidence: { type: 'integer', description: '1 (low) to 5 (high)' },
        notes: { type: 'string' },
        contact_id: { type: 'string', description: 'Optional contact to link (uuid)' },
      },
      required: ['detail', 'category', 'confidence'],
    },
  },
  {
    name: 'associate_task',
    description:
      'Associate an existing task with a contact and/or a deal (/associate-task). Requires the Todoist task id (from list_tasks) and at least one of contact_id / deal_id. Confirm the link.',
    input_schema: {
      type: 'object',
      properties: {
        todoist_task_id: { type: 'string' },
        contact_id: { type: 'string' },
        deal_id: { type: 'string' },
      },
      required: ['todoist_task_id'],
    },
  },
  {
    name: 'track_intro',
    description:
      'Log a promised introduction between two contacts (/track-intro-promised). Provide the two contact ids, the tool used and a category. Sets status = Promised. Confirm it was logged.',
    input_schema: {
      type: 'object',
      properties: {
        contact_a_id: { type: 'string' },
        contact_b_id: { type: 'string' },
        tool: { type: 'string', description: 'email | whatsapp | in person | other (default other)' },
        category: { type: 'string', description: 'Karma Points | Dealflow | Portfolio Company (default Karma Points)' },
        notes: { type: 'string' },
      },
      required: ['contact_a_id', 'contact_b_id'],
    },
  },
  {
    name: 'search_news',
    description: 'Search recent news about a topic/person/company (/search-news). Uses web search. Summarize with dates and cite links.',
    input_schema: {
      type: 'object',
      properties: { topic: { type: 'string' }, count: { type: 'integer' } },
      required: ['topic'],
    },
  },
  {
    name: 'search_flights',
    description: 'Search for flights (/search-flights) via web search. Provide origin, destination and date. Prefer direct flights. Present options with links.',
    input_schema: {
      type: 'object',
      properties: {
        origin: { type: 'string' },
        destination: { type: 'string' },
        date: { type: 'string', description: 'Travel date (natural language ok)' },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'search_amazon',
    description: 'Search Amazon UK for a product (/search-amazon) via web search restricted to amazon.co.uk. Present options with links.',
    input_schema: {
      type: 'object',
      properties: { product: { type: 'string' }, count: { type: 'integer' } },
      required: ['product'],
    },
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
const HANDLERS = {
  async search_web(input, { braveWebSearch }) {
    const results = await braveWebSearch(input.query, Math.min(input.count || 5, 10));
    return { results };
  },

  async create_task(input, { apiBase }) {
    const { task } = await api(apiBase, '/todoist/tasks', {
      method: 'POST',
      body: {
        content: input.content,
        description: input.description,
        due_string: input.due_string,
        priority: input.priority || 1,
      },
    });
    return { created: true, task: { id: task?.id, content: task?.content, due: task?.due } };
  },

  async list_tasks(input, { apiBase }) {
    const { tasks } = await api(apiBase, '/todoist/tasks');
    let list = Array.isArray(tasks) ? tasks : [];
    if (input.keyword) {
      const k = input.keyword.toLowerCase();
      list = list.filter(t => (t.content || '').toLowerCase().includes(k));
    }
    return {
      count: list.length,
      tasks: list.slice(0, 50).map(t => ({ id: t.id, content: t.content, due: t.due?.string || null, priority: t.priority })),
    };
  },

  async complete_task(input, { apiBase }) {
    await api(apiBase, `/todoist/tasks/${input.task_id}/close`, { method: 'POST' });
    return { completed: true, task_id: input.task_id };
  },

  async whats_in_calendar(input, { apiBase }) {
    const { timeMin, timeMax } = dayBoundsISO(input.date);
    const data = await api(apiBase, '/google-calendar/events', { query: { timeMin, timeMax, maxResults: 50 } });
    const events = (data.events || []).map(e => ({
      title: e.summary || e.title || '(no title)',
      start: e.start?.dateTime || e.start?.date || e.start,
      end: e.end?.dateTime || e.end?.date || e.end,
      location: e.location || null,
    }));
    return { date: input.date || 'today', count: events.length, events };
  },

  async create_event(input, { apiBase }) {
    const data = await api(apiBase, '/google-calendar/create-event', {
      method: 'POST',
      body: {
        title: input.title,
        description: input.description,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate || input.startDate,
        attendees: input.attendees || [],
        useGoogleMeet: input.useGoogleMeet || false,
        timezone: input.timezone || 'Europe/London',
        sendUpdates: (input.attendees && input.attendees.length) ? 'all' : 'none',
      },
    });
    return { created: true, event: data.event || data.result || data };
  },

  async create_contact(input, { apiBase }) {
    if (!input.email && !input.mobile) {
      return { error: 'Serve almeno una email o un numero di telefono per creare il contatto.' };
    }
    // smart-create runs its own agentic enrichment + dedup loop and returns a summary
    const data = await api(apiBase, '/contact/smart-create', {
      method: 'POST',
      body: {
        first_name: input.first_name,
        last_name: input.last_name || '',
        email: input.email,
        mobile: input.mobile,
        category: input.category,
        score: input.score,
        keep_in_touch: input.keep_in_touch,
      },
    });
    return data;
  },

  async send_email_reply(input, { apiBase }) {
    const data = await api(apiBase, '/reply', {
      method: 'POST',
      body: { emailId: input.email_id, textBody: input.text_body, replyAll: !!input.reply_all },
    });
    return { sent: true, replyAll: !!input.reply_all, result: data };
  },

  async accept_invitation(input, { apiBase }) {
    const status = input.status || 'accepted';
    const data = await api(apiBase, '/google-calendar/respond-to-event', {
      method: 'POST',
      body: { eventId: input.event_id, calendarId: input.calendar_id, status },
    });
    return { responded: status, result: data };
  },

  async send_whatsapp(input, { apiBase }) {
    if (!input.phone && !input.chat_id) return { error: 'Serve un numero (phone) o un chat_id.' };
    const data = await api(apiBase, '/whatsapp/send', {
      method: 'POST',
      body: { phone: input.phone, chat_id: input.chat_id, message: input.message },
    });
    return { sent: true, result: data };
  },

  async create_deal(input, { supabase }) {
    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        opportunity: input.opportunity,
        deal_name: input.opportunity,
        category: input.category || 'Inbox',
        stage: input.stage || 'Lead',
        description: input.description || null,
      })
      .select('deal_id, opportunity, stage, category')
      .single();
    if (error) throw new Error(error.message);
    if (input.contact_id) {
      const { error: linkErr } = await supabase
        .from('deals_contacts')
        .insert({ deal_id: deal.deal_id, contact_id: input.contact_id, relationship: input.relationship || 'other' });
      if (linkErr) return { created: true, deal, link_warning: linkErr.message };
    }
    return { created: true, deal };
  },

  async change_deal_stage(input, { supabase }) {
    const { data, error } = await supabase
      .from('deals')
      .update({ stage: input.stage })
      .eq('deal_id', input.deal_id)
      .select('deal_id, opportunity, stage')
      .single();
    if (error) throw new Error(error.message);
    return { updated: true, deal: data };
  },

  async list_related_deals(input, { supabase }) {
    const { data, error } = await supabase
      .from('deals_contacts')
      .select('relationship, deals(deal_id, opportunity, stage, category)')
      .eq('contact_id', input.contact_id);
    if (error) throw new Error(error.message);
    const deals = (data || []).map(r => ({ ...(r.deals || {}), relationship: r.relationship }));
    return { count: deals.length, deals };
  },

  async register_decision(input, { supabase }) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: dec, error } = await supabase
      .from('decisions')
      .insert({
        decision_date: today,
        detail: input.detail,
        category: input.category,
        confidence: input.confidence,
        notes: input.notes || null,
      })
      .select('decision_id, detail, category, confidence')
      .single();
    if (error) throw new Error(error.message);
    if (input.contact_id) {
      await supabase.from('decision_contacts').insert({ decision_id: dec.decision_id, contact_id: input.contact_id });
    }
    return { logged: true, decision: dec };
  },

  async associate_task(input, { supabase }) {
    const { data: task, error: tErr } = await supabase
      .from('tasks')
      .select('task_id, content')
      .eq('todoist_id', String(input.todoist_task_id))
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) return { error: 'Task non trovato in Supabase (forse non ancora sincronizzato). Riprova dopo la sync Todoist.' };
    if (!input.contact_id && !input.deal_id) return { error: 'Serve almeno un contact_id o un deal_id da associare.' };
    const links = [];
    if (input.contact_id) {
      const { error } = await supabase.from('task_contacts').insert({ task_id: task.task_id, contact_id: input.contact_id });
      links.push(error ? `contact: ${error.message}` : 'contatto collegato');
    }
    if (input.deal_id) {
      const { error } = await supabase.from('task_deals').insert({ task_id: task.task_id, deal_id: input.deal_id });
      links.push(error ? `deal: ${error.message}` : 'deal collegato');
    }
    return { associated: true, task: task.content, links };
  },

  async track_intro(input, { supabase }) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: intro, error } = await supabase
      .from('introductions')
      .insert({
        introduction_date: today,
        introduction_tool: input.tool || 'other',
        category: input.category || 'Karma Points',
        text: input.notes || null,
        status: 'Promised',
      })
      .select('introduction_id')
      .single();
    if (error) throw new Error(error.message);
    const rows = [
      { introduction_id: intro.introduction_id, contact_id: input.contact_a_id, role: 'introducee' },
      { introduction_id: intro.introduction_id, contact_id: input.contact_b_id, role: 'introducee' },
    ];
    const { error: linkErr } = await supabase.from('introduction_contacts').insert(rows);
    if (linkErr) return { created: true, introduction_id: intro.introduction_id, link_warning: linkErr.message };
    return { created: true, status: 'Promised', introduction_id: intro.introduction_id };
  },

  async search_news(input, { braveWebSearch }) {
    const results = await braveWebSearch(`${input.topic} ultime notizie news`, Math.min(input.count || 6, 10));
    return { via: 'web', results };
  },

  async search_flights(input, { braveWebSearch }) {
    const q = `voli diretti da ${input.origin} a ${input.destination}${input.date ? ' ' + input.date : ''} prezzi`;
    const results = await braveWebSearch(q, 8);
    return { via: 'web', query: q, results };
  },

  async search_amazon(input, { braveWebSearch }) {
    const results = await braveWebSearch(`${input.product} site:amazon.co.uk`, Math.min(input.count || 6, 10));
    return { via: 'web', results };
  },
};

export async function executeReceptionistTool(name, input, deps) {
  const handler = HANDLERS[name];
  if (!handler) throw new Error(`Unknown receptionist tool: ${name}`);
  return handler(input, deps);
}

export function getReceptionistTools() {
  return TOOLS;
}

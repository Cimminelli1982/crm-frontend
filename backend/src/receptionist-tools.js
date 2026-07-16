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
};

export async function executeReceptionistTool(name, input, deps) {
  const handler = HANDLERS[name];
  if (!handler) throw new Error(`Unknown receptionist tool: ${name}`);
  return handler(input, deps);
}

export function getReceptionistTools() {
  return TOOLS;
}

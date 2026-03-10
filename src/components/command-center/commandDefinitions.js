import { FaUser, FaHandshake, FaDollarSign, FaCalendarAlt, FaTasks, FaStickyNote, FaEnvelope, FaWhatsapp, FaGavel } from 'react-icons/fa';

// Parse calendar event details from email subject like:
// "Invitation: Riunione Zoom di Marco Margotti @ Mon Mar 09, 2026 10:00 - 11:00 AM (PDT - America/Los_Angeles)"
function parseCalendarSubject(subject) {
  if (!subject) return {};
  const result = {};

  // Extract title: everything between "Invitation: " (or start) and " @ "
  const titleMatch = subject.match(/(?:Invitation:\s*|Accepted:\s*|Declined:\s*|Updated:\s*)?(.+?)\s*@\s*/);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // Extract date: pattern like "Mon Mar 09, 2026" or "Tue Jan 15, 2025"
  const dateMatch = subject.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/);
  if (dateMatch) {
    result.date = `${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`;
  }

  // Extract times: "10:00 - 11:00 AM" or "10:00 AM - 11:00 AM" or "2:30 - 3:30 PM"
  const timeMatch = subject.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
  if (timeMatch) {
    const ampm = timeMatch[3];
    // Check if start time has its own AM/PM
    const startAmpmMatch = subject.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-/i);
    if (startAmpmMatch) {
      result.startTime = `${startAmpmMatch[1]} ${startAmpmMatch[2]}`;
    } else {
      result.startTime = `${timeMatch[1]} ${ampm}`;
    }
    result.endTime = `${timeMatch[2]} ${ampm}`;
  }

  return result;
}

const COMMAND_CATEGORIES = [
  {
    id: 'crm',
    label: 'CRM',
    color: '#3B82F6',
    icon: FaUser,
    actions: [
      {
        id: 'new-contact',
        label: 'Nuovo contatto',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Aggiungere nuovo contatto al CRM', '',
            `Contatto: ${ctx.contactName || '[nome e cognome]'}`,
            'Categoria: [Friend and Family, Founder, Professional Investor, Manager, Advisor, Supplier, Media, Student, Other]',
            'Citta: [specificare]',
            'Tags: [specificare, separati da virgola]',
            'Score: [1-5]',
            'Keep in touch: [Not Set, Monthly, Quarterly, Twice per Year, Once per Year, Weekly]',
            'Auguri Easter: [whatsapp standard, email standard, no wishes]',
            'Auguri Christmas: [whatsapp standard, email standard, no wishes]',
          ];
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/crm-operations.md sezione 13 (workflow completo)',
            '2. Esegui ogni step nell\'ordine indicato',
            '3. Dopo l\'ultimo step, VERIFICA OBBLIGATORIA (sezione 14)',
            '4. Conferma SOLO dopo verifica con risultati GET');
          return lines.join('\n');
        },
      },
      {
        id: 'search-contact',
        label: 'Cerca contatto',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Cercare contatto nel CRM', '',
            `Cerca: ${ctx.contactName || '[nome, email o telefono]'}`,
          ];
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/crm-operations.md sezione 10',
            '2. Cerca per nome, email e telefono',
            '3. Mostra risultati con dettagli principali');
          return lines.join('\n');
        },
      },
      {
        id: 'update-contact',
        label: 'Aggiorna contatto',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Aggiornare contatto esistente nel CRM', '',
            `Contatto: ${ctx.contactName || '[nome]'}`,
          ];
          if (ctx.contactId) lines.push(`Contact ID: ${ctx.contactId}`);
          lines.push(
            'Campi da aggiornare: [specificare campo e nuovo valore]',
          );
          if (ctx.contactEmail) lines.push(`Email attuale: ${ctx.contactEmail}`);
          if (ctx.contactPhone) lines.push(`Telefono attuale: ${ctx.contactPhone}`);
          if (ctx.contactCompany) lines.push(`Azienda attuale: ${ctx.contactCompany}`);
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/crm-operations.md sezione 9',
            '2. Aggiorna solo i campi specificati',
            '3. VERIFICA OBBLIGATORIA: fai GET dopo UPDATE per confermare');
          return lines.join('\n');
        },
      },
      {
        id: 'full-card',
        label: 'Scheda completa',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Mostra scheda completa del contatto', '',
            `Contatto: ${ctx.contactName || '[nome]'}`,
          ];
          if (ctx.contactId) lines.push(`Contact ID: ${ctx.contactId}`);
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/crm-operations.md sezione 11',
            '2. Mostra TUTTI i dettagli: info, emails, mobiles, companies, tags, cities, KIT, interactions recenti');
          return lines.join('\n');
        },
      },
    ],
  },
  {
    id: 'intro',
    label: 'Intro',
    color: '#EC4899',
    icon: FaHandshake,
    actions: [
      {
        id: 'track-intro-promised',
        label: 'Track intro promised',
        directAction: 'track-intro-promised',
      },
    ],
  },
  {
    id: 'deal',
    label: 'Deal',
    color: '#10B981',
    icon: FaDollarSign,
    actions: [
      {
        id: 'new-deal',
        label: 'Nuovo deal',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Creare nuovo deal nel CRM', '',
            'Opportunity: [nome startup/opportunity]',
            'Deal name: [opzionale]',
            'Categoria: [Inbox, Startup, Investment, Fund, Partnership, Real Estate, Private Debt, Private Equity, Other]',
            'Stage: [Lead, Evaluating, Qualified, Closing]',
            'Source: [Not Set, Cold Contacting, Introduction]',
            'Importo: [opzionale]',
            'Valuta: [opzionale]',
            'Descrizione: [opzionale]',
            'Contatti collegati: [nomi e ruoli]',
          ];
          if (ctx.contactName) lines.push(`Contatto corrente: ${ctx.contactName}`);
          if (ctx.dealName) lines.push(`Deal corrente: ${ctx.dealName}`);
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/deals.md',
            '2. Crea il deal e collega i contatti',
            '3. VERIFICA: conferma creazione con GET');
          return lines.join('\n');
        },
      },
      {
        id: 'update-deal-stage',
        label: 'Aggiorna stage',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Aggiornare stage del deal', '',
            `Deal: ${ctx.dealName || '[nome deal]'}`,
            'Nuovo stage: [Lead, Evaluating, Qualified, Closing, Negotiation, Invested, Closed Won, Monitoring, Closed Lost, Passed]',
          ];
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/deals.md',
            '2. Aggiorna stage del deal',
            '3. VERIFICA: conferma aggiornamento');
          return lines.join('\n');
        },
      },
      {
        id: 'extract-deal-pdf',
        label: 'Estrai da PDF',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Estrarre informazioni deal da documento allegato', '',
            'Documento: [nome file o link]',
          ];
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/deal-extraction.md',
            '2. Analizza il documento e estrai i dati del deal',
            '3. Proponi la creazione del deal con i dati estratti');
          return lines.join('\n');
        },
      },
    ],
  },
  {
    id: 'calendar',
    label: 'Cal',
    color: '#F59E0B',
    icon: FaCalendarAlt,
    actions: [
      {
        id: 'what-in-calendar',
        label: 'What in my calendar',
        directAction: 'what-in-calendar',
      },
      {
        id: 'create-event-no-guests',
        label: 'Create event (no invite)',
        directAction: 'create-event',
      },
      {
        id: 'create-event-with-guests',
        label: 'Create event (invite guests)',
        directAction: 'create-event-invite',
      },
      {
        id: 'free-slots',
        label: 'Free slots for meeting',
        directAction: 'free-slots',
      },
      {
        id: 'accept-invitation',
        label: 'Accept invitation',
        directAction: 'accept-invitation',
      },
    ],
  },
  {
    id: 'task',
    label: 'Task',
    color: '#6366F1',
    icon: FaTasks,
    actions: [
      {
        id: 'create-task',
        label: 'Create task',
        directAction: 'create-task',
      },
      {
        id: 'associate-task',
        label: 'Associate task',
        directAction: 'associate-task',
      },
      {
        id: 'list-tasks',
        label: 'List associated tasks',
        directAction: 'list-tasks',
      },
      {
        id: 'complete-task',
        label: 'Complete task',
        directAction: 'complete-task',
      },
    ],
  },
  {
    id: 'note',
    label: 'Note',
    color: '#F97316',
    icon: FaStickyNote,
    actions: [
      {
        id: 'create-note',
        label: 'Crea nota',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Creare nuova nota nel CRM', '',
            'Titolo: [specificare]',
            'Contenuto: [specificare]',
          ];
          if (ctx.contactName) lines.push(`Contatto collegato: ${ctx.contactName}`);
          if (ctx.contactId) lines.push(`Contact ID: ${ctx.contactId}`);
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/notes.md',
            '2. Crea la nota e collega al contatto se specificato',
            '3. VERIFICA: conferma creazione');
          return lines.join('\n');
        },
      },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    color: '#8B5CF6',
    icon: FaEnvelope,
    actions: [
      {
        id: 'email-archive',
        label: '✅ Archive',
        directAction: 'archive',
      },
      {
        id: 'email-waitinginput',
        label: '👀 Waiting Input',
        directAction: 'waiting',
      },
      {
        id: 'email-needactions',
        label: '❗ Need Actions',
        directAction: 'actions',
      },
      {
        id: 'reply-all-draft',
        label: 'Reply All (draft)',
        buildPrompt: () => '/reply-all-draft ',
      },
      {
        id: 'reply-all-send',
        label: 'Reply All (send)',
        buildPrompt: () => '/reply-all-send ',
      },
      {
        id: 'reply-to-draft',
        label: 'Reply (draft)',
        buildPrompt: () => '/reply-to-draft ',
      },
      {
        id: 'reply-to-send',
        label: 'Reply (send)',
        buildPrompt: () => '/reply-to-send ',
      },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WA',
    color: '#25D366',
    icon: FaWhatsapp,
    actions: [
      {
        id: 'send-whatsapp',
        label: 'Invia messaggio',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Inviare messaggio WhatsApp', '',
            `A: ${ctx.contactName || '[nome contatto]'}`,
          ];
          if (ctx.contactPhone) lines.push(`Telefono: ${ctx.contactPhone}`);
          lines.push('Messaggio: [specificare contenuto]');
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/whatsapp.md',
            '2. Trova il numero di telefono del contatto se non specificato',
            '3. Invia il messaggio via WhatsApp',
            '4. VERIFICA: conferma invio');
          return lines.join('\n');
        },
      },
      {
        id: 'find-phone',
        label: 'Trova numero',
        buildPrompt: (ctx) => {
          const lines = [
            'Nuova richiesta da Simone', '',
            'Richiesta: Trovare numero di telefono del contatto', '',
            `Contatto: ${ctx.contactName || '[nome]'}`,
          ];
          if (ctx.contactId) lines.push(`Contact ID: ${ctx.contactId}`);
          if (ctx.whatsappChat) lines.push(`Chat WhatsApp: ${ctx.whatsappChat}`);
          const ctxParts = buildContextParts(ctx);
          if (ctxParts.length) lines.push('', `Contesto CRM: ${ctxParts.join(' | ')}`);
          lines.push('', 'ISTRUZIONI PER BARBARA:',
            '1. Leggi skills/whatsapp.md sezione 14',
            '2. Cerca numero nella tabella contact_mobiles e nelle chat WhatsApp',
            '3. Mostra tutti i numeri trovati');
          return lines.join('\n');
        },
      },
    ],
  },
  {
    id: 'decision',
    label: 'Decision',
    color: '#EF4444',
    icon: FaGavel,
    actions: [
      {
        id: 'register-decision',
        label: 'Registra decisione',
        directAction: 'register-decision',
      },
    ],
  },
];

// Helper to format email contacts list for prompts
function formatEmailContacts(ctx) {
  if (!ctx.emailContacts || ctx.emailContacts.length === 0) return null;
  const entries = ctx.emailContacts
    .map(c => {
      const name = c.name || `${c.contact?.first_name || ''} ${c.contact?.last_name || ''}`.trim();
      const id = c.contact?.contact_id;
      const email = c.email || null;
      const parts = [name];
      if (email) parts.push(email);
      if (id) parts.push(id);
      return parts.join(' | ');
    })
    .filter(Boolean);
  return entries.length > 0 ? `Email contacts:\n${entries.map(e => `- ${e}`).join('\n')}` : null;
}

// Helper to build context parts for prompts
function buildContextParts(ctx) {
  const parts = [];
  if (ctx.contextType) parts.push(`Tab: ${ctx.contextType}`);
  if (ctx.whatsappChat) parts.push(`WhatsApp: ${ctx.whatsappChat}`);
  if (ctx.emailSubject) parts.push(`Email: ${ctx.emailSubject}`);
  if (ctx.emailInboxId) parts.push(`Inbox ID: ${ctx.emailInboxId}`);
  if (ctx.calendarEvent) parts.push(`Calendar: ${ctx.calendarEvent}`);
  if (ctx.dealName) parts.push(`Deal: ${ctx.dealName}`);
  if (ctx.contactId) parts.push(`Contact ID: ${ctx.contactId}`);
  return parts;
}

// Only show enabled categories — re-enable one at a time as we rethink each
const ENABLED_CATEGORIES = ['email', 'calendar', 'task', 'decision', 'intro'];
const enabledSet = new Set(ENABLED_CATEGORIES);
const filtered = COMMAND_CATEGORIES.filter(c => enabledSet.has(c.id));
filtered.sort((a, b) => ENABLED_CATEGORIES.indexOf(a.id) - ENABLED_CATEGORIES.indexOf(b.id));
export default filtered;

# CRM Documentation

## Data Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│  0. ARCHITECTURE.md         Stack, hosting, project structure  │
├────────────────────────────────────────────────────────────────┤
│  1. DATA_INGESTION.md       Railway backends → inbox staging   │
├────────────────────────────────────────────────────────────────┤
│  2. DATA_INTEGRITY.md       Trigger → check participants       │
├────────────────────────────────────────────────────────────────┤
│  3. DATA_CLEANING.md        User resolves issues (Add/Hold/Spam)│
├────────────────────────────────────────────────────────────────┤
│  4. done-processing-flow.md User clicks Done → final CRM tables│
└────────────────────────────────────────────────────────────────┘
```

## Index

| # | File | What it covers |
|---|------|----------------|
| 0 | [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, system diagram, project structure, env vars |
| 1 | [DATA_INGESTION.md](./DATA_INGESTION.md) | How Email/WhatsApp/Calendar arrive in Supabase |
| 2 | [DATA_INTEGRITY.md](./DATA_INTEGRITY.md) | 8 validation checks + DataIntegrityTab UI |
| 3 | [DATA_CLEANING.md](./DATA_CLEANING.md) | Add, Hold, Spam flows for contacts & companies |
| 4 | [done-processing-flow.md](./done-processing-flow.md) | What happens when user clicks Done on inbox items |
| 5 | [LISTS.md](./LISTS.md) | Email lists — static & dynamic, filters, UI |
| 6 | [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) | Full database schema with all tables |
| 7 | [WHATSAPP_SENDING.md](./WHATSAPP_SENDING.md) | Baileys WhatsApp sending architecture |
| 8 | [WHATSAPP_ATTACHMENTS_IMPLEMENTATION.md](./WHATSAPP_ATTACHMENTS_IMPLEMENTATION.md) | WhatsApp attachment storage (download → Supabase Storage) |

### Archive / Legacy
| File | Note |
|------|------|
| [RIGHT_PANEL_REFACTOR_PROMPT.md](./RIGHT_PANEL_REFACTOR_PROMPT.md) | ✅ Completed — was the spec for the right panel refactor. Keep for reference. |
| [keep-in-touch-chat-implementation.md](./keep-in-touch-chat-implementation.md) | Partially outdated implementation notes for KIT chat tab. |

### Flagged for deletion
| File | Reason |
|------|--------|
| `airtable-schema.json` | Legacy Airtable schema from before Supabase migration. Zero current relevance. |
| `whatsapp-error-log-*.txt` | Raw debug log from Dec 2025. Contains PII (phone numbers, messages). Not documentation. |

## Quick Reference

### Main Tables

| Table | Purpose |
|-------|---------|
| `command_center_inbox` | Unified staging (email, whatsapp, calendar) |
| `data_integrity_inbox` | Issues found by automated checks |
| `contacts`, `companies`, `deals` | Core CRM entities |
| `interactions` | All interactions log (email, whatsapp, meeting, call, note) |
| `email_threads`, `emails`, `email_participants` | Processed email data |
| `chats`, `contact_chats` | Processed WhatsApp data |
| `keep_in_touch` | Follow-up reminders |
| `contacts_hold`, `companies_hold` | Entities pending decision |
| `emails_spam`, `domains_spam`, `whatsapp_spam` | Blocklists |

### Railway Services

| Service | Stack | Function |
|---------|-------|----------|
| `command-center-backend` | Node.js | Email sync (JMAP), Google Calendar, send, save-and-archive, AI chat |
| `crm-agent-service` | Python/FastAPI | WhatsApp webhook, WhatsApp save-and-archive, calendar dismiss |

# CRM Frontend - Claude Project Memory

## Come Avviare il Frontend

**IMPORTANTE: Usa SEMPRE questo comando per il nuovo CRM:**
```bash
PORT=3002 npm run new-crm:dev
```

**NON usare `npm start`** - quello avvia il vecchio CRM che fa redirect a `/contacts/interactions`.

URL: **http://localhost:3002/new-crm/command-center**

---

## Entity Relationship Overview

```
                                    ┌─────────────┐
                                    │    tags     │
                                    │  (593 rows) │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
      ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
      │ contact_tags │            │ company_tags │            │  deal_tags   │
      │ (2224 rows)  │            │  (561 rows)  │            │   (0 rows)   │
      └──────┬───────┘            └──────┬───────┘            └──────┬───────┘
             │                           │                           │
             ▼                           ▼                           ▼
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────┐
│       contacts         │◄──►│      companies         │◄──►│     deals      │
│     (2784 rows)        │    │     (2280 rows)        │    │   (18 rows)    │
│ ─────────────────────  │    │ ─────────────────────  │    │                │
│ contact_id (PK)        │    │ company_id (PK)        │    │ deal_id (PK)   │
│ first_name, last_name  │    │ name                   │    │ opportunity    │
│ profile_image_url      │    │ website, linkedin      │    │ stage, category│
│ description, job_role  │    │ description            │    │                │
│ last_interaction_at    │    │ category               │    │                │
└───────────┬────────────┘    └───────────┬────────────┘    └────────────────┘
            │                             │
            │  contact_companies (873)    │
            └─────────────►◄──────────────┘

                    │
    ┌───────────────┼───────────────┬───────────────────┐
    │               │               │                   │
    ▼               ▼               ▼                   ▼
┌─────────┐  ┌───────────┐  ┌──────────────┐  ┌────────────────┐
│contact_ │  │ contact_  │  │   contact_   │  │  keep_in_touch │
│ emails  │  │  mobiles  │  │    cities    │  │   (781 rows)   │
│(2526)   │  │  (1478)   │  │   (1547)     │  │                │
└─────────┘  └───────────┘  └──────────────┘  └────────────────┘


                    INTERACTIONS & COMMUNICATIONS
                    ─────────────────────────────

┌──────────────────────────────────────────────────────────────────────┐
│                      interactions (61599 rows)                        │
│  ───────────────────────────────────────────────────────────────────  │
│  interaction_id, contact_id (FK), interaction_type, direction         │
│  interaction_date, summary, email_thread_id (FK), chat_id (FK)        │
│                                                                       │
│  interaction_type: email, whatsapp, meeting, note, call, slack, sms   │
│  direction: sent, received, neutral, interactive                      │
└──────────────────────────────────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┬──────────────────┐
    │                               │                  │
    ▼                               ▼                  ▼
┌─────────────────┐         ┌─────────────┐    ┌───────────┐
│  email_threads  │         │    chats    │    │  meetings │
│  (3411 rows)    │         │ (795 rows)  │    │ (3 rows)  │
│  ─────────────  │         │  ─────────  │    │           │
│  email_thread_id│         │  id         │    │meeting_id │
│  thread_id      │         │  chat_name  │    │meeting_name│
│  subject        │         │ is_group    │    │meeting_date│
└────────┬────────┘         └──────┬──────┘    └─────┬─────┘
         │                         │                 │
         ▼                         ▼                 ▼
┌─────────────────┐         ┌─────────────┐   ┌────────────┐
│     emails      │         │contact_chats│   │meeting_    │
│  (5422 rows)    │         │ (2136 rows) │   │contacts (4)│
│  ─────────────  │         └─────────────┘   └────────────┘
│  email_id       │
│  gmail_id       │
│  subject, body  │
│  direction      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│email_participants│
│  (16303 rows)   │
│  ─────────────  │
│  email_id (FK)  │
│  contact_id (FK)│
│  participant_type│
└─────────────────┘


                    DATA INGESTION & CLEANING
                    ─────────────────────────

┌──────────────────────────────────────────────────────────────────────┐
│               command_center_inbox (42 rows)                          │
│  ───────────────────────────────────────────────────────────────────  │
│  type: 'email' | 'whatsapp' | 'calendar'                              │
│  Unified staging table for all incoming messages                      │
│  Trigger: check_data_integrity() → data_integrity_inbox               │
└──────────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────┐
         ▼                                          ▼
┌─────────────────────┐                 ┌─────────────────────┐
│ data_integrity_inbox│                 │  Spam Tables        │
│    (44 rows)        │                 │  ─────────────────  │
│  ─────────────────  │                 │  emails_spam (934)  │
│  issue_type:        │                 │  domains_spam (693) │
│   - not_in_crm      │                 │  whatsapp_spam (38) │
│   - incomplete      │                 └─────────────────────┘
│   - duplicate       │
│   - missing_company │                 ┌─────────────────────┐
│   - potential_match │                 │  Hold Tables        │
└─────────────────────┘                 │  ─────────────────  │
                                        │  contacts_hold (25) │
                                        │  companies_hold (17)│
                                        └─────────────────────┘


                    INTRODUCTIONS
                    ─────────────

┌──────────────────────────────────────────────────────────────────────┐
│                     introductions (8 rows)                            │
│  ───────────────────────────────────────────────────────────────────  │
│  introduction_id, introduction_date, introduction_tool, status        │
│  status: Requested, Promised, Done & Dust, Done but need to monitor   │
│  tool: email, whatsapp, in person, other                              │
│  category: Karma Points, Dealflow, Portfolio Company                  │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ introduction_contacts   │
                    │      (16 rows)          │
                    │  ─────────────────────  │
                    │  introduction_id (FK)   │
                    │  contact_id (FK)        │
                    │  role: introducer |     │
                    │        introducee       │
                    └─────────────────────────┘


                    DUPLICATES MANAGEMENT
                    ────────────────────

┌─────────────────────┐              ┌──────────────────────┐
│ contact_duplicates  │              │  company_duplicates  │
│    (113 rows)       │              │     (14 rows)        │
│  ─────────────────  │              │  ──────────────────  │
│  primary_contact_id │              │  primary_company_id  │
│  duplicate_contact_id│             │  duplicate_company_id│
│  status: pending    │              │  status: pending     │
│  merge_selections   │              │  merge_selections    │
└─────────────────────┘              └──────────────────────┘
```

---

## Accesso e Strumenti Disponibili

### Frontend (questo repo)
- React app su `localhost:3002`
- Comando: `PORT=3002 npm start`

### Backend su Railway

**Progetti Railway:**
- `command-center-backend` - Node.js (email, calendar, chat)
- `crm-agent-service` - Python/FastAPI (WhatsApp webhook)
- `content-warmth` - altro servizio

**1. command-center-backend (Node.js)**
- URL: `https://command-center-backend-production.up.railway.app`
- Gestisce: Email sync (JMAP), Calendar sync (CalDAV), invio email, chat AI
- Endpoints: `/chat`, `/email/send`, `/calendar/*`, `/whatsapp/send`

**2. crm-agent-service (Python/FastAPI)**
- Gestisce: WhatsApp webhook da TimelinesAI
- Endpoint: `/whatsapp-webhook`

**Railway CLI Commands:**
```bash
railway list                              # Lista progetti
railway status                            # Stato progetto corrente
railway logs                              # Stream logs live
railway logs -n 100                       # Ultimi 100 log
railway logs -s command-center-backend    # Logs servizio specifico
railway logs --filter "@level:error"      # Solo errori
railway up                                # Deploy
railway redeploy                          # Redeploy ultimo deployment
railway open                              # Apri dashboard
```

### Database (Supabase)
- **Project ID**: `efazuvegwxouysfcgwja`
- **Project Name**: CRM
- **Region**: eu-central-1
- **DB Host**: `db.efazuvegwxouysfcgwja.supabase.co`
- Accesso via MCP tools (`mcp__supabase__*`)

### WhatsApp (Timelines.ai)
- Accesso via MCP tools (`mcp__timelines_whatsapp__*`)

### Todoist
- Accesso via MCP tools (`mcp__todoist__*`)

---

## Documentazione Dettagliata

Vedi cartella `docs/` per flussi completi:
- `docs/DATA_INGESTION.md` - Sync email, WhatsApp, calendar
- `docs/DATA_CLEANING.md` - Add, Hold, Spam flows
- `docs/DATA_INTEGRITY.md` - Trigger e check automatici

---

## Schema Supabase Dettagliato

### contacts
```
contact_id              uuid PK (auto uuid_generate_v4)
first_name              text
last_name               text
linkedin                varchar
category                contact_category (default 'Inbox')
job_role                text
description             text
score                   integer
keep_in_touch_frequency keep_in_touch_frequency (default 'Not Set')
birthday                date
profile_image_url       text
last_interaction_at     timestamptz
show_missing            boolean (default true)
created_by              creation_source (default 'User')
created_at              timestamptz (default now())
last_modified_by        creation_source
last_modified_at        timestamptz
```

### companies
```
company_id              uuid PK (auto uuid_generate_v4)
name                    text NOT NULL
website                 varchar
category                company_category (default 'Inbox')
description             text
linkedin                varchar
show_missing            boolean (default true)
created_by              creation_source (default 'User')
created_at              timestamptz (default now())
```

### contact_emails
```
email_id                uuid PK
contact_id              uuid FK → contacts.contact_id
email                   varchar NOT NULL
type                    contact_point_type (default 'personal')
is_primary              boolean NOT NULL (default false)
```

### contact_mobiles
```
mobile_id               uuid PK
contact_id              uuid FK → contacts.contact_id
mobile                  text NOT NULL
type                    contact_point_type (default 'personal')
is_primary              boolean (default false)
```

### contact_companies
```
contact_companies_id    uuid PK
contact_id              uuid FK → contacts.contact_id
company_id              uuid FK → companies.company_id
relationship            contact_company_relationship_type (default 'not_set')
is_primary              boolean (default false)
UNIQUE(contact_id, company_id)
```

### contact_tags
```
entry_id                uuid PK
contact_id              uuid FK → contacts.contact_id
tag_id                  uuid FK → tags.tag_id
UNIQUE(contact_id, tag_id)
```

### company_tags
```
entry_id                uuid PK
company_id              uuid FK → companies.company_id
tag_id                  uuid FK → tags.tag_id
UNIQUE(company_id, tag_id)
```

### company_domains
```
id                      uuid PK
company_id              uuid FK → companies.company_id
domain                  text NOT NULL UNIQUE
is_primary              boolean (default false)
UNIQUE(company_id, domain)
```

### tags
```
tag_id                  uuid PK
name                    varchar NOT NULL   ⚠️ USA "name" NON "tag_name"!
```

### introductions
```
introduction_id         uuid PK
introduction_date       date
introduction_tool       introduction_tool NOT NULL (email, whatsapp, in person, other)
category                introduction_category NOT NULL (Karma Points, Dealflow, Portfolio Company)
text                    text (notes)
status                  introduction_status (default 'Requested')
```

### introduction_contacts
```
introduction_contact_id uuid PK
introduction_id         uuid FK → introductions.introduction_id
contact_id              uuid FK → contacts.contact_id
role                    introduction_role NOT NULL (introducer, introducee)
UNIQUE(introduction_id, contact_id)
```

### interactions
```
interaction_id          uuid PK
contact_id              uuid FK → contacts.contact_id
interaction_type        interaction_type NOT NULL (email, whatsapp, meeting, note, call, slack, sms)
direction               interaction_direction NOT NULL (sent, received, neutral, interactive)
interaction_date        timestamptz NOT NULL
summary                 text
email_thread_id         uuid FK → email_threads.email_thread_id
external_interaction_id text
special_case_tag        text
```

### keep_in_touch
```
id                      uuid PK
contact_id              uuid FK → contacts.contact_id UNIQUE
frequency               keep_in_touch_frequency NOT NULL
why_keeping_in_touch    text
snooze_days             integer (default 0)
next_follow_up_notes    text
christmas               wishes_type (default 'no wishes set')
easter                  wishes_type (default 'no wishes set')
```

### command_center_inbox
```
id                      uuid PK
type                    text (default 'email') -- 'email', 'whatsapp', 'calendar'
-- Email fields
fastmail_id             text UNIQUE
thread_id               text
from_email              text
from_name               text
to_recipients           jsonb
cc_recipients           jsonb
body_text               text
body_html               text
-- WhatsApp fields
contact_number          text
chat_id                 text
chat_name               text
chat_jid                text
is_group_chat           boolean (default false)
direction               text (default 'received') -- 'sent', 'received'
message_uid             text
-- Calendar fields
event_uid               text
event_end               timestamptz
event_location          text
event_status            text
is_all_day              boolean (default false)
recurrence_rule         text
-- Common
subject                 text
snippet                 text
date                    timestamptz
is_read                 boolean (default false)
has_attachments         boolean (default false)
attachments             jsonb
```

### data_integrity_inbox
```
id                      uuid PK
inbox_id                uuid FK → command_center_inbox.id
issue_type              text NOT NULL (not_in_crm, incomplete, duplicate, missing_company_link, missing_company, potential_company_match)
entity_type             text NOT NULL (contact, company)
entity_id               uuid
duplicate_entity_id     uuid
email                   text
mobile                  text
domain                  text
name                    text
details                 jsonb (default '{}')
priority                integer (default 5)
status                  text (default 'pending') -- 'pending', 'resolved', 'dismissed'
```

### email_lists
```
list_id                 uuid PK
name                    text NOT NULL
description             text
list_type               email_list_type NOT NULL (static, dynamic)
is_active               boolean (default true)
created_by              creation_source (default 'User')
created_at              timestamptz (default now())
last_modified_by        creation_source
last_modified_at        timestamptz
```

### email_list_members
```
list_member_id          uuid PK
list_id                 uuid FK → email_lists.list_id
contact_id              uuid FK → contacts.contact_id
email_id                uuid FK → contact_emails.email_id (optional, specific email)
is_active               boolean (default true)
added_by                creation_source (default 'User')
added_at                timestamptz (default now())
membership_type         membership_type (manual, filter)
```

**List Types:**
- **static**: Contacts manually added/removed by user
- **dynamic**: Auto-populated via filter tables (email_list_filter_*)

**Dynamic List Filters** (for dynamic lists):
- `email_list_filter_tags` - filter by tags
- `email_list_filter_categories` - filter by contact category
- `email_list_filter_cities` - filter by city
- `email_list_filter_scores` - filter by score
- `email_list_filter_kit` - filter by keep_in_touch frequency
- `email_list_filter_christmas` - filter by christmas wishes type
- `email_list_filter_easter` - filter by easter wishes type

---

## Enum Values

### contact_category
`Inbox, Skip, Professional Investor, Team, WhatsApp Group Contact, Advisor, Supplier, Founder, Manager, Friend and Family, Other, Student, Media, Not Set, Institution, SUBSCRIBER NEWSLETTER, System, Hold`

### company_category
`Professional Investor, Skip, Inbox, Advisory, Corporation, SME, Startup, Corporate, Not Set, Institution, Media, Hold`

### contact_point_type
`work, personal, other, WhatsApp, WhatsApp Group`

### contact_company_relationship_type
`employee, founder, advisor, manager, investor, other, not_set, suggestion`

### keep_in_touch_frequency
`Not Set, Monthly, Quarterly, Twice per Year, Once per Year, Weekly, Do not keep in touch`

### interaction_type
`email, whatsapp, meeting, note, call, slack, sms`

### interaction_direction
`sent, received, neutral, interactive`

### introduction_status
`Requested, Promised, Done & Dust, Aborted, Done, but need to monitor`

### introduction_tool
`whatsapp, email, in person, other`

### introduction_role
`introducer, introducee`

### introduction_category
`Karma Points, Dealflow, Portfolio Company`

### wishes_type
`no wishes set, whatsapp standard, email standard, email custom, whatsapp custom, call, present, no wishes`

### creation_source
`User, LLM, Edge Function`

### email_list_type
`static, dynamic`

### membership_type
`manual, filter`

---

## Altre Tabelle Importanti

### Email
- `email_threads` - thread email
- `emails` - singole email
- `email_participants` - partecipanti
- `command_center_inbox` - inbox unificato (email + whatsapp + calendar)

### Introductions
- `introductions` - introduzioni tra contatti
- `introduction_contacts` - contatti coinvolti (campo `role`: introducer/introducee)
- Status enum: `Requested`, `Promised`, `Done & Dust`, `Done, but need to monitor`, `Aborted`

### Interazioni
- `interactions` - log interazioni (email, whatsapp, meeting, call, note)
- `keep_in_touch` - reminder per contatti

### Data Integrity
- `data_integrity_inbox` - issues rilevate automaticamente
- `contacts_hold`, `companies_hold` - entità in attesa
- `emails_spam`, `whatsapp_spam`, `domains_spam` - blocklist

### Altri
- `deals`, `deals_contacts`
- `meetings`, `meeting_contacts`
- `notes`, `note_contacts`
- `sync_state` - stato sync per email/calendar

---

## Trigger Supabase

- `check_data_integrity()` - AFTER INSERT su `command_center_inbox`
- `process_participant_v2()` - esegue 8 check per ogni partecipante

---

## Flussi Principali

### Email Sync (ogni 60 sec)
1. Backend fetch da Fastmail (JMAP) → filtra spam → `command_center_inbox`
2. Trigger `check_data_integrity()` crea issues in `data_integrity_inbox`
3. User fa "Done" → `saveAndArchive()` crea record in `email_threads`, `emails`, `interactions`

### WhatsApp
- TimelinesAI webhook → `crm-agent-service` → `command_center_inbox`
- Invio: frontend → `command-center-backend` → Baileys

### Introduction Email
1. User compone email per introduction
2. Send → backend invia email
3. Status cambia a "Done, but need to monitor" o "Done & Dust"
4. `last_interaction_at` aggiornato quando email torna dal sync

---

## Componenti Principali

- `src/pages/CommandCenterPage.js` - Hub principale (~14k righe)
- `src/components/command-center/SendEmailTab.js` - Composizione email
- `src/components/command-center/WhatsAppChatTab.js` - Chat WhatsApp
- `src/components/command-center/DataIntegrityTab.js` - Issues data integrity
- `src/components/command-center/CRMTab.js` - Contatti non in CRM

---

## Convenzioni Codice

- Tema: dark/light mode via prop `theme`
- Toast: `react-hot-toast`
- Icons: `react-icons/fa`
- Query DB: sempre Supabase client
- FK joins Supabase: `select('campo, tabella_relazionata(campi)')` (NO alias con `:`)
- Tabella `tags` usa campo `name` (non `tag_name`)

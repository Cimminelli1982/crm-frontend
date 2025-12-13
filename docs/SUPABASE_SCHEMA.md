# Supabase Schema

Schema del database CRM su Supabase (PostgreSQL 15, eu-central-1).

---

## Command Center (Staging)

### `command_center_inbox`
Staging unificato per email, WhatsApp e calendar.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `type` | text | `email`, `whatsapp`, `calendar` |
| `fastmail_id` | text | ID email (unique) |
| `message_uid` | text | ID WhatsApp |
| `event_uid` | text | ID calendar |
| `from_email` | text | Email mittente |
| `from_name` | text | Nome mittente |
| `contact_number` | text | Mobile WhatsApp |
| `subject` | text | Oggetto email / nome chat |
| `body_text` | text | Corpo messaggio |
| `body_html` | text | HTML email |
| `snippet` | text | Preview |
| `date` | timestamptz | Data messaggio |
| `direction` | text | `sent`, `received` |
| `to_recipients` | jsonb | Destinatari TO |
| `cc_recipients` | jsonb | Destinatari CC |
| `chat_id` | text | ID chat WhatsApp |
| `chat_jid` | text | JID WhatsApp |
| `chat_name` | text | Nome chat |
| `is_group_chat` | boolean | Gruppo WhatsApp |
| `event_end` | timestamptz | Fine evento calendar |
| `event_location` | text | Luogo evento |
| `has_attachments` | boolean | Ha allegati |
| `attachments` | jsonb | Array allegati |
| `is_read` | boolean | Letto |
| `is_starred` | boolean | Starred |

### `data_integrity_inbox`
Issues rilevate dal trigger `check_data_integrity()`.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `inbox_id` | uuid | FK → command_center_inbox |
| `issue_type` | text | `not_in_crm`, `incomplete`, `duplicate`, `missing_company_link`, `missing_company` |
| `entity_type` | text | `contact`, `company` |
| `entity_id` | uuid | ID entità esistente |
| `duplicate_entity_id` | uuid | ID duplicato |
| `email` | text | Email partecipante |
| `mobile` | text | Mobile partecipante |
| `domain` | text | Dominio email |
| `name` | text | Nome partecipante |
| `details` | jsonb | Dettagli extra |
| `priority` | integer | Priorità |
| `status` | text | `pending`, `resolved`, `dismissed` |
| `created_at` | timestamptz | |
| `resolved_at` | timestamptz | |

### `contacts_hold`
Contatti in attesa di decisione.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `hold_id` | uuid | PK |
| `email` | varchar | Email |
| `full_name` | text | Nome completo |
| `first_name` | text | Nome |
| `last_name` | text | Cognome |
| `email_count` | integer | Quante volte visto |
| `status` | varchar | Stato |
| `first_seen_at` | timestamptz | Prima apparizione |
| `last_seen_at` | timestamptz | Ultima apparizione |

### `companies_hold`
Domini/company in attesa.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `hold_id` | uuid | PK |
| `domain` | varchar | Dominio |
| `name` | text | Nome company |
| `email_count` | integer | Quante volte visto |
| `status` | varchar | Stato |

---

## Processing Inbox

### `email_inbox`
Staging email per processing (dopo Done).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `gmail_id` | text | ID email (unique) |
| `thread_id` | text | Thread ID |
| `from_email` | text | Mittente |
| `from_name` | text | Nome mittente |
| `to_email` | text | Destinatario |
| `subject` | text | Oggetto |
| `message_text` | text | Corpo |
| `message_timestamp` | timestamptz | Data |
| `direction` | text | Direzione |
| `special_case` | enum | `introduction`, `deal`, `ask_ai`, etc. |
| `start_trigger` | boolean | Attiva trigger processing |
| `processed` | boolean | Processato |
| `processing_error` | boolean | Errore |

### `whatsapp_inbox`
Staging WhatsApp per processing (dopo Done).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `message_uid` | text | ID messaggio (unique) |
| `contact_number` | text | Mobile |
| `chat_id` | text | Chat ID |
| `chat_jid` | text | Chat JID |
| `chat_name` | text | Nome chat |
| `is_group_chat` | boolean | Gruppo |
| `first_name` | text | Nome |
| `last_name` | text | Cognome |
| `message_text` | text | Testo |
| `message_timestamp` | timestamptz | Data |
| `direction` | text | `sent`, `received` |
| `start_trigger` | boolean | Attiva trigger processing |

---

## Core CRM

### `contacts` (3344 rows)
Contatti principali.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `contact_id` | uuid | PK |
| `first_name` | text | Nome |
| `last_name` | text | Cognome |
| `job_role` | text | Ruolo |
| `linkedin` | varchar | LinkedIn URL |
| `description` | text | Descrizione |
| `birthday` | date | Compleanno |
| `score` | integer | Rating 1-5 |
| `category` | enum | `Inbox`, `Skip`, `Professional Investor`, etc. |
| `keep_in_touch_frequency` | enum | `Weekly`, `Monthly`, `Quarterly`, etc. |
| `last_interaction_at` | timestamptz | Ultima interazione |
| `profile_image_url` | text | URL foto profilo |
| `show_missing` | boolean | Mostra in missing info |
| `created_by` | enum | `User`, `LLM`, `Edge Function` |
| `created_at` | timestamptz | |

### `contact_emails` (2509 rows)
Email dei contatti (1:N).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `email_id` | uuid | PK |
| `contact_id` | uuid | FK → contacts |
| `email` | varchar | Indirizzo email |
| `type` | enum | `work`, `personal`, `other`, `WhatsApp` |
| `is_primary` | boolean | Email primaria |

### `contact_mobiles` (1473 rows)
Numeri mobile dei contatti (1:N).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `mobile_id` | uuid | PK |
| `contact_id` | uuid | FK → contacts |
| `mobile` | text | Numero |
| `type` | enum | `work`, `personal`, `WhatsApp` |
| `is_primary` | boolean | Mobile primario |

### `companies` (2288 rows)
Aziende.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `company_id` | uuid | PK |
| `name` | text | Nome |
| `website` | varchar | Sito web |
| `linkedin` | varchar | LinkedIn |
| `description` | text | Descrizione |
| `category` | enum | `Inbox`, `Skip`, `Professional Investor`, `Startup`, etc. |
| `show_missing` | boolean | Mostra in missing info |

### `company_domains` (1135 rows)
Domini delle company (1:N).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `company_id` | uuid | FK → companies |
| `domain` | text | Dominio |
| `is_primary` | boolean | Dominio primario |

### `contact_companies` (844 rows)
Relazione contatti ↔ company (N:M).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `contact_companies_id` | uuid | PK |
| `contact_id` | uuid | FK → contacts |
| `company_id` | uuid | FK → companies |
| `relationship` | enum | `employee`, `founder`, `advisor`, `investor`, etc. |
| `is_primary` | boolean | Company primaria |

---

## Email System

### `email_threads` (3315 rows)
Thread di email.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `email_thread_id` | uuid | PK |
| `thread_id` | text | Thread ID Fastmail (unique) |
| `subject` | text | Oggetto |
| `last_message_timestamp` | timestamptz | Ultimo messaggio |

### `emails` (5223 rows)
Singole email.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `email_id` | uuid | PK |
| `gmail_id` | text | ID Fastmail (unique) |
| `email_thread_id` | uuid | FK → email_threads |
| `sender_contact_id` | uuid | FK → contacts |
| `subject` | text | Oggetto |
| `body_plain` | text | Corpo testo |
| `body_html` | text | Corpo HTML |
| `message_timestamp` | timestamptz | Data |
| `direction` | text | `sent`, `received`, `neutral` |
| `has_attachments` | boolean | |
| `attachment_count` | integer | |

### `email_participants` (15810 rows)
Partecipanti email (N:M).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `participant_id` | uuid | PK |
| `email_id` | uuid | FK → emails |
| `contact_id` | uuid | FK → contacts |
| `participant_type` | enum | `sender`, `to`, `cc`, `bcc` |

### `contact_email_threads` (7656 rows)
Relazione contatti ↔ thread (N:M).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `contact_id` | uuid | PK (composite) |
| `email_thread_id` | uuid | PK (composite) |

---

## WhatsApp System

### `chats` (786 rows)
Chat WhatsApp.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `chat_name` | text | Nome chat |
| `external_chat_id` | text | ID esterno |
| `category` | enum | `individual`, `group` |
| `is_group_chat` | boolean | |

### `contact_chats` (2088 rows)
Relazione contatti ↔ chat (N:M).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `contact_id` | uuid | FK → contacts |
| `chat_id` | uuid | FK → chats |

---

## Interactions

### `interactions` (59691 rows)
Tutte le interazioni (email, whatsapp, meeting, etc.).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `interaction_id` | uuid | PK |
| `contact_id` | uuid | FK → contacts |
| `interaction_type` | enum | `email`, `whatsapp`, `meeting`, `note`, `call`, `slack`, `sms` |
| `direction` | enum | `sent`, `received`, `neutral`, `interactive` |
| `interaction_date` | timestamptz | Data |
| `chat_id` | uuid | FK → chats (per WhatsApp) |
| `email_thread_id` | uuid | FK → email_threads (per email) |
| `summary` | text | Riassunto |
| `external_interaction_id` | text | ID esterno |
| `special_case_tag` | text | `deal`, `introduction`, etc. |

---

## Attachments

### `attachments` (13391 rows)
Tutti gli allegati.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `attachment_id` | uuid | PK |
| `file_name` | varchar | Nome file |
| `file_url` | varchar | URL originale |
| `permanent_url` | text | URL Supabase Storage |
| `file_type` | varchar | MIME type |
| `file_size` | bigint | Dimensione |
| `external_reference` | text | ID esterno (es. message_uid) |
| `contact_id` | uuid | FK → contacts |
| `chat_id` | uuid | FK → chats |
| `interaction_id` | uuid | FK → interactions |
| `email_thread_id` | uuid | FK → email_threads |
| `processing_status` | text | `pending`, `completed`, `failed` |

---

## Spam Tables

### `emails_spam` (914 rows)
Email bloccate.

| Colonna | Tipo |
|---------|------|
| `email` | text (PK) |
| `counter` | numeric |
| `filter_domain` | boolean |

### `domains_spam` (693 rows)
Domini bloccati.

| Colonna | Tipo |
|---------|------|
| `domain` | varchar (PK) |
| `counter` | integer |
| `notes` | text |

### `whatsapp_spam` (30 rows)
Numeri WhatsApp bloccati.

| Colonna | Tipo |
|---------|------|
| `mobile_number` | text (PK) |
| `counter` | numeric |

---

## Tags & Cities

### `tags` (589 rows)
| `tag_id` | uuid (PK) |
| `name` | varchar |

### `contact_tags` (2217 rows)
### `company_tags` (492 rows)

### `cities` (272 rows)
| `city_id` | uuid (PK) |
| `name` | varchar |
| `country` | varchar |

### `contact_cities` (1534 rows)
### `company_cities` (73 rows)

---

## Deals & Investments

### `deals` (8 rows)
| `deal_id` | uuid (PK) |
| `opportunity` | varchar |
| `description` | text |
| `total_investment` | numeric |
| `category` | enum | `Startup`, `Fund`, `Real Estate`, etc. |
| `stage` | enum | `Lead`, `Evaluating`, `Closing`, `Invested`, `Passed` |
| `source_category` | enum | `Cold Contacting`, `Introduction` |

### `investments` (0 rows)
| `investment_id` | uuid (PK) |
| `related_company` | uuid → companies |
| `investment_date` | date |
| `amount_invested` | numeric |
| `valuation_at_cost` | numeric |

---

## Keep in Touch

### `keep_in_touch` (773 rows)
| `id` | uuid (PK) |
| `contact_id` | uuid (unique) → contacts |
| `frequency` | enum | `Weekly`, `Monthly`, `Quarterly`, etc. |
| `why_keeping_in_touch` | text |
| `next_follow_up_notes` | text |
| `snooze_days` | integer |
| `christmas` | enum | `whatsapp standard`, `email standard`, etc. |
| `easter` | enum | |

---

## Duplicates

### `contact_duplicates` (12 rows)
Coppie di contatti duplicati da risolvere.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `duplicate_id` | uuid | PK |
| `primary_contact_id` | uuid | FK → contacts (da tenere) |
| `duplicate_contact_id` | uuid | FK → contacts (da rimuovere) |
| `status` | text | `pending`, `processing`, `completed`, `failed`, `ignored` |
| `email` | text | Email match |
| `mobile_number` | text | Mobile match |
| `merge_selections` | jsonb | Selezioni campi |
| `start_trigger` | boolean | Attiva merge |

### `contact_duplicates_completed` (465 rows)
Merge completati (storico).

---

## Enums Principali

```sql
-- Contact
contact_category: Inbox, Skip, Professional Investor, Team, Advisor, Supplier, Founder, Manager, Friend and Family, Other, Student, Media, Not Set, Hold

-- Company
company_category: Inbox, Skip, Professional Investor, Advisory, Corporation, SME, Startup, Corporate, Not Set, Institution, Media, Hold

-- Keep in Touch
keep_in_touch_frequency: Not Set, Weekly, Monthly, Quarterly, Twice per Year, Once per Year, Do not keep in touch

-- Interaction
interaction_type: email, whatsapp, meeting, note, call, slack, sms
interaction_direction: sent, received, neutral, interactive

-- Deal
deal_stage: Lead, Evaluating, Closing, Invested, Monitoring, Passed, DELETE
deal_category: Inbox, Startup, Fund, Real Estate, Private Debt, Private Equity, Other

-- Creation Source
creation_source: User, LLM, Edge Function
```

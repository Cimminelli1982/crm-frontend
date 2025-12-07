# Supabase CRM Schema Documentation

**Project:** CRM
**Reference ID:** efazuvegwxouysfcgwja
**Region:** Central EU (Frankfurt)
**Last Updated:** 2025-12-06

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Entities](#core-entities)
4. [Communication Entities](#communication-entities)
5. [Business Entities](#business-entities)
6. [Junction Tables](#junction-tables)
7. [Command Center Tables](#command-center-tables)
8. [Support Tables](#support-tables)
9. [Views](#views)
10. [Enums Reference](#enums-reference)

---

## Overview

This CRM database consists of **87 tables/views** organized into the following domains:

| Domain | Description | Key Tables |
|--------|-------------|------------|
| **Contacts** | People management | contacts, contact_emails, contact_mobiles |
| **Companies** | Organizations | companies, company_domains |
| **Communications** | Email & WhatsApp | emails, email_threads, chats, interactions |
| **Business** | Deals & Investments | deals, investments, meetings |
| **Organization** | Tags, Cities, Notes | tags, cities, notes |
| **Marketing** | Email campaigns | email_lists, email_campaigns |
| **Command Center** | Fastmail integration | command_center_inbox |

---

## Entity Relationship Diagram

```
                                    ┌─────────────┐
                                    │    tags     │
                                    └──────┬──────┘
                                           │
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
        ▼                                  ▼                                  ▼
┌───────────────┐                 ┌───────────────┐                  ┌───────────────┐
│   contacts    │◄───────────────►│   companies   │                  │    deals      │
└───────┬───────┘                 └───────┬───────┘                  └───────┬───────┘
        │                                 │                                  │
        │  ┌──────────────────────────────┘                                  │
        │  │                                                                 │
        ▼  ▼                                                                 ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│contact_emails │     │contact_mobiles│     │   meetings    │     │  investments  │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │                     │
        └──────────┬──────────┴─────────────────────┴─────────────────────┘
                   │
                   ▼
           ┌───────────────┐
           │  interactions │
           └───────┬───────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│    emails     │     │    chats      │
└───────────────┘     └───────────────┘
        │
        ▼
┌───────────────┐
│ email_threads │
└───────────────┘
```

---

## Core Entities

### contacts

Main table for storing people/contacts.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `contact_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `first_name` | text | | | |
| `last_name` | text | | | |
| `linkedin` | varchar(255) | | | LinkedIn profile URL |
| `category` | enum | | 'Inbox' | Contact classification |
| `job_role` | text | | | |
| `description` | text | | | |
| `score` | integer | | | Contact importance score |
| `keep_in_touch_frequency` | enum | | 'Not Set' | Follow-up frequency |
| `birthday` | date | | | |
| `profile_image_url` | varchar(255) | | | Avatar URL |
| `last_interaction_at` | timestamptz | | | Last communication date |
| `show_missing` | boolean | | true | Show in missing info checks |
| `hubspot_id` | text | | | External ID (HubSpot) |
| `airtable_id` | text | | | External ID (Airtable) |
| `supabase_crm_old_id` | text | | | Migration tracking |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

**Category values:** `Inbox`, `Skip`, `Professional Investor`, `Team`, `WhatsApp Group Contact`, `Advisor`, `Supplier`, `Founder`, `Manager`, `Friend and Family`, `Other`, `Student`, `Media`, `Not Set`, `Institution`, `SUBSCRIBER NEWSLETTER`, `System`

---

### companies

Organizations and businesses.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `company_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `name` | text | ✓ | | Company name |
| `website` | varchar(255) | | | |
| `category` | enum | | 'Inbox' | Company type |
| `description` | text | | | |
| `linkedin` | varchar(255) | | | Company LinkedIn |
| `airtable_id` | text | | | External ID |
| `hubspot_id` | text | | | External ID |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

**Category values:** `Professional Investor`, `Skip`, `Inbox`, `Advisory`, `Corporation`, `SME`, `Startup`, `Corporate`, `Not Set`, `Institution`, `Media`

---

### cities

Geographic locations for contacts and companies.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `city_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `name` | varchar(100) | ✓ | | City name |
| `country` | varchar(100) | ✓ | | Country name |
| `created_at` | timestamptz | | now() | |
| `last_modified_at` | timestamptz | | now() | |

---

### tags

Flexible labeling system for entities.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `tag_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `name` | varchar(50) | ✓ | | Tag name (unique) |
| `created_at` | timestamptz | | now() | |
| `last_modified_at` | timestamptz | | now() | |

---

## Communication Entities

### emails

Individual email messages within threads.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `email_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `gmail_id` | text | ✓ | | Gmail message ID |
| `thread_id` | text | ✓ | | Gmail thread ID |
| `email_thread_id` | uuid | | | **FK** → email_threads |
| `sender_contact_id` | uuid | ✓ | | **FK** → contacts |
| `subject` | text | | | |
| `body_plain` | text | | | Plain text body |
| `body_html` | text | | | HTML body |
| `message_timestamp` | timestamptz | ✓ | | When sent |
| `labels` | jsonb | | | Gmail labels |
| `is_read` | boolean | | false | |
| `is_starred` | boolean | | false | |
| `direction` | text | ✓ | 'neutral' | sent/received/neutral |
| `has_attachments` | boolean | ✓ | false | |
| `attachment_count` | integer | ✓ | 0 | |
| `special_case` | text | | | Processing flags |
| `created_at` | timestamptz | | now() | |
| `created_by` | text | | 'Edge Function' | |

---

### email_threads

Email conversation threads.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `email_thread_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `thread_id` | text | ✓ | | Gmail thread ID |
| `subject` | text | | | Thread subject |
| `last_message_timestamp` | timestamptz | | | Most recent message |
| `created_at` | timestamptz | ✓ | now() | |
| `updated_at` | timestamptz | ✓ | now() | |

---

### chats

WhatsApp conversations (individual or group).

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `chat_name` | text | ✓ | | Chat/group name |
| `category` | enum | ✓ | 'individual' | individual/group |
| `is_group_chat` | boolean | ✓ | false | |
| `external_chat_id` | text | | | WhatsApp chat ID |
| `created_at` | timestamptz | | now() | |
| `created_by` | text | | 'Edge Function' | |

---

### interactions

Unified log of all contact interactions.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `interaction_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `contact_id` | uuid | | | **FK** → contacts |
| `interaction_type` | enum | ✓ | | Type of interaction |
| `direction` | enum | ✓ | | sent/received/neutral/interactive |
| `interaction_date` | timestamptz | ✓ | | When it happened |
| `chat_id` | uuid | | | **FK** → chats |
| `email_thread_id` | uuid | | | **FK** → email_threads |
| `summary` | text | | | AI-generated summary |
| `external_interaction_id` | text | | | External system ID |
| `special_case_tag` | text | | | deal/introduction flags |
| `created_at` | timestamptz | | now() | |

**Interaction types:** `email`, `whatsapp`, `meeting`, `note`, `call`, `slack`, `sms`

**Direction values:** `sent`, `received`, `neutral`, `interactive`

---

### email_participants

Links contacts to emails with their role.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `participant_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `email_id` | uuid | ✓ | | **FK** → emails |
| `contact_id` | uuid | ✓ | | **FK** → contacts |
| `participant_type` | enum | ✓ | | sender/to/cc/bcc |
| `created_at` | timestamptz | ✓ | now() | |

---

## Business Entities

### deals

Investment opportunities and deal pipeline.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `deal_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `opportunity` | varchar(100) | ✓ | | Deal name |
| `source_category` | enum | | 'Not Set' | How deal was sourced |
| `introducer` | uuid | | | **FK** → contacts |
| `category` | enum | | 'Inbox' | Deal type |
| `stage` | enum | | 'Lead' | Pipeline stage |
| `description` | text | | | |
| `total_investment` | numeric | | | Amount in deal |
| `deal_currency` | enum | | | USD/EUR/PLN/GBP |
| `delete_error` | text | | | Deletion tracking |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

**Category values:** `Inbox`, `Startup`, `Fund`, `Real Estate`, `Private Debt`, `Private Equity`, `Other`

**Stage values:** `Lead`, `Evaluating`, `Closing`, `Invested`, `Monitoring`, `Passed`, `DELETE`

**Source values:** `Not Set`, `Cold Contacting`, `Introduction`

---

### investments

Completed investments with financials.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `investment_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `related_company` | uuid | | | **FK** → companies |
| `investment_date` | date | | | |
| `description` | text | | | |
| `category` | enum | | 'Inbox' | Investment type |
| `amount_invested` | numeric | | | Initial investment |
| `valuation_at_cost` | numeric | | | Value when invested |
| `valuation_now` | numeric | | | Current valuation |
| `tax_benefits` | numeric | | | Tax relief amount |
| `cash_in` | numeric | | | Returns received |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

---

### meetings

Scheduled and completed meetings.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `meeting_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `meeting_name` | varchar(200) | ✓ | | Meeting title |
| `description` | text | | | |
| `meeting_date` | timestamptz | ✓ | | When scheduled |
| `meeting_status` | enum | ✓ | 'Scheduled' | Current status |
| `score` | enum | | | Rating 1-5 |
| `recording_url` | varchar(500) | | | Video recording |
| `notes` | text | | | Meeting notes |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

**Status values:** `Scheduled`, `Completed`, `Canceled`, `Rescheduled`

---

### introductions

Track introductions made between contacts.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `introduction_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `contact_ids` | uuid[] | ✓ | | Array of contacts introduced |
| `introduction_date` | date | | | |
| `introduction_tool` | enum | ✓ | | How intro was made |
| `category` | enum | ✓ | | Purpose of intro |
| `text` | text | | | Notes |
| `status` | enum | ✓ | 'Requested' | Current status |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

**Tool values:** `whatsapp`, `email`, `in person`, `other`

**Category values:** `Karma Points`, `Dealflow`, `Portfolio Company`

**Status values:** `Promised`, `Requested`, `Done & Dust`, `Aborted`, `Done, but need to monitor`

---

### notes

General notes attached to entities.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `note_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `title` | varchar(200) | ✓ | | Note title |
| `text` | text | | | Note content |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |

---

### attachments

Files attached to notes, contacts, interactions.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `attachment_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `note_id` | uuid | | | **FK** → notes |
| `contact_id` | uuid | | | **FK** → contacts |
| `interaction_id` | uuid | | | **FK** → interactions |
| `chat_id` | uuid | | | **FK** → chats |
| `email_thread_id` | uuid | | | **FK** → email_threads |
| `file_name` | varchar(255) | ✓ | | Original filename |
| `file_url` | varchar(500) | ✓ | | Storage URL |
| `permanent_url` | text | | | CDN URL |
| `file_type` | varchar(100) | | | MIME type |
| `file_size` | bigint | | | Size in bytes |
| `description` | text | | | |
| `text_content` | text | | | Extracted text |
| `processing_status` | text | | 'pending' | OCR status |
| `processed` | boolean | | | |
| `processed_at` | timestamptz | | | |
| `processing_error` | text | | | |
| `processing_log` | text | | | |
| `error_at` | timestamptz | | | |
| `external_reference` | text | | | External ID |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |

---

### keep_in_touch

Contact follow-up reminders and preferences.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `contact_id` | uuid | ✓ | | **FK** → contacts |
| `frequency` | enum | ✓ | | Follow-up frequency |
| `why_keeping_in_touch` | text | | | Reason to stay in touch |
| `snooze_days` | integer | | 0 | Days to snooze |
| `next_follow_up_notes` | text | | | Notes for next contact |
| `christmas` | enum | | 'no wishes set' | Christmas wishes pref |
| `easter` | enum | | 'no wishes set' | Easter wishes pref |
| `created_at` | timestamptz | | now() | |
| `updated_at` | timestamptz | | now() | |

**Frequency values:** `Not Set`, `Monthly`, `Quarterly`, `Twice per Year`, `Once per Year`, `Weekly`, `Do not keep in touch`

**Wishes values:** `no wishes set`, `whatsapp standard`, `email standard`, `email custom`, `whatsapp custom`, `call`, `present`, `no wishes`

---

## Marketing Entities

### email_lists

Mailing lists for campaigns.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `list_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `name` | text | ✓ | | List name |
| `description` | text | | | |
| `list_type` | enum | ✓ | 'static' | static/dynamic |
| `query_filters` | jsonb | | | Dynamic list filters |
| `total_contacts` | integer | | 0 | |
| `active_contacts` | integer | | 0 | |
| `is_active` | boolean | | true | |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_by` | enum | | 'User' | |
| `last_modified_at` | timestamptz | | now() | |
| `updated_at` | timestamptz | | now() | |

---

### email_campaigns

Email campaign management.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `campaign_id` | uuid | ✓ | uuid_generate_v4() | **PK** |
| `campaign_name` | text | ✓ | | Campaign name |
| `list_id` | uuid | ✓ | | **FK** → email_lists |
| `subject` | text | ✓ | | Email subject |
| `template_id` | uuid | | | Email template |
| `status` | enum | | 'draft' | Campaign status |
| `scheduled_at` | timestamptz | | | When to send |
| `sent_at` | timestamptz | | | When sent |
| `total_recipients` | integer | | 0 | |
| `emails_sent` | integer | | 0 | |
| `emails_failed` | integer | | 0 | |
| `created_by` | enum | | 'User' | |
| `created_at` | timestamptz | | now() | |
| `last_modified_at` | timestamptz | | now() | |

**Status values:** `draft`, `scheduled`, `sending`, `sent`, `failed`, `paused`

---

## Junction Tables

### Contact Junction Tables

| Table | Links | Extra Columns |
|-------|-------|---------------|
| `contact_emails` | contacts ↔ email addresses | email, type, is_primary |
| `contact_mobiles` | contacts ↔ phone numbers | mobile, type, is_primary |
| `contact_companies` | contacts ↔ companies | relationship, is_primary |
| `contact_tags` | contacts ↔ tags | |
| `contact_cities` | contacts ↔ cities | |
| `contact_chats` | contacts ↔ chats | |
| `contact_email_threads` | contacts ↔ email_threads | |

### contact_emails

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `email_id` | uuid | ✓ | uuid_generate_v4() |
| `contact_id` | uuid | ✓ | **FK** → contacts |
| `email` | varchar(255) | ✓ | |
| `type` | enum | ✓ | 'personal' |
| `is_primary` | boolean | ✓ | false |
| `created_at` | timestamptz | ✓ | now() |
| `last_modified_at` | timestamptz | ✓ | now() |

**Type values:** `work`, `personal`, `other`, `WhatsApp`, `WhatsApp Group`

### contact_mobiles

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `mobile_id` | uuid | ✓ | uuid_generate_v4() |
| `contact_id` | uuid | ✓ | **FK** → contacts |
| `mobile` | text | ✓ | |
| `type` | enum | | 'personal' |
| `is_primary` | boolean | | false |
| `created_at` | timestamptz | | now() |
| `last_modified_at` | timestamptz | | now() |

### contact_companies

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `contact_companies_id` | uuid | ✓ | uuid_generate_v4() |
| `contact_id` | uuid | ✓ | **FK** → contacts |
| `company_id` | uuid | ✓ | **FK** → companies |
| `relationship` | enum | | 'not_set' |
| `is_primary` | boolean | | false |
| `created_at` | timestamptz | | now() |

**Relationship values:** `employee`, `founder`, `advisor`, `manager`, `investor`, `other`, `not_set`, `suggestion`

---

### Company Junction Tables

| Table | Links | Extra Columns |
|-------|-------|---------------|
| `company_tags` | companies ↔ tags | |
| `company_cities` | companies ↔ cities | |
| `company_domains` | companies ↔ domains | domain, is_primary |

### company_domains

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `id` | uuid | ✓ | gen_random_uuid() |
| `company_id` | uuid | ✓ | **FK** → companies |
| `domain` | text | ✓ | |
| `is_primary` | boolean | | false |
| `created_at` | timestamptz | | now() |
| `updated_at` | timestamptz | | now() |

---

### Business Junction Tables

| Table | Links | Extra Columns |
|-------|-------|---------------|
| `deals_contacts` | deals ↔ contacts | relationship |
| `investments_contacts` | investments ↔ contacts | |
| `meeting_contacts` | meetings ↔ contacts | |
| `notes_contacts` | notes ↔ contacts | |
| `notes_companies` | notes ↔ companies | |
| `notes_deals` | notes ↔ deals | |
| `notes_investments` | notes ↔ investments | |
| `meeting_deals` | meetings ↔ deals | |
| `deal_tags` | deals ↔ tags | |
| `investment_tags` | investments ↔ tags | |
| `email_list_members` | email_lists ↔ contacts | email_address, is_active |

### deals_contacts

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `deals_contacts_id` | uuid | ✓ | uuid_generate_v4() |
| `deal_id` | uuid | ✓ | **FK** → deals |
| `contact_id` | uuid | ✓ | **FK** → contacts |
| `relationship` | enum | ✓ | |
| `created_at` | timestamptz | | now() |

**Relationship values:** `introducer`, `co-investor`, `advisor`, `other`, `proposer`

---

## Command Center Tables

### command_center_inbox

Staging table for Command Center - stores emails fetched from Fastmail via JMAP.

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | ✓ | gen_random_uuid() | **PK** |
| `fastmail_id` | text | ✓ | | **UNIQUE** Fastmail message ID |
| `thread_id` | text | | | Fastmail thread ID |
| `subject` | text | | | Email subject |
| `from_email` | text | ✓ | | Sender email address |
| `from_name` | text | | | Sender display name |
| `to_recipients` | jsonb | | | Array of {email, name} |
| `cc_recipients` | jsonb | | | Array of {email, name} |
| `date` | timestamptz | ✓ | | Email send date |
| `body_text` | text | | | Plain text body |
| `body_html` | text | | | HTML body |
| `snippet` | text | | | Preview snippet |
| `is_read` | boolean | | false | Read status |
| `is_starred` | boolean | | false | Starred/flagged |
| `has_attachments` | boolean | | false | Has attachments |
| `attachments` | jsonb | | | Array of attachment metadata |
| `labels` | jsonb | | | Fastmail keywords/folders |
| `created_at` | timestamptz | | now() | When synced to Supabase |

**Indexes:**
- `command_center_inbox_pkey` - PRIMARY KEY (id)
- `command_center_inbox_fastmail_id_key` - UNIQUE (fastmail_id)
- `idx_cc_inbox_date` - btree (date DESC)

---

## Support Tables

### settings

Key-value store for system settings.

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `key` | text | ✓ | **PK** |
| `value` | text | | |
| `updated_at` | timestamptz | | now() |

### db_version

Database migration tracking.

| Column | Type | Required | Default |
|--------|------|----------|---------|
| `version_id` | serial | ✓ | **PK** |
| `version` | text | | |
| `description` | text | | |
| `applied_at` | timestamptz | | |
| `applied_by` | text | | |
| `script_name` | text | | |
| `checksum` | text | | |
| `is_current` | boolean | | |

---

## Views

| View | Purpose |
|------|---------|
| `mv_keep_in_touch` | Materialized view for follow-up dashboard |
| `v_keep_in_touch` | Contact follow-up overview |
| `v_keep_in_touch_complete` | Extended follow-up info |
| `contact_overview` | Contact summary with companies |
| `contact_completeness` | Data quality scoring |
| `contacts_without_score` | Contacts missing scores |
| `contacts_without_birthday` | Contacts missing birthday |
| `contacts_without_cities` | Contacts missing location |
| `contacts_without_companies` | Contacts missing company |
| `contacts_without_tags` | Contacts missing tags |
| `contacts_without_keep_in_touch` | Contacts not in follow-up |
| `contacts_missing_info` | General data quality |
| `contacts_with_duplicate_names` | Duplicate detection |
| `contact_emails_view` | Email addresses with contact info |
| `v_interaction_counts` | Interaction statistics |
| `v_chat_participants` | Chat participant list |
| `inbox_contacts_with_interactions` | Inbox contacts with activity |

---

## Enums Reference

### contact_category
`Inbox`, `Skip`, `Professional Investor`, `Team`, `WhatsApp Group Contact`, `Advisor`, `Supplier`, `Founder`, `Manager`, `Friend and Family`, `Other`, `Student`, `Media`, `Not Set`, `Institution`, `SUBSCRIBER NEWSLETTER`, `System`

### company_category
`Professional Investor`, `Skip`, `Inbox`, `Advisory`, `Corporation`, `SME`, `Startup`, `Corporate`, `Not Set`, `Institution`, `Media`

### creation_source
`User`, `LLM`, `Edge Function`

### contact_point_type
`work`, `personal`, `other`, `WhatsApp`, `WhatsApp Group`

### contact_company_relationship_type
`employee`, `founder`, `advisor`, `manager`, `investor`, `other`, `not_set`, `suggestion`

### interaction_type
`email`, `whatsapp`, `meeting`, `note`, `call`, `slack`, `sms`

### interaction_direction
`sent`, `received`, `neutral`, `interactive`

### deal_category
`Inbox`, `Startup`, `Fund`, `Real Estate`, `Private Debt`, `Private Equity`, `Other`

### deal_stage
`Lead`, `Evaluating`, `Closing`, `Invested`, `Monitoring`, `Passed`, `DELETE`

### deal_source_category
`Not Set`, `Cold Contacting`, `Introduction`

### deal_relationship_type
`introducer`, `co-investor`, `advisor`, `other`, `proposer`

### deal_currency
`USD`, `EUR`, `PLN`, `GBP`

### investment_category
`Inbox`, `Startup`, `Fund`, `Real Estate`, `Private Debt`, `Private Equity`, `Other`

### meeting_status
`Scheduled`, `Completed`, `Canceled`, `Rescheduled`

### meeting_rating
`1`, `2`, `3`, `4`, `5`

### introduction_tool
`whatsapp`, `email`, `in person`, `other`

### introduction_category
`Karma Points`, `Dealflow`, `Portfolio Company`

### introduction_status
`Promised`, `Requested`, `Done & Dust`, `Aborted`, `Done, but need to monitor`

### keep_in_touch_frequency
`Not Set`, `Monthly`, `Quarterly`, `Twice per Year`, `Once per Year`, `Weekly`, `Do not keep in touch`

### wishes_type
`no wishes set`, `whatsapp standard`, `email standard`, `email custom`, `whatsapp custom`, `call`, `present`, `no wishes`

### chat_category
`individual`, `group`

### list_type
`dynamic`, `static`

### campaign_status
`draft`, `scheduled`, `sending`, `sent`, `failed`, `paused`

### email_participant_type
`sender`, `to`, `cc`, `bcc`

---

## Notes for Command Center Integration

### Email Integration (JMAP/Fastmail)

The existing schema already supports email storage:
- `email_threads` → Store thread metadata
- `emails` → Store individual messages
- `email_participants` → Track sender/recipients
- `contact_email_threads` → Link contacts to threads
- `attachments` → Store email attachments

**Key fields to map from JMAP:**
- `gmail_id` → Can reuse for Fastmail message ID
- `thread_id` → Fastmail thread ID
- `labels` (jsonb) → Fastmail keywords/folders

### WhatsApp Integration

Existing tables:
- `chats` → WhatsApp conversations
- `contact_chats` → Link contacts to chats
- `interactions` (type='whatsapp') → Message log

### Calendar Integration

The `meetings` table can be extended for calendar sync:
- Add `external_calendar_id` for Google/Fastmail calendar event ID
- Add `calendar_source` enum (google, fastmail, manual)

---

*Generated by Claude Code - 2025-12-06*

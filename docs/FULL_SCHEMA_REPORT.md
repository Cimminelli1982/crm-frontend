# FULL DATABASE SCHEMA REPORT

> **Supabase Project**: `efazuvegwxouysfcgwja` (CRM, eu-central-1)
> **Generated**: 2026-03-04
> **Total tables**: 120 base tables + 26 views = 146 objects
> **Total columns**: 1,335

This is the definitive, exhaustive reference for every table, column, type, default, enum, foreign key, and view in the CRM Supabase database. Organized radially from the `contacts` table as the central entity.

---

## Table of Contents

1. [CONTACTS (Central Entity)](#1-contacts-central-entity)
2. [DIRECT CONTACT DATA (1-to-many from contacts)](#2-direct-contact-data)
3. [COMPANIES & Company Sub-Tables](#3-companies--company-sub-tables)
4. [COMMUNICATION & INTERACTIONS](#4-communication--interactions)
5. [DEALS](#5-deals)
6. [INTRODUCTIONS](#6-introductions)
7. [MEETINGS](#7-meetings)
8. [NOTES](#8-notes)
9. [TASKS](#9-tasks)
10. [DECISIONS](#10-decisions)
11. [INVESTMENTS](#11-investments)
12. [EMAIL LISTS & CAMPAIGNS](#12-email-lists--campaigns)
13. [ATTACHMENTS (Central)](#13-attachments-central)
14. [DATA INGESTION & INTEGRITY](#14-data-ingestion--integrity)
15. [SHARED LOOKUP TABLES](#15-shared-lookup-tables)
16. [HEALTH & FITNESS (Separate Domain)](#16-health--fitness-separate-domain)
17. [SYSTEM & SYNC](#17-system--sync)
18. [AGENT / AI SYSTEM](#18-agent--ai-system)
19. [LEGACY & BACKUP TABLES](#19-legacy--backup-tables)
20. [VIEWS](#20-views)
21. [ALL ENUMS](#21-all-enums)
22. [ALL FOREIGN KEY RELATIONSHIPS](#22-all-foreign-key-relationships)

---

## 1. CONTACTS (Central Entity)

The `contacts` table is the heart of the entire CRM. Almost every other table references it directly or indirectly. A contact represents a person in the user's professional network.


### `contacts` (TABLE -- ~2,795 rows)

Primary key: `contact_id`. Every person in the CRM.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `category` | `contact_category` | NULL | DEFAULT 'Inbox'::contact_category |
| `job_role` | `text` | NULL |  |
| `description` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `keep_in_touch_frequency` | `keep_in_touch_frequency` | NULL | DEFAULT 'Not Set'::keep_in_touch_frequency |
| `birthday` | `date` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `profile_image_url` | `text` | NULL |  |
| `hubspot_id` | `text` | NULL |  |
| `supabase_crm_old_id` | `text` | NULL |  |
| `airtable_id` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `show_missing` | `boolean` | NULL | DEFAULT true |

**Key relationships FROM contacts:**
- `contact_emails` -- email addresses (1:N)
- `contact_mobiles` -- phone numbers (1:N)
- `contact_cities` -- cities via `cities` (M:N junction)
- `contact_companies` -- companies via `companies` (M:N junction)
- `contact_tags` -- tags via `tags` (M:N junction)
- `contact_chats` -- WhatsApp chats via `chats` (M:N junction)
- `contact_email_threads` -- email threads (M:N junction)
- `keep_in_touch` -- KIT settings (1:1)
- `interactions` -- all interactions (1:N)
- `email_participants` -- email participation (1:N)
- `deals_contacts` -- deal relationships (M:N junction)
- `introduction_contacts` -- introductions (M:N junction)
- `meeting_contacts` -- meetings (M:N junction)
- `notes_contacts` -- notes (M:N junction)
- `task_contacts` -- tasks (M:N junction)
- `decision_contacts` -- decisions (M:N junction)
- `investments_contacts` -- investments (M:N junction)
- `email_list_members` -- email lists (M:N junction)

---

## 2. DIRECT CONTACT DATA

Tables that extend the contact record with 1-to-many or 1-to-1 data.


### `contact_emails` (TABLE -- ~2,562 rows)

Email addresses for a contact. One contact can have multiple emails (work, personal, WhatsApp, etc.). FK: `contact_id` -> `contacts.contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `email_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NOT NULL |  |
| `email` | `character varying(255)` | NOT NULL |  |
| `type` | `contact_point_type` | NOT NULL | DEFAULT 'personal'::contact_point_type |
| `is_primary` | `boolean` | NOT NULL | DEFAULT false |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |


### `contact_mobiles` (TABLE -- ~1,501 rows)

Phone/mobile numbers for a contact. FK: `contact_id` -> `contacts.contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `mobile_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NOT NULL |  |
| `mobile` | `text` | NOT NULL |  |
| `type` | `contact_point_type` | NULL | DEFAULT 'personal'::contact_point_type |
| `is_primary` | `boolean` | NULL | DEFAULT false |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `contact_cities` (TABLE -- ~1,618 rows)

Junction table linking contacts to cities. FK: `contact_id` -> `contacts.contact_id`, `city_id` -> `cities.city_id`. UNIQUE(contact_id, city_id) implicit via entry_id.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `entry_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NOT NULL |  |
| `city_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `contact_companies` (TABLE -- ~1,074 rows)

Junction table linking contacts to companies with a relationship type. FK: `contact_id` -> `contacts.contact_id`, `company_id` -> `companies.company_id`. UNIQUE(contact_id, company_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_companies_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NOT NULL |  |
| `company_id` | `uuid` | NOT NULL |  |
| `relationship` | `contact_company_relationship_type` | NULL | DEFAULT 'not_set'::contact_company_relationship_type |
| `is_primary` | `boolean` | NULL | DEFAULT false |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `contact_tags` (TABLE -- ~2,321 rows)

Junction table linking contacts to tags. FK: `contact_id` -> `contacts.contact_id`, `tag_id` -> `tags.tag_id`. UNIQUE(contact_id, tag_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `entry_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NOT NULL |  |
| `tag_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `contact_chats` (TABLE -- ~2,564 rows)

Junction table linking contacts to WhatsApp chats. FK: `contact_id` -> `contacts.contact_id`, `chat_id` -> `chats.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NULL |  |
| `chat_id` | `uuid` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `contact_email_threads` (TABLE -- ~8,688 rows)

Junction table linking contacts to email threads. Composite PK: (contact_id, email_thread_id). FK: `contact_id` -> `contacts.contact_id`, `email_thread_id` -> `email_threads.email_thread_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NOT NULL |  |
| `email_thread_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |


### `keep_in_touch` (TABLE -- ~786 rows)

1-to-1 with contacts (UNIQUE on contact_id). Stores KIT frequency, snooze, wishes preferences, and follow-up notes. FK: `contact_id` -> `contacts.contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NOT NULL |  |
| `frequency` | `keep_in_touch_frequency` | NOT NULL |  |
| `why_keeping_in_touch` | `text` | NULL |  |
| `snooze_days` | `integer` | NULL | DEFAULT 0 |
| `next_follow_up_notes` | `text` | NULL |  |
| `christmas` | `wishes_type` | NULL | DEFAULT 'no wishes set'::wishes_type |
| `easter` | `wishes_type` | NULL | DEFAULT 'no wishes set'::wishes_type |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `snoozed_until` | `timestamp with time zone` | NULL |  |

---

## 3. COMPANIES & Company Sub-Tables

Companies represent organizations. They connect to contacts via `contact_companies`, to deals via `deal_companies`, and have their own tags, cities, domains, and attachments.


### `companies` (TABLE -- ~2,336 rows)

Primary key: `company_id`. Every organization in the CRM.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `company_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `name` | `text` | NOT NULL |  |
| `website` | `character varying(255)` | NULL |  |
| `category` | `company_category` | NULL | DEFAULT 'Inbox'::company_category |
| `description` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `airtable_id` | `text` | NULL |  |
| `hubspot_id` | `text` | NULL |  |
| `show_missing` | `boolean` | NULL | DEFAULT true |


### `company_domains` (TABLE -- ~1,289 rows)

Email domains owned by a company (e.g., "google.com"). Used for auto-matching contacts to companies. FK: `company_id` -> `companies.company_id`. UNIQUE(company_id, domain).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `company_id` | `uuid` | NOT NULL |  |
| `domain` | `text` | NOT NULL |  |
| `is_primary` | `boolean` | NULL | DEFAULT false |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `company_tags` (TABLE -- ~779 rows)

Junction table linking companies to tags. FK: `company_id` -> `companies.company_id`, `tag_id` -> `tags.tag_id`. UNIQUE(company_id, tag_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `entry_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `company_id` | `uuid` | NOT NULL |  |
| `tag_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `company_cities` (TABLE -- ~275 rows)

Junction table linking companies to cities. FK: `company_id` -> `companies.company_id`, `city_id` -> `cities.city_id`. UNIQUE(company_id, city_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `entry_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `company_id` | `uuid` | NOT NULL |  |
| `city_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `company_attachments` (TABLE -- ~655 rows)

Junction table linking companies to attachments (logos, docs). FK: `company_id` -> `companies.company_id`, `attachment_id` -> `attachments.attachment_id`. UNIQUE(company_id, attachment_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `company_attachment_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `company_id` | `uuid` | NOT NULL |  |
| `attachment_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `created_by` | `text` | NULL | DEFAULT 'User'::text |
| `is_logo` | `boolean` | NULL | DEFAULT false |


### `company_duplicates` (TABLE -- ~36 rows)

Detected duplicate company pairs awaiting merge resolution. FK: `primary_company_id`/`duplicate_company_id` implicit -> `companies.company_id`. UNIQUE(primary_company_id, duplicate_company_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `duplicate_id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `primary_company_id` | `uuid` | NOT NULL |  |
| `duplicate_company_id` | `uuid` | NOT NULL |  |
| `detected_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `status` | `text` | NULL | DEFAULT 'pending'::text |
| `resolved_at` | `timestamp with time zone` | NULL |  |
| `resolved_by` | `text` | NULL |  |
| `notes` | `text` | NULL |  |
| `merge_selections` | `jsonb` | NULL |  |
| `duplicate_data` | `jsonb` | NULL |  |
| `error_message` | `text` | NULL |  |
| `start_trigger` | `boolean` | NULL | DEFAULT false |


### `company_duplicates_completed` (TABLE -- ~68 rows)

Archive of completed company merges for audit trail.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `original_duplicate_id` | `uuid` | NULL |  |
| `primary_company_id` | `uuid` | NULL |  |
| `merged_duplicate_company_id` | `uuid` | NULL |  |
| `merge_selections` | `jsonb` | NULL |  |
| `detected_at` | `timestamp with time zone` | NULL |  |
| `resolved_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `initial_notes` | `text` | NULL |  |
| `final_notes` | `text` | NULL |  |

---

## 4. COMMUNICATION & INTERACTIONS

The interactions table is the unified log of all communications. Email, WhatsApp, meetings, calls, notes, Slack, and SMS are all tracked here. Email-specific data lives in `email_threads`, `emails`, and `email_participants`. WhatsApp chats live in `chats` and `contact_chats`.


### `interactions` (TABLE -- ~72,300 rows)

Unified interaction log. Every email sent/received, WhatsApp message, meeting, call, note, etc. creates an interaction record. FK: `contact_id` -> `contacts.contact_id`, `chat_id` -> `chats.id`, `email_thread_id` -> `email_threads.email_thread_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `interaction_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `contact_id` | `uuid` | NULL |  |
| `interaction_type` | `interaction_type` | NOT NULL |  |
| `direction` | `interaction_direction` | NOT NULL |  |
| `interaction_date` | `timestamp with time zone` | NOT NULL |  |
| `chat_id` | `uuid` | NULL |  |
| `summary` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `external_interaction_id` | `text` | NULL |  |
| `special_case_tag` | `text` | NULL |  |
| `email_thread_id` | `uuid` | NULL |  |


### `email_threads` (TABLE -- ~4,055 rows)

Email conversation threads. Groups individual emails by thread. UNIQUE on `thread_id` (external thread identifier).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `email_thread_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `thread_id` | `text` | NOT NULL |  |
| `subject` | `text` | NULL |  |
| `last_message_timestamp` | `timestamp with time zone` | NULL |  |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `updated_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |


### `emails` (TABLE -- ~6,740 rows)

Individual email messages within threads. FK: `sender_contact_id` -> `contacts.contact_id`, `email_thread_id` -> `email_threads.email_thread_id`. UNIQUE on `gmail_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `email_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `gmail_id` | `text` | NOT NULL |  |
| `thread_id` | `text` | NOT NULL |  |
| `sender_contact_id` | `uuid` | NULL |  |
| `subject` | `text` | NULL |  |
| `body_plain` | `text` | NULL |  |
| `body_html` | `text` | NULL |  |
| `message_timestamp` | `timestamp with time zone` | NOT NULL |  |
| `labels` | `jsonb` | NULL |  |
| `is_read` | `boolean` | NULL | DEFAULT false |
| `is_starred` | `boolean` | NULL | DEFAULT false |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `created_by` | `text` | NULL | DEFAULT 'Edge Function'::text |
| `email_thread_id` | `uuid` | NULL |  |
| `direction` | `text` | NOT NULL | DEFAULT 'neutral'::text |
| `has_attachments` | `boolean` | NOT NULL | DEFAULT false |
| `attachment_count` | `integer` | NOT NULL | DEFAULT 0 |
| `special_case` | `text` | NULL |  |


### `email_participants` (TABLE -- ~19,185 rows)

Links emails to contacts with their role (sender, to, cc, bcc). FK: `email_id` -> `emails.email_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(email_id, contact_id, participant_type).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `participant_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `email_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `participant_type` | `email_participant_type` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |


### `email_receivers` (TABLE -- ~278 rows)

Alternative/legacy receiver tracking for emails. FK: `email_id` -> `emails.email_id`, `contact_id` -> `contacts.contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `email_receiver_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `email_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `receiver_type` | `receiver_type` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `chats` (TABLE -- ~860 rows)

WhatsApp chats (individual or group). Connected to contacts via `contact_chats`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `chat_name` | `text` | NOT NULL |  |
| `category` | `chat_category` | NOT NULL | DEFAULT 'individual'::chat_category |
| `is_group_chat` | `boolean` | NOT NULL | DEFAULT false |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `created_by` | `text` | NULL | DEFAULT 'Edge Function'::text |
| `external_chat_id` | `text` | NULL |  |
| `baileys_jid` | `text` | NULL |  |


### `whatsapp_chat_done` (TABLE -- ~245 rows)

Tracks which WhatsApp chats have been marked as "done" (processed).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `chat_id` | `text` | NOT NULL |  |
| `done_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `last_message_uid` | `text` | NULL |  |

---

## 5. DEALS

Deals represent investment opportunities or business relationships being tracked through a pipeline. They connect to contacts, companies, tags, and attachments.


### `deals` (TABLE -- ~54 rows)

Primary key: `deal_id`. Investment/business opportunities tracked through pipeline stages.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `deal_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `opportunity` | `character varying(100)` | NOT NULL |  |
| `source_category` | `deal_source_category` | NULL | DEFAULT 'Not Set'::deal_source_category |
| `category` | `deal_category` | NULL | DEFAULT 'Inbox'::deal_category |
| `stage` | `deal_stage` | NULL | DEFAULT 'Lead'::deal_stage |
| `description` | `text` | NULL |  |
| `total_investment` | `numeric` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `deal_currency` | `deal_currency` | NULL |  |
| `delete_error` | `text` | NULL |  |
| `proposed_at` | `timestamp with time zone` | NULL |  |


### `deals_contacts` (TABLE -- ~55 rows)

Junction table linking deals to contacts with a relationship type. FK: `deal_id` -> `deals.deal_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(deal_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `deals_contacts_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `deal_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `relationship` | `deal_relationship_type` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `deal_companies` (TABLE -- ~40 rows)

Junction table linking deals to companies. FK: `deal_id` -> `deals.deal_id`, `company_id` -> `companies.company_id`. UNIQUE(deal_id, company_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `deal_company_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `deal_id` | `uuid` | NOT NULL |  |
| `company_id` | `uuid` | NOT NULL |  |
| `is_primary` | `boolean` | NULL | DEFAULT true |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `deal_attachments` (TABLE -- ~26 rows)

Junction table linking deals to attachments (pitch decks, term sheets, etc.). FK: `deal_id` -> `deals.deal_id`, `attachment_id` -> `attachments.attachment_id`. UNIQUE(deal_id, attachment_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `deal_attachment_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `deal_id` | `uuid` | NOT NULL |  |
| `attachment_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `created_by` | `text` | NULL | DEFAULT 'User'::text |


### `deal_tags` (TABLE -- ~0 rows)

Junction table linking deals to tags. FK: `deal_id` -> `deals.deal_id`, `tag_id` -> `tags.tag_id`. UNIQUE(deal_id, tag_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `entry_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `deal_id` | `uuid` | NOT NULL |  |
| `tag_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `deal_submission_otp` (TABLE -- ~9 rows)

One-time passwords for the external deal submission form authentication.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `email` | `text` | NOT NULL |  |
| `otp_code` | `text` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `expires_at` | `timestamp with time zone` | NOT NULL |  |
| `verified` | `boolean` | NULL | DEFAULT false |
| `attempts` | `integer` | NULL | DEFAULT 0 |


### `passed` (TABLE -- ~0 rows)

Records when and why a deal was passed on. UNIQUE on `deal_id` (one pass record per deal). FK: `deal_id` -> `deals.deal_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `passed_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `passed_date` | `date` | NULL |  |
| `passed_rationale` | `text` | NULL |  |
| `passed_confidence` | `integer` | NULL |  |
| `passed_stage` | `passed_stage` | NOT NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `deal_id` | `uuid` | NULL |  |
| `passed_category` | `passed_category` | NULL |  |

---

## 6. INTRODUCTIONS

Introductions track when the user introduces two or more contacts to each other. Each introduction has participants with roles (introducer/introducee) and a status workflow.


### `introductions` (TABLE -- ~38 rows)

Primary key: `introduction_id`. Tracks introductions between contacts. FK: `chat_id` -> `chats.id`, `email_thread_id` -> `email_threads.email_thread_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `introduction_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `introduction_date` | `date` | NULL |  |
| `introduction_tool` | `introduction_tool` | NOT NULL |  |
| `category` | `introduction_category` | NOT NULL |  |
| `text` | `text` | NULL |  |
| `status` | `introduction_status` | NOT NULL | DEFAULT 'Requested'::introduction_status |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `whatsapp_group_jid` | `text` | NULL |  |
| `whatsapp_group_name` | `text` | NULL |  |
| `chat_id` | `uuid` | NULL |  |
| `email_thread_id` | `uuid` | NULL |  |


### `introduction_contacts` (TABLE -- ~75 rows)

Junction table linking introductions to contacts with roles. FK: `introduction_id` -> `introductions.introduction_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(introduction_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `introduction_contact_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `introduction_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `role` | `introduction_role` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 7. MEETINGS

Meetings track scheduled/completed meetings with contacts, optionally linked to deals.


### `meetings` (TABLE -- ~44 rows)

Primary key: `meeting_id`. Scheduled or completed meetings.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `meeting_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `meeting_name` | `character varying(200)` | NOT NULL |  |
| `description` | `text` | NULL |  |
| `meeting_date` | `timestamp with time zone` | NOT NULL |  |
| `meeting_status` | `meeting_status` | NOT NULL | DEFAULT 'Scheduled'::meeting_status |
| `recording_url` | `character varying(500)` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `score` | `meeting_rating` | NULL |  |
| `event_uid` | `text` | NULL |  |


### `meeting_contacts` (TABLE -- ~61 rows)

Junction table linking meetings to contacts. FK: `meeting_id` -> `meetings.meeting_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(meeting_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `meeting_contact_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `meeting_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `meeting_deals` (TABLE -- ~0 rows)

Junction table linking meetings to deals. FK: `meeting_id` -> `meetings.meeting_id`, `deal_id` -> `deals.deal_id`. UNIQUE(meeting_id, deal_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `meeting_deal_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `meeting_id` | `uuid` | NOT NULL |  |
| `deal_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 8. NOTES

Notes are rich-text documents that can be linked to contacts, companies, deals, introductions, and meetings. They also support Obsidian sync.


### `notes` (TABLE -- ~882 rows)

Primary key: `note_id`. Rich-text notes with Obsidian sync support.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `note_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `title` | `character varying(200)` | NOT NULL |  |
| `text` | `text` | NULL |  |
| `created_by` | `creator_type` | NULL | DEFAULT 'User'::creator_type |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creator_type` | NULL | DEFAULT 'User'::creator_type |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `note_type` | `text` | NULL | DEFAULT 'general'::text |
| `summary` | `text` | NULL |  |
| `obsidian_path` | `text` | NULL |  |
| `markdown_content` | `text` | NULL |  |
| `folder_path` | `text` | NULL | DEFAULT 'Inbox'::text |
| `file_name` | `text` | NULL |  |
| `frontmatter` | `jsonb` | NULL | DEFAULT '{}'::jsonb |
| `synced_at` | `timestamp with time zone` | NULL |  |
| `git_sha` | `text` | NULL |  |
| `sync_source` | `text` | NULL | DEFAULT 'crm'::text |
| `content_hash` | `text` | NULL |  |
| `deleted_at` | `timestamp with time zone` | NULL |  |


### `notes_contacts` (TABLE -- ~219 rows)

Junction table linking notes to contacts. FK: `note_id` -> `notes.note_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(note_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `note_contact_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `note_companies` (TABLE -- ~0 rows)

Junction table linking notes to companies. FK: `note_id` -> `notes.note_id`, `company_id` -> `companies.company_id`. UNIQUE(note_id, company_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `note_company_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NOT NULL |  |
| `company_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `note_deals` (TABLE -- ~0 rows)

Junction table linking notes to deals. FK: `note_id` -> `notes.note_id`, `deal_id` -> `deals.deal_id`. UNIQUE(note_id, deal_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `note_deal_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NOT NULL |  |
| `deal_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `note_introductions` (TABLE -- ~0 rows)

Junction table linking notes to introductions. FK: `note_id` -> `notes.note_id`, `introduction_id` -> `introductions.introduction_id`. UNIQUE(note_id, introduction_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `note_introduction_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NOT NULL |  |
| `introduction_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `note_meetings` (TABLE -- ~2 rows)

Junction table linking notes to meetings. FK: `note_id` -> `notes.note_id`, `meeting_id` -> `meetings.meeting_id`. UNIQUE(note_id, meeting_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NOT NULL |  |
| `meeting_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `note_attachments` (TABLE -- ~0 rows)

File attachments directly on notes (separate from the central `attachments` table). FK: `note_id` -> `notes.note_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `attachment_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NULL |  |
| `storage_path` | `text` | NOT NULL |  |
| `file_name` | `text` | NOT NULL |  |
| `file_type` | `text` | NULL |  |
| `file_size` | `integer` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 9. TASKS

Tasks are to-do items synced with Todoist. They can be linked to contacts, companies, deals, chats, and notes.


### `tasks` (TABLE -- ~351 rows)

Primary key: `task_id`. To-do items synced with Todoist. UNIQUE on `todoist_id`. Self-referencing FK: `parent_id` -> `tasks.task_id` for subtasks.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `task_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `todoist_id` | `text` | NULL |  |
| `content` | `text` | NOT NULL |  |
| `description` | `text` | NULL |  |
| `due_date` | `date` | NULL |  |
| `due_datetime` | `timestamp with time zone` | NULL |  |
| `due_string` | `text` | NULL |  |
| `priority` | `integer` | NULL | DEFAULT 1 |
| `status` | `task_status` | NULL | DEFAULT 'open'::task_status |
| `todoist_project_id` | `text` | NULL |  |
| `todoist_project_name` | `text` | NULL |  |
| `todoist_section_id` | `text` | NULL |  |
| `todoist_section_name` | `text` | NULL |  |
| `todoist_url` | `text` | NULL |  |
| `completed_at` | `timestamp with time zone` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `synced_at` | `timestamp with time zone` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `parent_id` | `uuid` | NULL |  |
| `todoist_parent_id` | `text` | NULL |  |
| `task_order` | `integer` | NULL | DEFAULT 0 |


### `task_contacts` (TABLE -- ~25 rows)

Junction table linking tasks to contacts. FK: `task_id` -> `tasks.task_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(task_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `task_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `task_companies` (TABLE -- ~1 rows)

Junction table linking tasks to companies. FK: `task_id` -> `tasks.task_id`, `company_id` -> `companies.company_id`. UNIQUE(task_id, company_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `task_id` | `uuid` | NOT NULL |  |
| `company_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `task_deals` (TABLE -- ~2 rows)

Junction table linking tasks to deals. FK: `task_id` -> `tasks.task_id`, `deal_id` -> `deals.deal_id`. UNIQUE(task_id, deal_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `task_id` | `uuid` | NOT NULL |  |
| `deal_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `task_chats` (TABLE -- ~0 rows)

Junction table linking tasks to WhatsApp chats. FK: `task_id` -> `tasks.task_id`, `chat_id` -> `chats.id`. UNIQUE(task_id, chat_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `task_id` | `uuid` | NOT NULL |  |
| `chat_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `task_notes` (TABLE -- ~0 rows)

Junction table linking tasks to notes. FK: `task_id` -> `tasks.task_id`, `note_id` -> `notes.note_id`. UNIQUE(task_id, note_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `task_id` | `uuid` | NOT NULL |  |
| `note_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `task_files` (TABLE -- ~0 rows)

File attachments on tasks. FK: `task_id` -> `tasks.task_id`. UNIQUE(task_id, file_path).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `file_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `task_id` | `uuid` | NOT NULL |  |
| `file_name` | `text` | NOT NULL |  |
| `file_path` | `text` | NOT NULL |  |
| `file_type` | `text` | NULL |  |
| `file_size` | `integer` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 10. DECISIONS

Decisions track important decisions made, linked to contacts, companies, and deals. Used for tracking investment decisions, team decisions, etc.


### `decisions` (TABLE -- ~5 rows)

Primary key: `decision_id`. Tracked decisions with category and confidence.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `decision_id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `decision_date` | `date` | NOT NULL | DEFAULT CURRENT_DATE |
| `detail` | `text` | NOT NULL |  |
| `category` | `decision_category` | NOT NULL | DEFAULT 'Investment'::decision_category |
| `confidence` | `integer` | NOT NULL | DEFAULT 3 |
| `notes` | `text` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `decision_contacts` (TABLE -- ~2 rows)

Junction table linking decisions to contacts. FK: `decision_id` -> `decisions.decision_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(decision_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `decision_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `decision_companies` (TABLE -- ~0 rows)

Junction table linking decisions to companies. FK: `decision_id` -> `decisions.decision_id`, `company_id` -> `companies.company_id`. UNIQUE(decision_id, company_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `decision_id` | `uuid` | NOT NULL |  |
| `company_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `decision_deals` (TABLE -- ~0 rows)

Junction table linking decisions to deals. FK: `decision_id` -> `decisions.decision_id`, `deal_id` -> `deals.deal_id`. UNIQUE(decision_id, deal_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `decision_id` | `uuid` | NOT NULL |  |
| `deal_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 11. INVESTMENTS

Investments track actual investments made (post-deal). They link to companies and contacts.


### `investments` (TABLE -- ~0 rows)

Primary key: `investment_id`. Actual investments with financial tracking. FK: `related_company` -> `companies.company_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `investment_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `related_company` | `uuid` | NULL |  |
| `investment_date` | `date` | NULL |  |
| `description` | `text` | NULL |  |
| `category` | `investment_category` | NULL | DEFAULT 'Inbox'::investment_category |
| `amount_invested` | `numeric` | NULL |  |
| `valuation_at_cost` | `numeric` | NULL |  |
| `valuation_now` | `numeric` | NULL |  |
| `tax_benefits` | `numeric` | NULL |  |
| `cash_in` | `numeric` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `investments_contacts` (TABLE -- ~0 rows)

Junction table linking investments to contacts. FK: `investment_id` -> `investments.investment_id`, `contact_id` -> `contacts.contact_id`. UNIQUE(investment_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `investments_contacts_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `investment_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `investment_tags` (TABLE -- ~0 rows)

Junction table linking investments to tags. FK: `investment_id` -> `investments.investment_id`, `tag_id` -> `tags.tag_id`. UNIQUE(investment_id, tag_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `entry_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `investment_id` | `uuid` | NOT NULL |  |
| `tag_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 12. EMAIL LISTS & CAMPAIGNS

Email lists group contacts for bulk email campaigns. Lists can be static (manually managed) or dynamic (auto-populated via filter tables). Campaigns send emails to list members.


### `email_lists` (TABLE -- ~10 rows)

Primary key: `list_id`. Email distribution lists, static or dynamic.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `list_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `name` | `text` | NOT NULL |  |
| `description` | `text` | NULL |  |
| `list_type` | `list_type` | NOT NULL | DEFAULT 'static'::list_type |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `is_active` | `boolean` | NULL | DEFAULT true |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_members` (TABLE -- ~3,578 rows)

Members of email lists. FK: `list_id` -> `email_lists.list_id`, `contact_id` -> `contacts.contact_id`, `email_id` -> `contact_emails.email_id`. UNIQUE(list_id, contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `list_member_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `added_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `added_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `is_active` | `boolean` | NULL | DEFAULT true |
| `email_id` | `uuid` | NULL |  |
| `membership_type` | `membership_type` | NULL | DEFAULT 'manual'::membership_type |

### Dynamic List Filter Tables

These tables define filters for dynamic email lists. Each filter table links to `email_lists` via `list_id`.


### `email_list_filter_tags` (TABLE -- ~0 rows)

Filter by tags. FK: `list_id` -> `email_lists.list_id`, `tag_id` -> `tags.tag_id`. UNIQUE(list_id, tag_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `tag_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_filter_categories` (TABLE -- ~0 rows)

Filter by contact category. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id, category).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `category` | `contact_category` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_filter_cities` (TABLE -- ~2 rows)

Filter by city name. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id, city_name).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `city_name` | `text` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_filter_scores` (TABLE -- ~1 rows)

Filter by contact score. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id, score).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `score` | `integer` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_filter_kit` (TABLE -- ~0 rows)

Filter by keep-in-touch frequency. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id, frequency).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `frequency` | `keep_in_touch_frequency` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_filter_christmas` (TABLE -- ~6 rows)

Filter by Christmas wishes type. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id, wish_type).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `wish_type` | `wishes_type` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_list_filter_easter` (TABLE -- ~0 rows)

Filter by Easter wishes type. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id, easter).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `easter` | `wishes_type` | NOT NULL |  |


### `email_list_filter_completeness` (TABLE -- ~1 rows)

Filter by completeness score. FK: `list_id` -> `email_lists.list_id`. UNIQUE(list_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `list_id` | `uuid` | NOT NULL |  |
| `max_score` | `integer` | NOT NULL | DEFAULT 99 |
| `exclude_marked_complete` | `boolean` | NOT NULL | DEFAULT true |

### Campaigns


### `email_campaigns` (TABLE -- ~0 rows)

Email campaigns linked to lists. FK: `list_id` -> `email_lists.list_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `campaign_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `campaign_name` | `text` | NOT NULL |  |
| `list_id` | `uuid` | NOT NULL |  |
| `subject` | `text` | NOT NULL |  |
| `template_id` | `uuid` | NULL |  |
| `status` | `campaign_status` | NULL | DEFAULT 'draft'::campaign_status |
| `scheduled_at` | `timestamp with time zone` | NULL |  |
| `sent_at` | `timestamp with time zone` | NULL |  |
| `total_recipients` | `integer` | NULL | DEFAULT 0 |
| `emails_sent` | `integer` | NULL | DEFAULT 0 |
| `emails_failed` | `integer` | NULL | DEFAULT 0 |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_campaign_logs` (TABLE -- ~0 rows)

Per-recipient send log for campaigns. FK: `campaign_id` -> `email_campaigns.campaign_id`, `contact_id` -> `contacts.contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `log_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `campaign_id` | `uuid` | NOT NULL |  |
| `contact_id` | `uuid` | NOT NULL |  |
| `email_address` | `text` | NOT NULL |  |
| `status` | `email_status` | NULL | DEFAULT 'pending'::email_status |
| `resend_message_id` | `text` | NULL |  |
| `sent_at` | `timestamp with time zone` | NULL |  |
| `error_message` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `email_templates` (TABLE -- ~5 rows)

Reusable email templates for campaigns and manual sending.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `template_id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `name` | `character varying(255)` | NOT NULL |  |
| `short_description` | `character varying(255)` | NULL |  |
| `template_text` | `text` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `subject` | `text` | NULL |  |

---

## 13. ATTACHMENTS (Central)

The `attachments` table is the central file storage record. Files are stored in Supabase Storage and referenced here. Attachments can be linked to notes, contacts, interactions, chats, email threads, and via junction tables to deals and companies.


### `attachments` (TABLE -- ~14,855 rows)

Primary key: `attachment_id`. Central file registry. FK: `note_id` -> `notes.note_id`, `contact_id` -> `contacts.contact_id`, `interaction_id` -> `interactions.interaction_id`, `chat_id` -> `chats.id`, `email_thread_id` -> `email_threads.email_thread_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `attachment_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `note_id` | `uuid` | NULL |  |
| `file_name` | `character varying(255)` | NOT NULL |  |
| `file_url` | `character varying(500)` | NOT NULL |  |
| `file_type` | `character varying(100)` | NULL |  |
| `file_size` | `bigint` | NULL |  |
| `description` | `text` | NULL |  |
| `created_by` | `creator_type` | NULL | DEFAULT 'User'::creator_type |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `processing_status` | `text` | NULL | DEFAULT 'pending'::text |
| `permanent_url` | `text` | NULL |  |
| `text_content` | `text` | NULL |  |
| `processed_at` | `timestamp with time zone` | NULL |  |
| `processing_error` | `text` | NULL |  |
| `error_at` | `timestamp with time zone` | NULL |  |
| `contact_id` | `uuid` | NULL |  |
| `interaction_id` | `uuid` | NULL |  |
| `chat_id` | `uuid` | NULL |  |
| `processed` | `boolean` | NULL |  |
| `processing_log` | `text` | NULL |  |
| `external_reference` | `text` | NULL |  |
| `email_thread_id` | `uuid` | NULL |  |

---

## 14. DATA INGESTION & INTEGRITY

Tables that handle incoming data, data quality checks, spam filtering, duplicate detection, and hold queues.

### Inbox & Ingestion


### `command_center_inbox` (TABLE -- ~915 rows)

Unified staging table for ALL incoming messages (email, WhatsApp, calendar). The main inbox. UNIQUE on `fastmail_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `fastmail_id` | `text` | NULL |  |
| `thread_id` | `text` | NULL |  |
| `subject` | `text` | NULL |  |
| `from_email` | `text` | NULL |  |
| `from_name` | `text` | NULL |  |
| `to_recipients` | `jsonb` | NULL |  |
| `cc_recipients` | `jsonb` | NULL |  |
| `date` | `timestamp with time zone` | NULL |  |
| `body_text` | `text` | NULL |  |
| `body_html` | `text` | NULL |  |
| `snippet` | `text` | NULL |  |
| `is_read` | `boolean` | NULL | DEFAULT false |
| `is_starred` | `boolean` | NULL | DEFAULT false |
| `has_attachments` | `boolean` | NULL | DEFAULT false |
| `attachments` | `jsonb` | NULL |  |
| `labels` | `jsonb` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `type` | `text` | NULL | DEFAULT 'email'::text |
| `contact_number` | `text` | NULL |  |
| `chat_id` | `text` | NULL |  |
| `chat_name` | `text` | NULL |  |
| `chat_jid` | `text` | NULL |  |
| `is_group_chat` | `boolean` | NULL | DEFAULT false |
| `direction` | `text` | NULL | DEFAULT 'received'::text |
| `message_uid` | `text` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `receiver` | `text` | NULL |  |
| `event_uid` | `text` | NULL |  |
| `event_end` | `timestamp with time zone` | NULL |  |
| `event_location` | `text` | NULL |  |
| `status` | `text` | NULL |  |
| `etag` | `text` | NULL |  |
| `sequence` | `integer` | NULL | DEFAULT 0 |
| `is_all_day` | `boolean` | NULL | DEFAULT false |
| `event_status` | `text` | NULL |  |
| `recurrence_rule` | `text` | NULL |  |


### `email_inbox` (TABLE -- ~18 rows)

Legacy/alternative email inbox (Gmail-based). UNIQUE on `gmail_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `gmail_id` | `text` | NOT NULL |  |
| `thread_id` | `text` | NULL |  |
| `from_email` | `text` | NOT NULL |  |
| `from_name` | `text` | NULL |  |
| `to_email` | `text` | NOT NULL |  |
| `to_name` | `text` | NULL |  |
| `cc_email` | `text` | NULL |  |
| `cc_name` | `text` | NULL |  |
| `bcc_email` | `text` | NULL |  |
| `subject` | `text` | NULL |  |
| `message_text` | `text` | NULL |  |
| `message_timestamp` | `timestamp with time zone` | NOT NULL |  |
| `direction` | `text` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `processed` | `boolean` | NULL | DEFAULT false |
| `processing_error` | `boolean` | NULL | DEFAULT false |
| `error_message` | `text` | NULL |  |
| `retry_count` | `integer` | NULL | DEFAULT 0 |
| `last_processed_at` | `timestamp with time zone` | NULL |  |
| `has_attachments` | `boolean` | NULL | DEFAULT false |
| `attachment_count` | `integer` | NULL | DEFAULT 0 |
| `llm_processed` | `boolean` | NULL | DEFAULT false |
| `llm_decision` | `text` | NULL |  |
| `llm_reason` | `text` | NULL |  |
| `processing_notes` | `text` | NULL |  |
| `bcc_name` | `text` | NULL |  |
| `special_case` | `email_special_case_type` | NULL |  |
| `start_trigger` | `boolean` | NOT NULL | DEFAULT false |
| `attachment_details` | `jsonb` | NULL |  |


### `whatsapp_inbox` (TABLE -- ~0 rows)

Legacy/alternative WhatsApp inbox. UNIQUE on `message_uid`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `first_name` | `text` | NULL |  |
| `contact_number` | `text` | NULL |  |
| `direction` | `text` | NULL |  |
| `is_group_chat` | `boolean` | NULL |  |
| `chat_name` | `text` | NULL |  |
| `chat_id` | `text` | NULL |  |
| `message_timestamp` | `timestamp with time zone` | NULL |  |
| `message_text` | `text` | NULL |  |
| `message_uid` | `text` | NULL |  |
| `attachment_type` | `text` | NULL |  |
| `attachment_url` | `text` | NULL |  |
| `attachment_filename` | `text` | NULL |  |
| `attachment_size` | `integer` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `receiver` | `text` | NULL |  |
| `processing_error` | `boolean` | NULL | DEFAULT false |
| `error_message` | `text` | NULL |  |
| `retry_count` | `integer` | NULL | DEFAULT 0 |
| `last_processed_at` | `timestamp with time zone` | NULL |  |
| `last_name` | `text` | NULL |  |
| `start_trigger` | `boolean` | NULL | DEFAULT false |
| `chat_jid` | `text` | NULL |  |


### `calendar_dismissed` (TABLE -- ~111 rows)

Tracks calendar events that have been dismissed. UNIQUE on `event_uid`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `event_uid` | `text` | NOT NULL |  |
| `subject` | `text` | NULL |  |
| `dismissed_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

### Data Integrity


### `data_integrity_inbox` (TABLE -- ~1,099 rows)

Issues detected by the `check_data_integrity()` trigger. FK: `inbox_id` -> `command_center_inbox.id`. UNIQUE(inbox_id, issue_type, entity_type, email, entity_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `inbox_id` | `uuid` | NULL |  |
| `issue_type` | `text` | NOT NULL |  |
| `entity_type` | `text` | NOT NULL |  |
| `entity_id` | `uuid` | NULL |  |
| `duplicate_entity_id` | `uuid` | NULL |  |
| `email` | `text` | NULL |  |
| `mobile` | `text` | NULL |  |
| `domain` | `text` | NULL |  |
| `name` | `text` | NULL |  |
| `details` | `jsonb` | NULL | DEFAULT '{}'::jsonb |
| `priority` | `integer` | NOT NULL | DEFAULT 5 |
| `status` | `text` | NOT NULL | DEFAULT 'pending'::text |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `resolved_at` | `timestamp with time zone` | NULL |  |


### `data_integrity_queue` (TABLE -- ~3,688 rows)

Queue for asynchronous data integrity processing. FK: `contact_id` -> `contacts.contact_id`, `inbox_id` -> `command_center_inbox.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `contact_id` | `uuid` | NULL |  |
| `inbox_id` | `uuid` | NULL |  |
| `status` | `text` | NOT NULL | DEFAULT 'pending'::text |
| `requested_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `started_at` | `timestamp with time zone` | NULL |  |
| `completed_at` | `timestamp with time zone` | NULL |  |
| `result` | `jsonb` | NULL | DEFAULT '[]'::jsonb |
| `error` | `text` | NULL |  |
| `requested_by` | `text` | NULL | DEFAULT 'user'::text |


### `duplicates_inbox` (TABLE -- ~1 rows)

Duplicate entities detected during ingestion. FK: `inbox_id` -> `command_center_inbox.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `inbox_id` | `uuid` | NULL |  |
| `entity_type` | `text` | NOT NULL |  |
| `source_id` | `uuid` | NOT NULL |  |
| `duplicate_id` | `uuid` | NOT NULL |  |
| `match_type` | `text` | NOT NULL |  |
| `match_details` | `jsonb` | NULL |  |
| `status` | `text` | NULL | DEFAULT 'pending'::text |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

### Duplicate Management


### `contact_duplicates` (TABLE -- ~110 rows)

Detected duplicate contact pairs awaiting merge resolution. FK: `primary_contact_id` -> `contacts.contact_id`, `duplicate_contact_id` -> `contacts.contact_id`. UNIQUE(primary_contact_id, duplicate_contact_id).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `duplicate_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `primary_contact_id` | `uuid` | NOT NULL |  |
| `duplicate_contact_id` | `uuid` | NOT NULL |  |
| `mobile_number` | `text` | NULL |  |
| `detected_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `status` | `text` | NOT NULL | DEFAULT 'pending'::text |
| `resolved_at` | `timestamp with time zone` | NULL |  |
| `resolved_by` | `text` | NULL |  |
| `notes` | `text` | NULL |  |
| `email` | `text` | NULL |  |
| `merge_selections` | `jsonb` | NULL |  |
| `duplicate_data` | `jsonb` | NULL |  |
| `error_message` | `text` | NULL |  |
| `start_trigger` | `boolean` | NULL |  |
| `false_positive` | `boolean` | NULL |  |


### `contact_duplicates_completed` (TABLE -- ~487 rows)

Archive of completed contact merges for audit trail.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `completed_merge_id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `original_duplicate_id` | `uuid` | NOT NULL |  |
| `primary_contact_id` | `uuid` | NOT NULL |  |
| `merged_duplicate_contact_id` | `uuid` | NOT NULL |  |
| `merge_selections` | `jsonb` | NULL |  |
| `detected_at` | `timestamp with time zone` | NOT NULL |  |
| `resolved_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `initial_notes` | `text` | NULL |  |
| `final_notes` | `text` | NULL |  |

### Hold Queues


### `contacts_hold` (TABLE -- ~33 rows)

Contacts waiting for review before being added to the CRM. UNIQUE on `email`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `hold_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `email` | `character varying(255)` | NOT NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `full_name` | `text` | NULL |  |
| `company_name` | `text` | NULL |  |
| `job_role` | `text` | NULL |  |
| `source_type` | `character varying(50)` | NULL | DEFAULT 'email'::character varying |
| `first_seen_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_seen_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `email_count` | `integer` | NULL | DEFAULT 1 |
| `status` | `character varying(50)` | NULL | DEFAULT 'pending'::character varying |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `reviewed_at` | `timestamp with time zone` | NULL |  |
| `mobile` | `character varying(50)` | NULL |  |


### `companies_hold` (TABLE -- ~20 rows)

Companies waiting for review before being added to the CRM.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `company_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `name` | `text` | NOT NULL |  |
| `website` | `character varying` | NULL |  |
| `category` | `company_category` | NULL | DEFAULT 'Inbox'::company_category |
| `description` | `text` | NULL |  |
| `linkedin` | `character varying` | NULL |  |
| `created_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_by` | `creation_source` | NULL | DEFAULT 'User'::creation_source |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `airtable_id` | `text` | NULL |  |
| `hubspot_id` | `text` | NULL |  |
| `hold_id` | `uuid` | NULL | DEFAULT gen_random_uuid() |
| `domain` | `character varying(255)` | NULL |  |
| `email_count` | `integer` | NULL | DEFAULT 1 |
| `status` | `character varying(50)` | NULL | DEFAULT 'pending'::character varying |
| `notes` | `text` | NULL |  |
| `first_seen_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_seen_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `reviewed_at` | `timestamp with time zone` | NULL |  |

### Spam Blocklists


### `emails_spam` (TABLE -- ~977 rows)

Blocked email addresses. PK is `email`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `email` | `text` | NOT NULL |  |
| `counter` | `numeric` | NULL |  |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `filter_domain` | `boolean` | NULL | DEFAULT false |


### `domains_spam` (TABLE -- ~688 rows)

Blocked email domains. PK is `domain`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `domain` | `character varying(255)` | NOT NULL |  |
| `counter` | `integer` | NULL | DEFAULT 0 |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `notes` | `text` | NULL |  |


### `whatsapp_spam` (TABLE -- ~48 rows)

Blocked WhatsApp numbers. PK is `mobile_number`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `mobile_number` | `text` | NOT NULL |  |
| `counter` | `numeric` | NULL |  |
| `created_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `chat_id` | `text` | NULL |  |

### Processing Tracking


### `processed_emails` (TABLE -- ~0 rows)

Tracks which Fastmail emails have been processed. PK is `fastmail_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `fastmail_id` | `text` | NOT NULL |  |
| `processed_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `action` | `text` | NOT NULL |  |


### `contacts_clarissa_processing` (TABLE -- ~103 rows)

Tracks contact data quality processing by the Clarissa AI agent. FK: `contact_id` -> `contacts.contact_id`. UNIQUE on `contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `contact_id` | `uuid` | NOT NULL |  |
| `bucket` | `text` | NOT NULL |  |
| `missing_dimensions` | `text[]` | NULL |  |
| `needs_input_details` | `text` | NULL |  |
| `checked_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `resolved_at` | `timestamp with time zone` | NULL |  |


### `apollo_enrichment_inbox` (TABLE -- ~7 rows)

Queue for Apollo.io contact enrichment. FK: `contact_id` -> `contacts.contact_id`. UNIQUE on `contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `contact_id` | `uuid` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `processed_at` | `timestamp with time zone` | NULL |  |
| `status` | `text` | NULL | DEFAULT 'pending'::text |
| `error_message` | `text` | NULL |  |

---

## 15. SHARED LOOKUP TABLES


### `tags` (TABLE -- ~605 rows)

Primary key: `tag_id`. Shared tags used by contacts, companies, deals, and investments. WARNING: The name column is `name`, NOT `tag_name`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `tag_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `name` | `character varying(50)` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `cities` (TABLE -- ~273 rows)

Primary key: `city_id`. Shared cities used by contacts and companies.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `city_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `name` | `character varying(100)` | NOT NULL |  |
| `country` | `character varying(100)` | NOT NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `last_modified_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 16. HEALTH & FITNESS (Separate Domain)

A completely separate domain from the CRM, sharing the same Supabase project. Tracks nutrition, body metrics, workouts, and training.

### Nutrition


### `ingredients` (TABLE -- ~79 rows)

Food ingredients with nutritional info per 100g.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `name` | `text` | NOT NULL |  |
| `brand` | `text` | NULL |  |
| `category` | `text` | NULL |  |
| `serving_size_g` | `numeric` | NULL |  |
| `kcal_per_100g` | `numeric` | NULL |  |
| `protein_per_100g` | `numeric` | NULL |  |
| `fat_per_100g` | `numeric` | NULL |  |
| `carbs_per_100g` | `numeric` | NULL |  |
| `sugar_per_100g` | `numeric` | NULL |  |
| `fibre_per_100g` | `numeric` | NULL |  |
| `salt_per_100g` | `numeric` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `image_url` | `text` | NULL |  |


### `recipes` (TABLE -- ~13 rows)

Recipes composed of ingredients.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('recipes_id_seq'::regclass) |
| `name` | `text` | NOT NULL |  |
| `servings` | `integer` | NULL | DEFAULT 1 |
| `prep_time_min` | `integer` | NULL |  |
| `cook_time_min` | `integer` | NULL |  |
| `equipment` | `text[]` | NULL |  |
| `instructions` | `text` | NULL |  |
| `tags` | `text[]` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `image_url` | `text` | NULL |  |


### `recipe_ingredients` (TABLE -- ~45 rows)

Junction: recipe -> ingredients with quantities. FK: `recipe_id` -> `recipes.id`, `ingredient_id` -> `ingredients.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('recipe_ingredients_id_seq'::regclass) |
| `recipe_id` | `integer` | NOT NULL |  |
| `ingredient_id` | `uuid` | NOT NULL |  |
| `quantity_g` | `numeric` | NOT NULL |  |
| `notes` | `text` | NULL |  |


### `meals` (TABLE -- ~37 rows)

Meal log (what was eaten when). FK: `recipe_id` -> `recipes.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('meals_id_seq'::regclass) |
| `date` | `date` | NOT NULL |  |
| `meal_type` | `text` | NOT NULL |  |
| `recipe_id` | `integer` | NULL |  |
| `servings` | `numeric` | NULL | DEFAULT 1 |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `name` | `text` | NULL |  |
| `image_url` | `text` | NULL |  |


### `meal_ingredients` (TABLE -- ~106 rows)

Direct ingredients in a meal (when not using a recipe). FK: `meal_id` -> `meals.id`, `ingredient_id` -> `ingredients.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('meal_ingredients_id_seq'::regclass) |
| `meal_id` | `integer` | NOT NULL |  |
| `ingredient_id` | `uuid` | NOT NULL |  |
| `quantity_g` | `numeric` | NOT NULL | DEFAULT 0 |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

### Body Metrics


### `body_metrics` (TABLE -- ~56 rows)

Daily body measurements. PK is `date`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `date` | `date` | NOT NULL |  |
| `weight_kg` | `numeric` | NULL |  |
| `lean_mass_kg` | `numeric` | NULL |  |
| `body_fat_kg` | `numeric` | NULL |  |
| `body_fat_pct` | `numeric` | NULL |  |
| `lean_pct` | `numeric` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

### Training


### `exercises` (TABLE -- ~1 rows)

Exercise definitions (bench press, squat, etc.).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `name` | `text` | NOT NULL |  |
| `muscle_group` | `text` | NULL |  |
| `equipment` | `text` | NULL |  |
| `exercise_type` | `text` | NOT NULL | DEFAULT 'Strength'::text |
| `default_sets` | `integer` | NULL |  |
| `default_reps` | `integer` | NULL |  |
| `default_duration_min` | `integer` | NULL |  |
| `notes` | `text` | NULL |  |
| `image_url` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `workout_templates` (TABLE -- ~0 rows)

Pre-defined workout templates.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL |  |
| `name` | `text` | NOT NULL |  |
| `template_type` | `text` | NULL |  |
| `estimated_duration_min` | `integer` | NULL |  |
| `notes` | `text` | NULL |  |
| `tags` | `text` | NULL |  |
| `image_url` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `workout_template_exercises` (TABLE -- ~0 rows)

Exercises within a workout template. FK: `template_id` -> `workout_templates.id`, `exercise_id` -> `exercises.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL |  |
| `template_id` | `integer` | NOT NULL |  |
| `exercise_id` | `uuid` | NOT NULL |  |
| `sort_order` | `integer` | NULL | DEFAULT 0 |
| `sets` | `integer` | NULL |  |
| `reps` | `integer` | NULL |  |
| `weight_kg` | `numeric` | NULL |  |
| `duration_min` | `integer` | NULL |  |
| `distance_km` | `numeric` | NULL |  |
| `rest_seconds` | `integer` | NULL |  |
| `notes` | `text` | NULL |  |


### `training_sessions` (TABLE -- ~6 rows)

Actual training sessions logged. FK: `template_id` -> `workout_templates.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('training_sessions_id_seq'::regclass) |
| `date` | `date` | NOT NULL |  |
| `session_type` | `text` | NULL |  |
| `duration_min` | `integer` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `template_id` | `integer` | NULL |  |
| `name` | `text` | NULL |  |
| `image_url` | `text` | NULL |  |


### `training_session_exercises` (TABLE -- ~0 rows)

Exercises performed in a training session. FK: `session_id` -> `training_sessions.id`, `exercise_id` -> `exercises.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL |  |
| `session_id` | `integer` | NOT NULL |  |
| `exercise_id` | `uuid` | NOT NULL |  |
| `sort_order` | `integer` | NULL | DEFAULT 0 |
| `sets_completed` | `integer` | NULL |  |
| `reps_completed` | `integer` | NULL |  |
| `weight_kg` | `numeric` | NULL |  |
| `duration_min` | `integer` | NULL |  |
| `distance_km` | `numeric` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

### Other Health


### `daily_log` (TABLE -- ~1 rows)

Daily wellness log (meditation, notes). PK is `date`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `date` | `date` | NOT NULL |  |
| `meditation_min` | `integer` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `goals` (TABLE -- ~0 rows)

Personal goals.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('goals_id_seq'::regclass) |
| `title` | `text` | NOT NULL |  |
| `category` | `text` | NULL | DEFAULT 'health'::text |
| `is_completed` | `boolean` | NULL | DEFAULT false |
| `target_date` | `date` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `priorities` (TABLE -- ~7 rows)

Daily/weekly priorities.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL |  |
| `title` | `text` | NOT NULL |  |
| `scope` | `text` | NOT NULL | DEFAULT 'daily'::text |
| `scope_date` | `date` | NULL |  |
| `sort_order` | `integer` | NULL | DEFAULT 0 |
| `is_completed` | `boolean` | NULL | DEFAULT false |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `routine_schedule` (TABLE -- ~0 rows)

Weekly routine schedule.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('routine_schedule_id_seq'::regclass) |
| `day_of_week` | `integer` | NOT NULL |  |
| `time_slot` | `time without time zone` | NOT NULL |  |
| `activity` | `text` | NOT NULL |  |
| `category` | `text` | NULL | DEFAULT 'routine'::text |
| `duration_min` | `integer` | NULL |  |
| `notes` | `text` | NULL |  |
| `is_active` | `boolean` | NULL | DEFAULT true |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `weekly_plans` (TABLE -- ~53 rows)

Weekly planning. UNIQUE(week_number, year).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('weekly_plans_id_seq'::regclass) |
| `week_number` | `integer` | NOT NULL |  |
| `year` | `integer` | NOT NULL | DEFAULT 2026 |
| `label` | `text` | NULL |  |
| `date_start` | `date` | NULL |  |
| `date_end` | `date` | NULL |  |
| `notes` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 17. SYSTEM & SYNC


### `sync_state` (TABLE -- ~3 rows)

Sync state for email/calendar. PK is `id` (text, e.g., "email", "calendar").

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `text` | NOT NULL |  |
| `last_sync_date` | `timestamp with time zone` | NULL |  |
| `ctag` | `text` | NULL |  |


### `todoist_sync_state` (TABLE -- ~1 rows)

Todoist sync state tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `last_sync_at` | `timestamp with time zone` | NULL |  |
| `sync_token` | `text` | NULL |  |
| `status` | `text` | NULL | DEFAULT 'idle'::text |
| `error_message` | `text` | NULL |  |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `obsidian_sync_state` (TABLE -- ~0 rows)

Obsidian vault sync state tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `last_github_sha` | `text` | NULL |  |
| `last_sync_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `sync_direction` | `text` | NOT NULL |  |
| `files_synced` | `integer` | NULL | DEFAULT 0 |
| `files_created` | `integer` | NULL | DEFAULT 0 |
| `files_updated` | `integer` | NULL | DEFAULT 0 |
| `files_deleted` | `integer` | NULL | DEFAULT 0 |
| `errors` | `jsonb` | NULL | DEFAULT '[]'::jsonb |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `settings` (TABLE -- ~4 rows)

Key-value application settings. PK is `key`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `key` | `text` | NOT NULL |  |
| `value` | `text` | NULL |  |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `db_version` (TABLE -- ~0 rows)

Database version tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `version_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `version` | `character varying(50)` | NOT NULL |  |
| `description` | `text` | NULL |  |
| `applied_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `applied_by` | `character varying(100)` | NULL | DEFAULT CURRENT_USER |
| `script_name` | `character varying(255)` | NULL |  |
| `checksum` | `character varying(64)` | NULL |  |
| `is_current` | `boolean` | NULL | DEFAULT false |


### `migration_history` (TABLE -- ~0 rows)

Applied migration tracking. FK: `version_id` -> `db_version.version_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `migration_id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `filename` | `character varying(255)` | NOT NULL |  |
| `applied_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `applied_by` | `character varying(100)` | NULL | DEFAULT CURRENT_USER |
| `checksum` | `character varying(64)` | NULL |  |
| `version_id` | `uuid` | NULL |  |


### `debug_logs` (TABLE -- ~28,206 rows)

Debug log entries.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('debug_logs_id_seq'::regclass) |
| `timestamp` | `timestamp with time zone` | NULL | DEFAULT now() |
| `message` | `text` | NULL |  |
| `data` | `jsonb` | NULL |  |


### `refresh_logs` (TABLE -- ~0 rows)

Materialized view refresh logs.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NOT NULL | DEFAULT nextval('refresh_logs_id_seq'::regclass) |
| `view_name` | `text` | NOT NULL |  |
| `refresh_time` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `success` | `boolean` | NULL | DEFAULT true |

---

## 18. AGENT / AI SYSTEM

Tables supporting AI agent functionality (automated suggestions, action logging, chat).


### `agent_suggestions` (TABLE -- ~691 rows)

AI-generated suggestions for data improvement (merge duplicates, link companies, etc.).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `suggestion_type` | `text` | NOT NULL |  |
| `entity_type` | `text` | NOT NULL |  |
| `primary_entity_id` | `uuid` | NULL |  |
| `secondary_entity_id` | `uuid` | NULL |  |
| `confidence_score` | `numeric` | NULL |  |
| `priority` | `text` | NULL | DEFAULT 'medium'::text |
| `suggestion_data` | `jsonb` | NOT NULL |  |
| `source_email_id` | `uuid` | NULL |  |
| `source_description` | `text` | NULL |  |
| `status` | `text` | NULL | DEFAULT 'pending'::text |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `reviewed_at` | `timestamp with time zone` | NULL |  |
| `reviewed_by` | `text` | NULL |  |
| `expires_at` | `timestamp with time zone` | NULL |  |
| `user_notes` | `text` | NULL |  |
| `agent_reasoning` | `text` | NULL |  |


### `agent_action_log` (TABLE -- ~691 rows)

Log of actions taken by AI agents. FK: `suggestion_id` -> `agent_suggestions.id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `action_type` | `text` | NOT NULL |  |
| `suggestion_id` | `uuid` | NULL |  |
| `entity_type` | `text` | NULL |  |
| `entity_id` | `uuid` | NULL |  |
| `before_data` | `jsonb` | NULL |  |
| `after_data` | `jsonb` | NULL |  |
| `triggered_by` | `text` | NULL | DEFAULT 'agent'::text |
| `error_message` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |


### `agent_requests` (TABLE -- ~45 rows)

Requests made to AI agents.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT gen_random_uuid() |
| `requested_by` | `text` | NOT NULL | DEFAULT 'simone'::text |
| `requested_at` | `timestamp with time zone` | NOT NULL | DEFAULT now() |
| `request_type` | `text` | NOT NULL |  |
| `description` | `text` | NOT NULL |  |
| `context` | `jsonb` | NULL | DEFAULT '{}'::jsonb |
| `assigned_to` | `text` | NULL |  |
| `status` | `text` | NOT NULL | DEFAULT 'pending'::text |
| `completed_at` | `timestamp with time zone` | NULL |  |
| `result` | `text` | NULL |  |
| `reviewed_by` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `updated_at` | `timestamp with time zone` | NULL | DEFAULT now() |
| `estimated_minutes` | `integer` | NULL |  |
| `due_at` | `timestamp with time zone` | NULL |  |
| `approved_by` | `text` | NULL |  |
| `approved_at` | `timestamp with time zone` | NULL |  |


### `agent_chat_messages` (TABLE -- ~4 rows)

Chat messages with AI agents. FK: `contact_id` -> `contacts.contact_id`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | DEFAULT uuid_generate_v4() |
| `agent_id` | `text` | NOT NULL |  |
| `context_type` | `text` | NULL |  |
| `context_id` | `uuid` | NULL |  |
| `contact_id` | `uuid` | NULL |  |
| `role` | `text` | NOT NULL |  |
| `content` | `text` | NOT NULL |  |
| `metadata` | `jsonb` | NULL | DEFAULT '{}'::jsonb |
| `slack_message_id` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL | DEFAULT now() |

---

## 19. LEGACY & BACKUP TABLES


### `airtable_contacts` (TABLE -- ~4,560 rows)

Legacy Airtable contact data imported during migration. 70 text columns mirroring the old Airtable schema.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `Contact` | `text` | NULL |  |
| `ASS STATUS` | `text` | NULL |  |
| `full_name` | `text` | NULL |  |
| `name` | `text` | NULL |  |
| `surname` | `text` | NULL |  |
| `Search Hubspot` | `text` | NULL |  |
| `TEST CONTACT` | `text` | NULL |  |
| `Hubspot Profile` | `text` | NULL |  |
| `Link CRM` | `text` | NULL |  |
| `Check duplicates` | `text` | NULL |  |
| `HubSpot ID` | `text` | NULL |  |
| `Check HubSpot Contact` | `text` | NULL |  |
| `HubSpot URL` | `text` | NULL |  |
| `Search Google` | `text` | NULL |  |
| `Emails` | `text` | NULL |  |
| `keep_in_touch` | `text` | NULL |  |
| `category` | `text` | NULL |  |
| `job_title` | `text` | NULL |  |
| `company` | `text` | NULL |  |
| `Show/Hide Details Contact` | `text` | NULL |  |
| `Show/Hide Missing Info` | `text` | NULL |  |
| `keywords` | `text` | NULL |  |
| `phone_number_1` | `text` | NULL |  |
| `phone_number_2` | `text` | NULL |  |
| `description` | `text` | NULL |  |
| `linkedin_normalised` | `text` | NULL |  |
| `primary_email` | `text` | NULL |  |
| `Linkedin` | `text` | NULL |  |
| `PLANNER` | `text` | NULL |  |
| `INTRODUCTIONS` | `text` | NULL |  |
| `NOTES` | `text` | NULL |  |
| `city` | `text` | NULL |  |
| `rating` | `text` | NULL |  |
| `Last contact` | `text` | NULL |  |
| `Last Email Sent` | `text` | NULL |  |
| `Last Email Received` | `text` | NULL |  |
| `Week Last interaction` | `text` | NULL |  |
| `Year Last Interaction` | `text` | NULL |  |
| `next_birthday` | `text` | NULL |  |
| `Linkedin Profile` | `text` | NULL |  |
| `WhatsApp` | `text` | NULL |  |
| `Find on Linkedin` | `text` | NULL |  |
| `Next Keep in touch` | `text` | NULL |  |
| `Keep in Touch Status` | `text` | NULL |  |
| `Days since last interaction` | `text` | NULL |  |
| `Birthday wishes` | `text` | NULL |  |
| `Christmas wishes` | `text` | NULL |  |
| `Easter wishes` | `text` | NULL |  |
| `Company (string from Hubspot)` | `text` | NULL |  |
| `Last modified` | `text` | NULL |  |
| `HubSpot Sync Status` | `text` | NULL |  |
| `HubSpot ID Main Company` | `text` | NULL |  |
| `airtable_id` | `text` | NULL |  |
| `Company Airtable ID (from Company)` | `text` | NULL |  |
| `Status Syncing` | `text` | NULL |  |
| `Week modified` | `text` | NULL |  |
| `DEALS` | `text` | NULL |  |
| `Superbase ID` | `text` | NULL |  |
| `Christmas 2024` | `text` | NULL |  |
| `Simone Input` | `text` | NULL |  |
| `Remove from missing infos` | `text` | NULL |  |
| `CRM CONTACT` | `text` | NULL |  |
| `Profile` | `text` | NULL |  |
| `Last Whatsapp Sent` | `text` | NULL |  |
| `Last Whatsapp Received` | `text` | NULL |  |
| `Days Since Whatsapp` | `text` | NULL |  |
| `Days Since Email` | `text` | NULL |  |
| `Last interaction` | `text` | NULL |  |
| `INTERACTIONS` | `text` | NULL |  |
| `INTERACTIONS 2` | `text` | NULL |  |


### `contact_mobiles_backup` (TABLE -- ~1,384 rows)

Backup copy of contact_mobiles before a migration/cleanup.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `mobile_id` | `uuid` | NULL |  |
| `contact_id` | `uuid` | NULL |  |
| `mobile` | `text` | NULL |  |
| `type` | `contact_point_type` | NULL |  |
| `is_primary` | `boolean` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `last_modified_at` | `timestamp with time zone` | NULL |  |


### `kit_table` (TABLE -- ~527 rows)

Materialized/cached KIT data (legacy, may be replaced by mv_keep_in_touch view).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `full_name` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `frequency` | `keep_in_touch_frequency` | NULL |  |
| `why_keeping_in_touch` | `text` | NULL |  |
| `snooze_days` | `integer` | NULL |  |
| `next_follow_up_notes` | `text` | NULL |  |
| `christmas` | `wishes_type` | NULL |  |
| `easter` | `wishes_type` | NULL |  |
| `next_interaction_date` | `timestamp with time zone` | NULL |  |
| `days_until_next` | `numeric` | NULL |  |

---

## 20. VIEWS

These are database views (not base tables). They compute data on-the-fly from base tables.


### `company_completeness` (VIEW)

Calculates a completeness score for each company based on filled fields, domain/tag/contact counts.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `company_id` | `uuid` | NULL |  |
| `name` | `text` | NULL |  |
| `website` | `character varying(255)` | NULL |  |
| `category` | `company_category` | NULL |  |
| `description` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `domain_count` | `bigint` | NULL |  |
| `tag_count` | `bigint` | NULL |  |
| `contact_count` | `bigint` | NULL |  |
| `city_count` | `bigint` | NULL |  |
| `has_logo` | `boolean` | NULL |  |
| `completeness_score` | `numeric` | NULL |  |


### `contact_completeness` (VIEW)

Calculates a completeness score for each contact based on how many fields are filled in.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `score` | `integer` | NULL |  |
| `description` | `text` | NULL |  |
| `job_role` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `birthday` | `date` | NULL |  |
| `keep_in_touch_frequency` | `keep_in_touch_frequency` | NULL |  |
| `email_count` | `bigint` | NULL |  |
| `mobile_count` | `bigint` | NULL |  |
| `company_count` | `bigint` | NULL |  |
| `city_count` | `bigint` | NULL |  |
| `tag_count` | `bigint` | NULL |  |
| `kit_frequency` | `keep_in_touch_frequency` | NULL |  |
| `christmas` | `wishes_type` | NULL |  |
| `easter` | `wishes_type` | NULL |  |
| `completeness_score` | `numeric` | NULL |  |


### `contact_emails_view` (VIEW)

Simple view joining contact names with their email addresses.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NULL |  |
| `contact` | `text` | NULL |  |
| `emails` | `text` | NULL |  |


### `contact_overview` (VIEW)

Quick overview of contacts with primary email, mobile, company, and last interaction.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `full_name` | `text` | NULL |  |
| `email` | `character varying(255)` | NULL |  |
| `mobile` | `text` | NULL |  |
| `company` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_birthdays` (VIEW)

Contacts with birthday info, including computed birth_month, birth_day, and is_birthday_today.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `birthday` | `date` | NULL |  |
| `birth_month` | `numeric` | NULL |  |
| `birth_day` | `numeric` | NULL |  |
| `is_birthday_today` | `boolean` | NULL |  |


### `contacts_missing_info` (VIEW)

Shows which fields are missing for each contact (boolean flags per field).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `missing_first_name` | `boolean` | NULL |  |
| `missing_last_name` | `boolean` | NULL |  |
| `missing_category` | `boolean` | NULL |  |
| `missing_score` | `boolean` | NULL |  |
| `missing_description` | `boolean` | NULL |  |
| `missing_job_role` | `boolean` | NULL |  |
| `missing_linkedin` | `boolean` | NULL |  |
| `missing_keep_in_touch_frequency` | `boolean` | NULL |  |
| `missing_christmas_wishes` | `boolean` | NULL |  |
| `missing_easter_wishes` | `boolean` | NULL |  |
| `missing_city_association` | `boolean` | NULL |  |
| `missing_company_association` | `boolean` | NULL |  |
| `missing_tag_association` | `boolean` | NULL |  |
| `total_missing_fields` | `integer` | NULL |  |


### `contacts_with_duplicate_names` (VIEW)

Contacts that share the same first_name + last_name.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `job_role` | `text` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `duplicate_count` | `bigint` | NULL |  |
| `all_duplicate_ids` | `text[]` | NULL |  |
| `all_categories` | `text[]` | NULL |  |


### `contacts_without_basics` (VIEW)

Contacts missing basic info (job_role, score, description).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `description` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_without_birthday` (VIEW)

Contacts with no birthday set.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_without_cities` (VIEW)

Contacts with no city association.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_without_companies` (VIEW)

Contacts with no company association.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_without_keep_in_touch` (VIEW)

Contacts with no KIT frequency set.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_without_score` (VIEW)

Contacts with no score set.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `contacts_without_tags` (VIEW)

Contacts with no tags.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |


### `deleted_spam_domain_contacts_backup` (VIEW)

Backup view of contacts deleted because their email domain was in spam list.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `description` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `keep_in_touch_frequency` | `keep_in_touch_frequency` | NULL |  |
| `birthday` | `date` | NULL |  |
| `created_by` | `creation_source` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `last_modified_by` | `creation_source` | NULL |  |
| `last_modified_at` | `timestamp with time zone` | NULL |  |
| `profile_image_url` | `text` | NULL |  |
| `hubspot_id` | `text` | NULL |  |
| `supabase_crm_old_id` | `text` | NULL |  |
| `airtable_id` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `show_missing` | `boolean` | NULL |  |
| `email_with_spam_domain` | `character varying(255)` | NULL |  |
| `spam_domain` | `text` | NULL |  |


### `deleted_spam_skip_contacts_backup` (VIEW)

Backup view of contacts deleted because their email was in spam/skip list.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `description` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `keep_in_touch_frequency` | `keep_in_touch_frequency` | NULL |  |
| `birthday` | `date` | NULL |  |
| `created_by` | `creation_source` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `last_modified_by` | `creation_source` | NULL |  |
| `last_modified_at` | `timestamp with time zone` | NULL |  |
| `profile_image_url` | `text` | NULL |  |
| `hubspot_id` | `text` | NULL |  |
| `supabase_crm_old_id` | `text` | NULL |  |
| `airtable_id` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `show_missing` | `boolean` | NULL |  |
| `spam_email` | `character varying(255)` | NULL |  |


### `inbox_contacts_with_interactions` (VIEW)

Inbox-category contacts with their computed last interaction date.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `description` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `keep_in_touch_frequency` | `keep_in_touch_frequency` | NULL |  |
| `birthday` | `date` | NULL |  |
| `created_by` | `creation_source` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `last_modified_by` | `creation_source` | NULL |  |
| `last_modified_at` | `timestamp with time zone` | NULL |  |
| `profile_image_url` | `text` | NULL |  |
| `hubspot_id` | `text` | NULL |  |
| `supabase_crm_old_id` | `text` | NULL |  |
| `airtable_id` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `computed_last_interaction` | `timestamp with time zone` | NULL |  |


### `mv_keep_in_touch` (VIEW)

Materialized-style view computing next interaction dates and days until next for KIT contacts.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `full_name` | `text` | NULL |  |
| `profile_image_url` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `frequency` | `keep_in_touch_frequency` | NULL |  |
| `why_keeping_in_touch` | `text` | NULL |  |
| `snooze_days` | `integer` | NULL |  |
| `snoozed_until` | `timestamp with time zone` | NULL |  |
| `next_follow_up_notes` | `text` | NULL |  |
| `christmas` | `wishes_type` | NULL |  |
| `easter` | `wishes_type` | NULL |  |
| `next_interaction_date` | `timestamp with time zone` | NULL |  |
| `days_until_next` | `integer` | NULL |  |


### `skip_contacts_with_emails` (VIEW)

Skip-category contacts with their email addresses.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NULL |  |
| `contact` | `text` | NULL |  |
| `emails` | `text` | NULL |  |


### `v_chat_participants` (VIEW)

Chat participants with contact details, phone numbers, join dates, and message counts.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `chat_id` | `uuid` | NULL |  |
| `chat_name` | `text` | NULL |  |
| `is_group_chat` | `boolean` | NULL |  |
| `external_chat_id` | `text` | NULL |  |
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `full_name` | `text` | NULL |  |
| `phone_number` | `text` | NULL |  |
| `joined_at` | `timestamp with time zone` | NULL |  |
| `last_activity` | `timestamp with time zone` | NULL |  |
| `message_count` | `bigint` | NULL |  |


### `v_contact_companies_with_old_id` (VIEW)

Contact-company relationships including legacy old IDs for migration reference.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_companies_id` | `uuid` | NULL |  |
| `contact_id` | `uuid` | NULL |  |
| `company_id` | `uuid` | NULL |  |
| `relationship` | `contact_company_relationship_type` | NULL |  |
| `is_primary` | `boolean` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `contact_old_id` | `text` | NULL |  |
| `company_old_id` | `text` | NULL |  |


### `v_interaction_counts` (VIEW)

Interaction counts per contact per type with latest date.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `interaction_type` | `interaction_type` | NULL |  |
| `count` | `bigint` | NULL |  |
| `latest_date` | `timestamp with time zone` | NULL |  |


### `v_keep_in_touch` (VIEW)

KIT data with computed next interaction date and days until next.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `full_name` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `frequency` | `keep_in_touch_frequency` | NULL |  |
| `why_keeping_in_touch` | `text` | NULL |  |
| `snooze_days` | `integer` | NULL |  |
| `next_follow_up_notes` | `text` | NULL |  |
| `christmas` | `wishes_type` | NULL |  |
| `easter` | `wishes_type` | NULL |  |
| `next_interaction_date` | `timestamp with time zone` | NULL |  |
| `days_until_next` | `numeric` | NULL |  |


### `v_keep_in_touch_complete` (VIEW)

Complete KIT view with all fields.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `full_name` | `text` | NULL |  |
| `last_interaction_at` | `timestamp with time zone` | NULL |  |
| `frequency` | `keep_in_touch_frequency` | NULL |  |
| `why_keeping_in_touch` | `text` | NULL |  |
| `snooze_days` | `integer` | NULL |  |
| `next_follow_up_notes` | `text` | NULL |  |
| `christmas` | `wishes_type` | NULL |  |
| `easter` | `wishes_type` | NULL |  |
| `next_interaction_date` | `timestamp with time zone` | NULL |  |
| `days_until_next` | `numeric` | NULL |  |


### `v_migration_status` (VIEW)

Migration status showing which migrations have been applied.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `filename` | `character varying(255)` | NULL |  |
| `applied_at` | `timestamp with time zone` | NULL |  |
| `applied_by` | `character varying(100)` | NULL |  |
| `version` | `character varying(50)` | NULL |  |
| `description` | `text` | NULL |  |
| `is_current` | `boolean` | NULL |  |


### `view_contacts_polishing` (VIEW)

Contacts with boolean flags indicating whether they have cities, KIT, tags, companies, chats, interactions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `contact_id` | `uuid` | NULL |  |
| `first_name` | `text` | NULL |  |
| `last_name` | `text` | NULL |  |
| `linkedin` | `character varying(255)` | NULL |  |
| `category` | `contact_category` | NULL |  |
| `job_role` | `text` | NULL |  |
| `description` | `text` | NULL |  |
| `score` | `integer` | NULL |  |
| `keep_in_touch_frequency` | `keep_in_touch_frequency` | NULL |  |
| `birthday` | `date` | NULL |  |
| `created_at` | `timestamp with time zone` | NULL |  |
| `last_modified_at` | `timestamp with time zone` | NULL |  |
| `has_cities` | `text` | NULL |  |
| `has_keep_in_touch` | `text` | NULL |  |
| `has_tags` | `text` | NULL |  |
| `has_companies` | `text` | NULL |  |
| `has_chats` | `text` | NULL |  |
| `has_interactions` | `text` | NULL |  |

---

## 21. ALL ENUMS

Every custom enum type defined in the database with all possible values.

### `campaign_status`

`draft`, `scheduled`, `sending`, `sent`, `failed`, `paused`

### `chat_category`

`individual`, `group`

### `company_category`

`Professional Investor`, `Skip`, `Inbox`, `Advisory`, `Corporation`, `SME`, `Startup`, `Corporate`, `Not Set`, `Institution`, `Media`, `Hold`

### `company_relationship_type`

`investor`, `manager`, `founder`, `employee`, `advisor`, `other`

### `contact_category`

`Inbox`, `Skip`, `Professional Investor`, `Team`, `WhatsApp Group Contact`, `Advisor`, `Supplier`, `Founder`, `Manager`, `Friend and Family`, `Other`, `Student`, `Media`, `Not Set`, `Institution`, `SUBSCRIBER NEWSLETTER`, `System`, `Hold`

### `contact_company_relationship_type`

`employee`, `founder`, `advisor`, `manager`, `investor`, `other`, `not_set`, `suggestion`

### `contact_frequency`

`Not Set`, `Weekly`, `Monthly`, `Quarterly`, `Twice WEEKLY`, `Once per Year`, `Do not keep in touch`

### `contact_point_type`

`work`, `personal`, `other`, `WhatsApp`, `WhatsApp Group`

### `creation_source`

`User`, `LLM`, `Edge Function`

### `creator_type`

`User`, `LLM`, `Edge Function`

### `deal_category`

`Inbox`, `Startup`, `Fund`, `Real Estate`, `Private Debt`, `Private Equity`, `Other`

### `deal_currency`

`USD`, `EUR`, `PLN`, `GBP`

### `deal_relationship_type`

`introducer`, `co-investor`, `advisor`, `other`, `proposer`

### `deal_source_category`

`Not Set`, `Cold Contacting`, `Introduction`

### `deal_stage`

`Lead`, `Evaluating`, `Closing`, `Invested`, `Monitoring`, `Passed`, `DELETE`

### `decision_category`

`Investment`, `Team`, `Time`, `Money`, `Family`

### `email_participant_type`

`sender`, `to`, `cc`, `bcc`

### `email_special_case_type`

`introduction`, `deal`, `ask_ai`, `pending_approval`, `reject`, `reject_domain`

### `email_status`

`pending`, `sent`, `failed`, `bounced`, `delivered`, `opened`, `clicked`, `unsubscribed`

### `interaction_direction`

`sent`, `received`, `neutral`, `interactive`

### `interaction_type`

`email`, `whatsapp`, `meeting`, `note`, `call`, `slack`, `sms`

### `introduction_category`

`Karma Points`, `Dealflow`, `Portfolio Company`

### `introduction_role`

`introducer`, `introducee`

### `introduction_status`

`Promised`, `Requested`, `Done & Dust`, `Aborted`, `Done, but need to monitor`

### `introduction_tool`

`whatsapp`, `email`, `in person`, `other`

### `investment_category`

`Inbox`, `Startup`, `Fund`, `Real Estate`, `Private Debt`, `Private Equity`, `Other`

### `keep_in_touch_frequency`

`Not Set`, `Monthly`, `Quarterly`, `Twice per Year`, `Once per Year`, `Weekly`, `Do not keep in touch`

### `list_type`

`dynamic`, `static`

### `location_relation_type`

`residence`, `work`, `headquarters`, `branch`, `other`

### `meeting_rating`

`1`, `2`, `3`, `4`, `5`

### `meeting_status`

`Scheduled`, `Completed`, `Canceled`, `Rescheduled`

### `membership_type`

`manual`, `computed`

### `message_direction`

`sent`, `received`, `unknown`

### `passed_category`

`Not convinced by the team`, `Not convinced by the opportunity`

### `passed_stage`

`Pre-Meeting`, `1 Meeting`, `Several Meetings`

### `receiver_type`

`to`, `cc`, `bcc`, `from`

### `tag_category`

`contact`, `company`, `deal`, `investment`, `other`

### `task_status`

`open`, `completed`

### `wishes_type`

`no wishes set`, `whatsapp standard`, `email standard`, `email custom`, `whatsapp custom`, `call`, `present`, `no wishes`

---

## 22. ALL FOREIGN KEY RELATIONSHIPS

Every foreign key constraint in the database, listed as `source_table.source_column -> target_table.target_column`.

| Source Table | Source Column | Target Table | Target Column |
|--------------|--------------|--------------|---------------|
| `agent_action_log` | `suggestion_id` | `agent_suggestions` | `id` |
| `agent_chat_messages` | `contact_id` | `contacts` | `contact_id` |
| `apollo_enrichment_inbox` | `contact_id` | `contacts` | `contact_id` |
| `attachments` | `chat_id` | `chats` | `id` |
| `attachments` | `contact_id` | `contacts` | `contact_id` |
| `attachments` | `email_thread_id` | `email_threads` | `email_thread_id` |
| `attachments` | `interaction_id` | `interactions` | `interaction_id` |
| `attachments` | `note_id` | `notes` | `note_id` |
| `company_attachments` | `attachment_id` | `attachments` | `attachment_id` |
| `company_attachments` | `company_id` | `companies` | `company_id` |
| `company_cities` | `city_id` | `cities` | `city_id` |
| `company_cities` | `company_id` | `companies` | `company_id` |
| `company_domains` | `company_id` | `companies` | `company_id` |
| `company_tags` | `company_id` | `companies` | `company_id` |
| `company_tags` | `tag_id` | `tags` | `tag_id` |
| `contact_chats` | `chat_id` | `chats` | `id` |
| `contact_chats` | `contact_id` | `contacts` | `contact_id` |
| `contact_cities` | `city_id` | `cities` | `city_id` |
| `contact_cities` | `contact_id` | `contacts` | `contact_id` |
| `contact_companies` | `company_id` | `companies` | `company_id` |
| `contact_companies` | `contact_id` | `contacts` | `contact_id` |
| `contact_duplicates` | `duplicate_contact_id` | `contacts` | `contact_id` |
| `contact_duplicates` | `primary_contact_id` | `contacts` | `contact_id` |
| `contact_email_threads` | `contact_id` | `contacts` | `contact_id` |
| `contact_email_threads` | `email_thread_id` | `email_threads` | `email_thread_id` |
| `contact_emails` | `contact_id` | `contacts` | `contact_id` |
| `contact_mobiles` | `contact_id` | `contacts` | `contact_id` |
| `contact_tags` | `contact_id` | `contacts` | `contact_id` |
| `contact_tags` | `tag_id` | `tags` | `tag_id` |
| `contacts_clarissa_processing` | `contact_id` | `contacts` | `contact_id` |
| `data_integrity_inbox` | `inbox_id` | `command_center_inbox` | `id` |
| `data_integrity_queue` | `contact_id` | `contacts` | `contact_id` |
| `data_integrity_queue` | `inbox_id` | `command_center_inbox` | `id` |
| `deal_attachments` | `attachment_id` | `attachments` | `attachment_id` |
| `deal_attachments` | `deal_id` | `deals` | `deal_id` |
| `deal_companies` | `company_id` | `companies` | `company_id` |
| `deal_companies` | `deal_id` | `deals` | `deal_id` |
| `deal_tags` | `deal_id` | `deals` | `deal_id` |
| `deal_tags` | `tag_id` | `tags` | `tag_id` |
| `deals_contacts` | `contact_id` | `contacts` | `contact_id` |
| `deals_contacts` | `deal_id` | `deals` | `deal_id` |
| `decision_companies` | `company_id` | `companies` | `company_id` |
| `decision_companies` | `decision_id` | `decisions` | `decision_id` |
| `decision_contacts` | `contact_id` | `contacts` | `contact_id` |
| `decision_contacts` | `decision_id` | `decisions` | `decision_id` |
| `decision_deals` | `deal_id` | `deals` | `deal_id` |
| `decision_deals` | `decision_id` | `decisions` | `decision_id` |
| `duplicates_inbox` | `inbox_id` | `command_center_inbox` | `id` |
| `email_campaign_logs` | `campaign_id` | `email_campaigns` | `campaign_id` |
| `email_campaign_logs` | `contact_id` | `contacts` | `contact_id` |
| `email_campaigns` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_categories` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_christmas` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_cities` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_completeness` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_easter` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_kit` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_scores` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_tags` | `list_id` | `email_lists` | `list_id` |
| `email_list_filter_tags` | `tag_id` | `tags` | `tag_id` |
| `email_list_members` | `contact_id` | `contacts` | `contact_id` |
| `email_list_members` | `email_id` | `contact_emails` | `email_id` |
| `email_list_members` | `list_id` | `email_lists` | `list_id` |
| `email_participants` | `contact_id` | `contacts` | `contact_id` |
| `email_participants` | `email_id` | `emails` | `email_id` |
| `email_receivers` | `contact_id` | `contacts` | `contact_id` |
| `email_receivers` | `email_id` | `emails` | `email_id` |
| `emails` | `email_thread_id` | `email_threads` | `email_thread_id` |
| `emails` | `sender_contact_id` | `contacts` | `contact_id` |
| `interactions` | `chat_id` | `chats` | `id` |
| `interactions` | `contact_id` | `contacts` | `contact_id` |
| `interactions` | `email_thread_id` | `email_threads` | `email_thread_id` |
| `introduction_contacts` | `contact_id` | `contacts` | `contact_id` |
| `introduction_contacts` | `introduction_id` | `introductions` | `introduction_id` |
| `introductions` | `chat_id` | `chats` | `id` |
| `introductions` | `email_thread_id` | `email_threads` | `email_thread_id` |
| `investment_tags` | `investment_id` | `investments` | `investment_id` |
| `investment_tags` | `tag_id` | `tags` | `tag_id` |
| `investments` | `related_company` | `companies` | `company_id` |
| `investments_contacts` | `contact_id` | `contacts` | `contact_id` |
| `investments_contacts` | `investment_id` | `investments` | `investment_id` |
| `keep_in_touch` | `contact_id` | `contacts` | `contact_id` |
| `meal_ingredients` | `ingredient_id` | `ingredients` | `id` |
| `meal_ingredients` | `meal_id` | `meals` | `id` |
| `meals` | `recipe_id` | `recipes` | `id` |
| `meeting_contacts` | `contact_id` | `contacts` | `contact_id` |
| `meeting_contacts` | `meeting_id` | `meetings` | `meeting_id` |
| `meeting_deals` | `deal_id` | `deals` | `deal_id` |
| `meeting_deals` | `meeting_id` | `meetings` | `meeting_id` |
| `migration_history` | `version_id` | `db_version` | `version_id` |
| `note_attachments` | `note_id` | `notes` | `note_id` |
| `note_companies` | `company_id` | `companies` | `company_id` |
| `note_companies` | `note_id` | `notes` | `note_id` |
| `note_deals` | `deal_id` | `deals` | `deal_id` |
| `note_deals` | `note_id` | `notes` | `note_id` |
| `note_introductions` | `introduction_id` | `introductions` | `introduction_id` |
| `note_introductions` | `note_id` | `notes` | `note_id` |
| `note_meetings` | `meeting_id` | `meetings` | `meeting_id` |
| `note_meetings` | `note_id` | `notes` | `note_id` |
| `notes_contacts` | `contact_id` | `contacts` | `contact_id` |
| `notes_contacts` | `note_id` | `notes` | `note_id` |
| `passed` | `deal_id` | `deals` | `deal_id` |
| `recipe_ingredients` | `ingredient_id` | `ingredients` | `id` |
| `recipe_ingredients` | `recipe_id` | `recipes` | `id` |
| `task_chats` | `chat_id` | `chats` | `id` |
| `task_chats` | `task_id` | `tasks` | `task_id` |
| `task_companies` | `company_id` | `companies` | `company_id` |
| `task_companies` | `task_id` | `tasks` | `task_id` |
| `task_contacts` | `contact_id` | `contacts` | `contact_id` |
| `task_contacts` | `task_id` | `tasks` | `task_id` |
| `task_deals` | `deal_id` | `deals` | `deal_id` |
| `task_deals` | `task_id` | `tasks` | `task_id` |
| `task_files` | `task_id` | `tasks` | `task_id` |
| `task_notes` | `note_id` | `notes` | `note_id` |
| `task_notes` | `task_id` | `tasks` | `task_id` |
| `tasks` | `parent_id` | `tasks` | `task_id` |
| `training_session_exercises` | `exercise_id` | `exercises` | `id` |
| `training_session_exercises` | `session_id` | `training_sessions` | `id` |
| `training_sessions` | `template_id` | `workout_templates` | `id` |
| `workout_template_exercises` | `exercise_id` | `exercises` | `id` |
| `workout_template_exercises` | `template_id` | `workout_templates` | `id` |

**Total foreign keys: 121**

---

## APPENDIX: Approximate Row Counts

| Table | Rows |
|-------|------|
| `agent_action_log` | 691 |
| `agent_chat_messages` | 4 |
| `agent_requests` | 45 |
| `agent_suggestions` | 691 |
| `airtable_contacts` | 4,560 |
| `apollo_enrichment_inbox` | 7 |
| `attachments` | 14,855 |
| `body_metrics` | 56 |
| `calendar_dismissed` | 111 |
| `chats` | 860 |
| `cities` | 273 |
| `command_center_inbox` | 915 |
| `companies` | 2,336 |
| `companies_hold` | 20 |
| `company_attachments` | 655 |
| `company_cities` | 275 |
| `company_domains` | 1,289 |
| `company_duplicates` | 36 |
| `company_duplicates_completed` | 68 |
| `company_tags` | 779 |
| `contact_chats` | 2,564 |
| `contact_cities` | 1,618 |
| `contact_companies` | 1,074 |
| `contact_duplicates` | 110 |
| `contact_duplicates_completed` | 487 |
| `contact_email_threads` | 8,688 |
| `contact_emails` | 2,562 |
| `contact_mobiles` | 1,501 |
| `contact_mobiles_backup` | 1,384 |
| `contact_tags` | 2,321 |
| `contacts` | 2,795 |
| `contacts_clarissa_processing` | 103 |
| `contacts_hold` | 33 |
| `daily_log` | 1 |
| `data_integrity_inbox` | 1,099 |
| `data_integrity_queue` | 3,688 |
| `db_version` | 0 |
| `deal_attachments` | 26 |
| `deal_companies` | 40 |
| `deal_submission_otp` | 9 |
| `deal_tags` | 0 |
| `deals` | 54 |
| `deals_contacts` | 55 |
| `debug_logs` | 28,206 |
| `decision_companies` | 0 |
| `decision_contacts` | 2 |
| `decision_deals` | 0 |
| `decisions` | 5 |
| `domains_spam` | 688 |
| `duplicates_inbox` | 1 |
| `email_campaign_logs` | 0 |
| `email_campaigns` | 0 |
| `email_inbox` | 18 |
| `email_list_filter_categories` | 0 |
| `email_list_filter_christmas` | 6 |
| `email_list_filter_cities` | 2 |
| `email_list_filter_completeness` | 1 |
| `email_list_filter_easter` | 0 |
| `email_list_filter_kit` | 0 |
| `email_list_filter_scores` | 1 |
| `email_list_filter_tags` | 0 |
| `email_list_members` | 3,578 |
| `email_lists` | 10 |
| `email_participants` | 19,185 |
| `email_receivers` | 278 |
| `email_templates` | 5 |
| `email_threads` | 4,055 |
| `emails` | 6,740 |
| `emails_spam` | 977 |
| `exercises` | 1 |
| `goals` | 0 |
| `ingredients` | 79 |
| `interactions` | 72,300 |
| `introduction_contacts` | 75 |
| `introductions` | 38 |
| `investment_tags` | 0 |
| `investments` | 0 |
| `investments_contacts` | 0 |
| `keep_in_touch` | 786 |
| `kit_table` | 527 |
| `meal_ingredients` | 106 |
| `meals` | 37 |
| `meeting_contacts` | 61 |
| `meeting_deals` | 0 |
| `meetings` | 44 |
| `migration_history` | 0 |
| `note_attachments` | 0 |
| `note_companies` | 0 |
| `note_deals` | 0 |
| `note_introductions` | 0 |
| `note_meetings` | 2 |
| `notes` | 882 |
| `notes_contacts` | 219 |
| `obsidian_sync_state` | 0 |
| `passed` | 0 |
| `priorities` | 7 |
| `processed_emails` | 0 |
| `recipe_ingredients` | 45 |
| `recipes` | 13 |
| `refresh_logs` | 0 |
| `routine_schedule` | 0 |
| `settings` | 4 |
| `sync_state` | 3 |
| `tags` | 605 |
| `task_chats` | 0 |
| `task_companies` | 1 |
| `task_contacts` | 25 |
| `task_deals` | 2 |
| `task_files` | 0 |
| `task_notes` | 0 |
| `tasks` | 351 |
| `todoist_sync_state` | 1 |
| `training_session_exercises` | 0 |
| `training_sessions` | 6 |
| `weekly_plans` | 53 |
| `whatsapp_chat_done` | 245 |
| `whatsapp_inbox` | 0 |
| `whatsapp_spam` | 48 |
| `workout_template_exercises` | 0 |
| `workout_templates` | 0 |

**Total base tables: 120**

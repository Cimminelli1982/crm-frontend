# Email Access Guide for AI Agents

**Target Audience:** AI agents (like OpenClaw) that need to query and analyze emails stored in the CRM system.

**Last Updated:** 2026-03-07

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Email Data Flow](#email-data-flow)
3. [Supabase Database Schema](#supabase-database-schema)
4. [How to Query Emails](#how-to-query-emails)
5. [Understanding Email States](#understanding-email-states)
6. [Common Query Patterns](#common-query-patterns)
7. [Email Thread Relationships](#email-thread-relationships)
8. [Fastmail JMAP Access (Advanced)](#fastmail-jmap-access-advanced)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

The CRM uses a **two-tier email storage system**:

```
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL DATA FLOW                          │
└─────────────────────────────────────────────────────────────┘

    Fastmail (JMAP)                Backend                Supabase
         │                            │                       │
         │  ◄───── Fetch (60s) ──────┤                       │
         │                            │                       │
         │  ─────► Raw emails ────────►                       │
         │                            │                       │
         │                            │  ──► Staging ────►    │
         │                            │     (command_         │
         │                            │      center_inbox)    │
         │                            │                       │
         │                            │                       │
         │                      User clicks "Done"            │
         │                            │                       │
         │                            │  ──► Production ───►  │
         │                            │     (emails,          │
         │                            │      email_threads,   │
         │                            │      interactions)    │
```

### Key Concepts

1. **Staging Area:** `command_center_inbox` - All new emails land here first
2. **Production Area:** `emails`, `email_threads`, `interactions` - Emails move here after user processing
3. **Sync Frequency:** Every 60 seconds from Fastmail
4. **Spam Filtering:** Automatic blocking via `emails_spam` and `domains_spam` tables

---

## Email Data Flow

### Step-by-Step Journey of an Email

```
1. Email arrives in Fastmail inbox/sent folder
         ↓
2. Backend fetches via JMAP (every 60s)
         ↓
3. Spam check (3 levels):
   - Hardcoded name patterns
   - emails_spam table (exact email match)
   - domains_spam table (domain match)
         ↓
4. If NOT spam → INSERT into command_center_inbox
   If spam → Move to Skip_Email/Skip_Domain folder in Fastmail
         ↓
5. Mark email in Fastmail with keyword: $crm_done
         ↓
6. Email appears in CRM frontend "Email" tab
         ↓
7. User processes email (clicks "Done" button)
         ↓
8. Backend /email/save-and-archive endpoint:
   - Creates/updates email_thread
   - Creates email record
   - Creates interaction records
   - Links participants via email_participants
   - Removes from command_center_inbox
         ↓
9. Email now accessible via production tables
```

---

## Supabase Database Schema

### 1. Staging Table: `command_center_inbox`

**Purpose:** Temporary staging area for incoming emails before user processing.

**Key Fields:**
```sql
CREATE TABLE command_center_inbox (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type              TEXT DEFAULT 'email',  -- Always 'email' for emails

  -- Email Identifiers
  fastmail_id       TEXT UNIQUE,           -- Fastmail message ID (dedup key)
  thread_id         TEXT,                  -- Fastmail thread ID

  -- Sender Info
  from_email        TEXT,
  from_name         TEXT,

  -- Recipients (JSON arrays)
  to_recipients     JSONB,                 -- [{email: "...", name: "..."}, ...]
  cc_recipients     JSONB,                 -- [{email: "...", name: "..."}, ...]

  -- Content
  subject           TEXT,
  body_text         TEXT,                  -- Plain text version
  body_html         TEXT,                  -- HTML version
  snippet           TEXT,                  -- Preview (first ~100 chars)

  -- Metadata
  date              TIMESTAMPTZ,           -- When email was sent/received
  direction         TEXT,                  -- 'sent' or 'received'
  is_read           BOOLEAN DEFAULT false,
  is_starred        BOOLEAN DEFAULT false,
  has_attachments   BOOLEAN DEFAULT false,

  -- Attachments (JSON array)
  attachments       JSONB,                 -- [{name, type, size, blobId}, ...]

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

**Example JSON Structures:**

```json
// to_recipients / cc_recipients format
[
  {"email": "john@example.com", "name": "John Doe"},
  {"email": "jane@example.com", "name": "Jane Smith"}
]

// attachments format
[
  {
    "name": "document.pdf",
    "type": "application/pdf",
    "size": 245632,
    "blobId": "G1234567890abcdef"
  }
]
```

### 2. Production Tables

#### `email_threads`

**Purpose:** Groups related emails into conversations.

```sql
CREATE TABLE email_threads (
  email_thread_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id         TEXT,                  -- Original Fastmail thread_id
  subject           TEXT,
  last_message_date TIMESTAMPTZ,
  message_count     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

#### `emails`

**Purpose:** Individual email messages.

```sql
CREATE TABLE emails (
  email_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_thread_id   UUID REFERENCES email_threads(email_thread_id),

  -- Identifiers
  gmail_id          TEXT,                  -- Legacy field (was Gmail, now Fastmail)
  thread_id         TEXT,                  -- Fastmail thread ID

  -- Content
  subject           TEXT,
  body              TEXT,                  -- Full body (text or HTML)
  snippet           TEXT,

  -- Metadata
  date              TIMESTAMPTZ,
  direction         TEXT,                  -- 'sent' or 'received'
  has_attachments   BOOLEAN DEFAULT false,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

#### `email_participants`

**Purpose:** Links contacts to emails (sender, to, cc).

```sql
CREATE TABLE email_participants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id          UUID REFERENCES emails(email_id),
  contact_id        UUID REFERENCES contacts(contact_id),
  participant_type  TEXT,                  -- 'from', 'to', 'cc'
  email_address     TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

#### `interactions`

**Purpose:** Tracks all communication history (emails, WhatsApp, calls, meetings, etc.).

```sql
CREATE TABLE interactions (
  interaction_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id            UUID REFERENCES contacts(contact_id),

  -- Type & Direction
  interaction_type      interaction_type NOT NULL,  -- 'email', 'whatsapp', 'meeting', 'call', 'note'
  direction             interaction_direction,      -- 'sent', 'received', 'neutral', 'interactive'

  -- Content
  summary               TEXT,

  -- Links to specific records
  email_thread_id       UUID REFERENCES email_threads(email_thread_id),
  chat_id               UUID REFERENCES chats(id),

  -- Metadata
  interaction_date      TIMESTAMPTZ NOT NULL,
  external_interaction_id TEXT,
  special_case_tag      TEXT,

  created_at            TIMESTAMPTZ DEFAULT now()
);
```

**Enums:**
- `interaction_type`: `email`, `whatsapp`, `meeting`, `note`, `call`, `slack`, `sms`
- `interaction_direction`: `sent`, `received`, `neutral`, `interactive`

### 3. Spam Tables

#### `emails_spam`

**Purpose:** Block specific email addresses.

```sql
CREATE TABLE emails_spam (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  count         INTEGER DEFAULT 0,         -- How many times blocked
  category      TEXT,                      -- Optional categorization
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_seen_at  TIMESTAMPTZ DEFAULT now()
);
```

#### `domains_spam`

**Purpose:** Block entire domains (e.g., all emails from @spammer.com).

```sql
CREATE TABLE domains_spam (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain        TEXT UNIQUE NOT NULL,      -- e.g., "spammer.com"
  count         INTEGER DEFAULT 0,
  category      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_seen_at  TIMESTAMPTZ DEFAULT now()
);
```

### 4. Support Tables

#### `contacts`

**Purpose:** Contact records in CRM.

```sql
CREATE TABLE contacts (
  contact_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name            TEXT,
  last_name             TEXT,
  profile_image_url     TEXT,
  description           TEXT,
  job_role              TEXT,
  category              contact_category DEFAULT 'Inbox',
  score                 INTEGER,
  last_interaction_at   TIMESTAMPTZ,      -- Updated when interaction created
  created_at            TIMESTAMPTZ DEFAULT now(),
  -- ... other fields
);
```

#### `contact_emails`

**Purpose:** Email addresses for contacts (1:many relationship).

```sql
CREATE TABLE contact_emails (
  email_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id    UUID REFERENCES contacts(contact_id),
  email         VARCHAR NOT NULL,
  type          contact_point_type DEFAULT 'personal',  -- 'work', 'personal', 'other'
  is_primary    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## How to Query Emails

### Access Methods

As an AI agent, you have access to the **Supabase PostgreSQL database** via:
- MCP Supabase tools: `mcp__supabase__*`
- Direct SQL queries via Supabase client

**Database Connection:**
- **Project ID:** `efazuvegwxouysfcgwja`
- **Region:** eu-central-1
- **Host:** `db.efazuvegwxouysfcgwja.supabase.co`

### Query Examples

#### 1. Get Recent Unprocessed Emails (Staging)

```sql
SELECT
  id,
  fastmail_id,
  from_email,
  from_name,
  subject,
  snippet,
  date,
  direction,
  is_read,
  has_attachments
FROM command_center_inbox
WHERE type = 'email'
ORDER BY date DESC
LIMIT 50;
```

#### 2. Get Processed Emails for a Contact

```sql
-- Find contact first
SELECT contact_id, first_name, last_name
FROM contacts
WHERE first_name ILIKE '%John%' AND last_name ILIKE '%Doe%';

-- Get their emails (via email_participants)
SELECT
  e.email_id,
  e.subject,
  e.date,
  e.direction,
  e.body,
  et.subject as thread_subject
FROM emails e
JOIN email_participants ep ON e.email_id = ep.email_id
LEFT JOIN email_threads et ON e.email_thread_id = et.email_thread_id
WHERE ep.contact_id = 'CONTACT_UUID_HERE'
ORDER BY e.date DESC;
```

#### 3. Search Emails by Subject or Content

```sql
-- In staging (command_center_inbox)
SELECT
  id,
  from_email,
  from_name,
  subject,
  snippet,
  date
FROM command_center_inbox
WHERE type = 'email'
  AND (
    subject ILIKE '%meeting%'
    OR body_text ILIKE '%meeting%'
  )
ORDER BY date DESC;

-- In production (emails)
SELECT
  email_id,
  subject,
  date,
  direction,
  snippet
FROM emails
WHERE
  subject ILIKE '%invoice%'
  OR body ILIKE '%invoice%'
ORDER BY date DESC;
```

#### 4. Get Email Thread with All Messages

```sql
-- Get thread
SELECT * FROM email_threads WHERE email_thread_id = 'THREAD_UUID';

-- Get all emails in thread
SELECT
  email_id,
  subject,
  date,
  direction,
  body,
  snippet
FROM emails
WHERE email_thread_id = 'THREAD_UUID'
ORDER BY date ASC;

-- Get all participants in thread
SELECT DISTINCT
  ep.participant_type,
  ep.email_address,
  c.first_name,
  c.last_name,
  c.contact_id
FROM email_participants ep
LEFT JOIN contacts c ON ep.contact_id = c.contact_id
WHERE ep.email_id IN (
  SELECT email_id FROM emails WHERE email_thread_id = 'THREAD_UUID'
);
```

#### 5. Get Recent Interactions for Contact

```sql
SELECT
  interaction_id,
  interaction_type,
  direction,
  interaction_date,
  summary,
  email_thread_id
FROM interactions
WHERE contact_id = 'CONTACT_UUID'
  AND interaction_type = 'email'
ORDER BY interaction_date DESC
LIMIT 20;
```

#### 6. Find Emails from Specific Domain

```sql
-- In staging
SELECT
  id,
  from_email,
  from_name,
  subject,
  date
FROM command_center_inbox
WHERE type = 'email'
  AND from_email ILIKE '%@example.com'
ORDER BY date DESC;
```

#### 7. Get Email Attachments

```sql
-- From staging (command_center_inbox)
SELECT
  id,
  subject,
  from_email,
  date,
  attachments
FROM command_center_inbox
WHERE type = 'email'
  AND has_attachments = true
  AND attachments IS NOT NULL
ORDER BY date DESC;

-- Example to extract attachment details (PostgreSQL JSON query)
SELECT
  id,
  subject,
  from_email,
  jsonb_array_elements(attachments) as attachment
FROM command_center_inbox
WHERE type = 'email'
  AND has_attachments = true;
```

#### 8. Check if Email is Spam

```sql
-- Check if specific email is blocked
SELECT * FROM emails_spam WHERE email = 'spammer@example.com';

-- Check if domain is blocked
SELECT * FROM domains_spam WHERE domain = 'spammer.com';

-- Check all spam sources
SELECT 'email' as type, email as value, count FROM emails_spam
UNION ALL
SELECT 'domain' as type, domain as value, count FROM domains_spam
ORDER BY count DESC;
```

---

## Understanding Email States

### Email Lifecycle States

```
┌──────────────────────────────────────────────────────────┐
│  STATE 1: IN FASTMAIL                                     │
│  - Email exists in Fastmail inbox/sent                    │
│  - Not yet synced to CRM                                  │
└──────────────────────────────────────────────────────────┘
                      ↓
                  (60s sync)
                      ↓
┌──────────────────────────────────────────────────────────┐
│  STATE 2: IN STAGING (command_center_inbox)              │
│  - Email synced from Fastmail                            │
│  - Visible in CRM "Email" tab                            │
│  - Waiting for user to process                           │
│  - Can be: Done, Spam, Archive, Read                     │
└──────────────────────────────────────────────────────────┘
                      ↓
              (User clicks "Done")
                      ↓
┌──────────────────────────────────────────────────────────┐
│  STATE 3: IN PRODUCTION (emails, email_threads)          │
│  - Processed and archived                                │
│  - Linked to contacts via email_participants             │
│  - Interaction records created                           │
│  - Removed from command_center_inbox                     │
│  - Permanent storage                                     │
└──────────────────────────────────────────────────────────┘
```

### How to Determine Email State

```sql
-- Check if email is in staging
SELECT * FROM command_center_inbox
WHERE type = 'email'
  AND fastmail_id = 'FASTMAIL_ID';

-- Check if email is in production
SELECT * FROM emails
WHERE gmail_id = 'FASTMAIL_ID';  -- Note: field is called gmail_id but stores Fastmail ID

-- Check if email created an interaction
SELECT * FROM interactions
WHERE email_thread_id IN (
  SELECT email_thread_id FROM emails WHERE gmail_id = 'FASTMAIL_ID'
);
```

### State Indicators

| State | Location | Indicators |
|-------|----------|------------|
| **Unsynced** | Fastmail only | Not in any CRM table |
| **Staged** | `command_center_inbox` | `type = 'email'`, `is_read = false/true` |
| **Processed** | `emails`, `email_threads` | Has `email_id`, linked to thread |
| **Archived** | `emails` + interaction created | Has interaction record, removed from inbox |
| **Spam** | `emails_spam` or `domains_spam` | Email/domain in spam tables |

---

## Common Query Patterns

### Pattern 1: Find All Emails for a Person (by email address)

```sql
-- Step 1: Find contact by email
SELECT c.contact_id, c.first_name, c.last_name, ce.email
FROM contacts c
JOIN contact_emails ce ON c.contact_id = ce.contact_id
WHERE ce.email = 'john.doe@example.com';

-- Step 2: Get their emails (staging)
SELECT * FROM command_center_inbox
WHERE type = 'email'
  AND (
    from_email = 'john.doe@example.com'
    OR to_recipients::text ILIKE '%john.doe@example.com%'
    OR cc_recipients::text ILIKE '%john.doe@example.com%'
  )
ORDER BY date DESC;

-- Step 3: Get their emails (production)
SELECT e.*
FROM emails e
JOIN email_participants ep ON e.email_id = ep.email_id
WHERE ep.email_address = 'john.doe@example.com'
ORDER BY e.date DESC;
```

### Pattern 2: Find Emails in Date Range

```sql
-- Last 7 days (staging)
SELECT * FROM command_center_inbox
WHERE type = 'email'
  AND date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;

-- Last 30 days (production)
SELECT * FROM emails
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;

-- Specific date range
SELECT * FROM emails
WHERE date BETWEEN '2026-03-01' AND '2026-03-07'
ORDER BY date DESC;
```

### Pattern 3: Get Email Count Statistics

```sql
-- Total emails in staging
SELECT COUNT(*) as total_staging
FROM command_center_inbox
WHERE type = 'email';

-- Total emails in production
SELECT COUNT(*) as total_production
FROM emails;

-- Emails per contact (top 10)
SELECT
  c.first_name,
  c.last_name,
  COUNT(ep.email_id) as email_count
FROM contacts c
JOIN email_participants ep ON c.contact_id = ep.contact_id
GROUP BY c.contact_id, c.first_name, c.last_name
ORDER BY email_count DESC
LIMIT 10;

-- Emails by direction
SELECT
  direction,
  COUNT(*) as count
FROM emails
GROUP BY direction;
```

### Pattern 4: Search for Keywords Across All Emails

```sql
-- Search staging
SELECT
  id,
  from_email,
  subject,
  snippet,
  date,
  ts_rank(
    to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, '')),
    plainto_tsquery('english', 'investment opportunity')
  ) as rank
FROM command_center_inbox
WHERE type = 'email'
  AND to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, ''))
      @@ plainto_tsquery('english', 'investment opportunity')
ORDER BY rank DESC, date DESC;

-- Simple ILIKE search (slower but simpler)
SELECT * FROM command_center_inbox
WHERE type = 'email'
  AND (
    subject ILIKE '%investment%'
    OR body_text ILIKE '%investment%'
  )
ORDER BY date DESC;
```

### Pattern 5: Get Complete Email Context

```sql
-- Given an email_id in production, get everything
WITH email_data AS (
  SELECT
    e.*,
    et.subject as thread_subject,
    et.message_count
  FROM emails e
  LEFT JOIN email_threads et ON e.email_thread_id = et.email_thread_id
  WHERE e.email_id = 'EMAIL_UUID'
)
SELECT
  ed.*,
  json_agg(
    json_build_object(
      'participant_type', ep.participant_type,
      'email', ep.email_address,
      'contact_id', ep.contact_id,
      'first_name', c.first_name,
      'last_name', c.last_name
    )
  ) as participants
FROM email_data ed
LEFT JOIN email_participants ep ON ed.email_id = ep.email_id
LEFT JOIN contacts c ON ep.contact_id = c.contact_id
GROUP BY ed.email_id, ed.subject, ed.body, ed.date, ed.direction,
         ed.thread_subject, ed.message_count;
```

---

## Email Thread Relationships

### Understanding Threads

Email threads group related messages together (like a conversation).

```
email_threads (1) ──< emails (many)
                      │
                      └──< email_participants (many)
                              │
                              └──> contacts
```

### Thread Query Examples

```sql
-- Get most active threads (by message count)
SELECT
  email_thread_id,
  subject,
  message_count,
  last_message_date
FROM email_threads
ORDER BY message_count DESC
LIMIT 10;

-- Get threads with specific contact
SELECT DISTINCT
  et.email_thread_id,
  et.subject,
  et.message_count,
  et.last_message_date
FROM email_threads et
JOIN emails e ON et.email_thread_id = e.email_thread_id
JOIN email_participants ep ON e.email_id = ep.email_id
WHERE ep.contact_id = 'CONTACT_UUID'
ORDER BY et.last_message_date DESC;

-- Get all messages in thread with participants
SELECT
  e.email_id,
  e.date,
  e.direction,
  e.subject,
  e.snippet,
  array_agg(DISTINCT ep.email_address) as all_participants
FROM emails e
JOIN email_participants ep ON e.email_id = ep.email_id
WHERE e.email_thread_id = 'THREAD_UUID'
GROUP BY e.email_id, e.date, e.direction, e.subject, e.snippet
ORDER BY e.date ASC;
```

---

## Fastmail JMAP Access (Advanced)

### Overview

If you need to access emails **directly from Fastmail** (bypassing Supabase), you'll need JMAP credentials.

**Important:** Most queries should use Supabase. Only use JMAP for:
- Real-time email sending
- Downloading attachments (via blobId)
- Debugging sync issues

### JMAP Endpoints

```
Base URL: https://api.fastmail.com/jmap/api/
Authentication: Bearer token (FASTMAIL_API_TOKEN)
Account ID: Usually found in session response
```

### Example JMAP Queries

#### Get Email by ID

```javascript
// JMAP request
POST https://api.fastmail.com/jmap/api/
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
  "methodCalls": [
    ["Email/get", {
      "accountId": "ACCOUNT_ID",
      "ids": ["EMAIL_ID"]
    }, "0"]
  ]
}
```

#### Search Emails

```javascript
{
  "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
  "methodCalls": [
    ["Email/query", {
      "accountId": "ACCOUNT_ID",
      "filter": {
        "inMailbox": "INBOX_ID",
        "after": "2026-03-01T00:00:00Z"
      },
      "sort": [{"property": "receivedAt", "isAscending": false}],
      "limit": 50
    }, "0"],
    ["Email/get", {
      "accountId": "ACCOUNT_ID",
      "#ids": {
        "resultOf": "0",
        "name": "Email/query",
        "path": "/ids"
      },
      "properties": ["id", "subject", "from", "to", "receivedAt", "preview"]
    }, "1"]
  ]
}
```

#### Download Attachment Blob

```javascript
// Step 1: Get email with attachments
["Email/get", {
  "accountId": "ACCOUNT_ID",
  "ids": ["EMAIL_ID"],
  "properties": ["attachments"]
}, "0"]

// Step 2: Download blob
GET https://api.fastmail.com/jmap/download/ACCOUNT_ID/BLOB_ID
Authorization: Bearer YOUR_TOKEN
```

### When to Use JMAP vs Supabase

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Read recent emails | ✅ Supabase | Already synced, faster |
| Search old emails (>1 month) | ✅ Supabase | Indexed, full-text search |
| Send email | ✅ JMAP | Fastmail is SMTP |
| Download attachments | ✅ JMAP | Blobs stored in Fastmail |
| Real-time new emails | ⚠️ Either | Supabase has <60s delay |
| Modify email (mark read/starred) | ✅ JMAP | Primary source |

---

## Troubleshooting

### Problem: Email not appearing in CRM

**Check:**
1. Is it spam?
   ```sql
   SELECT * FROM emails_spam WHERE email = 'sender@example.com';
   SELECT * FROM domains_spam WHERE domain = 'example.com';
   ```

2. Is it marked with `$crm_done` in Fastmail?
   - Check via JMAP: look for `keywords['$crm_done']`
   - If yes, it was already synced

3. Was it synced recently?
   ```sql
   SELECT * FROM command_center_inbox
   WHERE type = 'email'
     AND from_email = 'sender@example.com'
   ORDER BY created_at DESC LIMIT 10;
   ```

### Problem: Duplicate emails

**Check:**
- Staging: Should never happen (UNIQUE constraint on `fastmail_id`)
- Production: Possible if email was processed multiple times

```sql
-- Find duplicate emails
SELECT gmail_id, COUNT(*) as count
FROM emails
GROUP BY gmail_id
HAVING COUNT(*) > 1;
```

### Problem: Missing email content

**Check:**
1. Is it in staging or production?
2. Check `body_text` and `body_html` fields:
   ```sql
   SELECT id, subject,
          LENGTH(body_text) as text_length,
          LENGTH(body_html) as html_length
   FROM command_center_inbox
   WHERE id = 'INBOX_ID';
   ```

### Problem: Contact not linked to email

**Check:**
1. Does contact have this email address?
   ```sql
   SELECT * FROM contact_emails WHERE email = 'person@example.com';
   ```

2. Is email processed (in production)?
   ```sql
   SELECT * FROM email_participants WHERE email_address = 'person@example.com';
   ```

3. If in staging, it won't be linked yet (links created on "Done")

---

## Summary: Key Takeaways

1. **Two Storage Layers:**
   - Staging: `command_center_inbox` (temporary, unprocessed)
   - Production: `emails`, `email_threads`, `interactions` (permanent, processed)

2. **Query Strategy:**
   - Recent/unprocessed: Query `command_center_inbox`
   - Historical/processed: Query `emails` + joins
   - Contact-specific: Use `email_participants` to link

3. **Spam Filtering:**
   - Check `emails_spam` and `domains_spam` tables
   - Emails in these tables never reach `command_center_inbox`

4. **Email States:**
   - Unsynced → Staged → Processed → Archived
   - Use timestamps to track lifecycle

5. **Best Practices:**
   - Always filter by `type = 'email'` when querying `command_center_inbox`
   - Use JOINs to get contact names from email addresses
   - Check both staging and production for complete view
   - Use full-text search for content queries
   - Respect JSONB structures for recipients and attachments

---

## Quick Reference: Essential Queries

```sql
-- 1. Recent unprocessed emails
SELECT * FROM command_center_inbox
WHERE type = 'email'
ORDER BY date DESC LIMIT 20;

-- 2. Emails for contact
SELECT e.* FROM emails e
JOIN email_participants ep ON e.email_id = ep.email_id
WHERE ep.contact_id = 'CONTACT_UUID'
ORDER BY e.date DESC;

-- 3. Search by subject
SELECT * FROM emails
WHERE subject ILIKE '%keyword%'
ORDER BY date DESC;

-- 4. Email with full context
SELECT e.*, et.subject as thread_subject,
       array_agg(ep.email_address) as participants
FROM emails e
LEFT JOIN email_threads et ON e.email_thread_id = et.email_thread_id
LEFT JOIN email_participants ep ON e.email_id = ep.email_id
WHERE e.email_id = 'EMAIL_UUID'
GROUP BY e.email_id, et.subject;

-- 5. Check if spam
SELECT * FROM emails_spam WHERE email = 'test@example.com';
```

---

## Contact Information

**Database:**
- Project: CRM (Supabase)
- Project ID: `efazuvegwxouysfcgwja`
- Region: eu-central-1

**Backend Services:**
- Email sync: `command-center-backend` (Railway)
- Documentation: `/home/user/crm-frontend/docs/DATA_INGESTION.md`

---

**Document Version:** 1.0
**Last Updated:** 2026-03-07
**Maintained by:** CRM Team

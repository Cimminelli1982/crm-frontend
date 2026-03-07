# WhatsApp Access Guide for AI Agents

**Target Audience:** AI agents (like OpenClaw) that need to query and analyze WhatsApp messages stored in the CRM system.

**Last Updated:** 2026-03-07

---

## Table of Contents
1. [System Overview](#system-overview)
2. [WhatsApp Data Flow](#whatsapp-data-flow)
3. [Supabase Database Schema](#supabase-database-schema)
4. [How to Query WhatsApp Messages](#how-to-query-whatsapp-messages)
5. [Understanding Message States](#understanding-message-states)
6. [Common Query Patterns](#common-query-patterns)
7. [Chat & Contact Relationships](#chat--contact-relationships)
8. [Sending Messages (Baileys)](#sending-messages-baileys)
9. [TimelinesAI Integration](#timelinesai-integration)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

The CRM uses a **two-tier WhatsApp storage system** with different providers for sending vs receiving:

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP DATA FLOW                       │
└─────────────────────────────────────────────────────────────┘

   RECEIVING                       Backend                Supabase
   (TimelinesAI)                      │                       │
         │                            │                       │
         │  ──── Webhook (PUSH) ─────►                       │
         │                            │                       │
         │                     crm-agent-service (Python)    │
         │                            │                       │
         │                            │  ──► Staging ────►    │
         │                            │     (command_         │
         │                            │      center_inbox)    │
         │                            │                       │
         │                      User clicks "Done"            │
         │                            │                       │
         │                            │  ──► Production ───►  │
         │                            │     (chats,           │
         │                            │      interactions)    │
                                      │                       │
                                      │                       │
   SENDING                            │                       │
   (Baileys)                          │                       │
         │                            │                       │
   Frontend  ──► command-center-backend (Node.js)            │
         │              │                                     │
         │         Baileys.js                                 │
         │              │                                     │
         └──────────────► WhatsApp Web Protocol              │
                          │                                   │
                          └─► Multi-device sync ──► TimelinesAI (loops back)
```

### Key Concepts

1. **Receiving:** TimelinesAI webhook → Python backend → `command_center_inbox`
2. **Sending:** Baileys (Node.js) → WhatsApp Web Protocol (FREE, no API cost)
3. **Staging Area:** `command_center_inbox` - New messages land here first
4. **Production Area:** `chats`, `interactions`, `contact_chats` - Processed messages
5. **Spam Filtering:** Automatic blocking via `whatsapp_spam` table
6. **Multi-device Sync:** Sent messages (Baileys) appear in TimelinesAI automatically

---

## WhatsApp Data Flow

### Receiving Messages (Incoming)

```
1. Message arrives on WhatsApp
         ↓
2. TimelinesAI receives it (connected as WhatsApp Web device)
         ↓
3. TimelinesAI webhook fires → POST to crm-agent-service
         ↓
4. Python backend parses payload:
   - message, chat, whatsapp_account
   - direction (sent/received)
   - contact_phone, contact_name
         ↓
5. Spam check (whatsapp_spam table by phone number)
         ↓
6. If NOT spam → INSERT into command_center_inbox
   If spam → Increment counter, return early (nothing saved)
         ↓
7. Message appears in CRM frontend "WhatsApp" tab
         ↓
8. User processes message (clicks "Done" button)
         ↓
9. Backend creates:
   - chats record (or updates existing)
   - interaction record
   - contact_chats link
   - Removes from command_center_inbox
         ↓
10. Message now accessible via production tables
```

### Sending Messages (Outgoing)

```
1. User composes message in CRM frontend
         ↓
2. Frontend checks Baileys connection status
         ↓
3. POST to command-center-backend /whatsapp/send
         ↓
4. Baileys.js sends via WhatsApp Web Protocol
         ↓
5. Message delivered to recipient
         ↓
6. WhatsApp multi-device sync propagates to all devices
         ↓
7. TimelinesAI receives the sent message (as synced device)
         ↓
8. TimelinesAI webhook fires (direction: "sent")
         ↓
9. Flow continues from step 4 of "Receiving Messages" above
         ↓
10. Sent message stored in Supabase automatically
```

**Key Insight:** Even though we send via Baileys, messages still get saved to Supabase because TimelinesAI sees them via multi-device sync!

---

## Supabase Database Schema

### 1. Staging Table: `command_center_inbox`

**Purpose:** Temporary staging area for incoming WhatsApp messages before user processing.

**Key Fields:**
```sql
CREATE TABLE command_center_inbox (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type              TEXT DEFAULT 'whatsapp',  -- 'whatsapp' for WhatsApp messages

  -- Contact Info
  from_name         TEXT,
  first_name        TEXT,
  last_name         TEXT,
  contact_number    TEXT,                      -- Phone number (e.g., "+393456789012")

  -- Chat Info
  chat_id           TEXT,                      -- Chat identifier
  chat_jid          TEXT,                      -- WhatsApp JID (e.g., "123456@s.whatsapp.net")
  chat_name         TEXT,                      -- Chat display name
  is_group_chat     BOOLEAN DEFAULT false,     -- True for group chats

  -- Message Content
  subject           TEXT,                      -- Usually same as chat_name
  body_text         TEXT,                      -- Message content
  snippet           TEXT,                      -- Preview (first ~100 chars)

  -- Metadata
  date              TIMESTAMPTZ,               -- Message timestamp
  direction         TEXT DEFAULT 'received',   -- 'sent' or 'received'
  message_uid       TEXT,                      -- Unique message ID from TimelinesAI
  receiver          TEXT,                      -- WhatsApp account that received it

  -- Attachments
  has_attachments   BOOLEAN DEFAULT false,
  attachments       JSONB,                     -- [{url, name, type, size}, ...]

  -- Status
  is_read           BOOLEAN DEFAULT false,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

**Example JSON Structures:**

```json
// attachments format
[
  {
    "url": "https://timelines.ai/api/media/abc123",
    "name": "photo.jpg",
    "type": "image/jpeg",
    "size": 245632
  }
]
```

### 2. Production Tables

#### `chats`

**Purpose:** Represents WhatsApp conversations (1-on-1 or groups).

```sql
CREATE TABLE chats (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_name         TEXT,                      -- Display name of chat
  chat_id           TEXT,                      -- External chat identifier
  is_group          BOOLEAN DEFAULT false,     -- True for group chats
  chat_jid          TEXT,                      -- WhatsApp JID
  last_message_date TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

**Note:**
- 1-on-1 chats: `chat_name` is usually the contact's name
- Group chats: `chat_name` is the group name, `is_group = true`

#### `contact_chats`

**Purpose:** Links contacts to chats (many-to-many relationship).

```sql
CREATE TABLE contact_chats (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id        UUID REFERENCES contacts(contact_id),
  chat_id           UUID REFERENCES chats(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, chat_id)
);
```

**Usage:**
- For 1-on-1 chats: Single entry linking the contact to the chat
- For group chats: Multiple entries (one per participant)

#### `interactions`

**Purpose:** Tracks all communication history including WhatsApp messages.

```sql
CREATE TABLE interactions (
  interaction_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id            UUID REFERENCES contacts(contact_id),

  -- Type & Direction
  interaction_type      interaction_type NOT NULL,  -- 'whatsapp' for WhatsApp
  direction             interaction_direction,      -- 'sent', 'received', 'interactive'

  -- Content
  summary               TEXT,

  -- Links to specific records
  chat_id               UUID REFERENCES chats(id),  -- Link to WhatsApp chat

  -- Metadata
  interaction_date      TIMESTAMPTZ NOT NULL,
  external_interaction_id TEXT,                     -- message_uid from TimelinesAI
  special_case_tag      TEXT,

  created_at            TIMESTAMPTZ DEFAULT now()
);
```

**Enums:**
- `interaction_type`: `email`, `whatsapp`, `meeting`, `note`, `call`, `slack`, `sms`
- `interaction_direction`: `sent`, `received`, `neutral`, `interactive`

### 3. Spam Table

#### `whatsapp_spam`

**Purpose:** Block specific phone numbers from appearing in the CRM.

```sql
CREATE TABLE whatsapp_spam (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mobile_number     TEXT UNIQUE NOT NULL,      -- Phone number to block
  count             INTEGER DEFAULT 0,         -- How many times blocked
  category          TEXT,                      -- Optional categorization
  created_at        TIMESTAMPTZ DEFAULT now(),
  last_seen_at      TIMESTAMPTZ DEFAULT now()
);
```

**Behavior:**
- Messages from blocked numbers are NOT saved to `command_center_inbox`
- Counter increments each time a blocked message arrives
- No wildcard support (unlike email domains)

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

#### `contact_mobiles`

**Purpose:** Phone numbers for contacts (1:many relationship).

```sql
CREATE TABLE contact_mobiles (
  mobile_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id    UUID REFERENCES contacts(contact_id),
  mobile        TEXT NOT NULL,
  type          contact_point_type DEFAULT 'personal',  -- 'work', 'personal', 'WhatsApp', 'WhatsApp Group'
  is_primary    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**Types:**
- `personal` - Personal phone
- `work` - Work phone
- `WhatsApp` - WhatsApp number
- `WhatsApp Group` - Group chat identifier
- `other` - Other

---

## How to Query WhatsApp Messages

### Access Methods

As an AI agent, you have access to the **Supabase PostgreSQL database** via:
- MCP Supabase tools: `mcp__supabase__*`
- Direct SQL queries via Supabase client

**Database Connection:**
- **Project ID:** `efazuvegwxouysfcgwja`
- **Region:** eu-central-1
- **Host:** `db.efazuvegwxouysfcgwja.supabase.co`

### Query Examples

#### 1. Get Recent Unprocessed WhatsApp Messages (Staging)

```sql
SELECT
  id,
  from_name,
  contact_number,
  chat_name,
  body_text,
  snippet,
  date,
  direction,
  is_group_chat,
  has_attachments
FROM command_center_inbox
WHERE type = 'whatsapp'
ORDER BY date DESC
LIMIT 50;
```

#### 2. Get Processed WhatsApp Messages for a Contact

```sql
-- Find contact first
SELECT contact_id, first_name, last_name
FROM contacts
WHERE first_name ILIKE '%John%' AND last_name ILIKE '%Doe%';

-- Get their WhatsApp messages (via interactions + chat)
SELECT
  i.interaction_id,
  i.interaction_date,
  i.direction,
  i.summary,
  c.chat_name,
  c.is_group
FROM interactions i
LEFT JOIN chats c ON i.chat_id = c.id
WHERE i.contact_id = 'CONTACT_UUID_HERE'
  AND i.interaction_type = 'whatsapp'
ORDER BY i.interaction_date DESC;
```

#### 3. Get All Messages in a Specific Chat

```sql
-- Find chat by name
SELECT id, chat_name, is_group
FROM chats
WHERE chat_name ILIKE '%Group Name%';

-- Get all interactions in that chat
SELECT
  i.interaction_id,
  i.interaction_date,
  i.direction,
  i.summary,
  c.first_name,
  c.last_name
FROM interactions i
LEFT JOIN contacts c ON i.contact_id = c.contact_id
WHERE i.chat_id = 'CHAT_UUID'
ORDER BY i.interaction_date ASC;
```

#### 4. Search Messages by Content

```sql
-- In staging (command_center_inbox)
SELECT
  id,
  from_name,
  contact_number,
  chat_name,
  body_text,
  date
FROM command_center_inbox
WHERE type = 'whatsapp'
  AND body_text ILIKE '%meeting%'
ORDER BY date DESC;

-- In production (interactions)
SELECT
  i.interaction_id,
  i.interaction_date,
  i.summary,
  c.chat_name
FROM interactions i
LEFT JOIN chats c ON i.chat_id = c.id
WHERE i.interaction_type = 'whatsapp'
  AND i.summary ILIKE '%invoice%'
ORDER BY i.interaction_date DESC;
```

#### 5. Get Group Chat Messages with All Participants

```sql
-- Get group chat
SELECT * FROM chats WHERE is_group = true AND chat_name ILIKE '%Group Name%';

-- Get all participants
SELECT
  cc.chat_id,
  c.first_name,
  c.last_name,
  cm.mobile
FROM contact_chats cc
JOIN contacts c ON cc.contact_id = c.contact_id
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE cc.chat_id = 'CHAT_UUID'
  AND (cm.type = 'WhatsApp' OR cm.type = 'WhatsApp Group' OR cm.type IS NULL);

-- Get all messages in group
SELECT
  i.interaction_date,
  i.direction,
  i.summary,
  c.first_name,
  c.last_name
FROM interactions i
LEFT JOIN contacts c ON i.contact_id = c.contact_id
WHERE i.chat_id = 'CHAT_UUID'
ORDER BY i.interaction_date ASC;
```

#### 6. Find Messages from Specific Phone Number

```sql
-- In staging
SELECT
  id,
  from_name,
  contact_number,
  chat_name,
  body_text,
  date
FROM command_center_inbox
WHERE type = 'whatsapp'
  AND contact_number = '+393456789012'
ORDER BY date DESC;

-- In production (find contact first, then interactions)
SELECT c.contact_id
FROM contacts c
JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE cm.mobile = '+393456789012';

-- Then use contact_id in interaction query
```

#### 7. Get WhatsApp Attachments

```sql
-- From staging (command_center_inbox)
SELECT
  id,
  from_name,
  contact_number,
  chat_name,
  date,
  attachments
FROM command_center_inbox
WHERE type = 'whatsapp'
  AND has_attachments = true
  AND attachments IS NOT NULL
ORDER BY date DESC;

-- Extract attachment details (PostgreSQL JSON query)
SELECT
  id,
  from_name,
  chat_name,
  jsonb_array_elements(attachments) as attachment
FROM command_center_inbox
WHERE type = 'whatsapp'
  AND has_attachments = true;
```

#### 8. Check if Phone Number is Spam

```sql
-- Check if specific number is blocked
SELECT * FROM whatsapp_spam WHERE mobile_number = '+393456789012';

-- Check all spam numbers with count
SELECT mobile_number, count, category
FROM whatsapp_spam
ORDER BY count DESC;

-- Check if number matches spam (with variations)
SELECT * FROM whatsapp_spam
WHERE mobile_number IN ('+393456789012', '393456789012', '3456789012');
```

#### 9. Get Contact's WhatsApp Numbers

```sql
-- Get all WhatsApp numbers for a contact
SELECT
  cm.mobile,
  cm.type,
  cm.is_primary
FROM contact_mobiles cm
WHERE cm.contact_id = 'CONTACT_UUID'
  AND cm.type IN ('WhatsApp', 'WhatsApp Group', 'personal')
ORDER BY cm.is_primary DESC, cm.created_at ASC;
```

---

## Understanding Message States

### Message Lifecycle States

```
┌──────────────────────────────────────────────────────────┐
│  STATE 1: IN WHATSAPP                                     │
│  - Message exists in WhatsApp                            │
│  - Not yet received by TimelinesAI                       │
└──────────────────────────────────────────────────────────┘
                      ↓
                  (webhook)
                      ↓
┌──────────────────────────────────────────────────────────┐
│  STATE 2: IN STAGING (command_center_inbox)              │
│  - Message received via TimelinesAI webhook              │
│  - Visible in CRM "WhatsApp" tab                         │
│  - Waiting for user to process                           │
│  - Can be: Done, Spam, Delete                            │
└──────────────────────────────────────────────────────────┘
                      ↓
              (User clicks "Done")
                      ↓
┌──────────────────────────────────────────────────────────┐
│  STATE 3: IN PRODUCTION (chats, interactions)            │
│  - Processed and archived                                │
│  - Linked to contacts via contact_chats                  │
│  - Interaction record created                            │
│  - Removed from command_center_inbox                     │
│  - Permanent storage                                     │
└──────────────────────────────────────────────────────────┘
```

### How to Determine Message State

```sql
-- Check if message is in staging
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp'
  AND message_uid = 'MESSAGE_UID';

-- Check if message is in production (by chat and date)
SELECT * FROM interactions
WHERE interaction_type = 'whatsapp'
  AND chat_id = 'CHAT_UUID'
  AND interaction_date >= 'TIMESTAMP';

-- Check if contact has any WhatsApp interactions
SELECT COUNT(*) FROM interactions
WHERE contact_id = 'CONTACT_UUID'
  AND interaction_type = 'whatsapp';
```

### State Indicators

| State | Location | Indicators |
|-------|----------|------------|
| **Unreceived** | WhatsApp only | Not in any CRM table |
| **Staged** | `command_center_inbox` | `type = 'whatsapp'`, `is_read = false/true` |
| **Processed** | `chats`, `interactions` | Has `interaction_id`, linked to chat |
| **Archived** | `interactions` + removed from inbox | Has interaction record, not in inbox |
| **Spam** | `whatsapp_spam` | Phone number in spam table |

---

## Common Query Patterns

### Pattern 1: Find All WhatsApp Messages for a Person (by phone number)

```sql
-- Step 1: Find contact by phone
SELECT c.contact_id, c.first_name, c.last_name, cm.mobile
FROM contacts c
JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE cm.mobile = '+393456789012';

-- Step 2: Get their messages (staging)
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp'
  AND contact_number = '+393456789012'
ORDER BY date DESC;

-- Step 3: Get their messages (production)
SELECT i.*, ch.chat_name
FROM interactions i
LEFT JOIN chats ch ON i.chat_id = ch.id
WHERE i.contact_id = 'CONTACT_UUID'
  AND i.interaction_type = 'whatsapp'
ORDER BY i.interaction_date DESC;
```

### Pattern 2: Find Messages in Date Range

```sql
-- Last 7 days (staging)
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp'
  AND date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;

-- Last 30 days (production)
SELECT * FROM interactions
WHERE interaction_type = 'whatsapp'
  AND interaction_date >= NOW() - INTERVAL '30 days'
ORDER BY interaction_date DESC;

-- Specific date range
SELECT * FROM interactions
WHERE interaction_type = 'whatsapp'
  AND interaction_date BETWEEN '2026-03-01' AND '2026-03-07'
ORDER BY interaction_date DESC;
```

### Pattern 3: Get WhatsApp Statistics

```sql
-- Total messages in staging
SELECT COUNT(*) as total_staging
FROM command_center_inbox
WHERE type = 'whatsapp';

-- Total WhatsApp interactions in production
SELECT COUNT(*) as total_production
FROM interactions
WHERE interaction_type = 'whatsapp';

-- Messages per contact (top 10)
SELECT
  c.first_name,
  c.last_name,
  COUNT(i.interaction_id) as message_count
FROM contacts c
JOIN interactions i ON c.contact_id = i.contact_id
WHERE i.interaction_type = 'whatsapp'
GROUP BY c.contact_id, c.first_name, c.last_name
ORDER BY message_count DESC
LIMIT 10;

-- Messages by direction
SELECT
  direction,
  COUNT(*) as count
FROM interactions
WHERE interaction_type = 'whatsapp'
GROUP BY direction;

-- Group chats vs 1-on-1
SELECT
  is_group,
  COUNT(*) as chat_count
FROM chats
GROUP BY is_group;
```

### Pattern 4: Search for Keywords Across All WhatsApp Messages

```sql
-- Search staging (simple ILIKE)
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp'
  AND body_text ILIKE '%investment%'
ORDER BY date DESC;

-- Search production (interactions summary)
SELECT * FROM interactions
WHERE interaction_type = 'whatsapp'
  AND summary ILIKE '%meeting%'
ORDER BY interaction_date DESC;

-- Full-text search (advanced)
SELECT
  id,
  from_name,
  chat_name,
  snippet,
  date,
  ts_rank(
    to_tsvector('english', COALESCE(body_text, '')),
    plainto_tsquery('english', 'urgent project')
  ) as rank
FROM command_center_inbox
WHERE type = 'whatsapp'
  AND to_tsvector('english', COALESCE(body_text, ''))
      @@ plainto_tsquery('english', 'urgent project')
ORDER BY rank DESC, date DESC;
```

### Pattern 5: Get Complete Chat Context

```sql
-- Given a chat_id, get everything
WITH chat_data AS (
  SELECT
    ch.*,
    COUNT(DISTINCT cc.contact_id) as participant_count,
    COUNT(DISTINCT i.interaction_id) as message_count
  FROM chats ch
  LEFT JOIN contact_chats cc ON ch.id = cc.chat_id
  LEFT JOIN interactions i ON ch.id = i.chat_id
  WHERE ch.id = 'CHAT_UUID'
  GROUP BY ch.id
)
SELECT
  cd.*,
  json_agg(DISTINCT
    json_build_object(
      'contact_id', c.contact_id,
      'first_name', c.first_name,
      'last_name', c.last_name,
      'mobile', cm.mobile
    )
  ) FILTER (WHERE c.contact_id IS NOT NULL) as participants
FROM chat_data cd
LEFT JOIN contact_chats cc ON cd.id = cc.chat_id
LEFT JOIN contacts c ON cc.contact_id = c.contact_id
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
  AND cm.type IN ('WhatsApp', 'WhatsApp Group')
GROUP BY cd.id, cd.chat_name, cd.is_group, cd.participant_count, cd.message_count;
```

### Pattern 6: Find All Group Chats

```sql
-- All group chats
SELECT
  ch.id,
  ch.chat_name,
  ch.last_message_date,
  COUNT(DISTINCT cc.contact_id) as participant_count,
  COUNT(DISTINCT i.interaction_id) as message_count
FROM chats ch
LEFT JOIN contact_chats cc ON ch.id = cc.chat_id
LEFT JOIN interactions i ON ch.id = i.chat_id
WHERE ch.is_group = true
GROUP BY ch.id, ch.chat_name, ch.last_message_date
ORDER BY ch.last_message_date DESC;
```

---

## Chat & Contact Relationships

### Understanding Chat Types

```
1-on-1 Chat:
    chats (1) ──< contact_chats (1) ──> contacts (1)
              └──< interactions (many)

Group Chat:
    chats (1) ──< contact_chats (many) ──> contacts (many)
              └──< interactions (many)
```

### Chat Query Examples

```sql
-- Get all chats for a contact
SELECT
  ch.id,
  ch.chat_name,
  ch.is_group,
  ch.last_message_date
FROM chats ch
JOIN contact_chats cc ON ch.id = cc.chat_id
WHERE cc.contact_id = 'CONTACT_UUID'
ORDER BY ch.last_message_date DESC;

-- Get contacts in a chat
SELECT
  c.contact_id,
  c.first_name,
  c.last_name,
  cm.mobile
FROM contact_chats cc
JOIN contacts c ON cc.contact_id = c.contact_id
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
  AND cm.type IN ('WhatsApp', 'WhatsApp Group')
WHERE cc.chat_id = 'CHAT_UUID';

-- Get most active chats (by message count)
SELECT
  ch.id,
  ch.chat_name,
  ch.is_group,
  COUNT(i.interaction_id) as message_count
FROM chats ch
LEFT JOIN interactions i ON ch.id = i.chat_id
GROUP BY ch.id, ch.chat_name, ch.is_group
ORDER BY message_count DESC
LIMIT 10;
```

---

## Sending Messages (Baileys)

### Overview

The CRM uses **Baileys** (open-source WhatsApp Web client) for sending messages, which is **FREE** (no API cost).

**Key Points:**
- **Library:** `@whiskeysockets/baileys` (Node.js)
- **Protocol:** WhatsApp Web Protocol (reverse-engineered)
- **Authentication:** QR code scan (one-time, persisted in Railway volume)
- **Cost:** Free (vs €0.02-0.05 per message with TimelinesAI)

### Baileys Connection Status

Check connection status:
```bash
curl https://command-center-backend-production.up.railway.app/whatsapp/status
```

Response:
```json
{
  "status": "connected",        // "disconnected", "connecting", "connected", "qr_ready"
  "error": null,
  "hasQR": false,
  "hasSession": true
}
```

### Sending API Endpoints

**Base URL:** `https://command-center-backend-production.up.railway.app`

#### Send Text Message (1-on-1)

```bash
POST /whatsapp/send
Content-Type: application/json

{
  "phone": "+393456789012",      // With country code
  "message": "Hello from CRM!"
}
```

Response:
```json
{
  "success": true,
  "messageId": "3EB0ABC...",
  "timestamp": 1709820000
}
```

#### Send to Group Chat

```bash
POST /whatsapp/send
Content-Type: application/json

{
  "chat_id": "123456789@g.us",   // Group JID
  "message": "Hello group!"
}
```

#### Send Media Message

```bash
POST /whatsapp/send-media
Content-Type: application/json

{
  "phone": "+393456789012",
  "caption": "Check this out",
  "file": {
    "data": "base64_encoded_file_data",
    "mimetype": "image/jpeg",
    "filename": "photo.jpg"
  }
}
```

### Phone Number Formatting

Baileys uses WhatsApp JIDs (Jabber IDs):

| Type | Format | Example |
|------|--------|---------|
| 1-on-1 chat | `{phone}@s.whatsapp.net` | `393456789012@s.whatsapp.net` |
| Group chat | `{groupId}@g.us` | `123456789@g.us` |

**Note:** Phone numbers should NOT have `+` or leading zeros:
- ✅ `393456789012`
- ❌ `+393456789012`
- ❌ `03456789012`

### Baileys Functions (Backend)

| Function | Purpose |
|----------|---------|
| `initBaileys()` | Initialize connection, generate QR if needed |
| `getStatus()` | Get connection status |
| `getQRCode()` | Get QR code for scanning |
| `sendMessage(to, text)` | Send text to phone number |
| `sendMessageToChat(chatId, text)` | Send text to group |
| `sendMedia(to, buffer, mimetype, filename, caption)` | Send media |
| `clearSession()` | Logout and clear session |
| `isRegistered(phone)` | Check if number has WhatsApp |
| `fetchAllGroups()` | Get all groups user is in |
| `findGroupByName(name)` | Find group by name |
| `verifyWhatsAppNumbers(phones[])` | Bulk check WhatsApp registration |
| `createGroup(name, participants[])` | Create new WhatsApp group |

### How Sent Messages Are Stored

Even though we send via Baileys, messages still get saved to Supabase:

1. **Baileys** sends message to WhatsApp
2. **WhatsApp multi-device** syncs the sent message to all connected devices
3. **TimelinesAI** (still connected) receives the sent message
4. **TimelinesAI webhook** fires → Python backend → `command_center_inbox`
5. User clicks "Done" → saved to production tables

This happens automatically - no additional code needed!

---

## TimelinesAI Integration

### Overview

**TimelinesAI** is used ONLY for **receiving** WhatsApp messages (webhook-based).

**Key Info:**
- **Provider:** TimelinesAI (https://timelines.ai)
- **Purpose:** Receive incoming WhatsApp messages
- **Method:** Webhook (POST to crm-agent-service)
- **Handler:** `crm-agent-service/app/main.py` (Python/FastAPI)
- **Endpoint:** `/whatsapp-webhook`

### Webhook Payload Structure

TimelinesAI sends this structure:

```json
{
  "message": {
    "id": "MESSAGE_UID",
    "text": "Message content",
    "timestamp": 1709820000,
    "type": "text",
    "from": {
      "phone": "393456789012",
      "name": "John Doe"
    }
  },
  "chat": {
    "id": "CHAT_ID",
    "jid": "393456789012@s.whatsapp.net",
    "name": "John Doe",
    "is_group": false
  },
  "whatsapp_account": {
    "phone": "393401234567"
  }
}
```

### Python Handler Flow

Located in: `crm-agent-service/app/main.py`

```python
@app.post("/whatsapp-webhook")
async def whatsapp_webhook(payload: dict):
    # 1. Parse payload
    message = payload['message']
    chat = payload['chat']

    # 2. Extract data
    contact_phone = message['from']['phone']
    contact_name = message['from']['name']
    message_text = message['text']

    # 3. Spam check
    spam = supabase.table('whatsapp_spam') \
        .select('*') \
        .eq('mobile_number', contact_phone) \
        .execute()

    if spam.data:
        # Increment counter, return early
        return {"status": "spam"}

    # 4. Insert to command_center_inbox
    supabase.table('command_center_inbox').insert({
        'type': 'whatsapp',
        'contact_number': contact_phone,
        'from_name': contact_name,
        'body_text': message_text,
        'chat_id': chat['id'],
        'chat_jid': chat['jid'],
        'chat_name': chat['name'],
        'is_group_chat': chat['is_group'],
        'direction': 'received',
        'date': datetime.now(),
        # ... other fields
    }).execute()

    return {"status": "ok"}
```

---

## Troubleshooting

### Problem: WhatsApp message not appearing in CRM

**Check:**
1. Is the phone number spam?
   ```sql
   SELECT * FROM whatsapp_spam WHERE mobile_number = '+393456789012';
   ```

2. Was the webhook received?
   - Check Python backend logs (Railway: `crm-agent-service`)
   - Look for POST `/whatsapp-webhook` entries

3. Was it saved to staging?
   ```sql
   SELECT * FROM command_center_inbox
   WHERE type = 'whatsapp'
     AND contact_number = '+393456789012'
   ORDER BY created_at DESC LIMIT 10;
   ```

### Problem: Can't send WhatsApp messages (Baileys not connected)

**Check:**
1. Check Baileys status:
   ```bash
   curl https://command-center-backend-production.up.railway.app/whatsapp/status
   ```

2. If `status: "disconnected"` or `hasQR: true`:
   - Visit: `https://command-center-backend-production.up.railway.app/whatsapp/qr-image`
   - Scan QR with WhatsApp → Settings → Linked Devices

3. If `status: "qr_ready"` but QR expired:
   - Refresh the `/whatsapp/qr-image` page
   - Scan quickly (QR expires in ~60 seconds)

### Problem: Sent messages not appearing in Supabase

**Cause:** TimelinesAI not receiving multi-device sync

**Check:**
- Is TimelinesAI still connected to the same WhatsApp account?
- Are both Baileys AND TimelinesAI connected simultaneously?
- Multi-device sync should propagate sent messages to TimelinesAI

**Solution:**
- Ensure TimelinesAI is active and connected
- Check TimelinesAI dashboard for connection status

### Problem: "Stream Errored (conflict)" in Baileys

**Cause:** Two Baileys instances with the same session (e.g., local + Railway)

**Solution:**
- Only run ONE Baileys instance at a time
- Stop local backend if using Railway
- Or clear session and re-scan QR:
  ```bash
  curl -X POST https://command-center-backend-production.up.railway.app/whatsapp/logout
  ```

### Problem: Duplicate messages

**Check:**
- Staging: Should never happen (webhook fires once per message)
- Production: Possible if message was processed multiple times manually

```sql
-- Find duplicate interactions by message_uid
SELECT external_interaction_id, COUNT(*) as count
FROM interactions
WHERE interaction_type = 'whatsapp'
  AND external_interaction_id IS NOT NULL
GROUP BY external_interaction_id
HAVING COUNT(*) > 1;
```

### Problem: Contact not linked to WhatsApp message

**Check:**
1. Does contact have this phone number?
   ```sql
   SELECT * FROM contact_mobiles WHERE mobile = '+393456789012';
   ```

2. Is message processed (in production)?
   ```sql
   SELECT * FROM contact_chats cc
   JOIN chats ch ON cc.chat_id = ch.id
   WHERE cc.contact_id = 'CONTACT_UUID';
   ```

3. If in staging, it won't be linked yet (links created on "Done")

### Problem: Group chat not showing all participants

**Check:**
1. Are all participants added to `contact_chats`?
   ```sql
   SELECT COUNT(*) FROM contact_chats WHERE chat_id = 'CHAT_UUID';
   ```

2. When was the group last processed?
   - New participants may not be detected automatically
   - May need manual processing via frontend

---

## Summary: Key Takeaways

1. **Two Storage Layers:**
   - Staging: `command_center_inbox` (temporary, unprocessed)
   - Production: `chats`, `interactions`, `contact_chats` (permanent, processed)

2. **Query Strategy:**
   - Recent/unprocessed: Query `command_center_inbox`
   - Historical/processed: Query `interactions` + joins
   - Contact-specific: Use `contact_chats` to link

3. **Spam Filtering:**
   - Check `whatsapp_spam` table by phone number
   - Messages in this table never reach `command_center_inbox`

4. **Message States:**
   - Unreceived → Staged → Processed → Archived
   - Use timestamps to track lifecycle

5. **Sending vs Receiving:**
   - **Sending:** Baileys (free, WhatsApp Web Protocol)
   - **Receiving:** TimelinesAI (webhook)
   - **Storage:** Both methods save to Supabase (via multi-device sync)

6. **Best Practices:**
   - Always filter by `type = 'whatsapp'` when querying `command_center_inbox`
   - Use JOINs to get contact names from phone numbers
   - Check both staging and production for complete view
   - Use ILIKE for content searches (WhatsApp doesn't need full-text search as much)
   - Respect chat types (1-on-1 vs group)

---

## Quick Reference: Essential Queries

```sql
-- 1. Recent unprocessed WhatsApp messages
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp'
ORDER BY date DESC LIMIT 20;

-- 2. WhatsApp messages for contact
SELECT i.*, ch.chat_name FROM interactions i
LEFT JOIN chats ch ON i.chat_id = ch.id
WHERE i.contact_id = 'CONTACT_UUID'
  AND i.interaction_type = 'whatsapp'
ORDER BY i.interaction_date DESC;

-- 3. Search by content
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp'
  AND body_text ILIKE '%keyword%'
ORDER BY date DESC;

-- 4. Get chat with participants
SELECT ch.*, array_agg(c.first_name || ' ' || c.last_name) as participants
FROM chats ch
LEFT JOIN contact_chats cc ON ch.id = cc.chat_id
LEFT JOIN contacts c ON cc.contact_id = c.contact_id
WHERE ch.id = 'CHAT_UUID'
GROUP BY ch.id;

-- 5. Check if spam
SELECT * FROM whatsapp_spam WHERE mobile_number = '+393456789012';

-- 6. Baileys connection status
curl https://command-center-backend-production.up.railway.app/whatsapp/status
```

---

## Contact Information

**Database:**
- Project: CRM (Supabase)
- Project ID: `efazuvegwxouysfcgwja`
- Region: eu-central-1

**Backend Services:**
- WhatsApp sending: `command-center-backend` (Railway) - Baileys
- WhatsApp receiving: `crm-agent-service` (Railway) - TimelinesAI webhook
- Documentation: `/home/user/crm-frontend/docs/WHATSAPP_SENDING.md`

**Baileys API:**
- Base URL: `https://command-center-backend-production.up.railway.app`
- QR Code: `https://command-center-backend-production.up.railway.app/whatsapp/qr-image`

**TimelinesAI:**
- Dashboard: https://timelines.ai
- Webhook endpoint: `/whatsapp-webhook` on `crm-agent-service`

---

**Document Version:** 1.0
**Last Updated:** 2026-03-07
**Maintained by:** CRM Team

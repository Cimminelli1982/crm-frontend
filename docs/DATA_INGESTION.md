# CRM Data Ingestion

This document explains how data flows into the CRM system through three channels: Email, WhatsApp, and Calendar.

## Architecture Overview

```
                         EXTERNAL SOURCES
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   ┌─────────┐           ┌───────────┐          ┌──────────────┐
   │ Fastmail│           │TimelinesAI│          │Google Calendar│
   │  (JMAP) │           │ (Webhook) │          │   (API v3)   │
   └────┬────┘           └─────┬─────┘          └──────┬───────┘
        │                      │                       │
        │  ┌───────────────────┤                       │
        │  │                   │                       │
        ▼  ▼                   ▼                       ▼
   ┌─────────┐           ┌───────────┐          ┌──────────────┐
   │ Node.js │           │  Python   │          │   Node.js    │
   │ Backend │           │  Backend  │          │   Backend    │
   │         │           └─────┬─────┘          └──────┬───────┘
   │  JMAP   │                 │                       │
   │  Blob   │                 │                       │
   │Download │                 │                       │
   └────┬────┘                 │                       │
        │                      │                       │
        │    SPAM FILTER       │                       │
        ▼                      ▼                       ▼
   ┌───────────────────────────────────────────────────────────┐
   │                  command_center_inbox                      │
   │                (Unified Staging Table)                     │
   └───────────────────────────────────────────────────────────┘

   Special Flow: Email Invitation Import
   ┌─────────────────────────────────────────────────────────┐
   │  Email with .ics → "Add to Cal" button → JMAP download  │
   │  → parseICS() → Google Calendar API → Living with       │
   │  Intention calendar → command_center_inbox (calendar)   │
   └─────────────────────────────────────────────────────────┘
```

## Summary Table

| Channel | Source | Method | Handler | Spam Filter | Dedup Key |
|---------|--------|--------|---------|-------------|-----------|
| Email | Fastmail | PULL (60s poll) | `command-center-backend` (Node.js) | `emails_spam` + `domains_spam` | `fastmail_id` |
| WhatsApp | TimelinesAI | PUSH (webhook) | `crm-agent-service` (Python) | `whatsapp_spam` | N/A (webhook = no dupes) |
| Calendar | Google Calendar | PULL (60s poll) | `command-center-backend` (Node.js) | N/A | `event_uid` + `etag` |
| Calendar (Invite) | Email + ICS | Manual (user click) | `/calendar/import-invitation` | N/A | Creates new event |

---

## 1. Email Ingestion

### Source
- **Provider:** Fastmail
- **Protocol:** JMAP (JSON Meta Application Protocol)
- **Handler:** `backend/src/index.js` + `backend/src/jmap.js`

### Sync Method
- **Type:** PULL (polling)
- **Frequency:** Every 60 seconds
- **Folders:** Inbox + Sent

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  autoSync() runs every 60 seconds                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. READ sync_state                                             │
│     - email_sync (for Inbox)                                    │
│     - email_sync_sent (for Sent)                                │
│     → Get timestamp of last sync                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. FETCH from Fastmail via JMAP                                │
│     Filter: after = last_sync_date                              │
│     Filter: notKeyword = '$crm_done'                            │
│     Limit: 50 emails per batch                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. SPAM FILTERING                                              │
│     Check 1: Name patterns (hardcoded list)                     │
│     Check 2: emails_spam table (exact email match)              │
│     Check 3: domains_spam table (domain match)                  │
│                                                                 │
│     If spam:                                                    │
│       → Increment counter in spam table                         │
│       → Add fastmail_id to skip list                            │
│       → DO NOT save to command_center_inbox                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UPSERT to command_center_inbox                              │
│     Conflict key: fastmail_id                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. STAMP emails in Fastmail                                    │
│     Add keyword: $crm_done                                      │
│     → Prevents re-fetching on next sync                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. MOVE spam in Fastmail                                       │
│     Blocked by email → Skip_Email folder                        │
│     Blocked by domain → Skip_Domain folder                      │
│     (Also marks as read)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. UPDATE sync_state                                           │
│     Set last_sync_date = newest email timestamp                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tables Involved

| Table | Operation | Purpose |
|-------|-----------|---------|
| `command_center_inbox` | UPSERT | Store emails |
| `sync_state` | READ/UPDATE | Track last sync timestamp |
| `emails_spam` | READ/UPDATE | Check spam + increment counter |
| `domains_spam` | READ/UPDATE | Check spam + increment counter |

### Data Transformation

JMAP format → Supabase format:

```javascript
{
  fastmail_id: jmapEmail.id,
  thread_id: jmapEmail.threadId,
  subject: jmapEmail.subject,
  from_email: jmapEmail.from[0].email,
  from_name: jmapEmail.from[0].name,
  to_recipients: [{email, name}, ...],
  cc_recipients: [{email, name}, ...],
  date: jmapEmail.receivedAt,
  body_text: extractedTextBody,
  body_html: extractedHtmlBody,
  snippet: jmapEmail.preview,
  is_read: jmapEmail.keywords['$seen'],
  is_starred: jmapEmail.keywords['$flagged'],
  has_attachments: jmapEmail.hasAttachment,
  attachments: [{name, type, size, blobId}, ...]
}
```

### Deduplication Strategy

1. **JMAP Keyword:** `$crm_done` prevents re-fetching from Fastmail
2. **Supabase Upsert:** `onConflict: 'fastmail_id'` prevents duplicates in DB
3. **sync_state:** Timestamp ensures we only fetch new emails

---

## 2. WhatsApp Ingestion

### Source
- **Provider:** TimelinesAI (WhatsApp Business API wrapper)
- **Protocol:** Webhook (HTTP POST)
- **Handler:** `crm-agent-service/app/main.py`

### Sync Method
- **Type:** PUSH (webhook)
- **Trigger:** TimelinesAI sends POST request when message arrives

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  TimelinesAI sends webhook                                      │
│  POST /whatsapp-webhook                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. PARSE payload                                               │
│     Extract: message, chat, whatsapp_account                    │
│     Determine: direction (sent/received)                        │
│     Extract: contact_phone, contact_name                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SPAM CHECK                                                  │
│     Query: whatsapp_spam WHERE mobile_number = contact_phone    │
│                                                                 │
│     If spam:                                                    │
│       → Increment counter                                       │
│       → RETURN early (nothing saved)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. INSERT to command_center_inbox                              │
│     (No upsert needed - webhook fires once per message)         │
└─────────────────────────────────────────────────────────────────┘
```

### Tables Involved

| Table | Operation | Purpose |
|-------|-----------|---------|
| `command_center_inbox` | INSERT | Store messages |
| `whatsapp_spam` | READ | Check if phone is spam |
| `whatsapp_spam` | UPDATE | Increment counter (if spam) |

### Data Transformation

TimelinesAI format → Supabase format:

```python
{
  "type": "whatsapp",
  "from_name": contact_name,
  "first_name": first_name,
  "last_name": last_name,
  "contact_number": contact_phone,
  "subject": chat_name,  # Chat name used as subject
  "body_text": message_text,
  "snippet": message_text[:100],
  "date": message_timestamp,
  "direction": "sent" | "received",
  "chat_id": chat_id,
  "chat_jid": chat_jid,
  "chat_name": chat_name,
  "is_group_chat": True | False,
  "message_uid": message_id,
  "receiver": whatsapp_account_phone,
  "has_attachments": True | False,
  "attachments": [{url, name, type, size}, ...]
}
```

### Deduplication Strategy

- **Not needed:** Webhook is PUSH - TimelinesAI only sends each message once
- Edge case: Webhook retries on timeout (rare)

---

## 3. Calendar Ingestion

### Overview

Calendar events come from **two sources** with different sync methods:

| Source | Calendar | Method | Handler | Use Case |
|--------|----------|--------|---------|----------|
| Google Calendar | "Living with Intention" | PULL (60s poll) | `google-calendar.js` | Events you create/manage |
| Email Invitations | Any (via .ics attachment) | Manual import | `/calendar/import-invitation` | Invitations received via email |

**Why two sources?**
- Google sends calendar invitations to "Agenda Management" (primary calendar) - this is not configurable
- CRM syncs from "Living with Intention" (your preferred calendar)
- Solution: Import button on invitation emails → creates event on "Living with Intention"

### 3.1 Google Calendar Sync (Primary)

#### Source
- **Provider:** Google Calendar
- **Protocol:** Google Calendar API v3
- **Handler:** `backend/src/index.js` + `backend/src/google-calendar.js`
- **Calendar:** "Living with Intention" (set via `GOOGLE_CALENDAR_ID`)

#### Sync Method
- **Type:** PULL (polling)
- **Frequency:** Every 60 seconds
- **Optimization:** syncToken for incremental sync

#### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  syncGoogleCalendar() runs every 60 seconds                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. GET ACCESS TOKEN                                            │
│     Refresh OAuth token if expired                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. FETCH events from Google Calendar API                       │
│     Using: syncToken for incremental sync                       │
│     Time range: 3 months back → 12 months forward               │
│     Includes: conferenceData (Google Meet links)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. TRANSFORM to inbox format                                   │
│     Extract: id, summary, description, start, end               │
│     Extract: location, conferenceUrl (Meet/Zoom)                │
│     Extract: organizer, attendees with responseStatus           │
│     Skip: CANCELLED events                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UPSERT to command_center_inbox                              │
│     Conflict key: event_uid                                     │
│     Compare: etag to detect changes                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. SAVE syncToken for next incremental sync                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Email Invitation Import (Manual)

#### Problem Solved
- Calendar invitations via email land in "Agenda Management" (Google's default)
- User wants events on "Living with Intention"
- Invitations appear as emails with `.ics` attachments

#### Source
- **Provider:** Email with ICS attachment
- **Protocol:** JMAP (blob download) + ICS parsing
- **Handler:** `backend/src/index.js` → `/calendar/import-invitation`
- **Trigger:** User clicks "Add to Cal" button on invitation emails

#### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Add to Cal" on invitation email                   │
│  POST /calendar/import-invitation { inbox_id }                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. FETCH inbox record from command_center_inbox                │
│     Get: attachments array with blobId                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. FIND ICS attachment                                         │
│     Match: type="text/calendar" OR type="application/ics"       │
│     OR name ends with ".ics"                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DOWNLOAD blob from Fastmail via JMAP                        │
│     Using: blobId from attachment                               │
│     Returns: ICS file content                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. PARSE ICS with caldav.parseICS()                            │
│     Extract: title, description, dtstart, dtend                 │
│     Extract: location, conferenceUrl (Meet/Zoom)                │
│     Extract: organizer (email, name)                            │
│     Extract: attendees (email, name, PARTSTAT)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. CREATE event on Google Calendar                             │
│     Calendar: "Living with Intention"                           │
│     sendUpdates: 'none' (don't notify attendees)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. UPSERT to command_center_inbox                              │
│     type: 'calendar'                                            │
│     Event appears in Calendar tab                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Detection in Frontend

Invitation emails are detected by:
1. Subject starts with `Invitation:` or `Updated invitation:`
2. OR has attachment with `type="text/calendar"` or `name="*.ics"`

When detected, a purple **"Add to Cal"** button appears in the email header.

### 3.3 CalDAV Sync (Legacy/Fastmail)

> **Note:** This is for Fastmail CalDAV sync. Currently the primary sync is Google Calendar (section 3.1).

#### Source
- **Provider:** Fastmail
- **Protocol:** CalDAV (with ctag/etag change detection)
- **Handler:** `backend/src/caldav.js`

#### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  syncCalendar() (if enabled)                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CHECK ctag (calendar version)                               │
│     Compare: current ctag vs saved ctag                         │
│     If unchanged: SKIP (no API calls)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. FETCH events via CalDAV REPORT                              │
│     Time range: 3 months back → 12 months forward               │
│     Returns: ICS data + etag per event                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. PARSE iCalendar with parseICS()                             │
│     Extract: uid, summary, description, dtstart, dtend          │
│     Extract: location, conferenceUrl                            │
│     Extract: organizer, attendees (with PARTSTAT)               │
│     Skip: CANCELLED events                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UPSERT to command_center_inbox                              │
│     Conflict key: event_uid                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Tables Involved

| Table | Operation | Purpose |
|-------|-----------|---------|
| `command_center_inbox` | SELECT/INSERT/UPDATE/DELETE | Sync events |
| `calendar_dismissed` | SELECT | Skip dismissed events during sync |
| `sync_state` | READ/UPDATE | Store ctag for change detection |

### Data Transformation

CalDAV/iCalendar format → Supabase format:

```javascript
{
  type: "calendar",
  event_uid: vevent.uid,
  subject: vevent.summary,
  body_text: vevent.description,
  date: vevent.dtstart,
  event_end: vevent.dtend,  // or calculated from DURATION
  event_location: vevent.location,
  from_name: organizer.cn,
  from_email: organizer.email,
  to_recipients: [{email, name, status, role, rsvp}, ...],  // Attendees
  etag: event.etag,
  sequence: vevent.sequence,
  all_day: boolean,
  recurrence_rule: vevent.rrule
}
```

### Deduplication Strategy

1. **ctag:** Calendar-level change detection (skip sync if unchanged)
2. **etag:** Event-level change detection (skip update if unchanged)
3. **Deletion:** Only future events removed from CalDAV are deleted

### Dismissal (User-controlled filtering)

- **Table:** `calendar_dismissed` stores event_uids that user dismissed
- **Behavior:** Dismissed events are skipped during sync and won't reappear
- **Endpoint:** `POST /calendar/delete-event` adds event to dismissed table and removes from inbox

---

## Spam Filtering Comparison

| Aspect | Email | WhatsApp | Calendar |
|--------|-------|----------|----------|
| **Checks** | 3 (name, email, domain) | 1 (phone) | 1 (dismissed) |
| **Tables** | `emails_spam` + `domains_spam` | `whatsapp_spam` | `calendar_dismissed` |
| **Counter** | Yes | Yes | No |
| **Auto-add patterns** | Yes (name patterns) | No | No |
| **Move to folder** | Yes (Skip_Email/Skip_Domain) | No | No |
| **Wildcard** | Yes (`*@domain.com`) | No | No |
| **User dismiss** | No | No | Yes (via UI button) |

### How Spam Filtering Works

```
MESSAGE ARRIVES
      │
      ▼
┌─────────────────┐
│ Is in spam DB?  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
┌────────┐  ┌────────────────────┐
│Counter │  │ Save to            │
│  +1    │  │ command_center_    │
│        │  │ inbox              │
│ STOP   │  └────────────────────┘
│(not    │
│saved)  │
└────────┘
```

---

## Database Schema: command_center_inbox

| Column | Email | WhatsApp | Calendar |
|--------|-------|----------|----------|
| `type` | "email" | "whatsapp" | "calendar" |
| `fastmail_id` | ✅ | - | - |
| `message_uid` | - | ✅ | - |
| `event_uid` | - | - | ✅ |
| `from_name` | Sender name | Contact name | Organizer |
| `from_email` | ✅ | - | Organizer email |
| `contact_number` | - | ✅ | - |
| `subject` | Email subject | Chat name | Event title |
| `body_text` | Email body | Message text | Description |
| `date` | Received at | Message time | Event start |
| `event_end` | - | - | ✅ |
| `event_location` | - | - | ✅ |
| `direction` | sent/received | sent/received | - |
| `to_recipients` | JSON array | - | Attendees JSON |
| `cc_recipients` | JSON array | - | - |
| `chat_id` | - | ✅ | - |
| `chat_name` | - | ✅ | - |
| `is_group_chat` | - | ✅ | - |
| `has_attachments` | ✅ | ✅ | - |
| `attachments` | JSON array | JSON array | - |
| `is_read` | ✅ | ✅ | ✅ |

---

## Hosting

| Service | Location | Port |
|---------|----------|------|
| `command-center-backend` (Node.js) | Railway | 3001 |
| `crm-agent-service` (Python/FastAPI) | Railway | 8000 |
| Supabase | Supabase Cloud (eu-central-1) | - |

---

## Environment Variables

### command-center-backend (Email + Calendar)
```
FASTMAIL_USERNAME=your@email.com
FASTMAIL_API_TOKEN=xxx
FASTMAIL_CALDAV_PASSWORD=xxx  # App password for CalDAV
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
```

### crm-agent-service (WhatsApp)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
```

---

## Key Files

| Function | File |
|----------|------|
| Email sync | `backend/src/index.js` (autoSync function) |
| JMAP client | `backend/src/jmap.js` |
| JMAP blob download | `backend/src/jmap.js` (downloadBlob method) |
| Google Calendar sync | `backend/src/index.js` (syncGoogleCalendar function) |
| Google Calendar client | `backend/src/google-calendar.js` |
| Calendar invite import | `backend/src/index.js` (`/calendar/import-invitation` endpoint) |
| ICS parser | `backend/src/caldav.js` (parseICS method) |
| CalDAV client (legacy) | `backend/src/caldav.js` |
| Spam filter | `backend/src/supabase.js` |
| WhatsApp webhook | `crm-agent-service/app/main.py` (whatsapp_webhook) |
| Database ops | `crm-agent-service/app/database.py` |
| Frontend "Add to Cal" | `src/pages/CommandCenterPage.js` (handleImportCalendarInvitation) |
